"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { getMeAPI, loginAPI, logoutAPI, registerAPI, type AuthUser } from "@/services/auth-service";
import logger from "@/lib/logger";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<AuthUser>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const response = await getMeAPI();
      setUser(response.data);
    } catch {
      setUser(null);
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
      }
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await loginAPI(email, password);
    const { user: userData, accessToken, refreshToken } = response.data;
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    document.cookie = "shopflow_auth=1; path=/; SameSite=Lax";
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;
      if (refreshToken) {
        await logoutAPI(refreshToken);
      }
    } catch (error) {
      logger.warn("Logout error:", error);
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        document.cookie = "shopflow_auth=; path=/; max-age=0";
      }
      setUser(null);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string): Promise<AuthUser> => {
    const response = await registerAPI(name, email, password);
    const { user: userData, accessToken, refreshToken } = response.data;
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    document.cookie = "shopflow_auth=1; path=/; SameSite=Lax";
    setUser(userData);
    return userData;
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, login, logout, register, refreshUser }),
    [user, isLoading, login, logout, register, refreshUser]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
