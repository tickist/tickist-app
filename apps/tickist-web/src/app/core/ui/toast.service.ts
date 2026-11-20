import { DOCUMENT, Injectable, inject, signal } from '@angular/core';

export type ToastType = 'success' | 'info' | 'error';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
  actionLabel?: string;
  action?: () => void | Promise<void>;
  duration: number;
  timeoutId?: ReturnType<typeof setTimeout>;
}

type AriaNotifyDocument = Document & {
  ariaNotify(message: string, options?: { priority?: 'normal' | 'high' }): void;
};

function supportsAriaNotify(doc: Document): doc is AriaNotifyDocument {
  return 'ariaNotify' in doc;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly document = inject(DOCUMENT);
  private readonly messagesSignal = signal<ToastMessage[]>([]);
  private readonly announcementSignal = signal('');
  private announcementTimer?: ReturnType<typeof setTimeout>;
  readonly toasts = this.messagesSignal.asReadonly();
  /** Text for the persistent live region used where ariaNotify() is missing. */
  readonly announcement = this.announcementSignal.asReadonly();
  private readonly durations = {
    success: 3000,
    info: 4000,
    error: 5000,
  } as const;

  success(message: string, duration: number = this.durations.success): void {
    this.show(message, 'success', duration);
  }

  info(message: string, duration: number = this.durations.info): void {
    this.show(message, 'info', duration);
  }

  infoWithAction(
    message: string,
    actionLabel: string,
    action: () => void | Promise<void>
  ): void {
    this.show(message, 'info', 0, actionLabel, action);
  }

  error(message: string, duration: number = this.durations.error): void {
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

  /** Stops auto-dismissal while the user is focused on a toast. */
  pause(id: string): void {
    this.messagesSignal.update((current) =>
      current.map((toast) => {
        if (toast.id !== id || !toast.timeoutId) return toast;
        clearTimeout(toast.timeoutId);

        return { ...toast, timeoutId: undefined };
      })
    );
  }

  /** Restarts auto-dismissal after focus leaves a toast. */
  resume(id: string): void {
    this.messagesSignal.update((current) =>
      current.map((toast) =>
        toast.id === id && toast.duration && !toast.timeoutId
          ? { ...toast, timeoutId: this.scheduleDismiss(id, toast.duration) }
          : toast
      )
    );
  }

  private show(
    message: string,
    type: ToastType,
    duration: number,
    actionLabel?: string,
    action?: () => void | Promise<void>
  ): void {
    const id =
      typeof crypto?.randomUUID !== 'undefined'
        ? crypto.randomUUID()
        : `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const timeoutId = duration ? this.scheduleDismiss(id, duration) : undefined;

    this.messagesSignal.update((current) => [
      ...current,
      { id, message, type, actionLabel, action, duration, timeoutId },
    ]);
    this.announce(
      action ? `${message} Actions available.` : message,
      type === 'error'
    );
  }

  private scheduleDismiss(
    id: string,
    duration: number
  ): ReturnType<typeof setTimeout> {
    return setTimeout(() => this.dismiss(id), duration);
  }

  /** Announces a status to screen readers without showing a toast. */
  announceStatus(text: string): void {
    this.announce(text, false);
  }

  // A live region added together with its text is often not announced, so
  // use ariaNotify() or a live region that is already in the page.
  private announce(text: string, urgent: boolean): void {
    if (supportsAriaNotify(this.document)) {
      this.document.ariaNotify(text, { priority: urgent ? 'high' : 'normal' });

      return;
    }

    clearTimeout(this.announcementTimer);
    this.announcementSignal.set('');
    // Clearing first lets a repeated message be announced again.
    this.announcementTimer = setTimeout(
      () => this.announcementSignal.set(text),
      100
    );
  }
}
