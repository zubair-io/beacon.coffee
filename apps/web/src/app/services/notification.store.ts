import { Injectable, inject, signal, computed } from '@angular/core';
import { AtprotoService } from './atproto.service';
import type { NotificationItem, NotificationFilter } from '../types/notification';

@Injectable({ providedIn: 'root' })
export class NotificationStore {
  private readonly atproto = inject(AtprotoService);

  readonly notifications = signal<NotificationItem[]>([]);
  readonly filter = signal<NotificationFilter>('all');
  readonly loading = signal(false);
  private cursor: string | undefined;

  readonly unreadCount = computed(
    () => this.notifications().filter((n) => !n.isRead).length,
  );

  readonly filtered = computed(() => {
    const all = this.notifications();
    const f = this.filter();
    if (f === 'all') return all;
    if (f === 'mentions') return all.filter((n) => n.reason === 'mention');
    if (f === 'replies') return all.filter((n) => n.reason === 'reply');
    if (f === 'likes') return all.filter((n) => n.reason === 'like');
    return all;
  });

  async loadNotifications(): Promise<void> {
    if (!this.atproto.isAuthenticated()) return;
    this.loading.set(true);
    this.cursor = undefined;

    try {
      const result = await this.atproto.listNotifications();
      this.notifications.set(result.data.notifications ?? []);
      this.cursor = result.data.cursor;
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      this.loading.set(false);
    }
  }

  setFilter(filter: NotificationFilter): void {
    this.filter.set(filter);
  }

  markAllRead(): void {
    this.notifications.update((list) =>
      list.map((n) => ({ ...n, isRead: true })),
    );
  }
}
