import { Ndef, NdefRecord } from 'react-native-nfc-manager';

// Android returns the record type as bytes ([0x54]); the library's own
// encoder returns it as a string ('T').
export function recordTypeName(record: NdefRecord): string {
  return typeof record.type === 'string'
    ? record.type
    : String.fromCharCode(...record.type);
}

function isWellKnown(record: NdefRecord, type: string): boolean {
  return record.tnf === Ndef.TNF_WELL_KNOWN && recordTypeName(record) === type;
}

export function isTextRecord(record: NdefRecord): boolean {
  return isWellKnown(record, Ndef.RTD_TEXT);
}

export function isUriRecord(record: NdefRecord): boolean {
  return isWellKnown(record, Ndef.RTD_URI);
}

// Records decodeRecord can turn into readable text.
export function isKnownRecord(record: NdefRecord): boolean {
  return isTextRecord(record) || isUriRecord(record);
}

// Text and URI records decode to their string; anything else falls back to hex.
export function decodeRecord(record: NdefRecord): string {
  const payload = new Uint8Array(record.payload);
  if (isTextRecord(record)) {
    return Ndef.text.decodePayload(payload);
  }
  if (isUriRecord(record)) {
    return Ndef.uri.decodePayload(payload);
  }
  return Ndef.util.bytesToHexString(record.payload);
}
