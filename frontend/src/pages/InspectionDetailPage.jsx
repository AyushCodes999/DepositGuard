import React, { useState, useEffect } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import DisclaimerBanner from "../components/DisclaimerBanner";
import HashBadge from "../components/HashBadge";
import AmendmentModal from "../components/AmendmentModal";
import { CONDITION_LABELS } from "../data/defaultChecklist";

export default function InspectionDetailPage({ inspectionId, onNavigate, theme = "night" }) {
  const { user } = useAuth();
  const [inspection, setInspection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeRoomIndex, setActiveRoomIndex] = useState(0);

  // Item editing state
  const [editingItemId, setEditingItemId] = useState(null);
  const [itemCondition, setItemCondition] = useState("");
  const [itemNotes, setItemNotes] = useState("");
  const [savingItem, setSavingItem] = useState(false);
  const [structuring, setStructuring] = useState(false);

  // Photo uploading state
  const [uploadingItemId, setUploadingItemId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [isDragOverOverview, setIsDragOverOverview] = useState(false);

  // Approval / Rejection modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [processingApproval, setProcessingApproval] = useState(false);

  // Amendment modal
  const [showAmendmentModal, setShowAmendmentModal] = useState(false);
  const [submittingAmendment, setSubmittingAmendment] = useState(false);

  // PDF download state
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const isDay = theme === "day";

  const fetchInspection = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await api.getInspection(inspectionId);
      setInspection(data);
    } catch (err) {
      console.warn("fetchInspection error:", err);
      setError(err.message || "Failed to load inspection record.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (inspectionId) {
      fetchInspection();
    }
  }, [inspectionId]);

  const handleStartEdit = (item) => {
    if (inspection?.status === "locked") return;
    setEditingItemId(item.id);
    setItemCondition(item.condition);
    setItemNotes(item.notes || "");
  };

  const handleAiStructure = async (itemName) => {
    if (!itemNotes.trim()) return;
    setStructuring(true);
    try {
      const res = await api.structureNote(itemNotes, itemName);
      if (res.ai_status === "success" && res.data) {
        setItemCondition(res.data.condition);
        setItemNotes(res.data.clean_notes);
      }
    } catch (err) {
      console.error("AI structure note error:", err);
    } finally {
      setStructuring(false);
    }
  };

  const handleSaveItem = async (itemId) => {
    setSavingItem(true);
    try {
      await api.updateRoomItem(inspection.id, itemId, {
        condition: itemCondition,
        notes: itemNotes,
      });
      setEditingItemId(null);
      await fetchInspection();
    } catch (err) {
      alert(err.message || "Failed to save item.");
    } finally {
      setSavingItem(false);
    }
  };

  const handleMultiPhotoUpload = async (itemId, filesList) => {
    const files = Array.from(filesList || []);
    if (files.length === 0) return;

    for (const file of files) {
      if (file.size > 8 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds maximum allowed size of 8MB.`);
        return;
      }
    }

    setUploadingItemId(itemId);
    try {
      for (let i = 0; i < files.length; i++) {
        setUploadProgress({ current: i + 1, total: files.length, itemId });
        await api.uploadPhoto(inspection.id, itemId, files[i]);
      }
      await fetchInspection();
    } catch (err) {
      alert(err.message || "Failed to upload photo(s).");
    } finally {
      setUploadingItemId(null);
      setUploadProgress(null);
    }
  };

  const handlePhotoUpload = (itemId, e) => {
    handleMultiPhotoUpload(itemId, e.target.files);
    e.target.value = "";
  };

  const handleRequestApproval = async () => {
    try {
      await api.requestApproval(inspection.id);
      await fetchInspection();
    } catch (err) {
      alert(err.message || "Failed to request approval.");
    }
  };

  const handleApprove = async () => {
    setProcessingApproval(true);
    try {
      await api.submitApproval(inspection.id, "approved", "Approved move-in inspection record.");
      await fetchInspection();
    } catch (err) {
      alert(err.message || "Failed to submit approval.");
    } finally {
      setProcessingApproval(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) return;

    setProcessingApproval(true);
    try {
      await api.submitApproval(inspection.id, "rejected", rejectReason.trim());
      setShowRejectModal(false);
      setRejectReason("");
      await fetchInspection();
    } catch (err) {
      alert(err.message || "Failed to reject inspection.");
    } finally {
      setProcessingApproval(false);
    }
  };

  const handleCreateAmendment = async ({ reason, changedFields }) => {
    setSubmittingAmendment(true);
    try {
      await api.createAmendment(inspection.id, reason, changedFields);
      setShowAmendmentModal(false);
      await fetchInspection();
    } catch (err) {
      alert(err.message || "Failed to create amendment.");
    } finally {
      setSubmittingAmendment(false);
    }
  };

  const handleAcknowledgeAmendment = async (amendmentId) => {
    try {
      await api.acknowledgeAmendment(amendmentId);
      await fetchInspection();
    } catch (err) {
      alert(err.message || "Failed to acknowledge amendment.");
    }
  };

  if (loading) {
    return (
      <div className={`max-w-7xl mx-auto px-4 py-16 text-center ${isDay ? "text-stone-600" : "text-slate-400"}`}>
        <div className={`inline-block animate-spin w-8 h-8 border-2 border-t-transparent rounded-full mb-3 ${
          isDay ? "border-emerald-700" : "border-emerald-500"
        }`}></div>
        <p className="text-xs font-medium">Loading tamper-evident inspection suite...</p>
      </div>
    );
  }

  if (error || !inspection) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <div className={`rounded-2xl p-6 border ${
          isDay
            ? "bg-rose-50 border-rose-200 text-rose-900"
            : "bg-rose-950/40 border-rose-800 text-rose-300"
        }`}>
          <p className="text-sm font-semibold">{error || "Inspection record not found."}</p>
          <button
            onClick={() => onNavigate("dashboard")}
            className={`mt-4 text-xs font-semibold px-4 py-2 rounded-xl border transition cursor-pointer ${
              isDay
                ? "bg-white hover:bg-stone-100 text-stone-900 border-stone-300 shadow-sm"
                : "bg-slate-800 hover:bg-slate-700 text-white border-slate-700"
            }`}
          >
            &larr; Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const isLocked = inspection.status === "locked";
  const isPending = inspection.status === "pending_approval";
  const isDisputed = inspection.status === "disputed";
  const isDraft = inspection.status === "draft";

  const userApproval = inspection.approvals?.find((a) => a.user_id === user?.id);
  const tenantApproval = inspection.approvals?.find((a) => a.role === "tenant" && a.decision === "approved");
  const landlordApproval = inspection.approvals?.find((a) => a.role === "landlord" && a.decision === "approved");

  const rooms = inspection.rooms || [];
  const currentRoom = rooms[activeRoomIndex] || rooms[0];

  // Theme-aware condition badge styling helper
  const getConditionBadge = (condKey) => {
    const raw = CONDITION_LABELS[condKey] || CONDITION_LABELS.clean_functional;
    if (isDay) {
      switch (condKey) {
        case "clean_functional":
          return { label: raw.label, style: "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold" };
        case "minor_wear":
          return { label: raw.label, style: "bg-amber-50 text-amber-900 border-amber-300 font-bold" };
        case "damaged":
          return { label: raw.label, style: "bg-rose-50 text-rose-800 border-rose-300 font-bold" };
        case "not_working":
          return { label: raw.label, style: "bg-rose-50 text-rose-800 border-rose-300 font-bold" };
        case "not_applicable":
        default:
          return { label: raw.label, style: "bg-stone-100 text-stone-700 border-stone-300 font-bold" };
      }
    } else {
      switch (condKey) {
        case "clean_functional":
          return { label: raw.label, style: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40 font-semibold" };
        case "minor_wear":
          return { label: raw.label, style: "bg-amber-500/15 text-amber-300 border-amber-500/40 font-semibold" };
        case "damaged":
          return { label: raw.label, style: "bg-rose-500/15 text-rose-300 border-rose-500/40 font-semibold" };
        case "not_working":
          return { label: raw.label, style: "bg-rose-500/15 text-rose-300 border-rose-500/40 font-semibold" };
        case "not_applicable":
        default:
          return { label: raw.label, style: "bg-slate-800/80 text-slate-400 border-white/[0.08] font-semibold" };
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 relative z-10">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate("dashboard")}
          className={`text-xs flex items-center gap-1.5 transition font-medium cursor-pointer ${
            isDay ? "text-stone-600 hover:text-stone-950" : "text-slate-400 hover:text-white"
          }`}
        >
          <span>&larr;</span> Back to Dashboard
        </button>
        <div className="flex items-center space-x-3">
          <span className={`text-[11px] font-mono ${isDay ? "text-stone-500 font-medium" : "text-slate-500"}`}>
            ID: {inspection.id.substring(0, 8)}...
          </span>
          {isLocked && (
            <button
              onClick={async () => {
                try {
                  setDownloadingPdf(true);
                  await api.downloadInspectionPdf(inspection.id);
                } catch (err) {
                  alert("Failed to export PDF: " + err.message);
                } finally {
                  setDownloadingPdf(false);
                }
              }}
              disabled={downloadingPdf}
              className={`text-xs font-bold px-3.5 py-1.5 rounded-xl transition shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer ${
                isDay
                  ? "bg-stone-900 hover:bg-stone-800 text-white shadow-stone-900/10"
                  : "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
              }`}
            >
              <span>📄</span> {downloadingPdf ? "Generating..." : "Export PDF"}
            </button>
          )}
        </div>
      </div>

      <DisclaimerBanner theme={theme} />

      {/* Header Card */}
      <div className={`backdrop-blur-2xl rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition duration-300 ${
        isDay
          ? "bg-white/95 border border-[#E2D9C8] text-stone-900 shadow-stone-200/50"
          : "bg-slate-900/50 border border-white/[0.08] hover:border-emerald-500/20 text-slate-100"
      }`}>
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className={`text-xl font-extrabold capitalize ${isDay ? "text-stone-950" : "text-white"}`}>
              {inspection.type.replace("_", " ")} Inspection Checklist
            </h1>
            <span
              className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border ${
                isLocked
                  ? isDay
                    ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                    : "bg-emerald-500/15 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-500/20"
                  : isPending
                  ? isDay
                    ? "bg-amber-100 text-amber-900 border-amber-300"
                    : "bg-amber-500/15 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-500/20"
                  : isDisputed
                  ? isDay
                    ? "bg-rose-100 text-rose-900 border-rose-300"
                    : "bg-rose-500/15 text-rose-300 border-rose-500/50 shadow-sm shadow-rose-500/20"
                  : isDay
                  ? "bg-stone-100 text-stone-800 border-stone-300 font-bold"
                  : "bg-slate-800/60 text-slate-400 border-white/[0.08]"
              }`}
            >
              {isLocked ? "✓ LOCKED" : inspection.status.replace("_", " ")}
            </span>
          </div>
          <p className={`text-xs mt-1.5 ${isDay ? "text-stone-600" : "text-slate-400"}`}>
            Pre-populated from Indian Rental Market Research &bull; 5 Essential Room Suites
          </p>
        </div>

        {/* Dual-Confirmation State Indicators */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border transition ${
            isDay
              ? "bg-stone-50 border-stone-200 text-stone-800 shadow-xs"
              : "bg-slate-950/60 border-white/[0.08] text-slate-300 backdrop-blur-sm"
          }`}>
            <span className={isDay ? "text-stone-600 font-medium" : "text-slate-400"}>Tenant:</span>
            <span className={`font-semibold flex items-center gap-1 ${
              tenantApproval
                ? isDay ? "text-emerald-800 font-bold" : "text-emerald-400"
                : isDay ? "text-stone-400" : "text-slate-500"
            }`}>
              {tenantApproval ? "✓ Approved" : "Pending"}
            </span>
          </div>

          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border transition ${
            isDay
              ? "bg-stone-50 border-stone-200 text-stone-800 shadow-xs"
              : "bg-slate-950/60 border-white/[0.08] text-slate-300 backdrop-blur-sm"
          }`}>
            <span className={isDay ? "text-stone-600 font-medium" : "text-slate-400"}>Landlord:</span>
            <span className={`font-semibold flex items-center gap-1 ${
              landlordApproval
                ? isDay ? "text-emerald-800 font-bold" : "text-emerald-400"
                : isDay ? "text-stone-400" : "text-slate-500"
            }`}>
              {landlordApproval ? "✓ Approved" : "Pending"}
            </span>
          </div>
        </div>
      </div>

      {/* Disputed Banner */}
      {isDisputed && (
        <div className={`rounded-2xl p-4 text-xs flex items-start gap-3 border ${
          isDay
            ? "bg-rose-50 border-rose-200 text-rose-900"
            : "bg-rose-950/50 border-rose-800 text-rose-200"
        }`}>
          <span className="text-lg">⚠️</span>
          <div className="flex-1">
            <p className={`font-bold ${isDay ? "text-rose-950" : "text-rose-300"}`}>
              Inspection Disputed / Rejected
            </p>
            <p className={`mt-0.5 ${isDay ? "text-rose-800" : "text-rose-200/90"}`}>
              Reason provided: &ldquo;{inspection.dispute_reason}&rdquo;
            </p>
            <p className={`mt-1 text-[11px] ${isDay ? "text-stone-600" : "text-slate-400"}`}>
              Resolve the dispute by updating items/photos and clicking "Request Approval" again.
            </p>
          </div>
          <button
            onClick={handleRequestApproval}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition cursor-pointer ${
              isDay
                ? "bg-rose-600 hover:bg-rose-700 text-white border-rose-700"
                : "bg-rose-900/60 hover:bg-rose-900 text-rose-100 border-rose-700"
            }`}
          >
            Re-submit for Approval
          </button>
        </div>
      )}

      {/* Locked Hash Badge */}
      {isLocked && (
        <div className="space-y-4">
          <HashBadge
            inspectionId={inspection.id}
            lockedHash={inspection.locked_hash}
            lockedAt={inspection.locked_at}
            theme={theme}
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              onClick={() => onNavigate("comparison", { propertyId: inspection.property_id })}
              className={`text-xs font-semibold px-3.5 py-2 rounded-xl border transition cursor-pointer ${
                isDay
                  ? "bg-stone-100 hover:bg-stone-200 text-emerald-900 font-bold border-stone-300 shadow-xs"
                  : "bg-slate-800 hover:bg-slate-700 text-emerald-400 border-slate-700"
              }`}
            >
              🔍 View Before & After Comparison
            </button>

            <button
              onClick={() => setShowAmendmentModal(true)}
              className={`text-xs font-semibold px-3.5 py-2 rounded-xl border transition cursor-pointer ${
                isDay
                  ? "bg-stone-100 hover:bg-stone-200 text-emerald-900 font-bold border-stone-300 shadow-xs"
                  : "bg-slate-800 hover:bg-slate-700 text-emerald-400 border-slate-700"
              }`}
            >
              + File Append-Only Amendment
            </button>
          </div>
        </div>
      )}

      {/* Approval Action Bar for Unlocked States */}
      {!isLocked && (
        <div className={`backdrop-blur-2xl rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 transition duration-300 border ${
          isDay
            ? "bg-white/95 border-[#E2D9C8] text-stone-900 shadow-stone-200/50"
            : "bg-slate-900/40 border-white/[0.08] hover:border-emerald-500/20 text-slate-100"
        }`}>
          <div>
            <p className={`text-xs font-bold flex items-center gap-1.5 ${isDay ? "text-stone-900" : "text-slate-100"}`}>
              <span className={`w-2 h-2 rounded-full animate-pulse ${isDay ? "bg-emerald-600" : "bg-emerald-400"}`} />
              {isDraft
                ? "Inspection in Draft: Review checklist, upload condition photos, and request dual approval."
                : isPending
                ? "Awaiting dual approvals from Tenant and Landlord to engage the cryptographic lock."
                : "Resolve dispute items before locking."}
            </p>
            <p className={`text-[11px] mt-1 ${isDay ? "text-stone-600" : "text-slate-400"}`}>
              Once both parties approve, this record is sealed with SHA-256 and becomes strictly immutable under MTA 2021 principles.
            </p>
          </div>

          <div className="flex items-center space-x-2.5">
            {isDraft && (
              <button
                onClick={handleRequestApproval}
                className={`text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer ${
                  isDay
                    ? "bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-900/20"
                    : "bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-emerald-500/25"
                }`}
              >
                <span>Submit for Dual Approval</span>
                <span>&rarr;</span>
              </button>
            )}

            {isPending && (
              <>
                <button
                  onClick={() => setShowRejectModal(true)}
                  disabled={processingApproval}
                  className={`text-xs font-semibold px-3.5 py-2.5 rounded-xl transition border cursor-pointer ${
                    isDay
                      ? "bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-300"
                      : "bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30 backdrop-blur-sm"
                  }`}
                >
                  Reject with Remarks
                </button>

                <button
                  onClick={handleApprove}
                  disabled={processingApproval || userApproval?.decision === "approved"}
                  className={`text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-md disabled:opacity-50 cursor-pointer ${
                    isDay
                      ? "bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-900/20"
                      : "bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-emerald-500/25"
                  }`}
                >
                  {userApproval?.decision === "approved"
                    ? "✓ You Approved"
                    : processingApproval
                    ? "Locking..."
                    : `Approve as ${user?.role === "landlord" ? "Landlord" : "Tenant"}`}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Smart Photographic Evidence Guidance Banner */}
      <div className={`rounded-2xl p-4 transition-all duration-300 border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
        isDay
          ? "bg-[#FBF9F4] border-[#E8DFD1] text-stone-900"
          : "bg-emerald-950/20 border-emerald-500/25 text-emerald-100"
      }`}>
        <div className="flex items-start sm:items-center gap-3">
          <div className={`p-2.5 rounded-xl text-lg shrink-0 ${
            isDay ? "bg-emerald-100/80 text-emerald-900" : "bg-emerald-500/20 text-emerald-300"
          }`}>
            📸
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-xs font-bold tracking-wide ${isDay ? "text-stone-950" : "text-white"}`}>
                Room Overview + Exception-Only Proof Standard
              </h3>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                isDay ? "bg-emerald-100 text-emerald-900 border border-emerald-300" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              }`}>
                MTA 2021
              </span>
            </div>
            <p className={`text-xs mt-0.5 ${isDay ? "text-stone-600" : "text-slate-300"}`}>
              Upload <strong>2–3 wide shots</strong> per room, plus close-ups <em>only</em> for pre-existing defects or meter readings (typically 10–15 photos total across the flat).
            </p>
          </div>
        </div>

        <div className={`text-[11px] font-mono shrink-0 px-3 py-1.5 rounded-xl border ${
          isDay
            ? "bg-white border-[#E2D9C8] text-stone-700 font-medium"
            : "bg-slate-900/60 border-white/[0.08] text-slate-300"
        }`}>
          Clean items auto-collapse
        </div>
      </div>

      {/* Room Tabs: Horizontal Pill Bar */}
      <div className={`flex space-x-2 overflow-x-auto pb-2 scrollbar-thin border-b ${
        isDay ? "border-[#E2D9C8]" : "border-white/[0.08]"
      }`}>
        {rooms.map((room, idx) => {
          const totalPhotos = room.items?.reduce((acc, it) => acc + (it.photos?.length || 0), 0) || 0;
          const defectsCount = room.items?.filter((it) => it.condition !== "clean_functional" && it.condition !== "not_applicable")?.length || 0;
          const isActive = idx === activeRoomIndex;
          return (
            <button
              key={room.id}
              onClick={() => {
                setActiveRoomIndex(idx);
                setEditingItemId(null);
              }}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center space-x-2 border cursor-pointer ${
                isActive
                  ? isDay
                    ? "bg-emerald-700 text-white border-emerald-700 shadow-sm shadow-emerald-900/20"
                    : "bg-emerald-500/15 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-500/20 backdrop-blur-md"
                  : isDay
                  ? "bg-white/85 text-stone-700 border-[#E2D9C8] hover:bg-white hover:text-stone-950 hover:border-stone-400 shadow-xs"
                  : "bg-slate-900/30 text-slate-400 border-white/[0.05] hover:border-white/[0.15] hover:text-white backdrop-blur-sm"
              }`}
            >
              <span>{room.name}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                isActive
                  ? isDay ? "bg-white/20 text-white font-bold" : "bg-emerald-500/20 text-emerald-300"
                  : isDay ? "bg-stone-100 text-stone-700 border border-stone-200" : "bg-slate-800 text-slate-400"
              }`}>
                {room.items?.length || 0}
              </span>
              <span className={`text-[10px] flex items-center gap-1 font-mono font-bold ${
                totalPhotos > 0
                  ? isDay ? "text-emerald-900" : "text-emerald-400"
                  : isDay ? "text-stone-400" : "text-slate-500"
              }`}>
                📷 {totalPhotos}
              </span>
              {defectsCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5 ${
                  isDay
                    ? "bg-amber-100 text-amber-900 border border-amber-300"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                }`}>
                  ⚠️ {defectsCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Room Items Checklist */}
      {currentRoom && (() => {
        // Find designated Room Overview / Wide Shots Item
        const overviewItem = currentRoom.items?.find((it) =>
          it.name?.toLowerCase().includes("panoramic") ||
          it.name?.toLowerCase().includes("overview") ||
          it.name?.toLowerCase().includes("wide view") ||
          it.name?.toLowerCase().includes("corner shots")
        ) || (currentRoom.items && currentRoom.items[0]);

        // Remaining individual checklist items
        const standardItems = currentRoom.items?.filter((it) => it.id !== overviewItem?.id) || [];
        const isEditingOverview = editingItemId === overviewItem?.id;
        const overviewBadge = overviewItem ? getConditionBadge(overviewItem.condition) : null;

        return (
          <div className="space-y-4">
            <div className={`flex items-center justify-between text-xs ${isDay ? "text-stone-600" : "text-slate-400"}`}>
              <span>
                Showing {currentRoom.items?.length || 0} items for{" "}
                <strong className={isDay ? "text-stone-950 font-bold" : "text-white"}>{currentRoom.name}</strong>
              </span>
              <span className={`italic text-[11px] ${isDay ? "text-stone-500" : "text-slate-500"}`}>
                {isLocked ? "🔒 Record locked & immutable" : "Tap 'Edit' to add notes or update condition"}
              </span>
            </div>

            {/* DEDICATED ROOM OVERVIEW PHOTOS CARD */}
            {overviewItem && (
              <div
                className={`backdrop-blur-xl rounded-2xl p-6 transition-all duration-300 border ${
                  isDay
                    ? "bg-white/95 border-[#D8CBB6] text-stone-900 shadow-md ring-1 ring-emerald-600/10"
                    : "bg-slate-900/50 border-emerald-500/30 hover:border-emerald-500/50 shadow-xl shadow-black/25 text-white"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">📸</span>
                      <div>
                        <h3 className={`font-extrabold text-base tracking-wide flex items-center gap-2 ${
                          isDay ? "text-stone-950" : "text-white"
                        }`}>
                          {currentRoom.name} Overview Photos
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isDay
                              ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                              : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          }`}>
                            {overviewItem.photos?.length || 0} Wide Shots Attached
                          </span>
                        </h3>
                        <p className={`text-xs mt-0.5 leading-relaxed ${isDay ? "text-stone-600" : "text-slate-400"}`}>
                          Upload 2–4 wide-angle corner shots covering the full room layout. Mapped directly to &ldquo;{overviewItem.name}&rdquo;.
                        </p>
                      </div>
                    </div>
                    {overviewItem.notes && (
                      <p className={`text-xs mt-2 pl-7 leading-relaxed ${isDay ? "text-stone-700 font-medium" : "text-slate-300"}`}>
                        <strong>Notes:</strong> {overviewItem.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 self-start sm:self-center shrink-0">
                    <span className={`text-[11px] px-2.5 py-1 rounded-full border ${overviewBadge?.style}`}>
                      {overviewBadge?.label}
                    </span>
                    {!isLocked && !isEditingOverview && (
                      <button
                        onClick={() => handleStartEdit(overviewItem)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition cursor-pointer font-medium ${
                          isDay
                            ? "text-stone-700 hover:text-stone-950 bg-stone-100 hover:bg-stone-200 border-stone-300"
                            : "text-slate-400 hover:text-white bg-slate-950/40 border-white/[0.06] hover:border-white/[0.15]"
                        }`}
                      >
                        Edit Notes
                      </button>
                    )}
                  </div>
                </div>

                {/* Inline Editor for Overview Item */}
                {isEditingOverview && (
                  <div className={`mt-3 p-4 rounded-xl space-y-3 border ${
                    isDay
                      ? "bg-stone-50 border-stone-300 text-stone-900"
                      : "bg-slate-950/70 border-emerald-500/20 text-slate-200 backdrop-blur-md"
                  }`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={`block text-xs font-semibold mb-1 ${isDay ? "text-stone-800" : "text-slate-300"}`}>
                          Overall Room Assessment
                        </label>
                        <select
                          value={itemCondition}
                          onChange={(e) => setItemCondition(e.target.value)}
                          className={`w-full rounded-xl px-3 py-2 text-xs transition focus:outline-none ${
                            isDay
                              ? "bg-white border border-stone-300 text-stone-900 focus:border-emerald-600"
                              : "bg-slate-900 border border-white/[0.08] text-slate-200 focus:border-emerald-400"
                          }`}
                        >
                          <option value="clean_functional">Clean & Functional</option>
                          <option value="minor_wear">Normal Wear & Tear</option>
                          <option value="damaged">Pre-Existing Damage</option>
                          <option value="not_working">Broken / Non-Working</option>
                          <option value="not_applicable">Not Applicable</option>
                        </select>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className={`block text-xs font-semibold ${isDay ? "text-stone-800" : "text-slate-300"}`}>
                            Overview Observations
                          </label>
                          <button
                            type="button"
                            onClick={() => handleAiStructure(overviewItem.name)}
                            disabled={structuring || !itemNotes.trim()}
                            className={`text-[10px] font-semibold disabled:opacity-40 transition cursor-pointer flex items-center gap-1 ${
                              isDay
                                ? "text-emerald-800 hover:text-emerald-950 font-bold"
                                : "text-emerald-400 hover:text-emerald-300"
                            }`}
                          >
                            <span>✨</span>
                            <span>{structuring ? "Structuring..." : "AI Structure"}</span>
                          </button>
                        </div>
                        <textarea
                          rows={2}
                          value={itemNotes}
                          onChange={(e) => setItemNotes(e.target.value)}
                          placeholder="General room state, natural lighting, fresh paint notes..."
                          className={`w-full rounded-xl px-3 py-2 text-xs transition focus:outline-none ${
                            isDay
                              ? "bg-white border border-stone-300 text-stone-900 placeholder-stone-400 focus:border-emerald-600"
                              : "bg-slate-900 border border-white/[0.08] text-slate-200 placeholder-slate-500 focus:border-emerald-400"
                          }`}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingItemId(null)}
                        className={`text-xs px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
                          isDay ? "text-stone-600 hover:text-stone-900" : "text-slate-400 hover:text-white"
                        }`}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={savingItem}
                        onClick={() => handleSaveItem(overviewItem.id)}
                        className={`text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-sm transition cursor-pointer ${
                          isDay
                            ? "bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-900/20"
                            : "bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950"
                        }`}
                      >
                        {savingItem ? "Saving..." : "Save Notes"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Upload Progress for Overview Item */}
                {uploadingItemId === overviewItem.id && (
                  <div className={`mt-3 p-3 rounded-xl text-xs flex items-center gap-2 border animate-pulse ${
                    isDay ? "bg-amber-50 border-amber-300 text-amber-900" : "bg-amber-950/40 border-amber-500/40 text-amber-200"
                  }`}>
                    <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                    <span className="font-medium">
                      {uploadProgress
                        ? `Uploading photo ${uploadProgress.current} of ${uploadProgress.total} & computing server-side SHA-256...`
                        : "Uploading photo and computing SHA-256..."}
                    </span>
                  </div>
                )}

                {/* Attached Overview Photos Grid */}
                {overviewItem.photos?.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-stone-200 dark:border-white/[0.06]">
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                      {overviewItem.photos.map((photo) => (
                        <div
                          key={photo.id}
                          className={`rounded-xl p-1.5 flex flex-col group relative transition duration-200 border ${
                            isDay
                              ? "bg-stone-50 border-stone-200 hover:border-emerald-600/40"
                              : "bg-slate-950/60 border-white/[0.08] hover:border-emerald-500/40"
                          }`}
                        >
                          <img
                            src={photo.view_url || `/api/photos/view/${photo.storage_path}`}
                            alt={photo.file_name}
                            className={`w-full h-24 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300 ${
                              isDay ? "bg-stone-200" : "bg-slate-900"
                            }`}
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                          <p className={`text-[10px] truncate mt-1.5 ${isDay ? "text-stone-800 font-medium" : "text-slate-300"}`}>
                            {photo.file_name}
                          </p>
                          <div
                            className={`text-[9px] font-mono truncate select-all ${
                              isDay ? "text-emerald-800 font-bold" : "text-emerald-400/90"
                            }`}
                            title={`SHA-256: ${photo.sha256_hash}`}
                          >
                            {photo.sha256_hash.substring(0, 12)}...
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Drag-and-drop / Multi-file Dropzone */}
                {!isLocked && (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOverOverview(true);
                    }}
                    onDragLeave={() => setIsDragOverOverview(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragOverOverview(false);
                      handleMultiPhotoUpload(overviewItem.id, e.dataTransfer.files);
                    }}
                    className={`mt-4 border-2 border-dashed rounded-xl p-4 sm:p-5 text-center transition-all ${
                      isDragOverOverview
                        ? isDay
                          ? "border-emerald-600 bg-emerald-50/60"
                          : "border-emerald-400 bg-emerald-950/40"
                        : isDay
                        ? "border-[#D8CBB6] hover:border-emerald-600/60 bg-[#FBF9F4]/70"
                        : "border-white/[0.1] hover:border-emerald-500/40 bg-slate-950/30"
                    }`}
                  >
                    <label className="cursor-pointer block">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <span className="text-xl">📸</span>
                        <span className={`text-xs font-bold ${isDay ? "text-emerald-900" : "text-emerald-400"}`}>
                          {overviewItem.photos?.length > 0 ? "+ Add More Wide Shots (Multi-select)" : "Upload 2–4 Wide Shots (Click or Drag & Drop)"}
                        </span>
                        <span className={`text-[11px] ${isDay ? "text-stone-500" : "text-slate-400"}`}>
                          Multi-file selection supported &bull; JPG, PNG, WebP up to 8MB each
                        </span>
                      </div>
                      <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          handleMultiPhotoUpload(overviewItem.id, e.target.files);
                          e.target.value = "";
                        }}
                        disabled={uploadingItemId === overviewItem.id}
                      />
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* REMAINING CHECKLIST ITEMS */}
            <div className="grid grid-cols-1 gap-3.5">
              {standardItems.map((item) => {
                const isEditing = editingItemId === item.id;
                const condBadge = getConditionBadge(item.condition);
                const isMeterReading = item.name?.toLowerCase().includes("meter");
                const isDefect = item.condition !== "clean_functional" && item.condition !== "not_applicable";
                const hasPhotos = (item.photos?.length || 0) > 0;
                const shouldExpandPhotos = isDefect || isMeterReading || hasPhotos;

                return (
                  <div
                    key={item.id}
                    className={`backdrop-blur-xl rounded-2xl p-4 sm:p-5 transition-all duration-300 border ${
                      isDay
                        ? isDefect
                          ? "bg-amber-50/20 border-amber-300/80 text-stone-900 shadow-sm"
                          : "bg-white/95 border-[#E2D9C8] text-stone-900 shadow-xs hover:border-stone-400/80"
                        : isDefect
                        ? "bg-amber-950/15 border-amber-500/30 shadow-lg text-white"
                        : "bg-slate-900/40 border-white/[0.08] hover:border-emerald-500/25 shadow-lg shadow-black/20 text-white"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className={`font-bold text-sm tracking-wide ${isDay ? "text-stone-950" : "text-white"}`}>
                            {item.name}
                          </h4>
                          {isMeterReading && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              isDay ? "bg-blue-100 text-blue-900 border border-blue-300" : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                            }`}>
                              ⚡ Reading Required
                            </span>
                          )}
                          {isDefect && (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              isDay ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                            }`}>
                              Defect Flagged
                            </span>
                          )}
                        </div>
                        <p className={`text-xs mt-1 leading-relaxed ${isDay ? "text-stone-600" : "text-slate-400"}`}>
                          {item.notes || <span className={isDay ? "italic text-stone-400" : "italic text-slate-500"}>No notes recorded</span>}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 self-start shrink-0">
                        <span className={`text-[11px] px-2.5 py-1 rounded-full border ${condBadge.style}`}>
                          {condBadge.label}
                        </span>

                        {!isLocked && !isEditing && (
                          <button
                            onClick={() => handleStartEdit(item)}
                            className={`text-xs px-2.5 py-1 rounded-lg border transition cursor-pointer font-medium ${
                              isDay
                                ? "text-stone-700 hover:text-stone-950 bg-stone-100 hover:bg-stone-200 border-stone-300"
                                : "text-slate-400 hover:text-white bg-slate-950/40 border-white/[0.06] hover:border-white/[0.15]"
                            }`}
                          >
                            Edit
                          </button>
                        )}

                        {/* Subtle + Add Photo button for collapsed clean items */}
                        {!isLocked && !shouldExpandPhotos && (
                          <label className={`text-xs px-2.5 py-1 rounded-lg border transition cursor-pointer font-medium flex items-center gap-1 ${
                            isDay
                              ? "text-stone-700 hover:text-stone-950 bg-stone-100 hover:bg-stone-200 border-stone-300"
                              : "text-slate-400 hover:text-white bg-slate-950/40 border-white/[0.06] hover:border-white/[0.15]"
                          }`}>
                            <span>📷</span>
                            <span>+ Photo</span>
                            <input
                              type="file"
                              multiple
                              accept="image/jpeg,image/png,image/webp"
                              className="hidden"
                              onChange={(e) => {
                                handleMultiPhotoUpload(item.id, e.target.files);
                                e.target.value = "";
                              }}
                              disabled={uploadingItemId === item.id}
                            />
                          </label>
                        )}
                      </div>
                    </div>

                    {/* Inline Editor */}
                    {isEditing && (
                      <div className={`mt-3 p-4 rounded-xl space-y-3 border ${
                        isDay
                          ? "bg-stone-50 border-stone-300 text-stone-900"
                          : "bg-slate-950/70 border-emerald-500/20 text-slate-200 backdrop-blur-md"
                      }`}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className={`block text-xs font-semibold mb-1 ${isDay ? "text-stone-800" : "text-slate-300"}`}>
                              Condition Assessment
                            </label>
                            <select
                              value={itemCondition}
                              onChange={(e) => setItemCondition(e.target.value)}
                              className={`w-full rounded-xl px-3 py-2 text-xs transition focus:outline-none ${
                                isDay
                                  ? "bg-white border border-stone-300 text-stone-900 focus:border-emerald-600"
                                  : "bg-slate-900 border border-white/[0.08] text-slate-200 focus:border-emerald-400"
                              }`}
                            >
                              <option value="clean_functional">Clean & Functional</option>
                              <option value="minor_wear">Normal Wear & Tear</option>
                              <option value="damaged">Pre-Existing Damage</option>
                              <option value="not_working">Broken / Non-Working</option>
                              <option value="not_applicable">Not Applicable</option>
                            </select>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className={`block text-xs font-semibold ${isDay ? "text-stone-800" : "text-slate-300"}`}>
                                Specific Observations / Tenant Notes
                              </label>
                              <button
                                type="button"
                                onClick={() => handleAiStructure(item.name)}
                                disabled={structuring || !itemNotes.trim()}
                                className={`text-[10px] font-semibold disabled:opacity-40 transition cursor-pointer flex items-center gap-1 ${
                                  isDay
                                    ? "text-emerald-800 hover:text-emerald-950 font-bold"
                                    : "text-emerald-400 hover:text-emerald-300"
                                }`}
                              >
                                <span>✨</span>
                                <span>{structuring ? "Structuring..." : "AI Structure (Fast)"}</span>
                              </button>
                            </div>
                            <textarea
                              rows={2}
                              value={itemNotes}
                              onChange={(e) => setItemNotes(e.target.value)}
                              placeholder="Describe pre-existing marks, scratches, stains..."
                              className={`w-full rounded-xl px-3 py-2 text-xs transition focus:outline-none ${
                                isDay
                                  ? "bg-white border border-stone-300 text-stone-900 placeholder-stone-400 focus:border-emerald-600"
                                  : "bg-slate-900 border border-white/[0.08] text-slate-200 placeholder-slate-500 focus:border-emerald-400"
                              }`}
                            />
                          </div>
                        </div>

                        <div className="flex justify-end space-x-2 pt-2">
                          <button
                            type="button"
                            onClick={() => setEditingItemId(null)}
                            className={`text-xs px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
                              isDay ? "text-stone-600 hover:text-stone-900" : "text-slate-400 hover:text-white"
                            }`}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={savingItem}
                            onClick={() => handleSaveItem(item.id)}
                            className={`text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-sm transition cursor-pointer ${
                              isDay
                                ? "bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-900/20"
                                : "bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950"
                            }`}
                          >
                            {savingItem ? "Saving..." : "Save Item"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* EXPANDED EVIDENCE SECTION (Only when Defect, Meter, or Photos attached) */}
                    {shouldExpandPhotos && (
                      <div className={`mt-3 pt-3 border-t ${isDay ? "border-stone-200" : "border-white/[0.06]"}`}>
                        {/* Defect Warning Banner */}
                        {isDefect && !hasPhotos && (
                          <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 mb-2 border ${
                            isDay
                              ? "bg-amber-50 border-amber-300 text-amber-950 font-medium"
                              : "bg-amber-950/40 border-amber-500/40 text-amber-200"
                          }`}>
                            <span>⚠️</span>
                            <span><strong>Recommended:</strong> Attach photo proof of defect to protect your deposit against deduction.</span>
                          </div>
                        )}

                        {/* Meter Warning Banner */}
                        {isMeterReading && !hasPhotos && (
                          <div className={`p-2.5 rounded-xl text-xs flex items-center gap-2 mb-2 border ${
                            isDay
                              ? "bg-blue-50 border-blue-300 text-blue-950 font-medium"
                              : "bg-blue-950/40 border-blue-500/40 text-blue-200"
                          }`}>
                            <span>⚡</span>
                            <span><strong>Important:</strong> Photograph meter dial clearly showing initial kWh reading to avoid arrears.</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[11px] font-semibold uppercase tracking-wider ${
                            isDay ? "text-stone-600 font-bold" : "text-slate-400"
                          }`}>
                            Photographic Evidence ({item.photos?.length || 0})
                          </span>

                          {!isLocked && (
                            <label className={`cursor-pointer text-xs font-semibold flex items-center space-x-1 transition ${
                              isDay ? "text-emerald-800 hover:text-emerald-950 font-bold" : "text-emerald-400 hover:text-emerald-300"
                            }`}>
                              <span>+ Add {hasPhotos ? "More Photos" : "Photo"}</span>
                              <input
                                type="file"
                                multiple
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={(e) => {
                                  handleMultiPhotoUpload(item.id, e.target.files);
                                  e.target.value = "";
                                }}
                                disabled={uploadingItemId === item.id}
                              />
                            </label>
                          )}
                        </div>

                        {uploadingItemId === item.id && (
                          <div className={`text-xs animate-pulse mb-2 font-medium flex items-center gap-2 ${
                            isDay ? "text-amber-800" : "text-amber-300"
                          }`}>
                            <div className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full" />
                            <span>
                              {uploadProgress
                                ? `Uploading photo ${uploadProgress.current} of ${uploadProgress.total} (SHA-256 calculation)...`
                                : "Uploading and computing SHA-256..."}
                            </span>
                          </div>
                        )}

                        {item.photos?.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                            {item.photos.map((photo) => (
                              <div
                                key={photo.id}
                                className={`rounded-xl p-1.5 flex flex-col group relative transition duration-200 border ${
                                  isDay
                                    ? "bg-stone-50 border-stone-200 hover:border-emerald-600/40"
                                    : "bg-slate-950/60 border-white/[0.08] hover:border-emerald-500/40"
                                }`}
                              >
                                <img
                                  src={photo.view_url || `/api/photos/view/${photo.storage_path}`}
                                  alt={photo.file_name}
                                  className={`w-full h-20 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300 ${
                                    isDay ? "bg-stone-200" : "bg-slate-900"
                                  }`}
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                  }}
                                />
                                <p className={`text-[10px] truncate mt-1.5 ${isDay ? "text-stone-800 font-medium" : "text-slate-300"}`}>
                                  {photo.file_name}
                                </p>
                                <div
                                  className={`text-[9px] font-mono truncate select-all ${
                                    isDay ? "text-emerald-800 font-bold" : "text-emerald-400/90"
                                  }`}
                                  title={`SHA-256: ${photo.sha256_hash}`}
                                >
                                  {photo.sha256_hash.substring(0, 12)}...
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Amendments Ledger Section */}
      {inspection.amendments?.length > 0 && (
        <div className={`rounded-2xl p-5 border ${
          isDay
            ? "bg-white/95 border-[#E2D9C8] text-stone-900 shadow-md"
            : "bg-slate-900 border-slate-800 text-slate-100"
        }`}>
          <h3 className={`text-sm font-bold flex items-center gap-2 mb-3 ${isDay ? "text-stone-950" : "text-white"}`}>
            <span>📜</span> Cryptographic Amendment Ledger ({inspection.amendments.length})
          </h3>
          <div className="space-y-3">
            {inspection.amendments.map((am) => (
              <div
                key={am.id}
                className={`rounded-xl p-3.5 text-xs space-y-1.5 border ${
                  isDay
                    ? "bg-stone-50 border-stone-200 text-stone-900"
                    : "bg-slate-950 border-slate-800 text-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`font-semibold ${isDay ? "text-emerald-800 font-bold" : "text-emerald-400"}`}>
                      Author: {am.author_role.toUpperCase()}
                    </span>
                    <span className={isDay ? "text-stone-400" : "text-slate-500"}>&bull;</span>
                    <span className={isDay ? "text-stone-600" : "text-slate-400"}>
                      {new Date(am.created_at).toLocaleString()}
                    </span>
                  </div>

                  {am.acknowledged_at ? (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      isDay
                        ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                        : "bg-emerald-950 text-emerald-400 border-emerald-800"
                    }`}>
                      ✓ Acknowledged
                    </span>
                  ) : am.author_id !== user?.id ? (
                    <button
                      onClick={() => handleAcknowledgeAmendment(am.id)}
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded transition cursor-pointer ${
                        isDay
                          ? "bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs"
                          : "bg-emerald-600 hover:bg-emerald-500 text-slate-950"
                      }`}
                    >
                      Acknowledge Amendment
                    </button>
                  ) : (
                    <span className={`text-[10px] font-mono ${isDay ? "text-amber-800 font-bold" : "text-amber-300"}`}>
                      Awaiting Co-Party Acknowledgment
                    </span>
                  )}
                </div>

                <p className={`font-medium ${isDay ? "text-stone-800" : "text-slate-300"}`}>{am.reason}</p>

                <div className={`font-mono text-[10px] space-y-0.5 pt-1 border-t ${
                  isDay ? "border-stone-200 text-stone-600" : "border-slate-800/80 text-slate-500"
                }`}>
                  <p>Prev Hash: {am.prev_hash}</p>
                  <p className={isDay ? "text-emerald-800 font-bold" : "text-emerald-400/80"}>
                    Amendment Hash: {am.amendment_hash}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`rounded-2xl max-w-md w-full p-6 shadow-2xl border ${
            isDay
              ? "bg-[#FAF8F5] border-stone-300 text-stone-900"
              : "bg-slate-900 border-slate-700 text-slate-100"
          }`}>
            <h3 className={`text-base font-bold mb-2 ${isDay ? "text-stone-950" : "text-white"}`}>
              Reject Inspection Record
            </h3>
            <p className={`text-xs mb-4 leading-relaxed ${isDay ? "text-stone-600" : "text-slate-400"}`}>
              Specify the reason for rejection (e.g. missing meter photos, disputes over kitchen stains).
              This will transition the inspection to disputed status for correction.
            </p>

            <form onSubmit={handleReject} className="space-y-4">
              <div>
                <textarea
                  required
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Geyser was not tested; master bedroom wardrobe scratch not documented..."
                  className={`w-full rounded-xl px-3 py-2 text-xs transition focus:outline-none ${
                    isDay
                      ? "bg-white border border-stone-300 text-stone-900 placeholder-stone-400 focus:border-emerald-600"
                      : "bg-slate-950 border border-slate-700 text-slate-200 placeholder-slate-600 focus:border-emerald-400"
                  }`}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className={`text-xs px-3 py-2 rounded-lg transition cursor-pointer ${
                    isDay ? "text-stone-600 hover:text-stone-900" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingApproval || !rejectReason.trim()}
                  className="text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {processingApproval ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Amendment Modal */}
      <AmendmentModal
        isOpen={showAmendmentModal}
        onClose={() => setShowAmendmentModal(false)}
        onSubmit={handleCreateAmendment}
        isSubmitting={submittingAmendment}
        theme={theme}
      />
    </div>
  );
}
