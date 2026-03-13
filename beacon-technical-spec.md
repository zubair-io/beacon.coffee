# HELIX — Technical Specification

**Version:** 3.0
**Date:** February 28, 2026
**Author:** Zubair
**Status:** Draft
**Companion Document:** [Helix Product Requirements Document](./productSpec.md)

---

## 1. Architecture Overview

Helix MVP is a **zero-backend Angular SPA** that talks directly to the Bluesky API and AT Protocol. There is no server, no database, no firehose consumer. The client handles everything: feed queries, authentication, profile resolution, and record writes.

Community memberships and user preferences are stored in `localStorage`. The app is deployed as static files on Vercel, Cloudflare Pages, or similar.


### 1.1 System Diagram — MVP

```
┌───────────────────────────────────────────────────────────────┐
│                      Angular SPA                               │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                    App Shell                              │ │
│  │  ┌─────────┐  ┌──────────────┐  ┌───────────────────┐   │ │
│  │  │ Sidebar  │  │  Feed View   │  │  Thread Panel     │   │ │
│  │  │ (260px)  │  │  (flex)      │  │  (360px)          │   │ │
│  │  └─────────┘  └──────────────┘  └───────────────────┘   │ │
│  └──────────────────────────────────────────────────────────┘ │
│                              │                                 │
│  ┌───────────────────────────┴──────────────────────────────┐ │
│  │                    Services Layer                         │ │
│  │                                                           │ │
│  │  CommunityStore    FeedStore     AuthService              │ │
│  │  (localStorage)    (signals)     (OAuth)                  │ │
│  │                                                           │ │
│  │  ProfileStore      ThreadStore   NotificationStore        │ │
│  │  (signals+cache)   (signals)     (signals)                │ │
│  └───────────────────────────┬──────────────────────────────┘ │
│                              │                                 │
│  ┌───────────────────────────┴──────────────────────────────┐ │
│  │              @atproto/api + @atproto/oauth-client-browser │ │
│  └───────────────────────────┬──────────────────────────────┘ │
└──────────────────────────────┼────────────────────────────────┘
                               │ HTTPS (per-user IP rate limit)
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
      ┌──────────────┐  ┌──────────┐  ┌──────────────┐
      │  Bluesky     │  │ User's   │  │ Any PDS      │
      │  AppView     │  │ PDS      │  │ (profile     │
      │              │  │          │  │  resolution)  │
      │ searchPosts  │  │ like     │  │              │
      │ getPostThread│  │ reply    │  │ getProfile   │
      │ getSuggested │  │ repost   │  │              │
      │ Feeds        │  │ post     │  │              │
      └──────────────┘  └──────────┘  └──────────────┘
```

---

## 2. AT Protocol Integration

### 2.1 Bluesky API Endpoints

All data comes from the Bluesky API. No intermediary server.

#### Feed Queries (Unauthenticated)

| Endpoint | Purpose | Notes |
|---|---|---|
| `app.bsky.feed.searchPosts` | **Core feed** — hashtag search with sort | `sort=latest\|top`, cursor pagination, `limit=25` |
| `app.bsky.feed.getPostThread` | Thread view — post + full reply tree | `depth` param controls reply depth |
| `app.bsky.actor.getProfile` | User profile data | Display name, handle, avatar, bio, follower counts |
| `app.bsky.actor.searchActors` | Search for users | For @mention autocomplete |
| `app.bsky.unspecced.getTaggedSuggestions` | Trending/suggested content | For Explore page seeding |
| `app.bsky.feed.getSuggestedFeeds` | Suggested feeds | Potential use for Explore |

**Base URL for unauthenticated calls:** `https://public.api.bsky.app/xrpc/`

#### Record Writes (Authenticated)

| Action | Method | Record Type |
|---|---|---|
| **Like** | `com.atproto.repo.createRecord` | `app.bsky.feed.like` with `subject: { uri, cid }` |
| **Unlike** | `com.atproto.repo.deleteRecord` | Delete the like record |
| **Reply** | `com.atproto.repo.createRecord` | `app.bsky.feed.post` with `reply: { root, parent }` |
| **Repost** | `com.atproto.repo.createRecord` | `app.bsky.feed.repost` with `subject: { uri, cid }` |
| **Unrepost** | `com.atproto.repo.deleteRecord` | Delete the repost record |
| **New Post** | `com.atproto.repo.createRecord` | `app.bsky.feed.post` with text + hashtag facets |

**Writes go to the user's PDS**, resolved from their DID.

#### Notifications (Authenticated)

| Endpoint | Purpose |
|---|---|
| `app.bsky.notification.listNotifications` | User's notification stream |
| `app.bsky.notification.updateSeen` | Mark notifications as seen |

### 2.2 Rate Limits

**3,000 requests per 5 minutes, per IP address.** Each user's browser has its own IP, so limits are per-user. Normal usage (~80 requests/session) is nowhere near the cap.

### 2.3 Feed Query Examples

```typescript
// Community feed — latest
const response = await agent.app.bsky.feed.searchPosts({
  q: '#design',
  sort: 'latest',
  limit: 25,
  cursor: nextCursor,
});

// Community feed — top
const response = await agent.app.bsky.feed.searchPosts({
  q: '#design',
  sort: 'top',
  limit: 25,
});

// Thread view
const thread = await agent.app.bsky.feed.getPostThread({
  uri: 'at://did:plc:xxx/app.bsky.feed.post/xxx',
  depth: 10,
});

// Like a post
await agent.like(post.uri, post.cid);

// Reply to a post
await agent.post({
  text: 'Great point about container queries!',
  reply: {
    root: { uri: rootPost.uri, cid: rootPost.cid },
    parent: { uri: parentPost.uri, cid: parentPost.cid },
  },
  facets: [/* hashtag facets */],
});
```

---

## 3. Authentication

### 3.1 OAuth Public Client Flow

AT Protocol OAuth with PKCE (public client — no client secret). Runs entirely in the browser.

**Library:** `@atproto/oauth-client-browser`

```
1. User clicks "Sign in with Bluesky"
2. User enters handle (e.g., zubair.bsky.social)
3. Library resolves handle → DID → PDS → authorization server metadata
4. Library generates PKCE code verifier + challenge
5. Redirect to PDS authorization page
6. User approves requested scopes
7. PDS redirects back to /auth/callback with authorization code
8. Library exchanges code for access + refresh tokens (in browser)
9. Tokens stored by the library (IndexedDB)
10. BskyAgent created with authenticated session
```

### 3.2 Client Metadata

Static JSON file served from the app's domain:

```json
{
  "client_id": "https://helix.app/client-metadata.json",
  "client_name": "Helix",
  "client_uri": "https://helix.app",
  "redirect_uris": ["https://helix.app/auth/callback"],
  "scope": "atproto transition:generic",
  "grant_types": ["authorization_code", "refresh_token"],
  "response_types": ["code"],
  "token_endpoint_auth_method": "none",
  "application_type": "web",
  "dpop_bound_access_tokens": true
}
```

---

## 4. Client Architecture

### 4.1 Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| **Framework** | Angular 21 | Standalone components, signals |
| **Styling** | Tailwind CSS + CSS custom properties (`--nx-*`) | Design tokens in `tokens.scss` |
| **State** | Angular signals | `signal()`, `computed()` in service stores |
| **AT Protocol** | `@atproto/api`, `@atproto/oauth-client-browser` | All API calls |
| **Rich Text** | TipTap (ProseMirror) | Composing replies and posts |
| **Persistence** | localStorage | Joined communities, preferences |
| **Component Prefix** | `nx-` | e.g., `nx-button`, `nx-post-card` |
| **Fonts** | Lato (body), Merriweather (headings), JetBrains Mono (code) |

### 4.2 Project Structure

```
helix-web/
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
│   │   │   ├── atproto.service.ts        # Agent wrapper
│   │   │   ├── auth.service.ts           # OAuth flow + session
│   │   │   ├── community.store.ts        # localStorage + signals
│   │   │   ├── feed.store.ts             # Feed state (signals)
│   │   │   ├── thread.store.ts           # Thread state (signals)
│   │   │   ├── notification.store.ts     # Notifications (signals)
│   │   │   ├── profile.store.ts          # Profile cache (signals)
│   │   │   └── preferences.store.ts      # Theme, sort (localStorage)
│   │   ├── guards/
│   │   │   └── auth.guard.ts
│   │   ├── types/
│   │   └── utils/
│   │       ├── time.ts
│   │       ├── hashtag.ts
│   │       └── richtext.ts
│   ├── environments/
│   ├── styles/
│   │   ├── tokens.scss
│   │   └── global.scss
│   └── client-metadata.json
├── angular.json
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### 4.3 Routing

| Path | Component |
|---|---|
| `/login` | LoginComponent |
| `/auth/callback` | AuthCallbackComponent |
| `/home` | HomeFeedComponent |
| `/explore` | ExploreComponent |
| `/!/design` | CommunityViewComponent |
| `/u/:handle` | ProfileComponent |
| `/notifications` | NotificationsComponent |

### 4.4 Core Services

See `CLAUDE_CODE_PROMPT.md` for full service implementations.

---

## 5. Design System — Just Maple Theme

See `CLAUDE_CODE_PROMPT.md` § Design Tokens for the full token set.

Key values:
- Primary: `#993629` (light) / `#d94e3b` (dark)
- Background: `#fdfbf7` (light) / `#1c1917` (dark) — **NEVER pure black**
- Bluesky badge: `#3b82f6`
- Default theme: Dark mode ON

---

## 6. Deployment

Static SPA on Vercel / Cloudflare Pages. **$0 infrastructure cost.**

Required: `dist/` build output + `client-metadata.json` at root.

---

## 7. Dependencies

```json
{
  "dependencies": {
    "@angular/core": "^21.x",
    "@angular/router": "^21.x",
    "@atproto/api": "^0.x",
    "@atproto/oauth-client-browser": "^0.x",
    "@tiptap/core": "^2.x",
    "@tiptap/starter-kit": "^2.x",
    "@tiptap/extension-mention": "^2.x",
    "@tiptap/extension-link": "^2.x",
    "@tiptap/extension-placeholder": "^2.x"
  }
}
```

---

## 8. Native App Architecture (Phase 4)

Swift shell + WKWebView hosting the Angular SPA.

```typescript
// Helix → Native
interface NativeOutbound {
  type: 'saveToken' | 'getToken' | 'clearToken' | 'requestPushPermission'
       | 'setBadge' | 'openShare' | 'openAuthSession' | 'hapticFeedback';
  payload: Record<string, unknown>;
}

// Native → Helix
interface NativeInbound {
  type: 'initialize' | 'pushToken' | 'pushNotification'
       | 'deepLink' | 'authSessionResult' | 'appStateChange';
  payload: Record<string, unknown>;
}
```

---

## 9. Future Server Architecture (Phase 2)

Added when needed: Firehose consumer, Fastify API, PostgreSQL, Redis, Meilisearch, BullMQ.

---

## 10. Implementation Order

1. Scaffold Angular 21 + Tailwind + `tokens.scss`
2. Set up `@atproto/oauth-client-browser` + `client-metadata.json`
3. Build `AtprotoService` + `AuthService`
4. Build atom components
5. Build stores: `CommunityStore`, `FeedStore`, `PreferencesStore`
6. Build Login + AuthCallback pages
7. Build `AppShellComponent` + `CommunitySidebar`
8. Build `CommunityViewComponent` + `PostFeed` + `PostCard`
9. Build `ThreadPanel` + reply composer
10. Build `PostComposer` with TipTap
11. Build `HomeFeedComponent`
12. Build `ExploreComponent`
13. Build `NotificationsComponent`
14. Build `ProfileComponent`
15. Dark mode toggle
16. Deploy to Vercel
17. Polish

---

## 11. Critical Implementation Details

- **Zero backend** — no server, no database
- **Never pure black** in dark mode
- **Community URLs**: `/!/tagname`
- **Profile URLs**: `/u/:handle`
- **Source badge** on every post
- **Hashtag pills** clickable → community
- **Bluesky OAuth** public client, browser tokens
- **localStorage** for communities + preferences
- **Dark mode ON** by default
- **Sidebar** always 260px
- **Thread panel** 360px right
- **Active nav**: `primary + 15% opacity`
- **Unauthenticated browsing** supported
- **All writes** direct to AT Protocol
