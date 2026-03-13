import { Component, inject, effect } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { PostCardComponent } from '../../components/molecules/post-card/post-card.component';
import { SortTabsComponent } from '../../components/molecules/sort-tabs/sort-tabs.component';
import { ThreadPanelComponent } from '../../components/organisms/thread-panel/thread-panel.component';
import { SpinnerComponent } from '../../components/atoms/spinner/spinner.component';
import { FeedStore } from '../../services/feed.store';
import { ThreadStore } from '../../services/thread.store';
import { CommunityStore } from '../../services/community.store';
import { AtprotoService } from '../../services/atproto.service';
import { AuthService } from '../../services/auth.service';
import type { PostView, FeedSort } from '../../types/post';

@Component({
  selector: 'beacon-community-view',
  standalone: true,
  imports: [
    PostCardComponent,
    SortTabsComponent,
    ThreadPanelComponent,
    SpinnerComponent,
  ],
  templateUrl: './community-view.component.html',
  styleUrl: './community-view.component.scss',
})
export class CommunityViewComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly feedStore = inject(FeedStore);
  readonly threadStore = inject(ThreadStore);
  readonly communityStore = inject(CommunityStore);
  readonly atproto = inject(AtprotoService);
  readonly auth = inject(AuthService);

  readonly tag = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('communityTag') ?? '')),
    { initialValue: '' },
  );

  constructor() {
    effect(() => {
      const t = this.tag();
      if (t) {
        this.threadStore.closeThread();
        this.feedStore.loadFeed(t, this.feedStore.sort());
      }
    });
  }

  get isJoined(): boolean {
    return this.communityStore.isJoined(this.tag());
  }

  onSortChange(sort: FeedSort): void {
    this.feedStore.loadFeed(this.tag(), sort);
  }

  onPostClick(post: PostView): void {
    this.threadStore.openThread(post.uri);
  }

  onLoadMore(): void {
    this.feedStore.loadMore(this.tag());
  }

  toggleJoin(): void {
    const t = this.tag();
    if (this.communityStore.isJoined(t)) {
      this.communityStore.leave(t);
    } else {
      this.communityStore.join(t);
    }
  }

  async onLike(post: PostView): Promise<void> {
    if (!this.atproto.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    try {
      const viewer = post.viewer as any;
      if (viewer?.like) {
        await this.atproto.unlike(viewer.like);
      } else {
        await this.atproto.like(post.uri, post.cid);
      }
      this.feedStore.loadFeed(this.tag(), this.feedStore.sort());
    } catch (err) {
      console.error('Like failed:', err);
    }
  }

  async onRepost(post: PostView): Promise<void> {
    if (!this.atproto.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }
    try {
      const viewer = post.viewer as any;
      if (viewer?.repost) {
        await this.atproto.unrepost(viewer.repost);
      } else {
        await this.atproto.repost(post.uri, post.cid);
      }
      this.feedStore.loadFeed(this.tag(), this.feedStore.sort());
    } catch (err) {
      console.error('Repost failed:', err);
    }
  }
}
