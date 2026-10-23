import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TagEvent } from 'react-native-nfc-manager';
import { useTheme } from '../theme/ThemeContext';
import { FontFamily, Radius, Spacing, TextStyles } from '../theme/tokens';
import { decodeRecord, recordTypeName } from '../nfc/ndef';
import { Chip, ndefBytesUsed } from '../nfc/tagInfo';
import { Card } from './Card';
import { SectionHeader } from './SectionHeader';

function yesNo(value: boolean | null | undefined): string {
  return value == null ? 'Unknown' : value ? 'Yes' : 'No';
}

export function TagInfoCard({ tag, chip }: { tag: TagEvent; chip: Chip | null }) {
  const { colors } = useTheme();
  const rows: [string, string][] = [
    ['Chip', chip ?? tag.type ?? 'Unknown'],
    ['ID', tag.id || 'N/A'],
    ['Technologies', tag.techTypes?.join(', ') || 'N/A'],
    [
      'NDEF size',
      tag.maxSize ? `${ndefBytesUsed(tag)} of ${tag.maxSize} bytes` : 'Not NDEF',
    ],
    ['Writable', yesNo(tag.isWritable)],
    ['Can lock', yesNo(tag.canMakeReadOnly)],
  ];

  return (
    <Card>
      <SectionHeader
        title="Tag information"
        description="Details from the last scanned tag"
      />
      <View style={styles.container}>
        {rows.map(([label, value]) => (
          <View key={label} style={styles.row}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {label}:
            </Text>
            <Text style={[styles.value, { color: colors.textPrimary }]}>
              {value}
            </Text>
          </View>
        ))}
        {tag.ndefMessage && tag.ndefMessage.length > 0 && (
          <View style={styles.ndefContainer}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              NDEF Records:
            </Text>
            {tag.ndefMessage.map((record, index) => (
              <View
                key={index}
                style={[
                  styles.ndefRecord,
                  { backgroundColor: colors.surfaceInset },
                ]}
              >
                <Text style={[styles.ndefRecordText, { color: colors.textPrimary }]}>
                  <Text style={styles.bold}>Type:</Text>{' '}
                  {record.type ? recordTypeName(record) : 'Unknown'}
                </Text>
                <Text style={[styles.ndefRecordText, { color: colors.textPrimary }]}>
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
    gap: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  label: {
    ...TextStyles.label,
    minWidth: 80,
  },
  value: {
    ...TextStyles.mono,
    flex: 1,
  },
  ndefContainer: {
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  ndefRecord: {
    padding: Spacing.md,
    borderRadius: Radius.sm,
    marginLeft: Spacing.md,
  },
  ndefRecordText: {
    ...TextStyles.mono,
  },
  bold: {
    fontFamily: FontFamily.monoMedium,
  },
});
