import { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { ChevronIcon } from '../atoms/KioskIcons';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import type { Category } from '../../types/kiosk';
import { type Palette } from '../../theme/colors';
import { useTheme, useThemedStyles } from '../../theme/ThemeProvider';
import { fonts } from '../../theme/fonts';
import { AppText } from '../atoms/AppText';

type Props = {
  categories: Category[];
  selectedId: string;
  onSelect: (categoryId: string) => void;
};

type ItemMetrics = { x: number; y: number; width: number; height: number };

type Scrollable = {
  scrollTo: (options: { x?: number; y?: number; animated?: boolean }) => void;
};

function CategoryChip({
  category,
  selected,
  cardWidth,
  thumb,
  image,
  fontSize,
  showChevron,
  onSelect,
  onLayout,
}: {
  category: Category;
  selected: boolean;
  cardWidth: number;
  thumb: number;
  image: number;
  fontSize: number;
  showChevron: boolean;
  onSelect: () => void;
  onLayout: (metrics: ItemMetrics) => void;
}) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(selected ? 1 : 0.96)).current;
  const styles = useThemedStyles(createStyles);
  const labelFontSize = fontSize + 2;
  const lineHeight = labelFontSize + 3;
  const labelHeight = lineHeight * 2;
  // Fixed card height so 1-line and 2-line labels stay the same size.
  const itemHeight = 20 + thumb + 6 + labelHeight;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: selected ? 1 : 0.96,
      friction: 7,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [scale, selected]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onSelect}
      onLayout={(event: LayoutChangeEvent) => {
        const { x, y, width, height } = event.nativeEvent.layout;
        onLayout({ x, y, width, height });
      }}
      style={({ pressed }) => [
        styles.wrap,
        { width: cardWidth },
        pressed && styles.pressed,
      ]}>
      <Animated.View
        style={[
          styles.item,
          selected && styles.itemSelected,
          { height: itemHeight, transform: [{ scale }] },
        ]}>
        <View
          style={[
            styles.thumb,
            {
              width: thumb,
              height: thumb,
              borderRadius: Math.round(thumb * 0.28),
            },
            selected && styles.thumbSelected,
          ]}>
          {category.imageUrl ? (
            <Image
              source={{ uri: category.imageUrl }}
              style={{ width: image, height: image }}
              resizeMode="contain"
            />
          ) : (
            <AppText style={[styles.letter, { fontSize: fontSize + 6 }]}>
              {category.name.slice(0, 1)}
            </AppText>
          )}
        </View>
        <AppText
          style={[
            styles.label,
            { fontSize: labelFontSize, lineHeight, height: labelHeight },
            selected && styles.labelSelected,
          ]}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.8}>
          {category.name}
        </AppText>
        {selected && showChevron ? (
          <View style={styles.chevron}>
            <ChevronIcon size={14} color={colors.white} />
          </View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

export function CategoryNav({ categories, selectedId, onSelect }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const layout = useResponsiveLayout();
  const { category: size } = layout;
  const isRail = layout.categoryRail;
  const showChevron = layout.mode !== 'compact';
  const thumb = Math.max(65, size.thumb);
  const image = Math.max(55, size.image);

  // Fit more chips on narrow screens; keep roomy cards on rail/desktop.
  const cardWidth = isRail
    ? Math.max(84, size.card)
    : Math.max(
      72,
      Math.min(
        size.card,
        Math.round((layout.width - 48) / Math.min(categories.length || 1, 4.2)),
      ),
    );

  const scrollRef = useRef<Scrollable | null>(null);
  const metricsRef = useRef<Record<string, ItemMetrics>>({});
  const viewportRef = useRef({ width: 0, height: 0 });
  const showMoreHint = !isRail && categories.length > 3;

  const scrollSelectedIntoView = (animated = true) => {
    const metrics = metricsRef.current[selectedId];
    if (!metrics || !scrollRef.current) {
      return;
    }

    if (isRail) {
      const viewH = viewportRef.current.height || layout.height;
      const targetY = Math.max(0, metrics.y - (viewH - metrics.height) / 2);
      scrollRef.current.scrollTo({ y: targetY, animated });
      return;
    }

    const viewW = viewportRef.current.width || layout.width;
    const targetX = Math.max(0, metrics.x - (viewW - metrics.width) / 2);
    scrollRef.current.scrollTo({ x: targetX, animated });
  };

  useEffect(() => {
    const timer = setTimeout(() => scrollSelectedIntoView(true), 40);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when selection/layout mode changes
  }, [selectedId, isRail, categories.length]);

  const chips = categories.map(category => (
    <CategoryChip
      key={category.id}
      category={category}
      selected={category.id === selectedId}
      cardWidth={cardWidth}
      thumb={thumb}
      image={image}
      fontSize={size.font}
      showChevron={showChevron}
      onSelect={() => onSelect(category.id)}
      onLayout={metrics => {
        metricsRef.current[category.id] = metrics;
        if (category.id === selectedId) {
          scrollSelectedIntoView(false);
        }
      }}
    />
  ));

  const bindScroll = (node: Scrollable | null) => {
    scrollRef.current = node;
  };

  if (isRail) {
    return (
      <ScrollView
        ref={bindScroll}
        style={[styles.rail, { width: size.rail }]}
        contentContainerStyle={styles.railContent}
        showsVerticalScrollIndicator={false}
        onLayout={event => {
          viewportRef.current.height = event.nativeEvent.layout.height;
        }}>
        {chips}
      </ScrollView>
    );
  }

  return (
    <View style={styles.horizontalShell}>
      <ScrollView
        ref={bindScroll}
        // horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroller}
        contentContainerStyle={styles.row}
        onLayout={event => {
          viewportRef.current.width = event.nativeEvent.layout.width;
        }}>
        {chips}
      </ScrollView>
      {showMoreHint ? (
        <View pointerEvents="none" style={styles.more}>
          <ChevronIcon size={12} color={colors.navy} />
        </View>
      ) : null}
    </View>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
  horizontalShell: {
    position: 'relative',
    marginVertical: 10,
  },
  scroller: {
    flexGrow: 0,
    flexShrink: 0,
  },
  rail: {
    flexGrow: 0,
    flexShrink: 0,
  },
  railContent: {
    paddingVertical: 8,
    paddingRight: 8,
    gap: 10,
  },
  row: {
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingBottom: 2,
    gap: 12,
  },
  wrap: {
    alignItems: 'center',
  },
  item: {
    width: '100%',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  itemSelected: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  pressed: {
    opacity: 0.92,
  },
  thumb: {
    backgroundColor: colors.mediaMuted,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbSelected: {
    backgroundColor: colors.surface,
  },
  letter: {
    fontFamily: fonts.extraBold,
    color: colors.navy,
  },
  label: {
    marginTop: 6,
    width: '100%',
    fontFamily: fonts.semiBold,
    color: colors.navy,
    textAlign: 'center',
  },
  labelSelected: {
    color: colors.white,
  },
  chevron: {
    position: 'absolute',
    right: 4,
    top: '38%',
  },
  more: {
    position: 'absolute',
    right: 10,
    top: '34%',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
});
}
