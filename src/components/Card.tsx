import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { BorderWidth, Layout, Radius, Spacing } from '../theme/tokens';

export function Card({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Layout.screenPadding,
    marginBottom: Spacing.lg,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: BorderWidth.normal,
  },
});
