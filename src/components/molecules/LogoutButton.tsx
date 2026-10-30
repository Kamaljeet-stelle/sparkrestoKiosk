import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
  View,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { logout } from '../../services/kioskApi';
import { type Palette } from '../../theme/colors';
import { useTheme, useThemedStyles } from '../../theme/ThemeProvider';
import { fonts } from '../../theme/fonts';
import { AppText } from '../atoms/AppText';

type Props = {
  onLogout: () => void;
  style?: StyleProp<ViewStyle>;
};

export function LogoutButton({ onLogout, style }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }
    setLoggingOut(true);
    try {
      await logout();
      onLogout();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Log out"
      disabled={loggingOut}
      onPress={() => {
        handleLogout().catch(() => undefined);
      }}
      style={({ pressed }) => [
        styles.button,
        {
          transform: [{ scale: pressed ? 0.96 : 1 }],
          opacity: loggingOut ? 0.7 : 1,
        },
        style,
      ]}>
      <View style={styles.iconWrap}>
        {loggingOut ? (
          <ActivityIndicator color={colors.orange} size="small" />
        ) : (
          <Ionicons name="log-out-outline" size={18} color={colors.orange} />
        )}
      </View>
      <AppText style={styles.label}>Log out</AppText>
    </Pressable>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 14,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: colors.navy,
    fontFamily: fonts.semiBold,
    fontSize: 14,
    letterSpacing: 0.2,
  },
});
}
