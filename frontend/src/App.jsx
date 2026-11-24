import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import GuardBotWidget from "./components/GuardBotWidget";
import Particles from "./components/ui/Particles";
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import InspectionDetailPage from "./pages/InspectionDetailPage";
import ComparisonPage from "./pages/ComparisonPage";
import SettlementPage from "./pages/SettlementPage";

function AppContent() {
  const { user, loading } = useAuth();

  const getInitialPage = () => {
    const path = window.location.pathname;
    const hasToken = !!localStorage.getItem("depositguard_token");

    if (path === "/login" || path === "/auth") return "auth";
    if (path.startsWith("/dashboard")) return hasToken ? "dashboard" : "auth";
    if (path.startsWith("/inspections")) return hasToken ? "inspection" : "auth";
    if (path.startsWith("/comparison")) return hasToken ? "comparison" : "auth";
    if (path.startsWith("/settlement")) return hasToken ? "settlement" : "auth";
    return "landing";
  };

  const [currentPage, setCurrentPage] = useState(getInitialPage);
  const [authRole, setAuthRole] = useState("tenant");
  const [authMode, setAuthMode] = useState("login");
  const [selectedInspectionId, setSelectedInspectionId] = useState(() => {
    try {
      return localStorage.getItem("depositguard_active_inspection_id") || null;
    } catch {
      return null;
    }
  });
  const [activePropertyId, setActivePropertyId] = useState(() => {
    try {
      return localStorage.getItem("depositguard_active_property_id") || null;
    } catch {
      return null;
    }
  });
  const [activeMoveOutId, setActiveMoveOutId] = useState(() => {
    try {
      return localStorage.getItem("depositguard_active_moveout_id") || null;
    } catch {
      return null;
    }
  });

  // Day / Night Theme Mode for Dashboard & Interior Pages (persisted)
  const [dashboardTheme, setDashboardTheme] = useState(() => {
    try {
      return localStorage.getItem("depositguard_dashboard_theme") || "night";
    } catch {
      return "night";
    }
  });

  const toggleDashboardTheme = () => {
    setDashboardTheme((prev) => {
      const next = prev === "night" ? "day" : "night";
      try {
        localStorage.setItem("depositguard_dashboard_theme", next);
      } catch {}
      return next;
    });
  };

  // Sync with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPage(getInitialPage());
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Route Guard: Protected routes require an active authenticated user
  useEffect(() => {
    const hasToken = !!localStorage.getItem("depositguard_token");
    if (!loading && !user && !hasToken) {
      const protectedPages = ["dashboard", "inspection", "comparison", "settlement"];
      if (protectedPages.includes(currentPage)) {
        navigateTo("auth", { initialMode: "login" });
      }
    }
  }, [user, loading, currentPage]);

  const navigateTo = (page, options = {}) => {
    if (options.initialRole) {
      setAuthRole(options.initialRole);
    }
    if (options.initialMode) {
      setAuthMode(options.initialMode);
    }
    if (options.propertyId) {
      setActivePropertyId(options.propertyId);
      try {
        localStorage.setItem("depositguard_active_property_id", options.propertyId);
      } catch {}
    }
    if (options.moveOutInspectionId) {
      setActiveMoveOutId(options.moveOutInspectionId);
      try {
        localStorage.setItem("depositguard_active_moveout_id", options.moveOutInspectionId);
      } catch {}
    }

    // Sync browser path cleanly
    let path = "/";
    if (page === "auth") path = "/login";
    else if (page === "dashboard") path = "/dashboard";
    else if (page === "inspection") path = "/inspections";
    else if (page === "comparison") path = "/comparison";
    else if (page === "settlement") path = "/settlement";

    if (window.location.pathname !== path) {
      window.history.pushState({}, "", path);
    }

    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const openInspection = (inspectionId) => {
    setSelectedInspectionId(inspectionId);
    try {
      localStorage.setItem("depositguard_active_inspection_id", inspectionId);
    } catch {}
    navigateTo("inspection");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="inline-block animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mb-2"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans antialiased transition-colors duration-500 relative ${
      currentPage === "landing"
        ? "bg-[#FAF8F5] text-slate-900 selection:bg-emerald-800 selection:text-white"
        : dashboardTheme === "day"
        ? "bg-[#F7F4EE] text-stone-900 selection:bg-emerald-800 selection:text-white"
        : "bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-slate-950"
    }`}>
      {/* Ambient WebGL Starlight Background for Interior Pages (Adapts in Day & Night mode) */}
      {currentPage !== "landing" && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
            <Particles
              key={dashboardTheme}
              particleColors={
                dashboardTheme === "day"
                  ? ["#B45309", "#047857", "#A8A29E", "#D97706", "#78716C"]
                  : ["#10b981", "#059669", "#0d9488", "#14b8a6", "#34d399", "#64748b"]
              }
              particleCount={dashboardTheme === "day" ? 80 : 230}
              particleSpread={dashboardTheme === "day" ? 8 : 10}
              speed={dashboardTheme === "day" ? 0.08 : 0.15}
              particleBaseSize={dashboardTheme === "day" ? 60 : 100}
              glow={dashboardTheme === "day" ? 0.15 : 0.6}
              twinkle={dashboardTheme === "day" ? 0.12 : 0.35}
              moveParticlesOnHover
              hoverEffect="parallax"
              lightMode={dashboardTheme === "day"}
            />
          </div>

          {/* Ambient Lighting Overlay: Warm Sandstone & Cream with Subtle Architectural Grid */}
          <div
            className="fixed inset-0 pointer-events-none transition-all duration-700"
            style={{
              background:
                dashboardTheme === "day"
                  ? "radial-gradient(ellipse 950px 750px at 85% 15%, rgba(245, 230, 211, 0.45) 0%, rgba(254, 243, 199, 0.22) 45%, transparent 75%), linear-gradient(to right, rgba(120, 113, 108, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(120, 113, 108, 0.05) 1px, transparent 1px)"
                  : "radial-gradient(circle at 50% 0%, rgba(16, 185, 129, 0.12) 0%, rgba(13, 148, 136, 0.05) 50%, transparent 80%)",
              backgroundSize: dashboardTheme === "day" ? "auto, 48px 48px, 48px 48px" : "auto",
              zIndex: 0,
            }}
          />
        </>
      )}

      {/* Global Navbar shown on authenticated / interior pages */}
      {currentPage !== "landing" && (
        <div className="relative z-20">
          <Navbar
            onNavigate={navigateTo}
            currentPage={currentPage}
            theme={dashboardTheme}
            onToggleTheme={toggleDashboardTheme}
          />
        </div>
      )}

      <main className="flex-1 relative z-10">
        {currentPage === "landing" && <LandingPage onNavigate={navigateTo} />}

        {currentPage === "auth" && (
          <AuthPage
            onNavigate={navigateTo}
            initialRole={authRole}
            initialMode={authMode}
            theme={dashboardTheme}
          />
        )}

        {currentPage === "dashboard" && (
          <DashboardPage
            onNavigate={navigateTo}
            onSelectInspection={openInspection}
            theme={dashboardTheme}
            onToggleTheme={toggleDashboardTheme}
          />
        )}

        {currentPage === "inspection" && (
          selectedInspectionId ? (
            <InspectionDetailPage
              inspectionId={selectedInspectionId}
              onNavigate={navigateTo}
              theme={dashboardTheme}
            />
          ) : (
            <div className="max-w-md mx-auto my-24 p-8 rounded-3xl border border-slate-200/90 dark:border-white/[0.08] bg-white/85 dark:bg-slate-900/50 backdrop-blur-xl text-center space-y-4 shadow-xl">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xl">
                📋
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">No Inspection Selected</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Please select an active inspection suite from your dashboard to view its tamper-evident checklist.
              </p>
              <button
                onClick={() => navigateTo("dashboard")}
                className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-emerald-500 text-white dark:text-slate-950 font-bold text-xs hover:opacity-90 transition cursor-pointer shadow-md"
              >
                Go to Dashboard
              </button>
            </div>
          )
        )}

        {currentPage === "comparison" && (
          <ComparisonPage
            propertyId={activePropertyId}
            moveOutInspectionId={activeMoveOutId}
            onNavigate={navigateTo}
            theme={dashboardTheme}
          />
        )}

        {currentPage === "settlement" && (
          <SettlementPage
            propertyId={activePropertyId}
            onNavigate={navigateTo}
            theme={dashboardTheme}
          />
        )}
      </main>

      {/* Live GuardBot AI Assistant (Strictly hidden on / and /login) */}
      {currentPage !== "landing" && currentPage !== "auth" && (
        <div className="relative z-30">
          <GuardBotWidget theme={dashboardTheme} />
        </div>
      )}

      {/* Global Footer shown on interior pages (LandingPage has its own integrated footer) */}
      {currentPage !== "landing" && (
        <div className="relative z-10">
          <Footer onNavigate={navigateTo} />
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
