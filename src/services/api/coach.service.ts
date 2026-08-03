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
};
