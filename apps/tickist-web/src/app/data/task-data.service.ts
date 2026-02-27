import { Injectable, computed, inject, signal } from '@angular/core';
import { SUPABASE_CLIENT, SUPABASE_CONFIG } from '../config/supabase.provider';

export interface Task {
  id: string;
  ownerId: string;
  projectId: string | null;
  name: string;
  description: string;
  finishDate?: string | null;
  finishTime?: string | null;
  typeFinishDate?: number | null;
  suspendUntil?: string | null;
  pinned: boolean;
  isActive: boolean;
  isDone: boolean;
  onHold: boolean;
  priority: string;
  repeatInterval: number;
  repeatDelta?: number | null;
  fromRepeating?: number | null;
  estimateMinutes?: number | null;
  spentMinutes?: number | null;
  taskType: string;
  whenComplete?: string | null;
  tags: string[];
  steps: TaskStep[];
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface TaskStep {
  id: string;
  taskId: string;
  content: string;
  isDone: boolean;
  position: number;
}

export interface TaskCreateInput {
  ownerId: string;
  name: string;
  projectId?: string | null;
  description?: string;
  finishDate?: string | null;
  finishTime?: string | null;
  typeFinishDate?: number | null;
  priority?: string;
  repeatInterval?: number;
  fromRepeating?: number | null;
  estimateMinutes?: number | null;
  taskType?: string;
  tags?: string[];
  steps?: { content: string; position?: number; isDone?: boolean }[];
  isActive?: boolean;
  onHold?: boolean;
  pinned?: boolean;
  suspendUntil?: string | null;
  spentMinutes?: number | null;
}

export interface TaskUpdateInput {
  id: string;
  name?: string;
  projectId?: string | null;
  description?: string;
  finishDate?: string | null;
  finishTime?: string | null;
  typeFinishDate?: number | null;
  priority?: string;
  repeatInterval?: number | null;
  fromRepeating?: number | null;
  estimateMinutes?: number | null;
  isDone?: boolean;
  isActive?: boolean;
  onHold?: boolean;
  taskType?: string;
  tags?: string[];
  steps?: { id?: string; content: string; position?: number; isDone?: boolean }[];
  pinned?: boolean;
  suspendUntil?: string | null;
  spentMinutes?: number | null;
}

type TaskRow = {
  id: string;
  owner_id: string;
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
  task_tags?: { tag_id: string }[] | null;
  task_steps?: { id: string; content: string; is_done: boolean; position: number }[] | null;
};

@Injectable({ providedIn: 'root' })
export class TaskDataService {
  private readonly supabase = inject(SUPABASE_CLIENT, { optional: true });
  private readonly supabaseConfig = inject(SUPABASE_CONFIG, { optional: true });
  private readonly tasks = signal<Task[]>([]);
  private readonly loading = signal(false);

  readonly tasksSignal = computed(() => this.tasks());
  readonly loadingSignal = computed(() => this.loading());

  constructor() {
    if (this.supabase) {
      void this.refresh();
    }
  }

  list() {
    return this.tasksSignal();
  }

  async refresh(): Promise<void> {
    if (!this.supabase) {
      this.tasks.set([]);
      this.loading.set(false);
      console.warn('[Tasks] Supabase client missing; skipping fetch.');
      return;
    }
    this.loading.set(true);
    const query = this.supabase
      .from('tasks')
      .select(
        'id, owner_id, project_id, name, description, finish_date, finish_time, type_finish_date, suspend_until, pinned, is_active, is_done, on_hold, priority, repeat_interval, repeat_delta, from_repeating, estimate_minutes, spent_minutes, task_type, when_complete, creation_date, modification_date, task_tags(tag_id), task_steps(id, content, is_done, position)'
      );
    const { data, error } = await query;
    if (error || !data) {
      console.warn('[Tasks] Unable to fetch from Supabase yet.', error);
      this.loading.set(false);
      return;
    }
    const typedData = data as TaskRow[];
    this.tasks.set(typedData.map(mapTaskRowToTask));
    this.loading.set(false);
  }

  async createTask(input: TaskCreateInput): Promise<Task | null> {
    if (!input.ownerId) {
      throw new Error('ownerId is required to create a task');
    }

    if (!this.supabase) {
      console.warn('[Tasks] Supabase client missing; cannot create task.');
      return null;
    }

    const insertPayload = toTaskInsertPayload(input);
    const { data, error } = await this.supabase
      .from('tasks')
      .insert(insertPayload)
      .select('id')
      .single();

    if (error || !data) {
      console.error('[Tasks] Failed to create task', error);
      return null;
    }

    if (input.tags?.length) {
      await this.supabase
        .from('task_tags')
        .insert(
          input.tags.map((tagId) => ({
            task_id: data.id,
            tag_id: tagId,
          }))
        )
        .throwOnError();
    }

    if (input.steps?.length) {
      await this.supabase
        .from('task_steps')
        .insert(
          input.steps.map((step, index) => ({
            task_id: data.id,
            content: step.content,
            position: step.position ?? index,
            is_done: 'isDone' in step ? step.isDone ?? false : false,
          }))
        )
        .throwOnError();
    }

    const created = await this.fetchTaskById(data.id);
    if (created) {
      this.setTasks((current) => [...current, created]);
    }
    return created;
  }

  async updateTask(input: TaskUpdateInput): Promise<Task | null> {
    const previous = this.tasks().find((task) => task.id === input.id);

    if (!this.supabase) {
      console.warn('[Tasks] Supabase client missing; cannot update task.');
      return null;
    }

    const { tags, steps, ...patchInput } = input;
    const recurringCompletion =
      !!previous &&
      !previous.isDone &&
      input.isDone === true &&
      previous.repeatInterval > 0;
    const effectivePatchInput = recurringCompletion
      ? buildRecurringCompletionPatch(previous, patchInput)
      : patchInput;
    const updatePayload = toTaskUpdatePayload(effectivePatchInput);

    if (Object.keys(updatePayload).length) {
      const { error } = await this.supabase
        .from('tasks')
        .update(updatePayload)
        .eq('id', input.id);
      if (error) {
        console.error('[Tasks] Failed to update task', error);
        return null;
      }
    }

    if (tags) {
      await this.supabase.from('task_tags').delete().eq('task_id', input.id);
      if (tags.length) {
        await this.supabase
          .from('task_tags')
          .insert(tags.map((tagId) => ({ task_id: input.id, tag_id: tagId })));
      }
    }

    if (steps) {
      await this.supabase.from('task_steps').delete().eq('task_id', input.id);
      if (steps.length) {
        await this.supabase
          .from('task_steps')
          .insert(
            steps.map((step, index) => ({
              task_id: input.id,
              content: step.content,
              position: step.position ?? index,
              is_done: recurringCompletion ? false : (step.isDone ?? false),
            }))
          );
      }
    } else if (recurringCompletion) {
      const { error: deleteError } = await this.supabase
        .from('task_steps')
        .delete()
        .eq('task_id', input.id);
      if (deleteError) {
        console.error('[Tasks] Failed to reset task steps', deleteError);
        return null;
      }
      if (previous?.steps.length) {
        const { error: insertError } = await this.supabase
          .from('task_steps')
          .insert(
            previous.steps.map((step, index) => ({
              task_id: input.id,
              content: step.content,
              position: index,
              is_done: false,
            }))
          );
        if (insertError) {
          console.error('[Tasks] Failed to recreate task steps', insertError);
          return null;
        }
      }
    }

    const updated = await this.fetchTaskById(input.id);
    if (updated) {
      this.setTasks((current) =>
        current.map((task) => (task.id === updated.id ? updated : task))
      );

      // Fire workflow if status changed to done
      if (previous && !previous.isDone && (input.isDone ?? updated.isDone)) {
        await this.callTaskReminderFunction(updated.id, 'completed');
      }
    }
    return updated;
  }

  async deleteTask(taskId: string): Promise<boolean> {
    if (!this.supabase) {
      console.warn('[Tasks] Supabase client missing; cannot delete task.');
      return false;
    }

    const { error } = await this.supabase.from('tasks').delete().eq('id', taskId);
    if (error) {
      console.error('[Tasks] Failed to delete task', error);
      return false;
    }
    this.setTasks((current) => current.filter((task) => task.id !== taskId));
    return true;
  }

  private async fetchTaskById(id: string): Promise<Task | null> {
    if (!this.supabase) {
      return this.tasks().find((task) => task.id === id) ?? null;
    }
    const { data, error } = await this.supabase
      .from('tasks')
      .select(
        'id, owner_id, project_id, name, description, finish_date, finish_time, type_finish_date, suspend_until, pinned, is_active, is_done, on_hold, priority, repeat_interval, repeat_delta, from_repeating, estimate_minutes, spent_minutes, task_type, when_complete, creation_date, modification_date, task_tags(tag_id), task_steps(id, content, is_done, position)'
      )
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('[Tasks] Failed to fetch task by id', error);
      return null;
    }
    return mapTaskRowToTask(data as TaskRow);
  }

  private setTasks(updater: (tasks: Task[]) => Task[]) {
    this.tasks.set(updater(this.tasks()));
  }

  private async callTaskReminderFunction(
    taskId: string,
    event: 'created' | 'completed' | 'snoozed'
  ) {
    const functionsUrl = this.supabaseConfig?.functionsUrl;
    if (!functionsUrl || !this.supabase) {
      return;
    }
    try {
      const headers = await this.getFunctionAuthHeaders();
      if (!headers) {
        return;
      }
      const response = await fetch(`${functionsUrl}/task-reminder`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ taskId, event }),
      });
      if (!response.ok) {
        console.warn(
          '[Tasks] Edge function responded with error',
          await response.text()
        );
      }
    } catch (error) {
      console.warn('[Tasks] Unable to reach task-reminder function', error);
    }
  }

  private async getFunctionAuthHeaders(): Promise<Record<string, string> | null> {
    if (!this.supabase) {
      return null;
    }
    const { data, error } = await this.supabase.auth.getSession();
    const accessToken = data.session?.access_token;
    if (error || !accessToken) {
      console.warn(
        '[Tasks] Missing active Supabase session; skipping edge function call.',
        error
      );
      return null;
    }
    const publishableKey = (
      this.supabaseConfig?.publishableKey ?? this.supabaseConfig?.anonKey ?? ''
    ).trim();
    if (!publishableKey) {
      console.warn(
        '[Tasks] Missing Supabase publishable key; skipping edge function call.'
      );
      return null;
    }
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      // Authorization must carry a user session JWT for verify_jwt=true functions.
      Authorization: `Bearer ${accessToken}`,
      apikey: publishableKey,
      // Function body verifies end-user identity from session JWT.
      'x-user-jwt': accessToken,
    };
    return headers;
  }
}

function buildRecurringCompletionPatch(
  previous: Task,
  input: Omit<TaskUpdateInput, 'id' | 'tags' | 'steps'>
): Omit<TaskUpdateInput, 'id' | 'tags' | 'steps'> {
  const intervalDays = Math.max(1, Math.round(previous.repeatInterval));
  const today = startOfLocalDay(new Date());
  const anchorMode = input.fromRepeating ?? previous.fromRepeating ?? 0;
  let base = today;

  if (anchorMode === 1 && previous.finishDate) {
    const dueDate = new Date(previous.finishDate);
    if (!Number.isNaN(dueDate.getTime())) {
      const dueDay = startOfLocalDay(dueDate);
      base = dueDay < today ? today : dueDay;
    }
  }

  const nextDay = new Date(base);
  nextDay.setDate(nextDay.getDate() + intervalDays);

  return {
    ...input,
    isDone: false,
    finishDate: nextDay.toISOString(),
    // Keep existing finish_time for recurring tasks.
    finishTime: undefined,
  };
}

function startOfLocalDay(date: Date): Date {
  const local = new Date(date);
  local.setHours(0, 0, 0, 0);
  return local;
}

function mapTaskRowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    ownerId: row.owner_id,
    projectId: row.project_id,
    name: row.name,
    description: row.description ?? '',
    finishDate: row.finish_date,
    finishTime: row.finish_time,
    typeFinishDate: row.type_finish_date,
    suspendUntil: row.suspend_until,
    pinned: row.pinned,
    isActive: row.is_active,
    isDone: row.is_done,
    onHold: row.on_hold,
    priority: row.priority ?? 'normal',
    repeatInterval: row.repeat_interval ?? 0,
    repeatDelta: row.repeat_delta,
    fromRepeating: row.from_repeating,
    estimateMinutes: row.estimate_minutes,
    spentMinutes: row.spent_minutes,
    taskType: row.task_type ?? 'normal',
    whenComplete: row.when_complete,
    tags: row.task_tags?.map((tag) => tag.tag_id) ?? [],
    steps:
      row.task_steps
        ?.map((step) => ({
          id: step.id,
          taskId: row.id,
          content: step.content,
          isDone: step.is_done,
          position: step.position,
        }))
        .sort((a, b) => a.position - b.position) ?? [],
    createdAt: row.creation_date,
    updatedAt: row.modification_date,
  };
}

function toTaskInsertPayload(input: TaskCreateInput) {
  return {
    owner_id: input.ownerId,
    project_id: input.projectId ?? null,
    name: input.name,
    description: input.description ?? '',
    finish_date: input.finishDate ?? null,
    finish_time: input.finishTime ?? null,
    type_finish_date: input.typeFinishDate ?? 1,
    priority: input.priority ?? 'normal',
    repeat_interval: input.repeatInterval ?? 0,
    from_repeating: input.fromRepeating ?? null,
    estimate_minutes: input.estimateMinutes ?? null,
    spent_minutes: input.spentMinutes ?? null,
    task_type: input.taskType ?? 'normal',
    is_active: input.isActive ?? true,
    on_hold: input.onHold ?? false,
    suspend_until: input.suspendUntil ?? null,
    pinned: input.pinned ?? false,
  };
}

function toTaskUpdatePayload(input: Omit<TaskUpdateInput, 'id' | 'tags' | 'steps'>) {
  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = input.name;
  if (input.projectId !== undefined) payload.project_id = input.projectId;
  if (input.description !== undefined) payload.description = input.description;
  if (input.finishDate !== undefined) payload.finish_date = input.finishDate;
  if (input.finishTime !== undefined) payload.finish_time = input.finishTime;
  if (input.typeFinishDate !== undefined)
    payload.type_finish_date = input.typeFinishDate;
  if (input.priority !== undefined) payload.priority = input.priority;
  if (input.repeatInterval !== undefined)
    payload.repeat_interval = input.repeatInterval;
  if (input.fromRepeating !== undefined)
    payload.from_repeating = input.fromRepeating;
  if (input.estimateMinutes !== undefined)
    payload.estimate_minutes = input.estimateMinutes;
  if (input.isDone !== undefined) payload.is_done = input.isDone;
  if (input.isActive !== undefined) payload.is_active = input.isActive;
  if (input.onHold !== undefined) payload.on_hold = input.onHold;
  if (input.taskType !== undefined) payload.task_type = input.taskType;
  if (input.pinned !== undefined) payload.pinned = input.pinned;
  if (input.suspendUntil !== undefined)
    payload.suspend_until = input.suspendUntil;
  if (input.spentMinutes !== undefined)
    payload.spent_minutes = input.spentMinutes;
  return payload;
}
