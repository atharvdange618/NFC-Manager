import React, { createContext, useContext } from 'react';
import { useNfc } from './useNfc';

// One shared instance, so the Read and Write tabs see the same pending
// request and the result sheet sees the last scanned tag.
type NfcContextValue = ReturnType<typeof useNfc>;

const NfcContext = createContext<NfcContextValue | null>(null);

export function NfcProvider({ children }: { children: React.ReactNode }) {
  const nfc = useNfc();
  return <NfcContext.Provider value={nfc}>{children}</NfcContext.Provider>;
}

export function useNfcContext(): NfcContextValue {
  const ctx = useContext(NfcContext);
  if (!ctx) throw new Error('useNfcContext must be used within NfcProvider');
  return ctx;
}
