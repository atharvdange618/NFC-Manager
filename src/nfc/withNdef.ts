import NfcManager, { NfcTech } from 'react-native-nfc-manager';

export async function withNdef(fn: () => Promise<void>) {
  try {
    await NfcManager.requestTechnology(NfcTech.Ndef);
    await fn();
  } finally {
    await NfcManager.cancelTechnologyRequest();
  }
}
