/**
 * Web Speech Synthesis (Text-to-Speech) for Farmer Voice Readout
 * Reads out questions, market rates, and AI advice in Odia, Hindi, or English
 */

export interface SpeechSynthesisOptions {
  language?: "or" | "hi" | "en";
  rate?: number; // 0.8 to 1.2 is ideal for rural farmers
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: string) => void;
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speakText(text: string, options: SpeechSynthesisOptions = {}): boolean {
  if (!isSpeechSynthesisSupported()) {
    if (options.onError) {
      options.onError("Text-to-speech audio is not supported in this browser.");
    }
    return false;
  }

  try {
    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    const cleanText = text
      .replace(/[*_#`~]/g, "") // strip markdown
      .replace(/\s+/g, " ")
      .trim();

    if (!cleanText) return false;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const lang = options.language || "or";

    // Set target language tag
    if (lang === "or") {
      utterance.lang = "or-IN";
    } else if (lang === "hi") {
      utterance.lang = "hi-IN";
    } else {
      utterance.lang = "en-IN";
    }

    utterance.rate = options.rate ?? 0.95; // Slightly slower, very clear cadence
    utterance.pitch = options.pitch ?? 1.0;
    utterance.volume = options.volume ?? 1.0;

    // Pick best available voice for language
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      const match = voices.find((v) => {
        if (lang === "or") return v.lang.startsWith("or") || v.lang.startsWith("hi");
        if (lang === "hi") return v.lang.startsWith("hi");
        return v.lang.startsWith("en-IN") || v.lang.startsWith("en");
      });
      if (match) {
        utterance.voice = match;
      }
    }

    if (options.onStart) utterance.onstart = options.onStart;
    if (options.onEnd) utterance.onend = options.onEnd;
    utterance.onerror = (e) => {
      if (options.onError) options.onError(e.error);
    };

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err: any) {
    if (options.onError) options.onError(err.message || "Failed to synthesize speech");
    return false;
  }
}

export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}
