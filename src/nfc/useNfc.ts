import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import NfcManager, {
  Ndef,
  NfcError,
  NfcEvents,
  NfcTech,
  TagEvent,
} from 'react-native-nfc-manager';
import { withNdef } from './withNdef';
import { holdTagSession } from './tagSession';
import { presentOutcome } from './presentOutcome';
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

// Android can report one tap more than once: the intent that launches the
// activity, then the reader-mode session picking the tag up again. A read or
// write can also be rediscovered just after it ends. Neither should add a
// second history row or open a second sheet.
const REPEAT_MS = 2000;

export function useNfc() {
  const [nfcSupported, setNfcSupported] = useState(false);
  const [nfcEnabled, setNfcEnabled] = useState(false);
  const [scannedTag, setScannedTag] = useState<TagEvent | null>(null);
  const [scannedChip, setScannedChip] = useState<Chip | null>(null);
  const [message, setMessage] = useState<NfcMessage | null>(null);
  // Which action is waiting for a tag; only one native request can run at a time.
  const [pending, setPending] = useState<'read' | 'write' | null>(null);
  // The same value as `pending`, for listeners that outlive a render.
  const pendingRef = useRef<'read' | 'write' | null>(null);
  const setPendingAction = useCallback((next: 'read' | 'write' | null) => {
    pendingRef.current = next;
    setPending(next);
  }, []);
  const lastScan = useRef<{ id: string; at: number } | null>(null);
  const quietUntil = useRef(0);
  // The launch intent stays on the activity, so it is only used once.
  const launchTagUsed = useRef(false);

  const finish = useCallback(
    (next: NfcMessage, attempted: boolean): NfcOutcome => {
      setMessage(next);
      return { message: next, attempted };
    },
    [],
  );

  // A tap with no read or write waiting: the tag that launched the app, or
  // one held to it while it is open. Same result as Start Reading, minus the
  // button, so it goes to history and opens the sheet.
  const scanTag = useCallback(
    (tag: TagEvent) => {
      const now = Date.now();
      const id = tag.id ?? '';
      if (pendingRef.current || now < quietUntil.current) return;
      if (lastScan.current?.id === id && now - lastScan.current.at < REPEAT_MS) {
        return;
      }
      lastScan.current = { id, at: now };

      setScannedTag(tag);
      setScannedChip(null);
      addScan(tag, now);
      const parsed = tag.ndefMessage?.length
        ? describeRecord(parseRecord(tag.ndefMessage[0]))
        : 'No NDEF data.';
      presentOutcome(
        'read',
        finish({ kind: 'success', text: `Tag read: ${parsed}` }, true),
      );
    },
    [finish],
  );

  useEffect(() => {
    let active = true;

    const listen = (tag: unknown) => {
      if (tag) scanTag(tag as TagEvent);
    };

    async function initNfc() {
      try {
        const supported = await NfcManager.isSupported();
        if (!active) return;
        setNfcSupported(supported);
        if (!supported) return;

        await NfcManager.start();
        if (Platform.OS === 'android') {
          // Keeps tags inside the app, so Android never offers its own
          // tag apps in a chooser. iOS has no equivalent session. A ROM
          // that refuses the session shouldn't stop reading and writing,
          // so it degrades to Android's own dispatch.
          try {
            await holdTagSession();
          } catch (ex: unknown) {
            console.warn('NFC reader session error', ex);
          }
          // Tags that arrive while the app is in the background.
          NfcManager.setEventListener(NfcEvents.DiscoverTag, listen);
          NfcManager.setEventListener(NfcEvents.DiscoverBackgroundTag, listen);
          // Tags that start the app from cold: the tap is in the launch
          // intent, not in a dispatch event. A failure here shouldn't stop
          // the rest of init.
          try {
            const launchTag = await NfcManager.getLaunchTagEvent();
            if (launchTag && !launchTagUsed.current) {
              launchTagUsed.current = true;
              scanTag(launchTag);
            }
          } catch (ex: unknown) {
            console.warn('NFC launch tag error', ex);
          }
        }
        if (!active) return;
        const enabled = await NfcManager.isEnabled();
        setNfcEnabled(enabled);
      } catch (ex: unknown) {
        console.warn('NFC initialization error', ex);
        setMessage({ kind: 'error', text: `NFC init error: ${errorText(ex)}` });
      }
    }
    initNfc();

    return () => {
      active = false;
      if (Platform.OS === 'android') {
        NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
        NfcManager.setEventListener(NfcEvents.DiscoverBackgroundTag, null);
      }
    };
  }, [scanTag]);

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
    setPendingAction('read');

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
      setPendingAction(null);
      quietUntil.current = Date.now() + REPEAT_MS;
    }
    return finish(result, true);
  }, [nfcSupported, nfcEnabled, pending, finish, setPendingAction]);

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
      setPendingAction('write');
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
        setPendingAction(null);
        quietUntil.current = Date.now() + REPEAT_MS;
      }
      return finish(result, true);
    },
    [nfcSupported, nfcEnabled, pending, finish, setPendingAction],
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
