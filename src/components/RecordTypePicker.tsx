import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Octicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import {
  BorderWidth,
  FontFamily,
  IconSize,
  Layout,
  Radius,
  Spacing,
  TextStyles,
} from '../theme/tokens';
import { RecordKind } from '../nfc/records';

type IconName = React.ComponentProps<typeof Octicons>['name'];

export const RECORD_TYPES: {
  kind: RecordKind;
  label: string;
  icon: IconName;
  description: string;
}[] = [
  { kind: 'text', label: 'Text', icon: 'typography', description: 'Plain text any NFC reader can show' },
  { kind: 'url', label: 'URL', icon: 'link', description: 'A link that opens without the app' },
  // Octicons has no Wi-Fi glyph; rss is the closest signal shape.
  { kind: 'wifi', label: 'Wi-Fi', icon: 'rss', description: 'Phones join the network with a tap' },
  { kind: 'contact', label: 'Contact', icon: 'person', description: 'A contact card the phone can save' },
  { kind: 'phone', label: 'Phone', icon: 'device-mobile', description: 'Starts a call to this number' },
  { kind: 'email', label: 'Email', icon: 'mail', description: 'Opens a drafted email' },
  { kind: 'sms', label: 'SMS', icon: 'comment', description: 'Opens a drafted text message' },
  { kind: 'location', label: 'Location', icon: 'location', description: 'Opens this spot in the maps app' },
];

interface RecordTypePickerProps {
  value: RecordKind;
  onChange: (kind: RecordKind) => void;
}

// Four by two grid, so every type is one tap away.
export function RecordTypePicker({ value, onChange }: RecordTypePickerProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.grid}>
      {RECORD_TYPES.map(type => {
        const selected = type.kind === value;
        const color = selected ? colors.accent : colors.textSecondary;
        return (
          <TouchableOpacity
            key={type.kind}
            style={[
              styles.tile,
              {
                backgroundColor: selected ? colors.accentSubtle : colors.surfaceInset,
                borderColor: selected ? colors.accent : colors.border,
              },
            ]}
            onPress={() => onChange(type.kind)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            activeOpacity={0.8}
          >
            <Octicons name={type.icon} size={IconSize.md} color={color} />
            <Text style={[styles.label, { color: selected ? colors.textPrimary : colors.textSecondary }]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginHorizontal: Layout.screenPadding,
    marginBottom: Spacing.lg,
  },
  tile: {
    flexBasis: '22%',
    flexGrow: 1,
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: BorderWidth.normal,
  },
  label: {
    ...TextStyles.caption,
    fontFamily: FontFamily.semiBold,
  },
});
