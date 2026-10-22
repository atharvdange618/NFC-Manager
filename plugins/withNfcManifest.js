const { AndroidConfig, withAndroidManifest } = require('expo/config-plugins');

// Expo's `intentFilters` prefixes every action with `android.intent.action.`,
// so the NFC actions and the hardware requirement are added here instead.
const NFC_INTENT_FILTERS = [
  {
    action: [{ $: { 'android:name': 'android.nfc.action.NDEF_DISCOVERED' } }],
    category: [{ $: { 'android:name': 'android.intent.category.DEFAULT' } }],
    data: [{ $: { 'android:mimeType': 'text/plain' } }],
  },
  {
    action: [{ $: { 'android:name': 'android.nfc.action.TAG_DISCOVERED' } }],
    category: [{ $: { 'android:name': 'android.intent.category.DEFAULT' } }],
  },
];

module.exports = function withNfcManifest(config) {
  return withAndroidManifest(config, cfg => {
    const manifest = cfg.modResults.manifest;

    // Hides the app on the Play Store for phones without NFC.
    const features = manifest['uses-feature'] ?? [];
    if (
      !features.some(f => f.$['android:name'] === 'android.hardware.nfc')
    ) {
      features.push({
        $: { 'android:name': 'android.hardware.nfc', 'android:required': 'true' },
      });
    }
    manifest['uses-feature'] = features;

    const activity = AndroidConfig.Manifest.getMainActivityOrThrow(
      cfg.modResults,
    );
    const filters = activity['intent-filter'] ?? [];
    const hasNfc = filters.some(f =>
      f.action?.some(a => a.$['android:name'].startsWith('android.nfc.')),
    );
    if (!hasNfc) {
      filters.push(...NFC_INTENT_FILTERS);
    }
    activity['intent-filter'] = filters;

    return cfg;
  });
};
