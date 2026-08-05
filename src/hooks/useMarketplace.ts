import { useState } from 'react';
import { useApiQuery } from './useApiQuery';
import { marketplaceService } from '../services/api/marketplace.service';
import type { Product } from '../types/api';
import type { MarketplaceCategory } from '../services/api/marketplace.service';

export function useMarketplace() {
  const featured = useApiQuery(
    () => marketplaceService.getFeatured(),
    [] as Product[],
    []
  );

  const categories = useApiQuery(
    () => marketplaceService.getCategories(),
    [] as MarketplaceCategory[],
    []
  );

  // Map backend records to the card shape.
  const featuredProducts = featured.data.length > 0
    ? featured.data.map((p) => ({
        id: p.id,
        photo: p.photo ?? '',
        title: p.title,
        price: p.price_display,
      }))
    : [];

  const topCategories = categories.data.length > 0
    ? categories.data.map((c) => ({
        id: c.id,
        icon: c.icon as never,
        label: c.label,
      }))
    : [];

  return {
    featuredProducts,
    topCategories,
    loading: featured.loading,
    refetch: featured.refetch,
  };
}

export function useMarketplaceSearch() {
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const search = async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const products = await marketplaceService.search(q);
      setResults(products);
    } finally {
      setLoading(false);
    }
  };

  return { results, search, loading };
}
