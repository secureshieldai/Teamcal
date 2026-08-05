import React, { useMemo, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import StatCard from './components/StatCard';
import DateRangeDropdown from './components/DateRangeDropdown';
import StatusBadge from './components/StatusBadge';
import { colors, radii, shadow, spacing, typography } from '../../theme';
import { type DateRangeKey } from '../../data/earnData';
import type { RootStackParamList } from '../../navigation/types';
import { useEarnAssets } from '../../hooks/useEarnAssets';
import CreateAssetModal from './components/CreateAssetModal';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList> };

const STORE_TYPES = [
  { key: 'physical', label: 'Physical Store', icon: 'cube-outline' },
  { key: 'digital', label: 'Digital Store', icon: 'download-outline' },
  { key: 'service', label: 'Service Store', icon: 'construct-outline' },
  { key: 'subscription', label: 'Subscription Store', icon: 'refresh-outline' },
  { key: 'mixed', label: 'Mixed Store', icon: 'apps-outline' },
  { key: 'course', label: 'Course Store', icon: 'school-outline' },
] as const;

export default function StoresTab({ navigation }: Props) {
  const [range, setRange] = useState<DateRangeKey>('30d');
  const [createOption,setCreateOption]=useState<(typeof STORE_TYPES)[number]|null>(null);
  const userAssets=useEarnAssets('store');

  const totals = useMemo(
    () => ({
      count: userAssets.assets.length,
      products: userAssets.assets.reduce((s, x) => s + Number(x.metrics?.products || 0), 0),
      orders: userAssets.assets.reduce((s, x) => s + Number(x.metrics?.orders || 0), 0),
      sales: userAssets.assets.reduce((s, x) => s + Number(x.metrics?.sales || 0), 0),
      earnings: userAssets.assets.reduce((s, x) => s + Number(x.metrics?.earned || 0), 0),
    }),
    [userAssets.assets]
  );

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Your Stores</Text>
          <Text style={styles.subtitle}>Create online stores, add physical, digital or subscription products and sell through your own shareable storefront.</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.audienceEngineBtn} onPress={() => navigation.navigate('AudienceEngine', { sourceLabel: 'Stores' })} activeOpacity={0.85}>
        <Ionicons name="people-circle-outline" size={16} color={colors.white} />
        <Text style={styles.audienceEngineBtnText}>Audience Engine</Text>
      </TouchableOpacity>

      <View style={styles.statsGrid}>
        <StatCard label="Total Stores" value={String(totals.count)} icon="storefront-outline" />
        <StatCard label="Total Products" value={String(totals.products)} icon="cube-outline" />
        <StatCard label="Total Orders" value={String(totals.orders)} icon="receipt-outline" />
        <StatCard label="Total Sales" value={`$${totals.sales.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon="trending-up-outline" />
        <StatCard label="Total Earnings" value={`$${totals.earnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon="cash-outline" />
        <StatCard label="Avg. Order Value" value={`$${(totals.orders ? totals.sales / totals.orders : 0).toFixed(2)}`} icon="pricetag-outline" />
      </View>

      <View style={{ marginTop: spacing.lg }}>
        <DateRangeDropdown value={range} onChange={setRange} />
      </View>

      <Text style={styles.sectionTitle}>Create a New Store</Text>
      <View style={styles.optionsGrid}>
        {STORE_TYPES.map((opt) => (
          <TouchableOpacity key={opt.key} style={styles.optionItem} onPress={() => setCreateOption(opt)}>
            <View style={styles.optionIcon}>
              <Ionicons name={opt.icon as keyof typeof Ionicons.glyphMap} size={18} color={colors.primary} />
            </View>
            <Text style={styles.optionLabel}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Your Stores</Text>
      {userAssets.error?<Text style={styles.itemMeta}>Could not load your stores: {userAssets.error}</Text>:null}
      <View style={{gap:spacing.md}}>{userAssets.assets.map(store=><TouchableOpacity key={store.id} style={[styles.itemCard,shadow.soft]} onPress={async()=>{try{await userAssets.update(store.id,{status:store.status==='published'?'draft':'published'});}catch(e){Alert.alert('Unable to update',(e as Error).message);}}}><Image source={{uri:store.image||`https://picsum.photos/seed/${store.id}/200/200`}} style={styles.storeLogo}/><View style={{flex:1}}><View style={styles.itemTopRow}><Text style={styles.itemName} numberOfLines={1}>{store.title}</Text><StatusBadge status={store.status}/></View><Text style={styles.itemMeta}>{store.subtype} store</Text><View style={styles.itemStatsRow}><Text style={styles.itemStat}>{store.metrics?.products||0} Products</Text><Text style={styles.itemStat}>{store.metrics?.orders||0} Orders</Text><Text style={styles.itemStat}>${store.metrics?.earned||0} Earned</Text></View></View></TouchableOpacity>)}{!userAssets.loading&&!userAssets.assets.length?<Text style={styles.itemMeta}>No personal stores yet. Create one above.</Text>:null}</View>
      <CreateAssetModal visible={Boolean(createOption)} heading="Create Store" subtype={createOption?.label||''} priceEnabled={false} onClose={()=>setCreateOption(null)} onSubmit={value=>userAssets.create({kind:'store',subtype:createOption?.key||'mixed',...value}).then(()=>{})}/>
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
  storeLogo: { width: 52, height: 52, borderRadius: radii.lg, backgroundColor: colors.border },
  itemTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  itemName: { fontSize: 13.5, fontWeight: '800', color: colors.textPrimary, flexShrink: 1 },
  itemMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  itemStatsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 },
  itemStat: { fontSize: 10.5, color: colors.textSecondary, fontWeight: '600' },
});
