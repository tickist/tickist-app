import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'info' | 'error';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  timeoutId?: ReturnType<typeof setTimeout>;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly messagesSignal = signal<ToastMessage[]>([]);
  readonly toasts = this.messagesSignal.asReadonly();
  private readonly durations = {
    success: 3000,
    info: 4000,
    error: 5000,
  } as const;

  success(message: string, duration = this.durations.success): void {
    this.show(message, 'success', duration);
  }

  info(message: string, duration = this.durations.info): void {
    this.show(message, 'info', duration);
  }

  error(message: string, duration = this.durations.error): void {
    this.show(message, 'error', duration);
  }

  dismiss(id: string): void {
    this.messagesSignal.update((current) => {
      const toast = current.find((item) => item.id === id);
      if (toast?.timeoutId) {
        clearTimeout(toast.timeoutId);
      }
      return current.filter((item) => item.id !== id);
    });
  }

  private show(message: string, type: ToastType, duration: number): void {
    const id =
      typeof crypto?.randomUUID === 'function'
        ? crypto.randomUUID()
        : `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const timeoutId = setTimeout(() => this.dismiss(id), duration);
    this.messagesSignal.update((current) => [
      ...current,
      { id, message, type, timeoutId },
    ]);
  }
}
