import { Component } from '@angular/core';

@Component({
  selector: 'beacon-source-badge',
  standalone: true,
  template: `<span class="source-badge"><span class="dot"></span> Bluesky</span>`,
  styles: `
    .source-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      font-weight: 600;
      color: var(--beacon-bluesky);
      white-space: nowrap;
    }
    .dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--beacon-bluesky);
    }
  `,
})
export class SourceBadgeComponent {}
