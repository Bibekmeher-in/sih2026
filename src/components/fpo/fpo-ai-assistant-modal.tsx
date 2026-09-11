"use client";

import React, { useState } from "react";
import { Bot, Sparkles, X, Send, Loader2, Lightbulb, CheckCircle2, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FpoAiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId?: string;
  groupName?: string;
  cropName?: string;
}

export function FpoAiAssistantModal({
  isOpen,
  onClose,
  groupId,
  groupName,
  cropName,
}: FpoAiAssistantModalProps) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<
    Array<{ role: "user" | "assistant"; text: string; actions?: string[]; isAi?: boolean }>
  >([
    {
      role: "assistant",
      text: `Namaste! I am your KisanDirect Community & Aggregation AI Advisor. Ask me anything about crop pricing, pooling your harvest with fellow farmers, or evaluating bulk buyer requirements${groupName ? ` in ${groupName}` : ""}.`,
      actions: [
        "What are current community market prices?",
        "Should I pool my produce or sell individually?",
        "How does smart buyer matching work?",
      ],
      isAi: true,
    },
  ]);

  if (!isOpen) return null;

  async function handleSend(customText?: string) {
    const textToSend = (customText || query).trim();
    if (!textToSend || loading) return;

    const newChat = [...chatHistory, { role: "user" as const, text: textToSend }];
    setChatHistory(newChat);
    setQuery("");
    setLoading(true);

    try {
      const res = await fetch("/api/fpo/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: textToSend, groupId }),
      });
      const data = await res.json();

      if (data.success && data.reply) {
        setChatHistory([
          ...newChat,
          {
            role: "assistant",
            text: data.reply,
            actions: data.suggestedActions || [],
            isAi: data.isAiGenerated,
          },
        ]);
      } else {
        setChatHistory([
          ...newChat,
          {
            role: "assistant",
            text: data.message || "Could not retrieve AI response at this moment. Please check network.",
            isAi: false,
          },
        ]);
      }
    } catch (err) {
      setChatHistory([
        ...newChat,
        {
          role: "assistant",
          text: "An error occurred connecting to AI assistant service.",
          isAi: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-emerald-100 flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-800 to-teal-900 text-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300 border border-white/10">
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base">KisanDirect Community AI Copilot</h3>
                <span className="flex items-center gap-1 text-[10px] bg-emerald-500/20 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/30">
                  <Sparkles className="h-3 w-3 text-amber-300" /> Grounded in Live Data
                </span>
              </div>
              <p className="text-xs text-emerald-100/80">
                {groupName ? `Context: ${groupName} (${cropName || "Produce"})` : "Community-wide agricultural & pooling intelligence"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Chat Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
          {chatHistory.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="h-8 w-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0 text-emerald-800">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div
                className={`max-w-[82%] rounded-2xl p-4 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-emerald-700 text-white rounded-tr-xs shadow-xs"
                    : "bg-white border border-slate-200/80 text-slate-800 rounded-tl-xs shadow-xs"
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {msg.actions && msg.actions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Lightbulb className="h-3 w-3 text-amber-600" /> Suggested Inquiries
                    </span>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.actions.map((act, actIdx) => (
                        <button
                          key={actIdx}
                          onClick={() => handleSend(act)}
                          disabled={loading}
                          className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/60 rounded-lg px-2.5 py-1 text-left transition-colors font-medium cursor-pointer"
                        >
                          {act}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center text-slate-500 text-xs italic pl-2">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-700" />
              Analyzing community discussions, market prices & pooling lots...
            </div>
          )}
        </div>

        {/* Input Footer */}
        <div className="p-4 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about crop prices, pooling produce, or market demand..."
              className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600 focus:border-transparent"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!query.trim() || loading}
              className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm flex items-center gap-1.5 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span>Ask</span>
            </button>
          </form>
          <div className="mt-2 text-[11px] text-slate-600 flex items-center justify-between px-1">
            <span>Powered by Gemini 2.5 &amp; KISANOVA MongoDB Engine</span>
            <span>Ground-truth community reporting</span>
          </div>
        </div>
      </div>
    </div>
  );
}
