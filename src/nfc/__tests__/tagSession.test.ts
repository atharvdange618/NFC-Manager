import NfcManager, { NfcAdapter } from 'react-native-nfc-manager';
import { holdTagSession } from '../tagSession';

/* eslint-disable no-bitwise -- reader-mode flags are a bit mask */

// v4 loads the compiled dist/ module, but ships its mock next to src/.
jest.mock('react-native-nfc-manager/dist/src/NativeNfcManager', () =>
  jest.requireActual('react-native-nfc-manager/src/__mocks__/NativeNfcManager'),
);
jest.mock('react-native-nfc-manager', () => {
  const actual = jest.requireActual('react-native-nfc-manager');
  return {
    __esModule: true,
    ...actual,
    default: { registerTagEvent: jest.fn() },
  };
});

const nfc = jest.mocked(NfcManager);

describe('holdTagSession', () => {
  it('registers a reader-mode session for every NFC tag type', async () => {
    await holdTagSession();

    expect(nfc.registerTagEvent).toHaveBeenCalledWith({
      isReaderModeEnabled: true,
      readerModeFlags:
        NfcAdapter.FLAG_READER_NFC_A |
        NfcAdapter.FLAG_READER_NFC_B |
        NfcAdapter.FLAG_READER_NFC_F |
        NfcAdapter.FLAG_READER_NFC_V,
    });
  });

  it('keeps the NDEF check so writes still have the Ndef tech', async () => {
    await holdTagSession();

    const { readerModeFlags } = nfc.registerTagEvent.mock.calls[0][0] ?? {};
    expect((readerModeFlags ?? 0) & NfcAdapter.FLAG_READER_SKIP_NDEF_CHECK).toBe(0);
  });
});
