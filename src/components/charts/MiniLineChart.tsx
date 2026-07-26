import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { colors, spacing } from '../../theme';

type Props = {
  values: number[];
  labels: string[];
  width?: number;
  height?: number;
};

export default function MiniLineChart({ values, labels, width = 280, height = 90 }: Props) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / (values.length - 1);

  const points = values
    .map((value, i) => {
      const x = i * stepX;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <View>
      <Svg width={width} height={height}>
        <Polyline points={points} fill="none" stroke={colors.primary} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {values.map((value, i) => {
          const x = i * stepX;
          const y = height - ((value - min) / range) * height;
          return <Circle key={i} cx={x} cy={y} r={3} fill={colors.primary} />;
        })}
      </Svg>
      <View style={styles.labelRow}>
        {labels.map((label) => (
          <Text key={label} style={styles.label}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  label: {
    fontSize: 9,
    color: colors.textMuted,
  },
});
