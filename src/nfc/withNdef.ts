import NfcManager, { NfcTech } from 'react-native-nfc-manager';

export async function withNdef(
  fn: () => Promise<void>,
  alertMessage = 'Hold your device near an NFC tag',
) {
  try {
    await NfcManager.requestTechnology(NfcTech.Ndef, { alertMessage });
    await fn();
  } finally {
    NfcManager.cancelTechnologyRequest();
  }
}
