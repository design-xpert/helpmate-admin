"use client";

import { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  Lock,
  CheckCircle2,
  Clock,
  UserCheck,
  Plus,
  Key,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { initialAuditLogs, AuditLog } from "@/lib/mockData";

export default function RBACPage() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);

  const roles = [
    {
      id: "role-1",
      name: "Super Admin",
      members: "Aman Verma",
      description: "Full system administration, pricing overrides, and franchisee controls.",
      permissions: ["Dashboard Analytics", "Service Pricing CMS", "Assignment Control", "Audit Stream", "RBAC Management"],
      color: "border-brand-200 bg-brand-50 text-brand-700",
    },
    {
      id: "role-2",
      name: "Varanasi Operations Lead",
      members: "3 Active Coordinators",
      description: "Live booking pipeline management and technician partner re-assignment.",
      permissions: ["Dashboard Analytics", "Assignment Control", "Technician Partner View"],
      color: "border-blue-200 bg-blue-50 text-blue-700",
    },
    {
      id: "role-3",
      name: "Kashi Partner Verification Officer",
      members: "2 Field Inspectors",
      description: "Biometric Aadhaar check, Police clearance verification, and partner onboarding.",
      permissions: ["Technician Partner Control", "Police Audit Approval"],
      color: "border-emerald-200 bg-emerald-50 text-emerald-700",
    },
    {
      id: "role-4",
      name: "Customer Support Agent",
      members: "5 Agents",
      description: "View customer history, update booking notes, and issue wallet refunds.",
      permissions: ["Customer CRM", "Booking View", "Ticket Notes"],
      color: "border-amber-200 bg-amber-50 text-amber-700",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest bg-brand-50 text-brand-600 px-2.5 py-0.5 rounded border border-brand-200">
              Security Protocol
            </span>
            <span className="text-xs text-slate-500">Varanasi Administrative Controls</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            User Management & RBAC
          </h1>
        </div>
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roles.map((role) => (
          <div
            key={role.id}
            className="glass-panel p-6 rounded-2xl space-y-4 border border-slate-200 hover:border-brand-300 transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded border ${role.color}`}>
                  {role.members}
                </span>
                <h3 className="text-base font-extrabold text-slate-900 mt-2">{role.name}</h3>
              </div>
              <Lock className="w-4 h-4 text-slate-400" />
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">{role.description}</p>

            <div className="space-y-2 pt-2 border-t border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Active Permissions</span>
              <div className="flex flex-wrap gap-1.5">
                {role.permissions.map((p) => (
                  <span
                    key={p}
                    className="text-[9px] font-bold bg-slate-50 text-slate-700 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-2.5 h-2.5 text-brand-600" /> {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Real-time System Audit Stream */}
      <div className="glass-panel p-6 rounded-2xl space-y-5 border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Live Varanasi System Audit Stream</h3>
              <p className="text-xs text-slate-500">Immutable event logs for every assignment, pricing edit & verification</p>
            </div>
          </div>

          <button
            onClick={() => setAuditLogs([])}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200"
          >
            Clear Log Stream
          </button>
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {auditLogs.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">No audit events to display.</div>
          ) : (
            auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-brand-200 transition-all flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-xs shrink-0 border border-brand-200">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{log.user}</span>
                      <span className="text-[10px] text-brand-700 bg-brand-50 px-1.5 rounded border border-brand-200 font-semibold">
                        {log.role}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-600 mt-0.5">
                      <strong className="text-emerald-700">{log.action}:</strong> {log.target}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end text-right">
                  <span className="text-[10px] font-bold text-slate-700">{log.timestamp}</span>
                  <span className="text-[9px] text-slate-400">{log.locality} Zone</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
