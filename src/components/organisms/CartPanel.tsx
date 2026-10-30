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
import { type Palette } from '../../theme/colors';
import { useTheme, useThemedStyles } from '../../theme/ThemeProvider';
import { lineTotalRand } from '../../services/cart';
import type { CartLine } from '../../types/kiosk';
import { formatMenuPrice, formatRand } from '../../utils/money';
import { formatProductName } from '../../utils/text';
import { AppText, AppTextInput } from '../atoms/AppText';
import { fonts } from '../../theme/fonts';

type Props = {
  onContinue: () => void;
  framed?: boolean;
  showTitle?: boolean;
};

export function CartPanel({ onContinue, framed = true, showTitle = true }: Props) {
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
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
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

  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  const renderLine = (item: CartLine) => (
    <View key={item.productId} style={styles.line}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.thumb} />
      ) : (
        <View style={styles.thumb} />
      )}
      <View style={styles.lineBody}>
        <View style={styles.lineTop}>
          <AppText style={styles.lineName} numberOfLines={2}>
            {formatProductName(item.name)}
          </AppText>
          <AppText style={styles.linePrice}>
            {formatRand(lineTotalRand(item.unitPrice, item.quantity))}
          </AppText>
        </View>
        <AppText style={styles.lineMeta}>{formatMenuPrice(item.unitPrice)} each</AppText>
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
        {showTitle ? <AppText style={styles.title}>Your Order</AppText> : null}
        {lines.length === 0 ? (
          <View style={styles.empty}>
            <Image
              source={{ uri: EMPTY_CART_URL }}
              style={styles.emptyArt}
              resizeMode="contain"
            />
            <AppText style={styles.emptyTitle}>Your cart is empty.</AppText>
            <AppText style={styles.emptyBody}>
              Add something from the menu to start this order.
            </AppText>
          </View>
        ) : (
          <View style={styles.listContent}>
            <AppText style={styles.count}>
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </AppText>
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

          <View style={styles.summary}>
            <TotalRow label="Sub Total" value={formatRand(quote.subtotal)} />
            {coupon ? (
              <TotalRow
                label={`Discount ${discountLabel}`}
                value={`− ${formatRand(quote.discount)}`}
              />
            ) : null}
            <View style={styles.totalDivider} />
            <TotalRow label="Total" value={formatRand(quote.total)} strong />
          </View>
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
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.totalRow}>
      <AppText
        style={[styles.totalText, styles.totalLabel, strong && styles.totalStrong]}>
        {label}
      </AppText>
      <AppText style={[styles.totalText, strong && styles.totalValue]}>
        {value}
      </AppText>
    </View>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: colors.canvas,
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontFamily: fonts.extraBold,
    color: colors.navy,
  },
  empty: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderRadius: 22,
    backgroundColor: colors.surface,
  },
  emptyArt: {
    width: 180,
    height: 130,
  },
  emptyTitle: {
    marginTop: 8,
    fontSize: 18,
    fontFamily: fonts.extraBold,
    color: colors.navy,
  },
  emptyBody: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    textAlign: 'center',
  },
  listContent: {
    gap: 12,
  },
  count: {
    color: colors.textMuted,
    fontFamily: fonts.semiBold,
    fontSize: 13,
  },
  line: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  thumb: {
    width: 76,
    height: 76,
    borderRadius: 16,
    backgroundColor: colors.media,
  },
  lineBody: {
    flex: 1,
    gap: 6,
  },
  lineTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  lineName: {
    flex: 1,
    fontSize: 16,
    lineHeight: 21,
    fontFamily: fonts.extraBold,
    color: colors.navy,
  },
  linePrice: {
    fontSize: 16,
    fontFamily: fonts.extraBold,
    color: colors.orange,
  },
  lineMeta: {
    fontSize: 13,
    fontFamily: fonts.medium,
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
    fontFamily: fonts.bold,
  },
  footer: {
    padding: 14,
    gap: 12,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  couponRow: {
    flexDirection: 'row',
    gap: 8,
  },
  couponInput: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 14,
    color: colors.navy,
    backgroundColor: colors.canvas,
  },
  couponError: {
    borderColor: colors.error,
  },
  apply: {
    minWidth: 88,
    borderRadius: 14,
    backgroundColor: colors.orange,
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
  summary: {
    gap: 8,
    paddingTop: 4,
  },
  totalDivider: {
    height: 1,
    backgroundColor: colors.line,
    marginVertical: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  totalText: {
    fontSize: 15,
    fontFamily: fonts.semiBold,
    color: colors.navy,
  },
  totalLabel: {
    flex: 1,
  },
  totalStrong: {
    fontSize: 18,
    fontFamily: fonts.extraBold,
  },
  totalValue: {
    fontSize: 20,
    fontFamily: fonts.extraBold,
    color: colors.orange,
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
}
