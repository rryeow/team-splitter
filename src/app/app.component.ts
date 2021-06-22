import { AfterViewInit, Component, ElementRef, HostBinding, OnDestroy, ViewChild } from '@angular/core';
import { combineLatest, EMPTY, Observable, Subject } from 'rxjs';
import {
  filter,
  pairwise,
  pluck,
  switchMap,
  takeUntil,
  withLatestFrom,
} from 'rxjs/operators';
import { DragService } from './shared/drag.service';
import { AppLayout } from './shared/interfaces';
import { LayoutService } from './shared/layout.service';
import { SlidePanelComponent } from './slide-panel/slide-panel.component';

const OPEN_POOL_WHILE_DRAG_THRESHOLD = 100;

@Component({
  selector: 'ts-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements AfterViewInit, OnDestroy {
  @HostBinding('class.app') appClass = true;
  @ViewChild('labelsPanel') labelsPanel!: SlidePanelComponent;
  @ViewChild('poolPanel') poolPanel!: SlidePanelComponent;
  @ViewChild('poolPanel', { read: ElementRef }) poolPanelElementRef!: ElementRef;
  layout$: Observable<AppLayout>;
  unsubscribeNotifier$ = new Subject();

  constructor(
    private layoutService: LayoutService,
    private dragService: DragService,
  ) {
    this.layout$ = this.layoutService.layout$;
  }

  ngAfterViewInit(): void {
    this.keepOnlyOnePanelOpenInSingleColumnLayout();
    this.dynamicallyClosePoolOnResizeToSingleColumnLayout();
    this.dynamicallyOpenPoolWhileDrag();
  }

  ngOnDestroy(): void {
    this.unsubscribeNotifier$.next();
    this.unsubscribeNotifier$.complete();
  }

  private keepOnlyOnePanelOpenInSingleColumnLayout(): void {
    const panelOpenStateChange$ = combineLatest([
      this.labelsPanel.isOpen$,
      this.poolPanel.isOpen$,
    ])
      .pipe(pairwise());
    this.layoutService.isSingleColumnLayout$
      .pipe(
        switchMap(isSingleColumnLayout => isSingleColumnLayout ? panelOpenStateChange$ : EMPTY),
        filter(([_, [isLabelsPanelOpen, isPoolPanelOpen]]) => isLabelsPanelOpen && isPoolPanelOpen),
        takeUntil(this.unsubscribeNotifier$),
      )
      .subscribe(([[wasLabelsPanelOpen]]) => {
        if (wasLabelsPanelOpen) {
          this.labelsPanel.togglePanel();
        } else {
          this.poolPanel.togglePanel();
        }
      });
  }

  private dynamicallyClosePoolOnResizeToSingleColumnLayout(): void {
    this.layoutService.isSingleColumnLayout$
      .pipe(
        filter(isSingleColumnLayout => isSingleColumnLayout),
        withLatestFrom(this.labelsPanel.isOpen$, this.poolPanel.isOpen$),
        filter(([_, isLabelsPanelOpen, isPoolPanelOpen]) => isLabelsPanelOpen && isPoolPanelOpen),
        takeUntil(this.unsubscribeNotifier$),
      )
      .subscribe(() => {
        this.poolPanel.togglePanel();
      });
  }

  private dynamicallyOpenPoolWhileDrag(): void {
    const dragPointerDx$ = this.dragService.dragPointerPosition$
      .pipe(
        pluck('x'),
        pairwise(),
      );
    const dragEnterPoolEdge$ = dragPointerDx$
      .pipe(
        withLatestFrom(this.layoutService.innerWidth$),
        filter(([[prevX, currX], innerWidth]) => {
          const openPoolWhileDragThresholdX = innerWidth - OPEN_POOL_WHILE_DRAG_THRESHOLD;
          return (prevX < openPoolWhileDragThresholdX) && (currX >= openPoolWhileDragThresholdX);
        }),
      );
    // const dragExitPoolEdge$ = dragPointerDx$
    //   .pipe(
    //     filter(([prevX, currX]) => {
    //       const poolPanelElement: HTMLElement = this.poolPanelElementRef.nativeElement;
    //       const closePoolWhileDragThresholdX = poolPanelElement.getBoundingClientRect().x;
    //       return (prevX >= closePoolWhileDragThresholdX) && (currX < closePoolWhileDragThresholdX);
    //     }),
    //   );
    this.layoutService.isSingleColumnLayout$
      .pipe(
        switchMap(isSingleColumnLayout => isSingleColumnLayout ? dragEnterPoolEdge$ : EMPTY),
        withLatestFrom(this.poolPanel.isOpen$),
        filter(([_, isOpen]) => !isOpen),
        takeUntil(this.unsubscribeNotifier$),
      )
      .subscribe(() => {
        this.poolPanel.togglePanel();
      });
  }
}
