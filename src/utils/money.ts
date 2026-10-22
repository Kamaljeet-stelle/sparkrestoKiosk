/** Whole rands, matching the live kiosk script which totals with parseInt. */
export function unitRand(price: string): number {
  const whole = parseInt(price, 10);
  return Number.isFinite(whole) ? whole : 0;
}

function groupedAmount(amount: number): string {
  const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
  const [whole, fraction] = rounded.toFixed(2).split('.');
  const digits = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${digits}.${fraction}`;
}

export function formatRand(amount: number): string {
  return `R ${groupedAmount(amount)}`;
}

export function formatMenuPrice(price: string): string {
  const value = Number(price);
  if (!Number.isFinite(value)) {
    return 'R 0.00';
  }
  return formatRand(value);
}

export function formatPostedAmount(amount: number): string {
  const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
  if (Number.isInteger(rounded)) {
    return String(rounded);
  }
  return rounded.toFixed(2);
}
