import React, { useState, useEffect } from "react";
import { api } from "../api/client";
import DisclaimerBanner from "../components/DisclaimerBanner";

export default function SettlementPage({ propertyId, onNavigate, theme = "night" }) {
  const [property, setProperty] = useState(null);
  const [settlement, setSettlement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [originalDeposit, setOriginalDeposit] = useState(50000);
  const [deductions, setDeductions] = useState([]);
  const [newCategory, setNewCategory] = useState("painting");
  const [newDesc, setNewDesc] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newIsWearTear, setNewIsWearTear] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const isDay = theme === "day";

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        if (!propertyId) return;

        const prop = await api.getProperty(propertyId);
        setProperty(prop);

        const data = await api.getSettlement(propertyId);
        if (data) {
          setSettlement(data);
          setOriginalDeposit(data.original_deposit || 50000);
          setDeductions(data.proposed_deductions || []);
        } else {
          // Initialize default settlement with inspections
          const inspections = await api.listInspectionsForProperty(propertyId);
          const moveIn = inspections.find((i) => i.type === "move_in");
          const moveOut = inspections.find((i) => i.type === "move_out");

          if (moveIn) {
            const initData = await api.createOrUpdateSettlement(propertyId, {
              property_id: propertyId,
              move_in_inspection_id: moveIn.id,
              move_out_inspection_id: moveOut ? moveOut.id : null,
              original_deposit: 50000,
              proposed_deductions: [],
            });
            setSettlement(initData);
          }
        }
      } catch (err) {
        console.warn("Settlement load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [propertyId]);

  const handleAddDeduction = (e) => {
    e.preventDefault();
    const amt = parseFloat(newAmount);
    if (isNaN(amt) || amt <= 0 || !newDesc.trim()) return;

    const newItem = {
      id: Date.now().toString(),
      category: newCategory,
      description: newDesc.trim(),
      amount: amt,
      is_normal_wear_and_tear: newIsWearTear,
    };

    const updated = [...deductions, newItem];
    setDeductions(updated);
    setNewDesc("");
    setNewAmount("");
    setNewIsWearTear(false);
  };

  const handleRemoveDeduction = (id) => {
    setDeductions(deductions.filter((d) => d.id !== id));
  };

  const handleSaveSettlement = async (statusOverride = null) => {
    setSaving(true);
    try {
      const res = await api.patchSettlement(propertyId, {
        original_deposit: parseFloat(originalDeposit),
        proposed_deductions: deductions,
        status: statusOverride || settlement?.status || "draft",
      });
      setSettlement(res);
      alert("Settlement updated successfully!");
    } catch (err) {
      alert(err.message || "Failed to update settlement.");
    } finally {
      setSaving(false);
    }
  };

  const totalDeductions = deductions.reduce((acc, d) => acc + (parseFloat(d.amount) || 0), 0);
  const refundAmount = Math.max(0, originalDeposit - totalDeductions);

  if (loading) {
    return (
      <div className={`max-w-7xl mx-auto px-4 py-16 text-center text-xs ${isDay ? "text-stone-600" : "text-slate-400"}`}>
        <div className={`inline-block animate-spin w-8 h-8 border-2 border-t-transparent rounded-full mb-3 ${
          isDay ? "border-emerald-700" : "border-emerald-500"
        }`}></div>
        <p className="font-medium">Loading deposit settlement ledger...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 relative z-10">
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
            ? "bg-stone-100 border-stone-200 text-stone-800 font-semibold"
            : "bg-slate-950/60 border-white/[0.08] text-slate-400 backdrop-blur-sm"
        }`}>
          Property: {property?.title}
        </span>
      </div>

      <DisclaimerBanner theme={theme} />

      {/* Header */}
      <div className={`backdrop-blur-2xl rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition duration-300 border ${
        isDay
          ? "bg-white/95 border-[#E2D9C8] text-stone-900 shadow-stone-200/50"
          : "bg-slate-900/50 border-white/[0.08] hover:border-emerald-500/20 text-slate-100"
      }`}>
        <div>
          <h1 className={`text-xl font-extrabold tracking-tight ${isDay ? "text-stone-950" : "text-white"}`}>
            Security Deposit Settlement & PDF Export
          </h1>
          <p className={`text-xs mt-1 ${isDay ? "text-stone-600" : "text-slate-400"}`}>
            Itemize deductions, flag normal wear & tear, and export a ReportLab cryptographic PDF report.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={async () => {
              try {
                setDownloadingPdf(true);
                await api.downloadSettlementPdf(propertyId);
              } catch (err) {
                alert("Failed to export PDF: " + err.message);
              } finally {
                setDownloadingPdf(false);
              }
            }}
            disabled={downloadingPdf}
            className={`text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-md flex items-center gap-1.5 disabled:opacity-50 cursor-pointer ${
              isDay
                ? "bg-stone-900 hover:bg-stone-800 text-white shadow-stone-900/10"
                : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-950/40"
            }`}
          >
            <span>📄</span> {downloadingPdf ? "Generating..." : "Export Tamper-Evident PDF"}
          </button>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`rounded-2xl p-5 shadow-lg transition border ${
          isDay
            ? "bg-white/95 border-[#E2D9C8] text-stone-900 shadow-stone-200/50"
            : "bg-slate-900/40 backdrop-blur-xl border-white/[0.08] hover:border-emerald-500/20 text-slate-200"
        }`}>
          <p className={`text-xs font-semibold ${isDay ? "text-stone-600" : "text-slate-400"}`}>
            Original Security Deposit
          </p>
          <div className="mt-2 flex items-center space-x-1.5">
            <span className={`text-sm font-semibold ${isDay ? "text-stone-500" : "text-slate-400"}`}>₹</span>
            <input
              type="number"
              value={originalDeposit}
              onChange={(e) => setOriginalDeposit(parseFloat(e.target.value) || 0)}
              className={`w-full rounded-xl px-3 py-1.5 text-base font-bold transition focus:outline-none ${
                isDay
                  ? "bg-stone-50 border border-stone-300 text-stone-950 focus:border-emerald-600"
                  : "bg-slate-950/70 border border-white/[0.08] text-white focus:border-emerald-400"
              }`}
            />
          </div>
        </div>

        <div className={`rounded-2xl p-5 shadow-lg transition border ${
          isDay
            ? "bg-rose-50/70 border-rose-200 text-stone-900 shadow-stone-200/30"
            : "bg-slate-900/40 backdrop-blur-xl border-white/[0.08] hover:border-rose-500/20 text-slate-200"
        }`}>
          <p className={`text-xs font-semibold ${isDay ? "text-rose-800" : "text-slate-400"}`}>
            Total Deductions
          </p>
          <p className={`mt-2 text-2xl font-black font-mono ${
            isDay ? "text-rose-700" : "text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-amber-300"
          }`}>
            ₹{totalDeductions.toLocaleString("en-IN")}
          </p>
          <p className={`text-[10px] mt-1 ${isDay ? "text-rose-700/80 font-medium" : "text-slate-400"}`}>
            {deductions.length} itemized claims
          </p>
        </div>

        <div className={`rounded-2xl p-5 shadow-lg transition border ${
          isDay
            ? "bg-emerald-50/80 border-emerald-300 text-stone-900 shadow-emerald-900/5"
            : "bg-slate-900/40 backdrop-blur-xl border-emerald-500/30 hover:border-emerald-500/50 shadow-emerald-950/20 text-slate-200"
        }`}>
          <p className={`text-xs font-semibold ${isDay ? "text-emerald-900" : "text-emerald-400"}`}>
            Net Refund to Tenant
          </p>
          <p className={`mt-2 text-3xl font-black font-mono ${
            isDay ? "text-emerald-800" : "text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-300"
          }`}>
            ₹{refundAmount.toLocaleString("en-IN")}
          </p>
          <p className={`text-[10px] mt-1 ${isDay ? "text-emerald-900/80 font-medium" : "text-emerald-400/80"}`}>
            Final payable amount
          </p>
        </div>
      </div>

      {/* Itemized Deductions Table */}
      <div className={`rounded-2xl p-6 space-y-4 shadow-xl border ${
        isDay
          ? "bg-white/95 border-[#E2D9C8] text-stone-900 shadow-stone-200/50"
          : "bg-slate-900/40 backdrop-blur-xl border-white/[0.08] text-slate-100"
      }`}>
        <div className={`flex items-center justify-between border-b pb-3 ${
          isDay ? "border-stone-200" : "border-white/[0.08]"
        }`}>
          <h3 className={`text-sm font-bold tracking-wide ${isDay ? "text-stone-950 font-extrabold" : "text-white"}`}>
            Itemized Deductions & Claim Breakdown
          </h3>
          <span className={`text-xs flex items-center gap-1.5 ${isDay ? "text-stone-600" : "text-slate-400"}`}>
            Status:{" "}
            <span className={`uppercase text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
              isDay
                ? "bg-amber-100 text-amber-900 border-amber-300"
                : "bg-amber-500/15 text-amber-300 border-amber-500/30"
            }`}>
              {settlement?.status || "Draft"}
            </span>
          </span>
        </div>

        {deductions.length === 0 ? (
          <p className={`text-xs italic py-6 text-center ${isDay ? "text-stone-500 font-medium" : "text-slate-400"}`}>
            No deductions proposed. Full deposit eligible for refund.
          </p>
        ) : (
          <div className="space-y-2.5">
            {deductions.map((d) => (
              <div
                key={d.id}
                className={`rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border transition ${
                  isDay
                    ? "bg-stone-50 border-stone-200 text-stone-900"
                    : "bg-slate-950/60 border-white/[0.08] hover:border-emerald-500/30 text-slate-200 backdrop-blur-sm"
                }`}
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`font-bold capitalize ${isDay ? "text-stone-950" : "text-white"}`}>
                      {d.category.replace("_", " ")}
                    </span>
                    {d.is_normal_wear_and_tear && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                        isDay
                          ? "bg-amber-100 text-amber-900 border-amber-300"
                          : "bg-amber-500/15 text-amber-300 border-amber-500/40"
                      }`}>
                        Disputed: Normal Wear & Tear
                      </span>
                    )}
                  </div>
                  <p className={`mt-1 ${isDay ? "text-stone-600" : "text-slate-400"}`}>{d.description}</p>
                </div>

                <div className="flex items-center space-x-3 self-end sm:self-center">
                  <span className={`font-mono font-bold text-sm ${isDay ? "text-rose-700" : "text-rose-400"}`}>
                    ₹{parseFloat(d.amount).toLocaleString("en-IN")}
                  </span>
                  <button
                    onClick={() => handleRemoveDeduction(d.id)}
                    className={`text-xs px-1.5 py-1 rounded transition cursor-pointer ${
                      isDay ? "text-stone-400 hover:text-rose-700" : "text-slate-500 hover:text-rose-400"
                    }`}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Deduction Form */}
        <form onSubmit={handleAddDeduction} className={`rounded-2xl p-5 space-y-4 border ${
          isDay
            ? "bg-stone-50/80 border-stone-200 text-stone-900"
            : "bg-slate-950/60 border-white/[0.08] backdrop-blur-md text-slate-200"
        }`}>
          <h4 className={`text-xs font-bold uppercase tracking-wider ${isDay ? "text-stone-800" : "text-slate-200"}`}>
            Add Proposed Deduction
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className={`block text-[11px] mb-1 font-semibold ${isDay ? "text-stone-700" : "text-slate-400"}`}>
                Category
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className={`w-full rounded-xl px-3 py-2 text-xs transition focus:outline-none ${
                  isDay
                    ? "bg-white border border-stone-300 text-stone-900 focus:border-emerald-600"
                    : "bg-slate-900 border border-white/[0.08] text-slate-200 focus:border-emerald-400"
                }`}
              >
                <option value="painting">Painting & Touch-up</option>
                <option value="cleaning">Deep Cleaning</option>
                <option value="damage">Physical Damage</option>
                <option value="utility_arrears">Utility Arrears (Bills)</option>
                <option value="missing_inventory">Missing Inventory</option>
                <option value="other">Other Claim</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className={`block text-[11px] mb-1 font-semibold ${isDay ? "text-stone-700" : "text-slate-400"}`}>
                Description / Bill Reference
              </label>
              <input
                type="text"
                required
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="e.g. Broken bathroom towel rod replacement bill"
                className={`w-full rounded-xl px-3 py-2 text-xs transition focus:outline-none ${
                  isDay
                    ? "bg-white border border-stone-300 text-stone-900 placeholder-stone-400 focus:border-emerald-600"
                    : "bg-slate-900 border border-white/[0.08] text-slate-200 placeholder-slate-500 focus:border-emerald-400"
                }`}
              />
            </div>

            <div>
              <label className={`block text-[11px] mb-1 font-semibold ${isDay ? "text-stone-700" : "text-slate-400"}`}>
                Amount (₹)
              </label>
              <input
                type="number"
                required
                min="1"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="1500"
                className={`w-full rounded-xl px-3 py-2 text-xs transition focus:outline-none ${
                  isDay
                    ? "bg-white border border-stone-300 text-stone-900 placeholder-stone-400 focus:border-emerald-600"
                    : "bg-slate-900 border border-white/[0.08] text-slate-200 placeholder-slate-500 focus:border-emerald-400"
                }`}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <label className={`flex items-center space-x-2 text-xs cursor-pointer ${
              isDay ? "text-stone-700 font-medium" : "text-slate-400"
            }`}>
              <input
                type="checkbox"
                checked={newIsWearTear}
                onChange={(e) => setNewIsWearTear(e.target.checked)}
                className="rounded border-stone-300 text-emerald-700 focus:ring-emerald-700"
              />
              <span>Flag as potential normal wear & tear dispute (MTA 2021)</span>
            </label>

            <button
              type="submit"
              className={`text-xs font-bold px-4 py-2 rounded-xl transition cursor-pointer shadow-xs self-start sm:self-auto ${
                isDay
                  ? "bg-stone-900 hover:bg-stone-800 text-white"
                  : "bg-slate-800 hover:bg-slate-700 text-white border border-white/[0.08] hover:border-white/[0.15]"
              }`}
            >
              + Add Deduction
            </button>
          </div>
        </form>

        {/* Actions */}
        <div className={`flex flex-wrap items-center justify-between gap-3 pt-4 border-t ${
          isDay ? "border-stone-200" : "border-white/[0.08]"
        }`}>
          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => handleSaveSettlement("agreed")}
              disabled={saving}
              className={`text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-md cursor-pointer ${
                isDay
                  ? "bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-900/20"
                  : "bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-emerald-500/20"
              }`}
            >
              ✓ Agree to Settlement
            </button>
            <button
              onClick={() => handleSaveSettlement("disputed")}
              disabled={saving}
              className={`text-xs font-semibold px-3.5 py-2.5 rounded-xl transition border cursor-pointer ${
                isDay
                  ? "bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300"
                  : "bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30 backdrop-blur-sm"
              }`}
            >
              Mark as Disputed
            </button>
          </div>

          <button
            onClick={() => handleSaveSettlement()}
            disabled={saving}
            className={`text-xs font-semibold px-4 py-2.5 rounded-xl border transition cursor-pointer ${
              isDay
                ? "bg-stone-100 hover:bg-stone-200 text-stone-900 border-stone-300 shadow-xs"
                : "bg-slate-900/60 hover:bg-slate-800 text-slate-200 border-white/[0.08] hover:border-white/[0.15] backdrop-blur-sm"
            }`}
          >
            {saving ? "Saving..." : "Save Draft Settlement"}
          </button>
        </div>
      </div>
    </div>
  );
}
