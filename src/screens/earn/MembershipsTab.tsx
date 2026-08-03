import React, { useMemo, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import StatCard from './components/StatCard';
import DateRangeDropdown from './components/DateRangeDropdown';
import StatusBadge from './components/StatusBadge';
import { colors, radii, shadow, spacing, typography } from '../../theme';
import { memberships, membershipActivity, type DateRangeKey } from '../../data/earnData';
import type { RootStackParamList } from '../../navigation/types';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList> };

const CREATE_OPTIONS = [
  { key: 'create', label: 'Create Community', icon: 'person-add-outline' },
  { key: 'tiers', label: 'Membership Tiers', icon: 'layers-outline' },
  { key: 'trial', label: 'Free Trial Options', icon: 'timer-outline' },
  { key: 'pricing', label: 'Pricing & Billing', icon: 'card-outline' },
  { key: 'settings', label: 'Community Settings', icon: 'settings-outline' },
  { key: 'preview', label: 'Preview Community', icon: 'eye-outline' },
] as const;

const comingSoon = (feature: string) => Alert.alert('Coming soon', `${feature} isn't available yet.`);

export default function MembershipsTab({ navigation }: Props) {
  const [range, setRange] = useState<DateRangeKey>('30d');

  const totals = useMemo(
    () => ({
      communities: memberships.length,
      members: memberships.reduce((s, m) => s + m.members, 0),
      paying: memberships.reduce((s, m) => s + m.paying, 0),
      mrr: memberships.reduce((s, m) => s + m.mrr, 0),
      earnings: memberships.reduce((s, m) => s + m.earned, 0),
    }),
    []
  );

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Memberships</Text>
          <Text style={styles.subtitle}>Create paid communities, offer exclusive access and earn recurring income from your members.</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.audienceEngineBtn} onPress={() => navigation.navigate('AudienceEngine', { sourceLabel: 'Memberships' })} activeOpacity={0.85}>
        <Ionicons name="people-circle-outline" size={16} color={colors.white} />
        <Text style={styles.audienceEngineBtnText}>Audience Engine</Text>
      </TouchableOpacity>

      <View style={styles.statsGrid}>
        <StatCard label="Total Communities" value={String(totals.communities)} icon="people-outline" />
        <StatCard label="Total Members" value={totals.members.toLocaleString()} icon="person-outline" />
        <StatCard label="Paid Members" value={totals.paying.toLocaleString()} icon="card-outline" />
        <StatCard label="Monthly Recurring Revenue" value={`$${totals.mrr.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon="repeat-outline" />
        <StatCard label="Lifetime Earnings" value={`$${totals.earnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon="cash-outline" />
        <StatCard label="Renewal Rate" value="78.4%" icon="trending-up-outline" />
      </View>

      <View style={{ marginTop: spacing.lg }}>
        <DateRangeDropdown value={range} onChange={setRange} />
      </View>

      <Text style={styles.sectionTitle}>Create a Paid Community</Text>
      <View style={styles.optionsGrid}>
        {CREATE_OPTIONS.map((opt) => (
          <TouchableOpacity key={opt.key} style={styles.optionItem} onPress={() => comingSoon(opt.label)}>
            <View style={styles.optionIcon}>
              <Ionicons name={opt.icon as keyof typeof Ionicons.glyphMap} size={18} color={colors.primary} />
            </View>
            <Text style={styles.optionLabel}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Your Communities</Text>
      <View style={{ gap: spacing.md }}>
        {memberships.map((membership) => (
          <TouchableOpacity key={membership.id} style={[styles.itemCard, shadow.soft]} activeOpacity={0.85} onPress={() => comingSoon('Community dashboard')}>
            <Image source={{ uri: membership.image }} style={styles.communityImage} />
            <View style={{ flex: 1 }}>
              <View style={styles.itemTopRow}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {membership.name}
                </Text>
                <StatusBadge status={membership.status} />
              </View>
              <Text style={styles.itemMeta} numberOfLines={1}>
                {membership.category}
              </Text>
              <View style={styles.itemStatsRow}>
                <Text style={styles.itemStat}>{membership.members.toLocaleString()} Members</Text>
                <Text style={styles.itemStat}>{membership.paying.toLocaleString()} Paying</Text>
                <Text style={styles.itemStat}>${membership.mrr.toLocaleString()} MRR</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Recent Membership Activity</Text>
      <View style={[styles.card, shadow.card, { marginBottom: spacing.xxl }]}>
        {membershipActivity.map((activity, i) => (
          <View key={activity.id} style={[styles.activityRow, i === membershipActivity.length - 1 && { borderBottomWidth: 0 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.activityText} numberOfLines={1}>
                <Text style={{ fontWeight: '800' }}>{activity.name}</Text> {activity.action}
              </Text>
              <Text style={styles.activityMeta}>
                {activity.community} · {activity.date}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <StatusBadge status={activity.status} />
              {'amount' in activity && activity.amount ? <Text style={styles.activityAmount}>+${activity.amount.toFixed(2)}</Text> : null}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  headerRow: { flexDirection: 'row' },
  title: { ...typography.h2, fontSize: 18, color: colors.textPrimary },
  subtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 4, lineHeight: 17 },
  audienceEngineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.navy,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  audienceEngineBtnText: { color: colors.white, fontSize: 12, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  sectionTitle: { ...typography.h2, fontSize: 15, color: colors.textPrimary, marginTop: spacing.xl, marginBottom: spacing.md },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  optionItem: { width: '31%', backgroundColor: colors.card, borderRadius: radii.lg, paddingVertical: spacing.md, alignItems: 'center' },
  optionIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#FFEDE3', alignItems: 'center', justifyContent: 'center' },
  optionLabel: { fontSize: 10, fontWeight: '700', color: colors.textPrimary, marginTop: 6, textAlign: 'center' },
  itemCard: { flexDirection: 'row', gap: spacing.md, backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.md, alignItems: 'center' },
  communityImage: { width: 52, height: 52, borderRadius: radii.lg, backgroundColor: colors.border },
  itemTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  itemName: { fontSize: 13.5, fontWeight: '800', color: colors.textPrimary, flexShrink: 1 },
  itemMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  itemStatsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  itemStat: { fontSize: 10.5, color: colors.textSecondary, fontWeight: '600' },
  card: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  activityText: { fontSize: 12.5, color: colors.textPrimary },
  activityMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  activityAmount: { fontSize: 11.5, fontWeight: '800', color: colors.success, marginTop: 2 },
});
