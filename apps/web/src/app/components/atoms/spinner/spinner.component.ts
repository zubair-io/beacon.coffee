import { Component, input } from '@angular/core';

@Component({
  selector: 'beacon-spinner',
  standalone: true,
  template: `<div class="spinner" [class]="'spinner-' + size()"></div>`,
  styles: `
    .spinner {
      border: 3px solid var(--beacon-border);
      border-top-color: var(--beacon-primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    .spinner-sm { width: 20px; height: 20px; border-width: 2px; }
    .spinner-md { width: 32px; height: 32px; }
    .spinner-lg { width: 48px; height: 48px; border-width: 4px; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `,
})
export class SpinnerComponent {
  readonly size = input<'sm' | 'md' | 'lg'>('md');
}
