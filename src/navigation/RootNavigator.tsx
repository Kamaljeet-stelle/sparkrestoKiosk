import { useCallback, useEffect, useState } from 'react';
import { Alert, BackHandler, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../components/atoms/AppText';
import { IDLE_TIMEOUT_MS, IDLE_WARNING_MS } from '../config/kiosk';
import { CartScreen } from '../screens/CartScreen/CartScreen';
import { CheckoutScreen } from '../screens/CheckoutScreen/CheckoutScreen';
import { ConfirmationScreen } from '../screens/ConfirmationScreen/ConfirmationScreen';
import { LoginScreen } from '../screens/LoginScreen/LoginScreen';
import { MenuScreen } from '../screens/MenuScreen/MenuScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen/WelcomeScreen';
import { hydrateSession, isLoggedIn } from '../services/session';
import { useKiosk } from '../store/KioskProvider';
import { type Palette } from '../theme/colors';
import { useThemedStyles } from '../theme/ThemeProvider';
import type { OrderResult } from '../types/kiosk';

type ScreenName = 'login' | 'welcome' | 'menu' | 'cart' | 'checkout' | 'confirmation';

export function RootNavigator() {
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const {
    lines,
    coupon,
    submitting,
    clearSession,
    loadMenu,
    markActivity,
    lastActivity,
  } = useKiosk();
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<ScreenName>('login');
  const [confirmation, setConfirmation] = useState<OrderResult | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    hydrateSession()
      .then(() => {
        if (cancelled) {
          return;
        }
        if (isLoggedIn()) {
          setScreen('welcome');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setReady(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (screen === 'login' || screen === 'welcome' || screen === 'checkout') {
      return;
    }
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [screen]);

  useEffect(() => {
    if (
      screen === 'login' ||
      screen === 'welcome' ||
      screen === 'checkout' ||
      submitting
    ) {
      return;
    }
    if (now - lastActivity < IDLE_TIMEOUT_MS) {
      return;
    }
    clearSession();
    setConfirmation(null);
    setScreen('welcome');
  }, [clearSession, lastActivity, now, screen, submitting]);

  const leaveOrder = useCallback(() => {
    if (lines.length === 0 && !coupon) {
      clearSession();
      setConfirmation(null);
      setScreen('welcome');
      return;
    }
    Alert.alert('Start over?', 'This clears the current order.', [
      { text: 'Keep order', style: 'cancel' },
      {
        text: 'Start over',
        style: 'destructive',
        onPress: () => {
          clearSession();
          setConfirmation(null);
          setScreen('welcome');
        },
      },
    ]);
  }, [clearSession, coupon, lines.length]);

  const handleLogout = useCallback(() => {
    clearSession();
    setConfirmation(null);
    setScreen('login');
  }, [clearSession]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (screen === 'login') {
          return false;
        }
        if (screen === 'welcome') {
          setScreen('login');
          return true;
        }
        if (screen === 'cart') {
          setScreen('menu');
          return true;
        }
        if (screen === 'checkout') {
          setScreen('menu');
          return true;
        }
        if (screen === 'confirmation') {
          clearSession();
          setConfirmation(null);
          setScreen('welcome');
          return true;
        }
        leaveOrder();
        return true;
      },
    );
    return () => subscription.remove();
  }, [clearSession, leaveOrder, screen]);

  const remaining = IDLE_TIMEOUT_MS - (now - lastActivity);
  const showWarning =
    (screen === 'menu' || screen === 'cart') &&
    lines.length > 0 &&
    remaining > 0 &&
    remaining <= IDLE_WARNING_MS;

  if (!ready) {
    return <View style={styles.root} />;
  }

  return (
    <View
      style={styles.root}
      onStartShouldSetResponderCapture={() => {
        markActivity();
        return false;
      }}>
      {screen === 'login' ? (
        <LoginScreen onLogin={() => setScreen('welcome')} />
      ) : null}
      {screen === 'welcome' ? (
        <WelcomeScreen
          onStart={() => {
            clearSession();
            setConfirmation(null);
            setScreen('menu');
            loadMenu().catch(() => undefined);
          }}
        />
      ) : null}
      {screen === 'menu' ? (
        <MenuScreen
          onContinue={() => {
            if (lines.length > 0) {
              setScreen('checkout');
            }
          }}
          onOpenCart={() => setScreen('cart')}
          onStartOver={leaveOrder}
          onLogout={handleLogout}
        />
      ) : null}
      {screen === 'cart' ? (
        <CartScreen
          onBack={() => setScreen('menu')}
          onContinue={() => {
            if (lines.length > 0) {
              setScreen('checkout');
            }
          }}
          onStartOver={leaveOrder}
        />
      ) : null}
      {screen === 'checkout' ? (
        <CheckoutScreen
          onBack={() => setScreen('menu')}
          onStartOver={leaveOrder}
          onPlaced={result => {
            setConfirmation(result);
            setScreen('confirmation');
          }}
        />
      ) : null}
      {screen === 'confirmation' && confirmation ? (
        <ConfirmationScreen
          result={confirmation}
          onNewOrder={() => {
            clearSession();
            setConfirmation(null);
            setScreen('welcome');
          }}
        />
      ) : null}
      {showWarning ? (
        <View pointerEvents="none" style={[styles.idle, { top: insets.top + 8 }]}>
          <AppText style={styles.idleText}>
            Still there? This order clears in {Math.ceil(remaining / 1000)}s.
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  idle: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: colors.fill,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  idleText: {
    color: colors.white,
    fontWeight: '700',
    textAlign: 'center',
  },
});
}
