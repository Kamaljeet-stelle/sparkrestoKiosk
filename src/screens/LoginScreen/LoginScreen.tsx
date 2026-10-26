import { useEffect, useState } from 'react';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../../components/atoms/AppText';
import { PrimaryButton } from '../../components/atoms/PrimaryButton';
import { TextField } from '../../components/atoms/TextField';
import { KIOSK_TITLE } from '../../config/kiosk';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { login } from '../../services/kioskApi';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import Images from '../../theme/Images';
import { showError } from '../../utils/toast';

type Props = {
  onLogin: () => void;
};

export function LoginScreen({ onLogin }: Props) {
  const layout = useResponsiveLayout();
  const large = layout.isWide;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardOpen(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardOpen(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const submit = async () => {
    const user = email.trim();
    const pass = password.trim();
    if (!user || !pass) {
      showError('Enter email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(user, pass);
      onLogin();
    } catch (err) {
      showError(err);
    } finally {
      setLoading(false);
    }
  };

  const panelWidth = large ? 560 : 420;
  const logoSize = large ? 112 : 84;
  const titleSize = large ? 48 : 36;

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.screen,
            keyboardOpen && styles.screenKeyboard,
            { paddingHorizontal: layout.contentPadding },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          bounces={false}
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}>
          <View style={[styles.copy, { maxWidth: panelWidth }]}>
            <Image
              source={Images.appLogo}
              style={[
                styles.mark,
                {
                  width: logoSize,
                  height: logoSize,
                  borderRadius: large ? 28 : 24,
                },
              ]}
            />
            <AppText
              style={[
                styles.title,
                { fontSize: titleSize, lineHeight: titleSize + 10 },
              ]}>
              {KIOSK_TITLE}
            </AppText>
            <AppText style={[styles.lead, large && styles.leadLarge]}>
              Sign in to unlock this kiosk and start taking orders.
            </AppText>
          </View>

          <View
            style={[
              styles.card,
              { maxWidth: panelWidth },
              large && styles.cardLarge,
            ]}>
            <TextField
              label="Email"
              required
              large={large}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
            />
            <TextField
              label="Password"
              required
              large={large}
              secureTextEntry
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={() => {
                submit().catch(() => undefined);
              }}
            />
            <PrimaryButton
              title="Login"
              variant="accent"
              loading={loading}
              onPress={() => {
                submit().catch(() => undefined);
              }}
              style={[styles.loginBtn, large && styles.loginBtnLarge]}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screen: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  screenKeyboard: {
    justifyContent: 'flex-start',
    paddingTop: 12,
    paddingBottom: 32,
  },
  copy: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 28,
  },
  mark: {
    marginBottom: 18,
    backgroundColor: colors.white,
  },
  title: {
    marginTop: 8,
    color: colors.navy,
    fontFamily: fonts.semiBold,
    textAlign: 'center',
  },
  lead: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 24,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    textAlign: 'center',
  },
  leadLarge: {
    marginTop: 16,
    fontSize: 19,
    lineHeight: 28,
    maxWidth: 480,
  },
  card: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 20,
  },
  cardLarge: {
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 26,
  },
  loginBtn: {
    minHeight: 56,
    borderRadius: 16,
    marginTop: 4,
  },
  loginBtnLarge: {
    minHeight: 68,
    borderRadius: 18,
    marginTop: 8,
  },
});
