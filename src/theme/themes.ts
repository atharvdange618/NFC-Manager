// Shikai's Light and Dark palettes, minus the GitHub-only keys. Muted and
// inactive-tab grays are darkened (light) or lightened (dark) to pass WCAG AA.
export type ThemeName = 'light' | 'dark';

export interface ColorTokens {
  background: string;
  backgroundSubtle: string;

  surface: string;
  surfaceSecondary: string;
  surfaceInset: string;

  border: string;
  borderSubtle: string;

  accent: string;
  accentSubtle: string;
  accentMuted: string;

  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textOnAccent: string;
  textLink: string;

  success: string;
  successSubtle: string;
  danger: string;
  dangerSubtle: string;
  warning: string;
  warningSubtle: string;

  tabBarBackground: string;
  tabBarBorder: string;
  tabBarActive: string;
  tabBarInactive: string;
}

export interface Theme {
  name: ThemeName;
  label: string;
  isDark: boolean;
  colors: ColorTokens;
}

const Light: Theme = {
  name: 'light',
  label: 'Light',
  isDark: false,
  colors: {
    background: '#FAF9F6',
    backgroundSubtle: '#F8F6F0',

    surface: '#FAF9F6',
    surfaceSecondary: '#EBE6DC',
    surfaceInset: '#F5F1E8',

    border: '#D9D3C7',
    borderSubtle: '#EBE6DC',

    accent: '#3B82F6',
    accentSubtle: '#DBEAFE',
    accentMuted: '#93C5FD',

    textPrimary: '#1A2332',
    textSecondary: '#5A6B7B',
    textMuted: '#636E78',
    textOnAccent: '#F5F5F5',
    textLink: '#2563EB',

    success: '#22C55E',
    successSubtle: '#DCFCE7',
    danger: '#EF4444',
    dangerSubtle: '#FEE2E2',
    warning: '#F97316',
    warningSubtle: '#FFF7ED',

    tabBarBackground: '#FAF9F6',
    tabBarBorder: '#D9D3C7',
    tabBarActive: '#3B82F6',
    tabBarInactive: '#636E78',
  },
};

const Dark: Theme = {
  name: 'dark',
  label: 'Dark',
  isDark: true,
  colors: {
    background: '#0D1117',
    backgroundSubtle: '#0A0D12',

    surface: '#161B22',
    surfaceSecondary: '#1C2128',
    surfaceInset: '#21262D',

    border: '#30363D',
    borderSubtle: '#21262D',

    accent: '#58A6FF',
    accentSubtle: '#1C2D3F',
    accentMuted: '#2D4464',

    textPrimary: '#E6EDF3',
    textSecondary: '#8B949E',
    textMuted: '#888F98',
    textOnAccent: '#0D1117',
    textLink: '#58A6FF',

    success: '#4ADE80',
    successSubtle: '#0C2D1A',
    danger: '#F85149',
    dangerSubtle: '#2D1217',
    warning: '#FB923C',
    warningSubtle: '#2D1B00',

    tabBarBackground: '#161B22',
    tabBarBorder: '#30363D',
    tabBarActive: '#58A6FF',
    tabBarInactive: '#7E858F',
  },
};

export const themes: Record<ThemeName, Theme> = {
  light: Light,
  dark: Dark,
};
