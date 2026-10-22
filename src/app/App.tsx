import { StatusBar, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { RootNavigator } from '../navigation/RootNavigator';
import { KioskProvider } from '../store/KioskProvider';
import { colors } from '../theme/colors';
import { setupFonts } from '../theme/setupFonts';

setupFonts();

export function App() {
  return (
    <SafeAreaProvider>
      <KioskProvider>
        <View style={styles.root}>
          <StatusBar barStyle="dark-content" />
          <RootNavigator />
          <Toast />
        </View>
      </KioskProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
