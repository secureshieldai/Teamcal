import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from './Avatar';
import { colors, radii, spacing } from '../theme';
import { postsService } from '../services/api/posts.service';
import { personalService } from '../services/api/personal.service';
import { socialService } from '../services/api/social.service';
import { useAuth } from '../context/AuthContext';

export type Post = {
  id: string;
  authorId?: string;
  authorName: string;
  authorAvatar: string;
  time: string;
  caption: string;
  photos: string[];
  badge?: string;
  likes: number;
  comments: number;
  liked?: boolean;
};

export default function PostCard({ post, onComment, onDelete, onPressAuthor }: { post: Post; onComment?: (id: string) => void; onDelete?: (id:string)=>void; onPressAuthor?: () => void }) {
  const [likes, setLikes] = useState(post.likes);
  const [liked, setLiked] = useState(Boolean(post.liked));
  const [saved, setSaved] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const [imageLoading, setImageLoading] = useState<Record<number, boolean>>({});
  const {user}=useAuth();
  
  useEffect(() => {
    // Initialize loading state for all images
    const initialLoading: Record<number, boolean> = {};
    post.photos.forEach((_, index) => {
      initialLoading[index] = true;
    });
    setImageLoading(initialLoading);
  }, [post.photos]);
  useEffect(() => { personalService.list('saved-post').then(rows => setSaved(rows.some(r => r.external_key === post.id))).catch(() => {}); }, [post.id]);
  const toggleLike = async () => { const previous = { likes, liked }; setLiked(!liked); setLikes(Math.max(0, likes + (liked ? -1 : 1))); try { const result = await postsService.toggleLike(post.id); setLikes(result.likes); setLiked(result.liked); } catch (e) { setLikes(previous.likes); setLiked(previous.liked); Alert.alert('Unable to like post', (e as Error).message); } };
  const toggleSaved = async () => { const previous=saved;setSaved(!saved);try{setSaved(await personalService.toggle('saved-post',post.id,{caption:post.caption,authorName:post.authorName,photos:post.photos}));}catch(error){setSaved(previous);Alert.alert('Unable to save post',(error as Error).message);} };
  const openMenu=()=>{if(onDelete)return Alert.alert('Post options',undefined,[{text:'Delete Post',style:'destructive',onPress:()=>Alert.alert('Delete post','This cannot be undone.',[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:()=>onDelete(post.id)}])},{text:'Cancel',style:'cancel'}]);const actions:any[]=[{text:'Report Post',onPress:async()=>{try{await socialService.report('post',post.id,'Community guidelines violation');Alert.alert('Report received','Thank you. TeamCal will review this post.');}catch(error){Alert.alert('Unable to report',(error as Error).message);}}}];if(post.authorId&&post.authorId!==user?.id)actions.push({text:'Block User',style:'destructive',onPress:()=>Alert.alert(`Block ${post.authorName}?`,'You will no longer see this user’s posts.',[{text:'Cancel',style:'cancel'},{text:'Block',style:'destructive',onPress:async()=>{try{await socialService.blockUser(post.authorId!);Alert.alert('User blocked');}catch(error){Alert.alert('Unable to block',(error as Error).message);}}}])});actions.push({text:'Cancel',style:'cancel'});Alert.alert('Post options',undefined,actions);};
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerTouchable} onPress={onPressAuthor} disabled={!onPressAuthor} activeOpacity={onPressAuthor ? 0.7 : 1}>
          <Avatar uri={post.authorAvatar} size={38} />
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{post.authorName}</Text>
            <Text style={styles.time}>{post.time}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} onPress={openMenu}>
          <Ionicons name="ellipsis-horizontal" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <Text style={styles.caption}>{post.caption}</Text>

      <View style={styles.photoRow}>
        {post.photos.map((uri, i) => {
          // Debug logging for troubleshooting
          if (__DEV__ && !uri) {
            console.warn('PostCard: Empty image URI at index', i, 'in post', post.id);
          }
          
          const single = post.photos.length === 1;
          const wrapStyle = single ? styles.photoWrapSingle : styles.photoWrapGrid;
          const sizeStyle = single ? styles.photoSingle : styles.photoGrid;
          const aspectStyle = single ? styles.aspectSingle : styles.aspectGrid;

          if (!uri || imageErrors[i]) {
            return (
              <View
                key={`error-${post.id}-${i}`}
                style={[styles.photo, styles.photoError, wrapStyle, aspectStyle]}
              >
                <Ionicons name="image-outline" size={32} color={colors.textMuted} />
                <Text style={styles.errorText}>Unable to load</Text>
              </View>
            );
          }

          return (
            <View key={`${uri}-${i}`} style={[styles.photo, wrapStyle]}>
              <Image
                source={{ uri }}
                style={sizeStyle}
                resizeMode="cover"
                onError={(error) => {
                  const errorMsg = error.nativeEvent?.error || 'Unknown error';
                  console.error('═══ IMAGE LOAD ERROR ═══');
                  console.error('Post ID:', post.id);
                  console.error('Image Index:', i);
                  console.error('Image URL:', uri);
                  console.error('Error:', errorMsg);
                  console.error('═══════════════════════');
                  setImageErrors(prev => ({ ...prev, [i]: true }));
                  setImageLoading(prev => ({ ...prev, [i]: false }));
                }}
                onLoadStart={() => {
                  setImageLoading(prev => ({ ...prev, [i]: true }));
                }}
                onLoadEnd={() => {
                  setImageLoading(prev => ({ ...prev, [i]: false }));
                  console.log('✓ Image loaded successfully');
                  console.log('  Post:', post.id, '| Index:', i);
                  console.log('  URL:', uri.substring(0, 80) + (uri.length > 80 ? '...' : ''));
                }}
              />
              {imageLoading[i] && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              )}
            </View>
          );
        })}
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
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTouchable: {
    flex: 1,
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
    flexWrap: 'wrap',
    gap: 4,
    marginTop: spacing.sm,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  photo: {
    backgroundColor: '#000',
    overflow: 'hidden',
  },
  photoError: {
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
  },
  // Wrappers only set width. The <Image> child carries width + aspectRatio so it
  // resolves its own height (Yoga will not back-compute height from aspectRatio
  // on a plain View that has a percentage width inside a wrapping row — it
  // collapses to 0, which was rendering the feed blank on native).
  photoWrapSingle: {
    width: '100%',
  },
  photoWrapGrid: {
    width: '49%',
  },
  photoSingle: {
    width: '100%',
    aspectRatio: 16 / 10,
  },
  photoGrid: {
    width: '100%',
    aspectRatio: 1,
  },
  aspectSingle: {
    aspectRatio: 16 / 10,
  },
  aspectGrid: {
    aspectRatio: 1,
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
