import { useState } from 'react';
import { StyleSheet, View, type TextInputProps } from 'react-native';
import { type Palette } from '../../theme/colors';
import { useTheme, useThemedStyles } from '../../theme/ThemeProvider';
import { fonts } from '../../theme/fonts';
import { typography } from '../../theme/typography';
import { AppText, AppTextInput } from './AppText';

type Props = TextInputProps & {
  label?: string;
  required?: boolean;
  errorText?: string;
  large?: boolean;
};

export function TextField({
  label,
  required,
  errorText,
  large = false,
  style,
  onFocus,
  onBlur,
  ...inputProps
}: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.wrap, large && styles.wrapLarge]}>
      {label ? (
        <AppText style={[styles.label, large && styles.labelLarge]}>
          {label}
          {required ? <AppText style={styles.star}> *</AppText> : null}
        </AppText>
      ) : null}
      <View
        style={[
          styles.field,
          large && styles.fieldLarge,
          focused && styles.focused,
          !!errorText && styles.errored,
        ]}>
        <AppTextInput
          {...inputProps}
          placeholderTextColor={colors.placeholder}
          style={[styles.input, large && styles.inputLarge, style]}
          onFocus={event => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={event => {
            setFocused(false);
            onBlur?.(event);
          }}
        />
      </View>
      {errorText ? <AppText style={styles.error}>{errorText}</AppText> : null}
    </View>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
  wrap: {
    marginBottom: 16,
  },
  wrapLarge: {
    marginBottom: 20,
  },
  label: {
    ...typography.label,
    fontFamily: fonts.semiBold,
    color: colors.navy,
    marginBottom: 8,
  },
  labelLarge: {
    fontSize: 17,
    marginBottom: 10,
  },
  star: {
    color: colors.cancel,
  },
  field: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  fieldLarge: {
    minHeight: 64,
    borderRadius: 16,
    paddingHorizontal: 18,
  },
  focused: {
    borderColor: colors.primary,
  },
  errored: {
    borderColor: colors.error,
  },
  input: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.navy,
    paddingVertical: 12,
  },
  inputLarge: {
    fontSize: 19,
    paddingVertical: 14,
  },
  error: {
    marginTop: 6,
    fontFamily: fonts.medium,
    color: colors.error,
    fontSize: 13,
  },
});
}
