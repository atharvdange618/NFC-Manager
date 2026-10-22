import { Ndef, NdefRecord } from 'react-native-nfc-manager';
import { decodeRecord, isTextRecord } from '../ndef';

jest.mock('react-native-nfc-manager/src/NativeNfcManager');

const textRecord = (text: string): NdefRecord => {
  const [record] = Ndef.decodeMessage(Ndef.encodeMessage([Ndef.textRecord(text)]));
  return record;
};

describe('isTextRecord', () => {
  it('accepts a well-known record whose type is the string "T"', () => {
    expect(isTextRecord({ ...textRecord('hi'), type: 'T' })).toBe(true);
  });

  it('rejects a non-well-known record', () => {
    expect(
      isTextRecord({ tnf: Ndef.TNF_MIME_MEDIA, type: 'T', payload: [] }),
    ).toBe(false);
  });

  it('rejects a well-known record that is not text', () => {
    expect(
      isTextRecord({ tnf: Ndef.TNF_WELL_KNOWN, type: 'U', payload: [] }),
    ).toBe(false);
  });
});

describe('decodeRecord', () => {
  it('decodes a text record to its string', () => {
    expect(decodeRecord({ ...textRecord('Hello NFC'), type: 'T' })).toBe(
      'Hello NFC',
    );
  });

  it('falls back to hex for other records', () => {
    expect(
      decodeRecord({ tnf: Ndef.TNF_MIME_MEDIA, type: 'x', payload: [0xab, 0x01] }),
    ).toBe(Ndef.util.bytesToHexString([0xab, 0x01]));
  });
});
