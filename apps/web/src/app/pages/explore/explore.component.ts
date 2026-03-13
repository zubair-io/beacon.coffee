import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommunityCardComponent } from '../../components/molecules/community-card/community-card.component';
import { CommunityStore } from '../../services/community.store';

interface SuggestedCommunity {
  hashtag: string;
  description: string;
  memberCount: string;
}

const SUGGESTED: SuggestedCommunity[] = [
  { hashtag: 'ai', description: 'Artificial intelligence, machine learning, and the future of computing. Research papers, tools, and discussion.', memberCount: '5,230' },
  { hashtag: 'webdev', description: 'Frontend, backend, and everything in between. Frameworks, tools, and web standards.', memberCount: '4,100' },
  { hashtag: 'startups', description: 'Building, launching, and growing startups. Share your journey, get feedback, find collaborators.', memberCount: '3,780' },
  { hashtag: 'rust', description: 'The Rust programming language — systems programming, memory safety, and blazing fast performance.', memberCount: '2,950' },
  { hashtag: 'bluesky', description: 'All things Bluesky and the AT Protocol. App updates, ecosystem news, and decentralized social.', memberCount: '6,100' },
  { hashtag: 'ux', description: 'User experience research, interaction design, usability testing, and human-centered product thinking.', memberCount: '1,840' },
  { hashtag: 'design', description: 'Visual design, UI, branding, typography, and creative inspiration.', memberCount: '3,200' },
  { hashtag: 'photography', description: 'Share your photos, gear reviews, technique tips, and creative inspiration.', memberCount: '2,100' },
  { hashtag: 'indiegamedev', description: 'Independent game development — tools, progress updates, and game design discussion.', memberCount: '1,500' },
  { hashtag: 'typescript', description: 'TypeScript language features, patterns, tips, and ecosystem news.', memberCount: '2,800' },
];

@Component({
  selector: 'beacon-explore',
  standalone: true,
  imports: [FormsModule, CommunityCardComponent],
  templateUrl: './explore.component.html',
  styleUrl: './explore.component.scss',
})
export class ExploreComponent {
  readonly communityStore = inject(CommunityStore);
  private readonly router = inject(Router);

  readonly searchQuery = signal('');
  readonly suggested = SUGGESTED;

  get filteredCommunities(): SuggestedCommunity[] {
    const q = this.searchQuery().toLowerCase().replace(/^#/, '').trim();
    if (!q) return this.suggested;

    const filtered = this.suggested.filter((c) => c.hashtag.includes(q));
    if (filtered.length === 0 && q.length > 0) {
      return [{ hashtag: q, description: `Posts tagged with #${q}`, memberCount: '' }];
    }
    return filtered;
  }

  onJoin(tag: string): void {
    if (this.communityStore.isJoined(tag)) {
      this.communityStore.leave(tag);
    } else {
      this.communityStore.join(tag);
    }
  }

  navigateTo(tag: string): void {
    this.router.navigate(['/!', tag]);
  }
}
