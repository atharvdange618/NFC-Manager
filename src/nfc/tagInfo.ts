import NfcManager, { Ndef, TagEvent } from 'react-native-nfc-manager';

export type Chip = 'NTAG213' | 'NTAG215' | 'NTAG216';

// Storage size byte of the GET_VERSION reply.
const CHIPS: Record<number, Chip> = {
  0x0f: 'NTAG213',
  0x11: 'NTAG215',
  0x13: 'NTAG216',
};

// Reply is 8 bytes: header, vendor (0x04 NXP), type (0x04 NTAG), subtype,
// major, minor, storage size, protocol.
export function chipFromVersion(reply: number[]): Chip | null {
  if (reply.length < 8 || reply[1] !== 0x04 || reply[2] !== 0x04) return null;
  return CHIPS[reply[6]] ?? null;
}

// Needs NfcA connected. Other chips reject GET_VERSION, so any failure
// means "not an NTAG21x".
export async function readChip(): Promise<Chip | null> {
  try {
    return chipFromVersion(await NfcManager.nfcAHandler.transceive([0x60]));
  } catch {
    return null;
  }
}

// ponytail: re-encodes the cached message, so it counts the NDEF message
// bytes but not the TLV wrapper (2 to 4 bytes) around them.
export function ndefBytesUsed(tag: TagEvent): number {
  return tag.ndefMessage?.length ? Ndef.encodeMessage(tag.ndefMessage).length : 0;
}
