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
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { AppText } from '../atoms/AppText';

type Props = {
  onLogout: () => void;
  style?: StyleProp<ViewStyle>;
};

export function LogoutButton({ onLogout, style }: Props) {
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
          <ActivityIndicator color={colors.white} size="small" />
        ) : (
          <Ionicons name="log-out-outline" size={16} color={colors.white} />
        )}
      </View>
      <AppText style={styles.label}>Log out</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 14,
    borderRadius: 13,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.line,
    // shadowColor: colors.navy,
    // shadowOffset: { width: 0, height: 6 },
    // shadowOpacity: 0.12,
    // shadowRadius: 12,
    // elevation: 4,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.cancel,
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
