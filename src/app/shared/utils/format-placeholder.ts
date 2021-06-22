const PLACEHOLDER_TEAM_NAME = 'Unnamed Team';
export const PLACEHOLDER_PLAYER_NAME = 'Unnamed Player';

export function formatPlaceholderTeamName(teamIndex: number): string {
  return `${PLACEHOLDER_TEAM_NAME} ${teamIndex + 1}`;
}

export function formatPlaceholderPlayerName(playerIndex: number): string {
  return `${PLACEHOLDER_PLAYER_NAME} ${playerIndex + 1}`;
}
