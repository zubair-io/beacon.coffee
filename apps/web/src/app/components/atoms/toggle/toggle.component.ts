import { Component, input, output } from '@angular/core';

@Component({
  selector: 'beacon-toggle',
  standalone: true,
  templateUrl: './toggle.component.html',
  styleUrl: './toggle.component.scss',
})
export class ToggleComponent {
  readonly checked = input(false);
  readonly label = input('');
  readonly toggled = output<boolean>();

  onToggle(): void {
    this.toggled.emit(!this.checked());
  }
}
