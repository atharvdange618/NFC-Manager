import NfcManager, { NfcTech } from 'react-native-nfc-manager';

export async function withNdef<T>(fn: () => Promise<T>): Promise<T> {
  try {
    await NfcManager.requestTechnology(NfcTech.Ndef);
    return await fn();
  } finally {
    await NfcManager.cancelTechnologyRequest();
  }
}
