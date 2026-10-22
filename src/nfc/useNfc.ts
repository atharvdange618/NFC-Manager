import { useState, useEffect, useCallback } from 'react';
import NfcManager, { Ndef, TagEvent } from 'react-native-nfc-manager';
import { withNdef } from './withNdef';
import { decodeRecord, isTextRecord } from './ndef';

export function useNfc() {
  const [nfcSupported, setNfcSupported] = useState(false);
  const [nfcEnabled, setNfcEnabled] = useState(false);
  const [scannedTag, setScannedTag] = useState<TagEvent | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function initNfc() {
      try {
        const supported = await NfcManager.isSupported();
        setNfcSupported(supported);

        if (supported) {
          await NfcManager.start();
          const enabled = await NfcManager.isEnabled();
          setNfcEnabled(enabled);
        }
      } catch (ex: any) {
        console.warn('NFC initialization error', ex);
        setMessage(`NFC init error: ${ex.message}`);
      }
    }
    initNfc();
  }, []);

  const readNfc = useCallback(async () => {
    if (!nfcSupported || !nfcEnabled) {
      setMessage(
        !nfcSupported
          ? 'NFC not supported'
          : 'NFC disabled; enable in settings',
      );
      return;
    }

    setMessage('Ready to scan...');
    setScannedTag(null);

    await withNdef(async () => {
      const tag = await NfcManager.getTag();
      setScannedTag(tag);

      let parsed = 'No NDEF data.';
      if (tag?.ndefMessage?.length) {
        const rec = tag.ndefMessage[0];
        parsed = isTextRecord(rec)
          ? decodeRecord(rec)
          : `Raw payload: ${decodeRecord(rec)}`;
      }
      setMessage(`Tag read: ${parsed}`);
    }, 'Approach tag to read');
  }, [nfcSupported, nfcEnabled]);

  const writeNfc = useCallback(
    async (text: string) => {
      if (!nfcSupported || !nfcEnabled) {
        setMessage(!nfcSupported ? 'NFC not supported' : 'Enable NFC first');
        return;
      }
      if (!text.trim()) {
        setMessage('Enter text to write');
        return;
      }

      setMessage('Ready to write...');
      await withNdef(async () => {
        const bytes = Ndef.encodeMessage([Ndef.textRecord(text)]);
        await NfcManager.ndefHandler.writeNdefMessage(bytes);
        setMessage(`Wrote: "${text}"`);
      }, 'Approach tag to write');
    },
    [nfcSupported, nfcEnabled],
  );

  return { nfcSupported, nfcEnabled, scannedTag, message, readNfc, writeNfc };
}
