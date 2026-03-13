import type { AppBskyFeedDefs, AppBskyActorDefs } from '@atproto/api';

export type PostView = AppBskyFeedDefs.PostView;
export type ThreadViewPost = AppBskyFeedDefs.ThreadViewPost;
export type ProfileView = AppBskyActorDefs.ProfileView;
export type ProfileViewDetailed = AppBskyActorDefs.ProfileViewDetailed;
export type FeedSort = 'top' | 'latest';

export interface Author {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
}
