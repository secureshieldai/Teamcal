import { apiClient } from './client';
import type { Challenge, ChallengeMember, ChallengeMembership } from '../../types/api';

type Tab = 'discover' | 'my' | 'completed';

export const challengesService = {
  async list(tab: Tab = 'discover', limit = 20, skip = 0) {
    const { data } = await apiClient.get<{ success: boolean; challenges: Challenge[]; total: number }>(
      '/challenges',
      { params: { tab, limit, skip } }
    );
    return data;
  },

  async getFeatured() {
    const { data } = await apiClient.get<{ success: boolean; challenge: Challenge | null }>(
      '/challenges/featured'
    );
    return data.challenge;
  },

  async get(id: string) {
    const { data } = await apiClient.get<{
      success: boolean;
      challenge: Challenge;
      membership: ChallengeMembership | null;
    }>(`/challenges/${id}`);
    return data;
  },

  async join(id: string) {
    const { data } = await apiClient.post<{ success: boolean }>(`/challenges/${id}/join`);
    return data;
  },

  async leave(id: string) {
    const { data } = await apiClient.delete<{ success: boolean }>(`/challenges/${id}/join`);
    return data;
  },

  async updateProgress(id: string, currentDay: number) {
    const { data } = await apiClient.patch<{ success: boolean; membership: ChallengeMembership }>(
      `/challenges/${id}/progress`,
      { currentDay }
    );
    return data.membership;
  },
  async create(payload: {
    title: string;
    description?: string;
    durationDays: number;
    totalDays?: number;
    photo?: string;
    isPublic?: boolean;
    icon?: string;
    iconColor?: string;
    challengeType?: string;
    goalTarget?: number;
    goalUnit?: string;
    maxParticipants?: number;
    startsAt?: number;
    endsAt?: number;
    rules?: string;
  }) {
    const { data } = await apiClient.post<{ success: boolean; challenge: Challenge }>('/challenges', payload);
    return data.challenge;
  },

  async getMembers(id: string) {
    const { data } = await apiClient.get<{ success: boolean; members: ChallengeMember[] }>(`/challenges/${id}/members`);
    return data.members;
  },
};
