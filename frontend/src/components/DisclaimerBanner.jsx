import React, { useState } from "react";
import { ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";

export default function DisclaimerBanner({ theme = "night" }) {
  const [expanded, setExpanded] = useState(false);
  const isDay = theme === "day";

  return (
    <div className={`backdrop-blur-2xl rounded-2xl p-3.5 text-xs mb-6 transition-all duration-300 ${
      isDay
        ? "bg-[#FCFAF7]/95 border border-[#E7E1D7] hover:border-emerald-700/30 text-stone-800 shadow-[0_2px_12px_rgba(40,30,20,0.03)]"
        : "bg-slate-900/40 border border-emerald-500/20 hover:border-emerald-500/40 text-slate-300 shadow-[0_8px_30px_rgb(0,0,0,0.25)]"
    }`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isDay
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-sm"
              : "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
          }`}>
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className={`font-mono font-semibold tracking-wide text-xs ${
              isDay ? "text-emerald-950 font-bold" : "text-emerald-300"
            }`}>
              MTA 2021 Statutory Protection Standard
            </span>
            <span className={`text-[11px] ml-2 hidden sm:inline ${
              isDay ? "text-stone-600" : "text-slate-400"
            }`}>
              Pre-existing conditions & meters are immutable; normal wear & tear is non-chargeable.
            </span>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className={`text-[11px] font-mono flex items-center gap-1 px-2.5 py-1 rounded-lg transition cursor-pointer ${
            isDay
              ? "text-stone-600 hover:text-emerald-950 hover:bg-stone-100"
              : "text-slate-400 hover:text-emerald-300 hover:bg-white/[0.05]"
          }`}
        >
          <span>{expanded ? "Collapse" : "Details"}</span>
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {expanded && (
        <div className={`mt-3 pt-3 border-t text-[11px] leading-relaxed animate-in fade-in duration-200 ${
          isDay
            ? "border-[#E7E1D7] text-stone-700"
            : "border-white/[0.06] text-slate-400"
        }`}>
          <p>
            Move-in day photographic records establish pre-existing wall marks, appliance condition, and meter counters. 
            Normal wear and tear (natural fading, age-related scuffs) is legally non-chargeable under Model Tenancy Act, 2021 principles.
            <strong className={`ml-1 font-semibold ${
              isDay ? "text-emerald-900" : "text-emerald-300/90"
            }`}>
              DepositGuard records are tamper-evident, not tamper-proof; documentation, not legal advice.
            </strong>
          </p>
        </div>
      )}
    </div>
  );
}
