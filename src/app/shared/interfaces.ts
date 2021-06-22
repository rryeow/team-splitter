export type Pool = PlayerList;
export interface Team extends PlayerList {
  teamName: string;
}

export interface PlayerList {
  id: string;
  players: Player[];
}

export interface Player {
  id: string;
  playerName: string;
  isPinned: boolean;
}

export type Update<T> = Partial<Omit<T, 'id'>>;
export type Updater<T> = (_: T) => Update<T>;

export type AppLayout = 'single-column' | 'wide';
export type Theme = 'light' | 'dark';
