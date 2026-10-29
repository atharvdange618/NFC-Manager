import NfcManager, { NfcAdapter } from 'react-native-nfc-manager';

/* eslint-disable no-bitwise -- reader-mode flags are a bit mask */

// A reader-mode session for as long as the app is open. With no session,
// Android hands every tag to its own dispatcher, and when more than one
// tag app is installed that is the "Choose an action" dialog. A session
// also covers the tap that finishes a write, when the tag is still in the
// field and its new content would otherwise be dispatched again.
// FLAG_READER_SKIP_NDEF_CHECK stays off because writing needs the Ndef
// tech, which only exists after the platform's NDEF check.
const READER_MODE = {
  isReaderModeEnabled: true,
  readerModeFlags:
    NfcAdapter.FLAG_READER_NFC_A |
    NfcAdapter.FLAG_READER_NFC_B |
    NfcAdapter.FLAG_READER_NFC_F |
    NfcAdapter.FLAG_READER_NFC_V,
};

export async function holdTagSession(): Promise<void> {
  await NfcManager.registerTagEvent(READER_MODE);
}
