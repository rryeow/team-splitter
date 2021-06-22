import { CdkDrag, CdkDragStart } from '@angular/cdk/drag-drop';
import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { asyncScheduler, EMPTY, fromEvent, merge, Observable, Subject } from 'rxjs';
import { map, switchMap, throttleTime } from 'rxjs/operators';
import { DEFAULT_THROTTLE_DURATION } from './constants';

interface PointerPosition {
  x: number;
  y: number;
}

@Injectable({
  providedIn: 'root',
})
export class DragService {
  dragPointerPosition$: Observable<PointerPosition>;
  private _dragElement$ = new Subject<CdkDrag>();

  get dragElement$(): Observable<CdkDrag> {
    return this._dragElement$.asObservable();
  }

  constructor(@Inject(DOCUMENT) private document: Document) {
    const mousemove$ = fromEvent<MouseEvent>(this.document, 'mousemove');
    const touchmove$ = fromEvent<TouchEvent>(this.document, 'touchmove')
      .pipe(map(touchmoveEvent => touchmoveEvent.touches[0]));
    const mouseOrTouchMovePosition$ = merge(mousemove$, touchmove$)
      .pipe(
        throttleTime(DEFAULT_THROTTLE_DURATION, asyncScheduler, { leading: true, trailing: false }),
        map(({ clientX, clientY }) => ({ x: clientX, y: clientY })),
      );
    this.dragPointerPosition$ = this.dragElement$
      .pipe(switchMap(dragElement => dragElement === undefined ? EMPTY : mouseOrTouchMovePosition$));
  }

  startDragPlayer(dragStartEvent: CdkDragStart): void {
    this._dragElement$.next(dragStartEvent.source);
  }

  endDragPlayer(): void {
    this._dragElement$.next(undefined);
  }
}
