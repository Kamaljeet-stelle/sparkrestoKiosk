import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { AppText } from '../../components/atoms/AppText';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import type { OrderResult } from '../../types/kiosk';

const successAnim = require('../../assets/lottie/green-tick.json');
const cancelAnim = require('../../assets/lottie/cancel-animation.json');

type Props = {
  result: OrderResult;
  onNewOrder: () => void;
};

export function ConfirmationScreen({ result, onNewOrder }: Props) {
  const insets = useSafeAreaInsets();
  const ok = result.success;

  return (
    <View
      style={[
        styles.screen,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 },
      ]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <LottieView
          source={ok ? successAnim : cancelAnim}
          autoPlay
          loop={false}
          style={styles.anim}
        />
        <AppText style={styles.title}>
          {ok ? 'Order sent!' : 'Order failed'}
        </AppText>
        <AppText style={styles.lead}>
          {ok ? 'The store has received your order.' : result.message}
        </AppText>

        {ok ? (
          <View style={styles.card}>
            <Ionicons name="receipt-outline" size={28} color="#22C55E" />
            <View style={styles.labelRow}>
              <View style={[styles.rule, styles.ruleGreen]} />
              <AppText style={styles.label}>ORDER NUMBER</AppText>
              <View style={[styles.rule, styles.ruleGreen]} />
            </View>
            <AppText style={styles.orderNumber}>
              {result.orderNumber ?? '—'}
            </AppText>

            <View style={styles.dots} />

            <Ionicons name="wallet-outline" size={28} color={colors.orange} />
            <View style={styles.labelRow}>
              <View style={[styles.rule, styles.ruleOrange]} />
              <AppText style={styles.label}>TOTAL PAID</AppText>
              <View style={[styles.rule, styles.ruleOrange]} />
            </View>
            <AppText style={styles.total}>{result.totalLabel}</AppText>

            <View style={styles.banner}>
              <Ionicons name="bicycle-outline" size={22} color="#15803D" />
              <AppText style={styles.bannerText}>{result.message}</AppText>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        onPress={onNewOrder}
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
        <AppText style={styles.ctaText}>Start New Order</AppText>
        <Ionicons name="arrow-forward" size={20} color={colors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F7F8FC',
    paddingHorizontal: 20,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 16,
  },
  anim: {
    width: 140,
    height: 140,
  },
  title: {
    marginTop: 4,
    fontSize: 34,
    fontFamily: fonts.extraBold,
    color: colors.navy,
    textAlign: 'center',
  },
  lead: {
    marginTop: 6,
    fontSize: 16,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    textAlign: 'center',
  },
  card: {
    marginTop: 28,
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.white,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 18,
    alignItems: 'center',
    shadowColor: '#0A183F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  labelRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rule: {
    width: 28,
    height: 2,
    borderRadius: 1,
  },
  ruleGreen: {
    backgroundColor: '#86EFAC',
  },
  ruleOrange: {
    backgroundColor: '#FDBA74',
  },
  label: {
    fontSize: 12,
    letterSpacing: 1,
    fontFamily: fonts.semiBold,
    color: colors.textMuted,
  },
  orderNumber: {
    marginTop: 6,
    fontSize: 40,
    lineHeight: 48,
    fontFamily: fonts.extraBold,
    color: colors.navy,
  },
  dots: {
    alignSelf: 'stretch',
    marginVertical: 18,
    borderStyle: 'dashed',
    borderBottomWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  total: {
    marginTop: 6,
    fontSize: 36,
    lineHeight: 44,
    fontFamily: fonts.extraBold,
    color: colors.orange,
  },
  banner: {
    marginTop: 20,
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ECFDF3',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.medium,
    color: '#166534',
  },
  cta: {
    minHeight: 58,
    borderRadius: 16,
    backgroundColor: colors.orange,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  ctaPressed: {
    opacity: 0.9,
  },
  ctaText: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.white,
  },
});
