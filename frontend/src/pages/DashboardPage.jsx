import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/client";
import BrandLogo from "../components/BrandLogo";
import DisclaimerBanner from "../components/DisclaimerBanner";
import LiquidGlassExpandableSidebar from "../components/ui/liquid-glass-expandable-sidebar";
import {
  House,
  Building2,
  ClipboardCheck,
  Sparkles,
  Scale,
  FileText,
  Compass,
  Plus,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Copy,
  ExternalLink,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  UserCheck,
  Sun,
  Moon
} from "lucide-react";

export default function DashboardPage({ onNavigate, onSelectInspection, theme: propTheme, onToggleTheme }) {
  const { user } = useAuth();

  // Day / Night Mode support (standalone fallback or synced with App.jsx)
  const [localTheme, setLocalTheme] = useState(() => {
    try {
      return localStorage.getItem("depositguard_dashboard_theme") || "night";
    } catch {
      return "night";
    }
  });

  const theme = propTheme || localTheme;
  const isDay = theme === "day";

  const toggleTheme = () => {
    if (onToggleTheme) {
      onToggleTheme();
    } else {
      const next = isDay ? "night" : "day";
      try {
        localStorage.setItem("depositguard_dashboard_theme", next);
      } catch {}
      setLocalTheme(next);
    }
  };
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create Property Modal (Landlord)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Bengaluru");
  const [propertyType, setPropertyType] = useState("flat");
  const [isCreating, setIsCreating] = useState(false);

  // Join Property Modal (Tenant)
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  // Selected Property & Inspections
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [inspections, setInspections] = useState([]);
  const [loadingInspections, setLoadingInspections] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  // Active Navigation Tab for Sidebar
  const [activeNavId, setActiveNavId] = useState("overview");

  useEffect(() => {
    if (!user) {
      onNavigate("auth", { initialMode: "login" });
    }
  }, [user]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const data = await api.listProperties();
      setProperties(data);
      if (data.length > 0 && !selectedPropertyId) {
        setSelectedPropertyId(data[0].id);
      }
    } catch (err) {
      if (err.status === 401 || err.message?.toLowerCase().includes("credential") || err.message?.toLowerCase().includes("auth")) {
        onNavigate("auth", { initialMode: "login" });
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    if (selectedPropertyId) {
      setLoadingInspections(true);
      api.listInspectionsForProperty(selectedPropertyId)
        .then((data) => setInspections(data))
        .catch((err) => console.error(err))
        .finally(() => setLoadingInspections(false));
    }
  }, [selectedPropertyId]);

  const handleCreateProperty = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const newProp = await api.createProperty({
        title,
        address,
        city,
        property_type: propertyType
      });
      // Store in localStorage for instant landing page explore reflection
      try {
        const stored = JSON.parse(localStorage.getItem("depositguard_user_properties") || "[]");
        const enriched = {
          ...newProp,
          landlord_name: user?.full_name || "You (Verified Landlord)",
          isUserListed: true,
          created_at: new Date().toISOString()
        };
        const updated = [enriched, ...stored.filter((p) => p.id !== newProp.id)];
        localStorage.setItem("depositguard_user_properties", JSON.stringify(updated));
      } catch (err) {
        console.warn("Could not cache property to localStorage:", err);
      }
      setShowCreateModal(false);
      setTitle("");
      setAddress("");
      await fetchProperties();
      setSelectedPropertyId(newProp.id);
    } catch (err) {
      alert(err.message || "Failed to create property.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinProperty = async (e) => {
    e.preventDefault();
    setIsJoining(true);
    try {
      const joinedProp = await api.joinProperty(inviteCode.trim().toUpperCase());
      setShowJoinModal(false);
      setInviteCode("");
      await fetchProperties();
      setSelectedPropertyId(joinedProp.id);
    } catch (err) {
      alert(err.message || "Invalid invite code or property already has a tenant.");
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreateInspection = async (type = "move_in") => {
    if (!selectedPropertyId) return;
    try {
      const newInsp = await api.createInspection({
        property_id: selectedPropertyId,
        type: type,
        use_default_checklist: true
      });
      onSelectInspection(newInsp.id);
    } catch (err) {
      alert(err.message || "Failed to initialize inspection checklist.");
    }
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);
  const hasMoveInInspection = inspections.some((i) => i.type === "move_in");
  const lockedMoveIn = inspections.find((i) => i.type === "move_in" && i.status === "locked");
  const hasMoveOutInspection = inspections.some((i) => i.type === "move_out");
  const moveOutInspection = inspections.find((i) => i.type === "move_out");

  // Sidebar navigation configuration adhering strictly to LiquidGlassExpandableSidebar prompt
  const sidebarGroups = [
    {
      label: "Workspace",
      items: [
        {
          id: "overview",
          label: "Dashboard Overview",
          href: "#overview",
          icon: <House />
        },
        {
          id: "properties",
          label: "Managed Properties",
          href: "#properties",
          icon: <Building2 />,
          badge: properties.length > 0 ? `${properties.length}` : undefined
        },
        {
          id: "inspections",
          label: "Condition Baselines",
          href: "#inspections",
          icon: <ClipboardCheck />,
          badge: inspections.length > 0 ? `${inspections.length}` : undefined
        }
      ]
    },
    {
      label: "AI & Settlements",
      items: [
        {
          id: "comparison",
          label: "AI Condition Triage",
          href: "#comparison",
          icon: <Sparkles />
        },
        {
          id: "settlement",
          label: "Settlement & Reports",
          href: "#settlement",
          icon: <FileText />
        }
      ]
    },
    {
      label: "Community & Explore",
      items: [
        {
          id: "explore",
          label: "Explore Verified Hub",
          href: "#explore",
          icon: <Compass />
        },
        {
          id: "action_modal",
          label: user?.role === "landlord" ? "Register Property" : "Join Property",
          href: "#action",
          icon: user?.role === "landlord" ? <Plus /> : <KeyRound />
        }
      ]
    }
  ];

  const handleSidebarNavigate = (item, event) => {
    event.preventDefault();
    if (item.id === "comparison") {
      onNavigate("comparison", {
        propertyId: selectedPropertyId,
        moveOutInspectionId: moveOutInspection?.id
      });
    } else if (item.id === "settlement") {
      onNavigate("settlement", { propertyId: selectedPropertyId });
    } else if (item.id === "explore") {
      onNavigate("landing");
    } else if (item.id === "profile") {
      const el = document.getElementById("overview");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else if (item.id === "action_modal") {
      if (user?.role === "landlord") {
        setShowCreateModal(true);
      } else {
        setShowJoinModal(true);
      }
    } else {
      setActiveNavId(item.id);
      const el = document.getElementById(item.id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className={`min-h-screen bg-transparent relative overflow-hidden font-sans transition-colors duration-500 ${
      isDay ? "text-stone-900 selection:bg-emerald-800 selection:text-white" : "text-slate-100 selection:bg-emerald-500 selection:text-slate-950"
    }`}>
      <div className={`absolute top-0 inset-x-0 h-px z-10 transition-colors duration-500 ${
        isDay
          ? "bg-gradient-to-r from-transparent via-stone-300 to-transparent"
          : "bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"
      }`} />

      {/* Main Content Viewport */}
      <div className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DisclaimerBanner theme={theme} />

        {/* Dashboard Frame: Liquid Glass Sidebar + Main Dashboard Canvas */}
        <div className="flex flex-col lg:flex-row items-start gap-6 lg:gap-8 mt-2">
          {/* =========================================================================
              SIDEBAR COLUMN (Liquid Glass Expandable Sidebar from React Bits)
          ========================================================================= */}
          <aside className="w-full lg:w-auto flex-shrink-0 lg:sticky lg:top-20 z-30">
            <LiquidGlassExpandableSidebar
              groups={sidebarGroups}
              activeId={activeNavId}
              brand="DepositGuard"
              brandDetail={user?.role === "landlord" ? "Landlord Workspace" : "Tenant Suite"}
              brandIcon={
                <BrandLogo variant="icon" className="w-8 h-8" />
              }
              onBrandClick={() => onNavigate("landing")}
              account={{
                id: "profile",
                name: user?.full_name || user?.email || "User",
                detail: user?.role === "landlord" ? "Verified Landlord" : "Registered Tenant",
                initials: (user?.full_name || user?.email || "DG").slice(0, 2).toUpperCase(),
                href: "#profile"
              }}
              defaultExpanded={true}
              selectionLight={isDay ? 0 : 1}
              onNavigate={handleSidebarNavigate}
              glass={
                isDay
                  ? {
                      blur: 16,
                      opacity: 0.9,
                      saturation: 1.2,
                      edge: 0.88,
                      distortion: 16,
                      tint: "#FAF7F2"
                    }
                  : {
                      blur: 18,
                      opacity: 0.14,
                      saturation: 1.45,
                      edge: 0.88,
                      distortion: 24,
                      tint: "#060913"
                    }
              }
              style={
                isDay
                  ? {
                      "--color-card": "#FAF7F2",
                      "--color-foreground": "#1c1917",
                      "--color-primary": "#047857",
                      "--color-border": "rgba(68, 64, 60, 0.12)",
                      "--color-glass-highlight": "rgba(255, 255, 255, 0.85)",
                      "--color-glass-shadow": "rgba(68, 64, 60, 0.08)"
                    }
                  : {
                      "--color-card": "#060913",
                      "--color-foreground": "#f8fafc",
                      "--color-primary": "#10b981",
                      "--color-border": "rgba(255, 255, 255, 0.08)",
                      "--color-glass-highlight": "rgba(255, 255, 255, 0.16)",
                      "--color-glass-shadow": "#000000"
                    }
              }
            />
          </aside>

          {/* =========================================================================
              MAIN WORKSPACE CANVAS (Luminous, Clean, Glass Aesthetic)
          ========================================================================= */}
          <main className="flex-1 min-w-0 w-full space-y-7" id="overview">
            {/* Header Glass Hero Card */}
            <div className={`relative overflow-hidden rounded-3xl border p-6 sm:p-8 backdrop-blur-2xl transition-all duration-300 ${
              isDay
                ? "border-[#E7E1D7] bg-[#FCFAF7]/95 shadow-[0_8px_32px_rgba(40,30,20,0.05)] hover:border-emerald-700/30"
                : "border-white/[0.08] bg-slate-900/40 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:border-emerald-500/30"
            }`}>
              <div className={`absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-colors duration-500 ${
                isDay ? "bg-amber-400/10" : "bg-emerald-500/10"
              }`} />
              <div className={`absolute bottom-0 left-1/3 -mb-10 w-60 h-60 rounded-full blur-3xl pointer-events-none transition-colors duration-500 ${
                isDay ? "bg-emerald-600/5" : "bg-emerald-500/10"
              }`} />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div>
                  <div className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold mb-3 transition-colors ${
                    isDay
                      ? "bg-emerald-50/90 border border-emerald-200/90 text-emerald-950 shadow-sm"
                      : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      isDay ? "bg-emerald-700" : "bg-emerald-400 animate-pulse"
                    }`} />
                    <span className="font-mono text-[11px] tracking-wide uppercase font-bold">MTA 2021 Compliant Protected Workspace</span>
                  </div>
                  <h1 className={`text-2xl sm:text-4xl font-extrabold tracking-tight transition-colors ${
                    isDay ? "text-stone-900 font-sans" : "text-white"
                  }`}>
                    Welcome back,{" "}
                    <span className={
                      isDay
                        ? "font-serif italic font-normal text-emerald-800"
                        : "bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 drop-shadow-[0_0_25px_rgba(16,185,129,0.35)] text-transparent bg-clip-text"
                    }>
                      {user?.full_name || user?.email?.split("@")[0]}
                    </span>
                  </h1>
                  <p className={`text-xs sm:text-sm mt-2 max-w-xl leading-relaxed transition-colors ${
                    isDay ? "text-stone-600" : "text-slate-400/90"
                  }`}>
                    Manage tamper-evident rental inspections, review SHA-256 cryptographic hashes, and resolve move-out settlements fairly.
                  </p>
                </div>

                {/* Quick Action Pill Button & Day/Night Mode Switch */}
                <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                  {/* Day / Night Theme Toggle */}
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all duration-300 text-xs font-semibold cursor-pointer shadow-sm ${
                      isDay
                        ? "bg-[#F3EFE6] hover:bg-[#EAE3D4] text-stone-800 border-[#DDD5C7] shadow-sm"
                        : "bg-slate-900/80 hover:bg-slate-900 text-slate-200 border-white/[0.1] hover:border-emerald-500/40 shadow-[0_0_15px_rgba(0,0,0,0.3)]"
                    }`}
                    title={isDay ? "Switch to Night Mode" : "Switch to Day Mode"}
                  >
                    {isDay ? (
                      <>
                        <Sun className="w-4 h-4 text-amber-600" />
                        <span className="font-semibold text-stone-800">Day Mode</span>
                      </>
                    ) : (
                      <>
                        <Moon className="w-4 h-4 text-emerald-400" />
                        <span className="font-semibold text-slate-200">Night Mode</span>
                      </>
                    )}
                  </button>

                  {user?.role === "landlord" ? (
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className={`inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full font-black text-xs sm:text-sm tracking-wide transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                        isDay
                          ? "bg-stone-900 hover:bg-stone-800 text-stone-100 shadow-md shadow-stone-900/10"
                          : "bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 shadow-[0_0_25px_rgba(52,211,153,0.4)] hover:shadow-[0_0_35px_rgba(52,211,153,0.6)]"
                      }`}
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>Register Property</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowJoinModal(true)}
                      className={`inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full font-black text-xs sm:text-sm tracking-wide transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                        isDay
                          ? "bg-stone-900 hover:bg-stone-800 text-stone-100 shadow-md shadow-stone-900/10"
                          : "bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 shadow-[0_0_25px_rgba(52,211,153,0.4)] hover:shadow-[0_0_35px_rgba(52,211,153,0.6)]"
                      }`}
                    >
                      <KeyRound className="w-4 h-4 stroke-[3]" />
                      <span>Join with Code</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 4 Bespoke Tenancy Vault Metric Cards */}
              <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t ${
                isDay ? "border-[#E8E2D7]" : "border-white/[0.08]"
              }`}>
                {/* Metric 1: Active Property */}
                <div
                  onClick={() => {
                    const el = document.getElementById("properties");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  title="Click to view managed properties"
                  className={`rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 group border backdrop-blur-xl cursor-pointer ${
                    isDay
                      ? "bg-[#F8F5EE]/95 border-[#E2DBD0] hover:border-emerald-700/40 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                      : "bg-slate-950/50 border-white/[0.07] hover:border-emerald-500/40 hover:shadow-[0_0_20px_rgba(16,185,129,0.12)] hover:-translate-y-0.5"
                  }`}
                >
                  <div className={`flex items-center justify-between text-xs ${isDay ? "text-stone-500" : "text-slate-400"}`}>
                    <span className="font-mono text-[10px] tracking-widest uppercase font-bold">
                      Active Property
                    </span>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      isDay
                        ? "bg-stone-200/80 border border-stone-300 text-stone-800 shadow-sm"
                        : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                    }`}>
                      <Building2 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <h4 className={`text-sm font-bold truncate transition ${
                      isDay ? "text-stone-900 group-hover:text-emerald-950" : "text-slate-100 group-hover:text-white"
                    }`}>
                      {selectedProperty ? selectedProperty.title : "No Property Selected"}
                    </h4>
                    <span className={`text-[11px] flex items-center gap-1.5 mt-1 font-medium ${
                      isDay ? "text-emerald-800" : "text-emerald-400"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        isDay ? "bg-emerald-600" : "bg-emerald-400 animate-pulse"
                      }`} />
                      {selectedProperty ? `${selectedProperty.city} • Active Lease` : "Select below"}
                    </span>
                  </div>
                </div>

                {/* Metric 2: Baseline Lock */}
                <div
                  onClick={() => {
                    const el = document.getElementById("inspections");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  title="Click to view condition baseline records"
                  className={`rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 group border backdrop-blur-xl cursor-pointer ${
                    isDay
                      ? "bg-[#F8F5EE]/95 border-[#E2DBD0] hover:border-emerald-700/40 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                      : "bg-slate-950/50 border-white/[0.07] hover:border-emerald-500/40 hover:shadow-[0_0_20px_rgba(16,185,129,0.12)] hover:-translate-y-0.5"
                  }`}
                >
                  <div className={`flex items-center justify-between text-xs ${isDay ? "text-stone-500" : "text-slate-400"}`}>
                    <span className="font-mono text-[10px] tracking-widest uppercase font-bold">
                      Move-In Baseline
                    </span>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      isDay
                        ? "bg-emerald-100/80 border border-emerald-200 text-emerald-800 shadow-sm"
                        : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                    }`}>
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span
                      className={`text-sm font-bold flex items-center gap-1.5 ${
                        lockedMoveIn
                          ? isDay ? "text-emerald-800" : "text-emerald-300"
                          : hasMoveInInspection
                          ? isDay ? "text-amber-800" : "text-amber-300"
                          : isDay ? "text-stone-600" : "text-slate-400"
                      }`}
                    >
                      {lockedMoveIn ? "✓ Cryptographically Locked" : hasMoveInInspection ? "Dual Approval Pending" : "Baseline Not Created"}
                    </span>
                    <span className={`text-[11px] block font-mono truncate mt-1 ${isDay ? "text-stone-600" : "text-slate-400"}`}>
                      {lockedMoveIn ? `SHA-256: ${lockedMoveIn.locked_hash?.substring(0, 16)}...` : "Dual confirmation ready"}
                    </span>
                  </div>
                </div>

                {/* Metric 3: MTA Deposit Cap */}
                <div
                  onClick={() => onNavigate("settlement", { propertyId: selectedPropertyId })}
                  title="Click to view deposit protection & settlement"
                  className={`rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 group border backdrop-blur-xl cursor-pointer ${
                    isDay
                      ? "bg-[#F8F5EE]/95 border-[#E2DBD0] hover:border-emerald-700/40 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                      : "bg-slate-950/50 border-white/[0.07] hover:border-emerald-500/40 hover:shadow-[0_0_20px_rgba(16,185,129,0.12)] hover:-translate-y-0.5"
                  }`}
                >
                  <div className={`flex items-center justify-between text-xs ${isDay ? "text-stone-500" : "text-slate-400"}`}>
                    <span className="font-mono text-[10px] tracking-widest uppercase font-bold">
                      Deposit Protection
                    </span>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      isDay
                        ? "bg-amber-100/80 border border-amber-200 text-amber-800 shadow-sm"
                        : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                    }`}>
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className={`text-sm font-bold transition ${isDay ? "text-stone-900 group-hover:text-emerald-950" : "text-slate-100 group-hover:text-white"}`}>
                      MTA 2021 Verified
                    </span>
                    <span className={`text-[11px] block mt-1 font-medium ${isDay ? "text-emerald-800" : "text-emerald-400"}`}>
                      Max 2 Months Rent Capped
                    </span>
                  </div>
                </div>

                {/* Metric 4: Disputes Prevented */}
                <div
                  onClick={() => {
                    const el = document.getElementById("inspections");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                  }}
                  title="Click to view 5 essential room suites"
                  className={`rounded-2xl p-4 flex flex-col justify-between transition-all duration-300 group border backdrop-blur-xl cursor-pointer ${
                    isDay
                      ? "bg-[#F8F5EE]/95 border-[#E2DBD0] hover:border-emerald-700/40 shadow-sm hover:shadow-md hover:-translate-y-0.5"
                      : "bg-slate-950/50 border-white/[0.07] hover:border-emerald-500/40 hover:shadow-[0_0_20px_rgba(16,185,129,0.12)] hover:-translate-y-0.5"
                  }`}
                >
                  <div className={`flex items-center justify-between text-xs ${isDay ? "text-stone-500" : "text-slate-400"}`}>
                    <span className="font-mono text-[10px] tracking-widest uppercase font-bold">
                      Condition Suites
                    </span>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      isDay
                        ? "bg-stone-200/80 border border-stone-300 text-stone-800 shadow-sm"
                        : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                    }`}>
                      <ClipboardCheck className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className={`text-sm font-bold transition ${isDay ? "text-stone-900 group-hover:text-emerald-950" : "text-slate-100 group-hover:text-white"}`}>
                      5 Essential Suites
                    </span>
                    <span className={`text-[11px] block mt-1 ${isDay ? "text-stone-600" : "text-slate-400"}`}>
                      Bedroom &bull; Bath &bull; Kitchen &bull; Living
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {loading ? (
              <div className={`text-center py-20 rounded-3xl border backdrop-blur-xl ${
                isDay ? "bg-[#FCFAF7]/90 border-[#E7E1D7]" : "bg-slate-900/40 border-white/[0.08]"
              }`}>
                <div className={`inline-block animate-spin w-8 h-8 border-2 border-t-transparent rounded-full mb-3 ${
                  isDay ? "border-emerald-700" : "border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                }`} />
                <p className={`text-sm ${isDay ? "text-stone-600" : "text-slate-400"}`}>
                  Loading verified property and inspection records...
                </p>
              </div>
            ) : error ? (
              <div className="bg-rose-950/40 border border-rose-800/80 rounded-2xl p-5 text-sm text-rose-300 flex items-center gap-3 backdrop-blur-xl">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            ) : properties.length === 0 ? (
              /* Empty State */
              <div className={`rounded-3xl p-12 text-center backdrop-blur-2xl border ${
                isDay
                  ? "bg-[#FCFAF7]/95 border-[#E7E1D7] text-stone-600 shadow-sm"
                  : "bg-slate-900/40 border-white/[0.08] text-slate-400 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]"
              }`}>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto text-3xl mb-4 ${
                  isDay
                    ? "bg-stone-100 border border-stone-200 text-stone-800 shadow-sm"
                    : "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                }`}>
                  🏡
                </div>
                <h3 className={`text-lg font-bold ${isDay ? "text-stone-900" : "text-white"}`}>
                  No Properties Found
                </h3>
                <p className={`text-xs sm:text-sm mt-2 max-w-md mx-auto leading-relaxed ${isDay ? "text-stone-600" : "text-slate-400"}`}>
                  {user?.role === "landlord"
                    ? "You haven't registered any rental property yet. Create your first property to generate a secure invite code for your tenant."
                    : "You haven't joined any property yet. Ask your landlord for their 6-character DepositGuard invite code."}
                </p>
                <div className="mt-6">
                  {user?.role === "landlord" ? (
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-xs tracking-wide transition cursor-pointer ${
                        isDay
                          ? "bg-stone-900 hover:bg-stone-800 text-white shadow-md shadow-stone-900/10"
                          : "bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
                      }`}
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>Register Property</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowJoinModal(true)}
                      className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-xs tracking-wide transition cursor-pointer ${
                        isDay
                          ? "bg-stone-900 hover:bg-stone-800 text-white shadow-md shadow-stone-900/10"
                          : "bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
                      }`}
                    >
                      <KeyRound className="w-4 h-4 stroke-[2.5]" />
                      <span>Enter Invite Code</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Two-Column Grid: Managed Properties on Left, Inspection Suites on Right */
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* =========================================================================
                    PROPERTIES COLUMN
                ========================================================================= */}
                <div className="space-y-4" id="properties">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-2 ${
                      isDay ? "text-stone-600" : "text-slate-400"
                    }`}>
                      <span>Your Properties</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        isDay
                          ? "bg-stone-100 border-stone-200 text-stone-700 shadow-sm"
                          : "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                      }`}>
                        {properties.length}
                      </span>
                    </h3>
                    {user?.role === "landlord" && (
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className={`text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                          isDay ? "text-emerald-800 hover:text-emerald-950" : "text-emerald-400 hover:text-emerald-300"
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {properties.map((prop) => {
                      const isSelected = selectedPropertyId === prop.id;
                      return (
                        <div
                          key={prop.id}
                          onClick={() => setSelectedPropertyId(prop.id)}
                          className={`p-5 rounded-2xl border cursor-pointer transition-all duration-300 relative backdrop-blur-xl ${
                            isDay
                              ? isSelected
                                ? "bg-[#FAF7F2] border-emerald-700/60 shadow-[0_4px_20px_rgba(4,120,87,0.08)] ring-1 ring-emerald-700/30"
                                : "bg-[#FCFAF7]/90 border-[#E7E1D7] hover:border-stone-400 hover:bg-[#FAF7F2] shadow-sm"
                              : isSelected
                              ? "bg-slate-900/60 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.18)] ring-1 ring-emerald-500/40"
                              : "bg-slate-900/30 border-white/[0.06] hover:border-white/[0.15] hover:bg-slate-900/50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className={`font-bold text-sm transition ${
                                isDay
                                  ? "text-stone-900 group-hover:text-emerald-900"
                                  : "text-white group-hover:text-emerald-400"
                              }`}>
                                {prop.title}
                              </h4>
                              <p className={`text-xs mt-1 line-clamp-1 ${isDay ? "text-stone-600" : "text-slate-400"}`}>
                                {prop.address}, {prop.city}
                              </p>
                            </div>
                            <span className={`text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full border flex-shrink-0 ${
                              isDay
                                ? "bg-stone-100 border-stone-200 text-stone-700"
                                : "bg-white/[0.06] border-white/[0.1] text-slate-300"
                            }`}>
                              {prop.property_type}
                            </span>
                          </div>

                          <div className={`mt-4 pt-3 border-t flex items-center justify-between text-xs ${
                            isDay ? "border-stone-200/80" : "border-white/[0.06]"
                          }`}>
                            <span className={`flex items-center gap-1 text-[11px] ${isDay ? "text-stone-600" : "text-slate-400"}`}>
                              <UserCheck className={`w-3.5 h-3.5 ${isDay ? "text-emerald-800" : "text-emerald-400"}`} />
                              <span>{prop.members?.length || 1} Registered</span>
                            </span>

                            {prop.invite_code && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(prop.invite_code);
                                }}
                                className={`flex items-center gap-1.5 font-mono font-bold text-[11px] px-3 py-1 rounded-xl border transition cursor-pointer ${
                                  isDay
                                    ? "text-amber-900 bg-[#FBF6ED] hover:bg-[#F5ECCB] border-[#E8D9C0] shadow-sm"
                                    : "text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)] hover:border-amber-400"
                                }`}
                                title="Click to copy invite code for tenant"
                              >
                                <span>{copiedCode === prop.invite_code ? "✓ Copied!" : prop.invite_code}</span>
                                <Copy className={`w-3 h-3 ${isDay ? "text-amber-800" : "text-amber-400"}`} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* =========================================================================
                    INSPECTIONS & ACTION COLUMN
                ========================================================================= */}
                <div className="lg:col-span-2 space-y-4" id="inspections">
                  {/* Status Banner */}
                  {hasMoveInInspection && (
                    <div className={`backdrop-blur-xl border rounded-2xl p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isDay
                        ? "bg-[#F3F8F5] border border-emerald-200/90 text-stone-800 shadow-sm"
                        : "bg-slate-900/40 border-white/[0.08] text-slate-300 shadow-[0_4px_24px_rgba(0,0,0,0.25)]"
                    }`}>
                      <div className="flex items-center gap-2.5">
                        <span className={`font-bold text-sm ${isDay ? "text-emerald-800" : "text-emerald-400"}`}>ℹ️</span>
                        <span>Move-In Inspection baseline active. Both tenant and landlord share this immutable record.</span>
                      </div>
                      {lockedMoveIn && (
                        <span className={`text-[10px] font-mono border px-3 py-1 rounded-full font-bold flex-shrink-0 self-start sm:self-auto ${
                          isDay
                            ? "bg-emerald-100 text-emerald-900 border-emerald-300 shadow-sm"
                            : "bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                        }`}>
                          SHA-256 Locked ✓
                        </span>
                      )}
                    </div>
                  )}

                  {/* Inspection Header Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className={`text-[11px] font-mono font-bold uppercase tracking-wider ${
                      isDay ? "text-stone-600" : "text-slate-400"
                    }`}>
                      Checklist Records ({inspections.length})
                    </h3>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleCreateInspection("move_in")}
                        disabled={hasMoveInInspection}
                        title={hasMoveInInspection ? "Move-In Inspection already exists for this property" : "Create Move-In Inspection"}
                        className={`text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer ${
                          hasMoveInInspection
                            ? isDay
                              ? "bg-stone-100 text-stone-500 border border-stone-200 cursor-not-allowed"
                              : "bg-slate-900/50 text-slate-500 cursor-not-allowed border border-white/[0.06]"
                            : isDay
                            ? "bg-stone-900 hover:bg-stone-800 text-white font-bold shadow-sm"
                            : "bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold shadow-[0_0_15px_rgba(16,185,129,0.35)]"
                        }`}
                      >
                        {hasMoveInInspection ? "✓ Move-In Active" : "+ New Move-In Checklist"}
                      </button>

                      {lockedMoveIn && !hasMoveOutInspection && (
                        <button
                          onClick={() => handleCreateInspection("move_out")}
                          className="text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white px-4 py-2 rounded-xl transition shadow-sm cursor-pointer"
                        >
                          + Initiate Move-Out
                        </button>
                      )}

                      {hasMoveOutInspection && (
                        <button
                          onClick={() =>
                            onNavigate("comparison", {
                              propertyId: selectedPropertyId,
                              moveOutInspectionId: moveOutInspection?.id
                            })
                          }
                          className={`text-xs font-semibold px-4 py-2 rounded-xl border transition flex items-center gap-2 backdrop-blur-md cursor-pointer ${
                            isDay
                              ? "bg-[#FAF7F2] hover:bg-[#F3EFE7] text-stone-800 border-[#DDD5C7] hover:border-emerald-600 shadow-sm"
                              : "bg-slate-800/70 hover:bg-slate-800 text-teal-300 border-teal-500/30 hover:border-teal-500/60 shadow-[0_0_15px_rgba(45,212,191,0.2)]"
                          }`}
                        >
                          <Scale className="w-3.5 h-3.5 text-emerald-800" />
                          <span>AI Comparison</span>
                        </button>
                      )}

                      <button
                        onClick={() => onNavigate("settlement", { propertyId: selectedPropertyId })}
                        className={`text-xs font-semibold px-4 py-2 rounded-xl border transition flex items-center gap-2 backdrop-blur-md cursor-pointer ${
                          isDay
                            ? "bg-[#FAF7F2] hover:bg-[#F3EFE7] text-stone-800 border-[#DDD5C7] shadow-sm"
                            : "bg-slate-800/70 hover:bg-slate-800 text-slate-200 border-white/[0.1] hover:border-white/[0.25] shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Settlement & PDF</span>
                      </button>
                    </div>
                  </div>

                  {/* Inspections List */}
                  {loadingInspections ? (
                    <div className={`text-center py-12 text-xs ${isDay ? "text-stone-500" : "text-slate-400"}`}>
                      Loading inspection suites...
                    </div>
                  ) : inspections.length === 0 ? (
                    <div className={`border rounded-2xl p-8 text-center backdrop-blur-xl ${
                      isDay
                        ? "bg-[#FCFAF7]/90 border-[#E7E1D7] text-stone-600 shadow-sm"
                        : "bg-slate-900/30 border-white/[0.08] text-slate-400"
                    }`}>
                      <p className="text-xs">No inspections created yet for this property.</p>
                      <button
                        onClick={() => handleCreateInspection("move_in")}
                        className={`mt-3 text-xs font-bold px-5 py-2.5 rounded-xl transition cursor-pointer ${
                          isDay
                            ? "bg-stone-900 hover:bg-stone-800 text-white shadow-md shadow-stone-900/10"
                            : "bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.35)]"
                        }`}
                      >
                        Pre-Populate 5-Suite Move-In Checklist
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {inspections.map((insp) => (
                        <div
                          key={insp.id}
                          className={`backdrop-blur-xl border rounded-2xl p-5 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group ${
                            isDay
                              ? "bg-[#FCFAF7] hover:bg-[#FAF7F2] border-[#E7E1D7] hover:border-emerald-700/40 shadow-sm hover:shadow-md"
                              : "bg-slate-900/40 hover:bg-slate-900/60 border-white/[0.07] hover:border-emerald-500/40 shadow-[0_4px_24px_rgba(0,0,0,0.25)] hover:shadow-[0_0_25px_rgba(16,185,129,0.12)]"
                          }`}
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2.5">
                              <span className={`font-bold text-sm capitalize transition ${
                                isDay ? "text-stone-900 group-hover:text-emerald-900" : "text-white group-hover:text-emerald-300"
                              }`}>
                                {insp.type.replace("_", " ")} Inspection
                              </span>
                              <span
                                className={`text-[10px] font-bold uppercase px-3 py-0.5 rounded-full ${
                                  insp.status === "locked"
                                    ? isDay
                                      ? "bg-emerald-50 text-emerald-800 border border-emerald-300 font-mono shadow-sm"
                                      : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 font-mono shadow-[0_0_10px_rgba(16,185,129,0.25)]"
                                    : insp.status === "pending_approval"
                                    ? isDay
                                      ? "bg-amber-50 text-amber-900 border border-amber-300 font-mono shadow-sm"
                                      : "bg-amber-500/15 text-amber-300 border border-amber-500/40 font-mono shadow-[0_0_10px_rgba(245,158,11,0.25)]"
                                    : insp.status === "disputed"
                                    ? isDay
                                      ? "bg-rose-50 text-rose-800 border border-rose-200 font-mono shadow-sm"
                                      : "bg-rose-500/15 text-rose-300 border border-rose-500/40 font-mono shadow-[0_0_10px_rgba(244,63,94,0.25)]"
                                    : isDay
                                    ? "bg-stone-100 text-stone-700 border border-stone-200"
                                    : "bg-white/[0.06] text-slate-400 border border-white/[0.1]"
                                }`}
                              >
                                {insp.status.replace("_", " ")}
                              </span>
                            </div>

                            <p className={`text-xs ${isDay ? "text-stone-600" : "text-slate-400"}`}>
                              Rooms: {insp.rooms?.length || 5} suites &bull; Created:{" "}
                              {new Date(insp.created_at).toLocaleDateString()}
                            </p>

                            {insp.status === "locked" && (
                              <p className={`text-[11px] font-mono truncate max-w-md ${isDay ? "text-stone-600" : "text-emerald-400"}`}>
                                SHA-256: {insp.locked_hash?.substring(0, 24)}...
                              </p>
                            )}

                            {insp.status === "disputed" && insp.dispute_reason && (
                              <p className="text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                                <ShieldAlert className="w-3.5 h-3.5" />
                                <span>Dispute: {insp.dispute_reason}</span>
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onSelectInspection(insp.id)}
                              className={`text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${
                                isDay
                                  ? "bg-stone-900 hover:bg-stone-800 text-white shadow-sm"
                                  : "bg-slate-800/80 hover:bg-slate-700/80 text-white border border-white/[0.12] hover:border-white/[0.3] shadow-[0_0_15px_rgba(255,255,255,0.08)] hover:shadow-[0_0_20px_rgba(255,255,255,0.15)]"
                              }`}
                            >
                              <span>Open Checklist</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>

                            {insp.status === "locked" && (
                              <button
                                onClick={async () => {
                                  try {
                                    await api.downloadInspectionPdf(insp.id);
                                  } catch (err) {
                                    alert("Failed to export PDF: " + err.message);
                                  }
                                }}
                                className={`text-xs font-bold px-3.5 py-2 rounded-xl border transition flex items-center gap-1.5 cursor-pointer ${
                                  isDay
                                    ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 shadow-sm"
                                    : "bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/40 hover:border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                                }`}
                                title="Download formal tamper-evident PDF report"
                              >
                                PDF ⬇
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* =========================================================================
          CREATE PROPERTY MODAL (Landlord)
      ========================================================================= */}
      {showCreateModal && (
        <div className={`fixed inset-0 z-50 backdrop-blur-md flex items-center justify-center p-4 ${
          isDay ? "bg-stone-900/40" : "bg-slate-950/85"
        }`}>
          <div className={`border rounded-3xl max-w-md w-full p-7 backdrop-blur-2xl transition-all duration-300 ${
            isDay
              ? "bg-[#FAF7F2] border-[#E7E1D7] text-stone-900 shadow-2xl shadow-stone-900/10"
              : "bg-slate-900/90 border-white/[0.12] text-slate-100 shadow-[0_12px_45px_rgba(0,0,0,0.6)]"
          }`}>
            <h3 className={`text-lg font-bold mb-2 ${isDay ? "text-stone-900" : "text-white"}`}>Register Rental Property</h3>
            <p className={`text-xs mb-4 leading-relaxed ${isDay ? "text-stone-600" : "text-slate-400"}`}>
              Registered properties are bound by Indian Model Tenancy Act (MTA 2021) principles: deposits capped at max 2 months rent.
            </p>
            <form onSubmit={handleCreateProperty} className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDay ? "text-stone-700" : "text-slate-300"}`}>Property Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 2BHK Palm Grove, Flat 302"
                  className={`w-full rounded-xl px-4 py-2.5 text-xs transition focus:outline-none ${
                    isDay
                      ? "bg-white border border-stone-300 text-stone-900 placeholder-stone-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 shadow-sm"
                      : "bg-slate-950/80 border border-white/[0.1] text-slate-200 placeholder-slate-500 focus:border-emerald-400 focus:shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isDay ? "text-stone-700" : "text-slate-300"}`}>Address *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 12th Main Road, HSR Layout Sector 1"
                  className={`w-full rounded-xl px-4 py-2.5 text-xs transition focus:outline-none ${
                    isDay
                      ? "bg-white border border-stone-300 text-stone-900 placeholder-stone-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 shadow-sm"
                      : "bg-slate-950/80 border border-white/[0.1] text-slate-200 placeholder-slate-500 focus:border-emerald-400 focus:shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDay ? "text-stone-700" : "text-slate-300"}`}>City *</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={`w-full rounded-xl px-4 py-2.5 text-xs transition focus:outline-none ${
                      isDay
                        ? "bg-white border border-stone-300 text-stone-900 placeholder-stone-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 shadow-sm"
                        : "bg-slate-950/80 border border-white/[0.1] text-slate-200 placeholder-slate-500 focus:border-emerald-400 focus:shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isDay ? "text-stone-700" : "text-slate-300"}`}>Type *</label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                    className={`w-full rounded-xl px-4 py-2.5 text-xs transition focus:outline-none ${
                      isDay
                        ? "bg-white border border-stone-300 text-stone-900 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 shadow-sm"
                        : "bg-slate-950/80 border border-white/[0.1] text-slate-200 focus:border-emerald-400 focus:shadow-[0_0_15px_rgba(16,185,129,0.25)]"
                    }`}
                  >
                    <option value="flat">Apartment / Flat</option>
                    <option value="pg">PG Accommodation</option>
                    <option value="independent_house">Independent House</option>
                  </select>
                </div>
              </div>

              <div className={`pt-4 flex justify-end gap-2.5 border-t ${isDay ? "border-stone-200" : "border-white/[0.08]"}`}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className={`text-xs px-4 py-2 transition cursor-pointer ${
                    isDay ? "text-stone-500 hover:text-stone-900" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className={`text-xs font-bold px-6 py-2.5 rounded-xl transition cursor-pointer ${
                    isDay
                      ? "bg-stone-900 hover:bg-stone-800 text-white shadow-md shadow-stone-900/10"
                      : "bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:shadow-[0_0_30px_rgba(16,185,129,0.55)]"
                  }`}
                >
                  {isCreating ? "Saving..." : "Create Property"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          JOIN PROPERTY MODAL (Tenant)
      ========================================================================= */}
      {showJoinModal && (
        <div className={`fixed inset-0 z-50 backdrop-blur-md flex items-center justify-center p-4 ${
          isDay ? "bg-stone-900/40" : "bg-slate-950/85"
        }`}>
          <div className={`border rounded-3xl max-w-sm w-full p-7 backdrop-blur-2xl text-center transition-all duration-300 ${
            isDay
              ? "bg-[#FAF7F2] border-[#E7E1D7] text-stone-900 shadow-2xl shadow-stone-900/10"
              : "bg-slate-900/90 border-white/[0.12] text-slate-100 shadow-[0_12px_45px_rgba(0,0,0,0.6)]"
          }`}>
            <h3 className={`text-lg font-bold mb-1 ${isDay ? "text-stone-900" : "text-white"}`}>Join Rental Property</h3>
            <p className={`text-xs mb-4 leading-relaxed ${isDay ? "text-stone-600" : "text-slate-400"}`}>
              Enter the 6-character invite code provided by your landlord to access the shared move-in baseline:
            </p>
            <form onSubmit={handleJoinProperty} className="space-y-4">
              <div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="e.g. 7X9K2P"
                  className={`w-full rounded-2xl px-4 py-3.5 text-center text-xl font-mono font-bold tracking-widest uppercase transition focus:outline-none ${
                    isDay
                      ? "bg-white border border-stone-300 text-amber-900 placeholder-stone-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 shadow-sm"
                      : "bg-slate-950/80 border border-white/[0.1] text-amber-300 placeholder-slate-600 focus:border-emerald-400 focus:shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                  }`}
                />
              </div>

              <div className={`flex justify-end gap-2.5 pt-2 border-t ${isDay ? "border-stone-200" : "border-transparent"}`}>
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className={`text-xs px-4 py-2 transition cursor-pointer ${
                    isDay ? "text-stone-500 hover:text-stone-900" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isJoining || inviteCode.length < 4}
                  className={`text-xs font-bold px-6 py-2.5 rounded-xl disabled:opacity-50 transition cursor-pointer ${
                    isDay
                      ? "bg-stone-900 hover:bg-stone-800 text-white shadow-md shadow-stone-900/10"
                      : "bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.35)] hover:shadow-[0_0_30px_rgba(16,185,129,0.55)]"
                  }`}
                >
                  {isJoining ? "Joining..." : "Join Property"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
