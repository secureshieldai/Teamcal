import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Avatar from './Avatar';
import { colors, radii, spacing } from '../theme';

type Props = {
  rank: number;
  name: string;
  avatar: string;
  points: string;
};

export default function YourRankCard({ rank, name, avatar, points }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.rank}>#{rank}</Text>
      <Avatar uri={avatar} size={32} />
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.points}>{points}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.navy,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rank: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
  name: {
    flex: 1,
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  points: {
    color: colors.primary,
    fontSize: 13.5,
    fontWeight: '800',
  },
});
