"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = (message: string, type: ToastType = "info") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider
      value={{
        toast: addToast,
        success: (m) => addToast(m, "success"),
        error: (m) => addToast(m, "error"),
        info: (m) => addToast(m, "info"),
      }}
    >
      {children}
      {/* Toast Render Area */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
        {toasts.map((t) => {
          let bg = "bg-slate-900/95 border-slate-700 text-slate-100";
          let Icon = Info;
          let iconColor = "text-sky-400";

          if (t.type === "success") {
            bg = "bg-emerald-950/95 border-emerald-600/60 text-emerald-100";
            Icon = CheckCircle2;
            iconColor = "text-emerald-400";
          } else if (t.type === "error") {
            bg = "bg-rose-950/95 border-rose-600/60 text-rose-100";
            Icon = AlertCircle;
            iconColor = "text-rose-400";
          } else if (t.type === "warning") {
            bg = "bg-amber-950/95 border-amber-600/60 text-amber-100";
            Icon = AlertCircle;
            iconColor = "text-amber-400";
          }

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${bg}`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${iconColor}`} />
              <div className="flex-1 text-sm font-medium leading-relaxed">{t.message}</div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
