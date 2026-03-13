# Beacon.coffee — Product Requirements Document

**Version:** 3.0
**Date:** February 28, 2026
**Author:** Zubair
**Status:** Draft
**Classification:** Internal

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement](#2-problem-statement)
3. [Product Vision & Principles](#3-product-vision--principles)
4. [Feature Requirements](#4-feature-requirements)
5. [Technical Architecture](#5-technical-architecture)
6. [Phased Roadmap](#6-phased-roadmap)
7. [Go-to-Market](#7-go-to-market)
8. [Success Metrics & KPIs](#8-success-metrics--kpis)
9. [Risks & Mitigations](#9-risks--mitigations)
10. [Open Questions](#10-open-questions)

---

## 1. Executive Summary

Beacon is a community layer on the AT Protocol where every Bluesky hashtag becomes a living community. Visit `/!/design` and you're in a curated space with a feed of every `#design` post from across the Bluesky network — sorted by latest or top, with threaded discussions that post back to Bluesky.

The  MVP is a **zero-backend Angular SPA**. The client talks directly to the Bluesky API (`app.bsky.feed.searchPosts`) for feeds and to users' PDSs for interactions. No firehose, no database, no API server. Community memberships and preferences live in the browser. Infrastructure comes later — only when the product proves it has users who want more than what the Bluesky API provides.

> **ONE-LINER:** Beacon turns Bluesky hashtags into communities.

> **VISION:** Every hashtag is a place. Every place has a conversation.

---

## 2. Problem Statement

### 2.1 The Hashtag Problem

On Bluesky, hashtags are search filters. You click `#design` and get a list of posts. There's no sense of community, no ongoing conversation, no place to return to. You scroll, you leave.

Reddit has communities but they're siloed — nothing connects to the open social web. Discord has real-time chat but servers are invisible to search and require invites. Neither connects to the content already being created on decentralized social networks.

### 2.2 The Opportunity

Bluesky has 42M+ users and growing. The AT Protocol app ecosystem is early — Bluesky actively encourages third-party AppViews. Existing attempts at Reddit-on-Bluesky (Threadsky, AzSky) have gained no meaningful traction. The community layer is missing and nobody has built it well.

The Bluesky API already supports `searchPosts` with `top` and `latest` sort — meaning we can build a functional community feed product with **zero backend infrastructure**. This is a massive advantage for speed to market.

### 2.3 Target Users

| Persona | Current Behavior | Pain Point | Beacon Value |
|---|---|---|---|
| **Topic Enthusiast** | Follows hashtags on Bluesky, browses Reddit | No persistent community around Bluesky hashtags | `/!/design` is a place to return to daily |
| **Community Builder** | Manages Discord + Reddit + Bluesky presence | Fragmented audience, duplicate effort | One community fed by the open social web |
| **Bluesky Power User** | Posts daily, uses custom feeds | Feeds are passive consumption, no discussion layer | Threaded discussion around posts they already see |
| **AT Protocol Developer** | Building on the ecosystem | Wants more AppViews to succeed | Dogfooding the protocol, driving adoption |

---

## 3. Product Vision & Principles

### 3.1 Core Principles

#### Hashtags as Communities
Every Bluesky hashtag is a potential community. Beacon gives it a home page with sorted feeds and threaded discussions. The hashtag is the organizing unit.

#### Zero Infrastructure to Start
MVP has no backend. The Angular client queries Bluesky's API directly. Each user's browser is their own "server" — their own rate limit, their own AT Protocol connection. This means zero hosting costs and instant deployment.

#### Bluesky-Native Identity
Users sign in with their Bluesky account via AT Protocol OAuth. No new accounts. Your handle, avatar, display name, and social graph carry over.

#### Open by Default
Every interaction on Beacon is visible on Bluesky. Replies post back as standard AT Protocol records. This isn't a walled garden — it's a better lens on conversations already happening.

#### Progressive Infrastructure
Start with zero backend. Add a firehose + database layer when you need custom sort algorithms, real-time streaming, or features the Bluesky API can't support. Add SpacetimeDB chat when community density justifies it. Never build infrastructure before you have users who need it.

---

## 4. Feature Requirements

### 4.1 Community System (Core)

> **P0 — LAUNCH CRITICAL**

#### 4.1.1 Community Pages

Every hashtag has a community page at `/!/tagname`:

| Property | Description | Priority | Storage |
|---|---|---|---|
| **Name** | The hashtag (e.g., `design`, `indiegamedev`) | P0 | Derived from URL |
| **URL** | `/!/tagname` | P0 | — |
| **Feed** | Posts matching hashtag from Bluesky search API | P0 | Bluesky API |
| **Sort** | Latest and Top (from Bluesky `searchPosts` sort param) | P0 | Bluesky API |
| **Member Count** | Users who have joined on this browser | P1 | localStorage |
| **Description** | Community-editable description | P2 | Future: server |

#### 4.1.2 Joining Communities

Users join communities to add them to their sidebar. In MVP, this is stored in localStorage — your joined communities are browser-local. This is acceptable for MVP because the value is the feed, not the membership persistence.

### 4.2 Feeds (Powered by Bluesky API)

The core feed is powered by `app.bsky.feed.searchPosts`:

```
GET https://public.api.bsky.app/xrpc/app.bsky.feed.searchPosts
  ?q=%23design
  &sort=latest|top
  &limit=25
  &cursor=...
```

| Feature | Description | Priority |
|---|---|---|
| **Latest sort** | `sort=latest` — newest posts first | P0 |
| **Top sort** | `sort=top` — highest engagement | P0 |
| **Pagination** | Cursor-based, load more on scroll | P0 |
| **Post display** | Author, text, media, engagement counts, timestamp | P0 |
| **Source badge** | "via Bluesky" badge on every post | P0 |
| **Hashtag pills** | Clickable hashtags navigating to that community | P0 |
| **Image/media** | Render embedded images and link cards | P1 |
| **Quote posts** | Render embedded quote posts | P1 |

**Rate limits:** 3,000 requests per 5 minutes per IP. Since each user's browser has its own IP, this is effectively unlimited for normal usage. A page load is 1 request. Pagination is 1 request. A power user browsing aggressively might make 50 requests in 5 minutes — nowhere near the limit.

### 4.3 Interactions (Direct AT Protocol Writes)

All interactions write directly to the user's PDS via `@atproto/api`:

| Action | AT Protocol Record | Priority |
|---|---|---|
| **Like** | `app.bsky.feed.like` | P0 |
| **Reply** | `app.bsky.feed.post` (with `reply` ref) | P0 |
| **Repost** | `app.bsky.feed.repost` | P0 |
| **New Post** | `app.bsky.feed.post` with hashtag facets | P1 |

No server proxy needed. The client holds the user's OAuth tokens and writes directly.

### 4.4 Threaded Discussions

Click on a post to expand its thread. The thread view fetches the full reply tree via `app.bsky.feed.getPostThread`. Thread opens in a side panel (360px) or full-page on mobile.

Replying from Beacon creates a standard Bluesky reply visible on both platforms.

### 4.5 Identity

Bluesky OAuth (public client flow). Tokens stored in browser. Profile data resolved from `app.bsky.actor.getProfile`. No server-side token storage.

| Feature | Description | Priority |
|---|---|---|
| **Bluesky sign-in** | OAuth public client flow | P0 |
| **Profile display** | Name, handle, avatar from PDS | P0 |
| **Profile page** | `/u/:handle` showing user info + posts | P1 |

### 4.6 Discovery & Navigation

#### Sidebar (260px, always visible)
- Joined communities with `/!/` prefix
- Navigation: Home, Explore, Notifications
- Trending section (populated from `app.bsky.unspecced.getTaggedSuggestions` or hardcoded initially)
- User profile footer with Bluesky handle

#### Explore Page
- Search communities by hashtag name
- Trending/suggested communities
- Community cards with descriptions

#### Home Feed
- Aggregated results from joined communities
- Cycles through joined hashtag searches and merges results
- Sorted by latest or top

### 4.7 Notifications

MVP: Basic notification via `app.bsky.notification.listNotifications` — showing mentions, replies, and likes from the user's Bluesky notification stream. Filtered to show only notifications relevant to posts in joined communities.

### 4.8 Local Storage Schema

```typescript
interface BeaconLocalState {
  // Joined communities
  communities: {
    hashtag: string;
    joinedAt: string;       // ISO timestamp
    description?: string;   // User-edited
  }[];

  // User preferences
  preferences: {
    theme: 'dark' | 'light';  // Default: dark
    defaultSort: 'latest' | 'top';
  };

  // OAuth session (handled by @atproto/oauth-client-browser)
  // Stored separately by the library
}
```

---

## 5. Technical Architecture

### 5.1 MVP: Zero Backend

```
┌─────────────────────────────────────────────────────────┐
│                    Angular SPA                           │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Community    │  │   Feed       │  │   Auth       │  │
│  │  Store        │  │   Store      │  │   Service    │  │
│  │ (localStorage)│  │  (signals)   │  │  (OAuth)     │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                  │                  │          │
│         └──────────────────┼──────────────────┘         │
│                            │                             │
│              ┌─────────────┴─────────────┐              │
│              │     @atproto/api          │              │
│              │  (AT Protocol client)      │              │
│              └─────────────┬─────────────┘              │
└────────────────────────────┼────────────────────────────┘
                             │ HTTPS
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
    ┌─────────────┐  ┌───────────┐  ┌───────────┐
    │ Bluesky     │  │  User's   │  │  Profile  │
    │ AppView API │  │  PDS      │  │  Resolution│
    │             │  │           │  │           │
    │ searchPosts │  │ like      │  │ getProfile│
    │ getPostThread│ │ reply     │  │           │
    │ getTagged   │  │ repost    │  │           │
    │ Suggestions │  │ post      │  │           │
    └─────────────┘  └───────────┘  └───────────┘
```

**No server. No database. No hosting costs.**

Deployed as a static SPA on Vercel / Cloudflare Pages / Netlify.

### 5.2 Bluesky API Endpoints Used

| Endpoint | Purpose | Auth Required |
|---|---|---|
| `app.bsky.feed.searchPosts` | Community feed (hashtag search with sort) | No |
| `app.bsky.feed.getPostThread` | Thread view (post + replies) | No |
| `app.bsky.feed.like` | Like a post (create record) | Yes |
| `app.bsky.feed.post` | Reply or new post (create record) | Yes |
| `app.bsky.feed.repost` | Repost (create record) | Yes |
| `app.bsky.actor.getProfile` | User profile data | No |
| `app.bsky.actor.searchActors` | Search for users | No |
| `app.bsky.notification.listNotifications` | User notifications | Yes |
| `com.atproto.repo.createRecord` | Generic record creation | Yes |
| `com.atproto.repo.deleteRecord` | Unlike/unrepost | Yes |

### 5.3 OAuth (Public Client)

AT Protocol OAuth supports public clients (no client secret). The flow runs entirely in the browser:

```
1. User enters Bluesky handle
2. Client resolves handle → DID → PDS authorization server
3. Redirect to PDS authorization page (PKCE flow)
4. User approves scopes
5. PDS redirects back to Beacon with authorization code
6. Client exchanges code for tokens (in browser)
7. Tokens stored by @atproto/oauth-client-browser
8. All subsequent API calls use these tokens
```

**Library:** `@atproto/oauth-client-browser` — handles the full flow including PKCE, token storage, and refresh.

---

## 6. Phased Roadmap

### MVP — Zero Backend MVP

**Goal:** Prove that hashtag-communities have product-market fit with zero infrastructure.

**Build:**
- Angular SPA (static deployment)
- Bluesky OAuth (public client, in-browser)
- Community pages (`/!/tagname`) with feeds from `searchPosts` (latest + top sort)
- Like, reply, repost — direct AT Protocol writes from browser
- Threaded discussions via `getPostThread`
- Sidebar with joined communities + trending
- Explore page for discovering communities
- Home feed aggregating joined communities
- Dark mode (default on)
- localStorage for community memberships + preferences

**Don't build:**
- Any backend server
- Any database
- Firehose consumer
- Custom hot ranking algorithm
- Real-time streaming / SSE
- Push notifications
- Native apps

**Infrastructure cost:** $0 (static hosting on free tier)
**Timeline:** 4–6 weeks to public beta



### P Native Apps

**Add:**
- iOS/macOS: Swift shell + WKWebView hosting Angular SPA
  Ref /Just-Maple as needed
---

---

## 9. Risks & Mitigations

| Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|
| **Bluesky searchPosts API changes or rate limits tighten** | Critical | Low | AT Protocol is open; can fall back to firehose + server. Migration path is clear. |
| **searchPosts quality isn't good enough** | High | Medium | If top sort doesn't feel right, it's a signal to build Phase 2 with custom ranking. |
| **localStorage = no cross-device sync** | Medium | High | Acceptable for MVP. Phase 2 adds server-side community memberships. |
| **Bluesky adds native community features** | High | Medium | Speed to market. Being there first with a good UX matters. |
| **Low engagement — users prefer Bluesky directly** | Critical | Medium | Focus on what Bluesky can't do: community structure, sorted topic feeds, dedicated space. |
| **OAuth public client limitations** | Medium | Low | @atproto/oauth-client-browser is well-maintained. Can add server-side OAuth in Phase 2. |

