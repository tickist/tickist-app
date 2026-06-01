import {
  Injectable,
  Injector,
  computed,
  inject,
  signal,
  effect,
} from '@angular/core';
import { SUPABASE_CLIENT, SUPABASE_CONFIG } from '../config/supabase.provider';
import { SupabaseSessionService } from '../features/auth/supabase-session.service';
import { StatisticsDataService } from './statistics-data.service';

const LEGACY_PROJECT_SELECT =
  'id, owner_id, name, description, color, icon, is_active, is_inbox, project_type, ancestor_id, task_view, default_priority, default_finish_date, default_type_finish_date, dialog_time_when_task_finished, project_members(project_id, user_id, role, invited_at)';
const LEGACY_MEMBERSHIP_SELECT =
  'project_id, user_id, role, invited_at, projects(id, name, owner_id, color, icon)';

export type ProjectMemberStatus = 'pending' | 'accepted' | 'declined';

export interface ProjectMember {
  projectId: string;
  userId: string;
  status: ProjectMemberStatus;
  role: string;
  invitedEmail: string | null;
  invitedProjectName: string | null;
  invitedBy: string | null;
  invitedAt: string | null;
  acceptedAt: string | null;
  declinedAt: string | null;
  projectName?: string | null;
  projectOwnerId?: string | null;
  projectColor?: string | null;
  projectIcon?: string | null;
}

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
  members: ProjectMember[];
  defaultPriority?: string;
  defaultFinishDate?: number | null;
  defaultTypeFinishDate?: number | null;
  dialogTimeWhenTaskFinished?: boolean;
}

export function isProjectSharedByMultipleMembers(
  project: Pick<Project, 'members'>
): boolean {
  return project.members.filter((member) => member.status === 'accepted')
    .length >= 2;
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

export type ProjectInviteResult =
  | {
      ok: true;
      code: 'invited' | 'already_pending' | 'already_member';
      member: { userId: string; email: string; status: ProjectMemberStatus };
    }
  | {
      ok: false;
      code: 'user_not_found';
      message: string;
    };

type ProjectMemberRow = {
  project_id: string;
  user_id: string;
  status?: ProjectMemberStatus | null;
  role?: string | null;
  invited_email?: string | null;
  invited_project_name?: string | null;
  invited_by?: string | null;
  invited_at?: string | null;
  accepted_at?: string | null;
  declined_at?: string | null;
  projects?:
    | {
        id: string;
        name: string;
        owner_id: string;
        color: string | null;
        icon: string | null;
      }
    | {
        id: string;
        name: string;
        owner_id: string;
        color: string | null;
        icon: string | null;
      }[]
    | null;
};

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
  project_members?: ProjectMemberRow[] | null;
};

@Injectable({ providedIn: 'root' })
export class ProjectDataService {
  private readonly supabase = inject(SUPABASE_CLIENT, { optional: true });
  private readonly supabaseConfig = inject(SUPABASE_CONFIG, { optional: true });
  private readonly session = inject(SupabaseSessionService);
  private readonly injector = inject(Injector);
  private readonly projects = signal<Project[]>([]);
  private readonly memberships = signal<ProjectMember[]>([]);
  private readonly loading = signal(false);
  private readonly ensuredInboxOwners = new Set<string>();
  private readonly ensureInboxInFlight = new Set<string>();
  private recoveringInvalidOwner = false;

  readonly projectsSignal = computed(() => this.projects());
  readonly membershipsSignal = computed(() => this.memberships());
  readonly pendingInvitesSignal = computed(() =>
    this.memberships().filter((member) => member.status === 'pending')
  );
  readonly loadingSignal = computed(() => this.loading());

  constructor() {
    if (this.supabase) {
      void this.refresh();
    }

    effect(() => {
      const user = this.session.user();
      if (!user) {
        this.projects.set([]);
        this.memberships.set([]);
        return;
      }
      void this.ensureInboxProject(user.id);
    });
  }

  list() {
    return this.projectsSignal();
  }

  membershipsList() {
    return this.membershipsSignal();
  }

  pendingInvites() {
    return this.pendingInvitesSignal();
  }

  async refresh(): Promise<void> {
    if (!this.supabase) {
      this.projects.set([]);
      this.memberships.set([]);
      this.loading.set(false);
      console.warn('[Projects] Supabase client missing; skipping fetch.');
      return;
    }

    this.loading.set(true);
    const { data, error } = await this.supabase
      .from('projects')
      .select(LEGACY_PROJECT_SELECT);

    if (error || !data) {
      console.warn('[Projects] Unable to fetch from Supabase yet.', error);
      this.loading.set(false);
      return;
    }

    this.projects.set(
      (data as ProjectRow[]).map((row) => this.mapProjectRow(row))
    );
    await this.refreshMemberships();
    this.loading.set(false);
  }

  async refreshMemberships(): Promise<void> {
    if (!this.supabase) {
      this.memberships.set([]);
      return;
    }
    const { data, error } = await this.supabase
      .from('project_members')
      .select(LEGACY_MEMBERSHIP_SELECT)
      .order('invited_at', { ascending: false });
    if (error || !data) {
      console.warn('[Projects] Unable to fetch memberships.', error);
      return;
    }
    this.memberships.set(
      (data as unknown as ProjectMemberRow[]).map((row) =>
        this.mapMemberRow(row)
      )
    );
  }

  async inviteByEmail(
    projectId: string,
    email: string
  ): Promise<ProjectInviteResult | null> {
    const functionsUrl = this.supabaseConfig?.functionsUrl;
    if (!functionsUrl || !this.supabase) {
      return null;
    }
    const headers = await this.getFunctionAuthHeaders();
    if (!headers) {
      return null;
    }
    const response = await fetch(`${functionsUrl}/project-invite`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ projectId, email }),
    });
    const body = (await response.json().catch(() => null)) as unknown;
    if (!response.ok) {
      const errorBody = asErrorBody(body);
      throw new Error(errorBody.message ?? errorBody.error ?? 'Invite failed.');
    }
    await this.refresh();
    return body as ProjectInviteResult;
  }

  async respondToInvite(
    projectId: string,
    status: 'accepted' | 'declined'
  ): Promise<boolean> {
    const userId = this.session.user()?.id;
    if (!this.supabase || !userId) {
      return false;
    }
    const patch =
      status === 'accepted'
        ? {
            status,
            accepted_at: new Date().toISOString(),
            declined_at: null,
          }
        : {
            status,
            declined_at: new Date().toISOString(),
          };
    const { error } = await this.supabase
      .from('project_members')
      .update(patch)
      .eq('project_id', projectId)
      .eq('user_id', userId);
    if (error) {
      console.error('[Projects] Failed to respond to invite', error);
      return false;
    }
    await this.refresh();
    return true;
  }

  async leaveSharedProject(projectId: string): Promise<boolean> {
    const userId = this.session.user()?.id;
    if (!this.supabase || !userId) {
      return false;
    }
    const { error } = await this.supabase
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId);
    if (error) {
      console.error('[Projects] Failed to leave shared project', error);
      return false;
    }
    await this.refresh();
    return true;
  }

  async removeMember(projectId: string, userId: string): Promise<boolean> {
    if (!this.supabase) {
      return false;
    }
    const { error } = await this.supabase
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId);
    if (error) {
      console.error('[Projects] Failed to remove project member', error);
      return false;
    }
    await this.refresh();
    return true;
  }

  async createProject(input: ProjectCreateInput): Promise<Project | null> {
    if (!input.ownerId) {
      throw new Error('ownerId is required to create a project');
    }
    if (!this.supabase) {
      console.warn(
        '[Projects] Supabase client missing; cannot create project.'
      );
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
        icon: rest.icon ?? 'folder',
        is_inbox: rest.isInbox ?? false,
        project_type: rest.projectType ?? 'active',
        is_active: rest.isActive ?? true,
        ancestor_id: rest.ancestorId ?? null,
        task_view: rest.taskView ?? 'extended',
        default_priority: rest.defaultPriority ?? 'B',
        default_finish_date: rest.defaultFinishDate ?? null,
        default_type_finish_date: rest.defaultTypeFinishDate ?? 0,
        dialog_time_when_task_finished:
          rest.dialogTimeWhenTaskFinished ?? false,
      })
      .select('id')
      .single();

    if (error || !data) {
      await this.handleOwnerConstraintError(error, input.ownerId);
      if (rest.isInbox && isDuplicateInboxError(error)) {
        const existingInbox = await this.fetchInboxProjectByOwner(input.ownerId);
        if (existingInbox) {
          this.upsertCachedProject(existingInbox);
          await this.refreshMemberships();
          return existingInbox;
        }
      }
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
            status: 'accepted',
            accepted_at: new Date().toISOString(),
          }))
        )
        .throwOnError();
    }
    for (const email of shareInvites) {
      await this.inviteByEmail(data.id, email);
    }

    this.markStatisticsDirty();
    const created = await this.fetchProjectById(data.id);
    if (created) {
      this.upsertCachedProject(created);
    }
    await this.refreshMemberships();
    return created;
  }

  async updateProject(input: ProjectUpdateInput): Promise<Project | null> {
    const previous = this.projects().find((project) => project.id === input.id);

    if (!this.supabase) {
      console.warn(
        '[Projects] Supabase client missing; cannot update project.'
      );
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
      payload.dialog_time_when_task_finished = rest.dialogTimeWhenTaskFinished;

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
      const previousShareWithIds = previous?.shareWithIds ?? [];
      const removed = previousShareWithIds.filter(
        (id) => !shareWithIds.includes(id)
      );
      const added = shareWithIds.filter(
        (id) => !previousShareWithIds.includes(id)
      );

      if (removed.length) {
        await this.notifyProjectShareChange({
          projectId: input.id,
          event: 'removed',
          recipients: removed,
          projectName: rest.name ?? previous?.name ?? 'Project',
        });
      }

      await this.supabase
        .from('project_members')
        .delete()
        .eq('project_id', input.id);
      if (shareWithIds.length) {
        await this.supabase.from('project_members').insert(
          shareWithIds.map((userId) => ({
            project_id: input.id,
            user_id: userId,
            status: 'accepted',
            accepted_at: new Date().toISOString(),
          }))
        );
      }

      if (added.length) {
        await this.notifyProjectShareChange({
          projectId: input.id,
          event: 'shared',
          recipients: added,
          projectName: rest.name ?? previous?.name ?? 'Project',
        });
      }
    }

    this.markStatisticsDirty();
    const updated = await this.fetchProjectById(input.id);
    if (updated) {
      this.projects.set(
        this.projects().map((project) =>
          project.id === updated.id ? updated : project
        )
      );
    }
    await this.refreshMemberships();
    return updated;
  }

  private upsertCachedProject(project: Project): void {
    const projects = this.projects();
    if (projects.some((item) => item.id === project.id)) {
      this.projects.set(
        projects.map((item) => (item.id === project.id ? project : item))
      );
      return;
    }
    this.projects.set([...projects, project]);
  }

  async deleteProject(projectId: string): Promise<boolean> {
    if (!this.supabase) {
      console.warn(
        '[Projects] Supabase client missing; cannot delete project.'
      );
      return false;
    }

    const cachedProject =
      this.projects().find((project) => project.id === projectId) ?? null;
    let ownerId = cachedProject?.ownerId ?? null;
    let isInbox = cachedProject?.isInbox ?? false;

    if (!cachedProject) {
      const { data: projectData, error: projectFetchError } =
        await this.supabase
          .from('projects')
          .select('owner_id, is_inbox')
          .eq('id', projectId)
          .maybeSingle();
      if (projectFetchError) {
        console.error(
          '[Projects] Failed to inspect project before delete',
          projectFetchError
        );
        return false;
      }
      if (!projectData) {
        console.warn('[Projects] Project not found before delete', {
          projectId,
        });
        return false;
      }
      const row = projectData as { owner_id: string; is_inbox: boolean };
      ownerId = row.owner_id;
      isInbox = row.is_inbox;
    }

    if (isInbox) {
      console.warn('[Projects] Inbox project cannot be deleted.', {
        projectId,
        ownerId,
      });
      return false;
    }

    const { error } = await this.supabase
      .from('projects')
      .delete()
      .eq('id', projectId);
    if (error) {
      console.error('[Projects] Failed to delete project', error);
      return false;
    }
    this.projects.set(
      this.projects().filter((project) => project.id !== projectId)
    );
    this.markStatisticsDirty();
    if (ownerId && isInbox) {
      this.ensuredInboxOwners.delete(ownerId);
    }
    await this.refreshMemberships();
    return true;
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
      this.memberships.set([]);
      this.ensuredInboxOwners.delete(ownerId);
      await this.session.signOut();
    } finally {
      this.recoveringInvalidOwner = false;
    }
  }

  private async fetchProjectById(id: string): Promise<Project | null> {
    if (!this.supabase) {
      return this.projects().find((project) => project.id === id) ?? null;
    }
    const { data, error } = await this.supabase
      .from('projects')
      .select(LEGACY_PROJECT_SELECT)
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('[Projects] Failed to fetch project', error);
      return null;
    }
    return this.mapProjectRow(data as ProjectRow);
  }

  private async fetchInboxProjectByOwner(ownerId: string): Promise<Project | null> {
    if (!this.supabase) {
      return (
        this.projects().find(
          (project) => project.ownerId === ownerId && project.isInbox
        ) ?? null
      );
    }

    const initialResult = await this.supabase
      .from('projects')
      .select(LEGACY_PROJECT_SELECT)
      .eq('owner_id', ownerId)
      .eq('is_inbox', true)
      .maybeSingle();
    const data: unknown = initialResult.data;
    const error = initialResult.error;

    if (error || !data) {
      console.error('[Projects] Failed to fetch existing inbox project', error);
      return null;
    }
    return this.mapProjectRow(data as ProjectRow);
  }

  private mapProjectRow(row: ProjectRow): Project {
    const members =
      row.project_members?.map((member) =>
        this.mapMemberRow(member, {
          id: row.id,
          name: row.name,
          owner_id: row.owner_id,
          color: row.color,
          icon: row.icon,
        })
      ) ?? [];
    return {
      id: row.id,
      ownerId: row.owner_id,
      name: row.name,
      description: row.description ?? '',
      color: row.color ?? '#394264',
      icon: row.icon ?? 'folder',
      isActive: row.is_active,
      isInbox: row.is_inbox,
      projectType: row.project_type ?? 'active',
      ancestorId: row.ancestor_id,
      taskView: row.task_view ?? 'extended',
      defaultPriority: row.default_priority ?? undefined,
      defaultFinishDate: row.default_finish_date ?? undefined,
      defaultTypeFinishDate: row.default_type_finish_date ?? undefined,
      dialogTimeWhenTaskFinished:
        row.dialog_time_when_task_finished ?? undefined,
      members,
      shareWithIds: members
        .filter((member) => member.status === 'accepted')
        .map((member) => member.userId),
    };
  }

  private mapMemberRow(
    row: ProjectMemberRow,
    project?: ProjectMemberRow['projects']
  ): ProjectMember {
    const resolvedProject = normalizeProjectRelation(project ?? row.projects);
    return {
      projectId: row.project_id,
      userId: row.user_id,
      status: row.status ?? 'accepted',
      role: row.role ?? 'editor',
      invitedEmail: row.invited_email ?? null,
      invitedProjectName: row.invited_project_name ?? null,
      invitedBy: row.invited_by ?? null,
      invitedAt: row.invited_at ?? null,
      acceptedAt: row.accepted_at ?? null,
      declinedAt: row.declined_at ?? null,
      projectName: resolvedProject?.name ?? row.invited_project_name,
      projectOwnerId: resolvedProject?.owner_id ?? null,
      projectColor: resolvedProject?.color ?? null,
      projectIcon: resolvedProject?.icon ?? null,
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

  private async notifyProjectShareChange(input: {
    projectId: string;
    event: 'shared' | 'removed';
    recipients: string[];
    projectName: string;
  }) {
    const functionsUrl = this.supabaseConfig?.functionsUrl;
    if (!functionsUrl || !this.supabase) {
      return;
    }
    const headers = await this.getFunctionAuthHeaders();
    if (!headers) {
      return;
    }
    if (!input.recipients.length) {
      return;
    }

    const response = await fetch(`${functionsUrl}/project-update`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        projectId: input.projectId,
        event: input.event,
        title:
          input.event === 'shared'
            ? 'New shared project'
            : 'Shared project update',
        description:
          input.event === 'shared'
            ? `Project "${input.projectName}" has been shared with you.`
            : `You are no longer part of project "${input.projectName}".`,
        recipients: input.recipients,
      }),
    });
    if (!response.ok) {
      console.warn(
        '[Projects] Project update function returned error',
        await response.text()
      );
    }
  }

  private async getFunctionAuthHeaders(): Promise<Record<
    string,
    string
  > | null> {
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
    const publishableKey = (
      this.supabaseConfig?.publishableKey ??
      this.supabaseConfig?.anonKey ??
      ''
    ).trim();
    if (!publishableKey) {
      console.warn(
        '[Projects] Missing Supabase publishable key; skipping edge function call.'
      );
      return null;
    }
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      apikey: publishableKey,
      'x-user-jwt': accessToken,
    };
  }

  private markStatisticsDirty(): void {
    this.injector.get(StatisticsDataService, null)?.markDirty();
  }
}

function normalizeProjectRelation(
  value: ProjectMemberRow['projects']
): Exclude<ProjectMemberRow['projects'], unknown[] | null | undefined> | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
}

function asErrorBody(value: unknown): { error?: string; message?: string } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {};
  }
  const record = value as Record<string, unknown>;
  return {
    error: typeof record['error'] === 'string' ? record['error'] : undefined,
    message:
      typeof record['message'] === 'string' ? record['message'] : undefined,
  };
}

function isDuplicateInboxError(
  error: { code?: string; message?: string } | null
): boolean {
  return (
    error?.code === '23505' &&
    (error.message ?? '').includes('projects_owner_single_inbox_idx')
  );
}
