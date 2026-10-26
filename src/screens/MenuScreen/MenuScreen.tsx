import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
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
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/fonts';
import type { Product } from '../../types/kiosk';
import { formatRand } from '../../utils/money';

type Row = Product | { id: string; pad: true };

type Props = {
  onContinue: () => void;
  onStartOver: () => void;
  onLogout: () => void;
};

export function MenuScreen({ onContinue, onStartOver, onLogout }: Props) {
  const insets = useSafeAreaInsets();
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
  const [cartOpen, setCartOpen] = useState(false);

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
    const matches = needle
      ? categories.flatMap(category =>
        category.products.filter(product =>
          product.name.toLowerCase().includes(needle),
        ),
      )
      : (selected?.products ?? []);
    const remainder = matches.length % layout.columns;
    const pads =
      matches.length === 0 || remainder === 0
        ? []
        : Array.from({ length: layout.columns - remainder }, (_, index) => ({
          id: `pad-${index}`,
          pad: true as const,
        }));
    return [...matches, ...pads];
  }, [categories, layout.columns, query, selected]);

  const header = (
    <View style={styles.top}>
      <View style={styles.titleRow}>
        <View style={styles.titleCopy}>
          <AppText style={styles.title}>{KIOSK_TITLE}</AppText>
          <AppText style={styles.subtitle}>
            {query.trim() ? 'Search results' : selected?.name ?? 'Menu'}
          </AppText>
        </View>
        <View style={styles.headerActions}>
          <LogoutButton onLogout={onLogout} />
          <Pressable
            accessibilityRole="button"
            onPress={onStartOver}
            hitSlop={8}
            style={styles.startOver}>
            <ResetIcon size={15} color={colors.orange} />
            <AppText style={styles.startOverText}>Start over</AppText>
          </Pressable>
        </View>
      </View>
      <View style={styles.searchWrap}>
        <SearchIcon size={18} color={colors.placeholder} style={styles.searchIcon} />
        <AppTextInput
          value={query}
          onChangeText={value => {
            markActivity();
            setQuery(value);
          }}
          placeholder="Search Menu"
          placeholderTextColor={colors.placeholder}
          style={styles.search}
          autoCorrect={false}
        />
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
          contentContainerStyle={[
            styles.grid,
            !layout.persistentCart && styles.gridWithCart,
          ]}
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
        <View
          style={[
            styles.cartBar,
            { paddingBottom: Math.max(insets.bottom - 24) },
          ]}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setCartOpen(true)}
            style={styles.cartInfo}>
            <View style={styles.bagWrap}>
              <BagIcon size={20} color={colors.white} />
              {itemCount > 0 ? (
                <View style={styles.badge}>
                  <AppText style={styles.badgeText}>
                    {itemCount > 99 ? '99+' : String(itemCount)}
                  </AppText>
                </View>
              ) : null}
            </View>
            <View style={styles.cartCopy}>
              <AppText style={styles.cartBarTitle}>
                {itemCount === 0
                  ? 'Your cart is empty'
                  : `View order • ${itemCount}`}
              </AppText>
              <AppText style={styles.cartBarTotal}>{formatRand(quote.total)}</AppText>
            </View>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              if (itemCount === 0) {
                setCartOpen(true);
                return;
              }
              onContinue();
            }}
            style={styles.cartBarAction}>
            <AppText style={styles.cartBarActionText}>
              {itemCount === 0 ? 'Browse' : 'Continue'}
            </AppText>
            {itemCount > 0 ? (
              <ChevronIcon size={14} color={colors.white} />
            ) : null}
          </Pressable>
        </View>
      ) : null}
      {cartOpen && !layout.persistentCart ? (
        <View style={styles.sheetWrap}>
          <Pressable
            style={styles.backdrop}
            onPress={() => setCartOpen(false)}
          />
          <View style={[styles.sheet, { paddingBottom: insets.bottom }]}>
            <CartPanel
              framed={false}
              onContinue={() => {
                setCartOpen(false);
                onContinue();
              }}
            />
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F5F6FA',
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
  titleCopy: {
    flex: 1,
  },
  title: {
    fontSize: 35,
    fontFamily: fonts.semiBold,
    color: colors.navy,
  },
  subtitle: {
    marginTop: 3,
    color: colors.navy,
    fontFamily: fonts.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    fontSize: 15,
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
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#E7E9F0',
    paddingHorizontal: 14,
    shadowColor: '#0A183F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  search: {
    flex: 1,
    color: colors.navy,
    fontFamily: fonts.regular,
    fontSize: 16,
    paddingVertical: 12,
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
  gridWithCart: {
    paddingBottom: 16,
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
  cartBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 14,
    paddingTop: 12,
    borderRadius: 15,
    backgroundColor: colors.navy,
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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
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
    color: colors.white,
    fontFamily: fonts.semiBold,
    fontSize: 13,
  },
  cartBarTotal: {
    color: colors.white,
    fontSize: 20,
    fontFamily: fonts.extraBold,
    marginTop: 2,
  },
  cartBarAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.orange,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  cartBarActionText: {
    color: colors.white,
    fontFamily: fonts.extraBold,
    fontSize: 15,
  },
  sheetWrap: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
  },
  sheet: {
    height: '78%',
    backgroundColor: colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: 'hidden',
  },
});
