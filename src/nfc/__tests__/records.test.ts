import { Ndef, NdefRecord } from 'react-native-nfc-manager';
import {
  describeRecord,
  parseRecord,
  payloadUri,
  toRecord,
  validatePayload,
  WritePayload,
} from '../records';

// v4 loads the compiled dist/ module, but ships its mock next to src/.
jest.mock('react-native-nfc-manager/dist/src/NativeNfcManager', () =>
  jest.requireActual('react-native-nfc-manager/src/__mocks__/NativeNfcManager'),
);

// Encode, then decode the way a tag read does, with the byte-array type
// Android returns.
function roundTrip(p: WritePayload) {
  const [record] = Ndef.decodeMessage(Ndef.encodeMessage([toRecord(p)]));
  const type = typeof record.type === 'string'
    ? Ndef.util.stringToBytes(record.type)
    : record.type;
  return parseRecord({ ...record, type });
}

const wifi: WritePayload = {
  kind: 'wifi',
  ssid: 'Home 5G',
  password: 'hunter22',
  security: 'wpa2',
};
const contact: WritePayload = {
  kind: 'contact',
  name: 'Atharv Dange',
  phone: '+91 98765 43210',
  email: 'a@example.com',
  org: 'Dange; Sons, Ltd',
};

describe('round trip', () => {
  // `expected` is set where writing normalises the input.
  it.each<{ name: string; input: WritePayload; expected?: WritePayload }>([
    { name: 'text', input: { kind: 'text', text: 'Hello NFC' } },
    { name: 'url', input: { kind: 'url', url: 'https://x.com/atharvdangedev' } },
    { name: 'wifi', input: wifi },
    { name: 'open wifi', input: { kind: 'wifi', ssid: 'Cafe', password: '', security: 'open' } },
    { name: 'contact', input: contact, expected: { ...contact, phone: '+919876543210' } },
    {
      name: 'phone',
      input: { kind: 'phone', number: '+1 (555) 010-9999' },
      expected: { kind: 'phone', number: '+15550109999' },
    },
    {
      name: 'email',
      input: { kind: 'email', to: 'a@example.com', subject: 'Hi & bye', body: 'Line one\nline two' },
    },
    { name: 'bare email', input: { kind: 'email', to: 'a@example.com', subject: '', body: '' } },
    { name: 'sms', input: { kind: 'sms', number: '+15550109999', body: 'On my way?' } },
    { name: 'location', input: { kind: 'location', lat: '18.5204', lng: '73.8567' } },
  ])('decodes a written $name record back to the same payload', ({ input, expected }) => {
    expect(roundTrip(input)).toEqual(expected ?? input);
  });
});

describe('toRecord', () => {
  it('writes the Wi-Fi Simple Config open auth type as 0x0001', () => {
    const record = toRecord({ kind: 'wifi', ssid: 'Cafe', password: 'x', security: 'open' });
    expect(record.payload.slice(4, 10)).toEqual([0x10, 0x03, 0x00, 0x02, 0x00, 0x01]);
  });

  it('drops the password on an open network', () => {
    const parsed = roundTrip({ kind: 'wifi', ssid: 'Cafe', password: 'left over', security: 'open' });
    expect(parsed).toMatchObject({ password: '' });
  });

  it('stores a contact as a text/vcard MIME record', () => {
    const record = toRecord(contact);
    expect(record.tnf).toBe(Ndef.TNF_MIME_MEDIA);
    expect(Ndef.util.bytesToString(record.payload)).toContain('ORG:Dange\\; Sons\\, Ltd');
  });
});

describe('payloadUri', () => {
  it('builds the URIs the read actions open', () => {
    expect(payloadUri({ kind: 'phone', number: '555 0100' })).toBe('tel:5550100');
    expect(payloadUri({ kind: 'sms', number: '5550100', body: '' })).toBe('sms:5550100');
    expect(payloadUri({ kind: 'email', to: 'a@b.co', subject: 'a b', body: '' })).toBe(
      'mailto:a@b.co?subject=a%20b',
    );
    expect(payloadUri({ kind: 'location', lat: ' 18.5 ', lng: '-73' })).toBe('geo:18.5,-73');
  });
});

describe('parseRecord', () => {
  const uri = (value: string): NdefRecord => ({
    tnf: Ndef.TNF_WELL_KNOWN,
    type: [0x55],
    payload: [0x00, ...Ndef.util.stringToBytes(value)],
  });

  it('reads smsto: and a geo query the way other apps write them', () => {
    expect(parseRecord(uri('smsto:5550100?body=Hi+there'))).toEqual({
      kind: 'sms',
      number: '5550100',
      body: 'Hi there',
    });
    expect(parseRecord(uri('geo:18.5,73.8?q=Pune'))).toEqual({
      kind: 'location',
      lat: '18.5',
      lng: '73.8',
    });
  });

  it('reads a folded text/x-vCard from another writer', () => {
    const card = 'BEGIN:VCARD\r\nVERSION:2.1\r\nFN:Ada\r\n Lovelace\r\nTEL;CELL:555\r\nEND:VCARD';
    const record: NdefRecord = {
      tnf: Ndef.TNF_MIME_MEDIA,
      type: Ndef.util.stringToBytes('text/x-vCard'),
      payload: Ndef.util.stringToBytes(card),
    };
    expect(parseRecord(record)).toEqual({
      kind: 'contact',
      name: 'AdaLovelace',
      phone: '555',
      email: '',
      org: '',
    });
  });

  it('falls back to hex for records it does not know', () => {
    const parsed = parseRecord({ tnf: Ndef.TNF_EXTERNAL_TYPE, type: 'x:y', payload: [0xab] });
    expect(parsed).toEqual({ kind: 'unknown', type: 'x:y', hex: Ndef.util.bytesToHexString([0xab]) });
    expect(describeRecord(parsed)).toBe(`Raw payload: ${Ndef.util.bytesToHexString([0xab])}`);
  });
});

describe('validatePayload', () => {
  it.each<[WritePayload, string]>([
    [{ kind: 'text', text: '  ' }, 'Enter text to write'],
    [{ kind: 'url', url: 'x.com' }, 'Enter a URL starting with http:// or https://'],
    [{ ...wifi, ssid: '' }, 'Enter the network name'],
    [{ ...wifi, ssid: 'x'.repeat(33) }, 'Network names are at most 32 bytes'],
    [{ ...wifi, password: 'short' }, 'Wi-Fi passwords are 8 to 63 characters'],
    [{ ...contact, name: ' ' }, 'Enter a name'],
    [{ ...contact, email: 'nope' }, 'Enter a valid email address'],
    [{ ...contact, phone: 'call me' }, 'Enter a valid phone number'],
    [{ kind: 'phone', number: '12' }, 'Enter a phone number'],
    [{ kind: 'sms', number: '', body: 'hi' }, 'Enter a phone number'],
    [{ kind: 'email', to: 'a@b', subject: '', body: '' }, 'Enter an email address'],
    [{ kind: 'location', lat: '91', lng: '0' }, 'Enter a latitude from -90 to 90'],
    [{ kind: 'location', lat: '0', lng: 'east' }, 'Enter a longitude from -180 to 180'],
    [{ kind: 'location', lat: '', lng: '0' }, 'Enter a latitude from -90 to 90'],
  ])('rejects %j', (payload, message) => {
    expect(validatePayload(payload)).toBe(message);
  });

  it('accepts an open network without a password', () => {
    expect(validatePayload({ ...wifi, password: '', security: 'open' })).toBeNull();
  });

  it('accepts a contact with only a name', () => {
    expect(validatePayload({ ...contact, phone: '', email: '', org: '' })).toBeNull();
  });
});
