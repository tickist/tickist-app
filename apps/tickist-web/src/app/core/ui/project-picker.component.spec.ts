import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { ProjectPickerComponent, ProjectPickerItem } from './project-picker.component';

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
      fixture.nativeElement.querySelector('.project-picker__dot')
    ).toBeNull();
    expect(
      fixture.nativeElement
        .querySelector('.project-picker__trigger .project-picker__icon')
        ?.getAttribute('style')
    ).toMatch(/14,\s*165,\s*233/);
  });

  it('filters results while keeping the parent-child context visible', () => {
    openPicker(fixture);

    const searchInput = fixture.nativeElement.querySelector(
      '.project-picker__search-input'
    ) as HTMLInputElement;
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
});

function openPicker(fixture: ComponentFixture<ProjectPickerComponent>): void {
  const trigger = fixture.nativeElement.querySelector(
    '.project-picker__trigger'
  ) as HTMLButtonElement;
  trigger.click();
  fixture.detectChanges();
}

function getOptionButtons(
  fixture: ComponentFixture<ProjectPickerComponent>
): HTMLButtonElement[] {
  return Array.from(
    fixture.nativeElement.querySelectorAll('.project-picker__option')
  ) as HTMLButtonElement[];
}

function optionLabels(options: HTMLButtonElement[]): string[] {
  return options.map(
    (option) =>
      option.querySelector('.project-picker__option-text')?.textContent?.trim() ?? ''
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
