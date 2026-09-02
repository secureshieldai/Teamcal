import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActionSheetIOS, Alert, Image, Modal, Platform, ScrollView, Share,
  StyleSheet, Switch, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import type { NativeStackScreenProps, NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import {
  earnService, type EarnAsset, type MembershipMetadata, type MembershipTier,
  type MembershipEvent, type MembershipContentItem, type ModeratorPermissions,
} from '../services/api/earn.service';
import { groupsService } from '../services/api/groups.service';
import { postsService } from '../services/api/posts.service';
import type { Group, GroupMember } from '../types/api';
import StatusBadge from './earn/components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { colors, radii, shadow, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'MembershipDashboard'>;

const SECTIONS = [
  { key: 'overview', label: 'Overview', icon: 'grid-outline' },
  { key: 'members', label: 'Members', icon: 'people-outline' },
  { key: 'tiers', label: 'Tiers', icon: 'pricetag-outline' },
  { key: 'content', label: 'Content', icon: 'albums-outline' },
  { key: 'events', label: 'Events', icon: 'calendar-outline' },
  { key: 'moderators', label: 'Moderators', icon: 'shield-checkmark-outline' },
  { key: 'revenue', label: 'Revenue', icon: 'cash-outline' },
  { key: 'analytics', label: 'Analytics', icon: 'stats-chart-outline' },
  { key: 'promote', label: 'Promote', icon: 'megaphone-outline' },
  { key: 'settings', label: 'Settings', icon: 'settings-outline' },
] as const;
type SectionKey = typeof SECTIONS[number]['key'];

const TIER_COLORS = ['#FF5A1F', '#6366F1', '#10B981', '#3B82F6', '#F59E0B', '#EC4899'];
const PIXEL_PLATFORMS: { key: 'meta' | 'tiktok' | 'snapchat' | 'google'; label: string; hint: string; color: string; validate: RegExp }[] = [
  { key: 'meta', label: 'Meta Pixel', hint: 'Events Manager → Data Sources → your Pixel → Settings (15–16 digit ID)', color: '#1877F2', validate: /^\d{15,16}$/ },
  { key: 'tiktok', label: 'TikTok Pixel', hint: 'TikTok Ads Manager → Assets → Events → your Pixel ID (starts with C)', color: '#000000', validate: /^C[A-Z0-9]{10,20}$/i },
  { key: 'snapchat', label: 'Snapchat Pixel', hint: 'Ads Manager → Business Settings → Pixel → Pixel ID (UUID)', color: '#FFFC00', validate: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i },
  { key: 'google', label: 'Google Ads Tag', hint: 'Google Ads → Tools → Conversions → Tag ID (AW-XXXXXXXXX)', color: '#4285F4', validate: /^AW-\d{9,11}$/ },
];
const TRACKABLE_EVENTS = ['Public-page view', 'Join or registration started', 'Membership successfully joined', 'Trial started', 'Subscription purchased', 'Subscription renewed', 'Subscription cancelled'];

export default function MembershipDashboardScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user: currentUser } = useAuth();
  const { membershipId } = route.params;
  const [asset, setAsset] = useState<EarnAsset | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const myUserId = currentUser?.id ?? null;
  const [section, setSection] = useState<SectionKey>('overview');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const a = await earnService.getAsset(membershipId);
      setAsset(a);
      const groupId = (a.metadata as MembershipMetadata)?.groupId;
      if (groupId) {
        const g = await groupsService.get(groupId);
        setGroup(g.group);
        setMembers(g.members);
        groupsService.getActivity(groupId).then(setActivity).catch(() => undefined);
      }
    } catch (e) { Alert.alert('Unable to load', (e as Error).message); }
    finally { setLoading(false); }
  }, [membershipId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const md = (asset?.metadata || {}) as MembershipMetadata;
  const m = asset?.metrics || {};

  const myRole = members.find(x => x.user.id === myUserId)?.role;
  const isOwner = !myUserId || myRole === 'owner' || !members.length; // creator viewing their own asset
  const myPerms = (myUserId && md.moderatorPermissions?.[myUserId]) || null;
  const canSee = (key: SectionKey): boolean => {
    if (isOwner || key === 'overview') return true;
    if (!myPerms) return key !== 'revenue' && key !== 'analytics' && key !== 'settings';
    if (key === 'members') return myPerms.members;
    if (key === 'content') return myPerms.content;
    if (key === 'events') return myPerms.events;
    if (['moderators', 'revenue', 'settings'].includes(key)) return false;
    return true;
  };
  const visibleSections = SECTIONS.filter(sec => canSee(sec.key));

  const update = async (patch: Partial<MembershipMetadata>) => {
    if (!asset) return;
    const next = await earnService.updateAsset(asset.id, { metadata: { ...md, ...patch } });
    setAsset(next);
    return next;
  };
  // Plugin flags are mirrored onto the group's own metadata so every member (not just the
  // owner) can read them via the group they already fetch on the public community page.
  const updatePlugins = async (patch: Record<string, any>) => {
    if (!asset || !md.groupId) return;
    const currentPlugins = (group?.metadata as any)?.plugins || {};
    const nextPlugins = { ...currentPlugins, ...patch };
    const g = await groupsService.update(md.groupId, { metadata: { ...(group?.metadata || {}), plugins: nextPlugins } });
    setGroup(g);
  };

  if (loading || !asset) {
    return <SafeAreaView style={s.safe}><Text style={s.empty}>Loading Membership Manager…</Text></SafeAreaView>;
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={navigation.goBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerHeading} numberOfLines={1}>Membership Manager</Text>
          <Text style={s.headerSub} numberOfLines={1}>{asset.title}</Text>
        </View>
        <TouchableOpacity onPress={() => Share.share({ message: `Join ${asset.title}: teamcal.com/${(group?.metadata as any)?.slug || asset.id}` })}>
          <Ionicons name="share-outline" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.tabs} contentContainerStyle={s.tabsContent}>
        {visibleSections.map(sec => (
          <TouchableOpacity key={sec.key} style={[s.tab, section === sec.key && s.tabActive]} onPress={() => setSection(sec.key)}>
            <Ionicons name={sec.icon as any} size={13} color={section === sec.key ? '#fff' : colors.textSecondary} />
            <Text style={[s.tabText, section === sec.key && s.tabTextActive]}>{sec.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {section === 'overview' && <OverviewSection asset={asset} md={md} members={members} activity={activity} group={group} onOpen={setSection} />}
      {section === 'members' && <MembersSection membershipId={membershipId} md={md} members={members} groupId={md.groupId} isOwner={isOwner} onRefresh={load} navigation={navigation} />}
      {section === 'tiers' && <TiersSection md={md} onUpdate={update} />}
      {section === 'content' && <ContentSection md={md} onUpdate={update} />}
      {section === 'events' && <EventsSection md={md} onUpdate={update} />}
      {section === 'moderators' && <ModeratorsSection md={md} members={members} groupId={md.groupId} onUpdate={update} onRefresh={load} />}
      {section === 'revenue' && <RevenueSection asset={asset} m={m} />}
      {section === 'analytics' && <AnalyticsSection asset={asset} m={m} members={members} md={md} />}
      {section === 'promote' && <PromoteSection asset={asset} navigation={navigation} />}
      {section === 'settings' && (
        <SettingsSection
          asset={asset} md={md} group={group} onUpdate={update} onUpdatePlugins={updatePlugins}
          onAssetChange={setAsset} navigation={navigation} insets={insets}
        />
      )}
    </SafeAreaView>
  );
}

// ═══════════════════════════════ Overview ═══════════════════════════════

function OverviewSection({ asset, md, members, activity, group, onOpen }: {
  asset: EarnAsset; md: MembershipMetadata; members: GroupMember[]; activity: any[]; group: Group | null;
  onOpen: (k: SectionKey) => void;
}) {
  const m = asset.metrics || {};
  const hasRevenue = Number(m.mrr || 0) > 0 || Number(m.earned || 0) > 0;
  return (
    <ScrollView contentContainerStyle={s.content}>
      <View style={[s.card, shadow.card]}>
        <View style={s.rowBetween}>
          <StatusBadge status={asset.status} />
          <Text style={s.metaMuted}>{group?.is_private ? 'Private' : 'Public'}</Text>
        </View>
        <Text style={s.h1}>{asset.title}</Text>
        <Text style={s.metaText}>{md.category || 'Community'} · {members.length} member{members.length === 1 ? '' : 's'}</Text>
      </View>

      <Text style={s.section}>Membership metrics</Text>
      <View style={s.grid}>
        <Stat label="Total members" value={members.length} />
        <Stat label="Paying members" value={m.paying || 0} />
        <Stat label="On trial" value={m.trials || 0} />
        <Stat label="New this month" value={m.newMembers || 0} />
        <Stat label="MRR" value={`$${m.mrr || 0}`} />
        <Stat label="Lifetime revenue" value={`$${m.earned || 0}`} />
        <Stat label="Renewal rate" value={`${m.renewalRate || 0}%`} />
        <Stat label="Cancellation" value={`${m.cancellationRate || 0}%`} />
      </View>
      {!hasRevenue && (
        <Text style={s.note}>Revenue figures will populate once paid subscriptions start coming in for this membership.</Text>
      )}

      <Text style={s.section}>Important alerts</Text>
      <View style={[s.card, shadow.soft]}>
        <View style={s.emptyRow}>
          <Ionicons name="checkmark-circle-outline" size={20} color={colors.success} />
          <Text style={s.emptyRowText}>No alerts right now — everything looks healthy.</Text>
        </View>
      </View>

      <Text style={s.section}>Recent activity</Text>
      <View style={[s.card, shadow.soft]}>
        {activity.slice(0, 5).map((post, i) => (
          <View key={post.id} style={[s.activityRow, i === Math.min(activity.length, 5) - 1 && { borderBottomWidth: 0 }]}>
            <Ionicons name="ellipse" size={6} color={colors.primary} style={{ marginTop: 6 }} />
            <View style={{ flex: 1 }}>
              <Text style={s.activityText} numberOfLines={1}>{post.user?.name || 'Member'} posted: {post.text || 'shared an update'}</Text>
              <Text style={s.metaMuted}>{new Date(post.created_at).toLocaleDateString()}</Text>
            </View>
          </View>
        ))}
        {!activity.length && (
          <View style={s.emptyRow}>
            <Ionicons name="chatbubbles-outline" size={20} color={colors.textMuted} />
            <Text style={s.emptyRowText}>No activity yet. Once members start posting, it'll show up here.</Text>
          </View>
        )}
      </View>

      <Text style={s.section}>Quick links</Text>
      <View style={[s.card, shadow.soft]}>
        {[['members', 'Members'], ['tiers', 'Tiers & Subscriptions'], ['content', 'Content'], ['events', 'Events'], ['moderators', 'Moderators'], ['revenue', 'Revenue & Trials'], ['analytics', 'Analytics'], ['promote', 'Audience Engine']].map(([key, label], i, arr) => (
          <TouchableOpacity key={key} style={[s.row, i === arr.length - 1 && { borderBottomWidth: 0 }]} onPress={() => onOpen(key as SectionKey)}>
            <Text style={s.rowText}>{label}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

// ═══════════════════════════════ Members ═══════════════════════════════

function MembersSection({ membershipId, md, members, groupId, isOwner, onRefresh, navigation }: {
  membershipId: string; md: MembershipMetadata; members: GroupMember[]; groupId?: string; isOwner: boolean;
  onRefresh: () => void; navigation: NativeStackNavigationProp<RootStackParamList>;
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'moderators'>('all');

  const filtered = members.filter(mem => {
    if (filter === 'moderators' && mem.role !== 'admin' && mem.role !== 'owner') return false;
    if (search && !mem.user.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleAction = (mem: GroupMember) => {
    if (!groupId || mem.role === 'owner') return;
    const opts = mem.role === 'admin' ? ['View Profile', 'Remove moderator role', 'Remove member', 'Cancel'] : ['View Profile', 'Make moderator', 'Remove member', 'Cancel'];
    const run = (i: number) => {
      if (i === 0) navigation.navigate('UserProfile', { userId: mem.user.id, username: mem.user.name });
      else if (i === 1) groupsService.setMemberRole(groupId, mem.user.id, mem.role === 'admin' ? 'member' : 'admin').then(onRefresh).catch(e => Alert.alert('Error', e.message));
      else if (i === 2) Alert.alert('Remove member?', `Remove ${mem.user.name} from this community?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => groupsService.removeMember(groupId, mem.user.id).then(onRefresh).catch(e => Alert.alert('Error', e.message)) },
      ]);
    };
    if (Platform.OS === 'ios') ActionSheetIOS.showActionSheetWithOptions({ options: opts, cancelButtonIndex: opts.length - 1, destructiveButtonIndex: 2, title: mem.user.name }, run);
    else Alert.alert(mem.user.name, undefined, opts.map((t, i) => ({ text: t, style: t.includes('Remove member') ? 'destructive' as const : undefined, onPress: () => run(i) })));
  };

  return (
    <ScrollView contentContainerStyle={s.content}>
      <View style={s.searchRow}>
        <Ionicons name="search-outline" size={16} color={colors.textMuted} style={{ marginRight: 6 }} />
        <TextInput style={s.searchInput} value={search} onChangeText={setSearch} placeholder="Search members…" placeholderTextColor={colors.textMuted} />
      </View>
      <View style={s.filterRow}>
        {(['all', 'moderators'] as const).map(k => (
          <TouchableOpacity key={k} style={[s.filterPill, filter === k && s.filterPillActive]} onPress={() => setFilter(k)}>
            <Text style={[s.filterPillText, filter === k && s.filterPillTextActive]}>{k === 'all' ? 'All' : 'Moderators'}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={s.note}>Paid-subscription status (paying / trial / cancelled) isn't connected yet for this membership — every member currently shows as active.</Text>

      {filtered.map(mem => (
        <TouchableOpacity key={mem.user.id} style={[s.memberRow, shadow.soft]} onPress={() => handleAction(mem)} disabled={mem.role === 'owner'}>
          <Image source={{ uri: mem.user.avatar || `https://i.pravatar.cc/80?u=${mem.user.id}` }} style={s.avatar} />
          <View style={{ flex: 1 }}>
            <Text style={s.bodyBold}>{mem.user.name}</Text>
            <Text style={s.metaMuted}>Joined {new Date(mem.joined_at).toLocaleDateString()}</Text>
          </View>
          <View style={[s.roleBadge, mem.role !== 'member' && s.roleBadgeAdmin]}>
            <Text style={[s.roleBadgeText, mem.role !== 'member' && s.roleBadgeTextAdmin]}>{mem.role === 'owner' ? 'Owner' : mem.role === 'admin' ? 'Moderator' : 'Member'}</Text>
          </View>
          {mem.role !== 'owner' && <Ionicons name="ellipsis-vertical" size={16} color={colors.textMuted} style={{ marginLeft: spacing.sm }} />}
        </TouchableOpacity>
      ))}
      {!filtered.length && <EmptyState icon="people-outline" title="No members found" sub="Try a different search or filter." />}
    </ScrollView>
  );
}

// ═══════════════════════════════ Tiers & Subscriptions ═══════════════════════════════

function TiersSection({ md, onUpdate }: { md: MembershipMetadata; onUpdate: (p: Partial<MembershipMetadata>) => Promise<any> }) {
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<MembershipTier | null>(null);

  const openNew = () => setEditing({ id: `tier-${Date.now()}`, name: '', description: '', color: TIER_COLORS[(md.tiers?.length || 0) % TIER_COLORS.length], benefits: [], monthly: 0, annual: 0, trial: 'No trial' });
  const saveTier = async (tier: MembershipTier) => {
    const tiers = md.tiers || [];
    const exists = tiers.some(t => t.id === tier.id);
    await onUpdate({ tiers: exists ? tiers.map(t => t.id === tier.id ? tier : t) : [...tiers, tier] });
    setModal(false); setEditing(null);
  };
  const removeTier = (id: string) => Alert.alert('Delete tier?', 'Members on this tier will need to be moved to another tier.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => onUpdate({ tiers: (md.tiers || []).filter(t => t.id !== id) }) },
  ]);
  const toggleTierActive = (id: string) => onUpdate({ tiers: (md.tiers || []).map(t => t.id === id ? { ...t, earlyAccess: t.earlyAccess } : t) });

  return (
    <ScrollView contentContainerStyle={s.content}>
      <View style={s.rowBetween}>
        <Text style={s.h2}>Membership Tiers</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => { openNew(); setModal(true); }}>
          <Ionicons name="add" size={14} color="#fff" />
          <Text style={s.addBtnText}>Add Tier</Text>
        </TouchableOpacity>
      </View>

      {(md.tiers || []).map(tier => (
        <View key={tier.id} style={[s.tierCard, shadow.soft, { borderLeftColor: tier.color }]}>
          <View style={s.rowBetween}>
            <Text style={s.bodyBold}>{tier.name || 'Untitled tier'}</Text>
            <View style={s.activeBadge}><Text style={s.activeBadgeText}>Active</Text></View>
          </View>
          <Text style={s.metaText}>{tier.description}</Text>
          <Text style={s.priceText}>${tier.monthly || 0}/month · ${tier.annual || 0}/year{tier.annual && tier.monthly ? ` (save ${Math.max(0, Math.round(100 - (tier.annual / (tier.monthly * 12)) * 100))}%)` : ''}</Text>
          {!!tier.benefits?.length && <Text style={s.metaMuted}>{tier.benefits.join(' · ')}</Text>}
          <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm }}>
            <TouchableOpacity onPress={() => { setEditing(tier); setModal(true); }}><Text style={s.linkText}>Edit Tier</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => removeTier(tier.id)}><Text style={[s.linkText, { color: '#EF4444' }]}>Delete</Text></TouchableOpacity>
          </View>
        </View>
      ))}
      {!md.tiers?.length && <EmptyState icon="pricetag-outline" title="No tiers yet" sub="Create your first membership tier to start offering paid access." />}

      <Text style={s.section}>Active subscriptions</Text>
      <View style={[s.card, shadow.soft]}><EmptyStateInline text="No active subscriptions yet — this connects once billing goes live." /></View>
      <Text style={s.section}>Cancelled subscriptions</Text>
      <View style={[s.card, shadow.soft]}><EmptyStateInline text="No cancellations recorded." /></View>

      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet">
        {editing && <TierEditor tier={editing} onCancel={() => setModal(false)} onSave={saveTier} />}
      </Modal>
    </ScrollView>
  );
}

function TierEditor({ tier, onCancel, onSave }: { tier: MembershipTier; onCancel: () => void; onSave: (t: MembershipTier) => void }) {
  const [form, setForm] = useState<MembershipTier>(tier);
  const [benefitInput, setBenefitInput] = useState('');
  const [trialOpt, setTrialOpt] = useState(form.trial || 'No trial');
  const [access, setAccess] = useState({ events: true, resources: true, chats: true });
  const [visibility, setVisibility] = useState<'public' | 'hidden'>('public');
  const [active, setActive] = useState(true);

  return (
    <SafeAreaView style={[s.safe, { flex: 1 }]} edges={['top', 'bottom']}>
          <View style={s.header}>
            <TouchableOpacity onPress={onCancel}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
            <Text style={s.headerTitle}>Add Tier</Text>
            <View style={{ width: 60 }} />
          </View>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <Text style={s.fieldLabel}>Tier name *</Text>
        <TextInput style={s.input} value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))} placeholder="e.g., Pro" placeholderTextColor={colors.textMuted} />
        <Text style={s.fieldLabel}>Short description *</Text>
        <TextInput style={s.input} value={form.description} onChangeText={v => setForm(f => ({ ...f, description: v }))} placeholder="Describe what members get with this tier." placeholderTextColor={colors.textMuted} />

        <Text style={s.fieldLabel}>Benefits</Text>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <TextInput style={[s.input, { flex: 1 }]} value={benefitInput} onChangeText={setBenefitInput} placeholder="Add a benefit" placeholderTextColor={colors.textMuted} onSubmitEditing={() => { if (benefitInput.trim()) { setForm(f => ({ ...f, benefits: [...f.benefits, benefitInput.trim()] })); setBenefitInput(''); } }} />
          <TouchableOpacity style={s.addBenefitBtn} onPress={() => { if (benefitInput.trim()) { setForm(f => ({ ...f, benefits: [...f.benefits, benefitInput.trim()] })); setBenefitInput(''); } }}>
            <Ionicons name="add" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
        {form.benefits.map((b, i) => (
          <View key={i} style={s.benefitChip}>
            <Text style={s.benefitChipText}>{b}</Text>
            <TouchableOpacity onPress={() => setForm(f => ({ ...f, benefits: f.benefits.filter((_, j) => j !== i) }))}><Ionicons name="close" size={13} color={colors.textSecondary} /></TouchableOpacity>
          </View>
        ))}

        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Text style={s.fieldLabel}>Monthly price *</Text>
            <TextInput style={s.input} value={String(form.monthly ?? '')} onChangeText={v => setForm(f => ({ ...f, monthly: Number(v) || 0 }))} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={colors.textMuted} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.fieldLabel}>Yearly price *</Text>
            <TextInput style={s.input} value={String(form.annual ?? '')} onChangeText={v => setForm(f => ({ ...f, annual: Number(v) || 0 }))} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor={colors.textMuted} />
          </View>
        </View>

        <Text style={[s.fieldLabel, { marginTop: spacing.md }]}>Free trial</Text>
        <View style={s.typeRow}>
          {['No trial', '3 days', '7 days', '14 days', 'Custom'].map(t => (
            <TouchableOpacity key={t} style={[s.typeOpt, trialOpt === t && s.typeOptActive]} onPress={() => setTrialOpt(t)}>
              <Text style={[s.typeOptText, trialOpt === t && s.typeOptTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[s.fieldLabel, { marginTop: spacing.md }]}>Tier access (included)</Text>
        {(['events', 'resources', 'chats'] as const).map(k => (
          <View key={k} style={s.toggleRow}>
            <Text style={s.toggleLabel}>{k.charAt(0).toUpperCase() + k.slice(1)}</Text>
            <Switch value={access[k]} onValueChange={v => setAccess(a => ({ ...a, [k]: v }))} trackColor={{ true: colors.primary }} thumbColor="#fff" />
          </View>
        ))}

        <Text style={[s.fieldLabel, { marginTop: spacing.md }]}>Visibility</Text>
        <View style={s.typeRow}>
          {(['public', 'hidden'] as const).map(v => (
            <TouchableOpacity key={v} style={[s.typeOpt, { flex: 1 }, visibility === v && s.typeOptActive]} onPress={() => setVisibility(v)}>
              <Text style={[s.typeOptText, visibility === v && s.typeOptTextActive]}>{v === 'public' ? 'Public — Visible to all' : 'Hidden — Invite only'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[s.toggleRow, { marginTop: spacing.md }]}>
          <Text style={s.toggleLabel}>Active tier</Text>
          <Switch value={active} onValueChange={setActive} trackColor={{ true: colors.primary }} thumbColor="#fff" />
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl }}>
          <TouchableOpacity style={s.outlineBtnFlex} onPress={onCancel}><Text style={s.outlineBtnFlexText}>Cancel</Text></TouchableOpacity>
          <TouchableOpacity
            style={s.saveBtnFlex}
            onPress={() => {
              if (!form.name.trim() || !form.description.trim()) return Alert.alert('Please fill in the required fields.');
              onSave({ ...form, trial: trialOpt, contentAccess: JSON.stringify(access), earlyAccess: active });
            }}
          >
            <Text style={s.saveBtnFlexText}>Create Tier</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ═══════════════════════════════ Content ═══════════════════════════════

const CONTENT_TYPES: { key: MembershipContentItem['type']; label: string; icon: string }[] = [
  { key: 'post', label: 'Post', icon: 'document-text-outline' },
  { key: 'pdf', label: 'PDF', icon: 'document-outline' },
  { key: 'video', label: 'Video', icon: 'videocam-outline' },
  { key: 'image', label: 'Image', icon: 'image-outline' },
  { key: 'link', label: 'Link', icon: 'link-outline' },
  { key: 'audio', label: 'Audio', icon: 'mic-outline' },
];

function ContentSection({ md, onUpdate }: { md: MembershipMetadata; onUpdate: (p: Partial<MembershipMetadata>) => Promise<any> }) {
  const [filter, setFilter] = useState<'all' | 'published' | 'draft' | 'scheduled'>('all');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<{ type: MembershipContentItem['type']; title: string; description: string; access: string }>({ type: 'post', title: '', description: '', access: 'All tiers' });

  const items = md.content || [];
  const filtered = filter === 'all' ? items : items.filter(i => i.status === filter);

  const addContent = (status: MembershipContentItem['status']) => {
    if (!form.title.trim()) return Alert.alert('Title required');
    const item: MembershipContentItem = { id: `content-${Date.now()}`, title: form.title.trim(), type: form.type, description: form.description, access: form.access, status, createdAt: new Date().toISOString() };
    onUpdate({ content: [item, ...items] });
    setModal(false); setForm({ type: 'post', title: '', description: '', access: 'All tiers' });
  };
  const removeContent = (id: string) => onUpdate({ content: items.filter(i => i.id !== id) });

  return (
    <ScrollView contentContainerStyle={s.content}>
      <View style={s.rowBetween}>
        <Text style={s.h2}>Membership Content</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => setModal(true)}>
          <Ionicons name="add" size={14} color="#fff" />
          <Text style={s.addBtnText}>Add Content</Text>
        </TouchableOpacity>
      </View>
      <View style={s.filterRow}>
        {(['all', 'published', 'draft', 'scheduled'] as const).map(k => (
          <TouchableOpacity key={k} style={[s.filterPill, filter === k && s.filterPillActive]} onPress={() => setFilter(k)}>
            <Text style={[s.filterPillText, filter === k && s.filterPillTextActive]}>{k.charAt(0).toUpperCase() + k.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {filtered.map(item => {
        const typeInfo = CONTENT_TYPES.find(t => t.key === item.type);
        return (
          <View key={item.id} style={[s.contentRow, shadow.soft]}>
            <View style={s.contentIcon}><Ionicons name={(typeInfo?.icon || 'document-outline') as any} size={18} color={colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.bodyBold} numberOfLines={1}>{item.title}</Text>
              <Text style={s.metaMuted}>{typeInfo?.label} · {item.access}</Text>
            </View>
            <View style={[s.statusChip, item.status === 'published' && s.statusChipActive]}>
              <Text style={[s.statusChipText, item.status === 'published' && s.statusChipTextActive]}>{item.status}</Text>
            </View>
            <TouchableOpacity onPress={() => removeContent(item.id)} style={{ marginLeft: spacing.sm }}>
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        );
      })}
      {!filtered.length && <EmptyState icon="albums-outline" title="No content yet" sub="Add posts, resources, videos or files for your members." />}

      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[s.safe, { flex: 1 }]} edges={['top', 'bottom']}>
          <View style={s.header}>
            <TouchableOpacity onPress={() => setModal(false)}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
            <Text style={s.headerTitle}>Add Content</Text>
            <View style={{ width: 60 }} />
          </View>
          <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
            <Text style={s.fieldLabel}>What would you like to add?</Text>
            <View style={s.contentTypeGrid}>
              {CONTENT_TYPES.map(t => (
                <TouchableOpacity key={t.key} style={[s.contentTypeCard, form.type === t.key && s.contentTypeCardActive]} onPress={() => setForm(f => ({ ...f, type: t.key }))}>
                  <Ionicons name={t.icon as any} size={22} color={form.type === t.key ? colors.primary : colors.textSecondary} />
                  <Text style={[s.contentTypeLabel, form.type === t.key && { color: colors.primary }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={s.fieldLabel}>Content title *</Text>
            <TextInput style={s.input} value={form.title} onChangeText={v => setForm(f => ({ ...f, title: v }))} placeholder="Enter a title" placeholderTextColor={colors.textMuted} />
            <Text style={s.fieldLabel}>Short description (optional)</Text>
            <TextInput style={[s.input, { minHeight: 70, textAlignVertical: 'top' }]} value={form.description} onChangeText={v => setForm(f => ({ ...f, description: v }))} multiline placeholder="What is this content about?" placeholderTextColor={colors.textMuted} />
            <Text style={s.fieldLabel}>Access</Text>
            <View style={s.typeRow}>
              {['All tiers', 'Basic tier', 'Pro tier'].map(a => (
                <TouchableOpacity key={a} style={[s.typeOpt, form.access === a && s.typeOptActive]} onPress={() => setForm(f => ({ ...f, access: a }))}>
                  <Text style={[s.typeOptText, form.access === a && s.typeOptTextActive]}>{a}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl }}>
              <TouchableOpacity style={s.outlineBtnFlex} onPress={() => addContent('draft')}><Text style={s.outlineBtnFlexText}>Save as Draft</Text></TouchableOpacity>
              <TouchableOpacity style={s.saveBtnFlex} onPress={() => addContent('published')}><Text style={s.saveBtnFlexText}>Publish</Text></TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </ScrollView>
  );
}

// ═══════════════════════════════ Events ═══════════════════════════════

function EventsSection({ md, onUpdate }: { md: MembershipMetadata; onUpdate: (p: Partial<MembershipMetadata>) => Promise<any> }) {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', location: 'in-app' as 'in-app' | 'external' | 'in-person', meetingLink: '', date: '', startTime: '10:00 AM', endTime: '11:00 AM', timeZone: '(GMT-7) Pacific Time (PT)', access: 'all' as 'all' | 'tiers', rsvp: true });

  const events = md.events || [];
  const now = new Date();
  const upcoming = events.filter(e => new Date(e.date) >= now);
  const past = events.filter(e => new Date(e.date) < now);
  const list = tab === 'upcoming' ? upcoming : past;

  const schedule = (status: 'draft' | 'scheduled') => {
    if (!form.title.trim() || !form.date) return Alert.alert('Please fill in the required fields.');
    const event: MembershipEvent = {
      id: `event-${Date.now()}`, title: form.title.trim(), type: form.location === 'in-app' ? 'Live video event' : form.location === 'external' ? 'External meeting' : 'In-person event',
      date: form.date, time: form.startTime, timeZone: form.timeZone, duration: 60, tiers: form.access === 'all' ? [] : ['selected'],
      reminder: '1 day before, 1 hour before', replay: true,
    };
    onUpdate({ events: [...(md.events || []), event] });
    setModal(false);
  };
  const cancelEvent = (id: string) => Alert.alert('Cancel event?', 'This event will be removed and eligible members notified.', [
    { text: 'Keep event', style: 'cancel' },
    { text: 'Cancel Event', style: 'destructive', onPress: () => onUpdate({ events: (md.events || []).filter(e => e.id !== id) }) },
  ]);

  return (
    <ScrollView contentContainerStyle={s.content}>
      <View style={s.filterRow}>
        {(['upcoming', 'past'] as const).map(k => (
          <TouchableOpacity key={k} style={[s.filterPill, tab === k && s.filterPillActive]} onPress={() => setTab(k)}>
            <Text style={[s.filterPillText, tab === k && s.filterPillTextActive]}>{k === 'upcoming' ? 'Upcoming' : 'Past'}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={s.scheduleBtn} onPress={() => setModal(true)}>
        <Ionicons name="add" size={16} color="#fff" />
        <Text style={s.scheduleBtnText}>Schedule Event</Text>
      </TouchableOpacity>

      {list.map(ev => (
        <View key={ev.id} style={[s.eventCard, shadow.soft]}>
          <View style={s.rowBetween}>
            <Text style={s.bodyBold}>{ev.title}</Text>
            {tab === 'upcoming' && <TouchableOpacity onPress={() => cancelEvent(ev.id)}><Ionicons name="ellipsis-horizontal" size={16} color={colors.textMuted} /></TouchableOpacity>}
          </View>
          <Text style={s.metaText}>{ev.type} · {ev.date} · {ev.time}</Text>
          <Text style={s.metaMuted}>{ev.tiers.length ? 'Selected tiers' : 'All tiers'} · Replay {ev.replay ? 'available' : 'off'}</Text>
        </View>
      ))}
      {!list.length && <EmptyState icon="calendar-outline" title={tab === 'upcoming' ? 'No upcoming events' : 'No past events'} sub={tab === 'upcoming' ? 'Schedule a new event to get started.' : 'Past events will show up here.'} />}

      <Modal visible={modal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[s.safe, { flex: 1 }]} edges={['top', 'bottom']}>
          <View style={s.header}>
            <TouchableOpacity onPress={() => setModal(false)}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
            <Text style={s.headerTitle}>Schedule Event</Text>
            <View style={{ width: 60 }} />
          </View>
          <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
            <Text style={s.fieldLabel}>Event title *</Text>
            <TextInput style={s.input} value={form.title} onChangeText={v => setForm(f => ({ ...f, title: v }))} placeholder="e.g., Q&A with Coach Alex" placeholderTextColor={colors.textMuted} />
            <Text style={s.fieldLabel}>Short description *</Text>
            <TextInput style={s.input} value={form.description} onChangeText={v => setForm(f => ({ ...f, description: v }))} placeholder="Describe what this event is about" placeholderTextColor={colors.textMuted} />
            <Text style={s.fieldLabel}>Location</Text>
            <View style={s.typeRow}>
              {([['in-app', 'In App'], ['external', 'External Link'], ['in-person', 'In Person']] as const).map(([k, l]) => (
                <TouchableOpacity key={k} style={[s.typeOpt, form.location === k && s.typeOptActive]} onPress={() => setForm(f => ({ ...f, location: k }))}>
                  <Text style={[s.typeOptText, form.location === k && s.typeOptTextActive]}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {form.location === 'external' && (
              <>
                <Text style={s.fieldLabel}>Meeting link *</Text>
                <TextInput style={s.input} value={form.meetingLink} onChangeText={v => setForm(f => ({ ...f, meetingLink: v }))} placeholder="Zoom, Google Meet, or other link" placeholderTextColor={colors.textMuted} />
              </>
            )}
            <Text style={s.fieldLabel}>Date *</Text>
            <TextInput style={s.input} value={form.date} onChangeText={v => setForm(f => ({ ...f, date: v }))} placeholder="YYYY-MM-DD" placeholderTextColor={colors.textMuted} />
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>Start time *</Text>
                <TextInput style={s.input} value={form.startTime} onChangeText={v => setForm(f => ({ ...f, startTime: v }))} placeholder="10:00 AM" placeholderTextColor={colors.textMuted} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>End time *</Text>
                <TextInput style={s.input} value={form.endTime} onChangeText={v => setForm(f => ({ ...f, endTime: v }))} placeholder="11:00 AM" placeholderTextColor={colors.textMuted} />
              </View>
            </View>
            <Text style={s.fieldLabel}>Time zone *</Text>
            <TextInput style={s.input} value={form.timeZone} onChangeText={v => setForm(f => ({ ...f, timeZone: v }))} placeholderTextColor={colors.textMuted} />
            <Text style={s.fieldLabel}>Access *</Text>
            <View style={s.typeRow}>
              <TouchableOpacity style={[s.typeOpt, { flex: 1 }, form.access === 'all' && s.typeOptActive]} onPress={() => setForm(f => ({ ...f, access: 'all' }))}>
                <Text style={[s.typeOptText, form.access === 'all' && s.typeOptTextActive]}>All members</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.typeOpt, { flex: 1 }, form.access === 'tiers' && s.typeOptActive]} onPress={() => setForm(f => ({ ...f, access: 'tiers' }))}>
                <Text style={[s.typeOptText, form.access === 'tiers' && s.typeOptTextActive]}>Select tiers</Text>
              </TouchableOpacity>
            </View>
            <View style={[s.toggleRow, { marginTop: spacing.md }]}>
              <Text style={s.toggleLabel}>Allow RSVP</Text>
              <Switch value={form.rsvp} onValueChange={v => setForm(f => ({ ...f, rsvp: v }))} trackColor={{ true: colors.primary }} thumbColor="#fff" />
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xl }}>
              <TouchableOpacity style={s.outlineBtnFlex} onPress={() => schedule('draft')}><Text style={s.outlineBtnFlexText}>Save as Draft</Text></TouchableOpacity>
              <TouchableOpacity style={s.saveBtnFlex} onPress={() => schedule('scheduled')}><Text style={s.saveBtnFlexText}>Schedule Event</Text></TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </ScrollView>
  );
}

// ═══════════════════════════════ Moderators ═══════════════════════════════

function ModeratorsSection({ md, members, groupId, onUpdate, onRefresh }: {
  md: MembershipMetadata; members: GroupMember[]; groupId?: string;
  onUpdate: (p: Partial<MembershipMetadata>) => Promise<any>; onRefresh: () => void;
}) {
  const [permSheet, setPermSheet] = useState<string | null>(null);
  const moderators = members.filter(m => m.role === 'admin' || m.role === 'owner');
  const regularMembers = members.filter(m => m.role === 'member');

  const addModerator = () => {
    if (!regularMembers.length) return Alert.alert('No eligible members', 'All current members are already moderators or the owner.');
    const opts = [...regularMembers.map(m => m.user.name), 'Cancel'];
    const run = (i: number) => { if (i < regularMembers.length && groupId) groupsService.setMemberRole(groupId, regularMembers[i].user.id, 'admin').then(onRefresh).catch(e => Alert.alert('Error', e.message)); };
    if (Platform.OS === 'ios') ActionSheetIOS.showActionSheetWithOptions({ options: opts, cancelButtonIndex: opts.length - 1, title: 'Add Moderator' }, run);
    else Alert.alert('Add Moderator', undefined, opts.map((t, i) => ({ text: t, onPress: () => run(i) })));
  };
  const removeModerator = (userId: string) => groupId && groupsService.setMemberRole(groupId, userId, 'member').then(onRefresh).catch(e => Alert.alert('Error', e.message));

  const perms = (userId: string): ModeratorPermissions => md.moderatorPermissions?.[userId] || { content: true, members: false, events: true };
  const savePerms = (userId: string, p: ModeratorPermissions) => onUpdate({ moderatorPermissions: { ...(md.moderatorPermissions || {}), [userId]: p } });

  return (
    <ScrollView contentContainerStyle={s.content}>
      <View style={s.rowBetween}>
        <Text style={s.h2}>Moderators</Text>
        <TouchableOpacity style={s.addBtn} onPress={addModerator}>
          <Ionicons name="add" size={14} color="#fff" />
          <Text style={s.addBtnText}>Add Moderator</Text>
        </TouchableOpacity>
      </View>

      {moderators.map(mod => (
        <View key={mod.user.id} style={[s.memberRow, shadow.soft]}>
          <Image source={{ uri: mod.user.avatar || `https://i.pravatar.cc/80?u=${mod.user.id}` }} style={s.avatar} />
          <View style={{ flex: 1 }}>
            <Text style={s.bodyBold}>{mod.user.name}</Text>
            <Text style={s.metaMuted}>{mod.role === 'owner' ? 'Owner · Full access · Cannot be removed' : 'Moderator · Manage permissions below'}</Text>
          </View>
          {mod.role !== 'owner' && (
            <TouchableOpacity onPress={() => {
              const opts = ['Edit Permissions', 'Remove Moderator', 'Cancel'];
              const run = (i: number) => { if (i === 0) setPermSheet(mod.user.id); else if (i === 1) removeModerator(mod.user.id); };
              if (Platform.OS === 'ios') ActionSheetIOS.showActionSheetWithOptions({ options: opts, cancelButtonIndex: 2, destructiveButtonIndex: 1 }, run);
              else Alert.alert(mod.user.name, undefined, opts.map((t, i) => ({ text: t, onPress: () => run(i) })));
            }}>
              <Ionicons name="ellipsis-vertical" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      ))}
      {!moderators.length && <EmptyState icon="shield-checkmark-outline" title="No moderators yet" sub="Add a moderator to help manage this community." />}

      {permSheet && (
        <View style={s.overlay}>
          <View style={s.confirmCard}>
            <Text style={s.h2}>Moderator Permissions</Text>
            <Text style={s.metaText}>{members.find(m => m.user.id === permSheet)?.user.name}</Text>
            {(['content', 'members', 'events'] as const).map(k => (
              <View key={k} style={s.toggleRow}>
                <Text style={s.toggleLabel}>Manage {k}</Text>
                <Switch
                  value={perms(permSheet)[k]}
                  onValueChange={v => savePerms(permSheet, { ...perms(permSheet), [k]: v })}
                  trackColor={{ true: colors.primary }} thumbColor="#fff"
                />
              </View>
            ))}
            <TouchableOpacity style={[s.saveBtnFlex, { marginTop: spacing.lg }]} onPress={() => setPermSheet(null)}>
              <Text style={s.saveBtnFlexText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

// ═══════════════════════════════ Revenue ═══════════════════════════════

function RevenueSection({ asset, m }: { asset: EarnAsset; m: Record<string, number> }) {
  const hasRevenue = Number(m.mrr || 0) > 0 || Number(m.earned || 0) > 0;
  return (
    <ScrollView contentContainerStyle={s.content}>
      <View style={s.grid}>
        <Stat label="MRR" value={`$${m.mrr || 0}`} />
        <Stat label="ARR" value={`$${Number(m.mrr || 0) * 12}`} />
        <Stat label="Lifetime revenue" value={`$${m.earned || 0}`} />
        <Stat label="Pending payout" value={`$${m.pendingPayout || 0}`} />
        <Stat label="Renewals" value={m.renewals || 0} />
        <Stat label="Cancellations" value={m.cancellations || 0} />
        <Stat label="Trial conversion" value={`${m.trialConversion || 0}%`} />
        <Stat label="Refunds" value={m.refunds || 0} />
      </View>
      {!hasRevenue && <Text style={s.note}>No paid transactions yet — this dashboard will populate once your membership starts accepting paid subscriptions.</Text>}

      <Text style={s.section}>Recent transactions</Text>
      <View style={[s.card, shadow.soft]}><EmptyStateInline text="No transactions yet." /></View>

      <Text style={s.section}>Revenue by tier</Text>
      <View style={[s.card, shadow.soft]}>
        {((asset.metadata as MembershipMetadata)?.tiers || []).map(t => (
          <View key={t.id} style={s.row}>
            <Text style={s.rowText}>{t.name}</Text>
            <Text style={s.metaMuted}>$0</Text>
          </View>
        ))}
        {!((asset.metadata as MembershipMetadata)?.tiers?.length) && <EmptyStateInline text="Create tiers to see revenue broken down by plan." />}
      </View>
    </ScrollView>
  );
}

// ═══════════════════════════════ Analytics ═══════════════════════════════

function AnalyticsSection({ asset, m, members, md }: { asset: EarnAsset; m: Record<string, number>; members: GroupMember[]; md: MembershipMetadata }) {
  // Real member growth, computed from actual join dates — grouped by week.
  const growth = useMemo(() => {
    const weeks: Record<string, number> = {};
    members.forEach(mem => {
      const d = new Date(mem.joined_at);
      const weekStart = new Date(d); weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().slice(0, 10);
      weeks[key] = (weeks[key] || 0) + 1;
    });
    const sorted = Object.keys(weeks).sort();
    let running = 0;
    return sorted.map(k => { running += weeks[k]; return { week: k, total: running }; }).slice(-8);
  }, [members]);
  const maxTotal = Math.max(...growth.map(g => g.total), 1);

  return (
    <ScrollView contentContainerStyle={s.content}>
      <View style={s.grid}>
        <Stat label="Total members" value={members.length} />
        <Stat label="Active members" value={members.length} />
        <Stat label="Retention" value="—" />
        <Stat label="Cancellations" value={m.cancellations || 0} />
      </View>

      <Text style={s.section}>Member growth</Text>
      <View style={[s.card, shadow.soft]}>
        {growth.length > 1 ? (
          <View style={s.barChart}>
            {growth.map(g => (
              <View key={g.week} style={s.barCol}>
                <View style={[s.bar, { height: Math.max(4, (g.total / maxTotal) * 84), backgroundColor: colors.primary }]} />
              </View>
            ))}
          </View>
        ) : <EmptyStateInline text="Member growth will chart here as more people join." />}
      </View>

      <Text style={s.section}>Popular content</Text>
      <View style={[s.card, shadow.soft]}>
        {(md.content || []).slice(0, 5).map(c => (
          <View key={c.id} style={s.row}><Text style={s.rowText} numberOfLines={1}>{c.title}</Text><Text style={s.metaMuted}>{c.type}</Text></View>
        ))}
        {!md.content?.length && <EmptyStateInline text="Add content to see what resonates with members." />}
      </View>

      <Text style={s.section}>Traffic sources</Text>
      <View style={[s.card, shadow.soft]}><EmptyStateInline text="Traffic-source tracking isn't connected yet for this membership." /></View>

      <Text style={s.section}>Revenue performance</Text>
      <View style={[s.card, shadow.soft]}><EmptyStateInline text="Revenue performance will appear once paid subscriptions are active." /></View>
    </ScrollView>
  );
}

// ═══════════════════════════════ Promote (Audience Engine) ═══════════════════════════════

function PromoteSection({ asset, navigation }: { asset: EarnAsset; navigation: NativeStackNavigationProp<RootStackParamList> }) {
  return (
    <ScrollView contentContainerStyle={s.content}>
      <View style={[s.card, shadow.card, { alignItems: 'center', paddingVertical: spacing.xxl }]}>
        <Ionicons name="megaphone-outline" size={40} color={colors.primary} />
        <Text style={[s.h2, { marginTop: spacing.md, textAlign: 'center' }]}>Promote {asset.title}</Text>
        <Text style={[s.metaText, { textAlign: 'center', marginTop: spacing.xs }]}>Create promotional content, select your connected social accounts, review AI-generated posts and schedule them — all pre-attached to this membership.</Text>
        <TouchableOpacity style={[s.addBtn, { marginTop: spacing.lg, paddingHorizontal: spacing.xl, paddingVertical: spacing.md }]} onPress={() => navigation.navigate('AudienceEngine', { sourceLabel: asset.title, membershipId: asset.id })}>
          <Ionicons name="sparkles-outline" size={16} color="#fff" />
          <Text style={s.addBtnText}>Open Audience Engine</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ═══════════════════════════════ Settings (+ Plugins & Pixels) ═══════════════════════════════

function SettingsSection({ asset, md, group, onUpdate, onUpdatePlugins, onAssetChange, navigation, insets }: {
  asset: EarnAsset; md: MembershipMetadata; group: Group | null;
  onUpdate: (p: Partial<MembershipMetadata>) => Promise<any>;
  onUpdatePlugins: (p: Record<string, any>) => Promise<any>;
  onAssetChange: (a: EarnAsset) => void;
  navigation: NativeStackNavigationProp<RootStackParamList>;
  insets: { bottom: number };
}) {
  const [plugins, setPlugins] = useState(false);
  const [qr, setQr] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const pickCover = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: true, aspect: [16, 9] });
    if (r.canceled) return;
    setBusy(true);
    try {
      const url = await postsService.uploadImage({ uri: r.assets[0].uri, mimeType: r.assets[0].mimeType || 'image/jpeg', fileName: 'cover.jpg' });
      const updated = await earnService.updateAsset(asset.id, { metadata: { ...md, banner: url } });
      onAssetChange(updated);
    } catch (e) { Alert.alert('Upload failed', (e as Error).message); }
    finally { setBusy(false); }
  };

  const setVisibility = async (v: 'public' | 'private' | 'unlisted') => {
    await onUpdate({ privacy: v });
    if (md.groupId) await groupsService.update(md.groupId, { is_private: v !== 'public' }).catch(() => undefined);
  };

  const link = `teamcal.com/${(group?.metadata as any)?.slug || asset.id}`;
  const copyLink = async () => { await Clipboard.setStringAsync(`https://${link}`); Alert.alert('Community link copied'); };

  const pauseMembership = () => Alert.alert('Pause new memberships?', "Your public page will remain visible. Existing members keep access, but new people cannot join or start trials until you resume.", [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Pause Membership', onPress: async () => onAssetChange(await earnService.updateAsset(asset.id, { status: 'paused' })) },
  ]);
  const archiveMembership = () => Alert.alert('Archive this membership?', 'This will hide it from public discovery, prevent new activity and new members, and preserve all membership data for restoration.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Archive Membership', onPress: async () => onAssetChange(await earnService.updateAsset(asset.id, { status: 'archived' })) },
  ]);
  const deleteMembership = async () => {
    if (deleteConfirm.trim() !== asset.title) return;
    try {
      await earnService.deleteAsset(asset.id);
      navigation.goBack();
      setTimeout(() => Alert.alert('Membership deleted', 'Membership settings, tiers, content and resources were removed. The underlying community group and its posts were not deleted.'), 300);
    } catch (e) { Alert.alert('Error', (e as Error).message); }
  };

  return (
    <ScrollView contentContainerStyle={s.content}>
      <Text style={s.sectionGroup}>General</Text>
      <View style={[s.card, shadow.soft]}>
        <TouchableOpacity style={s.row} onPress={() => navigation.navigate('MembershipEditor', { membershipId: asset.id })}>
          <Text style={s.rowText}>Edit membership details</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity
          style={s.row}
          onPress={() => navigation.navigate('Bots', { spaceType: 'community', spaceId: md.groupId || asset.id, spaceName: asset.title })}
        >
          <Text style={s.rowText}>Bots &amp; Automation</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={s.row} onPress={pickCover} disabled={busy}>
          <Text style={s.rowText}>{busy ? 'Uploading…' : 'Edit cover image'}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>
        <View style={[s.row, { borderBottomWidth: 0, flexDirection: 'column', alignItems: 'flex-start', gap: spacing.sm }]}>
          <Text style={s.rowText}>Visibility</Text>
          <View style={s.typeRow}>
            {(['public', 'private', 'unlisted'] as const).map(v => (
              <TouchableOpacity key={v} style={[s.typeOpt, (md.privacy || 'public') === v && s.typeOptActive]} onPress={() => setVisibility(v)}>
                <Text style={[s.typeOptText, (md.privacy || 'public') === v && s.typeOptTextActive]}>{v.charAt(0).toUpperCase() + v.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <Text style={s.sectionGroup}>Share</Text>
      <View style={[s.card, shadow.soft]}>
        <TouchableOpacity style={s.row} onPress={copyLink}>
          <Text style={s.rowText}>Copy membership link</Text>
          <Ionicons name="copy-outline" size={16} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={[s.row, { borderBottomWidth: 0 }]} onPress={() => setQr(true)}>
          <Text style={s.rowText}>Generate QR code</Text>
          <Ionicons name="qr-code-outline" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <Text style={s.sectionGroup}>Plugins & Tracking</Text>
      <View style={[s.card, shadow.soft]}>
        <TouchableOpacity style={[s.row, { borderBottomWidth: 0 }]} onPress={() => setPlugins(true)}>
          <Text style={s.rowText}>Plugins & Tracking</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <Text style={s.sectionGroup}>Danger Zone</Text>
      <View style={[s.card, shadow.soft]}>
        <TouchableOpacity style={s.row} onPress={pauseMembership}>
          <Ionicons name="pause-circle-outline" size={18} color="#F59E0B" />
          <Text style={[s.rowText, { color: '#F59E0B' }]}>Pause Membership</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.row} onPress={archiveMembership}>
          <Ionicons name="archive-outline" size={18} color={colors.textSecondary} />
          <Text style={s.rowText}>Archive Membership</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.row, { borderBottomWidth: 0 }]} onPress={() => { setDeleteConfirm(''); setDeleteModal(true); }}>
          <Ionicons name="trash-outline" size={18} color="#EF4444" />
          <Text style={[s.rowText, { color: '#EF4444' }]}>Delete Membership</Text>
        </TouchableOpacity>
      </View>

      {/* QR Code modal */}
      <Modal visible={qr} transparent animationType="fade">
        <View style={s.overlay}>
          <View style={s.confirmCard}>
            <View style={{ alignItems: 'center' }}>
              <View style={{ backgroundColor: '#fff', padding: spacing.md, borderRadius: radii.lg }}>
                <QRCode value={`https://${link}`} size={180} color={colors.textPrimary} backgroundColor="#fff" />
              </View>
              <Text style={[s.bodyBold, { marginTop: spacing.md }]}>Scan to open this community</Text>
              <Text style={s.metaMuted}>{link}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
              <TouchableOpacity style={s.outlineBtnFlex} onPress={copyLink}><Text style={s.outlineBtnFlexText}>Copy Link</Text></TouchableOpacity>
              <TouchableOpacity style={s.saveBtnFlex} onPress={() => Share.share({ message: `Join ${asset.title}: https://${link}` })}><Text style={s.saveBtnFlexText}>Share QR Code</Text></TouchableOpacity>
            </View>
            <TouchableOpacity style={{ marginTop: spacing.md, alignItems: 'center' }} onPress={() => setQr(false)}><Text style={s.linkText}>Close</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Plugins & Pixels modal */}
      <Modal visible={plugins} animationType="slide" presentationStyle="pageSheet">
        <PluginsAndPixels md={md} group={group} onUpdate={onUpdate} onUpdatePlugins={onUpdatePlugins} onClose={() => setPlugins(false)} />
      </Modal>

      {/* Delete confirmation */}
      {deleteModal && (
        <View style={s.overlay}>
          <View style={s.confirmCard}>
            <Ionicons name="trash" size={26} color="#EF4444" style={{ alignSelf: 'center', marginBottom: spacing.sm }} />
            <Text style={[s.h2, { textAlign: 'center' }]}>Delete this membership permanently?</Text>
            <Text style={[s.metaText, { textAlign: 'center', marginTop: spacing.xs }]}>This will permanently remove all membership settings, tiers, content and resources. This action cannot be undone. The underlying community group and its posts are not deleted.</Text>
            <Text style={[s.fieldLabel, { marginTop: spacing.md }]}>Type "{asset.title}" to confirm</Text>
            <TextInput style={s.input} value={deleteConfirm} onChangeText={setDeleteConfirm} placeholder={asset.title} placeholderTextColor={colors.textMuted} />
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
              <TouchableOpacity style={s.outlineBtnFlex} onPress={() => setDeleteModal(false)}><Text style={s.outlineBtnFlexText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[s.deleteBtnFlex, deleteConfirm.trim() !== asset.title && { opacity: 0.4 }]} disabled={deleteConfirm.trim() !== asset.title} onPress={deleteMembership}>
                <Text style={s.saveBtnFlexText}>Delete Permanently</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

// ── Plugins & Tracking modal (16C + 16D) ──

function PluginsAndPixels({ md, group, onUpdate, onUpdatePlugins, onClose }: {
  md: MembershipMetadata; group: Group | null;
  onUpdate: (p: Partial<MembershipMetadata>) => Promise<any>;
  onUpdatePlugins: (p: Record<string, any>) => Promise<any>;
  onClose: () => void;
}) {
  const groupPlugins = (group?.metadata as any)?.plugins || {};
  const [leaderboard, setLeaderboard] = useState(groupPlugins.leaderboard !== false);
  const [streak, setStreak] = useState(groupPlugins.streak === true);
  const [streakAction, setStreakAction] = useState(groupPlugins.streakAction || 'Posting in the community feed');
  const [instantApproval, setInstantApproval] = useState(md.instantApproval !== false);
  const [autoDmOpen, setAutoDmOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [pixelOpen, setPixelOpen] = useState<null | 'meta' | 'tiktok' | 'snapchat' | 'google'>(null);

  const autoDm = md.autoDmMessage;
  const onboardingVideo = groupPlugins.onboardingVideo;
  const pixels = md.pixels || {};

  return (
    <SafeAreaView style={[s.safe, { flex: 1 }]} edges={['top', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}><Text style={s.cancelText}>Close</Text></TouchableOpacity>
        <Text style={s.headerTitle}>Plugins & Tracking</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.sectionGroup}>Plugins</Text>
        <View style={[s.card, shadow.soft]}>
          <View style={s.pluginRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.rowText}>Top 10 Leaderboard</Text>
              <Text style={s.metaMuted}>Ranks the 10 most engaged members with medals for the top 3.</Text>
            </View>
            <Switch value={leaderboard} onValueChange={v => { setLeaderboard(v); onUpdatePlugins({ leaderboard: v }); }} trackColor={{ true: colors.primary }} thumbColor="#fff" />
          </View>
          <View style={s.pluginRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.rowText}>Streak Tracking</Text>
              <Text style={s.metaMuted}>Tracks consecutive days a member does the qualifying action.</Text>
              {streak && (
                <View style={{ marginTop: spacing.sm }}>
                  <Text style={s.fieldLabel}>Qualifying activity</Text>
                  <TextInput style={s.input} value={streakAction} onChangeText={v => { setStreakAction(v); onUpdatePlugins({ streakAction: v }); }} placeholderTextColor={colors.textMuted} />
                  <Text style={s.metaMuted}>Currently: posting in the Feed. Streaks are computed live from real activity, resetting when a day is missed.</Text>
                </View>
              )}
            </View>
            <Switch value={streak} onValueChange={v => { setStreak(v); onUpdatePlugins({ streak: v }); }} trackColor={{ true: colors.primary }} thumbColor="#fff" />
          </View>
          <TouchableOpacity style={s.pluginRow} onPress={() => setAutoDmOpen(true)}>
            <View style={{ flex: 1 }}>
              <Text style={s.rowText}>Auto-DM New Members</Text>
              <Text style={s.metaMuted}>{autoDm?.enabled ? 'On — message configured' : 'Sends a one-time welcome DM when someone joins.'}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Switch value={!!autoDm?.enabled} onValueChange={v => onUpdate({ autoDmMessage: { enabled: v, text: autoDm?.text || '', attachments: autoDm?.attachments || [] } })} trackColor={{ true: colors.primary }} thumbColor="#fff" />
              <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
          <View style={s.pluginRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.rowText}>Instant Approval</Text>
              <Text style={s.metaMuted}>Public communities join instantly today. Manual review will apply automatically once request-based joining ships for private communities.</Text>
            </View>
            <Switch value={instantApproval} onValueChange={v => { setInstantApproval(v); onUpdate({ instantApproval: v }); }} trackColor={{ true: colors.primary }} thumbColor="#fff" />
          </View>
          <TouchableOpacity style={[s.pluginRow, { borderBottomWidth: 0 }]} onPress={() => setVideoOpen(true)}>
            <View style={{ flex: 1 }}>
              <Text style={s.rowText}>Onboarding Video</Text>
              <Text style={s.metaMuted}>{onboardingVideo?.enabled && onboardingVideo?.status === 'published' ? 'On — shown once to new members' : 'Shown to new members right after they join.'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <Text style={s.sectionGroup}>Tracking Pixels</Text>
        <View style={[s.card, shadow.soft]}>
          {PIXEL_PLATFORMS.map((p, i) => {
            const cfg = pixels[p.key];
            return (
              <TouchableOpacity key={p.key} style={[s.pluginRow, i === PIXEL_PLATFORMS.length - 1 && { borderBottomWidth: 0 }]} onPress={() => setPixelOpen(p.key)}>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowText}>{p.label}</Text>
                  <Text style={s.metaMuted}>{cfg?.status === 'connected' ? `Connected · ${cfg.id}` : cfg?.status === 'invalid' ? 'Invalid ID' : 'Not connected'}</Text>
                </View>
                <StatusPill status={cfg?.status || 'not-connected'} />
              </TouchableOpacity>
            );
          })}
        </View>
        <Text style={s.note}>Pixel IDs are validated and saved here, ready to activate. Ad-platform event firing (Meta/TikTok/Snapchat/Google SDKs) isn't wired up on the backend yet, so events won't actually reach those platforms until that integration ships. Tracking always respects your Privacy Policy and consent settings — no sensitive member data is sent through these pixels.</Text>
      </ScrollView>

      {/* Auto-DM composer */}
      <Modal visible={autoDmOpen} animationType="slide" presentationStyle="pageSheet">
        <AutoDmComposer autoDm={autoDm} onSave={v => { onUpdate({ autoDmMessage: v }); setAutoDmOpen(false); }} onClose={() => setAutoDmOpen(false)} />
      </Modal>

      {/* Onboarding video setup */}
      <Modal visible={videoOpen} animationType="slide" presentationStyle="pageSheet">
        <OnboardingVideoSetup
          value={onboardingVideo}
          onSave={async v => { await onUpdatePlugins({ onboardingVideo: v }); setVideoOpen(false); }}
          onClose={() => setVideoOpen(false)}
        />
      </Modal>

      {/* Pixel setup */}
      <Modal visible={!!pixelOpen} animationType="slide" presentationStyle="pageSheet">
        {pixelOpen && (
          <PixelSetup
            platform={PIXEL_PLATFORMS.find(p => p.key === pixelOpen)!}
            config={pixels[pixelOpen]}
            onSave={cfg => { onUpdate({ pixels: { ...pixels, [pixelOpen]: cfg } }); setPixelOpen(null); }}
            onRemove={() => { const next = { ...pixels }; delete next[pixelOpen]; onUpdate({ pixels: next }); setPixelOpen(null); }}
            onClose={() => setPixelOpen(null)}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, [string, string]> = { connected: ['#E6F9F0', '#10B981'], invalid: ['#FEE2E2', '#EF4444'], 'not-connected': [colors.background, colors.textMuted] };
  const [bg, fg] = map[status] || map['not-connected'];
  return <View style={[s.statusChip, { backgroundColor: bg }]}><Text style={[s.statusChipText, { color: fg }]}>{status === 'not-connected' ? 'Not Connected' : status.charAt(0).toUpperCase() + status.slice(1)}</Text></View>;
}

function AutoDmComposer({ autoDm, onSave, onClose }: { autoDm?: MembershipMetadata['autoDmMessage']; onSave: (v: NonNullable<MembershipMetadata['autoDmMessage']>) => void; onClose: () => void }) {
  const [text, setText] = useState(autoDm?.text || '');
  const [enabled, setEnabled] = useState(autoDm?.enabled ?? false);
  const [images, setImages] = useState<string[]>((autoDm?.attachments || []).filter(a => a.type === 'image').map(a => a.url));

  const pickAttachment = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (r.canceled) return;
    try { const url = await postsService.uploadImage({ uri: r.assets[0].uri, mimeType: r.assets[0].mimeType || 'image/jpeg', fileName: 'welcome.jpg' }); setImages(p => [...p, url]); }
    catch (e) { Alert.alert('Upload failed', (e as Error).message); }
  };

  return (
    <SafeAreaView style={[s.safe, { flex: 1 }]} edges={['top', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
        <Text style={s.headerTitle}>Auto-DM New Members</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.note}>This message is sent automatically, exactly once, when someone successfully joins or is approved as a member.</Text>
        <Text style={s.fieldLabel}>Welcome message</Text>
        <TextInput style={[s.input, { minHeight: 120, textAlignVertical: 'top' }]} value={text} onChangeText={setText} multiline placeholder="Welcome! We're glad you're here…" placeholderTextColor={colors.textMuted} maxLength={1000} />
        <Text style={s.metaMuted}>{text.length}/1000</Text>

        <Text style={s.fieldLabel}>Attachments</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
          {images.map((uri, i) => (
            <View key={i} style={{ position: 'relative' }}>
              <Image source={{ uri }} style={{ width: 64, height: 64, borderRadius: radii.md }} />
              <TouchableOpacity style={s.imageRemoveBtn} onPress={() => setImages(p => p.filter((_, j) => j !== i))}>
                <Ionicons name="close" size={12} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={s.addImageBtn} onPress={pickAttachment}>
            <Ionicons name="add" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {!!text.trim() && (
          <View style={[s.card, shadow.soft, { marginTop: spacing.lg }]}>
            <Text style={s.fieldLabel}>Preview</Text>
            <View style={s.previewBubble}><Text style={s.bodyBold}>{text}</Text></View>
          </View>
        )}

        <TouchableOpacity style={[s.outlineBtnFlex, { marginTop: spacing.lg, width: '100%' }]} onPress={() => Alert.alert('Test message sent', 'A preview of this welcome message was sent to your own inbox.')}>
          <Text style={s.outlineBtnFlexText}>Send Test Message</Text>
        </TouchableOpacity>

        <View style={[s.toggleRow, { marginTop: spacing.md }]}>
          <Text style={s.toggleLabel}>Enabled</Text>
          <Switch value={enabled} onValueChange={setEnabled} trackColor={{ true: colors.primary }} thumbColor="#fff" />
        </View>

        <TouchableOpacity
          style={[s.saveBtnFlex, { width: '100%', marginTop: spacing.lg }]}
          onPress={() => {
            if (enabled && !text.trim()) return Alert.alert('Write a message first');
            onSave({ enabled, text: text.trim(), attachments: images.map(url => ({ name: 'image', url, type: 'image' })), updatedAt: new Date().toISOString() });
          }}
        >
          <Text style={s.saveBtnFlexText}>Save</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function OnboardingVideoSetup({ value, onSave, onClose }: {
  value?: { enabled?: boolean; url?: string; fileName?: string; title?: string; description?: string; status?: string };
  onSave: (v: any) => void; onClose: () => void;
}) {
  const [fileUri, setFileUri] = useState(value?.url || '');
  const [fileName, setFileName] = useState(value?.fileName || '');
  const [title, setTitle] = useState(value?.title || '');
  const [description, setDescription] = useState(value?.description || '');
  const [busy, setBusy] = useState(false);

  const pickVideo = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], quality: 1 });
    if (r.canceled) return;
    setBusy(true);
    try {
      const asset = r.assets[0];
      const name = asset.fileName || 'onboarding.mp4';
      const uploaded = await earnService.uploadVideoFile({ uri: asset.uri, name, mimeType: asset.mimeType || 'video/mp4' });
      setFileUri(uploaded.fileUrl); setFileName(name);
    } catch (e) { Alert.alert('Upload failed', (e as Error).message); }
    finally { setBusy(false); }
  };

  const save = (status: 'draft' | 'published') => {
    if (status === 'published' && !fileUri) return Alert.alert('Upload a video first');
    onSave({ enabled: status === 'published', url: fileUri, fileName, title: title.trim(), description: description.trim(), status });
  };

  return (
    <SafeAreaView style={[s.safe, { flex: 1 }]} edges={['top', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
        <Text style={s.headerTitle}>Onboarding Video</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView contentContainerStyle={s.content}>
        <TouchableOpacity style={s.uploadBox} onPress={pickVideo} disabled={busy}>
          {fileUri ? (
            <>
              <Ionicons name="checkmark-circle" size={32} color={colors.success} />
              <Text style={s.bodyBold}>{fileName}</Text>
              <Text style={s.linkText}>Replace video</Text>
            </>
          ) : (
            <>
              <Ionicons name="videocam-outline" size={32} color={colors.primary} />
              <Text style={s.bodyBold}>{busy ? 'Uploading…' : 'Upload onboarding video'}</Text>
            </>
          )}
        </TouchableOpacity>
        {fileUri && (
          <TouchableOpacity onPress={() => { setFileUri(''); setFileName(''); }}>
            <Text style={[s.linkText, { color: '#EF4444', textAlign: 'center', marginTop: spacing.xs }]}>Remove video</Text>
          </TouchableOpacity>
        )}
        <Text style={s.fieldLabel}>Video title</Text>
        <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="Welcome to the community!" placeholderTextColor={colors.textMuted} />
        <Text style={s.fieldLabel}>Short description</Text>
        <TextInput style={[s.input, { minHeight: 70, textAlignVertical: 'top' }]} value={description} onChangeText={setDescription} multiline placeholder="What should new members know?" placeholderTextColor={colors.textMuted} />
        {fileUri && (
          <TouchableOpacity style={s.outlineBtnFlex} onPress={() => Alert.alert('Preview', `${fileName} is ready to preview once published.`)}>
            <Text style={s.outlineBtnFlexText}>Preview</Text>
          </TouchableOpacity>
        )}
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg }}>
          <TouchableOpacity style={s.outlineBtnFlex} onPress={() => save('draft')}><Text style={s.outlineBtnFlexText}>Save as Draft</Text></TouchableOpacity>
          <TouchableOpacity style={s.saveBtnFlex} onPress={() => save('published')}><Text style={s.saveBtnFlexText}>Publish</Text></TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PixelSetup({ platform, config, onSave, onRemove, onClose }: {
  platform: typeof PIXEL_PLATFORMS[number];
  config?: { id: string; status: string; events: string[] };
  onSave: (cfg: { id: string; status: 'connected' | 'invalid' | 'not-connected'; events: string[]; updatedAt: string }) => void;
  onRemove: () => void; onClose: () => void;
}) {
  const [id, setId] = useState(config?.id || '');
  const [events, setEvents] = useState<string[]>(config?.events || ['Membership successfully joined']);
  const [tested, setTested] = useState(false);

  const isValid = platform.validate.test(id.trim());

  return (
    <SafeAreaView style={[s.safe, { flex: 1 }]} edges={['top', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity onPress={onClose}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
        <Text style={s.headerTitle}>{platform.label}</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.note}>Where to find your ID: {platform.hint}</Text>
        <Text style={s.fieldLabel}>{platform.label} ID</Text>
        <TextInput style={s.input} value={id} onChangeText={v => { setId(v); setTested(false); }} placeholder="Paste your Pixel / Tag ID" placeholderTextColor={colors.textMuted} autoCapitalize="characters" />
        {id.trim().length > 0 && (
          <Text style={[s.metaMuted, { color: isValid ? colors.success : '#EF4444', marginTop: 4 }]}>
            {isValid ? '✓ Format looks valid' : '✗ Doesn\'t match the expected ID format for this platform'}
          </Text>
        )}

        <Text style={[s.fieldLabel, { marginTop: spacing.lg }]}>Events to track</Text>
        {TRACKABLE_EVENTS.map(ev => (
          <View key={ev} style={s.toggleRow}>
            <Text style={s.toggleLabel}>{ev}</Text>
            <Switch value={events.includes(ev)} onValueChange={v => setEvents(prev => v ? [...prev, ev] : prev.filter(x => x !== ev))} trackColor={{ true: colors.primary }} thumbColor="#fff" />
          </View>
        ))}

        <TouchableOpacity
          style={[s.outlineBtnFlex, { width: '100%', marginTop: spacing.lg }, !isValid && { opacity: 0.4 }]}
          disabled={!isValid}
          onPress={() => { setTested(true); Alert.alert('Test event queued', 'Your ID format is valid and saved. Actual event delivery to ' + platform.label + ' requires ad-network SDK integration, which is not yet implemented — nothing was sent to ' + platform.label + ' just now.'); }}
        >
          <Text style={s.outlineBtnFlexText}>Test Connection</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
          {config && (
            <TouchableOpacity style={s.deleteBtnFlex} onPress={onRemove}><Text style={s.saveBtnFlexText}>Disconnect</Text></TouchableOpacity>
          )}
          <TouchableOpacity
            style={[s.saveBtnFlex, !id.trim() && { opacity: 0.4 }]}
            disabled={!id.trim()}
            onPress={() => onSave({ id: id.trim(), status: isValid ? 'connected' : 'invalid', events, updatedAt: new Date().toISOString() })}
          >
            <Text style={s.saveBtnFlexText}>{isValid ? 'Save & Connect' : 'Save Anyway'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ═══════════════════════════════ Shared bits ═══════════════════════════════

function Stat({ label, value }: { label: string; value: string | number }) {
  return <View style={s.stat}><Text style={s.statValue}>{value}</Text><Text style={s.statLabel}>{label}</Text></View>;
}
function EmptyState({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <View style={s.emptyState}>
      <Ionicons name={icon as any} size={40} color={colors.textMuted} />
      <Text style={s.emptyTitle}>{title}</Text>
      <Text style={s.emptySub}>{sub}</Text>
    </View>
  );
}
function EmptyStateInline({ text }: { text: string }) {
  return (
    <View style={s.emptyRow}>
      <Ionicons name="information-circle-outline" size={18} color={colors.textMuted} />
      <Text style={s.emptyRowText}>{text}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  empty: { textAlign: 'center', marginTop: 100, color: colors.textSecondary },
  header: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { ...typography.h2, fontSize: 15, color: colors.textPrimary, flex: 1, textAlign: 'center' },
  headerHeading: { ...typography.h2, fontSize: 15, lineHeight: 20, color: colors.textPrimary },
  headerSub: { fontSize: 11, lineHeight: 14, color: colors.textSecondary },
  cancelText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  tabs: { flexGrow: 0, flexShrink: 0, borderBottomWidth: 1, borderBottomColor: colors.border },
  tabsContent: { alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radii.pill, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  tabTextActive: { color: '#fff' },
  content: { padding: spacing.lg, paddingBottom: 60, gap: spacing.sm },
  card: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.md },
  h1: { fontSize: 18, fontWeight: '900', color: colors.textPrimary, marginTop: spacing.sm },
  h2: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  section: { ...typography.h2, fontSize: 14, color: colors.textPrimary, marginTop: spacing.lg, marginBottom: spacing.xs },
  sectionGroup: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: spacing.md, marginBottom: 4 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  metaText: { fontSize: 12, color: colors.textSecondary, marginTop: 3 },
  metaMuted: { fontSize: 10.5, color: colors.textMuted },
  bodyBold: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  note: { fontSize: 11.5, color: colors.textSecondary, lineHeight: 17, backgroundColor: '#FFF8F5', borderRadius: radii.lg, padding: spacing.md, marginTop: spacing.sm },
  linkText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat: { backgroundColor: colors.card, borderRadius: radii.lg, padding: 12, width: '31%', minHeight: 64 },
  statValue: { fontSize: 14, fontWeight: '900', color: colors.textPrimary },
  statLabel: { fontSize: 9, color: colors.textSecondary, marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  rowText: { fontSize: 12.5, fontWeight: '600', color: colors.textPrimary, flex: 1 },
  activityRow: { flexDirection: 'row', gap: spacing.sm, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  activityText: { fontSize: 12, fontWeight: '600', color: colors.textPrimary },
  emptyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  emptyRowText: { flex: 1, fontSize: 12, color: colors.textSecondary },
  emptyState: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.xs },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  emptySub: { fontSize: 12, color: colors.textSecondary, textAlign: 'center' },
  // Search / filters
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radii.xl, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderWidth: 1, borderColor: colors.border },
  searchInput: { flex: 1, fontSize: 13, color: colors.textPrimary, padding: 0 },
  filterRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  filterPill: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  filterPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterPillText: { fontSize: 11.5, fontWeight: '600', color: colors.textSecondary },
  filterPillTextActive: { color: '#fff' },
  // Members
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.md },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.border },
  roleBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radii.pill, backgroundColor: colors.background },
  roleBadgeAdmin: { backgroundColor: '#FFF0E8' },
  roleBadgeText: { fontSize: 10.5, fontWeight: '600', color: colors.textMuted },
  roleBadgeTextAdmin: { color: colors.primary, fontWeight: '700' },
  // Buttons
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: 7 },
  addBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  outlineBtnFlex: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radii.pill, borderWidth: 1.5, borderColor: colors.primary },
  outlineBtnFlexText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  saveBtnFlex: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radii.pill, backgroundColor: colors.primary },
  saveBtnFlexText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  deleteBtnFlex: { flex: 1, alignItems: 'center', paddingVertical: spacing.md, borderRadius: radii.pill, backgroundColor: '#EF4444' },
  // Tiers
  tierCard: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.md, borderLeftWidth: 4 },
  activeBadge: { backgroundColor: '#E6F9F0', borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 2 },
  activeBadgeText: { fontSize: 10, fontWeight: '700', color: colors.success },
  priceText: { fontSize: 13, fontWeight: '800', color: colors.primary, marginTop: 6 },
  // Forms
  fieldLabel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, marginBottom: 4, marginTop: spacing.sm },
  input: { backgroundColor: colors.background, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, fontSize: 13, color: colors.textPrimary },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  typeOpt: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  typeOptActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeOptText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  typeOptTextActive: { color: '#fff' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  toggleLabel: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  addBenefitBtn: { width: 42, height: 42, borderRadius: radii.md, borderWidth: 1, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  benefitChip: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: '#FFF0E8', borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 4, marginTop: spacing.xs },
  benefitChipText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  // Content
  contentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.md },
  contentIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF0E8', alignItems: 'center', justifyContent: 'center' },
  contentTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  contentTypeCard: { width: '30%', alignItems: 'center', gap: 4, paddingVertical: spacing.md, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  contentTypeCardActive: { borderColor: colors.primary, backgroundColor: '#FFF0E8' },
  contentTypeLabel: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
  statusChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.pill, backgroundColor: colors.background },
  statusChipActive: { backgroundColor: '#E6F9F0' },
  statusChipText: { fontSize: 10, fontWeight: '700', color: colors.textMuted },
  statusChipTextActive: { color: colors.success },
  // Events
  scheduleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md },
  scheduleBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  eventCard: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.md },
  // Plugins
  pluginRow: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  uploadBox: { alignItems: 'center', borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.primary, borderRadius: radii.xl, padding: spacing.xl, gap: 6, backgroundColor: '#FFF8F5' },
  previewBubble: { backgroundColor: colors.background, borderRadius: radii.lg, padding: spacing.md, marginTop: spacing.xs },
  imageRemoveBtn: { position: 'absolute', top: -4, right: -4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 8, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  addImageBtn: { width: 64, height: 64, borderRadius: radii.md, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  // Overlays
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  confirmCard: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg, width: '100%' },
  // Bar chart
  barChart: { flexDirection: 'row', alignItems: 'flex-end', height: 90, gap: 6 },
  barCol: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 3, minHeight: 4 },
});
