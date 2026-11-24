import React from "react";
import { useAuth } from "../context/AuthContext";
import { Sun, Moon } from "lucide-react";
import BrandLogo from "./BrandLogo";

export default function Navbar({ onNavigate, currentPage, theme = "night", onToggleTheme }) {
  const { user, logout } = useAuth();
  const isDay = theme === "day";

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

              <div className={`hidden md:flex items-center space-x-2.5 pl-3 border-l ${isDay ? "border-stone-300" : "border-white/[0.1]"
                }`}>
                <span className={`text-xs font-medium ${isDay ? "text-stone-800" : "text-slate-300"}`}>
                  {user.full_name || user.email}
                </span>
                <span
                  className={`text-[10px] uppercase font-mono font-bold tracking-wider px-2.5 py-0.5 rounded-full ${user.role === "landlord"
                    ? isDay
                      ? "bg-amber-100 text-amber-900 border border-amber-300"
                      : "bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                    : isDay
                      ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                      : "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                    }`}
                >
                  {user.role}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className={`text-xs font-medium px-3 py-1.5 rounded-full transition cursor-pointer ${isDay
                  ? "text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                  : "text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                  }`}
              >
                Log Out
              </button>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onNavigate("auth", { initialMode: "login" })}
                className={`text-sm font-medium px-3.5 py-1.5 rounded-full transition ${isDay
                  ? "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                  : "text-slate-300 hover:text-white hover:bg-white/[0.05]"
                  }`}
              >
                Sign In
              </button>
              <button
                onClick={() => onNavigate("auth", { initialMode: "register", initialRole: "tenant" })}
                className={`text-xs sm:text-sm font-bold px-4 py-2 rounded-full transition ${isDay
                  ? "bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
                  : "bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.45)]"
                  }`}
              >
                Register
              </button>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
