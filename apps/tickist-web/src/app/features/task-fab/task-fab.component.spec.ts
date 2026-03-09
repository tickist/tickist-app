import { Component, input, output } from '@angular/core';
import {
  TaskComposerPreset,
  ProjectComposerPreset,
} from './composer-modal.service';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { Task } from '../../data/task-data.service';
import { ComposerModalService } from './composer-modal.service';
import { TaskFabComponent } from './task-fab.component';

@Component({ selector: 'app-task-composer', template: '' })
class MockTaskComposerComponent {
  readonly preset = input<TaskComposerPreset | null>(null);
  readonly dismiss = output<void>();
  readonly created = output<void>();
}

@Component({ selector: 'app-project-composer', template: '' })
class MockProjectComposerComponent {
  readonly preset = input<ProjectComposerPreset | null>(null);
  readonly dismiss = output<void>();
  readonly created = output<void>();
}

describe('TaskFabComponent sheet layout', () => {
  let fixture: ComponentFixture<TaskFabComponent>;
  let component: TaskFabComponent;
  let composer: ComposerModalService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskFabComponent],
      providers: [ComposerModalService],
    })
      .overrideComponent(TaskFabComponent, {
        set: {
          imports: [MockTaskComposerComponent, MockProjectComposerComponent],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(TaskFabComponent);
    component = fixture.componentInstance;
    composer = TestBed.inject(ComposerModalService);
    fixture.detectChanges();
  });

  it('opens task composer in the shared right sheet from FAB', () => {
    const addTaskButton = fixture.nativeElement.querySelector(
      '.fab-main'
    ) as HTMLButtonElement | null;

    addTaskButton?.click();
    fixture.detectChanges();

    const panel = fixture.nativeElement.querySelector(
      '.fab-modal--sheet[aria-label="Task panel"]'
    );
    expect(panel).not.toBeNull();
  });

  it('renders edited task in the same sheet container', () => {
    composer.openTaskModal({
      mode: 'edit',
      task: createTask(),
    });
    fixture.detectChanges();

    const panel = fixture.nativeElement.querySelector(
      '.fab-modal--sheet[aria-label="Task panel"]'
    );
    expect(panel).not.toBeNull();
  });

  it('opens project composer in the shared right sheet', () => {
    component.showProjectModal();
    fixture.detectChanges();

    const panel = fixture.nativeElement.querySelector(
      '.fab-modal--sheet[aria-label="Project panel"]'
    );
    expect(panel).not.toBeNull();
  });
});

function createTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    ownerId: 'owner-1',
    projectId: 'project-1',
    name: 'Plan panel test',
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
    fromRepeating: null,
    estimateMinutes: 15,
    spentMinutes: 0,
    taskType: 'normal',
    whenComplete: null,
    tags: [],
    steps: [],
    createdAt: null,
    updatedAt: null,
    ...overrides,
  };
}
