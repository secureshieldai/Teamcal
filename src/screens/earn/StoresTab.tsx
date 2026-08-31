import React, { useMemo, useState } from 'react';
import { ActionSheetIOS, Alert, Image, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
  const [menuStore, setMenuStore] = useState<typeof userAssets.assets[0]|null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteModal, setDeleteModal] = useState(false);

  const totals = useMemo(() => ({
    earnings: userAssets.assets.reduce((s, x) => s + Number(x.metrics?.earned || 0), 0),
    orders: userAssets.assets.reduce((s, x) => s + Number(x.metrics?.orders || 0), 0),
    products: userAssets.assets.reduce((s, x) => s + Number(x.metrics?.products || 0), 0),
    customers: userAssets.assets.reduce((s, x) => s + Number(x.metrics?.customers || 0), 0),
  }), [userAssets.assets]);

  const showStoreMenu = (store: typeof userAssets.assets[0]) => {
    const opts = ['Open Store','Edit Store','Duplicate Store','Unpublish Store','Delete Store','Cancel'];
    const cancel = opts.length - 1;
    const destructive = 4;
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions({ options: opts, cancelButtonIndex: cancel, destructiveButtonIndex: destructive, title: store.title }, idx => {
        if (idx === cancel) return;
        if (idx === 0) navigation.navigate('StoreDashboard', { storeId: store.id });
        else if (idx === 1) navigation.navigate('StoreDashboard', { storeId: store.id });
        else if (idx === 2) Alert.alert('Duplicate Store', 'Duplicating a store is coming soon.');
        else if (idx === 3) Alert.alert('Unpublish Store?', `"${store.title}" will be hidden from the public.`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Unpublish', style: 'destructive', onPress: async () => { try { await userAssets.remove(store.id); } catch(e) { Alert.alert('Error', (e as Error).message); } } },
        ]);
        else if (idx === 4) { setMenuStore(store); setDeleteConfirm(''); setDeleteModal(true); }
      });
    } else {
      Alert.alert(store.title, undefined, [
        { text: 'Open Store', onPress: () => navigation.navigate('StoreDashboard', { storeId: store.id }) },
        { text: 'Edit Store', onPress: () => navigation.navigate('StoreDashboard', { storeId: store.id }) },
        { text: 'Duplicate Store', onPress: () => Alert.alert('Coming soon') },
        { text: 'Unpublish Store', onPress: () => Alert.alert('Unpublish Store?', `"${store.title}" will be hidden from the public.`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Unpublish', style: 'destructive', onPress: async () => { try { await userAssets.remove(store.id); } catch(e) { Alert.alert('Error', (e as Error).message); } } },
        ]) },
        { text: 'Delete Store', style: 'destructive', onPress: () => { setMenuStore(store); setDeleteConfirm(''); setDeleteModal(true); } },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  return (
    <View style={{flex:1}}>
    <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
      <Text style={s.title}>Your Stores</Text>
      <Text style={s.subtitle}>Create online stores, add products and services,{'\n'}and start selling to your audience.</Text>

      {/* Earnings & Sales Summary */}
      <View style={s.summaryRow}>
        <View style={s.summaryCard}>
          <Text style={s.summaryValue}>${totals.earnings.toFixed(2)}</Text>
          <Text style={s.summaryLabel}>Earnings</Text>
        </View>
        <View style={s.summaryDivider}/>
        <View style={s.summaryCard}>
          <Text style={s.summaryValue}>{totals.orders}</Text>
          <Text style={s.summaryLabel}>No. of Sales</Text>
        </View>
      </View>

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
          <View key={store.id} style={[s.storeCard, shadow.soft]}>
            <TouchableOpacity
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}
              onPress={() => navigation.navigate('StoreDashboard', { storeId: store.id })}
              activeOpacity={0.8}
            >
              <Image source={{ uri: store.image || `https://picsum.photos/seed/${store.id}/200/200` }} style={s.storeLogo} />
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
            </TouchableOpacity>
            <TouchableOpacity
              style={s.menuBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => showStoreMenu(store)}
            >
              <Ionicons name="ellipsis-vertical" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
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

      {/* Delete Store Confirmation Modal */}
      <Modal visible={deleteModal} transparent animationType="fade">
        <View style={s.deleteOverlay}>
          <View style={s.deleteSheet}>
            <Text style={s.deleteTitle}>Delete this store permanently?</Text>
            <Text style={s.deleteDesc}>
              This will permanently delete <Text style={{fontWeight:'800'}}>{menuStore?.title}</Text> and may also remove its products, drafts, settings, discounts, reviews and analytics.{'\n\n'}
              Existing orders will be retained for record keeping. Pending payouts from your payment provider will continue to be processed.{'\n\n'}
              This action cannot be undone.
            </Text>
            <Text style={s.deleteConfirmLabel}>Type the store name to confirm:</Text>
            <TextInput style={s.deleteInput} value={deleteConfirm} onChangeText={setDeleteConfirm} placeholder={menuStore?.title} placeholderTextColor={colors.textMuted}/>
            <View style={{flexDirection:'row',gap:spacing.sm,marginTop:spacing.md}}>
              <TouchableOpacity style={s.deleteCancelBtn} onPress={()=>{setDeleteModal(false);setMenuStore(null);}}>
                <Text style={s.deleteCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.deleteConfirmBtn,deleteConfirm!==menuStore?.title&&{opacity:0.4}]}
                disabled={deleteConfirm!==menuStore?.title}
                onPress={async()=>{
                  if(!menuStore) return;
                  try{
                    await userAssets.remove(menuStore.id);
                    setDeleteModal(false);setMenuStore(null);
                    Alert.alert('Store deleted successfully.');
                  }catch(e){Alert.alert('Error',(e as Error).message);}
                }}
              >
                <Text style={s.deleteConfirmText}>Delete Store Permanently</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
  menuBtn: { padding: spacing.xs },
  summaryRow: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: radii.xl, marginTop: spacing.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  summaryCard: { flex: 1, alignItems: 'center', paddingVertical: spacing.md },
  summaryValue: { fontSize: 20, fontWeight: '900', color: colors.primary },
  summaryLabel: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: colors.border },
  deleteOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.lg },
  deleteSheet: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg },
  deleteTitle: { fontSize: 16, fontWeight: '800', color: '#EF4444', marginBottom: spacing.sm },
  deleteDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 20, marginBottom: spacing.md },
  deleteConfirmLabel: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  deleteInput: { backgroundColor: colors.background, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, fontSize: 13, color: colors.textPrimary },
  deleteCancelBtn: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border },
  deleteCancelText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  deleteConfirmBtn: { flex: 1.5, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radii.pill, backgroundColor: '#EF4444' },
  deleteConfirmText: { fontSize: 12, fontWeight: '800', color: '#fff' },
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
