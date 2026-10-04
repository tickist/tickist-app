import { fixtureHost, requiredElement } from '../../../testing/dom';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ComposerModalService } from './composer-modal.service';
import { TaskFabComponent } from './task-fab.component';

describe('TaskFabComponent routing actions', () => {
  let fixture: ComponentFixture<TaskFabComponent>;
  let component: TaskFabComponent;
  let openTaskModal: ReturnType<typeof vi.fn>;
  let openProjectModal: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    openTaskModal = vi.fn(async () => undefined);
    openProjectModal = vi.fn(async () => undefined);

    await TestBed.configureTestingModule({
      imports: [TaskFabComponent],
      providers: [
        {
          provide: ComposerModalService,
          useValue: {
            openTaskModal,
            openProjectModal,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TaskFabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('navigates to task create route from FAB', async () => {
    const addTaskButton = requiredElement(
      fixtureHost(fixture),
      '.fab-main',
      HTMLButtonElement
    );

    addTaskButton?.click();
    await fixture.whenStable();

    expect(openTaskModal).toHaveBeenCalledWith();
  });

  it('navigates to project create route from mini FAB', async () => {
    component.hovered.set(true);
    fixture.detectChanges();

    const addProjectButton = requiredElement(
      fixtureHost(fixture),
      '.fab-mini',
      HTMLButtonElement
    );

    addProjectButton?.click();
    await fixture.whenStable();

    expect(openProjectModal).toHaveBeenCalledWith({ mode: 'create' });
  });
});
