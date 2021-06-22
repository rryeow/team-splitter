import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import { PlayerListDirective } from '../player-list/player-list.directive';
import { PlayerListInfo } from '../player-list/player-list-info.interface';
import { POOL_ID } from '../shared/constants';
import { DragService } from '../shared/drag.service';
import { Pool } from '../shared/interfaces';
import { LayoutService } from '../shared/layout.service';
import { PlayersService } from '../shared/players.service';

type PoolInfo = PlayerListInfo;

@Component({
  selector: 'ts-pool',
  templateUrl: './pool.component.html',
})
export class PoolComponent extends PlayerListDirective implements OnInit, OnDestroy {
  @HostBinding('class.pool') poolClass = true;
  poolInfo$: Observable<PoolInfo> = EMPTY;

  constructor(
    protected dragService: DragService,
    protected layoutService: LayoutService,
    protected playersService: PlayersService,
  ) {
    super(dragService, layoutService, playersService);
    this.id = POOL_ID;
  }

  ngOnInit(): void {
    super.ngOnInit();
    this.poolInfo$ = this.playerListInfo$;
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  getPlayerList(): Observable<Pool> {
    return this.playersService.pool$;
  }

  clearPool(): void {
    this.playersService.clearPool();
  }
}
