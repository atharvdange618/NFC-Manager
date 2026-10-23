import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import {
  BorderWidth,
  FontFamily,
  Radius,
  Spacing,
  TextStyles,
} from '../theme/tokens';
import { RecordKind } from '../nfc/useNfc';

const OPTIONS: { kind: RecordKind; label: string }[] = [
  { kind: 'text', label: 'Text' },
  { kind: 'url', label: 'URL' },
];

interface RecordKindToggleProps {
  value: RecordKind;
  onChange: (kind: RecordKind) => void;
}

export function RecordKindToggle({ value, onChange }: RecordKindToggleProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surfaceInset, borderColor: colors.border },
      ]}
    >
      {OPTIONS.map(option => {
        const selected = option.kind === value;
        return (
          <TouchableOpacity
            key={option.kind}
            style={[
              styles.segment,
              selected && { backgroundColor: colors.accent },
            ]}
            onPress={() => onChange(option.kind)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.label,
                {
                  color: selected ? colors.textOnAccent : colors.textSecondary,
                },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    borderWidth: BorderWidth.normal,
    padding: Spacing.xs,
    marginBottom: Spacing.md,
  },
  segment: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.sm,
    alignItems: 'center',
  },
  label: {
    ...TextStyles.label,
    fontFamily: FontFamily.semiBold,
  },
});
