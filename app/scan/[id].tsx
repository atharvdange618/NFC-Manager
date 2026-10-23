import React, { useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Card } from '../../src/components/Card';
import { ConfirmDialog } from '../../src/components/ConfirmDialog';
import { RecordCard, recordDetails } from '../../src/components/RecordCard';
import { SecondaryButton } from '../../src/components/SecondaryButton';
import { SectionHeader } from '../../src/components/SectionHeader';
import { deleteScan, Scan, scanTitle, useHistory } from '../../src/history';
import { WritePayload } from '../../src/nfc/records';
import { useTheme } from '../../src/theme/ThemeContext';
import { Layout, Spacing, TextStyles } from '../../src/theme/tokens';

// Plain text for copy and share: each record's rows, then the tag.
function scanText(scan: Scan): string {
  const records = scan.records.map(record =>
    recordDetails(record)
      .map(([label, value]) => `${label}: ${value}`)
      .join('\n'),
  );
  const tag = [
    `Tag ID: ${scan.tagId || 'N/A'}`,
    `Scanned: ${new Date(scan.time).toLocaleString()}`,
  ].join('\n');
  return [...records, tag].join('\n\n');
}

function writeAgain(payload: WritePayload) {
  router.navigate({
    pathname: '/write',
    params: { payload: JSON.stringify(payload), at: String(Date.now()) },
  });
}

export default function ScanDetail() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const scan = useHistory().find(s => s.id === id);
  const [confirming, setConfirming] = useState(false);

  // Gone after a delete, or from a stale link.
  if (!scan) return null;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: scanTitle(scan) }} />

      {scan.records.length ? (
        scan.records.map((record, index) => (
          <RecordCard key={index} record={record} onWriteAgain={writeAgain} />
        ))
      ) : (
        <Text style={[styles.empty, { color: colors.textSecondary }]}>
          This tag had no NDEF records.
        </Text>
      )}

      <Card>
        <SectionHeader title="Tag" description={new Date(scan.time).toLocaleString()} />
        <View style={styles.rows}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>ID</Text>
          <Text selectable style={[styles.mono, { color: colors.textPrimary }]}>
            {scan.tagId || 'N/A'}
          </Text>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Technologies
          </Text>
          <Text style={[styles.mono, { color: colors.textPrimary }]}>
            {scan.tech.join(', ') || 'N/A'}
          </Text>
        </View>
      </Card>

      <View style={styles.footer}>
        <SecondaryButton
          label="Copy"
          icon="copy"
          onPress={() => Clipboard.setStringAsync(scanText(scan))}
        />
        <SecondaryButton
          label="Share"
          icon="share-android"
          onPress={() => Share.share({ message: scanText(scan) })}
        />
        <SecondaryButton
          label="Delete"
          icon="trash"
          onPress={() => setConfirming(true)}
        />
      </View>
      <ConfirmDialog
        visible={confirming}
        title="Delete this scan?"
        confirmLabel="Delete"
        onConfirm={() => {
          setConfirming(false);
          router.back();
          deleteScan(scan.id);
        }}
        onCancel={() => setConfirming(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  empty: {
    ...TextStyles.body,
    paddingHorizontal: Layout.screenPadding,
    marginBottom: Spacing.lg,
  },
  rows: {
    gap: Spacing.xs,
  },
  label: {
    ...TextStyles.label,
  },
  mono: {
    ...TextStyles.mono,
    marginBottom: Spacing.sm,
  },
  footer: {
    paddingHorizontal: Layout.screenPadding,
  },
});
