import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { TaskDataService } from '../../data/task-data.service';
import {
  TimeEntry,
  TimeTrackingService,
  elapsedSecondsAt,
  formatDuration,
} from '../../data/time-tracking.service';
import {
  shiftDateKey,
  zonedDateKey,
  zonedDateTimeToIso,
  zonedTimeLabel,
} from '../../core/time/zoned-time';

interface EntryDraft {
  date: string;
  from: string;
  to: string;
  note: string;
}

/** The caller's time entries for one task, with add, edit and delete. */
@Component({
  selector: 'app-task-time-entries',
  standalone: true,
  templateUrl: './task-time-entries.component.html',
  styleUrl: './task-time-entries.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskTimeEntriesComponent {
  readonly taskId = input.required<string>();
  /** Date a new entry starts on; today when not given. */
  readonly defaultDate = input<string | null>(null);
  /** Emits after an entry was added, edited or deleted. */
  readonly changed = output<void>();

  private readonly timer = inject(TimeTrackingService);
  private readonly tasks = inject(TaskDataService);

  readonly entries = signal<TimeEntry[]>([]);
  readonly editingId = signal<string | null>(null);
  readonly adding = signal(false);
  readonly saving = signal(false);
  readonly draft = signal<EntryDraft>(this.emptyDraft());

  readonly totalLabel = computed(() =>
    formatDuration(
      (this.tasks.list().find((task) => task.id === this.taskId())
        ?.spentMinutes ?? 0) * 60
    )
  );

  constructor() {
    effect(() => {
      const taskId = this.taskId();

      // Reload when the timer starts or stops on any task.
      this.timer.running();
      untracked(() => {
        void this.load(taskId);
      });
    });
  }

  dateLabel(entry: TimeEntry): string {
    return zonedDateKey(new Date(entry.startedAt), this.timer.timezone());
  }

  rangeLabel(entry: TimeEntry): string {
    const timezone = this.timer.timezone();
    const from = zonedTimeLabel(new Date(entry.startedAt), timezone);

    if (!entry.endedAt) return `${from} – running`;

    return `${from} – ${zonedTimeLabel(new Date(entry.endedAt), timezone)}`;
  }

  durationLabel(entry: TimeEntry): string {
    return formatDuration(elapsedSecondsAt(entry, Date.now()));
  }

  startAdding(): void {
    this.editingId.set(null);
    this.draft.set(this.emptyDraft());
    this.adding.set(true);
  }

  startEditing(entry: TimeEntry): void {
    if (!entry.endedAt) return;
    const timezone = this.timer.timezone();

    this.adding.set(false);
    this.editingId.set(entry.id);
    this.draft.set({
      date: zonedDateKey(new Date(entry.startedAt), timezone),
      from: zonedTimeLabel(new Date(entry.startedAt), timezone),
      to: zonedTimeLabel(new Date(entry.endedAt), timezone),
      note: entry.note ?? '',
    });
  }

  cancel(): void {
    this.adding.set(false);
    this.editingId.set(null);
  }

  updateDraft(field: keyof EntryDraft, event: Event): void {
    const target = event.target;

    if (target instanceof HTMLInputElement) {
      this.draft.update((current) => ({ ...current, [field]: target.value }));
    }
  }

  async save(): Promise<void> {
    const range = draftToRange(this.draft(), this.timer.timezone());

    if (!range) return;
    this.saving.set(true);

    try {
      const input = {
        taskId: this.taskId(),
        ...range,
        note: this.draft().note,
      };

      const editingId = this.editingId();

      const saved = editingId
        ? await this.timer.updateEntry(editingId, input)
        : await this.timer.createEntry(input);

      if (saved) {
        this.cancel();
        await this.load(this.taskId());
        this.changed.emit();
      }
    } finally {
      this.saving.set(false);
    }
  }

  async remove(entry: TimeEntry): Promise<void> {
    if (!confirm('Delete this time entry?')) return;

    if (await this.timer.deleteEntry(entry.id)) {
      await this.load(this.taskId());
      this.changed.emit();
    }
  }

  draftValid(): boolean {
    return draftToRange(this.draft(), this.timer.timezone()) !== null;
  }

  private async load(taskId: string): Promise<void> {
    this.entries.set(await this.timer.listTaskEntries(taskId));
  }

  private emptyDraft(): EntryDraft {
    return {
      date: this.defaultDate() ?? this.timer.todayKey(),
      from: '',
      to: '',
      note: '',
    };
  }
}

/**
 * Converts a date and wall-clock range to instants. An end at or before the
 * start means the work ran past midnight.
 */
export function draftToRange(
  draft: { date: string; from: string; to: string },
  timezone: string
): { startedAt: string; endedAt: string } | null {
  if (!draft.date || !draft.from || !draft.to) return null;

  const endDate =
    draft.to <= draft.from ? shiftDateKey(draft.date, 1) : draft.date;

  const startedAt = zonedDateTimeToIso(draft.date, draft.from, timezone);
  const endedAt = zonedDateTimeToIso(endDate, draft.to, timezone);

  if (!startedAt || !endedAt || Date.parse(endedAt) <= Date.parse(startedAt)) {
    return null;
  }

  return { startedAt, endedAt };
}
