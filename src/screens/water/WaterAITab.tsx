import React, { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii, shadow, spacing } from '../../theme';
import { useWaterToday } from '../../hooks/useWaterToday';
import { buildHydrationInsights } from '../../data/hydrationInsights';

const INSIGHT_STYLES: { icon: keyof typeof Ionicons.glyphMap; bg: string; color: string }[] = [
  { icon: 'water-outline', bg: '#FFEDE3', color: colors.primary },
  { icon: 'time-outline', bg: '#EAF4EC', color: colors.success },
  { icon: 'flash-outline', bg: '#EDEDF5', color: colors.navy },
];

export default function WaterAITab() {
  const { sum, effectiveGoal, streak, weatherOn, workoutOn, entries, loading } = useWaterToday();
  const [refreshTick, setRefreshTick] = useState(0);

  const insights = useMemo(
    () => buildHydrationInsights({ sum, goal: effectiveGoal, streak, weatherOn, workoutOn, entries }),
    [sum, effectiveGoal, streak, weatherOn, workoutOn, entries, refreshTick]
  );

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#FFEDE3', '#FDE3CC']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerCard}>
        <View style={styles.headerIcon}>
          <Ionicons name="sparkles" size={18} color={colors.white} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Hydration coach</Text>
          <Text style={styles.headerSubtitle}>Adapts to your day</Text>
        </View>
        <TouchableOpacity onPress={() => setRefreshTick((t) => t + 1)} disabled={loading} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="refresh" size={18} color={colors.primary} />
        </TouchableOpacity>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.spinner} />
      ) : (
        insights.map((insight, i) => {
          const style = INSIGHT_STYLES[i % INSIGHT_STYLES.length];
          return (
            <View key={i} style={[styles.card, shadow.card]}>
              <View style={[styles.iconCircle, { backgroundColor: style.bg }]}>
                <Ionicons name={style.icon} size={18} color={style.color} />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{insight.title}</Text>
                <Text style={styles.cardMessage}>{insight.message}</Text>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  spinner: {
    marginTop: spacing.xl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  cardMessage: {
    fontSize: 12.5,
    lineHeight: 19,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
