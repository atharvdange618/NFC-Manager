import { Ndef } from 'react-native-nfc-manager';
import { chipFromVersion, ndefBytesUsed } from '../tagInfo';

jest.mock('react-native-nfc-manager/dist/src/NativeNfcManager', () =>
  jest.requireActual('react-native-nfc-manager/src/__mocks__/NativeNfcManager'),
);

const version = (size: number) => [0x00, 0x04, 0x04, 0x02, 0x01, 0x00, size, 0x03];

describe('chipFromVersion', () => {
  it('maps the storage byte to the NTAG21x chip', () => {
    expect(chipFromVersion(version(0x0f))).toBe('NTAG213');
    expect(chipFromVersion(version(0x11))).toBe('NTAG215');
    expect(chipFromVersion(version(0x13))).toBe('NTAG216');
  });

  it('returns null for other vendors, other sizes and short replies', () => {
    expect(chipFromVersion([0x00, 0x05, 0x04, 0x02, 0x01, 0x00, 0x0f, 0x03])).toBeNull();
    expect(chipFromVersion(version(0x0b))).toBeNull();
    expect(chipFromVersion([0x00, 0x04])).toBeNull();
  });
});

describe('ndefBytesUsed', () => {
  it('is 0 for an empty tag', () => {
    expect(ndefBytesUsed({})).toBe(0);
    expect(ndefBytesUsed({ ndefMessage: [] })).toBe(0);
  });

  it('counts the encoded message', () => {
    const record = Ndef.textRecord('hi');
    expect(ndefBytesUsed({ ndefMessage: [record] })).toBe(
      Ndef.encodeMessage([record]).length,
    );
  });

  it('counts a record in the shape Android returns it', () => {
    const [record] = Ndef.decodeMessage(
      Ndef.encodeMessage([Ndef.textRecord('hi')]),
    );
    const fromAndroid = { ...record, type: [0x54], id: '' };
    expect(ndefBytesUsed({ ndefMessage: [fromAndroid] })).toBe(
      Ndef.encodeMessage([Ndef.textRecord('hi')]).length,
    );
  });

  it('is null when the message cannot be re-encoded', () => {
    const spy = jest.spyOn(Ndef, 'encodeMessage').mockImplementation(() => {
      throw new Error('bad record');
    });
    expect(ndefBytesUsed({ ndefMessage: [Ndef.textRecord('hi')] })).toBeNull();
    spy.mockRestore();
  });
});
