import NfcManager, { Ndef, NdefRecord, TagEvent } from 'react-native-nfc-manager';
import { recordTypeName } from './ndef';

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

// Android answers with the type as bytes and the id as a hex string, but the
// encoder wants a string type and byte ids. A record read on the phone has
// to be normalised before it can be counted.
function idBytes(id: NdefRecord['id']): number[] {
  const raw: unknown = id;
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== 'string') return [];
  const pairs = raw.match(/../g) ?? [];
  return pairs.map(pair => parseInt(pair, 16));
}

function encodable(record: NdefRecord): NdefRecord {
  return { ...record, type: recordTypeName(record), id: idBytes(record.id) };
}

// ponytail: re-encodes the cached message, so it counts the NDEF message
// bytes but not the TLV wrapper (2 to 4 bytes) around them. Null when a
// malformed record can't be re-encoded.
export function ndefBytesUsed(tag: TagEvent): number | null {
  if (!tag.ndefMessage?.length) return 0;
  try {
    return Ndef.encodeMessage(tag.ndefMessage.map(encodable)).length;
  } catch {
    return null;
  }
}
