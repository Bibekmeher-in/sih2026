"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { BrowserSpeechRecognizer } from "@/lib/voice/speech-recognition";
import { useLanguage } from "@/context/language-context";
import { MicrophonePermissionDialog } from "./microphone-permission-dialog";

interface VoiceInputButtonProps {
  onTranscript: (transcript: string) => void;
  append?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  title?: string;
}

export function VoiceInputButton({
  onTranscript,
  append = false,
  className = "",
  size = "md",
  title,
}: VoiceInputButtonProps) {
  const { language, t } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const recognizerRef = useRef<BrowserSpeechRecognizer | null>(null);

  useEffect(() => {
    return () => {
      if (recognizerRef.current) {
        recognizerRef.current.abort();
      }
    };
  }, []);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isListening) {
      if (recognizerRef.current) {
        recognizerRef.current.stop();
      }
      setIsListening(false);
      setInterimText("");
      return;
    }

    setErrorMessage(null);
    setInterimText("");

    const recognizer = new BrowserSpeechRecognizer({
      language,
      continuous: false,
      interimResults: true,
      onStart: () => {
        setIsListening(true);
      },
      onResult: (text: string, isFinal: boolean) => {
        setInterimText(text);
        if (isFinal) {
          onTranscript(text);
          setIsListening(false);
          setInterimText("");
        }
      },
      onError: (err: string) => {
        setIsListening(false);
        setErrorMessage(err);
        if (
          err.includes("Microphone access blocked") ||
          err.includes("MIC_PERMISSION_DENIED") ||
          err.includes("permission")
        ) {
          setShowPermissionModal(true);
        } else {
          setTimeout(() => setErrorMessage(null), 4000);
        }
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    recognizerRef.current = recognizer;
    recognizer.start();
  };

  const buttonSizeClasses =
    size === "sm"
      ? "h-7 w-7 text-xs"
      : size === "lg"
      ? "h-11 w-11 text-base"
      : "h-8 w-8 text-sm";

  const iconSizes =
    size === "sm" ? "h-3.5 w-3.5" : size === "lg" ? "h-5 w-5" : "h-4 w-4";

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleToggle}
        title={
          title ||
          (isListening
            ? t("voice.listening", "Listening...")
            : t("voice.clickToSpeak", "Speak in Odia, Hindi, or English"))
        }
        className={`relative rounded-full flex items-center justify-center transition-all shadow-xs ${buttonSizeClasses} ${
          isListening
            ? "bg-rose-600 text-white ring-4 ring-rose-300/60 animate-pulse"
            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 border border-emerald-200"
        } ${className}`}
        aria-label={t("voice.clickToSpeak", "Voice Input")}
      >
        {isListening ? (
          <Mic className={`${iconSizes} animate-bounce`} />
        ) : (
          <Mic className={iconSizes} />
        )}
      </button>

      {/* Real-time speech preview banner */}
      {isListening && (
        <div className="absolute right-0 top-full mt-1.5 z-50 min-w-[200px] max-w-xs p-2 rounded-xl bg-slate-900 text-white text-[11px] font-medium shadow-xl border border-slate-700 flex items-center gap-2 animate-in fade-in zoom-in-95">
          <span className="flex h-2 w-2 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
          <div className="flex-1 truncate">
            {interimText || (
              <span className="text-slate-400 italic">
                {language === "or"
                  ? "ଓଡ଼ିଆରେ କୁହନ୍ତୁ..."
                  : language === "hi"
                  ? "हिंदी में बोलें..."
                  : "Listening..."}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Error notification tooltip */}
      {errorMessage && !showPermissionModal && (
        <div
          onClick={() => setShowPermissionModal(true)}
          className="absolute right-0 top-full mt-1.5 z-50 w-64 p-2 rounded-xl bg-rose-50 text-rose-900 border border-rose-300 text-[10px] font-semibold shadow-lg cursor-pointer hover:bg-rose-100"
        >
          <div className="flex items-center justify-between gap-1">
            <span>{errorMessage}</span>
          </div>
          <span className="text-emerald-800 font-bold block mt-1 underline">
            {language === "or" ? "ଅନୁମତି ସେଟିଂ ଖୋଲନ୍ତୁ" : language === "hi" ? "अनुमति सेटिंग खोलें" : "Click to unblock &rarr;"}
          </span>
        </div>
      )}

      {/* Interactive Permission Resolution Dialog */}
      <MicrophonePermissionDialog
        isOpen={showPermissionModal}
        onClose={() => {
          setShowPermissionModal(false);
          setErrorMessage(null);
        }}
        onPermissionGranted={() => {
          setShowPermissionModal(false);
          setErrorMessage(null);
        }}
        onManualTextSubmit={(txt) => {
          onTranscript(txt);
          setShowPermissionModal(false);
          setErrorMessage(null);
        }}
      />
    </div>
  );
}
