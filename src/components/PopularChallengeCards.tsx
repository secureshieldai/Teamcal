import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../theme';

type Challenge = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  joined: string;
};

type Props = {
  challenges: Challenge[];
  onPressChallenge?: (id: string) => void;
};

export default function PopularChallengeCards({ challenges, onPressChallenge }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list}>
      {challenges.map((challenge) => (
        <TouchableOpacity
          key={challenge.id}
          style={styles.card}
          onPress={() => onPressChallenge?.(challenge.id)}
          activeOpacity={0.85}
        >
          <View style={styles.iconCircle}>
            <Ionicons name={challenge.icon} size={18} color={colors.primary} />
          </View>
          <Text style={styles.title} numberOfLines={2}>
            {challenge.title}
          </Text>
          <Text style={styles.joined}>{challenge.joined}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  card: {
    width: 132,
    height: 132,
    backgroundColor: colors.navy,
    borderRadius: radii.xl,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
    lineHeight: 18,
  },
  joined: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
});
