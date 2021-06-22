import { Clipboard } from '@angular/cdk/clipboard';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { POOL_ID } from './constants';
import { Player, Pool, Team, Update, Updater } from './interfaces';
import { LabelsService } from './labels.service';
import { formatPlaceholderPlayerName, formatPlaceholderTeamName } from './utils';

const POOL_KEY = 'pool';
const TEAMS_KEY = 'teams';

const INITIAL_NUM_TEAMS = 2;
const INITIAL_NUM_TEAM_PLAYERS = 0;

const TEAM_PREFIX = 'team';
const PLAYER_PREFIX = 'player';

@Injectable({
  providedIn: 'root',
})
export class PlayersService {
  private nextIds = createInitialNextIds();
  // tslint:disable:variable-name
  private _pool: BehaviorSubject<Pool>;
  private _teams: BehaviorSubject<Team[]>;
  // tslint:enable:variable-name

  get pool$(): Observable<Pool> {
    return this._pool.asObservable();
  }

  get teams$(): Observable<Team[]> {
    return this._teams.asObservable();
  }

  get playerListIds$(): Observable<string[]> {
    return this.teams$
      .pipe(
        map(teams => [POOL_ID, ...teams.map(team => team.id)]),
      );
  }

  constructor(
    private labelsService: LabelsService,
    private clipboard: Clipboard,
  ) {
    const storedPool = localStorage.getItem(POOL_KEY);
    const initialPool: Pool = storedPool === null ? createPool() : JSON.parse(storedPool);
    initialPool.players.forEach((player) => {
      player.id = this.generateNextId(PLAYER_PREFIX);
    });
    this._pool = new BehaviorSubject(initialPool);

    const storedTeams = localStorage.getItem(TEAMS_KEY);
    let initialTeams: Team[];
    if (storedTeams === null) {
      initialTeams = this.createTeams();
    } else {
      initialTeams = JSON.parse(storedTeams);
      initialTeams.forEach((team) => {
        team.id = this.generateNextId(TEAM_PREFIX);
        team.players.forEach((player) => {
          player.id = this.generateNextId(PLAYER_PREFIX);
        });
      });
    }
    this._teams = new BehaviorSubject(initialTeams);
  }

  private generateNextId(prefix: typeof PLAYER_PREFIX | typeof TEAM_PREFIX): string {
    const suffix = this.nextIds[prefix];
    this.nextIds[prefix] += 1;
    return `${prefix}-${suffix}`;
  }

  shuffleTeams(): void {
    const teams = this._teams.value;
    inPlaceShuffle(teams);
    this.updateTeams(teams);
  }

  randomizePlayers(): void {
    const teams = this._teams.value;
    const pinnedPlayers = teams.map(team => {
      return team.players
        .map((player, playerIndex) => ({ playerIndex, player }))
        .filter(({ playerIndex, player }) => player.isPinned);
    });
    const unpinnedPlayers = teams
      .flatMap(team => team.players)
      .filter(player => !player.isPinned);
    inPlaceShuffle(unpinnedPlayers);

    const randomizedPlayers: Player[][] = teams.map(_ => []);
    let loopCount = 0;
    while (unpinnedPlayers.length > 0) {
      const playerIndex = Math.floor(loopCount / teams.length);
      const teamIndex = loopCount % teams.length;
      const originalPlayer = teams[teamIndex].players[playerIndex];
      if (originalPlayer?.isPinned) {
        randomizedPlayers[teamIndex][playerIndex] = originalPlayer;
        pinnedPlayers[teamIndex] = pinnedPlayers[teamIndex].filter(p => p.playerIndex !== playerIndex);
      } else {
        randomizedPlayers[teamIndex][playerIndex] = unpinnedPlayers.pop() as Player;
      }
      loopCount += 1;
    }
    pinnedPlayers.forEach((remainingPinnedPlayers, teamIndex) => {
      const players = remainingPinnedPlayers
        .sort((a, b) => a.playerIndex - b.playerIndex)
        .map(({ player }) => player);
      randomizedPlayers[teamIndex].push(...players);
    });
    this.updateTeams(teams.map((team, teamIndex) => ({ ...team, players: randomizedPlayers[teamIndex] })));
  }

  updatePool(poolUpdater: Updater<Pool>): void {
    const pool = this._pool.value;
    const newPool = { ...pool, ...poolUpdater(pool) };
    this._pool.next(newPool);
    localStorage.setItem(POOL_KEY, JSON.stringify(newPool));
  }

  clearPool(): void {
    this.updatePool(_ => ({ players: [] }));
  }

  addTeam(initialTeamData: Update<Team>, toTail: boolean): void {
    const team = {
      ...this.createTeam(),
      ...initialTeamData,
    };
    const teams = this._teams.value;
    this.updateTeams(toTail ? [...teams, team] : [team, ...teams]);
  }

  updateTeam(teamId: string, teamUpdater: Updater<Team>): void {
    const teams = this._teams.value;
    const teamIndex = teams.findIndex(t => t.id === teamId);
    if (teamIndex in teams) {
      const team = teams[teamIndex];
      teams[teamIndex] = { ...team, ...teamUpdater(team) };
      this.updateTeams(teams);
    }
  }

  moveTeam(event: CdkDragDrop<Team[], Team[]>): void {
    moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    const teams = event.container.data;
    this.updateTeams(teams);
  }

  deleteTeam(teamId: string): void {
    const teams = this._teams.value;
    const teamIndex = teams.findIndex(t => t.id === teamId);

    const teamPlayers = teams[teamIndex].players
      .filter(player => player.playerName.trim().length > 0);
    this.updatePool(pool => ({ players: [...pool.players, ...teamPlayers] }));

    teams.splice(teamIndex, 1);
    this.updateTeams(teams);
  }

  addTeamPlayer(teamId: string, playerData: Update<Player>): void {
    const player = {
      ...this.createPlayer(),
      ...playerData,
    };
    this.updateTeam(teamId, team => ({
      players: [...team.players, player],
    }));
  }

  updatePlayer(playerId: string, playerUpdater: Updater<Player>): void {
    const pool = this._pool.value;
    let playerIndex = pool.players.findIndex(p => p.id === playerId);
    if (playerIndex in pool.players) {
      const player = pool.players[playerIndex];
      pool.players[playerIndex] = { ...player, ...playerUpdater(player) };
      this.updatePool(_ => ({ players: [...pool.players] }));
      return;
    }
    const teams = this._teams.value;
    for (const team of teams) {
      playerIndex = team.players.findIndex(p => p.id === playerId);
      if (playerIndex in team.players) {
        const player = team.players[playerIndex];
        team.players[playerIndex] = { ...player, ...playerUpdater(player) };
        this.updateTeam(team.id, _ => ({ players: [...team.players] }));
        return;
      }
    }
  }

  movePlayer(event: CdkDragDrop<Player[], Player[]>): void {
    moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    const players = event.container.data;
    if (event.container.id === POOL_ID) {
      this.updatePool(_ => ({ players }));
    } else {
      this.updateTeam(event.container.id, _ => ({ players }));
    }
  }

  transferPlayer(event: CdkDragDrop<Player[], Player[]>): void {
    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex,
    );
    const fromArray = event.previousContainer.data;
    const toArray = event.container.data;
    if (event.previousContainer.id === POOL_ID) {
      this.updatePool(_ => ({ players: fromArray }));
    } else {
      this.updateTeam(event.previousContainer.id, _ => ({ players: fromArray }));
    }
    if (event.container.id === POOL_ID) {
      toArray[event.currentIndex] = { ...toArray[event.currentIndex], isPinned: false };
      this.updatePool(_ => ({ players: toArray }));
    } else {
      this.updateTeam(event.container.id, _ => ({ players: toArray }));
    }
  }

  demotePlayer(playerId: string): void {
    const pool = this._pool.value;
    let playerIndex = pool.players.findIndex(p => p.id === playerId);
    if (playerIndex in pool.players) {
      pool.players.splice(playerIndex, 1);
      this.updatePool(_ => ({ players: [...pool.players] }));
      return;
    }
    const teams = this._teams.value;
    for (const team of teams) {
      playerIndex = team.players.findIndex(p => p.id === playerId);
      if (playerIndex in team.players) {
        const [player] = team.players.splice(playerIndex, 1);
        this.updateTeam(team.id, _ => ({ players: [...team.players] }));
        if (player.playerName.length > 0) {
          this.updatePool(p => ({ players: [...p.players, player] }));
        }
        return;
      }
    }
  }

  copyTeamsToClipboard(callback: (isCopySuccess: boolean) => void): void {
    const teams = this._teams.value;
    this.labelsService.playerLabels$
      .pipe(take(1))
      .subscribe(labels => {
        const isCopySuccess = this.clipboard.copy(formatTeamsAsText(teams, labels));
        callback(isCopySuccess);
      });
  }

  resetTeams(): void {
    this.updateTeams(this.createTeams());
  }

  private updateTeams(teams: Team[]): void {
    this._teams.next(teams);
    localStorage.setItem(TEAMS_KEY, JSON.stringify(teams));
  }

  private createTeams(): Team[] {
    return Array.from({ length: INITIAL_NUM_TEAMS })
      .map(_ => this.createTeam());
  }

  private createTeam(): Team {
    return {
      id: this.generateNextId(TEAM_PREFIX),
      teamName: '',
      players: Array.from({ length: INITIAL_NUM_TEAM_PLAYERS })
        .map(_ => this.createPlayer()),
    }
  }

  private createPlayer(): Player {
    return {
      id: this.generateNextId(PLAYER_PREFIX),
      playerName: '',
      isPinned: false,
    }
  }
}

function inPlaceShuffle(array: any[]): void {
  for (let currentIndex = array.length - 1; currentIndex > 0; currentIndex -= 1) {
    const randomIndex = Math.floor(Math.random() * (currentIndex + 1));
    const tempElement = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = tempElement;
  }
}

function createInitialNextIds() {
  return {
    [TEAM_PREFIX]: 0,
    [PLAYER_PREFIX]: 0,
  };
}

function createPool(): Pool {
  return { id: POOL_ID, players: [] };
}

function formatTeamsAsText(teams: Team[], labels: string[]): string {
  const teamBlocks = teams.map((team, i) => formatTeamAsText(team, labels, i));
  return `Teams:\n\n${teamBlocks.join('\n\n')}`;
}

function formatTeamAsText(team: Team, labels: string[], teamIndex: number): string {
  const fallbackTeamName = `*${formatPlaceholderTeamName(teamIndex)}*`;
  const safeTeamName = getSafeString(team.teamName, fallbackTeamName);
  const formattedTeamName = `__${safeTeamName}__`;
  const formattedPlayerNames = team.players
    .map((player, i) => formatPlayerNameAndLabel(player.playerName, labels[i], i));
  return [formattedTeamName, ...formattedPlayerNames].join('\n');
}

function formatPlayerNameAndLabel(playerName: string, label: string, playerIndex: number): string {
  const fallbackPlayerName = `*${formatPlaceholderPlayerName(playerIndex)}*`;
  const safePlayerName = getSafeString(playerName, fallbackPlayerName);
  const safeLabel = getSafeString(label, undefined);
  return safeLabel === undefined
    ? safePlayerName
    : `${safePlayerName} (${safeLabel})`;
}

function getSafeString(value: string | undefined | null, fallbackValue: any): string | any {
  if (typeof value === 'string') {
    const trimmedValue = value.trim();
    if (trimmedValue.length > 0) {
      return trimmedValue;
    }
  }
  return fallbackValue;
}
