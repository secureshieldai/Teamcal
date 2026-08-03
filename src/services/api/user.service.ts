import { apiClient } from './client';
import type { User } from '../../types/api';

export const userService = {
  /** GET /api/user/profile */
  async getProfile() {
    const { data } = await apiClient.get<{ success: boolean; user: User }>('/user/profile');
    return data.user;
  },
  async getProfileSummary() {
    const { data } = await apiClient.get<{ success: boolean; summary: { posts:number; following:number; followers:number; week:{calories:number;steps:number;workouts:number} } }>('/user/profile-summary');
    return data.summary;
  },

  /** PATCH /api/user/profile — allowed fields: name, bio, avatar, age, height_cm, weight_kg, gender */
  async updateProfile(patch: Partial<Pick<User, 'name' | 'bio' | 'avatar'>> & { dm_enabled?: boolean }) {
    const { data } = await apiClient.patch<{ success: boolean; user: User }>('/user/profile', patch);
    return data.user;
  },

  /** POST /api/user/avatar — multipart upload; also persists the new avatar on the user record server-side */
  async uploadAvatar(asset: { uri: string; mimeType?: string | null; fileName?: string | null }) {
    const form = new FormData();
    if (asset.uri.startsWith('data:')) {
      const blob = await (await fetch(asset.uri)).blob();
      form.append('avatar', blob, asset.fileName || 'avatar.jpg');
    } else {
      form.append('avatar', { uri: asset.uri, type: asset.mimeType || 'image/jpeg', name: asset.fileName || 'avatar.jpg' } as never);
    }
    const { data } = await apiClient.post<{ success: boolean; url: string }>('/user/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30_000,
    });
    return data.url;
  },

  /** GET /api/user/goals */
  async getGoals() {
    const { data } = await apiClient.get<{
      success: boolean;
      goals: {
        fastHours: number;
        waterMl: number;
        steps: number;
        sleepHours: number;
        kcal: number;
        proteinG: number;
        carbsG: number;
        fatsG: number;
        weightKg: number;
        focusAreas: string[];
      };
    }>('/user/goals');
    return data.goals;
  },

  /** PATCH /api/user/goals */
  async updateGoals(goals: {
    kcal?: number;
    proteinG?: number;
    carbsG?: number;
    fatsG?: number;
    steps?: number;
    waterMl?: number;
    sleepHours?: number;
    weightKg?: number;
    fastHours?: number;
    focusAreas?: string[];
  }) {
    const { data } = await apiClient.patch<{ success: boolean; goals: unknown }>(
      '/user/goals',
      goals
    );
    return data.goals;
  },

  /** POST /api/user/push-token */
  async registerPushToken(token: string, platform: 'ios' | 'android' | 'web') {
    await apiClient.post('/user/push-token', { token, platform });
  },
};
