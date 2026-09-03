import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import ChatBubble from '../components/ChatBubble';
import CoachMascotAvatar from '../components/CoachMascotAvatar';
import { colors, radii, shadow, spacing, typography } from '../theme';
import { coachProfile, type ChatMessage } from '../data/coachChatData';
import { coachService } from '../services/api/coach.service';
import { fastingService } from '../services/api/fasting.service';
import { trackerService } from '../services/api/tracker.service';

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

const TYPING_ID = 'typing-indicator';

async function buildCoachContext() {
  const [fast, water, steps, sleep] = await Promise.all([
    fastingService.getActive().catch(() => null),
    trackerService.getToday('water').catch(() => ({ sum: 0 })),
    trackerService.getToday('steps').catch(() => ({ sum: 0 })),
    trackerService.getToday('sleep').catch(() => ({ sum: 0 })),
  ]);
  return {
    fastHours: fast?.active ? (Date.now() - fast.started_at) / 3_600_000 : 0,
    hydrationMl: water.sum,
    steps: steps.sum,
    sleepHours: sleep.sum,
  };
}

function VoiceNoteBubble({ duration, time }: { duration: string; time: string }) {
  return (
    <View style={styles.voiceWrap}>
      <View style={styles.voiceBubble}>
        <Ionicons name="play" size={16} color={colors.white} />
        <View style={styles.waveform}>
          {Array.from({ length: 14 }).map((_, i) => (
            <View key={i} style={[styles.waveBar, { height: 6 + ((i * 7) % 14) }]} />
          ))}
        </View>
        <Text style={styles.voiceDuration}>{duration}</Text>
      </View>
      <Text style={[styles.voiceTime]}>{time}</Text>
    </View>
  );
}

function ProgressCardBubble({ time }: { time: string }) {
  return (
    <View style={styles.progressWrap}>
      <View style={[styles.progressCard, shadow.card]}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressTitle}>Today's Progress</Text>
          <View style={styles.progressRing}>
            <Text style={styles.progressRingValue}>1,620</Text>
          </View>
        </View>
        <Text style={styles.progressGoal}>/ 2,300 kcal</Text>
        <View style={styles.macrosRow}>
          <Text style={styles.macroText}>Protein 120/160g</Text>
          <Text style={styles.macroText}>Carbs 160/220g</Text>
          <Text style={styles.macroText}>Fat 55/70g</Text>
        </View>
      </View>
      <Text style={[styles.voiceTime, { alignSelf: 'flex-end', marginRight: 4 }]}>{time}</Text>
    </View>
  );
}

function ImageMessageBubble({ uri, text, time }: { uri: string; text?: string; time: string }) {
  return (
    <View style={styles.imageMessageWrap}>
      <View style={styles.imageMessageBubble}>
        <Image source={{ uri }} style={styles.messageImage} resizeMode="cover" />
        {text ? <Text style={styles.imageCaption}>{text}</Text> : null}
      </View>
      <Text style={styles.imageMessageTime}>{time}</Text>
    </View>
  );
}

export default function CoachChatScreen() {
  const navigation = useNavigation();
  const scrollRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      kind: 'text',
      fromMe: false,
      text: "Hey! \u{1F60A} Im your TeamCal Coach. Ask me anything about fasting, meals, sleep, workouts, and more!",
      time: formatTime(new Date()),
    },
  ]);
  const [draft, setDraft] = useState('');
  const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [sending, setSending] = useState(false);

  const pickImage = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsMultipleSelection: false,
      });
      if (!result.canceled) setSelectedImage(result.assets[0]);
    } catch (error) {
      Alert.alert('Unable to select image', (error as Error).message);
    }
  }, []);

  const handleSend = useCallback(async () => {
    const text = draft.trim();
    const image = selectedImage;
    if ((!text && !image) || sending) return;

    setDraft('');
    setSelectedImage(null);
    setSending(true);
    setMessages((prev) => [
      ...prev,
      image
        ? { id: `u-${Date.now()}`, kind: 'image', fromMe: true, uri: image.uri, text: text || undefined, time: formatTime(new Date()) }
        : { id: `u-${Date.now()}`, kind: 'text', fromMe: true, text, time: formatTime(new Date()) },
      { id: TYPING_ID, kind: 'text', fromMe: false, text: '...', time: '' },
    ]);

    try {
      const context = await buildCoachContext();
      const { reply } = await coachService.sendMessage(text, context, image ? {
        uri: image.uri,
        mimeType: image.mimeType,
        fileName: image.fileName,
      } : undefined);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== TYPING_ID),
        { id: `c-${Date.now()}`, kind: 'text', fromMe: false, text: reply, time: formatTime(new Date()) },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== TYPING_ID),
        {
          id: `e-${Date.now()}`,
          kind: 'text',
          fromMe: false,
          text: "Sorry, I couldn't respond right now. Please try again.",
          time: formatTime(new Date()),
        },
      ]);
    } finally {
      setSending(false);
    }
  }, [draft, selectedImage, sending]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color={colors.white} />
        </TouchableOpacity>
        <CoachMascotAvatar size={36} />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{coachProfile.name}</Text>
          <Text style={styles.headerStatus}>Online</Text>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
        <View style={styles.profileCard}>
          <CoachMascotAvatar size={64} />
          <View style={styles.profileNameRow}>
            <Text style={styles.profileName}>{coachProfile.name}</Text>
            <Ionicons name="checkmark-circle" size={15} color={colors.primary} />
          </View>
          <Text style={styles.profileRole}>{coachProfile.role}</Text>
          <Text style={styles.profileTagline}>{coachProfile.tagline}</Text>
        </View>

        <Text style={styles.dateDivider}>Today</Text>

        {messages.map((message) => {
          if (message.kind === 'voice') {
            return <VoiceNoteBubble key={message.id} duration={message.duration} time={message.time} />;
          }
          if (message.kind === 'progress') {
            return <ProgressCardBubble key={message.id} time={message.time} />;
          }
          if (message.kind === 'image') {
            return <ImageMessageBubble key={message.id} uri={message.uri} text={message.text} time={message.time} />;
          }
          return (
            <ChatBubble
              key={message.id}
              text={message.text}
              time={message.time}
              fromMe={message.fromMe}
              seen={message.seen}
            />
          );
        })}
        </ScrollView>

        <View style={styles.composer}>
          {selectedImage ? (
            <View style={styles.imagePreviewWrap}>
              <Image source={{ uri: selectedImage.uri }} style={styles.imagePreview} />
              <TouchableOpacity style={styles.removeImageButton} onPress={() => setSelectedImage(null)} accessibilityLabel="Remove selected image">
                <Ionicons name="close" size={16} color={colors.white} />
              </TouchableOpacity>
            </View>
          ) : null}
          <View style={styles.inputBar}>
            <TouchableOpacity style={styles.imageButton} onPress={pickImage} disabled={sending} accessibilityLabel="Select an image">
              <Ionicons name="image-outline" size={21} color={colors.primary} />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder={selectedImage ? 'Add a message (optional)...' : 'Type a message...'}
              placeholderTextColor={colors.textMuted}
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              editable={!sending}
            />
            <TouchableOpacity style={styles.micButton} onPress={handleSend} disabled={sending || (!draft.trim() && !selectedImage)}>
              {sending ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Ionicons name={draft.trim() || selectedImage ? 'send' : 'mic'} size={18} color={colors.white} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
  headerStatus: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    marginTop: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  profileCard: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  profileRole: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  profileTagline: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  dateDivider: {
    textAlign: 'center',
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: spacing.lg,
  },
  voiceWrap: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
    marginBottom: spacing.md,
  },
  voiceBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    borderBottomRightRadius: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxWidth: 220,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  waveBar: {
    width: 2,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  voiceDuration: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '600',
  },
  voiceTime: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
  },
  progressWrap: {
    alignSelf: 'flex-end',
    marginBottom: spacing.md,
    width: '80%',
  },
  progressCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  progressRing: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingValue: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  progressGoal: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  macrosRow: {
    marginTop: spacing.sm,
    gap: 3,
  },
  macroText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  imageMessageWrap: {
    alignSelf: 'flex-end',
    width: '72%',
    marginBottom: spacing.md,
  },
  imageMessageBubble: {
    overflow: 'hidden',
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    borderBottomRightRadius: 4,
  },
  messageImage: {
    width: '100%',
    aspectRatio: 1.25,
  },
  imageCaption: {
    color: colors.white,
    fontSize: 13.5,
    lineHeight: 19,
    padding: spacing.md,
  },
  imageMessageTime: {
    alignSelf: 'flex-end',
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
    marginRight: 4,
  },
  composer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  imagePreviewWrap: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    marginHorizontal: spacing.lg,
  },
  imagePreview: {
    width: 72,
    height: 72,
    borderRadius: radii.md,
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  imageButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFEDE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 13,
    color: colors.textPrimary,
  },
  micButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    paddingTop: spacing.xs,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm,
  },
  actionButtonText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
