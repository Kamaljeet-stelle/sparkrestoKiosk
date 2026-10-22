import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { quoteCart, changeQuantity, upsertLine } from '../services/cart';
import { parseCouponResponse } from '../services/coupon';
import { validateCustomer } from '../services/customer';
import {
  fetchMenu,
  fetchSavedAddresses,
  postCoupon,
  postOrder,
  searchMembers,
} from '../services/kioskApi';
import { buildOrderBody } from '../services/orderPayload';
import { parsePlaceOrderResponse } from '../services/orderResponse';
import { printOrderReceipt } from '../services/printOrder';
import {
  emptyCustomer,
  type AppliedCoupon,
  type CartLine,
  type CustomerDraft,
  type CustomerErrors,
  type MemberSuggestion,
  type Menu,
  type OrderResult,
  type Product,
} from '../types/kiosk';
import { formatRand } from '../utils/money';
import { showError } from '../utils/toast';

type MenuStatus = 'idle' | 'loading' | 'ready' | 'error';
type CouponStatus = 'idle' | 'applying' | 'applied' | 'error';

type KioskContextValue = {
  menu: Menu | null;
  menuStatus: MenuStatus;
  menuError: string | null;
  refreshing: boolean;
  loadMenu: () => Promise<void>;
  lines: CartLine[];
  addProduct: (product: Product) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeLine: (productId: string) => void;
  quote: ReturnType<typeof quoteCart>;
  couponCode: string;
  setCouponCode: (value: string) => void;
  coupon: AppliedCoupon | null;
  couponStatus: CouponStatus;
  couponError: string | null;
  applyCoupon: () => Promise<void>;
  clearCoupon: () => void;
  customer: CustomerDraft;
  updateCustomer: (patch: Partial<CustomerDraft>) => void;
  customerErrors: CustomerErrors;
  suggestions: MemberSuggestion[];
  addresses: string[];
  lookupContact: (term: string) => void;
  selectMember: (member: MemberSuggestion) => void;
  selectAddress: (address: string) => void;
  submitting: boolean;
  orderError: string | null;
  placeOrder: () => Promise<OrderResult | null>;
  clearSession: () => void;
  markActivity: () => void;
  lastActivity: number;
};

const KioskContext = createContext<KioskContextValue | null>(null);

export function KioskProvider({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState<Menu | null>(null);
  const [menuStatus, setMenuStatus] = useState<MenuStatus>('idle');
  const [menuError, setMenuError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [couponCode, setCouponCodeState] = useState('');
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [couponStatus, setCouponStatus] = useState<CouponStatus>('idle');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [customer, setCustomer] = useState<CustomerDraft>(emptyCustomer);
  const [customerErrors, setCustomerErrors] = useState<CustomerErrors>({});
  const [suggestions, setSuggestions] = useState<MemberSuggestion[]>([]);
  const [addresses, setAddresses] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [lastActivity, setLastActivity] = useState(() => Date.now());
  const menuRef = useRef<Menu | null>(null);
  const submitLock = useRef(false);
  const lookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lookupSerial = useRef(0);

  useEffect(() => {
    menuRef.current = menu;
  }, [menu]);

  useEffect(() => {
    return () => {
      if (lookupTimer.current) {
        clearTimeout(lookupTimer.current);
      }
    };
  }, []);

  const markActivity = useCallback(() => {
    setLastActivity(Date.now());
  }, []);

  const clearCoupon = useCallback(() => {
    setCoupon(null);
    setCouponCodeState('');
    setCouponStatus('idle');
    setCouponError(null);
  }, []);

  const clearSession = useCallback(() => {
    setLines([]);
    setCoupon(null);
    setCouponCodeState('');
    setCouponStatus('idle');
    setCouponError(null);
    setCustomer(emptyCustomer);
    setCustomerErrors({});
    setSuggestions([]);
    setAddresses([]);
    setOrderError(null);
    setLastActivity(Date.now());
  }, []);

  const loadMenu = useCallback(async () => {
    const hasMenu = !!menuRef.current;
    if (hasMenu) {
      setRefreshing(true);
    } else {
      setMenuStatus('loading');
    }
    setMenuError(null);
    try {
      const nextMenu = await fetchMenu();
      setMenu(nextMenu);
      setMenuStatus('ready');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to load the menu.';
      if (!menuRef.current) {
        setMenuStatus('error');
        setMenuError(message);
      } else {
        setMenuError(message);
        showError(message);
      }
    } finally {
      setRefreshing(false);
    }
  }, []);

  const addProduct = useCallback(
    (product: Product) => {
      setLines(current => upsertLine(current, product));
      markActivity();
    },
    [markActivity],
  );

  const setQuantity = useCallback(
    (productId: string, quantity: number) => {
      setLines(current => changeQuantity(current, productId, quantity));
      markActivity();
    },
    [markActivity],
  );

  const removeLine = useCallback(
    (productId: string) => {
      setLines(current => current.filter(line => line.productId !== productId));
      markActivity();
    },
    [markActivity],
  );

  const setCouponCode = useCallback((value: string) => {
    setCouponCodeState(value);
    setCouponError(null);
    setCouponStatus(current => (current === 'applied' ? current : 'idle'));
  }, []);

  const applyCoupon = useCallback(async () => {
    const code = couponCode.trim();
    if (!code) {
      setCouponStatus('error');
      setCouponError('Enter a coupon code.');
      return;
    }
    setCouponStatus('applying');
    setCouponError(null);
    try {
      const body = await postCoupon(code);
      const parsed = parseCouponResponse(body);
      if ('error' in parsed) {
        setCoupon(null);
        setCouponStatus('error');
        setCouponError(parsed.error);
        return;
      }
      setCoupon({ code, ...parsed });
      setCouponStatus('applied');
    } catch (error) {
      setCoupon(null);
      setCouponStatus('error');
      setCouponError(
        error instanceof Error ? error.message : 'Coupon could not be applied.',
      );
    }
  }, [couponCode]);

  const updateCustomer = useCallback(
    (patch: Partial<CustomerDraft>) => {
      setCustomer(current => ({ ...current, ...patch }));
      setCustomerErrors(current => {
        const next = { ...current };
        (Object.keys(patch) as Array<keyof CustomerDraft>).forEach(key => {
          delete next[key];
        });
        return next;
      });
      setOrderError(null);
      markActivity();
    },
    [markActivity],
  );

  const lookupContact = useCallback((term: string) => {
    if (lookupTimer.current) {
      clearTimeout(lookupTimer.current);
    }
    const query = term.trim();
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    lookupTimer.current = setTimeout(() => {
      const serial = lookupSerial.current + 1;
      lookupSerial.current = serial;
      searchMembers(query)
        .then(hits => {
          if (lookupSerial.current === serial) {
            setSuggestions(hits);
          }
        })
        .catch(() => {
          if (lookupSerial.current === serial) {
            setSuggestions([]);
          }
        });
    }, 300);
  }, []);

  const selectMember = useCallback((member: MemberSuggestion) => {
    const contact = member.contact.replace(/\D/g, '').slice(0, 15);
    setCustomer(current => ({
      ...current,
      contact: contact || current.contact,
      name: member.name || current.name,
    }));
    setSuggestions([]);
    setCustomerErrors(current => ({
      ...current,
      contact: undefined,
      name: undefined,
    }));
    fetchSavedAddresses(member.contact)
      .then(setAddresses)
      .catch(() => setAddresses([]));
  }, []);

  const selectAddress = useCallback((address: string) => {
    setCustomer(current => ({ ...current, address }));
    setCustomerErrors(current => ({ ...current, address: undefined }));
    setAddresses([]);
  }, []);

  const placeOrder = useCallback(async (): Promise<OrderResult | null> => {
    if (submitLock.current) {
      return null;
    }
    const errors = validateCustomer(customer);
    setCustomerErrors(errors);
    if (Object.keys(errors).length > 0) {
      return null;
    }
    if (lines.length === 0) {
      setOrderError('Add an item before placing the order.');
      return null;
    }

    submitLock.current = true;
    setSubmitting(true);
    setOrderError(null);
    const snapshot = {
      lines,
      coupon,
      customer,
      quote: quoteCart(lines, coupon),
    };
    const base = {
      totalLabel: formatRand(snapshot.quote.total),
      customerName: snapshot.customer.name.trim(),
    };
    try {
      const body = buildOrderBody({
        coupon: snapshot.coupon,
        quote: snapshot.quote,
        customer: snapshot.customer,
        lines: snapshot.lines,
      });
      const response = await postOrder(body);
      const result = parsePlaceOrderResponse(response);
      if (!result.ok) {
        return { success: false, message: result.message, ...base };
      }
      if (result.receiptHtml) {
        try {
          await printOrderReceipt(result.receiptHtml);
        } catch {
          // Printing is optional — order already succeeded.
        }
      }
      clearSession();
      return {
        success: true,
        message: result.message,
        orderNumber: result.orderNumber,
        ...base,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error ? error.message : 'Order could not be sent.',
        ...base,
      };
    } finally {
      submitLock.current = false;
      setSubmitting(false);
    }
  }, [clearSession, coupon, customer, lines]);

  const quote = useMemo(() => quoteCart(lines, coupon), [lines, coupon]);

  const value = useMemo<KioskContextValue>(
    () => ({
      menu,
      menuStatus,
      menuError,
      refreshing,
      loadMenu,
      lines,
      addProduct,
      setQuantity,
      removeLine,
      quote,
      couponCode,
      setCouponCode,
      coupon,
      couponStatus,
      couponError,
      applyCoupon,
      clearCoupon,
      customer,
      updateCustomer,
      customerErrors,
      suggestions,
      addresses,
      lookupContact,
      selectMember,
      selectAddress,
      submitting,
      orderError,
      placeOrder,
      clearSession,
      markActivity,
      lastActivity,
    }),
    [
      menu,
      menuStatus,
      menuError,
      refreshing,
      loadMenu,
      lines,
      addProduct,
      setQuantity,
      removeLine,
      quote,
      couponCode,
      setCouponCode,
      coupon,
      couponStatus,
      couponError,
      applyCoupon,
      clearCoupon,
      customer,
      updateCustomer,
      customerErrors,
      suggestions,
      addresses,
      lookupContact,
      selectMember,
      selectAddress,
      submitting,
      orderError,
      placeOrder,
      clearSession,
      markActivity,
      lastActivity,
    ],
  );

  return <KioskContext.Provider value={value}>{children}</KioskContext.Provider>;
}

export function useKiosk(): KioskContextValue {
  const value = useContext(KioskContext);
  if (!value) {
    throw new Error('useKiosk must be used within KioskProvider');
  }
  return value;
}
