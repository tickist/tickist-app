import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  inject,
  viewChild,
} from '@angular/core';

import { ToastMessage, ToastService } from './toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [],
  template: `
    <section
      #region
      class="toast-container"
      role="region"
      aria-label="Notifications"
    >
      @for (toast of toasts(); track toast.id; let index = $index) {
      <article
        class="toast-item"
        [class.toast-item--success]="toast.type === 'success'"
        [class.toast-item--info]="toast.type === 'info'"
        [class.toast-item--error]="toast.type === 'error'"
        (focusin)="onToastFocusIn(toast, $event)"
        (focusout)="onToastFocusOut(toast, $event)"
      >
        <p class="toast-item__message">{{ toast.message }}</p>
        @if (toast.action && toast.actionLabel) {
        <button
          type="button"
          class="toast-item__action"
          (click)="runAction(toast)"
        >
          {{ toast.actionLabel }}
        </button>
        }
        <button
          type="button"
          class="toast-item__close"
          aria-label="Dismiss notification"
          (click)="close(toast, index)"
        >
          <span aria-hidden="true">×</span>
        </button>
      </article>
      }
    </section>
    <div class="sr-only" aria-live="polite">{{ announcement() }}</div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./toast-container.component.css'],
})
export class ToastContainerComponent {
  private readonly toastsService = inject(ToastService);
  private readonly injector = inject(Injector);
  private readonly region =
    viewChild.required<ElementRef<HTMLElement>>('region');
  private returnFocusTo: HTMLElement | null = null;
  readonly toasts = this.toastsService.toasts;
  readonly announcement = this.toastsService.announcement;

  dismiss(id: string): void {
    this.toastsService.dismiss(id);
  }

  runAction(toast: ToastMessage): void {
    void toast.action?.();
    this.dismiss(toast.id);
  }

  close(toast: ToastMessage, index: number): void {
    const region = this.region().nativeElement;
    const hadFocus = region.contains(region.ownerDocument.activeElement);

    this.dismiss(toast.id);

    if (!hadFocus) return;

    // Keep keyboard users in place: the next toast, or where they came from.
    afterNextRender(
      () => {
        const remaining = Array.from(
          region.querySelectorAll<HTMLButtonElement>('.toast-item__close')
        );

        const next = remaining[Math.min(index, remaining.length - 1)];

        (next ?? this.returnFocusTo)?.focus();
      },
      { injector: this.injector }
    );
  }

  onToastFocusIn(toast: ToastMessage, event: FocusEvent): void {
    this.toastsService.pause(toast.id);
    const from = event.relatedTarget;

    if (
      from instanceof HTMLElement &&
      !this.region().nativeElement.contains(from)
    ) {
      this.returnFocusTo = from;
    }
  }

  onToastFocusOut(toast: ToastMessage, event: FocusEvent): void {
    const to = event.relatedTarget;
    const toastElement = event.currentTarget;

    if (
      to instanceof Node &&
      toastElement instanceof Node &&
      toastElement.contains(to)
    ) {
      return;
    }

    this.toastsService.resume(toast.id);
  }
}
