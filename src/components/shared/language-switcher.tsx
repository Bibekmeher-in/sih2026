"use client";

import React, { useState, useRef, useEffect } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { LanguageCode } from "@/locales";

interface LanguageSwitcherProps {
  className?: string;
  compact?: boolean;
}

export function LanguageSwitcher({ className = "", compact = false }: LanguageSwitcherProps) {
  const { language, setLanguage, supportedLanguages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const currentOption = supportedLanguages.find((l) => l.code === language) || supportedLanguages[0];

  const handleSelect = (code: LanguageCode) => {
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:text-emerald-700 hover:border-emerald-300 transition-all shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Select language"
      >
        <Globe className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
        {!compact && (
          <span className="font-medium text-slate-800 tracking-tight">
            {currentOption.nativeName}
          </span>
        )}
        <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-36 rounded-xl bg-white border border-slate-200/90 shadow-lg ring-1 ring-black/5 z-50 py-1.5 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1 border-b border-slate-100 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Select Language / ଭାଷା
            </span>
          </div>
          {supportedLanguages.map((lang) => {
            const isSelected = lang.code === language;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleSelect(lang.code)}
                className={`w-full text-left px-3 py-1.5 text-xs font-medium flex items-center justify-between transition-colors ${
                  isSelected
                    ? "text-emerald-700 bg-emerald-50 font-bold"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400 uppercase w-5">
                    {lang.code}
                  </span>
                  <span>{lang.nativeName}</span>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
