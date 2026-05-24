export const colors = {
  // Background hierarchy
  bg0: '#0A0A0A',   // deepest background
  bg1: '#111111',   // main background
  bg2: '#1A1A1A',   // card background
  bg3: '#242424',   // elevated card / input background
  bg4: '#2E2E2E',   // border, divider

  // Text
  text0: '#FFFFFF',
  text1: '#E5E5E5',
  text2: '#A3A3A3',
  text3: '#6B6B6B',

  // Brand
  accent: '#FF6B35',      // warm orange — primary action
  accentLight: '#FF8F65',
  accentDark: '#D4521E',
  accentMuted: 'rgba(255, 107, 53, 0.15)',

  // Semantic
  success: '#34C759',
  warning: '#FF9F0A',
  error: '#FF3B30',
  info: '#0A84FF',

  // Transparent overlays
  overlay20: 'rgba(0,0,0,0.2)',
  overlay50: 'rgba(0,0,0,0.5)',
  overlay80: 'rgba(0,0,0,0.8)',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const typography = {
  displayLg: { fontSize: 32, fontWeight: '700' as const, letterSpacing: -1 },
  displayMd: { fontSize: 26, fontWeight: '700' as const, letterSpacing: -0.5 },
  displaySm: { fontSize: 22, fontWeight: '600' as const, letterSpacing: -0.3 },
  titleLg: { fontSize: 18, fontWeight: '600' as const, letterSpacing: -0.2 },
  titleMd: { fontSize: 16, fontWeight: '600' as const },
  titleSm: { fontSize: 14, fontWeight: '600' as const },
  bodyLg: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  bodyMd: { fontSize: 14, fontWeight: '400' as const, lineHeight: 21 },
  bodySm: { fontSize: 12, fontWeight: '400' as const, lineHeight: 18 },
  caption: { fontSize: 11, fontWeight: '400' as const, letterSpacing: 0.3 },
  label: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.8, textTransform: 'uppercase' as const },
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
} as const;
