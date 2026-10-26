import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../atoms/AppText';
import { PlateFallbackIcon, PlusIcon } from '../atoms/KioskIcons';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import type { Product } from '../../types/kiosk';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import { formatMenuPrice } from '../../utils/money';
import { formatProductName } from '../../utils/text';

type Props = {
  product: Product;
  onAdd: (product: Product) => void;
};

export function ProductCard({ product, onAdd }: Props) {
  const { productImageHeight, mode } = useResponsiveLayout();
  const [failed, setFailed] = useState(false);
  const label = formatProductName(product.name).toUpperCase();
  const price = formatMenuPrice(product.price);
  const compact = mode === 'compact';
  const imageHeight = Math.max(productImageHeight, compact ? 110 : 140);
  const addSize = compact ? 32 : 36;

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Add ${label}, ${price}`}
        onPress={() => onAdd(product)}
        style={styles.mediaPress}>
        {product.imageUrl && !failed ? (
          <Image
            source={{ uri: product.imageUrl }}
            style={[styles.image, { height: imageHeight }]}
            resizeMode="contain"
            onError={() => setFailed(true)}
          />
        ) : (
          <View style={[styles.fallback, { height: imageHeight }]}>
            <PlateFallbackIcon size={compact ? 36 : 44} />
          </View>
        )}
      </Pressable>

      <View style={[styles.body, compact && styles.bodyCompact]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Add ${label}`}
          onPress={() => onAdd(product)}>
          <AppText
            style={[styles.name, compact && styles.nameCompact]}
            numberOfLines={2}>
            {label}
          </AppText>
        </Pressable>

        <View style={styles.footer}>
          <AppText style={[styles.price, compact && styles.priceCompact]}>
            {price}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Add ${label}`}
            onPress={() => onAdd(product)}
            hitSlop={8}
            style={({ pressed }) => [
              styles.add,
              { width: addSize, height: addSize, borderRadius: addSize / 2 },
              pressed && styles.addPressed,
            ]}>
            <PlusIcon size={compact ? 14 : 16} color={colors.navy} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
    shadowColor: '#0A183F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cardCompact: {
    borderRadius: 16,
  },
  mediaPress: {
    width: '100%',
  },
  image: {
    width: '100%',
    backgroundColor: '#F7F8FB',
  },
  fallback: {
    width: '100%',
    backgroundColor: '#F0F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
  },
  bodyCompact: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
  },
  name: {
    width: '100%',
    fontSize: 14,
    lineHeight: 18,
    fontFamily: fonts.semiBold,
    color: colors.navy,
    letterSpacing: 0.3,
    minHeight: 36,
  },
  nameCompact: {
    fontSize: 13,
    lineHeight: 17,
    minHeight: 34,
  },
  footer: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  price: {
    flex: 1,
    fontSize: 17,
    fontFamily: fonts.semiBold,
    color: colors.orange,
  },
  priceCompact: {
    fontSize: 15,
    lineHeight: 20,
  },
  add: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPressed: {
    backgroundColor: colors.orangeSoft,
    borderColor: colors.orange,
  },
});
