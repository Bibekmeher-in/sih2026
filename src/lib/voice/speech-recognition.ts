/**
 * Web Speech Recognition Engine for Farmer-Friendly Voice Input
 * Supports Odia (or-IN), Hindi (hi-IN), and Indian English (en-IN)
 */

export interface VoiceRecognitionOptions {
  language?: "or" | "hi" | "en";
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
}

// Map application language codes to BCP-47 speech tags
export const SPEECH_LANG_MAP: Record<string, string[]> = {
  or: ["or-IN", "hi-IN", "en-IN"], // Primary Odia, with Hindi & Indian English fallback
  hi: ["hi-IN", "en-IN"],
  en: ["en-IN", "en-US"],
};

export class BrowserSpeechRecognizer {
  private recognition: any = null;
  private isListening: boolean = false;
  private options: VoiceRecognitionOptions;

  constructor(options: VoiceRecognitionOptions = {}) {
    this.options = options;
  }

  public static isSupported(): boolean {
    if (typeof window === "undefined") return false;
    return !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
  }

  /**
   * Request microphone permission explicitly via getUserMedia.
   * This forces the browser to prompt the user if permission was not yet decided,
   * and verifies whether the microphone hardware is accessible.
   */
  public static async requestPermission(): Promise<{ granted: boolean; error?: string }> {
    if (typeof window === "undefined") return { granted: false, error: "NOT_IN_BROWSER" };
    if (typeof navigator === "undefined" || typeof navigator.mediaDevices?.getUserMedia !== "function") {
      return { granted: false, error: "MEDIA_DEVICES_NOT_SUPPORTED" };
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Immediately stop audio tracks so the hardware is not blocked for SpeechRecognition
      stream.getTracks().forEach((track) => track.stop());
      return { granted: true };
    } catch (err: any) {
      if (
        err.name === "NotAllowedError" ||
        err.name === "PermissionDeniedError" ||
        (err.message && err.message.toLowerCase().includes("permission denied"))
      ) {
        return { granted: false, error: "MIC_PERMISSION_DENIED" };
      }
      return { granted: false, error: err.name || "PERMISSION_ERROR" };
    }
  }

  public async start(): Promise<boolean> {
    if (!BrowserSpeechRecognizer.isSupported()) {
      if (this.options.onError) {
        this.options.onError("Speech recognition is not supported in this browser.");
      }
      return false;
    }

    // Pre-flight check: attempt to ensure microphone permission is granted in Chromium
    if (typeof navigator !== "undefined" && typeof navigator.mediaDevices?.getUserMedia === "function") {
      try {
        const perm = await BrowserSpeechRecognizer.requestPermission();
        if (!perm.granted) {
          if (this.options.onError) {
            this.options.onError(
              "Microphone access blocked. Please allow microphone permission in your browser."
            );
          }
          return false;
        }
      } catch {
        // Continue to SpeechRecognition fallback
      }
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      this.recognition = new SpeechRecognition();
      this.recognition.continuous = this.options.continuous ?? false;
      this.recognition.interimResults = this.options.interimResults ?? true;

      // Determine speech recognition language
      const appLang = this.options.language || "or";
      const candidateLangs = SPEECH_LANG_MAP[appLang] || ["hi-IN", "en-IN"];
      this.recognition.lang = candidateLangs[0];

      this.recognition.onstart = () => {
        this.isListening = true;
        if (this.options.onStart) this.options.onStart();
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        const text = finalTranscript || interimTranscript;
        const isFinal = !!finalTranscript;
        if (this.options.onResult && text) {
          this.options.onResult(text.trim(), isFinal);
        }
      };

      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        let errorMessage = "Speech recognition error occurred.";
        if (event.error === "not-allowed") {
          errorMessage = "Microphone access blocked. Please allow microphone permission in your browser.";
        } else if (event.error === "no-speech") {
          errorMessage = "No speech detected. Please try speaking closer to your microphone.";
        } else if (event.error === "network") {
          errorMessage = "Network error during speech recognition.";
        }
        if (this.options.onError) {
          this.options.onError(errorMessage);
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (this.options.onEnd) this.options.onEnd();
      };

      this.recognition.start();
      return true;
    } catch (err: any) {
      this.isListening = false;
      if (this.options.onError) {
        if (err.name === "NotAllowedError" || (err.message && err.message.includes("not-allowed"))) {
          this.options.onError(
            "Microphone access blocked. Please allow microphone permission in your browser."
          );
        } else {
          this.options.onError(err.message || "Failed to start speech recognition");
        }
      }
      return false;
    }
  }

  public stop(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
    }
    this.isListening = false;
  }

  public abort(): void {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {
        // ignore
      }
    }
    this.isListening = false;
  }

  public getListeningState(): boolean {
    return this.isListening;
  }
}
