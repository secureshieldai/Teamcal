import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing } from '../../theme';
import { useApiQuery } from '../../hooks/useApiQuery';
import { workoutsService, type Recommendation } from '../../services/api/workouts.service';

const TAG_COLORS: Record<string, { bg: string; fg: string }> = {
  blue: { bg: '#DBEAFE', fg: '#3E7BFA' },
  purple: { bg: '#EDE9FE', fg: '#7C5CFC' },
  green: { bg: '#DCFCE7', fg: colors.success },
};

type Props = {
  onClose: () => void;
};

export default function RecommendationsScreen({ onClose }: Props) {
  const { data: insights, loading } = useApiQuery(() => workoutsService.getRecommendations(), [] as Recommendation[], []);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Recommendations</Text>
          <Text style={styles.headerSubtitle}>AI insights from your TeamCal data</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <Text style={styles.empty}>Loading…</Text>
        ) : (
          insights.map((insight) => {
            const palette = TAG_COLORS[insight.tagColor] || TAG_COLORS.blue;
            return (
              <View key={insight.title} style={[styles.card, shadow.soft]}>
                <View style={[styles.icon, { backgroundColor: palette.bg }]}>
                  <Ionicons name="flash" size={18} color={palette.fg} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.titleRow}>
                    <Text style={styles.title}>{insight.title}</Text>
                    <View style={[styles.tag, { backgroundColor: palette.bg }]}>
                      <Text style={[styles.tagText, { color: palette.fg }]}>{insight.tag}</Text>
                    </View>
                  </View>
                  <Text style={styles.description}>{insight.description}</Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
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
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    marginTop: spacing.xl,
  },
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  title: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  tag: {
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  description: {
    fontSize: 12.5,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
});
