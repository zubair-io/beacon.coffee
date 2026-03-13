import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { BrowserOAuthClient } from '@atproto/oauth-client-browser';
import { Agent } from '@atproto/api';
import { AtprotoService } from './atproto.service';
import type { ProfileViewDetailed } from '../types/post';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly atproto = inject(AtprotoService);
  private readonly router = inject(Router);
  private oauthClient: BrowserOAuthClient | null = null;
  private initPromise: Promise<void> | null = null;

  readonly isAuthenticated = signal(false);
  readonly currentUser = signal<ProfileViewDetailed | null>(null);
  readonly isInitializing = signal(true);

  private getClientId(): string {
    if (typeof window === 'undefined') return 'https://beacon.coffee/client-metadata.json';
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      const port = window.location.port;
      const redirectUri = `http://127.0.0.1:${port}/auth/callback`;
      return `http://localhost?redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent('atproto transition:generic')}`;
    }
    return `${window.location.origin}/client-metadata.json`;
  }

  private async getClient(): Promise<BrowserOAuthClient> {
    if (!this.oauthClient) {
      this.oauthClient = await BrowserOAuthClient.load({
        clientId: this.getClientId(),
        handleResolver: 'https://bsky.social',
      });
    }
    return this.oauthClient;
  }

  async init(): Promise<void> {
    if (this.initPromise) return this.initPromise;
    this.initPromise = this.doInit();
    return this.initPromise;
  }

  private async doInit(): Promise<void> {
    try {
      const client = await this.getClient();
      const result = await client.init();

      if (result?.session) {
        const agent = new Agent(result.session);
        this.atproto.setAgent(agent);
        await this.fetchCurrentUser(agent);
      }
    } catch (err) {
      console.warn('Session restore failed:', err);
    } finally {
      this.isInitializing.set(false);
    }
  }

  async login(handle: string): Promise<void> {
    const client = await this.getClient();
    await client.signIn(handle, {
      signal: new AbortController().signal,
    });
  }

  async handleCallback(): Promise<boolean> {
    try {
      const client = await this.getClient();
      const result = await client.init();

      if (result?.session) {
        const agent = new Agent(result.session);
        this.atproto.setAgent(agent);
        await this.fetchCurrentUser(agent);
        this.isInitializing.set(false);
        return true;
      }
      return false;
    } catch (err) {
      console.error('OAuth callback failed:', err);
      return false;
    } finally {
      this.isInitializing.set(false);
    }
  }

  async logout(): Promise<void> {
    try {
      const client = await this.getClient();
      const session = (client as any).sessionStore;
      if (session?.deleteSession) {
        await session.deleteSession();
      }
    } catch {
      /* best-effort cleanup */
    }
    this.oauthClient = null;
    this.initPromise = null;
    this.atproto.clearAgent();
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  private async fetchCurrentUser(agent: Agent): Promise<void> {
    try {
      const did = agent.assertDid;
      const profile = await this.atproto.getProfile(did);
      this.currentUser.set(profile);
      this.atproto.currentUser.set(profile);
      this.isAuthenticated.set(true);
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    }
  }
}
