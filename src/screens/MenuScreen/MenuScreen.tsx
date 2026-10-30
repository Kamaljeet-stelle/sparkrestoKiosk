import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@react-native-vector-icons/ionicons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, AppTextInput } from '../../components/atoms/AppText';
import {
  BagIcon,
  ChevronIcon,
  ResetIcon,
  SearchIcon,
} from '../../components/atoms/KioskIcons';
import { LogoutButton } from '../../components/molecules/LogoutButton';
import { CartPanel } from '../../components/organisms/CartPanel';
import { CategoryNav } from '../../components/organisms/CategoryNav';
import { ProductCard } from '../../components/organisms/ProductCard';
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../components/organisms/StateViews';
import { KIOSK_TITLE } from '../../config/kiosk';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { useKiosk } from '../../store/KioskProvider';
import { type Palette } from '../../theme/colors';
import { useTheme, useThemedStyles } from '../../theme/ThemeProvider';
import { fonts } from '../../theme/fonts';
import Images from '../../theme/Images';
import type { Product } from '../../types/kiosk';
import { formatRand } from '../../utils/money';

type Row = Product | { id: string; pad: true };

type ProductSort = 'default' | 'az' | 'price-asc' | 'price-desc';

const SORT_OPTIONS: { id: ProductSort; label: string }[] = [
  { id: 'default', label: 'Default' },
  { id: 'az', label: 'A to Z' },
  { id: 'price-asc', label: 'Price: Low to High' },
  { id: 'price-desc', label: 'Price: High to Low' },
];

function sortProducts(items: Product[], sort: ProductSort): Product[] {
  if (sort === 'default') {
    return items;
  }
  const next = [...items];
  if (sort === 'az') {
    next.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    return next;
  }
  const priceOf = (price: string) => {
    const value = Number(price);
    return Number.isFinite(value) ? value : 0;
  };
  next.sort((a, b) => {
    const delta = priceOf(a.price) - priceOf(b.price);
    if (delta !== 0) {
      return sort === 'price-asc' ? delta : -delta;
    }
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });
  return next;
}

type Props = {
  onContinue: () => void;
  onOpenCart: () => void;
  onStartOver: () => void;
  onLogout: () => void;
};

export function MenuScreen({ onContinue, onOpenCart, onStartOver, onLogout }: Props) {
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<Row>>(null);
  const layout = useResponsiveLayout();
  const {
    menu,
    menuStatus,
    menuError,
    refreshing,
    loadMenu,
    lines,
    quote,
    addProduct,
    markActivity,
  } = useKiosk();
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [sort, setSort] = useState<ProductSort>('default');
  const [filterOpen, setFilterOpen] = useState(false);
  const compact = layout.mode === 'compact';

  const categories = useMemo(() => menu?.categories ?? [], [menu]);
  const selected =
    categories.find(category => category.id === categoryId) ?? categories[0];
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  useEffect(() => {
    if (!categoryId && categories[0]) {
      setCategoryId(categories[0].id);
    }
  }, [categoryId, categories]);

  const products = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matches = sortProducts(
      needle
        ? categories.flatMap(category =>
          category.products.filter(product =>
            product.name.toLowerCase().includes(needle),
          ),
        )
        : (selected?.products ?? []),
      sort,
    );
    const remainder = matches.length % layout.columns;
    const pads =
      matches.length === 0 || remainder === 0
        ? []
        : Array.from({ length: layout.columns - remainder }, (_, index) => ({
          id: `pad-${index}`,
          pad: true as const,
        }));
    return [...matches, ...pads];
  }, [categories, layout.columns, query, selected, sort]);

  const titleParts = KIOSK_TITLE.trim().split(/\s+/);
  const titleLead = titleParts[0] ?? KIOSK_TITLE;
  const titleAccent = titleParts.slice(1).join(' ');
  const subtitle = query.trim() ? 'Search' : selected?.name ?? 'Menu';

  const header = (
    <View style={styles.top}>
      <View style={styles.titleRow}>
        <View style={styles.brand}>
          <Image source={Images.appLogo} style={styles.logo} />
          <View style={styles.titleCopy}>
            <AppText style={[styles.title, compact && styles.titleCompact]}>
              {titleLead}
              {titleAccent ? (
                <AppText style={[styles.titleAccent, compact && styles.titleCompact]}>
                  {' '}
                  {titleAccent}
                </AppText>
              ) : null}
            </AppText>
            <View style={styles.subtitleRow}>
              <View style={styles.subtitleRule} />
              <AppText style={[styles.subtitle, compact && styles.subtitleCompact]}>{subtitle}</AppText>
              <View style={styles.subtitleRule} />
            </View>
          </View>
        </View>
        <View style={styles.headerActions}>
          <LogoutButton onLogout={onLogout} />
          <Pressable
            accessibilityRole="button"
            onPress={onStartOver}
            hitSlop={8}
            style={styles.startOver}>
            <ResetIcon size={15} color={colors.orange} />
            <AppText style={[styles.startOverText, compact && styles.startOverTextCompact]}>
              Start over
            </AppText>
          </Pressable>
        </View>
      </View>
      <View style={styles.searchRow}>
        <View
          style={[
            styles.searchWrap,
            compact && styles.searchWrapCompact,
            searchFocused && styles.searchFocused,
          ]}>
          <SearchIcon size={20} color={colors.placeholder} style={styles.searchIcon} />
          <AppTextInput
            value={query}
            onChangeText={value => {
              markActivity();
              setQuery(value);
            }}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search menu..."
            placeholderTextColor={colors.placeholder}
            style={[styles.search, compact && styles.searchCompact]}
            autoCorrect={false}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Filter menu"
          onPress={() => {
            markActivity();
            setFilterOpen(true);
          }}
          style={[
            styles.filterButton,
            compact && styles.filterButtonCompact,
            sort !== 'default' && styles.filterButtonActive,
          ]}>
          <Ionicons
            name="funnel-outline"
            size={18}
            color={sort !== 'default' ? colors.white : colors.orange}
          />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isDark ? 'Use light theme' : 'Use dark theme'}
          onPress={toggleTheme}
          style={[styles.themeButton, compact && styles.themeButtonCompact]}>
          <Ionicons
            name={isDark ? 'sunny-outline' : 'moon-outline'}
            size={16}
            color={colors.orange}
          />
          <AppText style={[styles.themeText, compact && styles.themeTextCompact]}>
            {isDark ? 'Light' : 'Dark'}
          </AppText>
        </Pressable>
      </View>

    </View>
  );

  let body = <LoadingState />;
  if (menuStatus === 'error' && !menu) {
    body = (
      <ErrorState
        message={menuError ?? 'Unable to load the menu.'}
        onRetry={() => {
          loadMenu().catch(() => undefined);
        }}
      />
    );
  } else if (menu) {
    const selectCategory = (id: string) => {
      setCategoryId(id);
      setQuery('');
    };
    body = (
      <View
        style={[styles.workspace, layout.categoryRail && styles.workspaceRail]}>
        <CategoryNav
          categories={categories}
          selectedId={selected?.id ?? ''}
          onSelect={selectCategory}
        />
        <FlatList
          key={`cols-${layout.columns}`}
          style={styles.list}
          data={products}
          keyExtractor={item => item.id}
          numColumns={layout.columns}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                loadMenu().catch(() => undefined);
              }}
              tintColor={colors.orange}
            />
          }
          ref={listRef}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={
            layout.columns > 1 && products.length > 0 ? styles.row : undefined
          }
          ListEmptyComponent={
            <EmptyState
              message={
                query.trim()
                  ? 'No items match your search.'
                  : 'This category has no items right now.'
              }
            />
          }
          renderItem={({ item }: { item: Row }) =>
            'pad' in item ? (
              <View style={styles.cell} />
            ) : (
              <View style={styles.cell}>
                <ProductCard product={item} onAdd={addProduct} />
              </View>
            )
          }
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      {header}
      <Modal
        visible={filterOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterOpen(false)}>
        <Pressable style={styles.filterBackdrop} onPress={() => setFilterOpen(false)}>
          <Pressable style={styles.filterCard} onPress={() => undefined}>
            <AppText style={styles.filterTitle}>Sort</AppText>
            {SORT_OPTIONS.map(option => {
              const active = sort === option.id;
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    markActivity();
                    setSort(option.id);
                    setFilterOpen(false);
                  }}
                  style={[styles.filterOption, active && styles.filterOptionActive]}>
                  <AppText
                    style={[styles.filterOptionText, active && styles.filterOptionTextActive]}>
                    {option.label}
                  </AppText>
                  {active ? (
                    <Ionicons name="checkmark" size={18} color={colors.orange} />
                  ) : null}
                </Pressable>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
      {menuError && menu ? <AppText style={styles.banner}>{menuError}</AppText> : null}
      <View style={styles.main}>
        {body}
        {layout.persistentCart && menu ? (
          <View style={styles.cartDock}>
            <CartPanel onContinue={onContinue} />
          </View>
        ) : null}
      </View>
      {!layout.persistentCart && menu ? (
        <View style={[styles.cartBarWrap, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <View style={styles.cartBar}>
            <Pressable
              accessibilityRole="button"
              onPress={onOpenCart}
              style={styles.cartInfo}>
              <View style={styles.bagWrap}>
                <BagIcon size={20} color={colors.orange} />
                <View style={styles.badge}>
                  <AppText style={styles.badgeText}>
                    {itemCount > 99 ? '99+' : String(itemCount)}
                  </AppText>
                </View>
              </View>
              <View style={styles.cartCopy}>
                <AppText style={[styles.cartBarTitle, compact && styles.cartBarTitleCompact]}>
                  {itemCount === 0 ? 'Your cart is empty' : `View order • ${itemCount}`}
                </AppText>
                <AppText style={[styles.cartBarTotal, compact && styles.cartBarTotalCompact]}>
                  {formatRand(quote.total)}
                </AppText>
              </View>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                if (itemCount === 0) {
                  setQuery('');
                  listRef.current?.scrollToOffset({ offset: 0, animated: true });
                  return;
                }
                onContinue();
              }}
              style={styles.cartBarAction}>
              <AppText style={[styles.cartBarActionText, compact && styles.cartBarActionTextCompact]}>
                {itemCount === 0 ? 'Browse Menu' : 'Continue'}
              </AppText>
              <ChevronIcon size={14} color={colors.white} />
            </Pressable>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.canvas,
    },
    top: {
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 10,
      gap: 12,
    },
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
    },
    brand: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    logo: {
      width: 54,
      height: 54,
      borderRadius: 16,
    },
    titleCompact: {
      fontSize: 22,
      lineHeight: 26,
    },
    titleCopy: {
      flex: 1,
    },
    title: {
      fontSize: 34,
      fontFamily: fonts.extraBold,
      color: colors.navy,
    },
    titleAccent: {
      fontSize: 34,
      fontFamily: fonts.extraBold,
      color: colors.orange,
    },
    subtitleRow: {
      marginTop: 2,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    subtitleRule: {
      width: 18,
      height: 1.5,
      borderRadius: 1,
      backgroundColor: colors.orange,
    },
    subtitle: {
      color: colors.navy,
      fontFamily: fonts.medium,
      fontSize: 14,
    },
    subtitleCompact: {
      fontSize: 12,
    },
    headerActions: {
      alignItems: 'flex-end',
      gap: 10,
    },
    startOver: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      paddingTop: 2,
    },
    startOverText: {
      color: colors.orange,
      fontFamily: fonts.semiBold,
      fontSize: 15,
    },
    startOverTextCompact: {
      fontSize: 13,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    searchWrap: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 58,
      borderRadius: 20,
      backgroundColor: colors.elevated,
      borderWidth: 1,
      borderColor: colors.line,
      paddingHorizontal: 14,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 1,
    },
    searchFocused: {
      borderColor: colors.orange,
    },
    searchIcon: {
      marginRight: 10,
    },
    searchWrapCompact: {
      minHeight: 46,
      borderRadius: 16,
    },
    search: {
      flex: 1,
      color: colors.navy,
      fontFamily: fonts.regular,
      fontSize: 16,
      paddingVertical: 12,
    },
    searchCompact: {
      fontSize: 14,
      paddingVertical: 8,
    },
    filterButton: {
      width: 58,
      minHeight: 58,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.orangeSoft,
    },
    filterButtonCompact: {
      width: 46,
      minHeight: 46,
      borderRadius: 16,
    },
    filterButtonActive: {
      backgroundColor: colors.orange,
    },
    themeButton: {
      minHeight: 58,
      borderRadius: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingHorizontal: 8,
      backgroundColor: colors.orangeSoft,
    },
    themeButtonCompact: {
      minHeight: 46,
      borderRadius: 16,
      paddingHorizontal: 10,
    },
    themeText: {
      color: colors.orange,
      fontFamily: fonts.bold,
      fontSize: 12,
    },
    themeTextCompact: {
      fontSize: 12,
    },
    filterBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(17, 24, 39, 0.35)',
      justifyContent: 'center',
      paddingHorizontal: 28,
    },
    filterCard: {
      borderRadius: 20,
      backgroundColor: colors.surface,
      padding: 16,
      gap: 8,
    },
    filterTitle: {
      color: colors.navy,
      fontFamily: fonts.extraBold,
      fontSize: 18,
      marginBottom: 4,
    },
    filterOption: {
      minHeight: 48,
      borderRadius: 14,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.elevated,
    },
    filterOptionActive: {
      backgroundColor: colors.orangeSoft,
    },
    filterOptionText: {
      color: colors.navy,
      fontFamily: fonts.semiBold,
      fontSize: 16,
    },
    filterOptionTextActive: {
      color: colors.orange,
      fontFamily: fonts.bold,
    },
    banner: {
      marginHorizontal: 16,
      marginBottom: 8,
      color: colors.error,
      fontFamily: fonts.semiBold,
    },
    main: {
      flex: 1,
      flexDirection: 'row',
    },
    workspace: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
    },
    workspaceRail: {
      flexDirection: 'row',
      paddingLeft: 12,
    },
    list: {
      flex: 1,
    },
    grid: {
      paddingHorizontal: 16,
      paddingTop: 20,
      paddingBottom: 24,
      flexGrow: 1,
    },
    row: {
      gap: 12,
    },
    cell: {
      flex: 1,
      marginBottom: 12,
    },
    cartDock: {
      width: 320,
      paddingRight: 12,
      paddingBottom: 12,
    },
    cartBarWrap: {
      paddingHorizontal: 12,
      paddingTop: 8,
    },
    cartBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 22,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.line,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    cartInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    bagWrap: {
      width: 46,
      height: 46,
      borderRadius: 16,
      backgroundColor: colors.orangeSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badge: {
      position: 'absolute',
      top: -5,
      right: -5,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: colors.orange,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    badgeText: {
      color: colors.white,
      fontSize: 10,
      fontFamily: fonts.extraBold,
    },
    cartCopy: {
      flex: 1,
    },
    cartBarTitle: {
      color: colors.textMuted,
      fontFamily: fonts.medium,
      fontSize: 12,
    },
    cartBarTitleCompact: {
      fontSize: 11,
    },
    cartBarTotal: {
      color: colors.navy,
      fontSize: 20,
      fontFamily: fonts.extraBold,
      marginTop: 1,
    },
    cartBarTotalCompact: {
      fontSize: 16,
    },
    cartBarAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.orange,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    cartBarActionText: {
      color: colors.white,
      fontFamily: fonts.extraBold,
      fontSize: 15,
    },
    cartBarActionTextCompact: {
      fontSize: 13,
    },
  });
}
