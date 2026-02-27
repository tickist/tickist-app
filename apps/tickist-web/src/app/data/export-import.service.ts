import { Injectable, inject } from '@angular/core';
import { SUPABASE_CLIENT, SUPABASE_CONFIG } from '../config/supabase.provider';
import { SupabaseSessionService } from '../features/auth/supabase-session.service';

const EXPORT_FORMAT = 'tickist-json';
const EXPORT_FORMAT_VERSION = 1;
const MAX_IMPORT_FILE_BYTES = 10 * 1024 * 1024;

export interface TickistExportOptions {
  onlyActive?: boolean;
  projectIds?: string[];
}

export interface TickistImportOptions {
  dryRun?: boolean;
  skipOlder?: boolean;
}

export interface TickistExportDocument {
  format: typeof EXPORT_FORMAT;
  formatVersion: number;
  exportedAt: string;
  sourceInstance: string;
  filters: {
    onlyActive: boolean;
    projectIds: string[];
  };
  projects: TickistExportProject[];
  tags: TickistExportTag[];
  tasks: TickistExportTask[];
  taskSteps: TickistExportTaskStep[];
  taskTags: TickistExportTaskTag[];
}

export interface TickistExportProject {
  stableId: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  isActive: boolean;
  isInbox: boolean;
  projectType: string;
  ancestorStableId: string | null;
  taskView: string;
  defaultPriority: string | null;
  defaultFinishDate: number | null;
  defaultTypeFinishDate: number | null;
  dialogTimeWhenTaskFinished: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface TickistExportTag {
  stableId: string;
  name: string;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface TickistExportTask {
  stableId: string;
  projectStableId: string | null;
  name: string;
  description: string;
  finishDate: string | null;
  finishTime: string | null;
  suspendUntil: string | null;
  pinned: boolean;
  isActive: boolean;
  isDone: boolean;
  onHold: boolean;
  typeFinishDate: number | null;
  priority: string | null;
  repeatInterval: number | null;
  repeatDelta: number | null;
  fromRepeating: number | null;
  estimateMinutes: number | null;
  spentMinutes: number | null;
  taskType: string | null;
  whenComplete: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface TickistExportTaskStep {
  stableId: string;
  taskStableId: string;
  content: string;
  isDone: boolean;
  position: number;
  createdAt: string | null;
}

export interface TickistExportTaskTag {
  taskStableId: string;
  tagStableId: string;
}

export interface ImportValidationSummary {
  projects: number;
  tags: number;
  tasks: number;
  taskSteps: number;
  taskTags: number;
}

export interface ImportValidationReport {
  ok: boolean;
  errors: string[];
  warnings: string[];
  summary: ImportValidationSummary;
}

interface ImportEntityCounters {
  created: number;
  updated: number;
  skipped: number;
}

interface ImportRelationCounters {
  replacedTasks: number;
  rowsWritten: number;
}

export interface ImportResult extends ImportValidationReport {
  dryRun: boolean;
  counts: {
    projects: ImportEntityCounters;
    tags: ImportEntityCounters;
    tasks: ImportEntityCounters;
    taskSteps: ImportRelationCounters;
    taskTags: ImportRelationCounters;
  };
}

interface ExportProjectRow {
  id: string;
  stable_id: string;
  name: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  is_active: boolean;
  is_inbox: boolean;
  project_type: string | null;
  ancestor_id: string | null;
  task_view: string | null;
  default_priority: string | null;
  default_finish_date: number | null;
  default_type_finish_date: number | null;
  dialog_time_when_task_finished: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

interface ExportTagRow {
  id: string;
  stable_id: string;
  name: string;
  created_at: string | null;
  updated_at: string | null;
}

interface ExportTaskRow {
  id: string;
  stable_id: string;
  project_id: string | null;
  name: string;
  description: string | null;
  finish_date: string | null;
  finish_time: string | null;
  suspend_until: string | null;
  pinned: boolean;
  is_active: boolean;
  is_done: boolean;
  on_hold: boolean;
  type_finish_date: number | null;
  priority: string | null;
  repeat_interval: number | null;
  repeat_delta: number | null;
  from_repeating: number | null;
  estimate_minutes: number | null;
  spent_minutes: number | null;
  task_type: string | null;
  when_complete: string | null;
  creation_date: string | null;
  modification_date: string | null;
}

interface ExportTaskStepRow {
  id: string;
  stable_id: string;
  task_id: string;
  content: string;
  is_done: boolean;
  position: number;
  created_at: string | null;
}

interface ExportTaskTagRow {
  task_id: string;
  tag_id: string;
}

interface ExistingEntityRow {
  id: string;
  stable_id: string;
  updated_at?: string | null;
  modification_date?: string | null;
}

type ParsedTickistExportDocumentResult =
  | { ok: true; payload: TickistExportDocument }
  | { ok: false; errors: string[] };

@Injectable({ providedIn: 'root' })
export class ExportImportService {
  private readonly supabase = inject(SUPABASE_CLIENT, { optional: true });
  private readonly supabaseConfig = inject(SUPABASE_CONFIG, { optional: true });
  private readonly session = inject(SupabaseSessionService);

  async exportToBlob(options: TickistExportOptions = {}): Promise<Blob> {
    const client = this.ensureClient();
    const userId = this.ensureUserId();
    const normalized = normalizeExportOptions(options);

    let projectQuery = client
      .from('projects')
      .select(
        'id, stable_id, name, description, color, icon, is_active, is_inbox, project_type, ancestor_id, task_view, default_priority, default_finish_date, default_type_finish_date, dialog_time_when_task_finished, created_at, updated_at'
      )
      .eq('owner_id', userId);

    if (normalized.onlyActive) {
      projectQuery = projectQuery.eq('is_active', true);
    }
    if (normalized.projectIds.length) {
      projectQuery = projectQuery.in('id', normalized.projectIds);
    }

    const { data: projectData, error: projectError } = await projectQuery;
    if (projectError) {
      throw new Error(`Could not export projects: ${projectError.message}`);
    }

    const projectRows = (projectData ?? []) as ExportProjectRow[];
    const projectStableById = new Map(
      projectRows.map((project) => [project.id, project.stable_id])
    );

    let taskQuery = client
      .from('tasks')
      .select(
        'id, stable_id, project_id, name, description, finish_date, finish_time, suspend_until, pinned, is_active, is_done, on_hold, type_finish_date, priority, repeat_interval, repeat_delta, from_repeating, estimate_minutes, spent_minutes, task_type, when_complete, creation_date, modification_date'
      )
      .eq('owner_id', userId);

    if (normalized.onlyActive) {
      taskQuery = taskQuery.eq('is_active', true);
    }
    if (normalized.projectIds.length) {
      taskQuery = taskQuery.in('project_id', normalized.projectIds);
    }

    const { data: taskData, error: taskError } = await taskQuery;
    if (taskError) {
      throw new Error(`Could not export tasks: ${taskError.message}`);
    }

    const taskRows = (taskData ?? []) as ExportTaskRow[];
    const taskIds = taskRows.map((task) => task.id);
    const taskStableById = new Map(taskRows.map((task) => [task.id, task.stable_id]));

    const { taskStepRows, taskTagRows } = await this.fetchTaskRelations(taskIds);
    const usedTagIds = [...new Set(taskTagRows.map((link) => link.tag_id))];

    let tagRows: ExportTagRow[] = [];
    if (!normalized.onlyActive && normalized.projectIds.length === 0) {
      const { data: allTagData, error: allTagError } = await client
        .from('tags')
        .select('id, stable_id, name, created_at, updated_at')
        .eq('owner_id', userId);
      if (allTagError) {
        throw new Error(`Could not export tags: ${allTagError.message}`);
      }
      tagRows = (allTagData ?? []) as ExportTagRow[];
    } else if (usedTagIds.length > 0) {
      const { data: usedTagData, error: usedTagError } = await client
        .from('tags')
        .select('id, stable_id, name, created_at, updated_at')
        .eq('owner_id', userId)
        .in('id', usedTagIds);
      if (usedTagError) {
        throw new Error(`Could not export tags: ${usedTagError.message}`);
      }
      tagRows = (usedTagData ?? []) as ExportTagRow[];
    }

    const tagStableById = new Map(tagRows.map((tag) => [tag.id, tag.stable_id]));

    const payload: TickistExportDocument = {
      format: EXPORT_FORMAT,
      formatVersion: EXPORT_FORMAT_VERSION,
      exportedAt: new Date().toISOString(),
      sourceInstance: this.supabaseConfig?.url?.trim() ?? 'unknown-instance',
      filters: {
        onlyActive: normalized.onlyActive,
        projectIds: normalized.projectIds,
      },
      projects: projectRows.map((project) => ({
        stableId: project.stable_id,
        name: project.name,
        description: project.description ?? '',
        color: project.color ?? '#394264',
        icon: project.icon ?? 'folder',
        isActive: project.is_active,
        isInbox: project.is_inbox,
        projectType: project.project_type ?? 'active',
        ancestorStableId: project.ancestor_id
          ? (projectStableById.get(project.ancestor_id) ?? null)
          : null,
        taskView: project.task_view ?? 'extended',
        defaultPriority: project.default_priority,
        defaultFinishDate: project.default_finish_date,
        defaultTypeFinishDate: project.default_type_finish_date,
        dialogTimeWhenTaskFinished:
          project.dialog_time_when_task_finished ?? false,
        createdAt: project.created_at,
        updatedAt: project.updated_at,
      })),
      tags: tagRows.map((tag) => ({
        stableId: tag.stable_id,
        name: tag.name,
        createdAt: tag.created_at,
        updatedAt: tag.updated_at,
      })),
      tasks: taskRows.map((task) => ({
        stableId: task.stable_id,
        projectStableId: task.project_id
          ? (projectStableById.get(task.project_id) ?? null)
          : null,
        name: task.name,
        description: task.description ?? '',
        finishDate: task.finish_date,
        finishTime: task.finish_time,
        suspendUntil: task.suspend_until,
        pinned: task.pinned,
        isActive: task.is_active,
        isDone: task.is_done,
        onHold: task.on_hold,
        typeFinishDate: task.type_finish_date,
        priority: task.priority,
        repeatInterval: task.repeat_interval,
        repeatDelta: task.repeat_delta,
        fromRepeating: task.from_repeating,
        estimateMinutes: task.estimate_minutes,
        spentMinutes: task.spent_minutes,
        taskType: task.task_type,
        whenComplete: task.when_complete,
        createdAt: task.creation_date,
        updatedAt: task.modification_date,
      })),
      taskSteps: taskStepRows
        .map((step) => {
          const taskStableId = taskStableById.get(step.task_id);
          if (!taskStableId) {
            return null;
          }
          return {
            stableId: step.stable_id,
            taskStableId,
            content: step.content,
            isDone: step.is_done,
            position: step.position,
            createdAt: step.created_at,
          };
        })
        .filter(isNonNullable),
      taskTags: taskTagRows
        .map((link) => {
          const taskStableId = taskStableById.get(link.task_id);
          const tagStableId = tagStableById.get(link.tag_id);
          if (!taskStableId || !tagStableId) {
            return null;
          }
          return { taskStableId, tagStableId };
        })
        .filter(isNonNullable),
    };

    return new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
  }

  async validateImportFile(file: File): Promise<ImportValidationReport> {
    if (file.size > MAX_IMPORT_FILE_BYTES) {
      return {
        ok: false,
        errors: [
          `File is too large. Maximum supported size is ${MAX_IMPORT_FILE_BYTES / (1024 * 1024)} MB.`,
        ],
        warnings: [],
        summary: emptySummary(),
      };
    }

    const text = await file.text();
    const parsed = parseTickistExportDocument(text);
    if (isParseFailure(parsed)) {
      const { errors } = parsed;
      return {
        ok: false,
        errors,
        warnings: [],
        summary: emptySummary(),
      };
    }

    return validateTickistExportDocument(parsed.payload);
  }

  async importFromFile(
    file: File,
    options: TickistImportOptions = {}
  ): Promise<ImportResult> {
    const dryRun = options.dryRun ?? false;
    const skipOlder = options.skipOlder ?? true;
    const validation = await this.validateImportFile(file);

    const result: ImportResult = {
      ...validation,
      dryRun,
      counts: {
        projects: { created: 0, updated: 0, skipped: 0 },
        tags: { created: 0, updated: 0, skipped: 0 },
        tasks: { created: 0, updated: 0, skipped: 0 },
        taskSteps: { replacedTasks: 0, rowsWritten: 0 },
        taskTags: { replacedTasks: 0, rowsWritten: 0 },
      },
    };

    if (!validation.ok) {
      return result;
    }

    const raw = await file.text();
    const parsed = parseTickistExportDocument(raw);
    if (isParseFailure(parsed)) {
      const { errors } = parsed;
      result.ok = false;
      result.errors.push(...errors);
      return result;
    }

    const client = this.ensureClient();
    const userId = this.ensureUserId();

    const projectMap = await this.upsertProjects(
      client,
      userId,
      parsed.payload,
      { dryRun, skipOlder },
      result
    );

    const tagMap = await this.upsertTags(
      client,
      userId,
      parsed.payload,
      { dryRun, skipOlder },
      result
    );

    const taskOutcome = await this.upsertTasks(
      client,
      userId,
      parsed.payload,
      projectMap,
      { dryRun, skipOlder },
      result
    );

    await this.syncTaskRelations(
      client,
      parsed.payload,
      taskOutcome.taskIdsByStableId,
      taskOutcome.syncedTasks,
      tagMap,
      { dryRun },
      result
    );

    return result;
  }

  private async fetchTaskRelations(taskIds: string[]): Promise<{
    taskStepRows: ExportTaskStepRow[];
    taskTagRows: ExportTaskTagRow[];
  }> {
    if (taskIds.length === 0) {
      return {
        taskStepRows: [],
        taskTagRows: [],
      };
    }

    const client = this.ensureClient();

    const { data: stepData, error: stepError } = await client
      .from('task_steps')
      .select('id, stable_id, task_id, content, is_done, position, created_at')
      .in('task_id', taskIds);
    if (stepError) {
      throw new Error(`Could not export task steps: ${stepError.message}`);
    }

    const { data: taskTagData, error: taskTagError } = await client
      .from('task_tags')
      .select('task_id, tag_id')
      .in('task_id', taskIds);
    if (taskTagError) {
      throw new Error(`Could not export task tags: ${taskTagError.message}`);
    }

    return {
      taskStepRows: (stepData ?? []) as ExportTaskStepRow[],
      taskTagRows: (taskTagData ?? []) as ExportTaskTagRow[],
    };
  }

  private async upsertProjects(
    client: NonNullable<typeof this.supabase>,
    userId: string,
    payload: TickistExportDocument,
    options: Required<TickistImportOptions>,
    result: ImportResult
  ): Promise<Map<string, string>> {
    const stableIds = payload.projects.map((project) => project.stableId);
    if (stableIds.length === 0) {
      return new Map<string, string>();
    }

    const { data: existingData, error: existingError } = await client
      .from('projects')
      .select('id, stable_id, updated_at')
      .eq('owner_id', userId)
      .in('stable_id', stableIds);

    if (existingError) {
      result.ok = false;
      result.errors.push(`Could not inspect existing projects: ${existingError.message}`);
      return new Map<string, string>();
    }

    const existingByStableId = new Map(
      ((existingData ?? []) as ExistingEntityRow[]).map((row) => [
        row.stable_id,
        {
          id: row.id,
          updatedAt: row.updated_at ?? null,
        },
      ])
    );

    const projectIdsByStableId = new Map<string, string>();
    const ancestorPatchCandidates: Array<{
      stableId: string;
      ancestorStableId: string;
    }> = [];

    for (const project of payload.projects) {
      const existing = existingByStableId.get(project.stableId);
      const shouldSkip =
        !!existing &&
        shouldSkipImport(existing.updatedAt, project.updatedAt, options.skipOlder);

      if (shouldSkip) {
        result.counts.projects.skipped += 1;
        projectIdsByStableId.set(project.stableId, existing.id);
        continue;
      }

      if (project.ancestorStableId) {
        ancestorPatchCandidates.push({
          stableId: project.stableId,
          ancestorStableId: project.ancestorStableId,
        });
      }

      if (options.dryRun) {
        if (existing) {
          result.counts.projects.updated += 1;
          projectIdsByStableId.set(project.stableId, existing.id);
        } else {
          result.counts.projects.created += 1;
          projectIdsByStableId.set(project.stableId, `dry-run:${project.stableId}`);
        }
        continue;
      }

      const basePayload = {
        owner_id: userId,
        stable_id: project.stableId,
        name: project.name,
        description: project.description,
        color: project.color,
        icon: project.icon,
        is_active: project.isActive,
        is_inbox: project.isInbox,
        project_type: project.projectType,
        ancestor_id: null,
        task_view: project.taskView,
        default_priority: project.defaultPriority,
        default_finish_date: project.defaultFinishDate,
        default_type_finish_date: project.defaultTypeFinishDate,
        dialog_time_when_task_finished: project.dialogTimeWhenTaskFinished,
      };

      if (existing) {
        const { error: updateError } = await client
          .from('projects')
          .update({
            ...basePayload,
            ...(project.updatedAt ? { updated_at: project.updatedAt } : {}),
          })
          .eq('id', existing.id);

        if (updateError) {
          result.ok = false;
          result.errors.push(
            `Could not update project ${project.name}: ${updateError.message}`
          );
          continue;
        }

        result.counts.projects.updated += 1;
        projectIdsByStableId.set(project.stableId, existing.id);
      } else {
        const { data: created, error: createError } = await client
          .from('projects')
          .insert({
            ...basePayload,
            ...(project.createdAt ? { created_at: project.createdAt } : {}),
            ...(project.updatedAt ? { updated_at: project.updatedAt } : {}),
          })
          .select('id')
          .single();

        if (createError || !created) {
          result.ok = false;
          result.errors.push(
            `Could not create project ${project.name}: ${createError?.message ?? 'unknown error'}`
          );
          continue;
        }

        result.counts.projects.created += 1;
        projectIdsByStableId.set(project.stableId, created.id as string);
      }
    }

    if (!options.dryRun) {
      if (ancestorPatchCandidates.length > 0) {
        const ancestorMap = new Map(projectIdsByStableId);
        for (const candidate of ancestorPatchCandidates) {
          const projectId = ancestorMap.get(candidate.stableId);
          const ancestorId = ancestorMap.get(candidate.ancestorStableId);
          if (!projectId || !ancestorId || projectId.startsWith('dry-run:')) {
            continue;
          }
          if (ancestorId.startsWith('dry-run:')) {
            continue;
          }
          const { error: patchError } = await client
            .from('projects')
            .update({ ancestor_id: ancestorId })
            .eq('id', projectId);
          if (patchError) {
            result.ok = false;
            result.errors.push(
              `Could not set project ancestry for ${candidate.stableId}: ${patchError.message}`
            );
          }
        }
      }
    }

    return projectIdsByStableId;
  }

  private async upsertTags(
    client: NonNullable<typeof this.supabase>,
    userId: string,
    payload: TickistExportDocument,
    options: Required<TickistImportOptions>,
    result: ImportResult
  ): Promise<Map<string, string>> {
    const stableIds = payload.tags.map((tag) => tag.stableId);
    if (stableIds.length === 0) {
      return new Map<string, string>();
    }

    const { data: existingData, error: existingError } = await client
      .from('tags')
      .select('id, stable_id, updated_at')
      .eq('owner_id', userId)
      .in('stable_id', stableIds);

    if (existingError) {
      result.ok = false;
      result.errors.push(`Could not inspect existing tags: ${existingError.message}`);
      return new Map<string, string>();
    }

    const existingByStableId = new Map(
      ((existingData ?? []) as ExistingEntityRow[]).map((row) => [
        row.stable_id,
        {
          id: row.id,
          updatedAt: row.updated_at ?? null,
        },
      ])
    );

    const tagIdsByStableId = new Map<string, string>();

    for (const tag of payload.tags) {
      const existing = existingByStableId.get(tag.stableId);
      const shouldSkip =
        !!existing && shouldSkipImport(existing.updatedAt, tag.updatedAt, options.skipOlder);

      if (shouldSkip) {
        result.counts.tags.skipped += 1;
        tagIdsByStableId.set(tag.stableId, existing.id);
        continue;
      }

      if (options.dryRun) {
        if (existing) {
          result.counts.tags.updated += 1;
          tagIdsByStableId.set(tag.stableId, existing.id);
        } else {
          result.counts.tags.created += 1;
          tagIdsByStableId.set(tag.stableId, `dry-run:${tag.stableId}`);
        }
        continue;
      }

      if (existing) {
        const { error: updateError } = await client
          .from('tags')
          .update({
            name: tag.name,
            ...(tag.updatedAt ? { updated_at: tag.updatedAt } : {}),
          })
          .eq('id', existing.id);

        if (updateError) {
          result.ok = false;
          result.errors.push(`Could not update tag ${tag.name}: ${updateError.message}`);
          continue;
        }

        result.counts.tags.updated += 1;
        tagIdsByStableId.set(tag.stableId, existing.id);
      } else {
        const { data: created, error: createError } = await client
          .from('tags')
          .insert({
            owner_id: userId,
            stable_id: tag.stableId,
            name: tag.name,
            ...(tag.createdAt ? { created_at: tag.createdAt } : {}),
            ...(tag.updatedAt ? { updated_at: tag.updatedAt } : {}),
          })
          .select('id')
          .single();

        if (createError || !created) {
          result.ok = false;
          result.errors.push(
            `Could not create tag ${tag.name}: ${createError?.message ?? 'unknown error'}`
          );
          continue;
        }

        result.counts.tags.created += 1;
        tagIdsByStableId.set(tag.stableId, created.id as string);
      }
    }

    if (!options.dryRun) {
      const missingStableIds = payload.tags
        .map((tag) => tag.stableId)
        .filter((stableId) => !tagIdsByStableId.has(stableId));

      if (missingStableIds.length > 0) {
        const { data: fallbackTags, error: fallbackError } = await client
          .from('tags')
          .select('id, stable_id')
          .eq('owner_id', userId)
          .in('stable_id', missingStableIds);

        if (fallbackError) {
          result.ok = false;
          result.errors.push(`Could not refresh tag mapping: ${fallbackError.message}`);
        } else {
          for (const row of (fallbackTags ?? []) as Array<{ id: string; stable_id: string }>) {
            tagIdsByStableId.set(row.stable_id, row.id);
          }
        }
      }
    }

    return tagIdsByStableId;
  }

  private async upsertTasks(
    client: NonNullable<typeof this.supabase>,
    userId: string,
    payload: TickistExportDocument,
    projectIdsByStableId: Map<string, string>,
    options: Required<TickistImportOptions>,
    result: ImportResult
  ): Promise<{
    taskIdsByStableId: Map<string, string>;
    syncedTasks: Set<string>;
  }> {
    const stableIds = payload.tasks.map((task) => task.stableId);
    const taskIdsByStableId = new Map<string, string>();
    const syncedTasks = new Set<string>();

    if (stableIds.length === 0) {
      return { taskIdsByStableId, syncedTasks };
    }

    const { data: existingData, error: existingError } = await client
      .from('tasks')
      .select('id, stable_id, modification_date')
      .eq('owner_id', userId)
      .in('stable_id', stableIds);

    if (existingError) {
      result.ok = false;
      result.errors.push(`Could not inspect existing tasks: ${existingError.message}`);
      return { taskIdsByStableId, syncedTasks };
    }

    const existingByStableId = new Map(
      ((existingData ?? []) as ExistingEntityRow[]).map((row) => [
        row.stable_id,
        {
          id: row.id,
          updatedAt: row.modification_date ?? null,
        },
      ])
    );

    for (const task of payload.tasks) {
      const existing = existingByStableId.get(task.stableId);
      const shouldSkip =
        !!existing && shouldSkipImport(existing.updatedAt, task.updatedAt, options.skipOlder);

      if (shouldSkip) {
        result.counts.tasks.skipped += 1;
        taskIdsByStableId.set(task.stableId, existing.id);
        continue;
      }

      let resolvedProjectId: string | null = null;
      if (task.projectStableId) {
        const mappedProject = projectIdsByStableId.get(task.projectStableId);
        if (mappedProject && !mappedProject.startsWith('dry-run:')) {
          resolvedProjectId = mappedProject;
        } else if (!mappedProject) {
          result.warnings.push(
            `Task "${task.name}" references missing project ${task.projectStableId}; imported without project.`
          );
        }
      }

      if (options.dryRun) {
        if (existing) {
          result.counts.tasks.updated += 1;
          taskIdsByStableId.set(task.stableId, existing.id);
        } else {
          result.counts.tasks.created += 1;
          taskIdsByStableId.set(task.stableId, `dry-run:${task.stableId}`);
        }
        syncedTasks.add(task.stableId);
        continue;
      }

      const basePayload = {
        owner_id: userId,
        stable_id: task.stableId,
        project_id: resolvedProjectId,
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
      };

      if (existing) {
        const { error: updateError } = await client
          .from('tasks')
          .update({
            ...basePayload,
            ...(task.updatedAt ? { modification_date: task.updatedAt } : {}),
          })
          .eq('id', existing.id);

        if (updateError) {
          result.ok = false;
          result.errors.push(`Could not update task ${task.name}: ${updateError.message}`);
          continue;
        }

        result.counts.tasks.updated += 1;
        taskIdsByStableId.set(task.stableId, existing.id);
      } else {
        const { data: created, error: createError } = await client
          .from('tasks')
          .insert({
            ...basePayload,
            ...(task.createdAt ? { creation_date: task.createdAt } : {}),
            ...(task.updatedAt ? { modification_date: task.updatedAt } : {}),
          })
          .select('id')
          .single();

        if (createError || !created) {
          result.ok = false;
          result.errors.push(
            `Could not create task ${task.name}: ${createError?.message ?? 'unknown error'}`
          );
          continue;
        }

        result.counts.tasks.created += 1;
        taskIdsByStableId.set(task.stableId, created.id as string);
      }

      syncedTasks.add(task.stableId);
    }

    if (!options.dryRun) {
      const unresolved = payload.tasks
        .map((task) => task.stableId)
        .filter((stableId) => !taskIdsByStableId.has(stableId));

      if (unresolved.length > 0) {
        const { data: fallbackTasks, error: fallbackError } = await client
          .from('tasks')
          .select('id, stable_id')
          .eq('owner_id', userId)
          .in('stable_id', unresolved);

        if (fallbackError) {
          result.ok = false;
          result.errors.push(`Could not refresh task mapping: ${fallbackError.message}`);
        } else {
          for (const row of (fallbackTasks ?? []) as Array<{ id: string; stable_id: string }>) {
            taskIdsByStableId.set(row.stable_id, row.id);
          }
        }
      }
    }

    return { taskIdsByStableId, syncedTasks };
  }

  private async syncTaskRelations(
    client: NonNullable<typeof this.supabase>,
    payload: TickistExportDocument,
    taskIdsByStableId: Map<string, string>,
    syncedTasks: Set<string>,
    tagIdsByStableId: Map<string, string>,
    options: Pick<Required<TickistImportOptions>, 'dryRun'>,
    result: ImportResult
  ): Promise<void> {
    const stepsByTask = groupBy(payload.taskSteps, (step) => step.taskStableId);
    const tagsByTask = groupBy(payload.taskTags, (link) => link.taskStableId);

    for (const taskStableId of syncedTasks) {
      const taskId = taskIdsByStableId.get(taskStableId);
      if (!taskId || taskId.startsWith('dry-run:')) {
        continue;
      }

      const steps = [...(stepsByTask.get(taskStableId) ?? [])].sort(
        (a, b) => a.position - b.position
      );
      const tagLinks = tagsByTask.get(taskStableId) ?? [];

      result.counts.taskSteps.replacedTasks += 1;
      result.counts.taskSteps.rowsWritten += steps.length;
      result.counts.taskTags.replacedTasks += 1;

      const resolvedTagIds = deduplicate(
        tagLinks
          .map((link) => {
            const tagId = tagIdsByStableId.get(link.tagStableId);
            if (!tagId) {
              result.warnings.push(
                `Task link references missing tag ${link.tagStableId}; relation skipped.`
              );
              return null;
            }
            if (tagId.startsWith('dry-run:')) {
              return null;
            }
            return tagId;
          })
          .filter(isNonNullable)
      );

      result.counts.taskTags.rowsWritten += resolvedTagIds.length;

      if (options.dryRun) {
        continue;
      }

      const { error: deleteStepsError } = await client
        .from('task_steps')
        .delete()
        .eq('task_id', taskId);

      if (deleteStepsError) {
        result.ok = false;
        result.errors.push(
          `Could not replace steps for task ${taskStableId}: ${deleteStepsError.message}`
        );
        continue;
      }

      if (steps.length > 0) {
        const stepInsertPayload = steps.map((step) => ({
          task_id: taskId,
          stable_id: step.stableId,
          content: step.content,
          is_done: step.isDone,
          position: step.position,
          ...(step.createdAt ? { created_at: step.createdAt } : {}),
        }));

        const { error: insertStepsError } = await client
          .from('task_steps')
          .insert(stepInsertPayload);

        if (insertStepsError) {
          result.ok = false;
          result.errors.push(
            `Could not insert steps for task ${taskStableId}: ${insertStepsError.message}`
          );
        }
      }

      const { error: deleteTaskTagsError } = await client
        .from('task_tags')
        .delete()
        .eq('task_id', taskId);

      if (deleteTaskTagsError) {
        result.ok = false;
        result.errors.push(
          `Could not replace tag links for task ${taskStableId}: ${deleteTaskTagsError.message}`
        );
        continue;
      }

      if (resolvedTagIds.length > 0) {
        const linkPayload = resolvedTagIds.map((tagId) => ({
          task_id: taskId,
          tag_id: tagId,
        }));
        const { error: insertTaskTagsError } = await client
          .from('task_tags')
          .insert(linkPayload);

        if (insertTaskTagsError) {
          result.ok = false;
          result.errors.push(
            `Could not insert tag links for task ${taskStableId}: ${insertTaskTagsError.message}`
          );
        }
      }
    }
  }

  private ensureClient() {
    if (!this.supabase) {
      throw new Error(
        'Supabase is not configured. Provide NG_APP_SUPABASE_URL and NG_APP_SUPABASE_PUBLISHABLE_KEY.'
      );
    }
    return this.supabase;
  }

  private ensureUserId(): string {
    const userId = this.session.user()?.id?.trim();
    if (!userId) {
      throw new Error('You must be signed in to export or import data.');
    }
    return userId;
  }
}

export function parseTickistExportDocument(
  raw: string
): ParsedTickistExportDocumentResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false as const, errors: ['Invalid JSON file.'] };
  }

  if (!isRecord(parsed)) {
    return { ok: false as const, errors: ['File must contain a JSON object.'] };
  }

  return {
    ok: true as const,
    payload: parsed as unknown as TickistExportDocument,
  };
}

export function validateTickistExportDocument(
  payload: TickistExportDocument
): ImportValidationReport {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (payload.format !== EXPORT_FORMAT) {
    errors.push(`Unsupported export format: ${String(payload.format)}.`);
  }
  if (payload.formatVersion !== EXPORT_FORMAT_VERSION) {
    errors.push(
      `Unsupported format version: ${String(payload.formatVersion)}. Expected ${EXPORT_FORMAT_VERSION}.`
    );
  }
  if (!Array.isArray(payload.projects)) {
    errors.push('Missing projects list.');
  }
  if (!Array.isArray(payload.tags)) {
    errors.push('Missing tags list.');
  }
  if (!Array.isArray(payload.tasks)) {
    errors.push('Missing tasks list.');
  }
  if (!Array.isArray(payload.taskSteps)) {
    errors.push('Missing taskSteps list.');
  }
  if (!Array.isArray(payload.taskTags)) {
    errors.push('Missing taskTags list.');
  }

  const summary: ImportValidationSummary = {
    projects: Array.isArray(payload.projects) ? payload.projects.length : 0,
    tags: Array.isArray(payload.tags) ? payload.tags.length : 0,
    tasks: Array.isArray(payload.tasks) ? payload.tasks.length : 0,
    taskSteps: Array.isArray(payload.taskSteps) ? payload.taskSteps.length : 0,
    taskTags: Array.isArray(payload.taskTags) ? payload.taskTags.length : 0,
  };

  if (!errors.length) {
    collectStableIdErrors('project', payload.projects.map((project) => project.stableId), errors);
    collectStableIdErrors('tag', payload.tags.map((tag) => tag.stableId), errors);
    collectStableIdErrors('task', payload.tasks.map((task) => task.stableId), errors);
    collectStableIdErrors('task step', payload.taskSteps.map((step) => step.stableId), errors);

    const projectSet = new Set(payload.projects.map((project) => project.stableId));
    const tagSet = new Set(payload.tags.map((tag) => tag.stableId));
    const taskSet = new Set(payload.tasks.map((task) => task.stableId));

    for (const task of payload.tasks) {
      if (task.projectStableId && !projectSet.has(task.projectStableId)) {
        warnings.push(
          `Task "${task.name}" references project ${task.projectStableId} that is missing from export.`
        );
      }
    }

    for (const step of payload.taskSteps) {
      if (!taskSet.has(step.taskStableId)) {
        warnings.push(
          `Task step ${step.stableId} references missing task ${step.taskStableId}.`
        );
      }
    }

    for (const link of payload.taskTags) {
      if (!taskSet.has(link.taskStableId)) {
        warnings.push(
          `Task-tag relation references missing task ${link.taskStableId}.`
        );
      }
      if (!tagSet.has(link.tagStableId)) {
        warnings.push(`Task-tag relation references missing tag ${link.tagStableId}.`);
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    summary,
  };
}

function shouldSkipImport(
  existingUpdatedAt: string | null,
  importedUpdatedAt: string | null,
  skipOlder: boolean
): boolean {
  if (!skipOlder || !existingUpdatedAt || !importedUpdatedAt) {
    return false;
  }

  const existingTime = Date.parse(existingUpdatedAt);
  const importedTime = Date.parse(importedUpdatedAt);

  if (Number.isNaN(existingTime) || Number.isNaN(importedTime)) {
    return false;
  }

  return existingTime >= importedTime;
}

function emptySummary(): ImportValidationSummary {
  return {
    projects: 0,
    tags: 0,
    tasks: 0,
    taskSteps: 0,
    taskTags: 0,
  };
}

function normalizeExportOptions(options: TickistExportOptions): Required<TickistExportOptions> {
  return {
    onlyActive: options.onlyActive ?? false,
    projectIds: deduplicate(
      (options.projectIds ?? [])
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
    ),
  };
}

function groupBy<T>(items: T[], keyResolver: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = keyResolver(item);
    const list = map.get(key);
    if (list) {
      list.push(item);
      continue;
    }
    map.set(key, [item]);
  }
  return map;
}

function deduplicate<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function collectStableIdErrors(
  label: string,
  stableIds: string[],
  errors: string[]
): void {
  const seen = new Set<string>();
  for (const stableId of stableIds) {
    if (!isNonEmptyString(stableId)) {
      errors.push(`Every ${label} must include a non-empty stableId.`);
      continue;
    }
    if (seen.has(stableId)) {
      errors.push(`Duplicate ${label} stableId detected: ${stableId}.`);
      continue;
    }
    seen.add(stableId);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isParseFailure(
  result: ParsedTickistExportDocumentResult
): result is { ok: false; errors: string[] } {
  return result.ok === false;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNonNullable<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}
