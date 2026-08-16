import React, { useRef, useState } from 'react';
import { PanResponder, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing } from '../../../theme';
import { WizardFooter, WizardStepHeader } from './shared';

const MIN = 800;
const MAX = 4000;
const STEP = 50;
const THUMB_SIZE = 22;

type Props = {
  value: number;
  onChange: (v: number) => void;
  recommended: number;
  onBack: () => void;
  onNext: () => void;
};

export default function CalorieTargetStep({ value, onChange, recommended, onBack, onNext }: Props) {
  const trackWidthRef = useRef(0);
  const [trackWidth, setTrackWidth] = useState(0);

  const clamp = (v: number) => Math.min(MAX, Math.max(MIN, v));
  const snap = (v: number) => Math.round(v / STEP) * STEP;

  const setFromLocationX = (locationX: number) => {
    if (trackWidthRef.current <= 0) return;
    const ratio = Math.min(1, Math.max(0, locationX / trackWidthRef.current));
    onChange(clamp(snap(MIN + ratio * (MAX - MIN))));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => setFromLocationX(evt.nativeEvent.locationX),
      onPanResponderMove: (evt) => setFromLocationX(evt.nativeEvent.locationX),
    })
  ).current;

  const percent = ((clamp(value) - MIN) / (MAX - MIN)) * 100;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <WizardStepHeader title="Daily calorie target" subtitle="How many calories would you like to eat each day?" />

      <View style={[styles.card, shadow.card]}>
        <View style={styles.targetRow}>
          <Text style={styles.targetLabel}>Target</Text>
          <Text style={styles.targetValue}>{value.toLocaleString()} kcal</Text>
        </View>

        <View
          style={styles.track}
          onLayout={(e) => {
            trackWidthRef.current = e.nativeEvent.layout.width;
            setTrackWidth(e.nativeEvent.layout.width);
          }}
          {...panResponder.panHandlers}
        >
          <View style={[styles.fill, { width: `${percent}%` }]} />
          {trackWidth > 0 && <View style={[styles.thumb, { left: (percent / 100) * trackWidth - THUMB_SIZE / 2 }]} />}
        </View>

        <TextInput
          style={styles.input}
          value={String(value)}
          onChangeText={(t) => {
            const n = Number(t.replace(/[^0-9]/g, ''));
            if (Number.isFinite(n)) onChange(clamp(n));
          }}
          keyboardType="number-pad"
        />
      </View>

      <TouchableOpacity style={styles.recommendPill} onPress={() => onChange(clamp(snap(recommended)))} activeOpacity={0.8}>
        <Ionicons name="sparkles" size={16} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.recommendTitle}>Use Blaze's recommendation</Text>
          <Text style={styles.recommendSubtitle}>Calorie target calculated from your profile</Text>
        </View>
      </TouchableOpacity>

      <WizardFooter onBack={onBack} onNext={onNext} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  targetLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  targetValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textPrimary,
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.white,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  recommendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  recommendTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  recommendSubtitle: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
