import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polygon, Polyline } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../../theme';

type Point = { ts: number; value: number };

type Props = {
  points: Point[];
  unit: string;
  width?: number;
  height?: number;
};

const AXIS_WIDTH = 34;
const BOTTOM_LABELS_HEIGHT = 20;
const GRID_LINES = 5;

export default function WeightTrendChart({ points, unit, width = 300, height = 160 }: Props) {
  if (points.length < 2) {
    return (
      <View style={[styles.empty, { width, height }]}>
        <View style={styles.emptyIcon}>
          <Ionicons name="analytics-outline" size={22} color={colors.primary} />
        </View>
        <Text style={styles.emptyText}>
          {points.length === 0
            ? 'No weigh-ins in this range yet.'
            : 'Log one more weigh-in to see your trend.'}
        </Text>
      </View>
    );
  }

  const values = points.map((p) => p.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const padding = Math.max((rawMax - rawMin) * 0.15, 1);
  const min = Math.floor(rawMin - padding);
  const max = Math.ceil(rawMax + padding);
  const range = max - min || 1;

  const plotWidth = width - AXIS_WIDTH;
  const plotHeight = height - BOTTOM_LABELS_HEIGHT;
  const stepX = plotWidth / (points.length - 1);

  const coords = points.map((p, i) => ({
    x: i * stepX,
    y: plotHeight - ((p.value - min) / range) * plotHeight,
  }));

  const linePoints = coords.map((c) => `${c.x},${c.y}`).join(' ');
  const areaPoints = `0,${plotHeight} ${linePoints} ${plotWidth},${plotHeight}`;

  const last = coords[coords.length - 1];
  const lastPoint = points[points.length - 1];

  const gridValues = Array.from({ length: GRID_LINES }, (_, i) => max - (range / (GRID_LINES - 1)) * i);

  const labelIndexes = Array.from(new Set([0, Math.round((points.length - 1) * 0.33), Math.round((points.length - 1) * 0.66), points.length - 1]));

  return (
    <View style={{ width, height: height + 24 }}>
      <View style={styles.row}>
        <View style={{ width: AXIS_WIDTH, height: plotHeight, justifyContent: 'space-between' }}>
          {gridValues.map((v, i) => (
            <Text key={i} style={styles.axisLabel}>
              {Math.round(v)}
            </Text>
          ))}
        </View>

        <View style={{ width: plotWidth, height: plotHeight }}>
          <Svg width={plotWidth} height={plotHeight}>
            {gridValues.map((_, i) => {
              const y = (plotHeight / (GRID_LINES - 1)) * i;
              return (
                <Line
                  key={i}
                  x1={0}
                  y1={y}
                  x2={plotWidth}
                  y2={y}
                  stroke={colors.border}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
              );
            })}
            <Polygon points={areaPoints} fill={colors.ringTrack} opacity={0.5} />
            <Polyline
              points={linePoints}
              fill="none"
              stroke={colors.primary}
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {coords.map((c, i) =>
              i === coords.length - 1 ? null : <Circle key={i} cx={c.x} cy={c.y} r={2.5} fill={colors.primary} opacity={0.5} />
            )}
            <Line x1={last.x} y1={last.y} x2={last.x} y2={plotHeight} stroke={colors.primary} strokeWidth={1} strokeDasharray="3 3" />
            <Circle cx={last.x} cy={last.y} r={5} fill={colors.primary} stroke={colors.white} strokeWidth={2} />
          </Svg>

          <View
            style={[
              styles.tooltip,
              {
                left: Math.min(Math.max(last.x - 30, 0), plotWidth - 60),
                top: Math.max(last.y - 34, 0),
              },
            ]}
          >
            <Text style={styles.tooltipText}>
              {lastPoint.value.toFixed(1)} {unit}
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.xLabels, { marginLeft: AXIS_WIDTH, width: plotWidth }]}>
        {labelIndexes.map((idx) => (
          <Text key={idx} style={styles.axisLabel}>
            {new Date(points[idx].ts).toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  axisLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
  },
  xLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: colors.textPrimary,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  tooltipText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFEDE3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});
