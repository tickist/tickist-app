import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Project, ProjectDataService } from '../../data/project-data.service';
import { SupabaseSessionService } from '../auth/supabase-session.service';
import { ProjectComposerComponent } from './project-composer.component';

describe('ProjectComposerComponent sheet header', () => {
  let fixture: ComponentFixture<ProjectComposerComponent>;
  let component: ProjectComposerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectComposerComponent],
      providers: [
        {
          provide: ProjectDataService,
          useValue: {
            list: () => [],
            createProject: vi.fn(async () => null),
            updateProject: vi.fn(async () => null),
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

    fixture = TestBed.createComponent(ProjectComposerComponent);
    component = fixture.componentInstance;
  });

  it('shows create title and shared sticky footer in create mode', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Create project');
    expect(fixture.nativeElement.textContent).toContain('New project');
    expect(
      fixture.nativeElement.querySelector('.sheet-shell__footer')
    ).not.toBeNull();
  });

  it('shows edit title and project name in edit mode', () => {
    component.preset = {
      mode: 'edit',
      project: createProject(),
    };
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Edit project');
    expect(fixture.nativeElement.textContent).toContain('Trip planning');
  });
});

function createProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'project-1',
    ownerId: 'owner-1',
    name: 'Trip planning',
    description: 'Summer tasks',
    color: '#1D4ED8',
    icon: 'folder',
    isActive: true,
    isInbox: false,
    projectType: 'active',
    ancestorId: null,
    taskView: 'extended',
    shareWithIds: [],
    ...overrides,
  };
}
