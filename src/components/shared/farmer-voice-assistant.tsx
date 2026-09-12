"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  Volume2,
  X,
  Sparkles,
  Search,
  ArrowRight,
  TrendingUp,
  Package,
  HelpCircle,
  VolumeX,
  Lock,
  RotateCcw,
  SlidersHorizontal,
  Keyboard,
} from "lucide-react";
import { BrowserSpeechRecognizer } from "@/lib/voice/speech-recognition";
import { speakText, stopSpeaking } from "@/lib/voice/speech-synthesis";
import { useLanguage } from "@/context/language-context";
import { Button } from "@/components/ui/button";

export function FarmerVoiceAssistant() {
  const router = useRouter();
  const { language, t } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [spokenText, setSpokenText] = useState("");
  const [manualInputQuery, setManualInputQuery] = useState("");
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [responseMessage, setResponseMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recognizerRef = useRef<BrowserSpeechRecognizer | null>(null);

  useEffect(() => {
    return () => {
      if (recognizerRef.current) {
        recognizerRef.current.abort();
      }
      stopSpeaking();
    };
  }, []);

  const assistantTitle =
    language === "or"
      ? "କୃଷକ ସହାୟକ"
      : language === "hi"
        ? "किसान मित्र"
        : "Farmer Assistant";

  const assistantSubtitle =
    language === "or"
      ? "ଓଡ଼ିଆରେ କହି ପ୍ରଶ୍ନ ପଚାରନ୍ତୁ ବା ଖୋଜନ୍ତୁ"
      : language === "hi"
        ? "हिंदी में बोलकर भाव पूछें या फसल खोजें"
        : "Speak in your native language to search or ask prices";

  const handleStartListening = () => {
    stopSpeaking();
    setIsPlayingAudio(false);
    setErrorMessage(null);
    setSpokenText("");

    const recognizer = new BrowserSpeechRecognizer({
      language,
      continuous: false,
      interimResults: true,
      onStart: () => {
        setIsListening(true);
      },
      onResult: (text: string, isFinal: boolean) => {
        setSpokenText(text);
        if (isFinal) {
          setIsListening(false);
          processVoiceQuery(text);
        }
      },
      onError: (err: string) => {
        setIsListening(false);
        setErrorMessage(err);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });

    recognizerRef.current = recognizer;
    recognizer.start();
  };

  const handleStopListening = () => {
    if (recognizerRef.current) {
      recognizerRef.current.stop();
    }
    setIsListening(false);
  };

  const handleRetryPermission = async () => {
    setIsTestingMic(true);
    setErrorMessage(null);
    const res = await BrowserSpeechRecognizer.requestPermission();
    setIsTestingMic(false);
    if (res.granted) {
      handleStartListening();
    } else {
      setErrorMessage("Microphone access blocked. Please allow microphone permission in your browser.");
    }
  };

  const processVoiceQuery = (query: string) => {
    const q = query.toLowerCase();

    // 1. Mandi Price inquiry (Odia/Hindi/English)
    if (
      q.includes("ଦର") ||
      q.includes("ଭାବ") ||
      q.includes("ଭାଓ") ||
      q.includes("भाव") ||
      q.includes("rate") ||
      q.includes("price") ||
      q.includes("କେତେ") ||
      q.includes("କେତେ ଟଙ୍କା")
    ) {
      let crop = "ଟମାଟୋ";
      let price = "₹32";
      if (q.includes("ଆଳୁ") || q.includes("आलू") || q.includes("potato")) {
        crop = language === "or" ? "ଆଳୁ" : language === "hi" ? "आलू" : "Potato";
        price = "₹24";
      } else if (q.includes("ପିଆଜ") || q.includes("प्याज") || q.includes("onion")) {
        crop = language === "or" ? "ପିଆଜ" : language === "hi" ? "प्याज" : "Onion";
        price = "₹35";
      } else if (q.includes("ବାଇଗଣ") || q.includes("बैंगन") || q.includes("brinjal")) {
        crop = language === "or" ? "ବାଇଗଣ" : language === "hi" ? "बैंगन" : "Brinjal";
        price = "₹28";
      } else if (q.includes("ଚାଉଳ") || q.includes("चावल") || q.includes("rice")) {
        crop = language === "or" ? "ବାସମତୀ ଚାଉଳ" : language === "hi" ? "बासमती चावल" : "Basmati Rice";
        price = "₹85";
      }

      const answer =
        language === "or"
          ? `ଆଜି ଭୁବନେଶ୍ୱର ମଣ୍ଡିରେ ${crop}ର ହାରାହାରି ଦର ${price} ପ୍ରତି କିଲୋ ଅଛି। କିଷାନୋଭାରେ ଆପଣ ୨୮% ଅଧିକ ଲାଭ ପାଇପାରିବେ।`
          : language === "hi"
            ? `आज मंडी में ${crop} का औसत भाव ${price} प्रति किलो है। किसानोवा पर आप 28% अधिक लाभ प्राप्त कर सकते हैं।`
            : `Today's mandi benchmark for ${crop} is ${price} per kg. On Kisanova, you can realize up to +28% premium directly.`;

      setResponseMessage(answer);
      playVoice(answer);
      return;
    }

    // 2. Navigation: Marketplace / Search
    if (
      q.includes("ଖୋଜ") ||
      q.includes("ଦେଖାଅ") ||
      q.includes("खोज") ||
      q.includes("दिखाओ") ||
      q.includes("search") ||
      q.includes("market") ||
      q.includes("ବଜାର")
    ) {
      const answer =
        language === "or"
          ? "ବଜାରକୁ ନେଇଯାଉଛି, ଆପଣ ଫସଲଗୁଡ଼ିକ ଦେଖିପାରିବେ।"
          : language === "hi"
            ? "बाज़ार खोला जा रहा है, आप फसलें देख सकते हैं।"
            : "Opening marketplace to browse produce.";

      setResponseMessage(answer);
      playVoice(answer);
      setTimeout(() => {
        setIsOpen(false);
        router.push("/marketplace");
      }, 1800);
      return;
    }

    // 3. Navigation: Orders
    if (
      q.includes("ଅର୍ଡର") ||
      q.includes("ऑर्डर") ||
      q.includes("order") ||
      q.includes("କିଣିବା")
    ) {
      const answer =
        language === "or"
          ? "ଆପଣଙ୍କ ଅର୍ଡର ପୃଷ୍ଠା ଖୋଲାଯାଉଛି।"
          : language === "hi"
            ? "आपके ऑर्डर का पृष्ठ खोला जा रहा है।"
            : "Navigating to your orders.";

      setResponseMessage(answer);
      playVoice(answer);
      setTimeout(() => {
        setIsOpen(false);
        router.push("/consumer");
      }, 1500);
      return;
    }

    // 4. Default helpful answer
    const fallbackAnswer =
      language === "or"
        ? `ଆପଣ କହିଲେ: "${query}"। ଆପଣ ଫସଲ ତାଲିକାଭୁକ୍ତ କରିବାକୁ କିମ୍ବା ବଜାର ଖୋଜିବାକୁ ଚାହୁଁଛନ୍ତି କି?`
        : language === "hi"
          ? `आपने कहा: "${query}"। क्या आप फसल सूचीबद्ध करना चाहते हैं या बाज़ार में खोजना चाहते हैं?`
          : `You said: "${query}". Would you like to search the marketplace or check mandi price?`;

    setResponseMessage(fallbackAnswer);
    playVoice(fallbackAnswer);
  };

  const playVoice = (text: string) => {
    setIsPlayingAudio(true);
    speakText(text, {
      language,
      onStart: () => setIsPlayingAudio(true),
      onEnd: () => setIsPlayingAudio(false),
      onError: () => setIsPlayingAudio(false),
    });
  };

  return (
    <>
      {/* FLOATING ACTION BUTTON */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2 pl-3.5 pr-4 py-2.5 rounded-full bg-gradient-to-r from-emerald-700 to-emerald-800 text-white font-bold text-xs shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all ring-4 ring-emerald-500/20"
          aria-label={assistantTitle}
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
          </span>
          <div className="flex items-center gap-1.5">
            <Mic className="h-4 w-4 text-emerald-200" />
            <span className="tracking-tight">{assistantTitle}</span>
          </div>
        </button>
      </div>

      {/* VOICE ASSISTANT MODAL DIALOG */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 relative">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-none">
                    {assistantTitle}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1">
                    {assistantSubtitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  stopSpeaking();
                  handleStopListening();
                  setIsOpen(false);
                }}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Central Animated Listening Circle */}
            <div className="py-4 flex flex-col items-center justify-center text-center space-y-3">
              <div className="relative">
                {isListening && (
                  <div className="absolute inset-0 rounded-full bg-rose-400/30 animate-ping"></div>
                )}
                <button
                  type="button"
                  onClick={isListening ? handleStopListening : handleStartListening}
                  className={`relative h-20 w-20 rounded-full flex items-center justify-center shadow-lg transition-all ${isListening
                      ? "bg-rose-600 text-white ring-8 ring-rose-400/40 animate-pulse"
                      : "bg-emerald-700 hover:bg-emerald-800 text-white ring-8 ring-emerald-500/20"
                    }`}
                >
                  <Mic className="h-8 w-8" />
                </button>
              </div>

              <div className="text-xs font-bold text-slate-800">
                {isListening ? (
                  <span className="text-rose-600 animate-pulse">
                    {language === "or"
                      ? "ଶୁଣୁଛି... ଏବେ କୁହନ୍ତୁ"
                      : language === "hi"
                        ? "सुन रहे हैं... अब बोलें"
                        : "Listening... Speak now"}
                  </span>
                ) : (
                  <span>
                    {language === "or"
                      ? "ମାଇକ୍ ଛୁଇଁ କୁହନ୍ତୁ"
                      : language === "hi"
                        ? "माइक दबाकर बोलें"
                        : "Tap microphone to speak"}
                  </span>
                )}
              </div>

              {/* Transcribed User Speech */}
              {spokenText && (
                <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 max-w-xs font-medium">
                  &ldquo;{spokenText}&rdquo;
                </div>
              )}
            </div>

            {/* AI Voice Response Output */}
            {responseMessage && (
              <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/90 text-xs text-emerald-950 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    <span>
                      {language === "or"
                        ? "ସହାୟକଙ୍କ ଉତ୍ତର"
                        : language === "hi"
                          ? "सहायक का उत्तर"
                          : "Assistant Response"}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => playVoice(responseMessage)}
                    className="p-1 rounded-lg text-emerald-700 hover:bg-emerald-100 flex items-center gap-1 text-[11px] font-bold"
                  >
                    {isPlayingAudio ? (
                      <>
                        <VolumeX className="h-3.5 w-3.5 animate-pulse" />
                        <span>ବନ୍ଦ କରନ୍ତୁ</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="h-3.5 w-3.5" />
                        <span>ଶୁଣନ୍ତୁ</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="leading-relaxed">{responseMessage}</p>
              </div>
            )}

            {errorMessage && (
              <div className="space-y-2 rounded-2xl bg-rose-50/80 border border-rose-200 p-3 text-xs text-rose-900">
                <div className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Lock className="h-3 w-3" />
                  </div>
                  <div className="space-y-1">
                    <span className="font-bold block">
                      {language === "or"
                        ? "ମାଇକ୍ରୋଫୋନ୍ ଅନୁମତି ବନ୍ଦ ଅଛି"
                        : language === "hi"
                          ? "माइक्रोफ़ोन अनुमति ब्लॉक है"
                          : "Microphone Permission Blocked"}
                    </span>
                    <p className="text-[11px] text-rose-800 leading-snug">
                      {language === "or"
                        ? "ବ୍ରାଉଜର ଠିକଣା ବାରରେ (URL) ଥିବା ଲକ୍ (🔒) ଆଇକନରେ କ୍ଲିକ୍ କରି Microphone କୁ 'Allow' କରନ୍ତୁ।"
                        : language === "hi"
                          ? "ब्राउज़र के एड्रेस बार में लॉक (🔒) आइकन पर क्लिक करके Microphone को 'Allow' करें।"
                          : "Click the lock icon (🔒) on the left of your browser address bar and switch Microphone to 'Allow'."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleRetryPermission}
                    disabled={isTestingMic}
                    className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className={`h-3 w-3 ${isTestingMic ? "animate-spin" : ""}`} />
                    <span>
                      {isTestingMic
                        ? "Checking..."
                        : language === "or"
                          ? "ଅନୁମତି ପରୀକ୍ଷା କରନ୍ତୁ"
                          : language === "hi"
                            ? "अनुमति जांचें"
                            : "Test & Allow Microphone"}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-[11px] transition-colors cursor-pointer"
                  >
                    {language === "or" ? "ରିଲୋଡ୍" : language === "hi" ? "रीलोड" : "Reload"}
                  </button>
                </div>
              </div>
            )}

            {/* Manual Typing Fallback */}
            <div className="pt-2 border-t border-slate-100">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (manualInputQuery.trim()) {
                    processVoiceQuery(manualInputQuery.trim());
                    setManualInputQuery("");
                  }
                }}
                className="flex items-center gap-1.5"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={manualInputQuery}
                    onChange={(e) => setManualInputQuery(e.target.value)}
                    placeholder={
                      language === "or"
                        ? "କିମ୍ବା ଟାଇପ୍ କରି ପଚାରନ୍ତୁ..."
                        : language === "hi"
                          ? "या सीधे टाइप करके पूछें..."
                          : "Or type your question here..."
                    }
                    className="w-full rounded-xl border border-slate-200 pl-3 pr-8 py-1.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                  <Keyboard className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                </div>
                <button
                  type="submit"
                  disabled={!manualInputQuery.trim()}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>

            {/* Quick Voice Prompt Chips */}
            <div className="space-y-1.5 pt-1 border-t border-slate-100">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {language === "or"
                  ? "ଏହିପରି କୁହନ୍ତୁ (ଉଦାହରଣ):"
                  : language === "hi"
                    ? "ऐसे बोलें (उदाहरण):"
                    : "Quick Voice Examples:"}
              </div>
              <div className="flex flex-wrap gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => processVoiceQuery(language === "or" ? "ଟମାଟୋ ଦର କେତେ?" : "टमाटर का भाव?")}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-slate-200 text-slate-700 transition-colors text-[11px] font-medium"
                >
                  {language === "or"
                    ? "🍅 ଟମାଟୋ ଦର କେତେ?"
                    : language === "hi"
                      ? "🍅 टमाटर का भाव?"
                      : "🍅 Tomato Price?"}
                </button>
                <button
                  type="button"
                  onClick={() => processVoiceQuery(language === "or" ? "ଆଳୁ ଖୋଜନ୍ତୁ" : "आलू खोजें")}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-slate-200 text-slate-700 transition-colors text-[11px] font-medium"
                >
                  {language === "or"
                    ? "🥔 ଆଳୁ ଦେଖାଅ"
                    : language === "hi"
                      ? "🥔 आलू दिखाओ"
                      : "🥔 Show Potatoes"}
                </button>
                <button
                  type="button"
                  onClick={() => processVoiceQuery(language === "or" ? "ବଜାର ଦେଖାଅ" : "बाज़ार देखें")}
                  className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-slate-200 text-slate-700 transition-colors text-[11px] font-medium"
                >
                  {language === "or"
                    ? "🏪 ଫସଲ ବଜାର"
                    : language === "hi"
                      ? "🏪 मंडी बाज़ार"
                      : "🏪 Marketplace"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
