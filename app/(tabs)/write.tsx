import React, { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { Card } from '../../src/components/Card';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { SectionHeader } from '../../src/components/SectionHeader';
import { MessageBanner } from '../../src/components/MessageBanner';
import { RecordKindToggle } from '../../src/components/RecordKindToggle';
import { useNfcContext } from '../../src/nfc/NfcContext';
import { presentOutcome } from '../../src/nfc/presentOutcome';
import { NfcMessage, RecordKind } from '../../src/nfc/useNfc';
import { useTheme } from '../../src/theme/ThemeContext';
import {
  BorderWidth,
  Radius,
  Spacing,
  TextStyles,
} from '../../src/theme/tokens';

export default function WriteScreen() {
  const { colors } = useTheme();
  const { message, pending, writeNfc, cancelScan } = useNfcContext();
  const [writeKind, setWriteKind] = useState<RecordKind>('text');
  // Each kind keeps its own input, so toggling doesn't lose what you typed.
  const [inputs, setInputs] = useState<Record<RecordKind, string>>({
    text: 'Hello from React Native NFC!',
    url: 'https://',
  });
  // Cancels and failed checks show here; finished writes open the sheet.
  const [notice, setNotice] = useState<NfcMessage | null>(null);
  const banner = pending === 'write' ? message : notice;
  const isUrl = writeKind === 'url';

  const onWrite = async () => {
    setNotice(null);
    const outcome = await writeNfc(inputs[writeKind], writeKind);
    if (outcome && !presentOutcome('write', outcome)) {
      setNotice(outcome.message);
    }
  };

  return (
    <Screen title="Write" subtitle="Put text or a link on a tag">
      {banner ? <MessageBanner message={banner} /> : null}

      <Card>
        <SectionHeader
          title="Write NFC Tag"
          description="Write text, or a URL that opens without the app"
        />
        <RecordKindToggle value={writeKind} onChange={setWriteKind} />
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surfaceInset,
              borderColor: colors.border,
              color: colors.textPrimary,
            },
          ]}
          onChangeText={value =>
            setInputs(prev => ({ ...prev, [writeKind]: value }))
          }
          value={inputs[writeKind]}
          placeholder={
            isUrl ? 'https://example.com' : 'Enter text to write to tag'
          }
          placeholderTextColor={colors.textMuted}
          multiline={!isUrl}
          numberOfLines={isUrl ? 1 : 3}
          textAlignVertical="top"
          // Android would capitalise "Https://" and autocorrect the path
          autoCapitalize={isUrl ? 'none' : 'sentences'}
          autoCorrect={!isUrl}
          keyboardType={isUrl ? 'url' : 'default'}
        />
        {pending === 'write' ? (
          <PrimaryButton label="Cancel" onPress={cancelScan} />
        ) : (
          <PrimaryButton label="Write to Tag" onPress={onWrite} />
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    ...TextStyles.body,
    borderRadius: Radius.md,
    borderWidth: BorderWidth.normal,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.lg,
    minHeight: 80,
    textAlignVertical: 'top',
  },
});
