import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { ToastContainerComponent } from './toast-container.component';
import { ToastService } from './toast.service';

describe('ToastContainerComponent', () => {
  function setup() {
    const fixture = TestBed.createComponent(ToastContainerComponent);
    const service = TestBed.inject(ToastService);
    const host: HTMLElement = fixture.nativeElement;
    document.body.append(host);
    fixture.detectChanges();

    return { fixture, service, host };
  }

  it('keeps one named notifications region and a persistent live region', () => {
    const { fixture, service, host } = setup();

    expect(
      host.querySelector('[role="region"][aria-label="Notifications"]')
    ).not.toBeNull();
    expect(host.querySelector('[aria-live="polite"]')).not.toBeNull();

    service.success('Task saved');
    fixture.detectChanges();

    const toast = host.querySelector('.toast-item');
    expect(toast?.textContent).toContain('Task saved');
    // Toasts are announced by the service, not by live regions added with them.
    expect(toast?.querySelector('[aria-live]')).toBeNull();
    expect(toast?.hasAttribute('aria-live')).toBe(false);
    host.remove();
  });

  it('moves focus to the next toast when a focused toast is dismissed', async () => {
    const { fixture, service, host } = setup();

    service.infoWithAction('First', 'Undo', () => undefined);
    service.infoWithAction('Second', 'Undo', () => undefined);
    fixture.detectChanges();

    const closeButtons = () =>
      Array.from(
        host.querySelectorAll<HTMLButtonElement>('.toast-item__close')
      );

    closeButtons()[0]?.focus();
    closeButtons()[0]?.click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(service.toasts().map((toast) => toast.message)).toEqual(['Second']);
    expect(document.activeElement).toBe(closeButtons()[0]);
    host.remove();
  });
});
