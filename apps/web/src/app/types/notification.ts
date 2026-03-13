import type { AppBskyNotificationListNotifications } from '@atproto/api';

export type NotificationItem = AppBskyNotificationListNotifications.Notification;
export type NotificationReason = 'like' | 'repost' | 'follow' | 'mention' | 'reply' | 'quote' | 'starterpack-joined';
export type NotificationFilter = 'all' | 'mentions' | 'replies' | 'likes';
