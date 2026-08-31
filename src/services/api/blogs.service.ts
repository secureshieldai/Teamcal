import { apiClient } from './client';
export type BlogSite={id:string;name:string;slug:string;category?:string;description?:string;cover?:string;banner?:string;status?:string;theme?:string;layout?:'grid'|'list'|'featured';accentColor?:string;featuredArticleId?:string;showReadTime?:boolean;showDates?:boolean;commentsEnabled?:boolean;commentApproval?:boolean;postOrder?:string;language?:string;searchTitle?:string;searchDescription?:string;shareImage?:string;defaultShareMessage?:string;notifyNewPost?:boolean;notifyScheduled?:boolean;notifyUpdated?:boolean;allowDiscovery?:boolean;created_at:string;author?:{id:string;name:string;avatar:string|null;username:string}};
export type BlogArticle={id:string;blog_id:string;user_id?:string;title:string;cover?:string;body?:string;excerpt?:string;category?:string;tags?:string[];status:string;scheduled_for?:string;views:number;earned:number;read_minutes:number;created_at:string;featured?:boolean};
export const blogsService={
 async sites(){const {data}=await apiClient.get<{success:boolean;sites:BlogSite[]}>('/blogs/sites');return data.sites;},
 async getSite(id:string){const {data}=await apiClient.get<{success:boolean;site:BlogSite}>(`/blogs/sites/${id}`);return data.site;},
 async getPublicBlog(id:string){try{const {data}=await apiClient.get<{success:boolean;site:BlogSite}>(`/blogs/sites/${id}/public`);return data.site;}catch{const rows=await blogsService.sites();const s=rows.find(x=>x.id===id);if(!s)throw new Error('Blog not found');return s;}},
 async createSite(value:{name:string;slug:string;category:string;description:string;theme:string;aiPrefs?:string;logo?:string;cover?:string}){const {data}=await apiClient.post<{success:boolean;site:BlogSite}>('/blogs/sites',value);return data.site;},
 async updateSite(id:string,value:Record<string,unknown>){const {data}=await apiClient.patch<{success:boolean;site:BlogSite}>(`/blogs/sites/${id}`,value);return data.site;},
 async articles(blogId:string){const {data}=await apiClient.get<{success:boolean;articles:BlogArticle[]}>(`/blogs/sites/${blogId}/articles`);return data.articles;},
 async getArticle(id:string){const {data}=await apiClient.get<{success:boolean;article:BlogArticle}>(`/blogs/articles/${id}`);return data.article;},
 async createArticle(value:{blogId:string;title:string;body:string;cover?:string;category?:string;tags?:string[];status?:string}){const {data}=await apiClient.post<{success:boolean;article:BlogArticle}>('/blogs/articles',value);return data.article;},
 async updateArticle(id:string,value:Record<string,unknown>){const {data}=await apiClient.patch<{success:boolean;article:BlogArticle}>(`/blogs/articles/${id}`,value);return data.article;},
 async deleteArticle(id:string){await apiClient.delete(`/blogs/articles/${id}`);},
 async deleteSite(id:string){await apiClient.delete(`/blogs/sites/${id}`);},
 async analytics(id:string){const {data}=await apiClient.get<{success:boolean;analytics:{posts:number;published:number;views:number;earned:number;averageReadMinutes:number;followers:number;comments:number}}>(`/blogs/sites/${id}/analytics`);return data.analytics;},
};
