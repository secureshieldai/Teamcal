import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { fastingService } from '../services/api/fasting.service';
import { CALORIES_SAVED_PER_HOUR, FASTING_PROTOCOLS, fastingStreak, stageForHours } from '../data/fastingData';
import type { FastLog } from '../types/api';

export function useFastingNow() {
  const [active, setActive] = useState<FastLog | null>(null);
  const [history, setHistory] = useState<FastLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [displayPaused, setDisplayPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const [fast, hist] = await Promise.all([fastingService.getActive(), fastingService.getHistory(60)]);
      setActive(fast);
      setHistory(hist);
    } catch {
      // graceful — UI shows its own loading/empty/error states
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
    const timer=setInterval(refetch,15_000);
    return()=>clearInterval(timer);
  }, [refetch]);

  // A fresh fast always starts unpaused, even if `active` is later updated in place (e.g. by extend()).
  useEffect(() => {
    setDisplayPaused(false);
  }, [active?.id]);

  useEffect(() => {
    if (active && !displayPaused) {
      setNow(Date.now());
      intervalRef.current = setInterval(() => setNow(Date.now()), 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [active, displayPaused]);

  const elapsedSeconds = active ? Math.max(0, Math.floor((now - active.started_at) / 1000)) : 0;
  const elapsedHours = elapsedSeconds / 3600;
  const remainingSeconds = active ? Math.max(0, Math.round(active.target_hours * 3600 - elapsedSeconds)) : 0;
  const stage = stageForHours(elapsedHours);
  const caloriesSaved = Math.round(elapsedHours * CALORIES_SAVED_PER_HOUR);
  const streak = fastingStreak(history);

  const toggleDisplayPause = useCallback(() => setDisplayPaused((p) => !p), []);

  const extend = useCallback(async (hoursDelta: number) => {
    if (!active) return;
    try {
      const fast = await fastingService.extend(hoursDelta);
      setActive(fast);
    } catch (e) {
      Alert.alert('Unable to update goal', (e as Error).message);
    }
  }, [active]);

  const start = useCallback(async (protocolId: string, customTargetHours?: number) => {
    const protocol = FASTING_PROTOCOLS.find((p) => p.id === protocolId);
    const label = protocol?.id ?? protocolId;
    const targetHours = customTargetHours ?? protocol?.targetHours ?? 16;
    setBusy(true);
    try {
      const fast = await fastingService.start(label, targetHours);
      setActive(fast);
    } catch (e) {
      Alert.alert('Unable to start fast', (e as Error).message);
    } finally {
      setBusy(false);
    }
  }, []);

  const stop = useCallback(async () => {
    setBusy(true);
    try {
      await fastingService.stop();
      setActive(null);
      await refetch();
    } catch (e) {
      Alert.alert('Unable to stop fast', (e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [refetch]);

  return {
    active,
    loading,
    busy,
    elapsedSeconds,
    elapsedHours,
    remainingSeconds,
    stage,
    caloriesSaved,
    streak,
    history,
    displayPaused,
    toggleDisplayPause,
    start,
    stop,
    extend,
    refetch,
  };
}
