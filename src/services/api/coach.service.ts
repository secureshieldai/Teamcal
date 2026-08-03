import { apiClient } from './client';

export interface CoachChatContext {
  fastHours?: number;
  hydrationMl?: number;
  steps?: number;
  sleepHours?: number;
}

export interface CoachSuggestion {
  label: string;
  slug: string;
}

export const coachService = {
  /** POST /api/coach/chat */
  async sendMessage(message: string, context: CoachChatContext = {}) {
    const { data } = await apiClient.post<{
      success: boolean;
      reply: string;
      suggestions: CoachSuggestion[];
    }>('/coach/chat', { message, context });
    return data;
  },
};
