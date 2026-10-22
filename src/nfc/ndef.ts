import { Ndef, NdefRecord } from 'react-native-nfc-manager';

// Android returns the record type as bytes ([0x54]), iOS and our own
// encoder can return it as a string ('T').
export function recordTypeName(record: NdefRecord): string {
  return typeof record.type === 'string'
    ? record.type
    : String.fromCharCode(...record.type);
}

export function isTextRecord(record: NdefRecord): boolean {
  return (
    record.tnf === Ndef.TNF_WELL_KNOWN &&
    recordTypeName(record) === Ndef.RTD_TEXT
  );
}

// Text records decode to their string; anything else falls back to hex.
export function decodeRecord(record: NdefRecord): string {
  return isTextRecord(record)
    ? Ndef.text.decodePayload(new Uint8Array(record.payload))
    : Ndef.util.bytesToHexString(record.payload);
}
