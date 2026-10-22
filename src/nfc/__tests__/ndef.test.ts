import { Ndef, NdefRecord } from 'react-native-nfc-manager';
import { decodeRecord, isTextRecord, recordTypeName } from '../ndef';

jest.mock('react-native-nfc-manager/src/NativeNfcManager');

const textRecord = (text: string): NdefRecord => {
  const [record] = Ndef.decodeMessage(Ndef.encodeMessage([Ndef.textRecord(text)]));
  return record;
};

describe('isTextRecord', () => {
  it('accepts a well-known record whose type is the string "T"', () => {
    expect(isTextRecord({ ...textRecord('hi'), type: 'T' })).toBe(true);
  });

  it('accepts a text record whose type is a byte array, as Android returns it', () => {
    expect(isTextRecord({ ...textRecord('hi'), type: [0x54] })).toBe(true);
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

  it('decodes a text record with a byte-array type', () => {
    expect(decodeRecord({ ...textRecord('Hello NFC'), type: [0x54] })).toBe(
      'Hello NFC',
    );
  });

  it('falls back to hex for other records', () => {
    expect(
      decodeRecord({ tnf: Ndef.TNF_MIME_MEDIA, type: 'x', payload: [0xab, 0x01] }),
    ).toBe(Ndef.util.bytesToHexString([0xab, 0x01]));
  });
});

describe('recordTypeName', () => {
  it('returns a string type as is', () => {
    expect(recordTypeName({ tnf: Ndef.TNF_WELL_KNOWN, type: 'T', payload: [] })).toBe('T');
  });

  it('converts a byte-array type to a string', () => {
    expect(
      recordTypeName({ tnf: Ndef.TNF_WELL_KNOWN, type: [0x54], payload: [] }),
    ).toBe('T');
  });
});
