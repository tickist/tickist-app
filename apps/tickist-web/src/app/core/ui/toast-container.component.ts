import { Component, inject } from '@angular/core';
import { NgFor } from '@angular/common';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [NgFor],
  template: `
    <section class="toast-container">
      <article
        *ngFor="let toast of toasts()"
        class="toast-item"
        [class.toast-item--success]="toast.type === 'success'"
        [class.toast-item--info]="toast.type === 'info'"
        [class.toast-item--error]="toast.type === 'error'"
        role="status"
        aria-live="polite"
      >
        <p class="toast-item__message">{{ toast.message }}</p>
        <button
          type="button"
          class="toast-item__close"
          aria-label="Dismiss notification"
          (click)="dismiss(toast.id)"
        >
          ×
        </button>
      </article>
    </section>
  `,
  styleUrls: ['./toast-container.component.css'],
})
export class ToastContainerComponent {
  private readonly toastsService = inject(ToastService);
  readonly toasts = this.toastsService.toasts;

  dismiss(id: string): void {
    this.toastsService.dismiss(id);
  }
}
