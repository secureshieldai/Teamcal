import { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../Avatar';
import { colors, spacing } from '../../theme';
import { personalService } from '../../services/api/personal.service';
import { socialService } from '../../services/api/social.service';

export type VideoFeedItem = {
  id: string;
  thumbnail: string;
  authorId: string;
  author: string;
  authorAvatar: string;
  verified?: boolean;
  time: string;
  duration: string;
  caption: string;
  likes: number;
  comments: number;
  videoUrl: string;
};

export default function VideoFeedCard({ video, height, isActive }: { video: VideoFeedItem; height: number; isActive?: boolean }) {
  const [likes, setLikes] = useState(video.likes);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [following, setFollowing] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Initialize video player with configuration
  const player = useVideoPlayer(video.videoUrl, (player) => {
    player.loop = true;
    player.muted = false;
  });

  useEffect(() => {
    personalService.list('saved-video').then((rows) => setSaved(rows.some((r) => r.external_key === video.id))).catch(() => {});
  }, [video.id]);

  // Auto-play when card becomes visible
  useEffect(() => {
    if (!player) return;
    
    if (isActive) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, player]);

  // Monitor playing state
  useEffect(() => {
    if (!player) return;
    
    const subscription = player.addListener('playingChange', (event) => {
      setIsPlaying(event.isPlaying);
    });

    return () => {
      subscription.remove();
    };
  }, [player]);

  const togglePlayPause = () => {
    if (!player) return;
    
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  };

  const toggleMute = () => {
    if (!player) return;
    player.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleLike = () => {
    setLiked((prev) => !prev);
    setLikes((prev) => prev + (liked ? -1 : 1));
  };

  const toggleSaved = async () => {
    const previous = saved;
    setSaved(!saved);
    try {
      setSaved(await personalService.toggle('saved-video', video.id, { caption: video.caption, thumbnail: video.thumbnail }));
    } catch {
      setSaved(previous);
    }
  };

  const toggleFollow = async () => {
    const previous = following;
    setFollowing(!following);
    try {
      setFollowing(await socialService.toggleFollow(video.authorId));
    } catch {
      setFollowing(previous);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.card, { height }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Video Player */}
      <TouchableOpacity 
        style={styles.media} 
        activeOpacity={1} 
        onPress={togglePlayPause}
      >
        <VideoView
          player={player}
          style={styles.media}
          contentFit="cover"
          nativeControls={false}
        />
      </TouchableOpacity>

      {/* Top Row - Author Info */}
      <View style={styles.topRow}>
        <View style={styles.authorAvatarWrap}>
          <Avatar uri={video.authorAvatar} size={34} />
          {!following && (
            <TouchableOpacity style={styles.followBadge} onPress={toggleFollow} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
              <Ionicons name="add" size={12} color={colors.white} />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.authorInfo}>
          <View style={styles.authorRow}>
            <Text style={styles.authorName}>{video.author}</Text>
            {video.verified && <Ionicons name="checkmark-circle" size={13} color={colors.primary} />}
          </View>
          <Text style={styles.time}>{video.time}</Text>
        </View>
        <Ionicons name="ellipsis-horizontal" size={20} color={colors.white} />
      </View>

      {/* Play/Pause Indicator */}
      {!isPlaying && (
        <TouchableOpacity style={styles.playCircle} onPress={togglePlayPause}>
          <Ionicons name="play" size={24} color="rgba(255,255,255,0.85)" />
        </TouchableOpacity>
      )}

      {/* Action Rail - Right Side */}
      <View style={styles.actionRail}>
        <TouchableOpacity style={styles.actionItem} onPress={toggleLike}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={26} color={liked ? colors.macroProtein : colors.white} />
          <Text style={styles.actionText}>{likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem} onPress={() => setShowComments(!showComments)}>
          <Ionicons name="chatbubble-outline" size={23} color={colors.white} />
          <Text style={styles.actionText}>{video.comments}</Text>
        </TouchableOpacity>
        <View style={styles.actionItem}>
          <Ionicons name="share-social-outline" size={24} color={colors.white} />
        </View>
        <TouchableOpacity style={styles.actionItem} onPress={toggleSaved}>
          <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={23} color={saved ? colors.primary : colors.white} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem} onPress={toggleMute}>
          <Ionicons name={isMuted ? 'volume-mute' : 'volume-high'} size={23} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Caption */}
      <View style={styles.captionWrap}>
        <Text style={styles.captionText} numberOfLines={2}>{video.caption}</Text>
      </View>

      {/* Duration Badge */}
      <View style={styles.durationBadge}>
        <Text style={styles.durationText}>{video.duration}</Text>
      </View>

      {/* Comment Section */}
      {showComments && (
        <View style={styles.commentSection}>
          <Text style={styles.commentTitle}>Comments</Text>
          <View style={styles.commentInputWrap}>
            <TextInput
              style={styles.commentInput}
              placeholder="Add a comment..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity style={styles.sendBtn} disabled={!commentText.trim()}>
              <Ionicons name="send" size={18} color={commentText.trim() ? colors.primary : 'rgba(255,255,255,0.3)'} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.navy,
  },
  media: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  authorAvatarWrap: {
    position: 'relative',
  },
  followBadge: {
    position: 'absolute',
    right: -3,
    bottom: -3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorInfo: {
    flex: 1,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authorName: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  time: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11.5,
    marginTop: 1,
  },
  playCircle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -30,
    marginLeft: -30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionRail: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.xxl + spacing.xl,
    alignItems: 'center',
    gap: spacing.lg,
  },
  actionItem: {
    alignItems: 'center',
    gap: 3,
  },
  actionText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  captionWrap: {
    position: 'absolute',
    left: spacing.md,
    right: 64,
    bottom: spacing.lg,
  },
  captionText: {
    color: colors.white,
    fontSize: 13.5,
    fontWeight: '600',
    lineHeight: 19,
  },
  durationBadge: {
    position: 'absolute',
    right: spacing.md,
    top: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 6,
  },
  durationText: {
    color: colors.white,
    fontSize: 10.5,
    fontWeight: '700',
  },
  placeholderBg: {
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noVideoText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    marginTop: spacing.sm,
  },
  commentSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  commentTitle: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  commentInputWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  commentInput: {
    flex: 1,
    color: colors.white,
    fontSize: 13,
    maxHeight: 80,
    paddingVertical: spacing.xs,
  },
  sendBtn: {
    padding: spacing.xs,
  },
});
