import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const viewport: Viewport = {
  themeColor: "#15803d",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: "Kisanova — India's Direct Farm-to-Fork & FPO Trade Network",
    template: "%s | Kisanova",
  },
  description:
    "Empowering Indian farmers and FPOs by eliminating intermediaries, providing AI-assisted price discovery, automated route logistics, and direct bulk and consumer access.",
  keywords: [
    "Kisanova",
    "Smart India Hackathon",
    "Farm to fork",
    "FPO marketplace",
    "Direct agricultural trade",
    "Indian agriculture",
    "AI mandi price prediction",
    "Farmer earnings",
  ],
  authors: [{ name: "Kisanova Engineering Team" }],
  icons: {
    icon: "/favicon.ico",
  },
};

import { AuthSessionProvider } from "@/components/providers/session-provider";
import { CartProvider } from "@/context/cart-context";
import { ToastProvider } from "@/components/providers/toast-provider";
import { LanguageProvider } from "@/context/language-context";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} scroll-smooth`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body
        className="min-h-screen bg-[#fcfdfd] text-slate-900 antialiased font-sans flex flex-col"
        suppressHydrationWarning
      >
        <LanguageProvider>
          <AuthSessionProvider>
            <CartProvider>
              <ToastProvider>{children}</ToastProvider>
            </CartProvider>
          </AuthSessionProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
