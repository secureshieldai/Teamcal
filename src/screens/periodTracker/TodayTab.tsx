import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing } from '../../theme';
import { usePeriodTracker } from '../../hooks/usePeriodTracker';
import { FASTING_TIPS, PHASE_INFO, TODAY_TIPS } from '../../data/periodTrackerData';
import { SectionCard } from './shared';

const RING_SIZE = 190;
const RING_STROKE = 14;

export default function TodayTab() {
  const {
    cycleDay,
    phase,
    settings,
    inFertileWindow,
    fertileDayOfWindow,
    fertileWindowLength,
    nextPeriodInDays,
    fertileStart,
    fertileEnd,
    ovulationDay,
  } = usePeriodTracker();
  const insets = useSafeAreaInsets();

  const info = PHASE_INFO[phase];
  const percent = Math.min(100, (cycleDay / settings.cycleLength) * 100);
  const radius = (RING_SIZE - RING_STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - percent / 100);

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={[info.bgFrom, '#FFFFFF']} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={styles.ringCard}>
        <View style={{ width: RING_SIZE, height: RING_SIZE }}>
          <Svg width={RING_SIZE} height={RING_SIZE} style={{ transform: [{ rotateZ: '-90deg' }] }}>
            <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={radius} stroke={colors.border} strokeWidth={RING_STROKE} fill="none" />
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={radius}
              stroke={info.color}
              strokeWidth={RING_STROKE}
              strokeLinecap="round"
              strokeDasharray={`${circumference} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              fill="none"
            />
          </Svg>
          <View style={styles.ringCenter}>
            <Ionicons name="flower" size={22} color={info.color} />
            <Text style={styles.ringDay}>Day {cycleDay}</Text>
            <Text style={styles.ringLabel}>{info.label}</Text>
          </View>
        </View>
        <Text style={styles.vibe}>{info.vibe}</Text>
      </LinearGradient>

      {inFertileWindow && (
        <View style={styles.fertileBanner}>
          <View style={styles.fertileIcon}>
            <Ionicons name="water" size={16} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.fertileTitle}>
              Fertile window · Day {fertileDayOfWindow} of {fertileWindowLength}
            </Text>
            <Text style={styles.fertileSubtitle}>Peak fertility — use protection if not trying</Text>
          </View>
        </View>
      )}

      <View style={styles.statsRow}>
        <View style={[styles.statBox, shadow.soft]}>
          <Text style={styles.statLabel}>Next period</Text>
          <Text style={styles.statValue}>In {nextPeriodInDays}d</Text>
          <Text style={styles.statCaption}>±2 day confidence</Text>
        </View>
        <View style={[styles.statBox, shadow.soft]}>
          <Text style={styles.statLabel}>Fertile window</Text>
          <Text style={styles.statValue}>
            Day {fertileStart}–{fertileEnd}
          </Text>
          <Text style={styles.statCaption}>Ovulation on day {ovulationDay}</Text>
        </View>
      </View>

      <SectionCard title="Today's tips">
        {TODAY_TIPS[phase].map((tip) => (
          <Text key={tip} style={styles.tipRow}>
            · {tip}
          </Text>
        ))}
      </SectionCard>

      <SectionCard title={`Fasting for your ${info.label.toLowerCase()}`} icon="sparkles">
        <Text style={styles.fastingText}>{FASTING_TIPS[phase]}</Text>
      </SectionCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  ringCard: { borderRadius: radii.xl, alignItems: 'center', paddingVertical: spacing.xl },
  ringCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  ringDay: { fontSize: 30, fontWeight: '800', color: colors.textPrimary, marginTop: 6 },
  ringLabel: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  vibe: { fontSize: 14, color: colors.textSecondary, marginTop: spacing.lg, textAlign: 'center', paddingHorizontal: spacing.lg },
  fertileBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: '#FFF3EC',
    borderRadius: radii.pill,
    padding: spacing.md,
  },
  fertileIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fertileTitle: { fontSize: 13.5, fontWeight: '800', color: colors.primary },
  fertileSubtitle: { fontSize: 11.5, color: colors.textSecondary, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: spacing.md },
  statBox: { flex: 1, backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg },
  statLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  statValue: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginTop: 4 },
  statCaption: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  tipRow: { fontSize: 13, color: colors.textSecondary, marginTop: 6, lineHeight: 19 },
  fastingText: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
});
