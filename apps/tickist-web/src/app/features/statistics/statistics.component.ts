import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
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
export class StatisticsComponent implements OnInit, OnDestroy {
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
        value: overview.summary.completedCount,
        badgeClass: 'badge badge-success badge-outline',
      },
      {
        key: 'completed-late',
        label: 'Completed late',
        value: overview.summary.completedLateCount,
        badgeClass: 'badge badge-warning badge-outline',
      },
      {
        key: 'overdue-open',
        label: 'Open overdue',
        value: overview.summary.openOverdueCount,
        badgeClass: 'badge badge-error badge-outline',
      },
      {
        key: 'inactive-projects',
        label: 'Inactive projects',
        value: overview.summary.inactiveProjectsCount,
        badgeClass: 'badge badge-outline',
      },
    ];
  });
  readonly groups = computed(() => this.overview().groups);
  readonly title = computed(
    () => `Last ${this.overview().windowDays} days`
  );

  ngOnInit(): void {
    this.statistics.activate();
  }

  ngOnDestroy(): void {
    this.statistics.deactivate();
  }

  retry(): void {
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
