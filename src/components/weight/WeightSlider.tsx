import React, { useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import { colors, radii, spacing } from '../../theme';

type Props = {
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  onChange: (value: number) => void;
};

const THUMB_SIZE = 26;

export default function WeightSlider({ value, min, max, step = 0.1, unit, onChange }: Props) {
  const trackWidthRef = useRef(0);
  const [trackWidth, setTrackWidth] = useState(0);

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
  const mid = (min + max) / 2;

  return (
    <View>
      <View style={styles.valueRow}>
        <Text style={styles.value}>{value.toFixed(1)}</Text>
        <Text style={styles.unit}>{unit}</Text>
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
          <View style={[styles.thumb, { left: (percent / 100) * trackWidth - THUMB_SIZE / 2 }]} />
        )}
      </View>

      <View style={styles.ticksRow}>
        <Text style={styles.tick}>{min.toFixed(1)}</Text>
        <Text style={styles.tick}>{(min + (mid - min) / 2).toFixed(1)}</Text>
        <Text style={[styles.tick, styles.tickActive]}>{value.toFixed(1)}</Text>
        <Text style={styles.tick}>{(max - (max - mid) / 2).toFixed(1)}</Text>
        <Text style={styles.tick}>{max.toFixed(1)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  valueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
    marginBottom: spacing.lg,
  },
  value: {
    fontSize: 40,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  unit: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
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
    borderWidth: 4,
    borderColor: colors.white,
    shadowColor: '#14142B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  ticksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  tick: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  tickActive: {
    color: colors.primary,
    fontWeight: '800',
  },
});
