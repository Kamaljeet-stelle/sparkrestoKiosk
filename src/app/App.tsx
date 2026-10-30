import { useMemo } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast, { BaseToast, ErrorToast, InfoToast } from 'react-native-toast-message';
import type { ToastConfigParams } from 'react-native-toast-message';
import { RootNavigator } from '../navigation/RootNavigator';
import { KioskProvider } from '../store/KioskProvider';
import { type Palette } from '../theme/colors';
import { setupFonts } from '../theme/setupFonts';
import { ThemeProvider, useTheme } from '../theme/ThemeProvider';

setupFonts();

export function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <KioskProvider>
          <ThemedApp />
        </KioskProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function ThemedApp() {
  const { colors, isDark } = useTheme();
  const toastConfig = useMemo(() => createToastConfig(colors), [colors]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <RootNavigator />
      <Toast config={toastConfig} />
    </View>
  );
}

function createToastConfig(colors: Palette) {
  const shared = {
    style: {
      backgroundColor: colors.surface,
      borderLeftWidth: 6,
    },
    contentContainerStyle: {
      backgroundColor: colors.surface,
    },
    text1Style: {
      color: colors.navy,
      fontSize: 14,
    },
    text2Style: {
      color: colors.textMuted,
      fontSize: 13,
    },
  };

  return {
    success: (props: ToastConfigParams<unknown>) => (
      <BaseToast {...props} {...shared} style={[shared.style, { borderLeftColor: colors.success }]} />
    ),
    error: (props: ToastConfigParams<unknown>) => (
      <ErrorToast {...props} {...shared} style={[shared.style, { borderLeftColor: colors.error }]} />
    ),
    info: (props: ToastConfigParams<unknown>) => (
      <InfoToast {...props} {...shared} style={[shared.style, { borderLeftColor: colors.primary }]} />
    ),
  };
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
