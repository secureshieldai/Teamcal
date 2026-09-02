import { apiClient } from './client';
import type { Post } from '../../types/api';

export type PostComment = { id: string; ts: number; meta: { postId: string; text: string }; user: { id: string; name: string; avatar: string | null } };

export const postsService = {
  async uploadImage(input: string | { uri: string; mimeType?: string | null; fileName?: string | null }) {
    const asset = typeof input === 'string' ? { uri: input } : input;
    const form = new FormData();
    
    // Debug logging
    if (__DEV__) {
      console.log('PostsService uploadImage - URI:', asset.uri?.substring(0, 60));
      console.log('PostsService uploadImage - mimeType:', asset.mimeType);
      console.log('PostsService uploadImage - fileName:', asset.fileName);
    }
    
    if (asset.uri.startsWith('data:')) {
      const blob = await (await fetch(asset.uri)).blob();
      form.append('image', blob, asset.fileName || 'social-image.jpg');
    } else {
      form.append('image', {
        uri: asset.uri,
        type: asset.mimeType || 'image/jpeg',
        name: asset.fileName || 'social-image.jpg',
      } as never);
    }
    
    const { data } = await apiClient.post<{ success: boolean; url: string }>('/posts/image', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30_000,
    });
    
    // Debug logging
    if (__DEV__) {
      console.log('PostsService uploadImage - returned URL:', data.url);
    }
    
    return data.url;
  },

  async uploadVideo(input: { uri: string; mimeType?: string | null; fileName?: string | null }) {
    const form = new FormData();
    
    // Debug logging
    if (__DEV__) {
      console.log('PostsService uploadVideo - URI:', input.uri?.substring(0, 60));
      console.log('PostsService uploadVideo - mimeType:', input.mimeType);
      console.log('PostsService uploadVideo - fileName:', input.fileName);
    }
    
    form.append('video', {
      uri: input.uri,
      type: input.mimeType || 'video/mp4',
      name: input.fileName || 'social-video.mp4',
    } as never);
    
    const { data } = await apiClient.post<{ success: boolean; url: string }>('/posts/video', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120_000, // 2 minutes for video upload
    });
    
    // Debug logging
    if (__DEV__) {
      console.log('PostsService uploadVideo - returned URL:', data.url);
    }
    
    return data.url;
  },
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

  /** GET /api/posts/user/:id — any user's public post grid, for their profile page */
  async getUserPosts(userId: string) {
    const { data } = await apiClient.get<{ success: boolean; posts: Post[] }>(`/posts/user/${userId}`);
    return data.posts;
  },

  /**
   * POST /api/posts
   * Body: { text, image?, images?, video?, community? } — images (up to 10) takes precedence; image is the legacy single-photo fallback.
   */
  async create(payload: { text: string; image?: string; images?: string[]; video?: string; community?: string }) {
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
