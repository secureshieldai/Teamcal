import { useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useApiQuery } from './useApiQuery';
import { personalService, type PersonalRecord } from '../services/api/personal.service';
import type { CyclePhase } from '../data/periodTrackerData';

export type LogType = 'period-start' | 'flow' | 'bbt' | 'cervical-mucus' | 'symptom' | 'mood' | 'intimacy' | 'note';
export type LogEntry = { type: LogType; value: string | number; ts: number };
export type CycleSettings = { mode: 'tracking' | 'trying' | 'pregnant'; cycleLength: number; periodLength: number; lutealLength: number; shareWithPartner: boolean };

const DEFAULT_SETTINGS: CycleSettings = { mode: 'tracking', cycleLength: 28, periodLength: 5, lutealLength: 14, shareWithPartner: false };
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
function daysBetween(a: number, b: number) {
  return Math.round((startOfDay(b) - startOfDay(a)) / DAY_MS);
}

export function usePeriodTracker() {
  const { data: logRecords, loading: logsLoading, refetch: refetchLogs } = useApiQuery(
    () => personalService.list<LogEntry>('period-log'),
    [] as PersonalRecord<LogEntry>[],
    []
  );
  const { data: settingsRecords, loading: settingsLoading, refetch: refetchSettings } = useApiQuery(
    () => personalService.list<CycleSettings>('period-settings'),
    [] as PersonalRecord<CycleSettings>[],
    []
  );

  const settingsRecord = settingsRecords[0] ?? null;
  const settings: CycleSettings = settingsRecord?.data ?? DEFAULT_SETTINGS;

  const logs = useMemo(
    () => logRecords.map((r) => ({ id: r.id, ...r.data })).sort((a, b) => b.ts - a.ts),
    [logRecords]
  );

  const periodStarts = useMemo(() => {
    const days = logs.filter((l) => l.type === 'period-start').map((l) => startOfDay(l.ts));
    return Array.from(new Set(days)).sort((a, b) => a - b);
  }, [logs]);

  const today = startOfDay(Date.now());
  const { cycleLength, periodLength, lutealLength } = settings;
  const ovulationDay = Math.max(periodLength + 1, cycleLength - lutealLength);
  const fertileStart = Math.max(1, ovulationDay - 4);
  const fertileEnd = ovulationDay + 1;

  const lastStart = periodStarts.length ? periodStarts[periodStarts.length - 1] : null;
  let cycleAnchor = lastStart;
  if (cycleAnchor !== null) {
    while (cycleAnchor + cycleLength * DAY_MS <= today) cycleAnchor += cycleLength * DAY_MS;
  }

  const cycleDayRaw = cycleAnchor !== null ? daysBetween(cycleAnchor, today) + 1 : 1;
  const cycleDay = Math.min(Math.max(cycleDayRaw, 1), cycleLength);

  const phase: CyclePhase =
    cycleDay <= periodLength
      ? 'menstrual'
      : cycleDay >= fertileStart && cycleDay <= fertileEnd
      ? 'ovulatory'
      : cycleDay < fertileStart
      ? 'follicular'
      : 'luteal';

  const nextPeriodDate = cycleAnchor !== null ? cycleAnchor + cycleLength * DAY_MS : today + cycleLength * DAY_MS;
  const nextPeriodInDays = Math.max(0, daysBetween(today, nextPeriodDate));

  const inFertileWindow = cycleDay >= fertileStart && cycleDay <= fertileEnd;
  const fertileDayOfWindow = cycleDay - fertileStart + 1;
  const fertileWindowLength = fertileEnd - fertileStart + 1;

  const effectiveAnchor = cycleAnchor ?? today;
  const classifyDate = useCallback(
    (ts: number): 'period' | 'fertile' | 'ovulation' | 'luteal' | 'follicular' => {
      const d = startOfDay(ts);
      const cyclesSince = Math.floor(daysBetween(effectiveAnchor, d) / cycleLength);
      const cycleStart = effectiveAnchor + cyclesSince * cycleLength * DAY_MS;
      const dayInCycle = daysBetween(cycleStart, d) + 1;
      if (dayInCycle === ovulationDay) return 'ovulation';
      if (dayInCycle >= fertileStart && dayInCycle <= fertileEnd) return 'fertile';
      if (dayInCycle <= periodLength) return 'period';
      if (dayInCycle < fertileStart) return 'follicular';
      return 'luteal';
    },
    [effectiveAnchor, cycleLength, ovulationDay, fertileStart, fertileEnd, periodLength]
  );

  const next3Cycles = useMemo(
    () => [0, 1, 2].map((i) => nextPeriodDate + i * cycleLength * DAY_MS),
    [nextPeriodDate, cycleLength]
  );

  const cycleLengths = useMemo(() => {
    const diffs: number[] = [];
    for (let i = 1; i < periodStarts.length; i++) diffs.push(daysBetween(periodStarts[i - 1], periodStarts[i]));
    return diffs;
  }, [periodStarts]);

  const avgCycle = cycleLengths.length ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length) : cycleLength;
  const cyclesTracked = cycleLengths.length;

  const regularity = useMemo(() => {
    if (cycleLengths.length < 2) return 'Good';
    const variance = cycleLengths.reduce((s, v) => s + (v - avgCycle) ** 2, 0) / cycleLengths.length;
    const stdev = Math.sqrt(variance);
    return stdev <= 3 ? 'Good' : stdev <= 7 ? 'Fair' : 'Irregular';
  }, [cycleLengths, avgCycle]);

  const bbtLogs = useMemo(() => logs.filter((l) => l.type === 'bbt'), [logs]);
  const avgBbt = bbtLogs.length ? bbtLogs.reduce((s, l) => s + Number(l.value), 0) / bbtLogs.length : null;

  const symptomLogs = useMemo(() => logs.filter((l) => l.type === 'symptom'), [logs]);
  const symptomCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of symptomLogs) map.set(String(l.value), (map.get(String(l.value)) || 0) + 1);
    return Array.from(map.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  }, [symptomLogs]);

  const pmsDays = useMemo(() => {
    const days = new Set<string>();
    for (const start of periodStarts) {
      for (const l of symptomLogs) {
        const diff = daysBetween(startOfDay(l.ts), start);
        if (diff >= 0 && diff <= 5) days.add(dateKey(l.ts));
      }
    }
    return days.size;
  }, [symptomLogs, periodStarts]);

  const lateBy = avgCycle - cycleLength;

  const ninetyDayHeatmap = useMemo(() => {
    const cutoff = today - 89 * DAY_MS;
    const counts = new Map<string, number>();
    for (const l of logs) {
      if (l.ts < cutoff) continue;
      if (l.type === 'symptom' || l.type === 'mood' || l.type === 'flow' || l.type === 'period-start') {
        const key = dateKey(l.ts);
        counts.set(key, (counts.get(key) || 0) + 1);
      }
    }
    return Array.from({ length: 90 }, (_, i) => {
      const ts = cutoff + i * DAY_MS;
      return { key: dateKey(ts), count: counts.get(dateKey(ts)) || 0 };
    });
  }, [logs, today]);

  const log = useCallback(
    async (type: LogType, value: string | number) => {
      try {
        await personalService.create('period-log', { type, value, ts: Date.now() });
        await refetchLogs();
      } catch (e) {
        Alert.alert('Unable to save', (e as Error).message);
      }
    },
    [refetchLogs]
  );

  const saveSettings = useCallback(
    async (patch: Partial<CycleSettings>) => {
      const next = { ...settings, ...patch };
      try {
        await personalService.create('period-settings', next, { externalKey: 'settings' });
        await refetchSettings();
      } catch (e) {
        Alert.alert('Unable to save settings', (e as Error).message);
        throw e;
      }
    },
    [settings, refetchSettings]
  );

  return {
    loading: logsLoading || settingsLoading,
    settings,
    logs,
    periodStarts,
    cycleDay,
    phase,
    nextPeriodInDays,
    nextPeriodDate,
    fertileStart,
    fertileEnd,
    inFertileWindow,
    fertileDayOfWindow,
    fertileWindowLength,
    ovulationDay,
    classifyDate,
    next3Cycles,
    avgCycle,
    avgPeriod: periodLength,
    cyclesTracked,
    regularity,
    avgBbt,
    symptomCounts,
    pmsDays,
    lateBy,
    ninetyDayHeatmap,
    log,
    saveSettings,
    refetch: () => Promise.all([refetchLogs(), refetchSettings()]),
  };
}
