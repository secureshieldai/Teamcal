export const colors = {
  primary: '#FF6A2B',
  primaryDark: '#E55A20',
  navy: '#182241',
  navyLight: '#28304A',
  background: '#F7F7F9',
  card: '#FFFFFF',
  border: '#EEEEF1',
  textPrimary: '#14142B',
  textSecondary: '#8B8D97',
  textMuted: '#A6A8B3',
  success: '#2ED47A',
  macroProtein: '#FF4D5E',
  macroCarbs: '#FFC542',
  macroFat: '#3E7BFA',
  ringTrack: '#F3D9CB',
  white: '#FFFFFF',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

export const typography = {
  h1: { fontSize: 24, fontWeight: '800' as const },
  h2: { fontSize: 17, fontWeight: '700' as const },
  body: { fontSize: 14, fontWeight: '400' as const },
  bodyBold: { fontSize: 14, fontWeight: '700' as const },
  caption: { fontSize: 12, fontWeight: '500' as const },
  small: { fontSize: 11, fontWeight: '500' as const },
};

export const shadow = {
  card: {
    shadowColor: '#14142B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  soft: {
    shadowColor: '#14142B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
};
