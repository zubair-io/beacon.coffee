import { Component, input, output } from '@angular/core';
import type { FeedSort } from '../../../types/post';

@Component({
  selector: 'beacon-sort-tabs',
  standalone: true,
  template: `
    <div class="sort-tabs">
      <button
        class="sort-tab"
        [class.active]="activeSort() === 'top'"
        (click)="sortChanged.emit('top')"
      >Top</button>
      <button
        class="sort-tab"
        [class.active]="activeSort() === 'latest'"
        (click)="sortChanged.emit('latest')"
      >Latest</button>
    </div>
  `,
  styles: `
    .sort-tabs { display: flex; gap: 4px; }
    .sort-tab {
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      color: var(--beacon-text-muted);
      background: transparent;
      border: none;
      cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }
    .sort-tab:hover { background: var(--beacon-bg-tertiary); color: var(--beacon-text); }
    .sort-tab.active {
      background: rgba(153, 54, 41, 0.15);
      color: var(--beacon-primary);
    }
  `,
})
export class SortTabsComponent {
  readonly activeSort = input<FeedSort>('top');
  readonly sortChanged = output<FeedSort>();
}
