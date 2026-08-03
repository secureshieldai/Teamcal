import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { colors } from '../theme';

type Props = {
  size?: number;
  online?: boolean;
};

export default function CoachMascotAvatar({ size = 56, online }: Props) {
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Circle cx={50} cy={50} r={50} fill="#FFEDE3" />
        <Rect x={22} y={16} width={4} height={14} rx={2} fill={colors.primary} />
        <Circle cx={24} cy={14} r={6} fill={colors.primary} />
        <Ellipse cx={16} cy={64} rx={9} ry={11} fill={colors.primary} />
        <Ellipse cx={84} cy={62} rx={9} ry={12} fill={colors.primary} />
        <Circle cx={84} cy={50} r={7} fill="#FFD9C2" />
        <Rect x={20} y={26} width={60} height={54} rx={26} fill={colors.primary} />
        <Rect x={30} y={38} width={40} height={30} rx={15} fill={colors.white} />
        <Circle cx={42} cy={53} r={5.5} fill={colors.navy} />
        <Circle cx={58} cy={53} r={5.5} fill={colors.navy} />
        <Circle cx={44} cy={51} r={1.6} fill={colors.white} />
        <Circle cx={60} cy={51} r={1.6} fill={colors.white} />
        <Path
          d="M44 61 Q50 66 56 61"
          stroke={colors.navy}
          strokeWidth={2.6}
          strokeLinecap="round"
          fill="none"
        />
        <Rect x={36} y={72} width={28} height={8} rx={4} fill={colors.white} />
      </Svg>
      {online && (
        <View
          style={{
            position: 'absolute',
            right: size * 0.02,
            bottom: size * 0.02,
            width: size * 0.22,
            height: size * 0.22,
            borderRadius: size * 0.11,
            backgroundColor: colors.success,
            borderWidth: 2,
            borderColor: colors.white,
          }}
        />
      )}
    </View>
  );
}
