import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../../theme';

type Props = {
  onCreate: () => void;
};

export default function MealPlannerEmptyState({ onCreate }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.graphicCard}>
        <Ionicons name="restaurant" size={48} color={colors.primary} />
        <View style={styles.sparkleBadge}>
          <Ionicons name="sparkles" size={16} color={colors.primary} />
        </View>
      </View>

      <Text style={styles.title}>Create your first meal plan</Text>
      <Text style={styles.subtitle}>
        Answer a few quick questions and Blaze will generate a personalized meal plan based on your goals, preferences, lifestyle,
        dietary needs, and health information.
      </Text>

      <TouchableOpacity style={styles.cta} onPress={onCreate} activeOpacity={0.85}>
        <Ionicons name="sparkles" size={17} color={colors.white} />
        <Text style={styles.ctaText}>Create Meal Plan</Text>
      </TouchableOpacity>
      <Text style={styles.caption}>Takes less than a minute.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  graphicCard: {
    width: 160,
    height: 160,
    borderRadius: radii.xl,
    backgroundColor: '#FDECE4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  sparkleBadge: {
    position: 'absolute',
    top: 16,
    right: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13.5,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radii.pill,
    paddingVertical: spacing.md + 2,
    paddingHorizontal: spacing.xxl,
    width: '100%',
  },
  ctaText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 16,
  },
  caption: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
});
