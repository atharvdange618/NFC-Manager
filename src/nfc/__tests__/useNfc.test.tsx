import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import NfcManager, { Ndef, NfcError } from 'react-native-nfc-manager';
import { useNfc } from '../useNfc';

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
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  nfc.isSupported.mockResolvedValue(true);
  nfc.start.mockResolvedValue();
  nfc.isEnabled.mockResolvedValue(true);
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
});

describe('readNfc', () => {
  it('shows the decoded text of the first record', async () => {
    const [record] = Ndef.decodeMessage(
      Ndef.encodeMessage([Ndef.textRecord('hi')]),
    );
    nfc.getTag.mockResolvedValue({ id: '01', ndefMessage: [record] });
    const hook = await renderUseNfc();

    await ReactTestRenderer.act(() => hook().readNfc());

    expect(hook().message).toEqual({ kind: 'success', text: 'Tag read: hi' });
    expect(hook().scannedTag?.id).toBe('01');
  });

  it('shows an error when the read fails', async () => {
    nfc.getTag.mockRejectedValue(new Error('tag lost'));
    const hook = await renderUseNfc();

    await ReactTestRenderer.act(() => hook().readNfc());

    expect(hook().message).toEqual({
      kind: 'error',
      text: 'Read failed: tag lost',
    });
    expect(nfc.cancelTechnologyRequest).toHaveBeenCalled();
  });

  it('shows a neutral message when the user cancels', async () => {
    nfc.requestTechnology.mockRejectedValue(new NfcError.UserCancel());
    const hook = await renderUseNfc();

    await ReactTestRenderer.act(() => hook().readNfc());

    expect(hook().message).toEqual({ kind: 'info', text: 'Read cancelled' });
  });

  it('refuses to read when NFC is disabled', async () => {
    nfc.isEnabled.mockResolvedValue(false);
    const hook = await renderUseNfc();

    await ReactTestRenderer.act(() => hook().readNfc());

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
  ): Promise<{ done: Promise<void> }> {
    let done: Promise<void> = Promise.resolve();
    await ReactTestRenderer.act(async () => {
      done = action === 'read' ? hook().readNfc() : hook().writeNfc('hi', 'text');
    });
    return { done };
  }

  async function cancel(hook: () => ReturnType<typeof useNfc>, done: Promise<void>) {
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
    await ReactTestRenderer.act(() => hook().writeNfc('hi', 'text'));

    expect(nfc.requestTechnology).toHaveBeenCalledTimes(1);
    expect(hook().pending).toBe('read');
    await cancel(hook, done);
  });

  it('is not pending after a read finishes', async () => {
    nfc.getTag.mockResolvedValue({ id: '01', ndefMessage: [] });
    const hook = await renderUseNfc();

    await ReactTestRenderer.act(() => hook().readNfc());

    expect(hook().pending).toBeNull();
  });
});

describe('writeNfc', () => {
  it('confirms a successful write', async () => {
    nfc.ndefHandler.writeNdefMessage.mockResolvedValue();
    const hook = await renderUseNfc();

    await ReactTestRenderer.act(() => hook().writeNfc('hello', 'text'));

    expect(hook().message).toEqual({ kind: 'success', text: 'Wrote: "hello"' });
  });

  it('shows an error when the write fails', async () => {
    nfc.ndefHandler.writeNdefMessage.mockRejectedValue(
      new Error('read-only tag'),
    );
    const hook = await renderUseNfc();

    await ReactTestRenderer.act(() => hook().writeNfc('hello', 'text'));

    expect(hook().message).toEqual({
      kind: 'error',
      text: 'Write failed: read-only tag',
    });
  });

  it('rejects empty text', async () => {
    const hook = await renderUseNfc();

    await ReactTestRenderer.act(() => hook().writeNfc('   ', 'text'));

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

    await ReactTestRenderer.act(() => hook().writeNfc('hello', 'text'));

    expect(nfc.ndefHandler.writeNdefMessage).toHaveBeenCalledWith(
      Ndef.encodeMessage([Ndef.textRecord('hello')]),
    );
  });

  it('writes a URI record in url mode', async () => {
    nfc.ndefHandler.writeNdefMessage.mockResolvedValue();
    const hook = await renderUseNfc();

    await ReactTestRenderer.act(() => hook().writeNfc(url, 'url'));

    expect(nfc.ndefHandler.writeNdefMessage).toHaveBeenCalledWith(
      Ndef.encodeMessage([Ndef.uriRecord(url)]),
    );
    expect(hook().message).toEqual({ kind: 'success', text: `Wrote: "${url}"` });
  });

  it('trims whitespace around a URL', async () => {
    nfc.ndefHandler.writeNdefMessage.mockResolvedValue();
    const hook = await renderUseNfc();

    await ReactTestRenderer.act(() => hook().writeNfc(`  ${url}\n`, 'url'));

    expect(nfc.ndefHandler.writeNdefMessage).toHaveBeenCalledWith(
      Ndef.encodeMessage([Ndef.uriRecord(url)]),
    );
  });

  it.each(['x.com/atharvdangedev', 'ftp://x.com', 'https://', 'https://x .com'])(
    'rejects %p in url mode without touching NFC',
    async input => {
      const hook = await renderUseNfc();

      await ReactTestRenderer.act(() => hook().writeNfc(input, 'url'));

      expect(hook().message).toEqual({
        kind: 'error',
        text: 'Enter a URL starting with http:// or https://',
      });
      expect(nfc.requestTechnology).not.toHaveBeenCalled();
    },
  );

  it('reads a URI record back as the URL', async () => {
    const [record] = Ndef.decodeMessage(
      Ndef.encodeMessage([Ndef.uriRecord(url)]),
    );
    nfc.getTag.mockResolvedValue({ id: '01', ndefMessage: [record] });
    const hook = await renderUseNfc();

    await ReactTestRenderer.act(() => hook().readNfc());

    expect(hook().message).toEqual({ kind: 'success', text: `Tag read: ${url}` });
  });
});
