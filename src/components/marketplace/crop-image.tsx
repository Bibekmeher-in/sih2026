import React from "react";

interface CropImageProps {
  name: string;
  className?: string;
}

export function CropImage({ name, className = "w-full h-44" }: CropImageProps) {
  const lower = name.toLowerCase();

  // Color theme per crop
  let bgGradient = "from-emerald-100 to-emerald-50";
  let iconEmoji = "🥬";
  let accentColor = "text-emerald-800";

  if (lower.includes("tomato") || lower.includes("tamatar")) {
    bgGradient = "from-red-100 via-rose-50 to-red-50";
    iconEmoji = "🍅";
    accentColor = "text-red-700";
  } else if (lower.includes("onion") || lower.includes("pyaaz")) {
    bgGradient = "from-amber-100 via-orange-50 to-purple-50";
    iconEmoji = "🧅";
    accentColor = "text-amber-800";
  } else if (lower.includes("potato") || lower.includes("aloo")) {
    bgGradient = "from-amber-100 via-yellow-50 to-amber-50";
    iconEmoji = "🥔";
    accentColor = "text-amber-900";
  } else if (lower.includes("rice") || lower.includes("chawal") || lower.includes("basmati")) {
    bgGradient = "from-amber-50 via-stone-50 to-emerald-50";
    iconEmoji = "🌾";
    accentColor = "text-amber-800";
  } else if (lower.includes("chilli") || lower.includes("mirchi")) {
    bgGradient = "from-emerald-100 via-green-50 to-lime-50";
    iconEmoji = "🌶️";
    accentColor = "text-emerald-800";
  } else if (lower.includes("cabbage") || lower.includes("gobhi") || lower.includes("patta")) {
    bgGradient = "from-emerald-100 via-teal-50 to-green-50";
    iconEmoji = "🥬";
    accentColor = "text-emerald-800";
  } else if (lower.includes("brinjal") || lower.includes("baingan") || lower.includes("eggplant")) {
    bgGradient = "from-purple-100 via-indigo-50 to-purple-50";
    iconEmoji = "🍆";
    accentColor = "text-purple-800";
  } else if (lower.includes("cauliflower") || lower.includes("phool")) {
    bgGradient = "from-stone-100 via-slate-50 to-emerald-50";
    iconEmoji = "🥦";
    accentColor = "text-emerald-800";
  }

  return (
    <div
      className={`relative flex items-center justify-center bg-gradient-to-br ${bgGradient} overflow-hidden rounded-t-xl select-none ${className}`}
    >
      {/* Decorative background circles */}
      <div className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full bg-white/40 blur-xl pointer-events-none" />
      <div className="absolute -left-6 -top-6 w-24 h-24 rounded-full bg-white/40 blur-xl pointer-events-none" />

      {/* Main Crop Emoji Display */}
      <div className="relative z-10 flex flex-col items-center transform transition-transform group-hover:scale-110 duration-300">
        <span className="text-5xl sm:text-6xl drop-shadow-sm filter">{iconEmoji}</span>
        <span className={`text-[10px] font-bold tracking-wider uppercase mt-1 opacity-70 ${accentColor}`}>
          Direct Farm Gate
        </span>
      </div>
    </div>
  );
}
