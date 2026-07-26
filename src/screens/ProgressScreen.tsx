import React, { useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import SegmentedControl from '../components/SegmentedControl';
import MiniLineChart from '../components/charts/MiniLineChart';
import MiniBarChart from '../components/charts/MiniBarChart';
import DonutChart from '../components/charts/DonutChart';
import { colors, radii, shadow, spacing, typography } from '../theme';
import { progressTabs } from '../data/progressData';
import { useProgress } from '../hooks/useProgress';

export default function ProgressScreen() {
  const [tab, setTab] = useState(progressTabs[0]);
  const navigation = useNavigation();
  const period = tab === 'Month' ? 'Month' : 'Week';
  const { weightTrend, caloriesTrend, macrosAvg, report } = useProgress(period);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Progress</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.tabsWrap}>
        <SegmentedControl options={progressTabs} value={tab} onChange={setTab} variant="pill" />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.reportGrid}>
          <ReportStat label="Total calories" value={report.totalCalories.toLocaleString()} />
          <ReportStat label="Average steps" value={report.averageSteps.toLocaleString()} />
          <ReportStat label="Workouts" value={report.workouts.toString()} />
          <ReportStat label="Meals logged" value={report.meals.toString()} />
        </View>
        <View style={[styles.card, shadow.card]}>
          <Text style={styles.cardTitle}>Weight</Text>
          <Text style={styles.weightChange}>{weightTrend.change}</Text>
          <Text style={styles.caption}>{weightTrend.caption}</Text>
          <View style={{ marginTop: spacing.md, alignItems: 'center' }}>
            <MiniLineChart values={weightTrend.values} labels={weightTrend.labels} />
          </View>
        </View>

        <View style={[styles.card, shadow.card, { marginTop: spacing.lg }]}>
          <Text style={styles.cardTitle}>Calories</Text>
          <Text style={styles.caloriesAvg}>Avg. {caloriesTrend.average}</Text>
          <View style={{ marginTop: spacing.md }}>
            <MiniBarChart values={caloriesTrend.values} />
          </View>
        </View>

        <View style={[styles.card, shadow.card, { marginTop: spacing.lg }]}>
          <Text style={styles.cardTitle}>Macros (Avg.)</Text>
          <View style={styles.macrosRow}>
            <DonutChart segments={macrosAvg.map((m) => ({ value: m.value, color: m.color }))} />
            <View style={styles.legend}>
              {macrosAvg.map((macro) => (
                <View key={macro.key} style={styles.legendRow}>
                  <View style={[styles.legendDot, { backgroundColor: macro.color }]} />
                  <Text style={styles.legendLabel}>
                    {macro.label} {macro.value}g ({macro.percent}%)
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ReportStat({ label, value }: { label: string; value: string }) {
  return <View style={[styles.reportStat, shadow.soft]}><Text style={styles.reportValue}>{value}</Text><Text style={styles.reportLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  pageTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  tabsWrap: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  reportGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  reportStat: { width: '48%', flexGrow: 1, backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.md },
  reportValue: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  reportLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 3 },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  weightChange: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 4,
  },
  caption: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  caloriesAvg: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 4,
  },
  macrosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.xl,
  },
  legend: {
    gap: spacing.sm,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  legendLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
});
