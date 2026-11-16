import { fixtureHost, requiredElement } from '../../../testing/dom';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Project } from '../../data/project-data.service';
import { ProjectHeaderComponent } from './project-header.component';

describe('ProjectHeaderComponent', () => {
  let fixture: ComponentFixture<ProjectHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectHeaderComponent);
    fixture.componentRef.setInput('project', createProject());
    fixture.componentRef.setInput('suspendedCount', 3);
    fixture.detectChanges();
  });

  it('shows the suspended count and filter option', () => {
    expect(
      fixtureHost(fixture).querySelector(
        '[data-testid="project-suspended-count"]'
      ).textContent
    ).toContain('Suspended: 3');

    const filterButton = requiredElement(
      fixtureHost(fixture),
      'button[title="Filter"]',
      HTMLButtonElement
    );

    filterButton.click();
    fixture.detectChanges();

    const labels = Array.from(
      fixtureHost(fixture).querySelectorAll('button.filter-option')
    ).map((button) => button.textContent?.trim());

    expect(labels).toContain('suspended');
  });

  it('hides the time summary when nothing is estimated or logged', () => {
    expect(
      fixtureHost(fixture).querySelector('[data-testid="project-time-summary"]')
    ).toBeNull();
  });

  it('shows spent and estimated time with a progress bar', () => {
    fixture.componentRef.setInput('spentMinutes', 200);
    fixture.componentRef.setInput('estimateMinutes', 300);
    fixture.detectChanges();

    const summary = requiredElement(
      fixtureHost(fixture),
      '[data-testid="project-time-summary"]',
      HTMLElement
    );

    expect(summary.textContent).toContain('3h 20m spent of 5h estimated');
    expect(summary.title).toBe('67% of the estimate used');
    expect(
      summary.querySelector<HTMLElement>('.project-header__time-bar')?.style
        .width
    ).toBe('67%');
  });

  it('marks a project over its estimate and shows spent time alone without one', () => {
    fixture.componentRef.setInput('spentMinutes', 90);
    fixture.componentRef.setInput('estimateMinutes', 60);
    fixture.detectChanges();

    const summary = () =>
      requiredElement(
        fixtureHost(fixture),
        '[data-testid="project-time-summary"]',
        HTMLElement
      );

    expect(summary().classList).toContain('project-header__time--over');

    fixture.componentRef.setInput('estimateMinutes', 0);
    fixture.detectChanges();

    expect(summary().textContent?.trim()).toContain('1h 30m spent');
    expect(summary().textContent).not.toContain('estimated');
  });

  it('selects the suspended filter when the count is clicked', () => {
    const changeFilter = vi.fn();
    fixture.componentInstance.changeFilter.subscribe(changeFilter);

    const countButton = requiredElement(
      fixtureHost(fixture),
      '[data-testid="project-suspended-count"]',
      HTMLButtonElement
    );

    countButton.click();

    expect(changeFilter).toHaveBeenCalledWith('suspended');
  });
});

function createProject(): Project {
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
  };
}
