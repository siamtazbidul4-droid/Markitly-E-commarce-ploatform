/**
 * Client-side holder for the administrator session token.
 *
 * The token is an opaque, short-lived JWT issued by the API after server-side
 * credential verification. Credentials themselves are never persisted in
 * browser storage of any kind. `sessionStorage` is used so a page refresh keeps
 * the session alive while closing the tab ends it.
 */

const ADMIN_TOKEN_KEY = 'marketly_admin_token';
const CUSTOMER_TOKEN_KEY = 'marketly_customer_token';

export const getAdminToken = (): string | null => {
  try {
    return window.sessionStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setAdminToken = (token: string | null): void => {
  try {
    if (token) {
      window.sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
    } else {
      window.sessionStorage.removeItem(ADMIN_TOKEN_KEY);
    }
  } catch {
    // Storage unavailable (private mode / blocked cookies): session stays in memory only.
  }
};

export const getCustomerToken = (): string | null => {
  try {
    return window.sessionStorage.getItem(CUSTOMER_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setCustomerToken = (token: string | null): void => {
  try {
    if (token) {
      window.sessionStorage.setItem(CUSTOMER_TOKEN_KEY, token);
    } else {
      window.sessionStorage.removeItem(CUSTOMER_TOKEN_KEY);
    }
  } catch {
    // Storage unavailable: session stays in memory only.
  }
};