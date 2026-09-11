/**
 * Fetches the current user's saved-post set once for a whole screen, so post
 * lists can pass `saved` down to each PostCard instead of every card firing its
 * own `GET /personal?kind=saved-post` on mount (N identical requests per feed).
 */
import { useMemo } from 'react';
import { useApiQuery } from './useApiQuery';
import { personalService, type PersonalRecord } from '../services/api/personal.service';

export function useSavedPostIds() {
  // No background poll — saving is a deliberate user action and refetch() is
  // called right after a toggle.
  const { data, refetch } = useApiQuery<PersonalRecord[]>(
    () => personalService.list('saved-post'),
    [],
    [],
    0
  );

  const savedIds = useMemo(
    () => new Set((data || []).map((r) => r.external_key).filter(Boolean) as string[]),
    [data]
  );

  return { savedIds, refetch };
}
