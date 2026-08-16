import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import type { MealType } from '../../../services/api/mealplan.service';
import { MEAL_TYPE_META } from '../../../data/mealPlanWizardData';
import { spacing } from '../../../theme';
import { IconOptionRow, WizardFooter, WizardStepHeader } from './shared';

const OPTIONS = MEAL_TYPE_META;

type Props = {
  value: MealType[];
  onChange: (v: MealType[]) => void;
  onBack: () => void;
  onNext: () => void;
};

export default function MealTypesStep({ value, onChange, onBack, onNext }: Props) {
  const toggle = (id: MealType) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <WizardStepHeader title="Which meals should we plan?" subtitle="Select every meal you'd like included." />
      {OPTIONS.map((opt) => (
        <IconOptionRow key={opt.id} icon={opt.icon} label={opt.label} selected={value.includes(opt.id)} onPress={() => toggle(opt.id)} />
      ))}
      <WizardFooter onBack={onBack} onNext={onNext} nextDisabled={value.length === 0} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
});
