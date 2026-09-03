import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { socialService, type ConversationMeta, type DirectMessage } from '../services/api/social.service';
import { subscribeToConversation } from '../services/realtime';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import MessageBubble from '../components/social/MessageBubble';
import { colors, radii, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'DirectMessage'>;

function fmtClock(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export default function DirectMessageScreen({ route, navigation }: Props) {
  const { userId, name, avatar } = route.params;
  const { user } = useAuth();

  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [meta, setMeta] = useState<ConversationMeta | null>(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const list = useRef<FlatList<DirectMessage>>(null);
  const setTypingRef = useRef<(t: boolean) => void>(() => undefined);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);

  const load = useCallback(async () => {
    try {
      const { messages: rows, conversation } = await socialService.getMessages(userId);
      setMessages(rows);
      setMeta(conversation);
    } catch (e) {
      Alert.alert('Unable to load messages', (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime thread updates, with a slow poll as a fallback.
  useEffect(() => {
    let sub: { unsubscribe: () => void; setTyping: (t: boolean) => void } | undefined;
    subscribeToConversation({
      peerId: userId,
      onMessage: (m) => {
        setMessages((cur) => (cur.some((x) => x.id === m.id) ? cur : [...cur, m]));
        if (!m.mine) socialService.markConversationRead(userId).catch(() => undefined);
        setMeta((cur) => (cur ? { ...cur, status: cur.status === 'pending' && !m.mine ? 'accepted' : cur.status } : cur));
      },
      onRead: () => setMessages((cur) => cur.map((x) => (x.mine ? { ...x, read: true } : x))),
      onTyping: (t) => setPeerTyping(t),
    }).then((s) => {
      sub = s;
      setTypingRef.current = s.setTyping;
    });
    const poll = setInterval(load, 8000);
    return () => {
      sub?.unsubscribe();
      clearInterval(poll);
    };
  }, [userId, load]);

  const onChangeText = (value: string) => {
    setText(value);
    setTypingRef.current(true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setTypingRef.current(false), 1500);
  };

  const pending = meta?.status === 'pending';
  const iAmInitiator = meta?.isInitiator ?? true;
  const remaining = meta?.messagesRemaining ?? null;
  const blockedFromSending = meta ? !meta.canSend : false;

  const handleSendError = (e: unknown) => {
    const err = e as Error & { code?: string };
    if (err.code === 'REQUEST_LIMIT') {
      load();
      Alert.alert('Message limit reached', `You can send up to 3 messages until ${name} accepts your request.`);
    } else if (err.code === 'WEEKLY_REQUEST_LIMIT') {
      Alert.alert('Weekly request limit reached', `You can start 5 new message requests per week. You can still reply in conversations you've already started. Try again in a few days.`);
    } else {
      Alert.alert('Unable to send', err.message);
    }
  };

  const sendText = async () => {
    const value = text.trim();
    if (!value || sending) return;
    setText('');
    setSending(true);
    try {
      const message = await socialService.sendMessage(userId, value);
      setMessages((cur) => (cur.some((x) => x.id === message.id) ? cur : [...cur, message]));
      refreshMeta();
    } catch (e) {
      setText(value);
      handleSendError(e);
    } finally {
      setSending(false);
    }
  };

  const refreshMeta = () => {
    socialService
      .getMessages(userId)
      .then(({ conversation }) => setMeta(conversation))
      .catch(() => undefined);
  };

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Photo access needed', 'Allow photo access to send an image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (result.canceled) return;
    const asset = result.assets[0];
    setSending(true);
    try {
      const message = await socialService.sendImageMessage(userId, {
        uri: asset.uri,
        mimeType: asset.mimeType || 'image/jpeg',
        fileName: asset.fileName || 'photo.jpg',
      });
      setMessages((cur) => [...cur, message]);
      refreshMeta();
    } catch (e) {
      handleSendError(e);
    } finally {
      setSending(false);
    }
  };

  const startRecording = async () => {
    const perm = await requestRecordingPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Microphone access needed', 'Allow microphone access to record a voice message.');
      return;
    }
    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecording(true);
    } catch (e) {
      Alert.alert('Unable to start recording', (e as Error).message);
    }
  };

  const finishRecording = async (): Promise<{ uri: string; durationMs: number } | null> => {
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });
    } catch {
      /* ignore */
    }
    setRecording(false);
    const uri = recorder.uri;
    const durationMs = recorderState.durationMillis || 0;
    return uri ? { uri, durationMs } : null;
  };

  const cancelRecording = async () => {
    await finishRecording();
  };

  const sendVoice = async () => {
    const clip = await finishRecording();
    if (!clip) return;
    setSending(true);
    try {
      const message = await socialService.sendVoiceMessage(
        userId,
        { uri: clip.uri, mimeType: 'audio/m4a', fileName: 'voice.m4a' },
        clip.durationMs,
      );
      setMessages((cur) => [...cur, message]);
      refreshMeta();
    } catch (e) {
      handleSendError(e);
    } finally {
      setSending(false);
    }
  };

  const voiceToText = async () => {
    const clip = await finishRecording();
    if (!clip) return;
    setTranscribing(true);
    try {
      const transcript = await socialService.transcribeAudio({ uri: clip.uri, mimeType: 'audio/m4a', fileName: 'voice.m4a' });
      setText((cur) => (cur ? `${cur} ${transcript}` : transcript));
    } catch (e) {
      Alert.alert('Could not transcribe', (e as Error).message);
    } finally {
      setTranscribing(false);
    }
  };

  const startCall = (mode: 'audio' | 'video') => {
    if (pending && iAmInitiator) {
      Alert.alert('Not connected yet', `You can call ${name} once they accept your message request.`);
      return;
    }
    navigation.navigate('Call', { userId, name, avatar, mode, direction: 'outgoing' });
  };

  const acceptRequest = async () => {
    try {
      await socialService.actOnMessageRequest(userId, 'accept');
      refreshMeta();
    } catch (e) {
      Alert.alert('Unable to accept', (e as Error).message);
    }
  };

  const declineRequest = async () => {
    try {
      await socialService.actOnMessageRequest(userId, 'decline');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Unable to decline', (e as Error).message);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={s.headerProfile} onPress={() => navigation.navigate('UserProfile', { userId, username: name })}>
          <Avatar uri={avatar || ''} size={38} />
          <View>
            <Text style={s.name}>{name}</Text>
            {peerTyping ? <Text style={s.typing}>typing…</Text> : null}
          </View>
        </TouchableOpacity>
        <View style={s.headerActions}>
          <TouchableOpacity onPress={() => startCall('audio')} hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}>
            <Ionicons name="call-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => startCall('video')} hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}>
            <Ionicons name="videocam-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <FlatList
          ref={list}
          data={messages}
          keyExtractor={(x) => x.id}
          contentContainerStyle={s.list}
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={<Text style={s.empty}>{loading ? 'Loading messages…' : 'No messages yet. Say hello.'}</Text>}
          renderItem={({ item }) => <MessageBubble message={item} onPressImage={setLightbox} />}
        />

        {pending && !iAmInitiator ? (
          <View style={s.requestBanner}>
            <Text style={s.requestText}>{name} wants to connect. Accept to chat freely, or just reply.</Text>
            <View style={s.requestActions}>
              <TouchableOpacity style={s.acceptBtn} onPress={acceptRequest}>
                <Text style={s.acceptBtnText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.declineBtn} onPress={declineRequest}>
                <Text style={s.declineBtnText}>Decline</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : pending && iAmInitiator ? (
          <Text style={s.limitNote}>
            {remaining && remaining > 0
              ? `Message request — you can send ${remaining} more message${remaining === 1 ? '' : 's'} until ${name} accepts.`
              : `You've used all 3 request messages. Wait for ${name} to accept.`}
          </Text>
        ) : null}

        {recording ? (
          <View style={s.recordBar}>
            <TouchableOpacity onPress={cancelRecording} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="trash-outline" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
            <View style={s.recordPulse} />
            <Text style={s.recordTime}>{fmtClock(recorderState.durationMillis || 0)}</Text>
            <View style={s.flex} />
            <TouchableOpacity onPress={voiceToText} style={s.recordAction} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="text-outline" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={sendVoice} style={[s.recordAction, s.recordSend]}>
              <Ionicons name="send" size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.composer}>
            <TouchableOpacity onPress={pickImage} disabled={blockedFromSending} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
              <Ionicons name="image-outline" size={24} color={blockedFromSending ? colors.textMuted : colors.textSecondary} />
            </TouchableOpacity>
            <TextInput
              style={s.input}
              value={text}
              onChangeText={onChangeText}
              placeholder={blockedFromSending ? 'Waiting for the request to be accepted…' : transcribing ? 'Transcribing…' : 'Message…'}
              placeholderTextColor={colors.textMuted}
              editable={!blockedFromSending && !transcribing}
              multiline
            />
            {text.trim() ? (
              <TouchableOpacity style={s.send} onPress={sendText} disabled={sending || blockedFromSending}>
                {sending ? <ActivityIndicator size="small" color={colors.white} /> : <Ionicons name="send" size={18} color={colors.white} />}
              </TouchableOpacity>
            ) : (
              <Pressable
                style={s.send}
                onPress={startRecording}
                disabled={blockedFromSending || transcribing}
              >
                <Ionicons name="mic" size={20} color={colors.white} />
              </Pressable>
            )}
          </View>
        )}
      </KeyboardAvoidingView>

      <Modal visible={!!lightbox} transparent onRequestClose={() => setLightbox(null)}>
        <Pressable style={s.lightbox} onPress={() => setLightbox(null)}>
          {lightbox ? <Image source={{ uri: lightbox }} style={s.lightboxImg} resizeMode="contain" /> : null}
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerProfile: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  name: { fontSize: 15.5, fontWeight: '800', color: colors.textPrimary },
  typing: { fontSize: 11, color: colors.primary, fontWeight: '600' },
  list: { padding: spacing.lg, gap: spacing.sm, flexGrow: 1 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xxl },
  requestBanner: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  requestText: { fontSize: 12.5, color: colors.textSecondary, lineHeight: 18 },
  requestActions: { flexDirection: 'row', gap: spacing.sm },
  acceptBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: radii.pill, paddingVertical: spacing.sm, alignItems: 'center' },
  acceptBtnText: { color: colors.white, fontWeight: '700', fontSize: 13 },
  declineBtn: { flex: 1, backgroundColor: colors.background, borderRadius: radii.pill, paddingVertical: spacing.sm, alignItems: 'center' },
  declineBtnText: { color: colors.textPrimary, fontWeight: '700', fontSize: 13 },
  limitNote: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    fontSize: 11.5,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: colors.textPrimary,
  },
  send: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  recordBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  recordPulse: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#E5484D' },
  recordTime: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  recordAction: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card },
  recordSend: { backgroundColor: colors.primary },
  lightbox: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' },
  lightboxImg: { width: '100%', height: '100%' },
});
