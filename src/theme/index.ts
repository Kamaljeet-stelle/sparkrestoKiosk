import { colors } from './colors';
import { fonts } from './fonts';
import { spacing } from './spacing';
import { fontWeight, typography } from './typography';

export type Theme = {
  colors: typeof colors;
  spacing: typeof spacing;
  typography: typeof typography;
  fonts: typeof fonts;
};

const theme: Theme = {
  colors,
  spacing,
  typography,
  fonts,
};

export function useAppTheme(): Theme {
  return theme;
}

export { colors, fonts, fontWeight, spacing, typography };
