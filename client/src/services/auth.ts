export interface AuthUser {
  userId: string;
  email: string;
  name: string;
  picture?: string;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
}

const AUTH_STORAGE_KEY = "blog-summary-auth";

export const getStoredAuthSession = (): AuthSession | null => {
  const rawSession = window.localStorage.getItem(AUTH_STORAGE_KEY);

  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession) as AuthSession;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
};

export const storeAuthSession = (session: AuthSession) => {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
};

export const clearAuthSession = () => {
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
};

export const getAuthToken = () => getStoredAuthSession()?.token || "";

export const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken();

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
};
