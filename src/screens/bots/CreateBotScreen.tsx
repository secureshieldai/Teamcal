import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radii, spacing } from '../../theme';
import {
  StepBar, WizardHeader, WizardNav, Field, LanguageDropdown, ToggleRow, sw,
} from '../earn/video/VideoWizardShared';
import type { RootStackParamList } from '../../navigation/types';
import { botsService } from '../../services/api/bots.service';
import { postsService } from '../../services/api/posts.service';
import type { BotAutomation, BotConnection, BotKnowledgeBase, BotPermissionKey, BotType } from '../../types/bots';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateBot'>;

const TONES = ['Warm & friendly', 'Warm & professional', 'Concise & direct', 'Playful', 'Formal'];

const SPACE_AUTOMATIONS: { kind: BotAutomation['kind']; label: string; hint: string }[] = [
  { kind: 'welcome_dm', label: 'Welcome new members', hint: 'Private DM when someone joins' },
  { kind: 'onboarding', label: 'Send onboarding steps', hint: 'Follow-up getting-started messages' },
  { kind: 'faq', label: 'Answer questions', hint: 'Reply from the Knowledge Base' },
  { kind: 'announcement', label: 'Publish / schedule announcements', hint: 'Post updates to connected spaces' },
  { kind: 'reminder', label: 'Send reminders', hint: 'Events, live sessions, renewals' },
  { kind: 'recommend_resource', label: 'Recommend resources', hint: 'Point members to selected content' },
  { kind: 'spam_detect', label: 'Detect spam & prohibited content', hint: 'Flag and notify admins' },
  { kind: 'notify_admins', label: 'Notify admins of reports', hint: 'Escalate suspicious activity' },
  { kind: 'confirm_membership', label: 'Confirm active membership', hint: 'Check status on request' },
  { kind: 'manage_access', label: 'Grant / remove access', hint: 'When membership begins or expires' },
  { kind: 'collect_replies', label: 'Collect private replies', hint: 'Forward member replies to admins' },
  { kind: 'escalate', label: 'Escalate to a human admin', hint: 'Hand off unresolved questions' },
];

const PERMISSIONS: { key: BotPermissionKey; label: string }[] = [
  { key: 'send_dms', label: 'Send private messages' },
  { key: 'publish_announcements', label: 'Publish or schedule announcements' },
  { key: 'view_member_info', label: 'View basic member information' },
  { key: 'create_polls', label: 'Create polls or quizzes' },
  { key: 'moderate_content', label: 'Moderate messages or comments' },
  { key: 'access_resources', label: 'Access selected resources' },
  { key: 'manage_membership_access', label: 'Manage membership access' },
  { key: 'collect_lead_info', label: 'Collect approved lead information' },
  { key: 'display_products', label: 'Display selected products or services' },
  { key: 'open_checkout', label: 'Open approved checkout or booking pages' },
  { key: 'notify_admins', label: 'Notify or transfer conversations to admins' },
];

export default function CreateBotScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Props['route']>();
  const preset = route.params ?? {};

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [type, setType] = useState<BotType>(preset.presetType ?? 'space');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [description, setDescription] = useState('');
  const [purpose, setPurpose] = useState('');
  const [welcome, setWelcome] = useState('');
  const [tone, setTone] = useState(TONES[1]);
  const [language, setLanguage] = useState('English');

  // space bot
  const [spaces, setSpaces] = useState<{ channels: BotConnection[]; communities: BotConnection[] }>({ channels: [], communities: [] });
  const [spacesLoading, setSpacesLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Record<string, BotConnection>>({});
  const [automations, setAutomations] = useState<Record<string, boolean>>({ welcome_dm: true, faq: true });

  // conversational bot
  const [kb, setKb] = useState<BotKnowledgeBase>({});
  const [addSequence, setAddSequence] = useState(true);

  const [permissions, setPermissions] = useState<Partial<Record<BotPermissionKey, boolean>>>({});

  useEffect(() => {
    if (type !== 'space') return;
    setSpacesLoading(true);
    botsService.spaces()
      .then((r) => {
        setSpaces({ channels: r.channels, communities: r.communities });
        if (preset.spaceId) {
          const match = [...r.channels, ...r.communities].find((x) => x.space_id === preset.spaceId);
          if (match) setSelected({ [match.space_id]: match });
        }
      })
      .catch((e) => Alert.alert('Could not load your spaces', (e as Error).message))
      .finally(() => setSpacesLoading(false));
  }, [type, preset.spaceId]);

  const steps = type === 'space'
    ? ['Type', 'Identity', 'Connect', 'Automations', 'Permissions', 'Review']
    : ['Type', 'Identity', 'Knowledge', 'Sequence', 'Permissions', 'Review'];

  const allSpaces = useMemo(
    () => [...spaces.channels, ...spaces.communities],
    [spaces]
  );
  const filteredSpaces = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allSpaces;
    return allSpaces.filter((x) => (x.space_name ?? '').toLowerCase().includes(q));
  }, [allSpaces, search]);

  const toggleSpace = (space: BotConnection) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[space.space_id]) delete next[space.space_id];
      else next[space.space_id] = space;
      return next;
    });
  };

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) setAvatar(result.assets[0].uri);
  };

  const canNext = () => {
    if (step === 0) return true;
    if (step === 1) return name.trim().length > 1;
    if (step === 2 && type === 'space') return Object.keys(selected).length > 0;
    return true;
  };

  const submit = async (activate: boolean) => {
    setSaving(true);
    try {
      let avatarUrl = avatar;
      if (avatar && !avatar.startsWith('http')) {
        try { avatarUrl = await postsService.uploadImage({ uri: avatar }); } catch { avatarUrl = ''; }
      }

      const connections = Object.values(selected);
      const automationList: BotAutomation[] = type === 'space'
        ? SPACE_AUTOMATIONS.map((a) => ({ kind: a.kind, enabled: !!automations[a.kind], config: {} }))
        : [];

      const bot = await botsService.create({
        type,
        name: name.trim(),
        avatar: avatarUrl || null,
        description: description.trim(),
        purpose: purpose.trim(),
        welcome_message: welcome.trim(),
        tone,
        language,
        knowledge_base: type === 'conversational' ? kb : undefined,
        permissions,
        connections: type === 'space' ? connections : undefined,
        automations: automationList,
        sequence: type === 'conversational' && addSequence ? defaultSequence(name) : undefined,
      });

      if (activate) {
        try { await botsService.activate(bot.id); } catch (e) {
          Alert.alert('Saved as draft', `The bot was created but could not be activated: ${(e as Error).message}`);
        }
      }
      navigation.replace('BotManage', { botId: bot.id });
    } catch (e) {
      Alert.alert('Could not create bot', (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <WizardHeader title="Create Bot" onBack={() => (step === 0 ? navigation.goBack() : setStep(step - 1))} />
      <StepBar steps={steps} current={step} />

      {step === 0 && (
        <ScrollView contentContainerStyle={sw.stepContent}>
          <Text style={sw.stepTitle}>Choose a bot type</Text>
          <Text style={sw.stepSub}>You can change most settings later.</Text>
          <TypeCard
            active={type === 'space'}
            icon="hardware-chip-outline"
            title="Channel or Community/Membership Bot"
            body="Automates activities inside Channels or Communities you own or manage — welcomes, FAQs, announcements, reminders, moderation."
            onPress={() => setType('space')}
          />
          <TypeCard
            active={type === 'conversational'}
            icon="chatbubbles-outline"
            title="Conversational Business Bot"
            body="Chats privately with leads and customers through a shareable link — answers questions, recommends offers, collects leads, books appointments."
            onPress={() => setType('conversational')}
          />
        </ScrollView>
      )}

      {step === 1 && (
        <ScrollView contentContainerStyle={sw.stepContent} keyboardShouldPersistTaps="handled">
          <Text style={sw.stepTitle}>Bot identity</Text>
          <TouchableOpacity style={st.avatarPick} onPress={pickAvatar}>
            {avatar ? <Image source={{ uri: avatar }} style={st.avatarImg} /> : <Ionicons name="camera-outline" size={22} color={colors.primary} />}
            <Text style={st.avatarText}>{avatar ? 'Change photo' : 'Add profile photo'}</Text>
          </TouchableOpacity>
          <Field label="Bot name" value={name} onChangeText={setName} placeholder="e.g. Community Helper" required maxLength={80} />
          <Field label="Short description" value={description} onChangeText={setDescription} placeholder="One line about this bot" multiline maxLength={160} />
          <Field label="Purpose" value={purpose} onChangeText={setPurpose} placeholder="What should this bot achieve?" multiline maxLength={280} />
          <Field label="Welcome message" value={welcome} onChangeText={setWelcome} placeholder="First message people receive" multiline maxLength={500} />
          <Text style={sw.fieldLabel}>Tone</Text>
          <View style={st.chips}>
            {TONES.map((t) => (
              <TouchableOpacity key={t} style={[st.chip, tone === t && st.chipActive]} onPress={() => setTone(t)}>
                <Text style={[st.chipText, tone === t && st.chipTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={{ height: spacing.md }} />
          <LanguageDropdown value={language} onChange={setLanguage} />
        </ScrollView>
      )}

      {step === 2 && type === 'space' && (
        <ScrollView contentContainerStyle={sw.stepContent} keyboardShouldPersistTaps="handled">
          <Text style={sw.stepTitle}>Connect spaces</Text>
          <Text style={sw.stepSub}>Only Channels and Communities/Memberships you own or manage are shown.</Text>
          <View style={st.searchBox}>
            <Ionicons name="search" size={16} color={colors.textMuted} />
            <TextInput
              style={st.searchInput}
              placeholder="Search your spaces"
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          {spacesLoading ? (
            <Text style={sw.stepSub}>Loading your spaces…</Text>
          ) : filteredSpaces.length === 0 ? (
            <Text style={sw.stepSub}>No spaces found. Create a Channel or Community first.</Text>
          ) : (
            filteredSpaces.map((space) => {
              const on = !!selected[space.space_id];
              return (
                <TouchableOpacity key={space.space_id} style={st.spaceRow} onPress={() => toggleSpace(space)}>
                  <View style={[st.check, on && st.checkOn]}>{on && <Ionicons name="checkmark" size={13} color={colors.white} />}</View>
                  <View style={{ flex: 1 }}>
                    <Text style={st.spaceName}>{space.space_name}</Text>
                    <Text style={st.spaceType}>{space.space_type === 'channel' ? 'Channel' : 'Community / Membership'}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}

      {step === 3 && type === 'space' && (
        <ScrollView contentContainerStyle={sw.stepContent}>
          <Text style={sw.stepTitle}>Automations</Text>
          <Text style={sw.stepSub}>Turn on what this bot should do. You can fine-tune each one after creating.</Text>
          {SPACE_AUTOMATIONS.map((a) => (
            <View key={a.kind} style={st.autoRow}>
              <View style={{ flex: 1 }}>
                <Text style={st.autoLabel}>{a.label}</Text>
                <Text style={st.autoHint}>{a.hint}</Text>
              </View>
              <ToggleRow label="" value={!!automations[a.kind]} onChange={(v) => setAutomations((p) => ({ ...p, [a.kind]: v }))} />
            </View>
          ))}
        </ScrollView>
      )}

      {step === 2 && type === 'conversational' && (
        <ScrollView contentContainerStyle={sw.stepContent} keyboardShouldPersistTaps="handled">
          <Text style={sw.stepTitle}>Knowledge Base</Text>
          <Text style={sw.stepSub}>The bot answers only from this. If something is missing it says so and offers a human.</Text>
          <Field label="Business information" value={kb.business ?? ''} onChangeText={(v) => setKb({ ...kb, business: v })} multiline placeholder="What the business does, who it helps" />
          <Field label="Products & services" value={(kb.products ?? []).join('\n')} onChangeText={(v) => setKb({ ...kb, products: splitLines(v) })} multiline placeholder="One per line" />
          <Field label="Prices & plans" value={(kb.prices ?? []).join('\n')} onChangeText={(v) => setKb({ ...kb, prices: splitLines(v) })} multiline placeholder="One per line" />
          <Field label="FAQs" value={faqsToText(kb.faqs)} onChangeText={(v) => setKb({ ...kb, faqs: textToFaqs(v) })} multiline placeholder={'Question? Answer\nOne per line'} />
          <Field label="Opening hours" value={kb.hours ?? ''} onChangeText={(v) => setKb({ ...kb, hours: v })} placeholder="Mon–Fri 9am–5pm" />
          <Field label="Delivery information" value={kb.delivery ?? ''} onChangeText={(v) => setKb({ ...kb, delivery: v })} multiline />
          <Field label="Refund & cancellation policy" value={kb.refunds ?? ''} onChangeText={(v) => setKb({ ...kb, refunds: v })} multiline />
          <Field label="Booking information" value={kb.booking ?? ''} onChangeText={(v) => setKb({ ...kb, booking: v })} multiline />
          <Field label="Membership details" value={kb.membership ?? ''} onChangeText={(v) => setKb({ ...kb, membership: v })} multiline />
          <Field label="Approved links" value={(kb.links ?? []).join('\n')} onChangeText={(v) => setKb({ ...kb, links: splitLines(v) })} multiline placeholder="One URL per line" />
          <Field label="Extra instructions" value={kb.instructions ?? ''} onChangeText={(v) => setKb({ ...kb, instructions: v })} multiline />
        </ScrollView>
      )}

      {step === 3 && type === 'conversational' && (
        <ScrollView contentContainerStyle={sw.stepContent}>
          <Text style={sw.stepTitle}>Message sequence</Text>
          <Text style={sw.stepSub}>A simple guided flow the bot can follow. You can edit every step after creating.</Text>
          <ToggleRow label="Use a guided sequence" value={addSequence} onChange={setAddSequence} />
          {addSequence && (
            <View style={st.seqCard}>
              {defaultSequence(name || 'this business').map((s2) => (
                <View key={s2.order} style={st.seqRow}>
                  <Text style={st.seqNum}>{s2.order}</Text>
                  <Text style={st.seqText}>{s2.message}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {step === 4 && (
        <ScrollView contentContainerStyle={sw.stepContent}>
          <Text style={sw.stepTitle}>Permissions</Text>
          <Text style={sw.stepSub}>Choose exactly what the bot may do. Nothing is granted automatically.</Text>
          {PERMISSIONS.map((p) => (
            <TouchableOpacity key={p.key} style={st.spaceRow} onPress={() => setPermissions((prev) => ({ ...prev, [p.key]: !prev[p.key] }))}>
              <View style={[st.check, permissions[p.key] && st.checkOn]}>
                {permissions[p.key] && <Ionicons name="checkmark" size={13} color={colors.white} />}
              </View>
              <Text style={[st.spaceName, { flex: 1 }]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {step === 5 && (
        <ScrollView contentContainerStyle={sw.stepContent}>
          <Text style={sw.stepTitle}>Review</Text>
          <View style={st.review}>
            <ReviewRow label="Type" value={type === 'space' ? 'Channel / Community bot' : 'Conversational business bot'} />
            <ReviewRow label="Name" value={name} />
            <ReviewRow label="Tone" value={tone} />
            <ReviewRow label="Language" value={language} />
            {type === 'space' && <ReviewRow label="Connected" value={Object.values(selected).map((x) => x.space_name).join(', ') || 'None'} />}
            {type === 'space' && (
              <ReviewRow label="Automations" value={SPACE_AUTOMATIONS.filter((a) => automations[a.kind]).map((a) => a.label).join(', ') || 'None'} />
            )}
            <ReviewRow label="Permissions" value={PERMISSIONS.filter((p) => permissions[p.key]).map((p) => p.label).join(', ') || 'None'} />
          </View>
          <Text style={st.disclose}>
            {type === 'conversational'
              ? 'This bot will always identify itself as an automated assistant and will never claim to be a human. It will not collect passwords, PINs, card details or verification codes.'
              : 'This bot acts only within the permissions you selected and the spaces you connected.'}
          </Text>
          <TouchableOpacity style={st.primaryBtn} disabled={saving} onPress={() => submit(true)}>
            <Text style={st.primaryBtnText}>{saving ? 'Working…' : 'Activate Bot'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={st.ghostBtn} disabled={saving} onPress={() => submit(false)}>
            <Text style={st.ghostBtnText}>Save as Draft</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {step < 5 && (
        <WizardNav
          onBack={step === 0 ? undefined : () => setStep(step - 1)}
          onNext={() => setStep(step + 1)}
          nextDisabled={!canNext()}
          nextLabel={step === 4 ? 'Review' : 'Next'}
        />
      )}
    </SafeAreaView>
  );
}

function splitLines(v: string) {
  return v.split('\n').map((x) => x.trim()).filter(Boolean);
}
function faqsToText(faqs?: { q: string; a: string }[]) {
  return (faqs ?? []).map((f) => `${f.q} ${f.a}`).join('\n');
}
function textToFaqs(v: string) {
  return splitLines(v).map((line) => {
    const idx = line.indexOf('?');
    if (idx === -1) return { q: line, a: '' };
    return { q: line.slice(0, idx + 1).trim(), a: line.slice(idx + 1).trim() };
  }).filter((f) => f.q);
}
function defaultSequence(businessName: string) {
  return [
    { order: 1, message: `Welcome! I'm the automated assistant for ${businessName}.` },
    { order: 2, message: 'Understand the customer’s need — ask what they’re looking for.' },
    { order: 3, message: 'Recommend a suitable offer from the Knowledge Base.' },
    { order: 4, message: 'Answer any questions.' },
    { order: 5, message: 'With consent, collect name and contact details.' },
    { order: 6, message: 'Direct to the checkout or booking page.' },
    { order: 7, message: 'Send a follow-up message if the customer consented.' },
  ];
}

function TypeCard({ active, icon, title, body, onPress }: { active: boolean; icon: keyof typeof Ionicons.glyphMap; title: string; body: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={[st.typeCard, active && st.typeCardActive]} onPress={onPress} activeOpacity={0.9}>
      <View style={[st.typeIcon, active && st.typeIconActive]}>
        <Ionicons name={icon} size={20} color={active ? colors.white : colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[st.typeTitle, active && { color: colors.primary }]}>{title}</Text>
        <Text style={st.typeBody}>{body}</Text>
      </View>
      <View style={[st.radio, active && st.radioOn]}>{active && <View style={st.radioDot} />}</View>
    </TouchableOpacity>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={st.reviewRow}>
      <Text style={st.reviewLabel}>{label}</Text>
      <Text style={st.reviewValue} numberOfLines={3}>{value || '—'}</Text>
    </View>
  );
}

const st = StyleSheet.create({
  typeCard: { flexDirection: 'row', gap: spacing.md, alignItems: 'center', borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.lg, padding: spacing.md, marginBottom: spacing.md, backgroundColor: colors.card },
  typeCardActive: { borderColor: colors.primary, backgroundColor: '#FFF8F5' },
  typeIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFEDE3', alignItems: 'center', justifyContent: 'center' },
  typeIconActive: { backgroundColor: colors.primary },
  typeTitle: { fontSize: 13.5, fontWeight: '800', color: colors.textPrimary },
  typeBody: { fontSize: 11.5, color: colors.textSecondary, marginTop: 3, lineHeight: 16 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },

  avatarPick: { alignItems: 'center', justifyContent: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radii.lg, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.primary, marginBottom: spacing.md },
  avatarImg: { width: 56, height: 56, borderRadius: 28 },
  avatarText: { fontSize: 11.5, fontWeight: '700', color: colors.primary },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: 6, backgroundColor: colors.card },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  chipTextActive: { color: colors.white },

  searchBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: spacing.md, marginBottom: spacing.md },
  searchInput: { flex: 1, paddingVertical: spacing.md, fontSize: 13, color: colors.textPrimary },
  spaceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  check: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  spaceName: { fontSize: 13.5, fontWeight: '700', color: colors.textPrimary },
  spaceType: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },

  autoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs, borderBottomWidth: 1, borderBottomColor: colors.border },
  autoLabel: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  autoHint: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },

  seqCard: { backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.md, marginTop: spacing.md },
  seqRow: { flexDirection: 'row', gap: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  seqNum: { width: 18, fontSize: 12, fontWeight: '800', color: colors.primary },
  seqText: { flex: 1, fontSize: 12, color: colors.textPrimary, lineHeight: 17 },

  review: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg },
  reviewRow: { flexDirection: 'row', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  reviewLabel: { width: 100, fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  reviewValue: { flex: 1, fontSize: 12, color: colors.textPrimary, fontWeight: '600' },
  disclose: { fontSize: 11.5, color: colors.textSecondary, lineHeight: 17, marginTop: spacing.md },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md + 2, alignItems: 'center', marginTop: spacing.lg },
  primaryBtnText: { color: colors.white, fontWeight: '800', fontSize: 15 },
  ghostBtn: { borderWidth: 1, borderColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md + 2, alignItems: 'center', marginTop: spacing.sm },
  ghostBtnText: { color: colors.primary, fontWeight: '700', fontSize: 15 },
});
