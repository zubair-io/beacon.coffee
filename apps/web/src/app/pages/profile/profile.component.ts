import { Component, inject, effect } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { AvatarComponent } from '../../components/atoms/avatar/avatar.component';
import { PostCardComponent } from '../../components/molecules/post-card/post-card.component';
import { SpinnerComponent } from '../../components/atoms/spinner/spinner.component';
import { ProfileStore } from '../../services/profile.store';
import { AtprotoService } from '../../services/atproto.service';
import { ThreadStore } from '../../services/thread.store';
import type { PostView } from '../../types/post';
import { signal } from '@angular/core';

@Component({
  selector: 'beacon-profile',
  standalone: true,
  imports: [AvatarComponent, PostCardComponent, SpinnerComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {
  private readonly route = inject(ActivatedRoute);
  readonly profileStore = inject(ProfileStore);
  private readonly atproto = inject(AtprotoService);
  private readonly threadStore = inject(ThreadStore);

  readonly handle = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('handle') ?? '')),
    { initialValue: '' },
  );

  readonly recentPosts = signal<PostView[]>([]);
  readonly loadingPosts = signal(false);

  constructor() {
    effect(() => {
      const h = this.handle();
      if (h) {
        this.profileStore.loadProfile(h);
        this.loadRecentPosts(h);
      }
    });
  }

  private loadRecentPosts(handle: string): void {
    this.loadingPosts.set(true);
    this.atproto.searchPosts(`from:${handle}`, 'latest').subscribe({
      next: (result) => this.recentPosts.set(result.posts ?? []),
      error: () => this.recentPosts.set([]),
      complete: () => this.loadingPosts.set(false),
    });
  }

  onPostClick(post: PostView): void {
    this.threadStore.openThread(post.uri);
  }

  formatCount(n: number | undefined): string {
    if (!n) return '0';
    if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
    return String(n);
  }
}
