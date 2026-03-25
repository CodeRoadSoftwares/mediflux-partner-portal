"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function Home() {
  const router = useRouter();
  const { partner, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (partner) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    }
  }, [partner, isLoading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-gray-500">Loading...</p>
    </div>
  );
}
