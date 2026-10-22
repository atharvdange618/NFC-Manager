import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { NfcMessage } from '../nfc/useNfc';

export function MessageBanner({ message }: { message: NfcMessage }) {
  const { theme } = useTheme();

  const color = {
    error: theme.error,
    success: theme.success,
    info: theme.primary,
  }[message.kind];

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.cardBackground, borderColor: theme.border },
      ]}
    >
      <Text style={[styles.text, { color }]}>{message.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
  },
});
