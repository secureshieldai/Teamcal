import React from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../../../theme';

type Props = {
  notes: string;
  setNotes: (v: string) => void;
  voiceNoteUri: string | null;
  setVoiceNoteUri: (v: string | null) => void;
  images: string[];
  setImages: (v: string[]) => void;
  onBack: () => void;
  onNext: () => void;
};

function formatDuration(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export default function NotesStep({ notes, setNotes, voiceNoteUri, setVoiceNoteUri, images, setImages, onBack, onNext }: Props) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const player = useAudioPlayer(voiceNoteUri ?? undefined);
  const playerStatus = useAudioPlayerStatus(player);

  const startRecording = async () => {
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Microphone access needed', 'Allow microphone access to record a voice note.');
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      setVoiceNoteUri(null);
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (e) {
      Alert.alert('Unable to start recording', (e as Error).message);
    }
  };

  const stopRecording = async () => {
    try {
      await recorder.stop();
      setVoiceNoteUri(recorder.uri ?? null);
      await setAudioModeAsync({ allowsRecording: false });
    } catch (e) {
      Alert.alert('Unable to stop recording', (e as Error).message);
    }
  };

  const togglePlayback = () => {
    if (playerStatus.playing) player.pause();
    else player.play();
  };

  const pickImages = async () => {
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsMultipleSelection: true });
    if (!picked.canceled) setImages([...images, ...picked.assets.map((a) => a.uri)]);
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.helper}>
        You can tell Blaze about foods you love, foods you dislike, allergies, cooking skills, budget, lifestyle, current diet,
        medical conditions, health goals, or anything else you'd like us to know.
      </Text>

      <TextInput
        style={styles.textArea}
        value={notes}
        onChangeText={setNotes}
        placeholder="I love spicy food but dislike mushrooms. I usually cook in under 20 minutes and I'm trying to lose weight."
        placeholderTextColor={colors.textMuted}
        multiline
      />

      {recorderState.isRecording ? (
        <TouchableOpacity style={[styles.secondaryBtn, styles.recordingBtn]} onPress={stopRecording}>
          <Ionicons name="stop-circle" size={18} color={colors.primary} />
          <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>
            Stop recording · {formatDuration(recorderState.durationMillis || 0)}
          </Text>
        </TouchableOpacity>
      ) : voiceNoteUri ? (
        <View style={styles.voiceRow}>
          <TouchableOpacity style={styles.voicePlayBtn} onPress={togglePlayback}>
            <Ionicons name={playerStatus.playing ? 'pause' : 'play'} size={16} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.voiceLabel}>Voice note recorded</Text>
          <TouchableOpacity onPress={() => setVoiceNoteUri(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.secondaryBtn} onPress={startRecording}>
          <Ionicons name="mic-outline" size={18} color={colors.textPrimary} />
          <Text style={styles.secondaryBtnText}>Record voice note</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.secondaryBtn} onPress={pickImages}>
        <Ionicons name="image-outline" size={18} color={colors.textPrimary} />
        <Text style={styles.secondaryBtnText}>Upload images</Text>
      </TouchableOpacity>

      {images.length > 0 && (
        <View style={styles.imageRow}>
          {images.map((uri, i) => (
            <View key={`${uri}-${i}`} style={styles.imageThumbWrap}>
              <Image source={{ uri }} style={styles.imageThumb} />
              <TouchableOpacity style={styles.imageRemove} onPress={() => setImages(images.filter((_, idx) => idx !== i))}>
                <Ionicons name="close" size={12} color={colors.white} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={styles.footerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.8}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryBtn} onPress={onNext} activeOpacity={0.85}>
          <Text style={styles.primaryBtnText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  helper: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginBottom: spacing.lg },
  textArea: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    minHeight: 110,
    textAlignVertical: 'top',
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  recordingBtn: {
    borderColor: colors.primary,
    backgroundColor: '#FFF3EC',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  voiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  voicePlayBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFEDE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceLabel: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  imageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  imageThumbWrap: {
    width: 64,
    height: 64,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  imageThumb: {
    width: '100%',
    height: '100%',
  },
  imageRemove: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  backBtn: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
