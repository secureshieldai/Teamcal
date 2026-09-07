/**
 * MembershipEditorScreen
 * - New membership: redirects to CreateCommunity with mode='membership'
 * - Editing existing: shows a 4-step edit form
 */
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Image, ScrollView, StyleSheet,
  Switch, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { earnService, type MembershipMetadata, type MembershipTier } from '../services/api/earn.service';
import { groupsService } from '../services/api/groups.service';
import { postsService } from '../services/api/posts.service';
import { colors, radii, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'MembershipEditor'>;

export default function MembershipEditorScreen({ route, navigation }: Props) {
  const membershipId = route.params?.membershipId;

  useEffect(() => {
    if (!membershipId) {
      // Redirect new memberships to the community creation flow with paid defaults
      navigation.replace('CreateCommunity', { mode: 'membership' });
    }
  }, []);

  if (!membershipId) {
    return (
      <SafeAreaView style={s.safe}>
        <ActivityIndicator style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  return <EditForm membershipId={membershipId} navigation={navigation} />;
}

// ─── Edit form (existing memberships only) ───────────────────────────────────

const TOTAL = 4;
const PRIVACY_OPTS = [
  'Public community', 'Private community', 'Hidden community',
  'Invite-only community', 'Paid community', 'Free community with paid tiers',
];
const BENEFITS_OPTS = [
  'Exclusive posts', 'Private discussions', 'Group chats', 'Direct messages',
  'Live sessions', 'Events', 'Courses', 'PDFs', 'Videos', 'Templates',
  'Downloadable resources', 'Discounts', 'Challenges', 'Accountability groups',
  'Coaching sessions', 'Early access', 'Member-only products', 'Priority support',
];
const TRIAL_OPTS = ['No free trial', '24-hour free trial', '3-day free trial', '7-day free trial', '14-day free trial'];
const PRICING_OPTS = ['Free Community', 'One-Time Lifetime Payment', 'Recurring Subscription', 'Multiple Membership Tiers'];
const PRICING_KEYS: Record<string, string> = {
  'Free Community': 'free',
  'One-Time Lifetime Payment': 'lifetime',
  'Recurring Subscription': 'recurring',
  'Multiple Membership Tiers': 'tiers',
};
const PRICING_LABELS: Record<string, string> = {
  free: 'Free Community',
  lifetime: 'One-Time Lifetime Payment',
  recurring: 'Recurring Subscription',
  tiers: 'Multiple Membership Tiers',
};

function EditForm({ membershipId, navigation }: { membershipId: string; navigation: Props['navigation'] }) {
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [meta, setMeta] = useState<MembershipMetadata>({
    language: 'English', privacy: 'Paid community',
    pricingModel: 'tiers', currency: 'USD',
    trial: 'No free trial', trialReminder: true,
    autoRenew: true, paymentRequiredForTrial: true,
    tiers: [], benefits: [],
  });

  const md = (patch: Partial<MembershipMetadata>) => setMeta(m => ({ ...m, ...patch }));

  useEffect(() => {
    earnService.getAsset(membershipId)
      .then(asset => {
        setTitle(asset.title);
        setDescription(asset.description || '');
        setMeta((asset.metadata as MembershipMetadata) || {});
      })
      .catch(e => Alert.alert('Unable to load', (e as Error).message))
      .finally(() => setLoading(false));
  }, [membershipId]);

  const pickImage = async (kind: 'profileImage' | 'banner') => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.5 });
    if (r.canceled) return;
    setBusy(true);
    try {
      const url = await postsService.uploadImage({
        uri: r.assets[0].uri,
        mimeType: r.assets[0].mimeType || 'image/jpeg',
        fileName: r.assets[0].fileName || `${kind}.jpg`,
      });
      md({ [kind]: url });
    } catch (e) {
      Alert.alert('Upload failed', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const addTier = () => md({
    tiers: [...(meta.tiers || []), {
      id: `tier-${Date.now()}`,
      name: `Tier ${(meta.tiers?.length || 0) + 1}`,
      description: '', color: '#14B8C4', benefits: [],
    }],
  });

  const updateTier = (i: number, patch: Partial<MembershipTier>) => {
    const tiers = [...(meta.tiers || [])];
    tiers[i] = { ...tiers[i], ...patch };
    md({ tiers });
  };

  const removeTier = (i: number) => md({ tiers: (meta.tiers || []).filter((_, j) => j !== i) });

  const save = async (status: 'draft' | 'published') => {
    if (!title.trim()) return Alert.alert('Community name required');
    setBusy(true);
    try {
      if (meta.groupId) {
        await groupsService.update(meta.groupId, {
          name: title.trim(),
          description: description.trim(),
          cover: meta.banner,
          is_private: !String(meta.privacy).startsWith('Public'),
        });
      }
      const value = {
        subtype: meta.pricingModel || 'tiers',
        title: title.trim(),
        description: description.trim(),
        image: meta.profileImage || undefined,
        status,
        price: Number(meta.monthlyPrice || meta.lifetimePrice || 0),
        currency: meta.currency || 'USD',
        metadata: meta,
      };
      await earnService.updateAsset(membershipId, value);
      navigation.replace('MembershipDashboard', { membershipId });
    } catch (e) {
      Alert.alert('Unable to save', (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const back = () => (step === 1 ? navigation.goBack() : setStep(v => v - 1));
  const next = () => {
    if (step === 1 && !title.trim()) return Alert.alert('Community name required');
    if (step < TOTAL) setStep(v => v + 1);
    else save('published');
  };

  if (loading) {
    return <SafeAreaView style={s.safe}><ActivityIndicator style={{ marginTop: 80 }} /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity style={s.backCircle} onPress={back}>
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Edit membership</Text>
        <Text style={s.stepLabel}>Step {step}/{TOTAL}</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        {step === 1 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Community identity</Text>
            <Fld label="Community name" value={title} onChange={setTitle} />
            <Fld label="Description" value={description} onChange={setDescription} multi />
            <View style={s.imageRow}>
              <ImgBtn label="Profile picture" uri={meta.profileImage} onPress={() => pickImage('profileImage')} />
              <ImgBtn label="Banner image" uri={meta.banner} onPress={() => pickImage('banner')} wide />
            </View>
            <Fld label="Category" value={meta.category || ''} onChange={v => md({ category: v })} />
            <Fld label="Value proposition" value={meta.valueProposition || ''} onChange={v => md({ valueProposition: v })} multi />
          </View>
        )}

        {step === 2 && (
          <View style={s.card}>
            <Text style={s.cardTitle}>Access & permissions</Text>
            <Text style={s.sectionLabel}>VISIBILITY</Text>
            <Chips values={PRIVACY_OPTS} selected={meta.privacy || ''} onSelect={v => md({ privacy: v })} />
            <Fld label="Member approval" value={meta.memberApproval || ''} onChange={v => md({ memberApproval: v })} />
            <Fld label="Posting permissions" value={meta.postingPermission || ''} onChange={v => md({ postingPermission: v })} />
          </View>
        )}

        {step === 3 && (
          <>
            <View style={s.card}>
              <Text style={s.cardTitle}>Pricing & billing</Text>
              <Chips
                values={PRICING_OPTS}
                selected={PRICING_LABELS[meta.pricingModel || 'tiers']}
                onSelect={v => md({ pricingModel: PRICING_KEYS[v] as any })}
              />
              <View style={s.row}>
                <View style={{ flex: 1 }}>
                  <Fld label="Monthly price" value={String(meta.monthlyPrice || '')} onChange={v => md({ monthlyPrice: Number(v) || 0 })} numeric />
                </View>
                <View style={{ flex: 1 }}>
                  <Fld label="Annual price" value={String(meta.annualPrice || '')} onChange={v => md({ annualPrice: Number(v) || 0 })} numeric />
                </View>
              </View>
              <Fld label="Lifetime price" value={String(meta.lifetimePrice || '')} onChange={v => md({ lifetimePrice: Number(v) || 0 })} numeric />
              <Fld label="Currency" value={meta.currency || 'USD'} onChange={v => md({ currency: v.toUpperCase() })} />
              <Text style={s.sectionLabel}>FREE TRIAL</Text>
              <Chips values={TRIAL_OPTS} selected={meta.trial || ''} onSelect={v => md({ trial: v })} />
              <Tog label="Require payment method first" value={!!meta.paymentRequiredForTrial} onChange={v => md({ paymentRequiredForTrial: v })} />
              <Tog label="Auto-renew" value={!!meta.autoRenew} onChange={v => md({ autoRenew: v })} />
            </View>

            <View style={s.card}>
              <Text style={s.cardTitle}>Membership tiers</Text>
              <TouchableOpacity style={s.addTierBtn} onPress={addTier}>
                <Text style={s.addTierBtnText}>+ Add custom tier</Text>
              </TouchableOpacity>
              {(meta.tiers || []).map((tier, i) => (
                <View key={tier.id} style={s.tierCard}>
                  <View style={s.tierHead}>
                    <Text style={s.tierLabel}>Tier {i + 1}</Text>
                    <TouchableOpacity onPress={() => removeTier(i)}>
                      <Ionicons name="trash-outline" size={18} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                  <Fld label="Tier name" value={tier.name} onChange={v => updateTier(i, { name: v })} />
                  <View style={s.row}>
                    <View style={{ flex: 1 }}>
                      <Fld label="Monthly" value={String(tier.monthly || '')} onChange={v => updateTier(i, { monthly: Number(v) || 0 })} numeric />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Fld label="Annual" value={String(tier.annual || '')} onChange={v => updateTier(i, { annual: Number(v) || 0 })} numeric />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {step === 4 && (
          <>
            <View style={s.card}>
              <Text style={s.cardTitle}>Member experience</Text>
              <Text style={s.sectionLabel}>BENEFITS</Text>
              <Chips
                values={BENEFITS_OPTS}
                selectedMany={meta.benefits || []}
                onSelectMulti={b => md({
                  benefits: (meta.benefits || []).includes(b)
                    ? meta.benefits?.filter(x => x !== b)
                    : [...(meta.benefits || []), b],
                })}
              />
              <Fld label="Welcome message" value={meta.welcomeMessage || ''} onChange={v => md({ welcomeMessage: v })} multi />
              <Fld label="Group rules" value={meta.rules || ''} onChange={v => md({ rules: v })} multi />
            </View>
            <TouchableOpacity style={s.draftBtn} onPress={() => save('draft')} disabled={busy}>
              <Text style={s.draftBtnText}>Save as draft</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity style={[s.continueBtn, busy && { opacity: 0.6 }]} onPress={next} disabled={busy}>
          {busy
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.continueBtnText}>{step === TOTAL ? 'Save membership' : 'Continue'}</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function Fld({ label, value, onChange, multi, numeric }: {
  label: string; value: string; onChange: (v: string) => void;
  multi?: boolean; numeric?: boolean;
}) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        style={[s.input, multi && s.inputMulti]}
        value={value}
        onChangeText={onChange}
        multiline={multi}
        keyboardType={numeric ? 'decimal-pad' : 'default'}
        placeholder={label}
        placeholderTextColor={colors.textMuted}
      />
    </View>
  );
}

function Tog({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={s.togRow}>
      <Text style={s.togLabel}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: '#14B8C4' }} thumbColor="#fff" />
    </View>
  );
}

function Chips({ values, selected, selectedMany, onSelect, onSelectMulti }: {
  values: string[]; selected?: string; selectedMany?: string[];
  onSelect?: (v: string) => void; onSelectMulti?: (v: string) => void;
}) {
  return (
    <View style={s.chips}>
      {values.map(v => {
        const active = selectedMany ? selectedMany.includes(v) : selected === v;
        return (
          <TouchableOpacity
            key={v}
            style={[s.chip, active && s.chipOn]}
            onPress={() => (onSelectMulti ? onSelectMulti(v) : onSelect?.(v))}
          >
            <Text style={[s.chipText, active && s.chipTextOn]}>{v}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function ImgBtn({ label, uri, onPress, wide }: { label: string; uri?: string; onPress: () => void; wide?: boolean }) {
  return (
    <TouchableOpacity style={[s.imgBtn, wide && { flex: 2 }]} onPress={onPress}>
      {uri
        ? <Image source={{ uri }} style={{ width: '100%', height: '100%' }} />
        : <><Ionicons name="image-outline" size={26} color="#0E7490" /><Text style={s.imgBtnLabel}>{label}</Text></>}
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#E8F9FA' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.md },
  backCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  stepLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  scroll: { paddingHorizontal: spacing.lg, paddingBottom: 32, gap: spacing.md },
  card: { backgroundColor: '#fff', borderRadius: radii.xl, padding: spacing.lg },
  cardTitle: { fontSize: 17, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.md },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, letterSpacing: 0.8, marginTop: spacing.md, marginBottom: spacing.sm },
  field: { marginBottom: spacing.md },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, paddingHorizontal: 12, paddingVertical: 11, fontSize: 13, color: colors.textPrimary, backgroundColor: '#fff' },
  inputMulti: { minHeight: 78, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: spacing.sm },
  imageRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  imgBtn: { flex: 1, height: 100, borderWidth: 1, borderStyle: 'dashed', borderColor: '#14B8C4', borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  imgBtnLabel: { fontSize: 10, color: '#0E7490', fontWeight: '700', marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md },
  chip: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.xl, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff' },
  chipOn: { borderColor: '#14B8C4', backgroundColor: '#F0FAFA' },
  chipText: { fontSize: 11, color: colors.textSecondary, fontWeight: '700' },
  chipTextOn: { color: '#0E7490' },
  togRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  togLabel: { flex: 1, fontSize: 13, color: colors.textPrimary },
  addTierBtn: { backgroundColor: '#14B8C4', borderRadius: radii.pill, padding: 12, alignItems: 'center', marginBottom: spacing.md },
  addTierBtnText: { color: '#fff', fontWeight: '800' },
  tierCard: { backgroundColor: '#F6FAFA', borderRadius: radii.lg, padding: 12, marginBottom: spacing.sm },
  tierHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  tierLabel: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  draftBtn: { borderWidth: 1.5, borderColor: '#0E7490', borderRadius: radii.pill, padding: 13, alignItems: 'center' },
  draftBtnText: { color: '#0E7490', fontWeight: '800' },
  footer: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  continueBtn: { minHeight: 50, borderRadius: radii.pill, backgroundColor: '#0E9CAF', alignItems: 'center', justifyContent: 'center' },
  continueBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
