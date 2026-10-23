import React from 'react';
import {
  Linking,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Octicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Screen } from '../../src/components/Screen';
import { useTheme, useThemeContext } from '../../src/theme/ThemeContext';
import {
  BorderWidth,
  IconSize,
  Layout,
  Radius,
  Spacing,
  TextStyles,
} from '../../src/theme/tokens';

const X_URL = 'https://x.com/atharvdangedev';
const GITHUB_URL = 'https://github.com/atharvdange618/NFC-Manager';

interface RowProps {
  label: string;
  value?: string;
  onPress?: () => void;
  icon?: React.ComponentProps<typeof Octicons>['name'];
  right?: React.ReactNode;
  last?: boolean;
}

function Row({ label, value, onPress, icon, right, last }: RowProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      disabled={!onPress}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole={onPress ? 'button' : undefined}
      style={[
        styles.row,
        !last && {
          borderBottomColor: colors.borderSubtle,
          borderBottomWidth: BorderWidth.normal,
        },
      ]}
    >
      <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
      {value ? (
        <Text style={[styles.value, { color: colors.textSecondary }]}>
          {value}
        </Text>
      ) : null}
      {right}
      {icon ? (
        <Octicons name={icon} size={IconSize.sm} color={colors.textMuted} />
      ) : null}
    </TouchableOpacity>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        {title}
      </Text>
      <View
        style={[
          styles.group,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const { theme, setThemeName } = useThemeContext();
  const { colors } = theme;

  return (
    <Screen title="Settings">
      <Section title="Appearance">
        <Row
          label="Dark theme"
          last
          right={
            <Switch
              value={theme.isDark}
              onValueChange={dark => setThemeName(dark ? 'dark' : 'light')}
              trackColor={{ true: colors.accent, false: colors.border }}
              thumbColor={colors.textOnAccent}
            />
          }
        />
      </Section>

      <Section title="About">
        <Row label="Version" value={Constants.expoConfig?.version} />
        <Row label="Made by" value="Atharv Dange" />
        <Row
          label="Follow on X"
          value="@atharvdangedev"
          icon="link-external"
          onPress={() => Linking.openURL(X_URL)}
        />
        <Row
          label="Source on GitHub"
          icon="link-external"
          onPress={() => Linking.openURL(GITHUB_URL)}
          last
        />
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: Layout.screenPadding,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...TextStyles.label,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  group: {
    borderRadius: Radius.lg,
    borderWidth: BorderWidth.normal,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: 52,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  label: {
    ...TextStyles.body,
    flex: 1,
  },
  value: {
    ...TextStyles.body,
  },
});
