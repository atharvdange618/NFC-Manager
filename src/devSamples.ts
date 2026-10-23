import { Ndef, NdefRecord } from 'react-native-nfc-manager';
import { addScan } from './history';
import { toRecord } from './nfc/records';

// Debug builds only: fills History without a physical tag. Records go
// through toRecord, so they decode the same way a real read would.
const NTAG = ['android.nfc.tech.NfcA', 'android.nfc.tech.MifareUltralight', 'android.nfc.tech.Ndef'];
const HOUR = 60 * 60 * 1000;

const SAMPLES: { id: string; records: NdefRecord[] }[] = [
  { id: '04A1B2C3D4E580', records: [toRecord({ kind: 'url', url: 'https://x.com/atharvdangedev' })] },
  { id: '04A1B2C3D4E581', records: [toRecord({ kind: 'text', text: 'Spare keys are in the blue drawer' })] },
  { id: '04A1B2C3D4E582', records: [toRecord({ kind: 'wifi', ssid: 'Home Wi-Fi', password: 'correct horse', security: 'wpa2' })] },
  { id: '04A1B2C3D4E583', records: [toRecord({ kind: 'contact', name: 'Ada Lovelace', phone: '+919876543210', email: 'ada@example.com', org: 'Analytical Engines; R&D' })] },
  { id: '04A1B2C3D4E584', records: [toRecord({ kind: 'phone', number: '+919876543210' })] },
  { id: '04A1B2C3D4E585', records: [toRecord({ kind: 'email', to: 'hello@example.com', subject: 'Found your tag', body: 'Tapped it at the cafe.' })] },
  { id: '04A1B2C3D4E586', records: [toRecord({ kind: 'sms', number: '+919876543210', body: 'On my way' })] },
  { id: '04A1B2C3D4E587', records: [toRecord({ kind: 'location', lat: '18.520430', lng: '73.856743' })] },
  {
    id: '04A1B2C3D4E588',
    records: [
      toRecord({ kind: 'url', url: 'https://example.com/menu' }),
      toRecord({ kind: 'text', text: 'Table 12' }),
      Ndef.record(Ndef.TNF_EXTERNAL_TYPE, 'android.com:pkg', [], 'com.example.menu'),
    ],
  },
  { id: '04A1B2C3D4E589', records: [] },
];

export function addSampleScans() {
  const now = Date.now();
  // Oldest first, so the list ends up in the order above.
  [...SAMPLES].reverse().forEach((sample, i) =>
    addScan(
      { id: sample.id, techTypes: NTAG, ndefMessage: sample.records },
      now - (SAMPLES.length - i) * 3 * HOUR,
    ),
  );
}
