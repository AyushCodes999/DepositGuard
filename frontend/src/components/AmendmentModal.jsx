import React, { useState } from "react";

export default function AmendmentModal({ isOpen, onClose, onSubmit, isSubmitting, theme = "night" }) {
  const [reason, setReason] = useState("");
  const [fieldName, setFieldName] = useState("");
  const [fieldValue, setFieldValue] = useState("");
  const isDay = theme === "day";

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) return;

    const changedFields = {};
    if (fieldName.trim()) {
      changedFields[fieldName.trim()] = fieldValue.trim();
    } else {
      changedFields["general_update"] = "Post-move-in condition amendment";
    }

    onSubmit({
      reason: reason.trim(),
      changedFields
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className={`backdrop-blur-2xl rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl transition duration-300 ${
        isDay
          ? "bg-[#FAF8F5] border border-[#E2D9C8] text-stone-900 shadow-stone-400/30"
          : "bg-slate-900/95 border border-white/[0.08] text-slate-100 shadow-2xl"
      }`}>
        <div className={`flex items-center justify-between border-b pb-3 mb-4 ${isDay ? "border-stone-200" : "border-white/[0.08]"}`}>
          <h3 className={`text-base font-bold flex items-center gap-2 ${isDay ? "text-stone-950" : "text-white"}`}>
            <span>📝</span> Append-Only Amendment
          </h3>
          <button
            onClick={onClose}
            className={`text-sm w-7 h-7 rounded-full flex items-center justify-center border transition cursor-pointer ${
              isDay
                ? "text-stone-500 hover:text-stone-900 bg-stone-100 border-stone-200"
                : "text-slate-400 hover:text-white bg-slate-950/50 border-white/[0.08]"
            }`}
          >
            ✕
          </button>
        </div>

        <p className={`text-xs mb-4 leading-relaxed ${isDay ? "text-stone-600" : "text-slate-400"}`}>
          Because the move-in inspection is cryptographically locked, it cannot be edited in place. 
          Any post-move-in repair, maintenance update, or note will be appended as a timestamped amendment chained to the locked hash.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-xs font-semibold mb-1 ${isDay ? "text-stone-700" : "text-slate-300"}`}>
              Reason / Amendment Details *
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Electrician repaired geyser coil on Day 3; hot water fully functional now."
              className={`w-full rounded-xl px-3.5 py-2.5 text-xs transition focus:outline-none ${
                isDay
                  ? "bg-white border border-stone-300 text-stone-900 placeholder-stone-400 focus:border-emerald-600"
                  : "bg-slate-950/60 border border-white/[0.08] text-slate-200 placeholder-slate-500 focus:border-emerald-400"
              }`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDay ? "text-stone-700" : "text-slate-300"}`}>
                Affected Item / Field (Optional)
              </label>
              <input
                type="text"
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                placeholder="e.g. Geyser"
                className={`w-full rounded-xl px-3 py-2 text-xs transition focus:outline-none ${
                  isDay
                    ? "bg-white border border-stone-300 text-stone-900 placeholder-stone-400 focus:border-emerald-600"
                    : "bg-slate-950/60 border border-white/[0.08] text-slate-200 placeholder-slate-500 focus:border-emerald-400"
                }`}
              />
            </div>
            <div>
              <label className={`block text-xs font-semibold mb-1 ${isDay ? "text-stone-700" : "text-slate-300"}`}>
                New Status / Remarks (Optional)
              </label>
              <input
                type="text"
                value={fieldValue}
                onChange={(e) => setFieldValue(e.target.value)}
                placeholder="e.g. Replaced element, working"
                className={`w-full rounded-xl px-3 py-2 text-xs transition focus:outline-none ${
                  isDay
                    ? "bg-white border border-stone-300 text-stone-900 placeholder-stone-400 focus:border-emerald-600"
                    : "bg-slate-950/60 border border-white/[0.08] text-slate-200 placeholder-slate-500 focus:border-emerald-400"
                }`}
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className={`text-xs px-4 py-2 rounded-xl transition cursor-pointer ${
                isDay ? "text-stone-600 hover:text-stone-900" : "text-slate-400 hover:text-white"
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className={`text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-md disabled:opacity-50 cursor-pointer ${
                isDay
                  ? "bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-900/20"
                  : "bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-emerald-500/20"
              }`}
            >
              {isSubmitting ? "Chaining Amendment..." : "Cryptographically Sign Amendment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
