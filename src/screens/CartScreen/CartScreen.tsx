import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText } from '../../components/atoms/AppText';
import { CartPanel } from '../../components/organisms/CartPanel';
import { type Palette } from '../../theme/colors';
import { useThemedStyles } from '../../theme/ThemeProvider';
import { fonts } from '../../theme/fonts';

type Props = {
  onBack: () => void;
  onContinue: () => void;
  onStartOver: () => void;
};

export function CartScreen({ onBack, onContinue, onStartOver }: Props) {
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable accessibilityRole="button" onPress={onBack} hitSlop={8}>
          <AppText style={styles.back}>Back</AppText>
        </Pressable>
        <AppText style={styles.headerTitle}>Your Order</AppText>
        <Pressable accessibilityRole="button" onPress={onStartOver} hitSlop={8}>
          <AppText style={styles.cancel}>Start over</AppText>
        </Pressable>
      </View>
      <View style={[styles.body, { paddingBottom: insets.bottom }]}>
        <CartPanel framed={false} showTitle={false} onContinue={onContinue} />
      </View>
    </View>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.canvas,
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
      fontFamily: fonts.extraBold,
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
      fontFamily: fonts.extraBold,
      color: colors.navy,
    },
    body: {
      flex: 1,
    },
  });
}
