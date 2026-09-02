import { apiClient } from './client';

export interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string | null;
  verified: boolean;
  level: number;
  xp: number;
}
export type FriendProgress = { id: string; name: string; avatar: string | null; calories: number; steps: number; percent: number };
export type CreatorUser = LeaderboardUser & { bio?: string; following: boolean };
export type DmMessageType='text'|'image'|'voice'|'call';
export type DmConversationStatus='pending'|'accepted'|'blocked';
export type SocialConversation={id:string;user:{id:string;name:string;avatar:string|null};summary:string;lastMessageType:DmMessageType;unreadCount:number;status:DmConversationStatus;updatedAt:string};
export type MessageRequest={id:string;user:{id:string;name:string;avatar:string|null};summary:string;messageCount:number;messageLimit:number;createdAt:string};
export type DirectMessage={id:string;conversationId:string;senderId:string;mine:boolean;type:DmMessageType;text:string;mediaUrl:string|null;durationMs:number|null;transcript:string|null;call:{mode:'audio'|'video';outcome:string;durationS:number}|null;read:boolean;createdAt:string;ts:number};
export type ConversationMeta={id:string;status:DmConversationStatus;isInitiator:boolean;messageCount:number;messageLimit:number;messagesRemaining:number|null;canSend:boolean};
export type MediaAsset={uri:string;mimeType?:string|null;fileName?:string|null};
export type SocialBlog={id:string;blog_id:string;title:string;cover?:string;body:string;category?:string;read_minutes:number;views:number;created_at:string;user?:{id:string;name:string;avatar:string|null;verified:boolean}};
export type ArticleComment={id:string;name:string;avatar:string;time:string;text:string;likes:number;liked:boolean;userId:string;parentCommentId:string|null;verified?:boolean};
export type SocialVideo={id:string;title:string;description?:string;image?:string;subtype?:string;metrics?:Record<string,number>;metadata?:Record<string,unknown>;created_at:string;user?:{id:string;name:string;avatar:string|null;verified:boolean}};
export type SocialStory={id:string;image:string;created_at:string;likes:number;liked:boolean;comments_count:number;user:{id:string;name:string;avatar:string|null}};
export type ConnectionStatus='none'|'pending_outgoing'|'pending_incoming'|'connected';
export type PublicProfile={id:string;name:string;bio:string|null;avatar:string|null;verified:boolean;level:number;xp:number;coins:number;created_at:string;postCount:number;followersCount:number;followingCount:number;isFollowing:boolean;isSelf:boolean;connectionStatus:ConnectionStatus;connectionId:string|null};
export type ConnectionSummary={id:string;user:{id:string;name:string;avatar:string|null;bio?:string|null;verified?:boolean;level?:number};note:string;status:'pending'|'accepted'|'declined';direction:'incoming'|'outgoing';createdAt:string};

export const socialService = {
  async report(targetType:'post'|'comment'|'user'|'article'|'video',targetId:string,reason:string){const {data}=await apiClient.post('/social/reports',{targetType,targetId,reason});return data;},
  async blockUser(userId:string){const {data}=await apiClient.post<{success:boolean;blocked:boolean}>(`/social/users/${userId}/block`);return data.blocked;},
  async getConversations(){const {data}=await apiClient.get<{success:boolean;conversations:SocialConversation[]}>('/social/messages/conversations');return data.conversations;},
  async getMessageRequests(){const {data}=await apiClient.get<{success:boolean;requests:MessageRequest[]}>('/social/messages/requests');return data.requests;},
  async getMessages(userId:string){const {data}=await apiClient.get<{success:boolean;messages:DirectMessage[];conversation:ConversationMeta|null}>(`/social/messages/${userId}`);return {messages:data.messages,conversation:data.conversation};},
  async sendMessage(userId:string,text:string){const {data}=await apiClient.post<{success:boolean;message:DirectMessage}>(`/social/messages/${userId}`,{text});return data.message;},
  async sendImageMessage(userId:string,asset:MediaAsset){const form=new FormData();form.append('kind','image');form.append('file',{uri:asset.uri,type:asset.mimeType||'image/jpeg',name:asset.fileName||'dm-photo.jpg'} as never);const {data}=await apiClient.post<{success:boolean;message:DirectMessage}>(`/social/messages/${userId}/media`,form,{headers:{'Content-Type':'multipart/form-data'},timeout:30_000});return data.message;},
  async sendVoiceMessage(userId:string,asset:MediaAsset,durationMs:number,transcript?:string){const form=new FormData();form.append('kind','voice');form.append('durationMs',String(Math.round(durationMs)));if(transcript)form.append('transcript',transcript);form.append('file',{uri:asset.uri,type:asset.mimeType||'audio/m4a',name:asset.fileName||'dm-voice.m4a'} as never);const {data}=await apiClient.post<{success:boolean;message:DirectMessage}>(`/social/messages/${userId}/media`,form,{headers:{'Content-Type':'multipart/form-data'},timeout:60_000});return data.message;},
  async transcribeAudio(asset:MediaAsset){const form=new FormData();form.append('audio',{uri:asset.uri,type:asset.mimeType||'audio/m4a',name:asset.fileName||'voice.m4a'} as never);const {data}=await apiClient.post<{success:boolean;transcript:string}>('/social/messages/transcribe',form,{headers:{'Content-Type':'multipart/form-data'},timeout:60_000});return data.transcript;},
  async markConversationRead(userId:string){await apiClient.post(`/social/messages/${userId}/read`);},
  async logCall(userId:string,payload:{mode:'audio'|'video';outcome:string;durationS:number}){const {data}=await apiClient.post<{success:boolean;message:DirectMessage}>(`/social/messages/${userId}/call`,payload);return data.message;},
  async actOnMessageRequest(userId:string,action:'accept'|'decline'|'block'){const {data}=await apiClient.post<{success:boolean;status:string}>(`/social/messages/requests/${userId}`,{action});return data.status;},
  async getSocialBlogs(){const {data}=await apiClient.get<{success:boolean;blogs:SocialBlog[]}>('/social/content/blogs');return data.blogs;},
  async getSocialBlog(id:string){const {data}=await apiClient.get<{success:boolean;blog:SocialBlog}>(`/social/content/blogs/${id}`);return data.blog;},
  async getArticleEngagement(id:string){const {data}=await apiClient.get<{success:boolean;likes:number;liked:boolean;comments:ArticleComment[]}>(`/social/content/blogs/${id}/engagement`);return data;},
  async toggleArticleLike(id:string){const {data}=await apiClient.post<{success:boolean;likes:number;liked:boolean}>(`/social/content/blogs/${id}/like`);return data;},
  async addArticleComment(id:string,text:string,parentCommentId?:string){const {data}=await apiClient.post<{success:boolean;comment:ArticleComment}>(`/social/content/blogs/${id}/comments`,{text,parentCommentId});return data.comment;},
  async toggleArticleCommentLike(id:string,commentId:string){const {data}=await apiClient.post<{success:boolean;likes:number;liked:boolean}>(`/social/content/blogs/${id}/comments/${commentId}/like`);return data;},
  async deleteArticleComment(id:string,commentId:string){await apiClient.delete(`/social/content/blogs/${id}/comments/${commentId}`);},
  async toggleBlogFollow(blogId:string){const {data}=await apiClient.post<{success:boolean;following:boolean}>(`/social/content/blogs/${blogId}/follow`);return data.following;},
  async getSocialVideos(){const {data}=await apiClient.get<{success:boolean;videos:SocialVideo[]}>('/social/content/videos');return data.videos;},
  async getStories(){const {data}=await apiClient.get<{success:boolean;stories:SocialStory[]}>('/social/stories');return data.stories;},
  async getProfile(userId:string){const {data}=await apiClient.get<{success:boolean;user:PublicProfile}>(`/social/users/${userId}`);return data.user;},
  /**
   * GET /api/social/leaderboard?limit=20
   * Backend returns { users } ordered by XP descending.
   * We add rank on the client side.
   */
  async getLeaderboard(limit = 20, scope: 'global' | 'friends' | 'teams' = 'global') {
    const { data } = await apiClient.get<{ success: boolean; users: LeaderboardUser[] }>(
      '/social/leaderboard',
      { params: { limit, scope } }
    );
    return data.users;
  },

  /**
   * GET /api/social/feed — public post feed (used by community screen)
   * Note: the dedicated post feed is at /api/posts/feed (see postsService).
   * This endpoint returns the same data via social route.
   */
  async getFeed(limit = 20, skip = 0) {
    const { data } = await apiClient.get<{ success: boolean; posts: unknown[] }>(
      '/social/feed',
      { params: { limit, skip } }
    );
    return data.posts;
  },

  /** GET /api/social/users?q=name — search users */
  async searchUsers(q: string) {
    const { data } = await apiClient.get<{ success: boolean; users: LeaderboardUser[] }>(
      '/social/users',
      { params: { q } }
    );
    return data.users;
  },

  /** GET /api/social/users/:id — public user profile */
  async getUserProfile(userId: string) {
    const { data } = await apiClient.get<{ success: boolean; user: LeaderboardUser & { postCount: number } }>(
      `/social/users/${userId}`
    );
    return data.user;
  },
  async getFriends() { const { data } = await apiClient.get<{ success: boolean; friends: LeaderboardUser[] }>('/social/friends'); return data.friends; },
  async toggleFriend(userId: string) { const { data } = await apiClient.post<{ success: boolean; friend: boolean }>(`/social/users/${userId}/friend`); return data.friend; },
  async getFriendsProgress() { const { data } = await apiClient.get<{ success: boolean; friends: FriendProgress[] }>('/social/friends/progress'); return data.friends; },
  async getCreators() { const { data } = await apiClient.get<{ success: boolean; creators: CreatorUser[] }>('/social/creators'); return data.creators; },
  async toggleFollow(userId: string) { const { data } = await apiClient.post<{ success: boolean; following: boolean }>(`/social/users/${userId}/follow`); return data.following; },
  // ── Connections (LinkedIn-style request; sending one also follows the person) ──
  async sendConnectRequest(userId: string, note?: string) { const { data } = await apiClient.post<{ success: boolean; connectionStatus: ConnectionStatus; connectionId: string | null }>(`/social/connections/${userId}`, { note: note || '' }); return data; },
  async acceptConnection(userId: string) { const { data } = await apiClient.post<{ success: boolean; connectionStatus: ConnectionStatus; connectionId: string | null }>(`/social/connections/${userId}/accept`); return data; },
  async declineConnection(userId: string) { const { data } = await apiClient.post<{ success: boolean; connectionStatus: ConnectionStatus }>(`/social/connections/${userId}/decline`); return data; },
  async removeConnection(userId: string) { const { data } = await apiClient.delete<{ success: boolean; connectionStatus: ConnectionStatus }>(`/social/connections/${userId}`); return data; },
  async getConnections(box: 'incoming' | 'outgoing' | 'accepted' = 'accepted') { const { data } = await apiClient.get<{ success: boolean; connections: ConnectionSummary[] }>('/social/connections', { params: { box } }); return data.connections; },
  async getLiveStreams() { try { const { data } = await apiClient.get<{ success: boolean; streams: unknown[] }>('/social/live'); return data.streams as any[]; } catch { return []; } },
  async getEvents() { try { const { data } = await apiClient.get<{ success: boolean; events: unknown[] }>('/social/events'); return data.events as any[]; } catch { return []; } },
  async registerEvent(eventId: string) { const { data } = await apiClient.post(`/social/events/${eventId}/register`); return data; },
};
