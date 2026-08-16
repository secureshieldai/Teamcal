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
export type GeneratedAudiencePost={id:string;caption:string;format:string;thumbnail:string;status:'Approved'|'Needs Review'};

export type ArticleHelperAction = 'write' | 'outline' | 'intro' | 'titles' | 'improve' | 'chat';

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
  async generateAudience(value:{topic:string;instructions:string;tone:string;formats:string[];count:number}){const {data}=await apiClient.post<{success:boolean;posts:GeneratedAudiencePost[]}>('/coach/audience/generate',value);return data.posts;},

  /** POST /api/coach/article-helper — always succeeds: real Gemini when configured, deterministic fallback otherwise. */
  async generateArticleContent(value: { action: ArticleHelperAction; topic: string; instructions?: string; existingContent?: string }) {
    const { data } = await apiClient.post<{ success: boolean; action: ArticleHelperAction; text?: string; titles?: string[] }>('/coach/article-helper', value);
    return data;
  },
};
