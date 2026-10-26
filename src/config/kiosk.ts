export const KIOSK_ORIGIN = 'https://ntsoakiconfectionery.sparkresto.in';

/** HTML self-kiosk page — still used for coupon CSRF + member lookups. */
export const KIOSK_MENU_PATH = '/selfkiosk';

export const MENU_API_URL = 'https://sparkresto.in/api/selfkiosk/menu';

export const LOGIN_API_URL = 'https://sparkresto.in/api/selfkiosk/login';

export const LOGOUT_API_URL = 'https://sparkresto.in/api/selfkiosk/logout';

export const PLACE_ORDER_URL = 'https://sparkresto.in/api/selfkiosk/place_order';

export const APPLY_COUPON_URL = 'https://sparkresto.in/api/selfkiosk/apply_coupon';

export const KIOSK_DOMAIN_ID = '803';

export const KIOSK_TITLE = 'Self Kiosk';

export const EMPTY_CART_URL = `${KIOSK_ORIGIN}/images/cart-empty.png`;

/** Return to the welcome screen after this much inactivity on the menu or confirmation. */
export const IDLE_TIMEOUT_MS = 90_000;

export const IDLE_WARNING_MS = 15_000;

export const MAX_ITEM_QUANTITY = 99;

export const REQUEST_TIMEOUT_MS = 20_000;
