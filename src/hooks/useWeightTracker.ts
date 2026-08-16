import { useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useApiQuery } from './useApiQuery';
import { trackerService } from '../services/api/tracker.service';
import type { TrackerEntry } from '../types/api';

export type WeightRange = '7D' | '30D' | '3M' | '6M' | '1Y' | 'All';

const RANGE_DAYS: Record<WeightRange, number> = {
  '7D': 7,
  '30D': 30,
  '3M': 90,
  '6M': 180,
  '1Y': 365,
  All: 36500,
};

export function useWeightTracker() {
  const { data: entries, loading, error, refetch } = useApiQuery(
    () => trackerService.getEntries('weight', 500),
    [] as TrackerEntry[],
    []
  );

  const sorted = useMemo(() => [...entries].sort((a, b) => b.ts - a.ts), [entries]);

  const latest = sorted[0];
  const previous = sorted[1];
  const change = latest && previous ? latest.value - previous.value : 0;

  const values = sorted.map((e) => e.value);
  const lowest = values.length ? Math.min(...values) : 0;
  const highest = values.length ? Math.max(...values) : 0;
  const oldest = sorted[sorted.length - 1];
  const totalChange = latest && oldest && latest.id !== oldest.id ? latest.value - oldest.value : 0;

  const weekCutoff = Date.now() - 7 * 86400000;
  const weekEntries = sorted.filter((e) => e.ts >= weekCutoff);
  const weekAvg = weekEntries.length
    ? weekEntries.reduce((a, e) => a + e.value, 0) / weekEntries.length
    : latest?.value ?? 0;
  const weekChange =
    weekEntries.length > 1 ? weekEntries[0].value - weekEntries[weekEntries.length - 1].value : 0;

  const forRange = useCallback(
    (range: WeightRange) => {
      const days = RANGE_DAYS[range];
      const cutoff = Date.now() - days * 86400000;
      return sorted.filter((e) => e.ts >= cutoff).slice().reverse();
    },
    [sorted]
  );

  const log = useCallback(
    async (value: number, note?: string) => {
      await trackerService.log('weight', value, note ? { note } : {});
      await refetch();
    },
    [refetch]
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        await trackerService.deleteEntry('weight', id);
        await refetch();
      } catch (e) {
        Alert.alert('Unable to delete entry', (e as Error).message);
      }
    },
    [refetch]
  );

  return {
    entries: sorted,
    latest,
    change,
    lowest,
    highest,
    totalChange,
    weekAvg,
    weekChange,
    forRange,
    loading,
    error,
    log,
    remove,
    refetch,
  };
}
