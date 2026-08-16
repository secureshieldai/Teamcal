import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing } from '../../theme';
import { useWeightTracker } from '../../hooks/useWeightTracker';
import WeightSlider from '../../components/weight/WeightSlider';

const KG_TO_LB = 2.20462;
const toLb = (value: number) => value * KG_TO_LB;
const toKg = (value: number) => value / KG_TO_LB;

function MiniTrend({ values }: { values: number[] }) {
  const width = 110;
  const height = 56;
  if (values.length < 2) return <View style={{ width, height }} />;
  const min = Math.min(...values);
  const range = Math.max(Math.max(...values) - min, 0.5);
  const coords = values.map((value, index) => ({ x: (index / (values.length - 1)) * width, y: height - 6 - ((value - min) / range) * 40 }));
  const path = coords.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
  const area = `${path} L ${width} ${height} L 0 ${height} Z`;
  const last = coords[coords.length - 1];
  return (
    <Svg width={width} height={height}>
      <Defs>
        <SvgGradient id="miniTrend" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.primary} stopOpacity="0.25" />
          <Stop offset="1" stopColor={colors.primary} stopOpacity="0" />
        </SvgGradient>
      </Defs>
      <Path d={area} fill="url(#miniTrend)" />
      <Path d={path} fill="none" stroke={colors.primary} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={last.x} cy={last.y} r="4" fill={colors.primary} stroke={colors.white} strokeWidth="2" />
    </Svg>
  );
}

export default function WeightTodayTab() {
  const { entries, latest, change, weekChange, weekAvg, log } = useWeightTracker();
  const baseline = latest?.value ?? 70;
  const [unit, setUnit] = useState<'kg' | 'lb'>('kg');
  const [kgValue, setKgValue] = useState(baseline);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => setKgValue(baseline), [latest?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const displayMetric = (value: number) => (unit === 'kg' ? value : toLb(value));
  const display = displayMetric(kgValue);
  const step = unit === 'kg' ? 0.1 : 0.2;
  const sliderMin = displayMetric(Math.max(20, baseline - 5));
  const sliderMax = displayMetric(baseline + 5);
  const trend = useMemo(() => entries.slice(0, 10).reverse().map((entry) => entry.value), [entries]);

  const save = async () => {
    setSaving(true);
    try {
      await log(Math.round(kgValue * 10) / 10, note.trim() || undefined);
      setNote('');
      Alert.alert('Weight saved', 'Your progress is up to date.');
    } catch (error) {
      Alert.alert('Could not save weight', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <View style={[styles.card, shadow.card]}>
        <View style={styles.currentTopRow}>
          <View style={styles.currentIcon}>
            <Ionicons name="scale-outline" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.currentLabel}>Current Weight</Text>
            <View style={styles.currentValueRow}>
              <Text style={styles.currentValue}>{displayMetric(baseline).toFixed(1)}</Text>
              <Text style={styles.currentUnit}>{unit}</Text>
            </View>
            {latest && (
              <View style={styles.changeRow}>
                <Ionicons name={change > 0 ? 'arrow-up' : change < 0 ? 'arrow-down' : 'remove'} size={12} color={change > 0 ? '#E0554F' : colors.success} />
                <Text style={[styles.changeText, { color: change > 0 ? '#E0554F' : colors.success }]}>{displayMetric(Math.abs(change)).toFixed(1)} {unit}</Text>
                <Text style={styles.changeSub}>vs last entry</Text>
              </View>
            )}
          </View>
          <MiniTrend values={trend} />
        </View>
      </View>

      <View style={[styles.card, shadow.card]}>
        <View style={styles.logHeader}>
          <Text style={styles.sectionTitle}>Log Your Weight</Text>
          <View style={styles.unitToggle}>
            {(['kg', 'lb'] as const).map((item) => (
              <TouchableOpacity key={item} style={[styles.unitItem, unit === item && styles.unitItemActive]} onPress={() => setUnit(item)}>
                <Text style={[styles.unitText, unit === item && styles.unitTextActive]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <WeightSlider
          value={display}
          min={sliderMin}
          max={sliderMax}
          step={step}
          unit={unit}
          onChange={(v) => setKgValue(unit === 'kg' ? v : toKg(v))}
        />

        <Text style={styles.noteLabel}>Note (optional)</Text>
        <View style={styles.noteWrap}>
          <TextInput style={styles.note} value={note} onChangeText={setNote} placeholder="Add a note..." placeholderTextColor={colors.textMuted} />
          <Ionicons name="document-text-outline" size={18} color={colors.textMuted} />
        </View>

        <TouchableOpacity style={[styles.saveButton, saving && styles.disabled]} onPress={save} disabled={saving} activeOpacity={0.85}>
          <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save Weight'}</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.card, shadow.card]}>
        <Text style={styles.sectionTitle}>This Week</Text>
        <View style={styles.weekRow}>
          <View style={styles.weekItem}>
            <Text style={styles.weekValue}>{displayMetric(baseline).toFixed(1)} <Text style={styles.weekUnit}>{unit}</Text></Text>
            <Text style={styles.weekLabel}>Latest</Text>
          </View>
          <View style={styles.weekItem}>
            <Text style={[styles.weekValue, { color: weekChange > 0 ? '#E0554F' : colors.success }]}>
              {weekChange > 0 ? '+' : ''}{displayMetric(weekChange).toFixed(1)} <Text style={styles.weekUnit}>{unit}</Text>
            </Text>
            <Text style={styles.weekLabel}>Change</Text>
          </View>
          <View style={styles.weekItem}>
            <Text style={styles.weekValue}>{displayMetric(weekAvg).toFixed(1)} <Text style={styles.weekUnit}>{unit}</Text></Text>
            <Text style={styles.weekLabel}>Avg Weight</Text>
          </View>
        </View>
      </View>

      <View style={styles.encourageCard}>
        <View style={styles.encourageIcon}>
          <Ionicons name="star" size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.encourageTitle}>{entries.length > 1 ? "You're doing great!" : 'Start your journey'}</Text>
          <Text style={styles.encourageText}>
            {entries.length > 1 ? 'Keep tracking to see more progress.' : 'Log your first check-in to start seeing your trend.'}
          </Text>
        </View>
        <Ionicons name="flag" size={22} color={colors.primary} style={{ opacity: 0.5 }} />
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
  currentTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  currentIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFEDE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  currentValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    marginTop: 2,
  },
  currentValue: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  currentUnit: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  changeText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  changeSub: {
    fontSize: 12,
    color: colors.textMuted,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  unitToggle: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: radii.pill,
    backgroundColor: colors.background,
  },
  unitItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  unitItemActive: {
    backgroundColor: colors.primary,
  },
  unitText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  unitTextActive: {
    color: colors.white,
  },
  noteLabel: {
    fontSize: 12.5,
    color: colors.textSecondary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  noteWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  note: {
    flex: 1,
    fontSize: 13.5,
    color: colors.textPrimary,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  disabled: {
    opacity: 0.6,
  },
  saveText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  weekItem: {
    alignItems: 'flex-start',
  },
  weekValue: {
    fontSize: 16.5,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  weekUnit: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  weekLabel: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 4,
  },
  encourageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#FFEDE3',
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  encourageIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  encourageTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  encourageText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
