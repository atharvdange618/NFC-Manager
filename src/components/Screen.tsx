import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { Layout, Spacing, TextStyles } from '../theme/tokens';

interface ScreenProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

// Tab screen frame: title header and a scrolling body. The tab bar
// handles the bottom inset, so only the top edge is padded here.
export function Screen({ title, subtitle, children }: ScreenProps) {
  const { colors } = useTheme();

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Layout.screenPadding,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  title: {
    ...TextStyles.display,
  },
  subtitle: {
    ...TextStyles.body,
    marginTop: Spacing.xs,
  },
});
