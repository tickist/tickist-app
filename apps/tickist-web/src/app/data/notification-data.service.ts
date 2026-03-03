import { Injectable, computed, inject, signal } from '@angular/core';
import { SUPABASE_CLIENT } from '../config/supabase.provider';

export interface NotificationItem {
  id: string;
  recipientId: string;
  title: string;
  description?: string | null;
  type: string;
  icon?: string | null;
  createdAt: string;
  isRead: boolean;
}

type NotificationRow = {
  id: string;
  recipient_id: string;
  title: string;
  description: string | null;
  type: string;
  icon: string | null;
  created_at: string;
  is_read: boolean;
};

@Injectable({ providedIn: 'root' })
export class NotificationDataService {
  private readonly supabase = inject(SUPABASE_CLIENT, { optional: true });
  private readonly items = signal<NotificationItem[]>([]);
  private readonly loading = signal(false);
  private readonly activeRecipient = signal<string | null>(null);

  readonly list = computed(() => this.items());
  readonly loadingState = computed(() => this.loading());

  async refresh(recipientId: string | null): Promise<void> {
    if (!this.supabase || !recipientId) {
      this.items.set([]);
      this.activeRecipient.set(recipientId);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.activeRecipient.set(recipientId);
    const { data, error } = await this.supabase
      .from('notifications')
      .select(
        'id, recipient_id, title, description, type, icon, created_at, is_read'
      )
      .eq('recipient_id', recipientId)
      .order('created_at', { ascending: false })
      .limit(50);

    this.loading.set(false);
    if (error || !data) {
      console.warn('[Notifications] Unable to fetch notifications', error);
      return;
    }

    this.items.set(
      (data as NotificationRow[]).map((row) => ({
        id: row.id,
        recipientId: row.recipient_id,
        title: row.title,
        description: row.description,
        type: row.type,
        icon: row.icon,
        createdAt: row.created_at,
        isRead: row.is_read,
      }))
    );
  }

  async markAsRead(notificationId: string): Promise<void> {
    if (!this.supabase) {
      return;
    }
    const target = this.items().find((item) => item.id === notificationId);
    if (!target || target.isRead) {
      return;
    }
    const { error } = await this.supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    if (error) {
      console.warn('[Notifications] Unable to mark as read', error);
      return;
    }
    this.items.update((current) =>
      current.map((item) =>
        item.id === notificationId ? { ...item, isRead: true } : item
      )
    );
  }
}
