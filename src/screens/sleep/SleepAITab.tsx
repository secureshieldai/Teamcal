import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing } from '../../theme';
import { useApiQuery } from '../../hooks/useApiQuery';
import { sleepService, type SleepInsight } from '../../services/api/sleep.service';

const ICON_COLORS: Record<string, { bg: string; fg: string }> = {
  'trending-up': { bg: '#DCFCE7', fg: colors.success },
  flash: { bg: '#FEF3C7', fg: '#D97706' },
  moon: { bg: '#FDECE4', fg: colors.primary },
};

export default function SleepAITab() {
  const { data: insights, loading } = useApiQuery(() => sleepService.getInsights(), [] as SleepInsight[], []);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {loading ? (
        <Text style={styles.empty}>Loading…</Text>
      ) : (
        insights.map((insight) => {
          const palette = ICON_COLORS[insight.icon] || ICON_COLORS.moon;
          return (
            <View key={insight.title} style={[styles.card, shadow.soft]}>
              <View style={[styles.icon, { backgroundColor: palette.bg }]}>
                <Ionicons name={insight.icon as never} size={18} color={palette.fg} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{insight.title}</Text>
                <Text style={styles.description}>{insight.description}</Text>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl },
  card: { flexDirection: 'row', gap: spacing.md, backgroundColor: colors.card, borderRadius: radii.xl, padding: spacing.lg },
  icon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 14.5, fontWeight: '800', color: colors.textPrimary },
  description: { fontSize: 12.5, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
});
