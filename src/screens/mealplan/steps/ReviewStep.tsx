import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radii, shadow, spacing } from '../../../theme';
import { WizardFooter, WizardStepHeader } from './shared';

type Props = {
  durationDays: number;
  dailyCalories: number;
  mealTypes: string[];
  dietaryRestrictions: string[];
  dietPreference: string;
  allergies: string[];
  healthConditions: string[];
  notes: string;
  generating: boolean;
  onBack: () => void;
  onGenerate: () => void;
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function ReviewStep({
  durationDays,
  dailyCalories,
  mealTypes,
  dietaryRestrictions,
  dietPreference,
  allergies,
  healthConditions,
  notes,
  generating,
  onBack,
  onGenerate,
}: Props) {
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <WizardStepHeader title="Review your meal plan settings" subtitle="You can edit later from the dashboard." />

      <View style={[styles.card, shadow.card]}>
        <Row label="DURATION" value={`${durationDays} Day${durationDays === 1 ? '' : 's'}`} />
        <Row label="DAILY CALORIES" value={`${dailyCalories.toLocaleString()} kcal`} />
        <Row label="MEALS" value={mealTypes.map(cap).join(', ') || '—'} />
        <Row label="DIETARY RESTRICTIONS" value={dietaryRestrictions.length ? dietaryRestrictions.join(', ') : 'None'} />
        <Row label="DIET PREFERENCE" value={dietPreference || '—'} />
        <Row label="ALLERGIES" value={allergies.length ? allergies.join(', ') : 'None'} />
        <Row label="HEALTH CONDITIONS" value={healthConditions.length ? healthConditions.join(', ') : 'None'} />
        <View style={[styles.row, { borderBottomWidth: 0 }]}>
          <Text style={styles.rowLabel}>NOTES</Text>
          <Text style={styles.rowValue}>{notes.trim() ? notes.trim() : '—'}</Text>
        </View>
      </View>

      <WizardFooter
        onBack={onBack}
        onNext={onGenerate}
        nextLabel={generating ? 'Generating…' : 'Generate Meal Plan'}
        nextIcon="sparkles"
        nextDisabled={generating}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.4,
    paddingTop: 2,
  },
  rowValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
