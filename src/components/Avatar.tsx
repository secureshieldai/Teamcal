import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { colors } from '../theme';

type Props = {
  uri: string;
  size?: number;
  ringColor?: string;
  ringWidth?: number;
  online?: boolean;
};

export default function Avatar({ uri, size = 56, ringColor, ringWidth = 2, online }: Props) {
  const outerSize = ringColor ? size + ringWidth * 2 + 2 : size;

  return (
    <View
      style={[
        ringColor
          ? {
              width: outerSize,
              height: outerSize,
              borderRadius: outerSize / 2,
              borderWidth: ringWidth,
              borderColor: ringColor,
              alignItems: 'center',
              justifyContent: 'center',
            }
          : undefined,
      ]}
    >
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.border }}
      />
      {online && <View style={styles.onlineDot} />}
    </View>
  );
}

const styles = StyleSheet.create({
  onlineDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.white,
  },
});
