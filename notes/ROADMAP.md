# NFC Manager v1 Roadmap

> **Target:** first Play Store release · **Started:** October 22, 2026 · **Status:** Planning

This file tracks the work from the current single-screen app to a v1 we can publish. Tick a box when the step is done and verified on a real phone. Each phase ships as working software before the next one starts.

---

## Decisions

| Decision | Choice | Why |
| --- | --- | --- |
| Stack | Migrate to Expo (prebuild), same as Shikai | Config-driven splash, icon, and fonts, expo-router tabs, EAS Build and Submit. `react-native-nfc-manager` 3.16.1 ships `app.plugin.js`, so NFC works in a dev build. |
| Design system | Port Shikai's tokens (type, spacing, radius, colors) | Both apps should look like they come from the same maker. |
| Themes | Dark (default) and Light only | Shikai's other three palettes can come later. Two themes keep the first release small. |
| Navigation | Bottom tabs: Read, Write, History, Settings. No drawer. | Four destinations fit a tab bar. A drawer would give users a second way to reach the same screens. |
| Password protection | Both: password on the tag and an app lock | The tag password stops other people from rewriting your tags. The app lock protects scan history on the phone. |
| Package name | `com.atharvdange618.nfcmanager` (to confirm) | Matches Shikai's pattern. Play Store package names can never change after the first upload. |

## Open questions

- [ ] Final app name for the store listing. "NFC Manager" is generic, and the swap test fails.
- [ ] Test runner after migration: keep Jest (jest-expo) or move to Vitest like Shikai. Shikai runs Vitest in a `node` environment on pure logic, which fits `src/nfc/ndef.ts`.
- [ ] Is the Play Console account a personal one created after November 2023? If so, each new app needs a closed test with 12 testers for 14 days before production.

---

## Phase 0: Migrate to Expo (3 to 4 hours)

- [ ] Create the Expo app config (`app.config.ts`): name, package, `newArchEnabled`, `userInterfaceStyle`, NFC plugin.
- [ ] Move `App.tsx` and `src/` over. Keep `src/nfc/` unchanged.
- [ ] Carry the manifest over: NFC permission, `uses-feature android.hardware.nfc required="true"`, NDEF and TAG intent filters.
- [ ] Get tests running again.
- [ ] Set up EAS (`eas.json`) with development, preview, and production profiles.
- **Verify:** a dev build on the phone reads and writes a tag the same as today. All 35 tests pass.

## Phase 1: Design system (2 hours)

Source: `Shikai/constants/theme.ts`, `constants/themes.ts`, `contexts/ThemeContext.tsx`.

- [ ] `src/theme/tokens.ts`: `FontFamily`, `FontSize`, `LineHeight`, `TextStyles`, `Spacing`, `Radius`, `BorderWidth`, `IconSize`, `Layout`.
- [ ] `src/theme/themes.ts`: `ColorTokens` without the GitHub-only keys (badges, contribution graph, `merged`, `star`). Light and Dark palettes.
- [ ] `ThemeProvider` with MMKV storage, dark by default.
- [ ] Load Inter and JetBrains Mono with `expo-font`. Use mono for tag IDs and raw bytes.
- [ ] Restyle the components in `src/components/` with the tokens. Replace `src/theme/useTheme.ts`.
- **Verify:** both themes look right on the phone. The theme survives an app restart.

| Token | Values |
| --- | --- |
| Font sizes | display 30, heading 22, title 17, body 15, label 13, caption 11 |
| Spacing | 4, 8, 12, 16, 24, 32, 48, 64 |
| Radius | 6, 10, 14, 20, full |
| Dark core | bg `#0D1117`, surface `#161B22`, border `#30363D`, accent `#58A6FF`, text `#E6EDF3` |
| Light core | bg `#FAF9F6`, surface `#FAF9F6`, border `#D9D3C7`, accent `#3B82F6`, text `#1A2332` |

## Phase 2: Navigation shell (3 hours)

- [ ] expo-router tabs: Read, Write, History (empty state for now), Settings.
- [ ] Move today's read flow into Read and the write flow into Write.
- [ ] Bottom sheet for scan results and write confirmations.
- [ ] Settings: theme toggle, About (version, author, links to `@atharvdange618` on X and GitHub), open-source licenses, privacy policy link.
- [ ] Haptics on scan success and failure.
- **Verify:** the full read and write flow works through the tabs. No new features yet. Ship this as an internal build.

## Phase 3: Features

Build one at a time, with tests for each, and commit each one on its own.

### 3.1 More record types (3 hours)
- [ ] Write: Wi-Fi (`application/vnd.wfa.wsc`), contact (vCard), phone (`tel:`), email (`mailto:`), SMS (`sms:`), location (`geo:`).
- [ ] Read: decode each type into a readable card with a useful action (call, open map, join Wi-Fi).
- [ ] Replace `RecordKindToggle` with a type picker.

### 3.2 Scan history (2 to 3 hours)
- [ ] Save every read to MMKV on the phone: time, tag ID, tech, records.
- [ ] History tab: list, detail, copy, share, "write this again", delete, clear all.

### 3.3 Tag info (2 hours)
- [ ] Show chip type, tag ID, tech list, NDEF capacity used and total, writable, can be made read-only.
- [ ] Detect NTAG213/215/216 with `GET_VERSION` (0x60). Phase 3.6 reuses this.

### 3.4 Erase and lock (2 hours)
- [ ] Erase: write an empty NDEF message.
- [ ] Lock: `ndefHandler.makeReadOnly()`. Lock can't be undone, so ask the user to type a confirm word first.

### 3.5 Saved templates and batch write (2 hours)
- [ ] Save any write payload as a named template.
- [ ] Batch mode: write the same template to tag after tag with a running count.

### 3.6 Tag password (4 hours)
- [ ] NTAG21x only, through `NfcA.transceive`. Disable the option with a reason on other chips.
- [ ] Set password: write PWD and PACK, then AUTH0 and ACCESS on the config pages for the detected chip (213: 0x29 to 0x2C, 215: 0x83 to 0x86, 216: 0xE3 to 0xE6).
- [ ] Before a write or erase, send `PWD_AUTH` (0x1B) when the tag is protected.
- [ ] Remove password.
- [ ] Unit tests for the byte layouts per chip.
- **Risk:** a forgotten password makes a tag unwritable forever. Warn the user and offer to save the password with the template. Test only on spare tags (they arrive October 29).

### 3.7 App lock (2 hours)
- [ ] `expo-local-authentication`: fingerprint or face, with device PIN as fallback.
- [ ] Off by default. Switch in Settings. Lock again after 1 minute in the background.

## Phase 4: Assets (3 to 4 hours)

- [ ] App icon 1024x1024 and adaptive icon (foreground plus background).
- [ ] Monochrome icon for Android 13 themed icons.
- [ ] Splash, dark and light variants (`expo-splash-screen`).
- [ ] Play Store icon 512x512 and feature graphic 1024x500.
- [ ] Phone screenshots of each tab, in dark and light.

## Phase 5: Play Store (3 hours, plus 14 days if closed testing applies)

- [ ] Privacy policy page, hosted on GitHub Pages like Shikai's `docs/`. State that scan history stays on the phone.
- [ ] Data safety form: no data collected or shared.
- [ ] Content rating questionnaire, category (Tools), store listing text.
- [ ] Target the API level Play requires at upload time. Check the Play Console.
- [ ] Release signing through Play App Signing, EAS production build (AAB).
- [ ] Closed test, then production.

---

## Progress log

| Date | What changed |
| --- | --- |
| 2026-10-22 | Plan written. Shikai tokens pulled. Stack and password decisions made. |
