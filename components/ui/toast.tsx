"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
}

export function Toast({ message, type = "info", onClose }: ToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = {
    success: "bg-green-600",
    error: "bg-red-600",
    info: "bg-blue-600",
  }[type];

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 rounded-lg px-6 py-4 text-white shadow-lg",
        bgColor,
      )}
    >
      <div className="flex items-center gap-2">
        <p>{message}</p>
        <button
          onClick={onClose}
          className="ml-4 text-white hover:text-gray-200"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = React.useState<Omit<ToastProps, "onClose"> | null>(
    null,
  );

  const showToast = (message: string, type: ToastProps["type"] = "info") => {
    setToast({ message, type });
  };

  const ToastComponent = toast ? (
    <Toast {...toast} onClose={() => setToast(null)} />
  ) : null;

  return { showToast, ToastComponent };
}
