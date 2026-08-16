import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { spacing } from '../theme';
import { useJournal } from '../hooks/useJournal';
import { LIVE_CALL_QUESTIONS } from '../data/journalData';
import type { RootStackParamList } from '../navigation/types';

function formatTimer(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function LiveJournalCallScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { saveEntry } = useJournal();

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);

  const [questionIndex, setQuestionIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [ending, setEnding] = useState(false);
  const finishedRef = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const finishCall = async (count: number) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setEnding(true);
    try {
      if (recorderState.isRecording) await recorder.stop();
    } catch {
      // ignore — nothing to stop
    }
    await saveEntry({
      text:
        count >= LIVE_CALL_QUESTIONS.length
          ? 'Completed a full live journaling call with Blaze.'
          : `Completed ${count}/${LIVE_CALL_QUESTIONS.length} questions on a live journaling call.`,
      mood: 'okay',
      type: 'live-call',
    });
    navigation.goBack();
  };

  const toggleMic = async () => {
    if (recorderState.isRecording) {
      await recorder.stop();
      const nextCount = answeredCount + 1;
      setAnsweredCount(nextCount);
      if (questionIndex + 1 >= LIVE_CALL_QUESTIONS.length) {
        finishCall(nextCount);
      } else {
        setQuestionIndex((i) => i + 1);
      }
      return;
    }
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) return;
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch {
      // mic unavailable — user can still tap "skip" via hang up
    }
  };

  return (
    <LinearGradient colors={['#1B1533', '#3B1E4D', '#5A2A6B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerCaption}>LIVE JOURNALING CALL</Text>
          <Text style={styles.headerSubtitle}>with Blaze · {formatTimer(elapsed)}</Text>
        </View>
        <TouchableOpacity style={styles.hangUpBtn} onPress={() => finishCall(answeredCount)} disabled={ending}>
          <Ionicons name="close" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.center}>
        <LinearGradient colors={['#FF9F5A', '#8B5CF6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
          <Text style={styles.avatarText}>B</Text>
        </LinearGradient>

        <Text style={styles.questionCounter}>
          QUESTION {Math.min(questionIndex + 1, LIVE_CALL_QUESTIONS.length)} OF {LIVE_CALL_QUESTIONS.length}
        </Text>
        <Text style={styles.questionText}>{ending ? 'Wrapping up your entry…' : LIVE_CALL_QUESTIONS[questionIndex]}</Text>

        <TouchableOpacity
          style={[styles.micBtn, recorderState.isRecording && styles.micBtnActive]}
          onPress={toggleMic}
          disabled={ending}
          activeOpacity={0.85}
        >
          <Ionicons name={recorderState.isRecording ? 'stop' : 'mic'} size={26} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.micHint}>{recorderState.isRecording ? 'Recording… tap to stop' : ending ? '' : 'Tap the mic to speak'}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 54, paddingHorizontal: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  headerCaption: { fontSize: 10.5, fontWeight: '700', color: 'rgba(255,255,255,0.55)', letterSpacing: 0.6 },
  headerSubtitle: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', marginTop: 2 },
  hangUpBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#E8425A', alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  avatar: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  avatarText: { fontSize: 34, fontWeight: '800', color: '#FFFFFF' },
  questionCounter: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.55)', letterSpacing: 0.6 },
  questionText: { fontSize: 19, fontWeight: '700', color: '#FFFFFF', textAlign: 'center', lineHeight: 27, paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
  micBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  micBtnActive: { backgroundColor: '#E8425A' },
  micHint: { fontSize: 12.5, color: 'rgba(255,255,255,0.6)', marginTop: spacing.sm },
});
