import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/useTheme';

export function MessageBanner({ message }: { message: string }) {
  const { theme } = useTheme();

  const getMessageColor = () => {
    if (message.includes('error') || message.includes('not supported')) {
      return theme.error;
    }
    if (message.includes('Ready') || message.includes('Wrote')) {
      return theme.success;
    }
    return theme.primary;
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.cardBackground, borderColor: theme.border },
      ]}
    >
      <Text style={[styles.text, { color: getMessageColor() }]}>{message}</Text>
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
