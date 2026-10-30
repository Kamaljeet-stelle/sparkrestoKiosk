import { type StyleProp, type TextStyle } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { useTheme } from '../../theme/ThemeProvider';

type IconProps = {
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
};

export function SearchIcon({ size = 18, color, style }: IconProps) {
  const { colors } = useTheme();
  return (
    <Ionicons
      name="search-outline"
      size={size}
      color={color ?? colors.placeholder}
      style={style}
    />
  );
}

export function ResetIcon({ size = 22, color, style }: IconProps) {
  const { colors } = useTheme();
  return (
    <Ionicons
      name="refresh-outline"
      size={size}
      color={color ?? colors.orange}
      style={style}
    />
  );
}

export function BagIcon({ size = 20, color, style }: IconProps) {
  const { colors } = useTheme();
  return (
    <Ionicons
      name="bag-handle-outline"
      size={size}
      color={color ?? colors.white}
      style={style}
    />
  );
}

export function PlusIcon({ size = 14, color, style }: IconProps) {
  const { colors } = useTheme();
  return <Ionicons name="add" size={size} color={color ?? colors.navy} style={style} />;
}

export function ChevronIcon({ size = 14, color, style }: IconProps) {
  const { colors } = useTheme();
  return (
    <Ionicons
      name="chevron-forward"
      size={size}
      color={color ?? colors.white}
      style={style}
    />
  );
}

export function PlateFallbackIcon({ size = 40, color, style }: IconProps) {
  const { colors } = useTheme();
  return (
    <Ionicons
      name="restaurant-outline"
      size={size}
      color={color ?? colors.placeholder}
      style={style}
    />
  );
}
