"use client";

import React, { useState, useEffect } from "react";
import { X, XCircle, AlertTriangle, Calendar, User, Phone, Ban } from "lucide-react";
import { Booking } from "@/lib/mockData";
import { Portal } from "@/components/Portal";

interface CancelBookingModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (booking: Booking, reason: string) => Promise<void> | void;
  isLoading?: boolean;
}

const COMMON_REASONS = [
  "Customer requested cancellation",
  "Partner unavailable / No partner in zone",
  "Customer rescheduled for later date",
  "Customer not responding / unreachable",
  "Duplicate booking created by mistake",
  "Incorrect service / address selected",
];

export function CancelBookingModal({
  booking,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: CancelBookingModalProps) {
  const [reason, setReason] = useState<string>("Customer requested cancellation");
  const [validationError, setValidationError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReason("Customer requested cancellation");
      setValidationError("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting && !isLoading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, isLoading, onClose]);

  if (!isOpen || !booking) return null;

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanReason = reason.trim();
    if (!cleanReason) {
      setValidationError("Please provide a reason for cancelling this booking.");
      return;
    }
    if (cleanReason.length > 500) {
      setValidationError("Reason must be 500 characters or fewer.");
      return;
    }

    setValidationError("");
    setIsSubmitting(true);
    try {
      await onConfirm(booking, cleanReason);
    } finally {
      setIsSubmitting(false);
    }
  };

  const busy = isSubmitting || isLoading;

  return (
    <Portal>
      <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 outline-none overflow-y-auto">
        <div
          className="fixed inset-0"
          onClick={() => {
            if (!busy) onClose();
          }}
        />

        <div className="relative z-10 bg-white dark:bg-slate-900 ring-1 ring-slate-900/10 dark:ring-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200 outline-none my-8">
          {/* Header */}
          <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-600 dark:text-rose-400">
                  Confirmation Required
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Cancel Booking
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Booking Summary Box */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-black text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/80 px-2.5 py-1 rounded-lg border border-brand-200/60 dark:border-brand-800/60">
                #{booking.bookingNumber || booking.id}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {booking.status}
              </span>
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                {booking.serviceTitle}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {booking.category} {booking.subCategory ? `• ${booking.subCategory}` : ""}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 min-w-0">
                <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate font-semibold">{booking.customerName || "Customer"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 min-w-0">
                <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate font-mono">{booking.customerPhone || "N/A"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 min-w-0 col-span-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate font-medium">
                  {booking.date || booking.scheduledDate || "Scheduled Date"} • {booking.timeSlot || booking.scheduledTime || "12:00 PM"}
                </span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleConfirm} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Cancellation Reason <span className="text-rose-500">*</span>
              </label>

              {/* Quick Reason Suggestions */}
              <div className="flex flex-wrap gap-1.5">
                {COMMON_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setReason(r);
                      setValidationError("");
                    }}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      reason === r
                        ? "bg-rose-50 dark:bg-rose-950/70 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 font-bold"
                        : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (validationError) setValidationError("");
                }}
                rows={3}
                placeholder="Enter cancellation reason or notes..."
                disabled={busy}
                className="w-full text-xs p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 resize-none transition-all"
              />

              {validationError && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{validationError}</span>
                </p>
              )}
            </div>

            {/* Warning notice */}
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 flex items-start gap-3 text-xs text-rose-900 dark:text-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5 leading-relaxed">
                <p className="font-bold">Important Notice</p>
                <p className="text-[11px] text-rose-800 dark:text-rose-300">
                  Cancelling this job will release any assigned partner and mark the order as Cancelled. This action cannot be easily undone.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-700 transition-all cursor-pointer disabled:opacity-50"
              >
                Keep Booking
              </button>

              <button
                type="submit"
                disabled={busy}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                <XCircle className="w-4 h-4 shrink-0" />
                <span>{busy ? "Cancelling..." : "Confirm Cancellation"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
}
