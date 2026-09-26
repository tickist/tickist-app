import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { JsonRecordSchema, type JsonRecord, type JsonValue } from './json';
import { nextRecurringFinishDate } from './task-lifecycle';

export interface TickistConnection {
  supabaseUrl: string;
  publishableKey: string;
  accessToken: string;
  userId: string;
  clientId: string;
  scopes: readonly string[];
}

export interface ListTasksInput {
  project_id?: string;
  include_descendants?: boolean;
  is_done?: boolean;
  is_active?: boolean;
  priority?: 'A' | 'B' | 'C' | 'normal';
  limit?: number;
}

export interface ListProjectsInput {
  is_active?: boolean;
  ancestor_id?: string | null;
}

export interface RepeatInput {
  interval_days: number;
  from: 'completion_date' | 'due_date';
}

function compact(values: Record<string, JsonValue | undefined>) {
  const result: JsonRecord = {};

  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) result[key] = value;
  }

  return result;
}

function normalizedTask(row: JsonRecord) {
  const interval = z.number().safeParse(row['repeat_interval']).data ?? 0;

  const isDone = row['is_done'] === true;
  const isActive = row['is_active'] !== false;

  const suspendUntil = z.string().safeParse(row['suspend_until']).data ?? null;

  const futureSuspension =
    suspendUntil === null || Date.parse(suspendUntil) > Date.now();

  return {
    ...row,
    repeat:
      interval > 0
        ? {
            interval_days: interval,
            from: row['from_repeating'] === 1 ? 'due_date' : 'completion_date',
          }
        : null,
    suspension: {
      is_suspended: !isDone && !isActive && futureSuspension,
      until: suspendUntil,
    },
  };
}

function repeatColumns(repeat: RepeatInput | null): JsonRecord {
  return repeat
    ? {
        repeat_interval: repeat.interval_days,
        repeat_delta: null,
        from_repeating: repeat.from === 'due_date' ? 1 : 0,
      }
    : { repeat_interval: 0, repeat_delta: null, from_repeating: null };
}

export class TickistDataAccess {
  private readonly client: SupabaseClient;

  constructor(private readonly connection: TickistConnection) {
    this.client = createClient(
      connection.supabaseUrl,
      connection.publishableKey,
      {
        auth: {
          autoRefreshToken: false,
          detectSessionInUrl: false,
          persistSession: false,
        },
        global: {
          headers: { Authorization: `Bearer ${connection.accessToken}` },
        },
      }
    );
  }

  async listProjects(input: ListProjectsInput = {}) {
    let query = this.client
      .from('projects')
      .select(
        'id, name, description, color, icon, is_active, is_inbox, project_type, workspace_id, ancestor_id, created_at'
      )
      .order('name');

    query = query.eq('is_active', input.is_active ?? true);

    if (input.ancestor_id === null) query = query.is('ancestor_id', null);

    if (input.ancestor_id !== undefined && input.ancestor_id !== null) {
      query = query.eq('ancestor_id', input.ancestor_id);
    }

    const { data, error } = await query;

    if (error) throw new Error('Failed to list projects.');

    return data ?? [];
  }

  async listWorkspaces() {
    const { data, error } = await this.client
      .from('workspaces')
      .select('id, name, kind')
      .order('name');

    if (error) throw new Error('Failed to list workspaces.');

    return data ?? [];
  }

  async getProject(projectId: string) {
    const { data, error } = await this.client
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) throw new Error('Project not found.');

    return data;
  }

  async createProject(input: {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    workspace_id?: string;
    ancestor_id?: string | null;
  }) {
    if (input.ancestor_id) {
      await this.assertValidProjectParent(input.ancestor_id);
    }

    return this.mutate('create_project', 'project', undefined, async () => {
      const { data, error } = await this.client
        .from('projects')
        .insert(
          compact({
            owner_id: this.connection.userId,
            name: input.name.trim(),
            description: input.description,
            color: input.color,
            icon: input.icon,
            workspace_id: input.workspace_id,
            ancestor_id: input.ancestor_id,
          })
        )
        .select()
        .single();

      if (error) throw new Error('Failed to create project.');

      return data;
    });
  }

  async updateProject(
    projectId: string,
    changes: {
      name?: string;
      description?: string;
      color?: string;
      icon?: string;
      workspace_id?: string;
      is_active?: boolean;
      ancestor_id?: string | null;
    }
  ) {
    if (changes.ancestor_id) {
      await this.assertValidProjectParent(changes.ancestor_id, projectId);
    }

    return this.mutate('update_project', 'project', projectId, async () => {
      const { data, error } = await this.client
        .from('projects')
        .update(compact({ ...changes, updated_at: new Date().toISOString() }))
        .eq('id', projectId)
        .select()
        .single();

      if (error) throw new Error('Failed to update project.');

      return data;
    });
  }

  async deleteProject(projectId: string) {
    return this.mutate('delete_project', 'project', projectId, async () => {
      const { data: project, error: projectError } = await this.client
        .from('projects')
        .select('id, is_inbox')
        .eq('id', projectId)
        .maybeSingle();

      if (projectError || !project) throw new Error('Project not found.');

      if (project.is_inbox) throw new Error('Inbox project cannot be deleted.');

      const { data, error } = await this.client
        .from('projects')
        .delete()
        .eq('id', projectId)
        .select('id')
        .maybeSingle();

      if (error) throw new Error('Failed to delete project.');

      if (!data) throw new Error('Project not found.');

      return { deleted: true, project_id: projectId };
    });
  }

  async listTasks(input: ListTasksInput) {
    if (input.include_descendants && !input.project_id) {
      throw new Error('include_descendants requires project_id.');
    }

    let query = this.client
      .from('tasks')
      .select(
        'id, name, description, project_id, priority, is_done, is_active, suspend_until, on_hold, pinned, finish_date, finish_time, repeat_interval, repeat_delta, from_repeating, creation_date, modification_date'
      )
      .order('creation_date', { ascending: false })
      .limit(input.limit ?? 100);

    if (input.project_id) {
      const projectIds = input.include_descendants
        ? await this.accessibleProjectSubtree(input.project_id)
        : [input.project_id];

      query =
        projectIds.length === 1
          ? query.eq('project_id', projectIds[0])
          : query.in('project_id', projectIds);
    }

    if (input.is_done !== undefined) query = query.eq('is_done', input.is_done);

    if (input.is_active !== undefined)
      query = query.eq('is_active', input.is_active);

    if (input.priority) query = query.eq('priority', input.priority);
    const { data, error } = await query;

    if (error) throw new Error('Failed to list tasks.');

    return (data ?? []).map((row) =>
      normalizedTask(JsonRecordSchema.parse(row))
    );
  }

  async getTask(taskId: string) {
    const { data: task, error } = await this.client
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (error) throw new Error('Task not found.');

    const [{ data: steps }, { data: taskTags }] = await Promise.all([
      this.client
        .from('task_steps')
        .select('id, content, is_done, position')
        .eq('task_id', taskId)
        .order('position'),
      this.client
        .from('task_tags')
        .select('tag_id, tags:tag_id(id, name)')
        .eq('task_id', taskId),
    ]);

    return normalizedTask({
      ...task,
      steps: steps ?? [],
      tags: (taskTags ?? [])
        .map((row) => JsonRecordSchema.parse(row)['tags'])
        .filter(Boolean),
    });
  }

  async createTask(input: {
    name: string;
    project_id?: string;
    description?: string;
    priority?: 'A' | 'B' | 'C' | 'normal';
    finish_date?: string;
    pinned?: boolean;
    repeat?: RepeatInput;
  }) {
    if (input.repeat?.from === 'due_date' && !input.finish_date) {
      throw new Error('repeat.from due_date requires finish_date.');
    }

    let projectId = input.project_id;

    if (!projectId) {
      const { data, error } = await this.client
        .from('app_users')
        .select('inbox_project_id')
        .eq('auth_user_id', this.connection.userId)
        .single();

      if (error) throw new Error('Inbox project was not found.');
      projectId = data?.inbox_project_id;
    }

    return this.mutate('create_task', 'task', undefined, async () => {
      const payload = compact({
        owner_id: this.connection.userId,
        author_id: this.connection.userId,
        name: input.name.trim(),
        project_id: projectId,
        description: input.description,
        priority: input.priority,
        finish_date: input.finish_date,
        pinned: input.pinned,
      });

      if (input.repeat) Object.assign(payload, repeatColumns(input.repeat));

      const { data, error } = await this.client
        .from('tasks')
        .insert(payload)
        .select()
        .single();

      if (error) throw new Error('Failed to create task.');

      return normalizedTask(JsonRecordSchema.parse(data));
    });
  }

  async updateTask(
    taskId: string,
    changes: {
      name?: string;
      description?: string;
      project_id?: string;
      priority?: 'A' | 'B' | 'C' | 'normal';
      finish_date?: string | null;
      pinned?: boolean;
      on_hold?: boolean;
      repeat?: RepeatInput | null;
    }
  ) {
    if (changes.repeat?.from === 'due_date') {
      const finishDate =
        changes.finish_date === undefined
          ? await this.taskFinishDate(taskId)
          : changes.finish_date;

      if (!finishDate) {
        throw new Error('repeat.from due_date requires finish_date.');
      }
    }

    const { repeat, ...taskChanges } = changes;

    return this.mutate('update_task', 'task', taskId, async () => {
      const payload = compact({
        ...taskChanges,
        modification_date: new Date().toISOString(),
        last_editor_id: this.connection.userId,
      });

      if (repeat !== undefined) Object.assign(payload, repeatColumns(repeat));

      const { data, error } = await this.client
        .from('tasks')
        .update(payload)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw new Error('Failed to update task.');

      return normalizedTask(JsonRecordSchema.parse(data));
    });
  }

  async completeTask(taskId: string, isDone = true) {
    return this.mutate('complete_task', 'task', taskId, async () => {
      const { data: current, error: currentError } = await this.client
        .from('tasks')
        .select('id, is_done, finish_date, repeat_interval, from_repeating')
        .eq('id', taskId)
        .maybeSingle();

      if (currentError || !current) throw new Error('Task not found.');

      if (isDone && (current.repeat_interval ?? 0) > 0) {
        const timezone = await this.userTimezone();

        const nextFinishDate = nextRecurringFinishDate(
          current.finish_date,
          current.repeat_interval,
          current.from_repeating,
          timezone
        );

        const { data, error: taskError } = await this.client
          .from('tasks')
          .update({
            is_done: false,
            finish_date: nextFinishDate,
            when_complete: null,
            modification_date: new Date().toISOString(),
            last_editor_id: this.connection.userId,
          })
          .eq('id', taskId)
          .select()
          .single();

        if (taskError || !data)
          throw new Error('Failed to advance recurring task.');

        const { error: stepsError } = await this.client
          .from('task_steps')
          .update({ is_done: false })
          .eq('task_id', taskId);

        if (stepsError)
          throw new Error('Failed to reset recurring task steps.');

        return normalizedTask(JsonRecordSchema.parse(data));
      }

      const { data, error } = await this.client
        .from('tasks')
        .update({
          is_done: isDone,
          modification_date: new Date().toISOString(),
          last_editor_id: this.connection.userId,
          when_complete: isDone ? new Date().toISOString() : null,
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw new Error('Failed to complete task.');

      return normalizedTask(JsonRecordSchema.parse(data));
    });
  }

  async suspendTask(taskId: string, until?: string | null) {
    if (until && Date.parse(until) <= Date.now()) {
      throw new Error('Suspension deadline must be in the future.');
    }

    return this.mutate('suspend_task', 'task', taskId, async () => {
      const { data: task, error: taskError } = await this.client
        .from('tasks')
        .select('id, is_done')
        .eq('id', taskId)
        .maybeSingle();

      if (taskError || !task) throw new Error('Task not found.');

      if (task.is_done) throw new Error('Completed tasks cannot be suspended.');

      const { data, error } = await this.client
        .from('tasks')
        .update({
          is_active: false,
          suspend_until: until ?? null,
          modification_date: new Date().toISOString(),
          last_editor_id: this.connection.userId,
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error || !data) throw new Error('Failed to suspend task.');

      return normalizedTask(JsonRecordSchema.parse(data));
    });
  }

  async resumeTask(taskId: string) {
    return this.mutate('resume_task', 'task', taskId, async () => {
      const { data: task, error: taskError } = await this.client
        .from('tasks')
        .select('id, is_done')
        .eq('id', taskId)
        .maybeSingle();

      if (taskError || !task) throw new Error('Task not found.');

      if (task.is_done) throw new Error('Completed tasks cannot be resumed.');

      const { data, error } = await this.client
        .from('tasks')
        .update({
          is_active: true,
          suspend_until: null,
          modification_date: new Date().toISOString(),
          last_editor_id: this.connection.userId,
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error || !data) throw new Error('Failed to resume task.');

      return normalizedTask(JsonRecordSchema.parse(data));
    });
  }

  async deleteTask(taskId: string) {
    return this.mutate('delete_task', 'task', taskId, async () => {
      const { data, error } = await this.client
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .select('id')
        .maybeSingle();

      if (error) throw new Error('Failed to delete task.');

      if (!data) throw new Error('Task not found.');

      return { deleted: true, task_id: taskId };
    });
  }

  async listTags() {
    const { data, error } = await this.client
      .from('tags')
      .select('id, name, created_at')
      .order('name');

    if (error) throw new Error('Failed to list tags.');

    return data ?? [];
  }

  async createTag(name: string) {
    return this.mutate('create_tag', 'tag', undefined, async () => {
      const { data, error } = await this.client
        .from('tags')
        .insert({ owner_id: this.connection.userId, name: name.trim() })
        .select()
        .single();

      if (error) throw new Error('Failed to create tag.');

      return data;
    });
  }

  async addTagToTask(taskId: string, tagId: string) {
    return this.mutate('add_tag_to_task', 'task', taskId, async () => {
      const [{ data: task }, { data: tag }] = await Promise.all([
        this.client.from('tasks').select('id').eq('id', taskId).maybeSingle(),
        this.client.from('tags').select('id').eq('id', tagId).maybeSingle(),
      ]);

      if (!task) throw new Error('Task not found or not accessible to you.');

      if (!tag) throw new Error('Tag not found or not owned by you.');

      const { error } = await this.client
        .from('task_tags')
        .insert({ task_id: taskId, tag_id: tagId });

      if (error?.code === '23505') {
        return { already_exists: true, task_id: taskId, tag_id: tagId };
      }

      if (error) throw new Error('Failed to add tag.');

      return { added: true, task_id: taskId, tag_id: tagId };
    });
  }

  private async assertValidProjectParent(
    parentId: string,
    projectId?: string
  ): Promise<void> {
    const hierarchy = await this.projectHierarchy();
    const parent = hierarchy.find((project) => project.id === parentId);

    if (!parent) throw new Error('Parent project not found.');

    if (parent.is_inbox) throw new Error('Inbox cannot be a parent project.');

    if (!projectId) return;

    if (parentId === projectId) {
      throw new Error('A project cannot be its own parent.');
    }

    const descendants = collectDescendantProjectIds(hierarchy, projectId);

    if (descendants.includes(parentId)) {
      throw new Error('A project cannot be moved below its descendant.');
    }
  }

  private async accessibleProjectSubtree(projectId: string): Promise<string[]> {
    const hierarchy = await this.projectHierarchy();

    if (!hierarchy.some((project) => project.id === projectId)) {
      throw new Error('Project not found.');
    }

    return [projectId, ...collectDescendantProjectIds(hierarchy, projectId)];
  }

  private async projectHierarchy(): Promise<
    { id: string; ancestor_id: string | null; is_inbox: boolean }[]
  > {
    const { data, error } = await this.client
      .from('projects')
      .select('id, ancestor_id, is_inbox');

    if (error) throw new Error('Failed to inspect project hierarchy.');

    return z
      .array(
        z.object({
          id: z.string(),
          ancestor_id: z.string().nullable(),
          is_inbox: z.boolean(),
        })
      )
      .parse(data ?? []);
  }

  private async taskFinishDate(taskId: string): Promise<string | null> {
    const { data, error } = await this.client
      .from('tasks')
      .select('finish_date')
      .eq('id', taskId)
      .maybeSingle();

    if (error || !data) throw new Error('Task not found.');

    return data.finish_date ?? null;
  }

  private async userTimezone(): Promise<string> {
    const { data } = await this.client
      .from('app_users')
      .select('timezone')
      .eq('auth_user_id', this.connection.userId)
      .maybeSingle();

    return z.string().safeParse(data?.timezone).data ?? 'Europe/Warsaw';
  }

  private async mutate<T>(
    toolName: string,
    targetType: string,
    targetId: string | undefined,
    operation: () => Promise<T>
  ): Promise<T> {
    const requestId = crypto.randomUUID();

    const { data: audit, error: auditError } = await this.client
      .from('mcp_audit_events')
      .insert({
        owner_id: this.connection.userId,
        client_id: this.connection.clientId,
        tool_name: toolName,
        target_type: targetType,
        target_id: targetId,
        request_id: requestId,
      })
      .select('id')
      .maybeSingle();

    if (auditError || !audit?.id) {
      throw new Error('Failed to create MCP audit record.');
    }

    try {
      const result = await operation();
      await this.client
        .from('mcp_audit_events')
        .update({
          outcome: 'succeeded',
          finished_at: new Date().toISOString(),
        })
        .eq('id', audit.id);

      return result;
    } catch (error) {
      await this.client
        .from('mcp_audit_events')
        .update({
          outcome: 'failed',
          error_code: 'operation_failed',
          finished_at: new Date().toISOString(),
        })
        .eq('id', audit.id);
      throw error;
    }
  }
}

type ProjectHierarchyRow = {
  id: string;
  ancestor_id: string | null;
  is_inbox: boolean;
};

function collectDescendantProjectIds(
  hierarchy: ProjectHierarchyRow[],
  rootId: string
): string[] {
  const descendants: string[] = [];
  const queue = [rootId];
  const visited = new Set(queue);

  while (queue.length > 0) {
    const parentId = queue.shift();

    for (const project of hierarchy) {
      if (project.ancestor_id !== parentId || visited.has(project.id)) continue;
      visited.add(project.id);
      descendants.push(project.id);
      queue.push(project.id);
    }
  }

  return descendants;
}
