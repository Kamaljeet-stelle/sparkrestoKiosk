import AsyncStorage from '@react-native-async-storage/async-storage';
import { KIOSK_DOMAIN_ID } from '../config/kiosk';

const SESSION_KEY = 'sparkresto.kiosk.session';

type StoredSession = {
  authToken: string;
  domainId: string;
  storeName: string;
};

let authToken = '';
let domainId = KIOSK_DOMAIN_ID;
let storeName = '';

async function persistSession() {
  if (!authToken) {
    await AsyncStorage.removeItem(SESSION_KEY);
    return;
  }
  const payload: StoredSession = {
    authToken,
    domainId,
    storeName,
  };
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(payload));
}

export async function hydrateSession() {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    if (!raw) {
      return;
    }
    const data = JSON.parse(raw) as StoredSession;
    if (!data.authToken) {
      return;
    }
    authToken = data.authToken;
    domainId = data.domainId || KIOSK_DOMAIN_ID;
    storeName = data.storeName?.trim() || '';
  } catch {
    authToken = '';
    domainId = KIOSK_DOMAIN_ID;
    storeName = '';
  }
}

export async function setSession(input: {
  authToken: string;
  domainId: string;
  storeName?: string;
}) {
  authToken = input.authToken;
  domainId = input.domainId || KIOSK_DOMAIN_ID;
  storeName = input.storeName?.trim() || '';
  await persistSession();
}

export async function clearSessionAuth() {
  authToken = '';
  domainId = KIOSK_DOMAIN_ID;
  storeName = '';
  await persistSession();
}

export function getAuthToken() {
  return authToken;
}

export function getDomainId() {
  return domainId || KIOSK_DOMAIN_ID;
}

export function getStoreName() {
  return storeName;
}

export function isLoggedIn() {
  return authToken.length > 0;
}
