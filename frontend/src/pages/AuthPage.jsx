import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import BrandLogo from "../components/BrandLogo";
import {
  Input,
  BoxReveal,
  Ripple,
  TechOrbitDisplay,
  Label,
  BottomGradient,
} from "../components/ui/modern-animated-sign-in";
import {
  Scale,
  ShieldCheck,
  Building2,
  Zap,
  Lock,
  Bot,
  FileCheck,
  Eye,
  EyeOff,
  User,
  Home,
  ArrowRight,
  AlertCircle,
  Sparkles,
} from "lucide-react";

export default function AuthPage({
  onNavigate,
  initialRole = "tenant",
  initialMode = "login",
  theme = "night",
}) {
  const [isRegister, setIsRegister] = useState(initialMode === "register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState(initialRole);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { user, login, register } = useAuth();
  const isDay = theme === "day";

  useEffect(() => {
    setIsRegister(initialMode === "register");
    setError("");
  }, [initialMode]);

  useEffect(() => {
    if (user) {
      onNavigate("dashboard");
    }
  }, [user, onNavigate]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (isRegister && !fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        await register(cleanEmail, password, fullName.trim(), role, phone.trim());
      } else {
        await login(cleanEmail, password);
      }
      onNavigate("dashboard");
    } catch (err) {
      setError(err.message || "Authentication failed. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail("thewayitgoes123456789@gmail.com");
    setPassword("password123");
    setError("");
  };

  // DepositGuard Tenancy & Trust Icons orbiting the central brand lockup
  const orbitIcons = [
    {
      radius: 105,
      duration: 26,
      component: () => (
        <div
          className="flex items-center justify-center w-9 h-9 rounded-full bg-[#FEF3C7] dark:bg-amber-950/80 border border-amber-500/50 text-amber-800 dark:text-amber-300 shadow-sm"
          title="MTA 2021 Statutory Standard"
        >
          <Scale className="w-4 h-4" />
        </div>
      ),
    },
    {
      radius: 105,
      duration: 26,
      delay: 13,
      component: () => (
        <div
          className="flex items-center justify-center w-9 h-9 rounded-full bg-[#D1FAE5] dark:bg-emerald-950/80 border border-emerald-500/50 text-emerald-800 dark:text-emerald-300 shadow-sm"
          title="SHA-256 Vault Sealing"
        >
          <ShieldCheck className="w-4 h-4" />
        </div>
      ),
    },
    {
      radius: 175,
      duration: 34,
      reverse: true,
      component: () => (
        <div
          className="flex items-center justify-center w-9 h-9 rounded-full bg-[#FFEDD5] dark:bg-orange-950/80 border border-orange-500/50 text-orange-800 dark:text-orange-300 shadow-sm"
          title="5 Essential Suite Baselines"
        >
          <Building2 className="w-4 h-4" />
        </div>
      ),
    },
    {
      radius: 175,
      duration: 34,
      delay: 11.3,
      reverse: true,
      component: () => (
        <div
          className="flex items-center justify-center w-9 h-9 rounded-full bg-[#FEF9C3] dark:bg-yellow-950/80 border border-yellow-500/50 text-yellow-800 dark:text-yellow-300 shadow-sm"
          title="Day 1 Meter Arrears Protection"
        >
          <Zap className="w-4 h-4" />
        </div>
      ),
    },
    {
      radius: 175,
      duration: 34,
      delay: 22.6,
      reverse: true,
      component: () => (
        <div
          className="flex items-center justify-center w-9 h-9 rounded-full bg-[#F1F5F9] dark:bg-slate-900/80 border border-slate-300/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 shadow-sm"
          title="Dual Confirmation Digital Handshake"
        >
          <Lock className="w-4 h-4" />
        </div>
      ),
    },
    {
      radius: 245,
      duration: 44,
      component: () => (
        <div
          className="flex items-center justify-center w-9 h-9 rounded-full bg-[#CCFBF1] dark:bg-teal-950/80 border border-teal-500/50 text-teal-800 dark:text-teal-300 shadow-sm"
          title="GuardBot AI Dispute Concierge"
        >
          <Bot className="w-4 h-4" />
        </div>
      ),
    },
    {
      radius: 245,
      duration: 44,
      delay: 22,
      component: () => (
        <div
          className="flex items-center justify-center w-9 h-9 rounded-full bg-[#E0E7FF] dark:bg-indigo-950/80 border border-indigo-500/50 text-indigo-800 dark:text-indigo-300 shadow-sm"
          title="Itemized Settlement & ReportLab PDF"
        >
          <FileCheck className="w-4 h-4" />
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative z-10">
      <div
        className={`w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 grid grid-cols-1 lg:grid-cols-12 ${
          isDay
            ? "bg-[#FAF8F5]/90 border border-[#E6E0D4] text-stone-900 shadow-[0_20px_60px_-15px_rgba(180,150,120,0.22)] backdrop-blur-xl"
            : "bg-stone-950/80 border border-stone-800/80 text-stone-100 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] backdrop-blur-xl"
        }`}
      >
        {/* ================= LEFT PANE: Animated Ripple & Trust Ecosystem Orbit (Desktop) ================= */}
        <div
          className={`hidden lg:flex lg:col-span-6 flex-col justify-between p-8 relative overflow-hidden border-r ${
            isDay
              ? "bg-gradient-to-b from-[#F5EFE6] via-[#FAF8F5] to-[#ECE5D8]/90 border-[#E6E0D4]"
              : "bg-gradient-to-b from-stone-900/95 via-stone-950 to-stone-950 border-stone-800/70"
          }`}
        >
          {/* Concentric Subtle Pulse Ripple */}
          <Ripple
            mainCircleSize={150}
            numCircles={8}
            className="w-full h-full opacity-60"
          />

          {/* Top Brand Tag */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Model Tenancy Act 2021 Vault</span>
            </div>
            <span className="text-[11px] font-mono text-stone-500 dark:text-stone-400">
              SHA-256 Immutable
            </span>
          </div>

          {/* Center Orbiting Ecosystem */}
          <div className="relative z-10 my-auto py-12 flex items-center justify-center min-h-[380px]">
            <TechOrbitDisplay iconsArray={orbitIcons}>
              <div
                className={`relative z-20 flex flex-col items-center justify-center px-7 py-5 rounded-2xl border shadow-xl text-center select-none backdrop-blur-md transition ${
                  isDay
                    ? "bg-[#FFFDF9]/95 border-[#E2D9C8] shadow-stone-300/50 text-stone-900"
                    : "bg-stone-900/95 border-stone-700/80 shadow-black/70 text-stone-100"
                }`}
              >
                <BrandLogo
                  variant={isDay ? "light" : "dark"}
                  className="h-16 sm:h-18 w-auto"
                />
                <div className="mt-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-600/20 text-amber-900 dark:text-amber-300 text-[10px] font-bold tracking-wider uppercase font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>MTA 2021 Statutory Vault</span>
                </div>
              </div>
            </TechOrbitDisplay>
          </div>

          {/* Bottom Trust Pillar Badges */}
          <div className="relative z-10 pt-4 border-t border-stone-200/60 dark:border-stone-800/60 grid grid-cols-3 gap-3 text-center">
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                Max 2 Mo. Cap
              </span>
              <span className="text-[10px] text-stone-500 dark:text-stone-400 leading-tight">
                MTA 2021 Statutory
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                Dual Signatures
              </span>
              <span className="text-[10px] text-stone-500 dark:text-stone-400 leading-tight">
                Landlord + Tenant
              </span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                GuardBot AI
              </span>
              <span className="text-[10px] text-stone-500 dark:text-stone-400 leading-tight">
                Fair Wear & Tear Triage
              </span>
            </div>
          </div>
        </div>

        {/* ================= RIGHT PANE: Modern Animated Auth Form ================= */}
        <div className="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-center relative">
          <div className="max-w-md w-full mx-auto space-y-5">
            {/* Mobile / Header Brand Logo */}
            <div className="flex items-center justify-between pb-2">
              <BrandLogo
                variant={isDay ? "light" : "dark"}
                className="h-13 sm:h-14 w-auto cursor-pointer hover:opacity-90 transition"
                onClick={() => onNavigate("landing")}
                title="DepositGuard Home"
              />
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-stone-200/60 dark:bg-stone-800/60 text-stone-600 dark:text-stone-400 font-mono">
                {isRegister ? "New Account" : "Secure Login"}
              </span>
            </div>

            {/* Title with BoxReveal */}
            <div>
              <BoxReveal boxColor={isDay ? "#C2B29F" : "#047857"} duration={0.35}>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100">
                  {isRegister ? (
                    <>
                      Create{" "}
                      <span className="font-serif italic font-normal text-emerald-700 dark:text-emerald-400">
                        Tenancy Vault
                      </span>
                    </>
                  ) : (
                    <>
                      Welcome to{" "}
                      <span className="font-serif italic font-normal text-emerald-700 dark:text-emerald-400">
                        DepositGuard
                      </span>
                    </>
                  )}
                </h2>
              </BoxReveal>
              <BoxReveal boxColor={isDay ? "#C2B29F" : "#047857"} duration={0.35}>
                <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">
                  {isRegister
                    ? "Safeguard your rental security deposit with cryptographic move-in baselines."
                    : "Access your verified property records, SHA-256 baselines, and dispute triage."}
                </p>
              </BoxReveal>
            </div>

            {/* Error Message Callout */}
            {error && (
              <BoxReveal width="100%" boxColor="#DC2626" duration={0.25}>
                <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>{error}</span>
                </div>
              </BoxReveal>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 pt-1">
              {/* Role Selection when Registering */}
              {isRegister && (
                <div>
                  <BoxReveal boxColor={isDay ? "#C2B29F" : "#047857"} duration={0.3}>
                    <Label className="text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5 block">
                      Select Your Role <span className="text-emerald-600">*</span>
                    </Label>
                  </BoxReveal>
                  <BoxReveal width="100%" boxColor={isDay ? "#C2B29F" : "#047857"} duration={0.3}>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setRole("tenant")}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          role === "tenant"
                            ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/60 shadow-xs shadow-emerald-500/20"
                            : isDay
                            ? "bg-white/60 text-stone-600 border-stone-200 hover:border-stone-300"
                            : "bg-stone-900/60 text-stone-400 border-stone-800 hover:border-stone-700"
                        }`}
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>Tenant (Renter)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole("landlord")}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          role === "landlord"
                            ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/60 shadow-xs shadow-amber-500/20"
                            : isDay
                            ? "bg-white/60 text-stone-600 border-stone-200 hover:border-stone-300"
                            : "bg-stone-900/60 text-stone-400 border-stone-800 hover:border-stone-700"
                        }`}
                      >
                        <Home className="w-3.5 h-3.5" />
                        <span>Landlord (Owner)</span>
                      </button>
                    </div>
                  </BoxReveal>
                </div>
              )}

              {/* Full Name (when Registering) */}
              {isRegister && (
                <div>
                  <BoxReveal boxColor={isDay ? "#C2B29F" : "#047857"} duration={0.3}>
                    <Label htmlFor="fullName" className="text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5 block">
                      Full Name <span className="text-emerald-600">*</span>
                    </Label>
                  </BoxReveal>
                  <BoxReveal width="100%" boxColor={isDay ? "#C2B29F" : "#047857"} duration={0.3}>
                    <Input
                      id="fullName"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Ramesh Kumar / Priya Sharma"
                    />
                  </BoxReveal>
                </div>
              )}

              {/* Email Address - Clean and Direct without OTP barrier */}
              <div>
                <BoxReveal boxColor={isDay ? "#C2B29F" : "#047857"} duration={0.3}>
                  <Label htmlFor="email" className="text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5 block">
                    Email Address <span className="text-emerald-600">*</span>
                  </Label>
                </BoxReveal>
                <BoxReveal width="100%" boxColor={isDay ? "#C2B29F" : "#047857"} duration={0.3}>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </BoxReveal>
              </div>

              {/* Password */}
              <div>
                <BoxReveal boxColor={isDay ? "#C2B29F" : "#047857"} duration={0.3}>
                  <div className="flex items-center justify-between mb-1.5">
                    <Label htmlFor="password" className="text-xs font-semibold text-stone-700 dark:text-stone-300">
                      Password <span className="text-emerald-600">*</span>
                    </Label>
                    {!isRegister && (
                      <button
                        type="button"
                        onClick={handleDemoFill}
                        className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        Use Demo Credentials
                      </button>
                    )}
                  </div>
                </BoxReveal>
                <BoxReveal width="100%" boxColor={isDay ? "#C2B29F" : "#047857"} duration={0.3}>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </BoxReveal>
              </div>

              {/* Phone Number (Optional when Registering) */}
              {isRegister && (
                <div>
                  <BoxReveal boxColor={isDay ? "#C2B29F" : "#047857"} duration={0.3}>
                    <Label htmlFor="phone" className="text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5 block">
                      Phone Number (Optional)
                    </Label>
                  </BoxReveal>
                  <BoxReveal width="100%" boxColor={isDay ? "#C2B29F" : "#047857"} duration={0.3}>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                    />
                  </BoxReveal>
                </div>
              )}

              {/* Submit Button */}
              <BoxReveal width="100%" boxColor={isDay ? "#C2B29F" : "#047857"} duration={0.3} overflow="visible">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 bg-stone-900 hover:bg-stone-800 text-white dark:bg-stone-100 dark:hover:bg-white dark:text-stone-950 font-bold rounded-xl text-xs sm:text-sm tracking-wide shadow-md transition-all duration-200 relative group/btn cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    <>
                      <span>{isRegister ? "Create Tenancy Vault Account" : "Sign In to Vault"}</span>
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                      <BottomGradient />
                    </>
                  )}
                </button>
              </BoxReveal>
            </form>

            {/* Toggle Mode Link */}
            <div className="pt-2 text-center text-xs text-stone-600 dark:text-stone-400">
              {isRegister ? (
                <p>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(false);
                      setError("");
                    }}
                    className="font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 underline underline-offset-4 cursor-pointer transition ml-1"
                  >
                    Sign In
                  </button>
                </p>
              ) : (
                <p>
                  Don't have an account yet?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(true);
                      setError("");
                    }}
                    className="font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 underline underline-offset-4 cursor-pointer transition ml-1"
                  >
                    Register as Tenant / Landlord
                  </button>
                </p>
              )}
            </div>

            {/* Legal Protection Footnote */}
            <div className="pt-3 border-t border-stone-200/50 dark:border-stone-800/50 flex items-center justify-center gap-1.5 text-[11px] text-stone-500 dark:text-stone-400 text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Records are tamper-evident under Model Tenancy Act principles.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
