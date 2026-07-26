import { apiClient } from './client';
import type { Post } from '../../types/api';

export type PostComment = { id: string; ts: number; meta: { postId: string; text: string }; user: { id: string; name: string; avatar: string | null } };

export const postsService = {
  /**
   * GET /api/posts/feed?limit=20&skip=0
   * Returns { posts } with user relation joined
   */
  async getFeed(limit = 20, skip = 0) {
    const { data } = await apiClient.get<{ success: boolean; posts: Post[] }>(
      '/posts/feed',
      { params: { limit, skip } }
    );
    return data.posts;
  },

  /**
   * GET /api/posts/mine
   * Returns current user's own posts
   */
  async getMyPosts() {
    const { data } = await apiClient.get<{ success: boolean; posts: Post[] }>('/posts/mine');
    return data.posts;
  },

  /**
   * POST /api/posts
   * Body: { text, image?, community? }
   */
  async create(payload: { text: string; image?: string; community?: string }) {
    const { data } = await apiClient.post<{ success: boolean; post: Post }>('/posts', payload);
    return data.post;
  },

  /**
   * POST /api/posts/:id/like
   * Backend is a toggle — returns { likes, liked }
   */
  async toggleLike(id: string) {
    const { data } = await apiClient.post<{ success: boolean; likes: number; liked: boolean }>(
      `/posts/${id}/like`
    );
    return data;
  },

  /** DELETE /api/posts/:id */
  async delete(id: string) {
    await apiClient.delete(`/posts/${id}`);
  },
  async getComments(postId: string) { const { data } = await apiClient.get<{ success: boolean; comments: PostComment[] }>(`/posts/${postId}/comments`); return data.comments; },
  async addComment(postId: string, text: string) { const { data } = await apiClient.post<{ success: boolean; comment: PostComment }>(`/posts/${postId}/comments`, { text }); return data.comment; },
  async deleteComment(postId: string, commentId: string) { await apiClient.delete(`/posts/${postId}/comments/${commentId}`); },
};
