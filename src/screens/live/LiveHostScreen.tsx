import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert, FlatList, KeyboardAvoidingView, Platform, Share,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radii, spacing, typography } from '../../theme';
import type { RootStackParamList } from '../../navigation/types';
import { liveService, type LiveComment, type LiveStream } from '../../services/api/live.service';

type Props = NativeStackScreenProps<RootStackParamList, 'LiveHost'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function LiveHostScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Props['route']>();
  const { streamId } = params;

  const [stream, setStream] = useState<LiveStream | null>(null);
  const [comments, setComments] = useState<LiveComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [viewerCount, setViewerCount] = useState(0);
  const [duration, setDuration] = useState(0);
  const [reconnecting, setReconnecting] = useState(false);
  const [reactions, setReactions] = useState<{ id: number; x: number }[]>([]);

  const flatRef = useRef<FlatList>(null);
  const startedAt = useRef(Date.now());
  const reactionId = useRef(0);

  // Timer
  useEffect(() => {
    const t = setInterval(() => setDuration(Math.floor((Date.now() - startedAt.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  // Load stream + comments
  useEffect(() => {
    liveService.getStream(streamId).then(setStream).catch(() => {});
    liveService.getComments(streamId).then(setComments).catch(() => {});
  }, [streamId]);

  // Socket.IO
  useEffect(() => {
    let mounted = true;
    liveService.joinStreamRoom(streamId).then(() => {}).catch(() => {});

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
      socket.on('disconnect', () => { if (mounted) setReconnecting(true); });
      socket.on('connect', () => { if (mounted) setReconnecting(false); });
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

  async function handleDeleteComment(commentId: string) {
    try { await liveService.deleteComment(streamId, commentId); } catch { /* best-effort */ }
  }

  async function handlePinComment(commentId: string) {
    try { await liveService.pinComment(streamId, commentId); } catch { /* best-effort */ }
  }

  async function handleMuteViewer(userId: string) {
    Alert.alert('Mute viewer?', 'They will not be able to comment.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Mute', style: 'destructive', onPress: () => liveService.muteViewer(streamId, userId).catch(() => {}) },
    ]);
  }

  async function handleKickViewer(userId: string) {
    Alert.alert('Remove viewer?', 'They will be removed from the stream.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => liveService.kickViewer(streamId, userId).catch(() => {}) },
    ]);
  }

  async function handleShare() {
    try {
      await Share.share({ message: `Watch me live on TeamCal! Stream: ${stream?.title ?? ''}` });
    } catch { /* ignore */ }
  }

  function confirmEndStream() {
    Alert.alert('End stream?', 'This will stop the broadcast for all viewers.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'End Stream', style: 'destructive', onPress: endStream },
    ]);
  }

  async function endStream() {
    try {
      await liveService.endStream(streamId);
      navigation.replace('LiveSummary', { streamId });
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to end stream');
    }
  }

  const durationStr = `${String(Math.floor(duration / 3600)).padStart(2, '0')}:${String(Math.floor((duration % 3600) / 60)).padStart(2, '0')}:${String(duration % 60).padStart(2, '0')}`;

  return (
    <View style={s.container}>
      {/* Camera background */}
      {cameraOn ? (
        <CameraView style={StyleSheet.absoluteFill} facing={facing} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#111' }]} />
      )}

      <SafeAreaView style={s.overlay} edges={['top', 'bottom']}>
        {/* Top bar */}
        <View style={s.topBar}>
          <View style={s.livePill}>
            <View style={s.liveDot} />
            <Text style={s.livePillText}>LIVE</Text>
          </View>
          <View style={s.durationBadge}>
            <Text style={s.durationText}>{durationStr}</Text>
          </View>
          <View style={s.viewerBadge}>
            <Ionicons name="eye" size={12} color="#fff" />
            <Text style={s.viewerText}>{viewerCount}</Text>
          </View>
          <TouchableOpacity style={s.endBtn} onPress={confirmEndStream}>
            <Text style={s.endBtnText}>End</Text>
          </TouchableOpacity>
        </View>

        {reconnecting && (
          <View style={s.reconnectBanner}>
            <Ionicons name="wifi-outline" size={14} color="#fff" />
            <Text style={s.reconnectText}>Reconnecting…</Text>
          </View>
        )}

        {/* Floating reactions */}
        <View style={s.reactionsContainer} pointerEvents="none">
          {reactions.map((r) => (
            <Text key={r.id} style={[s.floatHeart, { left: `${r.x}%` as any }]}>❤️</Text>
          ))}
        </View>

        {/* Camera controls */}
        <View style={s.sideControls}>
          <TouchableOpacity style={s.ctrlBtn} onPress={() => setFacing(f => f === 'front' ? 'back' : 'front')}>
            <Ionicons name="camera-reverse-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={s.ctrlBtn} onPress={() => setMicOn(v => !v)}>
            <Ionicons name={micOn ? 'mic' : 'mic-off'} size={22} color={micOn ? '#fff' : '#FF4444'} />
          </TouchableOpacity>
          <TouchableOpacity style={s.ctrlBtn} onPress={() => setCameraOn(v => !v)}>
            <Ionicons name={cameraOn ? 'videocam' : 'videocam-off'} size={22} color={cameraOn ? '#fff' : '#FF4444'} />
          </TouchableOpacity>
          <TouchableOpacity style={s.ctrlBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={22} color="#fff" />
          </TouchableOpacity>
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
              <CommentBubble
                comment={item}
                onDelete={() => handleDeleteComment(item.id)}
                onPin={() => handlePinComment(item.id)}
                onMute={() => handleMuteViewer(item.user_id)}
                onKick={() => handleKickViewer(item.user_id)}
              />
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
            <TouchableOpacity style={s.sendBtn} onPress={sendComment}>
              <Ionicons name="send" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function CommentBubble({
  comment, onDelete, onPin, onMute, onKick,
}: {
  comment: LiveComment;
  onDelete: () => void;
  onPin: () => void;
  onMute: () => void;
  onKick: () => void;
}) {
  function showOptions() {
    Alert.alert(comment.user?.name ?? 'Viewer', undefined, [
      { text: comment.pinned ? 'Unpin' : 'Pin comment', onPress: onPin },
      { text: 'Delete comment', style: 'destructive', onPress: onDelete },
      { text: 'Mute viewer', onPress: onMute },
      { text: 'Remove viewer', style: 'destructive', onPress: onKick },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  return (
    <TouchableOpacity onLongPress={showOptions} activeOpacity={0.9} style={[s.commentBubble, comment.pinned && s.pinnedBubble]}>
      {comment.pinned && <Text style={s.pinnedLabel}>📌 Pinned</Text>}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
        {comment.user?.avatar ? (
          <Image source={{ uri: comment.user.avatar }} style={s.commentAvatar} />
        ) : (
          <View style={[s.commentAvatar, { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{comment.user?.name?.[0] ?? '?'}</Text>
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={s.commentName}>{comment.user?.name ?? 'Viewer'}</Text>
          <Text style={s.commentText}>{comment.text}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FF4444', borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  livePillText: { color: '#fff', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },
  durationBadge: { backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 4 },
  durationText: { color: '#fff', fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  viewerBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: radii.pill, paddingHorizontal: 8, paddingVertical: 4 },
  viewerText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  endBtn: { marginLeft: 'auto' as any, backgroundColor: '#FF4444', borderRadius: radii.pill, paddingHorizontal: spacing.md, paddingVertical: 6 },
  endBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  reconnectBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,68,68,0.85)', paddingVertical: 6, paddingHorizontal: spacing.md },
  reconnectText: { color: '#fff', fontSize: 12 },
  reactionsContainer: { position: 'absolute', bottom: 160, left: 0, right: 0, height: 200 },
  floatHeart: { position: 'absolute', bottom: 0, fontSize: 28 },
  sideControls: { position: 'absolute', right: spacing.md, top: 80, gap: spacing.sm },
  ctrlBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  bottom: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  commentList: { maxHeight: 220 },
  commentBubble: { marginBottom: 4, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: radii.md, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  pinnedBubble: { borderWidth: 1, borderColor: colors.primary },
  pinnedLabel: { fontSize: 10, color: colors.primary, fontWeight: '700', marginBottom: 2 },
  commentAvatar: { width: 22, height: 22, borderRadius: 11, marginTop: 1 },
  commentName: { fontSize: 11, fontWeight: '700', color: '#fff' },
  commentText: { fontSize: 12, color: 'rgba(255,255,255,0.9)', marginTop: 1 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: 'rgba(0,0,0,0.6)' },
  commentInput: { flex: 1, height: 38, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: radii.pill, paddingHorizontal: spacing.md, fontSize: 13, color: '#fff' },
  sendBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
