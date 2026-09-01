"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { me, type AuthTokens, type MePayload } from "./api";

const TOKEN_KEY = "hemavision.auth.token";
const EMAIL_KEY = "hemavision.auth.email";

type AuthState = {
  token: string | null;
  email: string | null;
  user: MePayload | null;
  loading: boolean;
  signIn: (tokens: AuthTokens) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [user, setUser] = useState<MePayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const t = window.localStorage.getItem(TOKEN_KEY);
      const e = window.localStorage.getItem(EMAIL_KEY);
      if (t) setToken(t);
      if (e) setEmail(e);
    } catch {
      /* private mode */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }
    let cancelled = false;
    me(token)
      .then((payload) => {
        if (!cancelled) setUser(payload);
      })
      .catch(() => {
        // Stored token is invalid or expired — evict.
        if (!cancelled) {
          try {
            window.localStorage.removeItem(TOKEN_KEY);
            window.localStorage.removeItem(EMAIL_KEY);
          } catch {
            /* ignore */
          }
          setToken(null);
          setEmail(null);
          setUser(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const signIn = useCallback((tokens: AuthTokens) => {
    try {
      window.localStorage.setItem(TOKEN_KEY, tokens.access_token);
      window.localStorage.setItem(EMAIL_KEY, tokens.email);
    } catch {
      /* private mode — session-only */
    }
    setToken(tokens.access_token);
    setEmail(tokens.email);
  }, []);

  const signOut = useCallback(() => {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(EMAIL_KEY);
    } catch {
      /* ignore */
    }
    setToken(null);
    setEmail(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ token, email, user, loading, signIn, signOut }),
    [token, email, user, loading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>.");
  return ctx;
}
