import { useMemo } from 'react';
import { useMMKVString } from 'react-native-mmkv';
import { TagEvent } from 'react-native-nfc-manager';
import { storage } from './storage';
import { describeRecord, parseRecord, ParsedRecord } from './nfc/records';

const HISTORY_KEY = 'history';

// Records are stored decoded, so "write this again" needs no tag bytes.
export interface Scan {
  id: string;
  time: number;
  tagId: string;
  tech: string[];
  records: ParsedRecord[];
}

function parse(json: string | undefined): Scan[] {
  if (!json) return [];
  try {
    const value: unknown = JSON.parse(json);
    return Array.isArray(value) ? (value as Scan[]) : [];
  } catch {
    return [];
  }
}

// One line for list rows and the detail title.
export function scanTitle(scan: Scan): string {
  return scan.records.length ? describeRecord(scan.records[0]) : 'Empty tag';
}

export function loadHistory(): Scan[] {
  return parse(storage.getString(HISTORY_KEY));
}

function save(scans: Scan[]) {
  storage.set(HISTORY_KEY, JSON.stringify(scans));
}

// Newest first. ponytail: one JSON key rewritten per scan; split into
// a key per scan if history grows into the thousands.
export function addScan(tag: TagEvent, time = Date.now()): Scan {
  const scan: Scan = {
    id: `${time}-${tag.id ?? ''}`,
    time,
    tagId: tag.id ?? '',
    tech: tag.techTypes ?? [],
    records: (tag.ndefMessage ?? []).map(parseRecord),
  };
  save([scan, ...loadHistory()]);
  return scan;
}

export function deleteScan(id: string) {
  save(loadHistory().filter(scan => scan.id !== id));
}

export function clearHistory() {
  storage.remove(HISTORY_KEY);
}

// Re-renders when any screen adds or removes a scan.
export function useHistory(): Scan[] {
  const [json] = useMMKVString(HISTORY_KEY, storage);
  return useMemo(() => parse(json), [json]);
}
