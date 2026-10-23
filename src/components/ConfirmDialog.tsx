import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import {
  BorderWidth,
  FontFamily,
  Radius,
  Spacing,
  TextStyles,
} from '../theme/tokens';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

// Replaces Alert.alert for destructive confirms so the dialog uses our theme.
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <Pressable
        style={styles.scrim}
        onPress={onCancel}
        accessibilityLabel="Cancel"
      >
        {/* Swallow taps on the dialog so they don't reach the scrim. */}
        <Pressable
          style={[
            styles.dialog,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          accessibilityRole="alert"
        >
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {title}
          </Text>
          {message ? (
            <Text style={[styles.message, { color: colors.textSecondary }]}>
              {message}
            </Text>
          ) : null}
          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.button,
                { borderColor: colors.border },
                pressed && { backgroundColor: colors.surfaceInset },
              ]}
            >
              <Text style={[styles.label, { color: colors.textPrimary }]}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.button,
                {
                  backgroundColor: colors.dangerSubtle,
                  borderColor: colors.dangerSubtle,
                },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={[styles.label, { color: colors.danger }]}>
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.xl,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  dialog: {
    borderRadius: Radius.lg,
    borderWidth: BorderWidth.normal,
    padding: Spacing.xl,
  },
  title: {
    ...TextStyles.title,
  },
  message: {
    ...TextStyles.body,
    marginTop: Spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: BorderWidth.normal,
    alignItems: 'center',
  },
  label: {
    ...TextStyles.body,
    fontFamily: FontFamily.semiBold,
  },
});
