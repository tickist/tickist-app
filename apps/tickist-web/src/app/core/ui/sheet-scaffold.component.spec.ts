import {
  fixtureHost,
  requiredElement,
  elementsOfType,
} from '../../../testing/dom';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SheetScaffoldComponent } from './sheet-scaffold.component';

@Component({
  imports: [SheetScaffoldComponent],
  template: `
    <app-sheet-scaffold
      eyebrow="Editor"
      title="Shared sheet"
      testId="shared-sheet"
      [tabs]="tabs"
      [activeTab]="activeTab"
      (tabChange)="onTabChange($event)"
      (panelClose)="onClose()"
    >
      <div sheet-body>
        <p>Projected body</p>
      </div>
      <div sheet-footer>
        <button type="button">Projected footer</button>
      </div>
    </app-sheet-scaffold>
  `,
})
class TestHostComponent {
  readonly tabs = [
    { key: 'general', label: 'General', icon: 'edit' },
    { key: 'extra', label: 'Extra', icon: 'extra' },
  ];
  activeTab = 'general';
  readonly onTabChange = vi.fn();
  readonly onClose = vi.fn();
}

describe('SheetScaffoldComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders title, tabs and projected footer content', () => {
    expect(
      fixtureHost(fixture).querySelector('[data-testid="shared-sheet"]')
    ).not.toBeNull();
    expect(fixtureHost(fixture).textContent).toContain('Shared sheet');
    expect(fixtureHost(fixture).textContent).toContain('General');
    expect(fixtureHost(fixture).textContent).toContain('Projected footer');
  });

  it('emits tab changes and close requests', () => {
    const tabButton = elementsOfType(
      fixtureHost(fixture),
      '.sheet-shell__tab',
      HTMLButtonElement
    )[1];

    const closeButton = requiredElement(
      fixtureHost(fixture),
      '.sheet-shell__close',
      HTMLButtonElement
    );

    tabButton.click();
    closeButton.click();

    expect(host.onTabChange).toHaveBeenCalledWith('extra');
    expect(host.onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps scroll responsibility on the panel content', () => {
    expect(
      fixtureHost(fixture).querySelector('.sheet-shell__panel-scroll')
    ).not.toBeNull();
    expect(
      fixtureHost(fixture).querySelectorAll('.sheet-shell__footer')
    ).toHaveLength(1);
  });

  it('exposes tabs with arrow-key navigation and a labelled panel', () => {
    const tabs = elementsOfType(
      fixtureHost(fixture),
      '[role="tab"]',
      HTMLButtonElement
    );

    expect(
      fixtureHost(fixture).querySelector('[role="tablist"]')
    ).not.toBeNull();
    expect(tabs.map((tab) => tab.getAttribute('aria-selected'))).toEqual([
      'true',
      'false',
    ]);
    expect(tabs.map((tab) => tab.tabIndex)).toEqual([0, -1]);

    const panel = requiredElement(
      fixtureHost(fixture),
      '[role="tabpanel"]',
      HTMLElement
    );

    expect(panel.getAttribute('aria-labelledby')).toBe(tabs[0]?.id);

    tabs[0]?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })
    );
    expect(host.onTabChange).toHaveBeenCalledWith('extra');

    tabs[0]?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'End', bubbles: true })
    );
    expect(host.onTabChange).toHaveBeenLastCalledWith('extra');
  });
});
