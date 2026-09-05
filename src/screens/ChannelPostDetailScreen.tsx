import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { channelsService } from '../services/api/channels.service';
import type { ChannelPost, PostComment } from '../types/channels';
import { colors, radii, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';
import Avatar from '../components/Avatar';

type Props = NativeStackScreenProps<RootStackParamList, 'ChannelPostDetail'>;

export default function ChannelPostDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Props['route']>();
  const { postId } = route.params;

  const [post, setPost] = useState<ChannelPost | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  useEffect(() => {
    loadPost();
    loadComments();
  }, [postId]);

  const loadPost = async () => {
    try {
      const data = await channelsService.getPost(postId);
      setPost(data);
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const data = await channelsService.getComments(postId);
      setComments(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setPosting(true);
    try {
      await channelsService.addComment(postId, commentText.trim());
      setCommentText('');
      loadComments();
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    } finally {
      setPosting(false);
    }
  };

  const handlePinPost = () => {
    setShowOptionsMenu(false);
    Alert.alert('Pin Post', 'This post has been pinned to the top of the channel');
  };

  const handleEditPost = () => {
    setShowOptionsMenu(false);
    Alert.alert('Edit Post', 'Edit functionality coming soon');
  };

  const handleDeletePost = () => {
    setShowOptionsMenu(false);
    Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  };

  const handleCopyLink = () => {
    setShowOptionsMenu(false);
    Alert.alert('Link Copied', 'Post link copied to clipboard');
  };

  const handleSharePost = () => {
    setShowOptionsMenu(false);
    Alert.alert('Share Post', 'Sharing options coming soon');
  };

  const handleTurnOffNotifications = () => {
    setShowOptionsMenu(false);
    Alert.alert('Notifications Off', 'You will no longer receive notifications for this post');
  };

  if (loading || !post) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        <TouchableOpacity onPress={() => setShowOptionsMenu(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="ellipsis-vertical" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          ListHeaderComponent={
            <View style={styles.postSection}>
              <TouchableOpacity 
                style={styles.postHeader}
                onPress={() => post.author?.id && navigation.navigate('UserProfile', { userId: post.author.id, username: post.author.name })}
                disabled={!post.author?.id}
                activeOpacity={0.7}
              >
                <Avatar uri={post.author?.avatar} size={44} />
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={styles.authorName}>{post.author?.name}</Text>
                  <Text style={styles.postTime}>{new Date(post.created_at).toLocaleString()}</Text>
                </View>
              </TouchableOpacity>
              {post.text_content && <Text style={styles.postText}>{post.text_content}</Text>}
              {post.media_url && <Image source={{ uri: post.media_url }} style={styles.postImage} />}
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Ionicons name="heart-outline" size={16} color={colors.textMuted} />
                  <Text style={styles.statText}>{post.reaction_count}</Text>
                </View>
                <View style={styles.stat}>
                  <Ionicons name="chatbubble-outline" size={16} color={colors.textMuted} />
                  <Text style={styles.statText}>{post.comment_count}</Text>
                </View>
                <View style={styles.stat}>
                  <Ionicons name="eye-outline" size={16} color={colors.textMuted} />
                  <Text style={styles.statText}>{post.view_count}</Text>
                </View>
              </View>
              <Text style={styles.commentsTitle}>Comments</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.comment}
              onPress={() => item.user?.id && navigation.navigate('UserProfile', { userId: item.user.id, username: item.user.name })}
              disabled={!item.user?.id}
              activeOpacity={0.7}
            >
              <Avatar uri={item.user?.avatar} size={32} />
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={styles.commentAuthor}>{item.user?.name}</Text>
                <Text style={styles.commentText}>{item.content}</Text>
                <Text style={styles.commentTime}>{new Date(item.created_at).toLocaleDateString()}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No comments yet</Text>}
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Add a comment..."
            placeholderTextColor={colors.textMuted}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, posting && { opacity: 0.5 }]}
            onPress={handleComment}
            disabled={posting || !commentText.trim()}
          >
            <Ionicons name="send" size={18} color={colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={showOptionsMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptionsMenu(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowOptionsMenu(false)}>
          <View style={styles.optionsMenu}>
            <TouchableOpacity style={styles.optionItem} onPress={handlePinPost}>
              <Ionicons name="pin-outline" size={22} color={colors.textPrimary} />
              <Text style={styles.optionText}>Pin Post</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionItem} onPress={handleEditPost}>
              <Ionicons name="create-outline" size={22} color={colors.textPrimary} />
              <Text style={styles.optionText}>Edit Post</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionItem} onPress={handleDeletePost}>
              <Ionicons name="trash-outline" size={22} color="#DC2626" />
              <Text style={[styles.optionText, { color: '#DC2626' }]}>Delete Post</Text>
            </TouchableOpacity>
            <View style={styles.optionDivider} />
            <TouchableOpacity style={styles.optionItem} onPress={handleTurnOffNotifications}>
              <Ionicons name="notifications-off-outline" size={22} color={colors.textPrimary} />
              <Text style={styles.optionText}>Turn off notifications</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionItem} onPress={handleCopyLink}>
              <Ionicons name="link-outline" size={22} color={colors.textPrimary} />
              <Text style={styles.optionText}>Copy Link</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionItem} onPress={handleSharePost}>
              <Ionicons name="share-outline" size={22} color={colors.textPrimary} />
              <Text style={styles.optionText}>Share Post</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.card },
  headerTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  content: { padding: spacing.lg },
  postSection: { marginBottom: spacing.lg },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  authorName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  postTime: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  postText: { fontSize: 15, color: colors.textPrimary, lineHeight: 22, marginBottom: spacing.md },
  postImage: { width: '100%', height: 220, borderRadius: radii.lg, marginBottom: spacing.md },
  statsRow: { flexDirection: 'row', gap: spacing.lg, paddingVertical: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 13, color: colors.textMuted },
  commentsTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginTop: spacing.lg, marginBottom: spacing.md },
  comment: { flexDirection: 'row', marginBottom: spacing.md },
  commentAuthor: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  commentText: { fontSize: 13.5, color: colors.textPrimary, marginTop: 4, lineHeight: 19 },
  commentTime: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  emptyText: { textAlign: 'center', color: colors.textMuted, fontSize: 13, padding: spacing.lg },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.card, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  input: { flex: 1, backgroundColor: colors.background, borderRadius: radii.xl, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: 14, color: colors.textPrimary, maxHeight: 80 },
  sendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  optionsMenu: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  optionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
    marginHorizontal: spacing.xl,
  },
});
