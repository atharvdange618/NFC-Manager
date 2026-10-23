import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TagEvent } from 'react-native-nfc-manager';
import { useTheme } from '../theme/ThemeContext';
import { FontFamily, Radius, Spacing, TextStyles } from '../theme/tokens';
import { decodeRecord, recordTypeName } from '../nfc/ndef';
import { Card } from './Card';
import { SectionHeader } from './SectionHeader';

export function TagInfoCard({ tag }: { tag: TagEvent }) {
  const { colors } = useTheme();

  return (
    <Card>
      <SectionHeader
        title="Tag information"
        description="Details from the last scanned tag"
      />
      <View style={styles.container}>
        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>ID:</Text>
          <Text style={[styles.value, { color: colors.textPrimary }]}>
            {tag.id || 'N/A'}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Technologies:
          </Text>
          <Text style={[styles.value, { color: colors.textPrimary }]}>
            {tag.techTypes?.join(', ') || 'N/A'}
          </Text>
        </View>
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
