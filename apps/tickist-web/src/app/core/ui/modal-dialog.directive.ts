import {
  Directive,
  ElementRef,
  afterRenderEffect,
  inject,
  input,
  output,
} from '@angular/core';

/**
 * Opens a native <dialog> as a modal while `appModalDialog` is true. The
 * browser provides the inert page, focus containment, Esc and focus return.
 * Add `closedby="any"` for light dismiss; browsers without `closedby` get the
 * pointer fallback below. `dialogClosed` fires however the dialog closed, so
 * the owner can reset its state.
 */
@Directive({
  selector: 'dialog[appModalDialog]',
  host: {
    '(close)': 'dialogClosed.emit()',
    '(pointerdown)': 'onPointerDown($event)',
    '(pointerup)': 'onPointerUp($event)',
  },
})
export class ModalDialogDirective {
  readonly open = input.required<boolean>({ alias: 'appModalDialog' });
  readonly dialogClosed = output<void>();
  private readonly dialog =
    inject<ElementRef<HTMLDialogElement>>(ElementRef).nativeElement;
  private pressStartedOutside = false;

  constructor() {
    afterRenderEffect(() => {
      const open = this.open();

      // Environments without modal dialogs (such as jsdom) keep it closed.
      if (!('showModal' in this.dialog)) return;

      if (open && !this.dialog.open) {
        this.dialog.showModal();
      } else if (!open && this.dialog.open) {
        this.dialog.close();
      }
    });
  }

  // Light-dismiss fallback for browsers without <dialog closedby>. Compare the
  // pointer with the dialog box: the dialog element is also the event target
  // for its own padding, so a target check would close on those clicks.
  onPointerDown(event: PointerEvent): void {
    this.pressStartedOutside = this.isOutside(event);
  }

  onPointerUp(event: PointerEvent): void {
    if (
      this.dialog.getAttribute('closedby') === 'any' &&
      !('closedBy' in HTMLDialogElement.prototype) &&
      this.pressStartedOutside &&
      this.isOutside(event)
    ) {
      this.dialog.close();
    }

    this.pressStartedOutside = false;
  }

  private isOutside(event: PointerEvent): boolean {
    const rect = this.dialog.getBoundingClientRect();

    return (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    );
  }
}
