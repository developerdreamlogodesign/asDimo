/**
 * Token Refresh Interceptor - Automatically refreshes tokens when they expire
 */

import { authService } from "./authService";
import { tokenManager } from "./tokenManager";

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

const subscribeTokenRefresh = (
  callback: (token: string) => void
) => {
  refreshSubscribers.push(callback);
};

const notifyTokenRefresh = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

/**
 * Handle token refresh when access token expires
 */
export const handleTokenRefresh = async (): Promise<string | null> => {
  const refreshToken = tokenManager.getRefreshToken();

  if (!refreshToken) {
    // No refresh token available, user needs to login again
    tokenManager.clearAll();
    window.location.href = "/";
    return null;
  }

  if (isRefreshing) {
    // Token refresh already in progress, queue the request
    return new Promise((resolve) => {
      subscribeTokenRefresh((token: string) => {
        resolve(token);
      });
    });
  }

  isRefreshing = true;

  try {
    const response = await authService.refreshToken(refreshToken);

    const newTokens = {
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
      token: response.data.token,
    };

    tokenManager.updateTokens(newTokens);
    tokenManager.setUser(response.data.user);

    isRefreshing = false;
    notifyTokenRefresh(newTokens.accessToken);

    return newTokens.accessToken;
  } catch (error) {
    isRefreshing = false;
    tokenManager.clearAll();
    window.location.href = "/login";
    return null;
  }
};

/**
 * Check if token is expired (simple check based on common JWT structure)
 * Note: This is a basic implementation. For production, use proper JWT decoding.
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    // Split JWT into parts
    const parts = token.split(".");
    if (parts.length !== 3) {
      return true;
    }

    // Decode payload
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
    );

    // Check expiration
    if (!payload.exp) {
      return false;
    }

    // Add 60 second buffer to refresh before actual expiration
    return Date.now() >= payload.exp * 1000 - 60000;
  } catch {
    return true;
  }
};

/**
 * Wrapped fetch with automatic token refresh
 */
export const fetchWithTokenRefresh = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const accessToken = tokenManager.getAccessToken();

  if (!accessToken) {
    // No token, return original fetch
    return fetch(url, options);
  }

  // Check if token is expired
  if (isTokenExpired(accessToken)) {
    const newToken = await handleTokenRefresh();
    if (!newToken) {
      throw new Error("Failed to refresh token");
    }
  }

  // Add authorization header
  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${accessToken}`);

  const response = await fetch(url, { ...options, headers });

  // If 401, try to refresh token
  if (response.status === 401) {
    const newToken = await handleTokenRefresh();
    if (newToken) {
      headers.set("Authorization", `Bearer ${newToken}`);
      return fetch(url, { ...options, headers });
    }
  }

  return response;
};
