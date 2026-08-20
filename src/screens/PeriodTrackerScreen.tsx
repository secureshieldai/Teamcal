import React, { useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import TodayTab from './periodTracker/TodayTab';
import PredictTab from './periodTracker/PredictTab';
import LogTab from './periodTracker/LogTab';
import TrendsTab from './periodTracker/TrendsTab';
import CoachTab from './periodTracker/CoachTab';
import CycleSettingsModal from '../components/periodTracker/CycleSettingsModal';
import { usePeriodTracker } from '../hooks/usePeriodTracker';
import { colors, radii, spacing, typography } from '../theme';
import type { IconName } from './periodTracker/shared';
import type { RootStackParamList } from '../navigation/types';

const TABS: { id: string; label: string; icon: IconName }[] = [
  { id: 'Today', label: 'Today', icon: 'heart-outline' },
  { id: 'Predict', label: 'Predict', icon: 'calendar-outline' },
  { id: 'Log', label: 'Log', icon: 'add' },
  { id: 'Trends', label: 'Trends', icon: 'bar-chart-outline' },
  { id: 'Coach', label: 'Coach', icon: 'sparkles-outline' },
];

export default function PeriodTrackerScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { settings, saveSettings } = usePeriodTracker();
  const [tab, setTab] = useState('Today');
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Cycle Tracking</Text>
          <Text style={styles.subtitle}>Phase-aware fasting</Text>
        </View>
      </View>

      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Ionicons name="heart" size={13} color={colors.primary} />
          <Text style={styles.badgeText}>Cycle tracking</Text>
        </View>
        <TouchableOpacity style={styles.settingsBtn} onPress={() => setSettingsOpen(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="options-outline" size={17} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        style={styles.tabsScroll}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsRow}
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <TouchableOpacity key={t.id} style={[styles.tab, active && styles.tabActive]} onPress={() => setTab(t.id)}>
              <Ionicons name={t.icon} size={16} color={active ? colors.white : colors.textSecondary} />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {tab === 'Today' && <TodayTab />}
      {tab === 'Predict' && <PredictTab />}
      {tab === 'Log' && <LogTab />}
      {tab === 'Trends' && <TrendsTab />}
      {tab === 'Coach' && <CoachTab />}

      <CycleSettingsModal visible={settingsOpen} settings={settings} onClose={() => setSettingsOpen(false)} onSave={saveSettings} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  headerText: { flex: 1 },
  title: { ...typography.h1, color: colors.navy },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, marginTop: spacing.md },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FDECE4',
    borderRadius: radii.pill,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  settingsBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsScroll: {
    flexGrow: 0,
    flexShrink: 0,
    minHeight: 64,
  },
  tabsRow: {
    minHeight: 64,
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  tab: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: radii.pill,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.card,
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: {
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '700',
    color: colors.textSecondary,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  tabTextActive: { color: colors.white },
});
