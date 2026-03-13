import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PostCardComponent } from '../../components/molecules/post-card/post-card.component';
import { SortTabsComponent } from '../../components/molecules/sort-tabs/sort-tabs.component';
import { SpinnerComponent } from '../../components/atoms/spinner/spinner.component';
import { FeedStore } from '../../services/feed.store';
import { CommunityStore } from '../../services/community.store';
import { ThreadStore } from '../../services/thread.store';
import { AtprotoService } from '../../services/atproto.service';
import { extractHashtags } from '../../utils/hashtag';
import type { PostView, FeedSort } from '../../types/post';

@Component({
  selector: 'beacon-home-feed',
  standalone: true,
  imports: [PostCardComponent, SortTabsComponent, SpinnerComponent],
  templateUrl: './home-feed.component.html',
  styleUrl: './home-feed.component.scss',
})
export class HomeFeedComponent implements OnInit {
  readonly feedStore = inject(FeedStore);
  readonly communityStore = inject(CommunityStore);
  readonly threadStore = inject(ThreadStore);
  private readonly atproto = inject(AtprotoService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.loadFeed();
  }

  loadFeed(): void {
    const tags = this.communityStore.communities().map((c) => c.hashtag);
    this.feedStore.loadHomeFeed(tags, this.feedStore.sort());
  }

  onSortChange(sort: FeedSort): void {
    const tags = this.communityStore.communities().map((c) => c.hashtag);
    this.feedStore.loadHomeFeed(tags, sort);
  }

  getCommunityTag(post: PostView): string {
    const rec = post.record as any;
    const tags = extractHashtags(rec?.text ?? '');
    const joined = this.communityStore.joinedTags();
    return tags.find((t) => joined.has(t)) ?? tags[0] ?? '';
  }

  onPostClick(post: PostView): void {
    this.threadStore.openThread(post.uri);
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
      this.loadFeed();
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
      this.loadFeed();
    } catch (err) {
      console.error('Repost failed:', err);
    }
  }
}
