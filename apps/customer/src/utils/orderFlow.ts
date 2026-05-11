import type { CustomerPaymentDeeplinkAccount } from '../api/customer/entity';
import type { CartItem } from '../stores/cart';

const TOSS_ANDROID_STORE_URL = 'https://play.google.com/store/apps/details?id=viva.republica.toss';
// Previous fallback delay was 1200ms. Samsung Browser can still fire fallback
// after Toss opens, leaving a Play Store tab behind.
// const APP_OPEN_FALLBACK_DELAY_MS = 1200;
const APP_OPEN_FALLBACK_DELAY_MS = 2500;
const ORDER_DRAFT_STORAGE_KEY = 'order-ping:customer-order-draft:v1';

type MobilePlatform = 'android' | 'ios' | 'other';

interface OpenTossOptions {
  allowStoreFallback?: boolean;
  fallbackDelayMs?: number;
  onUnsupportedDevice?: () => void;
}

export interface PendingOrderDraft {
  orderId: number | null;
  storeId: number;
  tableId: number;
  tableNum: number;
  idempotencyKey: string;
  depositorName: string;
  couponAmount: number;
  totalPrice: number;
  paymentAmount: number;
  tossDeeplink: string;
  tossAutoOpenAttemptedAt?: string;
  account: CustomerPaymentDeeplinkAccount;
  items: CartItem[];
  createdAt: string;
}

export const parsePositiveInt = (value: string | null | undefined) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

export const createOrderIdempotencyKey = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
};

export const buildStoreHomePath = (storeId: number, tableNum: number) =>
  `/stores/${storeId}?tableNum=${tableNum}`;

export const buildCartPath = (storeId: number, tableNum: number) =>
  `/stores/${storeId}/cart?tableNum=${tableNum}`;

export const buildOrderConfirmPath = (storeId: number, tableNum: number) =>
  `/stores/${storeId}/orders/confirm?tableNum=${tableNum}`;

export const buildOrderPaymentWaitPath = (storeId: number, tableNum: number) =>
  `/stores/${storeId}/orders/payment?tableNum=${tableNum}`;

export const buildOrderPaymentAccountPath = (storeId: number, tableNum: number) =>
  `/stores/${storeId}/orders/payment/account?tableNum=${tableNum}`;

export const buildOrderStatusPath = (
  storeId: number,
  tableNum: number,
  orderId?: number | null,
) => {
  const params = new URLSearchParams({ tableNum: String(tableNum) });
  if (orderId && orderId > 0) {
    params.set('orderId', String(orderId));
  }
  return `/stores/${storeId}/orders/status?${params.toString()}`;
};

export const buildOrderHistoryPath = (storeId: number, tableNum: number) =>
  `/stores/${storeId}/orders/history?tableNum=${tableNum}`;

export const buildOrderIssuePath = (storeId: number, tableNum: number) =>
  `/stores/${storeId}/orders/issue?tableNum=${tableNum}`;

const isValidCartItem = (value: unknown): value is CartItem => {
  if (!value || typeof value !== 'object') return false;

  const item = value as CartItem;
  return (
    typeof item.menuId === 'number' &&
    typeof item.name === 'string' &&
    typeof item.price === 'number' &&
    typeof item.imageUrl === 'string' &&
    typeof item.quantity === 'number'
  );
};

const isValidDraft = (value: unknown): value is PendingOrderDraft => {
  if (!value || typeof value !== 'object') return false;

  const draft = value as PendingOrderDraft;
  return (
    (typeof draft.orderId === 'number' || draft.orderId === null) &&
    typeof draft.storeId === 'number' &&
    typeof draft.tableId === 'number' &&
    typeof draft.tableNum === 'number' &&
    typeof draft.idempotencyKey === 'string' &&
    draft.idempotencyKey.length > 0 &&
    typeof draft.depositorName === 'string' &&
    typeof draft.couponAmount === 'number' &&
    typeof draft.totalPrice === 'number' &&
    typeof draft.paymentAmount === 'number' &&
    typeof draft.tossDeeplink === 'string' &&
    (draft.tossAutoOpenAttemptedAt === undefined ||
      typeof draft.tossAutoOpenAttemptedAt === 'string') &&
    draft.account !== null &&
    typeof draft.account === 'object' &&
    typeof draft.account.bankName === 'string' &&
    typeof draft.account.accountHolder === 'string' &&
    typeof draft.account.accountNumber === 'string' &&
    Array.isArray(draft.items) &&
    draft.items.every(isValidCartItem) &&
    typeof draft.createdAt === 'string'
  );
};

export const savePendingOrderDraft = (draft: PendingOrderDraft) => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(ORDER_DRAFT_STORAGE_KEY, JSON.stringify(draft));
};

export const hasTossAutoOpenAttempted = (draft: PendingOrderDraft) =>
  Boolean(draft.tossAutoOpenAttemptedAt);

export const markTossAutoOpenAttempted = (draft: PendingOrderDraft) => {
  const nextDraft = {
    ...draft,
    tossAutoOpenAttemptedAt: new Date().toISOString(),
  };

  savePendingOrderDraft(nextDraft);
  return nextDraft;
};

export const loadPendingOrderDraft = () => {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.sessionStorage.getItem(ORDER_DRAFT_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as unknown;
    return isValidDraft(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const clearPendingOrderDraft = () => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(ORDER_DRAFT_STORAGE_KEY);
};

const isTossAppDeeplink = (url: string) => /^supertoss:\/\//i.test(url);

const isExternalPaymentUrl = (url: string) => /^(https?:\/\/|supertoss:\/\/)/i.test(url);

const getMobilePlatform = (): MobilePlatform => {
  const ua = navigator.userAgent.toLowerCase();
  const isIOS =
    /iphone|ipad|ipod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (/android/.test(ua)) return 'android';
  if (isIOS) return 'ios';
  return 'other';
};

export const openTossWithStoreFallback = async (
  tossDeeplink: string,
  options: OpenTossOptions = {},
) => {
  if (!isExternalPaymentUrl(tossDeeplink)) {
    throw new Error('Invalid toss deeplink');
  }

  if (!isTossAppDeeplink(tossDeeplink)) {
    window.location.href = tossDeeplink;
    return;
  }

  const platform = getMobilePlatform();
  const {
    allowStoreFallback = true,
    fallbackDelayMs = APP_OPEN_FALLBACK_DELAY_MS,
    onUnsupportedDevice,
  } = options;

  await new Promise<void>((resolve) => {
    let finished = false;

    const cleanup = () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleAppOpenSignal);
      window.removeEventListener('pagehide', handleAppOpenSignal);
      clearTimeout(fallbackTimer);
    };

    const finish = () => {
      if (finished) return;
      finished = true;
      cleanup();
      resolve();
    };

    const handleAppOpenSignal = () => {
      finish();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        finish();
      }
    };

    const fallbackTimer = window.setTimeout(() => {
      if (document.visibilityState === 'hidden' || !document.hasFocus()) {
        finish();
        return;
      }

      if (platform === 'android') {
        if (allowStoreFallback) {
          // Previous Android fallback behavior:
          // window.location.href = TOSS_ANDROID_STORE_URL;
          window.location.assign(TOSS_ANDROID_STORE_URL);
        } else {
          onUnsupportedDevice?.();
        }
        finish();
        return;
      }

      if (platform === 'ios') {
        onUnsupportedDevice?.();
        finish();
        return;
      }

      onUnsupportedDevice?.();
      finish();
    }, fallbackDelayMs);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleAppOpenSignal, { once: true });
    window.addEventListener('pagehide', handleAppOpenSignal, { once: true });
    window.location.href = tossDeeplink;
  });
};
