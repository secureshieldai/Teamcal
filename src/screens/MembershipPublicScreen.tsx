import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { earnService, type EarnAsset, type MembershipMetadata } from '../services/api/earn.service';
import { colors, radii, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'MembershipPublic'>;

export default function MembershipPublicScreen({ route, navigation }: Props) {
  const [asset, setAsset] = useState<EarnAsset | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    earnService.getPublicMembership(route.params.membershipId).then(setAsset).catch((e) => { setError(e.message); Alert.alert('Unable to load', e.message); });
  }, [route.params.membershipId]);
  if (!asset) return <SafeAreaView style={s.safe}><Text style={s.loading}>{error || 'Loading membership…'}</Text></SafeAreaView>;
  const md = (asset.metadata || {}) as MembershipMetadata;
  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.content}>
    <TouchableOpacity style={s.back} onPress={navigation.goBack}><Ionicons name="chevron-back" size={23} /></TouchableOpacity>
    <Image source={{ uri: md.banner || `https://picsum.photos/seed/banner-${asset.id}/800/350` }} style={s.banner} />
    <Image source={{ uri: md.profileImage || `https://picsum.photos/seed/${asset.id}/200` }} style={s.avatar} />
    <Text style={s.title}>{asset.title}</Text><Text style={s.muted}>TeamCal community · {Number(asset.metrics?.members || 0)} members</Text><Text style={s.body}>{asset.description}</Text>
    <Text style={s.section}>What members receive</Text><Text style={s.body}>{md.memberReceives || md.valueProposition}</Text>
    {md.benefits?.map((benefit) => <View key={benefit} style={s.benefit}><Ionicons name="checkmark-circle" size={18} color={colors.success} /><Text style={s.body}>{benefit}</Text></View>)}
    <Text style={s.section}>Membership options</Text>
    {md.tiers?.map((tier) => <View key={tier.id} style={[s.card, { borderLeftColor: tier.color || colors.primary }]}><Text style={s.cardTitle}>{tier.name}</Text><Text style={s.body}>{tier.description}</Text><Text style={s.price}>${tier.monthly || 0}/month · ${tier.annual || 0}/year</Text><Text style={s.muted}>{tier.trial || md.trial}</Text><TouchableOpacity style={s.join} onPress={() => navigation.navigate('MembershipCheckout', { membershipId: asset.id, tierId: tier.id })}><Text style={s.joinText}>View membership</Text></TouchableOpacity></View>)}
    {!md.tiers?.length && <TouchableOpacity style={s.join} onPress={() => navigation.navigate('MembershipCheckout', { membershipId: asset.id })}><Text style={s.joinText}>View membership</Text></TouchableOpacity>}
    {!!md.faqs?.length && <Text style={s.section}>Frequently asked questions</Text>}{md.faqs?.map((faq, index) => <View key={index} style={s.faq}><Text style={s.cardTitle}>{faq.question}</Text><Text style={s.body}>{faq.answer}</Text></View>)}
    {!!md.rules && <><Text style={s.section}>Community rules</Text><Text style={s.body}>{md.rules}</Text></>}
  </ScrollView></SafeAreaView>;
}

const s = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.background }, content: { padding: spacing.lg, paddingBottom: 50 }, loading: { margin: 30, color: colors.textSecondary }, back: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }, banner: { width: '100%', height: 180, borderRadius: radii.xl }, avatar: { width: 84, height: 84, borderRadius: 42, marginTop: -42, marginLeft: 16, borderWidth: 4, borderColor: '#fff' }, title: { fontSize: 25, fontWeight: '900', marginTop: 10, color: colors.textPrimary }, muted: { fontSize: 12, color: colors.textSecondary, marginTop: 4 }, body: { fontSize: 14, color: colors.textSecondary, lineHeight: 21, marginTop: 7 }, section: { fontSize: 18, fontWeight: '800', marginTop: 24, marginBottom: 8 }, benefit: { flexDirection: 'row', gap: 8, alignItems: 'center' }, card: { backgroundColor: '#fff', borderRadius: radii.xl, padding: 16, marginTop: 10, borderLeftWidth: 4 }, cardTitle: { fontSize: 15, fontWeight: '800' }, price: { fontSize: 15, fontWeight: '800', color: colors.primary, marginTop: 10 }, join: { backgroundColor: colors.primary, borderRadius: radii.pill, padding: 13, alignItems: 'center', marginTop: 14 }, joinText: { color: '#fff', fontWeight: '800' }, faq: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border } });
