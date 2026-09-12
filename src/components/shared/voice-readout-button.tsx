"use client";

import React, { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { speakText, stopSpeaking } from "@/lib/voice/speech-synthesis";
import { useLanguage } from "@/context/language-context";

interface VoiceReadoutButtonProps {
  text: string;
  className?: string;
  size?: "sm" | "md";
  title?: string;
}

export function VoiceReadoutButton({
  text,
  className = "",
  size = "md",
  title,
}: VoiceReadoutButtonProps) {
  const { language, t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);

  const handleTogglePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isPlaying) {
      stopSpeaking();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    speakText(text, {
      language,
      onStart: () => setIsPlaying(true),
      onEnd: () => setIsPlaying(false),
      onError: () => setIsPlaying(false),
    });
  };

  const btnClasses =
    size === "sm"
      ? "h-6 w-6 text-[10px] p-1"
      : "h-7 w-7 text-xs p-1.5";

  const iconClasses = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";

  return (
    <button
      type="button"
      onClick={handleTogglePlay}
      title={title || (isPlaying ? t("voice.stopAudio", "Stop audio") : t("voice.listen", "Listen"))}
      className={`rounded-full inline-flex items-center justify-center transition-all ${
        isPlaying
          ? "bg-emerald-700 text-white animate-pulse"
          : "text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 bg-white"
      } ${btnClasses} ${className}`}
      aria-label={t("voice.listen", "Listen to text")}
    >
      {isPlaying ? (
        <VolumeX className={iconClasses} />
      ) : (
        <Volume2 className={iconClasses} />
      )}
    </button>
  );
}
