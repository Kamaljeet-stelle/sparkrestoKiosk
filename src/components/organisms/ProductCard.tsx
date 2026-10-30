import { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../atoms/AppText';
import { PlateFallbackIcon, PlusIcon } from '../atoms/KioskIcons';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import type { Product } from '../../types/kiosk';
import { type Palette } from '../../theme/colors';
import { useTheme, useThemedStyles } from '../../theme/ThemeProvider';
import { fonts } from '../../theme/fonts';
import { formatMenuPrice } from '../../utils/money';
import { formatProductName } from '../../utils/text';

type Props = {
  product: Product;
  onAdd: (product: Product) => void;
};

export function ProductCard({ product, onAdd }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { productImageHeight, mode } = useResponsiveLayout();
  const [failed, setFailed] = useState(false);
  const label = formatProductName(product.name).toUpperCase();
  const price = formatMenuPrice(product.price);
  const compact = mode === 'compact';
  const imageHeight = productImageHeight;
  const addSize = compact ? 28 : 48;

  const addButton = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Add ${label}`}
      onPress={() => onAdd(product)}
      hitSlop={8}
      style={({ pressed }) => [
        styles.add,
        compact && styles.addCompact,
        { width: addSize, height: addSize, borderRadius: addSize / 2 },
        pressed && styles.addPressed,
      ]}>
      <PlusIcon size={compact ? 15 : 22} color={colors.white} />
    </Pressable>
  );

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Add ${label}, ${price}`}
        onPress={() => onAdd(product)}
        style={styles.mediaPress}>
        <View style={styles.media}>
          {product.imageUrl && !failed ? (
            <Image
              source={{ uri: product.imageUrl }}
              style={[styles.image, { height: imageHeight }]}
              resizeMode="contain"
              onError={() => setFailed(true)}
            />
          ) : (
            <View style={[styles.fallback, { height: imageHeight }]}>
              <PlateFallbackIcon size={compact ? 32 : 44} />
            </View>
          )}
          {compact ? addButton : null}
        </View>
        <View style={[styles.nameWrap, compact && styles.nameWrapCompact]}>
          <AppText
            style={[styles.name, compact && styles.nameCompact]}
            numberOfLines={2}
            adjustsFontSizeToFit={compact}
            minimumFontScale={0.85}>
            {label}
          </AppText>
        </View>
      </Pressable>

      <View style={[styles.body, compact && styles.bodyCompact]}>

        {compact ? (
          <AppText
            style={[styles.price, styles.priceCompact]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}>
            {price}
          </AppText>
        ) : (
          <View style={styles.footer}>
            <AppText style={styles.price}>{price}</AppText>
            {addButton}
          </View>
        )}
      </View>
    </View>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: colors.line,
      overflow: 'hidden',
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.07,
      shadowRadius: 14,
      elevation: 3,
    },
    cardCompact: {
      borderRadius: 16,
    },
    mediaPress: {
      width: '100%',
    },
    media: {
      width: '100%',
      position: 'relative',
    },
    image: {
      width: '100%',
      backgroundColor: colors.media,
    },
    fallback: {
      width: '100%',
      backgroundColor: colors.mediaMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    nameWrap: {
      paddingHorizontal: 14,
      paddingTop: 12,
    },
    nameWrapCompact: {
      paddingHorizontal: 12,
      paddingTop: 10,
    },
    body: {
      paddingHorizontal: 14,
      paddingBottom: 12,
    },
    bodyCompact: {
      paddingHorizontal: 12,
      paddingBottom: 10,
    },
    name: {
      width: '100%',
      fontSize: 18,
      lineHeight: 23,
      fontFamily: fonts.bold,
      color: colors.navy,
      minHeight: 46,
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
      fontSize: 20,
      fontFamily: fonts.extraBold,
      color: colors.orange,
    },
    priceCompact: {
      marginTop: 8,
      fontSize: 15,
      lineHeight: 20,
    },
    add: {
      backgroundColor: colors.orange,
      alignItems: 'center',
      justifyContent: 'center',
    },
    addCompact: {
      position: 'absolute',
      right: 8,
      bottom: 8,
    },
    addPressed: {
      backgroundColor: colors.orangePressed,
    },
  });
}
