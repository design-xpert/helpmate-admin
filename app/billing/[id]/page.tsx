"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { initialBookings, Booking } from "@/lib/mockData";
import {
  FileText,
  Printer,
  ArrowLeft,
  CheckCircle2,
  Download,
  Building,
  User,
  ShieldCheck,
  CreditCard,
  Receipt,
  Share2,
  Clock,
  RotateCcw,
  X,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Portal } from "@/components/Portal";
import { getAdminInvoiceApi, getAdminInvoicePdfBlobApi, getBookingDetailsApi } from "@/lib/api";

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invId = (params?.id as string) || "";

  const [invoiceData, setInvoiceData] = useState<any | null>(null);
  const [bookingFallback, setBookingFallback] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadInvoice() {
      if (!invId) return;
      setIsLoading(true);
      setErrorMsg(null);

      try {
        // 1. Try fetching invoice data via GET /api/admin/invoices/:id
        const invRes = await getAdminInvoiceApi(invId);
        if (isMounted && invRes) {
          const rawData = invRes.data || invRes.invoice || (invRes._id || invRes.invoiceNumber || invRes.items || invRes.billing ? invRes : null);
          if (rawData) {
            setInvoiceData(rawData);
            setIsLoading(false);
            return;
          }
        }

        // 2. If backend returns 404 or invoice not generated yet, try fetching booking details GET /api/booking/:id
        const bkRes = await getBookingDetailsApi(invId);
        if (isMounted && bkRes && bkRes.success && bkRes.data) {
          const bData = bkRes.data;
          setInvoiceData({
            invoiceNumber: bData.bookingNumber ? `INV-${bData.bookingNumber}` : `INV-${invId.slice(-6).toUpperCase()}`,
            bookingNumber: bData.bookingNumber || invId,
            customer: {
              name: bData.customer?.name || "Customer",
              mobile: bData.customer?.mobile || "",
            },
            address: {
              serviceAddress: bData.serviceAddress?.serviceAddress || "",
              localityName: bData.serviceAddress?.localityName || "Varanasi",
              pincode: bData.serviceAddress?.pincode || "221002",
              landmark: bData.serviceAddress?.landmark || "",
            },
            items: (bData.items || []).map((item: any) => ({
              packageName: item.package?.name || item.package?.packageName || item.serviceAction?.name || item.category?.name || "Service Package",
              quantity: item.quantity || 1,
              unitPrice: item.unitPrice || item.totalPrice || item.package?.price || 0,
              totalPrice: item.totalPrice || ((item.unitPrice || item.package?.price || 0) * (item.quantity || 1)),
            })),
            billing: {
              mrp: bData.amount || 0,
              sellingPrice: bData.amount || 0,
              discount: 0,
              platformFee: 49,
              gst: Math.round((bData.amount || 0) * 0.18),
              totalAmount: bData.amount !== undefined ? bData.amount : 0,
              paymentMethod: bData.paymentMethod || "UPI / Online",
              paymentStatus: bData.bookingStatus === "completed" ? "paid" : "pending",
            },
            generatedAt: bData.createdAt || new Date().toISOString(),
          });
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.error("Error loading invoice data:", err);
      }

      // 3. Fallback to mock data if backend not reachable or mock ID
      if (isMounted) {
        const mockBooking = initialBookings.find((b) => b.id === invId || `INV-${b.id}` === invId) || initialBookings[0];
        setBookingFallback(mockBooking);
        setIsLoading(false);
      }
    }

    loadInvoice();
    return () => {
      isMounted = false;
    };
  }, [invId]);

  // Handler for PDF Download endpoint: GET /api/admin/invoices/:bookingId/pdf
  const handleDownloadPdf = async () => {
    if (!invId) return;
    setIsDownloadingPdf(true);
    try {
      const blob = await getAdminInvoicePdfBlobApi(invId);
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const invNum = invoiceData?.invoiceNumber || formatInvoiceNumber(invId);
        a.download = `${invNum}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } else {
        // Fallback to print
        window.print();
      }
    } catch (err) {
      console.error("Failed to download PDF blob:", err);
      window.print();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatInvoiceNumber = (id: string) => {
    if (!id) return "INV-2026-001";
    const cleanId = id.replace(/^(INV-)?(bk-)?/gi, "");
    if (cleanId.length > 5 && !isNaN(Number(cleanId))) {
      return `INV-${cleanId.slice(-5)}`;
    }
    return `INV-${cleanId.toUpperCase()}`;
  };

  // Compute normalized invoice values for rendering
  const mockRef = bookingFallback || initialBookings[0];
  const invoiceNumber = invoiceData?.invoiceNumber || formatInvoiceNumber(mockRef.id);
  const bookingNumber = invoiceData?.bookingNumber || mockRef.bookingNumber || mockRef.id;
  const customerName = invoiceData?.customer?.name || mockRef.customerName || "Customer";
  const customerPhone = invoiceData?.customer?.mobile || mockRef.customerPhone || "";

  const fullAddress = invoiceData?.address
    ? [invoiceData.address.serviceAddress, invoiceData.address.landmark ? `Near ${invoiceData.address.landmark}` : "", invoiceData.address.localityName, invoiceData.address.pincode].filter(Boolean).join(", ")
    : (mockRef.address || "Sigra Colony, Varanasi");

  const items = invoiceData?.items && invoiceData.items.length > 0
    ? invoiceData.items.map((item: any, idx: number) => {
      const itemTitle = item.packageName || item.serviceActionName || item.categoryName || "Service Package";
      const unitPrice = item.unitPrice || 0;
      const qty = item.quantity || 1;
      const total = item.totalPrice || (unitPrice * qty);
      const cgst = Math.round(total * 0.09 * 100) / 100;
      const sgst = Math.round(total * 0.09 * 100) / 100;
      return {
        id: item._id || String(idx),
        title: itemTitle,
        code: `${bookingNumber}-${String(idx + 1).padStart(2, "0")}`,
        quantity: qty,
        unitPrice,
        total,
        cgst,
        sgst,
      };
    })
    : (mockRef.servicesList && mockRef.servicesList.length > 0
      ? mockRef.servicesList.map((item, idx) => {
        const itemBase = item.price * item.quantity;
        return {
          id: item.id || String(idx),
          title: item.title,
          code: item.serviceCode || `HM-SVC-${mockRef.id.replace(/[^0-9]/g, "")}-${String(idx + 1).padStart(2, "0")}`,
          quantity: item.quantity,
          unitPrice: item.price,
          total: itemBase,
          cgst: Math.round(itemBase * 0.09 * 100) / 100,
          sgst: Math.round(itemBase * 0.09 * 100) / 100,
        };
      })
      : [{
        id: "1",
        title: mockRef.serviceName || mockRef.serviceTitle || "Service Package",
        code: `HM-SVC-${mockRef.id.replace(/[^0-9]/g, "")}-01`,
        quantity: 1,
        unitPrice: mockRef.basePrice,
        total: mockRef.basePrice,
        cgst: mockRef.cgst,
        sgst: mockRef.sgst,
      }]
    );

  const basePrice = invoiceData?.billing?.sellingPrice ?? invoiceData?.billing?.mrp ?? mockRef.basePrice;
  const convenienceFee = invoiceData?.billing?.platformFee ?? mockRef.convenienceFee ?? 49;
  const totalGst = invoiceData?.billing?.gst ?? ((mockRef.cgst || 0) + (mockRef.sgst || 0));
  const cgstVal = Math.round((totalGst / 2) * 100) / 100;
  const sgstVal = Math.round((totalGst / 2) * 100) / 100;
  const totalAmount = invoiceData?.billing?.totalAmount ?? (mockRef.totalAmount || (basePrice + convenienceFee + totalGst));

  const paymentMethod = invoiceData?.billing?.paymentMethod || mockRef.paymentMethod || "UPI / Digital Prepaid";
  const paymentStatusRaw = invoiceData?.billing?.paymentStatus || mockRef.paymentStatus || mockRef.status || "paid";
  const paymentStatus = (typeof paymentStatusRaw === "string" ? paymentStatusRaw.toLowerCase() : "paid");

  const formattedDate = invoiceData?.generatedAt
    ? new Date(invoiceData.generatedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : (mockRef.scheduledDate || "Today");

  return (
    <div className="space-y-6 animate-in fade-in duration-200 print:p-0 print:m-0">
      {/* Embedded Strict Single-Page Print CSS for Official Tax Invoice */}
      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 8mm;
        }
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            height: 100% !important;
            max-height: 100% !important;
            overflow: hidden !important;
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body > * {
            display: none !important;
          }
          body > #printable-tax-invoice-portal {
            display: block !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          #printable-tax-invoice-portal * {
            visibility: visible !important;
          }
        }
      `}</style>

      {/* Top Navigation & Action Header Bar - Hidden on Print */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4 print:hidden">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                router.back();
              } else {
                router.push(invId ? `/bookings/${invId}` : "/bookings");
              }
            }}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-extrabold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Booking ({bookingNumber})</span>
          </button>
          <Link
            href="/billing"
            className="px-3 py-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white text-xs font-bold transition-all"
          >
            Billing Ledger
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice</span>
          </button>

          {/* Strictly Single Primary Button Per Page */}
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isDownloadingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Downloading PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Fetching official invoice from server...</p>
        </div>
      ) : (
        /* Official GST Tax Invoice Printable Canvas Card */
        <div
          id="printable-invoice"
          className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm w-full"
        >
          {/* Invoice Header: Branding & Meta */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-5">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-2xl bg-white border border-slate-200 dark:border-slate-700 shrink-0 shadow-xs flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="HelpMate Logo"
                  width={36}
                  height={36}
                  className="h-9 w-9 object-contain"
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-xl text-slate-900 dark:text-white tracking-tight leading-none">
                    HelpMate
                  </h1>
                  <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300 border border-brand-200">
                    Varanasi HQ
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                  Sigra Main Road, Near Cantt Railway Station, Varanasi - 221002
                </p>
                <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-bold">
                  GSTIN: 09AAACH8819Q1ZM • Support: +91 99350 98765
                </p>
              </div>
            </div>

            <div className="flex flex-col items-start sm:items-end space-y-1.5 shrink-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-extrabold text-xs border border-slate-200 dark:border-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                <span>OFFICIAL GST TAX INVOICE</span>
              </div>

              <div className="font-mono text-sm font-black text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                Invoice No: <span className="text-brand-600 dark:text-brand-400 font-extrabold">{invoiceNumber}</span>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                Invoice Date: <span className="font-bold text-slate-700 dark:text-slate-200">{formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Billed To & Service Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="font-extrabold text-slate-400 uppercase tracking-wider block text-[10px]">
                Billed To (Customer Details)
              </span>
              <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                {customerName}
              </div>
              <div className="text-slate-600 dark:text-slate-300 font-medium">
                {fullAddress}
              </div>
              <div className="font-bold text-slate-700 dark:text-slate-200">
                Phone: {customerPhone || "+91 99350 12345"}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="font-extrabold text-slate-400 uppercase tracking-wider block text-[10px]">
                Service & Payment Details
              </span>
              <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                Booking Reference: {bookingNumber}
              </div>
              <div className="text-slate-600 dark:text-slate-300 font-medium">
                Payment Method: {paymentMethod}
              </div>
              <div className={`font-bold flex items-center gap-1 ${paymentStatus === "refunded"
                  ? "text-purple-600 dark:text-purple-400"
                  : paymentStatus === "cancelled" || paymentStatus === "failed"
                    ? "text-rose-600 dark:text-rose-400"
                    : paymentStatus === "pending"
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-emerald-600 dark:text-emerald-400"
                }`}>
                {paymentStatus === "refunded"
                  ? "↩ Payment Status: Refunded"
                  : paymentStatus === "cancelled" || paymentStatus === "failed"
                    ? "✕ Payment Status: Not Paid / Cancelled"
                    : paymentStatus === "pending"
                      ? "⏱ Payment Status: Unpaid / Pending Collection"
                      : "✓ Payment Status: Paid"}
              </div>
            </div>
          </div>

          {/* Itemized Service Breakdown Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-3">Item / Description</th>
                  <th className="pb-3 text-right">Base Amount</th>
                  <th className="pb-3 text-right">CGST (9%)</th>
                  <th className="pb-3 text-right">SGST (9%)</th>
                  <th className="pb-3 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-semibold text-slate-800 dark:text-slate-200">
                {items.map((item: any, idx: number) => (
                  <tr key={item.id || idx}>
                    <td className="py-4">
                      <div className="flex items-center gap-2 font-extrabold text-slate-900 dark:text-white">
                        <span>{item.title}</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200">
                          {item.code}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                        Qty: {item.quantity} • SAC Code: 998719 • ₹{item.unitPrice} unit price
                      </div>
                    </td>
                    <td className="py-4 text-right font-mono font-bold">₹{item.total}</td>
                    <td className="py-4 text-right font-mono text-slate-600 dark:text-slate-400">₹{item.cgst}</td>
                    <td className="py-4 text-right font-mono text-slate-600 dark:text-slate-400">₹{item.sgst}</td>
                    <td className="py-4 text-right font-mono font-extrabold text-slate-900 dark:text-white">
                      ₹{item.total + item.cgst + item.sgst}
                    </td>
                  </tr>
                ))}

                <tr>
                  <td className="py-4">
                    <div className="font-bold text-slate-900 dark:text-white">Platform Convenience & Safety Insurance Fee</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                      HelpMate Safety Insurance & Tech Assignment
                    </div>
                  </td>
                  <td className="py-4 text-right font-mono font-bold">₹{convenienceFee}</td>
                  <td className="py-4 text-right font-mono text-slate-600 dark:text-slate-400">₹0</td>
                  <td className="py-4 text-right font-mono text-slate-600 dark:text-slate-400">₹0</td>
                  <td className="py-4 text-right font-mono font-bold">₹{convenienceFee}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tax Summary & Total Box */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-t border-slate-200 dark:border-slate-800 pt-6">
            <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 max-w-sm">
              <span className="font-extrabold text-slate-700 dark:text-slate-200 block">Terms & Conditions</span>
              <p>1. Invoice generated under GST Act 2017 for Varanasi Jurisdiction.</p>
              <p>2. SAC Code 998719 applies to Home Maintenance & Repair Services.</p>
            </div>

            <div className="w-full sm:w-64 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
              <div className="flex justify-between py-0.5 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                <span>Base Subtotal</span>
                <span className="font-mono font-bold">₹{basePrice + convenienceFee}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                <span>CGST (9%)</span>
                <span className="font-mono font-bold">₹{cgstVal}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                <span>SGST (9%)</span>
                <span className="font-mono font-bold">₹{sgstVal}</span>
              </div>
              <div className="flex justify-between py-1 text-xs font-black text-slate-900 dark:text-white">
                <span>Grand Total</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 text-sm">₹{totalAmount}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PORTAL PRINT CANVAS FOR GUARANTEED 1-PAGE A4 PRINT */}
      <Portal>
        <div
          id="printable-tax-invoice-portal"
          className="hidden print:block p-0 rounded-3xl bg-white text-black space-y-4 w-full"
        >
          {/* Header */}
          <div className="flex flex-row items-start justify-between gap-2 border-b border-slate-300 pb-3">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-xl bg-white border border-slate-300 shrink-0 flex items-center justify-center">
                <Image
                  src="/logo.png"
                  alt="HelpMate Logo"
                  width={32}
                  height={32}
                  className="h-8 w-8 object-contain"
                />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-xl text-black tracking-tight leading-none">
                    HelpMate
                  </h1>
                  <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-slate-100 text-black border border-slate-300">
                    Varanasi HQ
                  </span>
                </div>
                <p className="text-[10px] text-slate-700 font-medium">
                  Sigra Main Road, Near Cantt Railway Station, Varanasi - 221002
                </p>
                <p className="text-[10px] font-mono text-slate-700 font-bold">
                  GSTIN: 09AAACH8819Q1ZM • Support: +91 99350 98765
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end text-right space-y-1 shrink-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-black font-extrabold text-[10px] border border-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-black inline-block" />
                <span>OFFICIAL GST TAX INVOICE</span>
              </div>

              <div className="font-mono text-xs font-black text-black bg-slate-100 px-2.5 py-0.5 rounded-lg border border-slate-300">
                Invoice No: <span className="text-black font-extrabold">{invoiceNumber}</span>
              </div>

              <div className="text-[10px] text-slate-600 font-semibold">
                Invoice Date: <span className="font-bold text-black">{formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Customer & Billing Details */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-300 space-y-1">
              <span className="font-extrabold text-slate-500 uppercase tracking-wider block text-[9px]">
                Billed To (Customer Details)
              </span>
              <div className="font-extrabold text-black text-xs">
                {customerName}
              </div>
              <div className="text-slate-800 font-medium text-[10px]">
                {fullAddress}
              </div>
              <div className="font-bold text-slate-900 text-[10px]">
                Phone: {customerPhone || "+91 99350 12345"}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-300 space-y-1">
              <span className="font-extrabold text-slate-500 uppercase tracking-wider block text-[9px]">
                Service & Payment Details
              </span>
              <div className="font-extrabold text-black text-xs">
                Booking Ref: {bookingNumber}
              </div>
              <div className="text-slate-800 font-medium text-[10px]">
                Payment Method: {paymentMethod}
              </div>
              <div className={`font-bold flex items-center gap-1 text-[10px] ${paymentStatus === "refunded"
                  ? "text-purple-700"
                  : paymentStatus === "cancelled" || paymentStatus === "failed"
                    ? "text-rose-700"
                    : paymentStatus === "pending"
                      ? "text-amber-700"
                      : "text-emerald-700"
                }`}>
                {paymentStatus === "refunded"
                  ? "↩ Payment Status: Refunded"
                  : paymentStatus === "cancelled" || paymentStatus === "failed"
                    ? "✕ Payment Status: Not Paid / Cancelled"
                    : paymentStatus === "pending"
                      ? "⏱ Payment Status: Unpaid / Pending Collection"
                      : "✓ Payment Status: Paid"}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-300 text-slate-500 font-bold uppercase text-[9px]">
                  <th className="pb-1.5">Item / Description</th>
                  <th className="pb-1.5 text-right">Base Amount</th>
                  <th className="pb-1.5 text-right">CGST (9%)</th>
                  <th className="pb-1.5 text-right">SGST (9%)</th>
                  <th className="pb-1.5 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-semibold text-black">
                {items.map((item: any, idx: number) => (
                  <tr key={item.id || idx}>
                    <td className="py-2">
                      <div className="font-extrabold text-xs">{item.title}</div>
                      <div className="text-[10px] text-slate-600 font-normal">
                        Standard Varanasi Home Service Rate Card (SAC Code: 998719)
                      </div>
                    </td>
                    <td className="py-2 text-right font-mono font-bold text-xs">₹{item.total}</td>
                    <td className="py-2 text-right font-mono text-slate-700 text-xs">₹{item.cgst}</td>
                    <td className="py-2 text-right font-mono text-slate-700 text-xs">₹{item.sgst}</td>
                    <td className="py-2 text-right font-mono font-extrabold text-black text-xs">
                      ₹{item.total + item.cgst + item.sgst}
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="py-2">
                    <div className="font-bold text-xs">Platform Convenience & Safety Insurance Fee</div>
                    <div className="text-[10px] text-slate-600 font-normal">
                      HelpMate Safety Insurance & Tech Assignment
                    </div>
                  </td>
                  <td className="py-2 text-right font-mono font-bold text-xs">₹{convenienceFee}</td>
                  <td className="py-2 text-right font-mono text-slate-700 text-xs">₹0</td>
                  <td className="py-2 text-right font-mono text-slate-700 text-xs">₹0</td>
                  <td className="py-2 text-right font-mono font-bold text-xs">₹{convenienceFee}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tax Summary & Total Box */}
          <div className="flex flex-row justify-between items-start gap-4 border-t border-slate-300 pt-3">
            <div className="text-[10px] text-slate-600 space-y-0.5 max-w-sm">
              <span className="font-extrabold text-black block text-xs">Terms & Conditions</span>
              <p>1. Invoice generated under GST Act 2017 for Varanasi Jurisdiction.</p>
              <p>2. SAC Code 998719 applies to Home Maintenance & Repair Services.</p>
            </div>

            <div className="w-60 p-2.5 rounded-xl bg-slate-50 border border-slate-300 space-y-1 text-xs">
              <div className="flex justify-between py-0.5 border-b border-slate-300 text-slate-800 text-[11px]">
                <span>Base Subtotal</span>
                <span className="font-mono font-bold">₹{basePrice + convenienceFee}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-300 text-slate-800 text-[11px]">
                <span>CGST (9%)</span>
                <span className="font-mono font-bold">₹{cgstVal}</span>
              </div>
              <div className="flex justify-between py-0.5 border-b border-slate-300 text-slate-800 text-[11px]">
                <span>SGST (9%)</span>
                <span className="font-mono font-bold">₹{sgstVal}</span>
              </div>
              <div className="flex justify-between py-0.5 text-xs font-black text-black">
                <span>Grand Total</span>
                <span className="font-mono text-emerald-700 font-bold text-xs">₹{totalAmount}</span>
              </div>
            </div>
          </div>
        </div>
      </Portal>
    </div>
  );
}
