import { Component, input, output, computed } from '@angular/core';
import { AvatarComponent } from '../../atoms/avatar/avatar.component';
import { SourceBadgeComponent } from '../source-badge/source-badge.component';
import { HashtagPillComponent } from '../hashtag-pill/hashtag-pill.component';
import { relativeTime } from '../../../utils/time';
import { extractHashtags } from '../../../utils/hashtag';
import { renderRichText } from '../../../utils/richtext';
import type { PostView } from '../../../types/post';

@Component({
  selector: 'beacon-post-card',
  standalone: true,
  imports: [AvatarComponent, SourceBadgeComponent, HashtagPillComponent],
  templateUrl: './post-card.component.html',
  styleUrl: './post-card.component.scss',
})
export class PostCardComponent {
  readonly post = input.required<PostView>();
  readonly showCommunityTag = input(false);
  readonly communityTag = input<string>('');

  readonly postClicked = output<PostView>();
  readonly likeClicked = output<PostView>();
  readonly repostClicked = output<PostView>();

  readonly author = computed(() => this.post().author);
  readonly record = computed(() => this.post().record as any);
  readonly time = computed(() => relativeTime(this.record().createdAt ?? this.post().indexedAt));

  readonly renderedText = computed(() => {
    const rec = this.record();
    return renderRichText(rec.text ?? '', rec.facets);
  });

  readonly hashtags = computed(() => {
    const rec = this.record();
    return extractHashtags(rec.text ?? '');
  });

  readonly replyCount = computed(() => this.post().replyCount ?? 0);
  readonly repostCount = computed(() => this.post().repostCount ?? 0);
  readonly likeCount = computed(() => this.post().likeCount ?? 0);

  readonly images = computed(() => {
    const embed = this.post().embed as any;
    if (!embed) return [];
    // app.bsky.embed.images#view
    if (embed.$type === 'app.bsky.embed.images#view') {
      return embed.images ?? [];
    }
    // app.bsky.embed.recordWithMedia#view — images alongside a quote post
    if (embed.$type === 'app.bsky.embed.recordWithMedia#view' && embed.media?.$type === 'app.bsky.embed.images#view') {
      return embed.media.images ?? [];
    }
    return [];
  });

  readonly isLiked = computed(() => !!(this.post().viewer as any)?.like);
  readonly isReposted = computed(() => !!(this.post().viewer as any)?.repost);

  readonly postUrl = computed(() => {
    const post = this.post();
    const handle = post.author.handle;
    const rkey = post.uri.split('/').pop();
    return `https://bsky.app/profile/${handle}/post/${rkey}`;
  });

  linkCopied = false;

  onClick(): void {
    this.postClicked.emit(this.post());
  }

  onLike(event: Event): void {
    event.stopPropagation();
    this.likeClicked.emit(this.post());
  }

  onRepost(event: Event): void {
    event.stopPropagation();
    this.repostClicked.emit(this.post());
  }

  onCopyLink(event: Event): void {
    event.stopPropagation();
    navigator.clipboard.writeText(this.postUrl());
    this.linkCopied = true;
    setTimeout(() => this.linkCopied = false, 2000);
  }

  onImageClick(event: Event, fullsizeUrl: string): void {
    event.stopPropagation();
    window.open(fullsizeUrl, '_blank');
  }
}
