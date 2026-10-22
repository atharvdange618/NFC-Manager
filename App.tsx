import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TextInput,
} from 'react-native';
import { useTheme } from './src/theme/useTheme';
import { RecordKind, useNfc } from './src/nfc/useNfc';
import { Card } from './src/components/Card';
import { PrimaryButton } from './src/components/PrimaryButton';
import { SectionHeader } from './src/components/SectionHeader';
import { StatusCard } from './src/components/StatusCard';
import { MessageBanner } from './src/components/MessageBanner';
import { TagInfoCard } from './src/components/TagInfoCard';
import { RecordKindToggle } from './src/components/RecordKindToggle';

const App = () => {
  const { theme, isDarkMode } = useTheme();
  const {
    nfcSupported,
    nfcEnabled,
    scannedTag,
    message,
    pending,
    readNfc,
    cancelScan,
    writeNfc,
  } = useNfc();
  const [writeKind, setWriteKind] = useState<RecordKind>('text');
  // Each kind keeps its own input, so toggling doesn't lose what you typed.
  const [inputs, setInputs] = useState<Record<RecordKind, string>>({
    text: 'Hello from React Native NFC!',
    url: 'https://',
  });
  const isUrl = writeKind === 'url';

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.background}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: theme.background }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>NFC Manager</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Read and write NFC tags with ease
          </Text>
        </View>

        <StatusCard nfcSupported={nfcSupported} nfcEnabled={nfcEnabled} />

        {message ? <MessageBanner message={message} /> : null}

        <Card>
          <SectionHeader
            title="Read NFC Tag"
            description="Tap to scan and read data from an NFC tag"
          />
          {pending === 'read' ? (
            <PrimaryButton label="Cancel" onPress={cancelScan} />
          ) : (
            <PrimaryButton label="Start Reading" onPress={readNfc} />
          )}
        </Card>

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
                backgroundColor: theme.surface,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
            onChangeText={value =>
              setInputs(prev => ({ ...prev, [writeKind]: value }))
            }
            value={inputs[writeKind]}
            placeholder={
              isUrl ? 'https://example.com' : 'Enter text to write to tag'
            }
            placeholderTextColor={theme.textTertiary}
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
            <PrimaryButton
              label="Write to Tag"
              onPress={() => writeNfc(inputs[writeKind], writeKind)}
            />
          )}
        </Card>

        {scannedTag && <TagInfoCard tag={scannedTag} />}

        <View style={styles.footer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginTop: 36,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  footer: {
    height: 30,
  },
});

export default App;
