import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { spacing } from '../../../theme';
import { Chip, ChipWrap, WizardFooter, WizardStepHeader } from './shared';

type Props = {
  title: string;
  subtitle: string;
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
  mode: 'single' | 'multi';
  solid?: boolean;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
};

export default function ChipSelectStep({ title, subtitle, options, value, onChange, mode, solid, onBack, onNext, nextLabel }: Props) {
  const toggle = (opt: string) => {
    if (mode === 'single') {
      onChange([opt]);
      return;
    }
    onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <WizardStepHeader title={title} subtitle={subtitle} />
      <ChipWrap>
        {options.map((opt) => (
          <Chip key={opt} label={opt} selected={value.includes(opt)} solid={solid} onPress={() => toggle(opt)} />
        ))}
      </ChipWrap>
      <WizardFooter onBack={onBack} onNext={onNext} nextLabel={nextLabel} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
});
