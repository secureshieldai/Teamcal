import { apiClient } from './client';
export type PersonalRecord<T=Record<string,unknown>>={id:string;kind:string;external_key?:string|null;data:T;status:string;created_at:string;updated_at:string};
export const personalService={
 async list<T>(kind:string){const {data}=await apiClient.get<{success:boolean;records:PersonalRecord<T>[]}>('/personal',{params:{kind}});return data.records;},
 async create<T>(kind:string,value:T,options?:{externalKey?:string;status?:string}){const {data}=await apiClient.post<{success:boolean;record:PersonalRecord<T>}>('/personal',{kind,data:value,...options});return data.record;},
 async update<T>(id:string,value:T,status?:string){const {data}=await apiClient.patch<{success:boolean;record:PersonalRecord<T>}>(`/personal/${id}`,{data:value,status});return data.record;},
 async remove(id:string){await apiClient.delete(`/personal/${id}`);},
 async toggle<T>(kind:string,externalKey:string,value:T){const {data}=await apiClient.post<{success:boolean;active:boolean}>('/personal/toggle',{kind,externalKey,data:value});return data.active;},
};
