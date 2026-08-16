// Static catalog for TeamCal's own in-app games section — there is no backend
// for this yet (no games/tournaments tables or routes exist), so this is
// placeholder catalog content, same spirit as the recipe/meal-plan templates
// used elsewhere. Bookmarking/following a game is still real (personalService).

export interface GameEntry {
  id: string;
  name: string;
  thumbnail: string;
  newPosts: number;
  participantAvatars: string[];
  extraParticipants: number;
}

export interface Tournament {
  id: string;
  gameId: string;
  gameThumbnail: string;
  name: string;
  type: 'Squad Tournament' | 'Solo Tournament' | 'Team Tournament';
  playersLabel: string;
  live: boolean;
}

export const GAMES: GameEntry[] = [];

export const TOURNAMENTS: Tournament[] = [];
