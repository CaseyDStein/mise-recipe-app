import React, { forwardRef, useMemo } from 'react';
import { TextInput as RNTextInput, Text, View, StyleSheet, TextInputProps } from 'react-native';
import { useColors, spacing, radius, typography, Colors } from '@/src/lib/theme';

interface InputProps extends TextInputProps {
  label?: string;
  labelColor?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const TextInput = forwardRef<RNTextInput, InputProps>(
  ({ label, labelColor, error, leftIcon, rightIcon, style, ...props }, ref) => {
    const colors = useColors();
    const styles = useMemo(() => createStyles(colors), [colors]);

    return (
      <View style={styles.container}>
        {label && <Text style={[styles.label, labelColor ? { color: labelColor } : undefined]}>{label}</Text>}
        <View style={[styles.inputWrapper, error && styles.inputError]}>
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          <RNTextInput
            ref={ref}
            style={[
              styles.input,
              leftIcon && styles.inputWithLeft,
              rightIcon && styles.inputWithRight,
              !props.multiline && !props.secureTextEntry && styles.inputCentered,
              style,
            ]}
            placeholderTextColor={colors.text3}
            {...props}
          />
          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }
);

TextInput.displayName = 'TextInput';

function createStyles(colors: Colors) {
  return StyleSheet.create({
    container: { gap: spacing.xs },
    label: { ...typography.titleSm, color: colors.text0 },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bg3,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.bg4,
    },
    inputError: { borderColor: colors.error },
    input: {
      flex: 1,
      fontSize: typography.bodyMd.fontSize,
      fontWeight: typography.bodyMd.fontWeight,
      color: colors.text0,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      minHeight: 48,
    },
    inputCentered: {
      paddingVertical: 0,
      height: 48,
      textAlignVertical: 'center',
      includeFontPadding: false,
    },
    inputWithLeft: { paddingLeft: spacing.xs },
    inputWithRight: { paddingRight: spacing.xs },
    iconLeft: { paddingLeft: spacing.md },
    iconRight: { paddingRight: spacing.md },
    errorText: { ...typography.bodySm, color: colors.error },
  });
}
