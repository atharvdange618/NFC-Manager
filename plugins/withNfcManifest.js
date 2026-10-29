const fs = require('fs');
const path = require('path');
const {
  AndroidConfig,
  withAndroidManifest,
  withDangerousMod,
} = require('expo/config-plugins');

// Expo's `intentFilters` prefixes every action with `android.intent.action.`,
// so the NFC actions and the hardware requirement are added here instead.

// A filter with no <data> only matches intents with no data, and every NDEF
// intent carries a MIME type or a URI. Android also refuses to match a filter
// that names both a MIME type and a scheme against an intent that has only
// one, so these are two separate filters.
const NDEF_SCHEMES = [
  'http',
  'https',
  'mailto',
  'tel',
  'sms',
  'smsto',
  'geo',
  'ftp',
];

const NFC_INTENT_FILTERS = [
  // Text, vCard, Wi-Fi and every other NDEF record with a MIME type.
  {
    action: [{ $: { 'android:name': 'android.nfc.action.NDEF_DISCOVERED' } }],
    category: [{ $: { 'android:name': 'android.intent.category.DEFAULT' } }],
    data: [{ $: { 'android:mimeType': '*/*' } }],
  },
  // URI records, using the schemes this app can write.
  {
    action: [{ $: { 'android:name': 'android.nfc.action.NDEF_DISCOVERED' } }],
    category: [{ $: { 'android:name': 'android.intent.category.DEFAULT' } }],
    data: NDEF_SCHEMES.map(scheme => ({ $: { 'android:scheme': scheme } })),
  },
  // Every tag that answers at least one of these technologies, NDEF or not.
  // This is the list Android's own chooser uses for "NFC tag detected".
  {
    action: [{ $: { 'android:name': 'android.nfc.action.TECH_DISCOVERED' } }],
    category: [{ $: { 'android:name': 'android.intent.category.DEFAULT' } }],
  },
  // The last resort: tags that expose no technology from the list above.
  {
    action: [{ $: { 'android:name': 'android.nfc.action.TAG_DISCOVERED' } }],
    category: [{ $: { 'android:name': 'android.intent.category.DEFAULT' } }],
  },
];

// One <tech-list> per technology: a list matches only when the tag has every
// technology in it, so grouping them would match almost nothing.
const TECH_LIST = [
  'NfcA',
  'NfcB',
  'NfcF',
  'NfcV',
  'IsoDep',
  'Ndef',
  'NdefFormatable',
  'MifareClassic',
  'MifareUltralight',
];

const TECH_FILTER_XML = `<?xml version="1.0" encoding="utf-8"?>
<resources xmlns:xliff="urn:oasis:names:tc:xliff:document:1.2">
${TECH_LIST.map(
  tech => `  <tech-list>
    <tech>android.nfc.tech.${tech}</tech>
  </tech-list>`,
).join('\n')}
</resources>
`;

function writeTechFilter(config) {
  return withDangerousMod(config, [
    'android',
    async cfg => {
      const dir = path.join(
        cfg.modRequest.platformProjectRoot,
        'app/src/main/res/xml',
      );
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'nfc_tech_filter.xml'), TECH_FILTER_XML);
      return cfg;
    },
  ]);
}

function addToManifest(config) {
  return withAndroidManifest(config, cfg => {
    const manifest = cfg.modResults.manifest;

    // Hides the app on the Play Store for phones without NFC.
    const features = manifest['uses-feature'] ?? [];
    if (!features.some(f => f.$['android:name'] === 'android.hardware.nfc')) {
      features.push({
        $: { 'android:name': 'android.hardware.nfc', 'android:required': 'true' },
      });
    }
    manifest['uses-feature'] = features;

    const activity = AndroidConfig.Manifest.getMainActivityOrThrow(
      cfg.modResults,
    );
    // Android's tag chooser falls back to the component name (com.pkg/.MainActivity)
    // for an activity without a label, so give it the app name.
    activity.$['android:label'] = '@string/app_name';
    const filters = activity['intent-filter'] ?? [];
    const hasNfc = filters.some(f =>
      f.action?.some(a => a.$['android:name'].startsWith('android.nfc.')),
    );
    if (!hasNfc) {
      filters.push(...NFC_INTENT_FILTERS);
    }
    activity['intent-filter'] = filters;

    // TECH_DISCOVERED needs the technology list as a resource.
    const metaData = activity['meta-data'] ?? [];
    if (
      !metaData.some(
        m => m.$['android:name'] === 'android.nfc.action.TECH_DISCOVERED',
      )
    ) {
      metaData.push({
        $: {
          'android:name': 'android.nfc.action.TECH_DISCOVERED',
          'android:resource': '@xml/nfc_tech_filter',
        },
      });
    }
    activity['meta-data'] = metaData;

    return cfg;
  });
}

module.exports = function withNfcManifest(config) {
  return writeTechFilter(addToManifest(config));
};
