import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../../../theme';
import { Chip, ChipWrap, WizardFooter, WizardStepHeader } from '../../mealplan/steps/shared';

const GOAL_CHIPS = ['Bigger glutes', 'Visible abs', 'Lose belly fat', 'Broader shoulders', 'Stronger legs', 'Toned arms'];

type Props = {
  goals: string;
  onChangeGoals: (v: string) => void;
  voiceNoteUri: string | null;
  onChangeVoiceNoteUri: (v: string | null) => void;
  generating: boolean;
  onBack: () => void;
  onGenerate: () => void;
};

export default function GoalsStep({ goals, onChangeGoals, voiceNoteUri, onChangeVoiceNoteUri, generating, onBack, onGenerate }: Props) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);

  const appendGoal = (label: string) => {
    if (goals.toLowerCase().includes(label.toLowerCase())) return;
    onChangeGoals(goals.trim() ? `${goals.trim()}. ${label}` : label);
  };

  const toggleRecording = async () => {
    if (recorderState.isRecording) {
      try {
        await recorder.stop();
        onChangeVoiceNoteUri(recorder.uri ?? null);
        await setAudioModeAsync({ allowsRecording: false });
      } catch (e) {
        Alert.alert('Unable to stop recording', (e as Error).message);
      }
      return;
    }
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Microphone access needed', 'Allow microphone access to dictate your goals.');
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (e) {
      Alert.alert('Unable to start recording', (e as Error).message);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <WizardStepHeader title="2. Your goals" />

      <TextInput
        style={styles.textArea}
        value={goals}
        onChangeText={onChangeGoals}
        placeholder="I want bigger glutes and visible abs..."
        placeholderTextColor={colors.textMuted}
        multiline
      />

      <TouchableOpacity style={[styles.voiceBtn, recorderState.isRecording && styles.voiceBtnActive]} onPress={toggleRecording}>
        <Ionicons name={recorderState.isRecording ? 'stop-circle' : 'mic-outline'} size={18} color={recorderState.isRecording ? colors.primary : colors.textPrimary} />
        <Text style={[styles.voiceBtnText, recorderState.isRecording && { color: colors.primary }]}>
          {recorderState.isRecording ? 'Stop recording' : voiceNoteUri ? 'Voice note added · Dictate again' : 'Dictate with voice'}
        </Text>
      </TouchableOpacity>

      <ChipWrap>
        {GOAL_CHIPS.map((label) => (
          <Chip key={label} label={label} selected={goals.toLowerCase().includes(label.toLowerCase())} onPress={() => appendGoal(label)} />
        ))}
      </ChipWrap>

      <WizardFooter
        onBack={onBack}
        onNext={onGenerate}
        nextLabel={generating ? 'Generating…' : 'Generate plan'}
        nextIcon="sparkles"
        nextDisabled={generating || !goals.trim()}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  textArea: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    minHeight: 90,
    textAlignVertical: 'top',
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  voiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  voiceBtnActive: {
    borderColor: colors.primary,
    backgroundColor: '#FFF3EC',
  },
  voiceBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
