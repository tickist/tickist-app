import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { SUPABASE_CLIENT } from '../config/supabase.provider';
import { SupabaseSessionService } from '../features/auth/supabase-session.service';
import type { Project } from './project-data.service';
import type { Task } from './task-data.service';

export interface Workspace {
  id: string;
  name: string;
  kind: 'work' | 'private' | null;
}

type WorkspaceRow = { id: string; name: string; kind: Workspace['kind'] };
type MemberWorkspaceRow = { project_id: string; workspace_id: string };

export function effectiveWorkspaceId(
  project: Pick<
    Project,
    'id' | 'ownerId' | 'isInbox' | 'workspaceId' | 'ancestorId'
  >,
  userId: string | null,
  memberAssignments: ReadonlyMap<string, string>,
  privateWorkspaceId: string | null,
  projects: readonly Pick<Project, 'id' | 'ownerId' | 'ancestorId'>[] = []
): string | null {
  if (project.isInbox) return null;
  if (project.ownerId === userId)
    return project.workspaceId ?? privateWorkspaceId;
  const seen = new Set<string>();
  let current: Pick<Project, 'id' | 'ownerId' | 'ancestorId'> | undefined =
    project;
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    const assignment = memberAssignments.get(current.id);
    if (assignment) return assignment;
    current = projects.find(
      (item) =>
        item.id === current?.ancestorId && item.ownerId === project.ownerId
    );
  }
  return privateWorkspaceId;
}

@Injectable({ providedIn: 'root' })
export class WorkspaceDataService {
  private readonly supabase = inject(SUPABASE_CLIENT, { optional: true });
  private readonly session = inject(SupabaseSessionService);
  private readonly rows = signal<Workspace[]>([]);
  private readonly memberAssignments = signal<Map<string, string>>(new Map());
  private readonly selectedId = signal<string | null>(null);

  readonly list = this.rows.asReadonly();
  readonly selectedWorkspaceId = this.selectedId.asReadonly();
  readonly privateWorkspaceId = computed(
    () =>
      this.rows().find((workspace) => workspace.kind === 'private')?.id ?? null
  );

  constructor() {
    effect(() => {
      const userId = this.session.user()?.id;
      this.rows.set([]);
      this.memberAssignments.set(new Map());
      this.selectedId.set(null);
      if (userId) void this.refresh(userId);
    });
  }

  async refresh(userId = this.session.user()?.id): Promise<void> {
    if (!this.supabase || !userId) return;
    const [workspaceResult, assignmentResult] = await Promise.all([
      this.supabase
        .from('workspaces')
        .select('id, name, kind')
        .eq('owner_id', userId),
      this.supabase
        .from('member_project_workspaces')
        .select('project_id, workspace_id')
        .eq('user_id', userId),
    ]);
    if (this.session.user()?.id !== userId) return;
    if (workspaceResult.error || assignmentResult.error) {
      console.error(
        '[Workspaces] Failed to load workspaces',
        workspaceResult.error ?? assignmentResult.error
      );
      return;
    }
    const workspaces = (workspaceResult.data as WorkspaceRow[]).sort((a, b) => {
      const order = (kind: Workspace['kind']) =>
        kind === 'work' ? 0 : kind === 'private' ? 1 : 2;
      return order(a.kind) - order(b.kind) || a.name.localeCompare(b.name);
    });
    this.rows.set(workspaces);
    this.memberAssignments.set(
      new Map(
        (assignmentResult.data as MemberWorkspaceRow[]).map((row) => [
          row.project_id,
          row.workspace_id,
        ])
      )
    );
    const storedId =
      typeof localStorage === 'undefined'
        ? null
        : localStorage.getItem(`tickist-workspace:${userId}`);
    this.selectedId.set(
      storedId && workspaces.some((workspace) => workspace.id === storedId)
        ? storedId
        : null
    );
  }

  select(workspaceId: string | null): void {
    const userId = this.session.user()?.id;
    if (
      !userId ||
      (workspaceId &&
        !this.rows().some((workspace) => workspace.id === workspaceId))
    )
      return;
    this.selectedId.set(workspaceId);
    if (typeof localStorage !== 'undefined') {
      if (workspaceId)
        localStorage.setItem(`tickist-workspace:${userId}`, workspaceId);
      else localStorage.removeItem(`tickist-workspace:${userId}`);
    }
  }

  workspaceFor(
    project: Project,
    projects: readonly Project[] = []
  ): string | null {
    return effectiveWorkspaceId(
      project,
      this.session.user()?.id ?? null,
      this.memberAssignments(),
      this.privateWorkspaceId(),
      projects
    );
  }

  includesProject(
    project: Project,
    projects: readonly Project[] = []
  ): boolean {
    return (
      project.isInbox ||
      this.selectedId() === null ||
      this.workspaceFor(project, projects) === this.selectedId()
    );
  }

  includesTask(task: Task, projects: readonly Project[]): boolean {
    if (!task.projectId || this.selectedId() === null) return true;
    const project = projects.find((item) => item.id === task.projectId);
    return project ? this.includesProject(project, projects) : false;
  }

  async create(name: string): Promise<string | null> {
    const userId = this.session.user()?.id;
    if (!this.supabase || !userId) return 'Sign in to create a workspace.';
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 80)
      return 'Use a name of 1 to 80 characters.';
    const { error } = await this.supabase
      .from('workspaces')
      .insert({ owner_id: userId, name: trimmed });
    if (error)
      return error.code === '23505'
        ? 'A workspace with this name already exists.'
        : 'Could not create workspace.';
    await this.refresh(userId);
    return null;
  }

  async rename(workspaceId: string, name: string): Promise<string | null> {
    if (!this.supabase || !this.rows().some((row) => row.id === workspaceId))
      return 'Workspace not found.';
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 80)
      return 'Use a name of 1 to 80 characters.';
    const { error } = await this.supabase
      .from('workspaces')
      .update({ name: trimmed })
      .eq('id', workspaceId);
    if (error)
      return error.code === '23505'
        ? 'A workspace with this name already exists.'
        : 'Could not rename workspace.';
    await this.refresh();
    return null;
  }

  async assignSharedProjects(
    projectIds: readonly string[],
    workspaceId: string
  ): Promise<boolean> {
    const userId = this.session.user()?.id;
    if (
      !this.supabase ||
      !userId ||
      !this.rows().some((workspace) => workspace.id === workspaceId)
    )
      return false;
    const { error } = await this.supabase
      .from('member_project_workspaces')
      .upsert(
        projectIds.map((projectId) => ({
          project_id: projectId,
          user_id: userId,
          workspace_id: workspaceId,
        }))
      );
    if (error) return false;
    this.memberAssignments.update((current) => {
      const next = new Map(current);
      for (const projectId of projectIds) next.set(projectId, workspaceId);
      return next;
    });
    return true;
  }
}
