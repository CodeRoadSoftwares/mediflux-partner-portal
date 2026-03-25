"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const { logout, partner } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/dashboard/create-store", label: "Create Store", icon: "➕" },
    { href: "/dashboard/stores", label: "My Stores", icon: "🏪" },
  ];

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-teal-200 shadow-sm backdrop-blur-sm bg-opacity-95">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-linear-to-br from-teal-600 to-teal-700 rounded-lg flex items-center justify-center">
              <span className="text-lg">🏪</span>
            </div>
            <h1 className="text-lg font-bold text-teal-900">
              Mediflux Partner Portal
            </h1>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="text-teal-700 p-2 hover:bg-teal-50 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40 mt-14"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 flex h-screen w-64 flex-col bg-white border-r border-teal-200 shadow-lg transition-transform duration-300 ease-in-out mt-14 lg:mt-0",
          isMobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0",
        )}
      >
        <div className="p-6 border-b border-teal-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-linear-to-br from-teal-600 to-teal-700 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-xl">🏪</span>
            </div>
            <h1 className="text-xl font-bold text-teal-900">
              Mediflux Partner Portal
            </h1>
          </div>
          {partner && (
            <div className="text-sm bg-teal-50 rounded-lg p-3 border border-teal-100">
              <p className="font-medium text-teal-900 truncate">
                {partner.email}
              </p>
              <p className="text-xs mt-1 text-teal-600">
                Code: {partner.partnerCode}
              </p>
            </div>
          )}
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                pathname === link.href
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-teal-700 hover:bg-teal-50",
              )}
            >
              <span className="text-lg">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-teal-100 p-3">
          <button
            onClick={logout}
            className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 shadow-sm transition-all active:scale-95"
          >
            Logout
          </button>
        </div>
      </div>
    </>
  );
}
