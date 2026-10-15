"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { initialTechnicians, Technician } from "@/lib/mockData";
import { Portal } from "@/components/Portal";
import { ToastContainer, ToastMessage } from "@/components/Toast";
import { DateRangePicker } from "@/components/DateRangePicker";

function parseFlexibleDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const lower = dateStr.toLowerCase().trim();
  if (lower.includes("today")) return new Date();
  if (lower.includes("yesterday")) {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d;
  }
  const timestamp = Date.parse(dateStr);
  if (!isNaN(timestamp)) return new Date(timestamp);
  return null;
}

function checkDateInRange(dateStr: string, startDate?: string, endDate?: string): boolean {
  if (!startDate && !endDate) return true;
  const d = parseFlexibleDate(dateStr);
  if (!d) return true;

  if (startDate) {
    const s = new Date(startDate);
    s.setHours(0, 0, 0, 0);
    if (d < s) return false;
  }
  if (endDate) {
    const e = new Date(endDate);
    e.setHours(23, 59, 59, 999);
    if (d > e) return false;
  }
  return true;
}
import {
  Star,
  CheckCircle2,
  MapPin,
  FileCheck,
  ArrowLeft,
  Edit,
  Edit2,
  User,
  ShieldCheck,
  ShieldAlert,
  CalendarCheck,
  Wallet,
  Clock,
  TrendingUp,
  Award,
  Phone,
  Mail,
  Building,
  Upload,
  ExternalLink,
  CreditCard,
  Briefcase,
  Sparkles,
  CheckCircle,
  Receipt,
  Users,
  Eye,
  Navigation,
  Truck,
  Activity,
  KeyRound,
  Wrench,
  DollarSign,
  X,
  UserCheck,
  Compass,
} from "lucide-react";
import { DataTable, Column } from "@/components/DataTable";
import { RowActionMenu } from "@/components/RowActionMenu";
import { PartnerMapView } from "@/components/PartnerMapView";

export default function TechnicianDetailPage() {
  const params = useParams();
  const router = useRouter();
  const techId = params?.id as string;

  // Find technician by ID or fallback to first
  const tech: Technician =
    initialTechnicians.find((t) => t.id === techId) || initialTechnicians[0];

  const [activeTab, setActiveTab] = useState<"overview" | "jobs" | "earnings" | "map">("overview");
  const [showKycDetails, setShowKycDetails] = useState(false);
  const [showKycDrawer, setShowKycDrawer] = useState(false);
  const [showManageBankDrawer, setShowManageBankDrawer] = useState(false);

  // Manual Payout Process Modal State
  const [showManualPayoutModal, setShowManualPayoutModal] = useState(false);
  const [settlementStartDate, setSettlementStartDate] = useState<string>("");
  const [settlementEndDate, setSettlementEndDate] = useState<string>("");
  const [payoutMethod, setPayoutMethod] = useState("Manual Bank Transfer (IMPS / NEFT)");
  const [utrNumberInput, setUtrNumberInput] = useState(`UTR-VAR-2026-${Math.floor(10000000 + Math.random() * 90000000)}`);
  const [proofUploaded, setProofUploaded] = useState(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Helper to mask customer phone number to show only last 4 digits
  const maskPhoneNumber = (phone: string) => {
    if (!phone) return "";
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 4) return phone;
    return `+91 ******${digits.slice(-4)}`;
  };

  // Active Ongoing Job Pipeline Data for Partner (Time Booked, Stage Tracker, Location)
  const activeJob = {
    id: "BK-VAR-9990",
    customerName: "Sanjeev Tripathi",
    customerPhone: "+91 ******2345",
    serviceTitle: tech.category + " - Split AC Power Jet Wash & Gas Pressure Check",
    locality: "Sigra, Varanasi (Flat 302, Green Valley Apartments)",
    bookedTime: "Today, 02:30 PM",
    bookedSlot: "02:00 PM - 04:00 PM",
    totalAmount: 2499,
    commissionFee: 625,
    netShare: 1874,
    status: "Accepted",
    currentStage: 1, // 0: Booked / Assigned, 1: Accepted, 2: OTP Completion
    stages: [
      { id: 0, label: "Booked / Assigned", time: "02:00 PM", icon: CalendarCheck },
      { id: 1, label: "Accepted", time: "02:05 PM", icon: UserCheck },
      { id: 2, label: "OTP Completion", time: "Pending OTP Verification", icon: KeyRound },
    ],
  };

  // Sample Completed & Active Jobs List
  const partnerJobs = [
    {
      id: activeJob.id,
      customerName: activeJob.customerName,
      serviceTitle: activeJob.serviceTitle,
      locality: "Sigra, Varanasi",
      date: activeJob.bookedTime,
      totalAmount: activeJob.totalAmount,
      commissionFee: activeJob.commissionFee,
      netShare: activeJob.netShare,
      status: "Accepted (Stage 2/3)",
      isLive: true,
    },
    {
      id: "BK-VAR-9981",
      customerName: "Alok Verma",
      serviceTitle: tech.category + " - Power Jet Wash & Gas Check",
      locality: tech.locality + ", Varanasi",
      date: "Today, 11:30 AM",
      totalAmount: 1999,
      commissionFee: 500,
      netShare: 1499,
      status: "Completed",
    },
    {
      id: "BK-VAR-9975",
      customerName: "Rajesh Agrawal",
      serviceTitle: tech.category + " - Filter Cartridge & RO Sanitization",
      locality: "Sigra, Varanasi",
      date: "08 Aug 2026",
      totalAmount: 1499,
      commissionFee: 375,
      netShare: 1124,
      status: "Completed",
    },
    {
      id: "BK-VAR-9968",
      customerName: "Vikram Malhotra",
      serviceTitle: tech.category + " - Full Deep Hydro Wash",
      locality: "Lanka, Varanasi",
      date: "05 Aug 2026",
      totalAmount: 2890,
      commissionFee: 722,
      netShare: 2168,
      status: "Completed",
    },
    {
      id: "BK-VAR-9954",
      customerName: "Siddharth Gupta",
      serviceTitle: tech.category + " - Commercial Unit Hydro Repair",
      locality: "Cantonment, Varanasi",
      date: "02 Aug 2026",
      totalAmount: 4000,
      commissionFee: 1000,
      netShare: 3000,
      status: "Completed",
    },
    {
      id: "BK-VAR-9941",
      customerName: "Sunita Agrawal",
      serviceTitle: tech.category + " - Inverter AC Gas Refilling (R32)",
      locality: "Assi Ghat, Varanasi",
      date: "29 Jul 2026",
      totalAmount: 2500,
      commissionFee: 625,
      netShare: 1875,
      status: "Completed",
    },
    {
      id: "BK-VAR-9932",
      customerName: "B.P. Srivastava",
      serviceTitle: tech.category + " - Villa Deep Hydro Cleaning",
      locality: "Lahurabir, Varanasi",
      date: "26 Jul 2026",
      totalAmount: 5500,
      commissionFee: 1375,
      netShare: 4125,
      status: "Completed",
    },
    {
      id: "BK-VAR-9920",
      customerName: "Amitabh Verma",
      serviceTitle: tech.category + " - Motor & Capacitor Replacement",
      locality: "Rathyatra, Varanasi",
      date: "22 Jul 2026",
      totalAmount: 1850,
      commissionFee: 462,
      netShare: 1388,
      status: "Completed",
    },
    {
      id: "BK-VAR-9912",
      customerName: "Priya Sharma",
      serviceTitle: tech.category + " - Degreasing & Filter Wash",
      locality: "Bhelupur, Varanasi",
      date: "18 Jul 2026",
      totalAmount: 1299,
      commissionFee: 325,
      netShare: 974,
      status: "Completed",
    },
    {
      id: "BK-VAR-9899",
      customerName: "Ramesh Pandey",
      serviceTitle: tech.category + " - Copper Pipe Welding & Leak Repair",
      locality: "Godowlia, Varanasi",
      date: "14 Jul 2026",
      totalAmount: 3200,
      commissionFee: 800,
      netShare: 2400,
      status: "Completed",
    },
    {
      id: "BK-VAR-9884",
      customerName: "Manoj Tripathi",
      serviceTitle: tech.category + " - Heating Element & Thermostat Replacement",
      locality: "Shivpur, Varanasi",
      date: "10 Jul 2026",
      totalAmount: 1650,
      commissionFee: 412,
      netShare: 1238,
      status: "Completed",
    },
    {
      id: "BK-VAR-9870",
      customerName: "Kavita Gupta",
      serviceTitle: tech.category + " - Power Jet Wash & Chemical Foam Cleansing",
      locality: "Sigra, Varanasi",
      date: "06 Jul 2026",
      totalAmount: 2199,
      commissionFee: 550,
      netShare: 1649,
      status: "Completed",
    },
    {
      id: "BK-VAR-9855",
      customerName: "Sanjay Rastogi",
      serviceTitle: tech.category + " - Drain Pipe Unclogging & Water Pressure Test",
      locality: "Mahmoorganj, Varanasi",
      date: "01 Jul 2026",
      totalAmount: 1350,
      commissionFee: 338,
      netShare: 1012,
      status: "Completed",
    },
    {
      id: "BK-VAR-9842",
      customerName: "Anjali Chaurasia",
      serviceTitle: tech.category + " - Anti-Bacterial Sanitization Wash",
      locality: "Lanka, Varanasi",
      date: "27 Jun 2026",
      totalAmount: 1899,
      commissionFee: 475,
      netShare: 1424,
      status: "Completed",
    },
    {
      id: "BK-VAR-9830",
      customerName: "Rahul Dev",
      serviceTitle: tech.category + " - PCB Repair & Transformer Testing",
      locality: "Sarnath, Varanasi",
      date: "23 Jun 2026",
      totalAmount: 2750,
      commissionFee: 688,
      netShare: 2062,
      status: "Completed",
    },
    {
      id: "BK-VAR-9818",
      customerName: "Meenakshi Joshi",
      serviceTitle: tech.category + " - Comprehensive Annual Preventive Maintenance",
      locality: "Bhelupur, Varanasi",
      date: "19 Jun 2026",
      totalAmount: 3499,
      commissionFee: 875,
      netShare: 2624,
      status: "Completed",
    },
    {
      id: "BK-VAR-9805",
      customerName: "Alok Chaurasia",
      serviceTitle: tech.category + " - Outdoor Coil High-Pressure Scouring",
      locality: "Cantonment, Varanasi",
      date: "15 Jun 2026",
      totalAmount: 1599,
      commissionFee: 400,
      netShare: 1199,
      status: "Completed",
    },
    {
      id: "BK-VAR-9791",
      customerName: "Shalini Rai",
      serviceTitle: tech.category + " - Gas Leak Testing & Valve Soldering",
      locality: "Assi Ghat, Varanasi",
      date: "11 Jun 2026",
      totalAmount: 2899,
      commissionFee: 725,
      netShare: 2174,
      status: "Completed",
    },
    {
      id: "BK-VAR-9778",
      customerName: "Rakesh Verma",
      serviceTitle: tech.category + " - Water Filter Scrubbing & UV Lamp Swap",
      locality: "Sigra, Varanasi",
      date: "07 Jun 2026",
      totalAmount: 1199,
      commissionFee: 300,
      netShare: 899,
      status: "Completed",
    },
    {
      id: "BK-VAR-9764",
      customerName: "Abhishek Singh",
      serviceTitle: tech.category + " - Short Circuit & Main Line Fault Isolation",
      locality: "Mahmoorganj, Varanasi",
      date: "03 Jun 2026",
      totalAmount: 1450,
      commissionFee: 363,
      netShare: 1087,
      status: "Completed",
    },
    {
      id: "BK-VAR-9750",
      customerName: "Archana Tripathi",
      serviceTitle: tech.category + " - Dual Split Jet Servicing (2 Units)",
      locality: "Lanka, Varanasi",
      date: "29 May 2026",
      totalAmount: 3299,
      commissionFee: 825,
      netShare: 2474,
      status: "Completed",
    },
    {
      id: "BK-VAR-9736",
      customerName: "Deepak Pandey",
      serviceTitle: tech.category + " - Hydro Descaling & Flush Clean",
      locality: "Bhelupur, Varanasi",
      date: "25 May 2026",
      totalAmount: 1799,
      commissionFee: 450,
      netShare: 1349,
      status: "Completed",
    },
    {
      id: "BK-VAR-9722",
      customerName: "Neha Agarwal",
      serviceTitle: tech.category + " - Washing Machine Drum Overhaul",
      locality: "Godowlia, Varanasi",
      date: "21 May 2026",
      totalAmount: 2100,
      commissionFee: 525,
      netShare: 1575,
      status: "Completed",
    },
    {
      id: "BK-VAR-9708",
      customerName: "Rohit Srivastava",
      serviceTitle: tech.category + " - Refrigerator Thermostat Calibration",
      locality: "Shivpur, Varanasi",
      date: "17 May 2026",
      totalAmount: 1699,
      commissionFee: 425,
      netShare: 1274,
      status: "Completed",
    },
    {
      id: "BK-VAR-9694",
      customerName: "Pooja Yadav",
      serviceTitle: tech.category + " - Hydro Pressure Drain Clearance",
      locality: "Sarnath, Varanasi",
      date: "13 May 2026",
      totalAmount: 1250,
      commissionFee: 313,
      netShare: 937,
      status: "Completed",
    },
    {
      id: "BK-VAR-9680",
      customerName: "Sunil Rastogi",
      serviceTitle: tech.category + " - Electrical MCB Panel Replacement",
      locality: "Sigra, Varanasi",
      date: "09 May 2026",
      totalAmount: 1950,
      commissionFee: 488,
      netShare: 1462,
      status: "Completed",
    },
  ];

  // Weekly Settlement Ledger (Expanded Dataset for Pagination)
  const weeklySettlements = [
    {
      id: "SET-VAR-2026-32",
      cycle: "01 Aug - 07 Aug 2026",
      grossAmount: 18400,
      commissionFee: 4600,
      netPayout: 13800,
      bankName: "HDFC Bank",
      utr: "UTR99281044",
      status: "Settled",
      date: "08 Aug 2026",
    },
    {
      id: "SET-VAR-2026-31",
      cycle: "25 Jul - 31 Jul 2026",
      grossAmount: 22000,
      commissionFee: 5500,
      netPayout: 16500,
      bankName: "HDFC Bank",
      utr: "UTR99254110",
      status: "Settled",
      date: "01 Aug 2026",
    },
    {
      id: "SET-VAR-2026-30",
      cycle: "18 Jul - 24 Jul 2026",
      grossAmount: 16800,
      commissionFee: 4200,
      netPayout: 12600,
      bankName: "HDFC Bank",
      utr: "UTR99218902",
      status: "Settled",
      date: "25 Jul 2026",
    },
    {
      id: "SET-VAR-2026-29",
      cycle: "11 Jul - 17 Jul 2026",
      grossAmount: 19500,
      commissionFee: 4875,
      netPayout: 14625,
      bankName: "HDFC Bank",
      utr: "UTR99187622",
      status: "Settled",
      date: "18 Jul 2026",
    },
    {
      id: "SET-VAR-2026-28",
      cycle: "04 Jul - 10 Jul 2026",
      grossAmount: 24200,
      commissionFee: 6050,
      netPayout: 18150,
      bankName: "HDFC Bank",
      utr: "UTR99154301",
      status: "Settled",
      date: "11 Jul 2026",
    },
    {
      id: "SET-VAR-2026-27",
      cycle: "27 Jun - 03 Jul 2026",
      grossAmount: 15600,
      commissionFee: 3900,
      netPayout: 11700,
      bankName: "HDFC Bank",
      utr: "UTR99120994",
      status: "Settled",
      date: "04 Jul 2026",
    },
    {
      id: "SET-VAR-2026-26",
      cycle: "20 Jun - 26 Jun 2026",
      grossAmount: 21000,
      commissionFee: 5250,
      netPayout: 15750,
      bankName: "HDFC Bank",
      utr: "UTR99088123",
      status: "Settled",
      date: "27 Jun 2026",
    },
    {
      id: "SET-VAR-2026-25",
      cycle: "13 Jun - 19 Jun 2026",
      grossAmount: 17900,
      commissionFee: 4475,
      netPayout: 13425,
      bankName: "HDFC Bank",
      utr: "UTR99052199",
      status: "Settled",
      date: "20 Jun 2026",
    },
    {
      id: "SET-VAR-2026-24",
      cycle: "06 Jun - 12 Jun 2026",
      grossAmount: 20400,
      commissionFee: 5100,
      netPayout: 15300,
      bankName: "HDFC Bank",
      utr: "UTR99014022",
      status: "Settled",
      date: "13 Jun 2026",
    },
    {
      id: "SET-VAR-2026-23",
      cycle: "30 May - 05 Jun 2026",
      grossAmount: 18900,
      commissionFee: 4725,
      netPayout: 14175,
      bankName: "HDFC Bank",
      utr: "UTR98978114",
      status: "Settled",
      date: "06 Jun 2026",
    },
    {
      id: "SET-VAR-2026-22",
      cycle: "23 May - 29 May 2026",
      grossAmount: 23500,
      commissionFee: 5875,
      netPayout: 17625,
      bankName: "HDFC Bank",
      utr: "UTR98941098",
      status: "Settled",
      date: "30 May 2026",
    },
    {
      id: "SET-VAR-2026-21",
      cycle: "16 May - 22 May 2026",
      grossAmount: 16200,
      commissionFee: 4050,
      netPayout: 12150,
      bankName: "HDFC Bank",
      utr: "UTR98904552",
      status: "Settled",
      date: "23 May 2026",
    },
    {
      id: "SET-VAR-2026-20",
      cycle: "09 May - 15 May 2026",
      grossAmount: 19800,
      commissionFee: 4950,
      netPayout: 14850,
      bankName: "HDFC Bank",
      utr: "UTR98867120",
      status: "Settled",
      date: "16 May 2026",
    },
    {
      id: "SET-VAR-2026-19",
      cycle: "02 May - 08 May 2026",
      grossAmount: 21500,
      commissionFee: 5375,
      netPayout: 16125,
      bankName: "HDFC Bank",
      utr: "UTR98830491",
      status: "Settled",
      date: "09 May 2026",
    },
    {
      id: "SET-VAR-2026-18",
      cycle: "25 Apr - 01 May 2026",
      grossAmount: 17400,
      commissionFee: 4350,
      netPayout: 13050,
      bankName: "HDFC Bank",
      utr: "UTR98792011",
      status: "Settled",
      date: "02 May 2026",
    },
    {
      id: "SET-VAR-2026-17",
      cycle: "18 Apr - 24 Apr 2026",
      grossAmount: 22800,
      commissionFee: 5700,
      netPayout: 17100,
      bankName: "HDFC Bank",
      utr: "UTR98754118",
      status: "Settled",
      date: "25 Apr 2026",
    },
  ];

  // DataTable Job Columns Definition
  const jobColumns: Column<any>[] = [
    {
      key: "id",
      header: "Booking ID",
      accessor: (row) => (
        <Link
          href={`/bookings/${row.id}`}
          className="font-mono text-xs font-black text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-2.5 py-1 rounded-lg border border-brand-200 dark:border-brand-800 hover:underline inline-flex items-center gap-1"
        >
          <span>#{row.id}</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      ),
      sortable: true,
    },
    {
      key: "serviceTitle",
      header: "Service & Locality",
      accessor: (row) => (
        <div>
          <h4 className="font-extrabold text-slate-900 dark:text-white text-xs">{row.serviceTitle}</h4>
          <span className="text-[10px] text-slate-400 font-bold">{row.locality}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "customerName",
      header: "Customer",
      accessor: (row) => (
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
          {row.customerName}
        </span>
      ),
      sortable: true,
    },
    {
      key: "date",
      header: "Date",
      accessor: (row) => (
        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 font-mono">
          {row.date}
        </span>
      ),
      sortable: true,
    },
    {
      key: "totalAmount",
      header: "Gross Bill",
      accessor: (row) => (
        <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-xs">
          ₹{row.totalAmount.toLocaleString("en-IN")}
        </span>
      ),
      sortable: true,
    },
    {
      key: "commissionFee",
      header: "25% Fee",
      accessor: (row) => (
        <span className="font-mono text-slate-400 text-xs">
          ₹{row.commissionFee.toLocaleString("en-IN")}
        </span>
      ),
      sortable: true,
    },
    {
      key: "netShare",
      header: "Partner Net Share",
      accessor: (row) => (
        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-xs">
          ₹{row.netShare.toLocaleString("en-IN")}
        </span>
      ),
      sortable: true,
    },
    {
      key: "status",
      header: "Status & Pipeline Stage",
      accessor: (row) => (
        <span
          className={`px-2.5 py-0.5 rounded-full font-extrabold text-[10px] border inline-flex items-center gap-1 w-fit ${
            row.isLive || row.status?.includes("Doing") || row.status?.includes("En Route")
              ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-700 animate-pulse"
              : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
          }`}
        >
          {row.isLive && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping shrink-0" />}
          <span>{row.status}</span>
        </span>
      ),
      sortable: true,
    },
    {
      key: "actions",
      header: "Actions",
      sticky: "right",
      accessor: (row) => (
        <RowActionMenu
          actions={[
            {
              label: "View Job Details",
              icon: Eye,
              href: `/bookings/${row.id}`,
            },
          ]}
        />
      ),
    },
  ];

  // DataTable Settlement Columns Definition
  const settlementColumns: Column<any>[] = [
    {
      key: "id",
      header: "Settlement ID",
      accessor: (row) => (
        <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
          {row.id}
        </span>
      ),
      sortable: true,
    },
    {
      key: "date",
      header: "Settlement Date",
      accessor: (row) => (
        <div className="flex flex-col">
          <span className="font-mono font-extrabold text-slate-900 dark:text-white text-xs">
            {row.date || "14 Aug 2026"}
          </span>
          <span className="text-[10px] text-emerald-600 font-bold">Disbursed</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "cycle",
      header: "Weekly Cycle",
      accessor: (row) => (
        <div>
          <h4 className="font-extrabold text-slate-900 dark:text-white text-xs">{row.cycle}</h4>
          <span className="text-[10px] text-slate-400 font-mono">Cycle Range: {row.date}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "grossAmount",
      header: "Gross Billings",
      accessor: (row) => (
        <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-xs">
          ₹{row.grossAmount.toLocaleString("en-IN")}
        </span>
      ),
      sortable: true,
    },
    {
      key: "commissionFee",
      header: "Platform Fee (25%)",
      accessor: (row) => (
        <span className="font-mono text-slate-400 text-xs">
          ₹{row.commissionFee.toLocaleString("en-IN")}
        </span>
      ),
      sortable: true,
    },
    {
      key: "netPayout",
      header: "Net Credited Payout",
      accessor: (row) => (
        <span className="font-mono font-black text-brand-600 dark:text-brand-400 text-xs">
          ₹{row.netPayout.toLocaleString("en-IN")}
        </span>
      ),
      sortable: true,
    },
    {
      key: "utr",
      header: "Bank Ref / UTR",
      accessor: (row) => (
        <div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">{row.bankName}</span>
          <span className="font-mono text-[10px] text-slate-400">{row.utr}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Settlement Mode",
      accessor: (row) => (
        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold text-[10px] border border-emerald-200 dark:border-emerald-800">
          Manual Bank Transfer ({row.status})
        </span>
      ),
      sortable: true,
    },
    {
      key: "proof",
      header: "Manual UTR Receipt",
      accessor: () => (
        <a
          href="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80"
          target="_blank"
          rel="noreferrer"
          className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400 font-bold text-[10px] hover:underline flex items-center gap-1 w-fit border border-slate-200 dark:border-slate-700"
        >
          <FileCheck className="w-3 h-3 text-emerald-600" /> View UTR Proof
        </a>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200 pb-16">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <Link
          href="/technicians"
          className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-extrabold flex items-center gap-2 transition-all shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-brand-500" />
          <span>Back to Partner Directory</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 text-xs font-mono font-bold border border-brand-200 dark:border-brand-800">
            Partner ID: {tech.id}
          </span>
        </div>
      </div>

      {/* Simple Clean Partner Header Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-brand-500 shadow-sm shrink-0">
              {tech.avatar ? (
                <Image
                  src={tech.avatar}
                  alt={tech.name}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : null}
            </div>
            <span className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 text-white rounded-full text-[10px] ring-4 ring-white dark:ring-slate-900 z-10">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">{tech.name}</h1>
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-extrabold border ${tech.status === "Available" || tech.status === "Approved"
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                    : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                  }`}
              >
                ● {tech.status}
              </span>
              <span className="px-3 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-extrabold">
                {tech.role}
              </span>
            </div>

            <p className="text-xs text-brand-600 dark:text-brand-400 font-extrabold flex items-center gap-2">
              <Building className="w-3.5 h-3.5 text-brand-500" />
              <span>{tech.category} Specialist</span>
              <span>•</span>
              <MapPin className="w-3.5 h-3.5 text-brand-500" />
              <span>{tech.locality} ({tech.pincode}), Varanasi</span>
            </p>

            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-semibold pt-1 flex-wrap">
              <span className="flex items-center gap-1 font-mono text-slate-700 dark:text-slate-300 font-bold">
                <Phone className="w-3.5 h-3.5 text-emerald-600" /> {tech.phone}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Onboarded: {tech.joiningDate || "Jan 2025"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap shrink-0">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tech.locality + ", " + tech.pincode + ", Varanasi, Uttar Pradesh")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-xs flex items-center gap-2 transition-all cursor-pointer"
            title="Navigate to partner zone on Google Maps"
          >
            <MapPin className="w-4 h-4" />
            <span>Open in Maps</span>
          </a>
          <a
            href={`tel:${tech.phone}`}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Phone className="w-4 h-4" />
            <span>Call Partner</span>
          </a>
          <a
            href={`https://wa.me/${tech.phone.replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs shadow-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>WhatsApp Partner</span>
          </a>
        </div>
      </div>

      {/* ─── HIGH-CONTRAST SEGMENTED TAB BAR ─── */}
      <div className="bg-slate-100 dark:bg-slate-800/90 p-1.5 rounded-2xl flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 shadow-inner w-full sm:w-fit text-xs font-extrabold overflow-x-auto no-scrollbar max-w-full flex-nowrap">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`px-5 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === "overview"
              ? "bg-brand-600 text-white shadow-lux scale-[1.02] font-black"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700/70"
            }`}
        >
          <User className="w-4 h-4" />
          <span>Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("jobs")}
          className={`px-5 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === "jobs"
              ? "bg-brand-600 text-white shadow-lux scale-[1.02] font-black"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700/70"
            }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Completed Jobs</span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${activeTab === "jobs"
                ? "bg-white/20 text-white"
                : "bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
              }`}
          >
            {partnerJobs.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("earnings")}
          className={`px-5 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === "earnings"
              ? "bg-brand-600 text-white shadow-lux scale-[1.02] font-black"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700/70"
            }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Earnings & Weekly Settlement</span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${activeTab === "earnings"
                ? "bg-white/20 text-white"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
              }`}
          >
            {weeklySettlements.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("map")}
          className={`px-5 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === "map"
              ? "bg-brand-600 text-white shadow-lux scale-[1.02] font-black"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-slate-700/70"
            }`}
        >
          <MapPin className="w-4 h-4 text-rose-500 animate-bounce" />
          <span>Live GPS & Coverage Map</span>
        </button>
      </div>

      {/* TAB: LIVE GPS MAP */}
      {activeTab === "map" && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 text-xs text-brand-800 dark:text-brand-300 font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-brand-600 animate-spin-slow" />
              <span>Live Telemetry Pinned to <strong>{tech.name}</strong> ({tech.locality} • {tech.pincode})</span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-black">
              ● Live Signal 100%
            </span>
          </div>

          <PartnerMapView technicians={initialTechnicians} />
        </div>
      )}

      {/* TAB 1: OVERVIEW & BIOMETRIC KYC SPECIFICATIONS */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* 1. QUICK CARDS (FIRST ON VERY TOP) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-400 font-extrabold uppercase tracking-wider">
                <span>Partner Rating</span>
                <span className="p-2 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400"><Star className="w-4 h-4 fill-amber-500" /></span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
                {tech.rating} / 5.0
              </div>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                ★ 98% Positive Customer Feedback
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-400 font-extrabold uppercase tracking-wider">
                <span>Total Jobs Completed</span>
                <span className="p-2 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400"><Briefcase className="w-4 h-4" /></span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-brand-600 dark:text-brand-400 font-mono">
                {partnerJobs.length} Jobs
              </div>
              <span className="text-[11px] text-slate-500 font-semibold">Varanasi Active Partners</span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-400 font-extrabold uppercase tracking-wider">
                <span>Gross Revenue</span>
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"><CreditCard className="w-4 h-4" /></span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                ₹{tech.totalEarnings.toLocaleString()}
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> 100% Cleared Billings
              </span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-400 font-extrabold uppercase tracking-wider">
                <span>Pending Weekly Payout</span>
                <span className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400"><Wallet className="w-4 h-4" /></span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 font-mono">
                ₹{tech.pendingPayout.toLocaleString()}
              </div>
              <span className="text-[11px] text-purple-700 dark:text-purple-300 font-bold block">
                Next Payout: Monday 10:00 AM
              </span>
            </div>
          </div>

          {/* 2. PERSONAL DETAILS (THEN SECOND) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column (7 Cols) - Partner Personal & Technical Profile */}
            <div className="lg:col-span-7 space-y-6">
              <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Partner Personal & Technical Profile</h3>
                      <p className="text-[11px] text-slate-400">Biometric Verified Technician Details</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    ● Biometric Verified
                  </span>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold">Full Partner Name</span>
                    <span className="font-extrabold text-slate-900 dark:text-white text-sm">{tech.name}</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold">Mobile Phone</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">{tech.phone}</span>
                      <a href={`tel:${tech.phone}`} className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-extrabold">Call</a>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold">Service Category</span>
                    <span className="font-extrabold text-brand-600 dark:text-brand-400">{tech.category}</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold">Skill Level & Certification</span>
                    <span className="font-bold text-slate-900 dark:text-white">HVAC Master Level L3 Certified</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold">Varanasi Coverage Zone</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">{tech.locality} ({tech.pincode})</span>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tech.locality + ", " + tech.pincode + ", Varanasi")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-[10px] font-extrabold hover:underline flex items-center gap-1 cursor-pointer"
                        title="View on Google Maps"
                      >
                        <MapPin className="w-3 h-3 text-blue-500" />
                        <span>Map</span>
                      </a>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold">Years of Field Experience</span>
                    <span className="font-bold text-slate-900 dark:text-white">8+ Years Experience</span>
                  </div>

                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-500 dark:text-slate-400 font-semibold">Registered Vehicle</span>
                    <span className="font-bold text-slate-900 dark:text-white">Hero Electric Scooter (UP 65 AB 4910)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (5 Cols) - Guarantor Details & Performance Note */}
            <div className="lg:col-span-5 space-y-6">
              {/* Guarantor Audit Card */}
              <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Guarantor Person Details</h3>
                        <p className="text-[11px] text-slate-400">Verified Emergency & Financial Guarantor</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950 px-2.5 py-1 rounded-xl border border-purple-200">
                      Verified
                    </span>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 font-semibold">Guarantor Name</span>
                      <span className="font-extrabold text-slate-900 dark:text-white">Suresh Chandra Yadav</span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 font-semibold">Relation to Partner</span>
                      <span className="font-bold text-slate-900 dark:text-white">Father</span>
                    </div>

                    <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 font-semibold">Guarantor Mobile Phone</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white">+91 94152 88219</span>
                    </div>

                    <div className="flex justify-between items-center py-2">
                      <span className="text-slate-500 font-semibold">Guarantor Address</span>
                      <span className="font-bold text-slate-900 dark:text-white">Sigra, Varanasi (221002)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Special Partner Performance Note */}
             
            </div>
          </div>

          {/* 4. POLICE CLEARANCE DETAILS (THEN FOURTH) */}
          <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Police Clearance & Safety Audit</h3>
                  <p className="text-[11px] text-slate-400">Verified Police Thana Clearance Certificate</p>
                </div>
              </div>
              <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-xl border border-emerald-200 dark:border-emerald-800">
                PCC Passed
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-1">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-slate-400 font-semibold block text-[10px]">Local Police Station</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">Sigra Police Station, Varanasi</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-slate-400 font-semibold block text-[10px]">PCC Token Number</span>
                <span className="font-mono font-extrabold text-brand-600 dark:text-brand-400 text-sm">PCC-VAR-2026-8819</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                <span className="text-slate-400 font-semibold block text-[10px]">Bonded Customer Insurance</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">₹5,00,000 Safety Cover Active</span>
              </div>
            </div>
          </div>

          {/* 5. IDENTITY, GUARANTOR & POLICE NOC AND REGISTERED BANK ACCOUNT (THEN FIFTH AT BOTTOM) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* Identity, Guarantor & Police Verification Details Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                        Verified Onboarding Specs
                      </span>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                        Identity, Guarantor & Police NOC
                      </h3>
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 text-[10px] font-extrabold border border-emerald-200">
                    KYC Verified
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold">Biometric Aadhaar</span>
                    <span className="font-mono font-extrabold text-slate-900 dark:text-white">UID: XXXX-XXXX-1102</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold">Emergency Guarantor</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">Suresh Yadav (+91 94150 00000)</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold">Local Police Clearance</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">Sigra Thana NOC Verified</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowKycDrawer(true)}
                  className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Manage Verification Details</span>
                </button>
              </div>
            </div>

            {/* Registered Bank Account Summary Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                      <Building className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">
                        Verified Payout Details
                      </span>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                        Registered Bank Account
                      </h3>
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 text-[10px] font-extrabold border border-emerald-200">
                    Verified Active
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold">Registered Bank</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">HDFC Bank (Sigra Branch)</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold">Account Number</span>
                    <span className="font-mono font-extrabold text-slate-900 dark:text-white">•••• •••• 8120</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold">Weekly Payout Mode</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">IMPS / NEFT Auto-Credit</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowManageBankDrawer(true)}
                  className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Manage Bank Details</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowManualPayoutModal(true)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Process Settlement</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: COMPLETED & ACTIVE JOBS (WITH LIVE PIPELINE CARD & DATATABLE) ─── */}
      {activeTab === "jobs" && (
        <div className="space-y-6">
          {/* 🚀 LIVE ACTIVE JOB PIPELINE CARD */}
          {activeJob && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 relative overflow-hidden">
              {/* Decorative Ambient Glow */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/5 dark:bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Header & Live Indicator */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-slate-900 dark:text-white text-base sm:text-lg tracking-tight">
                        Live Ongoing Job Pipeline
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/40 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                        <Activity className="w-3 h-3 animate-pulse" />
                        <span>Partner Active Now</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                      Partner is currently assigned and working on booking <strong className="text-brand-600 dark:text-brand-400">#{activeJob.id}</strong>
                    </p>
                  </div>
                </div>

                {/* Booked Time & Slot Tag */}
                <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-white/10 px-4 py-2 rounded-2xl border border-slate-200 dark:border-white/15 text-xs font-mono font-bold shrink-0">
                  <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0" />
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 text-[10px] block font-sans">Time Booked & Slot</span>
                    <span className="text-slate-900 dark:text-white">{activeJob.bookedTime} ({activeJob.bookedSlot})</span>
                  </div>
                </div>
              </div>

              {/* Job & Customer Details Summary */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-extrabold block">Service Package</span>
                  <h4 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm mt-0.5">{activeJob.serviceTitle}</h4>
                  <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-md bg-brand-50 text-brand-700 dark:bg-brand-500/30 dark:text-brand-200 border border-brand-200 dark:border-brand-500/40 text-[10px] font-mono font-bold">
                    Gross Bill: ₹{activeJob.totalAmount} • Partner Share: ₹{activeJob.netShare}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-extrabold block">Customer Contact</span>
                  <p className="font-extrabold text-slate-900 dark:text-white text-xs mt-0.5">{activeJob.customerName}</p>
                  <a href={`tel:${activeJob.customerPhone}`} className="text-xs font-mono text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" /> {maskPhoneNumber(activeJob.customerPhone)}
                  </a>
                </div>

                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-extrabold block">Job Location</span>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <span>{activeJob.locality}</span>
                    </p>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activeJob.locality + ", Varanasi")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-extrabold flex items-center gap-1 cursor-pointer shadow-xs"
                      title="Navigate to Job Location on Google Maps"
                    >
                      <Navigation className="w-3 h-3" />
                      <span>Navigate Map</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* 📍 LIVE PIPELINE STAGE TRACKER (Track Line Perfectly Centered at top-[18px]) */}
              <div className="pt-2 relative z-10 space-y-4">
                <div className="flex items-center justify-between text-xs font-extrabold">
                  <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    <span>Current Pipeline Stage:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-black underline underline-offset-4">
                      {activeJob.stages[activeJob.currentStage].label} ({activeJob.stages[activeJob.currentStage].time})
                    </span>
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                    Stage {activeJob.currentStage + 1} of {activeJob.stages.length}
                  </span>
                </div>

                {/* Pipeline Visual Tracker Container */}
                <div className="space-y-3 pt-1">
                  {/* Circle Nodes & Connecting Line Row (Fixed Height h-10 = 40px) */}
                  <div className="relative flex items-center justify-between h-10 px-5">
                    {/* Background Track Line - Perfectly centered vertically at 50% of 40px circle height */}
                    <div className="absolute top-1/2 left-5 right-5 h-1.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 rounded-full" />
                    {/* Active Progress Line */}
                    <div
                      className="absolute top-1/2 left-5 h-1.5 bg-gradient-to-r from-brand-500 via-emerald-400 to-emerald-500 -translate-y-1/2 rounded-full transition-all duration-500"
                      style={{ width: `${(activeJob.currentStage / (activeJob.stages.length - 1)) * 90}%` }}
                    />

                    {/* Circle Nodes */}
                    {activeJob.stages.map((stage, index) => {
                      const isCompleted = index < activeJob.currentStage;
                      const isCurrent = index === activeJob.currentStage;
                      const IconComp = stage.icon;

                      return (
                        <div
                          key={stage.id}
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 z-10 shrink-0 ${
                            isCompleted
                              ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/30 scale-100"
                              : isCurrent
                              ? "bg-gradient-to-r from-amber-400 to-emerald-400 text-slate-950 font-black shadow-lg shadow-emerald-400/40 ring-4 ring-emerald-400/30 scale-110 animate-pulse"
                              : "bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-slate-700 shadow-xs"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <IconComp className="w-4.5 h-4.5" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Stage Labels Row (Positioned below circle row) */}
                  <div className="flex justify-between items-start">
                    {activeJob.stages.map((stage, index) => {
                      const isCompleted = index < activeJob.currentStage;
                      const isCurrent = index === activeJob.currentStage;

                      return (
                        <div key={stage.id} className="text-center space-y-0.5 w-24 shrink-0">
                          <span
                            className={`block text-[11px] font-extrabold leading-tight ${
                              isCurrent
                                ? "text-emerald-600 dark:text-emerald-300 font-black"
                                : isCompleted
                                ? "text-slate-800 dark:text-slate-200"
                                : "text-slate-400 dark:text-slate-500"
                            }`}
                          >
                            {stage.label}
                          </span>
                          <span className="block text-[9px] font-mono text-slate-500 dark:text-slate-400 font-bold">
                            {stage.time}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Quick Actions Footer */}
              <div className="pt-3 border-t border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 relative z-10">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Real-time GPS Tracking & Partner Verification Active</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <Link
                    href={`/bookings/${activeJob.id}`}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-700 dark:text-white font-extrabold text-xs transition-all border border-slate-200 dark:border-white/15 flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5 text-brand-600 dark:text-brand-300" />
                    <span>View Booking Details</span>
                  </Link>
                  <a
                    href={`tel:${activeJob.customerPhone}`}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Customer</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
              <span className="text-slate-400 font-extrabold uppercase text-[10px]">Lifetime Jobs Completed</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {tech.totalJobs} Jobs
              </div>
              <span className="text-[11px] text-emerald-600 font-bold">100% Verified OTP Closed</span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
              <span className="text-slate-400 font-extrabold uppercase text-[10px]">Average Job Rating</span>
              <div className="text-2xl font-black text-amber-500 font-mono flex items-center gap-1.5">
                <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
                <span>{tech.rating} / 5.0</span>
              </div>
              <span className="text-[11px] text-slate-500 font-semibold">Based on customer feedback</span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
              <span className="text-slate-400 font-extrabold uppercase text-[10px]">Gross Revenue Serviced</span>
              <div className="text-2xl font-black text-brand-600 dark:text-brand-400 font-mono">
                ₹{tech.totalEarnings.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-500 font-semibold">Total Billings Handled</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-brand-600" />
                <span>Completed Jobs History</span>
              </h3>
            </div>

            <DataTable
              columns={jobColumns}
              data={partnerJobs}
              searchPlaceholder="Search completed jobs by ID, customer, service, locality..."
              statusField="status"
            />
          </div>
        </div>
      )}

      {/* ─── TAB 4: EARNINGS & WEEKLY SETTLEMENT (WITH PAGINATED DATATABLE) ─── */}
      {activeTab === "earnings" && (
        <div className="space-y-6">
          {/* Top Settlement KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
              <span className="text-slate-400 font-extrabold uppercase text-[10px]">Gross Service Revenue</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                ₹{tech.totalEarnings.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-500 font-semibold">100% Customer Paid</span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
              <span className="text-slate-400 font-extrabold uppercase text-[10px]">HelpMate Platform Fee (25%)</span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                ₹{tech.commissionPaid.toLocaleString()}
              </div>
              <span className="text-[11px] text-emerald-600 font-bold">Auto Deducted</span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
              <span className="text-slate-400 font-extrabold uppercase text-[10px]">Net Settled Payouts</span>
              <div className="text-2xl font-black text-brand-600 dark:text-brand-400 font-mono">
                ₹{(tech.totalEarnings - tech.commissionPaid).toLocaleString()}
              </div>
              <span className="text-[11px] text-brand-600 font-bold">Credited to Bank</span>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
              <span className="text-slate-400 font-extrabold uppercase text-[10px]">Pending Weekly Payout</span>
              <div className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
                ₹{tech.pendingPayout.toLocaleString()}
              </div>
              <span className="text-[11px] text-purple-600 font-bold">Due Next Monday</span>
            </div>
          </div>

          
          {/* WEEKLY SETTLEMENT PAYOUT LEDGER TABLE (WITH PAGINATED DATATABLE) */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Weekly Settlement Payout Ledger
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <DateRangePicker
                  startDate={settlementStartDate}
                  endDate={settlementEndDate}
                  onDateChange={(start, end) => {
                    setSettlementStartDate(start);
                    setSettlementEndDate(end);
                  }}
                  align="right"
                />
                <button
                  type="button"
                  onClick={() => setShowManualPayoutModal(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 font-extrabold text-xs border border-amber-300 dark:border-amber-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                  <span>Process Manual Settlement</span>
                </button>
              </div>
            </div>

            <DataTable
              columns={settlementColumns}
              data={weeklySettlements.filter((s) =>
                checkDateInRange(s.date, settlementStartDate, settlementEndDate)
              )}
              searchPlaceholder="Search weekly settlements by ID, cycle, bank UTR..."
              statusField="status"
            />
          </div>
        </div>
      )}

      {/* PROCESS MANUAL SETTLEMENT SLIDING DRAWER */}
      {showManualPayoutModal && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex justify-end outline-none">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowManualPayoutModal(false);
                setToasts((prev) => [
                  ...prev,
                  {
                    id: Date.now().toString(),
                    type: "success",
                    title: "Manual Settlement Processed Successfully!",
                    message: `₹${tech.pendingPayout.toLocaleString()} transferred to ${tech.name} • UTR: ${utrNumberInput}`,
                  },
                ]);
              }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full p-6 space-y-5 overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-300 outline-none text-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-200 shrink-0">
                    {tech.avatar ? (
                      <Image
                        src={tech.avatar}
                        alt={tech.name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                      Process Manual Settlement: {tech.name}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {tech.role} • {tech.locality}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowManualPayoutModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Earnings Breakdown Box */}
              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-2">
                <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                  <span>Gross Job Volume (100%)</span>
                  <span>₹{(Math.round(tech.pendingPayout / 0.75)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400">
                  <span>Helpmate Platform Share (25%)</span>
                  <span>-₹{(Math.round((tech.pendingPayout / 0.75) * 0.25)).toLocaleString()}</span>
                </div>
                <div className="border-t border-amber-200 dark:border-amber-800 pt-2 flex justify-between font-extrabold text-sm text-slate-900 dark:text-white">
                  <span>Net Payable Amount (75%)</span>
                  <span className="text-amber-600 dark:text-amber-400 text-base">
                    ₹{tech.pendingPayout.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="space-y-3">
                <div>
                  <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                    Manual Payout Method *
                  </label>
                  <select
                    value={payoutMethod}
                    onChange={(e) => setPayoutMethod(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-extrabold outline-none focus:border-brand-500 cursor-pointer"
                  >
                    <option value="Manual Bank Transfer (IMPS / NEFT)">Manual Bank Transfer (IMPS / NEFT)</option>
                    <option value="Manual UPI Transfer">Manual UPI Transfer</option>
                    <option value="Manual Cash Payout">Manual Cash Payout</option>
                    <option value="Direct Bank Deposit">Direct Bank Deposit (Manual)</option>
                  </select>
                </div>

                <div>
                  <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                    Bank UTR / Transaction Reference Number *
                  </label>
                  <input
                    type="text"
                    value={utrNumberInput}
                    onChange={(e) => setUtrNumberInput(e.target.value)}
                    placeholder="e.g. UTR-VAR-2026-98124018"
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-extrabold outline-none focus:border-brand-500"
                    required
                  />
                </div>

                <div>
                  <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                    Upload Manual Payment Receipt (PDF / Image) *
                  </label>
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Upload className="w-4 h-4 text-brand-600" />
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {proofUploaded ? "Manual_Payout_Receipt_UTR.pdf" : "Choose File"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">Bank Transfer Slip / Payment Screenshot</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProofUploaded(true)}
                      className="px-3.5 py-1.5 rounded-lg bg-brand-600 text-white font-extrabold text-xs cursor-pointer"
                    >
                      {proofUploaded ? "Uploaded" : "Browse"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualPayoutModal(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold shadow-lux cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <FileCheck className="w-4 h-4" />
                  Mark Manually Settled
                </button>
              </div>
            </form>
          </div>
        </Portal>
      )}


      {/* MANAGE & VIEW REGISTERED BANK DETAILS DRAWER */}
      {showManageBankDrawer && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex justify-end outline-none">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full p-6 space-y-5 overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-300 outline-none text-xs flex flex-col justify-between">
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                      <Building className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                        Registered Bank Details
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">{tech.name} • {tech.role}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowManageBankDrawer(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Status Badge Box */}
                <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500 text-white">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-900 dark:text-white block text-xs">
                      Penny-Drop Bank Account Verified
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">Active for IMPS / NEFT Weekly Payouts</span>
                  </div>
                </div>

                {/* Full Specs List */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3.5">
                  <div className="border-b border-slate-200 dark:border-slate-700 pb-2.5">
                    <span className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wider block">Account Holder Name</span>
                    <span className="font-extrabold text-slate-900 dark:text-white text-sm">{tech.bankAccountName || tech.name}</span>
                  </div>
                  <div className="border-b border-slate-200 dark:border-slate-700 pb-2.5">
                    <span className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wider block">Bank Name & Branch</span>
                    <span className="font-bold text-slate-900 dark:text-white text-xs">HDFC Bank (Sigra Branch, Varanasi)</span>
                  </div>
                  <div className="border-b border-slate-200 dark:border-slate-700 pb-2.5">
                    <span className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wider block">Bank Account Number</span>
                    <span className="font-mono font-black text-slate-900 dark:text-white text-sm tracking-wide">{tech.bankAccountNumber || "9820-1049-8120"}</span>
                  </div>
                  <div className="border-b border-slate-200 dark:border-slate-700 pb-2.5">
                    <span className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wider block">IFSC Code</span>
                    <span className="font-mono font-extrabold text-slate-900 dark:text-white text-xs">{tech.ifscCode || "SBIN0001240"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wider block">Registered UPI ID</span>
                    <span className="font-mono font-bold text-brand-600 dark:text-brand-400 text-xs">{tech.upiId || `${tech.name.toLowerCase().replace(/\s+/g, ".")}@okaxis`}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowManageBankDrawer(false)}
                  className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-md cursor-pointer transition-all"
                >
                  Done / Close Bank Details
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* MANAGE & VIEW IDENTITY, GUARANTOR & POLICE NOC DRAWER */}
      {showKycDrawer && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex justify-end outline-none">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full p-6 space-y-5 overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-300 outline-none text-xs flex flex-col justify-between">
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                        Identity, Guarantor & Police Verification
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">Partner: {tech.name}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowKycDrawer(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Status Badge Box */}
                <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500 text-white">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-900 dark:text-white block text-xs">
                      100% Onboarding Verification Complete
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">UIDAI Aadhaar, Guarantor Contact & Police Thana Clean</span>
                  </div>
                </div>

                {/* 3 Detailed Cards */}
                <div className="space-y-4">
                  {/* Aadhaar Spec */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-brand-600" /> Biometric Aadhaar Identity
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 text-[10px] font-extrabold border border-emerald-200">Verified</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 font-mono font-bold">UID Token: XXXX-XXXX-1102</p>
                    <p className="text-[11px] text-slate-500 font-medium">Full Name on Aadhaar: {tech.name}</p>
                    <button
                      type="button"
                      onClick={() => alert("Viewing Partner Aadhaar Card PDF Document")}
                      className="w-full py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-extrabold cursor-pointer transition-all"
                    >
                      View Aadhaar Document PDF
                    </button>
                  </div>

                  {/* Guarantor Details Spec */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <User className="w-4 h-4 text-purple-600" /> Emergency Guarantor Person
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 text-[10px] font-extrabold border border-purple-200">Father/Brother</span>
                    </div>
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white">Guarantor Name: Suresh Yadav</p>
                    <p className="text-[11px] text-slate-500 font-semibold">Phone: +91 94150 00000 • Email: suresh.yadav@gmail.com</p>
                    <p className="text-[11px] text-slate-500 font-medium">Residential Address: Sigra, Varanasi, UP</p>
                    <button
                      type="button"
                      onClick={() => alert("Viewing Guarantor Aadhaar & Address Proof")}
                      className="w-full py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold cursor-pointer transition-all"
                    >
                      View Guarantor Aadhaar & Address Proof
                    </button>
                  </div>

                  {/* Police Clearance Spec */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                        <FileCheck className="w-4 h-4 text-emerald-600" /> Local Police Thana Clearance
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 text-[10px] font-extrabold border border-emerald-200">Clean Record</span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Police Station: Sigra Police Station, Varanasi</p>
                    <p className="text-[11px] text-slate-500 font-mono font-bold">NOC Token: UP-VAR-POL-2026-9812</p>
                    <button
                      type="button"
                      onClick={() => alert("Viewing Police Thana Clearance Certificate NOC")}
                      className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold cursor-pointer transition-all"
                    >
                      View Police Clearance Certificate NOC
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowKycDrawer(false)}
                  className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-md cursor-pointer transition-all"
                >
                  Done / Close Verification Details
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* GLOBAL TOAST NOTIFICATIONS */}
      <ToastContainer
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />
    </div>
  );
}
