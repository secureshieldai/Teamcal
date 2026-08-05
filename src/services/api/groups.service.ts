import { apiClient } from './client';
import type { Group, GroupMember, Post } from '../../types/api';

export const groupsService = {
  async create(value:{name:string;description?:string;isPrivate?:boolean}){const {data}=await apiClient.post<{success:boolean;group:Group}>('/groups',value);return data.group;},
  async update(id:string,value:Partial<{name:string;description:string;cover:string;is_private:boolean}>){const {data}=await apiClient.patch<{success:boolean;group:Group}>(`/groups/${id}`,value);return data.group;},
  async getMyGroups() {
    const { data } = await apiClient.get<{ success: boolean; groups: Group[] }>('/groups');
    return data.groups;
  },

  /** GET /api/groups/discover — public groups not yet joined, most members first */
  async discover() {
    const { data } = await apiClient.get<{ success: boolean; groups: Group[] }>('/groups/discover');
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
  async setMemberRole(id:string,userId:string,role:'member'|'admin'){const {data}=await apiClient.patch(`/groups/${id}/members/${userId}`,{role});return data;},
  async removeMember(id:string,userId:string){await apiClient.delete(`/groups/${id}/members/${userId}`);},
};
