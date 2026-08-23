import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

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
      fixture.nativeElement.querySelector(
        '[data-testid="project-suspended-count"]'
      ).textContent
    ).toContain('Suspended: 3');

    const filterButton = fixture.nativeElement.querySelector(
      'button[title="Filter"]'
    ) as HTMLButtonElement;
    filterButton.click();
    fixture.detectChanges();

    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('button.filter-option')
    ).map((button) => (button as HTMLElement).textContent?.trim());
    expect(labels).toContain('suspended');
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
