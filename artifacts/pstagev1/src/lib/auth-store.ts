import { useState, useEffect } from "react";
import type { AuthUser } from "./api";

const TOKEN_KEY = "auth_token";
const REFRESH_KEY = "auth_refresh";
const USER_KEY = "auth_user";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setTokens(token: string, refreshToken: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(REFRESH_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("auth_change"));
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event("auth_change"));
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());

  useEffect(() => {
    const handler = () => setUser(getStoredUser());
    window.addEventListener("auth_change", handler);
    return () => window.removeEventListener("auth_change", handler);
  }, []);

  return { user, isLoggedIn: !!user, isOwner: user?.role === "OWNER" };
}
