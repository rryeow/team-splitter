import { Component, HostBinding, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { combineLatest, EMPTY, Observable } from 'rxjs';
import { distinctUntilChanged, map, take, takeUntil } from 'rxjs/operators';
import { PlayerListDirective } from '../player-list/player-list.directive';
import { DragService } from '../shared/drag.service';
import { AppLayout, Player, Team } from '../shared/interfaces';
import { LayoutService } from '../shared/layout.service';
import { PlayersService } from '../shared/players.service';
import { formatPlaceholderTeamName } from '../shared/utils';

interface TeamInfo {
  appLayout: AppLayout;
  team?: Team;
  placeholderTeamName: string;
  players: Player[];
  connectedToIds: string[];
  showEmptyListPlaceholder: boolean;
}

@Component({
  selector: 'ts-team',
  templateUrl: './team.component.html',
})
export class TeamComponent extends PlayerListDirective implements OnInit, OnDestroy {
  @HostBinding('class.team') teamClass = true;
  teamNameControl = new FormControl('');
  newPlayerNameControl = new FormControl('');
  teamInfo$: Observable<TeamInfo> = EMPTY;

  constructor(
    protected dragService: DragService,
    protected layoutService: LayoutService,
    protected playersService: PlayersService,
  ) {
    super(dragService, layoutService, playersService);
  }

  ngOnInit(): void {
    super.ngOnInit();

    const team$ = this.getPlayerList();
    const placeholderTeamName$ = this.playersService.teams$
      .pipe(
        map(teams => teams.findIndex(team => team.id === this.id)),
        distinctUntilChanged(),
        map(teamIndex => formatPlaceholderTeamName(teamIndex)),
      );

    this.teamInfo$ = combineLatest([
      this.playerListInfo$,
      this.layoutService.layout$,
      team$,
      placeholderTeamName$,
    ])
      .pipe(
        map(([playerListInfo, appLayout, team, placeholderTeamName]) => (
          { ...playerListInfo, appLayout, team, placeholderTeamName }
        )),
      );

    team$
      .pipe(take(1))
      .subscribe(team => {
        this.teamNameControl.setValue(team?.teamName || '');
      });
    this.teamNameControl.valueChanges
      .pipe(takeUntil(this.unsubscribeNotifier$))
      .subscribe(teamName => {
        this.playersService.updateTeam(this.id, _ => ({ teamName }));
      });
  }

  ngOnDestroy(): void {
    super.ngOnDestroy();
  }

  getPlayerList(): Observable<Team | undefined> {
    return this.playersService.teams$
      .pipe(
        map(teams => teams.find(team => team.id === this.id)),
        distinctUntilChanged(),
      );
  }

  deleteTeam(): void {
    this.playersService.deleteTeam(this.id);
  }

  trimControlValue(formControl: FormControl): void {
    const rawValue = formControl.value;
    formControl.setValue(rawValue.trim());
  }

  addNewPlayerIfNotComposing(event: any, dropList: HTMLDivElement): void {
    if (!event.isComposing) {
      this.addNewPlayer(dropList);
    }
  }

  addNewPlayer(dropList: HTMLDivElement): void {
    this.trimControlValue(this.newPlayerNameControl);
    const playerData = { playerName: this.newPlayerNameControl.value };
    this.playersService.addTeamPlayer(this.id, playerData);
    setTimeout(() => {
      dropList.scrollTop = dropList.scrollHeight;
    });
    this.newPlayerNameControl.setValue('');
  }
}
