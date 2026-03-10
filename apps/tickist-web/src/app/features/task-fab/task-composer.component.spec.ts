import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Task, TaskDataService } from '../../data/task-data.service';
import { ProjectDataService } from '../../data/project-data.service';
import { TagDataService } from '../../data/tag-data.service';
import { SupabaseSessionService } from '../auth/supabase-session.service';
import { TaskComposerComponent } from './task-composer.component';

describe('TaskComposerComponent repeat custom cadence', () => {
  let fixture: ComponentFixture<TaskComposerComponent>;
  let component: TaskComposerComponent;
  let createTaskMock: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    createTaskMock = vi.fn(async () => createTask());

    await TestBed.configureTestingModule({
      imports: [TaskComposerComponent],
      providers: [
        {
          provide: TaskDataService,
          useValue: {
            createTask: createTaskMock,
            updateTask: vi.fn(async () => createTask()),
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
            user: () => ({ id: 'owner-1' }),
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
    tags: [],
    steps: [],
    createdAt: null,
    updatedAt: null,
    ...overrides,
  };
}
