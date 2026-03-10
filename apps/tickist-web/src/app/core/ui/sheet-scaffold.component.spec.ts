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
      (close)="onClose()"
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
    { key: 'general', label: 'General', icon: '✏️' },
    { key: 'extra', label: 'Extra', icon: '✨' },
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
      fixture.nativeElement.querySelector('[data-testid="shared-sheet"]')
    ).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Shared sheet');
    expect(fixture.nativeElement.textContent).toContain('General');
    expect(fixture.nativeElement.textContent).toContain('Projected footer');
  });

  it('emits tab changes and close requests', () => {
    const tabButton = fixture.nativeElement.querySelectorAll(
      '.sheet-shell__tab'
    )[1] as HTMLButtonElement;
    const closeButton = fixture.nativeElement.querySelector(
      '.sheet-shell__close'
    ) as HTMLButtonElement;

    tabButton.click();
    closeButton.click();

    expect(host.onTabChange).toHaveBeenCalledWith('extra');
    expect(host.onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps scroll responsibility on the panel content', () => {
    expect(
      fixture.nativeElement.querySelector('.sheet-shell__panel-scroll')
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelectorAll('.sheet-shell__footer')
    ).toHaveLength(1);
  });
});
