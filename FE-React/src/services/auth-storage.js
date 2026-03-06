import { AUTH_STORAGE_KEY } from "../constants/app-data";

export const parseStoredAuth = () => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return { user: null, token: null };

    const parsed = JSON.parse(raw);
    if (!parsed?.user || !parsed?.token) return { user: null, token: null };

    return { user: parsed.user, token: parsed.token };
  } catch {
    return { user: null, token: null };
  }
};

export const persistAuth = (user, token) => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, token }));
};

export const clearStoredAuth = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};
