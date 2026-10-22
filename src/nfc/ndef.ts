import { Ndef, NdefRecord } from 'react-native-nfc-manager';

export function isTextRecord(record: NdefRecord): boolean {
  return (
    record.tnf === Ndef.TNF_WELL_KNOWN &&
    record.type.toString() === Ndef.RTD_TEXT.toString()
  );
}

// Text records decode to their string; anything else falls back to hex.
export function decodeRecord(record: NdefRecord): string {
  return isTextRecord(record)
    ? Ndef.text.decodePayload(new Uint8Array(record.payload))
    : Ndef.util.bytesToHexString(record.payload);
}
