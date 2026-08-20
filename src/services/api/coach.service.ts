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
export interface CoachChatImage {
  uri: string;
  mimeType?: string | null;
  fileName?: string | null;
}
export type GeneratedAudiencePost={id:string;caption:string;format:string;thumbnail:string;status:'Approved'|'Needs Review'};

export type ArticleHelperAction = 'write' | 'outline' | 'intro' | 'titles' | 'improve' | 'chat';

export const coachService = {
  /** POST /api/coach/chat */
  async sendMessage(message: string, context: CoachChatContext = {}, image?: CoachChatImage) {
    let payload: FormData | { message: string; context: CoachChatContext } = { message, context };
    if (image) {
      const form = new FormData();
      form.append('message', message);
      form.append('context', JSON.stringify(context));
      form.append('image', {
        uri: image.uri,
        name: image.fileName || `coach-image-${Date.now()}.jpg`,
        type: image.mimeType || 'image/jpeg',
      } as unknown as Blob);
      payload = form;
    }
    const { data } = await apiClient.post<{
      success: boolean;
      reply: string;
      suggestions: CoachSuggestion[];
    }>('/coach/chat', payload, image ? { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60_000 } : undefined);
    return data;
  },
  async generateAudience(value:{topic:string;instructions:string;tone:string;formats:string[];count:number}){const {data}=await apiClient.post<{success:boolean;posts:GeneratedAudiencePost[]}>('/coach/audience/generate',value);return data.posts;},

  /** POST /api/coach/article-helper — always succeeds: real Gemini when configured, deterministic fallback otherwise. */
  async generateArticleContent(value: { action: ArticleHelperAction; topic: string; instructions?: string; existingContent?: string }) {
    const { data } = await apiClient.post<{ success: boolean; action: ArticleHelperAction; text?: string; titles?: string[] }>('/coach/article-helper', value);
    return data;
  },
};
