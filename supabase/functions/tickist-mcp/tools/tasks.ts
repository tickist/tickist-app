// Task tool handlers for MCP

import { createClient } from 'npm:@supabase/supabase-js@2';
import { requireEnv, requireSupabaseSecretKey } from '../../_shared/common.ts';
import { McpToolResult, jsonResult, errorResult } from '../mcp-protocol.ts';
import { canAccessProject } from '../project-access.ts';

type Args = Record<string, unknown>;

const getClient = () =>
  createClient(requireEnv('SUPABASE_URL'), requireSupabaseSecretKey());

type RepeatInput = {
  interval_days: number;
  from: 'completion_date' | 'due_date';
};

const normalizedTask = (row: Record<string, unknown>) => {
  const interval =
    typeof row.repeat_interval === 'number' ? row.repeat_interval : 0;
  const suspendUntil =
    typeof row.suspend_until === 'string' ? row.suspend_until : null;
  return {
    ...row,
    repeat:
      interval > 0
        ? {
            interval_days: interval,
            from: row.from_repeating === 1 ? 'due_date' : 'completion_date',
          }
        : null,
    suspension: {
      is_suspended:
        row.is_done !== true &&
        row.is_active === false &&
        (suspendUntil === null || Date.parse(suspendUntil) > Date.now()),
      until: suspendUntil,
    },
  };
};

const repeatColumns = (repeat: RepeatInput | null): Record<string, unknown> =>
  repeat
    ? {
        repeat_interval: repeat.interval_days,
        repeat_delta: null,
        from_repeating: repeat.from === 'due_date' ? 1 : 0,
      }
    : { repeat_interval: 0, repeat_delta: null, from_repeating: null };

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
  if (args.include_descendants === true && !args.project_id) {
    return errorResult('include_descendants requires project_id');
  }

  let query = supabase
    .from('tasks')
    .select(
      'id, name, description, project_id, priority, is_done, is_active, suspend_until, on_hold, pinned, finish_date, finish_time, repeat_interval, repeat_delta, from_repeating, creation_date, modification_date'
    )
    .eq('owner_id', userId)
    .order('creation_date', { ascending: false })
    .limit(limit);

  if (args.project_id) {
    const projectId = args.project_id as string;
    if (args.include_descendants === true) {
      const projectIds = await accessibleProjectSubtree(
        supabase,
        userId,
        projectId
      );
      if (!projectIds) return errorResult('Project not found');
      query =
        projectIds.length === 1
          ? query.eq('project_id', projectIds[0])
          : query.in('project_id', projectIds);
    } else {
      query = query.eq('project_id', projectId);
    }
  }
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
  return jsonResult((data ?? []).map((task) => normalizedTask(task)));
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

  return jsonResult(
    normalizedTask({
      ...task,
      steps: steps ?? [],
      tags: (taskTags ?? [])
        .map((tt: Record<string, unknown>) => tt.tags)
        .filter(Boolean),
    })
  );
};

export const createTask = async (
  userId: string,
  args: Args
): Promise<McpToolResult> => {
  const name = (args.name as string)?.trim();
  if (!name) return errorResult('name is required');
  const repeat = args.repeat as RepeatInput | undefined;
  if (repeat?.from === 'due_date' && !args.finish_date) {
    return errorResult('repeat.from due_date requires finish_date');
  }

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
  if (repeat) Object.assign(insertData, repeatColumns(repeat));

  const { data, error } = await supabase
    .from('tasks')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('[tickist-mcp] Failed to create task', error);
    return errorResult('Failed to create task');
  }
  return jsonResult(normalizedTask(data));
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
  const repeat = args.repeat as RepeatInput | null | undefined;
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

  if (repeat !== undefined) Object.assign(updates, repeatColumns(repeat));

  if (Object.keys(updates).length <= 2) {
    return errorResult(
      'No fields to update. Provide at least one of: name, description, project_id, priority, finish_date, pinned, on_hold, repeat'
    );
  }

  const supabase = getClient();
  if (
    typeof updates.project_id === 'string' &&
    !(await hasProjectAccess(supabase, userId, updates.project_id))
  ) {
    return errorResult('Project not found or not accessible to you');
  }
  if (repeat?.from === 'due_date') {
    let finishDate = updates.finish_date;
    if (finishDate === undefined) {
      const { data: currentTask, error: currentTaskError } = await supabase
        .from('tasks')
        .select('finish_date')
        .eq('id', taskId)
        .eq('owner_id', userId)
        .maybeSingle();
      if (currentTaskError || !currentTask)
        return errorResult('Task not found');
      finishDate = currentTask.finish_date;
    }
    if (!finishDate) {
      return errorResult('repeat.from due_date requires finish_date');
    }
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
  return jsonResult(normalizedTask(data));
};

export const completeTask = async (
  userId: string,
  args: Args
): Promise<McpToolResult> => {
  const taskId = args.task_id as string;
  if (!taskId) return errorResult('task_id is required');

  const isDone = args.is_done !== undefined ? Boolean(args.is_done) : true;

  const supabase = getClient();
  const { data: current, error: currentError } = await supabase
    .from('tasks')
    .select('id, finish_date, repeat_interval, from_repeating')
    .eq('id', taskId)
    .eq('owner_id', userId)
    .maybeSingle();
  if (currentError || !current) return errorResult('Task not found');

  if (isDone && (current.repeat_interval ?? 0) > 0) {
    const timezone = await userTimezone(supabase, userId);
    const { data, error } = await supabase
      .from('tasks')
      .update({
        is_done: false,
        finish_date: nextRecurringFinishDate(
          current.finish_date,
          current.repeat_interval,
          current.from_repeating,
          timezone
        ),
        when_complete: null,
        modification_date: new Date().toISOString(),
        last_editor_id: userId,
      })
      .eq('id', taskId)
      .eq('owner_id', userId)
      .select()
      .single();
    if (error) return errorResult('Failed to advance recurring task');
    const { error: stepsError } = await supabase
      .from('task_steps')
      .update({ is_done: false })
      .eq('task_id', taskId);
    if (stepsError) return errorResult('Failed to reset recurring task steps');
    return jsonResult(normalizedTask(data));
  }

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
  return jsonResult(normalizedTask(data));
};

export const suspendTask = async (
  userId: string,
  args: Args
): Promise<McpToolResult> => {
  const taskId = args.task_id as string;
  const until = typeof args.until === 'string' ? args.until : null;
  if (until && Date.parse(until) <= Date.now()) {
    return errorResult('Suspension deadline must be in the future');
  }
  const supabase = getClient();
  const { data: current, error: currentError } = await supabase
    .from('tasks')
    .select('id, is_done')
    .eq('id', taskId)
    .eq('owner_id', userId)
    .maybeSingle();
  if (currentError || !current) return errorResult('Task not found');
  if (current.is_done)
    return errorResult('Completed tasks cannot be suspended');

  const { data, error } = await supabase
    .from('tasks')
    .update({
      is_active: false,
      suspend_until: until,
      modification_date: new Date().toISOString(),
      last_editor_id: userId,
    })
    .eq('id', taskId)
    .eq('owner_id', userId)
    .select()
    .single();
  if (error) return errorResult('Failed to suspend task');
  return jsonResult(normalizedTask(data));
};

export const resumeTask = async (
  userId: string,
  args: Args
): Promise<McpToolResult> => {
  const taskId = args.task_id as string;
  const supabase = getClient();
  const { data: current, error: currentError } = await supabase
    .from('tasks')
    .select('id, is_done')
    .eq('id', taskId)
    .eq('owner_id', userId)
    .maybeSingle();
  if (currentError || !current) return errorResult('Task not found');
  if (current.is_done) return errorResult('Completed tasks cannot be resumed');

  const { data, error } = await supabase
    .from('tasks')
    .update({
      is_active: true,
      suspend_until: null,
      modification_date: new Date().toISOString(),
      last_editor_id: userId,
    })
    .eq('id', taskId)
    .eq('owner_id', userId)
    .select()
    .single();
  if (error) return errorResult('Failed to resume task');
  return jsonResult(normalizedTask(data));
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

const accessibleProjectSubtree = async (
  supabase: ReturnType<typeof getClient>,
  userId: string,
  rootId: string
): Promise<string[] | null> => {
  const [
    { data: owned, error: ownedError },
    { data: memberships, error: memberError },
  ] = await Promise.all([
    supabase.from('projects').select('id, ancestor_id').eq('owner_id', userId),
    supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', userId)
      .eq('status', 'accepted'),
  ]);
  if (ownedError || memberError) return null;
  const memberIds = (memberships ?? []).map((member) => member.project_id);
  const { data: shared, error: sharedError } = memberIds.length
    ? await supabase
        .from('projects')
        .select('id, ancestor_id')
        .in('id', memberIds)
    : { data: [], error: null };
  if (sharedError) return null;
  const hierarchy = [...(owned ?? []), ...(shared ?? [])];
  if (!hierarchy.some((project) => project.id === rootId)) return null;

  const result = [rootId];
  const visited = new Set(result);
  for (let index = 0; index < result.length; index += 1) {
    for (const project of hierarchy) {
      if (project.ancestor_id === result[index] && !visited.has(project.id)) {
        visited.add(project.id);
        result.push(project.id);
      }
    }
  }
  return result;
};

const userTimezone = async (
  supabase: ReturnType<typeof getClient>,
  userId: string
): Promise<string> => {
  const { data } = await supabase
    .from('app_users')
    .select('timezone')
    .eq('auth_user_id', userId)
    .maybeSingle();
  return typeof data?.timezone === 'string' ? data.timezone : 'Europe/Warsaw';
};

const nextRecurringFinishDate = (
  finishDate: string | null,
  repeatInterval: number,
  fromRepeating: number | null,
  timezone: string
): string => {
  const today = dateKeyInTimezone(new Date(), timezone);
  let base = today;
  if (fromRepeating === 1 && finishDate) {
    const due = dateKeyInTimezone(new Date(finishDate), timezone);
    if (due > today) base = due;
  }
  return startOfZonedDayIso(
    addCalendarDays(base, Math.max(1, Math.round(repeatInterval))),
    timezone
  );
};

const dateKeyInTimezone = (date: Date, timezone: string): string => {
  const parts = zonedParts(date, timezone);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
};

const addCalendarDays = (dateKey: string, days: number): string => {
  const [year, month, day] = dateKey.split('-').map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(
    next.getUTCDate()
  )}`;
};

const startOfZonedDayIso = (dateKey: string, timezone: string): string => {
  const [year, month, day] = dateKey.split('-').map(Number);
  const target = Date.UTC(year, month - 1, day);
  let candidate = target;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const parts = zonedParts(new Date(candidate), timezone, true);
    const observed = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second
    );
    const correction = target - observed;
    candidate += correction;
    if (correction === 0) break;
  }
  return new Date(candidate).toISOString();
};

const zonedParts = (
  date: Date,
  timezone: string,
  includeTime = false
): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
} => {
  let safeTimezone = timezone;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: safeTimezone }).format(date);
  } catch {
    safeTimezone = 'Europe/Warsaw';
  }
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: safeTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...(includeTime
      ? {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hourCycle: 'h23' as const,
        }
      : {}),
  });
  const values = new Map(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)])
  );
  return {
    year: values.get('year') ?? 1970,
    month: values.get('month') ?? 1,
    day: values.get('day') ?? 1,
    hour: values.get('hour') ?? 0,
    minute: values.get('minute') ?? 0,
    second: values.get('second') ?? 0,
  };
};

const pad = (value: number): string => String(value).padStart(2, '0');
