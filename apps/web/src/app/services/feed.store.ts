import { Injectable, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { AtprotoService } from './atproto.service';
import type { PostView, FeedSort } from '../types/post';

@Injectable({ providedIn: 'root' })
export class FeedStore {
  private readonly atproto = inject(AtprotoService);

  readonly posts = signal<PostView[]>([]);
  readonly sort = signal<FeedSort>('top');
  readonly loading = signal(false);
  readonly hasMore = signal(true);
  private cursor: string | undefined;

  loadFeed(hashtag: string, sort: FeedSort = 'top'): void {
    this.sort.set(sort);
    this.loading.set(true);
    this.cursor = undefined;

    this.atproto.searchPosts(`#${hashtag}`, sort).subscribe({
      next: (result) => {
        this.posts.set(result.posts ?? []);
        this.cursor = result.cursor;
        this.hasMore.set(!!result.cursor);
      },
      error: (err) => {
        console.error('Failed to load feed:', err);
        this.posts.set([]);
        this.hasMore.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  loadMore(hashtag: string): void {
    if (!this.cursor || this.loading()) return;
    this.loading.set(true);

    this.atproto.searchPosts(`#${hashtag}`, this.sort(), this.cursor).subscribe({
      next: (result) => {
        this.posts.update((existing) => [...existing, ...(result.posts ?? [])]);
        this.cursor = result.cursor;
        this.hasMore.set(!!result.cursor);
      },
      error: (err) => console.error('Failed to load more posts:', err),
      complete: () => this.loading.set(false),
    });
  }

  loadHomeFeed(tags: string[], sort: FeedSort = 'top'): void {
    if (tags.length === 0) {
      this.posts.set([]);
      this.loading.set(false);
      return;
    }

    this.sort.set(sort);
    this.loading.set(true);
    this.cursor = undefined;

    const tagsToFetch = tags.slice(0, 10);
    forkJoin(tagsToFetch.map((tag) => this.atproto.searchPosts(`#${tag}`, sort))).subscribe({
      next: (results) => {
        const allPosts: PostView[] = results.flatMap((r: any) => r.posts ?? []);

        const seen = new Set<string>();
        const deduped = allPosts.filter((p) => {
          if (seen.has(p.uri)) return false;
          seen.add(p.uri);
          return true;
        });

        deduped.sort(
          (a, b) => new Date(b.indexedAt).getTime() - new Date(a.indexedAt).getTime(),
        );

        this.posts.set(deduped);
        this.hasMore.set(false);
      },
      error: (err) => {
        console.error('Failed to load home feed:', err);
        this.posts.set([]);
      },
      complete: () => this.loading.set(false),
    });
  }
}
