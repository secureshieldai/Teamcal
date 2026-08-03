import { apiClient } from './client';
export type BlogSite={id:string;name:string;slug:string;category?:string;description?:string;cover?:string;status?:string;created_at:string};
export type BlogArticle={id:string;blog_id:string;title:string;cover?:string;status:string;views:number;earned:number;read_minutes:number;created_at:string};
export const blogsService={
 async sites(){const {data}=await apiClient.get<{success:boolean;sites:BlogSite[]}>('/blogs/sites');return data.sites;},
 async createSite(value:{name:string;slug:string;category:string;description:string;theme:string;aiPrefs?:string}){const {data}=await apiClient.post<{success:boolean;site:BlogSite}>('/blogs/sites',value);return data.site;},
 async articles(blogId:string){const {data}=await apiClient.get<{success:boolean;articles:BlogArticle[]}>(`/blogs/sites/${blogId}/articles`);return data.articles;},
};
