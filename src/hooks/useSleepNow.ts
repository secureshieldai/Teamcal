import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { sleepService, type SleepLog } from '../services/api/sleep.service';

export function useSleepNow() {
  const [active, setActive] = useState<SleepLog | null>(null);
  const [lastNight, setLastNight] = useState<SleepLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const [sleep, history] = await Promise.all([sleepService.getActive(), sleepService.getHistory(1)]);
      setActive(sleep);
      setLastNight(history[0] ?? null);
    } catch {
      // graceful — UI shows its own loading/empty states
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
    const timer = setInterval(refetch, 15_000);
    return () => clearInterval(timer);
  }, [refetch]);

  useEffect(() => {
    if (active) {
      setNow(Date.now());
      intervalRef.current = setInterval(() => setNow(Date.now()), 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [active]);

  const elapsedHours = active ? Math.max(0, (now - active.started_at) / 3_600_000) : 0;

  const start = useCallback(async () => {
    setBusy(true);
    try {
      const sleep = await sleepService.start();
      setActive(sleep);
    } catch (e) {
      Alert.alert('Unable to start sleep tracking', (e as Error).message);
    } finally {
      setBusy(false);
    }
  }, []);

  const stop = useCallback(async () => {
    setBusy(true);
    try {
      const sleep = await sleepService.stop();
      setActive(null);
      setLastNight(sleep);
    } catch (e) {
      Alert.alert('Unable to stop sleep tracking', (e as Error).message);
    } finally {
      setBusy(false);
    }
  }, []);

  return { active, lastNight, loading, busy, elapsedHours, start, stop, refetch };
}
