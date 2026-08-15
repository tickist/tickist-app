import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectDataService } from '../../data/project-data.service';
import { TagDataService } from '../../data/tag-data.service';
import { Task, TaskDataService } from '../../data/task-data.service';
import { ToastService } from '../../core/ui/toast.service';
import { ComposerModalService } from '../task-fab/composer-modal.service';
import { TaskListComponent } from './task-list.component';

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
          useValue: {
            success: vi.fn(),
            info: vi.fn(),
            error: vi.fn(),
          },
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
    const cards = Array.from(
      fixture.nativeElement.querySelectorAll('app-task-card')
    ) as HTMLElement[];
    const menuButtons = cards.map(
      (card) =>
        card.querySelector(
          'button[aria-label="More actions"]'
        ) as HTMLButtonElement
    );

    menuButtons[0].click();
    fixture.detectChanges();

    expect(cards[0].querySelector('.task-menu')).not.toBeNull();
    expect(cards[1].querySelector('.task-menu')).toBeNull();

    menuButtons[1].click();
    fixture.detectChanges();

    expect(cards[0].querySelector('.task-menu')).toBeNull();
    expect(cards[1].querySelector('.task-menu')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.task-menu')).toHaveLength(
      1
    );
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
