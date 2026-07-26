import { apiClient } from './client';
import type { Group, GroupMember, Post } from '../../types/api';

export const groupsService = {
  async getMyGroups() {
    const { data } = await apiClient.get<{ success: boolean; groups: Group[] }>('/groups');
    return data.groups;
  },

  async get(id: string) {
    const { data } = await apiClient.get<{
      success: boolean;
      group: Group;
      members: GroupMember[];
      myRole: string | null;
    }>(`/groups/${id}`);
    return data;
  },

  async join(id: string) {
    const { data } = await apiClient.post<{ success: boolean }>(`/groups/${id}/join`);
    return data;
  },

  async leave(id: string) {
    const { data } = await apiClient.delete<{ success: boolean }>(`/groups/${id}/join`);
    return data;
  },

  async getActivity(id: string, limit = 20) {
    const { data } = await apiClient.get<{ success: boolean; posts: Post[] }>(
      `/groups/${id}/activity`,
      { params: { limit } }
    );
    return data.posts;
  },
};
