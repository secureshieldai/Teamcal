import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../../theme';

// Placeholder for the top-nav "Games" destination — where users will play
// TeamCal's own games directly. Distinct from the Social Feed's "Games" sub-tab
// (GamesTab.tsx), which is the discussions/tournaments feed for those games.
// This stays a simple placeholder until the 10 TeamCal games are built and
// ready to integrate here.
export default function PlayGamesTab() {
  return (
    <View style={styles.container}>
      <View style={styles.icon}>
        <Ionicons name="game-controller-outline" size={28} color={colors.primary} />
      </View>
      <Text style={styles.title}>Games are coming soon</Text>
      <Text style={styles.subtitle}>Play TeamCal's own games right here once they launch.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    gap: spacing.sm,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: radii.pill,
    backgroundColor: '#FFEDE3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
});
