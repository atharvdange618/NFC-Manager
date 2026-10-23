import { useState, useEffect, useCallback } from 'react';
import NfcManager, { Ndef, NfcError, TagEvent } from 'react-native-nfc-manager';
import { withNdef } from './withNdef';
import { decodeRecord, isKnownRecord } from './ndef';

export type RecordKind = 'text' | 'url';

// http(s) scheme, then at least one non-space character.
const URL_PATTERN = /^https?:\/\/\S+$/i;

export interface NfcMessage {
  kind: 'info' | 'success' | 'error';
  text: string;
}

// `attempted` is false when a check stopped the action before a tag request.
export interface NfcOutcome {
  message: NfcMessage;
  attempted: boolean;
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

  const finish = useCallback(
    (next: NfcMessage, attempted: boolean): NfcOutcome => {
      setMessage(next);
      return { message: next, attempted };
    },
    [],
  );

  const readNfc = useCallback(async (): Promise<NfcOutcome | null> => {
    if (pending) {
      return null;
    }
    if (!nfcSupported || !nfcEnabled) {
      return finish(
        {
          kind: 'error',
          text: !nfcSupported
            ? 'NFC not supported'
            : 'NFC disabled; enable in settings',
        },
        false,
      );
    }

    setMessage({ kind: 'info', text: 'Ready to scan...' });
    setScannedTag(null);
    setPending('read');

    let result: NfcMessage;
    try {
      result = await withNdef(async (): Promise<NfcMessage> => {
        const tag = await NfcManager.getTag();
        setScannedTag(tag);

        let parsed = 'No NDEF data.';
        if (tag?.ndefMessage?.length) {
          const rec = tag.ndefMessage[0];
          parsed = isKnownRecord(rec)
            ? decodeRecord(rec)
            : `Raw payload: ${decodeRecord(rec)}`;
        }
        return { kind: 'success', text: `Tag read: ${parsed}` };
      });
    } catch (ex: unknown) {
      result = failureMessage('Read', ex);
    } finally {
      setPending(null);
    }
    return finish(result, true);
  }, [nfcSupported, nfcEnabled, pending, finish]);

  // This rejects the pending request with UserCancel, which
  // the read or write catch turns into a "cancelled" message.
  const cancelScan = useCallback(() => {
    NfcManager.cancelTechnologyRequest();
  }, []);

  const writeNfc = useCallback(
    async (input: string, kind: RecordKind): Promise<NfcOutcome | null> => {
      if (pending) {
        return null;
      }
      if (!nfcSupported || !nfcEnabled) {
        return finish(
          {
            kind: 'error',
            text: !nfcSupported ? 'NFC not supported' : 'Enable NFC first',
          },
          false,
        );
      }
      // Text is written as typed; a URL is trimmed so stray spaces don't break it.
      const value = kind === 'url' ? input.trim() : input;
      if (kind === 'url' && !URL_PATTERN.test(value)) {
        return finish(
          {
            kind: 'error',
            text: 'Enter a URL starting with http:// or https://',
          },
          false,
        );
      }
      if (!value.trim()) {
        return finish({ kind: 'error', text: 'Enter text to write' }, false);
      }

      setMessage({ kind: 'info', text: 'Ready to write...' });
      setPending('write');
      let result: NfcMessage;
      try {
        result = await withNdef(async (): Promise<NfcMessage> => {
          const record =
            kind === 'url' ? Ndef.uriRecord(value) : Ndef.textRecord(value);
          const bytes = Ndef.encodeMessage([record]);
          await NfcManager.ndefHandler.writeNdefMessage(bytes);
          return { kind: 'success', text: `Wrote: "${value}"` };
        });
      } catch (ex: unknown) {
        result = failureMessage('Write', ex);
      } finally {
        setPending(null);
      }
      return finish(result, true);
    },
    [nfcSupported, nfcEnabled, pending, finish],
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
