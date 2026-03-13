import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AvatarComponent } from '../../atoms/avatar/avatar.component';
import { IconComponent } from '../../atoms/icon/icon.component';
import { SpinnerComponent } from '../../atoms/spinner/spinner.component';
import { SourceBadgeComponent } from '../../molecules/source-badge/source-badge.component';
import { ThreadStore } from '../../../services/thread.store';
import { AtprotoService } from '../../../services/atproto.service';
import { AuthService } from '../../../services/auth.service';
import { relativeTime } from '../../../utils/time';
import { renderRichText } from '../../../utils/richtext';
import { extractHashtags } from '../../../utils/hashtag';

@Component({
  selector: 'beacon-thread-panel',
  standalone: true,
  imports: [
    FormsModule,
    AvatarComponent,
    IconComponent,
    SpinnerComponent,
    SourceBadgeComponent,
  ],
  templateUrl: './thread-panel.component.html',
  styleUrl: './thread-panel.component.scss',
})
export class ThreadPanelComponent {
  readonly threadStore = inject(ThreadStore);
  readonly atproto = inject(AtprotoService);
  readonly auth = inject(AuthService);

  readonly replyText = signal('');
  readonly sending = signal(false);

  close(): void {
    this.threadStore.closeThread();
  }

  getAuthor(post: any): any {
    return post?.post?.author ?? post?.author ?? {};
  }

  getRecord(post: any): any {
    return post?.post?.record ?? post?.record ?? {};
  }

  getTime(post: any): string {
    const rec = this.getRecord(post);
    return relativeTime(rec.createdAt ?? post?.post?.indexedAt ?? '');
  }

  getText(post: any): string {
    const rec = this.getRecord(post);
    return renderRichText(rec.text ?? '', rec.facets);
  }

  getHashtags(post: any): string[] {
    const rec = this.getRecord(post);
    return extractHashtags(rec.text ?? '');
  }

  getReplies(thread: any): any[] {
    return thread?.replies ?? [];
  }

  async sendReply(): Promise<void> {
    const text = this.replyText().trim();
    if (!text || this.sending()) return;

    const thread = this.threadStore.activeThread();
    if (!thread) return;

    this.sending.set(true);
    try {
      const post = (thread as any).post;
      const root = {
        uri: (thread as any).post?.uri ?? post.uri,
        cid: (thread as any).post?.cid ?? post.cid,
      };
      const parent = { uri: post.uri, cid: post.cid };

      await this.atproto.reply(text, parent, root);
      this.replyText.set('');
      await this.threadStore.openThread(post.uri);
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      this.sending.set(false);
    }
  }
}
