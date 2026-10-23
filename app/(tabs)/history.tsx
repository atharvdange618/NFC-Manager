import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Octicons } from '@expo/vector-icons';
import { Screen } from '../../src/components/Screen';
import { useTheme } from '../../src/theme/ThemeContext';
import { IconSize, Spacing, TextStyles } from '../../src/theme/tokens';

// Empty until scan history lands in Phase 3.2.
export default function HistoryScreen() {
  const { colors } = useTheme();

  return (
    <Screen title="History">
      <View style={styles.empty}>
        <Octicons name="history" size={IconSize.xxl} color={colors.textMuted} />
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          No scans yet
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          Tags you read will show up here.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    paddingTop: Spacing['4xl'],
    gap: Spacing.sm,
  },
  title: {
    ...TextStyles.title,
    marginTop: Spacing.sm,
  },
  body: {
    ...TextStyles.body,
  },
});
