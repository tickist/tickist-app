import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ModalDialogDirective } from './modal-dialog.directive';

@Component({
  imports: [ModalDialogDirective],
  template: `
    <dialog closedby="any" [appModalDialog]="open()" (dialogClosed)="closed()">
      <button type="button">Inside</button>
    </dialog>
  `,
})
class HostComponent {
  readonly open = signal(false);
  readonly closed = vi.fn(() => this.open.set(false));
}

describe('ModalDialogDirective', () => {
  const prototype = HTMLDialogElement.prototype;

  beforeEach(() => {
    // jsdom does not implement modal dialogs; emulate the open state only.
    Object.defineProperty(prototype, 'showModal', {
      configurable: true,
      value: vi.fn(function (this: HTMLDialogElement) {
        this.setAttribute('open', '');
      }),
    });
    Object.defineProperty(prototype, 'close', {
      configurable: true,
      value: vi.fn(function (this: HTMLDialogElement) {
        this.removeAttribute('open');
        this.dispatchEvent(new Event('close'));
      }),
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(prototype, 'showModal');
    Reflect.deleteProperty(prototype, 'close');
  });

  function setup() {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    const dialog: HTMLDialogElement =
      fixture.nativeElement.querySelector('dialog');

    return { fixture, dialog };
  }

  it('opens and closes the dialog from its input and reports closes', () => {
    const { fixture, dialog } = setup();

    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    expect(dialog.open).toBe(true);

    fixture.componentInstance.open.set(false);
    fixture.detectChanges();
    expect(dialog.open).toBe(false);
    expect(fixture.componentInstance.closed).toHaveBeenCalledOnce();
  });

  it('light-dismisses on a press and release outside the dialog box', () => {
    const { fixture, dialog } = setup();

    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    vi.spyOn(dialog, 'getBoundingClientRect').mockReturnValue(
      DOMRect.fromRect({ x: 100, y: 100, width: 200, height: 200 })
    );

    // Inside the box: stays open.
    dialog.dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 150, clientY: 150 })
    );
    dialog.dispatchEvent(
      new PointerEvent('pointerup', { clientX: 150, clientY: 150 })
    );
    expect(dialog.open).toBe(true);

    // Backdrop (outside the box): closes, since jsdom lacks closedBy.
    dialog.dispatchEvent(
      new PointerEvent('pointerdown', { clientX: 10, clientY: 10 })
    );
    dialog.dispatchEvent(
      new PointerEvent('pointerup', { clientX: 10, clientY: 10 })
    );
    fixture.detectChanges();
    expect(dialog.open).toBe(false);
    expect(fixture.componentInstance.open()).toBe(false);
  });
});
