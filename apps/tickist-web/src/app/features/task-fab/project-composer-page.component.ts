import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ProjectDataService } from '../../data/project-data.service';
import { AppViewStateService } from '../app-shell/app-view-state.service';
import {
  ProjectComposerPreset,
  ProjectComposerMode,
} from './composer-modal.service';
import { ProjectComposerComponent } from './project-composer.component';

@Component({
  selector: 'app-project-composer-page',
  imports: [ProjectComposerComponent],
  templateUrl: './project-composer-page.component.html',
  styleUrl: './composer-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectComposerPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly projects = inject(ProjectDataService);
  private readonly viewState = inject(AppViewStateService);

  readonly preset = computed<ProjectComposerPreset | null>(() => {
    const projectId = this.route.snapshot.paramMap.get('projectId');
    if (projectId) {
      const project =
        this.projects.list().find((item) => item.id === projectId) ?? null;
      return project ? { mode: 'edit', project } : null;
    }

    const queryMap = this.route.snapshot.queryParamMap;
    return {
      mode: 'create' as ProjectComposerMode,
      defaults: {
        projectType: queryMap.get('projectType') ?? undefined,
        ancestorId: queryMap.get('ancestorId'),
        color: queryMap.get('color') ?? undefined,
        icon: queryMap.get('icon') ?? undefined,
      },
    };
  });

  async close(): Promise<void> {
    await this.router.navigateByUrl(
      this.viewState.lastNonSheetAppUrl() ?? '/app'
    );
  }
}
