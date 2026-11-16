import {
  Directive,
  ElementRef,
  afterNextRender,
  inject,
  input,
  output,
} from '@angular/core';

const GUTTER = 8;

/**
 * Shows the host element as a popover="auto" in the top layer as soon as it
 * renders (render it with @if while the menu is open), anchored below the
 * given trigger. The browser provides Esc, light dismiss and focus return;
 * `popoverClosed` reports those native closes so the owner can reset state.
 * Placement is computed in script because CSS anchor positioning is not
 * Baseline yet.
 */
@Directive({
  selector: '[appAnchoredPopover]',
  host: {
    popover: 'auto',
    '(toggle)': 'onToggle($event)',
  },
})
export class AnchoredPopoverDirective {
  readonly anchor = input.required<HTMLElement>({
    alias: 'appAnchoredPopover',
  });
  /** Which trigger edge the popover lines up with. */
  readonly popoverAlign = input<'start' | 'end'>('end');
  /** Makes the popover at least as wide as its trigger (dropdown lists). */
  readonly popoverMatchWidth = input(false);
  /** Fires once the popover is visible, so focus can move into it. */
  readonly popoverOpened = output<void>();
  readonly popoverClosed = output<void>();
  private readonly element =
    inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  constructor() {
    afterNextRender(() => {
      const anchor = this.anchor();

      // Without popover support the element stays in normal flow.
      if ('showPopover' in this.element) {
        // `source` keeps the trigger in the popover's light-dismiss group, so
        // clicking it toggles the menu instead of dismissing and reopening it.
        this.element.showPopover({ source: anchor });
        this.place(anchor);
      }

      this.popoverOpened.emit();
    });
  }

  onToggle(event: Event): void {
    if ('newState' in event && event.newState === 'closed') {
      this.popoverClosed.emit();
    }
  }

  private place(anchor: HTMLElement): void {
    const rect = anchor.getBoundingClientRect();
    const style = this.element.style;

    if (this.popoverMatchWidth()) style.minWidth = `${rect.width}px`;

    const width = this.element.offsetWidth;

    const preferred =
      this.popoverAlign() === 'end' ? rect.right - width : rect.left;

    const maxLeft = window.innerWidth - width - GUTTER;

    // A top-layer popover is fixed, so the page cannot scroll to reveal it:
    // open above the trigger when that side has more room, and cap the height
    // so long menus scroll inside themselves.
    const height = this.element.offsetHeight;
    const spaceBelow = window.innerHeight - rect.bottom - GUTTER * 2;
    const spaceAbove = rect.top - GUTTER * 2;
    const above = height > spaceBelow && spaceAbove > spaceBelow;
    const maxHeight = Math.max(above ? spaceAbove : spaceBelow, 0);

    style.position = 'fixed';
    style.inset = 'auto';
    style.margin = '0';
    style.maxHeight = `${maxHeight}px`;
    style.overflowY = 'auto';
    style.top = above
      ? `${Math.max(GUTTER, rect.top - GUTTER - Math.min(height, maxHeight))}px`
      : `${rect.bottom + GUTTER}px`;
    style.left = `${Math.max(GUTTER, Math.min(preferred, maxLeft))}px`;
  }
}
