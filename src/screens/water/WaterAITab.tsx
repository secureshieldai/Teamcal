import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii, shadow, spacing } from '../../theme';
import { trackerService } from '../../services/api/tracker.service';
import { coachService } from '../../services/api/coach.service';

interface Insight {
  title: string;
  message: string;
}

const INSIGHT_STYLES: { icon: keyof typeof Ionicons.glyphMap; bg: string; color: string }[] = [
  { icon: 'water-outline', bg: '#FFEDE3', color: colors.primary },
  { icon: 'time-outline', bg: '#EAF4EC', color: colors.success },
  { icon: 'flash-outline', bg: '#EDEDF5', color: colors.navy },
];

function parseInsights(reply: string): Insight[] {
  try {
    const cleaned = reply.replace(/```json|```/g, '').trim();
    const match = cleaned.match(/\[[\s\S]*\]/);
    const parsed = JSON.parse(match ? match[0] : cleaned);
    if (Array.isArray(parsed) && parsed.length && parsed.every((p) => p && typeof p.title === 'string' && typeof p.message === 'string')) {
      return parsed;
    }
  } catch {
    // fall through to single-card fallback below
  }
  return [{ title: 'Hydration Insight', message: reply }];
}

export default function WaterAITab() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const today = await trackerService.getToday('water');
      const { reply } = await coachService.sendMessage(
        'Based on my hydration data today, give me 2 to 3 short, distinct, practical hydration insights. Respond with ONLY a JSON array, no markdown, no extra text — each item shaped like {"title": "max 4 words", "message": "1-2 sentence practical tip"}.',
        { hydrationMl: today.sum }
      );
      setInsights(parseInsights(reply));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    generate();
  }, [generate]);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#FFEDE3', '#FDE3CC']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerCard}>
        <View style={styles.headerIcon}>
          <Ionicons name="sparkles" size={18} color={colors.white} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Hydration coach</Text>
          <Text style={styles.headerSubtitle}>Adapts to your day</Text>
        </View>
        <TouchableOpacity onPress={generate} disabled={loading} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="refresh" size={18} color={colors.primary} />
        </TouchableOpacity>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={styles.spinner} />
      ) : error ? (
        <View style={[styles.card, shadow.card]}>
          <Text style={styles.error}>Unable to generate insights: {error}</Text>
        </View>
      ) : (
        insights.map((insight, i) => {
          const style = INSIGHT_STYLES[i % INSIGHT_STYLES.length];
          return (
            <View key={i} style={[styles.card, shadow.card]}>
              <View style={[styles.iconCircle, { backgroundColor: style.bg }]}>
                <Ionicons name={style.icon} size={18} color={style.color} />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>{insight.title}</Text>
                <Text style={styles.cardMessage}>{insight.message}</Text>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  spinner: {
    marginTop: spacing.xl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  cardMessage: {
    fontSize: 12.5,
    lineHeight: 19,
    color: colors.textSecondary,
    marginTop: 4,
  },
  error: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
