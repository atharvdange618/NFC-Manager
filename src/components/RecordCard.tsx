import React, { useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as IntentLauncher from 'expo-intent-launcher';
import { useTheme } from '../theme/ThemeContext';
import { Spacing, TextStyles } from '../theme/tokens';
import { ParsedRecord, payloadUri } from '../nfc/records';
import { Card } from './Card';
import { RECORD_TYPES } from './RecordTypePicker';
import { SecondaryButton } from './SecondaryButton';
import { SectionHeader } from './SectionHeader';

interface Action {
  label: string;
  icon: React.ComponentProps<typeof SecondaryButton>['icon'];
  run: () => Promise<unknown>;
}

const copy = (value: string) => () => Clipboard.setStringAsync(value);

// Label and value rows; empty optional fields are left out.
function details(p: ParsedRecord): [string, string][] {
  const rows: [string, string][] = (() => {
    switch (p.kind) {
      case 'text':
        return [['Text', p.text]];
      case 'url':
        return [['URL', p.url]];
      case 'wifi':
        return [
          ['Network', p.ssid],
          ['Security', p.security === 'open' ? 'Open' : 'WPA2'],
          ['Password', p.password],
        ];
      case 'contact':
        return [
          ['Name', p.name],
          ['Phone', p.phone],
          ['Email', p.email],
          ['Company', p.org],
        ];
      case 'phone':
        return [['Number', p.number]];
      case 'email':
        return [
          ['To', p.to],
          ['Subject', p.subject],
          ['Message', p.body],
        ];
      case 'sms':
        return [
          ['Number', p.number],
          ['Message', p.body],
        ];
      case 'location':
        return [
          ['Latitude', p.lat],
          ['Longitude', p.lng],
        ];
      case 'unknown':
        return [
          ['Type', p.type],
          ['Payload', p.hex],
        ];
    }
  })();
  return rows.filter(([, value]) => value);
}

function actions(p: ParsedRecord): Action[] {
  switch (p.kind) {
    case 'text':
      return [{ label: 'Copy text', icon: 'copy', run: copy(p.text) }];
    case 'url':
      return [
        { label: 'Open link', icon: 'link-external', run: () => Linking.openURL(payloadUri(p)) },
        { label: 'Copy link', icon: 'copy', run: copy(p.url) },
      ];
    case 'wifi':
      return [
        ...(p.password
          ? [{ label: 'Copy password', icon: 'copy', run: copy(p.password) } as const]
          : []),
        {
          label: 'Open Wi-Fi settings',
          icon: 'gear',
          run: () =>
            IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.WIFI_SETTINGS),
        },
      ];
    case 'contact':
      // Opens the contacts app's new contact form, filled in. Needs no permission.
      return [
        {
          label: 'Add to contacts',
          icon: 'person-add',
          run: () =>
            IntentLauncher.startActivityAsync('android.intent.action.INSERT', {
              type: 'vnd.android.cursor.dir/raw_contact',
              extra: { name: p.name, phone: p.phone, email: p.email, company: p.org },
            }),
        },
      ];
    case 'phone':
      return [{ label: 'Call', icon: 'device-mobile', run: () => Linking.openURL(payloadUri(p)) }];
    case 'email':
      return [{ label: 'Write email', icon: 'mail', run: () => Linking.openURL(payloadUri(p)) }];
    case 'sms':
      return [{ label: 'Write message', icon: 'comment', run: () => Linking.openURL(payloadUri(p)) }];
    case 'location':
      return [{ label: 'Open map', icon: 'location', run: () => Linking.openURL(payloadUri(p)) }];
    case 'unknown':
      return [{ label: 'Copy payload', icon: 'copy', run: copy(p.hex) }];
  }
}

// One decoded NDEF record with the actions that fit its type.
export function RecordCard({ record }: { record: ParsedRecord }) {
  const { colors } = useTheme();
  const [error, setError] = useState<string | null>(null);
  const type = RECORD_TYPES.find(t => t.kind === record.kind);

  const run = async (action: Action) => {
    setError(null);
    try {
      await action.run();
    } catch (ex: unknown) {
      console.warn(`${action.label} failed`, ex);
      setError(`${action.label} failed. No app on this phone handles it.`);
    }
  };

  return (
    <Card>
      <SectionHeader
        title={type?.label ?? 'Other record'}
        description={type?.description ?? 'A record type this app does not decode'}
      />
      <View style={styles.rows}>
        {details(record).map(([label, value]) => (
          <View key={label}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
            <Text
              selectable
              style={[
                record.kind === 'unknown' ? styles.mono : styles.value,
                { color: colors.textPrimary },
              ]}
            >
              {value}
            </Text>
          </View>
        ))}
      </View>
      {actions(record).map(action => (
        <SecondaryButton
          key={action.label}
          label={action.label}
          icon={action.icon}
          onPress={() => run(action)}
        />
      ))}
      {error ? (
        <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  rows: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  label: {
    ...TextStyles.label,
  },
  value: {
    ...TextStyles.body,
  },
  mono: {
    ...TextStyles.mono,
  },
  error: {
    ...TextStyles.label,
  },
});
