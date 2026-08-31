import { apiClient } from './client';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LiveStream {
  id: string;
  host_id: string;
  title: string;
  description?: string;
  cover_image?: string;
  visibility: 'public' | 'followers' | 'community';
  community_id?: string;
  allow_comments: boolean;
  allow_reactions: boolean;
  status: 'live' | 'ended' | 'removed';
  viewer_count: number;
  peak_viewers: number;
  total_viewers: number;
  comment_count: number;
  reaction_count: number;
  new_followers: number;
  replay_saved: boolean;
  started_at: string;
  ended_at?: string;
  duration_seconds?: number;
  host?: { id: string; name: string; avatar: string | null; verified: boolean };
}

export interface LiveComment {
  id: string;
  stream_id: string;
  user_id: string;
  text: string;
  pinned: boolean;
  deleted_at?: string;
  created_at: string;
  user?: { id: string; name: string; avatar: string | null; verified: boolean };
}

export interface CreateStreamPayload {
  title: string;
  description?: string;
  coverImage?: string;
  visibility: 'public' | 'followers' | 'community';
  communityId?: string;
  allowComments: boolean;
  allowReactions: boolean;
}

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'https://teamcal-mr7g.onrender.com/api')
  .replace('/api', '');

let socket: Socket | null = null;

async function getSocket(): Promise<Socket> {
  if (socket?.connected) return socket;
  const token = await AsyncStorage.getItem('auth_token');
  socket = io(BASE_URL, {
    path: '/realtime',
    auth: { token },
    transports: ['websocket'],
  });
  return socket;
}

function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export const liveService = {
  // ── REST ──────────────────────────────────────────────────────────────────
  async listStreams(): Promise<LiveStream[]> {
    try {
      const { data } = await apiClient.get<{ success: boolean; streams: LiveStream[] }>('/live');
      return data.streams;
    } catch { return []; }
  },

  async getStream(id: string): Promise<LiveStream> {
    const { data } = await apiClient.get<{ success: boolean; stream: LiveStream }>(`/live/${id}`);
    return data.stream;
  },

  async createStream(payload: CreateStreamPayload): Promise<LiveStream> {
    const { data } = await apiClient.post<{ success: boolean; stream: LiveStream }>('/live', payload);
    return data.stream;
  },

  async endStream(id: string): Promise<LiveStream> {
    const { data } = await apiClient.patch<{ success: boolean; stream: LiveStream }>(`/live/${id}/end`);
    return data.stream;
  },

  async saveReplay(id: string, save: boolean): Promise<void> {
    await apiClient.patch(`/live/${id}/save-replay`, { save });
  },

  async joinStream(id: string): Promise<number> {
    try {
      const { data } = await apiClient.post<{ success: boolean; viewerCount: number }>(`/live/${id}/join`);
      return data.viewerCount;
    } catch { return 0; }
  },

  async leaveStream(id: string): Promise<void> {
    try { await apiClient.post(`/live/${id}/leave`); } catch { /* best-effort */ }
  },

  async getComments(id: string): Promise<LiveComment[]> {
    try {
      const { data } = await apiClient.get<{ success: boolean; comments: LiveComment[] }>(`/live/${id}/comments`);
      return data.comments;
    } catch { return []; }
  },

  async addComment(id: string, text: string): Promise<LiveComment> {
    const { data } = await apiClient.post<{ success: boolean; comment: LiveComment }>(`/live/${id}/comments`, { text });
    return data.comment;
  },

  async deleteComment(streamId: string, commentId: string): Promise<void> {
    await apiClient.delete(`/live/${streamId}/comments/${commentId}`);
  },

  async pinComment(streamId: string, commentId: string): Promise<void> {
    await apiClient.patch(`/live/${streamId}/comments/${commentId}/pin`);
  },

  async sendReaction(id: string): Promise<void> {
    try { await apiClient.post(`/live/${id}/reactions`); } catch { /* best-effort */ }
  },

  async muteViewer(streamId: string, userId: string): Promise<void> {
    await apiClient.post(`/live/${streamId}/mute/${userId}`);
  },

  async kickViewer(streamId: string, userId: string): Promise<void> {
    await apiClient.delete(`/live/${streamId}/mute/${userId}`);
  },

  async reportStream(id: string, reason: string): Promise<void> {
    await apiClient.post(`/live/${id}/report`, { reason });
  },

  // ── Socket.IO ─────────────────────────────────────────────────────────────
  getSocket,
  disconnectSocket,

  async joinDiscoverRoom() {
    const s = await getSocket();
    s.emit('live:join_discover');
  },

  async joinStreamRoom(streamId: string) {
    const s = await getSocket();
    s.emit('live:join_stream', { streamId });
  },

  async leaveStreamRoom(streamId: string) {
    const s = await getSocket();
    s.emit('live:leave_stream', { streamId });
  },
};
