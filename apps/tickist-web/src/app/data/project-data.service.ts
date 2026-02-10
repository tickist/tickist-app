import { Injectable, computed, inject, signal, effect } from '@angular/core';
import { SUPABASE_CLIENT, SUPABASE_CONFIG } from '../config/supabase.provider';
import { SupabaseSessionService } from '../features/auth/supabase-session.service';

export interface Project {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  isActive: boolean;
  isInbox: boolean;
  projectType: string;
  ancestorId: string | null;
  taskView: string;
  shareWithIds: string[];
  defaultPriority?: string;
  defaultFinishDate?: number | null;
  defaultTypeFinishDate?: number | null;
  dialogTimeWhenTaskFinished?: boolean;
}

export interface ProjectCreateInput {
  ownerId: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  isInbox?: boolean;
  projectType?: string;
  ancestorId?: string | null;
  taskView?: string;
  shareWithIds?: string[];
  isActive?: boolean;
  defaultPriority?: string;
  defaultFinishDate?: number | null;
  defaultTypeFinishDate?: number | null;
  dialogTimeWhenTaskFinished?: boolean;
  shareInvites?: string[];
}

export interface ProjectUpdateInput {
  id: string;
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  isActive?: boolean;
  isInbox?: boolean;
  projectType?: string;
  ancestorId?: string | null;
  taskView?: string;
  shareWithIds?: string[];
  defaultPriority?: string;
  defaultFinishDate?: number | null;
  defaultTypeFinishDate?: number | null;
  dialogTimeWhenTaskFinished?: boolean;
}

type ProjectRow = {
  id: string;
  owner_id: string;
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
  project_members?: { user_id: string }[] | null;
};

@Injectable({ providedIn: 'root' })
export class ProjectDataService {
  private readonly supabase = inject(SUPABASE_CLIENT, { optional: true });
  private readonly supabaseConfig = inject(SUPABASE_CONFIG, { optional: true });
  private readonly session = inject(SupabaseSessionService);
  private readonly projects = signal<Project[]>([]);
  private readonly loading = signal(false);
  private readonly ensuredInboxOwners = new Set<string>();
  private readonly ensureInboxInFlight = new Set<string>();
  private recoveringInvalidOwner = false;

  readonly projectsSignal = computed(() => this.projects());
  readonly loadingSignal = computed(() => this.loading());

  constructor() {
    if (this.supabase) {
      void this.refresh();
    }

    effect(() => {
      const user = this.session.user();
      if (!user) {
        return;
      }
      void this.ensureInboxProject(user.id);
    });
  }

  list() {
    return this.projectsSignal();
  }

  async refresh(): Promise<void> {
    if (!this.supabase) {
      this.projects.set([]);
      this.loading.set(false);
      console.warn('[Projects] Supabase client missing; skipping fetch.');
      return;
    }

    this.loading.set(true);
    const { data, error } = await this.supabase
      .from('projects')
      .select(
        'id, owner_id, name, description, color, icon, is_active, is_inbox, project_type, ancestor_id, task_view, default_priority, default_finish_date, default_type_finish_date, dialog_time_when_task_finished, project_members(user_id)'
      );

    this.loading.set(false);
    if (error || !data) {
      console.warn('[Projects] Unable to fetch from Supabase yet.', error);
      return;
    }

    this.projects.set(
      data.map((row) => ({
        id: row.id,
        ownerId: row.owner_id,
        name: row.name,
        description: row.description ?? '',
        color: row.color ?? '#394264',
        icon: row.icon ?? 'tick',
        isActive: row.is_active,
        isInbox: row.is_inbox,
        projectType: row.project_type ?? 'active',
        ancestorId: row.ancestor_id,
        taskView: row.task_view ?? 'extended',
        defaultPriority: row.default_priority ?? undefined,
        defaultFinishDate: row.default_finish_date ?? undefined,
        defaultTypeFinishDate: row.default_type_finish_date ?? undefined,
        dialogTimeWhenTaskFinished: row.dialog_time_when_task_finished ?? undefined,
        shareWithIds: row.project_members?.map((m) => m.user_id) ?? [],
      }))
    );
  }

  async createProject(input: ProjectCreateInput): Promise<Project | null> {
    if (!input.ownerId) {
      throw new Error('ownerId is required to create a project');
    }
    if (!this.supabase) {
      console.warn('[Projects] Supabase client missing; cannot create project.');
      return null;
    }

    const { shareWithIds = [], shareInvites = [], ...rest } = input;
    const { data, error } = await this.supabase
      .from('projects')
      .insert({
        owner_id: rest.ownerId,
        name: rest.name,
        description: rest.description ?? '',
        color: rest.color ?? '#394264',
        icon: rest.icon ?? 'tick',
        is_inbox: rest.isInbox ?? false,
        project_type: rest.projectType ?? 'active',
        is_active: rest.isActive ?? true,
        ancestor_id: rest.ancestorId ?? null,
        task_view: rest.taskView ?? 'extended',
        default_priority: rest.defaultPriority ?? 'B',
        default_finish_date: rest.defaultFinishDate ?? null,
        default_type_finish_date: rest.defaultTypeFinishDate ?? 0,
        dialog_time_when_task_finished: rest.dialogTimeWhenTaskFinished ?? false,
      })
      .select('id')
      .single();

    if (error || !data) {
      await this.handleOwnerConstraintError(error, input.ownerId);
      console.error('[Projects] Failed to create project', error);
      return null;
    }

    if (shareWithIds.length) {
      await this.supabase
        .from('project_members')
        .insert(
          shareWithIds.map((userId) => ({
            project_id: data.id,
            user_id: userId,
          }))
        )
        .throwOnError();
    }
    if (shareInvites.length) {
      console.info('[Projects] invite placeholders', shareInvites);
    }

    const created = await this.fetchProjectById(data.id);
    if (created) {
      this.projects.set([...this.projects(), created]);
    }
    return created;
  }

  private async handleOwnerConstraintError(
    error: { code?: string; message?: string } | null,
    ownerId: string
  ): Promise<void> {
    if (this.recoveringInvalidOwner) {
      return;
    }
    const isInvalidOwner =
      error?.code === '23503' && (error?.message ?? '').includes('owner_id');
    if (!isInvalidOwner) {
      return;
    }

    this.recoveringInvalidOwner = true;
    try {
      console.warn(
        '[Projects] Session owner does not exist in database anymore. Signing out to recover.',
        { ownerId }
      );
      this.projects.set([]);
      this.ensuredInboxOwners.delete(ownerId);
      await this.session.signOut();
    } finally {
      this.recoveringInvalidOwner = false;
    }
  }

  async updateProject(input: ProjectUpdateInput): Promise<Project | null> {
    const previous = this.projects().find((project) => project.id === input.id);

    if (!this.supabase) {
      console.warn('[Projects] Supabase client missing; cannot update project.');
      return null;
    }

    const { shareWithIds, ...rest } = input;
    const payload: Record<string, unknown> = {};
    if (rest.name !== undefined) payload.name = rest.name;
    if (rest.description !== undefined) payload.description = rest.description;
    if (rest.color !== undefined) payload.color = rest.color;
    if (rest.icon !== undefined) payload.icon = rest.icon;
    if (rest.isActive !== undefined) payload.is_active = rest.isActive;
    if (rest.isInbox !== undefined) payload.is_inbox = rest.isInbox;
    if (rest.projectType !== undefined) payload.project_type = rest.projectType;
    if (rest.ancestorId !== undefined) payload.ancestor_id = rest.ancestorId;
    if (rest.taskView !== undefined) payload.task_view = rest.taskView;
    if (rest.defaultPriority !== undefined)
      payload.default_priority = rest.defaultPriority;
    if (rest.defaultFinishDate !== undefined)
      payload.default_finish_date = rest.defaultFinishDate;
    if (rest.defaultTypeFinishDate !== undefined)
      payload.default_type_finish_date = rest.defaultTypeFinishDate;
    if (rest.dialogTimeWhenTaskFinished !== undefined)
      payload.dialog_time_when_task_finished =
        rest.dialogTimeWhenTaskFinished;

    if (Object.keys(payload).length) {
      const { error } = await this.supabase
        .from('projects')
        .update(payload)
        .eq('id', input.id);
      if (error) {
        console.error('[Projects] Failed to update project', error);
        return null;
      }
    }

    if (shareWithIds) {
      await this.supabase
        .from('project_members')
        .delete()
        .eq('project_id', input.id);
      if (shareWithIds.length) {
        await this.supabase
          .from('project_members')
          .insert(
            shareWithIds.map((userId) => ({
              project_id: input.id,
              user_id: userId,
            }))
          );
      }
    }

    const updated = await this.fetchProjectById(input.id);
    if (updated) {
      this.projects.set(
        this.projects().map((project) =>
          project.id === updated.id ? updated : project
        )
      );
      if (previous) {
        this.broadcastShareChanges(previous, updated);
      }
    }
    return updated;
  }

  async deleteProject(projectId: string): Promise<boolean> {
    if (!this.supabase) {
      console.warn('[Projects] Supabase client missing; cannot delete project.');
      return false;
    }
    const { error } = await this.supabase.from('projects').delete().eq('id', projectId);
    if (error) {
      console.error('[Projects] Failed to delete project', error);
      return false;
    }
    this.projects.set(this.projects().filter((project) => project.id !== projectId));
    return true;
  }

  private async fetchProjectById(id: string): Promise<Project | null> {
    if (!this.supabase) {
      return this.projects().find((project) => project.id === id) ?? null;
    }
    const { data, error } = await this.supabase
      .from('projects')
      .select(
        'id, owner_id, name, description, color, icon, is_active, is_inbox, project_type, ancestor_id, task_view, project_members(user_id)'
      )
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('[Projects] Failed to fetch project', error);
      return null;
    }
    const row = data as ProjectRow;
    return {
      id: row.id,
      ownerId: row.owner_id,
      name: row.name,
      description: row.description ?? '',
      color: row.color ?? '#394264',
      icon: row.icon ?? 'tick',
      isActive: row.is_active,
      isInbox: row.is_inbox,
      projectType: row.project_type ?? 'active',
      ancestorId: row.ancestor_id,
      taskView: row.task_view ?? 'extended',
      shareWithIds: row.project_members?.map((m) => m.user_id) ?? [],
    };
  }

  private async ensureInboxProject(ownerId: string): Promise<void> {
    if (!this.supabase) {
      return;
    }
    if (
      this.ensureInboxInFlight.has(ownerId) ||
      this.ensuredInboxOwners.has(ownerId)
    ) {
      return;
    }

    this.ensureInboxInFlight.add(ownerId);
    try {
      await this.refresh();
      const projects = this.projects();
      const existingInbox = projects.find(
        (project) => project.ownerId === ownerId && project.isInbox
      );
      if (existingInbox) {
        this.ensuredInboxOwners.add(ownerId);
        return;
      }

      const candidate = projects.find(
        (project) =>
          project.ownerId === ownerId &&
          (project.projectType?.toLowerCase() === 'inbox' ||
            project.name.trim().toLowerCase() === 'inbox')
      );
      if (candidate) {
        await this.updateProject({ id: candidate.id, isInbox: true });
        this.ensuredInboxOwners.add(ownerId);
        return;
      }

      const created = await this.createProject({
        ownerId,
        name: 'Inbox',
        isInbox: true,
        projectType: 'active',
        icon: 'inbox',
        color: '#394264',
        isActive: true,
      });
      if (created) {
        this.ensuredInboxOwners.add(ownerId);
      }
    } finally {
      this.ensureInboxInFlight.delete(ownerId);
    }
  }

  private async broadcastShareChanges(previous: Project, current: Project) {
    const functionsUrl = this.supabaseConfig?.functionsUrl;
    if (!functionsUrl || !this.supabase) {
      return;
    }
    const headers = await this.getFunctionAuthHeaders();
    if (!headers) {
      return;
    }
    const added = current.shareWithIds.filter(
      (id) => !previous.shareWithIds.includes(id)
    );
    const removed = previous.shareWithIds.filter(
      (id) => !current.shareWithIds.includes(id)
    );

    const requests: Promise<Response>[] = [];
    if (added.length) {
      requests.push(
        fetch(`${functionsUrl}/project-update`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            projectId: current.id,
            event: 'shared',
            title: 'New shared project',
            description: `Project "${current.name}" has been shared with you.`,
            recipients: added,
          }),
        })
      );
    }
    if (removed.length) {
      requests.push(
        fetch(`${functionsUrl}/project-update`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            projectId: current.id,
            event: 'removed',
            title: 'Shared project update',
            description: `You are no longer part of project "${current.name}".`,
            recipients: removed,
          }),
        })
      );
    }

    if (requests.length) {
      for await (const response of requests) {
        if (!response.ok) {
          console.warn(
            '[Projects] Project update function returned error',
            await response.text()
          );
        }
      }
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
        '[Projects] Missing active Supabase session; skipping edge function call.',
        error
      );
      return null;
    }
    const anonKey = this.supabaseConfig?.anonKey?.trim();
    if (!anonKey) {
      console.warn(
        '[Projects] Missing Supabase anon key; skipping edge function call.'
      );
      return null;
    }
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      // Authorization must carry a user session JWT for verify_jwt=true functions.
      Authorization: `Bearer ${accessToken}`,
      apikey: anonKey,
      // Function body verifies end-user identity from session JWT.
      'x-user-jwt': accessToken,
    };
    return headers;
  }
}
