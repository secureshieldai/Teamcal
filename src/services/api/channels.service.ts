import { apiClient } from './client';
import type { Channel, ChannelMember, ChannelPost, PostComment, PostReaction, ChannelAnalytics } from '../../types/channels';

export const channelsService = {
  // Channels
  async create(data: Partial<Channel>): Promise<Channel> {
    const res = await apiClient.post<{ data: Channel }>('/channels', data);
    return res.data.data;
  },

  async getById(id: string): Promise<Channel> {
    const res = await apiClient.get<{ data: Channel }>(`/channels/${id}`);
    return res.data.data;
  },

  async update(id: string, data: Partial<Channel>): Promise<Channel> {
    const res = await apiClient.put<{ data: Channel }>(`/channels/${id}`, data);
    return res.data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/channels/${id}`);
  },

  // Alias for delete for clarity
  async deleteChannel(id: string): Promise<void> {
    return this.delete(id);
  },

  async follow(id: string): Promise<void> {
    await apiClient.post(`/channels/${id}/follow`);
  },

  async unfollow(id: string): Promise<void> {
    await apiClient.delete(`/channels/${id}/follow`);
  },

  async getMyChannels(): Promise<Channel[]> {
    const res = await apiClient.get<{ data: Channel[] }>('/channels/my/channels');
    return res.data.data;
  },

  async getFollowing(): Promise<Channel[]> {
    const res = await apiClient.get<{ data: Channel[] }>('/channels/my/following');
    return res.data.data;
  },

  async discover(type: 'recommended' | 'trending' | 'new' | 'popular' = 'recommended', limit = 20): Promise<Channel[]> {
    const res = await apiClient.get<{ data: Channel[] }>('/channels/discover', { params: { type, limit } });
    return res.data.data;
  },

  async search(query: string, category?: string, limit = 20): Promise<Channel[]> {
    const res = await apiClient.get<{ data: Channel[] }>('/channels/search', { params: { q: query, category, limit } });
    return res.data.data;
  },

  async getByCategory(category: string, limit = 20): Promise<Channel[]> {
    const res = await apiClient.get<{ data: Channel[] }>(`/channels/category/${category}`, { params: { limit } });
    return res.data.data;
  },

  // Posts
  async getPosts(channelId: string, limit = 20, offset = 0): Promise<ChannelPost[]> {
    const res = await apiClient.get<{ data: ChannelPost[] }>(`/channels/${channelId}/posts`, { params: { limit, offset } });
    return res.data.data;
  },

  async createPost(channelId: string, post: Partial<ChannelPost>): Promise<ChannelPost> {
    const res = await apiClient.post<{ data: ChannelPost }>(`/channels/${channelId}/posts`, post);
    return res.data.data;
  },

  async getPost(postId: string): Promise<ChannelPost> {
    const res = await apiClient.get<{ data: ChannelPost }>(`/channels/posts/${postId}`);
    return res.data.data;
  },

  async updatePost(postId: string, updates: Partial<ChannelPost>): Promise<ChannelPost> {
    const res = await apiClient.put<{ data: ChannelPost }>(`/channels/posts/${postId}`, updates);
    return res.data.data;
  },

  async deletePost(postId: string): Promise<void> {
    await apiClient.delete(`/channels/posts/${postId}`);
  },

  async pinPost(postId: string): Promise<void> {
    await apiClient.post(`/channels/posts/${postId}/pin`);
  },

  async unpinPost(postId: string): Promise<void> {
    await apiClient.delete(`/channels/posts/${postId}/pin`);
  },

  // Reactions
  async addReaction(postId: string, emoji: string): Promise<void> {
    await apiClient.post(`/channels/posts/${postId}/reactions`, { emoji });
  },

  async removeReaction(postId: string): Promise<void> {
    await apiClient.delete(`/channels/posts/${postId}/reactions`);
  },

  // Comments
  async getComments(postId: string, limit = 50, offset = 0): Promise<PostComment[]> {
    const res = await apiClient.get<{ data: PostComment[] }>(`/channels/posts/${postId}/comments`, { params: { limit, offset } });
    return res.data.data;
  },

  async addComment(postId: string, content: string, parentId?: string): Promise<PostComment> {
    const res = await apiClient.post<{ data: PostComment }>(`/channels/posts/${postId}/comments`, { content, parent_id: parentId });
    return res.data.data;
  },

  async updateComment(commentId: string, content: string): Promise<PostComment> {
    const res = await apiClient.put<{ data: PostComment }>(`/channels/posts/comments/${commentId}`, { content });
    return res.data.data;
  },

  async deleteComment(commentId: string): Promise<void> {
    await apiClient.delete(`/channels/posts/comments/${commentId}`);
  },

  // Members & Admin
  async getFollowers(channelId: string, limit = 50, offset = 0): Promise<ChannelMember[]> {
    const res = await apiClient.get<{ data: ChannelMember[] }>(`/channels/${channelId}/followers`, { params: { limit, offset } });
    return res.data.data;
  },

  async getAdmins(channelId: string): Promise<ChannelMember[]> {
    const res = await apiClient.get<{ data: ChannelMember[] }>(`/channels/${channelId}/admins`);
    return res.data.data;
  },

  async addAdmin(channelId: string, userId: string, role: 'admin' | 'moderator', permissions: Partial<ChannelMember>): Promise<void> {
    await apiClient.post(`/channels/${channelId}/admins`, { user_id: userId, role, permissions });
  },

  async removeAdmin(channelId: string, userId: string): Promise<void> {
    await apiClient.delete(`/channels/${channelId}/admins/${userId}`);
  },

  async updatePermissions(channelId: string, userId: string, permissions: Partial<ChannelMember>): Promise<void> {
    await apiClient.put(`/channels/${channelId}/admins/${userId}/permissions`, permissions);
  },

  async banUser(channelId: string, userId: string): Promise<void> {
    await apiClient.post(`/channels/${channelId}/ban/${userId}`);
  },

  async unbanUser(channelId: string, userId: string): Promise<void> {
    await apiClient.delete(`/channels/${channelId}/ban/${userId}`);
  },

  async updateSettings(channelId: string, settings: Partial<Channel>): Promise<Channel> {
    const res = await apiClient.put<{ data: Channel }>(`/channels/${channelId}/settings`, settings);
    return res.data.data;
  },

  async transferOwnership(channelId: string, newOwnerId: string): Promise<void> {
    await apiClient.post(`/channels/${channelId}/transfer`, { new_owner_id: newOwnerId });
  },

  // Analytics
  async getAnalytics(channelId: string): Promise<ChannelAnalytics> {
    const res = await apiClient.get<{ data: ChannelAnalytics }>(`/channels/${channelId}/analytics`);
    return res.data.data;
  },

  async getTopPosts(channelId: string, limit = 10): Promise<ChannelPost[]> {
    const res = await apiClient.get<{ data: ChannelPost[] }>(`/channels/${channelId}/analytics/posts`, { params: { limit } });
    return res.data.data;
  },

  // Reports
  async reportChannel(channelId: string, reason: string, details?: string): Promise<void> {
    await apiClient.post(`/channels/${channelId}/report`, { reason, details });
  },

  async reportPost(postId: string, reason: string, details?: string): Promise<void> {
    await apiClient.post(`/channels/posts/${postId}/report`, { reason, details });
  },

  // Monetization
  async applyForMonetization(channelId: string): Promise<{ message: string; status: string }> {
    const res = await apiClient.post<{ message: string; status: string }>(`/channels/${channelId}/monetization/apply`);
    return res.data;
  },

  async getMonetizationStatus(channelId: string): Promise<{
    status: 'not_applied' | 'pending' | 'approved' | 'rejected';
    is_monetized: boolean;
    applied_at?: string;
    approved_at?: string;
    requirements: {
      followers: number;
      minFollowers: number;
      views: number;
      minViews: number;
      age: number;
      minAge: number;
    };
    eligible: boolean;
  }> {
    const res = await apiClient.get(`/channels/${channelId}/monetization/status`);
    return res.data.data;
  },

  async getEarnings(channelId: string): Promise<{
    total: number;
    pending: number;
    available: number;
    withdrawn: number;
    impressions: number;
    revenue: number;
    creatorShare: number;
    withdrawals: any[];
  }> {
    const res = await apiClient.get(`/channels/${channelId}/earnings`);
    return res.data.data;
  },

  async requestWithdrawal(channelId: string, amount: number, paymentMethod?: string): Promise<{ message: string }> {
    const res = await apiClient.post<{ message: string }>(`/channels/${channelId}/earnings/withdraw`, {
      amount,
      payment_method: paymentMethod,
    });
    return res.data;
  },
};
