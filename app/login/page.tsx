"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { useRbac } from "@/context/RbacContext";
import { adminLoginApi, formatImageUrl } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { setRole } = useRbac();

  // Clean empty form state (no prefilled values)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Loading & Error State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await adminLoginApi({
        identifier: email.trim(),
        password,
      });

      if (res && res.success && res.token) {
        localStorage.setItem("helpmate_admin_token", res.token);
        if (res.admin) {
          localStorage.setItem("helpmate_admin_user", JSON.stringify(res.admin));
        }
        localStorage.setItem("helpmate_admin_session", "true");

        const userRole = res.admin?.role?.name || res.admin?.role || "Super Admin";
        if (typeof userRole === "string" && (userRole.toLowerCase().includes("partner") || email.toLowerCase().includes("partner"))) {
          setRole("Service Partner");
          router.push("/partner");
        } else if (typeof userRole === "string" && (userRole.toLowerCase().includes("office") || email.toLowerCase().includes("office"))) {
          setRole("Office Admin");
          router.push("/");
        } else {
          setRole("Super Admin");
          router.push("/");
        }
      } else {
        setErrorMessage(res?.message || "Invalid credentials. Please check email and password.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setErrorMessage("Failed to connect to authentication server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-brand-500 selection:text-white relative overflow-hidden">
      {/* Background Decorative Blurs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full space-y-6 relative z-10">
        {/* Project Logo & Header */}
        <div className="text-center space-y-3 flex flex-col items-center">
          <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-sm inline-block">
            <Image
              src="/logo.png"
              alt="HelpMate Logo"
              width={48}
              height={48}
              className="h-12 w-auto object-contain"
            />
          </div>

          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">HelpMate Admin</h1>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-50 text-brand-600 px-2 py-0.5 rounded border border-brand-200">
              Varanasi HQ
            </span>
          </div>

          <p className="text-xs text-slate-500 max-w-xs font-medium">
            Sign in with your email address and password.
          </p>
        </div>

        {/* Standard Login Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          {/* Error Message Display */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-600 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Standard Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Email Address / Admin ID
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@helpmate.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 transition-all font-medium"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 transition-all font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-lux flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
