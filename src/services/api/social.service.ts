import { apiClient } from './client';

export interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string | null;
  verified: boolean;
  level: number;
  xp: number;
}
export type FriendProgress = { id: string; name: string; avatar: string | null; calories: number; steps: number; percent: number };
export type CreatorUser = LeaderboardUser & { bio?: string; following: boolean };

export const socialService = {
  /**
   * GET /api/social/leaderboard?limit=20
   * Backend returns { users } ordered by XP descending.
   * We add rank on the client side.
   */
  async getLeaderboard(limit = 20, scope: 'global' | 'friends' | 'teams' = 'global') {
    const { data } = await apiClient.get<{ success: boolean; users: LeaderboardUser[] }>(
      '/social/leaderboard',
      { params: { limit, scope } }
    );
    return data.users;
  },

  /**
   * GET /api/social/feed — public post feed (used by community screen)
   * Note: the dedicated post feed is at /api/posts/feed (see postsService).
   * This endpoint returns the same data via social route.
   */
  async getFeed(limit = 20, skip = 0) {
    const { data } = await apiClient.get<{ success: boolean; posts: unknown[] }>(
      '/social/feed',
      { params: { limit, skip } }
    );
    return data.posts;
  },

  /** GET /api/social/users?q=name — search users */
  async searchUsers(q: string) {
    const { data } = await apiClient.get<{ success: boolean; users: LeaderboardUser[] }>(
      '/social/users',
      { params: { q } }
    );
    return data.users;
  },

  /** GET /api/social/users/:id — public user profile */
  async getUserProfile(userId: string) {
    const { data } = await apiClient.get<{ success: boolean; user: LeaderboardUser & { postCount: number } }>(
      `/social/users/${userId}`
    );
    return data.user;
  },
  async getFriends() { const { data } = await apiClient.get<{ success: boolean; friends: LeaderboardUser[] }>('/social/friends'); return data.friends; },
  async toggleFriend(userId: string) { const { data } = await apiClient.post<{ success: boolean; friend: boolean }>(`/social/users/${userId}/friend`); return data.friend; },
  async getFriendsProgress() { const { data } = await apiClient.get<{ success: boolean; friends: FriendProgress[] }>('/social/friends/progress'); return data.friends; },
  async getCreators() { const { data } = await apiClient.get<{ success: boolean; creators: CreatorUser[] }>('/social/creators'); return data.creators; },
  async toggleFollow(userId: string) { const { data } = await apiClient.post<{ success: boolean; following: boolean }>(`/social/users/${userId}/follow`); return data.following; },
};
