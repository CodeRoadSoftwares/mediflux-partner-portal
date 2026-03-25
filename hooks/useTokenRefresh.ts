"use client";

import { useEffect, useRef } from "react";
import { api } from "@/lib/api";

export function useTokenRefresh() {
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const refreshInterval = 14 * 60 * 1000;

    const refreshToken = async () => {
      try {
        await api.post("/auth/refresh");
        console.log("Token refreshed successfully");
      } catch (error) {
        console.error("Failed to refresh token:", error);
      }
    };

    refreshIntervalRef.current = setInterval(refreshToken, refreshInterval);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);
}
