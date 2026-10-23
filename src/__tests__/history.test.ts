import { TagEvent } from 'react-native-nfc-manager';
import { storage } from '../storage';
import {
  addScan,
  clearHistory,
  deleteScan,
  loadHistory,
  scanTitle,
} from '../history';
import { toRecord } from '../nfc/records';

// v4 loads the compiled dist/ module, but ships its mock next to src/.
jest.mock('react-native-nfc-manager/dist/src/NativeNfcManager', () =>
  jest.requireActual('react-native-nfc-manager/src/__mocks__/NativeNfcManager'),
);

const tag = (id: string, text?: string): TagEvent => ({
  id,
  techTypes: ['android.nfc.tech.Ndef'],
  ndefMessage: text ? [toRecord({ kind: 'text', text })] : [],
});

beforeEach(() => storage.clearAll());

describe('history', () => {
  it('saves a read with decoded records, newest first', () => {
    addScan(tag('04A1', 'first'), 1000);
    addScan(tag('04B2', 'second'), 2000);

    const scans = loadHistory();
    expect(scans.map(s => s.tagId)).toEqual(['04B2', '04A1']);
    expect(scans[0]).toMatchObject({
      time: 2000,
      tech: ['android.nfc.tech.Ndef'],
      records: [{ kind: 'text', text: 'second' }],
    });
  });

  it('titles a scan by its first record, or as empty', () => {
    expect(scanTitle(addScan(tag('04A1', 'hello'), 1))).toBe('hello');
    expect(scanTitle(addScan(tag('04A1'), 2))).toBe('Empty tag');
  });

  it('deletes one scan and clears all', () => {
    const first = addScan(tag('04A1', 'a'), 1);
    addScan(tag('04A1', 'b'), 2);

    deleteScan(first.id);
    expect(loadHistory().map(s => s.time)).toEqual([2]);

    clearHistory();
    expect(loadHistory()).toEqual([]);
  });

  it('starts empty when stored history is corrupt', () => {
    storage.set('history', '{not json');
    expect(loadHistory()).toEqual([]);
  });
});
