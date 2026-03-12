import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { TaskDataService } from '../../data/task-data.service';
import { TaskComposerComponent } from './task-composer.component';
import { AppViewStateService } from '../app-shell/app-view-state.service';
import { TaskComposerPreset } from './composer-modal.service';

@Component({
  selector: 'app-task-composer-page',
  imports: [TaskComposerComponent],
  templateUrl: './task-composer-page.component.html',
  styleUrl: './composer-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskComposerPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly tasks = inject(TaskDataService);
  private readonly viewState = inject(AppViewStateService);

  readonly preset = computed<TaskComposerPreset | null>(() => {
    const taskId = this.route.snapshot.paramMap.get('taskId');
    if (taskId) {
      const task = this.tasks.list().find((item) => item.id === taskId) ?? null;
      return task ? { mode: 'edit', task } : null;
    }

    const queryMap = this.route.snapshot.queryParamMap;
    const tags = queryMap.get('tags');
    return {
      mode: 'create',
      defaults: {
        projectId: queryMap.get('projectId'),
        priority: queryMap.get('priority') ?? undefined,
        tags: tags
          ? tags
              .split(',')
              .map((value) => value.trim())
              .filter((value) => value.length > 0)
          : undefined,
      },
    };
  });

  async close(): Promise<void> {
    await this.router.navigateByUrl(
      this.viewState.lastNonSheetAppUrl() ?? '/app'
    );
  }
}
