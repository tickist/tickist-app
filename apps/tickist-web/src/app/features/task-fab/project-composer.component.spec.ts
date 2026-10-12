import { fixtureHost } from '../../../testing/dom';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Project, ProjectDataService } from '../../data/project-data.service';
import { SupabaseSessionService } from '../auth/supabase-session.service';
import {
  INVITE_PROCESSED_MESSAGE,
  ProjectComposerComponent,
} from './project-composer.component';

describe('ProjectComposerComponent sheet header', () => {
  let fixture: ComponentFixture<ProjectComposerComponent>;
  let component: ProjectComposerComponent;
  let inviteByEmail: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    inviteByEmail = vi.fn(async () => ({
      ok: true,
      code: 'invite_processed',
    }));

    await TestBed.configureTestingModule({
      imports: [ProjectComposerComponent],
      providers: [
        {
          provide: ProjectDataService,
          useValue: {
            list: () => [],
            createProject: vi.fn(async () => null),
            updateProject: vi.fn(async () => null),
            inviteByEmail,
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

    expect(fixtureHost(fixture).textContent).toContain('Create project');
    expect(fixtureHost(fixture).textContent).toContain('New project');
    expect(
      fixtureHost(fixture).querySelector('.sheet-shell__footer')
    ).not.toBeNull();
    expect(
      fixtureHost(fixture).querySelector('.sheet-shell__panel-scroll')
    ).not.toBeNull();
  });

  it('shows edit title and project name in edit mode', () => {
    component.preset = {
      mode: 'edit',
      project: createProject(),
    };
    fixture.detectChanges();

    expect(fixtureHost(fixture).textContent).toContain('Edit project');
    expect(fixtureHost(fixture).textContent).toContain('Trip planning');
  });

  it('shows a neutral result that does not reveal whether an account exists', async () => {
    component.preset = {
      mode: 'edit',
      project: createProject(),
    };
    fixture.detectChanges();

    component.inviteInput.set('someone@example.com');
    await component.addInvite();

    expect(inviteByEmail).toHaveBeenCalledWith(
      'project-1',
      'someone@example.com'
    );
    expect(component.inviteFeedback()).toEqual({
      type: 'success',
      message: INVITE_PROCESSED_MESSAGE,
    });
    expect(INVITE_PROCESSED_MESSAGE).toBe(
      'If this person has a Tickist account, they will receive an invitation.'
    );
  });

  it('reports an existing member as already having access', async () => {
    inviteByEmail.mockResolvedValueOnce({ ok: true, code: 'already_member' });
    component.preset = {
      mode: 'edit',
      project: createProject(),
    };
    fixture.detectChanges();

    component.inviteInput.set('member@example.com');
    await component.addInvite();

    expect(component.inviteFeedback()).toEqual({
      type: 'info',
      message: 'This person already has access.',
    });
  });

  it('uses themed buttons instead of a native project type dropdown', () => {
    fixture.detectChanges();

    const options = Array.from(
      fixtureHost(fixture).querySelectorAll<HTMLButtonElement>(
        '.project-type-option'
      )
    );

    expect(options.map((option) => option.textContent?.trim())).toEqual([
      'Active',
      'Someday/maybe',
      'Routine',
    ]);
    expect(
      fixtureHost(fixture).querySelector(
        'select[formcontrolname="projectType"]'
      )
    ).toBeNull();

    options[1].click();

    expect(component.form.controls.projectType.value).toBe('someday');
  });

  it('searches the expanded project icon catalogue by label or key', () => {
    component.selectTab('branding');
    component.iconSearch.set('pizza');
    fixture.detectChanges();

    expect(component.iconOptions.length).toBeGreaterThan(140);
    expect(component.filteredIconOptions().map((option) => option.key)).toEqual(
      ['pizza']
    );
    expect(
      fixtureHost(fixture).querySelector('button.icon-pill[aria-label="Pizza"]')
    ).not.toBeNull();
    expect(
      fixtureHost(fixture).querySelector(
        'button.icon-pill[aria-label="Folder"]'
      )
    ).toBeNull();
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
    members: [],
    ...overrides,
  };
}
