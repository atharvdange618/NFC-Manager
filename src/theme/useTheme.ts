import { useColorScheme } from 'react-native';

export interface Theme {
  background: string;
  surface: string;
  cardBackground: string;
  primary: string;
  primaryDark: string;
  success: string;
  warning: string;
  error: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  shadow: string;
}

export function useTheme(): { theme: Theme; isDarkMode: boolean } {
  const isDarkMode = useColorScheme() === 'dark';

  const theme: Theme = {
    background: isDarkMode ? '#0F0F0F' : '#FFFFFF',
    surface: isDarkMode ? '#1C1C1E' : '#F8F9FA',
    cardBackground: isDarkMode ? '#2C2C2E' : '#FFFFFF',
    primary: '#007AFF',
    primaryDark: '#0056CC',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    text: isDarkMode ? '#FFFFFF' : '#000000',
    textSecondary: isDarkMode ? '#AEAEB2' : '#6C6C70',
    textTertiary: isDarkMode ? '#8E8E93' : '#8E8E93',
    border: isDarkMode ? '#38383A' : '#E5E5E7',
    shadow: isDarkMode ? '#000000' : '#000000',
  };

  return { theme, isDarkMode };
}
