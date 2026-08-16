import { useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useApiQuery } from './useApiQuery';
import { personalService, type PersonalRecord } from '../services/api/personal.service';
import { trackerService, type TrackerLastNDay } from '../services/api/tracker.service';
import { MOOD_SCALE, type MoodLevel } from '../data/journalData';

export type JournalEntry = {
  id: string;
  text: string;
  mood: MoodLevel;
  promptUsed?: string;
  type: 'written' | 'live-call';
  ts: number;
};

export function useJournal() {
  const { data: records, loading, refetch } = useApiQuery(
    () => personalService.list<Omit<JournalEntry, 'id'>>('journal-entry'),
    [] as PersonalRecord<Omit<JournalEntry, 'id'>>[],
    []
  );
  const { data: streak } = useApiQuery(() => trackerService.getStreak('mood', 1), 0, []);
  const { data: moodHistory } = useApiQuery(() => trackerService.getLastN('mood', 7), [] as TrackerLastNDay[], []);

  const entries = useMemo<JournalEntry[]>(
    () => records.map((r) => ({ id: r.id, ...r.data })).sort((a, b) => b.ts - a.ts),
    [records]
  );

  const avgMood7d = useMemo(() => {
    const days = moodHistory.filter((d) => d.count > 0);
    if (!days.length) return null;
    const avg = days.reduce((s, d) => s + d.total / d.count, 0) / days.length;
    return Math.round(avg * 10) / 10;
  }, [moodHistory]);

  const saveEntry = useCallback(
    async (entry: { text: string; mood: MoodLevel; promptUsed?: string; type: 'written' | 'live-call' }) => {
      try {
        const score = MOOD_SCALE.find((m) => m.id === entry.mood)?.score ?? 3;
        await personalService.create('journal-entry', { ...entry, ts: Date.now() });
        await trackerService.log('mood', score, { label: entry.mood });
        await refetch();
        return true;
      } catch (e) {
        Alert.alert('Unable to save entry', (e as Error).message);
        return false;
      }
    },
    [refetch]
  );

  const removeEntry = useCallback(
    async (id: string) => {
      try {
        await personalService.remove(id);
        await refetch();
      } catch (e) {
        Alert.alert('Unable to remove entry', (e as Error).message);
      }
    },
    [refetch]
  );

  return { loading, entries, streak, avgMood7d, saveEntry, removeEntry, refetch };
}
