import React from "react";
import { useAuth } from "../context/AuthContext";
import { Sun, Moon } from "lucide-react";
import BrandLogo from "./BrandLogo";

export default function Navbar({ onNavigate, currentPage, theme = "night", onToggleTheme }) {
  const { user, logout, switchRole } = useAuth();
  const isDay = theme === "day";

  const handleToggleRole = () => {
    if (switchRole) {
      switchRole();
    }
  };

  const handleLogout = () => {
    logout();
    onNavigate("landing");
  };

  return (
    <header className={`backdrop-blur-xl border-b sticky top-0 z-40 transition-colors duration-300 ${isDay
      ? "bg-[#FAF7F2]/90 border-[#E7E1D7] text-stone-900 shadow-sm"
      : "bg-slate-950/70 border-white/[0.08] text-white shadow-[0_4px_30px_rgba(0,0,0,0.3)]"
      }`}>
      <div className="w-full px-6 sm:px-10 md:px-12 lg:px-16 xl:px-20 h-20 sm:h-22 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => onNavigate("landing")}
          className="flex items-center space-x-3 cursor-pointer select-none group"
          title="DepositGuard Home"
        >
          {/* Standalone icon on mobile breakpoints, full lockup on tablet/desktop */}
          <div className="sm:hidden">
            <BrandLogo variant="icon" className="h-11 w-11" />
          </div>
          <div className="hidden sm:block">
            <BrandLogo variant={isDay ? "light" : "dark"} className="h-13 sm:h-15 md:h-16" />
          </div>
        </div>

        {/* Navigation / User Controls */}
        <nav className="flex items-center space-x-3">
          {/* Day / Night Mode Toggle */}
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className={`p-2 rounded-full border transition-all duration-300 cursor-pointer ${isDay
                ? "bg-stone-100 hover:bg-stone-200 text-stone-800 border-stone-300 shadow-sm"
                : "bg-slate-900/80 hover:bg-slate-800 text-emerald-400 border-white/[0.1] shadow-sm"
                }`}
              title={isDay ? "Switch to Night Mode" : "Switch to Day Mode"}
              aria-label="Toggle Day/Night mode"
            >
              {isDay ? <Sun className="w-4 h-4 text-amber-600" /> : <Moon className="w-4 h-4" />}
            </button>
          )}

          {user ? (
            <>
              <button
                onClick={() => onNavigate("dashboard")}
                className={`text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-full transition cursor-pointer ${currentPage === "dashboard"
                  ? isDay
                    ? "bg-stone-200/80 text-stone-900 border border-stone-300 shadow-sm"
                    : "bg-white/[0.08] text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
                  : isDay
                    ? "text-stone-700 hover:text-stone-950 hover:bg-stone-200/50"
                    : "text-slate-300 hover:text-white hover:bg-white/[0.05]"
                  }`}
              >
                Dashboard
              </button>

              <div className={`flex items-center space-x-2.5 pl-3 border-l ${isDay ? "border-stone-300" : "border-white/[0.1]"}`}>
                <span className={`text-xs font-medium hidden sm:inline ${isDay ? "text-stone-800" : "text-slate-300"}`}>
                  {user?.full_name || user?.email}
                </span>
                <button
                  onClick={handleToggleRole}
                  title={`Currently acting as ${user?.role || "landlord"}. Click to toggle role.`}
                  className={`text-[10px] uppercase font-mono font-bold tracking-wider px-2.5 py-1 rounded-full cursor-pointer transition hover:scale-105 active:scale-95 ${user?.role === "landlord"
                    ? isDay
                      ? "bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200"
                      : "bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                    : isDay
                      ? "bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200"
                      : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                    }`}
                >
                  {user?.role || "landlord"} ⇄
                </button>
              </div>

              <button
                onClick={handleLogout}
                className={`text-xs sm:text-sm font-medium px-2.5 py-1.5 transition cursor-pointer ${isDay ? "text-stone-600 hover:text-rose-700" : "text-slate-400 hover:text-rose-400"
                  }`}
                title="Sign out of your account"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onNavigate("auth", { initialMode: "login" })}
                className={`text-xs sm:text-sm font-medium px-3 py-1.5 transition cursor-pointer ${isDay ? "text-stone-700 hover:text-stone-950" : "text-slate-300 hover:text-white"
                  }`}
              >
                Sign In
              </button>
              <button
                onClick={() => onNavigate("auth", { initialMode: "register", initialRole: "tenant" })}
                className="text-xs sm:text-sm font-semibold px-4 py-2 rounded-full bg-slate-900 text-white hover:bg-slate-800 transition shadow-sm hover:shadow cursor-pointer"
              >
                Register
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
