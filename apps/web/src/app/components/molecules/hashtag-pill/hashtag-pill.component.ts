import { Component, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { normalizeTag } from '../../../utils/hashtag';

@Component({
  selector: 'beacon-hashtag-pill',
  standalone: true,
  template: `<span class="hashtag-pill" (click)="navigate($event)">#{{ tag() }}</span>`,
  styles: `
    .hashtag-pill {
      display: inline-block;
      color: var(--beacon-primary);
      background: rgba(153, 54, 41, 0.1);
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }
    .hashtag-pill:hover {
      background: rgba(153, 54, 41, 0.2);
    }
  `,
})
export class HashtagPillComponent {
  private readonly router = inject(Router);
  readonly tag = input.required<string>();

  navigate(event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/!', normalizeTag(this.tag())]);
  }
}
