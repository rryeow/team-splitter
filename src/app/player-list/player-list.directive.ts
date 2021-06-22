import { CdkDragDrop, CdkDragStart } from '@angular/cdk/drag-drop';
import { Directive, Input, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, EMPTY, Observable, of, Subject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { DragService } from '../shared/drag.service';
import { Player, PlayerList } from '../shared/interfaces';
import { LayoutService } from '../shared/layout.service';
import { PlayersService } from '../shared/players.service';
import { PlayerListInfo } from './player-list-info.interface';

@Directive()
export abstract class PlayerListDirective implements OnInit, OnDestroy {
  @Input() id = '';
  protected playerListInfo$: Observable<PlayerListInfo> = EMPTY;
  protected unsubscribeNotifier$ = new Subject();
  private _dragPlayerEntered = new BehaviorSubject(false);

  protected constructor(
    protected dragService: DragService,
    protected layoutService: LayoutService,
    protected playersService: PlayersService,
  ) {}

  ngOnInit(): void {
    const connectedToIds$ = this.playersService.playerListIds$
      .pipe(
        map(ids => ids.filter(id => id !== this.id)),
      );
    const players$ = this.getPlayerList()
      .pipe(
        map(playerList => playerList?.players || []),
      );
    const dragPlayerEntered$ = this._dragPlayerEntered.asObservable();
    const showEmptyListPlaceholder$ = players$
      .pipe(
        switchMap(players => players.length === 0
          ? dragPlayerEntered$.pipe(map(dragPlayerEntered => !dragPlayerEntered))
          : of(false)
        ),
      );
    this.playerListInfo$ = combineLatest([
      connectedToIds$,
      players$,
      showEmptyListPlaceholder$,
    ])
      .pipe(
        map(([connectedToIds, players, showEmptyListPlaceholder]) => (
          { connectedToIds, players, showEmptyListPlaceholder }
        )),
      );
  }

  ngOnDestroy(): void {
    this.unsubscribeNotifier$.next();
    this.unsubscribeNotifier$.complete();
  }

  trackById(_: number, player: Player): string {
    return player.id;
  }

  dragPlayerEnterDropList(): void {
    this._dragPlayerEntered.next(true);
  }

  dragPlayerExitDropList(): void {
    this._dragPlayerEntered.next(false);
  }

  startDragPlayer(event: CdkDragStart): void {
    this.dragService.startDragPlayer(event);
  }

  endDragPlayer(): void {
    this.dragService.endDragPlayer();
  }

  drop(event: CdkDragDrop<Player[], Player[]>): void {
    if (event.previousContainer === event.container) {
      if (event.previousIndex !== event.currentIndex) {
        this.playersService.movePlayer(event);
      }
    } else {
      this.playersService.transferPlayer(event);
    }
  }

  abstract getPlayerList(): Observable<PlayerList | undefined>;
}
