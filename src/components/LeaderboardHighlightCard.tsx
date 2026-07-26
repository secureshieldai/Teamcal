import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../theme';

type Props = {
  name: string;
  rankLabel: string;
  points: string;
};

export default function LeaderboardHighlightCard({ name, rankLabel, points }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.rank}>{rankLabel}</Text>
      </View>
      <View style={styles.right}>
        <Ionicons name="trophy" size={22} color={colors.white} />
        <Text style={styles.points}>{points}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {},
  name: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '800',
  },
  rank: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  right: {
    alignItems: 'flex-end',
  },
  points: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 6,
  },
});
