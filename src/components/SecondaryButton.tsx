import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Octicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import {
  BorderWidth,
  FontFamily,
  IconSize,
  Radius,
  Spacing,
  TextStyles,
} from '../theme/tokens';

interface SecondaryButtonProps {
  label: string;
  icon?: React.ComponentProps<typeof Octicons>['name'];
  // Leave out to show the button as busy.
  onPress?: () => void;
}

export function SecondaryButton({ label, icon, onPress }: SecondaryButtonProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.button, { borderColor: colors.border }]}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: !onPress }}
      activeOpacity={0.8}
    >
      {icon ? (
        <Octicons name={icon} size={IconSize.sm} color={colors.accent} />
      ) : null}
      <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    borderWidth: BorderWidth.normal,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  label: {
    ...TextStyles.body,
    fontFamily: FontFamily.semiBold,
  },
});
