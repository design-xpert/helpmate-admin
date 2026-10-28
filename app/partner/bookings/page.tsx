"use client";

import { useState } from "react";
import { DataTable, Column } from "@/components/DataTable";
import { initialBookings, Booking, SelectedAddOnItem } from "@/lib/mockData";
import { CalendarCheck, MapPin, CheckCircle2, KeyRound, ShieldCheck, Phone, Navigation, ExternalLink, Package } from "lucide-react";
import { Portal } from "@/components/Portal";
import { AddOnManager } from "@/components/bookings/AddOnManager";

export default function PartnerBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<SelectedAddOnItem[]>([]);
  const [inputOtp, setInputOtp] = useState("");
  const [otpSuccess, setOtpSuccess] = useState(false);

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) return;

    if (inputOtp === (selectedBooking.otpCode || "1234") || inputOtp === "4920") {
      const addOnsBaseTotal = selectedAddOns.reduce((sum, item) => sum + item.price, 0);
      const addOnsGstTotal = selectedAddOns.reduce((sum, item) => sum + item.gstAmount, 0);
      const addOnsFinalTotal = addOnsBaseTotal + addOnsGstTotal;

      setOtpSuccess(true);
      setBookings(
        bookings.map((b) =>
          b.id === selectedBooking.id
            ? {
                ...b,
                status: "Completed",
                isOtpVerified: true,
                completedAddOns: selectedAddOns,
                addOnsBaseTotal,
                addOnsGstTotal,
                addOnsFinalTotal,
                totalAmount: b.totalAmount + addOnsFinalTotal,
              }
            : b
        )
      );
      setTimeout(() => {
        setSelectedBooking(null);
        setOtpSuccess(false);
        setInputOtp("");
        setSelectedAddOns([]);
      }, 1200);
    } else {
      alert("Invalid OTP! Default OTP for test is 1234 or 4920");
    }
  };

  const columns: Column<Booking>[] = [
    {
      key: "id",
      header: "Booking ID",
      accessor: (row) => (
        <span className="font-mono font-bold text-brand-600 dark:text-brand-400">{row.id}</span>
      ),
      sortable: true,
    },
    {
      key: "customerName",
      header: "Customer Details",
      accessor: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-900 dark:text-white">{row.customerName}</span>
          <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
            <Phone className="w-3 h-3 text-brand-500" />
            {row.customerPhone}
          </span>
        </div>
      ),
      sortable: true,
    },
    { key: "serviceTitle", header: "Service Title", sortable: true },
    {
      key: "locality",
      header: "Locality Address",
      accessor: (row) => {
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${row.locality} ${row.address} Varanasi`
        )}`;

        return (
          <div className="flex flex-col text-xs space-y-1">
            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              {row.locality}
            </span>
            <span className="text-[10px] text-slate-400 truncate max-w-xs">{row.address}</span>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-extrabold text-[10px] text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 cursor-pointer w-fit"
            >
              <Navigation className="w-3 h-3 text-rose-500" />
              <span>Open Customer Map</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-70" />
            </a>
          </div>
        );
      },
      sortable: true,
    },
    {
      key: "partnerEarnings",
      header: "Your Share (₹)",
      accessor: (row) => (
        <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
          ₹{row.partnerEarnings || Math.round(row.totalAmount * 0.75)}
        </span>
      ),
      sortable: true,
    },
    {
      key: "status",
      header: "Booking Status",
      accessor: (row) => (
        <span
          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
            row.status === "Completed"
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
              : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
          }`}
        >
          {row.status}
        </span>
      ),
      sortable: true,
    },
    {
      key: "actions",
      header: "Actions",
      sticky: "right",
      accessor: (row) => {
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${row.locality} ${row.address} Varanasi`
        )}`;

        return (
          <div className="flex items-center justify-end gap-1.5">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs border border-slate-300 dark:border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
              title="Open Google Maps Navigation"
            >
              <Navigation className="w-3.5 h-3.5 text-rose-500" />
              <span>Map</span>
            </a>

            {row.status !== "Completed" ? (
              <button
                type="button"
                onClick={() => setSelectedBooking(row)}
                className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Complete Job OTP</span>
              </button>
            ) : (
              <span className="text-[10px] font-extrabold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Job Completed
              </span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Simple Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-brand-600" />
            <span>New Assigned Jobs</span>
          </h1>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={bookings}
      />

      {/* OTP Verification Modal */}
      {selectedBooking && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 outline-none overflow-y-auto">
            <form
              onSubmit={handleVerifyOtp}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-2xl w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto custom-scrollbar my-8"
            >
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="p-2.5 rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400 shrink-0">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Partner Job Completion & Add-Ons</h3>
                  <p className="text-xs text-slate-500">{selectedBooking.customerName} • {selectedBooking.serviceTitle} ({selectedBooking.id})</p>
                </div>
              </div>

              {otpSuccess ? (
                <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-center font-extrabold text-base space-y-2">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-600" />
                  <p className="text-lg">Job Verified & Completed Successfully!</p>
                  <p className="text-xs font-normal text-emerald-600 dark:text-emerald-400">
                    Final invoice generated and earnings updated in your wallet.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Add-On Products & Services Section */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <AddOnManager
                      selectedAddOns={selectedAddOns}
                      onChangeAddOns={setSelectedAddOns}
                      originalBookingPrice={selectedBooking.totalAmount}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block mb-1">
                      Enter 4-Digit Customer OTP Code (Demo OTP: 1234 or 4920) *
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={inputOtp}
                      onChange={(e) => setInputOtp(e.target.value)}
                      placeholder="1234"
                      className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center font-mono font-black text-xl tracking-widest text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                      required
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBooking(null);
                        setSelectedAddOns([]);
                      }}
                      className="px-5 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-lux flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Verify OTP & Complete Job</span>
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </Portal>
      )}
    </div>
  );
}
