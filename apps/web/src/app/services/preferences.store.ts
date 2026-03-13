import { Injectable, signal, effect } from '@angular/core';
import type { FeedSort } from '../types/post';

type Theme = 'dark' | 'light' | 'system';

interface Preferences {
  theme: Theme;
  defaultSort: FeedSort;
}

const STORAGE_KEY = 'beacon_preferences';
const DEFAULT_PREFS: Preferences = { theme: 'system', defaultSort: 'top' };

@Injectable({ providedIn: 'root' })
export class PreferencesStore {
  private readonly prefs = this.load();

  readonly theme = signal<Theme>(this.prefs.theme);
  readonly defaultSort = signal<FeedSort>(this.prefs.defaultSort);

  constructor() {
    effect(() => {
      const t = this.theme();
      this.applyTheme(t);
      this.save();
    });

    effect(() => {
      this.defaultSort();
      this.save();
    });
  }

  toggleTheme(): void {
    const current = this.theme();
    if (current === 'dark') {
      this.theme.set('light');
    } else if (current === 'light') {
      this.theme.set('dark');
    } else {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.theme.set(isDark ? 'light' : 'dark');
    }
  }

  setDefaultSort(sort: FeedSort): void {
    this.defaultSort.set(sort);
  }

  private applyTheme(theme: Theme): void {
    if (typeof document === 'undefined') return;
    let resolved = theme;
    if (resolved === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    if (resolved === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  private load(): Preferences {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
    } catch {
      return DEFAULT_PREFS;
    }
  }

  private save(): void {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        theme: this.theme(),
        defaultSort: this.defaultSort(),
      }),
    );
  }
}
