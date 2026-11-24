import React, { useState, useRef, useEffect } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import BrandLogo from "./BrandLogo";
import { Send, X, Scale, Sparkles, ShieldCheck, RefreshCw, Bot } from "lucide-react";

export default function GuardBotWidget({ theme: propTheme }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "model",
      content:
        "Hello! I am GuardBot, your neutral guide for rental inspections and deposit protection under Indian tenancy standards (Model Tenancy Act principles). Ask me about normal wear vs damage, meter readings, or drafting polite handover notices."
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState(null);
  const [activeModel, setActiveModel] = useState("GuardBot AI");

  // Determine active theme (day / night)
  const [activeTheme, setActiveTheme] = useState(() => {
    if (propTheme) return propTheme;
    try {
      return localStorage.getItem("depositguard_dashboard_theme") || "night";
    } catch {
      return "night";
    }
  });

  useEffect(() => {
    if (propTheme) {
      setActiveTheme(propTheme);
    }
  }, [propTheme]);

  // Listen for storage theme changes as fallback
  useEffect(() => {
    const handleStorage = () => {
      try {
        const stored = localStorage.getItem("depositguard_dashboard_theme");
        if (stored) setActiveTheme(stored);
      } catch { }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const isDay = activeTheme === "day";

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const modalRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, loading]);

  // Focus trap & Escape key accessibility
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSend = async (messageToSend = null, isRetry = false) => {
    if (loading) return;
    const text = (messageToSend !== null ? messageToSend : input).trim();
    if (!text) return;

    // Reset error state
    setErrorState(null);

    let currentMessages = messages;
    if (!isRetry) {
      currentMessages = [...messages, { role: "user", content: text }];
      setMessages(currentMessages);
      setInput("");
    }
    setLoading(true);

    // Format history (last 10 turns for server)
    const historyPayload = currentMessages.slice(-10).map((m) => ({
      role: m.role,
      content: m.content
    }));

    try {
      const res = await api.guardbotChat(text, historyPayload);
      setMessages((prev) => [...prev, { role: "model", content: res.reply }]);
      if (res.model_used) {
        setActiveModel(res.model_used);
      }
    } catch (err) {
      const rawCode =
        err.errorCode ||
        (err.status === 429
          ? "rate_limited"
          : err.status === 504
            ? "timeout"
            : "upstream_unavailable");
      const code = rawCode === "unknown_error" ? "upstream_unavailable" : rawCode;
      let message = "An error occurred while contacting GuardBot.";

      if (code === "invalid_input") {
        message =
          "Input is too short, lacks letters, or looks like keyboard mash. Please enter a readable question.";
      } else if (code === "rate_limited") {
        message =
          "Rate limit reached (20 requests per minute). Please wait a moment before asking again.";
      } else if (code === "timeout") {
        message = "The request timed out after 20 seconds. Please check your connection and retry.";
      } else if (code === "upstream_unavailable") {
        message = "AI service is currently offline or the Gemini API key is not configured.";
      }

      setErrorState({
        code,
        message,
        lastInput: text
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (loading) return;
    if (errorState?.lastInput) {
      const textToRetry = errorState.lastInput;
      handleSend(textToRetry, true);
    }
  };

  const promptSuggestions = [
    "Is faded wall paint normal wear & tear?",
    "How to document electricity meter readings on Day 1?",
    "Under MTA 2021, who pays for minor plumbing repair?",
    "Draft a neutral notice requesting deposit refund."
  ];

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen ? (
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-label="GuardBot Rental Assistant"
          className={`rounded-3xl w-80 sm:w-96 md:w-[430px] p-4 flex flex-col h-[540px] max-h-[86vh] transition-all duration-300 backdrop-blur-2xl border ${isDay
            ? "bg-[#FCFAF7]/95 border-[#E7E1D7] text-stone-900 shadow-[0_24px_60px_-12px_rgba(40,30,20,0.18)] ring-1 ring-stone-900/5"
            : "bg-[#0B101B]/95 border-white/[0.12] text-slate-100 shadow-[0_25px_70px_rgba(0,0,0,0.65)] ring-1 ring-emerald-500/20"
            }`}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between pb-3.5 mb-2.5 border-b transition-colors ${isDay ? "border-[#EAE3D6]" : "border-white/[0.08]"
              }`}
          >
            <div className="flex items-center space-x-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-xs transition-colors ${isDay
                  ? "bg-emerald-50 border-emerald-200/90 text-emerald-800"
                  : "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                  }`}
              >
                <BrandLogo variant="icon" className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${isDay ? "bg-emerald-600" : "bg-emerald-400 animate-pulse"
                      }`}
                  />
                  <h4
                    className={`text-sm font-extrabold tracking-tight ${isDay ? "text-stone-900 font-sans" : "text-white font-sans"
                      }`}
                  >
                    GuardBot{" "}
                    <span
                      className={
                        isDay
                          ? "font-serif italic font-normal text-emerald-800"
                          : "font-serif italic font-normal text-emerald-400"
                      }
                    >
                      AI Concierge
                    </span>
                  </h4>
                </div>
                <span
                  className={`text-[9.5px] font-mono tracking-wider uppercase font-semibold ${isDay ? "text-stone-500" : "text-slate-400"
                    }`}
                >
                  Model Tenancy Act &bull; Grounded
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${isDay
                  ? "bg-emerald-50 text-emerald-950 border-emerald-200/90 shadow-xs"
                  : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                  }`}
              >
                {activeModel}
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className={`w-7 h-7 rounded-full flex items-center justify-center border transition cursor-pointer ${isDay
                  ? "bg-stone-100 hover:bg-stone-200 text-stone-600 hover:text-stone-900 border-stone-300/80 shadow-xs"
                  : "bg-white/[0.06] hover:bg-white/[0.12] text-slate-400 hover:text-white border-white/[0.08]"
                  }`}
                aria-label="Close GuardBot window"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Neutral Statutory Notice Bar */}
          <div
            className={`text-[11px] rounded-xl px-3 py-1.5 mb-2.5 flex items-center justify-between transition-colors border ${isDay
              ? "bg-[#FDFBF7] border-[#E9E2D5] text-stone-700 shadow-xs"
              : "bg-white/[0.03] border-white/[0.08] text-slate-300"
              }`}
          >
            <div className="flex items-center gap-1.5">
              <Scale
                className={`w-3.5 h-3.5 shrink-0 ${isDay ? "text-emerald-800" : "text-emerald-400"
                  }`}
              />
              <span className="font-medium">Statutory MTA 2021 Guidance</span>
            </div>
            <span
              className={`text-[10px] font-mono font-medium ${isDay ? "text-stone-500" : "text-slate-400"
                }`}
            >
              Tamper-Evident Proof
            </span>
          </div>

          {/* Messages Container */}
          <div
            aria-live="polite"
            className={`flex-1 overflow-y-auto space-y-3.5 p-3 rounded-2xl border text-xs scrollbar-thin transition-colors ${isDay
              ? "bg-[#F8F5EE]/75 border-[#E5DFD5] text-stone-800"
              : "bg-black/35 border-white/[0.07] text-slate-100"
              }`}
          >
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl p-3.5 leading-relaxed text-[12.5px] transition-all ${m.role === "user"
                    ? isDay
                      ? "bg-stone-900 text-stone-100 rounded-tr-xs shadow-md shadow-stone-900/10 font-medium"
                      : "bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-xs shadow-lg shadow-emerald-950/40 font-medium"
                    : isDay
                      ? "bg-[#FCFAF7] border border-[#E2DBD0] text-stone-800 rounded-tl-xs shadow-[0_2px_8px_rgba(40,30,20,0.04)]"
                      : "bg-slate-900/90 border border-white/[0.08] text-slate-200 rounded-tl-xs shadow-sm"
                    }`}
                >
                  {m.role === "model" && (
                    <div
                      className={`flex items-center gap-1.5 mb-1 text-[10px] font-mono uppercase tracking-wider font-bold ${isDay ? "text-emerald-900" : "text-emerald-400"
                        }`}
                    >
                      <ShieldCheck className="w-3 h-3" />
                      <span>DepositGuard Advisor</span>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div
                  className={`rounded-2xl px-4 py-3 text-xs flex items-center space-x-2.5 border transition-colors ${isDay
                    ? "bg-[#FCFAF7] border-[#E2DBD0] text-stone-700 shadow-xs"
                    : "bg-slate-900/90 border-white/[0.08] text-slate-300"
                    }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full animate-bounce ${isDay ? "bg-emerald-700" : "bg-emerald-400"
                      }`}
                  />
                  <span
                    className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:0.2s] ${isDay ? "bg-emerald-700" : "bg-emerald-400"
                      }`}
                  />
                  <span
                    className={`w-1.5 h-1.5 rounded-full animate-bounce [animation-delay:0.4s] ${isDay ? "bg-emerald-700" : "bg-emerald-400"
                      }`}
                  />
                  <span
                    className={`text-[11px] font-mono ${isDay ? "text-emerald-900 font-semibold" : "text-emerald-400"
                      }`}
                  >
                    Analyzing tenancy standards...
                  </span>
                </div>
              </div>
            )}

            {/* Error State UI */}
            {errorState && (
              <div
                className={`rounded-2xl p-3.5 text-xs space-y-2 border ${isDay
                  ? "bg-rose-50 border-rose-200 text-rose-900"
                  : "bg-rose-950/60 border-rose-500/30 text-rose-200"
                  }`}
              >
                <div className="flex items-center space-x-2 font-bold text-rose-600">
                  <span>⚠️</span>
                  <span className="uppercase text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                    {errorState.code}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed">{errorState.message}</p>
                <div className="flex items-center space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={handleRetry}
                    disabled={loading}
                    className="text-[11px] font-bold bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded-lg transition disabled:opacity-50 cursor-pointer shadow-xs flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retry Prompt</span>
                  </button>
                  <span className="text-[10px] opacity-75 truncate max-w-[180px]">
                    Kept: &ldquo;{errorState.lastInput}&rdquo;
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Refined Tactile Suggestion Chips */}
          {messages.length <= 2 && (
            <div className="py-2.5">
              <div
                className={`text-[10px] font-mono uppercase tracking-wider font-semibold mb-1.5 px-0.5 ${isDay ? "text-stone-500" : "text-slate-400"
                  }`}
              >
                Recommended Inquiries
              </div>
              <div className="flex flex-col gap-1.5">
                {promptSuggestions.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    disabled={loading}
                    onClick={() => handleSend(s)}
                    className={`text-[11px] font-medium px-3 py-1.5 rounded-xl border transition-all duration-200 text-left flex items-center gap-2 group disabled:opacity-50 cursor-pointer ${isDay
                      ? "bg-white hover:bg-[#F3EFE6] text-stone-800 border-[#DDD5C7] hover:border-emerald-700/60 shadow-xs hover:shadow-sm"
                      : "bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border-white/[0.08] hover:border-emerald-400/40"
                      }`}
                  >
                    <Sparkles
                      className={`w-3 h-3 shrink-0 transition-transform group-hover:scale-110 ${isDay ? "text-emerald-800" : "text-emerald-400"
                        }`}
                    />
                    <span className="truncate">{s}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className={`mt-2.5 pt-2.5 border-t flex gap-2 items-center transition-colors ${isDay ? "border-[#EAE3D6]" : "border-white/[0.08]"
              }`}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                loading
                  ? "GuardBot is analyzing..."
                  : "Ask GuardBot about deposit deductions, repairs..."
              }
              disabled={loading}
              className={`flex-1 rounded-xl px-3.5 py-2.5 text-xs font-sans transition disabled:opacity-50 focus:outline-none ${isDay
                ? "bg-white border border-[#D5CDC1] text-stone-900 placeholder-stone-400 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/15 shadow-inner"
                : "bg-slate-950/70 border border-white/[0.12] text-slate-100 placeholder-slate-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 shadow-inner"
                }`}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className={`text-xs font-bold px-4 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${isDay
                ? "bg-stone-900 hover:bg-stone-800 text-stone-100 shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                : "bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-md shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98]"
                }`}
            >
              <span>{loading ? "..." : "Send"}</span>
              <Send className="w-3 h-3 stroke-[2.5]" />
            </button>
          </form>
        </div>
      ) : (
        /* Floating Minimized Pill Trigger */
        <button
          onClick={() => setIsOpen(true)}
          className={`flex items-center space-x-2.5 px-4.5 py-2.5 rounded-full border transition-all duration-300 transform hover:-translate-y-0.5 select-none cursor-pointer group shadow-xl ${isDay
            ? "bg-[#FCFAF7]/95 hover:bg-white text-stone-900 border-[#DDD5C7] hover:border-emerald-700/60 shadow-[0_12px_32px_rgba(40,30,20,0.12)] hover:shadow-[0_16px_36px_rgba(40,30,20,0.16)]"
            : "bg-[#0B101B]/95 hover:bg-slate-900 text-white border-white/[0.15] hover:border-emerald-500/50 shadow-[0_12px_32px_rgba(0,0,0,0.6)]"
            }`}
          aria-label="Open GuardBot AI Assistant"
        >
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center border shadow-xs transition-colors ${isDay
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
              }`}
          >
            <BrandLogo variant="icon" className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold tracking-tight">
            GuardBot{" "}
            <span
              className={
                isDay
                  ? "font-serif italic font-normal text-emerald-800"
                  : "font-serif italic font-normal text-emerald-400"
              }
            >
              AI
            </span>
          </span>
          <span
            className={`w-2 h-2 rounded-full ${isDay ? "bg-emerald-600" : "bg-emerald-400 animate-pulse"
              }`}
          />
        </button>
      )}
    </div>
  );
}
