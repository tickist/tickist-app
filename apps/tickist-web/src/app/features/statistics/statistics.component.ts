import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  type InactiveProjectStat,
  StatisticsDataService,
} from '../../data/statistics-data.service';
import { ProjectIconComponent } from '../../core/ui/project-icon.component';

interface SummaryCard {
  key: string;
  label: string;
  hint: string;
  value: number;
  badgeClass: string;
}

@Component({
  selector: 'app-statistics',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, ProjectIconComponent],
  templateUrl: './statistics.component.html',
  styleUrl: './statistics.component.css',
})
export class StatisticsComponent {
  private readonly statistics = inject(StatisticsDataService);

  readonly overview = this.statistics.overview;
  readonly loading = this.statistics.loading;
  readonly error = this.statistics.error;
  readonly summaryCards = computed<SummaryCard[]>(() => {
    const overview = this.overview();
    return [
      {
        key: 'completed',
        label: 'Completed',
        hint: `Done in the last ${overview.windowDays} days`,
        value: overview.summary.completedCount,
        badgeClass: 'badge badge-success badge-outline',
      },
      {
        key: 'completed-late',
        label: 'Completed late',
        hint: 'Finished after the due date',
        value: overview.summary.completedLateCount,
        badgeClass: 'badge badge-warning badge-outline',
      },
      {
        key: 'overdue-open',
        label: 'Open overdue',
        hint: 'Still open and past due',
        value: overview.summary.openOverdueCount,
        badgeClass: 'badge badge-error badge-outline',
      },
      {
        key: 'inactive-projects',
        label: 'Inactive projects',
        hint: `No activity in ${overview.windowDays} days`,
        value: overview.summary.inactiveProjectsCount,
        badgeClass: 'badge badge-outline',
      },
    ];
  });
  readonly groups = computed(() => this.overview().groups);

  refresh(): void {
    void this.statistics.refresh();
  }

  staleLabel(days: number): string {
    return days === 1 ? '1 day inactive' : `${days} days inactive`;
  }

  trackCard(_index: number, card: SummaryCard): string {
    return card.key;
  }

  trackGroup(_index: number, group: { key: string }): string {
    return group.key;
  }

  trackProject(_index: number, project: InactiveProjectStat): string {
    return project.projectId;
  }
}
