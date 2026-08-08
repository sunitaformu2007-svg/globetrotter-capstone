import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Api, Auth } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(Auth.getUser());
  const [token, setToken] = useState(Auth.getToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verify the stored token is still valid on first load.
    const t = Auth.getToken();
    if (!t) {
      setLoading(false);
      return;
    }
    Api.me(t)
      .then(({ user: freshUser }) => {
        setUser(freshUser);
        Auth.setSession(t, freshUser);
      })
      .catch(() => {
        Auth.clear();
        setUser(null);
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { token: t, user: u } = await Api.login({ email, password });
    Auth.setSession(t, u);
    setToken(t);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (payload) => {
    const { token: t, user: u } = await Api.register(payload);
    Auth.setSession(t, u);
    setToken(t);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    Auth.clear();
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback((u) => {
    setUser(u);
    Auth.setSession(Auth.getToken(), u);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, loading, isLoggedIn: Boolean(token), login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
