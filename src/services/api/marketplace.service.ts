import { apiClient } from './client';
import type { Product } from '../../types/api';

export interface MarketplaceCategory {
  id: string;
  label: string;
  icon: string;
}

export const marketplaceService = {
  async getFeatured() {
    const { data } = await apiClient.get<{ success: boolean; products: Product[] }>(
      '/marketplace/products/featured'
    );
    return data.products;
  },

  async getProducts(params?: { category?: string; featured?: boolean; limit?: number }) {
    const { data } = await apiClient.get<{ success: boolean; products: Product[] }>(
      '/marketplace/products',
      { params }
    );
    return data.products;
  },

  async getCategories() {
    const { data } = await apiClient.get<{ success: boolean; categories: MarketplaceCategory[] }>(
      '/marketplace/categories'
    );
    return data.categories;
  },

  async search(q: string) {
    const { data } = await apiClient.get<{ success: boolean; products: Product[] }>(
      '/marketplace/search',
      { params: { q } }
    );
    return data.products;
  },
  async get(id: string) { const { data } = await apiClient.get<{ success:boolean; product:Product }>(`/marketplace/products/${id}`); return data.product; },
  async checkout(productIds: string[]) { const { data } = await apiClient.post<{ success:boolean; order:MarketplaceOrder }>('/marketplace/checkout',{productIds});return data.order; },
  async getOrders() { const { data } = await apiClient.get<{ success:boolean; orders:MarketplaceOrder[] }>('/marketplace/orders');return data.orders; },
};
export type MarketplaceOrder={id:string;ts:number;value:number;meta:{items:{id:string;title:string;price:number}[];currency:string;status:string}};
