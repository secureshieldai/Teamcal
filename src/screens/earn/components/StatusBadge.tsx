import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radii } from '../../../theme';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Published: { bg: '#E6F9EF', text: colors.success },
  Completed: { bg: '#E6F9EF', text: colors.success },
  Active: { bg: '#E6F9EF', text: colors.success },
  Subscribed: { bg: '#E6F9EF', text: colors.success },
  Draft: { bg: '#FFF3E0', text: '#E68A00' },
  Pending: { bg: '#FFF3E0', text: '#E68A00' },
  Processing: { bg: '#FFF3E0', text: '#E68A00' },
  Uploading: { bg: '#FFF3E0', text: '#E68A00' },
  'Free Trial': { bg: '#FFF3E0', text: '#E68A00' },
  Scheduled: { bg: '#EAE6FF', text: '#7C5CFC' },
  Joined: { bg: '#EAE6FF', text: '#7C5CFC' },
  'Under Review': { bg: '#E5F0FF', text: colors.macroFat },
  'Monetization Review': { bg: '#E5F0FF', text: colors.macroFat },
  Invited: { bg: '#E5F0FF', text: colors.macroFat },
  Paused: { bg: '#F3D9CB', text: colors.primaryDark },
  Unpublished: { bg: '#FFF3E0', text: '#E68A00' },
  Failed: { bg: '#FDE7E9', text: colors.macroProtein },
  Reversed: { bg: '#FDE7E9', text: colors.macroProtein },
  Rejected: { bg: '#FDE7E9', text: colors.macroProtein },
  Restricted: { bg: '#FDE7E9', text: colors.macroProtein },
  Archived: { bg: colors.border, text: colors.textSecondary },
  Inactive: { bg: colors.border, text: colors.textSecondary },
};

export default function StatusBadge({ status }: { status: string }) {
  const raw = typeof status === 'string' ? status : String(status ?? 'Unknown');
  const label = raw.split('-').map((part) => part ? part[0].toUpperCase() + part.slice(1) : part).join(' ');
  const palette = STATUS_COLORS[label] ?? { bg: colors.border, text: colors.textSecondary };
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.text, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});
