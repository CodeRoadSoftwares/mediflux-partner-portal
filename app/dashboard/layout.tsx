"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/layout/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { partner, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !partner) {
      router.push("/login");
    }
  }, [partner, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-teal-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-teal-700">Loading...</p>
        </div>
      </div>
    );
  }

  if (!partner) {
    return null;
  }

  return (
    <div className="flex h-screen bg-linear-to-br from-teal-50 via-white to-teal-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="pt-20 lg:pt-8 px-4 sm:px-6 lg:px-8 pb-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
