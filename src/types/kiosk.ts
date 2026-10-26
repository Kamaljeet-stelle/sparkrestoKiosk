export type Product = {
  id: string;
  name: string;
  price: string;
  imageUrl: string;
  categoryId: string;
};

export type Category = {
  id: string;
  name: string;
  imageUrl: string;
  products: Product[];
};

export type Menu = {
  categories: Category[];
};

export type CartLine = {
  productId: string;
  name: string;
  imageUrl: string;
  unitPrice: string;
  quantity: number;
};

export type CouponOfferType = 'Percentage' | 'Fixed';

export type AppliedCoupon = {
  code: string;
  raw: string;
  offer: number;
  offerType: CouponOfferType;
};

export type PriceQuote = {
  subtotal: number;
  discount: number;
  total: number;
};

export type CustomerDraft = {
  contact: string;
  name: string;
  address: string;
};

export type CustomerErrors = Partial<Record<keyof CustomerDraft, string>>;

export type MemberSuggestion = {
  contact: string;
  name: string;
  label: string;
};

export type OrderResult = {
  success: boolean;
  message: string;
  orderNumber?: string;
  totalLabel: string;
  customerName: string;
};

export const emptyCustomer: CustomerDraft = {
  contact: '',
  name: '',
  address: '',
};
