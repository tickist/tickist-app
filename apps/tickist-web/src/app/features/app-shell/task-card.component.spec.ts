import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Task, TaskDataService, TaskStep } from '../../data/task-data.service';
import { Project, ProjectDataService } from '../../data/project-data.service';
import { TagDataService } from '../../data/tag-data.service';
import { ComposerModalService } from '../task-fab/composer-modal.service';
import { ToastService } from '../../core/ui/toast.service';
import { TaskCardComponent } from './task-card.component';

describe('TaskCardComponent toolbar status icons', () => {
  let fixture: ComponentFixture<TaskCardComponent>;
  let component: TaskCardComponent;
  let updateTaskMock: ReturnType<typeof vi.fn>;
  let createTagMock: ReturnType<typeof vi.fn>;
  const availableTags = [
    {
      id: 'tag-existing',
      ownerId: 'owner-1',
      name: 'FreeWeek',
    },
  ];

  beforeEach(async () => {
    updateTaskMock = vi.fn(async (payload: Partial<Task>) =>
      createTask({
        ...payload,
      })
    );
    createTagMock = vi.fn(async ({ ownerId, name }: { ownerId: string; name: string }) => ({
      id: 'tag-created',
      ownerId,
      name,
    }));

    await TestBed.configureTestingModule({
      imports: [TaskCardComponent],
      providers: [
        {
          provide: TaskDataService,
          useValue: {
            updateTask: updateTaskMock,
            deleteTask: async () => true,
          },
        },
        {
          provide: TagDataService,
          useValue: {
            list: () => availableTags,
            createTag: createTagMock,
          },
        },
        {
          provide: ProjectDataService,
          useValue: {
            list: () => [],
          },
        },
        {
          provide: ComposerModalService,
          useValue: {
            openTaskModal: () => undefined,
          },
        },
        {
          provide: ToastService,
          useValue: {
            success: () => undefined,
            info: () => undefined,
            error: () => undefined,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskCardComponent);
    component = fixture.componentInstance;
    component.viewMode = 'extended';
  });

  it('adds configured class when description, tags, repeat, reminders and steps are set', () => {
    component.task = createTask({
      description: 'Task with metadata',
      tags: ['tag-1'],
      repeatInterval: 7,
      reminderCount: 2,
      reminders: [
        {
          id: 'reminder-1',
          remindAt: '2026-05-15T07:30:00.000Z',
          timezone: 'Europe/Warsaw',
          status: 'scheduled',
        },
      ],
      steps: [createStep()],
    });
    fixture.detectChanges();

    const description = getToolbarButton('description');
    const tags = getToolbarButton('tags');
    const repeat = getToolbarButton('repeat');
    const reminders = getToolbarButton('reminders');
    const steps = getToolbarButton('steps');

    expect(description.classList.contains('configured')).toBe(true);
    expect(tags.classList.contains('configured')).toBe(true);
    expect(repeat.classList.contains('configured')).toBe(true);
    expect(reminders.classList.contains('configured')).toBe(true);
    expect(reminders.getAttribute('aria-label')).toContain('Reminders: 2. Next:');
    expect(steps.classList.contains('configured')).toBe(true);
  });

  it('does not add configured class when metadata is missing', () => {
    component.task = createTask({
      description: '   ',
      tags: [],
      repeatInterval: 0,
      reminderCount: 0,
      steps: [],
    });
    fixture.detectChanges();

    const description = getToolbarButton('description');
    const tags = getToolbarButton('tags');
    const repeat = getToolbarButton('repeat');
    const reminders = getToolbarButton('reminders');
    const steps = getToolbarButton('steps');

    expect(description.classList.contains('configured')).toBe(false);
    expect(tags.classList.contains('configured')).toBe(false);
    expect(repeat.classList.contains('configured')).toBe(false);
    expect(reminders.classList.contains('configured')).toBe(false);
    expect(reminders.getAttribute('aria-label')).toBe('Reminders: none');
    expect(steps.classList.contains('configured')).toBe(false);
  });

  it('shows the completion date next to a completed task name', () => {
    component.task = createTask({
      isDone: true,
      whenComplete: '2026-07-20T12:30:00.000Z',
    });
    fixture.detectChanges();

    const badge = fixture.nativeElement.querySelector(
      '[data-testid="task-completed-date"]'
    ) as HTMLElement | null;

    expect(badge?.textContent).toContain('Completed 20-07-2026');
  });

  it('sets active class on click even when icon is not configured', () => {
    component.task = createTask({
      description: '',
      tags: [],
      repeatInterval: 0,
      reminderCount: 0,
      steps: [],
    });
    fixture.detectChanges();

    const description = getToolbarButton('description');
    expect(description.classList.contains('configured')).toBe(false);

    description.click();
    fixture.detectChanges();

    expect(description.classList.contains('active')).toBe(true);
    expect(description.classList.contains('configured')).toBe(false);
  });

  it('marks custom as active when task has custom repeat interval', () => {
    component.task = createTask({ repeatInterval: 14, fromRepeating: 0 });
    fixture.detectChanges();

    getToolbarButton('repeat').click();
    fixture.detectChanges();

    expect(getRepeatButton('Custom').classList.contains('active')).toBe(true);
  });

  it('updates repeat interval to 90 days for custom 3 months', async () => {
    component.task = createTask({ repeatInterval: 7, fromRepeating: 0 });
    fixture.detectChanges();

    getToolbarButton('repeat').click();
    fixture.detectChanges();

    getRepeatButton('Custom').click();
    fixture.detectChanges();

    const customEveryInput = fixture.nativeElement.querySelector(
      '.repeat-custom__input'
    ) as HTMLInputElement | null;
    if (!customEveryInput) {
      throw new Error('Missing custom repeat input');
    }
    customEveryInput.value = '3';
    customEveryInput.dispatchEvent(new Event('input'));

    const customUnitSelect = fixture.nativeElement.querySelector(
      '.repeat-custom__select'
    ) as HTMLSelectElement | null;
    if (!customUnitSelect) {
      throw new Error('Missing custom repeat unit select');
    }
    customUnitSelect.value = 'month';
    customUnitSelect.dispatchEvent(new Event('change'));

    const applyButton = fixture.nativeElement.querySelector(
      '.repeat-custom__apply'
    ) as HTMLButtonElement | null;
    if (!applyButton) {
      throw new Error('Missing custom repeat apply button');
    }

    applyButton.click();
    await fixture.whenStable();

    expect(updateTaskMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'task-1',
        repeatInterval: 90,
      })
    );
  });

  it('creates and adds a new tag from the tags panel', async () => {
    component.task = createTask({ tags: [] });
    fixture.detectChanges();

    getToolbarButton('tags').click();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector(
      '.tag-add__input'
    ) as HTMLInputElement | null;
    if (!input) {
      throw new Error('Missing tag search input');
    }

    input.value = 'Urgent';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector(
      '.tag-add__button'
    ) as HTMLButtonElement | null;
    if (!button) {
      throw new Error('Missing tag action button');
    }

    button.click();
    await fixture.whenStable();

    expect(createTagMock).toHaveBeenCalledWith({
      ownerId: 'owner-1',
      name: 'Urgent',
    });
    expect(updateTaskMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'task-1',
        tags: ['tag-created'],
      })
    );
  });

  it('adds an existing tag from the custom dropdown menu', async () => {
    component.task = createTask({ tags: [] });
    fixture.detectChanges();

    getToolbarButton('tags').click();
    fixture.detectChanges();

    const trigger = fixture.nativeElement.querySelector(
      '.tag-add__trigger'
    ) as HTMLButtonElement | null;
    if (!trigger) {
      throw new Error('Missing tag menu trigger');
    }

    trigger.click();
    fixture.detectChanges();

    const option = fixture.nativeElement.querySelector(
      '.tag-add__option'
    ) as HTMLButtonElement | null;
    if (!option) {
      throw new Error('Missing tag menu option');
    }

    option.click();
    await fixture.whenStable();

    expect(createTagMock).not.toHaveBeenCalled();
    expect(updateTaskMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'task-1',
        tags: ['tag-existing'],
      })
    );
  });

  it('adds an existing matching tag instead of creating a duplicate', async () => {
    component.task = createTask({ tags: [] });
    fixture.detectChanges();

    getToolbarButton('tags').click();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector(
      '.tag-add__input'
    ) as HTMLInputElement | null;
    if (!input) {
      throw new Error('Missing tag search input');
    }

    input.value = 'freeweek';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector(
      '.tag-add__button'
    ) as HTMLButtonElement | null;
    if (!button) {
      throw new Error('Missing tag action button');
    }

    button.click();
    await fixture.whenStable();

    expect(createTagMock).not.toHaveBeenCalled();
    expect(updateTaskMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'task-1',
        tags: ['tag-existing'],
      })
    );
  });

  it('shows shared badge only when at least two assignees are attached', () => {
    fixture.destroy();

    const singleMemberFixture = renderTaskCard(
      createTask({ assigneeIds: ['member-1'] })
    );

    expect(getSharedBadge(singleMemberFixture)).toBeNull();
    singleMemberFixture.destroy();

    const multipleMemberFixture = renderTaskCard(
      createTask({ assigneeIds: ['member-1', 'member-2'] })
    );

    expect(getSharedBadge(multipleMemberFixture)?.textContent?.trim()).toBe(
      'Shared'
    );
    multipleMemberFixture.destroy();
  });

  function getToolbarButton(
    key: 'description' | 'tags' | 'repeat' | 'reminders' | 'steps'
  ): HTMLButtonElement {
    const button = fixture.nativeElement.querySelector(
      `[data-testid="task-toolbar-${key}"]`
    ) as HTMLButtonElement | null;
    if (!button) {
      throw new Error(`Missing toolbar button: ${key}`);
    }
    return button;
  }

  function getRepeatButton(label: string): HTMLButtonElement {
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('.repeat-grid button')
    ) as HTMLButtonElement[];
    const button = buttons.find((entry) =>
      entry.textContent?.trim().includes(label)
    );
    if (!button) {
      throw new Error(`Missing repeat button: ${label}`);
    }
    return button;
  }

  function renderTaskCard(task: Task): ComponentFixture<TaskCardComponent> {
    const renderedFixture = TestBed.createComponent(TaskCardComponent);
    renderedFixture.componentInstance.task = task;
    renderedFixture.componentInstance.project = createProject();
    renderedFixture.componentInstance.viewMode = 'extended';
    renderedFixture.detectChanges();
    return renderedFixture;
  }

  function getSharedBadge(
    renderedFixture: ComponentFixture<TaskCardComponent>
  ): HTMLElement | null {
    return renderedFixture.nativeElement.querySelector('.task-card__shared');
  }
});

function createTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    ownerId: 'owner-1',
    projectId: null,
    name: 'Test task',
    description: '',
    finishDate: null,
    finishTime: null,
    typeFinishDate: 1,
    suspendUntil: null,
    pinned: false,
    isActive: true,
    isDone: false,
    onHold: false,
    priority: 'C',
    repeatInterval: 0,
    repeatDelta: null,
    fromRepeating: null,
    estimateMinutes: null,
    spentMinutes: null,
    taskType: 'normal',
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

function createStep(): TaskStep {
  return {
    id: 'step-1',
    taskId: 'task-1',
    content: 'First step',
    isDone: false,
    position: 0,
  };
}

function createProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'project-1',
    ownerId: 'owner-1',
    name: 'Project',
    description: '',
    color: '#394264',
    icon: 'folder',
    isActive: true,
    isInbox: false,
    projectType: 'active',
    ancestorId: null,
    taskView: 'extended',
    shareWithIds: [],
    members: [],
    ...overrides,
  };
}
