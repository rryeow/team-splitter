import { Player } from '../shared/interfaces';

export interface PlayerListInfo {
  connectedToIds: string[];
  players: Player[];
  showEmptyListPlaceholder: boolean;
}
