import {
  fixtureHost,
  requiredElement,
  elementsOfType,
} from '../../../testing/dom';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectDataService } from '../../data/project-data.service';
import { TagDataService } from '../../data/tag-data.service';
import { Task, TaskDataService } from '../../data/task-data.service';
import { ToastService } from '../../core/ui/toast.service';
import { ComposerModalService } from '../task-fab/composer-modal.service';
import { TaskListComponent } from './task-list.component';

const toasts = {
  success: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
  announceStatus: vi.fn(),
};

describe('TaskListComponent task menus', () => {
  let fixture: ComponentFixture<TaskListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskListComponent],
      providers: [
        {
          provide: TaskDataService,
          useValue: {
            updateTask: vi.fn(async () => null),
            deleteTask: vi.fn(async () => true),
          },
        },
        {
          provide: ProjectDataService,
          useValue: { list: () => [] },
        },
        {
          provide: TagDataService,
          useValue: {
            list: () => [],
            createTag: vi.fn(async () => null),
          },
        },
        {
          provide: ComposerModalService,
          useValue: { openTaskModal: vi.fn(async () => undefined) },
        },
        {
          provide: ToastService,
          useValue: toasts,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskListComponent);
    fixture.componentRef.setInput('tasks', [
      createTask('task-1', 'First task'),
      createTask('task-2', 'Second task'),
    ]);
    fixture.detectChanges();
  });

  it('keeps only the most recently selected task menu open', () => {
    const cards = elementsOfType(
      fixtureHost(fixture),
      'app-task-card',
      HTMLElement
    );

    const menuButtons = cards.map((card) =>
      requiredElement(
        card,
        'button[aria-label="More actions"]',
        HTMLButtonElement
      )
    );

    menuButtons[0].click();
    fixture.detectChanges();

    expect(cards[0].querySelector('.task-menu')).not.toBeNull();
    expect(cards[1].querySelector('.task-menu')).toBeNull();

    menuButtons[1].click();
    fixture.detectChanges();

    expect(cards[0].querySelector('.task-menu')).toBeNull();
    expect(cards[1].querySelector('.task-menu')).not.toBeNull();
    expect(fixtureHost(fixture).querySelectorAll('.task-menu')).toHaveLength(1);
  });
});

describe('TaskListComponent reordering', () => {
  let fixture: ComponentFixture<TaskListComponent>;
  let moves: { ids: string[]; from: number; to: number }[];

  beforeEach(async () => {
    toasts.announceStatus.mockClear();
    await TestBed.configureTestingModule({
      imports: [TaskListComponent],
      providers: [
        { provide: TaskDataService, useValue: {} },
        { provide: ProjectDataService, useValue: { list: () => [] } },
        { provide: TagDataService, useValue: { list: () => [] } },
        { provide: ComposerModalService, useValue: {} },
        { provide: ToastService, useValue: toasts },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskListComponent);
    moves = [];
    fixture.componentInstance.reordered.subscribe((move) => moves.push(move));
    fixture.componentRef.setInput('tasks', [
      createTask('task-1', 'First task'),
      createTask('task-2', 'Second task'),
      createTask('task-3', 'Third task'),
    ]);
  });

  function handles(): HTMLButtonElement[] {
    return elementsOfType(
      fixtureHost(fixture),
      '.task-list__handle',
      HTMLButtonElement
    );
  }

  function press(handle: HTMLElement, key: string): void {
    handle.dispatchEvent(
      new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
    );
    fixture.detectChanges();
  }

  it('shows no drag handles unless the list is reorderable', () => {
    fixture.detectChanges();

    expect(handles()).toHaveLength(0);
  });

  it('names each handle after its task', () => {
    fixture.componentRef.setInput('reorderable', true);
    fixture.detectChanges();

    expect(
      handles().map((handle) => handle.getAttribute('aria-label'))
    ).toEqual([
      'Reorder First task',
      'Reorder Second task',
      'Reorder Third task',
    ]);
  });

  it('grabs with Space, moves with arrows and announces each step', () => {
    fixture.componentRef.setInput('reorderable', true);
    fixture.detectChanges();

    const [first] = handles();

    press(first, 'ArrowDown');
    expect(moves).toEqual([]);

    press(first, ' ');
    expect(first.getAttribute('aria-pressed')).toBe('true');

    press(first, 'ArrowDown');
    expect(moves).toEqual([
      { ids: ['task-1', 'task-2', 'task-3'], from: 0, to: 1 },
    ]);
    expect(toasts.announceStatus).toHaveBeenLastCalledWith(
      'Moved First task to position 2 of 3.'
    );

    press(first, 'ArrowUp');
    expect(moves).toHaveLength(1);
  });

  it('drops with Enter and puts the task back with Escape', () => {
    fixture.componentRef.setInput('reorderable', true);
    fixture.detectChanges();

    const second = handles()[1];

    press(second, 'Enter');
    press(second, 'Enter');
    expect(second.getAttribute('aria-pressed')).toBe('false');
    expect(toasts.announceStatus).toHaveBeenLastCalledWith(
      'Dropped Second task at position 2 of 3.'
    );

    press(second, ' ');
    expect(toasts.announceStatus).toHaveBeenLastCalledWith(
      expect.stringContaining('Grabbed Second task')
    );
    press(second, 'Escape');
    expect(second.getAttribute('aria-pressed')).toBe('false');
    expect(moves).toEqual([]);
  });
});

function createTask(id: string, name: string): Task {
  return {
    id,
    ownerId: 'owner-1',
    projectId: 'project-1',
    name,
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
    assigneeIds: [],
    steps: [],
    createdAt: null,
    updatedAt: null,
  };
}
