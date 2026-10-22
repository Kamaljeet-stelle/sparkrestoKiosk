import {
  StyleSheet,
  Text,
  TextInput,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
} from 'react-native';
import { fonts, fontForWeight } from '../../theme/fonts';

const POPPINS_FACES = new Set<string>(Object.values(fonts));

function resolveTextStyle(style: StyleProp<TextStyle> | undefined): TextStyle {
  const flat = StyleSheet.flatten(style) ?? {};
  const { fontWeight, fontFamily: explicitFamily, ...rest } = flat;

  // Prefer an explicit Poppins face. Never leave fontWeight on iOS with a
  // custom face — RN will try to synthesize weight and fall back to System.
  let family: string = fonts.regular;
  if (typeof explicitFamily === 'string' && POPPINS_FACES.has(explicitFamily)) {
    family = explicitFamily;
  } else if (fontWeight != null) {
    family = fontForWeight(fontWeight);
  } else if (typeof explicitFamily === 'string' && explicitFamily.length > 0) {
    family = explicitFamily;
  }

  return {
    ...rest,
    fontFamily: family,
  };
}

export function AppText({ style, ...props }: TextProps) {
  return (
    <Text
      {...props}
      allowFontScaling={props.allowFontScaling ?? false}
      style={resolveTextStyle(style)}
    />
  );
}

export function AppTextInput({ style, ...props }: TextInputProps) {
  return (
    <TextInput
      {...props}
      allowFontScaling={props.allowFontScaling ?? false}
      placeholderTextColor={props.placeholderTextColor}
      style={resolveTextStyle(style)}
    />
  );
}
