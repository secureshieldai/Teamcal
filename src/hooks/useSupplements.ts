import { useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useApiQuery } from './useApiQuery';
import { personalService, type PersonalRecord } from '../services/api/personal.service';
import type { TimeOfDay } from '../data/supplementData';

export type SupplementItem = {
  id: string;
  name: string;
  dose: string;
  timeOfDay: TimeOfDay;
  reminderTime: string;
  takeWithFood: boolean;
  refillDays: number;
  costUsd: number;
  createdAt: number;
};

const DAY_MS = 86400000;
function dateKey(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function useSupplements() {
  const { data: supplementRecords, loading: loadingSupplements, refetch: refetchSupplements } = useApiQuery(
    () => personalService.list<Omit<SupplementItem, 'id' | 'createdAt'>>('supplement'),
    [] as PersonalRecord<Omit<SupplementItem, 'id' | 'createdAt'>>[],
    []
  );
  const { data: takenRecords, loading: loadingTaken, refetch: refetchTaken } = useApiQuery(
    () => personalService.list<{ supplementId: string; date: string }>('supplement-taken'),
    [] as PersonalRecord<{ supplementId: string; date: string }>[],
    []
  );

  const supplements = useMemo<SupplementItem[]>(
    () => supplementRecords.map((r) => ({ id: r.id, createdAt: new Date(r.created_at).getTime(), ...r.data })),
    [supplementRecords]
  );

  const todayKey = dateKey(Date.now());
  const takenToday = useMemo(
    () => new Set(takenRecords.filter((r) => r.data.date === todayKey).map((r) => r.data.supplementId)),
    [takenRecords, todayKey]
  );

  const takenCountByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of takenRecords) map.set(r.data.date, (map.get(r.data.date) || 0) + 1);
    return map;
  }, [takenRecords]);

  const last7Days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const ts = startOfDay(Date.now()) - (6 - i) * DAY_MS;
        const key = dateKey(ts);
        return {
          key,
          label: new Date(ts).toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2).toUpperCase(),
          count: takenCountByDay.get(key) || 0,
        };
      }),
    [takenCountByDay]
  );

  const total = supplements.length;
  const takenCountToday = takenToday.size;
  const percentToday = total > 0 ? Math.round((takenCountToday / total) * 100) : 0;

  const streak = useMemo(() => {
    if (total === 0) return 0;
    let count = 0;
    for (let i = 0; i < 365; i++) {
      const key = dateKey(startOfDay(Date.now()) - i * DAY_MS);
      const takenThatDay = takenRecords.filter((r) => r.data.date === key).length;
      if (takenThatDay >= total) count++;
      else break;
    }
    return count;
  }, [takenRecords, total]);

  const monthlyCost = useMemo(() => supplements.reduce((sum, s) => sum + (s.costUsd || 0), 0), [supplements]);

  const add = useCallback(
    async (item: Omit<SupplementItem, 'id' | 'createdAt'>) => {
      try {
        await personalService.create('supplement', item);
        await refetchSupplements();
      } catch (e) {
        Alert.alert('Unable to add supplement', (e as Error).message);
      }
    },
    [refetchSupplements]
  );

  const update = useCallback(
    async (id: string, patch: Partial<Omit<SupplementItem, 'id' | 'createdAt'>>) => {
      const existing = supplements.find((s) => s.id === id);
      if (!existing) return;
      const { id: _id, createdAt: _createdAt, ...rest } = existing;
      try {
        await personalService.update(id, { ...rest, ...patch });
        await refetchSupplements();
      } catch (e) {
        Alert.alert('Unable to update supplement', (e as Error).message);
      }
    },
    [supplements, refetchSupplements]
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        await personalService.remove(id);
        await refetchSupplements();
      } catch (e) {
        Alert.alert('Unable to remove supplement', (e as Error).message);
      }
    },
    [refetchSupplements]
  );

  const toggleTaken = useCallback(
    async (supplementId: string) => {
      try {
        await personalService.toggle('supplement-taken', `${supplementId}:${todayKey}`, { supplementId, date: todayKey });
        await refetchTaken();
      } catch (e) {
        Alert.alert('Unable to update', (e as Error).message);
      }
    },
    [todayKey, refetchTaken]
  );

  return {
    loading: loadingSupplements || loadingTaken,
    supplements,
    takenToday,
    takenCountToday,
    total,
    percentToday,
    streak,
    last7Days,
    monthlyCost,
    add,
    update,
    remove,
    toggleTaken,
  };
}
