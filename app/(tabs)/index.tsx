import React, { useState } from 'react';
import { Screen } from '../../src/components/Screen';
import { Card } from '../../src/components/Card';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { SectionHeader } from '../../src/components/SectionHeader';
import { StatusCard } from '../../src/components/StatusCard';
import { MessageBanner } from '../../src/components/MessageBanner';
import { useNfcContext } from '../../src/nfc/NfcContext';
import { presentOutcome } from '../../src/nfc/presentOutcome';
import { NfcMessage } from '../../src/nfc/useNfc';

export default function ReadScreen() {
  const { nfcSupported, nfcEnabled, message, pending, readNfc, cancelScan } =
    useNfcContext();
  // Cancels and failed checks show here; finished scans open the sheet.
  const [notice, setNotice] = useState<NfcMessage | null>(null);
  const banner = pending === 'read' ? message : notice;

  const onRead = async () => {
    setNotice(null);
    const outcome = await readNfc();
    if (outcome && !presentOutcome('read', outcome)) setNotice(outcome.message);
  };

  return (
    <Screen title="Read" subtitle="Scan a tag to see what's on it">
      <StatusCard nfcSupported={nfcSupported} nfcEnabled={nfcEnabled} />

      {banner ? <MessageBanner message={banner} /> : null}

      <Card>
        <SectionHeader
          title="Read NFC Tag"
          description="Tap to scan and read data from an NFC tag"
        />
        {pending === 'read' ? (
          <PrimaryButton label="Cancel" onPress={cancelScan} />
        ) : (
          <PrimaryButton label="Start Reading" onPress={onRead} />
        )}
      </Card>
    </Screen>
  );
}
