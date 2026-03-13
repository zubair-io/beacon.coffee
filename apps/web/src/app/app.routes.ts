import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { AppShellComponent } from './components/templates/app-shell/app-shell.component';

export const routes: Routes = [
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      {
        path: 'home',
        loadComponent: () =>
          import('./pages/home-feed/home-feed.component').then((m) => m.HomeFeedComponent),
      },
      {
        path: 'explore',
        loadComponent: () =>
          import('./pages/explore/explore.component').then((m) => m.ExploreComponent),
      },
      {
        path: '!/:communityTag',
        loadComponent: () =>
          import('./pages/community-view/community-view.component').then(
            (m) => m.CommunityViewComponent,
          ),
      },
      {
        path: 'u/:handle',
        loadComponent: () =>
          import('./pages/profile/profile.component').then((m) => m.ProfileComponent),
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./pages/notifications/notifications.component').then(
            (m) => m.NotificationsComponent,
          ),
      },
    ],
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'auth/callback',
    loadComponent: () =>
      import('./pages/auth-callback/auth-callback.component').then(
        (m) => m.AuthCallbackComponent,
      ),
  },
  { path: '**', redirectTo: 'home' },
];
