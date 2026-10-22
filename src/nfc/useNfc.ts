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
  if (ex instanceof NfcError.UserCancel) {
    return { kind: 'info', text: `${action} cancelled` };
  }
  console.warn(`NFC ${action.toLowerCase()} error`, ex);
  return { kind: 'error', text: `${action} failed: ${errorText(ex)}` };
}

export function useNfc() {
  const [nfcSupported, setNfcSupported] = useState(false);
  const [nfcEnabled, setNfcEnabled] = useState(false);
  const [scannedTag, setScannedTag] = useState<TagEvent | null>(null);
  const [message, setMessage] = useState<NfcMessage | null>(null);
  // Which action is waiting for a tag; only one native request can run at a time.
  const [pending, setPending] = useState<'read' | 'write' | null>(null);

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
    if (pending) {
      return;
    }
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
    setPending('read');

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
    } finally {
      setPending(null);
    }
  }, [nfcSupported, nfcEnabled, pending]);

  // On Android this rejects the pending request with UserCancel, which
  // the read or write catch turns into a "cancelled" message.
  const cancelScan = useCallback(() => {
    NfcManager.cancelTechnologyRequest();
  }, []);

  const writeNfc = useCallback(
    async (text: string) => {
      if (pending) {
        return;
      }
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
      setPending('write');
      try {
        await withNdef(async () => {
          const bytes = Ndef.encodeMessage([Ndef.textRecord(text)]);
          await NfcManager.ndefHandler.writeNdefMessage(bytes);
          setMessage({ kind: 'success', text: `Wrote: "${text}"` });
        }, 'Approach tag to write');
      } catch (ex: unknown) {
        setMessage(failureMessage('Write', ex));
      } finally {
        setPending(null);
      }
    },
    [nfcSupported, nfcEnabled, pending],
  );

  return {
    nfcSupported,
    nfcEnabled,
    scannedTag,
    message,
    pending,
    readNfc,
    cancelScan,
    writeNfc,
  };
}
