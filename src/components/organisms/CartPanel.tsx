import { useEffect, useRef, useState } from 'react';
import {
  Image,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewInstance,
  type ViewInstance,
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
  const panelRef = useRef<ViewInstance>(null);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const couponRef = useRef<ViewInstance>(null);
  const couponFocusedRef = useRef(false);
  const keyboardTopRef = useRef<number | null>(null);
  const scrollOffsetRef = useRef(0);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const couponApplied = couponStatus === 'applied';
  const couponBusy = couponStatus === 'applying';

  const syncInsetRef = useRef<(keyboardTop: number | null) => void>(() => undefined);
  syncInsetRef.current = keyboardTop => {
    keyboardTopRef.current = keyboardTop;
    if (!couponFocusedRef.current || keyboardTop == null) {
      setKeyboardInset(0);
      return;
    }

    panelRef.current?.measureInWindow((_x, y, _width, height) => {
      if (!couponFocusedRef.current || keyboardTopRef.current == null) {
        return;
      }
      const covered = y + height - keyboardTopRef.current;
      setKeyboardInset(Math.max(0, Math.round(covered)));
      requestAnimationFrame(revealCoupon);
    });
  };

  const revealCoupon = () => {
    const field = couponRef.current;
    const scroll = scrollRef.current;
    if (!field || !scroll) {
      return;
    }

    field.measureInWindow((_x, fieldY, _width, fieldHeight) => {
      scroll.measureInWindow((_sx, scrollY, _sw, scrollHeight) => {
        const keyboardTop = keyboardTopRef.current ?? scrollY + scrollHeight;
        const visibleBottom = Math.min(scrollY + scrollHeight, keyboardTop);
        const overlap = fieldY + fieldHeight - (visibleBottom - 12);
        const above = fieldY - (scrollY + 12);
        const delta = overlap > 0 ? overlap : above < 0 ? above : 0;
        if (delta === 0) {
          return;
        }
        scroll.scrollTo({
          y: Math.max(0, scrollOffsetRef.current + delta),
          animated: true,
        });
      });
    });
  };

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillChangeFrame' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, event => {
      syncInsetRef.current(event.endCoordinates.screenY);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      syncInsetRef.current(null);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const discountLabel =
    coupon?.offerType === 'Percentage'
      ? `${coupon.offer}%`
      : coupon
        ? formatRand(coupon.offer)
        : '';

  const renderLine = (item: CartLine) => (
    <View key={item.productId} style={styles.line}>
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
    <View
      ref={panelRef}
      collapsable={false}
      style={[styles.panel, framed && styles.framed]}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroller}
        contentContainerStyle={[
          styles.scrollerContent,
          { paddingBottom: 12 + keyboardInset },
        ]}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={event => {
          scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
        }}
        onContentSizeChange={() => {
          if (couponFocusedRef.current) {
            revealCoupon();
          }
        }}>
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
          <View style={styles.listContent}>
            {lines.map(renderLine)}
          </View>
        )}

        <View style={styles.footer}>
          <View ref={couponRef} collapsable={false} style={styles.couponRow}>
            <AppTextInput
              value={couponCode}
              onChangeText={setCouponCode}
              editable={!couponApplied && !couponBusy}
              placeholder="Enter Coupon Code"
              placeholderTextColor={colors.placeholder}
              autoCapitalize="characters"
              onFocus={() => {
                couponFocusedRef.current = true;
                syncInsetRef.current(keyboardTopRef.current);
                revealCoupon();
              }}
              onBlur={() => {
                couponFocusedRef.current = false;
                setKeyboardInset(0);
              }}
              style={[styles.couponInput, !!couponError && styles.couponError]}
            />
            <Pressable
              accessibilityRole="button"
              disabled={couponBusy}
              onPress={() => {
                if (couponApplied) {
                  clearCoupon();
                  return;
                }
                applyCoupon().catch(() => undefined);
              }}
              style={[styles.apply, couponBusy && styles.applyBusy]}>
              <AppText style={styles.applyText}>
                {couponApplied ? 'Change' : couponBusy ? '…' : 'Apply'}
              </AppText>
            </Pressable>
          </View>
          {couponError ? <AppText style={styles.error}>{couponError}</AppText> : null}
          {couponApplied ? (
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
      <AppText
        style={[styles.totalText, styles.totalLabel, strong && styles.totalStrong]}>
        {label}
      </AppText>
      <AppText style={[styles.totalText, strong && styles.totalStrong]}>
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
  totalText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
  },
  totalLabel: {
    flex: 1,
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
