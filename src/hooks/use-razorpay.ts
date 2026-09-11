"use client";

import { useState, useCallback } from "react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayPaymentOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  image?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  onSuccess: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  onFailure?: (error: {
    code: string;
    description: string;
    source: string;
    step: string;
    reason: string;
    metadata: {
      order_id: string;
      payment_id: string;
    };
  }) => void;
  onDismiss?: () => void;
}

/**
 * Hook to dynamically load Razorpay checkout script and display checkout modal
 */
export function useRazorpay() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadScript = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window === "undefined") {
        resolve(false);
        return;
      }

      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const existingScript = document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      );
      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(true));
        existingScript.addEventListener("error", () => resolve(false));
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }, []);

  const openCheckout = useCallback(
    async (options: RazorpayPaymentOptions) => {
      setIsLoading(true);
      setError(null);

      const loaded = await loadScript();
      if (!loaded) {
        setIsLoading(false);
        const errMsg = "Failed to load Razorpay payment gateway. Please check your internet connection.";
        setError(errMsg);
        options.onFailure?.({
          code: "SCRIPT_LOAD_FAILED",
          description: errMsg,
          source: "client",
          step: "script_load",
          reason: "network_error",
          metadata: { order_id: options.order_id, payment_id: "" },
        });
        return;
      }

      try {
        const rzpOptions = {
          key: options.key,
          amount: options.amount,
          currency: options.currency || "INR",
          name: options.name || "KisanDirect",
          description: options.description || "Farm-to-Door Direct Order",
          order_id: options.order_id,
          ...(options.image ? { image: options.image } : {}),
          prefill: options.prefill,
          notes: options.notes,
          theme: options.theme || { color: "#16a34a" },
          handler: function (response: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) {
            setIsLoading(false);
            options.onSuccess(response);
          },
          modal: {
            ondismiss: function () {
              setIsLoading(false);
              options.onDismiss?.();
            },
            escape: true,
            backdropclose: false,
          },
        };

        const razorpayInstance = new window.Razorpay(rzpOptions);

        razorpayInstance.on("payment.failed", function (response: any) {
          setIsLoading(false);
          const errorData = response.error || {};
          setError(errorData.description || "Payment failed at gateway");
          options.onFailure?.(errorData);
        });

        razorpayInstance.open();
      } catch (err: any) {
        setIsLoading(false);
        const errMsg = err?.message || "Failed to initialize payment modal";
        setError(errMsg);
        options.onFailure?.({
          code: "INIT_FAILED",
          description: errMsg,
          source: "client",
          step: "modal_open",
          reason: "runtime_error",
          metadata: { order_id: options.order_id, payment_id: "" },
        });
      }
    },
    [loadScript]
  );

  return {
    openCheckout,
    isLoading,
    error,
  };
}
