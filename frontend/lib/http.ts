'use client'

/**
 * Shared HTTP helpers for the web app.
 *
 * Auth model: the backend issues httpOnly `token` / `refreshToken` cookies on
 * login. The browser attaches them automatically when `credentials: 'include'`
 * is set on the request. We do NOT store JWTs in localStorage or send
 * Authorization headers — both are XSS-stealable.
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Patch the global fetch so every request carries cookies
 * (credentials: 'include'). Installed once by AuthProvider.
 *
 * Rationale: the app has ~60 fetch call sites across hooks and pages; forcing
 * credentials globally guarantees none of them silently lose the session
 * cookie, while the token itself stays in the httpOnly cookie (invisible to
 * JS).
 */
export function installCookieCredentials() {
  if (typeof window === 'undefined') return;
  if ((window as any).__sfFetchPatched) return;
  (window as any).__sfFetchPatched = true;

  const originalFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) =>
    originalFetch(input, {
      ...init,
      credentials: 'include',
    });
}

/**
 * Auth headers for the socket handshake etc. Always empty — auth flows
 * through the httpOnly cookie. Kept as a named export so call sites stay
 * explicit about intent.
 */
export const getAuthHeaders = (): Record<string, string> => ({});
