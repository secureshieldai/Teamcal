import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radii } from '../../theme';

export default function MiniBarChart({ values, height = 90 }: { values: number[]; height?: number }) {
  const max = Math.max(...values);

  return (
    <View style={[styles.row, { height }]}>
      {values.map((value, i) => (
        <View
          key={i}
          style={[
            styles.bar,
            {
              height: Math.max(6, (value / max) * height),
              backgroundColor: i === values.length - 1 ? colors.primary : colors.ringTrack,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  bar: {
    flex: 1,
    borderRadius: radii.sm,
  },
});
