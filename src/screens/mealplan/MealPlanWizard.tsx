import React, { useState } from 'react';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import WizardStepIndicator from '../../components/WizardStepIndicator';
import DurationStep from './steps/DurationStep';
import CalorieTargetStep from './steps/CalorieTargetStep';
import MealTypesStep from './steps/MealTypesStep';
import ChipSelectStep from './steps/ChipSelectStep';
import NotesStep from './steps/NotesStep';
import ReviewStep from './steps/ReviewStep';
import { ALLERGIES, DIETARY_RESTRICTIONS, DIET_PREFERENCES, HEALTH_CONDITIONS } from '../../data/mealPlanWizardData';
import type { MealPlan, MealPlanPreferences, MealType } from '../../services/api/mealplan.service';
import { useAuth } from '../../context/AuthContext';
import { colors, spacing } from '../../theme';

const TOTAL_STEPS = 9;

type Props = {
  existingPlan: MealPlan | null;
  onClose: () => void;
  onSubmit: (prefs: MealPlanPreferences) => Promise<void>;
};

export default function MealPlanWizard({ existingPlan, onClose, onSubmit }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [generating, setGenerating] = useState(false);

  const [durationDays, setDurationDays] = useState(existingPlan?.duration_days ?? 7);
  const [dailyCalories, setDailyCalories] = useState(existingPlan?.daily_calories ?? (user?.goal_kcal || 2000));
  const [mealTypes, setMealTypes] = useState<MealType[]>(existingPlan?.meal_types ?? ['breakfast', 'lunch', 'dinner', 'snack']);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>(existingPlan?.dietary_restrictions ?? []);
  const [dietPreference, setDietPreference] = useState(existingPlan?.diet_preference ?? 'Balanced');
  const [allergies, setAllergies] = useState<string[]>(existingPlan?.allergies ?? []);
  const [healthConditions, setHealthConditions] = useState<string[]>(existingPlan?.health_conditions ?? []);
  const [notes, setNotes] = useState(existingPlan?.notes ?? '');
  const [voiceNoteUri, setVoiceNoteUri] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);

  const recommended = user?.goal_kcal || 2000;

  const goBack = () => setStep((s) => Math.max(1, s - 1));
  const goNext = () => setStep((s) => Math.min(TOTAL_STEPS, s + 1));

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await onSubmit({ durationDays, dailyCalories, mealTypes, dietaryRestrictions, dietPreference, allergies, healthConditions, notes });
    } catch (e) {
      Alert.alert('Unable to generate meal plan', (e as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => (step === 1 ? onClose() : goBack())} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>
      <View style={styles.indicatorWrap}>
        <WizardStepIndicator currentStep={step} totalSteps={TOTAL_STEPS} />
      </View>

      {step === 1 && <DurationStep value={durationDays} onChange={setDurationDays} onNext={goNext} />}

      {step === 2 && (
        <CalorieTargetStep value={dailyCalories} onChange={setDailyCalories} recommended={recommended} onBack={goBack} onNext={goNext} />
      )}

      {step === 3 && <MealTypesStep value={mealTypes} onChange={setMealTypes} onBack={goBack} onNext={goNext} />}

      {step === 4 && (
        <ChipSelectStep
          title="Dietary restrictions"
          subtitle="Select any dietary restrictions that apply."
          options={DIETARY_RESTRICTIONS}
          value={dietaryRestrictions}
          onChange={setDietaryRestrictions}
          mode="multi"
          onBack={goBack}
          onNext={goNext}
        />
      )}

      {step === 5 && (
        <ChipSelectStep
          title="Diet preference"
          subtitle="What type of eating style best matches your goals?"
          options={DIET_PREFERENCES}
          value={[dietPreference]}
          onChange={(v) => setDietPreference(v[0] ?? 'Balanced')}
          mode="single"
          solid
          onBack={goBack}
          onNext={goNext}
        />
      )}

      {step === 6 && (
        <ChipSelectStep
          title="Do you have any food allergies?"
          subtitle="Select any allergies that apply."
          options={ALLERGIES}
          value={allergies}
          onChange={setAllergies}
          mode="multi"
          onBack={goBack}
          onNext={goNext}
        />
      )}

      {step === 7 && (
        <ChipSelectStep
          title="Health conditions"
          subtitle="Select any that apply. This helps Blaze create safer and healthier meal recommendations. (Optional)"
          options={HEALTH_CONDITIONS}
          value={healthConditions}
          onChange={setHealthConditions}
          mode="multi"
          onBack={goBack}
          onNext={goNext}
        />
      )}

      {step === 8 && (
        <NotesStep
          notes={notes}
          setNotes={setNotes}
          voiceNoteUri={voiceNoteUri}
          setVoiceNoteUri={setVoiceNoteUri}
          images={images}
          setImages={setImages}
          onBack={goBack}
          onNext={goNext}
        />
      )}

      {step === 9 && (
        <ReviewStep
          durationDays={durationDays}
          dailyCalories={dailyCalories}
          mealTypes={mealTypes}
          dietaryRestrictions={dietaryRestrictions}
          dietPreference={dietPreference}
          allergies={allergies}
          healthConditions={healthConditions}
          notes={notes}
          generating={generating}
          onBack={goBack}
          onGenerate={handleGenerate}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm },
  indicatorWrap: { paddingHorizontal: spacing.lg },
});
