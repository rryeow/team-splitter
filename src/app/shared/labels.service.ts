import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

const LABELS_KEY = 'labels';
const DEFAULT_LABELS = ['Top', 'Jungle', 'Mid', 'Bot', 'Support'];

@Injectable({
  providedIn: 'root',
})
export class LabelsService {
  // tslint:disable-next-line:variable-name
  private _playerLabels: BehaviorSubject<string[]>;

  get playerLabels$(): Observable<string[]> {
    return this._playerLabels.asObservable();
  }

  constructor() {
    const storedLabels = localStorage.getItem(LABELS_KEY);
    const initialLabels: string[] = storedLabels === null ? DEFAULT_LABELS : JSON.parse(storedLabels);
    this._playerLabels = new BehaviorSubject(removeEmptyTailLabels(initialLabels));
  }

  addPlayerLabel(): void {
    const playerLabels = this._playerLabels.value;
    this.updateLabels([...playerLabels, '']);
  }

  updatePlayerLabel(playerIndex: number, label: string): void {
    const playerLabels = this._playerLabels.value;
    playerLabels[playerIndex] = label;
    this.updateLabels([...playerLabels]);
  }

  resetLabels(): void {
    this.updateLabels([...DEFAULT_LABELS]);
  }

  private updateLabels(labels: string[]): void {
    this._playerLabels.next(labels);
    localStorage.setItem(LABELS_KEY, JSON.stringify(labels));
  }
}

function removeEmptyTailLabels(labels: string[]): string[] {
  for (let i = labels.length - 1; i >= 0; i -= 1) {
    if (labels[i].trim().length === 0) {
      labels.pop();
    } else {
      return labels;
    }
  }
  return labels;
}
