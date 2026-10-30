"use client";

import React from "react";
import { useRbac } from "@/context/RbacContext";
import { UserPermissions } from "@/lib/mockData";
import { Lock, ShieldAlert, ChevronLeft } from "lucide-react";
import Link from "next/link";

interface PermissionGuardProps {
  permissionKey: keyof UserPermissions;
  children: React.ReactNode;
}

export function PermissionGuard({ permissionKey, children }: PermissionGuardProps) {
  const { hasPermission, currentUser } = useRbac();

  if (!hasPermission(permissionKey)) {
    return (
      <div className="p-8 max-w-2xl mx-auto my-12 bg-white dark:bg-slate-900 ring-1 ring-slate-900/10 dark:ring-slate-800 rounded-3xl shadow-2xl space-y-6 text-center animate-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-3xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-600 flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-red-600 bg-red-50 dark:bg-red-950 px-2.5 py-0.5 rounded border border-red-200 dark:border-red-900">
            Access Restricted by RBAC
          </span>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">Permission Required</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Logged-in user <strong>{currentUser.name}</strong> ({currentUser.role}) does not have permission <strong>"{permissionKey}"</strong> to view or edit this module.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-left space-y-1">
          <span className="font-bold text-slate-700 dark:text-slate-300 block">How to gain access?</span>
          <p className="text-slate-500">
            Contact your Super Admin to grant <strong>"{permissionKey}"</strong> permission to your user account in User Management.
          </p>
        </div>

        <div className="pt-2 flex justify-center">
          <Link
            href="/"
            className="px-6 py-2.5 bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs rounded-xl shadow-lux flex items-center gap-1.5"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
