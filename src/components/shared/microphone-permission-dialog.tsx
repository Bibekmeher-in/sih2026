"use client";

import React, { useState } from "react";
import {
  MicOff,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
  Lock,
  X,
  Keyboard,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/language-context";
import { BrowserSpeechRecognizer } from "@/lib/voice/speech-recognition";

interface MicrophonePermissionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPermissionGranted?: () => void;
  onManualTextSubmit?: (text: string) => void;
}

export function MicrophonePermissionDialog({
  isOpen,
  onClose,
  onPermissionGranted,
  onManualTextSubmit,
}: MicrophonePermissionDialogProps) {
  const { language } = useLanguage();
  const [testingMic, setTestingMic] = useState(false);
  const [testResult, setTestResult] = useState<"SUCCESS" | "STILL_BLOCKED" | null>(null);
  const [manualText, setManualText] = useState("");

  if (!isOpen) return null;

  const handleRequestMic = async () => {
    setTestingMic(true);
    setTestResult(null);

    const res = await BrowserSpeechRecognizer.requestPermission();
    setTestingMic(false);

    if (res.granted) {
      setTestResult("SUCCESS");
      setTimeout(() => {
        if (onPermissionGranted) onPermissionGranted();
        onClose();
      }, 1200);
    } else {
      setTestResult("STILL_BLOCKED");
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualText.trim() && onManualTextSubmit) {
      onManualTextSubmit(manualText.trim());
      setManualText("");
      onClose();
    }
  };

  // Trilingual Text Content
  const title =
    language === "or"
      ? "ମାଇକ୍ରୋଫୋନ୍ ଅନୁମତି ବନ୍ଦ ଅଛି"
      : language === "hi"
      ? "माइक्रोफ़ोन अनुमति अवरुद्ध है"
      : "Microphone Access Blocked";

  const subtitle =
    language === "or"
      ? "ଆପଣଙ୍କ ବ୍ରାଉଜରରେ ମାଇକ୍ରୋଫୋନ୍ ଅନୁମତି ଅନୁମୋଦନ କରନ୍ତୁ ଯାହାଦ୍ୱାରା ଆପଣ କହିପାରିବେ।"
      : language === "hi"
      ? "कृपया ब्राउज़र में माइक्रोफ़ोन की अनुमति दें ताकि आप बोलकर इनपुट दे सकें।"
      : "Your browser has blocked microphone access for this website. Follow the steps below to enable it.";

  const step1 =
    language === "or"
      ? "ବ୍ରାଉଜର ଠିକଣା ବାରରେ (URL) ଥିବା ଲକ୍ (🔒) ବା ସାଇଟ୍ ସେଟିଂ ଆଇକନରେ କ୍ଲିକ୍ କରନ୍ତୁ।"
      : language === "hi"
      ? "ब्राउज़र के एड्रेस बार में लॉक (🔒) या ट्यून (🎛️) आइकन पर क्लिक करें।"
      : "Click the Padlock (🔒) or Site Settings (🎛️) icon on the left of your address bar (URL).";

  const step2 =
    language === "or"
      ? "ମାଇକ୍ରୋଫୋନ୍ (Microphone) ସାମ୍ନାରେ ଥିବା ବିକଳ୍ପକୁ 'Allow' (ଅନୁମତି ଦିଅନ୍ତୁ) କରନ୍ତୁ।"
      : language === "hi"
      ? "Microphone (माइक्रोफ़ोन) को 'Block' से बदलकर 'Allow' (अनुमति दें) करें।"
      : "Change 'Microphone' from 'Block' to 'Allow'.";

  const step3 =
    language === "or"
      ? "ନିମ୍ନରେ ଥିବା 'ମାଇକ୍ ଯାଞ୍ଚ କରନ୍ତୁ' ବଟନ୍ ଦବାନ୍ତୁ।"
      : language === "hi"
      ? "नीचे दिए गए 'माइक चालू करें' बटन पर क्लिक करें।"
      : "Click 'Test & Enable Microphone' below.";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-rose-100 bg-rose-50/60">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <MicOff className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-rose-800 font-medium">
                {language === "or" ? "ସହଜ ୩-ପଦକ୍ଷେପ ସମାଧାନ" : language === "hi" ? "आसान 3-स्टेप समाधान" : "Quick 3-step fix"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Instructions Body */}
        <div className="p-6 space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">{subtitle}</p>

          {/* Visual Step Guide */}
          <div className="space-y-2.5 rounded-2xl bg-slate-50 border border-slate-200 p-4">
            <div className="flex items-start gap-3">
              <span className="h-6 w-6 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-xs shrink-0">
                1
              </span>
              <div className="space-y-1">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-slate-600" />
                  <span>{step1}</span>
                </span>
                <p className="text-[11px] text-slate-500 font-mono">
                  Browser URL bar &rarr; Look next to &ldquo;localhost:3000&rdquo;
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-2 border-t border-slate-200/60">
              <span className="h-6 w-6 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-xs shrink-0">
                2
              </span>
              <div className="space-y-1">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-slate-600" />
                  <span>{step2}</span>
                </span>
                <p className="text-[11px] text-slate-500">
                  Select: <strong>Microphone &rarr; Allow</strong>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-2 border-t border-slate-200/60">
              <span className="h-6 w-6 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-xs shrink-0">
                3
              </span>
              <div>
                <span className="font-bold text-slate-900">{step3}</span>
              </div>
            </div>
          </div>

          {/* Feedback message */}
          {testResult === "SUCCESS" && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>
                {language === "or"
                  ? "ମାଇକ୍ରୋଫୋନ୍ ସଫଳତାର ସହ ଅନୁମତି ମିଳିଲା!"
                  : language === "hi"
                  ? "माइक्रोफ़ोन सफलतापूर्वक सक्षम हो गया है!"
                  : "Microphone access successfully granted!"}
              </span>
            </div>
          )}

          {testResult === "STILL_BLOCKED" && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
              <span>
                {language === "or"
                  ? "ମାଇକ୍ରୋଫୋନ୍ ଏବେ ମଧ୍ୟ ବନ୍ଦ ଅଛି। ଦୟାକରି URL ବାରରେ ଥିବା ଲକ୍ (🔒) ଆଇକନରେ 'Allow' କରନ୍ତୁ ଏବଂ ପେଜ୍ ରିଲୋଡ୍ କରନ୍ତୁ।"
                  : language === "hi"
                  ? "माइक्रोफ़ोन अभी भी ब्लॉक है। कृपया URL बार में लॉक (🔒) आइकन पर 'Allow' चुनें और पेज रीलोड करें।"
                  : "Microphone is still blocked. Please ensure 'Allow' is selected in the address bar lock icon, then reload."}
              </span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
            <Button
              type="button"
              onClick={handleRequestMic}
              disabled={testingMic}
              className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl py-2.5 shadow-xs flex items-center justify-center gap-1.5"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${testingMic ? "animate-spin" : ""}`} />
              <span>
                {testingMic
                  ? "Checking..."
                  : language === "or"
                  ? "ମାଇକ୍ ଅନୁମତି ଯାଞ୍ଚ କରନ୍ତୁ"
                  : language === "hi"
                  ? "माइक अनुमति जांचें"
                  : "Test & Enable Microphone"}
              </span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => window.location.reload()}
              className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs rounded-xl"
            >
              {language === "or" ? "ପେଜ୍ ରିଲୋଡ୍ କରନ୍ତୁ" : language === "hi" ? "पेज रीलोड करें" : "Reload Page"}
            </Button>
          </div>

          {/* Manual Input Fallback */}
          {onManualTextSubmit && (
            <div className="pt-3 border-t border-slate-200">
              <div className="flex items-center gap-1.5 text-slate-700 font-semibold mb-2">
                <Keyboard className="h-3.5 w-3.5 text-slate-500" />
                <span>
                  {language === "or"
                    ? "କିମ୍ବା ଟାଇପ୍ କରି ଲେଖନ୍ତୁ:"
                    : language === "hi"
                    ? "या सीधे टाइप करें:"
                    : "Or enter text manually:"}
                </span>
              </div>
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder={
                    language === "or"
                      ? "ଏଠାରେ ଲେଖନ୍ତୁ..."
                      : language === "hi"
                      ? "यहाँ लिखें..."
                      : "Type your query here..."
                  }
                  className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-600 outline-none"
                />
                <Button
                  type="submit"
                  disabled={!manualText.trim()}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl px-4"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
