import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { trackerService } from '../services/api/tracker.service';
import { userService } from '../services/api/user.service';
import { useAuth } from '../context/AuthContext';
import { disableStepSync, enableStepSync, isStepSyncEnabled, syncSteps } from '../services/stepSync';
import { stepsToActiveMinutes, stepsToKcal, stepsToKm } from '../data/stepsData';

export function useStepsToday() {
  const { user, refreshUser } = useAuth();
  const goal = user?.goal_steps ?? 8000;

  const [sum, setSum] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [syncBusy, setSyncBusy] = useState(false);
  const [goalSaving, setGoalSaving] = useState(false);

  const percent = goal > 0 ? Math.min(100, Math.round((sum / goal) * 100)) : 0;
  const km = stepsToKm(sum);
  const kcal = stepsToKcal(sum);
  const activeMin = stepsToActiveMinutes(sum);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const today = await trackerService.getToday('steps');
      setSum(today.sum);
      const s = await trackerService.getStreak('steps', goal);
      setStreak(s);
    } catch {
      // keep previous values; UI shows its own loading/empty/error states
    } finally {
      setLoading(false);
    }
  }, [goal]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    isStepSyncEnabled().then(setSyncEnabled);
  }, []);

  const toggleSync = useCallback(async () => {
    setSyncBusy(true);
    try {
      if (syncEnabled) {
        await disableStepSync();
        setSyncEnabled(false);
      } else {
        await enableStepSync();
        setSyncEnabled(true);
      }
      await refetch();
    } catch (e) {
      Alert.alert('Could not update phone motion sync', (e as Error).message);
    } finally {
      setSyncBusy(false);
    }
  }, [syncEnabled, refetch]);

  const syncNow = useCallback(async () => {
    setSyncBusy(true);
    try {
      await syncSteps(false);
      await refetch();
    } catch (e) {
      Alert.alert('Sync failed', (e as Error).message);
    } finally {
      setSyncBusy(false);
    }
  }, [refetch]);

  const updateGoal = useCallback(
    async (newGoal: number) => {
      setGoalSaving(true);
      try {
        await userService.updateGoals({ steps: newGoal });
        await refreshUser();
        await refetch();
      } catch (e) {
        Alert.alert('Unable to save goal', (e as Error).message);
      } finally {
        setGoalSaving(false);
      }
    },
    [refreshUser, refetch]
  );

  return {
    sum,
    goal,
    percent,
    km,
    kcal,
    activeMin,
    streak,
    loading,
    refetch,
    syncEnabled: syncEnabled && Platform.OS !== 'web',
    syncSupported: Platform.OS !== 'web',
    syncBusy,
    toggleSync,
    syncNow,
    goalSaving,
    updateGoal,
  };
}
