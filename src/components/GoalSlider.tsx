import React, { useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../theme';

type Props = {
  label: string;
  value: number;
  unit?: string;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
};

const THUMB_SIZE = 22;

export default function GoalSlider({ label, value, unit, min, max, step = 1, onChange }: Props) {
  const [trackWidth, setTrackWidth] = useState(0);
  const trackWidthRef = useRef(0);

  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const snap = (v: number) => Math.round(v / step) * step;

  const setFromLocationX = (locationX: number) => {
    if (trackWidthRef.current <= 0) return;
    const ratio = Math.min(1, Math.max(0, locationX / trackWidthRef.current));
    const raw = min + ratio * (max - min);
    onChange(clamp(snap(raw)));
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => setFromLocationX(evt.nativeEvent.locationX),
      onPanResponderMove: (evt) => setFromLocationX(evt.nativeEvent.locationX),
    })
  ).current;

  const percent = max > min ? ((clamp(value) - min) / (max - min)) * 100 : 0;
  const displayValue = step < 1 ? value.toFixed(1) : Math.round(value).toLocaleString();

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.valueRow}>
          <View style={styles.valuePill}>
            <Text style={styles.valueText}>{displayValue}</Text>
          </View>
          {unit ? <Text style={styles.unitText}>{unit}</Text> : null}
        </View>
      </View>

      <View
        style={styles.track}
        onLayout={(e) => {
          trackWidthRef.current = e.nativeEvent.layout.width;
          setTrackWidth(e.nativeEvent.layout.width);
        }}
        {...panResponder.panHandlers}
      >
        <View style={[styles.fill, { width: `${percent}%` }]} />
        {trackWidth > 0 && (
          <View
            style={[
              styles.thumb,
              { left: (percent / 100) * trackWidth - THUMB_SIZE / 2 },
            ]}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  valuePill: {
    backgroundColor: colors.background,
    borderRadius: radii.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    minWidth: 56,
    alignItems: 'center',
  },
  valueText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  unitText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.navy,
    justifyContent: 'center',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.white,
  },
});
