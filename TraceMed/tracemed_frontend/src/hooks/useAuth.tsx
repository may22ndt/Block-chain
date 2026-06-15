"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { User, UserRole } from "@/types";
import { loginApi } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (roles: UserRole[]) => boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("tracemed_token");
    const storedUser = localStorage.getItem("tracemed_user");
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("tracemed_token");
        localStorage.removeItem("tracemed_refresh");
        localStorage.removeItem("tracemed_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const data = await loginApi(username, password);
    localStorage.setItem("tracemed_token", data.access);
    localStorage.setItem("tracemed_refresh", data.refresh);
    localStorage.setItem("tracemed_user", JSON.stringify(data.user));
    setToken(data.access);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("tracemed_token");
    localStorage.removeItem("tracemed_refresh");
    localStorage.removeItem("tracemed_user");
    setToken(null);
    setUser(null);
    // Hard navigate to avoid stale router state causing reload loops
    window.location.href = "/login";
  }, []);

  const hasRole = useCallback(
    (roles: UserRole[]) => {
      if (!user) return false;
      if (user.is_superuser) return true;
      return roles.some((r) => user.roles?.includes(r));
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token && !!user,
        hasRole,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
