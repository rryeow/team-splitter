import { Component, HostBinding } from '@angular/core';
import { Observable } from 'rxjs';
import { LabelsService } from '../shared/labels.service';

@Component({
  selector: 'ts-labels',
  templateUrl: './labels.component.html',
})
export class LabelsComponent {
  @HostBinding('class.labels') labelsClass = true;
  playerLabels$: Observable<string[]>;

  constructor(private labelsService: LabelsService) {
    this.playerLabels$ = this.labelsService.playerLabels$;
  }

  trackByIndex(index: number): number {
    return index;
  }

  addPlayerLabel(): void {
    this.labelsService.addPlayerLabel();
  }

  updatePlayerLabel(value: string, playerIndex: number): void {
    this.labelsService.updatePlayerLabel(playerIndex, value);
  }

  scrollToEnd(list: HTMLDivElement): void {
    setTimeout(() => {
      list.scrollTop = list.scrollHeight;
    });
  }
}
