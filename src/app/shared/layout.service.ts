import { BreakpointObserver } from '@angular/cdk/layout';
import { Injectable } from '@angular/core';
import { asyncScheduler, fromEvent, Observable } from 'rxjs';
import { map, pluck, startWith, throttleTime } from 'rxjs/operators';
import { DEFAULT_THROTTLE_DURATION, WIDE_LAYOUT_MIN_WIDTH } from './constants';
import { AppLayout } from './interfaces';

@Injectable({
  providedIn: 'root',
})
export class LayoutService {
  layout$: Observable<AppLayout>;
  isSingleColumnLayout$: Observable<boolean>;
  innerWidth$: Observable<number>;

  constructor(private breakpointObserver: BreakpointObserver) {
    this.layout$ = this.breakpointObserver.observe(`(min-width: ${WIDE_LAYOUT_MIN_WIDTH}px)`)
      .pipe(
        map(breakpointState => breakpointState.matches ? 'wide' : 'single-column'),
      );
    this.isSingleColumnLayout$ = this.layout$
      .pipe(
        map(layout => layout === 'single-column'),
      );
    this.innerWidth$ = fromEvent(window, 'resize')
      .pipe(
        map(resizeEvent => resizeEvent.target as Window),
        startWith(window),
        throttleTime(DEFAULT_THROTTLE_DURATION, asyncScheduler, { leading: true, trailing: true }),
        pluck('innerWidth'),
      );
  }
}
