/**
 * tokenStorage.ts
 *
 * Centralised, type-safe wrapper over localStorage for auth-token
 * management. All future auth-related storage operations must go
 * through these helpers so the key name is never scattered across
 * the codebase.
 */

const TOKEN_KEY = "dataplus_auth_token";
const USER_KEY = "dataplus_auth_user";

export interface StoredUser {
  id: string;
  email: string;
  full_name: string | null;
  role: string | null;
  permissions?: string[];
}

export const tokenStorage = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  },

  hasToken(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  },

  getUser(): StoredUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredUser;
    } catch {
      return null;
    }
  },

  setUser(user: StoredUser): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  removeUser(): void {
    localStorage.removeItem(USER_KEY);
  },

  /** Clear all auth state (call on logout). */
  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};
