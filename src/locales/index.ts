import { en, TranslationKeys } from "./en";
import { hi } from "./hi";
import { or } from "./or";

export type LanguageCode = "en" | "hi" | "or";

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇮🇳" },
  { code: "hi", name: "Hindi", nativeName: "हिंदी", flag: "🇮🇳" },
  { code: "or", name: "Odia", nativeName: "ଓଡ଼ିଆ", flag: "🇮🇳" },
];

export const translations: Record<LanguageCode, TranslationKeys> = {
  en,
  hi: hi as unknown as TranslationKeys,
  or: or as unknown as TranslationKeys,
};

export { en, hi, or };
