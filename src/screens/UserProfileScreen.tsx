import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { colors, radii, shadow, spacing, typography } from '../theme';
import { showcaseService, type ShowcaseSection as ShowcaseSectionData, type ShowcaseItem } from '../services/api/showcase.service';
import { socialService, type PublicProfile } from '../services/api/social.service';
import { postsService } from '../services/api/posts.service';
import type { Post as ApiPost } from '../types/api';
import PostCard, { type Post as PostCardPost } from '../components/PostCard';
import { useAuth } from '../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'UserProfile'>;

type Tab = 'Posts' | 'Showcase';

function toCardPost(p: ApiPost): PostCardPost {
  return {
    id: p.id,
    authorId: p.user_id,
    authorName: p.user?.name || 'Member',
    authorAvatar: p.user?.avatar || '',
    time: new Date(p.created_at).toLocaleDateString(),
    caption: p.text,
    photos: p.image_urls?.length ? p.image_urls : p.image ? [p.image] : [],
    likes: p.likes,
    comments: p.comments_count || 0,
    liked: p.liked,
  };
}

export default function UserProfileScreen({ route, navigation }: Props) {
  const { userId, username } = route.params;
  const { user: me } = useAuth();
  const isOwnProfile = me?.id === userId;

  const [activeTab, setActiveTab] = useState<Tab>('Posts');
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [showcase, setShowcase] = useState<ShowcaseSectionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [followBusy, setFollowBusy] = useState(false);
  const [connectBusy, setConnectBusy] = useState(false);
  const [noteModal, setNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      Promise.all([
        socialService.getProfile(userId),
        postsService.getUserPosts(userId),
        showcaseService.getUserShowcase(userId).catch(() => []),
      ])
        .then(([p, userPosts, sections]) => {
          if (!active) return;
          setProfile(p);
          setPosts(userPosts);
          setShowcase(sections);
        })
        .catch(() => { if (active) setProfile(null); })
        .finally(() => { if (active) setLoading(false); });
      return () => { active = false; };
    }, [userId])
  );

  const toggleFollow = async () => {
    if (!profile || followBusy) return;
    setFollowBusy(true);
    const optimistic = { ...profile, isFollowing: !profile.isFollowing, followersCount: profile.followersCount + (profile.isFollowing ? -1 : 1) };
    setProfile(optimistic);
    try {
      const following = await socialService.toggleFollow(userId);
      setProfile(prev => prev ? { ...prev, isFollowing: following } : prev);
    } catch (e) {
      setProfile(profile);
    } finally {
      setFollowBusy(false);
    }
  };

  const patchConn = (status: PublicProfile['connectionStatus'], id?: string | null) =>
    setProfile(prev => (prev ? { ...prev, connectionStatus: status, connectionId: id === undefined ? prev.connectionId : id } : prev));

  const submitConnectRequest = async () => {
    if (!profile || connectBusy) return;
    setConnectBusy(true);
    setNoteModal(false);
    const note = noteText.trim();
    // Sending a request also follows them.
    patchConn('pending_outgoing');
    setProfile(prev => (prev ? { ...prev, isFollowing: true } : prev));
    try {
      const res = await socialService.sendConnectRequest(userId, note);
      patchConn(res.connectionStatus, res.connectionId);
      setNoteText('');
    } catch (e) {
      patchConn('none');
      Alert.alert('Unable to send request', (e as Error).message);
    } finally {
      setConnectBusy(false);
    }
  };

  const acceptConnect = async () => {
    if (connectBusy) return;
    setConnectBusy(true);
    patchConn('connected');
    try {
      const res = await socialService.acceptConnection(userId);
      patchConn(res.connectionStatus, res.connectionId);
    } catch (e) {
      patchConn('pending_incoming');
      Alert.alert('Unable to accept', (e as Error).message);
    } finally {
      setConnectBusy(false);
    }
  };

  const removeConnect = (verb: 'Cancel request' | 'Remove connection') =>
    Alert.alert(`${verb}?`, verb === 'Cancel request'
      ? 'Your connection request will be withdrawn. You will still be following them.'
      : 'You will no longer be connected. You will still be following them.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: verb === 'Cancel request' ? 'Withdraw' : 'Remove',
        style: 'destructive',
        onPress: async () => {
          setConnectBusy(true);
          patchConn('none', null);
          try {
            await socialService.removeConnection(userId);
          } catch (e) {
            Alert.alert('Something went wrong', (e as Error).message);
          } finally {
            setConnectBusy(false);
          }
        },
      },
    ]);

  const onConnectPress = () => {
    if (!profile) return;
    if (profile.connectionStatus === 'none') { setNoteText(''); setNoteModal(true); }
    else if (profile.connectionStatus === 'pending_incoming') acceptConnect();
    else if (profile.connectionStatus === 'pending_outgoing') removeConnect('Cancel request');
    else if (profile.connectionStatus === 'connected') removeConnect('Remove connection');
  };

  const connectLabel = profile
    ? { none: 'Connect', pending_outgoing: 'Requested', pending_incoming: 'Accept', connected: 'Connected' }[profile.connectionStatus]
    : 'Connect';

  const handle = `@${(profile?.name || username || 'member').replace(/\s+/g, '').toLowerCase()}`;
  const hasShowcase = showcase.some(s => s.items.some(i => i.published));

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{profile?.name || username}</Text>
        {isOwnProfile ? (
          <TouchableOpacity onPress={() => navigation.navigate('ShowcaseEditor')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="create-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
        ) : <View style={{ width: 22 }} />}
      </View>

      {loading && !profile ? (
        <View style={styles.centerContent}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : !profile ? (
        <View style={styles.centerContent}>
          <Ionicons name="person-remove-outline" size={44} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Profile not found</Text>
        </View>
      ) : (
        <>
          {/* Profile header card */}
          <View style={[styles.profileCard, shadow.soft]}>
            {profile.avatar ? (
              <Image source={{ uri: profile.avatar }} style={styles.avatarImg} />
            ) : (
              <Ionicons name="person-circle-outline" size={64} color={colors.primary} style={{ marginBottom: spacing.sm }} />
            )}
            <View style={styles.nameRow}>
              <Text style={styles.profileName}>{profile.name}</Text>
              {profile.verified && <Ionicons name="checkmark-circle" size={16} color={colors.primary} />}
            </View>
            <Text style={styles.profileHandle}>{handle}</Text>
            {!!profile.bio && <Text style={styles.profileBio}>{profile.bio}</Text>}

            <View style={styles.statsRow}>
              <View style={styles.statItem}><Text style={styles.statValue}>{profile.postCount}</Text><Text style={styles.statLabel}>Posts</Text></View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}><Text style={styles.statValue}>{profile.followingCount}</Text><Text style={styles.statLabel}>Following</Text></View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}><Text style={styles.statValue}>{profile.followersCount}</Text><Text style={styles.statLabel}>Followers</Text></View>
            </View>

            {isOwnProfile ? (
              <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('EditProfile')} activeOpacity={0.8}>
                <Text style={styles.editBtnText}>Edit Profile</Text>
              </TouchableOpacity>
            ) : (
              <>
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.followBtn, profile.isFollowing && styles.followingBtn]}
                    onPress={toggleFollow}
                    disabled={followBusy}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.followBtnText, profile.isFollowing && styles.followingBtnText]}>
                      {profile.isFollowing ? 'Following' : 'Follow'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.connectBtn,
                      (profile.connectionStatus === 'connected' || profile.connectionStatus === 'pending_outgoing') && styles.connectBtnMuted,
                    ]}
                    onPress={onConnectPress}
                    disabled={connectBusy}
                    activeOpacity={0.8}
                  >
                    {profile.connectionStatus === 'connected' && (
                      <Ionicons name="checkmark" size={14} color={colors.textPrimary} style={{ marginRight: 4 }} />
                    )}
                    <Text
                      style={[
                        styles.connectBtnText,
                        (profile.connectionStatus === 'connected' || profile.connectionStatus === 'pending_outgoing') && styles.connectBtnTextMuted,
                      ]}
                    >
                      {connectLabel}
                    </Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.messageBtnFull}
                  onPress={() => navigation.navigate('DirectMessage', { userId, name: profile.name, avatar: profile.avatar })}
                  activeOpacity={0.8}
                >
                  <Ionicons name="chatbubble-outline" size={15} color={colors.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.messageBtnText}>Send Message</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            {(['Posts', 'Showcase'] as Tab[]).map(tab => (
              <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === 'Posts' && (
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
              {posts.length === 0 ? (
                <View style={styles.centerContent}>
                  <Ionicons name="document-text-outline" size={44} color={colors.textMuted} />
                  <Text style={styles.emptyTitle}>No posts yet</Text>
                  <Text style={styles.emptyText}>{isOwnProfile ? "You haven't posted anything yet." : `${profile.name} hasn't posted anything yet.`}</Text>
                </View>
              ) : (
                <View style={{ gap: spacing.md }}>
                  {posts.map(p => <PostCard key={p.id} post={toCardPost(p)} />)}
                </View>
              )}
            </ScrollView>
          )}

          {activeTab === 'Showcase' && (
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
              {!hasShowcase ? (
                <View style={styles.centerContent}>
                  <Ionicons name="star-outline" size={48} color={colors.textMuted} />
                  <Text style={styles.emptyTitle}>Nothing featured yet</Text>
                  <Text style={styles.emptyText}>
                    {isOwnProfile ? "You haven't featured anything yet." : "This user hasn't featured anything yet."}
                  </Text>
                  {isOwnProfile && (
                    <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('ShowcaseEditor')}>
                      <Ionicons name="add" size={16} color={colors.white} />
                      <Text style={styles.primaryBtnText}>Add to Showcase</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                showcase.map((section, idx) => <ShowcaseSection key={section.id} section={section} isLast={idx === showcase.length - 1} />)
              )}
            </ScrollView>
          )}
        </>
      )}

      <Modal visible={noteModal} transparent animationType="fade" onRequestClose={() => setNoteModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Connect with {profile?.name || 'this person'}</Text>
            <Text style={styles.modalSub}>Sending a request also follows them. Add a note (optional).</Text>
            <TextInput
              style={styles.modalInput}
              value={noteText}
              onChangeText={setNoteText}
              placeholder="Hi — I'd like to connect…"
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={500}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setNoteModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSend} onPress={submitConnectRequest} disabled={connectBusy}>
                <Text style={styles.modalSendText}>Send request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ShowcaseSection({ section, isLast }: { section: ShowcaseSectionData; isLast: boolean }) {
  const visibleItems = section.items.filter((i: ShowcaseItem) => i.published);
  if (visibleItems.length === 0) return null;

  return (
    <View style={[styles.sectionContainer, !isLast && styles.sectionBorder]}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      {section.description && <Text style={styles.sectionDesc}>{section.description}</Text>}

      {section.layout === 'grid' && (
        <View style={styles.grid}>
          {visibleItems.map((item) => (
            <TouchableOpacity key={item.id} style={styles.gridItem} activeOpacity={0.8}>
              {item.coverImage ? (
                <Image source={{ uri: item.coverImage }} style={styles.itemImage} />
              ) : (
                <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                  <Ionicons name="image-outline" size={32} color={colors.textMuted} />
                </View>
              )}
              <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
              {item.price != null && <Text style={styles.itemPrice}>${item.price}</Text>}
              {item.accessLabel && <Text style={styles.itemLabel}>{item.accessLabel}</Text>}
              <TouchableOpacity style={styles.itemAction} activeOpacity={0.75}>
                <Text style={styles.itemActionText}>{item.actionLabel}</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {section.layout === 'carousel' && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
          {visibleItems.map((item) => (
            <TouchableOpacity key={item.id} style={styles.carouselItem} activeOpacity={0.8}>
              {item.coverImage ? (
                <Image source={{ uri: item.coverImage }} style={styles.carouselImage} />
              ) : (
                <View style={[styles.carouselImage, styles.itemImagePlaceholder]}>
                  <Ionicons name="image-outline" size={32} color={colors.textMuted} />
                </View>
              )}
              <View style={styles.carouselContent}>
                <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
                {item.price != null && <Text style={styles.itemPrice}>${item.price}</Text>}
                <TouchableOpacity style={styles.itemAction} activeOpacity={0.75}>
                  <Text style={styles.itemActionText}>{item.actionLabel}</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {section.layout === 'list' && (
        <View style={styles.list}>
          {visibleItems.map((item, idx) => (
            <TouchableOpacity key={item.id} style={[styles.listItem, idx !== visibleItems.length - 1 && styles.listItemBorder]} activeOpacity={0.8}>
              {item.coverImage ? (
                <Image source={{ uri: item.coverImage }} style={styles.listImage} />
              ) : (
                <View style={[styles.listImage, styles.itemImagePlaceholder]}>
                  <Ionicons name="image-outline" size={20} color={colors.textMuted} />
                </View>
              )}
              <View style={styles.listContent}>
                <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
                {item.description && <Text style={styles.itemDesc} numberOfLines={1}>{item.description}</Text>}
                <View style={styles.listFooter}>
                  {item.price != null && <Text style={styles.itemPrice}>${item.price}</Text>}
                  {item.accessLabel && <Text style={styles.itemLabel}>{item.accessLabel}</Text>}
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  headerTitle: { ...typography.h2, color: colors.textPrimary, flex: 1, textAlign: 'center' },
  centerContent: { alignItems: 'center', justifyContent: 'center', minHeight: 240, gap: spacing.md, paddingHorizontal: spacing.xl },
  profileCard: { alignItems: 'center', backgroundColor: colors.card, marginHorizontal: spacing.lg, marginTop: spacing.md, borderRadius: radii.xl, padding: spacing.lg },
  avatarImg: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.border, marginBottom: spacing.sm },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  profileName: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  profileHandle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  profileBio: { fontSize: 12.5, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center', lineHeight: 18 },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, gap: spacing.lg },
  statItem: { alignItems: 'center', minWidth: 56 },
  statValue: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  statLabel: { fontSize: 10.5, color: colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, height: 24, backgroundColor: colors.border },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, width: '100%' },
  followBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.sm, alignItems: 'center' },
  followingBtn: { backgroundColor: colors.border },
  followBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  followingBtnText: { color: colors.textPrimary },
  messageBtn: { flex: 1, borderWidth: 1.5, borderColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.sm, alignItems: 'center' },
  messageBtnFull: { flexDirection: 'row', width: '100%', marginTop: spacing.sm, borderWidth: 1.5, borderColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.sm, alignItems: 'center', justifyContent: 'center' },
  messageBtnText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  connectBtn: { flex: 1, flexDirection: 'row', backgroundColor: colors.navy, borderRadius: radii.pill, paddingVertical: spacing.sm, alignItems: 'center', justifyContent: 'center' },
  connectBtnMuted: { backgroundColor: colors.border },
  connectBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  connectBtnTextMuted: { color: colors.textPrimary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  modalCard: { width: '100%', backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg, gap: spacing.sm },
  modalTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  modalSub: { fontSize: 12.5, color: colors.textSecondary, lineHeight: 18 },
  modalInput: { minHeight: 80, backgroundColor: colors.background, borderRadius: radii.md, padding: spacing.md, color: colors.textPrimary, textAlignVertical: 'top', marginTop: spacing.xs },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  modalCancel: { flex: 1, borderRadius: radii.pill, paddingVertical: spacing.sm, alignItems: 'center', backgroundColor: colors.border },
  modalCancelText: { color: colors.textPrimary, fontWeight: '700', fontSize: 13 },
  modalSend: { flex: 1, borderRadius: radii.pill, paddingVertical: spacing.sm, alignItems: 'center', backgroundColor: colors.primary },
  modalSendText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  editBtn: { backgroundColor: colors.border, borderRadius: radii.pill, paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, marginTop: spacing.md, minWidth: 140, alignItems: 'center' },
  editBtnText: { color: colors.textPrimary, fontWeight: '700', fontSize: 13 },
  tabsContainer: { flexDirection: 'row', marginTop: spacing.lg, paddingHorizontal: spacing.lg, gap: spacing.sm },
  tab: { flex: 1, paddingVertical: spacing.sm, borderRadius: radii.pill, backgroundColor: colors.card, alignItems: 'center' },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: 12.5, fontWeight: '700', color: colors.textSecondary },
  tabTextActive: { color: colors.white },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  emptyText: { fontSize: 12, color: colors.textSecondary, textAlign: 'center' },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  primaryBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  sectionContainer: { marginBottom: spacing.xl },
  sectionBorder: { paddingBottom: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.border },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.sm },
  sectionDesc: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing.md, lineHeight: 17 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  gridItem: { width: '48%', backgroundColor: colors.card, borderRadius: radii.lg, overflow: 'hidden' },
  carousel: { gap: spacing.md },
  carouselItem: { width: 180, backgroundColor: colors.card, borderRadius: radii.lg, overflow: 'hidden' },
  carouselImage: { width: 180, height: 100, backgroundColor: colors.border },
  carouselContent: { padding: spacing.md, gap: spacing.xs },
  list: { backgroundColor: colors.card, borderRadius: radii.xl, overflow: 'hidden' },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  listItemBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  listImage: { width: 56, height: 56, borderRadius: radii.md, backgroundColor: colors.border },
  listContent: { flex: 1, gap: 4 },
  itemImage: { width: '100%', height: 140, backgroundColor: colors.border },
  itemImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  itemTitle: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xs },
  itemDesc: { fontSize: 11, color: colors.textSecondary },
  itemPrice: { fontSize: 13, fontWeight: '800', color: colors.primary },
  itemLabel: { fontSize: 10, fontWeight: '700', color: colors.success, backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: radii.sm, paddingHorizontal: 6, paddingVertical: 2, alignSelf: 'flex-start' },
  itemAction: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: 8, paddingHorizontal: spacing.md, alignItems: 'center', marginTop: spacing.xs },
  itemActionText: { color: colors.white, fontWeight: '700', fontSize: 11 },
  listFooter: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
});
