import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { Agent, RichText } from '@atproto/api';
import type { ProfileViewDetailed } from '../types/post';
import type { FeedSort } from '../types/post';

const BSKY_API = 'https://api.bsky.app/xrpc';

@Injectable({ providedIn: 'root' })
export class AtprotoService {
  private readonly http = inject(HttpClient);
  private agent: Agent | null = null;

  readonly isAuthenticated = signal(false);
  readonly currentUser = signal<ProfileViewDetailed | null>(null);

  setAgent(agent: Agent): void {
    this.agent = agent;
    this.isAuthenticated.set(true);
  }

  clearAgent(): void {
    this.agent = null;
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
  }

  getAgent(): Agent | null {
    return this.agent;
  }

  searchPosts(query: string, sort: FeedSort, cursor?: string): Observable<any> {
    let params = new HttpParams().set('q', query).set('sort', sort).set('limit', '25');
    if (cursor) params = params.set('cursor', cursor);
    return this.http.get<any>(`${BSKY_API}/app.bsky.feed.searchPosts`, { params });
  }

  getPostThread(uri: string, depth = 10) {
    const params = new HttpParams().set('uri', uri).set('depth', String(depth));
    return firstValueFrom(this.http.get<any>(`${BSKY_API}/app.bsky.feed.getPostThread`, { params }));
  }

  getProfile(handle: string) {
    const params = new HttpParams().set('actor', handle);
    return firstValueFrom(this.http.get<any>(`${BSKY_API}/app.bsky.actor.getProfile`, { params }));
  }

  searchActors(query: string, limit = 8) {
    const params = new HttpParams().set('q', query).set('limit', String(limit));
    return firstValueFrom(this.http.get<any>(`${BSKY_API}/app.bsky.actor.searchActors`, { params }));
  }

  async like(uri: string, cid: string) {
    this.requireAuth();
    return this.agent!.like(uri, cid);
  }

  async unlike(likeUri: string) {
    this.requireAuth();
    return this.agent!.deleteLike(likeUri);
  }

  async repost(uri: string, cid: string) {
    this.requireAuth();
    return this.agent!.repost(uri, cid);
  }

  async unrepost(repostUri: string) {
    this.requireAuth();
    return this.agent!.deleteRepost(repostUri);
  }

  async reply(
    text: string,
    parent: { uri: string; cid: string },
    root: { uri: string; cid: string },
  ) {
    this.requireAuth();
    const rt = new RichText({ text });
    await rt.detectFacets(this.agent!);
    return this.agent!.post({
      text: rt.text,
      facets: rt.facets,
      reply: { root, parent },
    });
  }

  async createPost(text: string) {
    this.requireAuth();
    const rt = new RichText({ text });
    await rt.detectFacets(this.agent!);
    return this.agent!.post({
      text: rt.text,
      facets: rt.facets,
    });
  }

  async listNotifications(cursor?: string) {
    this.requireAuth();
    const params: Record<string, string> = { limit: '30' };
    if (cursor) params['cursor'] = cursor;
    return this.agent!.listNotifications(params);
  }

  private requireAuth(): void {
    if (!this.agent) {
      throw new Error('Authentication required');
    }
  }
}
