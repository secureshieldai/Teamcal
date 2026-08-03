import React from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';

export type TitleSegment = { text: string; highlighted?: boolean };

type Props = {
  title: TitleSegment[];
  subtitle: string;
  illustration: React.ReactNode;
  footer: React.ReactNode;
};

export default function OnboardingLayout({ title, subtitle, illustration, footer }: Props) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

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
  illustrationArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  textArea: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  titleHighlight: {
    color: colors.primary,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 21,
  },
  footer: {
    paddingBottom: spacing.md,
  },
});
