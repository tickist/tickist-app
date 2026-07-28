import { createHash } from 'node:crypto';
import {
  DATASET_VERSION,
  DEMO_USER,
  INBOX_TASKS,
  PROJECTS,
  TAGS,
} from './fixtures.mjs';

const NOW = new Date('2026-07-29T16:00:00.000Z');
const PROJECT_COUNT = 30;
const TASK_COUNT = 200;
const COMPLETED_COUNT = 40;

function stableUuid(key) {
  const hex = createHash('sha256')
    .update(`tickist-demo:${DATASET_VERSION}:${key}`)
    .digest('hex')
    .slice(0, 32)
    .split('');
  hex[12] = '4';
  hex[16] = ['8', '9', 'a', 'b'][Number.parseInt(hex[16], 16) % 4];
  return `${hex.slice(0, 8).join('')}-${hex.slice(8, 12).join('')}-${hex
    .slice(12, 16)
    .join('')}-${hex.slice(16, 20).join('')}-${hex.slice(20).join('')}`;
}

function isoDays(offset, hour = 17) {
  const date = new Date(NOW);
  date.setUTCDate(date.getUTCDate() + offset);
  date.setUTCHours(hour, 0, 0, 0);
  return date.toISOString();
}

function projectRow(ownerId, fixture, index) {
  const id = stableUuid(`project:${fixture.key}`);
  return {
    id,
    stable_id: stableUuid(`project-stable:${fixture.key}`),
    owner_id: ownerId,
    name: fixture.name,
    description: fixture.description,
    color: fixture.color,
    icon: fixture.icon,
    is_active: true,
    is_inbox: false,
    project_type: fixture.projectType ?? 'active',
    ancestor_id: null,
    default_finish_date: index % 4,
    default_priority: index % 5 === 0 ? 'high' : 'normal',
    default_type_finish_date: 1,
    dialog_time_when_task_finished: false,
    task_view: index % 3 === 0 ? 'simple' : 'extended',
    created_at: isoDays(-180 + index),
    updated_at: isoDays(-20 + (index % 18)),
  };
}

function inboxRow(ownerId, inboxProjectId) {
  return {
    id: inboxProjectId,
    stable_id: stableUuid('project-stable:inbox'),
    owner_id: ownerId,
    name: 'Inbox',
    description: 'Unsorted tasks and quick captures.',
    color: '#394264',
    icon: 'inbox',
    is_active: true,
    is_inbox: true,
    project_type: 'active',
    ancestor_id: null,
    default_finish_date: 0,
    default_priority: 'normal',
    default_type_finish_date: 1,
    dialog_time_when_task_finished: false,
    task_view: 'extended',
    created_at: isoDays(-210),
    updated_at: isoDays(-1),
  };
}

function allTaskFixtures(projects) {
  const projectByKey = new Map(
    projects.map((project) => [project.key, project])
  );
  const fixtures = INBOX_TASKS.map((name) => ({
    name,
    projectKey: 'inbox',
  }));
  for (const project of PROJECTS) {
    for (const name of project.tasks) {
      fixtures.push({ name, projectKey: project.key });
    }
  }
  const followUps = PROJECTS.map((project, index) => ({
    name:
      index % 3 === 0
        ? `Review the next milestone for ${project.name}`
        : index % 3 === 1
        ? `Schedule the next check-in for ${project.name}`
        : `Organize notes for ${project.name}`,
    projectKey: project.key,
  }));
  fixtures.push(...followUps);
  if (fixtures.length < TASK_COUNT) {
    throw new Error('Demo fixtures do not contain enough unique tasks.');
  }
  return fixtures.slice(0, TASK_COUNT).map((fixture) => ({
    ...fixture,
    projectId: projectByKey.get(fixture.projectKey).id,
  }));
}

function taskRow(ownerId, fixture, index) {
  const completed = index % 5 === 0;
  const createdOffset = -150 + (index % 140);
  const dueOffset = completed ? -90 + (index % 75) : -8 + ((index * 7) % 75);
  const id = stableUuid(`task:${index}:${fixture.name}`);
  return {
    id,
    stable_id: stableUuid(`task-stable:${index}:${fixture.name}`),
    owner_id: ownerId,
    project_id: fixture.projectId,
    author_id: ownerId,
    last_editor_id: ownerId,
    name: fixture.name,
    description:
      index % 4 === 0
        ? `Keep this concrete and lightweight. Context: ${DEMO_USER.city}.`
        : '',
    finish_date: index % 3 === 0 ? isoDays(dueOffset) : null,
    finish_time: index % 9 === 0 ? '09:30' : null,
    suspend_until:
      !completed && index % 17 === 0 ? isoDays(2 + (index % 8)) : null,
    pinned: !completed && index % 19 === 0,
    is_active: true,
    is_done: completed,
    on_hold: !completed && index % 23 === 0,
    type_finish_date: 1,
    priority: index % 11 === 0 ? 'high' : index % 7 === 0 ? 'low' : 'normal',
    repeat_interval:
      fixture.projectKey === 'routines' ? [1, 7, 7, 7, 7, 14][index % 6] : 0,
    repeat_delta: null,
    from_repeating: null,
    estimate_minutes: [15, 30, 45, 60, 90, 120][index % 6],
    spent_minutes: completed ? [15, 25, 45, 60, 75][index % 5] : null,
    task_type:
      !completed && index % 8 === 0
        ? 'next_action'
        : !completed && index % 13 === 0
        ? 'need_info'
        : 'normal',
    when_complete: completed ? isoDays(-70 + (index % 65)) : null,
    creation_date: isoDays(createdOffset),
    modification_date: completed
      ? isoDays(-70 + (index % 65))
      : isoDays(-20 + (index % 19)),
  };
}

export function generateDemoDataset(
  ownerId,
  inboxProjectId = stableUuid('project:inbox')
) {
  const inbox = { key: 'inbox', ...inboxRow(ownerId, inboxProjectId) };
  const domainProjects = PROJECTS.map((fixture, index) => ({
    key: fixture.key,
    ...projectRow(ownerId, fixture, index),
  }));
  const keyedProjects = [inbox, ...domainProjects];
  const projects = keyedProjects.map(({ key: _key, ...project }) => project);
  const tags = TAGS.map((name, index) => ({
    id: stableUuid(`tag:${name}`),
    stable_id: stableUuid(`tag-stable:${name}`),
    owner_id: ownerId,
    name,
    created_at: isoDays(-170 + index),
    updated_at: isoDays(-10 + (index % 8)),
  }));
  const taskFixtures = allTaskFixtures(keyedProjects);
  const tasks = taskFixtures.map((fixture, index) =>
    taskRow(ownerId, fixture, index)
  );
  const taskTags = tasks.flatMap((task, index) => {
    const first = tags[index % tags.length];
    const rows = [{ task_id: task.id, tag_id: first.id }];
    if (index % 3 === 0) {
      rows.push({
        task_id: task.id,
        tag_id: tags[(index + 5) % tags.length].id,
      });
    }
    return rows;
  });
  const taskAssignees = tasks
    .filter((_, index) => index % 4 === 0)
    .map((task) => ({
      task_id: task.id,
      user_id: ownerId,
      role: 'assignee',
    }));
  const taskSteps = tasks
    .filter((_, index) => index % 10 === 0)
    .flatMap((task, taskIndex) =>
      [
        'Collect the inputs',
        'Complete the main action',
        'Share the result',
      ].map((content, position) => ({
        id: stableUuid(`step:${task.id}:${position}`),
        stable_id: stableUuid(`step-stable:${task.id}:${position}`),
        task_id: task.id,
        content,
        is_done: task.is_done || (position === 0 && taskIndex % 2 === 0),
        position,
        created_at: task.creation_date,
      }))
    );
  const taskReminders = tasks
    .filter(
      (task, index) => !task.is_done && task.finish_date && index % 12 === 0
    )
    .map((task, index) => ({
      id: stableUuid(`reminder:${task.id}`),
      task_id: task.id,
      owner_id: ownerId,
      channel: 'email',
      remind_at: new Date(
        new Date(task.finish_date).getTime() - 24 * 60 * 60 * 1000
      ).toISOString(),
      timezone: DEMO_USER.timezone,
      status: 'scheduled',
      attempt_count: 0,
      last_error: null,
      sent_at: null,
      cancelled_at: null,
      created_at: isoDays(-5 - index),
      updated_at: isoDays(-3 - index),
    }));
  const notifications = [
    [
      'Your weekly review is ready',
      'Take ten minutes to choose the week’s next actions.',
    ],
    ['Reminder scheduled', 'Japan Trip: check passport expiration date.'],
    ['Project activity', 'Aurora Launch has new tasks ready for review.'],
  ].map(([title, description], index) => ({
    id: stableUuid(`notification:${index}`),
    recipient_id: ownerId,
    title,
    description,
    type: index === 0 ? 'weekly_summary' : 'task_update',
    icon: index === 0 ? 'calendar-check' : 'bell',
    is_read: index === 2,
    created_at: isoDays(-index - 1),
  }));
  return {
    profile: {
      id: stableUuid('app-user'),
      auth_user_id: ownerId,
      username: DEMO_USER.username,
      avatar_url: null,
      preferences: {
        full_name: DEMO_USER.fullName,
        timezone: DEMO_USER.timezone,
        locale: 'en',
        demo_persona: {
          age: DEMO_USER.age,
          city: DEMO_USER.city,
        },
      },
      inbox_project_id: inboxProjectId,
      created_at: isoDays(-210),
      updated_at: NOW.toISOString(),
    },
    projects,
    tags,
    tasks,
    taskTags,
    taskAssignees,
    taskSteps,
    taskReminders,
    notifications,
  };
}

export function summarizeDataset(dataset) {
  return {
    projects: dataset.projects.length,
    tasks: dataset.tasks.length,
    completedTasks: dataset.tasks.filter((task) => task.is_done).length,
    tags: dataset.tags.length,
    taskTags: dataset.taskTags.length,
    taskSteps: dataset.taskSteps.length,
    taskReminders: dataset.taskReminders.length,
    notifications: dataset.notifications.length,
    checksum: createHash('sha256')
      .update(JSON.stringify(dataset))
      .digest('hex')
      .slice(0, 16),
  };
}

export function validateDataset(dataset) {
  const summary = summarizeDataset(dataset);
  if (summary.projects !== PROJECT_COUNT)
    throw new Error(`Expected ${PROJECT_COUNT} projects.`);
  if (summary.tasks !== TASK_COUNT)
    throw new Error(`Expected ${TASK_COUNT} tasks.`);
  if (summary.completedTasks !== COMPLETED_COUNT)
    throw new Error(`Expected ${COMPLETED_COUNT} completed tasks.`);
  if (dataset.projects.filter((project) => project.is_inbox).length !== 1)
    throw new Error('Expected exactly one Inbox project.');
  if (
    new Set(dataset.projects.map((project) => project.id)).size !==
    PROJECT_COUNT
  )
    throw new Error('Project IDs must be unique.');
  if (new Set(dataset.tasks.map((task) => task.id)).size !== TASK_COUNT)
    throw new Error('Task IDs must be unique.');
  const projectIds = new Set(dataset.projects.map((project) => project.id));
  if (dataset.tasks.some((task) => !projectIds.has(task.project_id)))
    throw new Error('Every task must reference a generated project.');
  return true;
}
