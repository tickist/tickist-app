#!/usr/bin/env node

import { createHash, randomBytes } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';

const SUPPORTED_SCOPE = 'active';

async function main() {
  const startedAt = Date.now();
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printHelp();
    return;
  }

  if (args.scope !== SUPPORTED_SCOPE) {
    throw new Error(
      `Unsupported scope "${args.scope}". Use --scope ${SUPPORTED_SCOPE}.`
    );
  }

  const sourceDir = path.resolve(process.cwd(), args.source);
  const reportDir = path.resolve(process.cwd(), args.reportDir);
  const isDryRun = args.dryRun;

  const source = await loadSourceData(sourceDir);
  const rejects = [];
  const emailMergeRows = [];

  const activeProjectsRaw = source.projects.filter(
    (project) => toBool(project.isActive) || toBool(project.isInbox)
  );
  const activeOpenTasksRaw = source.tasks.filter(
    (task) => toBool(task.isActive) && !toBool(task.isDone)
  );

  const referencedUserIds = collectReferencedUserIds(
    activeProjectsRaw,
    activeOpenTasksRaw
  );
  const usersById = new Map(
    source.users
      .filter((user) => typeof user.id === 'string' && user.id.trim().length > 0)
      .map((user) => [user.id, user])
  );
  const canonicalization = buildCanonicalUserMap({
    referencedUserIds,
    usersById,
    activeProjectsRaw,
    activeOpenTasksRaw,
    emailMergeRows,
  });

  const plan = buildImportPlan({
    source,
    activeProjectsRaw,
    activeOpenTasksRaw,
    canonicalization,
    rejects,
  });

  let authUserIdByCanonicalUid = new Map();
  let payload = null;
  let supabase = null;

  if (!isDryRun) {
    const connection = resolveSupabaseConnection(args.target);
    supabase = createClient(connection.url, connection.serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    if (!args.allowNonEmpty) {
      await ensureTargetTablesAreEmpty(supabase);
    }

    authUserIdByCanonicalUid = await ensureAuthUsers({
      supabase,
      users: plan.users,
      target: args.target,
      url: connection.url,
    });

    payload = buildDatabasePayload(plan, authUserIdByCanonicalUid, rejects);

    await upsertInBatches(supabase, 'app_users', payload.appUsers, 'auth_user_id');
    await upsertInBatches(supabase, 'projects', payload.projects, 'id');
    await upsertInBatches(
      supabase,
      'project_members',
      payload.projectMembers,
      'project_id,user_id'
    );
    await upsertInBatches(supabase, 'tags', payload.tags, 'id');
    await upsertInBatches(supabase, 'tasks', payload.tasks, 'id');
    await upsertInBatches(supabase, 'task_steps', payload.taskSteps, 'id');
    await upsertInBatches(supabase, 'task_tags', payload.taskTags, 'task_id,tag_id');

    if (args.sendResetLinks) {
      await sendResetLinks({
        supabase,
        users: plan.users,
        redirectTo: args.resetRedirectTo,
        rejects,
      });
    }
  } else {
    authUserIdByCanonicalUid = new Map(
      plan.users.map((user) => [user.canonicalUid, stableUuid(`auth:${user.canonicalUid}`)])
    );
    payload = buildDatabasePayload(plan, authUserIdByCanonicalUid, rejects);
  }

  const summary = buildSummary({
    args,
    startedAt,
    source,
    activeProjectsRaw,
    activeOpenTasksRaw,
    plan,
    payload,
    rejects,
    emailMergeRows,
  });

  await writeReports({
    reportDir,
    summary,
    rejects,
    emailMergeRows,
  });

  printConsoleSummary(summary, reportDir);
}

function parseArgs(argv) {
  const args = {
    source: 'backup_from_firebase',
    target: 'local',
    scope: SUPPORTED_SCOPE,
    dryRun: false,
    sendResetLinks: false,
    resetRedirectTo: '',
    reportDir: `reports/firebase-migration/${new Date().toISOString().replace(/[:.]/g, '-')}`,
    allowNonEmpty: false,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    switch (token) {
      case '--source':
        args.source = requireValue(argv, ++index, '--source');
        break;
      case '--target':
        args.target = requireValue(argv, ++index, '--target');
        break;
      case '--scope':
        args.scope = requireValue(argv, ++index, '--scope');
        break;
      case '--report-dir':
        args.reportDir = requireValue(argv, ++index, '--report-dir');
        break;
      case '--reset-redirect-to':
        args.resetRedirectTo = requireValue(argv, ++index, '--reset-redirect-to');
        break;
      case '--dry-run':
        args.dryRun = true;
        break;
      case '--send-reset-links':
        args.sendResetLinks = true;
        break;
      case '--allow-non-empty':
        args.allowNonEmpty = true;
        break;
      case '--help':
      case '-h':
        args.help = true;
        break;
      default:
        throw new Error(`Unknown argument: ${token}`);
    }
  }

  if (args.sendResetLinks && args.dryRun) {
    throw new Error('--send-reset-links cannot be used with --dry-run.');
  }

  return args;
}

function requireValue(argv, index, name) {
  const value = argv[index];
  if (!value) {
    throw new Error(`Missing value for ${name}`);
  }
  return value;
}

function printHelp() {
  console.log(`Firebase -> Supabase Day-0 importer

Usage:
  node scripts/firebase-migration/import.mjs [options]

Options:
  --source <dir>             Source directory with users/projects/tasks/tags/notifications JSON.
  --target <local|remote>    Target environment, default: local.
  --scope <active>           Import scope (only "active" is supported).
  --dry-run                  Build plan and reports only, without writing to Supabase.
  --send-reset-links         Send password reset emails after successful import.
  --reset-redirect-to <url>  Optional redirect URL for password reset links.
  --report-dir <dir>         Output directory for reports.
  --allow-non-empty          Allow import into non-empty target tables.
  --help                     Print this help.

Environment:
  NG_APP_SUPABASE_URL        Target Supabase URL.
  SUPABASE_SERVICE_ROLE_KEY  Service role key used by admin import.
`);
}

async function loadSourceData(sourceDir) {
  const users = await readJsonArray(path.join(sourceDir, 'users.json'));
  const projects = await readJsonArray(path.join(sourceDir, 'projects.json'));
  const tasks = await readJsonArray(path.join(sourceDir, 'tasks.json'));
  const tags = await readJsonArray(path.join(sourceDir, 'tags.json'));
  const notifications = await readJsonArray(
    path.join(sourceDir, 'notifications.json')
  );

  return { users, projects, tasks, tags, notifications };
}

async function readJsonArray(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  const parsed = JSON.parse(content);
  if (!Array.isArray(parsed)) {
    throw new Error(`Expected JSON array in ${filePath}`);
  }
  return parsed;
}

function collectReferencedUserIds(activeProjectsRaw, activeOpenTasksRaw) {
  const ids = new Set();

  for (const project of activeProjectsRaw) {
    const owner = asString(project.owner);
    if (owner) {
      ids.add(owner);
    }
    const shareWith = Array.isArray(project.shareWithIds)
      ? project.shareWithIds
      : [];
    for (const userId of shareWith) {
      const normalized = asString(userId);
      if (normalized) {
        ids.add(normalized);
      }
    }
  }

  for (const task of activeOpenTasksRaw) {
    const owner = asString(task.owner?.id) ?? asString(task.ownerPk);
    if (owner) {
      ids.add(owner);
    }
    const author = asString(task.author?.id);
    if (author) {
      ids.add(author);
    }
    const lastEditor = asString(task.lastEditor?.id);
    if (lastEditor) {
      ids.add(lastEditor);
    }
  }

  return ids;
}

function buildCanonicalUserMap({
  referencedUserIds,
  usersById,
  activeProjectsRaw,
  activeOpenTasksRaw,
  emailMergeRows,
}) {
  const scoreByUid = new Map();
  const earliestJoinByUid = new Map();

  const addScore = (uid, score) => {
    scoreByUid.set(uid, (scoreByUid.get(uid) ?? 0) + score);
  };
  const trackJoinDate = (uid, user) => {
    const parsed = parseDateToEpoch(user.dateJoined);
    if (parsed === null) {
      return;
    }
    const current = earliestJoinByUid.get(uid);
    if (current === undefined || parsed < current) {
      earliestJoinByUid.set(uid, parsed);
    }
  };

  for (const project of activeProjectsRaw) {
    const owner = asString(project.owner);
    if (owner) {
      addScore(owner, 5);
    }
    const members = Array.isArray(project.shareWithIds) ? project.shareWithIds : [];
    for (const uid of members) {
      const normalized = asString(uid);
      if (normalized) {
        addScore(normalized, 2);
      }
    }
  }

  for (const task of activeOpenTasksRaw) {
    const owner = asString(task.owner?.id) ?? asString(task.ownerPk);
    if (owner) {
      addScore(owner, 5);
    }
    const author = asString(task.author?.id);
    if (author) {
      addScore(author, 1);
    }
    const lastEditor = asString(task.lastEditor?.id);
    if (lastEditor) {
      addScore(lastEditor, 1);
    }
  }

  const usersByEmail = new Map();
  for (const uid of referencedUserIds) {
    const user = usersById.get(uid);
    if (!user) {
      continue;
    }
    const email = normalizeEmail(user.email);
    if (!email) {
      continue;
    }
    trackJoinDate(uid, user);
    if (!usersByEmail.has(email)) {
      usersByEmail.set(email, []);
    }
    usersByEmail.get(email).push(user);
  }

  const canonicalByUid = new Map();
  const canonicalUsersByUid = new Map();
  const mergedUidsByCanonicalUid = new Map();

  for (const [email, group] of usersByEmail.entries()) {
    const ranked = [...group].sort((left, right) => {
      const scoreDiff =
        (scoreByUid.get(right.id) ?? 0) - (scoreByUid.get(left.id) ?? 0);
      if (scoreDiff !== 0) {
        return scoreDiff;
      }
      const leftDate = earliestJoinByUid.get(left.id) ?? Number.MAX_SAFE_INTEGER;
      const rightDate = earliestJoinByUid.get(right.id) ?? Number.MAX_SAFE_INTEGER;
      if (leftDate !== rightDate) {
        return leftDate - rightDate;
      }
      return left.id.localeCompare(right.id);
    });

    const canonical = ranked[0];
    const mergedUids = ranked.map((user) => user.id);

    for (const user of ranked) {
      canonicalByUid.set(user.id, canonical.id);
    }

    canonicalUsersByUid.set(canonical.id, canonical);
    mergedUidsByCanonicalUid.set(canonical.id, mergedUids);

    if (mergedUids.length > 1) {
      emailMergeRows.push({
        email,
        canonicalUid: canonical.id,
        mergedUids,
      });
    }
  }

  return {
    canonicalByUid,
    canonicalUsersByUid,
    mergedUidsByCanonicalUid,
  };
}

function buildImportPlan({
  source,
  activeProjectsRaw,
  activeOpenTasksRaw,
  canonicalization,
  rejects,
}) {
  const { canonicalByUid, canonicalUsersByUid } = canonicalization;

  const resolveCanonicalUid = (uid, context, entityId) => {
    const normalized = asString(uid);
    if (!normalized) {
      return null;
    }
    const canonical = canonicalByUid.get(normalized);
    if (!canonical) {
      rejects.push(
        createReject(context, entityId, 'user_missing_profile', {
          referencedUid: normalized,
        })
      );
      return null;
    }
    return canonical;
  };

  const projects = [];
  const projectUserRefs = new Set();
  const usedProjectLegacyKeys = new Set();

  for (let index = 0; index < activeProjectsRaw.length; index += 1) {
    const rawProject = activeProjectsRaw[index];
    const ownerCanonicalUid = resolveCanonicalUid(
      rawProject.owner,
      'project',
      asString(rawProject.id) ?? `row:${index}`
    );
    if (!ownerCanonicalUid) {
      continue;
    }

    const legacyKey = buildProjectLegacyKey(rawProject, index);
    const uniqueLegacyKey = ensureUniqueLegacyKey(legacyKey, usedProjectLegacyKeys);
    const id = stableUuid(`project:${uniqueLegacyKey}`);
    const shareWith = Array.isArray(rawProject.shareWithIds)
      ? rawProject.shareWithIds
      : [];
    const memberCanonicalUids = new Set([ownerCanonicalUid]);
    for (const sharedUid of shareWith) {
      const canonicalUid = resolveCanonicalUid(sharedUid, 'project_member', legacyKey);
      if (!canonicalUid) {
        continue;
      }
      memberCanonicalUids.add(canonicalUid);
    }

    projectUserRefs.add(ownerCanonicalUid);
    for (const member of memberCanonicalUids) {
      projectUserRefs.add(member);
    }

    projects.push({
      id,
      legacyKey: uniqueLegacyKey,
      rawId: asString(rawProject.id),
      ownerCanonicalUid,
      ancestorRawId: asString(rawProject.ancestor),
      memberCanonicalUids: [...memberCanonicalUids],
      name: asString(rawProject.name) ?? 'Inbox',
      description: asString(rawProject.description) ?? '',
      color: asString(rawProject.color) ?? '#394264',
      icon: normalizeProjectIcon(rawProject.icon),
      isActive: toBool(rawProject.isInbox) ? true : toBool(rawProject.isActive, true),
      isInbox: toBool(rawProject.isInbox),
      projectType: normalizeProjectType(rawProject.projectType, rawProject.isInbox),
      taskView: asString(rawProject.taskView) ?? 'extended',
      defaultPriority: normalizePriority(rawProject.defaultPriority),
      defaultFinishDate: asSmallInt(rawProject.defaultFinishDate),
      defaultTypeFinishDate: asSmallInt(rawProject.defaultTypeFinishDate),
      dialogTimeWhenTaskFinished: toBool(rawProject.dialogTimeWhenTaskFinished),
    });
  }

  const projectIdByRawId = new Map();
  for (const project of projects) {
    if (project.rawId) {
      projectIdByRawId.set(project.rawId, project.id);
    }
  }

  for (const project of projects) {
    if (!project.ancestorRawId) {
      project.ancestorId = null;
      continue;
    }
    const ancestorId = projectIdByRawId.get(project.ancestorRawId) ?? null;
    if (!ancestorId) {
      rejects.push(
        createReject('project', project.legacyKey, 'ancestor_missing_in_scope', {
          ancestorRawId: project.ancestorRawId,
        })
      );
    }
    project.ancestorId = ancestorId;
  }

  dedupeOwnerInboxes({
    projects,
    canonicalUsersByUid,
    rejects,
  });

  const tasks = [];
  const taskSteps = [];
  const taskTagLinks = [];
  const activeTagRawIds = new Set();
  const taskUserRefs = new Set();

  for (const rawTask of activeOpenTasksRaw) {
    const rawTaskId = asString(rawTask.id);
    if (!rawTaskId) {
      rejects.push(
        createReject('task', 'unknown', 'task_missing_id', {
          reason: 'Task row without id.',
        })
      );
      continue;
    }

    const ownerCanonicalUid = resolveCanonicalUid(
      asString(rawTask.owner?.id) ?? asString(rawTask.ownerPk),
      'task',
      rawTaskId
    );
    if (!ownerCanonicalUid) {
      rejects.push(
        createReject('task', rawTaskId, 'task_owner_not_importable', {
          ownerUid: asString(rawTask.owner?.id) ?? asString(rawTask.ownerPk),
        })
      );
      continue;
    }

    const rawProjectId =
      asString(rawTask.taskProject?.id) ?? asString(rawTask.taskListPk);
    if (!rawProjectId) {
      rejects.push(
        createReject('task', rawTaskId, 'task_project_missing', {
          ownerCanonicalUid,
        })
      );
      continue;
    }

    const projectId = projectIdByRawId.get(rawProjectId);
    if (!projectId) {
      rejects.push(
        createReject('task', rawTaskId, 'task_project_not_in_scope', {
          rawProjectId,
        })
      );
      continue;
    }

    const authorCanonicalUid = resolveCanonicalUid(
      asString(rawTask.author?.id),
      'task',
      rawTaskId
    );
    const lastEditorCanonicalUid = resolveCanonicalUid(
      asString(rawTask.lastEditor?.id),
      'task',
      rawTaskId
    );

    taskUserRefs.add(ownerCanonicalUid);
    if (authorCanonicalUid) {
      taskUserRefs.add(authorCanonicalUid);
    }
    if (lastEditorCanonicalUid) {
      taskUserRefs.add(lastEditorCanonicalUid);
    }

    const finishDateIso = toIsoTimestamp(rawTask.finishDate);
    if (rawTask.finishDate !== null && rawTask.finishDate !== '' && !finishDateIso) {
      rejects.push(
        createReject('task', rawTaskId, 'task_finish_date_invalid', {
          input: rawTask.finishDate,
        })
      );
    }
    const suspendUntilIso = toIsoTimestamp(rawTask.suspendDate);
    if (
      rawTask.suspendDate !== null &&
      rawTask.suspendDate !== '' &&
      !suspendUntilIso
    ) {
      rejects.push(
        createReject('task', rawTaskId, 'task_suspend_date_invalid', {
          input: rawTask.suspendDate,
        })
      );
    }

    const taskId = stableUuid(`task:${rawTaskId}`);
    tasks.push({
      id: taskId,
      rawTaskId,
      ownerCanonicalUid,
      projectId,
      authorCanonicalUid,
      lastEditorCanonicalUid,
      name: asString(rawTask.name) ?? 'Untitled task',
      description: asString(rawTask.description) ?? '',
      finishDate: finishDateIso,
      finishTime: normalizeFinishTime(rawTask.finishTime),
      typeFinishDate: normalizeTypeFinishDate(rawTask.typeFinishDate),
      suspendUntil: suspendUntilIso,
      pinned: toBool(rawTask.pinned),
      isActive: true,
      isDone: false,
      onHold: toBool(rawTask.onHold),
      priority: normalizePriority(rawTask.priority),
      repeatInterval: asInteger(rawTask.repeat, 0),
      repeatDelta: asInteger(rawTask.repeatDelta),
      fromRepeating: asInteger(rawTask.fromRepeating),
      estimateMinutes: asInteger(
        rawTask.estimateTime ?? rawTask.estimate_time ?? rawTask.estimateMinutes
      ),
      spentMinutes: asInteger(rawTask.time),
      taskType: normalizeTaskType(rawTask.taskType),
      whenComplete: toIsoTimestamp(rawTask.whenComplete),
    });

    const steps = Array.isArray(rawTask.steps) ? rawTask.steps : [];
    for (let stepIndex = 0; stepIndex < steps.length; stepIndex += 1) {
      const step = steps[stepIndex];
      const content =
        asString(step.name) ?? asString(step.content) ?? `Step ${stepIndex + 1}`;
      const position =
        asInteger(step.order) ?? asInteger(step.position) ?? stepIndex;
      const stepKey = `${rawTaskId}:${asString(step.id) ?? String(stepIndex)}`;
      taskSteps.push({
        id: stableUuid(`task-step:${stepKey}`),
        task_id: taskId,
        content,
        is_done: toBool(step.status) || toBool(step.isDone),
        position,
      });
    }

    const tagIds = Array.isArray(rawTask.tagsIds) ? rawTask.tagsIds : [];
    for (const rawTagId of tagIds) {
      const normalizedTagId = asString(rawTagId);
      if (!normalizedTagId) {
        continue;
      }
      activeTagRawIds.add(normalizedTagId);
      taskTagLinks.push({
        taskId,
        rawTagId: normalizedTagId,
        taskRawId: rawTaskId,
      });
    }
  }

  const tags = [];
  const tagIdByRawId = new Map();
  const tagIdByOwnerName = new Map();
  const tagUserRefs = new Set();

  for (const rawTag of source.tags) {
    const rawTagId = asString(rawTag.id);
    if (!rawTagId || !activeTagRawIds.has(rawTagId)) {
      continue;
    }
    const ownerCanonicalUid = resolveCanonicalUid(rawTag.author, 'tag', rawTagId);
    if (!ownerCanonicalUid) {
      rejects.push(
        createReject('tag', rawTagId, 'tag_owner_not_importable', {
          ownerUid: rawTag.author,
        })
      );
      continue;
    }
    tagUserRefs.add(ownerCanonicalUid);
    const tagName = asString(rawTag.name) ?? 'untitled-tag';
    const ownerNameKey = `${ownerCanonicalUid}:${tagName.toLowerCase()}`;
    const existingTagId = tagIdByOwnerName.get(ownerNameKey);
    if (existingTagId) {
      tagIdByRawId.set(rawTagId, existingTagId);
      continue;
    }

    const tagId = stableUuid(`tag:${ownerNameKey}`);
    tagIdByOwnerName.set(ownerNameKey, tagId);
    tagIdByRawId.set(rawTagId, tagId);
    tags.push({
      id: tagId,
      rawTagId,
      ownerCanonicalUid,
      name: tagName,
      createdAt: toIsoTimestamp(rawTag.creationDate),
      updatedAt: toIsoTimestamp(rawTag.modificationDate ?? rawTag.creationDate),
    });
  }

  const taskTags = [];
  const seenTaskTagPairs = new Set();
  for (const link of taskTagLinks) {
    const tagId = tagIdByRawId.get(link.rawTagId);
    if (!tagId) {
      rejects.push(
        createReject('task_tag', `${link.taskRawId}:${link.rawTagId}`, 'tag_not_imported', {
          rawTagId: link.rawTagId,
        })
      );
      continue;
    }
    const pairKey = `${link.taskId}:${tagId}`;
    if (seenTaskTagPairs.has(pairKey)) {
      continue;
    }
    seenTaskTagPairs.add(pairKey);
    taskTags.push({
      task_id: link.taskId,
      tag_id: tagId,
    });
  }

  const finalUserUids = new Set([
    ...projectUserRefs,
    ...taskUserRefs,
    ...tagUserRefs,
  ]);

  const users = [];
  for (const canonicalUid of finalUserUids) {
    const user = canonicalUsersByUid.get(canonicalUid);
    if (!user) {
      rejects.push(
        createReject('user', canonicalUid, 'canonical_user_profile_missing', {
          canonicalUid,
        })
      );
      continue;
    }
    const email = normalizeEmail(user.email);
    if (!email) {
      rejects.push(
        createReject('user', canonicalUid, 'canonical_user_email_missing', {
          canonicalUid,
        })
      );
      continue;
    }
    users.push({
      canonicalUid,
      email,
      username: asString(user.username) ?? email.split('@')[0] ?? 'user',
      avatarUrl: asString(user.avatarUrl),
      dateJoined: toIsoTimestamp(user.dateJoined),
      preferences: extractUserPreferences(user),
      inboxRawProjectId: asString(user.inboxPk),
    });
  }

  users.sort((left, right) => left.email.localeCompare(right.email));

  const projectMembers = [];
  const seenProjectMembers = new Set();
  for (const project of projects) {
    for (const memberCanonicalUid of project.memberCanonicalUids) {
      if (!finalUserUids.has(memberCanonicalUid)) {
        continue;
      }
      const key = `${project.id}:${memberCanonicalUid}`;
      if (seenProjectMembers.has(key)) {
        continue;
      }
      seenProjectMembers.add(key);
      projectMembers.push({
        project_id: project.id,
        memberCanonicalUid,
      });
    }
  }

  return {
    users,
    projects,
    projectMembers,
    tasks,
    taskSteps,
    taskTags,
    tags,
    projectIdByRawId,
  };
}

function buildDatabasePayload(plan, authUserIdByCanonicalUid, rejects) {
  const appUsers = [];
  for (const user of plan.users) {
    const authUserId = authUserIdByCanonicalUid.get(user.canonicalUid);
    if (!authUserId) {
      rejects.push(
        createReject('app_user', user.canonicalUid, 'auth_user_missing', {
          canonicalUid: user.canonicalUid,
        })
      );
      continue;
    }
    appUsers.push({
      auth_user_id: authUserId,
      username: user.username,
      avatar_url: user.avatarUrl ?? null,
      preferences: user.preferences,
      inbox_project_id: resolveInboxProjectId(user, plan.projectIdByRawId, plan.projects),
    });
  }

  const projects = [];
  for (const project of plan.projects) {
    const ownerId = authUserIdByCanonicalUid.get(project.ownerCanonicalUid);
    if (!ownerId) {
      rejects.push(
        createReject('project', project.legacyKey, 'project_owner_auth_missing', {
          ownerCanonicalUid: project.ownerCanonicalUid,
        })
      );
      continue;
    }
    projects.push({
      id: project.id,
      owner_id: ownerId,
      name: project.name,
      description: project.description,
      color: project.color,
      icon: project.icon,
      is_active: project.isActive,
      is_inbox: project.isInbox,
      project_type: project.projectType,
      ancestor_id: project.ancestorId ?? null,
      default_finish_date: project.defaultFinishDate ?? null,
      default_priority: project.defaultPriority,
      default_type_finish_date: project.defaultTypeFinishDate ?? null,
      dialog_time_when_task_finished: project.dialogTimeWhenTaskFinished,
      task_view: project.taskView,
    });
  }

  const projectMembers = [];
  for (const member of plan.projectMembers) {
    const userId = authUserIdByCanonicalUid.get(member.memberCanonicalUid);
    if (!userId) {
      rejects.push(
        createReject(
          'project_member',
          `${member.project_id}:${member.memberCanonicalUid}`,
          'project_member_auth_missing',
          {
            memberCanonicalUid: member.memberCanonicalUid,
          }
        )
      );
      continue;
    }
    projectMembers.push({
      project_id: member.project_id,
      user_id: userId,
      role: 'viewer',
    });
  }

  const tags = [];
  for (const tag of plan.tags) {
    const ownerId = authUserIdByCanonicalUid.get(tag.ownerCanonicalUid);
    if (!ownerId) {
      rejects.push(
        createReject('tag', tag.rawTagId, 'tag_owner_auth_missing', {
          ownerCanonicalUid: tag.ownerCanonicalUid,
        })
      );
      continue;
    }
    tags.push({
      id: tag.id,
      owner_id: ownerId,
      name: tag.name,
    });
  }

  const tasks = [];
  for (const task of plan.tasks) {
    const ownerId = authUserIdByCanonicalUid.get(task.ownerCanonicalUid);
    if (!ownerId) {
      rejects.push(
        createReject('task', task.rawTaskId, 'task_owner_auth_missing', {
          ownerCanonicalUid: task.ownerCanonicalUid,
        })
      );
      continue;
    }
    const authorId = task.authorCanonicalUid
      ? authUserIdByCanonicalUid.get(task.authorCanonicalUid) ?? null
      : null;
    const lastEditorId = task.lastEditorCanonicalUid
      ? authUserIdByCanonicalUid.get(task.lastEditorCanonicalUid) ?? null
      : null;

    tasks.push({
      id: task.id,
      owner_id: ownerId,
      project_id: task.projectId,
      author_id: authorId,
      last_editor_id: lastEditorId,
      name: task.name,
      description: task.description,
      finish_date: task.finishDate,
      finish_time: task.finishTime,
      suspend_until: task.suspendUntil,
      pinned: task.pinned,
      is_active: task.isActive,
      is_done: task.isDone,
      on_hold: task.onHold,
      type_finish_date: task.typeFinishDate,
      priority: task.priority,
      repeat_interval: task.repeatInterval,
      repeat_delta: task.repeatDelta,
      from_repeating: task.fromRepeating,
      estimate_minutes: task.estimateMinutes,
      spent_minutes: task.spentMinutes,
      task_type: task.taskType,
      when_complete: task.whenComplete,
    });
  }

  return {
    appUsers,
    projects,
    projectMembers,
    tags,
    tasks,
    taskSteps: plan.taskSteps,
    taskTags: plan.taskTags,
  };
}

async function ensureAuthUsers({ supabase, users, target, url }) {
  const isLocalTarget = String(target).trim().toLowerCase() === 'local';
  let existingByEmail = new Map();
  try {
    existingByEmail = await listAuthUsersByEmail(supabase);
  } catch (error) {
    if (isLocalTarget && isLocalAuthAdminJwtError(error)) {
      console.warn(
        'Auth admin API is unavailable locally (JWT HS256/ES256 mismatch). Falling back to auth.signUp for user bootstrap.'
      );
      return ensureAuthUsersViaSignup({ users, url });
    }
    throw error;
  }
  const authUserIdByCanonicalUid = new Map();

  for (const user of users) {
    const existing = existingByEmail.get(user.email);
    if (existing) {
      authUserIdByCanonicalUid.set(user.canonicalUid, existing.id);
      continue;
    }

    const password = randomBytes(24).toString('base64url');
    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password,
      email_confirm: true,
      user_metadata: {
        migration_source: 'firebase_day0',
        canonical_uid: user.canonicalUid,
      },
    });

    if (error || !data?.user?.id) {
      throw new Error(
        `Unable to create auth user for ${user.email}: ${error?.message ?? 'unknown error'}`
      );
    }

    authUserIdByCanonicalUid.set(user.canonicalUid, data.user.id);
    existingByEmail.set(user.email, data.user);
  }

  return authUserIdByCanonicalUid;
}

function isLocalAuthAdminJwtError(error) {
  const message = String(error?.message ?? '').toLowerCase();
  return (
    message.includes('unable to list auth users') &&
    message.includes('signing method hs256 is invalid')
  );
}

async function ensureAuthUsersViaSignup({ users, url }) {
  const publishableKey = process.env.NG_APP_SUPABASE_ANON_KEY?.trim();
  if (!publishableKey) {
    throw new Error(
      'Local fallback requires NG_APP_SUPABASE_ANON_KEY (publishable key) in environment.'
    );
  }

  const signUpClient = createClient(url, publishableKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const authUserIdByCanonicalUid = new Map();

  for (const user of users) {
    const password = randomBytes(24).toString('base64url');
    const { data, error } = await signUpClient.auth.signUp({
      email: user.email,
      password,
      options: {
        data: {
          migration_source: 'firebase_day0',
          canonical_uid: user.canonicalUid,
        },
      },
    });

    if (error || !data?.user?.id) {
      throw new Error(
        `Unable to create auth user via local signup for ${user.email}: ${error?.message ?? 'unknown error'}`
      );
    }

    authUserIdByCanonicalUid.set(user.canonicalUid, data.user.id);
  }

  return authUserIdByCanonicalUid;
}

async function listAuthUsersByEmail(supabase) {
  const byEmail = new Map();
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    });
    if (error) {
      throw new Error(`Unable to list auth users: ${error.message}`);
    }
    const users = data?.users ?? [];
    for (const user of users) {
      const email = normalizeEmail(user.email);
      if (!email) {
        continue;
      }
      byEmail.set(email, user);
    }
    if (users.length < perPage) {
      break;
    }
    page += 1;
  }

  return byEmail;
}

async function sendResetLinks({ supabase, users, redirectTo, rejects }) {
  for (const user of users) {
    const options = redirectTo ? { redirectTo } : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, options);
    if (error) {
      rejects.push(
        createReject('password_reset', user.email, 'reset_link_failed', {
          message: error.message,
        })
      );
    }
  }
}

async function upsertInBatches(supabase, table, rows, onConflict) {
  if (!rows.length) {
    return;
  }
  const batchSize = 500;
  for (let offset = 0; offset < rows.length; offset += batchSize) {
    const batch = rows.slice(offset, offset + batchSize);
    const { error } = await supabase
      .from(table)
      .upsert(batch, { onConflict, ignoreDuplicates: false });
    if (error) {
      throw new Error(`Upsert failed for ${table}: ${error.message}`);
    }
  }
}

async function ensureTargetTablesAreEmpty(supabase) {
  const tables = [
    { name: 'app_users', countColumn: 'id' },
    { name: 'project_members', countColumn: 'project_id' },
    { name: 'projects', countColumn: 'id' },
    { name: 'tags', countColumn: 'id' },
    { name: 'tasks', countColumn: 'id' },
    { name: 'task_steps', countColumn: 'id' },
    { name: 'task_tags', countColumn: 'task_id' },
  ];

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table.name)
      .select(table.countColumn, { head: true, count: 'exact' });
    if (error) {
      throw new Error(`Failed preflight count for ${table.name}: ${error.message}`);
    }
    if ((count ?? 0) > 0) {
      throw new Error(
        `Target table "${table.name}" is not empty (count=${count}). Use --allow-non-empty if intentional.`
      );
    }
  }
}

function resolveSupabaseConnection(target) {
  const normalizedTarget = String(target).trim().toLowerCase();
  let url = process.env.NG_APP_SUPABASE_URL?.trim();

  if (normalizedTarget === 'local' && !url) {
    url = 'http://127.0.0.1:54321';
  }
  if (!url) {
    throw new Error(
      `Missing NG_APP_SUPABASE_URL for target "${normalizedTarget}".`
    );
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY.');
  }

  return { url, serviceRoleKey };
}

function resolveInboxProjectId(user, projectIdByRawId, projects) {
  if (user.inboxRawProjectId) {
    const byRawId = projectIdByRawId.get(user.inboxRawProjectId);
    if (byRawId) {
      return byRawId;
    }
  }

  const inbox = projects.find(
    (project) => project.ownerCanonicalUid === user.canonicalUid && project.isInbox
  );
  return inbox?.id ?? null;
}

function extractUserPreferences(user) {
  const ignored = new Set(['id', 'email', 'username', 'avatarUrl', 'inboxPk']);
  const preferences = {};
  for (const [key, value] of Object.entries(user)) {
    if (ignored.has(key)) {
      continue;
    }
    preferences[key] = value;
  }
  return preferences;
}

function normalizeEmail(value) {
  const email = asString(value)?.toLowerCase() ?? null;
  return email && email.includes('@') ? email : null;
}

function normalizeProjectIcon(value) {
  if (Array.isArray(value)) {
    return value.map((part) => asString(part)).filter(Boolean).join(':') || 'tick';
  }
  const stringValue = asString(value);
  return stringValue ?? 'tick';
}

function normalizeProjectType(value, isInbox) {
  if (toBool(isInbox)) {
    return 'inbox';
  }
  const normalized = (asString(value) ?? '').trim().toLowerCase();
  if (!normalized) {
    return 'active';
  }
  if (normalized === 'active') {
    return 'active';
  }
  if (normalized === 'someday/maybe') {
    return 'someday';
  }
  if (normalized === 'routine reminder') {
    return 'routine';
  }
  return normalized.replace(/\s+/g, '_');
}

function normalizeTaskType(value) {
  const normalized = (asString(value) ?? '').trim().toLowerCase();
  if (!normalized) {
    return 'normal';
  }
  if (normalized === 'normal') {
    return 'normal';
  }
  if (normalized === 'next action') {
    return 'next_action';
  }
  if (normalized === 'need info') {
    return 'need_info';
  }
  return normalized.replace(/\s+/g, '_');
}

function normalizePriority(value) {
  const normalized = (asString(value) ?? '').trim().toUpperCase();
  if (normalized === 'A' || normalized === 'B' || normalized === 'C') {
    return normalized;
  }
  return 'B';
}

function normalizeTypeFinishDate(value) {
  const asNumber = asInteger(value);
  if (asNumber === null) {
    return 1;
  }
  if (asNumber < -32768 || asNumber > 32767) {
    return 1;
  }
  return asNumber;
}

function normalizeFinishTime(value) {
  const normalized = asString(value);
  if (!normalized) {
    return null;
  }
  return normalized;
}

function asSmallInt(value) {
  const number = asInteger(value);
  if (number === null) {
    return null;
  }
  if (number < -32768 || number > 32767) {
    return null;
  }
  return number;
}

function asInteger(value, fallback = null) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return fallback;
    }
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) {
      return Math.trunc(parsed);
    }
  }
  return fallback;
}

function toIsoTimestamp(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }
    return parsed.toISOString();
  }
  if (typeof value === 'object' && value !== null && value._seconds !== undefined) {
    const seconds = Number(value._seconds);
    const nanos = Number(value._nanoseconds ?? 0);
    if (!Number.isFinite(seconds) || !Number.isFinite(nanos)) {
      return null;
    }
    return new Date(seconds * 1000 + Math.floor(nanos / 1_000_000)).toISOString();
  }
  return null;
}

function asString(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toBool(value, fallback = false) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value !== 0;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') {
      return true;
    }
    if (normalized === 'false') {
      return false;
    }
  }
  return fallback;
}

function parseDateToEpoch(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const iso = toIsoTimestamp(value);
  if (!iso) {
    return null;
  }
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return parsed;
}

function buildProjectLegacyKey(project, index) {
  const projectId = asString(project.id);
  if (projectId) {
    return projectId;
  }
  const owner = asString(project.owner) ?? `owner:${index}`;
  return `null-inbox:${owner}:${index}`;
}

function ensureUniqueLegacyKey(baseKey, usedKeys) {
  if (!usedKeys.has(baseKey)) {
    usedKeys.add(baseKey);
    return baseKey;
  }
  let sequence = 2;
  let candidate = `${baseKey}#${sequence}`;
  while (usedKeys.has(candidate)) {
    sequence += 1;
    candidate = `${baseKey}#${sequence}`;
  }
  usedKeys.add(candidate);
  return candidate;
}

function dedupeOwnerInboxes({ projects, canonicalUsersByUid, rejects }) {
  const inboxProjectsByOwner = new Map();

  for (const project of projects) {
    if (!project.isInbox) {
      continue;
    }
    if (!inboxProjectsByOwner.has(project.ownerCanonicalUid)) {
      inboxProjectsByOwner.set(project.ownerCanonicalUid, []);
    }
    inboxProjectsByOwner.get(project.ownerCanonicalUid).push(project);
  }

  for (const [ownerCanonicalUid, inboxProjects] of inboxProjectsByOwner.entries()) {
    if (inboxProjects.length <= 1) {
      continue;
    }

    const preferredRawId = asString(
      canonicalUsersByUid.get(ownerCanonicalUid)?.inboxPk
    );

    inboxProjects.sort((left, right) => {
      const leftRank = inboxProjectRank(left, preferredRawId);
      const rightRank = inboxProjectRank(right, preferredRawId);
      if (leftRank !== rightRank) {
        return leftRank - rightRank;
      }
      return left.legacyKey.localeCompare(right.legacyKey);
    });

    const keeper = inboxProjects[0];

    for (const duplicate of inboxProjects.slice(1)) {
      duplicate.isInbox = false;
      if ((duplicate.projectType ?? '').toLowerCase() === 'inbox') {
        duplicate.projectType = 'active';
      }
      rejects.push(
        createReject(
          'project',
          duplicate.legacyKey,
          'duplicate_inbox_for_owner_demoted',
          {
            ownerCanonicalUid,
            keptProjectLegacyKey: keeper.legacyKey,
            keptProjectRawId: keeper.rawId ?? null,
            demotedProjectRawId: duplicate.rawId ?? null,
          }
        )
      );
    }
  }
}

function inboxProjectRank(project, preferredRawId) {
  if (preferredRawId && project.rawId === preferredRawId) {
    return 0;
  }
  if (project.rawId) {
    return 1;
  }
  return 2;
}

function stableUuid(input) {
  const bytes = createHash('sha1').update(input).digest().subarray(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Buffer.from(bytes).toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(
    16,
    20
  )}-${hex.slice(20, 32)}`;
}

function createReject(scope, entityId, reason, details = {}) {
  return {
    scope,
    entityId: String(entityId ?? ''),
    reason,
    details,
  };
}

function buildSummary({
  args,
  startedAt,
  source,
  activeProjectsRaw,
  activeOpenTasksRaw,
  plan,
  payload,
  rejects,
  emailMergeRows,
}) {
  const rejectBreakdown = {};
  for (const reject of rejects) {
    rejectBreakdown[reject.reason] = (rejectBreakdown[reject.reason] ?? 0) + 1;
  }

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    mode: {
      dryRun: args.dryRun,
      target: args.target,
      scope: args.scope,
      sendResetLinks: args.sendResetLinks,
    },
    sourceCounts: {
      users: source.users.length,
      projects: source.projects.length,
      tasks: source.tasks.length,
      tags: source.tags.length,
      notifications: source.notifications.length,
    },
    filteredCounts: {
      projectsActiveOrInbox: activeProjectsRaw.length,
      tasksActiveOpen: activeOpenTasksRaw.length,
      usersInScope: plan.users.length,
      tagsInScope: plan.tags.length,
      notificationsImported: 0,
    },
    importCounts: {
      appUsers: payload.appUsers.length,
      projects: payload.projects.length,
      projectMembers: payload.projectMembers.length,
      tags: payload.tags.length,
      tasks: payload.tasks.length,
      taskSteps: payload.taskSteps.length,
      taskTags: payload.taskTags.length,
      notifications: 0,
    },
    emailMerges: emailMergeRows.map((row) => ({
      email: row.email,
      canonicalUid: row.canonicalUid,
      mergedCount: row.mergedUids.length,
      mergedUids: row.mergedUids,
    })),
    rejects: {
      total: rejects.length,
      byReason: rejectBreakdown,
    },
  };
}

async function writeReports({ reportDir, summary, rejects, emailMergeRows }) {
  await fs.mkdir(reportDir, { recursive: true });
  const summaryPath = path.join(reportDir, 'import-summary.json');
  const rejectsPath = path.join(reportDir, 'rejects.csv');
  const mergesPath = path.join(reportDir, 'email-merge.csv');

  await fs.writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  await fs.writeFile(rejectsPath, toRejectsCsv(rejects), 'utf8');
  await fs.writeFile(mergesPath, toEmailMergeCsv(emailMergeRows), 'utf8');
}

function toRejectsCsv(rejects) {
  const header = ['scope', 'entity_id', 'reason', 'details'];
  const rows = [header.join(',')];
  for (const reject of rejects) {
    rows.push(
      [
        csvCell(reject.scope),
        csvCell(reject.entityId),
        csvCell(reject.reason),
        csvCell(JSON.stringify(reject.details)),
      ].join(',')
    );
  }
  return `${rows.join('\n')}\n`;
}

function toEmailMergeCsv(emailMergeRows) {
  const header = ['email', 'canonical_uid', 'merged_count', 'merged_uids'];
  const rows = [header.join(',')];
  for (const row of emailMergeRows) {
    rows.push(
      [
        csvCell(row.email),
        csvCell(row.canonicalUid),
        csvCell(String(row.mergedUids.length)),
        csvCell(row.mergedUids.join('|')),
      ].join(',')
    );
  }
  return `${rows.join('\n')}\n`;
}

function csvCell(value) {
  const stringValue = String(value ?? '');
  if (
    stringValue.includes(',') ||
    stringValue.includes('"') ||
    stringValue.includes('\n')
  ) {
    return `"${stringValue.replaceAll('"', '""')}"`;
  }
  return stringValue;
}

function printConsoleSummary(summary, reportDir) {
  console.log('Migration finished.');
  console.log(
    JSON.stringify(
      {
        mode: summary.mode,
        sourceCounts: summary.sourceCounts,
        filteredCounts: summary.filteredCounts,
        importCounts: summary.importCounts,
        rejects: summary.rejects,
        reportDir,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
