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
import { useNfc } from './src/nfc/useNfc';
import { Card } from './src/components/Card';
import { PrimaryButton } from './src/components/PrimaryButton';
import { SectionHeader } from './src/components/SectionHeader';
import { StatusCard } from './src/components/StatusCard';
import { MessageBanner } from './src/components/MessageBanner';
import { TagInfoCard } from './src/components/TagInfoCard';

const App = () => {
  const { theme, isDarkMode } = useTheme();
  const { nfcSupported, nfcEnabled, scannedTag, message, readNfc, writeNfc } =
    useNfc();
  const [writeText, setWriteText] = useState('Hello from React Native NFC!');

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
            title="📖 Read NFC Tag"
            description="Tap to scan and read data from an NFC tag"
          />
          <PrimaryButton label="Start Reading" onPress={readNfc} />
        </Card>

        <Card>
          <SectionHeader
            title="✍️ Write NFC Tag"
            description="Enter text and write it to an NFC tag"
          />
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
                color: theme.text,
              },
            ]}
            onChangeText={setWriteText}
            value={writeText}
            placeholder="Enter text to write to tag"
            placeholderTextColor={theme.textTertiary}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
          <PrimaryButton
            label="Write to Tag"
            onPress={() => writeNfc(writeText)}
          />
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
