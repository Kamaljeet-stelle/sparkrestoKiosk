import { MAX_ITEM_QUANTITY } from '../config/kiosk';
import type {
  AppliedCoupon,
  CartLine,
  PriceQuote,
  Product,
} from '../types/kiosk';
import { unitRand } from '../utils/money';

export function lineTotalRand(price: string, quantity: number): number {
  return unitRand(price) * quantity;
}

/**
 * Mirrors the live self-kiosk script:
 * line totals use parseInt(price) * quantity, a percentage coupon is
 * (subtotal * offer) / 100, any other offer is a fixed amount, and the
 * total never drops below zero. The page does not calculate tax.
 */
export function quoteCart(
  lines: CartLine[],
  coupon: AppliedCoupon | null,
): PriceQuote {
  const subtotal = lines.reduce(
    (sum, line) => sum + lineTotalRand(line.unitPrice, line.quantity),
    0,
  );

  let discount = 0;
  if (coupon) {
    discount =
      coupon.offerType === 'Percentage'
        ? (subtotal * coupon.offer) / 100
        : coupon.offer;
  }
  if (!Number.isFinite(discount) || discount < 0) {
    discount = 0;
  }

  const total = Math.max(0, subtotal - discount);
  return { subtotal, discount, total };
}

export function upsertLine(lines: CartLine[], product: Product): CartLine[] {
  const existing = lines.find(line => line.productId === product.id);
  if (!existing) {
    return [
      ...lines,
      {
        productId: product.id,
        name: product.name,
        imageUrl: product.imageUrl,
        unitPrice: product.price,
        quantity: 1,
      },
    ];
  }
  return lines.map(line =>
    line.productId === product.id
      ? {
          ...line,
          quantity: Math.min(MAX_ITEM_QUANTITY, line.quantity + 1),
        }
      : line,
  );
}

export function changeQuantity(
  lines: CartLine[],
  productId: string,
  quantity: number,
): CartLine[] {
  if (quantity < 1) {
    return lines.filter(line => line.productId !== productId);
  }
  const next = Math.min(MAX_ITEM_QUANTITY, Math.floor(quantity));
  return lines.map(line =>
    line.productId === productId ? { ...line, quantity: next } : line,
  );
}
