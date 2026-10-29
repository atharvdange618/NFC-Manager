import React from 'react';
import { Platform } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import NfcManager, { Ndef, NfcError, NfcEvents } from 'react-native-nfc-manager';
import { router } from 'expo-router';
import { NfcOutcome, useNfc } from '../useNfc';
import { toRecord, WritePayload } from '../records';
import { loadHistory } from '../../history';
import { storage } from '../../storage';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(),
  NotificationFeedbackType: { Success: 'success', Error: 'error' },
}));

// v4 loads the compiled dist/ module, but ships its mock next to src/.
jest.mock('react-native-nfc-manager/dist/src/NativeNfcManager', () =>
  jest.requireActual('react-native-nfc-manager/src/__mocks__/NativeNfcManager'),
);
jest.mock('react-native-nfc-manager', () => {
  const actual = jest.requireActual('react-native-nfc-manager');
  return {
    __esModule: true,
    ...actual,
    default: {
      isSupported: jest.fn(),
      start: jest.fn(),
      registerTagEvent: jest.fn(),
      setEventListener: jest.fn(),
      getLaunchTagEvent: jest.fn(),
      isEnabled: jest.fn(),
      requestTechnology: jest.fn(),
      cancelTechnologyRequest: jest.fn(),
      getTag: jest.fn(),
      ndefHandler: { writeNdefMessage: jest.fn() },
    },
  };
});

const nfc = jest.mocked(NfcManager);

async function renderUseNfc() {
  const result: { current: ReturnType<typeof useNfc> | null } = {
    current: null,
  };
  function Harness() {
    result.current = useNfc();
    return null;
  }
  await ReactTestRenderer.act(async () => {
    ReactTestRenderer.create(<Harness />);
  });
  return () => {
    if (!result.current) {
      throw new Error('useNfc did not render');
    }
    return result.current;
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  storage.clearAll();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  nfc.isSupported.mockResolvedValue(true);
  nfc.start.mockResolvedValue();
  nfc.isEnabled.mockResolvedValue(true);
  nfc.getLaunchTagEvent.mockResolvedValue(null);
  nfc.requestTechnology.mockResolvedValue(null);
  nfc.cancelTechnologyRequest.mockResolvedValue();
});

describe('useNfc init', () => {
  it('reports support and enabled state', async () => {
    const hook = await renderUseNfc();
    expect(hook().nfcSupported).toBe(true);
    expect(hook().nfcEnabled).toBe(true);
    expect(hook().message).toBeNull();
  });

  it('shows an error when init fails', async () => {
    nfc.start.mockRejectedValue(new Error('boom'));
    const hook = await renderUseNfc();
    expect(hook().message).toEqual({
      kind: 'error',
      text: 'NFC init error: boom',
    });
  });

  describe('tag session', () => {
    const platform = Platform as unknown as { OS: string };

    afterEach(() => {
      platform.OS = 'ios';
    });

    it('holds a reader-mode session on Android', async () => {
      platform.OS = 'android';
      await renderUseNfc();

      expect(nfc.registerTagEvent).toHaveBeenCalledWith(
        expect.objectContaining({ isReaderModeEnabled: true }),
      );
    });

    it('registers nothing on iOS', async () => {
      await renderUseNfc();

      expect(nfc.registerTagEvent).not.toHaveBeenCalled();
    });

    it('still reads and writes when the reader session is refused', async () => {
      platform.OS = 'android';
      nfc.registerTagEvent.mockRejectedValue(new Error('no reader mode'));

      const hook = await renderUseNfc();

      expect(hook().nfcSupported).toBe(true);
      expect(hook().nfcEnabled).toBe(true);
      expect(hook().message).toBeNull();
    });
  });
});

describe('tags that arrive on their own', () => {
  const platform = Platform as unknown as { OS: string };

  // The listener the hook gave the library for dispatched tags.
  const discover = () => {
    const calls = nfc.setEventListener.mock.calls as unknown as [
      string,
      ((tag: unknown) => void) | null,
    ][];
    return calls.find(([event]) => event === NfcEvents.DiscoverTag)?.[1] ?? undefined;
  };

  const textTag = () => {
    const [record] = Ndef.decodeMessage(
      Ndef.encodeMessage([Ndef.textRecord('hi')]),
    );
    return { id: '01', ndefMessage: [record] };
  };

  afterEach(() => {
    platform.OS = 'ios';
  });

  it('opens the sheet for the tag that launched the app', async () => {
    platform.OS = 'android';
    nfc.getLaunchTagEvent.mockResolvedValue(textTag());

    const hook = await renderUseNfc();

    expect(hook().message).toEqual({ kind: 'success', text: 'Tag read: hi' });
    expect(hook().scannedTag?.id).toBe('01');
    expect(loadHistory()[0]).toMatchObject({ tagId: '01' });
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/result',
      params: { action: 'read' },
    });
  });

  it('opens the sheet for a tag dispatched while the app is in the background', async () => {
    platform.OS = 'android';
    const hook = await renderUseNfc();

    await ReactTestRenderer.act(async () => {
      discover()?.(textTag());
    });

    expect(hook().message).toEqual({ kind: 'success', text: 'Tag read: hi' });
    expect(loadHistory()[0]).toMatchObject({ tagId: '01' });
  });

  it('saves and shows one scan when Android reports the same tag twice', async () => {
    platform.OS = 'android';
    await renderUseNfc();

    await ReactTestRenderer.act(async () => {
      discover()?.(textTag());
      discover()?.(textTag());
    });

    expect(loadHistory()).toHaveLength(1);
    expect(router.push).toHaveBeenCalledTimes(1);
  });

  it('leaves the tag to a read that is already waiting for it', async () => {
    platform.OS = 'android';
    nfc.requestTechnology.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          nfc.cancelTechnologyRequest.mockImplementation(async () => {
            reject(new NfcError.UserCancel());
          });
        }),
    );
    const hook = await renderUseNfc();

    let done: Promise<unknown> = Promise.resolve();
    await ReactTestRenderer.act(async () => {
      done = hook().readNfc();
    });
    await ReactTestRenderer.act(async () => {
      discover()?.(textTag());
    });

    expect(loadHistory()).toEqual([]);
    expect(router.push).not.toHaveBeenCalled();

    await ReactTestRenderer.act(async () => {
      hook().cancelScan();
      await done;
    });
  });
});

describe('readNfc', () => {
  it('shows the decoded text of the first record', async () => {
    const [record] = Ndef.decodeMessage(
      Ndef.encodeMessage([Ndef.textRecord('hi')]),
    );
    nfc.getTag.mockResolvedValue({ id: '01', ndefMessage: [record] });
    const hook = await renderUseNfc();

    await ReactTestRenderer.act(async () => {
      await hook().readNfc();
    });

    expect(hook().message).toEqual({ kind: 'success', text: 'Tag read: hi' });
    expect(hook().scannedTag?.id).toBe('01');
    expect(loadHistory()[0]).toMatchObject({
      tagId: '01',
      records: [{ kind: 'text', text: 'hi' }],
    });
  });

  it('shows an error when the read fails', async () => {
    nfc.getTag.mockRejectedValue(new Error('tag lost'));
    const hook = await renderUseNfc();

    await ReactTestRenderer.act(async () => {
      await hook().readNfc();
    });

    expect(loadHistory()).toEqual([]);

    expect(hook().message).toEqual({
      kind: 'error',
      text: 'Read failed: tag lost',
    });
    expect(nfc.cancelTechnologyRequest).toHaveBeenCalled();
  });

  it('shows a neutral message when the user cancels', async () => {
    nfc.requestTechnology.mockRejectedValue(new NfcError.UserCancel());
    const hook = await renderUseNfc();

    await ReactTestRenderer.act(async () => {
      await hook().readNfc();
    });

    expect(hook().message).toEqual({ kind: 'info', text: 'Read cancelled' });
  });

  it('refuses to read when NFC is disabled', async () => {
    nfc.isEnabled.mockResolvedValue(false);
    const hook = await renderUseNfc();

    await ReactTestRenderer.act(async () => {
      await hook().readNfc();
    });

    expect(hook().message).toEqual({
      kind: 'error',
      text: 'NFC disabled; enable in settings',
    });
    expect(nfc.requestTechnology).not.toHaveBeenCalled();
  });
});

describe('cancelScan', () => {
  // Mirrors Android: cancelTechnologyRequest rejects the pending request.
  function pendingRequest() {
    nfc.requestTechnology.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          nfc.cancelTechnologyRequest.mockImplementation(async () => {
            reject(new NfcError.UserCancel());
          });
        }),
    );
  }

  // Returns the action's promise wrapped, so awaiting the helper doesn't
  // also wait for the still-pending action.
  async function startPending(
    hook: () => ReturnType<typeof useNfc>,
    action: 'read' | 'write',
  ): Promise<{ done: Promise<unknown> }> {
    let done: Promise<unknown> = Promise.resolve();
    await ReactTestRenderer.act(async () => {
      done = action === 'read' ? hook().readNfc() : hook().writeNfc({ kind: 'text', text: 'hi' });
    });
    return { done };
  }

  async function cancel(hook: () => ReturnType<typeof useNfc>, done: Promise<unknown>) {
    await ReactTestRenderer.act(async () => {
      hook().cancelScan();
      await done;
    });
  }

  it.each(['read', 'write'] as const)(
    'marks %s as pending while waiting for a tag',
    async action => {
      pendingRequest();
      const hook = await renderUseNfc();

      const { done } = await startPending(hook, action);
      expect(hook().pending).toBe(action);

      await cancel(hook, done);
      expect(hook().pending).toBeNull();
    },
  );

  it('cancels a pending read and shows "Read cancelled"', async () => {
    pendingRequest();
    const hook = await renderUseNfc();

    await cancel(hook, (await startPending(hook, 'read')).done);

    expect(nfc.cancelTechnologyRequest).toHaveBeenCalled();
    expect(hook().message).toEqual({ kind: 'info', text: 'Read cancelled' });
  });

  it('cancels a pending write and shows "Write cancelled"', async () => {
    pendingRequest();
    const hook = await renderUseNfc();

    await cancel(hook, (await startPending(hook, 'write')).done);

    expect(nfc.ndefHandler.writeNdefMessage).not.toHaveBeenCalled();
    expect(hook().message).toEqual({ kind: 'info', text: 'Write cancelled' });
  });

  it('does not log a warning when the user cancels', async () => {
    pendingRequest();
    const hook = await renderUseNfc();

    await cancel(hook, (await startPending(hook, 'write')).done);

    expect(console.warn).not.toHaveBeenCalled();
  });

  it('ignores a write while a read is pending', async () => {
    pendingRequest();
    const hook = await renderUseNfc();

    const { done } = await startPending(hook, 'read');
    await ReactTestRenderer.act(async () => {
      await hook().writeNfc({ kind: 'text', text: 'hi' });
    });

    expect(nfc.requestTechnology).toHaveBeenCalledTimes(1);
    expect(hook().pending).toBe('read');
    await cancel(hook, done);
  });

  it('is not pending after a read finishes', async () => {
    nfc.getTag.mockResolvedValue({ id: '01', ndefMessage: [] });
    const hook = await renderUseNfc();

    await ReactTestRenderer.act(async () => {
      await hook().readNfc();
    });

    expect(hook().pending).toBeNull();
  });
});

describe('writeNfc', () => {
  it('confirms a successful write', async () => {
    nfc.ndefHandler.writeNdefMessage.mockResolvedValue();
    const hook = await renderUseNfc();

    await ReactTestRenderer.act(async () => {
      await hook().writeNfc({ kind: 'text', text: 'hello' });
    });

    expect(hook().message).toEqual({ kind: 'success', text: 'Wrote: "hello"' });
  });

  it('shows an error when the write fails', async () => {
    nfc.ndefHandler.writeNdefMessage.mockRejectedValue(
      new Error('read-only tag'),
    );
    const hook = await renderUseNfc();

    await ReactTestRenderer.act(async () => {
      await hook().writeNfc({ kind: 'text', text: 'hello' });
    });

    expect(hook().message).toEqual({
      kind: 'error',
      text: 'Write failed: read-only tag',
    });
  });

  it('rejects empty text', async () => {
    const hook = await renderUseNfc();

    await ReactTestRenderer.act(async () => {
      await hook().writeNfc({ kind: 'text', text: '   ' });
    });

    expect(hook().message).toEqual({
      kind: 'error',
      text: 'Enter text to write',
    });
  });
});

describe('writeNfc record kinds', () => {
  const url = 'https://x.com/atharvdangedev';

  it('writes a text record in text mode', async () => {
    nfc.ndefHandler.writeNdefMessage.mockResolvedValue();
    const hook = await renderUseNfc();

    await ReactTestRenderer.act(async () => {
      await hook().writeNfc({ kind: 'text', text: 'hello' });
    });

    expect(nfc.ndefHandler.writeNdefMessage).toHaveBeenCalledWith(
      Ndef.encodeMessage([Ndef.textRecord('hello')]),
    );
  });

  it('writes a URI record in url mode', async () => {
    nfc.ndefHandler.writeNdefMessage.mockResolvedValue();
    const hook = await renderUseNfc();

    await ReactTestRenderer.act(async () => {
      await hook().writeNfc({ kind: 'url', url });
    });

    expect(nfc.ndefHandler.writeNdefMessage).toHaveBeenCalledWith(
      Ndef.encodeMessage([Ndef.uriRecord(url)]),
    );
    expect(hook().message).toEqual({ kind: 'success', text: `Wrote: "${url}"` });
  });

  it('trims whitespace around a URL', async () => {
    nfc.ndefHandler.writeNdefMessage.mockResolvedValue();
    const hook = await renderUseNfc();

    await ReactTestRenderer.act(async () => {
      await hook().writeNfc({ kind: 'url', url: `  ${url}\n` });
    });

    expect(nfc.ndefHandler.writeNdefMessage).toHaveBeenCalledWith(
      Ndef.encodeMessage([Ndef.uriRecord(url)]),
    );
  });

  it.each(['x.com/atharvdangedev', 'ftp://x.com', 'https://', 'https://x .com'])(
    'rejects %p in url mode without touching NFC',
    async input => {
      const hook = await renderUseNfc();

      await ReactTestRenderer.act(async () => {
      await hook().writeNfc({ kind: 'url', url: input });
    });

      expect(hook().message).toEqual({
        kind: 'error',
        text: 'Enter a URL starting with http:// or https://',
      });
      expect(nfc.requestTechnology).not.toHaveBeenCalled();
    },
  );

  it('writes the encoded record for other kinds and describes it', async () => {
    nfc.ndefHandler.writeNdefMessage.mockResolvedValue();
    const wifi: WritePayload = {
      kind: 'wifi',
      ssid: 'Home',
      password: 'hunter22',
      security: 'wpa2',
    };
    const hook = await renderUseNfc();

    await ReactTestRenderer.act(async () => {
      await hook().writeNfc(wifi);
    });

    expect(nfc.ndefHandler.writeNdefMessage).toHaveBeenCalledWith(
      Ndef.encodeMessage([toRecord(wifi)]),
    );
    expect(hook().message).toEqual({ kind: 'success', text: 'Wrote: "Wi-Fi: Home"' });
  });

  it('rejects an invalid payload without touching NFC', async () => {
    const hook = await renderUseNfc();

    await ReactTestRenderer.act(async () => {
      await hook().writeNfc({ kind: 'phone', number: 'nope' });
    });

    expect(hook().message).toEqual({ kind: 'error', text: 'Enter a phone number' });
    expect(nfc.requestTechnology).not.toHaveBeenCalled();
  });

  it('reads a tel: record as a phone number', async () => {
    const [record] = Ndef.decodeMessage(
      Ndef.encodeMessage([Ndef.uriRecord('tel:+15550100')]),
    );
    nfc.getTag.mockResolvedValue({ id: '01', ndefMessage: [record] });
    const hook = await renderUseNfc();

    await ReactTestRenderer.act(async () => {
      await hook().readNfc();
    });

    expect(hook().message).toEqual({
      kind: 'success',
      text: 'Tag read: Phone: +15550100',
    });
  });

  it('reads a URI record back as the URL', async () => {
    const [record] = Ndef.decodeMessage(
      Ndef.encodeMessage([Ndef.uriRecord(url)]),
    );
    nfc.getTag.mockResolvedValue({ id: '01', ndefMessage: [record] });
    const hook = await renderUseNfc();

    await ReactTestRenderer.act(async () => {
      await hook().readNfc();
    });

    expect(hook().message).toEqual({ kind: 'success', text: `Tag read: ${url}` });
  });
});

describe('action outcomes', () => {
  it('marks a finished read as attempted', async () => {
    nfc.getTag.mockResolvedValue({ id: '01' });
    const hook = await renderUseNfc();

    let outcome: NfcOutcome | null = null;
    await ReactTestRenderer.act(async () => {
      outcome = await hook().readNfc();
    });

    expect(outcome).toEqual({
      message: { kind: 'success', text: 'Tag read: No NDEF data.' },
      attempted: true,
    });
  });

  it('marks a failed check as not attempted', async () => {
    const hook = await renderUseNfc();

    let outcome: NfcOutcome | null = null;
    await ReactTestRenderer.act(async () => {
      outcome = await hook().writeNfc({ kind: 'text', text: '   ' });
    });

    expect(outcome).toEqual({
      message: { kind: 'error', text: 'Enter text to write' },
      attempted: false,
    });
  });
});
