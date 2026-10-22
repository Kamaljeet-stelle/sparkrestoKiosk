import { type StyleProp, type TextStyle } from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { colors } from '../../theme/colors';

type IconProps = {
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
};

export function SearchIcon({
  size = 18,
  color = colors.placeholder,
  style,
}: IconProps) {
  return <Ionicons name="search-outline" size={size} color={color} style={style} />;
}

export function ResetIcon({
  size = 22,
  color = colors.orange,
  style,
}: IconProps) {
  return <Ionicons name="refresh-outline" size={size} color={color} style={style} />;
}

export function BagIcon({
  size = 20,
  color = colors.white,
  style,
}: IconProps) {
  return <Ionicons name="bag-handle-outline" size={size} color={color} style={style} />;
}

export function PlusIcon({
  size = 14,
  color = colors.navy,
  style,
}: IconProps) {
  return <Ionicons name="add" size={size} color={color} style={style} />;
}

export function ChevronIcon({
  size = 14,
  color = colors.white,
  style,
}: IconProps) {
  return <Ionicons name="chevron-forward" size={size} color={color} style={style} />;
}

export function PlateFallbackIcon({
  size = 40,
  color = '#B8BDC9',
  style,
}: IconProps) {
  return <Ionicons name="restaurant-outline" size={size} color={color} style={style} />;
}
