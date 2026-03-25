"use client";

import { Partner } from "@/types";
import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useTokenRefresh } from "@/hooks/useTokenRefresh";

interface AuthContextType {
  partner: Partner | null;
  setPartner: (partner: Partner | null) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Auto-refresh token every 14 minutes
  useTokenRefresh();

  useEffect(() => {
    const storedPartner = localStorage.getItem("partner");
    if (storedPartner) {
      setPartner(JSON.parse(storedPartner));
    }
    setIsLoading(false);
  }, []);

  const logout = async () => {
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setPartner(null);
      localStorage.removeItem("partner");
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider value={{ partner, setPartner, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
