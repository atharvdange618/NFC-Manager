import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Radius, Spacing, TextStyles } from '../theme/tokens';
import { Card } from './Card';

interface StatusCardProps {
  nfcSupported: boolean;
  nfcEnabled: boolean;
}

export function StatusCard({ nfcSupported, nfcEnabled }: StatusCardProps) {
  const { colors } = useTheme();

  const getStatusColor = () => {
    if (!nfcSupported) return colors.danger;
    if (!nfcEnabled) return colors.warning;
    return colors.success;
  };

  return (
    <Card>
      <View style={styles.container}>
        <View style={styles.item}>
          <View
            style={[
              styles.indicator,
              { backgroundColor: nfcSupported ? colors.success : colors.danger },
            ]}
          />
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            NFC Support
          </Text>
          <Text style={[styles.value, { color: getStatusColor() }]}>
            {nfcSupported ? 'Available' : 'Not Available'}
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.item}>
          <View
            style={[
              styles.indicator,
              { backgroundColor: nfcEnabled ? colors.success : colors.warning },
            ]}
          />
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            NFC Status
          </Text>
          <Text style={[styles.value, { color: getStatusColor() }]}>
            {nfcEnabled ? 'Enabled' : 'Disabled'}
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  item: {
    flex: 1,
    alignItems: 'center',
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: Radius.full,
    marginBottom: Spacing.sm,
  },
  label: {
    ...TextStyles.label,
    marginBottom: Spacing.xs,
  },
  value: {
    ...TextStyles.bodyMedium,
  },
  divider: {
    width: 1,
    height: 40,
    marginHorizontal: Spacing.lg,
  },
});
