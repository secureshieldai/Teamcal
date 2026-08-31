import { useCallback, useMemo } from 'react';
import { useApiQuery } from './useApiQuery';
import { personalService, type PersonalRecord } from '../services/api/personal.service';

export type WindDownActivity = { id: string; title: string; time: string; reminderEnabled: boolean };

const DEFAULT_ROUTINE: WindDownActivity[] = [
  { id: 'read', time: '21:00', title: 'Read a book', reminderEnabled: true },
  { id: 'prepare', time: '21:30', title: 'Prepare for bed', reminderEnabled: true },
  { id: 'lights-out', time: '22:00', title: 'Lights out', reminderEnabled: true },
];

export function useWindDownRoutine() {
  const query = useApiQuery(
    () => personalService.list<{ activities: WindDownActivity[] }>('sleep-wind-down-routine'),
    [] as PersonalRecord<{ activities: WindDownActivity[] }>[],
    []
  );
  const record = query.data[0] ?? null;
  const activities = useMemo(() => record?.data?.activities ?? DEFAULT_ROUTINE, [record]);
  const save = useCallback(async (next: WindDownActivity[]) => {
    await personalService.create('sleep-wind-down-routine', { activities: next }, { externalKey: 'routine' });
    await query.refetch();
  }, [query.refetch]);
  return { activities, loading: query.loading, save };
}
