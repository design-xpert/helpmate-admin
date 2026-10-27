"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, Clock, User, Wrench, CheckCircle2, ShieldCheck, MapPin, Star } from "lucide-react";
import { Booking, initialTechnicians, Technician } from "@/lib/mockData";
import { Portal } from "@/components/Portal";
import { CustomSelect } from "@/components/CustomSelect";

interface RescheduleBookingModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onReschedule: (
    bookingId: string,
    newDate: string,
    newTimeSlot: string,
    technicianId?: string,
    technicianName?: string
  ) => void;
}

const TIME_SLOTS = [
  "08:00 AM",
  "10:00 AM",
  "12:00 PM",
  "02:00 PM",
  "04:00 PM",
  "06:00 PM",
];

const RESCHEDULE_REASONS = [
  "Customer Requested Change",
  "Partner Schedule Conflict",
  "Severe Weather / Transport Delay",
  "Spare Parts Pending Delivery",
  "Address / Location Update",
];

export function RescheduleBookingModal({
  booking,
  isOpen,
  onClose,
  onReschedule,
}: RescheduleBookingModalProps) {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [selectedTechId, setSelectedTechId] = useState("");
  const [selectedReason, setSelectedReason] = useState("");
  const [customNote, setCustomNote] = useState("");

  useEffect(() => {
    if (booking) {
      // Extract YYYY-MM-DD for date input or fallback to today
      const todayIso = new Date().toISOString().split("T")[0];
      setSelectedDate(booking.date || todayIso);
      setSelectedTimeSlot(booking.timeSlot || TIME_SLOTS[1]);
      
      const techMatch = initialTechnicians.find(
        (t) => t.id === booking.technicianId || t.name === booking.technicianName
      );
      setSelectedTechId(techMatch?.id || booking.technicianId || "");
      setSelectedReason("Customer Requested Change");
      setCustomNote("");
    }
  }, [booking]);

  if (!isOpen || !booking) return null;

  const currentTech = initialTechnicians.find(
    (t) => t.id === booking.technicianId || t.name === booking.technicianName
  );

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    const assignedTech = initialTechnicians.find((t) => t.id === selectedTechId);

    onReschedule(
      booking.id,
      selectedDate,
      selectedTimeSlot,
      assignedTech?.id || (selectedTechId ? selectedTechId : undefined),
      assignedTech?.name || (currentTech?.name ? currentTech.name : undefined)
    );
    onClose();
  };

  return (
    <Portal>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden my-8 animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Reschedule Job #{booking.id}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {booking.serviceTitle} • {booking.customerName}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleConfirm} className="p-6 space-y-5">
            {/* 1. Working Date Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span>New Working Date</span>
              </label>
              <input
                type="date"
                required
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
              />
            </div>

            {/* 2. Working Time Slot */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                <span>Select New Time Slot</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TIME_SLOTS.map((slot) => {
                  const isSelected = selectedTimeSlot === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedTimeSlot(slot)}
                      className={`px-2.5 py-2 rounded-xl text-[11px] font-bold transition-all border text-center cursor-pointer ${
                        isSelected
                          ? "bg-brand-50 dark:bg-brand-950 border-brand-500 text-brand-600 dark:text-brand-400 shadow-2xs"
                          : "bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300"
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Assign / Reassign Service Partner */}
            <div>
              <CustomSelect
                label="Assign / Reassign Service Partner"
                value={selectedTechId}
                onChange={(val) => setSelectedTechId(val)}
                searchable
                size="sm"
                placeholder="-- Leave Unassigned / Pending Assignment --"
                options={[
                  { value: "", label: "-- Leave Unassigned / Pending Assignment --" },
                  ...initialTechnicians.map((t) => ({
                    value: t.id,
                    label: `${t.name} (${t.category} • ${t.locality} • ★ ${t.rating})`,
                  })),
                ]}
              />
            </div>

            {/* 4. Reschedule Reason */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Reason for Rescheduling
              </label>
              <div className="flex flex-wrap gap-1.5">
                {RESCHEDULE_REASONS.map((reason) => {
                  const isSelected = selectedReason === reason;
                  return (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setSelectedReason(reason)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {reason}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Note text box */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-500">
                Internal Operational Note (Optional)
              </label>
              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="e.g. Customer requested morning slot due to work travel..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Action Buttons: Strictly ONE Primary Button per rule AGENTS.md */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-extrabold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Reschedule</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Portal>
  );
}
