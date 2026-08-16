import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
const TOTAL_STEPS = 4;
const PRIVACY = ['Public community', 'Private community', 'Hidden community', 'Invite-only community', 'Paid community', 'Free community with paid tiers'];
const BENEFITS = ['Exclusive posts', 'Private discussions', 'Group chats', 'Direct messages', 'Live sessions', 'Events', 'Courses', 'PDFs', 'Videos', 'Templates', 'Downloadable resources', 'Discounts', 'Challenges', 'Accountability groups', 'Coaching sessions', 'Early access', 'Member-only products', 'Priority support'];
const TRIALS = ['No free trial', '24-hour free trial', '3-day free trial', '7-day free trial', '14-day free trial'];
const PRICING = ['Free Community', 'One-Time Lifetime Payment', 'Recurring Subscription', 'Multiple Membership Tiers'];
const PRICING_KEYS = { 'Free Community': 'free', 'One-Time Lifetime Payment': 'lifetime', 'Recurring Subscription': 'recurring', 'Multiple Membership Tiers': 'tiers' } as const;
const PRICING_LABELS: Record<string, string> = { free: PRICING[0], lifetime: PRICING[1], recurring: PRICING[2], tiers: PRICING[3] };

export default function MembershipEditorScreen({ route, navigation }: Props) {
  const membershipId = route.params?.membershipId;
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(Boolean(membershipId));
  const [form, setForm] = useState({
    title: '', description: '', image: '',
    metadata: { language: 'English', privacy: 'Paid community', discoverability: 'Discoverable', memberApproval: 'Automatic after payment', postingPermission: 'All members', commentPermission: 'All members', dmPermission: 'Members', moderatorPermission: 'Manage content and members', eventPermission: 'Creator and moderators', pricingModel: 'tiers', currency: 'USD', trial: 'No free trial', trialReminder: true, autoRenew: true, paymentRequiredForTrial: true, repeatTrials: false, tiers: [], benefits: [], faqs: [] } as MembershipMetadata,
  });
  const md = (patch: Partial<MembershipMetadata>) => setForm((current) => ({ ...current, metadata: { ...current.metadata, ...patch } }));

  useEffect(() => {
    if (!membershipId) return;
    earnService.getAsset(membershipId)
      .then((asset) => setForm({ title: asset.title, description: asset.description || '', image: asset.image || '', metadata: (asset.metadata as MembershipMetadata) || {} }))
      .catch((error) => Alert.alert('Unable to load', error.message))
      .finally(() => setLoading(false));
  }, [membershipId]);

  const pickImage = async (kind: 'profileImage' | 'banner') => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled) return;
    setBusy(true);
    try { md({ [kind]: await postsService.uploadImage(result.assets[0].uri) }); }
    catch (error) { Alert.alert('Upload failed', (error as Error).message); }
    finally { setBusy(false); }
  };
  const addTier = () => md({ tiers: [...(form.metadata.tiers || []), { id: `tier-${Date.now()}`, name: `Tier ${(form.metadata.tiers?.length || 0) + 1}`, description: '', color: '#14B8C4', benefits: [] }] });
  const updateTier = (index: number, patch: Partial<MembershipTier>) => { const tiers = [...(form.metadata.tiers || [])]; tiers[index] = { ...tiers[index], ...patch }; md({ tiers }); };
  const removeTier = (index: number) => md({ tiers: (form.metadata.tiers || []).filter((_, i) => i !== index) });

  const save = async (status: 'draft' | 'published') => {
    if (!form.title.trim()) return Alert.alert('Community name required', 'Please enter a name before continuing.');
    try {
      setBusy(true);
      let metadata = form.metadata;
      const isPrivate = !String(metadata.privacy).startsWith('Public');
      if (!membershipId && !metadata.groupId) {
        const group = await groupsService.create({ name: form.title.trim(), description: form.description.trim(), isPrivate, cover: metadata.banner });
        metadata = { ...metadata, groupId: group.id };
      } else if (metadata.groupId) {
        await groupsService.update(metadata.groupId, { name: form.title.trim(), description: form.description.trim(), cover: metadata.banner, is_private: isPrivate });
      }
      const value = { subtype: metadata.pricingModel || 'tiers', title: form.title.trim(), description: form.description.trim(), image: metadata.profileImage || form.image || undefined, status, price: Number(metadata.monthlyPrice || metadata.lifetimePrice || 0), currency: metadata.currency || 'USD', metadata };
      const asset = membershipId ? await earnService.updateAsset(membershipId, value) : await earnService.createAsset({ kind: 'membership', ...value });
      navigation.replace('MembershipDashboard', { membershipId: asset.id });
    } catch (error) { Alert.alert('Unable to save', (error as Error).message); }
    finally { setBusy(false); }
  };
  const back = () => step === 1 ? navigation.goBack() : setStep((value) => value - 1);
  const next = () => {
    if (step === 1 && !form.title.trim()) return Alert.alert('Community name required', 'Please enter a name before continuing.');
    if (step < TOTAL_STEPS) setStep((value) => value + 1); else save('published');
  };

  if (loading) return <SafeAreaView style={s.safe}><ActivityIndicator style={{ marginTop: 80 }} /></SafeAreaView>;
  return <SafeAreaView style={s.safe}>
    <View style={s.header}><TouchableOpacity style={s.back} onPress={back}><Ionicons name="chevron-back" size={20} /></TouchableOpacity><Text style={s.headerTitle}>{membershipId ? 'Edit membership' : 'Create membership'}</Text><Text style={s.step}>Step {step}/{TOTAL_STEPS}</Text></View>
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      {step === 1 && <><Text style={s.lead}>Start with the identity and purpose of your membership community.</Text><Section title="Community identity">
        <Field label="Community name" value={form.title} set={(title) => setForm((value) => ({ ...value, title }))} />
        <Field label="Description" value={form.description} set={(description) => setForm((value) => ({ ...value, description }))} multi />
        <View style={s.images}><ImagePickerButton label="Profile picture" uri={form.metadata.profileImage} onPress={() => pickImage('profileImage')} /><ImagePickerButton wide label="Community banner" uri={form.metadata.banner} onPress={() => pickImage('banner')} /></View>
        <Row><Field half label="Category" value={form.metadata.category || ''} set={(category) => md({ category })} /><Field half label="Subcategory" value={form.metadata.subcategory || ''} set={(subcategory) => md({ subcategory })} /></Row>
        <Field label="Value proposition" value={form.metadata.valueProposition || ''} set={(valueProposition) => md({ valueProposition })} multi />
        <Field label="Who this community is for" value={form.metadata.audience || ''} set={(audience) => md({ audience })} multi />
        <Field label="What members receive" value={form.metadata.memberReceives || ''} set={(memberReceives) => md({ memberReceives })} multi />
      </Section></>}

      {step === 2 && <><Text style={s.lead}>Choose how members discover, join, and interact with the community.</Text><Section title="Access and permissions">
        <Label>COMMUNITY VISIBILITY</Label><Choice values={PRIVACY} selected={form.metadata.privacy || ''} set={(privacy) => md({ privacy })} />
        <Field label="Discoverability" value={form.metadata.discoverability || ''} set={(discoverability) => md({ discoverability })} />
        <Field label="Member approval" value={form.metadata.memberApproval || ''} set={(memberApproval) => md({ memberApproval })} />
        <Field label="Posting permissions" value={form.metadata.postingPermission || ''} set={(postingPermission) => md({ postingPermission })} />
        <Field label="Comment permissions" value={form.metadata.commentPermission || ''} set={(commentPermission) => md({ commentPermission })} />
        <Field label="Direct-message permissions" value={form.metadata.dmPermission || ''} set={(dmPermission) => md({ dmPermission })} />
        <Field label="Moderator permissions" value={form.metadata.moderatorPermission || ''} set={(moderatorPermission) => md({ moderatorPermission })} />
        <Field label="Event permissions" value={form.metadata.eventPermission || ''} set={(eventPermission) => md({ eventPermission })} />
        <Field label="Content-access rules" value={form.metadata.contentRules || ''} set={(contentRules) => md({ contentRules })} multi />
      </Section></>}

      {step === 3 && <><Text style={s.lead}>Set the membership price, billing cycle, free trial, and optional tiers.</Text><Section title="Pricing model">
        <Choice values={PRICING} selected={PRICING_LABELS[form.metadata.pricingModel || 'tiers']} set={(value) => md({ pricingModel: PRICING_KEYS[value as keyof typeof PRICING_KEYS] })} />
        <Row><Field half numeric label="Lifetime price" value={String(form.metadata.lifetimePrice || '')} set={(value) => md({ lifetimePrice: Number(value) || 0 })} /><Field half label="Currency" value={form.metadata.currency || 'USD'} set={(currency) => md({ currency: currency.toUpperCase() })} /></Row>
        <Row><Field half numeric label="Monthly price" value={String(form.metadata.monthlyPrice || '')} set={(value) => md({ monthlyPrice: Number(value) || 0 })} /><Field half numeric label="Quarterly price" value={String(form.metadata.quarterlyPrice || '')} set={(value) => md({ quarterlyPrice: Number(value) || 0 })} /></Row>
        <Row><Field half numeric label="Six-month price" value={String(form.metadata.sixMonthPrice || '')} set={(value) => md({ sixMonthPrice: Number(value) || 0 })} /><Field half numeric label="Annual price" value={String(form.metadata.annualPrice || '')} set={(value) => md({ annualPrice: Number(value) || 0 })} /></Row>
        <Label>FREE TRIAL</Label><Choice values={TRIALS} selected={form.metadata.trial || ''} set={(trial) => md({ trial })} />
        <Toggle label="Require payment method first" value={!!form.metadata.paymentRequiredForTrial} set={(paymentRequiredForTrial) => md({ paymentRequiredForTrial })} />
        <Toggle label="Remind before trial ends" value={!!form.metadata.trialReminder} set={(trialReminder) => md({ trialReminder })} />
        <Toggle label="Renew automatically" value={!!form.metadata.autoRenew} set={(autoRenew) => md({ autoRenew })} />
      </Section>
      <Section title="Membership tiers"><TouchableOpacity onPress={addTier} style={s.add}><Text style={s.addText}>+ Add custom tier</Text></TouchableOpacity>{form.metadata.tiers?.map((tier, index) => <View key={tier.id} style={s.tier}><View style={s.tierHead}><Text style={s.tierTitle}>Tier {index + 1}</Text><TouchableOpacity onPress={() => removeTier(index)}><Ionicons name="trash-outline" size={18} color="#DC2626" /></TouchableOpacity></View><Field label="Tier name" value={tier.name} set={(name) => updateTier(index, { name })} /><Field label="Description" value={tier.description} set={(description) => updateTier(index, { description })} /><Row><Field half numeric label="Monthly" value={String(tier.monthly || '')} set={(value) => updateTier(index, { monthly: Number(value) || 0 })} /><Field half numeric label="Annual" value={String(tier.annual || '')} set={(value) => updateTier(index, { annual: Number(value) || 0 })} /></Row><Choice values={TRIALS} selected={tier.trial || ''} set={(trial) => updateTier(index, { trial })} /></View>)}</Section></>}

      {step === 4 && <><Text style={s.lead}>Finish the member experience, review your choices, then publish.</Text><Section title="Member experience">
        <Label>COMMUNITY BENEFITS</Label><Choice multi values={BENEFITS} selectedMany={form.metadata.benefits || []} set={(benefit) => md({ benefits: (form.metadata.benefits || []).includes(benefit) ? form.metadata.benefits?.filter((value) => value !== benefit) : [...(form.metadata.benefits || []), benefit] })} />
        <Field label="Welcome message" value={form.metadata.welcomeMessage || ''} set={(welcomeMessage) => md({ welcomeMessage })} multi />
        <Field label="Group rules" value={form.metadata.rules || ''} set={(rules) => md({ rules })} multi />
        <Field label="Frequently asked questions (question|answer per line)" value={(form.metadata.faqs || []).map((item) => `${item.question}|${item.answer}`).join('\n')} set={(value) => md({ faqs: value.split('\n').filter(Boolean).map((line) => { const [question, answer = ''] = line.split('|'); return { question, answer }; }) })} multi />
        <Field label="Community language" value={form.metadata.language || ''} set={(language) => md({ language })} />
      </Section><TouchableOpacity disabled={busy} style={s.draft} onPress={() => save('draft')}><Text style={s.draftText}>Save as draft</Text></TouchableOpacity></>}
    </ScrollView>
    <View style={s.footer}><TouchableOpacity disabled={busy} style={[s.continue, busy && s.disabled]} onPress={next}>{busy ? <ActivityIndicator color="#fff" /> : <Text style={s.continueText}>{step === TOTAL_STEPS ? (membershipId ? 'Save membership' : 'Create membership') : 'Continue'}</Text>}</TouchableOpacity></View>
  </SafeAreaView>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) { return <View style={s.section}><Text style={s.sectionTitle}>{title}</Text>{children}</View>; }
function Label({ children }: { children: string }) { return <Text style={s.labelCaps}>{children}</Text>; }
function Row({ children }: { children: React.ReactNode }) { return <View style={s.row}>{children}</View>; }
function Field({ label, value, set, multi, half, numeric }: { label: string; value: string; set: (value: string) => void; multi?: boolean; half?: boolean; numeric?: boolean }) { return <View style={[s.field, half && s.half]}><Text style={s.label}>{label}</Text><TextInput style={[s.input, multi && s.multi]} value={value} onChangeText={set} multiline={multi} keyboardType={numeric ? 'decimal-pad' : 'default'} placeholder={label} placeholderTextColor={colors.textMuted} /></View>; }
function Toggle({ label, value, set }: { label: string; value: boolean; set: (value: boolean) => void }) { return <View style={s.toggle}><Text style={s.toggleText}>{label}</Text><Switch value={value} onValueChange={set} trackColor={{ true: '#14B8C4' }} /></View>; }
function Choice({ values, selected, set, multi, selectedMany = [] }: { values: string[]; selected?: string; set: (value: string) => void; multi?: boolean; selectedMany?: string[] }) { return <View style={s.choices}>{values.map((value) => { const active = multi ? selectedMany.includes(value) : selected === value; return <TouchableOpacity key={value} style={[s.chip, active && s.chipOn]} onPress={() => set(value)}><Text style={[s.chipText, active && s.chipTextOn]}>{value}</Text></TouchableOpacity>; })}</View>; }
function ImagePickerButton({ label, uri, onPress, wide }: { label: string; uri?: string; onPress: () => void; wide?: boolean }) { return <TouchableOpacity style={[s.imagePick, wide && { flex: 2 }]} onPress={onPress}>{uri ? <Image source={{ uri }} style={s.image} /> : <><Ionicons name="image-outline" size={28} color="#0E7490" /><Text style={s.small}>{label}</Text></>}</TouchableOpacity>; }

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#E8F9FA' }, header: { height: 58, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, gap: spacing.md }, back: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }, headerTitle: { ...typography.h2, flex: 1 }, step: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' }, content: { paddingHorizontal: spacing.lg, paddingBottom: 30 }, lead: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginTop: spacing.sm }, section: { backgroundColor: '#fff', borderRadius: radii.xl, padding: spacing.lg, marginTop: spacing.lg }, sectionTitle: { fontSize: 17, fontWeight: '800', marginBottom: spacing.md }, field: { marginBottom: spacing.md }, half: { flex: 1 }, label: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, marginBottom: 6 }, labelCaps: { fontSize: 11, fontWeight: '800', color: colors.textSecondary, letterSpacing: 0.7, marginBottom: spacing.sm }, input: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, paddingHorizontal: 12, paddingVertical: 11, fontSize: 13, color: colors.textPrimary, backgroundColor: '#fff' }, multi: { minHeight: 78, textAlignVertical: 'top' }, row: { flexDirection: 'row', gap: spacing.sm }, images: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }, imagePick: { flex: 1, height: 105, borderWidth: 1, borderStyle: 'dashed', borderColor: '#14B8C4', borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, image: { width: '100%', height: '100%' }, small: { fontSize: 10, color: '#0E7490', fontWeight: '700', marginTop: 4 }, choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: spacing.md }, chip: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.xl, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff' }, chipOn: { borderColor: '#14B8C4', backgroundColor: '#F0FAFA' }, chipText: { fontSize: 11, color: colors.textSecondary, fontWeight: '700' }, chipTextOn: { color: '#0E7490' }, toggle: { minHeight: 46, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: colors.border }, toggleText: { flex: 1, fontSize: 13 }, add: { backgroundColor: '#14B8C4', borderRadius: radii.pill, padding: 12, alignItems: 'center' }, addText: { color: '#fff', fontWeight: '800' }, tier: { marginTop: 12, padding: 12, backgroundColor: '#F6FAFA', borderRadius: radii.lg }, tierHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }, tierTitle: { fontSize: 14, fontWeight: '800' }, draft: { marginTop: spacing.lg, borderWidth: 1.5, borderColor: '#0E7490', borderRadius: radii.pill, padding: 13, alignItems: 'center' }, draftText: { color: '#0E7490', fontWeight: '800' }, footer: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md }, continue: { minHeight: 50, borderRadius: radii.pill, backgroundColor: '#0E9CAF', alignItems: 'center', justifyContent: 'center' }, disabled: { opacity: 0.65 }, continueText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
