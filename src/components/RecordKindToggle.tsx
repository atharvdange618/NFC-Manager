import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme/useTheme';
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
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.surface, borderColor: theme.border },
      ]}
    >
      {OPTIONS.map(option => {
        const selected = option.kind === value;
        return (
          <TouchableOpacity
            key={option.kind}
            style={[
              styles.segment,
              selected && { backgroundColor: theme.primary },
            ]}
            onPress={() => onChange(option.kind)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.label,
                selected ? styles.selectedLabel : { color: theme.textSecondary },
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
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    marginBottom: 12,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  selectedLabel: {
    color: '#FFFFFF',
  },
});
