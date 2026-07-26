import React from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../../theme';

export type TitleSegment = { text: string; highlighted?: boolean };

type Props = {
  step: number;
  total: number;
  showSkip?: boolean;
  onSkip?: () => void;
  title: TitleSegment[];
  subtitle: string;
  illustration: React.ReactNode;
  footer: React.ReactNode;
};

export default function OnboardingLayout({ step, total, showSkip, onSkip, title, subtitle, illustration, footer }: Props) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.topRow}>
        <View style={styles.dots}>
          {Array.from({ length: total }).map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </View>
        {showSkip ? (
          <TouchableOpacity onPress={onSkip} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.skip}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 30 }} />
        )}
      </View>

      <View style={styles.illustrationArea}>{illustration}</View>

      <View style={styles.textArea}>
        <Text style={styles.title}>
          {title.map((segment, i) => (
            <Text key={i} style={segment.highlighted ? styles.titleHighlight : undefined}>
              {segment.text}
            </Text>
          ))}
        </Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={styles.footer}>{footer}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
  },
  dots: {
    flexDirection: 'row',
    gap: 5,
    flex: 1,
    marginRight: spacing.md,
  },
  dot: {
    width: 14,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 22,
  },
  skip: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  illustrationArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.lg,
  },
  textArea: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.navy,
    lineHeight: 32,
  },
  titleHighlight: {
    color: colors.primary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  footer: {
    paddingBottom: spacing.md,
  },
});
