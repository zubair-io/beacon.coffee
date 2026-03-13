import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'beacon-button',
  standalone: true,
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
})
export class ButtonComponent {
  readonly variant = input<'primary' | 'secondary' | 'icon' | 'ghost'>('primary');
  readonly size = input<'sm' | 'md'>('md');
  readonly disabled = input(false);
  readonly cssClass = computed(() => `btn btn-${this.variant()} btn-${this.size()}`);
}
