import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { trackerService } from '../services/api/tracker.service';
import { useAuth } from '../context/AuthContext';
import { getDrinkType, type DrinkTypeId } from '../data/waterData';
import type { TrackerEntry } from '../types/api';

const WEATHER_BONUS_ML = 500;
const WORKOUT_BONUS_ML = 350;

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function useWaterToday() {
  const { user } = useAuth();
  const baseGoal = user?.goal_water_ml ?? 2500;

  const [entries, setEntries] = useState<TrackerEntry[]>([]);
  const [sum, setSum] = useState(0);
  const [streak, setStreak] = useState(0);
  const [weatherOn, setWeatherOn] = useState(false);
  const [workoutOn, setWorkoutOn] = useState(false);
  const [loading, setLoading] = useState(true);

  const dayKey = todayKey();
  const effectiveGoal = baseGoal + (weatherOn ? WEATHER_BONUS_ML : 0) + (workoutOn ? WORKOUT_BONUS_ML : 0);
  const percent = effectiveGoal > 0 ? Math.min(100, Math.round((sum / effectiveGoal) * 100)) : 0;

  useEffect(() => {
    AsyncStorage.getItem(`water_weather_${dayKey}`).then((v) => setWeatherOn(v === '1'));
    AsyncStorage.getItem(`water_workout_${dayKey}`).then((v) => setWorkoutOn(v === '1'));
  }, [dayKey]);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const today = await trackerService.getToday('water');
      setEntries(today.entries);
      setSum(today.sum);
      const s = await trackerService.getStreak('water', effectiveGoal);
      setStreak(s);
    } catch {
      // keep previous values; caller UI already shows loading/empty states elsewhere
    } finally {
      setLoading(false);
    }
  }, [effectiveGoal]);

  useEffect(() => {
    refetch();
    const timer=setInterval(refetch,15_000);
    return()=>clearInterval(timer);
  }, [refetch]);

  const toggleWeather = useCallback(async () => {
    const next = !weatherOn;
    setWeatherOn(next);
    await AsyncStorage.setItem(`water_weather_${dayKey}`, next ? '1' : '0');
  }, [weatherOn, dayKey]);

  const toggleWorkout = useCallback(async () => {
    const next = !workoutOn;
    setWorkoutOn(next);
    await AsyncStorage.setItem(`water_workout_${dayKey}`, next ? '1' : '0');
  }, [workoutOn, dayKey]);

  const log = useCallback(
    async (typeId: DrinkTypeId, rawMl: number) => {
      const type = getDrinkType(typeId);
      const value = Math.round(rawMl * type.hydrationFactor);
      try {
        await trackerService.log('water', value, { type: typeId, rawMl, factor: type.hydrationFactor });
        await refetch();
      } catch (e) {
        Alert.alert('Unable to log drink', (e as Error).message);
      }
    },
    [refetch]
  );

  const remove = useCallback(async (id: string) => {
    const previous = entries;
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setSum((prev) => prev - (previous.find((e) => e.id === id)?.value ?? 0));
    try {
      await trackerService.deleteEntry('water', id);
    } catch (e) {
      setEntries(previous);
      setSum(previous.reduce((a, en) => a + en.value, 0));
      Alert.alert('Unable to delete entry', (e as Error).message);
    }
  }, [entries]);

  return {
    entries,
    sum,
    percent,
    effectiveGoal,
    streak,
    weatherOn,
    workoutOn,
    toggleWeather,
    toggleWorkout,
    log,
    remove,
    loading,
    refetch,
  };
}
