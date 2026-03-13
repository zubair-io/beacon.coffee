import { Component, input, computed } from '@angular/core';

const FALLBACK_COLORS = [
  '#993629', '#c2410c', '#b58900', '#16a34a',
  '#2563eb', '#9333ea', '#db2777', '#0d9488',
];

@Component({
  selector: 'beacon-avatar',
  standalone: true,
  templateUrl: './avatar.component.html',
  styleUrl: './avatar.component.scss',
})
export class AvatarComponent {
  readonly src = input<string | undefined>();
  readonly name = input<string>('');
  readonly size = input<'sm' | 'md' | 'lg'>('md');

  readonly initials = computed(() => {
    const n = this.name();
    if (!n) return '?';
    return n.charAt(0).toUpperCase();
  });

  readonly gradient = computed(() => {
    const n = this.name();
    let hash = 0;
    for (let i = 0; i < n.length; i++) {
      hash = n.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % FALLBACK_COLORS.length;
    const nextIdx = (idx + 1) % FALLBACK_COLORS.length;
    return `linear-gradient(135deg, ${FALLBACK_COLORS[idx]}, ${FALLBACK_COLORS[nextIdx]})`;
  });

  readonly sizeClass = computed(() => `avatar-${this.size()}`);
}
