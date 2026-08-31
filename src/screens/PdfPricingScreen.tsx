import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { earnService, type EarnAsset, type PdfMetadata } from '../services/api/earn.service';
import { colors, radii, spacing, typography } from '../theme';
import { ps } from './earn/pdf/PdfWizardShared';

type Props = NativeStackScreenProps<RootStackParamList, 'PdfPricing'>;
const CURRENCIES = ['USD', 'EUR', 'GBP', 'NGN', 'CAD', 'AUD', 'ZAR', 'KES', 'GHS', 'INR'];

export default function PdfPricingScreen({ route, navigation }: Props) {
  const { pdfId } = route.params;
  const [pdf, setPdf] = useState<EarnAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [price, setPrice] = useState('9.99');
  const [currency, setCurrency] = useState('USD');
  const [isFree, setIsFree] = useState(false);
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [discountStart, setDiscountStart] = useState('');
  const [discountEnd, setDiscountEnd] = useState('');
  const [discountUsageLimit, setDiscountUsageLimit] = useState('');
  const [discountActive, setDiscountActive] = useState(false);
  const [hasDiscount, setHasDiscount] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    earnService.getAsset(pdfId).then(a => {
      setPdf(a);
      const md = (a.metadata || {}) as PdfMetadata;
      setPrice(String(a.price || 9.99));
      setCurrency(a.currency || 'USD');
      setIsFree(Boolean(md.isFree || md.pricingModel === 'free'));
      setDiscountType(md.discountType || 'percent');
      setDiscountValue(String(md.discountValue || ''));
      setDiscountCode(md.discountCode || '');
      setDiscountStart(md.discountStart || '');
      setDiscountEnd(md.discountEnd || '');
      setDiscountUsageLimit(String(md.discountUsageLimit || ''));
      setDiscountActive(Boolean(md.discountActive));
      setHasDiscount(Boolean(md.discountCode));
    }).catch(e => Alert.alert('Unable to load PDF', (e as Error).message)).finally(() => setLoading(false));
  }, [pdfId]);

  const applyChanges = async () => {
    if (!pdf) return;
    setBusy(true);
    try {
      const md = (pdf.metadata || {}) as PdfMetadata;
      await earnService.updateAsset(pdfId, {
        price: isFree ? 0 : Number(price) || 0,
        currency,
        metadata: {
          ...md,
          isFree, pricingModel: isFree ? 'free' : md.pricingModel === 'free' ? 'one-time' : md.pricingModel,
          discountType, discountValue: Number(discountValue) || 0, discountCode: discountCode.trim().toUpperCase(),
          discountStart, discountEnd, discountUsageLimit: Number(discountUsageLimit) || 0, discountActive,
        },
      });
      setHasDiscount(Boolean(discountCode.trim()));
      Alert.alert('Saved', 'Pricing and discount settings updated.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (e) {
      Alert.alert('Unable to save', (e as Error).message);
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  };

  const deleteDiscount = () => {
    Alert.alert('Delete discount?', 'This discount code will be permanently removed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        setDiscountCode(''); setDiscountValue(''); setDiscountActive(false); setHasDiscount(false);
      } },
    ]);
  };

  if (loading || !pdf) {
    return <SafeAreaView style={s.safe}><ActivityIndicator style={{ marginTop: 80 }} color={colors.primary} /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity onPress={navigation.goBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Pricing & Discounts</Text>
        <View style={{ width: 22 }} />
      </View>
      <ScrollView contentContainerStyle={ps.chapterContent} keyboardShouldPersistTaps="handled">
        <Text style={s.sectionLabel}>Price</Text>
        <View style={s.priceRow}>
          <Text style={s.currencyPrefix}>$</Text>
          <TextInput
            style={[ps.input, { flex: 1 }, isFree && { opacity: 0.4 }]}
            value={isFree ? '0.00' : price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            editable={!isFree}
            placeholder="9.99"
            placeholderTextColor={colors.textMuted}
          />
        </View>
        <Text style={[ps.fieldLabel, { marginTop: spacing.sm }]}>Currency</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, marginBottom: spacing.sm }}>
          {CURRENCIES.map(c => (
            <TouchableOpacity key={c} style={[s.currChip, currency === c && s.currChipActive, isFree && { opacity: 0.4 }]} disabled={isFree} onPress={() => setCurrency(c)}>
              <Text style={[s.currChipText, currency === c && s.currChipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={s.toggleRow}>
          <View>
            <Text style={s.toggleLabel}>Make It Free</Text>
            <Text style={s.toggleSub}>{isFree ? 'Buyers will receive this PDF without payment.' : 'Buyers pay the price above.'}</Text>
          </View>
          <Switch value={isFree} onValueChange={setIsFree} trackColor={{ true: colors.primary }} thumbColor="#fff" />
        </View>

        <Text style={[s.sectionLabel, { marginTop: spacing.xl }]}>Discount</Text>
        <View style={s.typeRow}>
          {(['percent', 'fixed'] as const).map(t => (
            <TouchableOpacity key={t} style={[s.typeOpt, discountType === t && s.typeOptActive]} onPress={() => setDiscountType(t)}>
              <Text style={[s.typeOptText, discountType === t && s.typeOptTextActive]}>{t === 'percent' ? 'Percentage' : 'Fixed amount'}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput style={ps.input} value={discountValue} onChangeText={setDiscountValue} keyboardType="numeric" placeholder={discountType === 'percent' ? 'e.g. 20' : 'e.g. 5.00'} placeholderTextColor={colors.textMuted} />

        <Text style={[ps.fieldLabel, { marginTop: spacing.sm }]}>Discount code</Text>
        <TextInput style={ps.input} value={discountCode} onChangeText={v => setDiscountCode(v.toUpperCase().replace(/\s/g, ''))} autoCapitalize="characters" placeholder="e.g. LAUNCH20" placeholderTextColor={colors.textMuted} />

        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Text style={ps.fieldLabel}>Start date</Text>
            <TextInput style={ps.input} value={discountStart} onChangeText={setDiscountStart} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textMuted} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={ps.fieldLabel}>Expiry date</Text>
            <TextInput style={ps.input} value={discountEnd} onChangeText={setDiscountEnd} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textMuted} />
          </View>
        </View>
        <Text style={[ps.fieldLabel, { marginTop: spacing.sm }]}>Usage limit (optional)</Text>
        <TextInput style={ps.input} value={discountUsageLimit} onChangeText={setDiscountUsageLimit} keyboardType="numeric" placeholder="Limit total uses" placeholderTextColor={colors.textMuted} />

        <View style={s.toggleRow}>
          <Text style={s.toggleLabel}>Discount active</Text>
          <Switch value={discountActive} onValueChange={setDiscountActive} trackColor={{ true: colors.primary }} thumbColor="#fff" />
        </View>

        {hasDiscount && (
          <TouchableOpacity style={s.deleteDiscountBtn} onPress={deleteDiscount}>
            <Ionicons name="trash-outline" size={15} color="#EF4444" />
            <Text style={s.deleteDiscountText}>Delete discount</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={[s.saveBtn, busy && { opacity: 0.6 }]} disabled={busy} onPress={() => setConfirming(true)}>
          <Text style={s.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>

      {confirming && (
        <View style={s.overlay}>
          <View style={s.confirmCard}>
            <Text style={s.confirmTitle}>Confirm pricing changes?</Text>
            <Text style={s.confirmBody}>
              {isFree ? 'This PDF will become free immediately.' : `This PDF will be priced at ${currency} ${price}${discountActive && discountCode ? ` with discount code "${discountCode}" active.` : '.'}`}
            </Text>
            <View style={s.confirmActions}>
              <TouchableOpacity style={s.confirmCancel} onPress={() => setConfirming(false)}>
                <Text style={s.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.confirmOk} onPress={applyChanges} disabled={busy}>
                <Text style={s.confirmOkText}>{busy ? 'Saving…' : 'Confirm'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  headerTitle: { ...typography.h2, color: colors.textPrimary },
  sectionLabel: { fontSize: 13, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.sm },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  currencyPrefix: { fontSize: 16, fontWeight: '700', color: colors.textSecondary },
  currChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  currChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  currChipText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  currChipTextActive: { color: '#fff' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  toggleLabel: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  toggleSub: { fontSize: 11, color: colors.textSecondary, marginTop: 2, maxWidth: 220 },
  typeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  typeOpt: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  typeOptActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeOptText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  typeOptTextActive: { color: '#fff' },
  deleteDiscountBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.md },
  deleteDiscountText: { fontSize: 12, fontWeight: '700', color: '#EF4444' },
  saveBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.xl },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  confirmCard: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg, width: '100%' },
  confirmTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.sm },
  confirmBody: { fontSize: 12, color: colors.textSecondary, lineHeight: 18, textAlign: 'center' },
  confirmActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  confirmCancel: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border },
  confirmCancelText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  confirmOk: { flex: 1.3, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radii.pill, backgroundColor: colors.primary },
  confirmOkText: { fontSize: 13, fontWeight: '800', color: '#fff' },
});
