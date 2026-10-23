import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Octicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { PrimaryButton } from '../src/components/PrimaryButton';
import { RecordCard } from '../src/components/RecordCard';
import { TagInfoCard } from '../src/components/TagInfoCard';
import { useNfcContext } from '../src/nfc/NfcContext';
import { parseRecord } from '../src/nfc/records';
import { useTheme } from '../src/theme/ThemeContext';
import { IconSize, Layout, Spacing, TextStyles } from '../src/theme/tokens';

const TITLES = {
  read: { success: 'Tag read', error: 'Read failed' },
  write: { success: 'Tag written', error: 'Write failed' },
} as const;

// Bottom sheet for a finished read or write. Android form sheets have no
// native header, so the title is part of the content.
export default function ResultSheet() {
  const { colors } = useTheme();
  const { message, scannedTag, scannedChip } = useNfcContext();
  const { action } = useLocalSearchParams<{ action: 'read' | 'write' }>();

  if (!message || message.kind === 'info') return null;

  const ok = message.kind === 'success';
  const color = ok ? colors.success : colors.danger;
  const title = TITLES[action === 'write' ? 'write' : 'read'][message.kind];

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Octicons
          name={ok ? 'check-circle' : 'x-circle'}
          size={IconSize.xxl}
          color={color}
        />
        <Text style={[styles.title, { color: colors.textPrimary }]}>
          {title}
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          {message.text}
        </Text>
      </View>

      {ok && action === 'read' && scannedTag ? (
        <>
          {scannedTag.ndefMessage?.map((record, index) => (
            <RecordCard key={index} record={parseRecord(record)} />
          ))}
          <TagInfoCard tag={scannedTag} chip={scannedChip} />
        </>
      ) : null}

      <View style={styles.footer}>
        <PrimaryButton label="Done" onPress={() => router.back()} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Layout.screenPadding,
    marginBottom: Spacing.xl,
  },
  title: {
    ...TextStyles.heading,
    marginTop: Spacing.xs,
  },
  body: {
    ...TextStyles.body,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: Layout.screenPadding,
  },
});
