import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { spacing } from '../../../theme';
import { OptionCard, WizardFooter, WizardStepHeader } from './shared';

const OPTIONS: { label: string; days: number; sublabel?: string }[] = [
  { label: '24 Hours', days: 1 },
  { label: '3 Days', days: 3 },
  { label: '7 Days', days: 7, sublabel: 'Recommended' },
  { label: '14 Days', days: 14 },
  { label: '30 Days', days: 30 },
  { label: '90 Days', days: 90 },
];

type Props = {
  value: number;
  onChange: (v: number) => void;
  onNext: () => void;
};

export default function DurationStep({ value, onChange, onNext }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <WizardStepHeader title="How long should we plan your meals?" subtitle="Choose how long you'd like your meal plan to cover." />
      {OPTIONS.map((opt) => (
        <OptionCard key={opt.days} label={opt.label} sublabel={opt.sublabel} selected={value === opt.days} onPress={() => onChange(opt.days)} />
      ))}
      <WizardFooter onNext={onNext} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
});
