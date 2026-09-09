"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  useRef,
} from "react";
import { CheckCircle, XCircle, Info, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toasts: Toast[];
  toast: (toast: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastVariant, React.ElementType> = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const STYLES: Record<ToastVariant, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-red-200 bg-red-50 text-red-900",
  info: "border-blue-200 bg-blue-50 text-blue-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
};

const ICON_STYLES: Record<ToastVariant, string> = {
  success: "text-emerald-600",
  error: "text-red-500",
  info: "text-blue-500",
  warning: "text-amber-500",
};

let nextId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    ({ title, description, variant }: Omit<Toast, "id">) => {
      const id = String(nextId++);
      setToasts((prev) => [...prev.slice(-4), { id, title, description, variant }]);
      const timer = setTimeout(() => dismiss(id), 5000);
      timers.current.set(id, timer);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      {/* Toast viewport */}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 w-[340px] max-w-[calc(100vw-2rem)]"
      >
        {toasts.map((t) => {
          const Icon = ICONS[t.variant];
          return (
            <div
              key={t.id}
              role="alert"
              className={cn(
                "flex items-start gap-3 p-4 rounded-2xl border shadow-lg animate-in slide-in-from-bottom-4 fade-in duration-200",
                STYLES[t.variant]
              )}
            >
              <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", ICON_STYLES[t.variant])} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-snug">{t.title}</p>
                {t.description && (
                  <p className="text-xs mt-0.5 opacity-80 leading-relaxed">
                    {t.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="shrink-0 p-0.5 rounded-md opacity-60 hover:opacity-100 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-current"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
