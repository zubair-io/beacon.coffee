import { Injectable, signal, computed } from '@angular/core';
import type { Community } from '../types/community';

const STORAGE_KEY = 'beacon_communities';

@Injectable({ providedIn: 'root' })
export class CommunityStore {
  readonly communities = signal<Community[]>(this.load());
  readonly joinedTags = computed(() => new Set(this.communities().map((c) => c.hashtag)));

  join(hashtag: string): void {
    const tag = hashtag.toLowerCase().replace(/^#/, '');
    if (this.joinedTags().has(tag)) return;
    this.communities.update((list) => [
      ...list,
      { hashtag: tag, joinedAt: new Date().toISOString() },
    ]);
    this.save();
  }

  leave(hashtag: string): void {
    const tag = hashtag.toLowerCase().replace(/^#/, '');
    this.communities.update((list) => list.filter((c) => c.hashtag !== tag));
    this.save();
  }

  isJoined(hashtag: string): boolean {
    return this.joinedTags().has(hashtag.toLowerCase().replace(/^#/, ''));
  }

  private load(): Community[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.communities()));
  }
}
