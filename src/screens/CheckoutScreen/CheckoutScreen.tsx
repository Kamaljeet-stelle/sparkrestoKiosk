import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../components/atoms/PrimaryButton';
import { TextField } from '../../components/atoms/TextField';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { lineTotalRand } from '../../services/cart';
import { digitsOnly } from '../../services/customer';
import { useKiosk } from '../../store/KioskProvider';
import { type Palette } from '../../theme/colors';
import { useThemedStyles } from '../../theme/ThemeProvider';
import type { OrderResult } from '../../types/kiosk';
import { formatRand } from '../../utils/money';
import { formatProductName } from '../../utils/text';
import { AppText } from '../../components/atoms/AppText';
import { fonts } from '../../theme/fonts';

type Props = {
  onBack: () => void;
  onPlaced: (result: OrderResult) => void;
  onStartOver: () => void;
};
const width = Dimensions.get('window').width;

export function CheckoutScreen({ onBack, onPlaced, onStartOver }: Props) {
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const layout = useResponsiveLayout();
  const {
    lines,
    quote,
    coupon,
    customer,
    updateCustomer,
    customerErrors,
    suggestions,
    selectMember,
    submitting,
    orderError,
    placeOrder,
  } = useKiosk();

  const summary = (
    <View style={styles.summary}>
      <AppText style={styles.summaryTitle}>Order summary</AppText>
      {lines.map(line => (
        <View key={line.productId} style={styles.summaryLine}>
          <AppText style={styles.summaryName}>
            {line.quantity} × {formatProductName(line.name)}
          </AppText>
          <AppText style={styles.summaryPrice}>
            {formatRand(lineTotalRand(line.unitPrice, line.quantity))}
          </AppText>
        </View>
      ))}
      <View style={styles.summaryLine}>
        <AppText style={styles.summaryName}>Sub Total</AppText>
        <AppText style={styles.summaryPrice}>{formatRand(quote.subtotal)}</AppText>
      </View>
      {coupon ? (
        <View style={styles.summaryLine}>
          <AppText style={styles.summaryName}>Discount</AppText>
          <AppText style={styles.summaryPrice}>{formatRand(quote.discount)}</AppText>
        </View>
      ) : null}
      <View style={styles.summaryLine}>
        <AppText style={styles.totalLabel}>Total</AppText>
        <AppText style={styles.totalLabel}>{formatRand(quote.total)}</AppText>
      </View>
      <AppText style={styles.note}>
        Additional taxes or changes apply at checkout. This kiosk does not
        collect card or cash payment.
      </AppText>
    </View>
  );

  const form = (
    <View style={styles.form}>
      <TextField
        label="Contact"
        required
        value={customer.contact}
        errorText={customerErrors.contact}
        keyboardType="number-pad"
        maxLength={15}
        placeholder="Enter your contact number"
        onChangeText={value => {
          const contact = digitsOnly(value);
          updateCustomer({ contact });
        }}
      />
      {suggestions.length > 0 ? (
        <View style={styles.suggestions}>
          {suggestions.map(member => (
            <Pressable
              key={`${member.contact}-${member.name}`}
              accessibilityRole="button"
              onPress={() => selectMember(member)}
              style={styles.suggestion}>
              <AppText style={styles.suggestionText}>{member.label}</AppText>
            </Pressable>
          ))}
        </View>
      ) : null}
      <TextField
        label="Name"
        required
        value={customer.name}
        errorText={customerErrors.name}
        maxLength={255}
        placeholder="Enter your name"
        onChangeText={name => updateCustomer({ name })}
      />
      {orderError ? <AppText style={styles.error}>{orderError}</AppText> : null}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable accessibilityRole="button" onPress={onBack} hitSlop={8}>
          <AppText style={styles.back}>Back</AppText>
        </Pressable>
        <AppText style={styles.headerTitle}>Checkout</AppText>
        <Pressable accessibilityRole="button" onPress={onStartOver} hitSlop={8}>
          <AppText style={styles.cancel}>Start over</AppText>
        </Pressable>
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 24 },
        ]}>
        <View style={layout.width >= 900 ? styles.columns : undefined}>
          {layout.width >= 900 ? (
            <>
              <View style={styles.column}>{summary}</View>
              <View style={styles.column}>{form}</View>
            </>
          ) : (
            <>
              {form}
              {summary}
            </>
          )}
        </View>
        <View style={styles.placeButton}>
          <PrimaryButton
            title="Place Order"
            variant="accent"
            loading={submitting}
            onPress={() => {
              placeOrder()
                .then(result => {
                  if (result) {
                    onPlaced(result);
                  }
                })
                .catch(() => undefined);
            }}
            style={styles.place}
          />

        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 16,
    minWidth: 72,
  },
  cancel: {
    color: colors.cancel,
    fontFamily: fonts.bold,
    fontSize: 15,
    minWidth: 72,
    textAlign: 'right',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.navy,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  columns: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  column: {
    flex: 1,
    minWidth: 320,
  },
  form: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 16,
  },
  suggestions: {
    marginTop: -8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  suggestion: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  suggestionText: {
    color: colors.navy,
    fontWeight: '600',
  },
  summary: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 10,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.navy,
    marginBottom: 4,
  },
  summaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryName: {
    flex: 1,
    color: colors.ink,
    fontWeight: '600',
  },
  summaryPrice: {
    color: colors.ink,
    fontWeight: '700',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.navy,
  },
  note: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginVertical: 12,
  },
  error: {
    color: colors.error,
    fontWeight: '700',
    marginBottom: 8,
  },
  place: {
    minHeight: 60,
    width: width - 50,
  },
  placeButton: {
    marginTop: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
}
