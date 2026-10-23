import React, { useEffect, useState } from 'react';
import { KeyboardTypeOptions, StyleSheet, Text, TextInput } from 'react-native';
import * as Location from 'expo-location';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Card } from '../../src/components/Card';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { SecondaryButton } from '../../src/components/SecondaryButton';
import { SectionHeader } from '../../src/components/SectionHeader';
import { MessageBanner } from '../../src/components/MessageBanner';
import { SegmentedControl } from '../../src/components/SegmentedControl';
import {
  RECORD_TYPES,
  RecordTypePicker,
} from '../../src/components/RecordTypePicker';
import { useNfcContext } from '../../src/nfc/NfcContext';
import { presentOutcome } from '../../src/nfc/presentOutcome';
import { NfcMessage } from '../../src/nfc/useNfc';
import { RecordKind, WifiSecurity, WritePayload } from '../../src/nfc/records';
import { useTheme } from '../../src/theme/ThemeContext';
import {
  BorderWidth,
  Radius,
  Spacing,
  TextStyles,
} from '../../src/theme/tokens';

type FieldName =
  | 'text'
  | 'url'
  | 'ssid'
  | 'password'
  | 'name'
  | 'phone'
  | 'email'
  | 'org'
  | 'number'
  | 'to'
  | 'subject'
  | 'body'
  | 'lat'
  | 'lng';

interface Field {
  name: FieldName;
  label: string;
  placeholder: string;
  keyboardType?: KeyboardTypeOptions;
  multiline?: boolean;
  // Addresses, numbers and names Android would capitalise or autocorrect.
  plain?: boolean;
}

const FIELDS: Record<RecordKind, Field[]> = {
  text: [
    { name: 'text', label: 'Text', placeholder: 'Enter text to write to tag', multiline: true },
  ],
  url: [
    { name: 'url', label: 'URL', placeholder: 'https://example.com', keyboardType: 'url', plain: true },
  ],
  wifi: [
    { name: 'ssid', label: 'Network name', placeholder: 'Home Wi-Fi', plain: true },
    { name: 'password', label: 'Password', placeholder: '8 to 63 characters', plain: true },
  ],
  contact: [
    { name: 'name', label: 'Name', placeholder: 'Ada Lovelace' },
    { name: 'phone', label: 'Phone', placeholder: 'Optional', keyboardType: 'phone-pad' },
    { name: 'email', label: 'Email', placeholder: 'Optional', keyboardType: 'email-address', plain: true },
    { name: 'org', label: 'Company', placeholder: 'Optional' },
  ],
  phone: [
    { name: 'number', label: 'Phone number', placeholder: '+91 98765 43210', keyboardType: 'phone-pad' },
  ],
  email: [
    { name: 'to', label: 'To', placeholder: 'name@example.com', keyboardType: 'email-address', plain: true },
    { name: 'subject', label: 'Subject', placeholder: 'Optional' },
    { name: 'body', label: 'Message', placeholder: 'Optional', multiline: true },
  ],
  sms: [
    { name: 'number', label: 'Phone number', placeholder: '+91 98765 43210', keyboardType: 'phone-pad' },
    { name: 'body', label: 'Message', placeholder: 'Optional', multiline: true },
  ],
  location: [
    { name: 'lat', label: 'Latitude', placeholder: '18.5204', keyboardType: 'numeric' },
    { name: 'lng', label: 'Longitude', placeholder: '73.8567', keyboardType: 'numeric' },
  ],
};

const SECURITY_OPTIONS: { value: WifiSecurity; label: string }[] = [
  { value: 'wpa2', label: 'WPA2' },
  { value: 'open', label: 'Open' },
];

function toPayload(
  kind: RecordKind,
  f: Record<FieldName, string>,
  security: WifiSecurity,
): WritePayload {
  switch (kind) {
    case 'text':
      return { kind, text: f.text };
    case 'url':
      return { kind, url: f.url };
    case 'wifi':
      return { kind, ssid: f.ssid, password: f.password, security };
    case 'contact':
      return { kind, name: f.name, phone: f.phone, email: f.email, org: f.org };
    case 'phone':
      return { kind, number: f.number };
    case 'email':
      return { kind, to: f.to, subject: f.subject, body: f.body };
    case 'sms':
      return { kind, number: f.number, body: f.body };
    case 'location':
      return { kind, lat: f.lat, lng: f.lng };
  }
}

export default function WriteScreen() {
  const { colors } = useTheme();
  const { message, pending, writeNfc, cancelScan } = useNfcContext();
  const [kind, setKind] = useState<RecordKind>('text');
  // One value per field name, so switching types keeps what you typed, and
  // Phone and SMS share the number.
  const [fields, setFields] = useState<Record<FieldName, string>>({
    text: 'Hello from React Native NFC!',
    url: 'https://',
    ssid: '',
    password: '',
    name: '',
    phone: '',
    email: '',
    org: '',
    number: '',
    to: '',
    subject: '',
    body: '',
    lat: '',
    lng: '',
  });
  const [security, setSecurity] = useState<WifiSecurity>('wpa2');
  // History's "write this again" sends a payload; `at` refills on a repeat tap.
  const params = useLocalSearchParams<{ payload?: string; at?: string }>();
  useEffect(() => {
    if (!params.payload) return;
    const payload: WritePayload = JSON.parse(params.payload);
    const { kind: next, ...values } = payload;
    setKind(next);
    if (payload.kind === 'wifi') setSecurity(payload.security);
    // Payload keys match field names; toPayload ignores the extra `security`.
    setFields(prev => ({ ...prev, ...values }));
  }, [params.payload, params.at]);
  const [locating, setLocating] = useState(false);
  // Cancels and failed checks show here; finished writes open the sheet.
  const [notice, setNotice] = useState<NfcMessage | null>(null);
  const banner = pending === 'write' ? message : notice;
  const type = RECORD_TYPES.find(t => t.kind === kind) ?? RECORD_TYPES[0];
  const visibleFields = FIELDS[kind].filter(
    field => !(kind === 'wifi' && security === 'open' && field.name === 'password'),
  );

  const onWrite = async () => {
    setNotice(null);
    const outcome = await writeNfc(toPayload(kind, fields, security));
    if (outcome && !presentOutcome('write', outcome)) {
      setNotice(outcome.message);
    }
  };

  const fillMyLocation = async () => {
    setNotice(null);
    setLocating(true);
    try {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted) {
        setNotice({ kind: 'error', text: 'Location permission denied' });
        return;
      }
      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setFields(prev => ({
        ...prev,
        lat: coords.latitude.toFixed(6),
        lng: coords.longitude.toFixed(6),
      }));
    } catch (ex: unknown) {
      console.warn('Location error', ex);
      setNotice({ kind: 'error', text: 'Could not get your location' });
    } finally {
      setLocating(false);
    }
  };

  return (
    <Screen title="Write" subtitle="Choose what the tag should hold">
      {banner ? <MessageBanner message={banner} /> : null}

      <RecordTypePicker value={kind} onChange={setKind} />

      <Card>
        <SectionHeader title={type.label} description={type.description} />
        {kind === 'wifi' ? (
          <SegmentedControl
            options={SECURITY_OPTIONS}
            value={security}
            onChange={setSecurity}
          />
        ) : null}
        {visibleFields.map(field => (
          <React.Fragment key={field.name}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {field.label}
            </Text>
            <TextInput
              style={[
                styles.input,
                field.multiline && styles.multiline,
                {
                  backgroundColor: colors.surfaceInset,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                },
              ]}
              accessibilityLabel={field.label}
              onChangeText={value =>
                setFields(prev => ({ ...prev, [field.name]: value }))
              }
              value={fields[field.name]}
              placeholder={field.placeholder}
              placeholderTextColor={colors.textMuted}
              multiline={field.multiline}
              keyboardType={field.keyboardType}
              autoCapitalize={field.plain ? 'none' : 'sentences'}
              autoCorrect={!field.plain}
            />
          </React.Fragment>
        ))}
        {kind === 'location' ? (
          <SecondaryButton
            label={locating ? 'Finding you...' : 'Use my location'}
            icon="location"
            onPress={locating ? undefined : fillMyLocation}
          />
        ) : null}
        {pending === 'write' ? (
          <PrimaryButton label="Cancel" onPress={cancelScan} />
        ) : (
          <PrimaryButton label="Write to Tag" onPress={onWrite} />
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: {
    ...TextStyles.label,
    marginBottom: Spacing.xs,
  },
  input: {
    ...TextStyles.body,
    borderRadius: Radius.md,
    borderWidth: BorderWidth.normal,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
