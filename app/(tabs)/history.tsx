import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Octicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ConfirmDialog } from '../../src/components/ConfirmDialog';
import { Screen } from '../../src/components/Screen';
import { SecondaryButton } from '../../src/components/SecondaryButton';
import { clearHistory, scanTitle, useHistory } from '../../src/history';
import { useTheme } from '../../src/theme/ThemeContext';
import {
  BorderWidth,
  IconSize,
  Layout,
  Radius,
  Spacing,
  TextStyles,
} from '../../src/theme/tokens';

// ponytail: maps inside the Screen ScrollView; move to a FlatList if
// history gets long enough to scroll slowly.
export default function HistoryScreen() {
  const { colors } = useTheme();
  const scans = useHistory();
  const [confirming, setConfirming] = useState(false);

  if (!scans.length) {
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

  return (
    <Screen title="History" subtitle={`${scans.length} saved on this phone`}>
      <View
        style={[
          styles.list,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {scans.map((scan, index) => (
          <Pressable
            key={scan.id}
            onPress={() => router.push(`/scan/${scan.id}`)}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.row,
              index > 0 && {
                borderTopColor: colors.border,
                borderTopWidth: BorderWidth.thin,
              },
              pressed && { backgroundColor: colors.surfaceInset },
            ]}
          >
            <View style={styles.rowText}>
              <Text
                numberOfLines={1}
                style={[styles.rowTitle, { color: colors.textPrimary }]}
              >
                {scanTitle(scan)}
              </Text>
              <Text style={[styles.rowMeta, { color: colors.textSecondary }]}>
                {new Date(scan.time).toLocaleString()}
                {scan.records.length > 1 ? ` · ${scan.records.length} records` : ''}
              </Text>
            </View>
            <Octicons
              name="chevron-right"
              size={IconSize.sm}
              color={colors.textMuted}
            />
          </Pressable>
        ))}
      </View>
      <View style={styles.footer}>
        <SecondaryButton
          label="Clear all"
          icon="trash"
          onPress={() => setConfirming(true)}
        />
      </View>
      <ConfirmDialog
        visible={confirming}
        title="Clear history?"
        message="This deletes every saved scan."
        confirmLabel="Clear all"
        onConfirm={() => {
          setConfirming(false);
          clearHistory();
        }}
        onCancel={() => setConfirming(false)}
      />
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
  list: {
    marginHorizontal: Layout.screenPadding,
    marginBottom: Spacing.lg,
    borderRadius: Radius.lg,
    borderWidth: BorderWidth.normal,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  rowText: {
    flex: 1,
    gap: Spacing.xs,
  },
  rowTitle: {
    ...TextStyles.body,
  },
  rowMeta: {
    ...TextStyles.label,
  },
  footer: {
    paddingHorizontal: Layout.screenPadding,
  },
});
