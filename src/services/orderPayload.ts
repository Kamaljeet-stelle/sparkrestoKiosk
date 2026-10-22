import type { AppliedCoupon, CartLine, CustomerDraft, PriceQuote } from '../types/kiosk';
import { lineTotalRand } from './cart';
import { getAuthToken, getDomainId } from './session';
import { formatPostedAmount } from '../utils/money';

export type OrderPayloadInput = {
  coupon: AppliedCoupon | null;
  quote: PriceQuote;
  customer: CustomerDraft;
  lines: CartLine[];
};

export function buildOrderBody(input: OrderPayloadInput): string {
  const authToken = getAuthToken();
  if (!authToken) {
    throw new Error('Please login again.');
  }

  const params = new URLSearchParams();
  params.set('domainId', getDomainId());
  params.set('auth_token', authToken);
  params.set('customer_name', input.customer.name.trim());
  params.set('customer_contact', input.customer.contact.trim());
  params.set('grandtotal', formatPostedAmount(input.quote.total));
  params.set('coupan_amount', formatPostedAmount(input.quote.discount));
  params.set('apply_coupon', input.coupon?.code ?? '');

  input.lines.forEach(line => {
    const unit = lineTotalRand(line.unitPrice, 1);
    const total = lineTotalRand(line.unitPrice, line.quantity);
    params.append('item_id[]', line.productId);
    params.append('item_quantity[]', String(line.quantity));
    params.append('item_price[]', formatPostedAmount(unit));
    params.append('item_total[]', formatPostedAmount(total));
  });

  return params.toString();
}
