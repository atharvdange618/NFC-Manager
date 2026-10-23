import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { presentOutcome } from '../presentOutcome';

jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(),
  NotificationFeedbackType: { Success: 'success', Error: 'error' },
}));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

beforeEach(() => jest.clearAllMocks());

describe('presentOutcome', () => {
  it('opens the sheet with a success haptic after a read', () => {
    const shown = presentOutcome('read', {
      message: { kind: 'success', text: 'Tag read: hi' },
      attempted: true,
    });

    expect(shown).toBe(true);
    expect(Haptics.notificationAsync).toHaveBeenCalledWith('success');
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/result',
      params: { action: 'read' },
    });
  });

  it('opens the sheet with an error haptic when a write fails', () => {
    presentOutcome('write', {
      message: { kind: 'error', text: 'Write failed: tag lost' },
      attempted: true,
    });

    expect(Haptics.notificationAsync).toHaveBeenCalledWith('error');
    expect(router.push).toHaveBeenCalled();
  });

  it('leaves cancels and failed checks inline', () => {
    expect(
      presentOutcome('read', {
        message: { kind: 'info', text: 'Read cancelled' },
        attempted: true,
      }),
    ).toBe(false);
    expect(
      presentOutcome('write', {
        message: { kind: 'error', text: 'Enter text to write' },
        attempted: false,
      }),
    ).toBe(false);
    expect(router.push).not.toHaveBeenCalled();
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
  });
});
