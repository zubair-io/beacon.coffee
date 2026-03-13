# Beacon — Claude Code Implementation Prompt

## Overview

Build **Beacon**, a zero-backend community layer on the AT Protocol where every Bluesky hashtag becomes a community. The Angular SPA talks directly to the Bluesky API — no server, no database, no firehose.

Reference files:

1. **`productSpec.md`** — Product requirements
2. **`beacon-technical-spec.md`** — Full technical architecture
2 **`beacon-mockup.html`**  UI Mockup
---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| **Framework** | Angular 21 | Standalone components, signals |
| **AT Protocol** | `@atproto/api`, `@atproto/oauth-client-browser` | All data + auth + writes |
| **Styling** | Tailwind CSS + CSS custom properties (`--beacon-*`) | Design tokens in `tokens.scss` |
| **Rich Text** | TipTap (ProseMirror) | Composing replies and posts |
| **Persistence** | localStorage | Joined communities, preferences |
| **Component Prefix** | `beacon-` | e.g., `beacon-button`, `beacon-avatar`, `beacon-post-card` |
| **Fonts** | Lato (body), Merriweather (headings), JetBrains Mono (code) |
| **Deployment** |  Azure bucket |
| **Native Apps** | Swift shell + WKWebView | Thin wrappers with bridge protocol |

**No server. No database. No backend infrastructure.**

---

## Project Structure

```
apps/web/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── atoms/           # avatar, badge, button, icon, input, spinner, toggle, tooltip
│   │   │   ├── molecules/       # post-card, hashtag-pill, source-badge, sort-tabs,
│   │   │   │                    # search-bar, user-card, community-card
│   │   │   ├── organisms/       # community-header, community-sidebar, post-feed,
│   │   │   │                    # post-composer, thread-panel, notification-panel
│   │   │   └── templates/       # app-shell, auth-layout
│   │   ├── pages/
│   │   │   ├── login/           # Bluesky handle input → OAuth redirect
│   │   │   ├── auth-callback/   # OAuth callback handler
│   │   │   ├── community-view/  # /!/tagname — feed + sort tabs + thread panel
│   │   │   ├── home-feed/       # Aggregated feed from joined communities
│   │   │   ├── explore/         # Discover communities
│   │   │   ├── notifications/   # Bluesky notifications
│   │   │   └── profile/         # User profile from Bluesky PDS
│   │   ├── services/
│   │   │   ├── atproto.service.ts        # @atproto/api Agent wrapper (all API calls)
│   │   │   ├── auth.service.ts           # OAuth public client flow + session state
│   │   │   ├── community.store.ts        # Joined communities (localStorage + signals)
│   │   │   ├── feed.store.ts             # Feed state per community (signals)
│   │   │   ├── thread.store.ts           # Thread state (signals)
│   │   │   ├── notification.store.ts     # Notifications (signals)
│   │   │   ├── profile.store.ts          # Profile cache (signals)
│   │   │   └── preferences.store.ts      # Theme, default sort (localStorage + signals)
│   │   ├── guards/
│   │   │   └── auth.guard.ts             # Redirect to /login if no session
│   │   ├── types/
│   │   │   ├── post.ts                   # Post, ThreadView, Author types
│   │   │   ├── community.ts              # Community, Membership types
│   │   │   └── notification.ts
│   │   └── utils/
│   │       ├── time.ts                   # Relative time ("2m ago", "3h ago")
│   │       ├── hashtag.ts                # Hashtag extraction + facet creation
│   │       └── richtext.ts               # AT Protocol rich text → rendered HTML
│   ├── environments/
│   ├── styles/
│   │   ├── tokens.scss                   # CSS custom properties (--beacon-*)
│   │   └── global.scss
│   └── client-metadata.json              # OAuth client metadata (static file)
├── angular.json
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## How Data Flows

### Community Feed

```
User visits /!/design
    ↓
CommunityViewComponent reads :communityTag from route
    ↓
FeedStore.loadFeed('design', 'latest')
    ↓
AtprotoService.searchPosts('#design', 'latest')
    ↓
fetch('https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=%23design&sort=latest&limit=25')
    ↓
Response: { posts: [...], cursor: '...' }
    ↓
FeedStore.posts signal updates → UI re-renders
```

### User Reply

```
User types reply in thread panel, clicks Send
    ↓
AtprotoService.reply(text, parentPost, rootPost)
    ↓
agent.post({ text, reply: { root, parent }, facets })
    ↓
Record written to user's PDS → visible on Bluesky AND Beacon
```

### Like

```
User clicks heart icon on post
    ↓
AtprotoService.like(post.uri, post.cid)
    ↓
agent.like(uri, cid)
    ↓
Like record written to user's PDS
```

---

## Design System — Just Maple Theme

### Design Tokens (CSS Custom Properties)

```scss
// tokens.scss

:root {
  --beacon-primary: #993629;           // Maple Red
  --beacon-primary-hover: #7a2b21;
  --beacon-primary-light: #f5e6e4;
  --beacon-accent: #d94e3b;
  --beacon-bg: #fdfbf7;                // Cream
  --beacon-bg-secondary: #f5f2eb;
  --beacon-bg-tertiary: #f5f5f4;
  --beacon-surface: #ffffff;
  --beacon-text: #292524;              // Charcoal
  --beacon-text-muted: #78716c;
  --beacon-text-inverse: #FFFFFF;
  --beacon-border: #e7e5e4;
  --beacon-border-focus: #993629;
  --beacon-online: #28a745;
  --beacon-idle: #F59E0B;
  --beacon-dnd: #dc3545;
  --beacon-offline: #a8a29e;
  --beacon-bluesky: #3b82f6;           // Source badge blue
  --beacon-shadow-soft: 0 2px 8px -1px rgba(0,0,0,0.05), 0 1px 2px -1px rgba(0,0,0,0.02);
  --beacon-shadow-lifted: 0 10px 30px -5px rgba(0,0,0,0.08);
}

// Dark mode — NEVER pure black
[data-theme='dark'], .dark {
  --beacon-primary: #993629;
  --beacon-primary-hover: #c2392a;
  --beacon-primary-light: #422016;
  --beacon-bg: #1c1917;               // Warm dark brown
  --beacon-bg-secondary: #292524;
  --beacon-bg-tertiary: #3a3836;
  --beacon-surface: #262524;
  --beacon-text: #e7e5e4;
  --beacon-text-muted: #a8a29e;
  --beacon-border: #44403c;
  --beacon-border-focus: #d94e3b;
  --beacon-online: #4ade80;
  --beacon-dnd: #f87171;
  --beacon-offline: #78716c;
  --beacon-shadow-soft: 0 2px 8px -1px rgba(0,0,0,0.2), 0 1px 2px -1px rgba(0,0,0,0.1);
  --beacon-shadow-lifted: 0 10px 30px -5px rgba(0,0,0,0.3);
}
```

### Typography

```scss
--beacon-font-body: 'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--beacon-font-heading: 'Merriweather', Georgia, serif;
--beacon-font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### Key Visual Elements

- **Logo**: Gradient `#993629 → #d94e3b`, white "H", `border-radius: 8px`
- **Community prefix**: `/!/` in primary color, `font-weight: 700`
- **Source badge**: Blue dot (`#3b82f6`) + "Bluesky" on every post
- **Hashtag pills**: `color: primary`, `background: primary+10%`, `border-radius: 4px`, `padding: 2px 8px`
- **Avatar fallbacks**: `["#993629", "#c2410c", "#b58900", "#16a34a", "#2563eb", "#9333ea", "#db2777", "#0d9488"]`
- **Default theme**: System (Light or Dark)

---

## Screens to Implement

### 1. Login Page (`/login`)

**Layout**: Centered card on gradient background.

**Content:**
- Large Beacon logo + tagline "Every hashtag is a community"
- Input: "Enter your Bluesky handle" (e.g., `zubair.bsky.social`)
- "Sign in with Bluesky" primary button
- On click → OAuth redirect to PDS authorization page
- Unauthenticated users can still browse — login only needed for interactions

**Card**: `width: 420px`, `padding: 48px`, `border-radius: 20px`

### 2. Community View (`/!/tagname`)

**Layout**: Three-column — Sidebar (260px) | Main feed (flex) | Thread panel (360px, conditional)

**Sidebar** (`beacon-community-sidebar`):
- Header: Logo + "Beacon" + "AT Proto" badge
- Nav: Home, Explore, Notifications (with badge). Active: `primary + 15% opacity` bg
- Community list: `/!/` prefix + name + online indicator. Active highlighted.
- Trending section at bottom
- Footer: User avatar + display name + `@handle.bsky.social`

**Main feed**:
- Community header: `/!/tagname` (Merriweather), member count, description, "+ New Post", "Join"
- Sort tabs: Latest | Top. Active: `primary + 15% opacity`
- "Powered by AT Protocol" indicator with blue dot
- Post feed: Scrollable `beacon-post-card` list
  - Each card: avatar (40px) + name + @handle + time + "Bluesky" source badge (blue dot)
  - Post text (14px, line-height 1.55)
  - Media placeholder if present
  - Hashtag pills (clickable → community)
  - Engagement row: 💬 replies, 🔄 reposts, ❤️ likes

**Thread panel** (360px, on post click):
- Header: "Thread" + close
- Root post + reply tree (from `getPostThread`)
- Reply composer at bottom (TipTap)

### 3. Home Feed (`/home`)

**Layout**: Sidebar | Centered content (`max-width: 680px`)

- "Home" heading + sort tabs (Latest | Top)
- Aggregated posts from joined communities
- Each post shows which `/!/community` it's from
- Implementation: Parallel `searchPosts` calls for each joined community, merge + sort client-side

### 4. Explore Page (`/explore`)

**Layout**: Sidebar | Centered content (`max-width: 780px`)

- "Explore" + "Discover communities" subtitle
- Search input (`border-radius: 12px`)
- Suggested/trending community cards with hashtag, description, "Join" button
- For MVP: hardcoded list of popular hashtag communities + search input that creates ad-hoc communities

### 5. Notifications (`/notifications`)

**Layout**: Sidebar | Centered content (`max-width: 640px`)

- "Notifications" + "Mark all read"
- Filter tabs: All | Mentions | Replies | Likes
- Items from `app.bsky.notification.listNotifications`, filtered to show community-relevant ones
- Unread: `border-left: 3px solid primary` + tinted background

### 6. Profile Page (`/u/:handle`)

**Layout**: Sidebar | Centered content (`max-width: 640px`)

- Banner (160px, gradient, `border-radius: 16px`)
- Avatar (88×88px, from Bluesky PDS)
- Display name + handle
- Bio (from Bluesky profile)
- Stats: Followers | Following | Posts
- Recent posts (from `searchPosts` filtered by author)

---

## Authentication

**Bluesky OAuth only** — public client flow, tokens in browser.

### Flow
1. User enters Bluesky handle
2. `@atproto/oauth-client-browser` resolves handle → DID → PDS
3. PKCE flow → redirect to PDS → user approves
4. Redirect back to `/auth/callback` → tokens stored in IndexedDB
5. `BskyAgent` created with authenticated session

### Client Metadata (static file)
```json
{
  "client_id": "https://beacon.coffee/client-metadata.json",
  "client_name": "Beacon",
  "client_uri": "https://beacon.coffee",
  "redirect_uris": ["https://beacon.coffee/auth/callback"],
  "scope": "atproto transition:generic",
  "grant_types": ["authorization_code", "refresh_token"],
  "response_types": ["code"],
  "token_endpoint_auth_method": "none",
  "application_type": "web",
  "dpop_bound_access_tokens": true
}
```

---

## Routing

```typescript
export const routes: Routes = [
  {
    path: '',
    component: AppShellComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', loadComponent: () =>
        import('./pages/home-feed/home-feed.component').then(m => m.HomeFeedComponent) },
      { path: 'explore', loadComponent: () =>
        import('./pages/explore/explore.component').then(m => m.ExploreComponent) },
      { path: '!/:communityTag', loadComponent: () =>
        import('./pages/community-view/community-view.component').then(m => m.CommunityViewComponent) },
      { path: 'u/:handle', loadComponent: () =>
        import('./pages/profile/profile.component').then(m => m.ProfileComponent) },
      { path: 'notifications', loadComponent: () =>
        import('./pages/notifications/notifications.component').then(m => m.NotificationsComponent) },
    ],
  },
  { path: 'login', loadComponent: () =>
    import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'auth/callback', loadComponent: () =>
    import('./pages/auth-callback/auth-callback.component').then(m => m.AuthCallbackComponent) },
];
```

---

## Core Services

### AtprotoService

```typescript
@Injectable({ providedIn: 'root' })
export class AtprotoService {
  private agent: BskyAgent | null = null;

  readonly isAuthenticated = signal(false);
  readonly currentUser = signal<ProfileView | null>(null);

  async searchPosts(query: string, sort: 'latest' | 'top', cursor?: string) {
    return fetch(
      `https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts?q=${encodeURIComponent(query)}&sort=${sort}&limit=25${cursor ? `&cursor=${cursor}` : ''}`
    ).then(r => r.json());
  }

  async getPostThread(uri: string, depth = 10) {
    return fetch(
      `https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread?uri=${encodeURIComponent(uri)}&depth=${depth}`
    ).then(r => r.json());
  }

  async getProfile(handle: string) {
    return fetch(
      `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(handle)}`
    ).then(r => r.json());
  }

  async like(uri: string, cid: string) { return this.agent!.like(uri, cid); }
  async unlike(likeUri: string) { return this.agent!.deleteLike(likeUri); }
  async repost(uri: string, cid: string) { return this.agent!.repost(uri, cid); }

  async reply(text: string, parent: { uri: string; cid: string }, root: { uri: string; cid: string }) {
    const rt = new RichText({ text });
    await rt.detectFacets(this.agent!);
    return this.agent!.post({ text: rt.text, facets: rt.facets, reply: { root, parent } });
  }
}
```

### CommunityStore

```typescript
@Injectable({ providedIn: 'root' })
export class CommunityStore {
  private readonly STORAGE_KEY = 'beacon_communities';
  readonly communities = signal<Community[]>(this.load());
  readonly joinedTags = computed(() => new Set(this.communities().map(c => c.hashtag)));

  join(hashtag: string): void {
    const tag = hashtag.toLowerCase().replace(/^#/, '');
    if (this.joinedTags().has(tag)) return;
    this.communities.update(list => [...list, { hashtag: tag, joinedAt: new Date().toISOString() }]);
    this.save();
  }

  leave(hashtag: string): void {
    const tag = hashtag.toLowerCase().replace(/^#/, '');
    this.communities.update(list => list.filter(c => c.hashtag !== tag));
    this.save();
  }

  private load(): Community[] {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  private save(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.communities()));
  }
}
```

### FeedStore

```typescript
@Injectable({ providedIn: 'root' })
export class FeedStore {
  private readonly atproto = inject(AtprotoService);

  readonly posts = signal<PostView[]>([]);
  readonly sort = signal<'latest' | 'top'>('latest');
  readonly loading = signal(false);
  readonly hasMore = signal(true);
  private cursor: string | undefined;

  async loadFeed(hashtag: string, sort: 'latest' | 'top' = 'latest'): Promise<void> {
    this.sort.set(sort);
    this.loading.set(true);
    this.cursor = undefined;
    const result = await this.atproto.searchPosts(`#${hashtag}`, sort);
    this.posts.set(result.posts ?? []);
    this.cursor = result.cursor;
    this.hasMore.set(!!result.cursor);
    this.loading.set(false);
  }

  async loadMore(hashtag: string): Promise<void> {
    if (!this.cursor || this.loading()) return;
    this.loading.set(true);
    const result = await this.atproto.searchPosts(`#${hashtag}`, this.sort(), this.cursor);
    this.posts.update(existing => [...existing, ...(result.posts ?? [])]);
    this.cursor = result.cursor;
    this.hasMore.set(!!result.cursor);
    this.loading.set(false);
  }
}
```

---

## Angular Component Conventions

- All components: **standalone** (`standalone: true`)
- Prefix: **`beacon-`**
- Signals: `signal()`, `computed()` for state
- Inputs: `input()` / `input.required()`
- Outputs: `output()`
- Each component: own directory with `.ts`, `.html`, `.scss`

---

## Native Bridge Protocol

```typescript
// Beacon → Native
interface NativeOutbound {
  type: 'saveToken' | 'getToken' | 'clearToken' | 'requestPushPermission'
       | 'setBadge' | 'openShare' | 'openAuthSession' | 'hapticFeedback';
  payload: Record<string, unknown>;
}

// Native → Beacon
interface NativeInbound {
  type: 'initialize' | 'pushToken' | 'pushNotification'
       | 'deepLink' | 'authSessionResult' | 'appStateChange';
  payload: Record<string, unknown>;
}
```

---

## Implementation Order

1. Scaffold Angular 21 + Tailwind + `tokens.scss`
2. Set up `@atproto/oauth-client-browser` + `client-metadata.json`
3. Build `AtprotoService` (search, thread, profile, writes)
4. Build `AuthService` (OAuth flow, session restore)
5. Build atom components: `beacon-avatar`, `beacon-badge`, `beacon-button`, `beacon-icon`, `beacon-input`, `beacon-toggle`
6. Build `CommunityStore` + `FeedStore` + `PreferencesStore`
7. Build Login page (handle input → OAuth redirect)
8. Build AuthCallback page (code exchange → redirect to /home)
9. Build `AppShellComponent` + `CommunitySidebar`
10. Build `CommunityViewComponent` + `PostFeed` + `PostCard` + sort tabs
11. Build `ThreadPanel` (side panel, reply tree, reply composer)
12. Build `PostComposer` with TipTap
13. Build `HomeFeedComponent` (aggregate joined communities)
14. Build `ExploreComponent` (search + suggested communities)
15. Build `NotificationsComponent` (Bluesky notifications)
16. Build `ProfileComponent` (Bluesky profile data)
17. Dark mode toggle
18. Deploy to Vercel
19. Polish: loading states, error handling, empty states, infinite scroll

---

## Critical Details

- **Zero backend** — no server, no database, no API
- **Never use pure black** in dark mode — warm dark browns (`#1c1917`, `#292524`, `#44403c`)
- **Community URLs** use `/!/tagname` (e.g., `/!/design`)
- **User profile URLs** use `/u/:handle`
- **Source badge** on every post: blue dot + "Bluesky"
- **Hashtag pills** are clickable → navigate to that community
- **Bluesky OAuth only** — public client, tokens in browser (IndexedDB)
- **localStorage** for joined communities + preferences
- **Default theme**:System
- **Sidebar always visible** at 260px — never collapses
- **Thread panel (360px)** opens on the right when clicking into replies
- **Active nav items** use `primary + 15% opacity background`
- **Unauthenticated browsing** is supported — auth only needed for like/reply/repost
- **All writes** go directly to AT Protocol from the browser
- **Feed sorts**: `latest` and `top` from `searchPosts` API — no custom hot ranking in MVO
