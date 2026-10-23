import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'NFC Manager',
  slug: 'nfc-manager',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'nfcmanager',
  android: {
    // Not final: Play Store package names can't change after the first upload.
    package: 'com.atharvdange618.nfcmanager',
    versionCode: 1,
  },
  plugins: [
    'expo-router',
    'react-native-nfc-manager',
    './plugins/withNfcManifest',
  ],
});
