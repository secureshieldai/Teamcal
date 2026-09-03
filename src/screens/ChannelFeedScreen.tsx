import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { channelsService } from '../services/api/channels.service';
import type { Channel, ChannelPost } from '../types/channels';
import { REACTION_EMOJIS } from '../types/channels';
import { colors, radii, shadow, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import Avatar from '../components/Avatar';

type Props = NativeStackScreenProps<RootStackParamList, 'ChannelFeed'>;

export default function ChannelFeedScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Props['route']>();
  const { channelId } = route.params || {};

  const [channel, setChannel] = useState<Channel | null>(null);
  const [posts, setPosts] = useState<ChannelPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Safety check: if no channelId, show error immediately
  useEffect(() => {
    if (!channelId) {
      setError('No channel ID provided');
      setLoading(false);
      return;
    }
    loadData();
  }, [channelId]);

  const loadData = async () => {
    setError(null);
    await Promise.all([loadChannel(), loadPosts()]);
  };

  const loadChannel = async () => {
    try {
      if (!channelId) {
        throw new Error('Channel ID is missing');
      }
      const data = await channelsService.getById(channelId);
      setChannel(data);
      setError(null);
    } catch (error) {
      console.error('[ChannelFeed] Error loading channel:', error);
      const message = (error as Error).message || 'Failed to load channel';
      setError(message);
      if (message.includes('401') || message.includes('unauthorized')) {
        Alert.alert('Access Denied', 'You do not have permission to view this channel.');
      } else if (message.includes('404') || message.includes('not found')) {
        Alert.alert('Channel Not Found', 'This channel may have been deleted or does not exist.');
      } else {
        Alert.alert('Error', message);
      }
    }
  };

  const loadPosts = async () => {
    try {
      if (!channelId) {
        throw new Error('Channel ID is missing');
      }
      const data = await channelsService.getPosts(channelId);
      setPosts(data);
    } catch (error) {
      console.error('[ChannelFeed] Error loading posts:', error);
      // Don't show alert for posts error if channel also failed
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleFollow = async () => {
    if (!channel) return;
    try {
      if (channel.isFollowing) {
        await channelsService.unfollow(channelId);
        setChannel({ ...channel, isFollowing: false, follower_count: channel.follower_count - 1 });
      } else {
        await channelsService.follow(channelId);
        setChannel({ ...channel, isFollowing: true, follower_count: channel.follower_count + 1 });
      }
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const handleReaction = async (postId: string, emoji: string) => {
    try {
      await channelsService.addReaction(postId, emoji);
      loadPosts(); // Refresh to show updated counts
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  const renderPost = ({ item }: { item: ChannelPost }) => (
    <TouchableOpacity
      style={[styles.postCard, shadow.soft]}
      onPress={() => navigation.navigate('ChannelPostDetail', { postId: item.id })}
      activeOpacity={0.95}
    >
      {item.is_pinned && (
        <View style={styles.pinnedBadge}>
          <Ionicons name="pin" size={12} color={colors.primary} />
          <Text style={styles.pinnedText}>Pinned</Text>
        </View>
      )}

      <View style={styles.postHeader}>
        <Avatar uri={item.author?.avatar || ''} size={40} />
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={styles.authorName}>{item.author?.name || 'Unknown'}</Text>
          <Text style={styles.postTime}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
        {item.is_announcement && (
          <View style={styles.announcementBadge}>
            <Text style={styles.announcementText}>Announcement</Text>
          </View>
        )}
      </View>

      {item.text_content && <Text style={styles.postText}>{item.text_content}</Text>}

      {item.media_url && item.content_type === 'image' && (
        item.media_url.startsWith('http') ? (
          <Image 
            source={{ uri: item.media_url }} 
            style={styles.postImage} 
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.postImage, { backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }]}>
            <Ionicons name="image-outline" size={48} color={colors.border} />
            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: spacing.sm }}>Image unavailable</Text>
          </View>
        )
      )}

      {item.link_url && (
        <View style={styles.linkPreview}>
          {item.link_image && <Image source={{ uri: item.link_image }} style={styles.linkImage} />}
          <Text style={styles.linkTitle} numberOfLines={2}>{item.link_title || item.link_url}</Text>
        </View>
      )}

      <View style={styles.postFooter}>
        <View style={styles.reactionRow}>
          {REACTION_EMOJIS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={styles.reactionBtn}
              onPress={() => handleReaction(item.id, emoji)}
            >
              <Text style={styles.reactionEmoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
          <Text style={styles.reactionCount}>{item.reaction_count}</Text>
        </View>
        <View style={styles.stats}>
          <Ionicons name="chatbubble-outline" size={16} color={colors.textMuted} />
          <Text style={styles.statText}>{item.comment_count}</Text>
          <Ionicons name="share-social-outline" size={16} color={colors.textMuted} style={{ marginLeft: spacing.md }} />
          <Text style={styles.statText}>{item.share_count}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !channel) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.channelName, { marginLeft: spacing.md }]}>Channel</Text>
        </View>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.border} />
          <Text style={styles.errorTitle}>Unable to load channel</Text>
          <Text style={styles.errorText}>{error || 'Channel not found'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: spacing.md }}>
          <Text style={styles.channelName} numberOfLines={1}>{channel.name}</Text>
          <Text style={styles.channelMeta}>{channel.follower_count} followers</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('ChannelSettings', { channelId: channel.id })}>
          <Ionicons name="ellipsis-vertical" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View>
            {channel.cover_image && <Image source={{ uri: channel.cover_image }} style={styles.coverImage} />}
            <View style={styles.profileRow}>
              <Avatar uri={channel.avatar || ''} size={64} />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.profileName}>{channel.name}</Text>
                  {channel.is_monetized && (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                    </View>
                  )}
                </View>
                <Text style={styles.profileUsername}>@{channel.username}</Text>
                <Text style={styles.profileStats}>{channel.follower_count.toLocaleString()} followers · {channel.post_count} posts</Text>
              </View>
            </View>
            {channel.description && <Text style={styles.description}>{channel.description}</Text>}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.followBtn, channel.isFollowing && styles.followingBtn]}
                onPress={handleFollow}
              >
                <Text style={[styles.followBtnText, channel.isFollowing && styles.followingBtnText]}>
                  {channel.isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
              {(channel.memberRole === 'owner' || channel.memberRole === 'admin') ? (
                <TouchableOpacity
                  style={styles.postBtn}
                  onPress={() => navigation.navigate('CreateChannelPost', { channelId: channel.id })}
                >
                  <Ionicons name="add" size={18} color={colors.white} />
                  <Text style={styles.postBtnText}>New Post</Text>
                </TouchableOpacity>
              ) : channel.isFollowing && !channel.allow_comments ? (
                <View style={styles.infoBox}>
                  <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
                  <Text style={styles.infoText}>Only admins can post to this channel</Text>
                </View>
              ) : null}
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={48} color={colors.border} />
            <Text style={styles.emptyText}>No posts yet</Text>
          </View>
        }
        renderItem={renderPost}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.card },
  channelName: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  channelMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  list: { paddingBottom: spacing.xxl },
  coverImage: { width: '100%', height: 160, backgroundColor: colors.card },
  profileRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, marginTop: -32, marginBottom: spacing.md },
  verifiedBadge: { width: 20, height: 20, borderRadius: 10, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  profileName: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  profileUsername: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  profileStats: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  description: { fontSize: 14, color: colors.textPrimary, lineHeight: 20, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  actionRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  followBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.sm, alignItems: 'center' },
  followingBtn: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  followBtnText: { fontSize: 14, fontWeight: '700', color: colors.white },
  followingBtnText: { color: colors.textPrimary },
  infoBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.card, borderRadius: radii.lg, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  infoText: { fontSize: 12, color: colors.textMuted },
  postBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.navy, borderRadius: radii.pill, paddingVertical: spacing.sm },
  postBtnText: { fontSize: 14, fontWeight: '700', color: colors.white },
  postCard: { backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg, marginHorizontal: spacing.lg, marginBottom: spacing.md },
  pinnedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: spacing.sm },
  pinnedText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  authorName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  postTime: { fontSize: 11.5, color: colors.textMuted, marginTop: 2 },
  announcementBadge: { backgroundColor: '#FFE7CF', borderRadius: radii.sm, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  announcementText: { fontSize: 10, fontWeight: '700', color: colors.primary },
  postText: { fontSize: 14.5, color: colors.textPrimary, lineHeight: 21, marginBottom: spacing.md },
  postImage: { width: '100%', height: 200, borderRadius: radii.lg, marginBottom: spacing.md },
  linkPreview: { borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, overflow: 'hidden', marginBottom: spacing.md },
  linkImage: { width: '100%', height: 120 },
  linkTitle: { fontSize: 13, fontWeight: '600', color: colors.textPrimary, padding: spacing.md },
  postFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  reactionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  reactionBtn: { padding: 4 },
  reactionEmoji: { fontSize: 16 },
  reactionCount: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginLeft: spacing.xs },
  stats: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, color: colors.textMuted },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  errorTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.lg },
  errorText: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
  retryBtn: { marginTop: spacing.lg, backgroundColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  retryBtnText: { fontSize: 14, fontWeight: '700', color: colors.white },
  empty: { alignItems: 'center', padding: spacing.xxl },
  emptyText: { fontSize: 13, color: colors.textMuted, marginTop: spacing.md },
});
