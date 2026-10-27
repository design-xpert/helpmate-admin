"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, X, Info, Pin, PinOff } from "lucide-react";
import { Portal } from "@/components/Portal";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info";
  title: string;
  message?: string;
  duration?: number;
}

type ToastListener = (toasts: ToastMessage[]) => void;

let toastMessages: ToastMessage[] = [];
let listeners: ToastListener[] = [];
const activeTimeouts: Map<string, NodeJS.Timeout> = new Map();

function notifyListeners() {
  listeners.forEach((listener) => listener([...toastMessages]));
}

function clearAllTimers() {
  activeTimeouts.forEach((timeout) => clearTimeout(timeout));
  activeTimeouts.clear();
}

export const toast = {
  show: (type: "success" | "error" | "info", title: string, message?: string, duration = 4000) => {
    // Clear all existing timeouts and remove previous toasts so strictly only the top one is shown
    clearAllTimers();
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    const newToast: ToastMessage = { id, type, title, message, duration };
    toastMessages = [newToast];
    notifyListeners();

    if (duration > 0) {
      const timer = setTimeout(() => {
        toast.dismiss(id);
      }, duration);
      activeTimeouts.set(id, timer);
    }
    return id;
  },
  success: (title: string, message?: string, duration?: number) => toast.show("success", title, message, duration),
  error: (title: string, message?: string, duration?: number) => toast.show("error", title, message, duration),
  info: (title: string, message?: string, duration?: number) => toast.show("info", title, message, duration),
  dismiss: (id: string) => {
    const timer = activeTimeouts.get(id);
    if (timer) {
      clearTimeout(timer);
      activeTimeouts.delete(id);
    }
    toastMessages = toastMessages.filter((t) => t.id !== id);
    notifyListeners();
  },
  dismissAll: () => {
    clearAllTimers();
    toastMessages = [];
    notifyListeners();
  },
};

export function ToastContainer({ toasts: propsToasts, onDismiss }: { toasts?: ToastMessage[]; onDismiss?: (id: string) => void }) {
  const [activeToasts, setActiveToasts] = useState<ToastMessage[]>(propsToasts ? propsToasts.slice(-1) : []);

  useEffect(() => {
    if (propsToasts) {
      setActiveToasts(propsToasts.slice(-1));
      return;
    }
    const handleChange = (newToasts: ToastMessage[]) => {
      // Strictly maintain only the single latest top toast
      setActiveToasts(newToasts.slice(-1));
    };
    listeners.push(handleChange);
    return () => {
      listeners = listeners.filter((l) => l !== handleChange);
    };
  }, [propsToasts]);

  // Display only the single top toast, discarding any extras
  const currentToast = activeToasts[activeToasts.length - 1];
  if (!currentToast) return null;

  // Determine specialized visuals for Pin / Unpin / Limit vs generic status
  const titleLower = (currentToast.title || "").toLowerCase();
  const isPinSuccess = titleLower.includes("pinned") && !titleLower.includes("unpin");
  const isUnpin = titleLower.includes("unpin");
  const isLimit = titleLower.includes("limit");

  let badgeLabel = "NOTICE";
  let iconElement = <Info className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />;
  let iconBadgeStyles = "bg-brand-500/15 text-brand-600 dark:text-brand-400 border-brand-500/30";
  let tagStyles = "bg-brand-500/10 text-brand-700 dark:text-brand-300 border-brand-500/20";
  let accentGradient = "from-brand-500 via-indigo-500 to-brand-500";
  let ambientGlow = "bg-brand-500";
  let progressBarColor = "bg-brand-500";

  if (currentToast.type === "success" || isPinSuccess || isUnpin) {
    badgeLabel = isPinSuccess ? "PINNED" : isUnpin ? "UNPINNED" : "SUCCESS";
    iconElement = isPinSuccess ? (
      <Pin className="w-3.5 h-3.5 fill-current text-emerald-600 dark:text-emerald-400" />
    ) : isUnpin ? (
      <PinOff className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
    ) : (
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
    );
    iconBadgeStyles = "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    tagStyles = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20";
    accentGradient = "from-emerald-500 via-emerald-400 to-emerald-500";
    ambientGlow = "bg-emerald-500";
    progressBarColor = "bg-emerald-500";
  } else if (isLimit || currentToast.type === "error") {
    badgeLabel = isLimit ? "LIMIT" : "ERROR";
    iconElement = <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />;
    iconBadgeStyles = "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30";
    tagStyles = "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20";
    accentGradient = "from-rose-500 via-rose-400 to-rose-500";
    ambientGlow = "bg-rose-500";
    progressBarColor = "bg-rose-500";
  }

  const durationMs = currentToast.duration || 4000;

  return (
    <Portal>
      <div className="fixed top-4 right-4 sm:top-5 sm:right-5 z-[99999] max-w-[330px] sm:max-w-[350px] w-[calc(100vw-2rem)] select-none pointer-events-none">
        <style jsx>{`
          @keyframes toastCountdown {
            from {
              width: 100%;
            }
            to {
              width: 0%;
            }
          }
          .animate-countdown {
            animation: toastCountdown var(--duration) linear forwards;
          }
        `}</style>
        <div
          key={currentToast.id}
          className="relative overflow-hidden rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl text-slate-900 dark:text-white border border-slate-200/90 dark:border-slate-800 shadow-[0_12px_32px_-6px_rgba(0,0,0,0.14)] dark:shadow-[0_16px_40px_-10px_rgba(0,0,0,0.5)] ring-1 ring-black/5 dark:ring-white/10 p-2.5 sm:p-3 transition-all animate-in fade-in-0 slide-in-from-top-3 zoom-in-95 duration-200 pointer-events-auto"
        >
          {/* Top Accent Gradient Border */}
          <div
            className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${accentGradient}`}
          />

          {/* Ambient glow in the corner */}
          <div
            className={`absolute -top-10 -left-10 w-20 h-20 rounded-full blur-xl pointer-events-none opacity-30 dark:opacity-20 ${ambientGlow}`}
          />

          <div className="relative flex items-start gap-2.5">
            {/* Compact Glowing Icon Squircle */}
            <div
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0 border ${iconBadgeStyles}`}
            >
              {iconElement}
            </div>

            {/* Content Details */}
            <div className="flex-1 space-y-0.5 min-w-0 pr-0.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border leading-none shrink-0 ${tagStyles}`}
                >
                  {badgeLabel}
                </span>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white tracking-tight leading-snug truncate">
                  {currentToast.title}
                </h4>
              </div>

              {currentToast.message && (
                <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 leading-snug line-clamp-2">
                  {currentToast.message}
                </p>
              )}
            </div>

            {/* Dismiss Button */}
            <button
              type="button"
              onClick={() => {
                if (onDismiss) onDismiss(currentToast.id);
                else toast.dismiss(currentToast.id);
              }}
              className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              title="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Animated Countdown Progress Bar */}
          {durationMs > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-slate-100 dark:bg-slate-800/80 overflow-hidden">
              <div
                className={`h-full ${progressBarColor} animate-countdown`}
                style={
                  {
                    "--duration": `${durationMs}ms`,
                  } as React.CSSProperties
                }
              />
            </div>
          )}
        </div>
      </div>
    </Portal>
  );
}
