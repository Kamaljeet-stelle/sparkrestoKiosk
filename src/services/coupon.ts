import type { AppliedCoupon, CouponOfferType } from '../types/kiosk';

export function parseCouponResponse(
  body: string,
): Omit<AppliedCoupon, 'code'> | { error: string } {
  try {
    const data = JSON.parse(body) as {
      status?: string;
      message?: string;
      data?: {
        coupon_offer?: number | string;
        coupon_offer_type?: string;
        raw?: string;
      };
    };

    if (data.status !== 'success' || !data.data) {
      return { error: data.message || 'Coupon could not be applied.' };
    }

    const offer = Number(data.data.coupon_offer);
    if (!Number.isFinite(offer) || offer < 0) {
      return { error: data.message || 'Coupon could not be applied.' };
    }

    const offerType: CouponOfferType =
      data.data.coupon_offer_type === 'Percentage' ? 'Percentage' : 'Fixed';

    return {
      raw: data.data.raw || `${offer}~${offerType}`,
      offer,
      offerType,
    };
  } catch {
    return { error: 'Coupon could not be applied.' };
  }
}
