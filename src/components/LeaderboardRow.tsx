import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Avatar from './Avatar';
import { colors, radii, spacing } from '../theme';

type Props = {
  rank: number;
  name: string;
  avatar: string;
  points: string;
  highlighted?: boolean;
};

export default function LeaderboardRow({ rank, name, avatar, points, highlighted }: Props) {
  return (
    <View style={[styles.row, highlighted && styles.rowHighlighted]}>
      <Text style={styles.rank}>{rank}</Text>
      <Avatar uri={avatar} size={36} />
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.points}>{points}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.md,
  },
  rowHighlighted: {
    backgroundColor: '#FFEDE3',
  },
  rank: {
    width: 18,
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  name: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  points: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textSecondary,
  },
});
