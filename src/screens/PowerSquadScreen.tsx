import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert, FlatList, Image, Linking, Modal, ScrollView,
  StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Avatar from '../components/Avatar';
import { colors, radii, shadow, spacing, typography } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import { useApiQuery } from '../hooks/useApiQuery';
import { groupsService } from '../services/api/groups.service';
import { postsService } from '../services/api/posts.service';
import { personalService } from '../services/api/personal.service';
import { earnService } from '../services/api/earn.service';
import { useAuth } from '../context/AuthContext';
import type { Post } from '../types/api';

// ─── Streaks (16C) ───────────────────────────────────────────────────────────
// Real, computed from each member's actual post activity — no fabricated numbers.
function computeStreaks(posts: Post[]): Record<string, number> {
  const byUser: Record<string, Set<string>> = {};
  posts.forEach(p => {
    const day = new Date(p.created_at).toDateString();
    (byUser[p.user_id] ??= new Set()).add(day);
  });
  const streaks: Record<string, number> = {};
  Object.entries(byUser).forEach(([uid, days]) => {
    let streak = 0;
    const cursor = new Date();
    if (!days.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1);
    while (days.has(cursor.toDateString())) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    streaks[uid] = streak;
  });
  return streaks;
}

// ─── Types ─────────────────────────────────────────────────────────────────────

type ResourceItem = { id: string; type: 'pdf' | 'video' | 'image' | 'link'; title: string; url: string; allowDownload: boolean; folderId?: string };
type ResourceFolder = { id: string; title: string };
type CommunityResources = { folders: ResourceFolder[]; items: ResourceItem[] };
type QAPost = { id: string; text: string; authorName: string; authorAvatar: string; likes: number; comments: number; ts: number };
type LeaderEntry = { rank: number; userId: string; name: string; username: string; avatar: string; points: number; badge?: string };

const ALL_TABS = ['Feed', 'Q&A', 'Resources', 'Top 10', 'Members'] as const;
type Tab = typeof ALL_TABS[number];

const RESOURCE_TYPE_ICONS: Record<string, string> = {
  pdf: 'document-text-outline',
  video: 'videocam-outline',
  image: 'image-outline',
  link: 'link-outline',
};

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function PowerSquadScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'PowerSquad'>>();
  const { user } = useAuth();
  const groupId = route.params?.groupId;

  const [tab, setTab] = useState<Tab>('Feed');
  const [openingManager, setOpeningManager] = useState(false);
  const [onboardingVisible, setOnboardingVisible] = useState(false);

  const detail = useApiQuery(() => groupId ? groupsService.get(groupId) : Promise.resolve(null), null, [groupId]);
  const activity = useApiQuery(() => groupId ? groupsService.getActivity(groupId) : Promise.resolve([]), [], [groupId]);

  const real = detail.data;
  const group = real?.group;
  const isAdmin = real?.myRole === 'admin' || real?.myRole === 'owner';
  const isMember = !!real?.myRole;

  const memberCount = group?.member_count ?? 0;
  const members = real?.members ?? [];

  // 16C — plugin flags live on the group's own metadata so every member (not just the
  // owner) can read them with the group they already fetch; Membership Manager writes here.
  const plugins = (group?.metadata as Record<string, any> | undefined)?.plugins || {};
  const showLeaderboard = plugins.leaderboard !== false;
  const streaks = plugins.streak === true ? computeStreaks(activity.data as Post[]) : {};
  const onboardingVideo = plugins.onboardingVideo as { enabled?: boolean; status?: string; url?: string; title?: string; description?: string } | undefined;

  const TABS = ALL_TABS.filter(t => t !== 'Top 10' || showLeaderboard);

  useFocusEffect(useCallback(() => {
    detail.refetch();
    activity.refetch();
  }, [groupId]));

  // Show the published onboarding video once, the first time a member opens their community.
  useEffect(() => {
    if (!groupId || !user?.id || !isMember) return;
    if (!onboardingVideo?.enabled || onboardingVideo.status !== 'published' || !onboardingVideo.url) return;
    const key = `onboarding-seen:${groupId}:${user.id}`;
    AsyncStorage.getItem(key).then(seen => {
      if (!seen) { setOnboardingVisible(true); AsyncStorage.setItem(key, '1'); }
    });
  }, [groupId, user?.id, isMember, onboardingVideo?.enabled, onboardingVideo?.status, onboardingVideo?.url]);

  const handleJoinLeave = async () => {
    if (!groupId) return;
    try {
      if (isMember) await groupsService.leave(groupId);
      else await groupsService.join(groupId);
      await detail.refetch();
    } catch (e) { Alert.alert('Error', (e as Error).message); }
  };

  // 16A — owner/moderator-only entry into the Membership Manager. Finds the earn-membership
  // asset already linked to this group, or provisions a default (free, draft) one so the
  // manager is always reachable without ever surfacing admin tools on this public page.
  const openMembershipManager = async () => {
    if (!groupId || openingManager) return;
    setOpeningManager(true);
    try {
      const memberships = await earnService.getAssets('membership');
      const existing = memberships.find(m => (m.metadata as { groupId?: string } | undefined)?.groupId === groupId);
      if (existing) { navigation.navigate('MembershipDashboard', { membershipId: existing.id }); return; }
      const created = await earnService.createAsset({
        kind: 'membership', title: group?.name || 'Community', description: group?.description || '',
        status: 'draft', price: 0, currency: 'USD',
        metadata: { groupId, pricingModel: 'free', privacy: group?.is_private ? 'private' : 'public', category: (group as { category?: string } | undefined)?.category },
      });
      navigation.navigate('MembershipDashboard', { membershipId: created.id });
    } catch (e) {
      Alert.alert('Unable to open Membership Manager', (e as Error).message);
    } finally {
      setOpeningManager(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{group?.name ?? 'Community'}</Text>
        {isAdmin ? (
          <TouchableOpacity onPress={openMembershipManager} disabled={openingManager} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="settings-outline" size={21} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : <View style={{ width: 21 }} />}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[1]}>
        {/* Hero + info */}
        <View>
          <Image source={{ uri: group?.cover || `https://picsum.photos/seed/${groupId}/600/240` }} style={s.cover} />
          <View style={s.infoCard}>
            <View style={s.infoRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.groupName}>{group?.name ?? 'Community'}</Text>
                <Text style={s.groupDesc}>{group?.description}</Text>
                <View style={s.metaRow}>
                  <Ionicons name="people-outline" size={13} color={colors.textSecondary} />
                  <Text style={s.metaText}>{memberCount.toLocaleString()} · {group?.category ?? 'Community'} · {group?.is_private ? 'private' : 'public'}</Text>
                </View>
              </View>
              <View style={[s.freeBadge]}>
                <Text style={s.freeBadgeText}>Free</Text>
              </View>
            </View>
            <TouchableOpacity style={s.joinBtn} onPress={handleJoinLeave} activeOpacity={0.85}>
              <Text style={s.joinBtnText}>{isMember ? 'Leave' : 'Join'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sticky tab bar */}
        <View style={s.tabBarWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabBar}>
            {TABS.map(t => (
              <TouchableOpacity key={t} style={[s.tabItem, tab === t && s.tabItemActive]} onPress={() => setTab(t)}>
                <Text style={[s.tabItemText, tab === t && s.tabItemTextActive]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Tab content */}
        <View style={{ minHeight: 400 }}>
          {tab === 'Feed' && <FeedTab groupId={groupId} isMember={isMember} isAdmin={isAdmin} posts={activity.data} onRefresh={activity.refetch} streaks={streaks} />}
          {tab === 'Q&A' && <QATab groupId={groupId} isMember={isMember} />}
          {tab === 'Resources' && <ResourcesTab groupId={groupId} isAdmin={isAdmin} />}
          {tab === 'Top 10' && <Top10Tab members={members} />}
          {tab === 'Members' && <MembersTab members={members} isAdmin={isAdmin} groupId={groupId} streaks={streaks} />}
        </View>
      </ScrollView>

      {/* Onboarding video (16C) */}
      <Modal visible={onboardingVisible} transparent animationType="fade">
        <View style={s.onboardOverlay}>
          <View style={s.onboardCard}>
            <TouchableOpacity style={s.onboardClose} onPress={() => setOnboardingVisible(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={s.onboardTitle}>{onboardingVideo?.title || `Welcome to ${group?.name ?? 'the community'}`}</Text>
            {onboardingVideo?.description ? <Text style={s.onboardDesc}>{onboardingVideo.description}</Text> : null}
            <View style={s.onboardVideoBox}>
              <Ionicons name="play-circle" size={48} color={colors.primary} />
              <Text style={s.onboardVideoHint} numberOfLines={1}>{onboardingVideo?.url}</Text>
            </View>
            <TouchableOpacity style={s.onboardDoneBtn} onPress={() => setOnboardingVisible(false)}>
              <Text style={s.onboardDoneText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Feed Tab ─────────────────────────────────────────────────────────────────

function FeedTab({ groupId, isMember, isAdmin, posts, onRefresh, streaks }: {
  groupId?: string; isMember: boolean; isAdmin: boolean;
  posts: any[]; onRefresh: () => void; streaks: Record<string, number>;
}) {
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  const pickImages = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: 10, quality: 0.6 });
    if (!r.canceled) setImages(prev => [...prev, ...r.assets.map(a => a.uri)].slice(0, 10));
  };

  const publish = async () => {
    if (!groupId || (!draft.trim() && !images.length)) return;
    setPosting(true);
    try {
      const imageUrls = await Promise.all(images.map(uri => postsService.uploadImage({ uri, mimeType: 'image/jpeg', fileName: 'post.jpg' })));
      await postsService.create({ text: draft.trim(), images: imageUrls.length ? imageUrls : undefined, community: groupId });
      setDraft(''); setImages([]);
      onRefresh();
    } catch (e) { Alert.alert('Error', (e as Error).message); }
    finally { setPosting(false); }
  };

  return (
    <View style={s.tabContent}>
      {/* Live banner */}
      <View style={[s.liveBanner, shadow.soft]}>
        <View style={s.liveBannerLeft}>
          <View style={s.liveBannerIcon}>
            <Ionicons name="radio-outline" size={18} color={colors.primary} />
          </View>
          <View>
            <Text style={s.liveBannerTitle}>No one is live right now</Text>
            <Text style={s.liveBannerSub}>Tap to go live in this community</Text>
          </View>
        </View>
        <TouchableOpacity style={s.goLiveBtn} onPress={() => Alert.alert('Go Live', 'Coming soon.')}>
          <Text style={s.goLiveBtnText}>Go Live</Text>
        </TouchableOpacity>
      </View>

      {/* Composer */}
      {isMember && (
        <View style={[s.composer, shadow.soft]}>
          <TextInput style={s.composerInput} value={draft} onChangeText={setDraft} placeholder="Share with the community…" placeholderTextColor={colors.textMuted} multiline />
          {images.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }}>
              {images.map((uri, i) => (
                <View key={i} style={s.imagePreviewWrap}>
                  <Image source={{ uri }} style={s.imagePreview} />
                  <TouchableOpacity style={s.imageRemove} onPress={() => setImages(p => p.filter((_, j) => j !== i))}>
                    <Ionicons name="close-circle" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
          <View style={s.composerActions}>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <TouchableOpacity style={s.composerIconBtn} onPress={pickImages}>
                <Ionicons name="image-outline" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={s.composerIconBtn} onPress={() => Alert.alert('Audio', 'Audio recording coming soon.')}>
                <Ionicons name="mic-outline" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={s.postBtn} onPress={publish} disabled={posting}>
              <Ionicons name="send-outline" size={14} color="#fff" />
              <Text style={s.postBtnText}>{posting ? 'Posting…' : 'Post'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Posts */}
      {posts.map(post => (
        <CommunityPost key={post.id} post={post} isAdmin={isAdmin} onRefresh={onRefresh} streak={streaks[post.user_id] || 0} navigation={navigation} />
      ))}
      {!posts.length && <Text style={s.emptyText}>No posts yet. Be the first to share!</Text>}
    </View>
  );
}

function CommunityPost({ post, isAdmin, onRefresh, streak = 0, navigation }: { post: any; isAdmin: boolean; onRefresh: () => void; streak?: number; navigation: any }) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <View style={[s.postCard, shadow.soft]}>
      <TouchableOpacity 
        style={s.postHeader}
        onPress={() => post.user?.id && navigation.navigate('UserProfile', { userId: post.user.id, username: post.user.name })}
        disabled={!post.user?.id}
        activeOpacity={0.7}
      >
        <Avatar uri={post.user?.avatar || ''} size={36} />
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Text style={s.postAuthor}>@{post.user?.name?.replace(/\s+/g, '.').toLowerCase() || 'member'}</Text>
            {streak > 0 && (
              <View style={s.streakChip}>
                <Ionicons name="flame" size={10} color="#F59E0B" />
                <Text style={s.streakChipText}>{streak}</Text>
              </View>
            )}
          </View>
          <Text style={s.postSubLabel}>Community post</Text>
        </View>
        {post.pinned && (
          <View style={s.pinnedBadge}>
            <Ionicons name="pin-outline" size={11} color={colors.primary} />
            <Text style={s.pinnedText}>Pinned</Text>
          </View>
        )}
        {isAdmin && (
          <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="ellipsis-horizontal" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      <Text style={s.postBody}>{post.text}</Text>

      {post.image ? <Image source={{ uri: post.image }} style={s.postImage} /> : null}

      <View style={s.postFooter}>
        <TouchableOpacity style={s.footerBtn} onPress={() => setLiked(l => !l)}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={16} color={liked ? '#FF4D5E' : colors.textSecondary} />
          <Text style={s.footerBtnText}>{(post.likes || 0) + (liked ? 1 : 0)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.footerBtn}>
          <Ionicons name="chatbubble-outline" size={15} color={colors.textSecondary} />
          <Text style={s.footerBtnText}>{post.comments || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.footerBtn}>
          <Ionicons name="share-social-outline" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={{ marginLeft: 'auto' }} onPress={() => setSaved(v => !v)}>
          <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={16} color={saved ? colors.primary : colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Q&A Tab ──────────────────────────────────────────────────────────────────

function QATab({ groupId, isMember }: { groupId?: string; isMember: boolean }) {
  const [question, setQuestion] = useState('');
  const [posting, setPosting] = useState(false);
  const qaKey = `qa-${groupId}`;
  const qa = useApiQuery<any[]>(() => groupId ? personalService.list(qaKey).then(r => r.map(x => ({ id: x.id, ...x.data }))) : Promise.resolve([]), [], [groupId]);

  const submitQuestion = async () => {
    if (!question.trim() || !groupId) return;
    setPosting(true);
    try {
      await personalService.create(qaKey, { text: question.trim(), authorName: 'You', authorAvatar: '', likes: 0, comments: 0, ts: Date.now() }, { externalKey: groupId });
      setQuestion('');
      await qa.refetch();
    } catch (e) { Alert.alert('Error', (e as Error).message); }
    finally { setPosting(false); }
  };

  return (
    <View style={s.tabContent}>
      {isMember && (
        <View style={[s.composer, shadow.soft]}>
          <TextInput style={s.composerInput} value={question} onChangeText={setQuestion} placeholder="Ask a question…" placeholderTextColor={colors.textMuted} multiline />
          <View style={s.composerActions}>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <TouchableOpacity style={s.composerIconBtn}>
                <Ionicons name="image-outline" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity style={s.composerIconBtn}>
                <Ionicons name="mic-outline" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={s.postBtn} onPress={submitQuestion} disabled={posting}>
              <Ionicons name="send-outline" size={14} color="#fff" />
              <Text style={s.postBtnText}>{posting ? 'Posting…' : 'Post'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {qa.data.map((item: any) => (
        <View key={item.id} style={[s.postCard, shadow.soft]}>
          <TouchableOpacity 
            style={s.postHeader}
            onPress={() => item.userId && navigation.navigate('UserProfile', { userId: item.userId, username: item.authorName })}
            disabled={!item.userId}
            activeOpacity={0.7}
          >
            <Avatar uri={item.authorAvatar || ''} size={36} />
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={s.postAuthor}>@{item.authorName?.replace(/\s+/g, '.').toLowerCase() || 'member'}</Text>
              <Text style={s.postSubLabel}>Community post</Text>
            </View>
          </TouchableOpacity>
          <Text style={s.postBody}>Q: {item.text}</Text>
          <View style={s.postFooter}>
            <TouchableOpacity style={s.footerBtn}>
              <Ionicons name="heart-outline" size={16} color={colors.textSecondary} />
              <Text style={s.footerBtnText}>{item.likes || 0}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.footerBtn}>
              <Ionicons name="chatbubble-outline" size={15} color={colors.textSecondary} />
              <Text style={s.footerBtnText}>{item.comments || 0}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.footerBtn, { marginLeft: 'auto' }]}>
              <Text style={s.replyText}>Reply</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
      {!qa.data.length && <Text style={s.emptyText}>No questions yet. Ask the first one!</Text>}
    </View>
  );
}

// ─── Resources Tab ────────────────────────────────────────────────────────────

function ResourcesTab({ groupId, isAdmin }: { groupId?: string; isAdmin: boolean }) {
  const resourceKey = `resources-${groupId}`;
  const folderKey = `resource-folders-${groupId}`;
  const resources = useApiQuery<any[]>(() => personalService.list(resourceKey).then(r => r.map(x => ({ id: x.id, ...x.data }))), [], [groupId]);
  const folders = useApiQuery<any[]>(() => personalService.list(folderKey).then(r => r.map(x => ({ id: x.id, ...x.data }))), [], [groupId]);

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'PDFs' | 'Videos' | 'Images' | 'Links'>('All');
  const [addModal, setAddModal] = useState(false);
  const [folderModal, setFolderModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<any>(null);
  const [newFolderTitle, setNewFolderTitle] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [newFolderCover, setNewFolderCover] = useState('');
  const [newResourceTitle, setNewResourceTitle] = useState('');
  const [newResourceUrl, setNewResourceUrl] = useState('');
  const [newResourceType, setNewResourceType] = useState<'pdf' | 'video' | 'image' | 'link'>('pdf');
  const [newResourceFolder, setNewResourceFolder] = useState('');
  const [allowDownload, setAllowDownload] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (id: string) => setExpandedFolders(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const saveFolder = async () => {
    if (!newFolderTitle.trim() || !groupId) return;
    if (editingFolder) {
      await personalService.update(editingFolder.id, { title: newFolderTitle.trim(), description: newFolderDesc, cover: newFolderCover });
    } else {
      await personalService.create(folderKey, { title: newFolderTitle.trim(), description: newFolderDesc, cover: newFolderCover }, { externalKey: groupId });
    }
    setNewFolderTitle(''); setNewFolderDesc(''); setNewFolderCover(''); setEditingFolder(null); setFolderModal(false);
    await folders.refetch();
  };

  const deleteFolder = async (folder: any) => {
    Alert.alert('Delete folder?', `"${folder.title}" and its resources will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await personalService.remove(folder.id); await folders.refetch(); await resources.refetch(); } },
    ]);
  };

  const saveResource = async () => {
    if (!newResourceTitle.trim() || !groupId) return;
    await personalService.create(resourceKey, {
      type: newResourceType, title: newResourceTitle.trim(),
      url: newResourceUrl.trim(), allowDownload, folderId: newResourceFolder || undefined,
    }, { externalKey: groupId });
    setNewResourceTitle(''); setNewResourceUrl(''); setNewResourceFolder(''); setAddModal(false);
    await resources.refetch();
  };

  const deleteResource = async (item: any) => {
    await personalService.remove(item.id);
    await resources.refetch();
  };

  const pickFile = async () => {
    const type = newResourceType === 'pdf' ? 'application/pdf' : newResourceType === 'video' ? ['video/mp4', 'video/quicktime'] : ['image/*'];
    const r = await DocumentPicker.getDocumentAsync({ type: type as any });
    if (!r.canceled) setNewResourceUrl(r.assets[0].uri);
  };

  const pickFolderCover = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!r.canceled) setNewFolderCover(r.assets[0].uri);
  };

  const TYPE_MAP: Record<string, string> = { PDFs: 'pdf', Videos: 'video', Images: 'image', Links: 'link' };
  const filtered = resources.data.filter(r => {
    if (search && !r.title?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType !== 'All' && r.type !== TYPE_MAP[filterType]) return false;
    return true;
  });
  const standaloneItems = filtered.filter((r: any) => !r.folderId);

  const openResource = (item: any) => {
    if (item.url) Linking.openURL(item.url).catch(() => Alert.alert('Cannot open', 'Unable to open this resource.'));
  };

  return (
    <View style={s.tabContent}>
      {/* Header */}
      <Text style={s.resourceSectionTitle}>Community resources</Text>

      {/* Search */}
      <View style={s.searchBar}>
        <Ionicons name="search-outline" size={16} color={colors.textMuted} />
        <TextInput style={s.searchInput} value={search} onChangeText={setSearch} placeholder="Search resources" placeholderTextColor={colors.textMuted} />
      </View>

      {/* Admin action buttons */}
      {isAdmin && (
        <View style={s.adminActions}>
          <TouchableOpacity style={s.addResourceBtn} onPress={() => { setNewResourceFolder(''); setAddModal(true); }}>
            <Ionicons name="add" size={14} color="#fff" />
            <Text style={s.addResourceBtnText}>Add resource</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.addFolderBtn} onPress={() => { setEditingFolder(null); setNewFolderTitle(''); setNewFolderDesc(''); setNewFolderCover(''); setFolderModal(true); }}>
            <Ionicons name="folder-open-outline" size={14} color={colors.primary} />
            <Text style={s.addFolderBtnText}>+ Create folder</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Type filter pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.xs }}>
        {(['All', 'PDFs', 'Videos', 'Images', 'Links'] as const).map(t => (
          <TouchableOpacity key={t} style={[s.filterPill, filterType === t && s.filterPillActive]} onPress={() => setFilterType(t)}>
            <Text style={[s.filterPillText, filterType === t && s.filterPillTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Folders section */}
      {folders.data.length > 0 && <Text style={s.subSectionLabel}>Your folders</Text>}
      {folders.data.map((folder: any) => {
        const folderItems = filtered.filter((r: any) => r.folderId === folder.id);
        const expanded = expandedFolders.has(folder.id);
        return (
          <View key={folder.id} style={[s.folderCard, shadow.soft]}>
            {/* Folder cover banner */}
            <TouchableOpacity onPress={() => toggleFolder(folder.id)} activeOpacity={0.85}>
              <View style={s.folderBanner}>
                {folder.cover
                  ? <Image source={{ uri: folder.cover }} style={s.folderBannerImage} />
                  : <View style={[s.folderBannerPlaceholder, { backgroundColor: colors.primary + '20' }]} />}
                <View style={s.folderBannerOverlay}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.folderBannerTitle}>{folder.title}</Text>
                    {folder.description ? <Text style={s.folderBannerDesc}>{folder.description}</Text> : null}
                    <Text style={s.folderBannerCount}>{folderItems.length} resource{folderItems.length !== 1 ? 's' : ''}</Text>
                  </View>
                  <View style={s.folderChevron}>
                    <Ionicons name={expanded ? 'chevron-up' : 'chevron-forward'} size={18} color="#fff" />
                  </View>
                </View>
                {isAdmin && (
                  <TouchableOpacity
                    style={s.folderMenuBtn}
                    onPress={() => Alert.alert(folder.title, 'Manage folder', [
                      { text: 'Edit', onPress: () => { setEditingFolder(folder); setNewFolderTitle(folder.title); setNewFolderDesc(folder.description ?? ''); setNewFolderCover(folder.cover ?? ''); setFolderModal(true); } },
                      { text: 'Add resource', onPress: () => { setNewResourceFolder(folder.id); setAddModal(true); } },
                      { text: 'Delete folder', style: 'destructive', onPress: () => deleteFolder(folder) },
                      { text: 'Cancel', style: 'cancel' },
                    ])}
                  >
                    <Ionicons name="ellipsis-horizontal" size={18} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>

            {/* Folder items */}
            {expanded && (
              <View style={s.folderItems}>
                {folderItems.map((item: any) => (
                  <ResourceItemRow key={item.id} item={item} isAdmin={isAdmin} onDelete={() => deleteResource(item)} onOpen={() => openResource(item)} />
                ))}
                {folderItems.length === 0 && <Text style={s.emptyFolderText}>No resources in this folder yet.</Text>}
                {isAdmin && (
                  <TouchableOpacity style={s.addToFolderBtn} onPress={() => { setNewResourceFolder(folder.id); setAddModal(true); }}>
                    <Ionicons name="add-circle-outline" size={15} color={colors.primary} />
                    <Text style={s.addToFolderBtnText}>Add resource to folder</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        );
      })}

      {/* Standalone / Individual resources */}
      {standaloneItems.length > 0 && (
        <>
          <Text style={s.subSectionLabel}>
            {folders.data.length > 0 ? 'Individual resources' : 'Resources'}
          </Text>
          <View style={s.standaloneGrid}>
            {standaloneItems.map((item: any) => (
              <StandaloneResourceCard key={item.id} item={item} isAdmin={isAdmin} onDelete={() => deleteResource(item)} onOpen={() => openResource(item)} />
            ))}
          </View>
        </>
      )}

      {!folders.data.length && !standaloneItems.length && (
        <View style={s.resourcesEmpty}>
          <Ionicons name="folder-open-outline" size={44} color={colors.textMuted} />
          <Text style={s.resourcesEmptyTitle}>{isAdmin ? 'Add resources for your community' : 'No resources yet'}</Text>
          <Text style={s.resourcesEmptySub}>{isAdmin ? 'Upload PDFs, videos, images or links.' : 'Check back soon.'}</Text>
        </View>
      )}

      {/* ── Add Resource Modal ── */}
      <Modal visible={addModal} transparent animationType="slide">
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setAddModal(false)}>
          <View style={[s.modalSheet, { maxHeight: '85%' }]}>
            <View style={s.modalHandle} />
            <View style={s.modalTitleRow}>
              <Text style={s.modalTitle}>Add resource</Text>
              <TouchableOpacity onPress={() => setAddModal(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Type tabs */}
              <View style={s.resourceTypeTabs}>
                {(['pdf', 'video', 'image', 'link'] as const).map(t => (
                  <TouchableOpacity key={t} style={[s.resourceTypeTab, newResourceType === t && s.resourceTypeTabActive]} onPress={() => setNewResourceType(t)}>
                    <Ionicons name={RESOURCE_TYPE_ICONS[t] as any} size={16} color={newResourceType === t ? '#fff' : colors.textSecondary} />
                    <Text style={[s.resourceTypeTabText, newResourceType === t && s.resourceTypeTabTextActive]}>
                      {t === 'pdf' ? 'PDF' : t.charAt(0).toUpperCase() + t.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={s.modalLabel}>Resource title</Text>
              <TextInput style={s.modalInput} value={newResourceTitle} onChangeText={setNewResourceTitle} placeholder="e.g. Nutrition Basics Guide" placeholderTextColor={colors.textMuted} />

              {/* Folder selector */}
              {folders.data.length > 0 && (
                <>
                  <Text style={s.modalLabel}>Add to folder</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.xs }}>
                    <TouchableOpacity style={[s.typeChip, !newResourceFolder && s.typeChipActive]} onPress={() => setNewResourceFolder('')}>
                      <Text style={[s.typeChipText, !newResourceFolder && s.typeChipTextActive]}>No folder</Text>
                    </TouchableOpacity>
                    {folders.data.map((f: any) => (
                      <TouchableOpacity key={f.id} style={[s.typeChip, newResourceFolder === f.id && s.typeChipActive]} onPress={() => setNewResourceFolder(f.id)}>
                        <Text style={[s.typeChipText, newResourceFolder === f.id && s.typeChipTextActive]}>{f.title}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              {/* File / URL */}
              {newResourceType === 'link' ? (
                <>
                  <Text style={s.modalLabel}>URL</Text>
                  <TextInput style={s.modalInput} value={newResourceUrl} onChangeText={setNewResourceUrl} placeholder="https://…" placeholderTextColor={colors.textMuted} autoCapitalize="none" keyboardType="url" />
                </>
              ) : (
                <TouchableOpacity style={s.uploadBox} onPress={pickFile}>
                  <Ionicons name="cloud-upload-outline" size={28} color={colors.primary} />
                  <Text style={s.uploadBoxTitle}>
                    {newResourceUrl ? '✓ File selected' : `Drag & drop a file here\nor tap to browse`}
                  </Text>
                  <Text style={s.uploadBoxSub}>
                    {newResourceType === 'pdf' ? 'PDF up to 25 MB' : newResourceType === 'video' ? 'MP4, MOV up to 200 MB' : 'JPG, PNG up to 10 MB'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* Download toggle */}
              <View style={s.downloadToggleRow}>
                <View>
                  <Text style={s.modalLabel}>Allow members to download</Text>
                </View>
                <TouchableOpacity onPress={() => setAllowDownload(v => !v)}>
                  <View style={[s.toggleTrack, allowDownload && s.toggleTrackOn]}>
                    <View style={[s.toggleThumb, allowDownload && s.toggleThumbOn]} />
                  </View>
                </TouchableOpacity>
              </View>

              <View style={s.modalBtnRow}>
                <TouchableOpacity style={s.modalCancelBtn} onPress={() => setAddModal(false)}>
                  <Text style={s.modalCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.modalSaveBtn} onPress={saveResource}>
                  <Text style={s.modalSaveBtnText}>Publish</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Create/Edit Folder Modal ── */}
      <Modal visible={folderModal} transparent animationType="slide">
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setFolderModal(false)}>
          <View style={[s.modalSheet, { maxHeight: '85%' }]}>
            <View style={s.modalHandle} />
            <View style={s.modalTitleRow}>
              <Text style={s.modalTitle}>{editingFolder ? 'Edit folder' : 'Create folder'}</Text>
              <TouchableOpacity onPress={() => setFolderModal(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Cover photo */}
              <Text style={s.modalLabel}>Add cover photo</Text>
              <View style={s.coverPickRow}>
                <TouchableOpacity style={s.coverPickBtn} onPress={pickFolderCover}>
                  <Ionicons name="cloud-upload-outline" size={18} color={colors.textSecondary} />
                  <Text style={s.coverPickBtnText}>Upload</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.coverPickBtn} onPress={pickFolderCover}>
                  <Ionicons name="image-outline" size={18} color={colors.textSecondary} />
                  <Text style={s.coverPickBtnText}>Choose image</Text>
                </TouchableOpacity>
              </View>
              {newFolderCover ? <Image source={{ uri: newFolderCover }} style={s.folderCoverPreview} /> : null}

              <Text style={s.modalLabel}>Folder name</Text>
              <TextInput style={s.modalInput} value={newFolderTitle} onChangeText={setNewFolderTitle} placeholder="e.g. Module 1, Week 1, Getting Started…" placeholderTextColor={colors.textMuted} />

              <Text style={s.modalLabel}>Description (optional)</Text>
              <TextInput style={[s.modalInput, { minHeight: 64 }]} value={newFolderDesc} onChangeText={setNewFolderDesc} placeholder="Getting Started" placeholderTextColor={colors.textMuted} multiline />

              {/* Preview */}
              {newFolderTitle.trim() ? (
                <>
                  <Text style={[s.modalLabel, { marginTop: spacing.lg }]}>Folder preview</Text>
                  <View style={[s.folderPreviewCard, shadow.soft]}>
                    {newFolderCover
                      ? <Image source={{ uri: newFolderCover }} style={s.folderPreviewImage} />
                      : <View style={[s.folderPreviewImage, { backgroundColor: colors.primary + '20' }]} />}
                    <View style={s.folderPreviewInfo}>
                      <Text style={s.folderPreviewTitle}>{newFolderTitle}</Text>
                      <Text style={s.folderPreviewSub}>0 resources</Text>
                    </View>
                    <Ionicons name="ellipsis-horizontal" size={16} color={colors.textMuted} />
                  </View>
                </>
              ) : null}

              <View style={[s.modalBtnRow, { marginTop: spacing.xl }]}>
                <TouchableOpacity style={s.modalCancelBtn} onPress={() => setFolderModal(false)}>
                  <Text style={s.modalCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.modalSaveBtn} onPress={saveFolder}>
                  <Text style={s.modalSaveBtnText}>{editingFolder ? 'Save changes' : 'Create folder'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// Resource row inside an expanded folder
function ResourceItemRow({ item, isAdmin, onDelete, onOpen }: { item: any; isAdmin: boolean; onDelete: () => void; onOpen: () => void }) {
  const icon = RESOURCE_TYPE_ICONS[item.type] ?? 'document-outline';
  const sizeLabel = item.size ? `${(item.size / 1048576).toFixed(1)} MB` : '';
  return (
    <TouchableOpacity style={s.resourceItemRow} onPress={onOpen} activeOpacity={0.8}>
      <View style={[s.resourceItemThumb, { backgroundColor: item.type === 'pdf' ? '#FFEDE3' : item.type === 'video' ? '#E8F0FF' : item.type === 'image' ? '#E8F9F0' : '#F5F5F7' }]}>
        <Ionicons name={icon as any} size={20} color={item.type === 'pdf' ? colors.primary : item.type === 'video' ? '#3E7BFA' : item.type === 'image' ? colors.success : colors.textSecondary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.resourceItemTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={s.resourceItemMeta}>
          {item.type.toUpperCase()}{sizeLabel ? ` · ${sizeLabel}` : ''}
        </Text>
      </View>
      <TouchableOpacity
        style={[s.downloadBtn, !item.allowDownload && s.viewOnlyBtn]}
        onPress={onOpen}
      >
        <Text style={[s.downloadBtnText, !item.allowDownload && s.viewOnlyBtnText]}>
          {item.allowDownload ? 'Download' : 'View only'}
        </Text>
      </TouchableOpacity>
      {isAdmin && (
        <TouchableOpacity
          style={{ marginLeft: spacing.xs }}
          onPress={() => Alert.alert(item.title, '', [
            { text: 'Edit', onPress: () => {} },
            { text: 'Delete', style: 'destructive', onPress: onDelete },
            { text: 'Cancel', style: 'cancel' },
          ])}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="ellipsis-vertical" size={15} color={colors.textMuted} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

// Standalone resource card (grid layout for uncategorized items)
function StandaloneResourceCard({ item, isAdmin, onDelete, onOpen }: { item: any; isAdmin: boolean; onDelete: () => void; onOpen: () => void }) {
  const icon = RESOURCE_TYPE_ICONS[item.type] ?? 'document-outline';
  const typeColors: Record<string, string> = { pdf: colors.primary, video: '#3E7BFA', image: colors.success, link: '#8B5CF6' };
  return (
    <TouchableOpacity style={[s.standaloneCard, shadow.soft]} onPress={onOpen} activeOpacity={0.85}>
      <View style={[s.standaloneThumb, { backgroundColor: (typeColors[item.type] ?? colors.primary) + '18' }]}>
        <Ionicons name={icon as any} size={24} color={typeColors[item.type] ?? colors.primary} />
      </View>
      <Text style={s.standaloneTitle} numberOfLines={2}>{item.title}</Text>
      <View style={s.standaloneBadge}>
        <Text style={[s.standaloneBadgeText, { color: typeColors[item.type] ?? colors.primary }]}>
          {item.type.toUpperCase()}
        </Text>
      </View>
      {item.allowDownload && (
        <TouchableOpacity style={s.standaloneDownloadBtn} onPress={onOpen}>
          <Ionicons name="download-outline" size={14} color={colors.textMuted} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

// ─── Top 10 Tab ───────────────────────────────────────────────────────────────

function Top10Tab({ members }: { members: any[] }) {
  const sorted = [...members]
    .sort((a, b) => (b.user?.points ?? b.user?.xp ?? 0) - (a.user?.points ?? a.user?.xp ?? 0))
    .slice(0, 10);

  // Medal icons: gold crown for 1st, silver medal for 2nd, bronze crown for 3rd
  const MEDALS: Record<number, { emoji: string }> = {
    1: { emoji: '👑' },
    2: { emoji: '🥈' },
    3: { emoji: '👑' },
  };

  return (
    <View style={s.tabContent}>
      <View style={[s.top10Header, shadow.soft]}>
        <Ionicons name="trophy-outline" size={18} color={colors.primary} />
        <Text style={s.top10HeaderText}>Top 10 this month</Text>
      </View>

      {sorted.map((m, i) => {
        const rank = i + 1;
        const pts = m.user?.points ?? m.user?.xp ?? Math.max(100, 1000 - i * 87);
        const medal = MEDALS[rank];
        return (
          <TouchableOpacity 
            key={m.user?.id ?? i} 
            style={[s.leaderRow, shadow.soft]}
            onPress={() => m.user?.id && navigation.navigate('UserProfile', { userId: m.user.id, username: m.user.name ?? 'Member' })}
            disabled={!m.user?.id}
            activeOpacity={0.75}
          >
            <Text style={[s.leaderRank, rank <= 3 && { color: colors.textPrimary }]}>{rank}</Text>
            <Avatar uri={m.user?.avatar || ''} size={46} />
            <View style={{ flex: 1, marginLeft: spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                <Text style={s.leaderName}>{m.user?.name ?? `Member ${rank}`}</Text>
                {medal ? <Text style={s.medalEmoji}>{medal.emoji}</Text> : null}
                {rank > 3 && (
                  <View style={s.top10Badge}>
                    <Text style={s.top10BadgeText}>TOP 10</Text>
                  </View>
                )}
              </View>
              <Text style={s.leaderUsername}>@{(m.user?.name ?? 'member').toLowerCase().replace(/\s+/g, '')}</Text>
            </View>
            <Text style={s.leaderPts}>{pts.toLocaleString()} pts</Text>
          </TouchableOpacity>
        );
      })}
      {!sorted.length && <Text style={s.emptyText}>No members yet.</Text>}
    </View>
  );
}

// ─── Members Tab ──────────────────────────────────────────────────────────────

function MembersTab({ members, isAdmin, groupId, streaks = {} }: { members: any[]; isAdmin: boolean; groupId?: string; streaks?: Record<string, number> }) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [search, setSearch] = useState('');
  const filtered = members.filter(m =>
    !search || m.user?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleMemberAction = (m: any) => {
    if (!isAdmin || m.role === 'admin') return;
    Alert.alert(m.user?.name ?? 'Member', '', [
      { text: 'Make Admin', onPress: () => groupId && groupsService.setMemberRole(groupId, m.user.id, 'admin').catch(() => {}) },
      { text: 'Remove from community', style: 'destructive', onPress: () => groupId && groupsService.removeMember(groupId, m.user.id).catch(() => {}) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View style={s.tabContent}>
      <Text style={s.membersCount}>{members.length} member{members.length !== 1 ? 's' : ''}</Text>

      <View style={s.searchBar}>
        <Ionicons name="search-outline" size={16} color={colors.textMuted} />
        <TextInput style={s.searchInput} value={search} onChangeText={setSearch} placeholder="Search members" placeholderTextColor={colors.textMuted} />
      </View>

      {filtered.map(m => (
        <TouchableOpacity
          key={m.user?.id ?? Math.random()}
          style={[s.memberRow, shadow.soft]}
          onPress={() => m.user?.id && navigation.navigate('UserProfile', { userId: m.user.id, username: m.user.name ?? 'Member' })}
          activeOpacity={0.75}
        >
          <Avatar uri={m.user?.avatar || ''} size={44} />
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Text style={s.memberName}>{m.user?.name ?? 'Member'}</Text>
              {(streaks[m.user?.id] || 0) > 0 && (
                <View style={s.streakChip}>
                  <Ionicons name="flame" size={10} color="#F59E0B" />
                  <Text style={s.streakChipText}>{streaks[m.user.id]}</Text>
                </View>
              )}
            </View>
            <Text style={s.memberUsername}>@{(m.user?.name ?? 'member').toLowerCase().replace(/\s+/g, '')}</Text>
          </View>
          <View style={[s.memberRoleBadge, m.role === 'admin' && s.memberRoleBadgeAdmin]}>
            <Text style={[s.memberRoleText, m.role === 'admin' && s.memberRoleTextAdmin]}>
              {m.role === 'admin' ? 'Admin' : 'Member'}
            </Text>
          </View>
          {isAdmin && m.role !== 'admin' && (
            <TouchableOpacity onPress={() => handleMemberAction(m)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ marginLeft: spacing.sm }}>
              <Ionicons name="ellipsis-horizontal" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      ))}
      {!filtered.length && <Text style={s.emptyText}>{search ? 'No members found.' : 'No members yet.'}</Text>}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  headerTitle: { ...typography.h2, color: colors.textPrimary, flex: 1, textAlign: 'center' },
  cover: { width: '100%', height: 180, backgroundColor: colors.border },
  infoCard: { backgroundColor: colors.card, margin: spacing.lg, marginTop: -spacing.xl, borderRadius: radii.xl, padding: spacing.lg, gap: spacing.sm, ...shadow.card },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  groupName: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, flexShrink: 1 },
  groupDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 3, lineHeight: 17 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  metaText: { fontSize: 12, color: colors.textSecondary },
  freeBadge: { backgroundColor: '#E6F9F0', borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: 4, alignSelf: 'flex-start' },
  freeBadgeText: { fontSize: 12, fontWeight: '700', color: colors.success },
  joinBtn: { backgroundColor: colors.background, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  joinBtnText: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },

  // Tabs
  tabBarWrap: { backgroundColor: colors.card, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  tabBar: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  tabItem: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radii.pill, borderWidth: 1, borderColor: 'transparent' },
  tabItemActive: { backgroundColor: colors.primary },
  tabItemText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  tabItemTextActive: { color: colors.white },

  tabContent: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },
  emptyText: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl, fontSize: 13 },

  // Live banner
  liveBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.md },
  liveBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1 },
  liveBannerIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF0E8', alignItems: 'center', justifyContent: 'center' },
  liveBannerTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  liveBannerSub: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  goLiveBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  goLiveBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  // Composer
  composer: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.md },
  composerInput: { minHeight: 52, color: colors.textPrimary, fontSize: 13, textAlignVertical: 'top' },
  composerActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  composerIconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  postBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, backgroundColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  postBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  imagePreviewWrap: { width: 72, height: 72, borderRadius: radii.md, overflow: 'hidden' },
  imagePreview: { width: '100%', height: '100%' },
  imageRemove: { position: 'absolute', top: 3, right: 3 },

  // Post card
  postCard: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.md },
  postHeader: { flexDirection: 'row', alignItems: 'center' },
  postAuthor: { fontSize: 13, fontWeight: '800', color: colors.textPrimary },
  postSubLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  pinnedBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#FFF0E8', paddingHorizontal: 7, paddingVertical: 3, borderRadius: radii.pill },
  pinnedText: { fontSize: 10, fontWeight: '700', color: colors.primary },
  postBody: { fontSize: 13, color: colors.textPrimary, marginTop: spacing.sm, lineHeight: 19 },
  postImage: { width: '100%', height: 180, borderRadius: radii.lg, marginTop: spacing.sm },
  postFooter: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  footerBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerBtnText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  replyText: { fontSize: 13, fontWeight: '700', color: colors.primary },

  // Resources
  resourceSectionTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.sm },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.card, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  searchInput: { flex: 1, fontSize: 13, color: colors.textPrimary },
  adminActions: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  addResourceBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  addResourceBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  addFolderBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  addFolderBtnText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  filterPill: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
  filterPillActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  filterPillText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  filterPillTextActive: { color: '#fff', fontWeight: '700' },
  subSectionLabel: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.md, marginBottom: spacing.sm },
  folderCard: { backgroundColor: colors.card, borderRadius: radii.xl, overflow: 'hidden', marginBottom: spacing.sm },
  folderBanner: { height: 90, position: 'relative' },
  folderBannerImage: { width: '100%', height: '100%' },
  folderBannerPlaceholder: { width: '100%', height: '100%' },
  folderBannerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row', alignItems: 'flex-end', padding: spacing.md, backgroundColor: 'rgba(0,0,0,0.35)' },
  folderBannerTitle: { fontSize: 14, fontWeight: '800', color: '#fff' },
  folderBannerDesc: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 1 },
  folderBannerCount: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  folderChevron: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  folderMenuBtn: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  folderItems: { padding: spacing.sm, gap: spacing.xs },
  emptyFolderText: { fontSize: 12, color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.md },
  addToFolderBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  addToFolderBtnText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  resourceItemRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  resourceItemThumb: { width: 44, height: 44, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  resourceItemTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  resourceItemMeta: { fontSize: 10, color: colors.textSecondary, marginTop: 2 },
  downloadBtn: { backgroundColor: '#E6F9F0', borderRadius: radii.pill, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  downloadBtnText: { fontSize: 11, fontWeight: '700', color: colors.success },
  viewOnlyBtn: { backgroundColor: colors.background },
  viewOnlyBtnText: { color: colors.textSecondary },
  standaloneGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  standaloneCard: { width: '46%', backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.md, gap: spacing.xs },
  standaloneThumb: { width: '100%', height: 80, borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  standaloneTitle: { fontSize: 12, fontWeight: '700', color: colors.textPrimary },
  standaloneBadge: { borderRadius: radii.pill, paddingHorizontal: 6, paddingVertical: 2, backgroundColor: colors.background, alignSelf: 'flex-start' },
  standaloneBadgeText: { fontSize: 10, fontWeight: '800' },
  standaloneDownloadBtn: { alignSelf: 'flex-end' },
  resourcesEmpty: { alignItems: 'center', paddingVertical: 48, gap: spacing.sm },
  resourcesEmptyTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  resourcesEmptySub: { fontSize: 12, color: colors.textSecondary, textAlign: 'center' },
  // Modal
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  resourceTypeTabs: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  resourceTypeTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, paddingVertical: spacing.sm, backgroundColor: colors.background },
  resourceTypeTabActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  resourceTypeTabText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  resourceTypeTabTextActive: { color: '#fff' },
  uploadBox: { alignItems: 'center', borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.primary, borderRadius: radii.xl, padding: spacing.xl, gap: spacing.xs, backgroundColor: '#FFF8F5', marginVertical: spacing.sm },
  uploadBoxTitle: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, textAlign: 'center', lineHeight: 19 },
  uploadBoxSub: { fontSize: 11, color: colors.textMuted },
  downloadToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: spacing.md },
  toggleTrack: { width: 44, height: 26, borderRadius: 13, backgroundColor: colors.border, justifyContent: 'center', paddingHorizontal: 3 },
  toggleTrackOn: { backgroundColor: colors.primary },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', alignSelf: 'flex-start' },
  toggleThumbOn: { alignSelf: 'flex-end' },
  modalBtnRow: { flexDirection: 'row', gap: spacing.md },
  modalCancelBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center' },
  modalCancelBtnText: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  coverPickRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
  coverPickBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, paddingVertical: spacing.md, backgroundColor: colors.background },
  coverPickBtnText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  folderCoverPreview: { width: '100%', height: 120, borderRadius: radii.lg, marginBottom: spacing.sm },
  folderPreviewCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.background, borderRadius: radii.lg, padding: spacing.sm },
  folderPreviewImage: { width: 56, height: 40, borderRadius: radii.md },
  folderPreviewInfo: { flex: 1 },
  folderPreviewTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  folderPreviewSub: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  resourceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.md },
  resourceIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF0E8', alignItems: 'center', justifyContent: 'center' },
  resourceTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  resourceUrl: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  resourceHeaderText: { fontSize: 14, fontWeight: '800', color: colors.textPrimary, flex: 1 },
  resourceHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.md },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: colors.card, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, padding: spacing.lg, paddingBottom: 36 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.lg },
  modalTitle: { ...typography.h2, marginBottom: spacing.md },
  modalLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.md },
  modalInput: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, padding: spacing.md, fontSize: 13, color: colors.textPrimary },
  typeChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border },
  typeChipActive: { borderColor: colors.primary, backgroundColor: '#FFF0E8' },
  typeChipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  typeChipTextActive: { color: colors.primary },
  pickFileBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.primary, borderRadius: radii.md, padding: spacing.md, marginTop: spacing.sm },
  pickFileBtnText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  downloadToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
  modalSaveBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.xl },
  modalSaveBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  // Top 10
  top10Header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.md },
  top10HeaderText: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  leaderRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.md },
  leaderRank: { fontSize: 15, fontWeight: '800', color: colors.textMuted, width: 28 },
  leaderName: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  leaderUsername: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  leaderPts: { fontSize: 14, fontWeight: '800', color: colors.primary },
  medalEmoji: { fontSize: 16 },
  top10Badge: { backgroundColor: '#FFF0E8', borderRadius: radii.pill, paddingHorizontal: 6, paddingVertical: 2 },
  top10BadgeText: { fontSize: 9, fontWeight: '800', color: colors.primary },

  // Members
  membersCount: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginBottom: spacing.sm },
  memberRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.md },
  memberName: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  memberUsername: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  memberRoleBadge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radii.pill, backgroundColor: colors.background },
  memberRoleBadgeAdmin: { backgroundColor: '#FFF0E8' },
  memberRoleText: { fontSize: 11, fontWeight: '600', color: colors.textMuted },
  memberRoleTextAdmin: { color: colors.primary, fontWeight: '700' },

  // Streaks (16C)
  streakChip: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#FEF3C7', borderRadius: radii.pill, paddingHorizontal: 5, paddingVertical: 1 },
  streakChipText: { fontSize: 9.5, fontWeight: '800', color: '#B45309' },

  // Onboarding video modal (16C)
  onboardOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  onboardCard: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg, width: '100%' },
  onboardClose: { alignSelf: 'flex-end' },
  onboardTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginTop: spacing.sm },
  onboardDesc: { fontSize: 12.5, color: colors.textSecondary, marginTop: spacing.xs, lineHeight: 18 },
  onboardVideoBox: { height: 160, borderRadius: radii.lg, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', gap: spacing.xs, marginTop: spacing.md, paddingHorizontal: spacing.md },
  onboardVideoHint: { fontSize: 10.5, color: colors.textMuted },
  onboardDoneBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.lg },
  onboardDoneText: { fontSize: 14, fontWeight: '800', color: '#fff' },
});
