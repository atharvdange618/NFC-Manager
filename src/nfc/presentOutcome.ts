import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { NfcOutcome } from './useNfc';

// Opens the result sheet for a finished scan, with a haptic to match.
// Returns false for outcomes that belong inline: failed checks and cancels.
export function presentOutcome(
  action: 'read' | 'write',
  outcome: NfcOutcome,
): boolean {
  const { message, attempted } = outcome;
  if (!attempted || message.kind === 'info') return false;

  Haptics.notificationAsync(
    message.kind === 'success'
      ? Haptics.NotificationFeedbackType.Success
      : Haptics.NotificationFeedbackType.Error,
  );
  router.push({ pathname: '/result', params: { action } });
  return true;
}
