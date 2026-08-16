import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../../../theme';
import { workoutsService, type ScanCoachPlan, type ScanCoachRoutine } from '../../../services/api/workouts.service';
import BodyScanStep from './BodyScanStep';
import GoalsStep from './GoalsStep';
import ResultsStep from './ResultsStep';

const TOTAL_STEPS = 3;

function SegmentedProgress({ step }: { step: number }) {
  return (
    <View style={styles.segmentRow}>
      {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
        <View key={i} style={[styles.segment, i < step && styles.segmentActive]} />
      ))}
    </View>
  );
}

type Props = {
  onClose: () => void;
  onSaved: () => void;
};

export default function ScanCoachScreen({ onClose, onSaved }: Props) {
  const [step, setStep] = useState(1);
  const [bodyArea, setBodyArea] = useState('Full body');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [goals, setGoals] = useState('');
  const [voiceNoteUri, setVoiceNoteUri] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [plan, setPlan] = useState<ScanCoachPlan | null>(null);

  const generate = async () => {
    setGenerating(true);
    try {
      const result = await workoutsService.scanCoachGenerate([bodyArea], goals, photoUri);
      setPlan(result.plan);
      setStep(3);
    } catch (e) {
      Alert.alert('Unable to generate plan', (e as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  const save = async (routines: ScanCoachRoutine[]) => {
    setSaving(true);
    try {
      for (const routine of routines) {
        await workoutsService.create({
          title: routine.name,
          category: bodyArea.toLowerCase(),
          duration: routine.durationMin,
          scheduledDays: routine.scheduledDays,
          restDays: [],
          exercises: routine.exercises.map((ex, i) => ({ id: `${routine.name}-${i}`, name: ex.name, detail: `${ex.sets}×${ex.reps}`, sets: ex.sets, reps: ex.reps, restSeconds: ex.restSeconds, muscles: ex.muscles })),
        });
      }
      onSaved();
    } catch (e) {
      Alert.alert('Unable to save routines', (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (step === 1 ? onClose() : setStep((s) => s - 1))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Scan & Coach</Text>
          <Text style={styles.headerSubtitle}>AI body transformation</Text>
        </View>
      </View>

      <View style={styles.progressWrap}>
        <SegmentedProgress step={step} />
      </View>

      {step === 1 && (
        <BodyScanStep bodyArea={bodyArea} onChangeBodyArea={setBodyArea} photoUri={photoUri} onChangePhoto={setPhotoUri} onNext={() => setStep(2)} />
      )}
      {step === 2 && (
        <GoalsStep
          goals={goals}
          onChangeGoals={setGoals}
          voiceNoteUri={voiceNoteUri}
          onChangeVoiceNoteUri={setVoiceNoteUri}
          generating={generating}
          onBack={() => setStep(1)}
          onGenerate={generate}
        />
      )}
      {step === 3 && plan && (
        <ResultsStep plan={plan} saving={saving} onEdit={() => setStep(2)} onRegenerate={generate} onSave={save} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: colors.textSecondary,
    marginTop: 1,
  },
  progressWrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  segmentActive: {
    backgroundColor: colors.primary,
  },
});
