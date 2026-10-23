import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from '@expo-google-fonts/jetbrains-mono';
import { useFonts } from 'expo-font';
import * as SystemUI from 'expo-system-ui';
import { ThemeProvider, useThemeContext } from './src/theme/ThemeContext';
import {
  BorderWidth,
  Layout,
  Radius,
  Spacing,
  TextStyles,
} from './src/theme/tokens';
import { RecordKind, useNfc } from './src/nfc/useNfc';
import { Card } from './src/components/Card';
import { PrimaryButton } from './src/components/PrimaryButton';
import { SectionHeader } from './src/components/SectionHeader';
import { StatusCard } from './src/components/StatusCard';
import { MessageBanner } from './src/components/MessageBanner';
import { TagInfoCard } from './src/components/TagInfoCard';
import { RecordKindToggle } from './src/components/RecordKindToggle';

const Home = () => {
  const { theme, setThemeName } = useThemeContext();
  const { colors } = theme;
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

  // Root view colour shows behind the app during keyboard and screen changes.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background);
  }, [colors.background]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar
        barStyle={theme.isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: colors.background }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            NFC Manager
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Read and write NFC tags with ease
          </Text>
          {/* Temporary: moves to the Settings tab in Phase 2. */}
          <TouchableOpacity
            onPress={() => setThemeName(theme.isDark ? 'light' : 'dark')}
            accessibilityRole="button"
          >
            <Text style={[styles.themeSwitch, { color: colors.textLink }]}>
              {theme.isDark ? 'Use light theme' : 'Use dark theme'}
            </Text>
          </TouchableOpacity>
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

const App = () => {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  // On a font error, render anyway with system fonts rather than a blank screen.
  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Home />
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing.xl,
    alignItems: 'center',
  },
  title: {
    ...TextStyles.display,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...TextStyles.body,
    textAlign: 'center',
  },
  themeSwitch: {
    ...TextStyles.label,
    marginTop: Spacing.md,
  },
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
  footer: {
    height: Spacing.xxl,
  },
});

export default App;
