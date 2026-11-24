import React from "react";
import BrandLogo from "./BrandLogo";

export default function Footer({ onNavigate }) {
  return (
    <footer className="bg-slate-950/70 backdrop-blur-xl border-t border-white/[0.08] text-slate-400 text-xs py-8 mt-auto relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div
            onClick={() => (onNavigate ? onNavigate("landing") : (window.location.pathname = "/"))}
            className="flex items-center space-x-2 cursor-pointer select-none hover:opacity-85 transition"
            title="DepositGuard Home"
          >
            <BrandLogo variant="dark" className="h-6" showTagline={false} />
            <span className="text-slate-600">&bull;</span>
            <span className="text-slate-400">Rental Security Deposit Verification</span>
          </div>
          <p className="mt-1 text-slate-500 text-[11px]">
            Designed for Indian rental flats, apartments, and PG accommodations under Model Tenancy Act, 2021.
          </p>
        </div>

        <div className="text-center md:text-right text-slate-400 max-w-md">
          <p className="bg-slate-900/60 border border-white/[0.08] rounded-xl px-3.5 py-1.5 font-mono text-[11px] text-amber-300/90 backdrop-blur-sm">
            Legal notice: Records are tamper-evident, not tamper-proof &bull; documentation, not legal advice.
          </p>
        </div>
      </div>
    </footer>
  );
}
