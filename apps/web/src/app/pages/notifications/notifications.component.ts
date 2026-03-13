import { Component, inject, OnInit } from '@angular/core';
import { AvatarComponent } from '../../components/atoms/avatar/avatar.component';
import { NotificationStore } from '../../services/notification.store';
import { AuthService } from '../../services/auth.service';
import { SpinnerComponent } from '../../components/atoms/spinner/spinner.component';
import { relativeTime } from '../../utils/time';
import type { NotificationFilter } from '../../types/notification';

@Component({
  selector: 'beacon-notifications',
  standalone: true,
  imports: [AvatarComponent, SpinnerComponent],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss',
})
export class NotificationsComponent implements OnInit {
  readonly notificationStore = inject(NotificationStore);
  readonly auth = inject(AuthService);

  readonly filterOptions: { label: string; value: NotificationFilter }[] = [
    { label: 'All', value: 'all' },
    { label: 'Mentions', value: 'mentions' },
    { label: 'Replies', value: 'replies' },
    { label: 'Likes', value: 'likes' },
  ];

  ngOnInit(): void {
    this.notificationStore.loadNotifications();
  }

  setFilter(filter: NotificationFilter): void {
    this.notificationStore.setFilter(filter);
  }

  markAllRead(): void {
    this.notificationStore.markAllRead();
  }

  getTime(dateString: string): string {
    return relativeTime(dateString);
  }

  getActionText(reason: string): string {
    switch (reason) {
      case 'like': return 'liked your post';
      case 'repost': return 'reposted your post';
      case 'follow': return 'started following you';
      case 'mention': return 'mentioned you';
      case 'reply': return 'replied to your post';
      case 'quote': return 'quoted your post';
      default: return 'interacted with your post';
    }
  }
}
