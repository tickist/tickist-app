// Task tool handlers for MCP

import { createClient } from 'npm:@supabase/supabase-js@2';
import { requireEnv, requireSupabaseSecretKey } from '../../_shared/common.ts';
import { McpToolResult, jsonResult, errorResult } from '../mcp-protocol.ts';
import { canAccessProject } from '../project-access.ts';

type Args = Record<string, unknown>;

const getClient = () =>
  createClient(requireEnv('SUPABASE_URL'), requireSupabaseSecretKey());

const hasProjectAccess = async (
  supabase: ReturnType<typeof getClient>,
  userId: string,
  projectId: string
): Promise<boolean> =>
  canAccessProject(
    userId,
    projectId,
    async (ownerId, ownedProjectId) => {
      const { data, error } = await supabase
        .from('projects')
        .select('id')
        .eq('id', ownedProjectId)
        .eq('owner_id', ownerId)
        .maybeSingle();
      if (error) {
        console.error('[tickist-mcp] Project ownership lookup failed', error);
        return false;
      }
      return Boolean(data);
    },
    async (memberId, memberProjectId) => {
      const { data, error } = await supabase
        .from('project_members')
        .select('project_id')
        .eq('project_id', memberProjectId)
        .eq('user_id', memberId)
        .eq('status', 'accepted')
        .maybeSingle();
      if (error) {
        console.error('[tickist-mcp] Project membership lookup failed', error);
        return false;
      }
      return Boolean(data);
    }
  );

export const listTasks = async (
  userId: string,
  args: Args
): Promise<McpToolResult> => {
  const supabase = getClient();
  const limit = Math.min(Number(args.limit) || 100, 500);

  let query = supabase
    .from('tasks')
    .select(
      'id, name, description, project_id, priority, is_done, is_active, on_hold, pinned, finish_date, finish_time, creation_date, modification_date'
    )
    .eq('owner_id', userId)
    .order('creation_date', { ascending: false })
    .limit(limit);

  if (args.project_id)
    query = query.eq('project_id', args.project_id as string);
  if (args.is_done !== undefined)
    query = query.eq('is_done', Boolean(args.is_done));
  if (args.is_active !== undefined)
    query = query.eq('is_active', Boolean(args.is_active));
  if (args.priority) query = query.eq('priority', args.priority as string);

  const { data, error } = await query;
  if (error) {
    console.error('[tickist-mcp] Failed to list tasks', error);
    return errorResult('Failed to list tasks');
  }
  return jsonResult(data);
};

export const getTask = async (
  userId: string,
  args: Args
): Promise<McpToolResult> => {
  const taskId = args.task_id as string;
  if (!taskId) return errorResult('task_id is required');

  const supabase = getClient();

  // Fetch task
  const { data: task, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .eq('owner_id', userId)
    .single();

  if (error) return errorResult('Task not found');

  // Fetch steps
  const { data: steps } = await supabase
    .from('task_steps')
    .select('id, content, is_done, position')
    .eq('task_id', taskId)
    .order('position');

  // Fetch tags
  const { data: taskTags } = await supabase
    .from('task_tags')
    .select('tag_id, tags:tag_id(id, name)')
    .eq('task_id', taskId);

  return jsonResult({
    ...task,
    steps: steps ?? [],
    tags: (taskTags ?? [])
      .map((tt: Record<string, unknown>) => tt.tags)
      .filter(Boolean),
  });
};

export const createTask = async (
  userId: string,
  args: Args
): Promise<McpToolResult> => {
  const name = (args.name as string)?.trim();
  if (!name) return errorResult('name is required');

  const supabase = getClient();

  // Resolve project_id: use provided one or fall back to inbox
  let projectId = args.project_id as string | undefined;
  if (!projectId) {
    const { data: appUser } = await supabase
      .from('app_users')
      .select('inbox_project_id')
      .eq('auth_user_id', userId)
      .single();

    projectId = appUser?.inbox_project_id ?? undefined;
  }

  if (projectId && !(await hasProjectAccess(supabase, userId, projectId))) {
    return errorResult('Project not found or not accessible to you');
  }

  const insertData: Record<string, unknown> = {
    owner_id: userId,
    author_id: userId,
    name,
  };
  if (projectId) insertData.project_id = projectId;
  if (args.description !== undefined) insertData.description = args.description;
  if (args.priority !== undefined) insertData.priority = args.priority;
  if (args.finish_date !== undefined) insertData.finish_date = args.finish_date;
  if (args.pinned !== undefined) insertData.pinned = args.pinned;

  const { data, error } = await supabase
    .from('tasks')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('[tickist-mcp] Failed to create task', error);
    return errorResult('Failed to create task');
  }
  return jsonResult(data);
};

export const updateTask = async (
  userId: string,
  args: Args
): Promise<McpToolResult> => {
  const taskId = args.task_id as string;
  if (!taskId) return errorResult('task_id is required');

  const updates: Record<string, unknown> = {
    modification_date: new Date().toISOString(),
    last_editor_id: userId,
  };
  for (const key of [
    'name',
    'description',
    'project_id',
    'priority',
    'finish_date',
    'pinned',
    'on_hold',
  ]) {
    if (args[key] !== undefined) updates[key] = args[key];
  }

  if (Object.keys(updates).length <= 2) {
    return errorResult(
      'No fields to update. Provide at least one of: name, description, project_id, priority, finish_date, pinned, on_hold'
    );
  }

  const supabase = getClient();
  if (
    typeof updates.project_id === 'string' &&
    !(await hasProjectAccess(supabase, userId, updates.project_id))
  ) {
    return errorResult('Project not found or not accessible to you');
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .eq('owner_id', userId)
    .select()
    .single();

  if (error) {
    console.error('[tickist-mcp] Failed to update task', error);
    return errorResult('Failed to update task');
  }
  return jsonResult(data);
};

export const completeTask = async (
  userId: string,
  args: Args
): Promise<McpToolResult> => {
  const taskId = args.task_id as string;
  if (!taskId) return errorResult('task_id is required');

  const isDone = args.is_done !== undefined ? Boolean(args.is_done) : true;

  const supabase = getClient();
  const updates: Record<string, unknown> = {
    is_done: isDone,
    modification_date: new Date().toISOString(),
    last_editor_id: userId,
  };
  if (isDone) {
    updates.when_complete = new Date().toISOString();
  } else {
    updates.when_complete = null;
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .eq('owner_id', userId)
    .select()
    .single();

  if (error) {
    console.error('[tickist-mcp] Failed to complete task', error);
    return errorResult('Failed to complete task');
  }
  return jsonResult(data);
};

export const deleteTask = async (
  userId: string,
  args: Args
): Promise<McpToolResult> => {
  const taskId = args.task_id as string;
  if (!taskId) return errorResult('task_id is required');

  const supabase = getClient();
  const { data, error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('owner_id', userId)
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('[tickist-mcp] Failed to delete task', error);
    return errorResult('Failed to delete task');
  }
  if (!data) return errorResult('Task not found');
  return jsonResult({ deleted: true, task_id: taskId });
};
