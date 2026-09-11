import type { NextConfig } from "next";

/**
 * KISANOVA — Next.js Production Configuration
 *
 * Security headers applied to all routes.
 * CSP is deliberately permissive on script-src due to Next.js inline hydration
 * and Recharts/Leaflet CDN usage — tighten per-route in future via middleware if needed.
 */
const securityHeaders = [
  // Prevent DNS prefetch leaking visited URLs
  {
    key: "X-DNS-Prefetch-Control",
    value: "off",
  },
  // Block clickjacking via iframes from foreign origins
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  // Prevent MIME-type sniffing
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // Limit referrer information to same-origin only
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // Browser feature permissions policy
  // - Camera and mic disabled
  // - Geolocation enabled for same-origin (used for buyer/farmer delivery addresses and logistics)
  // - Payment enabled for checkout gateways (Razorpay Payment Request API / iframe checkout)
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self), payment=*",
  },
  // Content Security Policy
  // - script-src includes 'unsafe-inline' + 'unsafe-eval' required by Next.js dev hydration
  //   and Recharts. In a stricter production environment, use nonces instead.
  // - script-src includes checkout.razorpay.com for the Razorpay Standard Checkout script
  // - img-src allows OpenStreetMap tiles (Leaflet), data URIs, and Razorpay CDN (payment icons)
  // - connect-src allows Google Gemini API calls from server and Razorpay API for checkout XHR
  // - frame-src allows Razorpay checkout iframe (used by Razorpay Standard Checkout flow)
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://tile.openstreetmap.org https://cdn.razorpay.com",
      "connect-src 'self' https://generativelanguage.googleapis.com https://api.razorpay.com",
      "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },

  // Disable X-Powered-By header to reduce fingerprinting
  poweredByHeader: false,
};

export default nextConfig;

