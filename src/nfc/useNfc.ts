import { useState, useEffect, useCallback } from 'react';
import NfcManager, { Ndef, NfcError, TagEvent } from 'react-native-nfc-manager';
import { withNdef } from './withNdef';
import { decodeRecord, isTextRecord } from './ndef';

export interface NfcMessage {
  kind: 'info' | 'success' | 'error';
  text: string;
}

function errorText(ex: unknown): string {
  return ex instanceof Error ? ex.message : String(ex);
}

function failureMessage(action: 'Read' | 'Write', ex: unknown): NfcMessage {
  console.warn(`NFC ${action.toLowerCase()} error`, ex);
  if (ex instanceof NfcError.UserCancel) {
    return { kind: 'info', text: 'Scan cancelled' };
  }
  return { kind: 'error', text: `${action} failed: ${errorText(ex)}` };
}

export function useNfc() {
  const [nfcSupported, setNfcSupported] = useState(false);
  const [nfcEnabled, setNfcEnabled] = useState(false);
  const [scannedTag, setScannedTag] = useState<TagEvent | null>(null);
  const [message, setMessage] = useState<NfcMessage | null>(null);

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
      } catch (ex: unknown) {
        console.warn('NFC initialization error', ex);
        setMessage({ kind: 'error', text: `NFC init error: ${errorText(ex)}` });
      }
    }
    initNfc();
  }, []);

  const readNfc = useCallback(async () => {
    if (!nfcSupported || !nfcEnabled) {
      setMessage({
        kind: 'error',
        text: !nfcSupported
          ? 'NFC not supported'
          : 'NFC disabled; enable in settings',
      });
      return;
    }

    setMessage({ kind: 'info', text: 'Ready to scan...' });
    setScannedTag(null);

    try {
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
        setMessage({ kind: 'success', text: `Tag read: ${parsed}` });
      }, 'Approach tag to read');
    } catch (ex: unknown) {
      setMessage(failureMessage('Read', ex));
    }
  }, [nfcSupported, nfcEnabled]);

  const writeNfc = useCallback(
    async (text: string) => {
      if (!nfcSupported || !nfcEnabled) {
        setMessage({
          kind: 'error',
          text: !nfcSupported ? 'NFC not supported' : 'Enable NFC first',
        });
        return;
      }
      if (!text.trim()) {
        setMessage({ kind: 'error', text: 'Enter text to write' });
        return;
      }

      setMessage({ kind: 'info', text: 'Ready to write...' });
      try {
        await withNdef(async () => {
          const bytes = Ndef.encodeMessage([Ndef.textRecord(text)]);
          await NfcManager.ndefHandler.writeNdefMessage(bytes);
          setMessage({ kind: 'success', text: `Wrote: "${text}"` });
        }, 'Approach tag to write');
      } catch (ex: unknown) {
        setMessage(failureMessage('Write', ex));
      }
    },
    [nfcSupported, nfcEnabled],
  );

  return { nfcSupported, nfcEnabled, scannedTag, message, readNfc, writeNfc };
}
