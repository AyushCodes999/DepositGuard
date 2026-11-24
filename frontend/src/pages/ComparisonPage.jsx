import React, { useState, useEffect } from "react";
import { api } from "../api/client";
import DisclaimerBanner from "../components/DisclaimerBanner";

export default function ComparisonPage({ propertyId, moveOutInspectionId, onNavigate, theme = "night" }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [property, setProperty] = useState(null);
  const [moveInInspection, setMoveInInspection] = useState(null);
  const [moveOutInspection, setMoveOutInspection] = useState(null);
  const [comparisons, setComparisons] = useState([]);
  const [runningAI, setRunningAI] = useState(false);

  const isDay = theme === "day";

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");

        if (!propertyId) {
          setError("No property selected for comparison.");
          return;
        }

        const propData = await api.getProperty(propertyId);
        setProperty(propData);

        const inspections = await api.listInspectionsForProperty(propertyId);
        const lockedIn = inspections.find((i) => i.type === "move_in" && i.status === "locked");
        setMoveInInspection(lockedIn || null);

        let outInsp = null;
        if (moveOutInspectionId) {
          outInsp = inspections.find((i) => i.id === moveOutInspectionId);
        } else {
          outInsp = inspections.find((i) => i.type === "move_out");
        }
        setMoveOutInspection(outInsp || null);

        if (outInsp) {
          const stored = await api.getStoredComparisons(outInsp.id);
          setComparisons(stored || []);
        }
      } catch (err) {
        if (err.status === 401) {
          onNavigate("auth", { initialMode: "login" });
          return;
        }
        setError(err.message || "Failed to load comparison data.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [propertyId, moveOutInspectionId]);

  const handleRunAIComparison = async () => {
    if (!moveOutInspection) return;
    setRunningAI(true);
    try {
      const res = await api.runComparison(moveOutInspection.id);
      setComparisons(res.results || []);
    } catch (err) {
      alert(err.message || "Failed to run AI comparison.");
    } finally {
      setRunningAI(false);
    }
  };

  if (loading) {
    return (
      <div className={`max-w-7xl mx-auto px-4 py-16 text-center ${isDay ? "text-stone-600" : "text-slate-400"}`}>
        <div className={`inline-block animate-spin w-8 h-8 border-2 border-t-transparent rounded-full mb-3 ${
          isDay ? "border-emerald-700" : "border-emerald-500"
        }`}></div>
        <p className="text-xs font-medium">Loading before/after comparison records...</p>
      </div>
    );
  }

  if (error || !moveInInspection) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <div className={`rounded-2xl p-8 border ${
          isDay
            ? "bg-white/95 border-[#E2D9C8] text-stone-900 shadow-md"
            : "bg-slate-900 border border-slate-800 text-slate-300"
        }`}>
          <div className="text-3xl mb-3">⚠️</div>
          <h3 className={`text-base font-bold mb-2 ${isDay ? "text-stone-950" : "text-white"}`}>
            Locked Move-In Record Required
          </h3>
          <p className={`text-xs mb-6 ${isDay ? "text-stone-600" : "text-slate-400"}`}>
            Before/After comparison requires a finalized, <strong>locked Move-In inspection</strong> to serve as the tamper-evident baseline.
          </p>
          <button
            onClick={() => onNavigate("dashboard")}
            className={`text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer shadow-sm ${
              isDay
                ? "bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-900/20"
                : "bg-emerald-600 hover:bg-emerald-500 text-slate-950"
            }`}
          >
            &larr; Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Create lookup for comparisons by item name
  const compMap = {};
  comparisons.forEach((c) => {
    compMap[c.item_name.toLowerCase()] = c;
  });

  const changeTypeBadge = {
    none: {
      label: "No Noticeable Change",
      color: isDay
        ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold"
        : "bg-emerald-500/15 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-500/20",
    },
    normal_wear: {
      label: "Normal Wear & Tear",
      color: isDay
        ? "bg-stone-100 text-stone-800 border-stone-300 font-bold"
        : "bg-stone-500/15 text-stone-300 border-stone-500/40 shadow-sm shadow-stone-500/20",
    },
    possible_damage: {
      label: "Possible Chargeable Damage",
      color: isDay
        ? "bg-amber-50 text-amber-900 border-amber-300 font-bold"
        : "bg-amber-500/15 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-500/20",
    },
    unclear: {
      label: "Unclear / Manual Review",
      color: isDay
        ? "bg-amber-50 text-amber-900 border-amber-300 font-bold"
        : "bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/20",
    },
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 relative z-10">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate("dashboard")}
          className={`text-xs flex items-center gap-1.5 transition font-medium cursor-pointer ${
            isDay ? "text-stone-600 hover:text-stone-950" : "text-slate-400 hover:text-white"
          }`}
        >
          <span>&larr;</span> Back to Dashboard
        </button>
        <span className={`text-xs font-mono px-3 py-1 rounded-full border ${
          isDay
            ? "bg-stone-100 border-stone-200 text-emerald-900 font-bold"
            : "bg-slate-950/60 border-white/[0.08] text-emerald-400 backdrop-blur-sm"
        }`}>
          Baseline SHA-256: {moveInInspection.locked_hash?.substring(0, 16)}...
        </span>
      </div>

      <DisclaimerBanner theme={theme} />

      {/* Header Banner */}
      <div className={`backdrop-blur-2xl rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition duration-300 border ${
        isDay
          ? "bg-white/95 border-[#E2D9C8] text-stone-900 shadow-stone-200/50"
          : "bg-slate-900/50 border-white/[0.08] hover:border-emerald-500/20 text-slate-100"
      }`}>
        <div>
          <h1 className={`text-xl font-extrabold tracking-tight ${isDay ? "text-stone-950" : "text-white"}`}>
            Before & After Condition Comparison
          </h1>
          <p className={`text-xs mt-1 ${isDay ? "text-stone-600" : "text-slate-400"}`}>
            Property: <strong className={isDay ? "text-stone-900" : "text-white"}>{property?.title}</strong> &bull; Comparing Move-Out against locked Move-In baseline
          </p>
          <div className={`mt-2.5 inline-flex items-center space-x-2 text-[11px] font-mono px-3 py-1 rounded-full border ${
            isDay
              ? "bg-emerald-50 border-emerald-300 text-emerald-900 font-bold"
              : "text-emerald-300 bg-slate-950/70 border-emerald-500/30 backdrop-blur-sm"
          }`}>
            <span className={`w-2 h-2 rounded-full animate-pulse ${isDay ? "bg-emerald-700" : "bg-emerald-400"}`} />
            <span>⚡ AI Triage: Groq Primary / Gemini Vision &bull; Advisory Triage (MTA 2021 Rules)</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {moveOutInspection ? (
            <button
              onClick={handleRunAIComparison}
              disabled={runningAI}
              className={`text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-md disabled:opacity-50 cursor-pointer flex items-center gap-1.5 ${
                isDay
                  ? "bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-900/20"
                  : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-950/40"
              }`}
            >
              <span>{runningAI ? "Running AI Triage..." : "🔍 Run AI Condition Comparison"}</span>
            </button>
          ) : (
            <div className={`text-xs px-3.5 py-2 rounded-xl border ${
              isDay
                ? "bg-amber-50 text-amber-900 border-amber-300 font-medium"
                : "text-amber-300 bg-amber-500/10 border-amber-500/30 backdrop-blur-sm"
            }`}>
              Create a Move-Out inspection on Dashboard first
            </div>
          )}

          <button
            onClick={() => onNavigate("settlement", { propertyId })}
            className={`text-xs font-semibold px-4 py-2.5 rounded-xl border transition cursor-pointer ${
              isDay
                ? "bg-stone-100 hover:bg-stone-200 text-stone-900 border-stone-300 shadow-xs"
                : "bg-slate-900/60 hover:bg-slate-800 text-white border-white/[0.08] hover:border-white/[0.15] backdrop-blur-sm"
            }`}
          >
            Settlement & PDF Export &rarr;
          </button>
        </div>
      </div>

      {/* Advisory Notice */}
      <div className={`rounded-xl p-3.5 text-[11px] flex items-center justify-between border ${
        isDay
          ? "bg-white/90 border-[#E2D9C8] text-stone-700 shadow-xs"
          : "bg-slate-900/40 backdrop-blur-xl border-white/[0.08] text-slate-400"
      }`}>
        <span className="flex items-center gap-2">
          <span>💡</span>
          <span><strong>Advisory Rule:</strong> AI suggestions are consultative under Model Tenancy Act principles. Stored in a separate table, they never alter the immutable locked baseline.</span>
        </span>
        <span className={`font-mono font-bold px-2.5 py-0.5 rounded border ${
          isDay
            ? "bg-emerald-50 text-emerald-900 border-emerald-300"
            : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
        }`}>
          {comparisons.length} Items Evaluated
        </span>
      </div>

      {/* Comparison Grid by Room */}
      {moveOutInspection?.rooms?.map((outRoom) => {
        const inRoom = moveInInspection.rooms?.find(
          (r) => r.name.toLowerCase() === outRoom.name.toLowerCase()
        );

        return (
          <div key={outRoom.id} className="space-y-3">
            <h3 className={`text-sm font-bold flex items-center gap-2 ${isDay ? "text-stone-950 font-extrabold" : "text-white"}`}>
              <span className={isDay ? "text-emerald-800" : "text-emerald-400"}>🏠 Suite:</span> {outRoom.name}
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {outRoom.items?.map((outItem) => {
                const inItem = inRoom?.items?.find(
                  (it) => it.name.toLowerCase() === outItem.name.toLowerCase()
                );
                const triage = compMap[outItem.name.toLowerCase()];
                const badge = triage ? changeTypeBadge[triage.change_type] : null;

                return (
                  <div
                    key={outItem.id}
                    className={`rounded-2xl p-5 transition-all duration-300 border ${
                      isDay
                        ? "bg-white/95 border-[#E2D9C8] text-stone-900 shadow-sm hover:shadow-md hover:border-emerald-700/30"
                        : "bg-slate-900/40 backdrop-blur-xl border-white/[0.08] hover:border-emerald-500/25 shadow-lg shadow-black/20 text-white"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                      <h4 className={`font-bold text-sm tracking-wide ${isDay ? "text-stone-950" : "text-white"}`}>
                        {outItem.name}
                      </h4>
                      {badge && (
                        <div className="flex items-center space-x-2">
                          <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${badge.color}`}>
                            {badge.label}
                          </span>
                          <span className={`text-[10px] font-mono ${isDay ? "text-stone-500 font-semibold" : "text-slate-400"}`}>
                            {Math.round((triage.confidence || 0.8) * 100)}% conf
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Side-by-Side Comparison */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {/* Move-In (Locked Baseline) */}
                      <div className={`rounded-xl p-3.5 space-y-1.5 border ${
                        isDay
                          ? "bg-emerald-50/60 border-emerald-300/80 text-stone-900"
                          : "bg-slate-950/60 border-emerald-500/30 text-slate-200 backdrop-blur-sm"
                      }`}>
                        <div className={`flex items-center justify-between text-[11px] font-semibold ${
                          isDay ? "text-emerald-900 font-bold" : "text-emerald-400"
                        }`}>
                          <span>Move-In (Locked Baseline)</span>
                          <span className={`font-mono text-[9px] uppercase px-2 py-0.5 rounded-full border ${
                            isDay
                              ? "bg-emerald-100 text-emerald-900 border-emerald-300 font-bold"
                              : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          }`}>
                            Verified
                          </span>
                        </div>
                        <p className={isDay ? "text-stone-800" : "text-slate-300"}>
                          <strong>Condition:</strong>{" "}
                          <span className={`capitalize ${isDay ? "text-emerald-900 font-semibold" : "text-emerald-300"}`}>
                            {inItem?.condition?.replace("_", " ") || "Clean Functional"}
                          </span>
                        </p>
                        <p className={`text-[11px] ${isDay ? "text-stone-600" : "text-slate-400"}`}>
                          <strong>Notes:</strong> {inItem?.notes || "No pre-existing defect"}
                        </p>
                        <div className={`text-[10px] font-mono ${isDay ? "text-stone-500" : "text-slate-500"}`}>
                          📷 {inItem?.photos?.length || 0} baseline photos
                        </div>
                      </div>

                      {/* Move-Out */}
                      <div className={`rounded-xl p-3.5 space-y-1.5 border ${
                        isDay
                          ? "bg-stone-50 border-stone-200 text-stone-900"
                          : "bg-slate-950/60 border-white/[0.08] text-slate-200 backdrop-blur-sm"
                      }`}>
                        <div className={`flex items-center justify-between text-[11px] font-semibold ${
                          isDay ? "text-stone-900 font-bold" : "text-emerald-400"
                        }`}>
                          <span>Move-Out Walkthrough</span>
                          <span className={`text-[9px] uppercase px-2 py-0.5 rounded-full border ${
                            isDay
                              ? "bg-stone-200 text-stone-800 border-stone-300 font-bold"
                              : "bg-slate-800 text-slate-300 border-white/[0.08]"
                          }`}>
                            Current
                          </span>
                        </div>
                        <p className={isDay ? "text-stone-800" : "text-slate-300"}>
                          <strong>Condition:</strong>{" "}
                          <span className={`capitalize ${isDay ? "text-stone-900 font-semibold" : "text-emerald-300"}`}>
                            {outItem.condition.replace("_", " ")}
                          </span>
                        </p>
                        <p className={`text-[11px] ${isDay ? "text-stone-600" : "text-slate-400"}`}>
                          <strong>Notes:</strong> {outItem.notes || "No notes"}
                        </p>
                        <div className={`text-[10px] font-mono ${isDay ? "text-stone-500" : "text-slate-500"}`}>
                          📷 {outItem.photos?.length || 0} move-out photos
                        </div>
                      </div>
                    </div>

                    {/* AI Rationale / Advisory Line */}
                    {triage && (
                      <div className={`mt-3 pt-2.5 border-t flex items-start gap-2 text-[11px] ${
                        isDay ? "border-stone-200 text-stone-700" : "border-white/[0.06] text-slate-300"
                      }`}>
                        <span className={`font-bold select-none ${isDay ? "text-emerald-900" : "text-emerald-400"}`}>
                          AI Rationale:
                        </span>
                        <p className="italic flex-1">{triage.rationale}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Footer Navigation */}
      <div className="flex justify-end pt-4">
        <button
          onClick={() => onNavigate("settlement", { propertyId })}
          className={`text-xs font-bold px-6 py-3 rounded-xl transition shadow-md cursor-pointer ${
            isDay
              ? "bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-900/20"
              : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-950/40"
          }`}
        >
          Proceed to Settlement & Deposit Refund &rarr;
        </button>
      </div>
    </div>
  );
}
