import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { type Palette } from '../../theme/colors';
import { useThemedStyles, useTheme } from '../../theme/ThemeProvider';
import { typography } from '../../theme/typography';
import { AppText } from './AppText';

type Variant = 'primary' | 'accent' | 'navy' | 'danger' | 'outline';

type Props = {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const isDisabled = disabled || loading;
  const lightLabel = variant === 'outline';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'accent' && styles.accent,
        variant === 'navy' && styles.navy,
        variant === 'danger' && styles.danger,
        variant === 'outline' && styles.outline,
        isDisabled && styles.disabled,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={lightLabel ? colors.primary : colors.white} />
      ) : (
        <AppText style={[styles.label, lightLabel && styles.outlineLabel]}>
          {title}
        </AppText>
      )}
    </Pressable>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
  base: {
    minHeight: 52,
    minWidth: 126,
    paddingHorizontal: 22,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.primary,
  },
  accent: {
    backgroundColor: colors.orange,
  },
  navy: {
    backgroundColor: colors.fill,
  },
  danger: {
    backgroundColor: colors.cancel,
  },
  outline: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.88,
  },
  label: {
    ...typography.button,
    color: colors.white,
    letterSpacing: 0.3,
  },
  outlineLabel: {
    color: colors.primary,
  },
});
}
