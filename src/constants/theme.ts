import { useColorScheme } from 'react-native';

// 1. 피그마 CSS에 정의된 라이트/다크 테마 컬러 팔레트 정의
export const Palette = {
  light: {
    background: '#F0F2F8',
    foreground: '#0F0E1A',
    card: '#ffffff',
    cardForeground: '#0F0E1A',
    popover: '#ffffff',
    popoverForeground: '#0F0E1A',
    primary: '#4F46E5',
    primaryForeground: '#ffffff',
    secondary: '#EEF0FF',
    secondaryForeground: '#3730A3',
    muted: '#E8EAF2',
    mutedForeground: '#6B7280',
    accent: '#EF4444',
    accentForeground: '#ffffff',
    destructive: '#EF4444',
    destructiveForeground: '#ffffff',
    border: 'rgba(79, 70, 229, 0.1)',
    input: 'transparent',
    inputBackground: '#F4F5FB',
    switchBackground: '#C7CAD8',
    ring: '#4F46E5',
    
    // 차트 컬러
    chart1: '#4F46E5',
    chart2: '#10B981',
    chart3: '#EF4444',
    chart4: '#F59E0B',
    chart5: '#8B5CF6',

    // 사이드바 컬러
    sidebar: '#FAF9F9',
    sidebarForeground: '#262626',
    sidebarPrimary: '#030213',
    sidebarPrimaryForeground: '#FAF9F9',
    sidebarAccent: '#F5F5F5',
    sidebarAccentForeground: '#333333',
    sidebarBorder: '#ECECEC',
    sidebarRing: '#B3B3B3',
  },
  dark: {
    background: '#262626',
    foreground: '#FAF9F9',
    card: '#262626',
    cardForeground: '#FAF9F9',
    popover: '#262626',
    popoverForeground: '#FAF9F9',
    primary: '#FAF9F9',
    primaryForeground: '#333333',
    secondary: '#454545',
    secondaryForeground: '#FAF9F9',
    muted: '#454545',
    mutedForeground: '#B3B3B3',
    accent: '#454545',
    accentForeground: '#FAF9F9',
    destructive: '#7E121D',
    destructiveForeground: '#D9534F',
    border: '#454545',
    input: '#454545',
    ring: '#707070',
    
    // 차트 컬러
    chart1: '#3B82F6',
    chart2: '#10B981',
    chart3: '#FBBF24',
    chart4: '#EC4899',
    chart5: '#F43F5E',

    // 사이드바 컬러
    sidebar: '#333333',
    sidebarForeground: '#FAF9F9',
    sidebarPrimary: '#3B82F6',
    sidebarPrimaryForeground: '#FAF9F9',
    sidebarAccent: '#454545',
    sidebarAccentForeground: '#FAF9F9',
    sidebarBorder: '#454545',
    sidebarRing: '#707070',
  },
};

// Expo Router 호환용 Colors 상수
export const Colors = {
  light: {
    text: Palette.light.foreground,
    background: Palette.light.background,
    tint: Palette.light.primary,
    icon: Palette.light.mutedForeground,
    tabIconDefault: Palette.light.mutedForeground,
    tabIconSelected: Palette.light.primary,
  },
  dark: {
    text: Palette.dark.foreground,
    background: Palette.dark.background,
    tint: Palette.dark.primary,
    icon: Palette.dark.mutedForeground,
    tabIconDefault: Palette.dark.mutedForeground,
    tabIconSelected: Palette.dark.primary,
  },
};

// 2. 공통 값 정의 (글꼴 크기, 굵기, 둥글기 등)
export const Typography = {
  fontSize: 16,
  fontWeight: {
    normal: '400' as const,
    medium: '600' as const,
  },
  lineHeight: 1.5,
};

export const Radius = {
  base: 12,
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
};

// 3. Expo Router 템플릿 호환용 간격 및 레이아웃 상수 (Cannot read properties of undefined 'three' 해결)
export const Spacing = {
  one: 4,
  two: 8,
  three: 12, // 👈 'three' 속성 추가
  four: 16,
  five: 20,
  six: 24,
  eight: 32,
};

export const BottomTabInset = 80;
export const MaxContentWidth = 600;

// 4. 커스텀 훅
export function useTheme() {
  const scheme = useColorScheme();
  const colors = scheme === 'dark' ? Palette.dark : Palette.light;

  return {
    colors,
    typography: Typography,
    radius: Radius,
    spacing: Spacing,
    isDark: scheme === 'dark',
  };
}