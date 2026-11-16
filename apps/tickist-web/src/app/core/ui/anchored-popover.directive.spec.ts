import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { AnchoredPopoverDirective } from './anchored-popover.directive';

@Component({
  imports: [AnchoredPopoverDirective],
  template: `
    <button #trigger type="button">Menu</button>
    @if (open()) {
    <div
      class="menu"
      [appAnchoredPopover]="trigger"
      (popoverOpened)="opened()"
      (popoverClosed)="closed()"
    >
      <button type="button">Item</button>
    </div>
    }
  `,
})
class HostComponent {
  readonly open = signal(true);
  readonly opened = vi.fn();
  readonly closed = vi.fn(() => this.open.set(false));
}

describe('AnchoredPopoverDirective', () => {
  it('marks the host as an auto popover and reports when it is open', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const menu: HTMLElement = fixture.nativeElement.querySelector('.menu');

    expect(menu.getAttribute('popover')).toBe('auto');
    expect(fixture.componentInstance.opened).toHaveBeenCalledOnce();
  });

  it('reports native closes (Esc or light dismiss) to the owner', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const menu: HTMLElement = fixture.nativeElement.querySelector('.menu');

    // jsdom has no ToggleEvent; the directive only reads newState.
    menu.dispatchEvent(
      Object.assign(new Event('toggle'), { newState: 'open' })
    );
    expect(fixture.componentInstance.closed).not.toHaveBeenCalled();

    menu.dispatchEvent(
      Object.assign(new Event('toggle'), { newState: 'closed' })
    );
    fixture.detectChanges();
    expect(fixture.componentInstance.closed).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.querySelector('.menu')).toBeNull();
  });
});
