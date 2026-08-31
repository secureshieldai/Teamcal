import React from 'react';
import { StyleSheet, View } from 'react-native';
import StatTile from './StatTile';
import { spacing } from '../theme';
import type { Ionicons } from '@expo/vector-icons';

type Tile = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  goal: string;
  onPress?: () => void;
};

export default function StatTilesRow({ tiles }: { tiles: Tile[] }) {
  return (
    <View style={styles.row}>
      {tiles.map((tile) => (
        <StatTile key={tile.id} icon={tile.icon} label={tile.label} value={tile.value} goal={tile.goal} onPress={tile.onPress} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
});
