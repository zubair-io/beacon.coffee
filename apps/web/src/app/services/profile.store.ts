import { Injectable, inject, signal } from '@angular/core';
import { AtprotoService } from './atproto.service';
import type { ProfileViewDetailed } from '../types/post';

@Injectable({ providedIn: 'root' })
export class ProfileStore {
  private readonly atproto = inject(AtprotoService);
  private readonly cache = new Map<string, ProfileViewDetailed>();

  readonly currentProfile = signal<ProfileViewDetailed | null>(null);
  readonly loading = signal(false);

  async loadProfile(handle: string): Promise<ProfileViewDetailed> {
    const cached = this.cache.get(handle);
    if (cached) {
      this.currentProfile.set(cached);
      return cached;
    }

    this.loading.set(true);
    try {
      const profile = await this.atproto.getProfile(handle);
      this.cache.set(handle, profile);
      this.currentProfile.set(profile);
      return profile;
    } finally {
      this.loading.set(false);
    }
  }

  getFromCache(handle: string): ProfileViewDetailed | undefined {
    return this.cache.get(handle);
  }
}
