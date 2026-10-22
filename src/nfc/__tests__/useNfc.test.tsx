import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import NfcManager, { Ndef, NfcError } from 'react-native-nfc-manager';
import { useNfc } from '../useNfc';

jest.mock('react-native-nfc-manager/src/NativeNfcManager');
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

    expect(hook().message).toEqual({ kind: 'info', text: 'Scan cancelled' });
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

describe('writeNfc', () => {
  it('confirms a successful write', async () => {
    nfc.ndefHandler.writeNdefMessage.mockResolvedValue();
    const hook = await renderUseNfc();

    await ReactTestRenderer.act(() => hook().writeNfc('hello'));

    expect(hook().message).toEqual({ kind: 'success', text: 'Wrote: "hello"' });
  });

  it('shows an error when the write fails', async () => {
    nfc.ndefHandler.writeNdefMessage.mockRejectedValue(
      new Error('read-only tag'),
    );
    const hook = await renderUseNfc();

    await ReactTestRenderer.act(() => hook().writeNfc('hello'));

    expect(hook().message).toEqual({
      kind: 'error',
      text: 'Write failed: read-only tag',
    });
  });

  it('rejects empty text', async () => {
    const hook = await renderUseNfc();

    await ReactTestRenderer.act(() => hook().writeNfc('   '));

    expect(hook().message).toEqual({
      kind: 'error',
      text: 'Enter text to write',
    });
  });
});
