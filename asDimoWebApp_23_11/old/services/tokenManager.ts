/**
 * Token Manager - Handles token storage, retrieval, and refresh logic
 */

interface TokenData {
  accessToken?: string;
  refreshToken?: string;
  token?: string;
}

const TOKEN_STORAGE_KEY = "tokens";
const USER_STORAGE_KEY = "user";
const LEGACY_TOKEN_KEY = "token"; // For backward compatibility
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const AUTH_SESSION_KEY = "authSessionActive";

export const tokenManager = {
  /**
   * Store tokens for this browser profile.
   */
  setTokens(tokens: TokenData): void {
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
    // Keep legacy token key for backward compatibility
    localStorage.setItem(
      LEGACY_TOKEN_KEY,
      tokens.token || tokens.accessToken || ""
    );
    localStorage.setItem(AUTH_SESSION_KEY, "true");

    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(LEGACY_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_SESSION_KEY);
  },

  /**
   * Get all stored tokens
   */
  getTokens(): TokenData | null {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!stored) {
      return null;
    }

    try {
      return JSON.parse(stored) as TokenData;
    } catch {
      tokenManager.clearTokens();
      return null;
    }
  },

  /**
   * Get access token only
   */
  getAccessToken(): string | null {
    const tokens = tokenManager.getTokens();
    return tokens?.accessToken || tokens?.token || tokenManager.getLegacyToken();
  },

  /**
   * Get refresh token only
   */
  getRefreshToken(): string | null {
    const tokens = tokenManager.getTokens();
    return tokens?.refreshToken || null;
  },

  /**
   * Get legacy token (for backward compatibility)
   */
  getLegacyToken(): string | null {
    return localStorage.getItem(LEGACY_TOKEN_KEY);
  },

  /**
   * Update tokens (used after refresh)
   */
  updateTokens(tokens: Partial<TokenData>): void {
    const existing = tokenManager.getTokens();
    if (!existing) {
      return;
    }

    const updated: TokenData = {
      ...existing,
      ...tokens,
    };

    tokenManager.setTokens(updated);
  },

  /**
   * Store user data
   */
  setUser(user: any): void {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    sessionStorage.removeItem(USER_STORAGE_KEY);
  },

  /**
   * Get stored user data
   */
  getUser(): any {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    if (!stored) {
      return null;
    }

    try {
      return JSON.parse(stored);
    } catch {
      tokenManager.clearAll();
      return null;
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const user = tokenManager.getUser();
    const accessToken = tokenManager.getAccessToken();
    const hasActiveSession =
      localStorage.getItem(AUTH_SESSION_KEY) === "true";

    return !!(hasActiveSession && accessToken && user);
  },

  /**
   * Clear all tokens
   */
  clearTokens(): void {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(LEGACY_TOKEN_KEY);
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(AUTH_SESSION_KEY);
  },

  /**
   * Clear all auth data (tokens + user)
   */
  clearAll(): void {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(LEGACY_TOKEN_KEY);
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(USER_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(LEGACY_TOKEN_KEY);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(AUTH_SESSION_KEY);
  },
};
