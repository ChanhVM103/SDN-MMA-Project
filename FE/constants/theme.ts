/**
 * Food App Theme - Modern & Professional
 * Color palette inspired by warm food tones
 */

import { Platform } from 'react-native';

// Primary Colors
export const AppColors = {
  primary: '#FF6B35',        // Warm Orange
  primaryDark: '#E55A2B',
  primaryLight: '#FF8F65',
  secondary: '#2D6A4F',      // Deep Forest Green
  secondaryLight: '#40916C',
  accent: '#FFB627',         // Golden Yellow
  accentLight: '#FFC857',

  // Neutrals
  white: '#FFFFFF',
  offWhite: '#FAFAFA',
  lightGray: '#F5F5F5',
  gray: '#9CA3AF',
  darkGray: '#4B5563',
  charcoal: '#1F2937',
  dark: '#111827',
  black: '#000000',

  // Semantic
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',

  // Gradients
  gradientPrimary: ['#FF6B35', '#FF8F65', '#FFB627'] as const,
  gradientDark: ['#1F2937', '#111827', '#0B0F14'] as const,
  gradientHero: ['#FF6B35', '#E55A2B', '#C44A20'] as const,
  gradientGreen: ['#2D6A4F', '#40916C', '#52B788'] as const,
  gradientAuth: ['#FF6B35', '#FF8F65', '#FFB627', '#FFC857'] as const,

  // Shadows
  shadowColor: 'rgba(0, 0, 0, 0.1)',
  shadowColorDark: 'rgba(0, 0, 0, 0.25)',
};

const tintColorLight = AppColors.primary;
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};
