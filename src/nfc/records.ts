import { Ndef, NdefRecord } from 'react-native-nfc-manager';
import { recordTypeName } from './ndef';

// One shape per record type. Reads decode into the same union, so a scanned
// record can be written again as is. Fields stay strings, as typed in the form.
export type WritePayload =
  | { kind: 'text'; text: string }
  | { kind: 'url'; url: string }
  | { kind: 'wifi'; ssid: string; password: string; security: WifiSecurity }
  | { kind: 'contact'; name: string; phone: string; email: string; org: string }
  | { kind: 'phone'; number: string }
  | { kind: 'email'; to: string; subject: string; body: string }
  | { kind: 'sms'; number: string; body: string }
  | { kind: 'location'; lat: string; lng: string };

export type RecordKind = WritePayload['kind'];
export type WifiSecurity = 'wpa2' | 'open';

export type ParsedRecord =
  | WritePayload
  | { kind: 'unknown'; type: string; hex: string };

// http(s) scheme, then at least one non-space character.
const URL_PATTERN = /^https?:\/\/\S+$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?\d{3,15}$/;
const VCARD_TYPES = ['text/vcard', 'text/x-vcard'];

// Spaces, dashes and brackets are for reading; dialers want digits.
const cleanPhone = (value: string) => value.replace(/[\s()-]/g, '');

function coordinateError(value: string, max: number, name: string) {
  const n = Number(value.trim());
  return value.trim() && Number.isFinite(n) && Math.abs(n) <= max
    ? null
    : `Enter a ${name} from -${max} to ${max}`;
}

// Returns the message to show, or null when the payload can be written.
export function validatePayload(p: WritePayload): string | null {
  switch (p.kind) {
    case 'text':
      return p.text.trim() ? null : 'Enter text to write';
    case 'url':
      return URL_PATTERN.test(p.url.trim())
        ? null
        : 'Enter a URL starting with http:// or https://';
    case 'wifi': {
      const ssidBytes = Ndef.util.stringToBytes(p.ssid).length;
      if (!ssidBytes) return 'Enter the network name';
      if (ssidBytes > 32) return 'Network names are at most 32 bytes';
      if (p.security === 'wpa2' && (p.password.length < 8 || p.password.length > 63)) {
        return 'Wi-Fi passwords are 8 to 63 characters';
      }
      return null;
    }
    case 'contact':
      if (!p.name.trim()) return 'Enter a name';
      if (p.phone.trim() && !PHONE_PATTERN.test(cleanPhone(p.phone))) {
        return 'Enter a valid phone number';
      }
      if (p.email.trim() && !EMAIL_PATTERN.test(p.email.trim())) {
        return 'Enter a valid email address';
      }
      return null;
    case 'phone':
    case 'sms':
      return PHONE_PATTERN.test(cleanPhone(p.number))
        ? null
        : 'Enter a phone number';
    case 'email':
      return EMAIL_PATTERN.test(p.to.trim()) ? null : 'Enter an email address';
    case 'location':
      return (
        coordinateError(p.lat, 90, 'latitude') ??
        coordinateError(p.lng, 180, 'longitude')
      );
  }
}

function query(params: Record<string, string>): string {
  const parts = Object.entries(params)
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

// The URI for kinds stored as a URI record. Also what their read action opens.
export function payloadUri(
  p: Extract<WritePayload, { kind: 'url' | 'phone' | 'email' | 'sms' | 'location' }>,
): string {
  switch (p.kind) {
    case 'url':
      return p.url.trim();
    case 'phone':
      return `tel:${cleanPhone(p.number)}`;
    case 'email':
      return `mailto:${p.to.trim()}${query({ subject: p.subject, body: p.body })}`;
    case 'sms':
      return `sms:${cleanPhone(p.number)}${query({ body: p.body })}`;
    case 'location':
      return `geo:${Number(p.lat.trim())},${Number(p.lng.trim())}`;
  }
}

// Wi-Fi Simple Config auth types. The library's encoder writes 0x0000 for
// open networks, but the spec and Android's parser use 0x0001.
const WSC_AUTH: Record<WifiSecurity, number[]> = {
  open: [0x00, 0x01],
  wpa2: [0x00, 0x20],
};

function tlv(type: number[], value: number[]): number[] {
  return [...type, Math.floor(value.length / 256), value.length % 256, ...value];
}

function wifiPayload(p: Extract<WritePayload, { kind: 'wifi' }>): number[] {
  const key = p.security === 'open' ? '' : p.password;
  return tlv(
    [0x10, 0x0e], // credential
    [
      ...tlv([0x10, 0x03], WSC_AUTH[p.security]),
      ...tlv([0x10, 0x45], Ndef.util.stringToBytes(p.ssid)),
      ...tlv([0x10, 0x27], Ndef.util.stringToBytes(key)),
    ],
  );
}

// vCard text values escape backslash, comma, semicolon and newline.
const vcardEscape = (value: string) =>
  value.trim().replace(/([\\,;])/g, '\\$1').replace(/\r?\n/g, '\\n');

const vcardUnescape = (value: string) =>
  value.replace(/\\n/gi, '\n').replace(/\\([\\,;])/g, '$1');

// vCard 3.0, which Android's contacts app imports.
function vcard(p: Extract<WritePayload, { kind: 'contact' }>): string {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${vcardEscape(p.name)}`,
    `N:;${vcardEscape(p.name)};;;`,
    p.phone.trim() && `TEL:${cleanPhone(p.phone)}`,
    p.email.trim() && `EMAIL:${p.email.trim()}`,
    p.org.trim() && `ORG:${vcardEscape(p.org)}`,
    'END:VCARD',
  ];
  return lines.filter(Boolean).join('\r\n');
}

export function toRecord(p: WritePayload): NdefRecord {
  switch (p.kind) {
    case 'text':
      return Ndef.textRecord(p.text);
    case 'wifi':
      return Ndef.record(Ndef.TNF_MIME_MEDIA, Ndef.MIME_WFA_WSC, [], wifiPayload(p));
    case 'contact':
      return Ndef.record(Ndef.TNF_MIME_MEDIA, 'text/vcard', [], vcard(p));
    default:
      return Ndef.uriRecord(payloadUri(p));
  }
}

function parseQuery(search: string): Record<string, string> {
  const params: Record<string, string> = {};
  for (const part of search.split('&')) {
    const [key, value = ''] = part.split('=');
    if (key) params[key.toLowerCase()] = decodeURIComponent(value.replace(/\+/g, ' '));
  }
  return params;
}

function parseUri(uri: string): WritePayload {
  const colon = uri.indexOf(':');
  const scheme = uri.slice(0, colon).toLowerCase();
  const [target, search = ''] = uri.slice(colon + 1).split('?');
  const params = parseQuery(search);
  switch (scheme) {
    case 'tel':
      return { kind: 'phone', number: decodeURIComponent(target) };
    case 'mailto':
      return {
        kind: 'email',
        to: decodeURIComponent(target),
        subject: params.subject ?? '',
        body: params.body ?? '',
      };
    case 'sms':
    case 'smsto':
      return { kind: 'sms', number: decodeURIComponent(target), body: params.body ?? '' };
    case 'geo': {
      const [lat = '', lng = ''] = target.split(',');
      return { kind: 'location', lat, lng: lng.split(';')[0] };
    }
    default:
      return { kind: 'url', url: uri };
  }
}

function parseVcard(text: string): WritePayload {
  // Lines that start with a space continue the line before.
  const lines = text.replace(/\r?\n[ \t]/g, '').split(/\r?\n/);
  // ORG is structured (company;unit), so every field keeps only the part
  // before the first unescaped semicolon.
  const field = (name: string) => {
    const line = lines.find(l => l.split(/[;:]/)[0].toUpperCase() === name);
    if (!line) return '';
    const value = line.slice(line.indexOf(':') + 1);
    return vcardUnescape(value.split(/(?<!\\);/)[0]);
  };
  return {
    kind: 'contact',
    name: field('FN'),
    phone: field('TEL'),
    email: field('EMAIL'),
    org: field('ORG'),
  };
}

export function parseRecord(record: NdefRecord): ParsedRecord {
  const type = recordTypeName(record);
  const payload = new Uint8Array(record.payload);
  if (record.tnf === Ndef.TNF_WELL_KNOWN && type === Ndef.RTD_TEXT) {
    return { kind: 'text', text: Ndef.text.decodePayload(payload) };
  }
  if (record.tnf === Ndef.TNF_WELL_KNOWN && type === Ndef.RTD_URI) {
    return parseUri(Ndef.uri.decodePayload(payload));
  }
  if (record.tnf === Ndef.TNF_MIME_MEDIA) {
    const mime = type.toLowerCase();
    if (mime === Ndef.MIME_WFA_WSC) {
      const { ssid, networkKey, authType } = Ndef.wifiSimple.decodePayload(payload);
      const open = !authType || authType[1] === 0x00 || authType[1] === 0x01;
      return {
        kind: 'wifi',
        ssid: ssid ?? '',
        password: networkKey ?? '',
        security: open ? 'open' : 'wpa2',
      };
    }
    if (VCARD_TYPES.includes(mime)) {
      return parseVcard(Ndef.util.bytesToString(record.payload));
    }
  }
  return {
    kind: 'unknown',
    type,
    hex: Ndef.util.bytesToHexString(record.payload),
  };
}

// One line for messages and list rows.
export function describeRecord(p: ParsedRecord): string {
  switch (p.kind) {
    case 'text':
      return p.text;
    case 'url':
      return p.url;
    case 'wifi':
      return `Wi-Fi: ${p.ssid}`;
    case 'contact':
      return `Contact: ${p.name}`;
    case 'phone':
      return `Phone: ${p.number}`;
    case 'email':
      return `Email: ${p.to}`;
    case 'sms':
      return `SMS: ${p.number}`;
    case 'location':
      return `Location: ${p.lat}, ${p.lng}`;
    case 'unknown':
      return `Raw payload: ${p.hex}`;
  }
}
