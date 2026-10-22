import { useWindowDimensions } from 'react-native';

export type LayoutMode = 'compact' | 'tablet' | 'desktop';

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();

  const mode: LayoutMode =
    width >= 1100 ? 'desktop' : width >= 700 ? 'tablet' : 'compact';

  const persistentCart = width >= 960;
  const categoryRail = width >= 960;
  const reserved = (categoryRail ? 136 : 0) + (persistentCart ? 332 : 0);
  const available = Math.max(0, width - reserved);
  const columns =
    available >= 980 ? 4 : available >= 640 ? 3 : available >= 360 ? 2 : 1;

  const category =
    mode === 'desktop'
      ? { card: 118, thumb: 64, image: 56, rail: 140, font: 13 }
      : mode === 'tablet'
        ? { card: 100, thumb: 52, image: 46, rail: 124, font: 12 }
        : { card: 78, thumb: 40, image: 34, rail: 96, font: 11 };

  const productImageHeight =
    mode === 'desktop' ? 156 : mode === 'tablet' ? 124 : Math.max(72, Math.round(width * 0.2));

  const contentPadding = mode === 'compact' ? 16 : mode === 'tablet' ? 20 : 24;
  const contentMaxWidth =
    mode === 'desktop' ? 1120 : mode === 'tablet' ? 920 : undefined;
  const isWide = mode !== 'compact';

  return {
    width,
    height,
    mode,
    isWide,
    persistentCart,
    categoryRail,
    columns,
    category,
    productImageHeight,
    contentPadding,
    contentMaxWidth,
    isLandscape: width > height,
  };
}
