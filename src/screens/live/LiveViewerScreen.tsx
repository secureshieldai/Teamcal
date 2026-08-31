import React, { useEffect, useRef, useState } from 'react';
import {
  Alert, FlatList, KeyboardAvoidingView, Platform, Share,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { VideoView, useVideoPlayer } from 'expo-video';
import { colors, radii, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';
import { liveService, type LiveComment, type LiveStream } from '../../services/api/live.service';
import { socialService } from '../../services/api/social.service';

type Props = NativeStackScreenProps<RootStackParamList, 'LiveViewer'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function LiveViewerScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Props['route']>();
  const { streamId } = params;

  const [stream, setStream] = useState<LiveStream | null>(null);
  const [comments, setComments] = useState<LiveComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [viewerCount, setViewerCount] = useState(0);
  const [following, setFollowing] = useState(false);
  const [reactions, setReactions] = useState<{ id: number; x: number }[]>([]);
  const [streamEnded, setStreamEnded] = useState(false);

  const flatRef = useRef<FlatList>(null);
  const reactionId = useRef(0);

  // Placeholder HLS player — in production this would be the stream's HLS URL
  const player = useVideoPlayer(null, (p) => { p.loop = true; });

  useEffect(() => {
    liveService.getStream(streamId)
      .then((s) => {
        setStream(s);
        setViewerCount(s.viewer_count);
        if (s.status !== 'live') setStreamEnded(true);
      })
      .catch(() => setStreamEnded(true));

    liveService.getComments(streamId).then(setComments).catch(() => {});
    liveService.joinStream(streamId).then((c) => setViewerCount(c)).catch(() => {});

    return () => { liveService.leaveStream(streamId); };
  }, [streamId]);

  // Socket.IO
  useEffect(() => {
    let mounted = true;
    liveService.joinStreamRoom(streamId).catch(() => {});

    liveService.getSocket().then((socket) => {
      socket.on('live:comment', (comment: LiveComment) => {
        if (!mounted) return;
        setComments((prev) => [...prev, comment]);
        flatRef.current?.scrollToEnd({ animated: true });
      });
      socket.on('live:comment_deleted', ({ commentId }: { commentId: string }) => {
        if (!mounted) return;
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      });
      socket.on('live:comment_pinned', ({ commentId }: { commentId: string }) => {
        if (!mounted) return;
        setComments((prev) => prev.map((c) => ({ ...c, pinned: c.id === commentId })));
      });
      socket.on('live:viewer_count', ({ count }: { count: number }) => {
        if (mounted) setViewerCount(count);
      });
      socket.on('live:reaction', () => {
        if (!mounted) return;
        const id = ++reactionId.current;
        const x = 20 + Math.random() * 60;
        setReactions((prev) => [...prev.slice(-8), { id, x }]);
        setTimeout(() => setReactions((prev) => prev.filter((r) => r.id !== id)), 2500);
      });
      socket.on('live:ended', () => { if (mounted) setStreamEnded(true); });
      socket.on('live:kicked', ({ streamId: sid }: { streamId: string }) => {
        if (!mounted || sid !== streamId) return;
        Alert.alert('Removed', 'You have been removed from this stream.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      });
    });

    return () => {
      mounted = false;
      liveService.leaveStreamRoom(streamId);
    };
  }, [streamId]);

  async function sendComment() {
    const text = commentText.trim();
    if (!text) return;
    setCommentText('');
    try { await liveService.addComment(streamId, text); } catch { /* best-effort */ }
  }

  async function sendReaction() {
    try { await liveService.sendReaction(streamId); } catch { /* best-effort */ }
  }

  async function handleFollow() {
    if (!stream?.host_id) return;
    try {
      const result = await socialService.toggleFollow(stream.host_id);
      setFollowing(result);
    } catch { /* best-effort */ }
  }

  async function handleShare() {
    try {
      await Share.share({ message: `Watch ${stream?.host?.name ?? 'someone'} live on TeamCal! "${stream?.title ?? ''}"` });
    } catch { /* ignore */ }
  }

  function handleReport() {
    Alert.prompt(
      'Report stream',
      'Why are you reporting this stream?',
      (reason) => {
        if (reason?.trim()) {
          liveService.reportStream(streamId, reason.trim()).catch(() => {});
          Alert.alert('Reported', 'Thank you. Our team will review this stream.');
        }
      },
      'plain-text',
    );
  }

  if (streamEnded) {
    return (
      <SafeAreaView style={s.endedContainer} edges={['top', 'bottom']}>
        <Ionicons name="radio-outline" size={52} color={colors.textMuted} />
        <Text style={s.endedTitle}>Stream has ended</Text>
        <Text style={s.endedSub}>This live stream is no longer active.</Text>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backBtnText}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={s.container}>
      {/* Video area — shows cover image until real HLS stream URL is wired */}
      <View style={s.videoArea}>
        {stream?.cover_image ? (
          <Image source={{ uri: stream.cover_image }} style={StyleSheet.absoluteFill} resizeMode="cover" blurRadius={2} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: '#111' }]} />
        )}
        <View style={s.videoPlaceholder}>
          <Ionicons name="radio" size={48} color="rgba(255,255,255,0.4)" />
          <Text style={s.videoPlaceholderText}>Live video stream</Text>
        </View>
      </View>

      <SafeAreaView style={s.overlay} edges={['top', 'bottom']}>
        {/* Top bar */}
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backCircle}>
            <Ionicons name="chevron-down" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            {stream?.host?.avatar ? (
              <Image source={{ uri: stream.host.avatar }} style={s.hostAvatar} />
            ) : null}
          </View>
          <View style={s.livePill}>
            <View style={s.liveDot} />
            <Text style={s.livePillText}>LIVE</Text>
          </View>
          <View style={s.viewerBadge}>
            <Ionicons name="eye" size={12} color="#fff" />
            <Text style={s.viewerText}>{viewerCount}</Text>
          </View>
          <TouchableOpacity onPress={handleReport} style={s.topIconBtn}>
            <Ionicons name="flag-outline" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={s.topIconBtn}>
            <Ionicons name="share-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Host info strip */}
        {stream && (
          <View style={s.hostStrip}>
            <View style={{ flex: 1 }}>
              <Text style={s.hostName}>{stream.host?.name ?? 'Host'}</Text>
              <Text style={s.streamTitle} numberOfLines={1}>{stream.title}</Text>
            </View>
            {following !== undefined && (
              <TouchableOpacity style={[s.followBtn, following && s.followingBtn]} onPress={handleFollow}>
                <Text style={[s.followBtnText, following && s.followingBtnText]}>
                  {following ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Floating reactions */}
        <View style={s.reactionsContainer} pointerEvents="none">
          {reactions.map((r) => (
            <Text key={r.id} style={[s.floatHeart, { left: `${r.x}%` as any }]}>❤️</Text>
          ))}
        </View>

        {/* Comments + input */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.bottom}>
          <FlatList
            ref={flatRef}
            data={comments.filter(c => !c.deleted_at)}
            keyExtractor={item => item.id}
            style={s.commentList}
            contentContainerStyle={{ padding: spacing.sm, paddingBottom: 4 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={[s.commentBubble, item.pinned && s.pinnedBubble]}>
                {item.pinned && <Text style={s.pinnedLabel}>📌 Pinned</Text>}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                  {item.user?.avatar ? (
                    <Image source={{ uri: item.user.avatar }} style={s.commentAvatar} />
                  ) : (
                    <View style={[s.commentAvatar, { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }]}>
                      <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{item.user?.name?.[0] ?? '?'}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={s.commentName}>{item.user?.name ?? 'Viewer'}</Text>
                    <Text style={s.commentText}>{item.text}</Text>
                  </View>
                </View>
              </View>
            )}
          />
          <View style={s.inputRow}>
            <TextInput
              style={s.commentInput}
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Say something…"
              placeholderTextColor="rgba(255,255,255,0.5)"
              onSubmitEditing={sendComment}
              returnKeyType="send"
            />
            <TouchableOpacity style={s.heartBtn} onPress={sendReaction}>
              <Text style={{ fontSize: 20 }}>❤️</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.sendBtn} onPress={sendComment}>
              <Ionicons name="send" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  videoArea: { ...StyleSheet.absoluteFill },
  videoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  videoPlaceholderText: { color: 'rgba(255,255,255,0.4)', fontSize: 13 },
  overlay: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  backCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  hostAvatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: '#fff' },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FF4444', borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  livePillText: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  viewerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 4 },
  viewerText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  topIconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  hostStrip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: 'rgba(0,0,0,0.4)' },
  hostName: { fontSize: 13, fontWeight: '700', color: '#fff' },
  streamTitle: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  followBtn: { backgroundColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },
  followingBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  followBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  followingBtnText: { color: '#fff' },
  reactionsContainer: { position: 'absolute', bottom: 160, left: 0, right: 0, height: 200 },
  floatHeart: { position: 'absolute', bottom: 0, fontSize: 28 },
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  commentList: { maxHeight: 200 },
  commentBubble: { marginBottom: 4, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: radii.md, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  pinnedBubble: { borderWidth: 1, borderColor: colors.primary },
  pinnedLabel: { fontSize: 10, color: colors.primary, fontWeight: '700', marginBottom: 2 },
  commentAvatar: { width: 22, height: 22, borderRadius: 11, marginTop: 1 },
  commentName: { fontSize: 11, fontWeight: '700', color: '#fff' },
  commentText: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 1 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: 'rgba(0,0,0,0.6)' },
  commentInput: { flex: 1, height: 38, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: radii.pill, paddingHorizontal: spacing.md, fontSize: 13, color: '#fff' },
  heartBtn: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  sendBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  // Ended state
  endedContainer: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xxl },
  endedTitle: { ...typography.h2, color: colors.textPrimary },
  endedSub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  backBtn: { marginTop: spacing.md, backgroundColor: colors.primary, borderRadius: radii.pill, paddingHorizontal: spacing.xxl, paddingVertical: spacing.md },
  backBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
