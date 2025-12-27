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
        class="toast"
        [class.toast-success]="toast.type === 'success'"
        [class.toast-info]="toast.type === 'info'"
        [class.toast-error]="toast.type === 'error'"
      >
        <span>{{ toast.message }}</span>
        <button type="button" (click)="dismiss(toast.id)">×</button>
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
