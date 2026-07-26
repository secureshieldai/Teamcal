import { apiClient } from './client';
export type ShoppingItem = { id: string; name: string; qty: string | null; checked: boolean; ts: number };
export const shoppingService = {
  async list() { const { data } = await apiClient.get<{ success: boolean; items: ShoppingItem[] }>('/shopping'); return data.items; },
  async add(name: string, qty?: string) { const { data } = await apiClient.post<{ success: boolean; item: ShoppingItem }>('/shopping', { name, qty }); return data.item; },
  async update(id: string, patch: Partial<Pick<ShoppingItem, 'name'|'qty'|'checked'>>) { const { data } = await apiClient.patch<{ success: boolean; item: ShoppingItem }>(`/shopping/${id}`, patch); return data.item; },
  async remove(id: string) { await apiClient.delete(`/shopping/${id}`); },
  async clearChecked() { await apiClient.delete('/shopping/checked'); },
};
