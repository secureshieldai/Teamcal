import { useState } from 'react';
import { useApiQuery } from './useApiQuery';
import { challengesService } from '../services/api/challenges.service';
import { featuredChallenge as mockFeatured, trendingChallenges as mockTrending } from '../data/challengesData';
import type { Challenge } from '../types/api';

export function useChallenges(tab: 'discover' | 'my' | 'completed' = 'discover') {
  const { data: challenges, loading, error, refetch } = useApiQuery(
    () => challengesService.list(tab).then((r) => r.challenges),
    [] as Challenge[],
    [tab]
  );

  const featured = useApiQuery(
    () => challengesService.getFeatured(),
    null,
    []
  );

  // Map real featured challenge to UI shape, fallback to mock
  const featuredChallenge = featured.data
    ? {
        photo: featured.data.photo ?? mockFeatured.photo,
        title: featured.data.title,
        joinedCount: featured.data.joined_count.toLocaleString(),
        day: featured.data.duration_days,
        totalDays: featured.data.total_days,
      }
    : mockFeatured;

  // Map real discover list to trending shape, fallback to mock
  const trendingChallenges =
    tab === 'discover' && challenges.length > 0
      ? challenges.slice(0, 3).map((c) => ({
          id: c.id,
          icon: c.icon as never,
          iconColor: c.icon_color,
          title: c.title,
          duration: `${c.duration_days} days`,
          joinedCount: c.joined_count >= 1000
            ? `${(c.joined_count / 1000).toFixed(1)}K`
            : c.joined_count.toString(),
        }))
      : mockTrending;

  return { challenges, featuredChallenge, trendingChallenges, loading, error, refetch };
}

export function useChallengeActions() {
  const [loading, setLoading] = useState(false);

  const join = async (id: string) => {
    setLoading(true);
    try {
      await challengesService.join(id);
    } finally {
      setLoading(false);
    }
  };

  const leave = async (id: string) => {
    setLoading(true);
    try {
      await challengesService.leave(id);
    } finally {
      setLoading(false);
    }
  };

  return { join, leave, loading };
}
