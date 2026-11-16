import {
  fixtureHost,
  requiredElement,
  elementsOfType,
} from '../../../testing/dom';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ProjectPickerComponent,
  ProjectPickerItem,
} from './project-picker.component';

describe('ProjectPickerComponent', () => {
  let fixture: ComponentFixture<ProjectPickerComponent>;
  let component: ProjectPickerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectPickerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectPickerComponent);
    component = fixture.componentInstance;
    component.projects = createProjects();
    component.includeEmptyOption = false;
    component.selectedProjectId = 'project-child';
    fixture.detectChanges();
  });

  it('renders nested projects with colored icons instead of color dots', () => {
    openPicker(fixture);

    const options = getOptionButtons(fixture);
    expect(optionLabels(options)).toEqual([
      'Alpha project',
      'Alpha child',
      'Zulu project',
    ]);
    expect(options[1]?.style.paddingInlineStart).not.toBe(
      options[0]?.style.paddingInlineStart
    );
    expect(
      fixtureHost(fixture).querySelector('.project-picker__dot')
    ).toBeNull();
    expect(
      fixtureHost(fixture)
        .querySelector('.project-picker__trigger .project-picker__icon')
        ?.getAttribute('style')
    ).toMatch(/14,\s*165,\s*233/);
    expect(
      fixtureHost(fixture).querySelector('.project-picker__trigger ng-icon svg')
    ).not.toBeNull();
  });

  it('filters results while keeping the parent-child context visible', () => {
    openPicker(fixture);

    const searchInput = requiredElement(
      fixtureHost(fixture),
      '.project-picker__search-input',
      HTMLInputElement
    );

    searchInput.value = 'child';
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const options = getOptionButtons(fixture);
    expect(optionLabels(options)).toEqual(['Alpha project', 'Alpha child']);
    expect(
      options[1]
        ?.querySelector('.project-picker__option-parent')
        ?.textContent?.trim()
    ).toBe('Alpha project');
  });

  it('shows shared badge only when at least two accepted members are attached', () => {
    component.projects = [
      createProject({
        id: 'single-member',
        name: 'Single member',
        members: [{ status: 'accepted' }],
      }),
      createProject({
        id: 'two-members',
        name: 'Two members',
        members: [{ status: 'accepted' }, { status: 'accepted' }],
      }),
    ];
    component.selectedProjectId = 'single-member';
    fixture.detectChanges();

    expect(
      fixtureHost(fixture).querySelector('.project-picker__shared')
    ).toBeNull();

    openPicker(fixture);
    const options = getOptionButtons(fixture);
    expect(options[0]?.textContent).not.toContain('Shared');
    expect(options[1]?.textContent).toContain('Shared');
  });

  it('renders the menu as a popover and focuses the search field once open', () => {
    // jsdom hides [popover] content without implementing showPopover(), so
    // focus cannot land there; assert that focus was requested instead.
    const focus = vi.spyOn(HTMLInputElement.prototype, 'focus');

    try {
      openPicker(fixture);

      const menu = requiredElement(
        fixtureHost(fixture),
        '.project-picker__menu',
        HTMLElement
      );

      const search = requiredElement(
        fixtureHost(fixture),
        '.project-picker__search-input',
        HTMLInputElement
      );

      expect(menu.getAttribute('popover')).toBe('auto');
      expect(focus.mock.contexts).toContain(search);
    } finally {
      focus.mockRestore();
    }
  });

  it('keeps the whole menu, search field included, inside the viewport', () => {
    const restore = placeTrigger(fixture, { top: 503, bottom: 560 }, 892);

    try {
      openPicker(fixture);

      const menu = requiredElement(
        fixtureHost(fixture),
        '.project-picker__menu',
        HTMLElement
      );

      // 892 - (560 + 6) - 12 px gutter = 314 px left below the trigger.
      expect(menu.style.top).toBe('566px');
      expect(menu.style.bottom).toBe('');
      expect(menu.style.maxHeight).toBe('314px');
    } finally {
      restore();
    }
  });

  it('opens above the trigger when there is little room below', () => {
    const restore = placeTrigger(fixture, { top: 700, bottom: 744 }, 892);

    try {
      openPicker(fixture);

      const menu = requiredElement(
        fixtureHost(fixture),
        '.project-picker__menu',
        HTMLElement
      );

      expect(menu.style.top).toBe('');
      expect(menu.style.bottom).toBe('198px');
      expect(menu.style.maxHeight).toBe('320px');
    } finally {
      restore();
    }
  });

  it('closes when the popover is dismissed natively', () => {
    openPicker(fixture);

    const menu = requiredElement(
      fixtureHost(fixture),
      '.project-picker__menu',
      HTMLElement
    );

    // jsdom has no ToggleEvent; the component only reads newState.
    menu.dispatchEvent(
      Object.assign(new Event('toggle'), { newState: 'closed' })
    );
    fixture.detectChanges();

    expect(component.isOpen()).toBe(false);
    expect(
      fixtureHost(fixture).querySelector('.project-picker__menu')
    ).toBeNull();
  });
});

function openPicker(fixture: ComponentFixture<ProjectPickerComponent>): void {
  const trigger = requiredElement(
    fixtureHost(fixture),
    '.project-picker__trigger',
    HTMLButtonElement
  );

  trigger.click();
  fixture.detectChanges();
}

function getOptionButtons(
  fixture: ComponentFixture<ProjectPickerComponent>
): HTMLButtonElement[] {
  return elementsOfType(
    fixtureHost(fixture),
    '.project-picker__option',
    HTMLButtonElement
  );
}

function optionLabels(options: HTMLButtonElement[]): string[] {
  return options.map(
    (option) =>
      option
        .querySelector('.project-picker__option-text')
        ?.textContent?.trim() ?? ''
  );
}

function createProjects(): ProjectPickerItem[] {
  return [
    {
      id: 'project-zulu',
      name: 'Zulu project',
      ancestorId: null,
      icon: 'folder',
      color: '#F97316',
    },
    {
      id: 'project-alpha',
      name: 'Alpha project',
      ancestorId: null,
      icon: 'folder',
      color: '#1D4ED8',
    },
    {
      id: 'project-child',
      name: 'Alpha child',
      ancestorId: 'project-alpha',
      icon: 'folder',
      color: '#0EA5E9',
    },
  ];
}

function createProject(
  overrides: Partial<ProjectPickerItem> = {}
): ProjectPickerItem {
  return {
    id: 'project-1',
    name: 'Project',
    ancestorId: null,
    icon: 'folder',
    color: '#0EA5E9',
    members: [],
    ...overrides,
  };
}

function placeTrigger(
  fixture: ComponentFixture<ProjectPickerComponent>,
  rect: { top: number; bottom: number },
  viewportHeight: number
): () => void {
  const trigger = requiredElement(
    fixtureHost(fixture),
    '.project-picker__trigger',
    HTMLButtonElement
  );

  const original = window.innerHeight;

  vi.spyOn(trigger, 'getBoundingClientRect').mockReturnValue(
    new DOMRect(100, rect.top, 600, rect.bottom - rect.top)
  );
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: viewportHeight,
  });

  return () =>
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: original,
    });
}
