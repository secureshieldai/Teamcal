import React, { useEffect, useState } from 'react';
import { Alert, Image, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Avatar from './Avatar';
import { colors, radii, shadow, spacing } from '../theme';
import { postsService } from '../services/api/posts.service';

export type Post = {
  id: string;
  authorName: string;
  authorAvatar: string;
  time: string;
  caption: string;
  photos: string[];
  badge?: string;
  likes: number;
  comments: number;
};

export default function PostCard({ post, onComment }: { post: Post; onComment?: (id: string) => void }) {
  const [likes, setLikes] = useState(post.likes);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const saveKey = `saved_post_${post.id}`;
  useEffect(() => { AsyncStorage.getItem(saveKey).then(v => setSaved(v === '1')); }, [saveKey]);
  const toggleLike = async () => { const previous = { likes, liked }; setLiked(!liked); setLikes(Math.max(0, likes + (liked ? -1 : 1))); try { const result = await postsService.toggleLike(post.id); setLikes(result.likes); setLiked(result.liked); } catch (e) { setLikes(previous.likes); setLiked(previous.liked); Alert.alert('Unable to like post', (e as Error).message); } };
  const toggleSaved = async () => { const next = !saved; setSaved(next); if (next) await AsyncStorage.setItem(saveKey, '1'); else await AsyncStorage.removeItem(saveKey); };
  return (
    <View style={[styles.card, shadow.card]}>
      <View style={styles.header}>
        <Avatar uri={post.authorAvatar} size={38} />
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{post.authorName}</Text>
          <Text style={styles.time}>{post.time}</Text>
        </View>
        <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="ellipsis-horizontal" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <Text style={styles.caption}>{post.caption}</Text>

      <View style={styles.photoRow}>
        {post.photos.map((uri, i) => (
          <Image
            key={uri + i}
            source={{ uri }}
            style={[styles.photo, post.photos.length > 1 && styles.photoHalf]}
          />
        ))}
        {post.badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{post.badge}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.actionItem} onPress={toggleLike}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={19} color={liked ? colors.macroProtein : colors.textSecondary} />
          <Text style={styles.actionText}>{likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem} onPress={() => onComment?.(post.id)}>
          <Ionicons name="chatbubble-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.actionText}>{post.comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Share.share({ message: `${post.authorName}: ${post.caption}` })}><Ionicons name="share-social-outline" size={19} color={colors.textSecondary} /></TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={toggleSaved}><Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={19} color={saved ? colors.primary : colors.textSecondary} /></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  name: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  time: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  caption: {
    fontSize: 13,
    color: colors.textPrimary,
    marginTop: spacing.sm,
    lineHeight: 18,
  },
  photoRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: spacing.sm,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  photo: {
    flex: 1,
    height: 150,
    backgroundColor: colors.border,
  },
  photoHalf: {
    height: 110,
  },
  badge: {
    position: 'absolute',
    left: spacing.sm,
    bottom: spacing.sm,
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  badgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
});
