import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AvatarComponent } from '../../atoms/avatar/avatar.component';
import { IconComponent } from '../../atoms/icon/icon.component';
import { AuthService } from '../../../services/auth.service';
import { CommunityStore } from '../../../services/community.store';
import { NotificationStore } from '../../../services/notification.store';
import { PreferencesStore } from '../../../services/preferences.store';
import { ThreadStore } from '../../../services/thread.store';

@Component({
  selector: 'beacon-app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AvatarComponent, IconComponent],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent {
  readonly auth = inject(AuthService);
  readonly communities = inject(CommunityStore);
  readonly notifications = inject(NotificationStore);
  readonly preferences = inject(PreferencesStore);
  readonly threadStore = inject(ThreadStore);
  private readonly router = inject(Router);

  readonly sidebarOpen = signal(false);

  readonly trendingTags = ['ai', 'webdev', 'startups', 'rust'];

  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  navigateToCommunity(tag: string): void {
    this.router.navigate(['/!', tag]);
    this.closeSidebar();
  }

  onLogout(): void {
    this.auth.logout();
  }
}
