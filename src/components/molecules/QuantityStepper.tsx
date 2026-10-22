import { Pressable, StyleSheet, View } from 'react-native';
import { MAX_ITEM_QUANTITY } from '../../config/kiosk';
import { colors } from '../../theme/colors';
import { AppText } from '../atoms/AppText';

type Props = {
  quantity: number;
  onChange: (quantity: number) => void;
};

export function QuantityStepper({ quantity, onChange }: Props) {
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={quantity <= 1 ? 'Remove item' : 'Decrease quantity'}
        onPress={() => onChange(quantity - 1)}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        <AppText style={styles.symbol}>{quantity <= 1 ? '×' : '−'}</AppText>
      </Pressable>
      <AppText style={styles.qty} accessibilityLabel={`Quantity ${quantity}`}>
        {quantity}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Increase quantity"
        disabled={quantity >= MAX_ITEM_QUANTITY}
        onPress={() => onChange(quantity + 1)}
        style={({ pressed }) => [
          styles.button,
          quantity >= MAX_ITEM_QUANTITY && styles.disabled,
          pressed && styles.pressed,
        ]}>
        <AppText style={styles.symbol}>+</AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    overflow: 'hidden',
  },
  button: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbol: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.navy,
  },
  qty: {
    minWidth: 24,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: colors.navy,
  },
  pressed: {
    opacity: 0.6,
  },
  disabled: {
    opacity: 0.35,
  },
});
