import React, { useState } from "react";
import { 
  X, 
  Mail, 
  Phone, 
  MessageSquare, 
  ShieldCheck, 
  Star, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink,
  Building,
  Calendar
} from "lucide-react";

/**
 * LandlordProfileModal
 * 
 * Interactive pop-out profile card for property landlords.
 * Displays verified landlord credentials, bio, response times, and
 * direct Gmail, Email, Phone, and WhatsApp contact channels.
 */
export default function LandlordProfileModal({ 
  landlord, 
  property, 
  onClose,
  onNavigate 
}) {
  const [copiedType, setCopiedType] = useState(null); // 'email' | 'phone'
  const [inquiryText, setInquiryText] = useState(
    `Hi ${landlord?.name || "Landlord"}, I saw your property listing for "${property?.title || "your property"}" on DepositGuard. I would like to schedule a visit and review the move-in condition baseline.`
  );

  if (!landlord) return null;

  const email = landlord.email || "landlord.contact@gmail.com";
  const phone = landlord.phone || "+91 98450 12890";
  const cleanPhone = phone.replace(/[^0-9]/g, "");

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    email
  )}&su=${encodeURIComponent(
    `Inquiry: ${property?.title || "Rental Property"} (via DepositGuard)`
  )}&body=${encodeURIComponent(inquiryText)}`;

  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    inquiryText
  )}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div 
        className="bg-white rounded-3xl max-w-xl w-full border border-slate-200/90 shadow-2xl overflow-hidden my-6 transform transition-all duration-300 relative text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cover Banner */}
        <div className="h-32 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 relative p-4 flex justify-between items-start">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-[11px] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>DepositGuard Verified Host</span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition cursor-pointer"
            aria-label="Close landlord profile"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Card Body */}
        <div className="px-6 pt-0 pb-6 relative">
          {/* Avatar & Key Header Details */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 mb-4">
            <div className="flex items-end gap-3.5">
              <div className="w-22 h-22 rounded-2xl bg-white p-1 shadow-xl border border-slate-200/80">
                <div className="w-full h-full rounded-xl bg-gradient-to-br from-emerald-700 to-teal-800 text-white flex items-center justify-center text-3xl font-black shadow-inner">
                  {(landlord.name || "L")[0]}
                </div>
              </div>

              <div className="mb-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
                    {landlord.name}
                  </h3>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100 flex-shrink-0" />
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span className="flex items-center gap-1 text-amber-600 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{landlord.rating || 4.9}</span>
                  </span>
                  <span>&bull;</span>
                  <span>{landlord.reviewsCount || 24} Verified Reviews</span>
                </div>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold self-start sm:self-end">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Available for Inquiries</span>
            </span>
          </div>

          {/* Quick Meta Row */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-600 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{landlord.city || property?.city || "Bangalore"}, India</span>
            </div>
            <div className="flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <span>{landlord.propertiesCount || 1} Listed Properties</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Joined {landlord.memberSince || "2023"}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700 font-medium">Responds in &lt; 30 mins</span>
            </div>
          </div>

          {/* Bio statement */}
          {landlord.bio && (
            <p className="text-xs text-slate-600 mt-3 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/60">
              "{landlord.bio}"
            </p>
          )}

          {/* ================= CONTACT CHANNELS (GMAIL & PHONE) ================= */}
          <div className="mt-5 space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-slate-500">
              Direct Contact & Gmail Details
            </h4>

            {/* Gmail / Email Box */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-red-50/60 via-slate-50 to-white border border-red-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100/90 text-red-600 border border-red-200 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-500 block">
                    Verified Gmail Address
                  </span>
                  <span className="text-sm font-bold text-slate-900 select-all font-mono">
                    {email}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(email, "email")}
                  className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium transition flex items-center gap-1 cursor-pointer shadow-xs"
                  title="Copy email to clipboard"
                >
                  {copiedType === "email" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <a
                  href={gmailComposeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-1 shadow-xs shadow-red-600/20"
                >
                  <span>Open Gmail</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Phone & WhatsApp Box */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50/60 via-slate-50 to-white border border-emerald-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100/90 text-emerald-700 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-500 block">
                    Mobile & WhatsApp
                  </span>
                  <span className="text-sm font-bold text-slate-900 select-all font-mono">
                    {phone}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(phone, "phone")}
                  className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium transition flex items-center gap-1 cursor-pointer shadow-xs"
                  title="Copy phone to clipboard"
                >
                  {copiedType === "phone" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center gap-1 shadow-xs shadow-emerald-700/20"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>

          {/* Quick Pre-filled Inquiry Box */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
              Personalize Your Direct Inquiry:
            </label>
            <textarea
              value={inquiryText}
              onChange={(e) => setInquiryText(e.target.value)}
              rows={2}
              className="w-full text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-emerald-600 focus:bg-white transition resize-none leading-relaxed"
            />
          </div>

          {/* Statutory Trust Guarantees */}
          <div className="mt-4 p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl space-y-1 text-[11px] text-emerald-950">
            <div className="flex items-center gap-2 font-semibold">
              <span className="text-emerald-600 font-bold">✓</span>
              <span>Deposit capped at strictly 2 months rent (Model Tenancy Act)</span>
            </div>
            <div className="flex items-center gap-2 font-semibold">
              <span className="text-emerald-600 font-bold">✓</span>
              <span>Aadhaar KYC & Title Deed Verified on DepositGuard</span>
            </div>
            <div className="flex items-center gap-2 font-semibold">
              <span className="text-emerald-600 font-bold">✓</span>
              <span>SHA-256 baseline inspection ready — zero silent deductions</span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="mt-5 flex items-center gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition cursor-pointer text-center"
            >
              Close Profile
            </button>
            <a
              href={gmailComposeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition text-center shadow-md shadow-slate-900/10 flex items-center justify-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5 text-red-400" />
              <span>Contact via Gmail</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
