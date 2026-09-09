import { createClient, type SupabaseClient } from '@supabase/supabase-js';

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
  is_done?: boolean;
  is_active?: boolean;
  priority?: 'A' | 'B' | 'C' | 'normal';
  limit?: number;
}

type JsonRecord = Record<string, unknown>;

function compact(values: JsonRecord): JsonRecord {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined)
  );
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

  async listProjects(isActive = true): Promise<unknown[]> {
    const { data, error } = await this.client
      .from('projects')
      .select(
        'id, name, description, color, icon, is_active, is_inbox, project_type, created_at'
      )
      .eq('is_active', isActive)
      .order('name');
    if (error) throw new Error('Failed to list projects.');
    return data ?? [];
  }

  async getProject(projectId: string): Promise<unknown> {
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
  }): Promise<unknown> {
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
      is_active?: boolean;
    }
  ): Promise<unknown> {
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

  async listTasks(input: ListTasksInput): Promise<unknown[]> {
    let query = this.client
      .from('tasks')
      .select(
        'id, name, description, project_id, priority, is_done, is_active, on_hold, pinned, finish_date, finish_time, creation_date, modification_date'
      )
      .order('creation_date', { ascending: false })
      .limit(input.limit ?? 100);
    if (input.project_id) query = query.eq('project_id', input.project_id);
    if (input.is_done !== undefined) query = query.eq('is_done', input.is_done);
    if (input.is_active !== undefined)
      query = query.eq('is_active', input.is_active);
    if (input.priority) query = query.eq('priority', input.priority);
    const { data, error } = await query;
    if (error) throw new Error('Failed to list tasks.');
    return data ?? [];
  }

  async getTask(taskId: string): Promise<unknown> {
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
    return {
      ...task,
      steps: steps ?? [],
      tags: (taskTags ?? [])
        .map((row) => (row as JsonRecord)['tags'])
        .filter(Boolean),
    };
  }

  async createTask(input: {
    name: string;
    project_id?: string;
    description?: string;
    priority?: 'A' | 'B' | 'C' | 'normal';
    finish_date?: string;
    pinned?: boolean;
  }): Promise<unknown> {
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
      const { data, error } = await this.client
        .from('tasks')
        .insert(
          compact({
            owner_id: this.connection.userId,
            author_id: this.connection.userId,
            name: input.name.trim(),
            project_id: projectId,
            description: input.description,
            priority: input.priority,
            finish_date: input.finish_date,
            pinned: input.pinned,
          })
        )
        .select()
        .single();
      if (error) throw new Error('Failed to create task.');
      return data;
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
    }
  ): Promise<unknown> {
    return this.mutate('update_task', 'task', taskId, async () => {
      const { data, error } = await this.client
        .from('tasks')
        .update(
          compact({
            ...changes,
            modification_date: new Date().toISOString(),
            last_editor_id: this.connection.userId,
          })
        )
        .eq('id', taskId)
        .select()
        .single();
      if (error) throw new Error('Failed to update task.');
      return data;
    });
  }

  async completeTask(taskId: string, isDone = true): Promise<unknown> {
    return this.mutate('complete_task', 'task', taskId, async () => {
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
      return data;
    });
  }

  async deleteTask(taskId: string): Promise<unknown> {
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

  async listTags(): Promise<unknown[]> {
    const { data, error } = await this.client
      .from('tags')
      .select('id, name, created_at')
      .order('name');
    if (error) throw new Error('Failed to list tags.');
    return data ?? [];
  }

  async createTag(name: string): Promise<unknown> {
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

  async addTagToTask(taskId: string, tagId: string): Promise<unknown> {
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
