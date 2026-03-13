# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Beacon is a **zero-backend** community layer built on the **AT Protocol** where every Bluesky hashtag becomes a living community. Visit `/!/design` and you're in a curated space with a real-time feed of `#design` posts pulled directly from the Bluesky API, with threaded discussions that post back to Bluesky.

Phase 1 has **no server, no database, no firehose**. The Angular SPA talks directly to the Bluesky API. Community memberships and preferences live in `localStorage`.

This repository currently contains specification and design documents. No code has been written yet.

## Reference Documents (Source of Truth)

- **`beacon-at-proto-mockup.jsx`** — UI source of truth. Match pixel-for-pixel.
- **`beacon-technical-spec.md`** — Architecture source of truth. Follow patterns exactly.
- **`productSpec.md`** — Product requirements (what to build and why).
- **`CLAUDE_CODE_PROMPT.md`** — Implementation guide with phased roadmap, component details, and screen specifications.

## Tech Stack — Phase 1 (Zero Backend)

| Layer | Technology | Notes |
|---|---|---|
| **Framework** | Angular 21 | Standalone components, signals |
| **Styling** | Tailwind CSS + CSS custom properties (`--nx-*`) | Design tokens in `tokens.scss` |
| **State** | Angular signals | `signal()`, `computed()` in service stores |
| **AT Protocol** | `@atproto/api`, `@atproto/oauth-client-browser` | All API calls direct to Bluesky |
| **Rich Text** | TipTap (ProseMirror) | Composing replies and posts |
| **Persistence** | localStorage | Joined communities, preferences |
| **Fonts** | Lato (body), Merriweather (headings), JetBrains Mono (code) |

**No server-side dependencies in Phase 1.** No Fastify, no PostgreSQL, no Redis, no Meilisearch, no BullMQ.

## Project Structure

```
beacon-web/
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
│   │   │   ├── atproto.service.ts        # Direct Bluesky API wrapper
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

## Architecture Essentials

**Zero-backend client.** Beacon queries the Bluesky API directly from the browser. No intermediary server. `app.bsky.feed.searchPosts` with `sort=latest|top` provides community feeds. All user interactions (likes, replies, reposts) write back to the AT Protocol as standard records via the user's PDS.

**Data flow:** Bluesky API → Angular signals → UI. That's it.

**Identity:** Bluesky OAuth public client (PKCE, no client secret). `@atproto/oauth-client-browser`. Users sign in with their Bluesky handle. Tokens stored in IndexedDB by the library.

**Content ownership:** Beacon never stores user content. Posts, replies, likes, and reposts live on the user's PDS. Community memberships and preferences are the only local data (`localStorage`).

**Rate limits:** 3,000 requests per 5 minutes per IP. Since each user's browser has its own IP, limits are per-user. Normal usage (~80 requests/session) is nowhere near the cap.

**Unauthenticated browsing:** Feed queries (`searchPosts`, `getPostThread`, `getProfile`) work without auth via `https://public.api.bsky.app/xrpc/`. Only writes (like, reply, repost, post) require authentication.

## Bluesky API Endpoints

### Feed Queries (Unauthenticated)

| Endpoint | Purpose |
|---|---|
| `app.bsky.feed.searchPosts` | Core community feed — hashtag search with `sort=latest\|top` |
| `app.bsky.feed.getPostThread` | Thread view — post + full reply tree |
| `app.bsky.actor.getProfile` | User profile data |
| `app.bsky.actor.searchActors` | @mention autocomplete |

**Base URL:** `https://public.api.bsky.app/xrpc/`

### Record Writes (Authenticated)

| Action | Record Type |
|---|---|
| Like / Unlike | `app.bsky.feed.like` |
| Reply | `app.bsky.feed.post` with `reply` field |
| Repost / Unrepost | `app.bsky.feed.repost` |
| New Post | `app.bsky.feed.post` with hashtag facets |

Writes go to the user's PDS, resolved from their DID.

## Angular Conventions

- All components are **standalone** (`standalone: true`)
- Component prefix: **`nx-`** (e.g., `nx-button`, `nx-avatar`, `nx-post-card`)
- Use Angular **signals** (`signal()`, `computed()`) for local state
- Use `input()` / `input.required()` for inputs, `output()` for events
- Each component: own directory with `.ts`, `.html`, `.scss` files
- State management: Signal-based service stores — no external state library

## Design System — Just Maple

- **Light mode primary:** `#993629` (Maple Red), background: `#fdfbf7` (Cream)
- **Dark mode primary:** `#d94e3b`, background: `#1c1917` (warm dark brown)
- **Dark mode is ON by default**
- **NEVER use pure black** — always warm dark browns (`#1c1917`, `#292524`, `#44403c`)
- **AT Protocol badge:** `#3b82f6` (Bluesky blue) for source badges on posts
- Full token definitions in `CLAUDE_CODE_PROMPT.md` § Design Tokens

## Critical Implementation Rules

- **Zero backend** — no server, no database, no firehose in Phase 1
- **Community URLs** use format `/!/tagname` (e.g., `/!/design`)
- **User profile URLs** use format `/u/:handle` (e.g., `/u/zubair.bsky.social`)
- **All content writes go through AT Protocol** — Beacon never stores user-generated content
- **Source badges** on every post (blue dot + "Bluesky")
- **Hashtag pills** are clickable, navigating to that community
- **Bluesky OAuth only** — public client, browser tokens, no passwords, no magic links
- **Sidebar is always visible** at 260px fixed width — never collapses
- **Thread panel (360px)** opens on the right when viewing replies
- **Active nav items** use `primary color + 15% opacity background`, not solid primary
- **localStorage** for community memberships + user preferences
- **Dark mode ON** by default
- **Unauthenticated browsing** supported — auth only required for writes

## Implementation Order (Phase 1)

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
16. Deploy to Vercel (static files, $0 cost)
17. Polish

## Future Phases

- **Phase 2:** Server layer (Fastify + PostgreSQL + Redis + firehose consumer) — added only when custom ranking or features beyond the Bluesky API are needed
- **Phase 3:** SpacetimeDB real-time chat per community — added when user density justifies it
- **Phase 4:** Native apps via Swift shell + WKWebView hosting the Angular SPA

## Routes

| Path | Component |
|---|---|
| `/login` | LoginComponent (Bluesky OAuth) |
| `/auth/callback` | AuthCallbackComponent (OAuth redirect handler) |
| `/home` | HomeFeedComponent |
| `/explore` | ExploreComponent |
| `/!/tagname` | CommunityViewComponent |
| `/u/:handle` | ProfileComponent |
| `/notifications` | NotificationsComponent |
