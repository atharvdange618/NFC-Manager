import NfcManager, { NfcTech } from 'react-native-nfc-manager';

// Android connects the first tech in the list the tag supports.
export async function withNdef<T>(
  fn: () => Promise<T>,
  tech: NfcTech | NfcTech[] = NfcTech.Ndef,
): Promise<T> {
  try {
    await NfcManager.requestTechnology(tech);
    return await fn();
  } finally {
    await NfcManager.cancelTechnologyRequest();
  }
}
