import React, { useCallback, useState } from 'react';
import {
  Alert, Image, Modal, ScrollView, Share, StyleSheet,
  Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { earnService, type EarnAsset, type StoreCustomer, type StoreOrder } from '../services/api/earn.service';
import { subscribeToAssetChanges, subscribeToStoreCommerce } from '../services/realtime';
import { colors, radii, shadow, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'StoreDashboard'>;

type StoreProduct = {
  id: string; title: string; type: string; price: number;
  image?: string; status: string; stock?: number; downloads?: number;
};

const NAV_ITEMS = [
  { key: 'overview', label: 'Overview', icon: 'grid-outline' },
  { key: 'products', label: 'Products', icon: 'cube-outline' },
  { key: 'orders', label: 'Orders', icon: 'receipt-outline' },
  { key: 'customers', label: 'Customers', icon: 'people-outline' },
  { key: 'discounts', label: 'Discounts', icon: 'pricetag-outline' },
  { key: 'shipping', label: 'Shipping', icon: 'car-outline' },
  { key: 'payments', label: 'Payments', icon: 'card-outline' },
  { key: 'settings', label: 'Store Settings', icon: 'settings-outline' },
  { key: 'customize', label: 'Store Customize', icon: 'color-palette-outline' },
  { key: 'analytics', label: 'Analytics', icon: 'stats-chart-outline' },
  { key: 'reviews', label: 'Reviews', icon: 'star-outline' },
];

const PRODUCT_TABS = ['All Products', 'Physical', 'Digital', 'Service', 'Subscription'];

export default function StoreDashboardScreen({ route, navigation }: Props) {
  const { storeId } = route.params;
  const [store, setStore] = useState<EarnAsset | null>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [customers, setCustomers] = useState<StoreCustomer[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [productTab, setProductTab] = useState('All Products');
  const [actionProduct, setActionProduct] = useState<StoreProduct | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    let active = true;
    let unsubscribe: () => void = () => undefined;
    let unsubscribeCommerce: () => void = () => undefined;
    const load = async () => {
      setLoading(true);
      try {
        const [asset, nextOrders, nextCustomers] = await Promise.all([
          earnService.getAsset(storeId), earnService.getStoreOrders(storeId), earnService.getStoreCustomers(storeId),
        ]);
        if (!active) return;
        setStore(asset);
        const raw = (asset.metadata?.products as StoreProduct[] | undefined) ?? [];
        setProducts(raw);
        setOrders(nextOrders);
        setCustomers(nextCustomers);
      } catch (e) {
        // ignore
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    subscribeToAssetChanges(({ action, asset }) => {
      if (!active || asset.id !== storeId) return;
      if (action === 'deleted') {
        setStore(null);
        setProducts([]);
        setLoading(false);
        return;
      }
      const nextStore = asset as EarnAsset;
      setStore(nextStore);
      setProducts((nextStore.metadata?.products as StoreProduct[] | undefined) ?? []);
    }).then((cleanup) => { if (active) unsubscribe = cleanup; else cleanup(); });
    subscribeToStoreCommerce(storeId, load).then((cleanup) => { if (active) unsubscribeCommerce = cleanup; else cleanup(); });
    const timer = setInterval(load, 60000);
    return () => { active = false; unsubscribe(); unsubscribeCommerce(); clearInterval(timer); };
  }, [storeId]));

  const storeUrl = store ? `${String(store.metadata?.urlSlug || store.title.toLowerCase().replace(/\s+/g, '-'))}.teamcal.store` : '';

  const shareStore = () => {
    if (storeUrl) Share.share({ message: `Check out my store: https://${storeUrl}` });
  };

  const handleProductAction = async (action: string, product: StoreProduct) => {
    setActionProduct(null);
    if (action === 'edit') navigation.navigate('AddProduct', { storeId, productId: product.id });
    else if (action === 'delete') {
      Alert.alert('Delete product?', `"${product.title}" will be permanently removed.`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive', onPress: async () => {
            try {
              const updated = products.filter(p => p.id !== product.id);
              await earnService.updateAsset(storeId, { metadata: { ...store?.metadata, products: updated } });
              setProducts(updated);
            } catch (e) { Alert.alert('Error', (e as Error).message); }
          },
        },
      ]);
    } else if (action === 'duplicate') {
      const dup: StoreProduct = { ...product, id: `p-${Date.now()}`, title: `${product.title} (Copy)` };
      const updated = [...products, dup];
      try {
        await earnService.updateAsset(storeId, { metadata: { ...store?.metadata, products: updated } });
        setProducts(updated);
      } catch (e) { Alert.alert('Error', (e as Error).message); }
    }
  };

  const filteredProducts = productTab === 'All Products'
    ? products
    : products.filter(p => p.type?.toLowerCase() === productTab.toLowerCase());

  if (!store && !loading) {
    return (
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Store</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.textSecondary }}>Store not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{store?.title ?? 'Store'}</Text>
        <View style={[s.statusPill, store?.status === 'published' ? s.statusPublished : s.statusDraft]}>
          <Text style={[s.statusPillText, store?.status === 'published' ? s.statusPublishedText : s.statusDraftText]}>
            {store?.status === 'published' ? 'Published' : 'Draft'}
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Store hero */}
        <View style={s.hero}>
          <Image
            source={{ uri: store?.image || `https://picsum.photos/seed/${storeId}/400/160` }}
            style={s.heroCover}
          />
          <View style={s.heroContent}>
            <Image
              source={{ uri: store?.image || `https://picsum.photos/seed/${storeId}/80/80` }}
              style={s.heroLogo}
            />
            <View style={{ flex: 1 }}>
              <Text style={s.heroName}>{store?.title}</Text>
              <Text style={s.heroUrl} numberOfLines={1}>{storeUrl}</Text>
            </View>
            <TouchableOpacity style={s.shareBtn} onPress={shareStore}>
              <Ionicons name="share-outline" size={14} color="#fff" />
              <Text style={s.shareBtnText}>Share Store</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Overview stats */}
        <View style={s.statsRow}>
          <StatBox label="Total Earnings" value={`$${orders.filter(order => ['paid', 'complete', 'completed'].includes(order.status)).reduce((sum, order) => sum + order.total_amount / 100, 0).toFixed(2)}`} />
          <StatBox label="Total Orders" value={String(orders.length)} />
          <StatBox label="Products" value={String(products.length)} />
          <StatBox label="Customers" value={String(customers.length)} />
        </View>

        <Text style={s.overviewLabel}>Overview (Last 30 Days)</Text>
        <TouchableOpacity style={s.viewAnalyticsBtn} onPress={() => Alert.alert('Analytics', 'Coming soon')}>
          <Text style={s.viewAnalyticsText}>View Analytics</Text>
        </TouchableOpacity>

        {/* Side nav */}
        <View style={s.navList}>
          {NAV_ITEMS.map(item => (
            <TouchableOpacity
              key={item.key}
              style={[s.navItem, activeTab === item.key && s.navItemActive]}
              onPress={() => {
                setActiveTab(item.key);
                if (!['overview', 'products', 'orders', 'customers'].includes(item.key)) Alert.alert('Coming soon', `${item.label} is not yet available.`);
              }}
            >
              <View style={[s.navIcon, activeTab === item.key && s.navIconActive]}>
                <Ionicons name={item.icon as any} size={16} color={activeTab === item.key ? colors.primary : colors.textSecondary} />
              </View>
              <Text style={[s.navItemText, activeTab === item.key && s.navItemTextActive]}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          ))}
        </View>

        {(activeTab === 'overview' || activeTab === 'products') && <>
        {/* Products section */}
        <View style={s.productsSection}>
          <View style={s.productsSectionHeader}>
            <Text style={s.productsSectionTitle}>Products</Text>
            <View style={s.productsHeaderRight}>
              <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="search-outline" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="filter-outline" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Product type tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }}>
            {PRODUCT_TABS.map(tab => (
              <TouchableOpacity
                key={tab}
                style={[s.productTab, productTab === tab && s.productTabActive]}
                onPress={() => setProductTab(tab)}
              >
                <Text style={[s.productTabText, productTab === tab && s.productTabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Product list */}
          {filteredProducts.map(product => (
            <View key={product.id} style={[s.productRow, shadow.soft]}>
              <Image
                source={{ uri: product.image || `https://picsum.photos/seed/${product.id}/80/80` }}
                style={s.productThumb}
              />
              <View style={{ flex: 1 }}>
                <Text style={s.productName} numberOfLines={1}>{product.title}</Text>
                <Text style={s.productType}>{product.type} · ${Number(product.price).toFixed(2)}</Text>
                <View style={s.productMeta}>
                  <Text style={[s.productStatus, product.status === 'published' ? s.productStatusActive : null]}>
                    {product.status === 'published' ? 'Active' : 'Draft'}
                  </Text>
                  {product.stock !== undefined && <Text style={s.productMetaText}>Stock: {product.stock}</Text>}
                  {product.downloads !== undefined && <Text style={s.productMetaText}>Downloads: {product.downloads}</Text>}
                </View>
              </View>
              <TouchableOpacity onPress={() => setActionProduct(product)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="ellipsis-vertical" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          ))}

          {filteredProducts.length === 0 && (
            <View style={s.noProducts}>
              <Ionicons name="cube-outline" size={40} color={colors.textMuted} />
              <Text style={s.noProductsText}>No products yet</Text>
            </View>
          )}
        </View>
        </>}

        {activeTab === 'orders' && (
          <View style={s.commerceSection}>
            <Text style={s.productsSectionTitle}>Orders ({orders.length})</Text>
            {orders.map(order => (
              <View key={order.id} style={[s.commerceRow, shadow.soft]}>
                <View style={{ flex: 1 }}>
                  <Text style={s.productName}>{order.buyer?.name || order.buyer?.email || 'Customer'}</Text>
                  <Text style={s.productType}>{order.items.map(item => `${item.quantity || 1}× ${item.title}`).join(', ')}</Text>
                  <Text style={s.productMetaText}>{new Date(order.created_at).toLocaleDateString()}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text style={s.productName}>{order.currency.toUpperCase()} {(order.total_amount / 100).toFixed(2)}</Text>
                  <Text style={[s.productStatus, order.status === 'paid' && s.productStatusActive]}>{order.status}</Text>
                </View>
              </View>
            ))}
            {!orders.length && <Text style={s.emptyCommerce}>No orders for this store yet.</Text>}
          </View>
        )}

        {activeTab === 'customers' && (
          <View style={s.commerceSection}>
            <Text style={s.productsSectionTitle}>Customers ({customers.length})</Text>
            {customers.map(customer => (
              <View key={customer.id} style={[s.commerceRow, shadow.soft]}>
                <Image source={{ uri: customer.avatar || `https://picsum.photos/seed/${customer.id}/80/80` }} style={s.customerAvatar} />
                <View style={{ flex: 1 }}>
                  <Text style={s.productName}>{customer.name || 'Customer'}</Text>
                  <Text style={s.productType}>{customer.email || `${customer.orders} order${customer.orders === 1 ? '' : 's'}`}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.productName}>${customer.spent.toFixed(2)}</Text>
                  <Text style={s.productMetaText}>{customer.orders} orders</Text>
                </View>
              </View>
            ))}
            {!customers.length && <Text style={s.emptyCommerce}>Customers appear after their first order.</Text>}
          </View>
        )}
      </ScrollView>

      {/* Add New Product FAB */}
      <View style={s.fab}>
        <TouchableOpacity style={s.fabBtn} onPress={() => navigation.navigate('AddProduct', { storeId })}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={s.fabBtnText}>Add New Product</Text>
        </TouchableOpacity>
      </View>

      {/* Product Actions Bottom Sheet */}
      <Modal visible={!!actionProduct} transparent animationType="slide">
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setActionProduct(null)}>
          <View style={s.actionSheet}>
            <View style={s.actionHandle} />
            {actionProduct && (
              <>
                <View style={s.actionProductHeader}>
                  <Image
                    source={{ uri: actionProduct.image || `https://picsum.photos/seed/${actionProduct.id}/60/60` }}
                    style={s.actionProductThumb}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={s.actionProductName}>{actionProduct.title}</Text>
                    <Text style={s.actionProductType}>{actionProduct.type} · ${Number(actionProduct.price).toFixed(2)}</Text>
                  </View>
                  <View style={[s.actionStatusDot, actionProduct.status === 'published' ? s.actionStatusActive : null]}>
                    <Text style={s.actionStatusText}>{actionProduct.status === 'published' ? 'Active' : 'Draft'}</Text>
                  </View>
                </View>

                {[
                  { key: 'view', label: 'View / Preview', icon: 'eye-outline' },
                  { key: 'edit', label: 'Edit', icon: 'pencil-outline' },
                  { key: 'duplicate', label: 'Duplicate', icon: 'copy-outline' },
                  { key: 'stock', label: 'Manage Stock', icon: 'layers-outline' },
                  { key: 'analytics', label: 'Analytics', icon: 'stats-chart-outline' },
                ].map(action => (
                  <TouchableOpacity
                    key={action.key}
                    style={s.actionRow}
                    onPress={() => handleProductAction(action.key, actionProduct)}
                  >
                    <Ionicons name={action.icon as any} size={20} color={colors.textPrimary} />
                    <Text style={s.actionRowText}>{action.label}</Text>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity style={[s.actionRow, s.actionRowDanger]} onPress={() => handleProductAction('delete', actionProduct)}>
                  <Ionicons name="trash-outline" size={20} color={colors.macroProtein} />
                  <Text style={[s.actionRowText, { color: colors.macroProtein }]}>Delete</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.statBox}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, gap: spacing.sm },
  headerTitle: { ...typography.h2, color: colors.textPrimary, flex: 1 },
  statusPill: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radii.pill },
  statusPublished: { backgroundColor: '#E6F9F0' },
  statusDraft: { backgroundColor: colors.background },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  statusPublishedText: { color: colors.success },
  statusDraftText: { color: colors.textMuted },
  hero: { backgroundColor: colors.card, marginBottom: spacing.sm },
  heroCover: { width: '100%', height: 120 },
  heroContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  heroLogo: { width: 52, height: 52, borderRadius: radii.lg, borderWidth: 2, borderColor: colors.white, marginTop: -26 },
  heroName: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  heroUrl: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  shareBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  statsRow: { flexDirection: 'row', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  statBox: { flex: 1, backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.sm, alignItems: 'center' },
  statValue: { fontSize: 14, fontWeight: '900', color: colors.textPrimary },
  statLabel: { fontSize: 9, color: colors.textSecondary, marginTop: 2, textAlign: 'center', fontWeight: '600' },
  overviewLabel: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, paddingHorizontal: spacing.lg },
  viewAnalyticsBtn: { alignSelf: 'flex-start', marginHorizontal: spacing.lg, marginBottom: spacing.md },
  viewAnalyticsText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  navList: { backgroundColor: colors.card, marginHorizontal: spacing.lg, borderRadius: radii.xl, marginBottom: spacing.md, overflow: 'hidden' },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  navItemActive: { backgroundColor: '#FFF8F5' },
  navIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  navIconActive: { backgroundColor: '#FFEDE3' },
  navItemText: { fontSize: 13, fontWeight: '600', color: colors.textPrimary, flex: 1 },
  navItemTextActive: { color: colors.primary },
  productsSection: { paddingHorizontal: spacing.lg, paddingBottom: 100 },
  commerceSection: { paddingHorizontal: spacing.lg, paddingBottom: 110, gap: spacing.sm },
  commerceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.md },
  customerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.border },
  emptyCommerce: { color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.xxl },
  productsSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  productsSectionTitle: { ...typography.h2, fontSize: 15, color: colors.textPrimary },
  productsHeaderRight: { flexDirection: 'row', gap: spacing.md },
  productTab: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  productTabActive: { borderColor: colors.primary, backgroundColor: '#FFF0E8' },
  productTabText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  productTabTextActive: { color: colors.primary },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.md, marginBottom: spacing.sm },
  productThumb: { width: 56, height: 56, borderRadius: radii.lg, backgroundColor: colors.border },
  productName: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  productType: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  productMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 },
  productStatus: { fontSize: 10, fontWeight: '700', color: colors.textMuted, backgroundColor: colors.background, paddingHorizontal: 6, paddingVertical: 2, borderRadius: radii.pill },
  productStatusActive: { color: colors.success, backgroundColor: '#E6F9F0' },
  productMetaText: { fontSize: 10, color: colors.textSecondary, fontWeight: '600' },
  noProducts: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm },
  noProductsText: { fontSize: 13, color: colors.textMuted },
  fab: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.lg, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.border },
  fabBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md },
  fabBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  actionSheet: { backgroundColor: colors.card, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, padding: spacing.lg, paddingBottom: 36 },
  actionHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.lg },
  actionProductHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: spacing.sm },
  actionProductThumb: { width: 48, height: 48, borderRadius: radii.md },
  actionProductName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  actionProductType: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  actionStatusDot: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.pill, backgroundColor: colors.background },
  actionStatusActive: { backgroundColor: '#E6F9F0' },
  actionStatusText: { fontSize: 10, fontWeight: '700', color: colors.success },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  actionRowDanger: { borderBottomWidth: 0 },
  actionRowText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
});
