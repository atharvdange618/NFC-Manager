import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { Card } from './Card';

interface StatusCardProps {
  nfcSupported: boolean;
  nfcEnabled: boolean;
}

export function StatusCard({ nfcSupported, nfcEnabled }: StatusCardProps) {
  const { theme } = useTheme();

  const getStatusColor = () => {
    if (!nfcSupported) return theme.error;
    if (!nfcEnabled) return theme.warning;
    return theme.success;
  };

  return (
    <Card>
      <View style={styles.container}>
        <View style={styles.item}>
          <View
            style={[
              styles.indicator,
              { backgroundColor: nfcSupported ? theme.success : theme.error },
            ]}
          />
          <Text style={[styles.label, { color: theme.text }]}>NFC Support</Text>
          <Text style={[styles.value, { color: getStatusColor() }]}>
            {nfcSupported ? 'Available' : 'Not Available'}
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <View style={styles.item}>
          <View
            style={[
              styles.indicator,
              { backgroundColor: nfcEnabled ? theme.success : theme.warning },
            ]}
          />
          <Text style={[styles.label, { color: theme.text }]}>NFC Status</Text>
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
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 40,
    marginHorizontal: 20,
  },
});
