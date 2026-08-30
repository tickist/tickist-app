import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Task, TaskDataService } from '../../data/task-data.service';
import { TaskReminderDataService } from '../../data/task-reminder-data.service';
import { ProjectDataService } from '../../data/project-data.service';
import { TagDataService } from '../../data/tag-data.service';
import { SupabaseSessionService } from '../auth/supabase-session.service';
import { TaskComposerComponent } from './task-composer.component';

describe('TaskComposerComponent repeat custom cadence', () => {
  let fixture: ComponentFixture<TaskComposerComponent>;
  let component: TaskComposerComponent;
  let createTaskMock: ReturnType<typeof vi.fn>;
  let updateTaskMock: ReturnType<typeof vi.fn>;
  let saveRemindersMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    createTaskMock = vi.fn(async () => createTask());
    updateTaskMock = vi.fn(async () => createTask());
    saveRemindersMock = vi.fn(async () => undefined);

    await TestBed.configureTestingModule({
      imports: [TaskComposerComponent],
      providers: [
        {
          provide: TaskDataService,
          useValue: {
            createTask: createTaskMock,
            updateTask: updateTaskMock,
            refresh: vi.fn(async () => undefined),
          },
        },
        {
          provide: ProjectDataService,
          useValue: {
            list: () => [
              {
                id: 'inbox',
                ownerId: 'owner-1',
                name: 'Inbox',
                description: '',
                color: '#394264',
                icon: 'tick',
                isActive: true,
                isInbox: true,
                projectType: 'active',
                ancestorId: null,
                taskView: 'extended',
                shareWithIds: [],
                members: [],
              },
              {
                id: 'shared-project',
                ownerId: 'owner-1',
                name: 'Shared project',
                description: '',
                color: '#394264',
                icon: 'users',
                isActive: true,
                isInbox: false,
                projectType: 'active',
                ancestorId: null,
                taskView: 'extended',
                shareWithIds: ['member-1'],
                members: [
                  {
                    projectId: 'shared-project',
                    userId: 'member-1',
                    status: 'accepted',
                    role: 'editor',
                    invitedEmail: 'bob@example.com',
                    invitedProjectName: 'Shared project',
                    invitedBy: 'owner-1',
                    invitedAt: null,
                    acceptedAt: null,
                    declinedAt: null,
                  },
                ],
                assignees: [
                  { userId: 'owner-1', label: 'Alice Owner' },
                  { userId: 'member-1', label: 'Bob Member' },
                ],
              },
            ],
          },
        },
        {
          provide: TagDataService,
          useValue: {
            list: () => [],
            createTag: vi.fn(async () => null),
          },
        },
        {
          provide: SupabaseSessionService,
          useValue: {
            user: () => ({
              id: 'owner-1',
              email: 'alice@example.com',
              user_metadata: { full_name: 'Alice Owner' },
            }),
          },
        },
        {
          provide: TaskReminderDataService,
          useValue: {
            listForTask: vi.fn(async () => []),
            saveForTask: saveRemindersMock,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskComposerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('stores custom 2 weeks as 14-day repeat interval', async () => {
    component.taskForm.patchValue({
      name: 'Plan sprint',
      repeatMode: 'custom',
      repeatEvery: 2,
      repeatUnit: 'week',
    });

    await component.submit();

    expect(createTaskMock).toHaveBeenCalledTimes(1);
    expect(createTaskMock).toHaveBeenCalledWith(
      expect.objectContaining({
        repeatInterval: 14,
      })
    );
  });

  it('stores custom 2 years as 730-day repeat interval', async () => {
    component.taskForm.patchValue({
      name: 'Renew license',
      repeatMode: 'custom',
      repeatEvery: 2,
      repeatUnit: 'year',
    });

    await component.submit();

    expect(createTaskMock).toHaveBeenCalledTimes(1);
    expect(createTaskMock).toHaveBeenCalledWith(
      expect.objectContaining({
        repeatInterval: 730,
      })
    );
  });

  it('shows member names and assigns a new shared task to its creator', async () => {
    component.preset = {
      mode: 'create',
      defaults: { projectId: 'shared-project' },
    };
    fixture.detectChanges();

    expect(component.assigneeOptions()).toEqual([
      { userId: 'owner-1', label: 'Alice Owner' },
      { userId: 'member-1', label: 'Bob Member' },
    ]);
    expect(component.taskForm.controls.assigneeId.value).toBe('owner-1');

    component.taskForm.controls.name.setValue('Shared task');
    await component.submit();

    expect(createTaskMock).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'shared-project',
        assigneeIds: ['owner-1'],
      })
    );
  });

  it('shows creation and modification timestamps only while editing', () => {
    component.selectTab('extra');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.task-history')).toBeNull();

    component.preset = {
      mode: 'edit',
      task: createTask({
        createdAt: '2026-08-01T08:15:00.000Z',
        updatedAt: '2026-08-09T17:45:00.000Z',
      }),
    };
    component.selectTab('extra');
    fixture.detectChanges();

    const history = fixture.nativeElement.querySelector('.task-history');
    expect(history).not.toBeNull();
    expect(history.textContent).toContain('Created');
    expect(history.textContent).toContain('Last modified');
    expect(history.textContent).toContain('2026');
    expect(history.querySelectorAll('time')).toHaveLength(2);
  });

  it('maps existing 14-day interval to custom 2 weeks in edit mode', () => {
    component.preset = {
      mode: 'edit',
      task: createTask({ repeatInterval: 14 }),
    };
    fixture.detectChanges();

    expect(component.taskForm.controls.repeatMode.value).toBe('custom');
    expect(component.taskForm.controls.repeatEvery.value).toBe(2);
    expect(component.taskForm.controls.repeatUnit.value).toBe('week');
  });

  it('normalizes stored completion date and time values in edit mode', () => {
    component.preset = {
      mode: 'edit',
      task: createTask({
        finishDate: '2026-05-11T00:00:00+00:00',
        finishTime: '14:30:00',
        typeFinishDate: 0,
      }),
    };
    fixture.detectChanges();

    expect(component.taskForm.controls.completeMode.value).toBe('on');
    expect(component.taskForm.controls.finishDate.value).toBe('2026-05-11');
    expect(component.taskForm.controls.finishTime.value).toBe('14:30');
  });

  it('loads stored completion by dates into date inputs in edit mode', () => {
    component.preset = {
      mode: 'edit',
      task: createTask({
        finishDate: '2026-06-03',
        finishTime: '09:05',
        typeFinishDate: 1,
      }),
    };
    fixture.detectChanges();

    expect(component.taskForm.controls.completeMode.value).toBe('by');
    expect(component.taskForm.controls.finishDate.value).toBe('2026-06-03');
    expect(component.taskForm.controls.finishTime.value).toBe('09:05');
  });

  it('keeps completion controls empty for invalid stored date and time values', () => {
    component.preset = {
      mode: 'edit',
      task: createTask({
        finishDate: 'not-a-date',
        finishTime: 'evening',
      }),
    };
    fixture.detectChanges();

    expect(component.taskForm.controls.finishDate.value).toBe('');
    expect(component.taskForm.controls.finishTime.value).toBe('');
  });

  it('saves edited completion fields in the update payload', async () => {
    component.preset = {
      mode: 'edit',
      task: createTask(),
    };
    fixture.detectChanges();

    component.taskForm.patchValue({
      name: 'Task with completion',
      completeMode: 'on',
      finishDate: '2026-05-11',
      finishTime: '14:30',
    });

    await component.submit();

    expect(updateTaskMock).toHaveBeenCalledTimes(1);
    expect(updateTaskMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'task-1',
        finishDate: '2026-05-11',
        finishTime: '14:30',
        typeFinishDate: 0,
      })
    );
  });

  it('saves multiple reminder dates with the edited task', async () => {
    component.preset = {
      mode: 'edit',
      task: createTask(),
    };
    fixture.detectChanges();

    component.taskForm.patchValue({ name: 'Task with reminders' });
    component.addReminder('2026-05-12', '09:30');
    component.addReminder('2026-05-13', '17:45');

    await component.submit();

    expect(updateTaskMock).toHaveBeenCalledTimes(1);
    expect(saveRemindersMock).toHaveBeenCalledWith('task-1', 'owner-1', [
      expect.objectContaining({
        date: '2026-05-12',
        time: '09:30',
      }),
      expect.objectContaining({
        date: '2026-05-13',
        time: '17:45',
      }),
    ]);
  });

  it('clears completion date and time in the update payload', async () => {
    component.preset = {
      mode: 'edit',
      task: createTask({
        finishDate: '2026-05-11T00:00:00+00:00',
        finishTime: '14:30:00',
      }),
    };
    fixture.detectChanges();

    component.taskForm.patchValue({
      finishDate: '',
      finishTime: '',
    });

    await component.submit();

    expect(updateTaskMock).toHaveBeenCalledWith(
      expect.objectContaining({
        finishDate: null,
        finishTime: null,
      })
    );
  });

  it('requires a future date and stores it as UTC for a timed suspension', async () => {
    component.selectTab('extra');
    component.taskForm.patchValue({
      name: 'Pause task',
      isActive: false,
      suspensionMode: 'until',
      suspendUntil: '',
      suspendUntilTime: '00:00',
    });
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="task-suspension-options"]'
      )
    ).not.toBeNull();

    await component.submit();
    expect(createTaskMock).not.toHaveBeenCalled();

    const localDate = futureDateInput(1);
    component.taskForm.controls.suspendUntil.setValue(localDate);
    component.taskForm.controls.suspendUntilTime.setValue('09:30');
    await component.submit();

    expect(createTaskMock).toHaveBeenCalledWith(
      expect.objectContaining({
        isActive: false,
        suspendUntil: new Date(`${localDate}T09:30`).toISOString(),
      })
    );
  });

  it('defaults a timed suspension to midnight when only a date is entered', async () => {
    const localDate = futureDateInput(1);
    component.selectTab('extra');
    component.taskForm.patchValue({
      name: 'Pause from midnight',
      isActive: false,
      suspensionMode: 'until',
      suspendUntil: localDate,
    });
    fixture.detectChanges();

    expect(component.taskForm.controls.suspendUntilTime.value).toBe('00:00');
    expect(
      (
        fixture.nativeElement.querySelector(
          'input[aria-label="Resume time"]'
        ) as HTMLInputElement
      ).value
    ).toBe('00:00');
    await component.submit();

    expect(createTaskMock).toHaveBeenCalledWith(
      expect.objectContaining({
        suspendUntil: new Date(`${localDate}T00:00`).toISOString(),
      })
    );
  });

  it('stores an indefinite suspension without a resume timestamp', async () => {
    component.taskForm.patchValue({
      name: 'Pause indefinitely',
      isActive: false,
      suspensionMode: 'indefinite',
    });

    await component.submit();

    expect(createTaskMock).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: false, suspendUntil: null })
    );
  });

  it('restores a timed suspension and clears it when the task becomes active', async () => {
    const suspendUntil = new Date(Date.now() + 86_400_000).toISOString();
    component.preset = {
      mode: 'edit',
      task: createTask({ isActive: false, suspendUntil }),
    };
    fixture.detectChanges();

    expect(component.taskForm.controls.suspensionMode.value).toBe('until');
    expect(component.taskForm.controls.suspendUntil.value).not.toBe('');
    expect(component.taskForm.controls.suspendUntilTime.value).not.toBe('');

    component.taskForm.controls.isActive.setValue(true);
    await component.submit();

    expect(updateTaskMock).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: true, suspendUntil: null })
    );
  });
});

describe('TaskComposerComponent shared sheet layout', () => {
  let fixture: ComponentFixture<TaskComposerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskComposerComponent],
      providers: [
        {
          provide: TaskDataService,
          useValue: {
            createTask: vi.fn(async () => createTask()),
            updateTask: vi.fn(async () => createTask()),
            refresh: vi.fn(async () => undefined),
          },
        },
        {
          provide: ProjectDataService,
          useValue: {
            list: () => [],
          },
        },
        {
          provide: TagDataService,
          useValue: {
            list: () => [],
            createTag: vi.fn(async () => null),
          },
        },
        {
          provide: SupabaseSessionService,
          useValue: {
            user: () => ({ id: 'owner-1' }),
          },
        },
        {
          provide: TaskReminderDataService,
          useValue: {
            listForTask: vi.fn(async () => []),
            saveForTask: vi.fn(async () => undefined),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskComposerComponent);
    fixture.detectChanges();
  });

  it('renders the shared sheet shell with a single footer and scroll panel', () => {
    expect(
      fixture.nativeElement.querySelector('[data-testid="task-composer-sheet"]')
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('.sheet-shell__panel-scroll')
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelectorAll('.sheet-shell__footer')
    ).toHaveLength(1);
  });
});

function createTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    ownerId: 'owner-1',
    projectId: 'inbox',
    name: 'Task',
    description: '',
    finishDate: null,
    finishTime: null,
    typeFinishDate: 1,
    suspendUntil: null,
    pinned: false,
    isActive: true,
    isDone: false,
    onHold: false,
    priority: 'B',
    repeatInterval: 0,
    repeatDelta: null,
    fromRepeating: 0,
    estimateMinutes: 15,
    spentMinutes: 0,
    taskType: 'NORMAL',
    whenComplete: null,
    reminderCount: 0,
    reminders: [],
    tags: [],
    steps: [],
    createdAt: null,
    updatedAt: null,
    ...overrides,
  };
}

function futureDateInput(days: number): string {
  const date = new Date(Date.now() + days * 86_400_000);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}
