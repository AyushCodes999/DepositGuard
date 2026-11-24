import React, { useState } from "react";
import { api } from "../api/client";

export default function HashBadge({ inspectionId, lockedHash, lockedAt, theme = "night" }) {
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const isDay = theme === "day";

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const res = await api.verifyInspection(inspectionId);
      setVerificationResult(res);
    } catch (err) {
      setVerificationResult({
        is_tamper_free: false,
        message: err.message || "Failed to verify hash with server."
      });
    } finally {
      setVerifying(false);
    }
  };

  const copyHash = () => {
    if (lockedHash) {
      navigator.clipboard.writeText(lockedHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`backdrop-blur-2xl rounded-2xl p-5 sm:p-6 transition duration-300 ${
      isDay
        ? "bg-white/95 border border-[#E2D9C8] text-stone-900 shadow-md shadow-stone-200/50"
        : "bg-slate-900/40 border border-emerald-500/30 text-slate-200 shadow-xl shadow-emerald-950/20"
    }`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className={`w-9 h-9 rounded-xl font-black text-sm flex items-center justify-center shadow-md ${
            isDay
              ? "bg-emerald-700 text-white shadow-emerald-900/20"
              : "bg-gradient-to-br from-emerald-500 to-teal-400 text-slate-950 shadow-emerald-500/20"
          }`}>
            ✓
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className={`font-bold text-sm ${isDay ? "text-stone-950" : "text-white"}`}>
                Dual-Confirmation Lock Engaged
              </span>
              <span className={`text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full border ${
                isDay
                  ? "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold"
                  : "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
              }`}>
                Immutable Record
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDay ? "text-stone-600" : "text-slate-400"}`}>
              Locked on {lockedAt ? new Date(lockedAt).toLocaleString() : "Confirmed Date"} &bull; SHA-256 Verified
            </p>
          </div>
        </div>

        <button
          onClick={handleVerify}
          disabled={verifying}
          className={`text-xs font-bold px-4 py-2 rounded-xl transition shadow-md self-start sm:self-auto disabled:opacity-50 cursor-pointer ${
            isDay
              ? "bg-stone-900 hover:bg-stone-800 text-white shadow-stone-900/10"
              : "bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-emerald-500/20"
          }`}
        >
          {verifying ? "Computing Hash..." : "Verify Cryptographic Seal"}
        </button>
      </div>

      {/* SHA-256 Hash Display */}
      <div className={`mt-4 pt-3.5 border-t ${isDay ? "border-stone-200" : "border-white/[0.08]"}`}>
        <div className={`flex items-center justify-between text-xs mb-1.5 ${isDay ? "text-stone-600" : "text-slate-400"}`}>
          <span className={`font-mono text-[11px] ${isDay ? "text-stone-700 font-semibold" : "text-slate-300"}`}>
            Canonical SHA-256 Digest:
          </span>
          <button
            onClick={copyHash}
            className={`text-[11px] font-semibold cursor-pointer transition ${
              isDay ? "text-emerald-800 hover:text-emerald-950" : "text-emerald-400 hover:text-emerald-300"
            }`}
          >
            {copied ? "✓ Copied to clipboard!" : "Copy Hash"}
          </button>
        </div>
        <div className={`rounded-xl px-3.5 py-2 font-mono text-[11px] break-all select-all border ${
          isDay
            ? "bg-stone-50 border-stone-200 text-emerald-900 font-semibold"
            : "bg-slate-950/70 border-white/[0.08] text-emerald-300 backdrop-blur-sm"
        }`}>
          {lockedHash}
        </div>
      </div>

      {/* Verification Result Toast/Box */}
      {verificationResult && (
        <div
          className={`mt-3.5 p-3 rounded-xl text-xs border backdrop-blur-md ${
            verificationResult.is_tamper_free
              ? isDay
                ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                : "bg-emerald-500/10 border-emerald-500/40 text-emerald-200"
              : isDay
                ? "bg-rose-50 border-rose-300 text-rose-900"
                : "bg-rose-500/10 border-rose-500/40 text-rose-200"
          }`}
        >
          <div className="flex items-center space-x-2 font-semibold">
            <span>{verificationResult.is_tamper_free ? "✓ INTEGRITY CONFIRMED:" : "⚠️ INTEGRITY ALERT:"}</span>
            <span>{verificationResult.message}</span>
          </div>
          <p className="mt-1 text-[11px] opacity-80 font-mono">
            Verified at {new Date(verificationResult.verified_at).toLocaleTimeString()} &bull; tamper-evident, not tamper-proof
          </p>
        </div>
      )}
    </div>
  );
}
