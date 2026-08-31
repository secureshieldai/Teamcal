import { apiClient } from './client';

export type ShowcaseItemType = 'video' | 'video-series' | 'blog' | 'blog-post' | 'pdf' | 'store' | 'product' | 'membership' | 'link';

export interface ShowcaseItem {
  id: string;
  sectionId: string;
  contentId?: string;
  contentType: ShowcaseItemType;
  title: string;
  description?: string;
  coverImage?: string;
  thumbnail?: string;
  price?: number;
  accessLabel?: string;
  actionLabel: string;
  actionUrl: string;
  published: boolean;
  item_order: number;
  createdAt: string;
}

export interface ShowcaseSection {
  id: string;
  userId: string;
  title: string;
  description?: string;
  layout: 'grid' | 'carousel' | 'list';
  published: boolean;
  item_order: number;
  items: ShowcaseItem[];
  createdAt: string;
}

export const showcaseService = {
  /** GET /api/showcase/:userId */
  async getUserShowcase(userId?: string) {
    const url = userId ? `/showcase/${userId}` : '/showcase';
    const { data } = await apiClient.get<{ success: boolean; sections: ShowcaseSection[] }>(url);
    return data.sections;
  },

  /** GET /api/showcase (current user) */
  async getCurrentUserShowcase() {
    const { data } = await apiClient.get<{ success: boolean; sections: ShowcaseSection[] }>('/showcase');
    return data.sections;
  },

  /** POST /api/showcase/sections */
  async createSection(section: Omit<ShowcaseSection, 'id' | 'userId' | 'createdAt' | 'item_order'>) {
    const { data } = await apiClient.post<{ success: boolean; section: ShowcaseSection }>('/showcase/sections', section);
    return data.section;
  },

  /** PUT /api/showcase/sections/:id */
  async updateSection(sectionId: string, updates: Partial<Omit<ShowcaseSection, 'id' | 'userId' | 'item_order'>>) {
    const { data } = await apiClient.put<{ success: boolean; section: ShowcaseSection }>(
      `/showcase/sections/${sectionId}`,
      updates
    );
    return data.section;
  },

  /** DELETE /api/showcase/sections/:id */
  async deleteSection(sectionId: string) {
    const { data } = await apiClient.delete<{ success: boolean }>(`/showcase/sections/${sectionId}`);
    return data.success;
  },

  /** POST /api/showcase/items */
  async addItem(sectionId: string, item: Omit<ShowcaseItem, 'id' | 'sectionId' | 'createdAt' | 'item_order'>) {
    const { data } = await apiClient.post<{ success: boolean; item: ShowcaseItem }>('/showcase/items', {
      ...item,
      sectionId,
    });
    return data.item;
  },

  /** PUT /api/showcase/items/:id */
  async updateItem(itemId: string, updates: Partial<Omit<ShowcaseItem, 'id' | 'sectionId'>>) {
    const { data } = await apiClient.put<{ success: boolean; item: ShowcaseItem }>(`/showcase/items/${itemId}`, updates);
    return data.item;
  },

  /** DELETE /api/showcase/items/:id */
  async deleteItem(itemId: string) {
    const { data } = await apiClient.delete<{ success: boolean }>(`/showcase/items/${itemId}`);
    return data.success;
  },

  /** PUT /api/showcase/reorder */
  async reorderItems(items: Array<{ id: string; item_order: number }>) {
    const { data } = await apiClient.put<{ success: boolean }>('/showcase/reorder', { items });
    return data.success;
  },
};
