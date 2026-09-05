import React, { memo, useEffect, useRef, useState } from 'react';
import { 
  Animated, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet, 
  Text, 
  TextInput,
  TouchableOpacity, 
  TouchableWithoutFeedback,
  View 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../Avatar';
import { colors, spacing } from '../../theme';
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

const VideoFeedCard = ({ video, height, isActive }: { video: VideoFeedItem; height: number; isActive?: boolean }) => {
  const insets = useSafeAreaInsets();
  const [likes, setLikes] = useState(video.likes);
  const [liked, setLiked] = useState(false);
  const [liking, setLiking] = useState(false);
  const [commentsCount, setCommentsCount] = useState(video.comments);
  const [following, setFollowing] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showPlayIcon, setShowPlayIcon] = useState(true);
  
  // Double-tap animation
  const heartScale = useRef(new Animated.Value(0)).current;
  const lastTap = useRef<number | null>(null);

  // Initialize video player with configuration
  const player = useVideoPlayer(video.videoUrl, (player) => {
    player.loop = true;
    player.muted = false;
  });

  // Auto-play when card becomes visible, pause when not
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

  // Hide play icon after a short delay when playing
  useEffect(() => {
    if (isPlaying) {
      const timer = setTimeout(() => setShowPlayIcon(false), 500);
      return () => clearTimeout(timer);
    } else {
      setShowPlayIcon(true);
    }
  }, [isPlaying]);

  const togglePlayPause = () => {
    if (!player) return;
    
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
  };

  const handleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (lastTap.current && now - lastTap.current < DOUBLE_TAP_DELAY) {
      // Double tap detected
      handleDoubleTap();
      lastTap.current = null;
    } else {
      // Single tap
      lastTap.current = now;
      setTimeout(() => {
        if (lastTap.current === now) {
          togglePlayPause();
        }
      }, DOUBLE_TAP_DELAY);
    }
  };

  const handleDoubleTap = () => {
    if (!liked) {
      // Animate heart
      heartScale.setValue(0);
      Animated.sequence([
        Animated.spring(heartScale, {
          toValue: 1,
          useNativeDriver: true,
          friction: 3,
        }),
        Animated.timing(heartScale, {
          toValue: 0,
          duration: 400,
          delay: 400,
          useNativeDriver: true,
        }),
      ]).start();

      // Like the video
      toggleLike();
    }
  };

  const toggleMute = () => {
    if (!player) return;
    player.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleLike = async () => {
    if (liking) return;

    const previousLiked = liked;
    const previousLikes = likes;

    // Optimistic update
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);
    setLiking(true);

    try {
      // TODO: Call your actual API here
      // await socialService.toggleVideoLike(video.id);
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API call
    } catch (error) {
      // Rollback on error
      setLiked(previousLiked);
      setLikes(previousLikes);
      console.error('Failed to toggle like:', error);
    } finally {
      setLiking(false);
    }
  };

  const toggleFollow = async () => {
    const previous = following;
    setFollowing(!following);
    
    try {
      const result = await socialService.toggleFollow(video.authorId);
      setFollowing(result);
    } catch (error) {
      setFollowing(previous);
      console.error('Failed to toggle follow:', error);
    }
  };

  const openComments = async () => {
    setShowComments(true);
    setLoadingComments(true);
    
    try {
      // TODO: Replace with actual comments API
      // const fetchedComments = await socialService.getVideoComments(video.id);
      // setComments(fetchedComments);
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      setComments([]); // Empty for now
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const postComment = async () => {
    if (!commentText.trim() || postingComment) return;

    setPostingComment(true);
    
    try {
      // TODO: Replace with actual API
      // const newComment = await socialService.addVideoComment(video.id, commentText.trim());
      // setComments([newComment, ...comments]);
      setCommentsCount(commentsCount + 1);
      setCommentText('');
    } catch (error) {
      console.error('Failed to post comment:', error);
    } finally {
      setPostingComment(false);
    }
  };

  return (
    <View style={[styles.card, { height }]}>
      {/* Video Player */}
      <TouchableWithoutFeedback onPress={handleTap}>
        <View style={styles.media}>
          <VideoView
            player={player}
            style={styles.media}
            contentFit="cover"
            nativeControls={false}
          />

          {/* Loading indicator */}
          {!isPlaying && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="rgba(255,255,255,0.9)" />
            </View>
          )}

          {/* Double-tap heart animation */}
          <Animated.View
            style={[
              styles.doubleTapHeart,
              {
                opacity: heartScale,
                transform: [{ scale: heartScale }],
              },
            ]}
          >
            <Ionicons name="heart" size={120} color="rgba(255,255,255,0.95)" />
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>

      {/* Play/Pause Indicator */}
      {!isPlaying && showPlayIcon && (
        <View style={styles.playCircle} pointerEvents="none">
          <Ionicons name="play" size={32} color="rgba(255,255,255,0.9)" />
        </View>
      )}

      {/* Bottom-left: User Info */}
      <View style={styles.userInfo}>
        <View style={styles.userRow}>
          <View style={styles.avatarContainer}>
            <Avatar uri={video.authorAvatar} size={44} />
          </View>
          <View style={styles.userTextContainer}>
            <View style={styles.usernameRow}>
              <Text style={styles.username}>{video.author}</Text>
              {video.verified && <Ionicons name="checkmark-circle" size={14} color={colors.primary} />}
            </View>
            <TouchableOpacity 
              style={styles.followBtn} 
              onPress={toggleFollow}
              disabled={following}
            >
              <Text style={styles.followBtnText}>{following ? 'Following' : 'Follow'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Right-side Action Bar */}
      <View style={styles.actionRail}>
        {/* Like */}
        <TouchableOpacity 
          style={styles.actionItem} 
          onPress={toggleLike}
          disabled={liking}
        >
          <Ionicons 
            name={liked ? 'heart' : 'heart-outline'} 
            size={32} 
            color={liked ? '#FF3B5C' : colors.white} 
          />
          <Text style={styles.actionText}>{likes}</Text>
        </TouchableOpacity>

        {/* Comments */}
        <TouchableOpacity style={styles.actionItem} onPress={openComments}>
          <Ionicons name="chatbubble-outline" size={28} color={colors.white} />
          <Text style={styles.actionText}>{commentsCount}</Text>
        </TouchableOpacity>

        {/* Mute/Unmute */}
        <TouchableOpacity style={styles.actionItem} onPress={toggleMute}>
          <Ionicons 
            name={isMuted ? 'volume-mute' : 'volume-high'} 
            size={28} 
            color={colors.white} 
          />
        </TouchableOpacity>
      </View>

      {/* Comments Bottom Sheet Modal */}
      <Modal
        visible={showComments}
        transparent
        animationType="slide"
        onRequestClose={() => setShowComments(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <TouchableWithoutFeedback onPress={() => setShowComments(false)}>
            <View style={styles.modalBackdrop}>
              <TouchableWithoutFeedback>
                <View style={[styles.commentsSheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
                  <View style={styles.sheetHandle} />
                  <Text style={styles.commentsTitle}>Comments</Text>

                  {loadingComments ? (
                    <View style={styles.commentsLoading}>
                      <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                  ) : comments.length === 0 ? (
                    <View style={styles.commentsEmpty}>
                      <Ionicons name="chatbubbles-outline" size={48} color={colors.textMuted} />
                      <Text style={styles.emptyText}>No comments yet</Text>
                      <Text style={styles.emptySubtext}>Be the first to comment</Text>
                    </View>
                  ) : (
                    <ScrollView 
                      style={styles.commentsList}
                      keyboardShouldPersistTaps="handled"
                    >
                      {comments.map((comment) => (
                        <View key={comment.id} style={styles.commentItem}>
                          {/* Comment rendering logic here */}
                        </View>
                      ))}
                    </ScrollView>
                  )}

                  <View style={styles.commentInputContainer}>
                    <TextInput
                      style={styles.commentInput}
                      placeholder="Add a comment..."
                      placeholderTextColor={colors.textMuted}
                      value={commentText}
                      onChangeText={setCommentText}
                      multiline
                      maxLength={500}
                    />
                    <TouchableOpacity 
                      style={[styles.postBtn, !commentText.trim() && styles.postBtnDisabled]} 
                      onPress={postComment}
                      disabled={!commentText.trim() || postingComment}
                    >
                      {postingComment ? (
                        <ActivityIndicator size="small" color={colors.white} />
                      ) : (
                        <Ionicons name="send" size={20} color={colors.white} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default memo(VideoFeedCard);

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: colors.navy,
    position: 'relative',
  },
  media: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  doubleTapHeart: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -60,
    marginLeft: -60,
  },
  playCircle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -40,
    marginLeft: -40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    position: 'absolute',
    left: spacing.md,
    bottom: spacing.xl + spacing.md,
    right: 80,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarContainer: {
    position: 'relative',
  },
  userTextContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  username: {
    color: colors.white,
    fontWeight: '800',
    fontSize: 15,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  followBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  followBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  actionRail: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.xxl + spacing.xl,
    alignItems: 'center',
    gap: spacing.xl,
  },
  actionItem: {
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  // Comments Modal
  modalContainer: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  commentsSheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  commentsLoading: {
    padding: spacing.xxl,
    alignItems: 'center',
  },
  commentsEmpty: {
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textMuted,
  },
  commentsList: {
    paddingHorizontal: spacing.lg,
    maxHeight: 300,
  },
  commentItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.md,
  },
  commentInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.textPrimary,
    maxHeight: 80,
  },
  postBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postBtnDisabled: {
    opacity: 0.5,
  },
});
