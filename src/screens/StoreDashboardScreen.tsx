import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActionSheetIOS, Alert, Image, Modal, Platform, ScrollView, Share,
  StyleSheet, Switch, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
  image?: string; status: 'published' | 'draft'; stock?: number; sales?: number;
};
type DiscountCode = {
  id: string; code: string; type: 'percent' | 'fixed' | 'free';
  value: number; minOrder: number; uses: number; usageLimit: number;
  limitPerCustomer: boolean; active: boolean;
  startDate: string; endDate: string; appliesTo: string;
};
type ShippingZone = {
  id: string; name: string; regions: string[];
  rateType: 'free' | 'flat'; rate: number;
  deliveryMin: number; deliveryMax: number; active: boolean;
};
type StoreReview = {
  id: string; author: string; avatar?: string; rating: number;
  comment: string; date: string; product: string; status: 'published' | 'pending' | 'reported';
};

const ACCENT_COLORS = ['#FF5A1F','#6366F1','#10B981','#3B82F6','#F59E0B','#EF4444','#8B5CF6','#EC4899','#14B8A6'];
const COUNTRIES_LIST = [
  'Afghanistan','Albania','Algeria','Angola','Argentina','Australia','Austria','Bangladesh',
  'Belgium','Bolivia','Brazil','Cambodia','Cameroon','Canada','Chile','China','Colombia',
  'Congo','Croatia','Cuba','Czech Republic','Denmark','Ecuador','Egypt','Ethiopia',
  'Finland','France','Germany','Ghana','Greece','Guatemala','Hungary','India','Indonesia',
  'Iran','Iraq','Ireland','Israel','Italy','Ivory Coast','Jamaica','Japan','Jordan','Kenya',
  'Malaysia','Mexico','Morocco','Mozambique','Myanmar','Netherlands','New Zealand','Nigeria',
  'Norway','Pakistan','Peru','Philippines','Poland','Portugal','Romania','Russia','Rwanda',
  'Saudi Arabia','Senegal','Singapore','South Africa','South Korea','Spain','Sri Lanka',
  'Sudan','Sweden','Switzerland','Tanzania','Thailand','Turkey','Uganda','Ukraine',
  'United Arab Emirates','United Kingdom','United States','Venezuela','Vietnam','Zambia','Zimbabwe',
];

function genCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function StoreDashboardScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { storeId } = route.params;
  const [store, setStore] = useState<EarnAsset | null>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [orders, setOrders] = useState<StoreOrder[]>([]);
  const [customers, setCustomers] = useState<StoreCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [productFilter, setProductFilter] = useState<'all'|'published'|'draft'|'low'>('all');
  const [productSearch, setProductSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState<'all'|'pending'|'paid'|'processing'>('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerSegment, setCustomerSegment] = useState<'all'|'new'|'returning'|'vip'|'inactive'>('all');
  const [segmentDropdown, setSegmentDropdown] = useState(false);
  const [discountFilter, setDiscountFilter] = useState<'active'|'scheduled'|'expired'>('active');
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);
  const [freeShipping, setFreeShipping] = useState(false);
  const [freeShippingMin, setFreeShippingMin] = useState('');
  const [localPickup, setLocalPickup] = useState(false);
  const [reviews, setReviews] = useState<StoreReview[]>([]);
  const [reviewFilter, setReviewFilter] = useState<'all'|'pending'|'published'|'reported'>('all');
  const [analyticsTab, setAnalyticsTab] = useState<'sales'|'traffic'|'products'>('sales');
  const [actionProduct, setActionProduct] = useState<StoreProduct | null>(null);
  // Create Discount modal
  const [discountModal, setDiscountModal] = useState(false);
  const [dcCode, setDcCode] = useState('');
  const [dcType, setDcType] = useState<'percent'|'fixed'|'free'>('percent');
  const [dcValue, setDcValue] = useState('');
  const [dcAppliesTo, setDcAppliesTo] = useState('All products');
  const [dcMinOrder, setDcMinOrder] = useState('');
  const [dcUsageLimit, setDcUsageLimit] = useState('');
  const [dcLimitPerCustomer, setDcLimitPerCustomer] = useState(false);
  const [dcActive, setDcActive] = useState(true);
  // Add Shipping Zone modal
  const [shippingModal, setShippingModal] = useState(false);
  const [szName, setSzName] = useState('');
  const [szRegions, setSzRegions] = useState<string[]>([]);
  const [szRateType, setSzRateType] = useState<'flat'|'free'>('flat');
  const [szRate, setSzRate] = useState('');
  const [szDeliveryMin, setSzDeliveryMin] = useState('');
  const [szDeliveryMax, setSzDeliveryMax] = useState('');
  const [szActive, setSzActive] = useState(true);
  const [szCountrySearch, setSzCountrySearch] = useState('');
  const [szCountryModal, setSzCountryModal] = useState(false);
  // Settings
  const [settingsName, setSettingsName] = useState('');
  const [settingsTagline, setSettingsTagline] = useState('');
  const [settingsDesc, setSettingsDesc] = useState('');
  const [settingsEmail, setSettingsEmail] = useState('');
  const [settingsSaving, setSettingsSaving] = useState(false);
  // Review reply
  const [replyModal, setReplyModal] = useState(false);
  const [replyTarget, setReplyTarget] = useState<StoreReview | null>(null);
  const [replyText, setReplyText] = useState('');

  useFocusEffect(useCallback(() => {
    let active = true;
    let unsub1: () => void = () => undefined;
    let unsub2: () => void = () => undefined;
    const load = async () => {
      setLoading(true);
      try {
        const [asset, ord, cust] = await Promise.all([
          earnService.getAsset(storeId),
          earnService.getStoreOrders(storeId),
          earnService.getStoreCustomers(storeId),
        ]);
        if (!active) return;
        setStore(asset);
        setProducts((asset.metadata?.products as StoreProduct[] | undefined) ?? []);
        setOrders(ord);
        setCustomers(cust);
      } catch { /* ignore */ }
      finally { if (active) setLoading(false); }
    };
    load();
    subscribeToAssetChanges(({ action, asset }) => {
      if (!active || asset.id !== storeId) return;
      if (action === 'deleted') { setStore(null); setProducts([]); setLoading(false); return; }
      const s = asset as EarnAsset;
      setStore(s);
      setProducts((s.metadata?.products as StoreProduct[] | undefined) ?? []);
    }).then(c => { if (active) unsub1 = c; else c(); });
    subscribeToStoreCommerce(storeId, load).then(c => { if (active) unsub2 = c; else c(); });
    const t = setInterval(load, 60000);
    return () => { active = false; unsub1(); unsub2(); clearInterval(t); };
  }, [storeId]));

  useEffect(() => {
    if (!store) return;
    setDiscounts((store.metadata?.discounts as DiscountCode[] | undefined) ?? []);
    setShippingZones((store.metadata?.shippingZones as ShippingZone[] | undefined) ?? []);
    setReviews((store.metadata?.reviews as StoreReview[] | undefined) ?? []);
    setFreeShipping(Boolean(store.metadata?.freeShipping));
    setFreeShippingMin(String(store.metadata?.freeShippingMin || ''));
    setLocalPickup(Boolean(store.metadata?.localPickup));
    setSettingsName(store.title || '');
    setSettingsTagline(String(store.metadata?.tagline || ''));
    setSettingsDesc(String(store.metadata?.description || ''));
    setSettingsEmail(String(store.metadata?.supportEmail || ''));
  }, [store?.id]);

  const storeUrl = store ? `${String(store.metadata?.urlSlug || store.title.toLowerCase().replace(/\s+/g, '-'))}.teamcal.store` : '';
  const accentColor = String(store?.metadata?.accentColor || colors.primary);

  const paidOrders = useMemo(() => orders.filter(o => ['paid','complete','completed'].includes(o.status)), [orders]);
  const totalRevenue = useMemo(() => paidOrders.reduce((s, o) => s + o.total_amount / 100, 0), [paidOrders]);
  const avgOrder = useMemo(() => orders.length ? totalRevenue / paidOrders.length : 0, [totalRevenue, paidOrders]);
  const returningCustomers = useMemo(() => customers.filter(c => c.orders > 1).length, [customers]);

  const filteredProducts = useMemo(() => {
    let list = products;
    if (productFilter === 'published') list = list.filter(p => p.status === 'published');
    else if (productFilter === 'draft') list = list.filter(p => p.status === 'draft');
    else if (productFilter === 'low') list = list.filter(p => (p.stock ?? 10) < 5);
    if (productSearch.trim()) list = list.filter(p => p.title.toLowerCase().includes(productSearch.toLowerCase()));
    return list;
  }, [products, productFilter, productSearch]);

  const filteredOrders = useMemo(() => {
    let list = orders;
    if (orderFilter !== 'all') list = list.filter(o => o.status === orderFilter || (orderFilter === 'processing' && o.status === 'processing'));
    if (orderSearch.trim()) list = list.filter(o => (o.buyer?.name || o.buyer?.email || '').toLowerCase().includes(orderSearch.toLowerCase()));
    return list;
  }, [orders, orderFilter, orderSearch]);

  const filteredCustomers = useMemo(() => {
    let list = customers;
    if (customerSegment === 'returning') list = list.filter(c => c.orders > 1);
    else if (customerSegment === 'new') list = list.filter(c => c.orders === 1);
    else if (customerSegment === 'vip') list = list.filter(c => c.spent >= 100);
    else if (customerSegment === 'inactive') list = list.filter(c => c.orders < 1);
    if (customerSearch.trim()) list = list.filter(c => (c.name || c.email || '').toLowerCase().includes(customerSearch.toLowerCase()));
    return list;
  }, [customers, customerSegment, customerSearch]);

  const filteredDiscounts = useMemo(() => {
    const now = new Date();
    if (discountFilter === 'active') return discounts.filter(d => d.active && (!d.endDate || new Date(d.endDate) >= now));
    if (discountFilter === 'scheduled') return discounts.filter(d => d.startDate && new Date(d.startDate) > now);
    return discounts.filter(d => d.endDate && new Date(d.endDate) < now);
  }, [discounts, discountFilter]);

  const filteredReviews = useMemo(() => {
    if (reviewFilter === 'all') return reviews;
    return reviews.filter(r => r.status === reviewFilter);
  }, [reviews, reviewFilter]);

  const ratingAvg = useMemo(() => reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0, [reviews]);

  const handleProductAction = async (action: string, product: StoreProduct) => {
    setActionProduct(null);
    if (action === 'edit') navigation.navigate('AddProduct', { storeId, productId: product.id });
    else if (action === 'duplicate') {
      const dup: StoreProduct = { ...product, id: `p-${Date.now()}`, title: `${product.title} (Copy)` };
      const updated = [...products, dup];
      try { await earnService.updateAsset(storeId, { metadata: { ...store?.metadata, products: updated } }); setProducts(updated); }
      catch (e) { Alert.alert('Error', (e as Error).message); }
    } else if (action === 'unpublish') {
      const updated = products.map(p => p.id === product.id ? { ...p, status: 'draft' as const } : p);
      try { await earnService.updateAsset(storeId, { metadata: { ...store?.metadata, products: updated } }); setProducts(updated); }
      catch (e) { Alert.alert('Error', (e as Error).message); }
    } else if (action === 'delete') {
      Alert.alert('Delete product?', `"${product.title}" will be permanently removed.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => {
          const updated = products.filter(p => p.id !== product.id);
          try { await earnService.updateAsset(storeId, { metadata: { ...store?.metadata, products: updated } }); setProducts(updated); }
          catch (e) { Alert.alert('Error', (e as Error).message); }
        }},
      ]);
    }
  };

  const showProductMenu = (product: StoreProduct) => {
    const opts = ['Edit', 'Duplicate', product.status === 'published' ? 'Unpublish' : 'Publish', 'Delete', 'Cancel'];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: opts, cancelButtonIndex: 4, destructiveButtonIndex: 3, title: product.title },
        i => { if (i === 0) handleProductAction('edit', product); else if (i === 1) handleProductAction('duplicate', product); else if (i === 2) handleProductAction('unpublish', product); else if (i === 3) handleProductAction('delete', product); },
      );
    } else { setActionProduct(product); }
  };

  const showReviewMenu = (review: StoreReview) => {
    Alert.alert(review.author, undefined, [
      { text: 'View details', onPress: () => {} },
      { text: 'Reply to review', onPress: () => { setReplyTarget(review); setReplyText(''); setReplyModal(true); } },
      { text: 'Report review', onPress: () => Alert.alert('Reported', 'This review has been flagged for moderation.') },
      { text: 'Hide from store', style: 'destructive', onPress: async () => {
        const updated = reviews.map(r => r.id === review.id ? { ...r, status: 'pending' as const } : r);
        try { await earnService.updateAsset(storeId, { metadata: { ...store?.metadata, reviews: updated } }); setReviews(updated); }
        catch (e) { Alert.alert('Error', (e as Error).message); }
      }},
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const saveShipping = async () => {
    try {
      await earnService.updateAsset(storeId, {
        metadata: { ...store?.metadata, freeShipping, freeShippingMin: parseFloat(freeShippingMin) || 0, localPickup },
      });
    } catch (e) { Alert.alert('Error', (e as Error).message); }
  };

  const createDiscount = async () => {
    if (!dcCode.trim() || (dcType !== 'free' && !dcValue.trim())) { Alert.alert('Please fill in required fields.'); return; }
    const newDc: DiscountCode = {
      id: `dc-${Date.now()}`, code: dcCode.trim().toUpperCase(), type: dcType,
      value: parseFloat(dcValue) || 0, minOrder: parseFloat(dcMinOrder) || 0,
      uses: 0, usageLimit: parseInt(dcUsageLimit) || 0,
      limitPerCustomer: dcLimitPerCustomer, active: dcActive,
      startDate: new Date().toISOString(), endDate: '', appliesTo: dcAppliesTo,
    };
    const updated = [...discounts, newDc];
    try {
      await earnService.updateAsset(storeId, { metadata: { ...store?.metadata, discounts: updated } });
      setDiscounts(updated); setDiscountModal(false);
      setDcCode(''); setDcValue(''); setDcMinOrder(''); setDcUsageLimit(''); setDcLimitPerCustomer(false); setDcActive(true); setDcType('percent');
    } catch (e) { Alert.alert('Error', (e as Error).message); }
  };

  const addShippingZone = async () => {
    if (!szName.trim()) { Alert.alert('Zone name is required.'); return; }
    const newZone: ShippingZone = {
      id: `sz-${Date.now()}`, name: szName.trim(), regions: szRegions,
      rateType: szRateType, rate: parseFloat(szRate) || 0,
      deliveryMin: parseInt(szDeliveryMin) || 1, deliveryMax: parseInt(szDeliveryMax) || 7, active: szActive,
    };
    const updated = [...shippingZones, newZone];
    try {
      await earnService.updateAsset(storeId, { metadata: { ...store?.metadata, shippingZones: updated } });
      setShippingZones(updated); setShippingModal(false);
      setSzName(''); setSzRegions([]); setSzRate(''); setSzDeliveryMin(''); setSzDeliveryMax(''); setSzActive(true); setSzRateType('flat');
    } catch (e) { Alert.alert('Error', (e as Error).message); }
  };

  const deleteShippingZone = (zone: ShippingZone) => {
    Alert.alert('Delete zone?', `Delete "${zone.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const updated = shippingZones.filter(z => z.id !== zone.id);
        try { await earnService.updateAsset(storeId, { metadata: { ...store?.metadata, shippingZones: updated } }); setShippingZones(updated); }
        catch (e) { Alert.alert('Error', (e as Error).message); }
      }},
    ]);
  };

  const deleteDiscount = (dc: DiscountCode) => {
    Alert.alert('Delete discount?', `Delete "${dc.code}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const updated = discounts.filter(d => d.id !== dc.id);
        try { await earnService.updateAsset(storeId, { metadata: { ...store?.metadata, discounts: updated } }); setDiscounts(updated); }
        catch (e) { Alert.alert('Error', (e as Error).message); }
      }},
    ]);
  };

  const toggleDiscountActive = async (dc: DiscountCode) => {
    const updated = discounts.map(d => d.id === dc.id ? { ...d, active: !d.active } : d);
    try { await earnService.updateAsset(storeId, { metadata: { ...store?.metadata, discounts: updated } }); setDiscounts(updated); }
    catch (e) { Alert.alert('Error', (e as Error).message); }
  };

  const saveSettings = async () => {
    setSettingsSaving(true);
    try {
      await earnService.updateAsset(storeId, { title: settingsName.trim() || store?.title, metadata: { ...store?.metadata, tagline: settingsTagline, description: settingsDesc, supportEmail: settingsEmail } });
      setStore(s => s ? { ...s, title: settingsName.trim() || s.title, metadata: { ...s.metadata, tagline: settingsTagline, description: settingsDesc, supportEmail: settingsEmail } } as EarnAsset : null);
      Alert.alert('Saved', 'Store settings updated.');
    } catch (e) { Alert.alert('Error', (e as Error).message); }
    finally { setSettingsSaving(false); }
  };

  const deleteStore = () => {
    Alert.alert('Delete Store', `This will permanently delete "${store?.title}" and all its data. This action cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await earnService.deleteAsset(storeId); navigation.goBack(); }
        catch (e) { Alert.alert('Error', (e as Error).message); }
      }},
    ]);
  };

  if (!store && !loading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Store</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}>
          <Text style={{ color:colors.textSecondary }}>Store not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isSection = activeTab !== 'overview';
  const fabHeight = spacing.md * 2 + 46 + insets.bottom;

  // ── Section sub-header (used in every non-overview screen) ──
  const SectionHeader = ({ title, right }: { title?: string; right?: React.ReactNode }) => (
    <View style={s.sectionHeader}>
      <TouchableOpacity onPress={() => setActiveTab('overview')} hitSlop={{ top:8,bottom:8,left:8,right:8 }} style={s.sectionBack}>
        <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        <Text style={s.sectionBackText} numberOfLines={1}>{store?.title ?? 'Store'}</Text>
      </TouchableOpacity>
      <View style={{ flexDirection:'row', gap: spacing.md, alignItems:'center' }}>
        {right}
        <TouchableOpacity hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
          <Ionicons name="search-outline" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
          <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  // ── Overview ──
  const renderOverview = () => (
    <>
      {/* Hero */}
      <View style={s.hero}>
        <Image source={{ uri: store?.image || `https://picsum.photos/seed/${storeId}/400/220` }} style={s.heroCover} resizeMode="cover" />
        <View style={s.heroRow}>
          <Image source={{ uri: store?.image || `https://picsum.photos/seed/${storeId}/80/80` }} style={s.heroLogo} />
          <View style={{ flex:1 }}>
            <Text style={s.heroName}>{store?.title}</Text>
            <Text style={s.heroUrl} numberOfLines={1}>{storeUrl}</Text>
          </View>
          <TouchableOpacity style={s.shareBtn} onPress={() => Share.share({ message: `Check out my store: https://${storeUrl}` })}>
            <Ionicons name="share-outline" size={13} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      <View style={s.statsGrid}>
        <StatCard label="Earnings" value={`$${totalRevenue.toFixed(0)}`} color={colors.primary} icon="cash-outline" />
        <StatCard label="Orders" value={String(orders.length)} color="#3B82F6" icon="receipt-outline" />
        <StatCard label="Products" value={String(products.length)} color="#10B981" icon="cube-outline" />
        <StatCard label="Customers" value={String(customers.length)} color="#F59E0B" icon="people-outline" />
      </View>

      {/* Recent orders */}
      {orders.length > 0 && (
        <View style={s.card}>
          <View style={s.rowBetween}>
            <Text style={s.cardTitle}>Recent orders</Text>
            <TouchableOpacity onPress={() => setActiveTab('orders')}><Text style={[s.linkText,{color:colors.primary}]}>View all</Text></TouchableOpacity>
          </View>
          {orders.slice(0, 3).map(o => (
            <View key={o.id} style={[s.rowBetween, { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <View style={{ flex:1 }}>
                <Text style={s.bodyBold}>#{o.id.slice(0,6)}</Text>
                <Text style={s.bodySmall}>{o.buyer?.name || o.buyer?.email || 'Customer'}</Text>
              </View>
              <Text style={[s.bodyBold,{marginRight:spacing.sm}]}>${(o.total_amount/100).toFixed(2)}</Text>
              <StatusChip status={o.status} />
            </View>
          ))}
        </View>
      )}

      {/* Top products */}
      {products.length > 0 && (
        <View style={s.card}>
          <View style={s.rowBetween}>
            <Text style={s.cardTitle}>Top Products</Text>
            <TouchableOpacity onPress={() => setActiveTab('products')}><Text style={[s.linkText,{color:colors.primary}]}>View all</Text></TouchableOpacity>
          </View>
          {products.slice(0, 4).map(p => (
            <View key={p.id} style={[s.rowBetween, { paddingVertical: 8, gap: spacing.sm }]}>
              <Image source={{ uri: p.image || `https://picsum.photos/seed/${p.id}/80/80` }} style={s.productThumb} />
              <Text style={[s.bodyBold,{flex:1}]} numberOfLines={1}>{p.title}</Text>
              <Text style={[s.bodyBold,{color:colors.primary}]}>${Number(p.price).toFixed(2)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Nav list */}
      <View style={s.navCard}>
        {[
          { key:'products', label:'Products', icon:'cube-outline', count: products.length },
          { key:'orders', label:'Orders', icon:'receipt-outline', count: orders.length },
          { key:'customers', label:'Customers', icon:'people-outline', count: customers.length },
          { key:'discounts', label:'Discounts', icon:'pricetag-outline', count: discounts.length },
          { key:'shipping', label:'Shipping', icon:'car-outline', count: shippingZones.length },
          { key:'payments', label:'Payments', icon:'card-outline' },
          { key:'settings', label:'Store Settings', icon:'settings-outline' },
          { key:'customize', label:'Store Customize', icon:'color-palette-outline' },
          { key:'analytics', label:'Analytics', icon:'stats-chart-outline' },
          { key:'reviews', label:'Reviews', icon:'star-outline', count: reviews.length },
        ].map((item, i, arr) => (
          <TouchableOpacity key={item.key} style={[s.navItem, i < arr.length-1 && { borderBottomWidth:1, borderBottomColor:colors.border }]} onPress={() => setActiveTab(item.key)}>
            <View style={s.navIconBox}>
              <Ionicons name={item.icon as any} size={17} color={colors.textSecondary} />
            </View>
            <Text style={s.navItemLabel}>{item.label}</Text>
            <View style={{ flexDirection:'row', alignItems:'center', gap: spacing.sm }}>
              {item.count !== undefined && <Text style={s.navItemCount}>{item.count}</Text>}
              <Ionicons name="chevron-forward" size={15} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </>
  );

  // ── Products ──
  const renderProducts = () => (
    <>
      <SectionHeader right={
        <TouchableOpacity hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
          <Ionicons name="options-outline" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      } />
      <View style={s.searchRow}>
        <Ionicons name="search-outline" size={16} color={colors.textMuted} style={{ marginRight: 6 }} />
        <TextInput style={s.searchInput} value={productSearch} onChangeText={setProductSearch} placeholder="Search products" placeholderTextColor={colors.textMuted} />
        {productSearch ? <TouchableOpacity onPress={() => setProductSearch('')}><Ionicons name="close-circle" size={16} color={colors.textMuted} /></TouchableOpacity> : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
        {([['all','All'],['published','Published'],['draft','Draft'],['low','Low stock']] as [string,string][]).map(([k,l]) => (
          <TouchableOpacity key={k} style={[s.filterPill, productFilter===k && s.filterPillActive]} onPress={() => setProductFilter(k as any)}>
            <Text style={[s.filterPillText, productFilter===k && s.filterPillTextActive]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={s.section}>
        {filteredProducts.map(p => (
          <View key={p.id} style={[s.productRow, shadow.soft]}>
            <Image source={{ uri: p.image || `https://picsum.photos/seed/${p.id}/80/80` }} style={s.productImg} />
            <View style={{ flex:1 }}>
              <Text style={s.bodyBold} numberOfLines={1}>{p.title}</Text>
              <Text style={s.priceText}>${Number(p.price).toFixed(2)}</Text>
              <View style={{ flexDirection:'row', gap: spacing.xs, marginTop: 3 }}>
                <ProductStatusChip status={p.status} stock={p.stock} />
                {p.stock !== undefined && <Text style={s.bodyMini}>Stock: {p.stock}</Text>}
                {p.sales !== undefined && <Text style={s.bodyMini}>Sales: {p.sales}</Text>}
              </View>
            </View>
            <TouchableOpacity onPress={() => showProductMenu(p)} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
              <Ionicons name="ellipsis-horizontal" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        ))}
        {!filteredProducts.length && <EmptyState icon="cube-outline" title="No products" sub="Add products to start selling." />}
      </View>
    </>
  );

  // ── Orders ──
  const renderOrders = () => {
    const pending = orders.filter(o => o.status === 'pending').length;
    const processing = orders.filter(o => o.status === 'processing').length;
    const completed = orders.filter(o => ['paid','complete','completed'].includes(o.status)).length;
    return (
      <>
        <SectionHeader />
        <View style={s.searchRow}>
          <Ionicons name="search-outline" size={16} color={colors.textMuted} style={{ marginRight:6 }} />
          <TextInput style={s.searchInput} value={orderSearch} onChangeText={setOrderSearch} placeholder="Search orders" placeholderTextColor={colors.textMuted} />
        </View>
        <View style={s.statsRow4}>
          {[['Total',orders.length,'#6B7280'],['Pending',pending,'#F59E0B'],['Processing',processing,'#3B82F6'],['Completed',completed,'#10B981']].map(([l,v,c]) => (
            <View key={String(l)} style={s.stat4Box}>
              <Text style={[s.stat4Val,{color:c as string}]}>{v}</Text>
              <Text style={s.stat4Label}>{l}</Text>
            </View>
          ))}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
          {([['all','All'],['pending','Pending'],['paid','Paid'],['processing','Processing']] as [string,string][]).map(([k,l]) => (
            <TouchableOpacity key={k} style={[s.filterPill, orderFilter===k && s.filterPillActive]} onPress={() => setOrderFilter(k as any)}>
              <Text style={[s.filterPillText, orderFilter===k && s.filterPillTextActive]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={s.section}>
          {filteredOrders.map(o => (
            <View key={o.id} style={[s.orderRow, shadow.soft]}>
              <View style={s.rowBetween}>
                <Text style={s.bodyBold}>#{o.id.slice(0,6)}</Text>
                <Text style={s.bodySmall}>{new Date(o.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</Text>
              </View>
              <Text style={s.bodyMuted}>{o.buyer?.name || 'Customer'}</Text>
              <Text style={s.bodySmall} numberOfLines={1}>{o.buyer?.email}</Text>
              <View style={[s.rowBetween,{marginTop:6}]}>
                <Text style={s.bodySmall} numberOfLines={1}>{o.items.map(i => i.title).join(', ')}</Text>
                <View style={{ flexDirection:'row', alignItems:'center', gap: spacing.sm }}>
                  <Text style={s.bodyBold}>${(o.total_amount/100).toFixed(2)}</Text>
                  <StatusChip status={o.status} />
                </View>
              </View>
            </View>
          ))}
          {!filteredOrders.length && <EmptyState icon="receipt-outline" title="No orders yet" sub="Orders will appear here once customers start buying." />}
        </View>
      </>
    );
  };

  // ── Customers ──
  const renderCustomers = () => (
    <>
      <SectionHeader right={
        <TouchableOpacity hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
          <Ionicons name="options-outline" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      } />
      <View style={s.statsRow2}>
        <View style={s.stat2Box}><Text style={s.stat2Val}>{customers.length}</Text><Text style={s.stat2Label}>Customers</Text></View>
        <View style={[s.stat2Box,{borderLeftWidth:1,borderLeftColor:colors.border}]}>
          <Text style={s.stat2Val}>{returningCustomers}</Text><Text style={s.stat2Label}>Returning</Text>
        </View>
      </View>
      <View style={s.searchRow}>
        <Ionicons name="search-outline" size={16} color={colors.textMuted} style={{ marginRight:6 }} />
        <TextInput style={s.searchInput} value={customerSearch} onChangeText={setCustomerSearch} placeholder="Search customers" placeholderTextColor={colors.textMuted} />
      </View>
      <View style={s.section}>
        <TouchableOpacity style={s.segmentBtn} onPress={() => setSegmentDropdown(v => !v)}>
          <Text style={s.segmentBtnText}>{{ all:'All customers', new:'New Customers', returning:'Returning Customers', vip:'VIP / Top Spenders', inactive:'Inactive Customers' }[customerSegment]}</Text>
          <Ionicons name={segmentDropdown ? 'chevron-up' : 'chevron-down'} size={15} color={colors.textSecondary} />
        </TouchableOpacity>
        {segmentDropdown && (
          <View style={s.segmentDropdown}>
            {([['all','All Customers'],['new','New Customers'],['returning','Returning Customers'],['vip','VIP / Top Spenders'],['inactive','Inactive Customers']] as [string,string][]).map(([k,l]) => (
              <TouchableOpacity key={k} style={s.segmentOption} onPress={() => { setCustomerSegment(k as any); setSegmentDropdown(false); }}>
                <Text style={[s.segmentOptionText, customerSegment===k && { color:colors.primary }]}>{l}</Text>
                {customerSegment===k && <Ionicons name="checkmark" size={16} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        )}
        {filteredCustomers.map(c => (
          <View key={c.id} style={[s.customerRow, shadow.soft]}>
            <Image source={{ uri: c.avatar || `https://picsum.photos/seed/${c.id}/80/80` }} style={s.avatar} />
            <View style={{ flex:1 }}>
              <Text style={s.bodyBold}>{c.name || 'Customer'}</Text>
              <Text style={s.bodySmall}>{c.email}</Text>
              <Text style={s.bodyMini}>{c.orders} order{c.orders!==1?'s':''} · ${c.spent.toFixed(2)} spent</Text>
            </View>
            <TouchableOpacity hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
              <Ionicons name="chatbubble-outline" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        ))}
        {!filteredCustomers.length && <EmptyState icon="people-outline" title="No customers yet" sub="Customers appear after their first order." />}
      </View>
    </>
  );

  // ── Discounts ──
  const renderDiscounts = () => (
    <>
      <SectionHeader right={
        <TouchableOpacity style={s.createBtn} onPress={() => { setDcCode(''); setDcValue(''); setDcMinOrder(''); setDcUsageLimit(''); setDcLimitPerCustomer(false); setDcActive(true); setDcType('percent'); setDiscountModal(true); }}>
          <Ionicons name="add" size={14} color={colors.primary} />
          <Text style={s.createBtnText}>Create Discount</Text>
        </TouchableOpacity>
      } />
      <View style={s.section}>
        <Text style={s.sectionCount}>{filteredDiscounts.length} {discountFilter.charAt(0).toUpperCase()+discountFilter.slice(1)} discounts</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[s.filterRow,{marginBottom:0}]}>
          {(['active','scheduled','expired'] as const).map(k => (
            <TouchableOpacity key={k} style={[s.filterPill, discountFilter===k && s.filterPillActive]} onPress={() => setDiscountFilter(k)}>
              <Text style={[s.filterPillText, discountFilter===k && s.filterPillTextActive]}>{k.charAt(0).toUpperCase()+k.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {filteredDiscounts.map(dc => (
          <View key={dc.id} style={[s.discountCard, shadow.soft]}>
            <View style={{ flex:1 }}>
              <View style={s.rowBetween}>
                <Text style={s.bodyBold}>{dc.code}</Text>
                <TouchableOpacity onPress={() => { const opts=['Copy code','Edit','Delete','Cancel']; if(Platform.OS==='ios'){ActionSheetIOS.showActionSheetWithOptions({options:opts,cancelButtonIndex:3,destructiveButtonIndex:2},i=>{if(i===2)deleteDiscount(dc);});}else{Alert.alert(dc.code,undefined,[{text:'Copy code'},{text:'Delete',style:'destructive',onPress:()=>deleteDiscount(dc)},{text:'Cancel',style:'cancel'}]);} }}>
                  <Ionicons name="ellipsis-horizontal" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
              <Text style={s.bodySmall}>{dc.type==='free'?'Free shipping':dc.type==='percent'?`${dc.value}% off entire order`:`$${dc.value} off`}</Text>
              <Text style={s.bodyMini}>Used: {dc.uses}{dc.usageLimit>0?` / ${dc.usageLimit}`:''}</Text>
              {dc.minOrder>0 && <Text style={s.bodyMini}>Min. order: ${dc.minOrder}</Text>}
              {dc.endDate && <Text style={s.bodyMini}>Expires: {new Date(dc.endDate).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</Text>}
            </View>
            <Switch value={dc.active} onValueChange={() => toggleDiscountActive(dc)} trackColor={{ true: colors.primary, false: colors.border }} thumbColor="#fff" style={{ transform:[{scaleX:0.9},{scaleY:0.9}] }} />
          </View>
        ))}
        {!filteredDiscounts.length && <EmptyState icon="pricetag-outline" title="No discount codes" sub="Create a discount code to attract more customers." />}
      </View>
    </>
  );

  // ── Shipping ──
  const renderShipping = () => (
    <>
      <SectionHeader />
      <View style={s.section}>
        {/* Status banner */}
        <TouchableOpacity style={s.shippingStatus}>
          <View style={[s.shippingStatusDot,{backgroundColor: shippingZones.length>0?'#10B981':'#F59E0B'}]}>
            <Ionicons name="car-outline" size={18} color="#fff" />
          </View>
          <View style={{ flex:1 }}>
            <Text style={[s.bodyBold,{color:shippingZones.length>0?'#10B981':'#F59E0B'}]}>{shippingZones.length>0?'Shipping active':'No shipping zones'}</Text>
            <Text style={s.bodySmall}>{shippingZones.length>0?'Customers can place orders':'Add a zone to enable shipping'}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Add zone button */}
        <TouchableOpacity style={s.addZoneBtn} onPress={() => { setSzName('');setSzRegions([]);setSzRate('');setSzDeliveryMin('');setSzDeliveryMax('');setSzActive(true);setSzRateType('flat');setShippingModal(true); }}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={s.addZoneBtnText}>Add Shipping Zone</Text>
        </TouchableOpacity>

        {/* Zone list */}
        {shippingZones.map(zone => (
          <View key={zone.id} style={[s.zoneCard, shadow.soft]}>
            <View style={{ flex:1 }}>
              <Text style={s.bodyBold}>{zone.name}</Text>
              <Text style={s.bodySmall}>{zone.rateType==='free'?'Free shipping':`Flat rate: $${zone.rate.toFixed(2)}`}</Text>
              <Text style={s.bodyMini}>Delivery: {zone.deliveryMin}–{zone.deliveryMax} days</Text>
            </View>
            <TouchableOpacity onPress={() => { const opts=['Edit','Delete','Cancel']; if(Platform.OS==='ios'){ActionSheetIOS.showActionSheetWithOptions({options:opts,cancelButtonIndex:2,destructiveButtonIndex:1,title:zone.name},i=>{if(i===1)deleteShippingZone(zone);});}else{Alert.alert(zone.name,undefined,[{text:'Delete',style:'destructive',onPress:()=>deleteShippingZone(zone)},{text:'Cancel',style:'cancel'}]);} }} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
              <Ionicons name="ellipsis-horizontal" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        ))}

        {/* Free shipping rules */}
        <View style={s.shippingRuleCard}>
          <View style={s.rowBetween}>
            <Text style={s.bodyBold}>Free shipping rules</Text>
            <Switch value={freeShipping} onValueChange={v => { setFreeShipping(v); saveShipping(); }} trackColor={{ true:colors.primary }} thumbColor="#fff" />
          </View>
          {freeShipping && (
            <>
              <Text style={[s.bodySmall,{marginTop:spacing.sm}]}>Minimum order amount</Text>
              <View style={s.currencyInput}>
                <Text style={s.currencyPrefix}>$</Text>
                <TextInput style={s.currencyField} value={freeShippingMin} onChangeText={setFreeShippingMin} onBlur={saveShipping} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.textMuted} />
              </View>
              <Text style={s.bodyMini}>Customers receive free shipping above this amount.</Text>
            </>
          )}
        </View>

        {/* Local pickup */}
        <View style={s.shippingRuleCard}>
          <View style={s.rowBetween}>
            <View>
              <Text style={s.bodyBold}>Local pickup</Text>
              <Text style={s.bodySmall}>Allow customers to pick up</Text>
            </View>
            <Switch value={localPickup} onValueChange={v => { setLocalPickup(v); saveShipping(); }} trackColor={{ true:colors.primary }} thumbColor="#fff" />
          </View>
        </View>
      </View>
    </>
  );

  // ── Payments ──
  const renderPayments = () => {
    const mockTransactions = orders.slice(0,6).map((o,i) => ({
      id: `#${1048-i}`, amount: o.total_amount/100, status: ['paid','pending','refunded'][i%3] as any, date: new Date(o.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})
    }));
    return (
      <>
        <SectionHeader />
        <View style={s.section}>
          {/* Stripe */}
          <View style={[s.paymentsCard, shadow.soft]}>
            <View style={s.rowBetween}>
              <View style={{ flexDirection:'row', alignItems:'center', gap: spacing.md }}>
                <View style={s.stripeIcon}><Text style={s.stripeS}>S</Text></View>
                <View>
                  <View style={{ flexDirection:'row', alignItems:'center', gap: 6 }}>
                    <Text style={s.bodyBold}>Stripe</Text>
                    <View style={s.connectedBadge}><Text style={s.connectedText}>● Connected</Text></View>
                  </View>
                  <Text style={s.bodySmall}>Your payouts are on the way</Text>
                </View>
              </View>
            </View>
            <View style={[s.rowBetween,{marginTop:spacing.md}]}>
              <View><Text style={s.bodyMini}>Settlement currency</Text><Text style={s.bodyBold}>USD</Text></View>
              <View style={{ alignItems:'flex-end' }}><Text style={s.bodyMini}>Next payout</Text><Text style={s.bodyBold}>$1,840.00 · Aug 25</Text></View>
            </View>
            <View style={[s.rowBetween,{marginTop:spacing.md,gap:spacing.sm}]}>
              <TouchableOpacity style={s.payoutOutlineBtn}><Text style={s.payoutOutlineBtnText}>View payouts</Text></TouchableOpacity>
              <TouchableOpacity style={s.payoutBtn}><Text style={s.payoutBtnText}>Manage</Text></TouchableOpacity>
            </View>
          </View>

          {/* Transactions */}
          <Text style={[s.cardTitle,{marginTop:spacing.md,marginBottom:spacing.sm}]}>Recent transactions</Text>
          {mockTransactions.map((t,i) => (
            <View key={t.id} style={[s.transactionRow, i<mockTransactions.length-1&&{borderBottomWidth:1,borderBottomColor:colors.border}]}>
              <Text style={s.bodyBold}>{t.id}</Text>
              <View style={{ flexDirection:'row', alignItems:'center', gap:spacing.sm, flex:1, justifyContent:'flex-end' }}>
                <Text style={s.bodyBold}>${t.amount.toFixed(2)}</Text>
                <TransactionChip status={t.status} />
                <Text style={s.bodyMini}>{t.date}</Text>
              </View>
            </View>
          ))}
          {!orders.length && <EmptyState icon="card-outline" title="No transactions yet" sub="Payment activity will appear here." />}

          {/* Payment issue banner */}
          <View style={s.paymentIssueBanner}>
            <Ionicons name="warning-outline" size={16} color="#F59E0B" />
            <Text style={s.paymentIssueText}>Payment issues: 1</Text>
            <TouchableOpacity style={{ marginLeft:'auto' }}><Text style={[s.linkText,{color:colors.primary}]}>Resolve</Text></TouchableOpacity>
          </View>
        </View>
      </>
    );
  };

  // ── Store Settings ──
  const renderSettings = () => (
    <>
      <SectionHeader />
      <View style={s.section}>
        {/* General */}
        <Text style={s.settingsGroup}>General</Text>
        <View style={[s.settingsCard,shadow.soft]}>
          {[
            { label:'Store name', value: settingsName, onChange: setSettingsName },
            { label:'Tagline', value: settingsTagline, onChange: setSettingsTagline },
            { label:'Description', value: settingsDesc, onChange: setSettingsDesc },
          ].map((f,i,arr) => (
            <View key={f.label} style={[s.settingsInputRow, i<arr.length-1&&{borderBottomWidth:1,borderBottomColor:colors.border}]}>
              <Text style={s.settingsInputLabel}>{f.label}</Text>
              <TextInput style={s.settingsTextInput} value={f.value} onChangeText={f.onChange} placeholderTextColor={colors.textMuted} />
            </View>
          ))}
          <View style={[s.settingsRow,{borderTopWidth:1,borderTopColor:colors.border}]}>
            <Text style={s.settingsRowLabel}>Store URL</Text>
            <Text style={s.settingsRowValue} numberOfLines={1}>{storeUrl}</Text>
          </View>
        </View>

        {/* Regional */}
        <Text style={s.settingsGroup}>Regional</Text>
        <View style={[s.settingsCard,shadow.soft]}>
          {[
            { label:'Business location', value: String(store?.metadata?.location || '—') },
            { label:'Time zone', value: String(store?.metadata?.timezone || '—') },
            { label:'Currency', value: String(store?.metadata?.currency || '—') },
            { label:'Language', value: String(store?.metadata?.language || '—') },
          ].map((r,i,arr) => (
            <TouchableOpacity key={r.label} style={[s.settingsRow, i<arr.length-1&&{borderBottomWidth:1,borderBottomColor:colors.border}]}>
              <Text style={s.settingsRowLabel}>{r.label}</Text>
              <View style={{ flexDirection:'row', alignItems:'center', gap: spacing.sm }}>
                <Text style={s.settingsRowValue}>{r.value}</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Support + Visibility */}
        <View style={[s.settingsCard,shadow.soft]}>
          <View style={[s.settingsInputRow,{borderBottomWidth:1,borderBottomColor:colors.border}]}>
            <Text style={s.settingsInputLabel}>Support email</Text>
            <TextInput style={s.settingsTextInput} value={settingsEmail} onChangeText={setSettingsEmail} keyboardType="email-address" placeholderTextColor={colors.textMuted} placeholder="support@yourstore.com" />
          </View>
          <TouchableOpacity style={[s.settingsRow,{borderBottomWidth:1,borderBottomColor:colors.border}]}>
            <Text style={s.settingsRowLabel}>Visibility</Text>
            <View style={{ flexDirection:'row', alignItems:'center', gap: spacing.sm }}>
              <Text style={s.settingsRowValue}>{store?.status==='published'?'Published':'Draft'}</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={[s.settingsRow,{borderBottomWidth:1,borderBottomColor:colors.border}]}>
            <Text style={s.settingsRowLabel}>Notifications</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity style={s.settingsRow}>
            <Text style={s.settingsRowLabel}>Policies</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Save */}
        <TouchableOpacity style={[s.saveSettingsBtn,settingsSaving&&{opacity:0.6}]} disabled={settingsSaving} onPress={saveSettings}>
          <Text style={s.saveSettingsBtnText}>{settingsSaving?'Saving…':'Save Changes'}</Text>
        </TouchableOpacity>

        {/* Danger Zone */}
        <Text style={s.settingsGroup}>Danger Zone</Text>
        <TouchableOpacity style={s.deleteStoreBtn} onPress={deleteStore}>
          <Ionicons name="trash-outline" size={16} color="#EF4444" />
          <Text style={s.deleteStoreBtnText}>Delete Store</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  // ── Store Customize ──
  const renderCustomize = () => {
    const accentCol = String(store?.metadata?.accentColor || colors.primary);
    const layout = String(store?.metadata?.layout || 'grid');
    const setLayout = async (l: string) => {
      try { await earnService.updateAsset(storeId,{metadata:{...store?.metadata,layout:l}}); setStore(s=>s?{...s,metadata:{...s.metadata,layout:l}} as EarnAsset:null); }
      catch(e){ Alert.alert('Error',(e as Error).message); }
    };
    return (
      <>
        <SectionHeader />
        {/* Store preview header */}
        <View style={s.customizePreview}>
          <View style={s.customizeBanner}>
            <Image source={{ uri: store?.image||`https://picsum.photos/seed/${storeId}/400/180` }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          </View>
          <View style={s.customizeLogoRow}>
            <Image source={{ uri: store?.image||`https://picsum.photos/seed/${storeId}/80/80` }} style={s.customizeLogo} />
            <View style={{ flex:1 }}>
              <Text style={s.bodyBold}>{store?.title}</Text>
              <Text style={s.bodySmall}>{String(store?.metadata?.tagline||'')}</Text>
            </View>
            <Ionicons name="cart-outline" size={20} color={colors.textPrimary} />
          </View>
        </View>

        <View style={s.section}>
          {/* Banner & Logo */}
          <TouchableOpacity style={[s.customizeRow,shadow.soft]}>
            <Text style={s.bodyBold}>Banner & Logo</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Accent Color */}
          <TouchableOpacity style={[s.customizeRow,shadow.soft]}>
            <Text style={s.bodyBold}>Accent Color</Text>
            <View style={{ flexDirection:'row', alignItems:'center', gap: spacing.sm }}>
              <View style={[s.colorSwatch,{backgroundColor:accentCol}]} />
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
          {/* Color picker inline */}
          <View style={s.colorPickerRow}>
            {ACCENT_COLORS.map(c => {
              const sel = accentCol===c;
              return (
                <TouchableOpacity key={c} style={[s.colorDot,{backgroundColor:c},sel&&s.colorDotSelected]} onPress={async()=>{
                  try{await earnService.updateAsset(storeId,{metadata:{...store?.metadata,accentColor:c}});setStore(s=>s?{...s,metadata:{...s.metadata,accentColor:c}} as EarnAsset:null);}
                  catch(e){Alert.alert('Error',(e as Error).message);}
                }}>
                  {sel&&<Ionicons name="checkmark" size={14} color="#fff"/>}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Layout */}
          <View style={[s.customizeRow,shadow.soft,{alignItems:'flex-start',flexDirection:'column'}]}>
            <Text style={[s.bodyBold,{marginBottom:spacing.sm}]}>Layout</Text>
            <View style={s.layoutTabs}>
              {(['grid','list','featured'] as const).map(l => (
                <TouchableOpacity key={l} style={[s.layoutTab, layout===l&&s.layoutTabActive]} onPress={() => setLayout(l)}>
                  <Text style={[s.layoutTabText, layout===l&&s.layoutTabTextActive]}>{l.charAt(0).toUpperCase()+l.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {[
            { label:'Featured Products', value:`${products.filter(p=>p.status==='published').length} products` },
            { label:'Homepage Sections', value:'6 sections' },
            { label:'Announcement Bar', value:'On' },
            { label:'About Section', value:'Our story' },
          ].map(r => (
            <TouchableOpacity key={r.label} style={[s.customizeRow,shadow.soft]}>
              <Text style={s.bodyBold}>{r.label}</Text>
              <View style={{ flexDirection:'row', alignItems:'center', gap: spacing.sm }}>
                <Text style={s.bodySmall}>{r.value}</Text>
                <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
              </View>
            </TouchableOpacity>
          ))}

          {/* Actions */}
          <View style={[s.rowBetween,{gap:spacing.sm,marginTop:spacing.sm}]}>
            <TouchableOpacity style={s.previewStoreBtn}><Text style={s.previewStoreBtnText}>Preview Store</Text></TouchableOpacity>
            <TouchableOpacity style={s.saveCustomizeBtn} onPress={async()=>{Alert.alert('Saved','Store customization saved.');}}><Text style={s.saveCustomizeBtnText}>Save Changes</Text></TouchableOpacity>
          </View>
        </View>
      </>
    );
  };

  // ── Analytics ──
  const renderAnalytics = () => {
    const conversion = orders.length && customers.length ? ((paidOrders.length/customers.length)*100).toFixed(1) : '0.0';
    const topProducts = products.slice(0,4).map(p => ({ ...p, revenue: (p.sales||0)*p.price })).sort((a,b)=>b.revenue-a.revenue);
    const maxRev = Math.max(...topProducts.map(p=>p.revenue),1);
    const trafficSources = [['Direct','45%','#3B82F6'],['Social','30%','#10B981'],['Search','20%','#F59E0B'],['Referral','5%','#8B5CF6']];
    return (
      <>
        <SectionHeader right={
          <TouchableOpacity style={s.dateRangeBtn}>
            <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
            <Text style={s.dateRangeBtnText}>Last 30 Days</Text>
            <Ionicons name="chevron-down" size={12} color={colors.textSecondary} />
          </TouchableOpacity>
        } />
        {/* Analytics tabs */}
        <View style={s.analyticsTabs}>
          {(['sales','traffic','products'] as const).map(t => (
            <TouchableOpacity key={t} style={[s.analyticsTab, analyticsTab===t&&s.analyticsTabActive]} onPress={() => setAnalyticsTab(t)}>
              <Text style={[s.analyticsTabText, analyticsTab===t&&s.analyticsTabTextActive]}>{t.charAt(0).toUpperCase()+t.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={s.section}>
          {/* Metrics */}
          <View style={s.metricsGrid}>
            {[
              { label:'Earnings', value:`$${totalRevenue.toFixed(0)}`, change:'+18%', up:true },
              { label:'Sales', value:String(paidOrders.length), change:'+12%', up:true },
              { label:'Conversion', value:`${conversion}%`, change:'+0.6%', up:true },
              { label:'Avg. Order', value:`$${avgOrder.toFixed(2)}`, change:'+5%', up:true },
            ].map(m => (
              <View key={m.label} style={s.metricBox}>
                <Text style={s.metricValue}>{m.value}</Text>
                <Text style={[s.metricChange,{color:m.up?'#10B981':'#EF4444'}]}>{m.up?'↑':'↓'} {m.change}</Text>
                <Text style={s.metricLabel}>{m.label}</Text>
              </View>
            ))}
          </View>

          {/* Sales chart (simple bar) */}
          <View style={s.chartCard}>
            <Text style={[s.cardTitle,{marginBottom:spacing.md}]}>Sales over time</Text>
            <View style={s.barChart}>
              {[2,3,4,2,5,4,6,3,4,5,3,6].map((v,i) => (
                <View key={i} style={s.barCol}>
                  <View style={[s.bar,{height:v*14,backgroundColor:accentColor}]} />
                </View>
              ))}
            </View>
            <View style={[s.rowBetween,{marginTop:4}]}>
              {['Jul 22','Jul 29','Aug 5','Aug 12','Aug 19'].map(d=><Text key={d} style={s.chartLabel}>{d}</Text>)}
            </View>
          </View>

          {/* Top products */}
          <View style={s.chartCard}>
            <Text style={[s.cardTitle,{marginBottom:spacing.md}]}>Top products</Text>
            {topProducts.map(p => (
              <View key={p.id} style={[s.rowBetween,{marginBottom:spacing.sm,gap:spacing.sm}]}>
                <Text style={[s.bodySmall,{flex:1}]} numberOfLines={1}>{p.title}</Text>
                <View style={s.progressTrack}>
                  <View style={[s.progressFill,{width:`${(p.revenue/maxRev)*100}%` as any,backgroundColor:accentColor}]} />
                </View>
                <Text style={[s.bodyBold,{minWidth:52,textAlign:'right'}]}>${p.revenue.toFixed(0)}</Text>
              </View>
            ))}
            {!topProducts.length && <Text style={s.bodySmall}>No product data yet.</Text>}
          </View>

          {/* Traffic + Customers */}
          <View style={s.rowBetween}>
            <View style={[s.chartCard,{flex:1,marginRight:spacing.sm}]}>
              <Text style={[s.cardTitle,{marginBottom:spacing.sm}]}>Traffic</Text>
              {trafficSources.map(([l,v,c]) => (
                <View key={l as string} style={[s.rowBetween,{marginBottom:4}]}>
                  <View style={{flexDirection:'row',alignItems:'center',gap:4}}>
                    <View style={{width:8,height:8,borderRadius:4,backgroundColor:c as string}} />
                    <Text style={s.bodyMini}>{l}</Text>
                  </View>
                  <Text style={s.bodyMini}>{v}</Text>
                </View>
              ))}
            </View>
            <View style={[s.chartCard,{flex:1,alignItems:'center',justifyContent:'center'}]}>
              <Ionicons name="people-outline" size={28} color={accentColor} />
              <Text style={[s.metricValue,{marginTop:4}]}>{customers.length}</Text>
              <Text style={s.bodySmall}>Customers</Text>
              <Text style={[s.metricChange,{color:'#10B981',marginTop:2}]}>↑ 18%</Text>
            </View>
          </View>
        </View>
      </>
    );
  };

  // ── Reviews ──
  const renderReviews = () => {
    const starCounts = [5,4,3,2,1].map(s => reviews.filter(r=>r.rating===s).length);
    const maxCount = Math.max(...starCounts,1);
    return (
      <>
        <SectionHeader />
        <View style={s.section}>
          {/* Rating summary */}
          <View style={[s.ratingCard,shadow.soft]}>
            <View style={{ alignItems:'center', paddingRight: spacing.lg, borderRightWidth:1, borderRightColor:colors.border }}>
              <Text style={s.ratingBig}>{ratingAvg.toFixed(1)}</Text>
              <View style={s.starsRow}>
                {[1,2,3,4,5].map(i=><Ionicons key={i} name={i<=Math.round(ratingAvg)?'star':'star-outline'} size={14} color="#F59E0B"/>)}
              </View>
              <Text style={s.bodyMini}>{reviews.length} reviews</Text>
            </View>
            <View style={{ flex:1, paddingLeft:spacing.lg, gap: 4 }}>
              {[5,4,3,2,1].map((star,i) => (
                <View key={star} style={s.ratingBarRow}>
                  <Text style={s.ratingBarLabel}>{star}</Text>
                  <View style={s.ratingBarTrack}>
                    <View style={[s.ratingBarFill,{width:`${(starCounts[i]/maxCount)*100}%` as any}]} />
                  </View>
                  <Text style={s.ratingBarCount}>{starCounts[i]}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Filter tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
            {(['all','pending','published','reported'] as const).map(k => (
              <TouchableOpacity key={k} style={[s.filterPill, reviewFilter===k&&s.filterPillActive]} onPress={()=>setReviewFilter(k)}>
                <Text style={[s.filterPillText, reviewFilter===k&&s.filterPillTextActive]}>{k.charAt(0).toUpperCase()+k.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Review cards */}
          {filteredReviews.map(r => (
            <View key={r.id} style={[s.reviewCard,shadow.soft]}>
              <View style={s.rowBetween}>
                <View style={{ flexDirection:'row', alignItems:'center', gap: spacing.sm }}>
                  <Image source={{ uri: r.avatar||`https://picsum.photos/seed/${r.id}/80/80` }} style={s.reviewAvatar} />
                  <View>
                    <Text style={s.bodyBold}>{r.author}</Text>
                    <Text style={s.bodyMini}>{r.date}</Text>
                  </View>
                </View>
                <View style={{ flexDirection:'row', alignItems:'center', gap: spacing.sm }}>
                  <ReviewStatusChip status={r.status} />
                  <TouchableOpacity onPress={() => showReviewMenu(r)} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
                    <Ionicons name="ellipsis-vertical" size={16} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={s.starsRow}>
                {[1,2,3,4,5].map(i=><Ionicons key={i} name={i<=r.rating?'star':'star-outline'} size={13} color="#F59E0B"/>)}
              </View>
              {r.product && <Text style={s.bodyMini}>{r.product}</Text>}
              <Text style={[s.bodySmall,{marginTop:4}]}>{r.comment}</Text>
              <View style={s.reviewActions}>
                <TouchableOpacity style={s.reviewActionBtn} onPress={() => { setReplyTarget(r); setReplyText(''); setReplyModal(true); }}>
                  <Text style={s.reviewActionText}>Reply</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.reviewActionBtn,{borderColor:'transparent'}]} onPress={() => Alert.alert('Reported','Flagged for moderation.')}>
                  <Text style={[s.reviewActionText,{color:colors.textSecondary}]}>Report</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          {!filteredReviews.length && <EmptyState icon="star-outline" title="No reviews yet" sub="Customer reviews will appear here after purchases." />}
        </View>
      </>
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Main header (overview only) */}
      {!isSection && (
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={s.headerTitle} numberOfLines={1}>{store?.title ?? 'Store'}</Text>
          <View style={{ flexDirection:'row', alignItems:'center', gap: spacing.md }}>
            <TouchableOpacity hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
              <Ionicons name="search-outline" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity hitSlop={{ top:8,bottom:8,left:8,right:8 }}>
              <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: fabHeight }} keyboardShouldPersistTaps="handled">
        {activeTab === 'overview'  && renderOverview()}
        {activeTab === 'products'  && renderProducts()}
        {activeTab === 'orders'    && renderOrders()}
        {activeTab === 'customers' && renderCustomers()}
        {activeTab === 'discounts' && renderDiscounts()}
        {activeTab === 'shipping'  && renderShipping()}
        {activeTab === 'payments'  && renderPayments()}
        {activeTab === 'settings'  && renderSettings()}
        {activeTab === 'customize' && renderCustomize()}
        {activeTab === 'analytics' && renderAnalytics()}
        {activeTab === 'reviews'   && renderReviews()}
      </ScrollView>

      {/* FAB */}
      {(activeTab === 'overview' || activeTab === 'products') && (
        <View style={[s.fab,{paddingBottom: insets.bottom + spacing.sm}]}>
          <TouchableOpacity style={s.fabBtn} onPress={() => navigation.navigate('AddProduct', { storeId })}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={s.fabBtnText}>Add New Product</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Create Discount Modal ── */}
      <Modal visible={discountModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[s.safe,{flex:1}]} edges={['top','bottom']}>
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={()=>setDiscountModal(false)}><Text style={s.modalCancel}>Cancel</Text></TouchableOpacity>
            <Text style={s.modalTitle}>Create Discount</Text>
            <View style={{width:60}} />
          </View>
          <ScrollView contentContainerStyle={s.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={s.fieldLabel}>Discount code</Text>
            <View style={s.codeRow}>
              <TextInput style={[s.fieldInput,{flex:1}]} value={dcCode} onChangeText={v=>setDcCode(v.toUpperCase().replace(/\s/g,''))} placeholder="e.g. WELCOME20" placeholderTextColor={colors.textMuted} autoCapitalize="characters" />
              <TouchableOpacity style={s.generateBtn} onPress={()=>setDcCode(genCode())}>
                <Text style={s.generateBtnText}>Generate</Text>
              </TouchableOpacity>
            </View>
            <Text style={s.fieldLabel}>Discount type</Text>
            <View style={s.typeRow}>
              {([['percent','Percentage'],['fixed','Fixed amount'],['free','Free shipping']] as [string,string][]).map(([k,l])=>(
                <TouchableOpacity key={k} style={s.typeOpt} onPress={()=>setDcType(k as any)}>
                  <View style={[s.radioOuter, dcType===k&&s.radioOuterActive]}>
                    {dcType===k&&<View style={s.radioInner}/>}
                  </View>
                  <Text style={s.bodySmall}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {dcType!=='free'&&<>
              <Text style={s.fieldLabel}>Discount value</Text>
              <TextInput style={s.fieldInput} value={dcValue} onChangeText={setDcValue} keyboardType="numeric" placeholder={dcType==='percent'?'20':''} placeholderTextColor={colors.textMuted} />
            </>}
            <Text style={s.fieldLabel}>Applies to</Text>
            <View style={s.fieldInput}>
              <Text style={{fontSize:13,color:colors.textPrimary}}>{dcAppliesTo}</Text>
            </View>
            <Text style={s.fieldLabel}>Minimum order (optional)</Text>
            <View style={s.currencyInput}>
              <Text style={s.currencyPrefix}>$</Text>
              <TextInput style={s.currencyField} value={dcMinOrder} onChangeText={setDcMinOrder} keyboardType="numeric" placeholder="Minimum order amount" placeholderTextColor={colors.textMuted} />
            </View>
            <Text style={s.fieldLabel}>Usage limit (optional)</Text>
            <TextInput style={s.fieldInput} value={dcUsageLimit} onChangeText={setDcUsageLimit} keyboardType="numeric" placeholder="Limit total uses" placeholderTextColor={colors.textMuted} />
            <View style={[s.rowBetween,{marginTop:spacing.md}]}>
              <Text style={s.bodyBold}>Limit to one use per customer</Text>
              <Switch value={dcLimitPerCustomer} onValueChange={setDcLimitPerCustomer} trackColor={{true:colors.primary}} thumbColor="#fff" />
            </View>
            <View style={[s.rowBetween,{marginTop:spacing.md}]}>
              <Text style={s.bodyBold}>Active</Text>
              <Switch value={dcActive} onValueChange={setDcActive} trackColor={{true:colors.primary}} thumbColor="#fff" />
            </View>
            <View style={{flexDirection:'row',gap:spacing.sm,marginTop:spacing.xl}}>
              <TouchableOpacity style={[s.previewStoreBtn,{flex:1}]} onPress={()=>setDiscountModal(false)}><Text style={s.previewStoreBtnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[s.saveCustomizeBtn,{flex:1.5}]} onPress={createDiscount}><Text style={s.saveCustomizeBtnText}>Create Discount</Text></TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── Add Shipping Zone Modal ── */}
      <Modal visible={shippingModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[s.safe,{flex:1}]} edges={['top','bottom']}>
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={()=>setShippingModal(false)}><Text style={s.modalCancel}>Cancel</Text></TouchableOpacity>
            <Text style={s.modalTitle}>Add Shipping Zone</Text>
            <View style={{width:60}} />
          </View>
          <ScrollView contentContainerStyle={s.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={s.sectionGroupLabel}>Zone details</Text>
            <Text style={s.fieldLabel}>Zone name</Text>
            <TextInput style={s.fieldInput} value={szName} onChangeText={setSzName} placeholder="e.g. West Africa" placeholderTextColor={colors.textMuted} />
            <Text style={[s.bodyMini,{marginTop:4}]}>Give this shipping zone a name.</Text>
            <Text style={[s.fieldLabel,{marginTop:spacing.md}]}>Countries or regions</Text>
            <TouchableOpacity style={[s.fieldInput,{flexDirection:'row',alignItems:'center',justifyContent:'space-between'}]} onPress={()=>setSzCountryModal(true)}>
              <Text style={{fontSize:13,color:szRegions.length?colors.textPrimary:colors.textMuted}}>{szRegions.length?`${szRegions.length} selected`:'Select countries or regions'}</Text>
              <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
            </TouchableOpacity>
            {szRegions.length>0&&<View style={s.tagRow}>
              {szRegions.map(r=>(
                <View key={r} style={s.regionTag}>
                  <Text style={s.regionTagText}>{r}</Text>
                  <TouchableOpacity onPress={()=>setSzRegions(prev=>prev.filter(x=>x!==r))}><Ionicons name="close" size={12} color={colors.textSecondary}/></TouchableOpacity>
                </View>
              ))}
            </View>}
            <Text style={[s.bodyMini,{marginTop:4}]}>Customers in these locations will use this rate.</Text>

            <Text style={s.sectionGroupLabel}>Shipping rate</Text>
            <View style={s.rateTypeTabs}>
              {(['flat','free'] as const).map(t=>(
                <TouchableOpacity key={t} style={[s.rateTypeTab, szRateType===t&&s.rateTypeTabActive]} onPress={()=>setSzRateType(t)}>
                  <Text style={[s.rateTypeTabText, szRateType===t&&s.rateTypeTabTextActive]}>{t==='flat'?'Flat rate':'Free shipping'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {szRateType==='flat'&&<>
              <Text style={s.fieldLabel}>Shipping cost</Text>
              <View style={s.currencyInput}>
                <Text style={s.currencyPrefix}>$</Text>
                <TextInput style={s.currencyField} value={szRate} onChangeText={setSzRate} keyboardType="numeric" placeholder="0.00" placeholderTextColor={colors.textMuted} />
              </View>
            </>}

            <Text style={s.sectionGroupLabel}>Delivery estimate</Text>
            <View style={{flexDirection:'row',gap:spacing.sm}}>
              <View style={{flex:1}}>
                <Text style={s.fieldLabel}>Minimum days</Text>
                <TextInput style={s.fieldInput} value={szDeliveryMin} onChangeText={setSzDeliveryMin} keyboardType="numeric" placeholder="3" placeholderTextColor={colors.textMuted} />
              </View>
              <View style={{flex:1}}>
                <Text style={s.fieldLabel}>Maximum days</Text>
                <TextInput style={s.fieldInput} value={szDeliveryMax} onChangeText={setSzDeliveryMax} keyboardType="numeric" placeholder="7" placeholderTextColor={colors.textMuted} />
              </View>
            </View>
            <Text style={[s.bodyMini,{marginTop:4}]}>Shown to customers at checkout.</Text>

            <View style={[s.rowBetween,{marginTop:spacing.lg}]}>
              <View>
                <Text style={s.bodyBold}>Zone active</Text>
                <Text style={s.bodyMini}>Customers can use this shipping option.</Text>
              </View>
              <Switch value={szActive} onValueChange={setSzActive} trackColor={{true:colors.primary}} thumbColor="#fff" />
            </View>

            <View style={{flexDirection:'row',gap:spacing.sm,marginTop:spacing.xl}}>
              <TouchableOpacity style={[s.previewStoreBtn,{flex:1}]} onPress={()=>setShippingModal(false)}><Text style={s.previewStoreBtnText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[s.saveCustomizeBtn,{flex:1.5}]} onPress={addShippingZone}><Text style={s.saveCustomizeBtnText}>Save Shipping Zone</Text></TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Country multi-select modal */}
      <Modal visible={szCountryModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[s.safe,{flex:1}]} edges={['top','bottom']}>
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={()=>setSzCountryModal(false)}><Text style={s.modalCancel}>Done</Text></TouchableOpacity>
            <Text style={s.modalTitle}>Countries & Regions</Text>
            <View style={{width:60}}/>
          </View>
          <View style={[s.searchRow,{margin:spacing.md,marginTop:0}]}>
            <Ionicons name="search-outline" size={16} color={colors.textMuted} style={{marginRight:6}}/>
            <TextInput style={s.searchInput} value={szCountrySearch} onChangeText={setSzCountrySearch} placeholder="Search countries" placeholderTextColor={colors.textMuted}/>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled">
            {COUNTRIES_LIST.filter(c=>!szCountrySearch||c.toLowerCase().includes(szCountrySearch.toLowerCase())).map(c=>{
              const sel=szRegions.includes(c);
              return (
                <TouchableOpacity key={c} style={[s.countryOption,{borderBottomWidth:1,borderBottomColor:colors.border}]} onPress={()=>setSzRegions(prev=>sel?prev.filter(x=>x!==c):[...prev,c])}>
                  <Text style={[s.bodyBold,sel&&{color:colors.primary}]}>{c}</Text>
                  {sel&&<Ionicons name="checkmark" size={18} color={colors.primary}/>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Product action sheet (Android) */}
      <Modal visible={!!actionProduct} transparent animationType="slide">
        <TouchableOpacity style={s.overlayBg} activeOpacity={1} onPress={()=>setActionProduct(null)}>
          <View style={[s.bottomSheet,{paddingBottom:insets.bottom+spacing.md}]}>
            <View style={s.sheetHandle}/>
            {actionProduct&&(
              <>
                <View style={[s.rowBetween,{paddingBottom:spacing.md,borderBottomWidth:1,borderBottomColor:colors.border,marginBottom:spacing.sm}]}>
                  <Image source={{uri:actionProduct.image||`https://picsum.photos/seed/${actionProduct.id}/80/80`}} style={{width:44,height:44,borderRadius:radii.md}}/>
                  <View style={{flex:1,marginLeft:spacing.sm}}>
                    <Text style={s.bodyBold}>{actionProduct.title}</Text>
                    <Text style={s.bodySmall}>${Number(actionProduct.price).toFixed(2)}</Text>
                  </View>
                  <ProductStatusChip status={actionProduct.status}/>
                </View>
                {[
                  {key:'edit',label:'Edit',icon:'pencil-outline'},
                  {key:'duplicate',label:'Duplicate',icon:'copy-outline'},
                  {key:'unpublish',label:actionProduct.status==='published'?'Unpublish':'Publish',icon:'eye-off-outline'},
                ].map(a=>(
                  <TouchableOpacity key={a.key} style={s.sheetRow} onPress={()=>handleProductAction(a.key,actionProduct)}>
                    <Ionicons name={a.icon as any} size={20} color={colors.textPrimary}/>
                    <Text style={s.sheetRowText}>{a.label}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity style={[s.sheetRow,{borderBottomWidth:0}]} onPress={()=>handleProductAction('delete',actionProduct)}>
                  <Ionicons name="trash-outline" size={20} color="#EF4444"/>
                  <Text style={[s.sheetRowText,{color:'#EF4444'}]}>Delete</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Review reply modal */}
      <Modal visible={replyModal} transparent animationType="slide">
        <TouchableOpacity style={s.overlayBg} activeOpacity={1} onPress={()=>setReplyModal(false)}>
          <View style={[s.bottomSheet,{paddingBottom:insets.bottom+spacing.md}]}>
            <View style={s.sheetHandle}/>
            <Text style={[s.bodyBold,{marginBottom:spacing.sm}]}>Reply to {replyTarget?.author}</Text>
            <TextInput style={[s.fieldInput,{height:90,textAlignVertical:'top'}]} value={replyText} onChangeText={setReplyText} multiline placeholder="Write a reply..." placeholderTextColor={colors.textMuted}/>
            <TouchableOpacity style={[s.saveCustomizeBtn,{marginTop:spacing.md}]} onPress={()=>{Alert.alert('Reply sent!');setReplyModal(false);}}>
              <Text style={s.saveCustomizeBtnText}>Send Reply</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ── Sub-components ──
function StatCard({ label, value, color, icon }: { label:string; value:string; color:string; icon:string }) {
  return (
    <View style={sc.statCard}>
      <View style={[sc.statIcon,{backgroundColor:`${color}18`}]}>
        <Ionicons name={icon as any} size={16} color={color}/>
      </View>
      <Text style={[sc.statVal,{color}]}>{value}</Text>
      <Text style={sc.statLabel}>{label}</Text>
    </View>
  );
}
function StatusChip({ status }: { status:string }) {
  const map: Record<string,[string,string]> = {
    paid:['#E6F9F0','#10B981'], complete:['#E6F9F0','#10B981'], completed:['#E6F9F0','#10B981'],
    pending:['#FEF3C7','#F59E0B'], processing:['#DBEAFE','#3B82F6'], refunded:['#FEE2E2','#EF4444'],
  };
  const [bg,fg] = map[status] ?? [colors.background,colors.textMuted];
  return <View style={[sc.chip,{backgroundColor:bg}]}><Text style={[sc.chipText,{color:fg}]}>{status.charAt(0).toUpperCase()+status.slice(1)}</Text></View>;
}
function TransactionChip({ status }: { status:string }) {
  return <StatusChip status={status}/>;
}
function ProductStatusChip({ status, stock }: { status:string; stock?:number }) {
  const low = stock !== undefined && stock < 5;
  if (low) return <View style={[sc.chip,{backgroundColor:'#FEF3C7'}]}><Text style={[sc.chipText,{color:'#F59E0B'}]}>Low stock</Text></View>;
  if (status==='published') return <View style={[sc.chip,{backgroundColor:'#E6F9F0'}]}><Text style={[sc.chipText,{color:'#10B981'}]}>Published</Text></View>;
  return <View style={[sc.chip,{backgroundColor:colors.background}]}><Text style={[sc.chipText,{color:colors.textMuted}]}>Draft</Text></View>;
}
function ReviewStatusChip({ status }: { status:string }) {
  const map: Record<string,[string,string]> = {
    published:['#E6F9F0','#10B981'], pending:['#FEF3C7','#F59E0B'], reported:['#FEE2E2','#EF4444'],
  };
  const [bg,fg] = map[status] ?? [colors.background,colors.textMuted];
  return <View style={[sc.chip,{backgroundColor:bg}]}><Text style={[sc.chipText,{color:fg}]}>{status.charAt(0).toUpperCase()+status.slice(1)}</Text></View>;
}
function EmptyState({ icon, title, sub }: { icon:string; title:string; sub:string }) {
  return (
    <View style={sc.empty}>
      <Ionicons name={icon as any} size={44} color={colors.textMuted}/>
      <Text style={sc.emptyTitle}>{title}</Text>
      <Text style={sc.emptySub}>{sub}</Text>
    </View>
  );
}

const sc = StyleSheet.create({
  statCard:{ flex:1, backgroundColor:colors.card, borderRadius:radii.xl, padding:spacing.md, alignItems:'center', gap:4 },
  statIcon:{ width:36, height:36, borderRadius:18, alignItems:'center', justifyContent:'center' },
  statVal:{ fontSize:18, fontWeight:'900' },
  statLabel:{ fontSize:10, fontWeight:'600', color:colors.textSecondary, textAlign:'center' },
  chip:{ paddingHorizontal:8, paddingVertical:3, borderRadius:radii.pill },
  chipText:{ fontSize:10, fontWeight:'700' },
  empty:{ alignItems:'center', paddingVertical:spacing.xxl, gap:spacing.sm },
  emptyTitle:{ fontSize:14, fontWeight:'700', color:colors.textPrimary },
  emptySub:{ fontSize:12, color:colors.textSecondary, textAlign:'center' },
});

const s = StyleSheet.create({
  safe:{ flex:1, backgroundColor:colors.background },
  // Headers
  header:{ flexDirection:'row', alignItems:'center', paddingHorizontal:spacing.lg, paddingVertical:spacing.sm, gap:spacing.sm },
  headerTitle:{ ...typography.h2, color:colors.textPrimary, flex:1 },
  sectionHeader:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:spacing.lg, paddingVertical:spacing.sm },
  sectionBack:{ flexDirection:'row', alignItems:'center', gap:4, flex:1 },
  sectionBackText:{ fontSize:16, fontWeight:'700', color:colors.textPrimary, flexShrink:1 },
  // Hero
  hero:{ backgroundColor:colors.card, marginBottom:spacing.sm },
  heroCover:{ width:'100%', height:200 },
  heroRow:{ flexDirection:'row', alignItems:'center', gap:spacing.md, padding:spacing.md },
  heroLogo:{ width:52, height:52, borderRadius:radii.lg, borderWidth:2.5, borderColor:colors.white, marginTop:-26 },
  heroName:{ fontSize:15, fontWeight:'800', color:colors.textPrimary },
  heroUrl:{ fontSize:11, color:colors.textSecondary, marginTop:2 },
  shareBtn:{ width:32, height:32, borderRadius:16, backgroundColor:colors.primary, alignItems:'center', justifyContent:'center' },
  // Stats
  statsGrid:{ flexDirection:'row', paddingHorizontal:spacing.lg, paddingVertical:spacing.md, gap:spacing.sm },
  statsRow2:{ flexDirection:'row', backgroundColor:colors.card, marginHorizontal:spacing.lg, borderRadius:radii.xl, marginBottom:spacing.sm, overflow:'hidden' },
  stat2Box:{ flex:1, alignItems:'center', paddingVertical:spacing.md },
  stat2Val:{ fontSize:20, fontWeight:'900', color:colors.textPrimary },
  stat2Label:{ fontSize:11, fontWeight:'600', color:colors.textSecondary, marginTop:2 },
  statsRow4:{ flexDirection:'row', marginHorizontal:spacing.lg, backgroundColor:colors.card, borderRadius:radii.xl, marginBottom:spacing.sm, overflow:'hidden' },
  stat4Box:{ flex:1, alignItems:'center', paddingVertical:spacing.md, borderRightWidth:1, borderRightColor:colors.border },
  stat4Val:{ fontSize:16, fontWeight:'900' },
  stat4Label:{ fontSize:10, fontWeight:'600', color:colors.textSecondary, marginTop:2 },
  // Cards
  card:{ backgroundColor:colors.card, borderRadius:radii.xl, marginHorizontal:spacing.lg, marginBottom:spacing.md, padding:spacing.md },
  cardTitle:{ fontSize:14, fontWeight:'800', color:colors.textPrimary },
  navCard:{ backgroundColor:colors.card, borderRadius:radii.xl, marginHorizontal:spacing.lg, marginBottom:spacing.lg, overflow:'hidden' },
  navItem:{ flexDirection:'row', alignItems:'center', gap:spacing.md, paddingHorizontal:spacing.md, paddingVertical:14 },
  navIconBox:{ width:32, height:32, borderRadius:16, backgroundColor:colors.background, alignItems:'center', justifyContent:'center' },
  navItemLabel:{ flex:1, fontSize:13, fontWeight:'600', color:colors.textPrimary },
  navItemCount:{ fontSize:12, fontWeight:'700', color:colors.textSecondary },
  // Section
  section:{ paddingHorizontal:spacing.lg, paddingBottom:120, gap:spacing.sm },
  sectionCount:{ fontSize:13, fontWeight:'700', color:colors.textPrimary },
  // Filters
  filterRow:{ paddingHorizontal:spacing.lg, gap:spacing.sm, paddingBottom:spacing.sm },
  filterPill:{ paddingHorizontal:spacing.md, paddingVertical:spacing.xs+1, borderRadius:radii.pill, borderWidth:1, borderColor:colors.border, backgroundColor:colors.card },
  filterPillActive:{ borderColor:colors.primary, backgroundColor:colors.primary },
  filterPillText:{ fontSize:12, fontWeight:'600', color:colors.textSecondary },
  filterPillTextActive:{ color:'#fff' },
  // Search
  searchRow:{ flexDirection:'row', alignItems:'center', backgroundColor:colors.card, borderRadius:radii.xl, marginHorizontal:spacing.lg, paddingHorizontal:spacing.md, paddingVertical:spacing.sm, marginBottom:spacing.xs, borderWidth:1, borderColor:colors.border },
  searchInput:{ flex:1, fontSize:13, color:colors.textPrimary, padding:0 },
  // Products
  productRow:{ flexDirection:'row', alignItems:'center', gap:spacing.md, backgroundColor:colors.card, borderRadius:radii.xl, padding:spacing.md },
  productImg:{ width:56, height:56, borderRadius:radii.md, backgroundColor:colors.border },
  productThumb:{ width:40, height:40, borderRadius:radii.md, backgroundColor:colors.border },
  priceText:{ fontSize:13, fontWeight:'800', color:colors.primary, marginTop:2 },
  // Orders
  orderRow:{ backgroundColor:colors.card, borderRadius:radii.xl, padding:spacing.md, gap:4 },
  // Customers
  customerRow:{ flexDirection:'row', alignItems:'center', gap:spacing.md, backgroundColor:colors.card, borderRadius:radii.xl, padding:spacing.md },
  avatar:{ width:44, height:44, borderRadius:22, backgroundColor:colors.border },
  segmentBtn:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:colors.card, borderRadius:radii.xl, padding:spacing.md, borderWidth:1, borderColor:colors.border },
  segmentBtnText:{ fontSize:13, fontWeight:'600', color:colors.textPrimary },
  segmentDropdown:{ backgroundColor:colors.card, borderRadius:radii.xl, borderWidth:1, borderColor:colors.border, overflow:'hidden' },
  segmentOption:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:spacing.md, paddingVertical:12, borderBottomWidth:1, borderBottomColor:colors.border },
  segmentOptionText:{ fontSize:13, fontWeight:'600', color:colors.textPrimary },
  // Discounts
  discountCard:{ backgroundColor:colors.card, borderRadius:radii.xl, padding:spacing.md, flexDirection:'row', alignItems:'center', gap:spacing.md },
  createBtn:{ flexDirection:'row', alignItems:'center', gap:4, borderWidth:1.5, borderColor:colors.primary, borderRadius:radii.pill, paddingHorizontal:spacing.sm, paddingVertical:4 },
  createBtnText:{ fontSize:12, fontWeight:'700', color:colors.primary },
  // Shipping
  shippingStatus:{ flexDirection:'row', alignItems:'center', gap:spacing.md, backgroundColor:colors.card, borderRadius:radii.xl, padding:spacing.md },
  shippingStatusDot:{ width:44, height:44, borderRadius:22, alignItems:'center', justifyContent:'center' },
  addZoneBtn:{ flexDirection:'row', alignItems:'center', justifyContent:'center', gap:spacing.sm, backgroundColor:colors.primary, borderRadius:radii.pill, paddingVertical:spacing.md },
  addZoneBtnText:{ fontSize:14, fontWeight:'800', color:'#fff' },
  zoneCard:{ flexDirection:'row', alignItems:'center', gap:spacing.md, backgroundColor:colors.card, borderRadius:radii.xl, padding:spacing.md },
  shippingRuleCard:{ backgroundColor:colors.card, borderRadius:radii.xl, padding:spacing.md, gap:spacing.sm },
  currencyInput:{ flexDirection:'row', alignItems:'center', backgroundColor:colors.background, borderRadius:radii.md, borderWidth:1, borderColor:colors.border, paddingHorizontal:spacing.md, overflow:'hidden' },
  currencyPrefix:{ fontSize:14, fontWeight:'700', color:colors.textSecondary, marginRight:spacing.xs },
  currencyField:{ flex:1, fontSize:13, color:colors.textPrimary, paddingVertical:spacing.sm },
  // Payments
  paymentsCard:{ backgroundColor:colors.card, borderRadius:radii.xl, padding:spacing.md },
  stripeIcon:{ width:44, height:44, borderRadius:22, backgroundColor:'#635BFF', alignItems:'center', justifyContent:'center' },
  stripeS:{ color:'#fff', fontSize:20, fontWeight:'900' },
  connectedBadge:{ backgroundColor:'#E6F9F0', borderRadius:radii.pill, paddingHorizontal:6, paddingVertical:2 },
  connectedText:{ fontSize:10, fontWeight:'700', color:'#10B981' },
  payoutOutlineBtn:{ flex:1, alignItems:'center', paddingVertical:spacing.sm, borderRadius:radii.pill, borderWidth:1.5, borderColor:colors.primary },
  payoutOutlineBtnText:{ fontSize:13, fontWeight:'700', color:colors.primary },
  payoutBtn:{ flex:1, alignItems:'center', paddingVertical:spacing.sm, borderRadius:radii.pill, backgroundColor:colors.primary },
  payoutBtnText:{ fontSize:13, fontWeight:'700', color:'#fff' },
  transactionRow:{ flexDirection:'row', alignItems:'center', paddingVertical:spacing.sm, gap:spacing.sm },
  paymentIssueBanner:{ flexDirection:'row', alignItems:'center', gap:spacing.sm, backgroundColor:'#FEF3C7', borderRadius:radii.xl, padding:spacing.md, marginTop:spacing.sm },
  paymentIssueText:{ fontSize:13, fontWeight:'600', color:'#92400E' },
  // Settings
  settingsGroup:{ fontSize:11, fontWeight:'700', color:colors.textSecondary, textTransform:'uppercase', letterSpacing:0.8, marginTop:spacing.sm, marginBottom:4 },
  settingsCard:{ backgroundColor:colors.card, borderRadius:radii.xl, overflow:'hidden' },
  settingsRow:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:spacing.md, paddingVertical:13 },
  settingsRowLabel:{ fontSize:13, fontWeight:'600', color:colors.textPrimary },
  settingsRowValue:{ fontSize:13, color:colors.textSecondary, maxWidth:180 },
  settingsInputRow:{ paddingHorizontal:spacing.md, paddingVertical:10 },
  settingsInputLabel:{ fontSize:11, fontWeight:'700', color:colors.textSecondary, marginBottom:4 },
  settingsTextInput:{ fontSize:13, color:colors.textPrimary, padding:0 },
  saveSettingsBtn:{ backgroundColor:colors.primary, borderRadius:radii.pill, paddingVertical:spacing.md, alignItems:'center', marginTop:spacing.sm },
  saveSettingsBtnText:{ fontSize:14, fontWeight:'800', color:'#fff' },
  deleteStoreBtn:{ flexDirection:'row', alignItems:'center', justifyContent:'center', gap:spacing.sm, borderWidth:1.5, borderColor:'#EF4444', borderRadius:radii.xl, paddingVertical:spacing.md },
  deleteStoreBtnText:{ fontSize:14, fontWeight:'700', color:'#EF4444' },
  // Customize
  customizePreview:{ backgroundColor:colors.card, marginBottom:spacing.sm },
  customizeBanner:{ height:160, backgroundColor:colors.border, overflow:'hidden' },
  customizeLogoRow:{ flexDirection:'row', alignItems:'center', gap:spacing.md, padding:spacing.md },
  customizeLogo:{ width:52, height:52, borderRadius:radii.lg, borderWidth:2.5, borderColor:colors.white, marginTop:-26 },
  customizeRow:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:colors.card, borderRadius:radii.xl, padding:spacing.md },
  colorSwatch:{ width:22, height:22, borderRadius:11 },
  colorPickerRow:{ flexDirection:'row', flexWrap:'wrap', gap:10, backgroundColor:colors.card, borderRadius:radii.xl, padding:spacing.md },
  colorDot:{ width:36, height:36, borderRadius:18, alignItems:'center', justifyContent:'center' },
  colorDotSelected:{ borderWidth:3, borderColor:colors.background },
  layoutTabs:{ flexDirection:'row', backgroundColor:colors.background, borderRadius:radii.lg, overflow:'hidden', width:'100%' },
  layoutTab:{ flex:1, alignItems:'center', paddingVertical:spacing.sm },
  layoutTabActive:{ backgroundColor:colors.card, borderRadius:radii.lg, borderWidth:1.5, borderColor:colors.primary },
  layoutTabText:{ fontSize:12, fontWeight:'600', color:colors.textSecondary },
  layoutTabTextActive:{ color:colors.primary },
  previewStoreBtn:{ flex:1, alignItems:'center', paddingVertical:spacing.md, borderRadius:radii.pill, borderWidth:1.5, borderColor:colors.primary },
  previewStoreBtnText:{ fontSize:13, fontWeight:'700', color:colors.primary },
  saveCustomizeBtn:{ flex:1, alignItems:'center', paddingVertical:spacing.md, borderRadius:radii.pill, backgroundColor:colors.primary },
  saveCustomizeBtnText:{ fontSize:13, fontWeight:'700', color:'#fff' },
  // Analytics
  analyticsTabs:{ flexDirection:'row', paddingHorizontal:spacing.lg, marginBottom:spacing.sm, backgroundColor:colors.card, marginTop:0 },
  analyticsTab:{ flex:1, alignItems:'center', paddingVertical:spacing.md, borderBottomWidth:2, borderBottomColor:'transparent' },
  analyticsTabActive:{ borderBottomColor:colors.primary },
  analyticsTabText:{ fontSize:13, fontWeight:'600', color:colors.textSecondary },
  analyticsTabTextActive:{ color:colors.primary },
  metricsGrid:{ flexDirection:'row', flexWrap:'wrap', gap:spacing.sm },
  metricBox:{ flex:1, minWidth:'45%', backgroundColor:colors.card, borderRadius:radii.xl, padding:spacing.md },
  metricValue:{ fontSize:20, fontWeight:'900', color:colors.textPrimary },
  metricChange:{ fontSize:11, fontWeight:'700', marginTop:2 },
  metricLabel:{ fontSize:11, fontWeight:'600', color:colors.textSecondary, marginTop:2 },
  chartCard:{ backgroundColor:colors.card, borderRadius:radii.xl, padding:spacing.md },
  barChart:{ flexDirection:'row', alignItems:'flex-end', height:84, gap:4 },
  barCol:{ flex:1, alignItems:'center', justifyContent:'flex-end' },
  bar:{ width:'100%', borderRadius:3, minHeight:4 },
  chartLabel:{ fontSize:9, color:colors.textMuted, fontWeight:'600' },
  progressTrack:{ flex:1, height:6, backgroundColor:colors.border, borderRadius:3, overflow:'hidden' },
  progressFill:{ height:'100%', borderRadius:3 },
  dateRangeBtn:{ flexDirection:'row', alignItems:'center', gap:4, backgroundColor:colors.card, borderRadius:radii.pill, paddingHorizontal:spacing.sm, paddingVertical:4, borderWidth:1, borderColor:colors.border },
  dateRangeBtnText:{ fontSize:11, fontWeight:'600', color:colors.textSecondary },
  // Reviews
  ratingCard:{ flexDirection:'row', backgroundColor:colors.card, borderRadius:radii.xl, padding:spacing.md },
  ratingBig:{ fontSize:36, fontWeight:'900', color:colors.textPrimary },
  starsRow:{ flexDirection:'row', gap:2 },
  ratingBarRow:{ flexDirection:'row', alignItems:'center', gap:spacing.sm },
  ratingBarLabel:{ fontSize:11, fontWeight:'700', color:colors.textSecondary, width:12, textAlign:'right' },
  ratingBarTrack:{ flex:1, height:6, backgroundColor:colors.border, borderRadius:3, overflow:'hidden' },
  ratingBarFill:{ height:'100%', backgroundColor:'#F59E0B', borderRadius:3 },
  ratingBarCount:{ fontSize:11, color:colors.textSecondary, width:20 },
  reviewCard:{ backgroundColor:colors.card, borderRadius:radii.xl, padding:spacing.md, gap:spacing.xs },
  reviewAvatar:{ width:36, height:36, borderRadius:18, backgroundColor:colors.border },
  reviewActions:{ flexDirection:'row', gap:spacing.sm, marginTop:4 },
  reviewActionBtn:{ paddingHorizontal:spacing.md, paddingVertical:6, borderRadius:radii.pill, borderWidth:1.5, borderColor:colors.primary },
  reviewActionText:{ fontSize:12, fontWeight:'700', color:colors.primary },
  // FAB
  fab:{ position:'absolute', bottom:0, left:0, right:0, paddingTop:spacing.sm, paddingHorizontal:spacing.lg, backgroundColor:colors.card, borderTopWidth:1, borderTopColor:colors.border },
  fabBtn:{ flexDirection:'row', alignItems:'center', justifyContent:'center', gap:spacing.sm, backgroundColor:colors.primary, borderRadius:radii.pill, paddingVertical:spacing.md },
  fabBtnText:{ color:'#fff', fontSize:14, fontWeight:'800' },
  // Modals
  modalHeader:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:spacing.lg, paddingVertical:spacing.md, borderBottomWidth:1, borderBottomColor:colors.border },
  modalTitle:{ fontSize:15, fontWeight:'800', color:colors.textPrimary },
  modalCancel:{ fontSize:14, fontWeight:'600', color:colors.primary, width:60 },
  modalBody:{ padding:spacing.lg, paddingBottom:60 },
  overlayBg:{ flex:1, backgroundColor:'rgba(0,0,0,0.45)', justifyContent:'flex-end' },
  bottomSheet:{ backgroundColor:colors.card, borderTopLeftRadius:radii.xl, borderTopRightRadius:radii.xl, padding:spacing.lg },
  sheetHandle:{ width:40, height:4, borderRadius:2, backgroundColor:colors.border, alignSelf:'center', marginBottom:spacing.lg },
  sheetRow:{ flexDirection:'row', alignItems:'center', gap:spacing.md, paddingVertical:spacing.md, borderBottomWidth:1, borderBottomColor:colors.border },
  sheetRowText:{ fontSize:14, fontWeight:'600', color:colors.textPrimary },
  // Form
  fieldLabel:{ fontSize:12, fontWeight:'700', color:colors.textSecondary, marginBottom:4, marginTop:spacing.sm },
  fieldInput:{ backgroundColor:colors.background, borderRadius:radii.md, borderWidth:1, borderColor:colors.border, padding:spacing.md, fontSize:13, color:colors.textPrimary },
  codeRow:{ flexDirection:'row', alignItems:'center', gap:spacing.sm },
  generateBtn:{},
  generateBtnText:{ fontSize:13, fontWeight:'700', color:colors.primary },
  typeRow:{ gap:spacing.sm, marginBottom:4 },
  typeOpt:{ flexDirection:'row', alignItems:'center', gap:spacing.sm, paddingVertical:4 },
  radioOuter:{ width:18, height:18, borderRadius:9, borderWidth:2, borderColor:colors.border, alignItems:'center', justifyContent:'center' },
  radioOuterActive:{ borderColor:colors.primary },
  radioInner:{ width:8, height:8, borderRadius:4, backgroundColor:colors.primary },
  rateTypeTabs:{ flexDirection:'row', backgroundColor:colors.background, borderRadius:radii.lg, overflow:'hidden', marginBottom:spacing.sm },
  rateTypeTab:{ flex:1, alignItems:'center', paddingVertical:spacing.md },
  rateTypeTabActive:{ backgroundColor:colors.card, borderWidth:1.5, borderColor:colors.primary, borderRadius:radii.lg },
  rateTypeTabText:{ fontSize:13, fontWeight:'600', color:colors.textSecondary },
  rateTypeTabTextActive:{ color:colors.primary },
  sectionGroupLabel:{ fontSize:14, fontWeight:'800', color:colors.textPrimary, marginTop:spacing.lg, marginBottom:spacing.xs },
  tagRow:{ flexDirection:'row', flexWrap:'wrap', gap:spacing.xs, marginTop:spacing.xs },
  regionTag:{ flexDirection:'row', alignItems:'center', gap:4, backgroundColor:colors.primary+'22', borderRadius:radii.pill, paddingHorizontal:spacing.sm, paddingVertical:4 },
  regionTagText:{ fontSize:11, fontWeight:'600', color:colors.primary },
  countryOption:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:spacing.lg, paddingVertical:13 },
  // General helpers
  rowBetween:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  bodyBold:{ fontSize:13, fontWeight:'700', color:colors.textPrimary },
  bodySmall:{ fontSize:12, color:colors.textSecondary },
  bodyMuted:{ fontSize:13, fontWeight:'600', color:colors.textPrimary },
  bodyMini:{ fontSize:11, color:colors.textSecondary },
  linkText:{ fontSize:12, fontWeight:'700' },
});
