"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldAlert, ArrowLeft, LayoutDashboard, Lock } from "lucide-react";

interface AccessDeniedViewProps {
  moduleName?: string;
  moduleCode?: string;
  role?: string;
}

export function AccessDeniedView({
  moduleName = "Requested Module",
  moduleCode,
  role,
}: AccessDeniedViewProps) {
  const router = useRouter();

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-5">
        {/* Warning Icon with Glow */}
        <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 bg-rose-500/15 rounded-3xl blur-xl" />
          <div className="relative w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/80 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-sm">
            <ShieldAlert className="w-8 h-8" />
          </div>
        </div>

        {/* Status Badge */}
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <Lock className="w-3 h-3" />
            <span>Restricted Access</span>
          </span>
        </div>

        {/* Headings */}
        <div className="space-y-1.5">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            You have no permission of this module
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Your current account role does not have authorization to view or access{" "}
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {moduleName}
            </span>
            .
          </p>
        </div>

        {/* Details Box */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-left space-y-2 text-xs">
          <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-[11px]">Target Module:</span>
            <span className="font-black text-slate-900 dark:text-white text-[11px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              {moduleCode ? `${moduleName} (${moduleCode})` : moduleName}
            </span>
          </div>

          {role && (
            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-[11px]">Your Role:</span>
              <span className="font-black text-brand-600 dark:text-brand-400 text-[11px]">
                {role}
              </span>
            </div>
          )}

          <p className="text-[10px] text-slate-400 dark:text-slate-500 pt-1.5 border-t border-slate-200 dark:border-slate-700 leading-relaxed">
            If you need access to this section, please request permission from your organization's Super Administrator.
          </p>
        </div>

        {/* Action Buttons: Strictly ONLY ONE Primary Button per UI rules */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
          {/* Secondary Button */}
          <button
            type="button"
            onClick={() => router.back()}
            className="w-full sm:flex-1 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go Back</span>
          </button>

          {/* SINGLE PRIMARY BUTTON */}
          <Link
            href="/"
            className="w-full sm:flex-1 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

