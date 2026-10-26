import { Image, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../components/atoms/AppText';
import { PrimaryButton } from '../../components/atoms/PrimaryButton';
import { KIOSK_TITLE } from '../../config/kiosk';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import Images from '../../theme/Images';

type Props = {
  onStart: () => void;
};

export function WelcomeScreen({ onStart }: Props) {
  const insets = useSafeAreaInsets();
  const layout = useResponsiveLayout();
  const hero = layout.mode === 'compact' ? 42 : 64;

  return (
    <View
      style={[
        styles.screen,
        {
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: layout.contentPadding,
        },
      ]}>
      <View style={styles.copy}>
        <Image source={Images.appLogo} style={styles.mark} />
        <AppText style={[styles.title, { fontSize: hero, lineHeight: hero + 8 }]}>
          {KIOSK_TITLE}
        </AppText>
        <AppText style={styles.lead}>
          Browse the menu, build your order, and send it straight to the store.
        </AppText>
      </View>
      <View style={styles.buttons}>
        <PrimaryButton
          title="Start Order"
          variant="accent"
          onPress={onStart}
          style={styles.start}
        />
      </View>
      <AppText style={styles.footer}>
        Prices are shown in rand. This kiosk does not take payment. Taxes, if
        any, are confirmed by the store when the order is placed.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    width: '100%',
    maxWidth: 640,
    alignItems: 'center',
  },
  mark: {
    width: 84,
    height: 84,
    borderRadius: 24,
    marginBottom: 18,
    backgroundColor: colors.white,
  },
  title: {
    marginTop: 8,
    color: colors.navy,
    fontFamily: fonts.bold,
    textAlign: 'center',
  },
  lead: {
    marginTop: 12,
    fontSize: 17,
    lineHeight: 26,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 460,
  },
  start: {
    minHeight: 64,
    borderRadius: 18,
    width: 350,
    marginVertical: 12,
  },
  footer: {
    marginTop: 22,
    maxWidth: 460,
    textAlign: 'center',
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  buttons: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
