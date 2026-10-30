import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { PrimaryButton } from '../atoms/PrimaryButton';
import { type Palette } from '../../theme/colors';
import { useTheme, useThemedStyles } from '../../theme/ThemeProvider';
import { AppText } from '../atoms/AppText';

export function LoadingState({ label = 'Loading the menu…' }: { label?: string }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={colors.orange} />
      <AppText style={styles.label}>{label}</AppText>
      <View style={styles.grid}>
        {[0, 1, 2, 3].map(item => (
          <View key={item} style={styles.skeleton} />
        ))}
      </View>
    </View>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.center}>
      <AppText style={styles.title}>Menu unavailable</AppText>
      <AppText style={styles.body}>{message}</AppText>
      <PrimaryButton title="Try again" variant="accent" onPress={onRetry} />
    </View>
  );
}

export function EmptyState({ message }: { message: string }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.empty}>
      <AppText style={styles.title}>Nothing to show</AppText>
      <AppText style={styles.body}>{message}</AppText>
    </View>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  empty: {
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.navy,
    textAlign: 'center',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 8,
  },
  label: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
  grid: {
    width: '100%',
    maxWidth: 640,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  skeleton: {
    flexGrow: 1,
    flexBasis: '40%',
    height: 180,
    borderRadius: 18,
    backgroundColor: colors.skeleton,
  },
});
}
