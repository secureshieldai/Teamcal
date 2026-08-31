import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
        <View style={{ width: 22 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          data={comments}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.content}
          ListHeaderComponent={
            <View style={styles.postSection}>
              <View style={styles.postHeader}>
                <Avatar uri={post.author?.avatar} size={44} />
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={styles.authorName}>{post.author?.name}</Text>
                  <Text style={styles.postTime}>{new Date(post.created_at).toLocaleString()}</Text>
                </View>
              </View>
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
            <View style={styles.comment}>
              <Avatar uri={item.user?.avatar} size={32} />
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={styles.commentAuthor}>{item.user?.name}</Text>
                <Text style={styles.commentText}>{item.content}</Text>
                <Text style={styles.commentTime}>{new Date(item.created_at).toLocaleDateString()}</Text>
              </View>
            </View>
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
});
