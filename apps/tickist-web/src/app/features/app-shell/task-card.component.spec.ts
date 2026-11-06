import {
  fixtureHost,
  requiredElement,
  elementsOfType,
} from '../../../testing/dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Task, TaskDataService, TaskStep } from '../../data/task-data.service';
import { Project, ProjectDataService } from '../../data/project-data.service';
import { TagDataService } from '../../data/tag-data.service';
import { ComposerModalService } from '../task-fab/composer-modal.service';
import { ToastService } from '../../core/ui/toast.service';
import { TaskCardComponent } from './task-card.component';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { TimeTrackingService } from '../../data/time-tracking.service';
import { SupabaseSessionService } from '../auth/supabase-session.service';
import type { User } from '@supabase/supabase-js';

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
    createTagMock = vi.fn(
      async ({ ownerId, name }: { ownerId: string; name: string }) => ({
        id: 'tag-created',
        ownerId,
        name,
      })
    );

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
    expect(reminders.getAttribute('aria-label')).toContain(
      'Reminders: 2. Next:'
    );
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

    const badge = requiredElement(
      fixtureHost(fixture),
      '[data-testid="task-completed-date"]',
      HTMLElement
    );

    expect(badge?.textContent).toContain('Completed 20-07-2026');
  });

  it('replaces the completion checkbox with a pause for a suspended task', () => {
    component.task = createTask({
      isActive: false,
      suspendUntil: '2099-08-24T12:30:00.000Z',
    });
    fixture.detectChanges();

    const pause = requiredElement(
      fixtureHost(fixture),
      '[data-testid="task-suspended-icon"]',
      HTMLElement
    );

    expect(pause?.getAttribute('aria-label')).toBe('Suspended');
    expect(pause?.getAttribute('title')).toContain('Suspended until');
    expect(fixtureHost(fixture).querySelector('.task-card__check')).toBeNull();
  });

  it('restores the completion checkbox after the suspension expires', () => {
    component.task = createTask({
      isActive: false,
      suspendUntil: '2020-01-01T00:00:00.000Z',
    });
    fixture.detectChanges();

    expect(
      fixtureHost(fixture).querySelector('[data-testid="task-suspended-icon"]')
    ).toBeNull();
    expect(
      fixtureHost(fixture).querySelector('.task-card__check')
    ).not.toBeNull();
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

    const customEveryInput = requiredElement(
      fixtureHost(fixture),
      '.repeat-custom__input',
      HTMLInputElement
    );

    if (!customEveryInput) {
      throw new Error('Missing custom repeat input');
    }

    customEveryInput.value = '3';
    customEveryInput.dispatchEvent(new Event('input'));

    const customUnitTrigger = requiredElement(
      fixtureHost(fixture),
      '.repeat-custom__select .themed-select__trigger',
      HTMLButtonElement
    );

    customUnitTrigger.click();
    fixture.detectChanges();

    const monthOption = Array.from(
      fixtureHost(fixture).querySelectorAll<HTMLButtonElement>(
        '.repeat-custom__select .themed-select__option'
      )
    ).find((option) => option.textContent?.trim() === 'months');

    if (!monthOption) throw new Error('Missing months option');
    monthOption.click();

    const applyButton = requiredElement(
      fixtureHost(fixture),
      '.repeat-custom__apply',
      HTMLButtonElement
    );

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

    const input = requiredElement(
      fixtureHost(fixture),
      '.tag-add__input',
      HTMLInputElement
    );

    if (!input) {
      throw new Error('Missing tag search input');
    }

    input.value = 'Urgent';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const button = requiredElement(
      fixtureHost(fixture),
      '.tag-add__button',
      HTMLButtonElement
    );

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

    const trigger = requiredElement(
      fixtureHost(fixture),
      '.tag-add__trigger',
      HTMLButtonElement
    );

    if (!trigger) {
      throw new Error('Missing tag menu trigger');
    }

    trigger.click();
    fixture.detectChanges();

    const option = requiredElement(
      fixtureHost(fixture),
      '.tag-add__option',
      HTMLButtonElement
    );

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

    const input = requiredElement(
      fixtureHost(fixture),
      '.tag-add__input',
      HTMLInputElement
    );

    if (!input) {
      throw new Error('Missing tag search input');
    }

    input.value = 'freeweek';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const button = requiredElement(
      fixtureHost(fixture),
      '.tag-add__button',
      HTMLButtonElement
    );

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
    const button = requiredElement(
      fixtureHost(fixture),
      `[data-testid="task-toolbar-${key}"]`,
      HTMLButtonElement
    );

    if (!button) {
      throw new Error(`Missing toolbar button: ${key}`);
    }

    return button;
  }

  function getRepeatButton(label: string): HTMLButtonElement {
    const buttons = elementsOfType(
      fixtureHost(fixture),
      '.repeat-grid button',
      HTMLButtonElement
    );

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

describe('TaskCardComponent focus button', () => {
  const runningTaskId = signal<string | null>(null);
  const start = vi.fn();
  const navigate = vi.fn();

  async function render(
    task: Task
  ): Promise<ComponentFixture<TaskCardComponent>> {
    await TestBed.configureTestingModule({
      imports: [TaskCardComponent],
      providers: [
        { provide: TaskDataService, useValue: { updateTask: vi.fn() } },
        { provide: TagDataService, useValue: { list: () => [] } },
        { provide: ProjectDataService, useValue: { list: () => [] } },
        { provide: ComposerModalService, useValue: { openTaskModal: vi.fn() } },
        {
          provide: ToastService,
          useValue: { success: vi.fn(), info: vi.fn(), error: vi.fn() },
        },
        { provide: Router, useValue: { navigate } },
        {
          provide: TimeTrackingService,
          useValue: {
            busy: () => false,
            start,
            isRunningTask: (id: string) => runningTaskId() === id,
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(TaskCardComponent);

    fixture.componentInstance.task = task;
    fixture.detectChanges();

    return fixture;
  }

  function focusButton(fixture: ComponentFixture<TaskCardComponent>) {
    return fixtureHost(fixture).querySelector<HTMLButtonElement>(
      '[data-testid="task-focus-start"]'
    );
  }

  beforeEach(() => {
    runningTaskId.set(null);
    start.mockReset().mockResolvedValue(true);
    navigate.mockReset().mockResolvedValue(true);
  });

  it('starts the timer and opens focus mode for the task', async () => {
    const fixture = await render(createTask());
    const button = focusButton(fixture);

    expect(button?.getAttribute('aria-label')).toBe('Start focus');
    button?.click();
    await fixture.whenStable();

    expect(start).toHaveBeenCalledWith('task-1');
    expect(navigate).toHaveBeenCalledWith(['/app/focus', 'task-1']);
  });

  it('stays on the list when the timer cannot start', async () => {
    start.mockResolvedValue(false);
    const fixture = await render(createTask());

    focusButton(fixture)?.click();
    await fixture.whenStable();

    expect(navigate).not.toHaveBeenCalled();
  });

  it('marks the task whose timer is running', async () => {
    runningTaskId.set('task-1');
    const fixture = await render(createTask());

    expect(focusButton(fixture)?.getAttribute('aria-label')).toBe(
      'Open focus mode'
    );
  });

  it('hides the button on completed tasks', async () => {
    const fixture = await render(createTask({ isDone: true }));

    expect(focusButton(fixture)).toBeNull();
  });
});

describe('TaskCardComponent time chip', () => {
  async function render(
    overrides: Partial<Task>
  ): Promise<ComponentFixture<TaskCardComponent>> {
    await TestBed.configureTestingModule({
      imports: [TaskCardComponent],
      providers: [
        { provide: TaskDataService, useValue: { updateTask: vi.fn() } },
        { provide: TagDataService, useValue: { list: () => [] } },
        { provide: ProjectDataService, useValue: { list: () => [] } },
        { provide: ComposerModalService, useValue: { openTaskModal: vi.fn() } },
        {
          provide: ToastService,
          useValue: { success: vi.fn(), info: vi.fn(), error: vi.fn() },
        },
        {
          provide: TimeTrackingService,
          useValue: { busy: () => false, isRunningTask: () => false },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(TaskCardComponent);

    fixture.componentInstance.task = createTask(overrides);
    fixture.componentInstance.viewMode = 'extended';
    fixture.detectChanges();

    return fixture;
  }

  function chip(fixture: ComponentFixture<TaskCardComponent>) {
    return fixtureHost(fixture).querySelector<HTMLElement>(
      '[data-testid="task-time-chip"]'
    );
  }

  it('shows spent before the estimate with a labelled progress bar', async () => {
    const fixture = await render({ estimateMinutes: 15, spentMinutes: 5 });
    const element = chip(fixture);

    expect(element?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      '⏱️ 5m / 15m'
    );
    expect(element?.getAttribute('title')).toBe(
      'Time spent: 5m of 15m estimated (33%)'
    );
    expect(
      element?.querySelector<HTMLElement>('.task-card__time-bar')?.style.width
    ).toBe('33%');
    expect(element?.classList).not.toContain('task-card__time--over');
  });

  it('marks time over the estimate', async () => {
    const fixture = await render({ estimateMinutes: 60, spentMinutes: 85 });
    const element = chip(fixture);

    expect(element?.textContent).toContain('1h 25m / 1h');
    expect(element?.classList).toContain('task-card__time--over');
  });

  it('shows spent time without an estimate and hides an empty chip', async () => {
    const spentOnly = await render({ estimateMinutes: null, spentMinutes: 40 });

    expect(chip(spentOnly)?.textContent).toContain('40m');
    expect(chip(spentOnly)?.querySelector('.task-card__time-bar')).toBeNull();

    TestBed.resetTestingModule();
    const empty = await render({ estimateMinutes: 30, spentMinutes: 0 });

    expect(chip(empty)).toBeNull();
  });
});

describe('TaskCardComponent duplicate action', () => {
  const duplicateTask = vi.fn();
  const toast = { success: vi.fn(), info: vi.fn(), error: vi.fn() };
  const sessionUser = signal<User | null>(null);

  async function render(): Promise<ComponentFixture<TaskCardComponent>> {
    await TestBed.configureTestingModule({
      imports: [TaskCardComponent],
      providers: [
        {
          provide: TaskDataService,
          useValue: { updateTask: vi.fn(), duplicateTask },
        },
        { provide: TagDataService, useValue: { list: () => [] } },
        { provide: ProjectDataService, useValue: { list: () => [] } },
        { provide: ComposerModalService, useValue: { openTaskModal: vi.fn() } },
        { provide: ToastService, useValue: toast },
        {
          provide: SupabaseSessionService,
          useValue: { user: sessionUser.asReadonly() },
        },
        {
          provide: TimeTrackingService,
          useValue: { busy: () => false, isRunningTask: () => false },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(TaskCardComponent);

    fixture.componentInstance.task = createTask({ ownerId: 'someone-else' });
    fixture.componentInstance.menuOpen.set(true);
    fixture.detectChanges();

    return fixture;
  }

  function duplicateButton(fixture: ComponentFixture<TaskCardComponent>) {
    return fixtureHost(fixture).querySelector<HTMLButtonElement>(
      '[data-testid="task-duplicate"]'
    );
  }

  beforeEach(() => {
    duplicateTask.mockReset();
    Object.values(toast).forEach((mock) => mock.mockReset());
    sessionUser.set({
      id: 'me',
      app_metadata: {},
      user_metadata: {},
      aud: 'authenticated',
      created_at: '2026-11-01T00:00:00Z',
    } satisfies User);
  });

  it('copies the task as the signed-in user and closes the menu', async () => {
    duplicateTask.mockResolvedValue(createTask({ id: 'task-2' }));
    const fixture = await render();

    duplicateButton(fixture)?.click();
    await fixture.whenStable();

    expect(duplicateTask).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'task-1' }),
      'me'
    );
    expect(toast.success).toHaveBeenCalledWith('Task duplicated.');
    expect(fixture.componentInstance.menuOpen()).toBe(false);
  });

  it('reports a failed copy', async () => {
    duplicateTask.mockResolvedValue(null);
    const fixture = await render();

    duplicateButton(fixture)?.click();
    await fixture.whenStable();

    expect(toast.error).toHaveBeenCalledWith('Failed to duplicate task.');
  });
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
    assigneeIds: [],
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
