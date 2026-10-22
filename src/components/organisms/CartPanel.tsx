import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { PrimaryButton } from '../atoms/PrimaryButton';
import { QuantityStepper } from '../molecules/QuantityStepper';
import { EMPTY_CART_URL } from '../../config/kiosk';
import { useKiosk } from '../../store/KioskProvider';
import { colors } from '../../theme/colors';
import { lineTotalRand } from '../../services/cart';
import type { CartLine } from '../../types/kiosk';
import { formatRand } from '../../utils/money';
import { formatProductName } from '../../utils/text';
import { AppText, AppTextInput } from '../atoms/AppText';

type Props = {
  onContinue: () => void;
  framed?: boolean;
};

export function CartPanel({ onContinue, framed = true }: Props) {
  const {
    lines,
    setQuantity,
    removeLine,
    quote,
    coupon,
    couponCode,
    setCouponCode,
    couponStatus,
    couponError,
    applyCoupon,
    clearCoupon,
  } = useKiosk();

  const discountLabel =
    coupon?.offerType === 'Percentage'
      ? `${coupon.offer}%`
      : coupon
        ? formatRand(coupon.offer)
        : '';

  const renderLine = ({ item }: { item: CartLine }) => (
    <View style={styles.line}>
      <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
      <View style={styles.lineBody}>
        <AppText style={styles.lineName} numberOfLines={2}>
          {formatProductName(item.name)}
        </AppText>
        <AppText style={styles.lineMeta}>
          × {item.unitPrice} ·{' '}
          {formatRand(lineTotalRand(item.unitPrice, item.quantity))}
        </AppText>
        <View style={styles.lineActions}>
          <QuantityStepper
            quantity={item.quantity}
            onChange={quantity => setQuantity(item.productId, quantity)}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => removeLine(item.productId)}
            hitSlop={8}>
            <AppText style={styles.remove}>Remove</AppText>
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.panel, framed && styles.framed]}>
      <ScrollView
        style={styles.scroller}
        contentContainerStyle={styles.scrollerContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <AppText style={styles.title}>Your Order</AppText>
        {lines.length === 0 ? (
          <View style={styles.empty}>
            <Image
              source={{ uri: EMPTY_CART_URL }}
              style={styles.emptyArt}
              resizeMode="contain"
            />
            <AppText style={styles.emptyTitle}>Your cart is empty.</AppText>
          </View>
        ) : (
          <FlatList
            data={lines}
            keyExtractor={item => item.productId}
            renderItem={renderLine}
            scrollEnabled={false}
            contentContainerStyle={styles.listContent}
          />
        )}

        <View style={styles.footer}>
          <View style={styles.couponRow}>
            <AppTextInput
              value={couponCode}
              onChangeText={setCouponCode}
              editable={
                couponStatus !== 'applied' && couponStatus !== 'applying'
              }
              placeholder="Enter Coupon Code"
              placeholderTextColor={colors.placeholder}
              autoCapitalize="characters"
              style={[styles.couponInput, !!couponError && styles.couponError]}
            />
            {couponStatus === 'applied' ? (
              <Pressable
                accessibilityRole="button"
                onPress={clearCoupon}
                style={styles.apply}>
                <AppText style={styles.applyText}>Change</AppText>
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                disabled={couponStatus === 'applying'}
                onPress={() => {
                  applyCoupon().catch(() => undefined);
                }}
                style={[
                  styles.apply,
                  couponStatus === 'applying' && styles.applyBusy,
                ]}>
                <AppText style={styles.applyText}>
                  {couponStatus === 'applying' ? '…' : 'Apply'}
                </AppText>
              </Pressable>
            )}
          </View>
          {couponError ? <AppText style={styles.error}>{couponError}</AppText> : null}
          {couponStatus === 'applied' ? (
            <AppText style={styles.applied}>Coupon applied successfully.</AppText>
          ) : null}

          <TotalRow label="Sub Total" value={formatRand(quote.subtotal)} />
          {coupon ? (
            <TotalRow
              label={`Discount ${discountLabel}`}
              value={formatRand(quote.discount)}
            />
          ) : null}
          <TotalRow label="Total" value={formatRand(quote.total)} strong />
          <AppText style={styles.note}>
            Additional taxes or changes apply at checkout
          </AppText>
          <PrimaryButton
            title="Continue"
            variant="accent"
            disabled={lines.length === 0}
            onPress={onContinue}
            style={styles.continue}
          />
        </View>
      </ScrollView>
    </View>
  );
}

function TotalRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <View style={styles.totalRow}>
      <AppText style={[styles.totalLabel, strong && styles.totalStrong]}>
        {label}
      </AppText>
      <AppText style={[styles.totalValue, strong && styles.totalStrong]}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: colors.white,
  },
  framed: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  scroller: {
    flex: 1,
  },
  scrollerContent: {
    flexGrow: 1,
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.ink,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  empty: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  emptyArt: {
    width: 180,
    height: 130,
  },
  emptyTitle: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: '700',
    color: colors.textMuted,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 10,
  },
  line: {
    flexDirection: 'row',
    gap: 10,
    padding: 8,
    borderRadius: 14,
    backgroundColor: colors.background,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: colors.white,
  },
  lineBody: {
    flex: 1,
    gap: 4,
  },
  lineName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.ink,
  },
  lineMeta: {
    fontSize: 12,
    color: colors.textMuted,
  },
  lineActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  remove: {
    color: colors.cancel,
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    marginTop: 'auto',
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  couponRow: {
    flexDirection: 'row',
    gap: 8,
  },
  couponInput: {
    flex: 1,
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
    color: colors.navy,
    backgroundColor: colors.white,
  },
  couponError: {
    borderColor: colors.error,
  },
  apply: {
    minWidth: 84,
    borderRadius: 12,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  applyBusy: {
    opacity: 0.6,
  },
  applyText: {
    color: colors.white,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  error: {
    color: colors.error,
    fontSize: 13,
  },
  applied: {
    color: colors.success,
    fontSize: 13,
    fontWeight: '700',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  totalLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  totalStrong: {
    fontSize: 18,
    fontWeight: '800',
  },
  note: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
    textAlign: 'center',
  },
  continue: {
    alignSelf: 'stretch',
  },
});
