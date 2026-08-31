import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { earnService, type EarnAsset, type VideoMetadata } from '../services/api/earn.service';
import { colors, radii, spacing, typography } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'VideoComments'>;
type Comment = NonNullable<VideoMetadata['comments']>[number];

function timeAgo(iso: string) {
  const diffHr = Math.round((Date.now() - new Date(iso).getTime()) / 3600000);
  if (diffHr < 1) return 'Just now';
  if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
  const diffDay = Math.round(diffHr / 24);
  return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
}

export default function VideoCommentsScreen({ route, navigation }: Props) {
  const { videoId } = route.params;
  const [video, setVideo] = useState<EarnAsset | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [replyTarget, setReplyTarget] = useState<Comment | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    earnService.getAsset(videoId).then(a => {
      setVideo(a);
      setComments((a.metadata as VideoMetadata)?.comments || []);
    }).catch(e => Alert.alert('Unable to load comments', (e as Error).message)).finally(() => setLoading(false));
  }, [videoId]);

  const sendReply = async () => {
    if (!video || !replyTarget || !replyText.trim()) return;
    const md = (video.metadata || {}) as VideoMetadata;
    const updatedComments = comments.map(c => c.id === replyTarget.id ? { ...c, reply: replyText.trim() } : c);
    try {
      const updated = await earnService.updateAsset(videoId, { metadata: { ...md, comments: updatedComments } });
      setVideo(updated);
      setComments(updatedComments);
      setReplyTarget(null);
      setReplyText('');
    } catch (e) {
      Alert.alert('Unable to reply', (e as Error).message);
    }
  };

  if (loading || !video) {
    return <SafeAreaView style={s.safe}><ActivityIndicator style={{ marginTop: 80 }} color={colors.primary} /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={navigation.goBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>Comments</Text>
        <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="options-outline" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={comments}
        keyExtractor={c => c.id}
        contentContainerStyle={s.list}
        ListEmptyComponent={<Text style={s.emptyText}>No comments yet.</Text>}
        renderItem={({ item }) => (
          <View style={s.commentCard}>
            <View style={s.commentTopRow}>
              <Image source={{ uri: item.authorAvatar || `https://i.pravatar.cc/80?u=${item.id}` }} style={s.avatar} />
              <View style={{ flex: 1 }}>
                <Text style={s.author}>{item.author}</Text>
                <Text style={s.time}>{timeAgo(item.createdAt)}</Text>
              </View>
              <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="ellipsis-horizontal" size={16} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={s.commentText}>{item.text}</Text>
            <TouchableOpacity onPress={() => { setReplyTarget(item); setReplyText(item.reply || ''); }}>
              <Text style={s.replyLink}>{item.reply ? 'Edit reply' : 'Reply'}</Text>
            </TouchableOpacity>
            {item.reply && (
              <View style={s.replyCard}>
                <Text style={s.replyAuthor}>You (Creator)</Text>
                <Text style={s.replyText}>{item.reply}</Text>
              </View>
            )}
          </View>
        )}
      />

      {replyTarget && (
        <View style={s.replyBar}>
          <TextInput
            style={s.replyInput}
            value={replyText}
            onChangeText={setReplyText}
            placeholder={`Reply to ${replyTarget.author}…`}
            placeholderTextColor={colors.textMuted}
            multiline
            autoFocus
          />
          <TouchableOpacity onPress={() => { setReplyTarget(null); setReplyText(''); }}><Text style={s.replyCancel}>Cancel</Text></TouchableOpacity>
          <TouchableOpacity style={s.replySend} onPress={sendReply} disabled={!replyText.trim()}>
            <Ionicons name="send" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  headerTitle: { ...typography.h2, color: colors.textPrimary, flex: 1, textAlign: 'center' },
  list: { padding: spacing.lg, gap: spacing.md },
  emptyText: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xxl },
  commentCard: { backgroundColor: colors.card, borderRadius: radii.lg, padding: spacing.md },
  commentTopRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.border },
  author: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  time: { fontSize: 10.5, color: colors.textMuted, marginTop: 1 },
  commentText: { fontSize: 13, color: colors.textPrimary, marginTop: spacing.sm, lineHeight: 19 },
  replyLink: { fontSize: 12, fontWeight: '700', color: colors.primary, marginTop: spacing.sm },
  replyCard: { backgroundColor: colors.background, borderRadius: radii.md, padding: spacing.sm, marginTop: spacing.sm },
  replyAuthor: { fontSize: 11, fontWeight: '700', color: colors.primary },
  replyText: { fontSize: 12, color: colors.textPrimary, marginTop: 2 },
  replyBar: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card },
  replyInput: { flex: 1, maxHeight: 100, backgroundColor: colors.background, borderRadius: radii.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, color: colors.textPrimary, fontSize: 13 },
  replyCancel: { fontSize: 12, fontWeight: '700', color: colors.textSecondary, paddingBottom: 10 },
  replySend: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
