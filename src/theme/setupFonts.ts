import { Text, TextInput } from 'react-native';
import { fonts } from './fonts';

/**
 * Baseline Poppins for any Text / TextInput that does not set fontFamily.
 * Weight-specific faces are applied through AppText / AppTextInput.
 */
export function setupFonts() {
  const textDefaults = Text as typeof Text & {
    defaultProps?: { style?: unknown; allowFontScaling?: boolean };
  };
  const inputDefaults = TextInput as typeof TextInput & {
    defaultProps?: { style?: unknown; allowFontScaling?: boolean };
  };

  textDefaults.defaultProps = {
    ...textDefaults.defaultProps,
    allowFontScaling: false,
    style: [{ fontFamily: fonts.regular }, textDefaults.defaultProps?.style],
  };

  inputDefaults.defaultProps = {
    ...inputDefaults.defaultProps,
    allowFontScaling: false,
    style: [{ fontFamily: fonts.regular }, inputDefaults.defaultProps?.style],
  };
}
