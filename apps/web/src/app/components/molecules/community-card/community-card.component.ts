import { Component, input, output } from '@angular/core';

@Component({
  selector: 'beacon-community-card',
  standalone: true,
  templateUrl: './community-card.component.html',
  styleUrl: './community-card.component.scss',
})
export class CommunityCardComponent {
  readonly hashtag = input.required<string>();
  readonly description = input('');
  readonly memberCount = input('');
  readonly isJoined = input(false);
  readonly joinClicked = output<string>();

  onJoin(event: Event): void {
    event.stopPropagation();
    this.joinClicked.emit(this.hashtag());
  }
}
