import { Injectable, inject, signal, computed } from '@angular/core';
import { AppBskyFeedDefs } from '@atproto/api';
import { AtprotoService } from './atproto.service';
import type { ThreadViewPost } from '../types/post';

@Injectable({ providedIn: 'root' })
export class ThreadStore {
  private readonly atproto = inject(AtprotoService);

  readonly activeThread = signal<ThreadViewPost | null>(null);
  readonly isOpen = computed(() => this.activeThread() !== null);
  readonly loading = signal(false);

  async openThread(uri: string): Promise<void> {
    this.loading.set(true);
    try {
      const result = await this.atproto.getPostThread(uri);
      if (AppBskyFeedDefs.isThreadViewPost(result.thread)) {
        this.activeThread.set(result.thread);
      } else {
        this.activeThread.set(null);
      }
    } catch (err) {
      console.error('Failed to load thread:', err);
      this.activeThread.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  closeThread(): void {
    this.activeThread.set(null);
  }
}
