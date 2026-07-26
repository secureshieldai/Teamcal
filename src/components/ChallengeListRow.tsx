import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, shadow, spacing } from '../theme';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  duration: string;
  joinedCount: string;
};

export default function ChallengeListRow({ icon, iconColor = colors.primary, title, duration, joinedCount }: Props) {
  return (
    <TouchableOpacity style={[styles.row, shadow.soft]} activeOpacity={0.8}>
      <View style={[styles.iconCircle, { backgroundColor: `${iconColor}1F` }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.info}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.duration}>{duration}</Text>
      </View>
      <Text style={styles.joined}>{joinedCount} joined</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  title: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  duration: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  joined: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.textSecondary,
  },
});
