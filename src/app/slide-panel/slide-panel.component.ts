import { Component, HostBinding, Input, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, EMPTY, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

type PanelEdge = 'left' | 'right';
interface PanelInfo {
  isOpen: boolean;
  toggleIcon: string;
}

@Component({
  selector: 'ts-slide-panel',
  templateUrl: './slide-panel.component.html',
})
export class SlidePanelComponent implements OnInit {
  @HostBinding('class.slide-panel') slidePanelClass = true;
  @HostBinding('class.slide-panel--left') leftPanelClass = false;
  @HostBinding('class.slide-panel--right') rightPanelClass = false;

  @Input()
  set panelEdge(value: PanelEdge) {
    this._panelEdge = value;
    if (value === 'left') {
      this.leftPanelClass = true;
      this.rightPanelClass = false;
    } else {
      this.leftPanelClass = false;
      this.rightPanelClass = true;
    }
  }
  get panelEdge(): PanelEdge {
    return this._panelEdge;
  }

  get isOpen$(): Observable<boolean> {
    return this._isOpen.asObservable();
  }

  panelInfo$: Observable<PanelInfo> = EMPTY;
  private _isOpen = new BehaviorSubject(false);
  private _panelEdge: PanelEdge = 'left';

  ngOnInit(): void {
    const toggleIcon$ = this.isOpen$
      .pipe(
        map(isOpen => {
          if ((isOpen && this.panelEdge === 'left') || (!isOpen && this.panelEdge === 'right')) {
            return 'arrow_left';
          }
          return 'arrow_right';
        }),
      );

    this.panelInfo$ = combineLatest([this.isOpen$, toggleIcon$])
      .pipe(
        map(([isOpen, toggleIcon]) => ({ isOpen, toggleIcon })),
      );
  }

  togglePanel(): void {
    const isOpen = this._isOpen.value;
    this._isOpen.next(!isOpen);
  }
}
