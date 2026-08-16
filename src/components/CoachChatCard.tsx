import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../theme';

type Props = {
  onOpenChat?: () => void;
};

export default function CoachChatCard({ onOpenChat }: Props) {
  return (
    <View style={styles.section}>
      <TouchableOpacity style={styles.card} onPress={onOpenChat} activeOpacity={0.85}>
        <View style={styles.icon}>
          <Ionicons name="chatbubbles" size={26} color={colors.white} />
        </View>
        <View style={styles.info}>
          <Text style={styles.title}>Chat with TeamCal Coach</Text>
          <Text style={styles.subtitle}>Ask questions, get feedback, or jump on a live call.</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: '#FDECE4',
    borderRadius: radii.xl,
    padding: spacing.lg,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
});
