"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import {
  LanguageCode,
  SUPPORTED_LANGUAGES,
  LanguageOption,
  translations,
} from "@/locales";

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (path: string, fallback?: string) => string;
  supportedLanguages: LanguageOption[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "kisandirect_lang";

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>("en");
  const [isMounted, setIsMounted] = useState(false);

  // Initialize from localStorage or cookie on mount
  useEffect(() => {
    setIsMounted(true);
    try {
      const savedLang = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
      if (savedLang && (savedLang === "en" || savedLang === "hi" || savedLang === "or")) {
        setLanguageState(savedLang);
        document.documentElement.lang = savedLang;
        return;
      }

      // Check cookie fallback
      const cookieMatch = document.cookie.match(/(?:^|; )NEXT_LOCALE=([^;]*)/);
      if (cookieMatch) {
        const cookieLang = cookieMatch[1] as LanguageCode;
        if (cookieLang === "en" || cookieLang === "hi" || cookieLang === "or") {
          setLanguageState(cookieLang);
          document.documentElement.lang = cookieLang;
        }
      }
    } catch {
      // LocalStorage unavailable in certain environments
    }
  }, []);

  const setLanguage = useCallback((newLang: LanguageCode) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
      document.cookie = `NEXT_LOCALE=${newLang}; path=/; max-age=31536000; SameSite=Lax`;
      document.documentElement.lang = newLang;
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Translation lookup helper supporting dot notation e.g. "common.appName"
  const t = useCallback(
    (path: string, fallback?: string): string => {
      const keys = path.split(".");
      
      // Look up in current language
      let current: unknown = translations[language];
      for (const k of keys) {
        if (current && typeof current === "object" && k in current) {
          current = (current as Record<string, unknown>)[k];
        } else {
          current = undefined;
          break;
        }
      }

      if (typeof current === "string") {
        return current;
      }

      // Fallback to English
      if (language !== "en") {
        let enCurrent: unknown = translations.en;
        for (const k of keys) {
          if (enCurrent && typeof enCurrent === "object" && k in enCurrent) {
            enCurrent = (enCurrent as Record<string, unknown>)[k];
          } else {
            enCurrent = undefined;
            break;
          }
        }
        if (typeof enCurrent === "string") {
          return enCurrent;
        }
      }

      return fallback !== undefined ? fallback : path;
    },
    [language]
  );

  const contextValue = useMemo(
    () => ({
      language: isMounted ? language : "en",
      setLanguage,
      t,
      supportedLanguages: SUPPORTED_LANGUAGES,
    }),
    [language, isMounted, setLanguage, t]
  );

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
