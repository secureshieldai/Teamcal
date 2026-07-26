import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Avatar from './Avatar';
import { colors, spacing } from '../theme';

type Props = {
  name: string;
  handle: string;
  avatar: string;
  level: number;
  levelProgress: number;
  points: string;
};

export default function ProfileHeaderCard({ name, handle, avatar, level, levelProgress, points }: Props) {
  return (
    <View style={styles.row}>
      <Avatar uri={avatar} size={64} />
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.handle}>{handle}</Text>
        <View style={styles.levelRow}>
          <Text style={styles.levelLabel}>Level {level}</Text>
          <Text style={styles.points}>{points} pts</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${levelProgress}%` }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  handle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  levelLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  points: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  progressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.ringTrack,
    marginTop: spacing.xs,
  },
  progressFill: {
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
});
