import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii, shadow, spacing } from '../../theme';
import { fastingService } from '../../services/api/fasting.service';
import { coachService } from '../../services/api/coach.service';

const RECOMMENDATIONS = [
  { label: 'Hydrate every 90 min', tag: 'During fast' },
  { label: 'Break with protein + fat', tag: 'Refeed' },
  { label: 'Skip long fasts on workout days', tag: 'Training' },
  { label: 'Sleep 7h+ to preserve muscle', tag: 'Recovery' },
];

export default function FastingAITab() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [active, history] = await Promise.all([
        fastingService.getActive(),
        fastingService.getHistory(5),
      ]);
      const fastHours = active ? (Date.now() - active.started_at) / 3_600_000 : 0;
      const prompt = history.length
        ? `I've completed ${history.length} recent fasts, most recently a ${history[0].protocol} fast. Give me one short, encouraging, personalized welcome message about my fasting habit.`
        : "I'm new to fasting and haven't logged a fast yet. Give me one short, encouraging welcome message suggesting an easy protocol to start with.";
      const { reply } = await coachService.sendMessage(prompt, { fastHours });
      setMessage(reply);
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
          <Text style={styles.headerTitle}>Blaze fasting AI</Text>
          <Text style={styles.headerSubtitle}>Personalized to your history</Text>
        </View>
      </LinearGradient>

      <View style={[styles.card, shadow.card]}>
        <View style={styles.welcomeHeader}>
          <View style={styles.welcomeIcon}>
            <Ionicons name="sparkles" size={16} color={colors.navy} />
          </View>
          <Text style={styles.welcomeTitle}>Welcome</Text>
          <TouchableOpacity onPress={generate} disabled={loading} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="refresh" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.spinner} />
        ) : error ? (
          <Text style={styles.welcomeError}>Unable to generate a message: {error}</Text>
        ) : (
          <Text style={styles.welcomeMessage}>{message}</Text>
        )}
      </View>

      <View style={[styles.card, shadow.card]}>
        <Text style={styles.sectionLabel}>RECOMMENDATIONS</Text>
        {RECOMMENDATIONS.map((r) => (
          <View key={r.label} style={styles.recRow}>
            <Text style={styles.recLabel}>{r.label}</Text>
            <View style={styles.recTag}>
              <Text style={styles.recTagText}>{r.tag}</Text>
            </View>
          </View>
        ))}
      </View>
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
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  welcomeIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EDEDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeTitle: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  spinner: {
    marginTop: spacing.lg,
  },
  welcomeMessage: {
    fontSize: 13.5,
    lineHeight: 21,
    color: colors.textPrimary,
    marginTop: spacing.md,
  },
  welcomeError: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  sectionLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  recRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  recLabel: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  recTag: {
    backgroundColor: colors.background,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  recTagText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textSecondary,
  },
});
