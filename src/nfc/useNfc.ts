import { useState, useEffect, useCallback } from 'react';
import NfcManager, {
  Ndef,
  NfcError,
  NfcTech,
  TagEvent,
} from 'react-native-nfc-manager';
import { withNdef } from './withNdef';
import { addScan } from '../history';
import { Chip, readChip } from './tagInfo';
import {
  describeRecord,
  parseRecord,
  toRecord,
  validatePayload,
  WritePayload,
} from './records';

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
  const [scannedChip, setScannedChip] = useState<Chip | null>(null);
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
    setScannedChip(null);
    setPending('read');

    let result: NfcMessage;
    try {
      result = await withNdef(async (): Promise<NfcMessage> => {
        const tag = await NfcManager.getTag();
        setScannedTag(tag);
        if (tag) addScan(tag);
        // NfcA first so GET_VERSION can run; getTag still has the NDEF data.
        setScannedChip(await readChip());

        let parsed = 'No NDEF data.';
        if (tag?.ndefMessage?.length) {
          parsed = describeRecord(parseRecord(tag.ndefMessage[0]));
        }
        return { kind: 'success', text: `Tag read: ${parsed}` };
      }, [NfcTech.NfcA, NfcTech.Ndef]);
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
    async (payload: WritePayload): Promise<NfcOutcome | null> => {
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
      const invalid = validatePayload(payload);
      if (invalid) {
        return finish({ kind: 'error', text: invalid }, false);
      }

      setMessage({ kind: 'info', text: 'Ready to write...' });
      setPending('write');
      let result: NfcMessage;
      try {
        result = await withNdef(async (): Promise<NfcMessage> => {
          const bytes = Ndef.encodeMessage([toRecord(payload)]);
          await NfcManager.ndefHandler.writeNdefMessage(bytes);
          return { kind: 'success', text: `Wrote: "${describeRecord(payload)}"` };
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
    scannedChip,
    message,
    pending,
    readNfc,
    cancelScan,
    writeNfc,
  };
}
