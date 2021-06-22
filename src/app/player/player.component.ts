import { Component, HostBinding, Input, OnInit } from '@angular/core';
import { PlayersService } from '../shared/players.service';
import { combineLatest, EMPTY, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { Player } from '../shared/interfaces';
import { LabelsService } from '../shared/labels.service';
import { formatPlaceholderPlayerName, PLACEHOLDER_PLAYER_NAME } from '../shared/utils';

interface PlayerInfo {
  label?: string;
  player?: Player;
  placeholderPlayerName: string;
  isInPool: boolean;
}

@Component({
  selector: 'ts-player',
  templateUrl: './player.component.html',
})
export class PlayerComponent implements OnInit {
  @HostBinding('class.player') playerClass = true;
  @Input() id = '';
  playerInfo$: Observable<PlayerInfo> = EMPTY;

  constructor(
    private playersService: PlayersService,
    private labelsService: LabelsService,
  ) {}

  ngOnInit(): void {
    const playerIndex$ = this.playersService.teams$
      .pipe(
        map(teams => {
          for (const team of teams) {
            const playerIndex = team.players.findIndex(player => player.id === this.id);
            if (playerIndex !== -1) {
              return playerIndex;
            }
          }
          return undefined;
        }),
        distinctUntilChanged(),
      );
    const label$ = combineLatest([
      this.labelsService.playerLabels$,
      playerIndex$,
    ])
      .pipe(
        map(([playerLabels, playerIndex]) => {
          return playerIndex === undefined ? undefined : playerLabels[playerIndex];
        }),
        distinctUntilChanged(),
      );

    const player$ = combineLatest([
      this.playersService.pool$,
      this.playersService.teams$,
    ])
      .pipe(
        map(([pool, teams]) => {
          const playerLists = [pool, ...teams];
          return playerLists
            .flatMap(playerList => playerList.players)
            .find(player => player.id === this.id);
        }),
        distinctUntilChanged(),
      );

    const placeholderPlayerName$ = playerIndex$
      .pipe(
        map(playerIndex => playerIndex === undefined
          ? PLACEHOLDER_PLAYER_NAME
          : formatPlaceholderPlayerName(playerIndex)
        ),
        distinctUntilChanged(),
      );

    const isInPool$ = this.playersService.pool$
      .pipe(
        map(pool => pool.players.some(p => p.id === this.id)),
        distinctUntilChanged(),
      );

    this.playerInfo$ = combineLatest([label$, player$, placeholderPlayerName$, isInPool$])
      .pipe(
        map(([label, player, placeholderPlayerName, isInPool]) => (
          { label, player, placeholderPlayerName, isInPool }
        )),
      );
  }

  updatePlayerName(playerName: string): void {
    this.playersService.updatePlayer(this.id, _ => ({ playerName: playerName.trim() }));
  }

  togglePinnedState(): void {
    this.playersService.updatePlayer(this.id, p => ({ isPinned: !p.isPinned }));
  }

  demotePlayer(): void {
    this.playersService.demotePlayer(this.id);
  }
}
