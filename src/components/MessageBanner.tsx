import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Layout, Radius, Spacing, TextStyles } from '../theme/tokens';
import { NfcMessage } from '../nfc/useNfc';

export function MessageBanner({ message }: { message: NfcMessage }) {
  const { colors } = useTheme();

  const [color, backgroundColor] = {
    error: [colors.danger, colors.dangerSubtle],
    success: [colors.success, colors.successSubtle],
    info: [colors.accent, colors.accentSubtle],
  }[message.kind];

  return (
    <View style={[styles.banner, { backgroundColor }]}>
      <Text style={[styles.text, { color }]}>{message.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: Layout.screenPadding,
    marginBottom: Spacing.lg,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  text: {
    ...TextStyles.bodyMedium,
  },
});
