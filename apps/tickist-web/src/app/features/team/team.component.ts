import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ProjectDataService, ProjectMember } from '../../data/project-data.service';
import { SupabaseSessionService } from '../auth/supabase-session.service';
import { ToastService } from '../../core/ui/toast.service';
import { RouterLink } from '@angular/router';
import { TaskDataService } from '../../data/task-data.service';

type TeamProject = {
  projectId: string;
  projectName: string;
  teammateLabel: string;
  ownerId: string | null;
  canLeave: boolean;
};

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './team.component.html',
  styleUrl: './team.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamComponent {
  private readonly projects = inject(ProjectDataService);
  private readonly session = inject(SupabaseSessionService);
  private readonly toasts = inject(ToastService);
  private readonly tasks = inject(TaskDataService);

  readonly user = computed(() => this.session.user());
  readonly pendingInvites = computed(() =>
    this.projects
      .pendingInvites()
      .filter((member) => member.userId === this.user()?.id)
  );
  readonly sharedProjects = computed<TeamProject[]>(() => {
    const userId = this.user()?.id;
    if (!userId) {
      return [];
    }
    const rows: TeamProject[] = [];
    for (const project of this.projects.list()) {
      if (!project.members.length) {
        continue;
      }
      if (project.ownerId === userId) {
        for (const member of project.members) {
          if (member.status !== 'accepted') {
            continue;
          }
          rows.push({
            projectId: project.id,
            projectName: project.name,
            teammateLabel: member.invitedEmail ?? member.userId.slice(0, 8),
            ownerId: project.ownerId,
            canLeave: false,
          });
        }
        continue;
      }
      const currentMember = project.members.find(
        (member) => member.userId === userId && member.status === 'accepted'
      );
      if (currentMember) {
        rows.push({
          projectId: project.id,
          projectName: project.name,
          teammateLabel: 'Project owner',
          ownerId: project.ownerId,
          canLeave: true,
        });
      }
    }
    return rows.sort((a, b) => a.projectName.localeCompare(b.projectName));
  });

  async acceptInvite(invite: ProjectMember): Promise<void> {
    const accepted = await this.projects.respondToInvite(
      invite.projectId,
      'accepted'
    );
    if (accepted) {
      await this.tasks.refresh();
      this.toasts.success('Shared list accepted.');
    } else {
      this.toasts.error('Could not accept invite.');
    }
  }

  async declineInvite(invite: ProjectMember): Promise<void> {
    const declined = await this.projects.respondToInvite(
      invite.projectId,
      'declined'
    );
    if (declined) {
      this.toasts.info('Invite declined.');
    } else {
      this.toasts.error('Could not decline invite.');
    }
  }

  async leave(project: TeamProject): Promise<void> {
    const confirmed = confirm(`Leave "${project.projectName}"?`);
    if (!confirmed) {
      return;
    }
    const left = await this.projects.leaveSharedProject(project.projectId);
    if (left) {
      await this.tasks.refresh();
      this.toasts.info('You left the shared list.');
    } else {
      this.toasts.error('Could not leave shared list.');
    }
  }
}
