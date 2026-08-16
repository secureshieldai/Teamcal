import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { earnService, type EarnAsset, type MembershipMetadata } from '../services/api/earn.service';
import { colors, radii, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'MembershipCheckout'>;
type Interval = 'monthly' | 'quarterly' | 'sixMonth' | 'annual' | 'lifetime';

export default function MembershipCheckoutScreen({ route, navigation }: Props) {
  const [asset, setAsset] = useState<EarnAsset | null>(null);
  const [interval, setInterval] = useState<Interval>('monthly');
  useEffect(() => { earnService.getPublicMembership(route.params.membershipId).then(setAsset).catch((e) => Alert.alert('Unable to load', e.message)); }, [route.params.membershipId]);
  if (!asset) return <SafeAreaView style={s.safe}><Text style={s.loading}>Loading membership…</Text></SafeAreaView>;
  const md = (asset.metadata || {}) as MembershipMetadata;
  const tier = md.tiers?.find((item) => item.id === route.params.tierId);
  const prices = { monthly: md.monthlyPrice, quarterly: md.quarterlyPrice, sixMonth: md.sixMonthPrice, annual: md.annualPrice, lifetime: md.lifetimePrice };
  const price = Number(tier?.[interval] ?? prices[interval] ?? 0);
  const trial = tier?.trial || md.trial || 'No free trial';
  const dueToday = trial === 'No free trial' ? price : 0;
  return <SafeAreaView style={s.safe}><View style={s.header}><TouchableOpacity onPress={navigation.goBack}><Ionicons name="chevron-back" size={23} /></TouchableOpacity><Text style={s.headerTitle}>Membership checkout</Text><View style={{ width: 23 }} /></View><ScrollView contentContainerStyle={s.content}>
    <Text style={s.title}>{asset.title}</Text><Text style={s.tier}>{tier?.name || 'Community membership'}</Text><Text style={s.label}>Billing frequency</Text>
    <View style={s.options}>{(['monthly', 'quarterly', 'sixMonth', 'annual', 'lifetime'] as Interval[]).map((item) => <TouchableOpacity key={item} style={[s.option, item === interval && s.optionOn]} onPress={() => setInterval(item)}><Text style={[s.optionText, item === interval && s.optionTextOn]}>{item}</Text></TouchableOpacity>)}</View>
    <View style={s.summary}><Line label="Trial" value={trial} /><Line label="Amount due today" value={`${md.currency || 'USD'} ${dueToday.toFixed(2)}`} /><Line label="Amount after trial" value={`${md.currency || 'USD'} ${price.toFixed(2)}`} /><Line label="Billing interval" value={interval} /><Line label="Automatic renewal" value={md.autoRenew ? 'Enabled' : 'Disabled'} /></View>
    <Text style={s.terms}>{md.lifetimeTerms || 'Access begins only after the payment provider confirms the transaction.'}</Text>
    <TouchableOpacity style={s.confirm} onPress={() => Alert.alert('Secure checkout required', 'Subscription payment processing must confirm the charge before membership access can be granted. No membership has been created yet.')}><Text style={s.confirmText}>Continue to secure payment</Text></TouchableOpacity>
  </ScrollView></SafeAreaView>;
}
function Line({ label, value }: { label: string; value: string }) { return <View style={s.line}><Text style={s.lineLabel}>{label}</Text><Text style={s.lineValue}>{value}</Text></View>; }
const s = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.background }, header: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg }, headerTitle: { fontSize: 17, fontWeight: '800' }, loading: { margin: 30, color: colors.textSecondary }, content: { padding: spacing.lg }, title: { fontSize: 24, fontWeight: '900' }, tier: { fontSize: 14, color: colors.textSecondary, marginTop: 4 }, label: { fontSize: 12, fontWeight: '800', marginTop: 24, marginBottom: 10 }, options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, option: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: '#fff' }, optionOn: { borderColor: colors.primary, backgroundColor: '#FFF0E8' }, optionText: { fontSize: 11, color: colors.textSecondary }, optionTextOn: { color: colors.primary, fontWeight: '800' }, summary: { backgroundColor: '#fff', borderRadius: radii.xl, padding: 16, marginTop: 20 }, line: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.border }, lineLabel: { color: colors.textSecondary, fontSize: 12 }, lineValue: { fontWeight: '700', fontSize: 12 }, terms: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 16 }, confirm: { backgroundColor: colors.primary, borderRadius: radii.pill, padding: 15, alignItems: 'center', marginTop: 20 }, confirmText: { color: '#fff', fontWeight: '800' } });
