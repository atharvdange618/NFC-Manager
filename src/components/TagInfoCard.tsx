import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TagEvent } from 'react-native-nfc-manager';
import { useTheme } from '../theme/useTheme';
import { decodeRecord } from '../nfc/ndef';
import { Card } from './Card';
import { SectionHeader } from './SectionHeader';

export function TagInfoCard({ tag }: { tag: TagEvent }) {
  const { theme } = useTheme();

  return (
    <Card>
      <SectionHeader
        title="🏷️ Tag Information"
        description="Details from the last scanned tag"
      />
      <View style={styles.container}>
        <View style={styles.row}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>ID:</Text>
          <Text style={[styles.value, { color: theme.text }]}>
            {tag.id || 'N/A'}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>
            Technologies:
          </Text>
          <Text style={[styles.value, { color: theme.text }]}>
            {tag.techTypes?.join(', ') || 'N/A'}
          </Text>
        </View>
        {tag.ndefMessage && tag.ndefMessage.length > 0 && (
          <View style={styles.ndefContainer}>
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              NDEF Records:
            </Text>
            {tag.ndefMessage.map((record, index) => (
              <View key={index} style={styles.ndefRecord}>
                <Text style={[styles.ndefRecordText, { color: theme.text }]}>
                  <Text style={styles.bold}>Type:</Text>{' '}
                  {record.type
                    ? String.fromCharCode(...(record.type as number[]))
                    : 'Unknown'}
                </Text>
                <Text style={[styles.ndefRecordText, { color: theme.text }]}>
                  <Text style={styles.bold}>Payload:</Text>{' '}
                  {record.payload ? decodeRecord(record) : 'N/A'}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    minWidth: 80,
  },
  value: {
    fontSize: 14,
    flex: 1,
    fontFamily: 'monospace',
  },
  ndefContainer: {
    marginTop: 8,
    gap: 8,
  },
  ndefRecord: {
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginLeft: 12,
  },
  ndefRecordText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'monospace',
  },
  bold: {
    fontWeight: '600',
  },
});
