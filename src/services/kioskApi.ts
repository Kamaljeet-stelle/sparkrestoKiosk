import {
  APPLY_COUPON_URL,
  KIOSK_MENU_PATH,
  KIOSK_ORIGIN,
  LOGIN_API_URL,
  LOGOUT_API_URL,
  MENU_API_URL,
  PLACE_ORDER_URL,
  REQUEST_TIMEOUT_MS,
} from '../config/kiosk';
import type { MemberSuggestion, Menu } from '../types/kiosk';
import { mapMenuResponse } from './menuMapper';
import { parseMembers, parseSavedAddresses } from './members';
import {
  clearSessionAuth,
  getAuthToken,
  getDomainId,
  setSession,
} from './session';

const cookies = new Map<string, string>();

function absorbCookies(response: Response) {
  const withList = response.headers as Headers & { getSetCookie?: () => string[] };
  const list =
    typeof withList.getSetCookie === 'function'
      ? withList.getSetCookie()
      : [];
  const header = response.headers.get('set-cookie');
  const parts = list.length > 0 ? list : header ? [header] : [];
  parts.forEach(part => {
    const pair = part.split(';')[0];
    const eq = pair.indexOf('=');
    if (eq <= 0) {
      return;
    }
    cookies.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
  });
}

function cookieHeader(): string {
  return [...cookies.entries()].map(([key, value]) => `${key}=${value}`).join('; ');
}

async function timedFetch(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('The store took too long to respond. Try again.');
    }
    throw new Error(
      'Unable to reach the store. Check the connection and try again.',
    );
  } finally {
    clearTimeout(timer);
  }
}

/** Store-origin requests (coupon CSRF, members, addresses). */
async function request(
  path: string,
  init?: {
    method?: string;
    body?: string;
    headers?: Record<string, string>;
  },
): Promise<string> {
  const headers: Record<string, string> = {
    Accept: 'text/html,application/json;q=0.9,*/*;q=0.8',
    'X-Requested-With': 'XMLHttpRequest',
    Referer: `${KIOSK_ORIGIN}${KIOSK_MENU_PATH}`,
    Origin: KIOSK_ORIGIN,
    ...init?.headers,
  };
  const cookie = cookieHeader();
  if (cookie) {
    headers.Cookie = cookie;
  }

  const response = await timedFetch(`${KIOSK_ORIGIN}${path}`, {
    method: init?.method ?? 'GET',
    headers,
    body: init?.body,
  });
  absorbCookies(response);
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`The store did not respond (${response.status}).`);
  }
  return text;
}

export async function login(
  email: string,
  password: string,
): Promise<{ storeName: string }> {
  const response = await timedFetch(LOGIN_API_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ email, password }).toString(),
  });
  const text = await response.text();
  let data: {
    status?: string;
    message?: string;
    auth_token?: string;
    domainId?: number | string;
    name?: string;
  };
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Invalid login response.');
  }
  if (!response.ok || data.status !== 'success' || !data.auth_token) {
    throw new Error(data.message || 'Login failed.');
  }
  await setSession({
    authToken: data.auth_token,
    domainId: String(data.domainId ?? ''),
    storeName: data.name,
  });
  return { storeName: data.name?.trim() || '' };
}

export async function logout(): Promise<void> {
  const authToken = getAuthToken();
  try {
    if (authToken) {
      await timedFetch(LOGOUT_API_URL, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ auth_token: authToken }).toString(),
      });
    }
  } catch {
    // Still clear the local session so the kiosk can log in again.
  } finally {
    await clearSessionAuth();
  }
}

export async function fetchMenu(): Promise<Menu> {
  const response = await timedFetch(MENU_API_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ domainId: getDomainId() }).toString(),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`The store did not respond (${response.status}).`);
  }
  let payload: unknown;
  try {
    payload = JSON.parse(text) as unknown;
  } catch {
    throw new Error('The menu response was invalid.');
  }
  return mapMenuResponse(payload);
}

export async function postCoupon(code: string): Promise<string> {
  const authToken = getAuthToken();
  if (!authToken) {
    throw new Error('Please login again.');
  }
  const response = await timedFetch(APPLY_COUPON_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      domainId: getDomainId(),
      auth_token: authToken,
      coupon_code: code,
    }).toString(),
  });
  return response.text();
}

export async function postOrder(body: string): Promise<string> {
  const response = await timedFetch(PLACE_ORDER_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`The store did not respond (${response.status}).`);
  }
  return text;
}

export async function searchMembers(term: string): Promise<MemberSuggestion[]> {
  const text = await request(
    `/members/get_member_by_contact_ajax_request_online?term=${encodeURIComponent(term)}`,
    { headers: { Accept: 'application/json' } },
  );
  try {
    return parseMembers(JSON.parse(text) as unknown);
  } catch {
    return [];
  }
}

export async function fetchSavedAddresses(term: string): Promise<string[]> {
  const html = await request(
    `/members/getlast3address?term=${encodeURIComponent(term)}`,
  );
  return parseSavedAddresses(html);
}
