import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Pedometer } from 'expo-sensors';
import { colors, radii, shadow, spacing } from '../../theme';
import { useApiQuery } from '../../hooks/useApiQuery';
import { trackerService, type TrackerLastNDay } from '../../services/api/tracker.service';
import { useAuth } from '../../context/AuthContext';
import { longestStreak, stepsToKcal, stepsToKm } from '../../data/stepsData';
import type { TrackerEntry } from '../../types/api';

function formatElapsed(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function StepsWalkTab() {
  const { user } = useAuth();
  const goal = user?.goal_steps ?? 8000;

  const walks = useApiQuery(() => trackerService.getEntries('walks', 50), [] as TrackerEntry[], []);
  const days90 = useApiQuery(() => trackerService.getLastN('steps', 90), [] as TrackerLastNDay[], []);

  const [status, setStatus] = useState<'idle' | 'active' | 'paused'>('idle');
  const [elapsedSec, setElapsedSec] = useState(0);
  const [sessionSteps, setSessionSteps] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const subscriptionRef = useRef<{ remove(): void } | null>(null);
  const baseStepsRef = useRef(0);

  const clearTimers = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const subscribePedometer = useCallback(async () => {
    if (Platform.OS === 'web') return;
    try {
      const available = await Pedometer.isAvailableAsync();
      if (!available) return;
      const permission = await Pedometer.getPermissionsAsync();
      if (!permission.granted) {
        const requested = await Pedometer.requestPermissionsAsync();
        if (!requested.granted) return;
      }
      subscriptionRef.current = Pedometer.watchStepCount(({ steps }) => {
        setSessionSteps(baseStepsRef.current + steps);
      });
    } catch {
      // no pedometer available — live step count just stays at the last known value
    }
  }, []);

  const startWalk = useCallback(() => {
    setStatus('active');
    setElapsedSec(0);
    setSessionSteps(0);
    baseStepsRef.current = 0;
    intervalRef.current = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    subscribePedometer();
  }, [subscribePedometer]);

  const pauseWalk = useCallback(() => {
    setStatus('paused');
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    baseStepsRef.current = sessionSteps;
  }, [sessionSteps]);

  const resumeWalk = useCallback(() => {
    setStatus('active');
    intervalRef.current = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    subscribePedometer();
  }, [subscribePedometer]);

  const finishWalk = useCallback(async () => {
    clearTimers();
    setStatus('idle');
    if (sessionSteps > 0) {
      const km = stepsToKm(sessionSteps);
      const kcal = stepsToKcal(sessionSteps);
      const avgSpm = elapsedSec > 0 ? Math.round(sessionSteps / (elapsedSec / 60)) : 0;
      try {
        await trackerService.log('walks', sessionSteps, { durationSec: elapsedSec, distanceKm: km, avgSpm, kcal });
        walks.refetch();
        Alert.alert('Walk complete', `${sessionSteps.toLocaleString()} steps · ${km.toFixed(2)} km`);
      } catch (e) {
        Alert.alert('Unable to save walk', (e as Error).message);
      }
    }
    setElapsedSec(0);
    setSessionSteps(0);
  }, [clearTimers, sessionSteps, elapsedSec, walks]);

  const walkEntries = walks.data as (TrackerEntry & { meta: { distanceKm?: number; avgSpm?: number } })[];
  const longestWalkKm = walkEntries.length ? Math.max(...walkEntries.map((w) => w.meta.distanceKm ?? 0)) : 0;
  const fastestPace = walkEntries.length ? Math.max(...walkEntries.map((w) => w.meta.avgSpm ?? 0)) : 0;
  const mostStepsInDay = days90.data.length ? Math.max(...days90.data.map((d) => d.total)) : 0;
  const bestStreak = longestStreak(days90.data, goal);

  if (status !== 'idle') {
    const km = stepsToKm(sessionSteps);
    const kcal = stepsToKcal(sessionSteps);
    const spm = elapsedSec > 0 ? Math.round(sessionSteps / (elapsedSec / 60)) : 0;

    return (
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, shadow.card]}>
          <Text style={styles.liveLabel}>LIVE WALK</Text>
          <Text style={styles.liveSteps}>{sessionSteps.toLocaleString()}</Text>
          <Text style={styles.liveStepsSub}>steps</Text>

          <View style={styles.liveStatsRow}>
            <View style={styles.liveStat}>
              <Text style={styles.liveStatValue}>{formatElapsed(elapsedSec)}</Text>
              <Text style={styles.liveStatLabel}>time</Text>
            </View>
            <View style={styles.liveStat}>
              <Text style={styles.liveStatValue}>{km.toFixed(2)}</Text>
              <Text style={styles.liveStatLabel}>km</Text>
            </View>
            <View style={styles.liveStat}>
              <Text style={styles.liveStatValue}>{kcal}</Text>
              <Text style={styles.liveStatLabel}>kcal</Text>
            </View>
            <View style={styles.liveStat}>
              <Text style={styles.liveStatValue}>{spm}</Text>
              <Text style={styles.liveStatLabel}>spm</Text>
            </View>
          </View>

          <View style={styles.liveActionsRow}>
            <TouchableOpacity style={styles.pauseButton} onPress={status === 'paused' ? resumeWalk : pauseWalk}>
              <Ionicons name={status === 'paused' ? 'play' : 'pause'} size={16} color={colors.textPrimary} />
              <Text style={styles.pauseButtonText}>{status === 'paused' ? 'Resume' : 'Pause'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.finishButton} onPress={finishWalk}>
              <Text style={styles.finishButtonText}>Finish walk</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.card, shadow.card]}>
          <View style={styles.routeHeader}>
            <Ionicons name="location-outline" size={14} color={colors.primary} />
            <Text style={styles.sectionLabel}>ROUTE</Text>
          </View>
          <View style={styles.routePlaceholder}>
            <Text style={styles.routePlaceholderText}>Enable location to record your route</Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={[styles.card, shadow.card, styles.readyCard]}>
        <View style={styles.readyIcon}>
          <Ionicons name="footsteps" size={30} color={colors.white} />
        </View>
        <Text style={styles.readyTitle}>Ready to walk</Text>
        <Text style={styles.readySubtitle}>Live tracking with pace, distance & calories</Text>
        <TouchableOpacity style={styles.startButton} onPress={startWalk}>
          <Ionicons name="play" size={16} color={colors.white} />
          <Text style={styles.startButtonText}>Start walking</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, shadow.card]}>
        <Text style={styles.sectionLabel}>PERSONAL RECORDS</Text>
        <View style={styles.recordRow}>
          <Text style={styles.recordLabel}>Longest walk</Text>
          <Text style={styles.recordValue}>{longestWalkKm.toFixed(1)} km</Text>
        </View>
        <View style={styles.recordDivider} />
        <View style={styles.recordRow}>
          <Text style={styles.recordLabel}>Most steps in a day</Text>
          <Text style={styles.recordValue}>{mostStepsInDay.toLocaleString()}</Text>
        </View>
        <View style={styles.recordDivider} />
        <View style={styles.recordRow}>
          <Text style={styles.recordLabel}>Fastest pace</Text>
          <Text style={styles.recordValue}>{fastestPace} spm</Text>
        </View>
        <View style={styles.recordDivider} />
        <View style={[styles.recordRow, { marginBottom: 0 }]}>
          <Text style={styles.recordLabel}>Longest streak</Text>
          <Text style={styles.recordValue}>{bestStreak} days</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  readyCard: {
    alignItems: 'center',
  },
  readyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  readyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  readySubtitle: {
    fontSize: 12.5,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
  startButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  sectionLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  recordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  recordLabel: {
    fontSize: 13.5,
    color: colors.textSecondary,
  },
  recordValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  recordDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  liveLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  liveSteps: {
    fontSize: 44,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  liveStepsSub: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: -4,
  },
  liveStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
  },
  liveStat: {
    alignItems: 'center',
  },
  liveStatValue: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  liveStatLabel: {
    fontSize: 10.5,
    color: colors.textMuted,
    marginTop: 2,
  },
  liveActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  pauseButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.background,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
  },
  pauseButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  finishButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
  },
  finishButtonText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.white,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.md,
  },
  routePlaceholder: {
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routePlaceholderText: {
    fontSize: 12.5,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});
