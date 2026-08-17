import React, { useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateRangeDropdown from './components/DateRangeDropdown';
import StatusBadge from './components/StatusBadge';
import { colors, radii, shadow, spacing, typography } from '../../theme';
import { type DateRangeKey } from '../../data/earnData';
import type { RootStackParamList } from '../../navigation/types';
import { useEarnAssets } from '../../hooks/useEarnAssets';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList> };

export default function StoresTab({ navigation }: Props) {
  const [range, setRange] = useState<DateRangeKey>('30d');
  const userAssets = useEarnAssets('store');

  const totals = useMemo(() => ({
    earnings: userAssets.assets.reduce((s, x) => s + Number(x.metrics?.earned || 0), 0),
    orders: userAssets.assets.reduce((s, x) => s + Number(x.metrics?.orders || 0), 0),
    products: userAssets.assets.reduce((s, x) => s + Number(x.metrics?.products || 0), 0),
    customers: userAssets.assets.reduce((s, x) => s + Number(x.metrics?.customers || 0), 0),
  }), [userAssets.assets]);

  return (
    <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <Text style={s.title}>Your Stores</Text>
      <Text style={s.subtitle}>Create online stores, add products and services,{'\n'}and start selling to your audience.</Text>

      <View style={{ marginTop: spacing.md }}>
        <DateRangeDropdown value={range} onChange={setRange} />
      </View>

      {/* Create New Store CTA */}
      <TouchableOpacity style={s.createBtn} onPress={() => navigation.navigate('CreateStore')} activeOpacity={0.85}>
        <View style={s.createBtnIcon}>
          <Ionicons name="add" size={20} color={colors.primary} />
        </View>
        <Text style={s.createBtnText}>Create New Store</Text>
      </TouchableOpacity>

      {/* Store list */}
      <Text style={s.sectionTitle}>
        {userAssets.assets.length > 0 ? 'Your Stores' : 'Showcase Stores'}
      </Text>

      {userAssets.error ? <Text style={s.meta}>Could not load stores: {userAssets.error}</Text> : null}

      <View style={{ gap: spacing.md }}>
        {userAssets.assets.map(store => (
          <TouchableOpacity
            key={store.id}
            style={[s.storeCard, shadow.soft]}
            onPress={() => navigation.navigate('StoreDashboard', { storeId: store.id })}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri: store.image || `https://picsum.photos/seed/${store.id}/200/200` }}
              style={s.storeLogo}
            />
            <View style={{ flex: 1 }}>
              <View style={s.storeTopRow}>
                <Text style={s.storeName} numberOfLines={1}>{store.title}</Text>
                <StatusBadge status={store.status} />
              </View>
              <Text style={s.storeUrl} numberOfLines={1}>
                {String(store.metadata?.urlSlug || store.title.toLowerCase().replace(/\s+/g, '-'))}.teamcal.store
              </Text>
              <View style={s.storeStats}>
                <Text style={s.storeStat}>{store.metrics?.products || 0} Products</Text>
                <Text style={s.storeStatDot}>·</Text>
                <Text style={s.storeStat}>{store.metrics?.orders || 0} Orders</Text>
                <Text style={s.storeStatDot}>·</Text>
                <Text style={s.storeStat}>${Number(store.metrics?.earned || 0).toFixed(1)} Earned</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        ))}

        {!userAssets.loading && !userAssets.assets.length && (
          <View style={s.emptyState}>
            <Ionicons name="storefront-outline" size={48} color={colors.textMuted} />
            <Text style={s.emptyTitle}>No stores yet</Text>
            <Text style={s.emptySub}>Create your first store to start selling.</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: 40 },
  title: { ...typography.h2, fontSize: 20, color: colors.textPrimary },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 19 },
  sectionTitle: { ...typography.h2, fontSize: 16, color: colors.textPrimary, marginTop: spacing.xl, marginBottom: spacing.md },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
    paddingVertical: spacing.lg,
    marginTop: spacing.lg,
  },
  createBtnIcon: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  createBtnText: { fontSize: 16, fontWeight: '800', color: colors.white },
  storeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.md,
  },
  storeLogo: { width: 52, height: 52, borderRadius: radii.md, backgroundColor: colors.border },
  storeTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  storeName: { fontSize: 14, fontWeight: '800', color: colors.textPrimary, flexShrink: 1 },
  storeUrl: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  storeStats: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  storeStat: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
  storeStatDot: { fontSize: 11, color: colors.textMuted },
  meta: { fontSize: 11, color: colors.textSecondary },
  emptyState: { alignItems: 'center', paddingVertical: 40, gap: spacing.sm },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  emptySub: { fontSize: 12, color: colors.textSecondary, textAlign: 'center' },
});
