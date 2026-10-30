import { useWindowDimensions } from 'react-native';

export type LayoutMode = 'compact' | 'tablet' | 'desktop';

export function useResponsiveLayout() {
  const { width, height } = useWindowDimensions();

  const mode: LayoutMode =
    width >= 1100 ? 'desktop' : width >= 700 ? 'tablet' : 'compact';

  const persistentCart = width >= 960;
  const categoryRail = true;
  const menuWidth = Math.max(0, width - (persistentCart ? 332 : 0));
  const rail = Math.round(Math.min(200, Math.max(108, menuWidth * 0.26)));
  const content = Math.max(0, menuWidth - rail);
  const columns = content >= 1080 ? 4 : content >= 720 ? 3 : 2;
  const columnWidth = content / columns;

  const category = {
    card: rail - 20,
    thumb: Math.round(rail * 0.46),
    image: Math.round(rail * 0.38),
    rail,
    font: mode === 'compact' ? 10 : rail > 150 ? 13 : 12,
  };

  const productImageHeight =
    mode === 'compact'
      ? Math.round(Math.min(120, Math.max(88, columnWidth * 0.58)))
      : Math.round(Math.min(210, Math.max(132, columnWidth * 0.82)));

  const contentPadding = mode === 'compact' ? 16 : mode === 'tablet' ? 20 : 24;
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
  };
}
