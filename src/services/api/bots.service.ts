import { apiClient } from './client';
import type {
  Bot, BotAnalytics, BotAutomation, BotConnection, BotConversation, BotEvent,
  BotKnowledgeBase, BotLead, BotMessage, BotPermissions, BotSequenceStep, BotSpacesResponse,
} from '../../types/bots';

export interface CreateBotInput {
  type: Bot['type'];
  name: string;
  avatar?: string | null;
  description?: string;
  purpose?: string;
  welcome_message?: string;
  tone?: string;
  language?: string;
  knowledge_base?: BotKnowledgeBase;
  permissions?: BotPermissions;
  connections?: BotConnection[];
  automations?: BotAutomation[];
  sequence?: BotSequenceStep[];
  settings?: Record<string, unknown>;
}

export const botsService = {
  async create(input: CreateBotInput): Promise<Bot> {
    const res = await apiClient.post<{ data: Bot }>('/bots', input);
    return res.data.data;
  },

  async list(): Promise<Bot[]> {
    const res = await apiClient.get<{ data: Bot[] }>('/bots');
    return res.data.data;
  },

  async get(id: string): Promise<Bot> {
    const res = await apiClient.get<{ data: Bot }>(`/bots/${id}`);
    return res.data.data;
  },

  async update(id: string, patch: Partial<CreateBotInput>): Promise<Bot> {
    const res = await apiClient.put<{ data: Bot }>(`/bots/${id}`, patch);
    return res.data.data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/bots/${id}`);
  },

  async activate(id: string): Promise<Bot> {
    const res = await apiClient.post<{ data: Bot }>(`/bots/${id}/activate`);
    return res.data.data;
  },

  async pause(id: string): Promise<Bot> {
    const res = await apiClient.post<{ data: Bot }>(`/bots/${id}/pause`);
    return res.data.data;
  },

  async analytics(id: string, days = 30): Promise<BotAnalytics> {
    const res = await apiClient.get<{ data: BotAnalytics }>(`/bots/${id}/analytics`, { params: { days } });
    return res.data.data;
  },

  async activity(id: string, limit = 30): Promise<BotEvent[]> {
    const res = await apiClient.get<{ data: BotEvent[] }>(`/bots/${id}/activity`, { params: { limit } });
    return res.data.data;
  },

  async spaces(): Promise<BotSpacesResponse> {
    const res = await apiClient.get<{ data: BotSpacesResponse }>('/bots/spaces');
    return res.data.data;
  },

  async setConnections(id: string, connections: BotConnection[]): Promise<BotConnection[]> {
    const res = await apiClient.put<{ data: BotConnection[] }>(`/bots/${id}/connections`, { connections });
    return res.data.data;
  },

  async getAutomations(id: string): Promise<BotAutomation[]> {
    const res = await apiClient.get<{ data: BotAutomation[] }>(`/bots/${id}/automations`);
    return res.data.data;
  },

  async setAutomations(id: string, automations: BotAutomation[]): Promise<BotAutomation[]> {
    const res = await apiClient.put<{ data: BotAutomation[] }>(`/bots/${id}/automations`, { automations });
    return res.data.data;
  },

  async getSequence(id: string): Promise<BotSequenceStep[]> {
    const res = await apiClient.get<{ data: BotSequenceStep[] }>(`/bots/${id}/sequence`);
    return res.data.data;
  },

  async setSequence(id: string, steps: BotSequenceStep[]): Promise<BotSequenceStep[]> {
    const res = await apiClient.put<{ data: BotSequenceStep[] }>(`/bots/${id}/sequence`, { steps });
    return res.data.data;
  },

  async getKnowledge(id: string): Promise<BotKnowledgeBase> {
    const res = await apiClient.get<{ data: BotKnowledgeBase }>(`/bots/${id}/knowledge`);
    return res.data.data;
  },

  async setKnowledge(id: string, knowledge_base: BotKnowledgeBase): Promise<BotKnowledgeBase> {
    const res = await apiClient.put<{ data: BotKnowledgeBase }>(`/bots/${id}/knowledge`, { knowledge_base });
    return res.data.data;
  },

  async conversations(id: string, status?: string): Promise<BotConversation[]> {
    const res = await apiClient.get<{ data: BotConversation[] }>(`/bots/${id}/conversations`, {
      params: status ? { status } : undefined,
    });
    return res.data.data;
  },

  async conversation(cid: string): Promise<{
    conversation: BotConversation;
    messages: BotMessage[];
    lead: BotLead | null;
    notes: { id: string; note: string; created_at: string }[];
  }> {
    const res = await apiClient.get(`/bots/conversations/${cid}`);
    return res.data.data;
  },

  async takeover(cid: string): Promise<void> {
    await apiClient.post(`/bots/conversations/${cid}/takeover`);
  },

  async returnToBot(cid: string): Promise<void> {
    await apiClient.post(`/bots/conversations/${cid}/return`);
  },

  async adminSend(cid: string, content: string): Promise<BotMessage> {
    const res = await apiClient.post<{ data: BotMessage }>(`/bots/conversations/${cid}/messages`, { content });
    return res.data.data;
  },

  async addNote(cid: string, note: string): Promise<void> {
    await apiClient.post(`/bots/conversations/${cid}/notes`, { note });
  },

  async setConversationStatus(cid: string, status: 'open' | 'resolved' | 'follow_up'): Promise<void> {
    await apiClient.put(`/bots/conversations/${cid}/status`, { status });
  },

  async leads(id: string): Promise<BotLead[]> {
    const res = await apiClient.get<{ data: BotLead[] }>(`/bots/${id}/leads`);
    return res.data.data;
  },

  async test(id: string, message: string, history: BotMessage[] = []): Promise<{ reply: string; handoffSuggested: boolean }> {
    const res = await apiClient.post<{ data: { reply: string; handoffSuggested: boolean } }>(`/bots/${id}/test`, {
      message,
      history,
    });
    return res.data.data;
  },

  async runAutomation(id: string, automationId: string, message?: string): Promise<{ ran: string; sent?: number }> {
    const res = await apiClient.post<{ data: { ran: string; sent?: number } }>(
      `/bots/${id}/automations/${automationId}/run`,
      { message }
    );
    return res.data.data;
  },

  async schedule(id: string, payload: { kind: 'announcement' | 'reminder'; message: string; scheduled_for: string; targets?: string[] }) {
    const res = await apiClient.post(`/bots/${id}/schedule`, payload);
    return res.data.data;
  },

  async processDue(): Promise<{ processed: number; found: number }> {
    const res = await apiClient.post<{ data: { processed: number; found: number } }>('/bots/process-due');
    return res.data.data;
  },

  // ── Public (unauthenticated) ──────────────────────────────
  async publicGet(slug: string) {
    const res = await apiClient.get<{ data: { name: string; avatar?: string; description?: string; disclosure: string } }>(
      `/bots/public/${slug}`
    );
    return res.data.data;
  },

  async publicStart(slug: string) {
    const res = await apiClient.post<{
      data: { conversationId: string; leadKey: string; consentText: string; messages: BotMessage[] };
    }>(`/bots/public/${slug}/session`);
    return res.data.data;
  },

  async publicSend(slug: string, conversationId: string, message: string) {
    const res = await apiClient.post<{ data: { reply: string | null; handoffSuggested?: boolean; handoff?: boolean } }>(
      `/bots/public/${slug}/message`,
      { conversationId, message }
    );
    return res.data.data;
  },

  async publicLead(
    slug: string,
    conversationId: string,
    lead: { name?: string; email?: string; phone?: string; consent: boolean }
  ) {
    const res = await apiClient.post(`/bots/public/${slug}/lead`, { conversationId, ...lead });
    return res.data.data;
  },

  async publicHandoff(slug: string, conversationId: string) {
    await apiClient.post(`/bots/public/${slug}/handoff`, { conversationId });
  },

  async publicStop(slug: string, conversationId: string, opts: { deleteData?: boolean; report?: boolean; reason?: string } = {}) {
    await apiClient.post(`/bots/public/${slug}/stop`, { conversationId, ...opts });
  },

  async publicPoll(slug: string, conversationId: string, after?: string) {
    const res = await apiClient.get<{ data: { messages: BotMessage[]; handoff_active: boolean; stopped: boolean } }>(
      `/bots/public/${slug}/poll`,
      { params: { conversationId, after } }
    );
    return res.data.data;
  },
};
