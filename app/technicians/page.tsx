"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { DataTable, Column } from "@/components/DataTable";
import { RowActionMenu } from "@/components/RowActionMenu";
import { initialTechnicians, Technician } from "@/lib/mockData";
import { getPartnersApi, ApiPartner, formatImageUrl } from "@/lib/api";
import {
  Star,
  CheckCircle2,
  MapPin,
  Upload,
  FileCheck,
  X,
  Plus,
  Eye,
  Edit,
  Trash2,
  Users,
  ShieldCheck,
  Wallet,
  TrendingUp,
  Activity,
  Award,
  Clock,
  ShieldAlert,
  User,
  Briefcase,
  Building,
  Wrench,
  Navigation,
  XCircle,
  UserCheck,
  Send,
  DollarSign,
  Percent,
} from "lucide-react";
import { Portal } from "@/components/Portal";
import { ToastContainer, ToastMessage } from "@/components/Toast";
import { DateRangePicker } from "@/components/DateRangePicker";
import { PartnerMapView } from "@/components/PartnerMapView";

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

function mapApiPartnerToTechnician(item: any): Technician {
  const pincodeObj = Array.isArray(item.servicePincodes) && item.servicePincodes.length > 0 ? item.servicePincodes[0] : null;
  const serviceActionObj = Array.isArray(item.serviceActions) && item.serviceActions.length > 0 ? item.serviceActions[0] : null;

  const localityName = item.locality || (typeof pincodeObj === "object" ? pincodeObj?.localityName : "") || "Sigra";
  const pincodeStr = item.pincode || (typeof pincodeObj === "object" ? pincodeObj?.pincode : "") || "221002";

  let categoryName = item.category || "";
  if (!categoryName && Array.isArray(item.serviceActions) && item.serviceActions.length > 0) {
    const actNames = item.serviceActions
      .map((sa: any) => (typeof sa === "object" ? sa.serviceAction || sa.name : sa))
      .filter(Boolean);
    if (actNames.length > 0) {
      categoryName = actNames.join(", ");
    }
  }
  if (!categoryName) categoryName = "General Maintenance";

  const aadhaarNum = item.kyc?.aadhaarNumber;
  const isAadhaarVerified = !!(aadhaarNum || item.aadhaarVerified);
  const isPoliceVerified = item.policeVerified !== undefined ? item.policeVerified : (item.onboardingStatus === "active" || item.status === "active");

  const rawAvatar =
    item.kyc?.passportPhotoUrl ||
    item.kyc?.passportPhoto ||
    item.profilePhoto ||
    item.profileImage ||
    item.avatar ||
    item.image ||
    (item._id ? `/api/media/partner/${item._id}/passport-photo` : "");

  const formattedAvatar = formatImageUrl(rawAvatar);
  const finalAvatar =
    formattedAvatar ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(item.name || "Partner")}`;

  return {
    id: item._id || item.partnerId || "",
    name: item.name || "Partner",
    avatar: finalAvatar,
    role: item.designation || "Technician",
    category: categoryName,
    locality: localityName,
    pincode: pincodeStr,
    phone: item.mobile || item.phone || "",
    rating: item.rating || 4.9,
    totalJobs: item.totalJobs || 0,
    aadhaarVerified: isAadhaarVerified,
    policeVerified: isPoliceVerified,
    bondedInsurance: true,
    status: item.status === "active" ? (item.isAvailable !== false ? "Available" : "Offline") : "Absent",
    joiningDate: item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "2026",
    lastCompletedJob: item.lastCompletedJob,
    totalEarnings: item.totalEarnings || 0,
    commissionPaid: item.commissionPaid || 0,
    pendingPayout: item.pendingPayout || 0,
    lastPayoutDate: item.lastPayoutDate || "14 Aug 2026",
    payoutProofUrl: item.payoutProofUrl,
    bankAccountName: item.bankDetails?.accountName || item.bankAccountName || item.name,
    bankAccountNumber: item.bankDetails?.accountNumber || item.bankAccountNumber || "",
    ifscCode: item.bankDetails?.ifscCode || item.ifscCode || "",
    upiId: item.bankDetails?.upiId || item.upiId || "",
  };
}

function TableShimmerRows() {
  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm animate-pulse">
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-72" />
        <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl w-32" />
      </div>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-200 dark:bg-slate-800 shrink-0" />
            <div className="space-y-1.5">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-36" />
              <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded-md w-24" />
            </div>
          </div>
          <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-md w-20" />
          <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-md w-24" />
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-16" />
        </div>
      ))}
    </div>
  );
}

import { getStoredModuleData, setCachedModuleData, isModuleCacheFresh } from "@/lib/moduleCache";

export default function TechniciansPage() {
  const initialCached = getStoredModuleData<Technician[]>("technicians");
  const [techs, setTechs] = useState<Technician[]>(() => initialCached || []);
  const [isLoadingApi, setIsLoadingApi] = useState<boolean>(
    () => !(isModuleCacheFresh("technicians") && initialCached && initialCached.length > 0)
  );
  const [activeTab, setActiveTab] = useState<"partner" | "map" | "settlement">("partner");
  const [settlementStartDate, setSettlementStartDate] = useState<string>("");
  const [settlementEndDate, setSettlementEndDate] = useState<string>("");
  const [proofTech, setProofTech] = useState<Technician | null>(null);
  const [commissionRate, setCommissionRate] = useState<number>(25);
  const [gstRate, setGstRate] = useState<number>(18);
  const [proofUrl, setProofUrl] = useState("");
  const [isAddPartnerOpen, setIsAddPartnerOpen] = useState(false);

  const fetchPartners = useCallback(async (force: boolean = false) => {
    if (!force && isModuleCacheFresh("technicians")) {
      const cached = getStoredModuleData<Technician[]>("technicians");
      if (cached && cached.length > 0) {
        setTechs(cached);
        setIsLoadingApi(false);
        return;
      }
    }
    if (techs.length === 0 && (!initialCached || initialCached.length === 0)) {
      setIsLoadingApi(true);
    }
    try {
      const res = await getPartnersApi();
      if (res && res.success !== false && Array.isArray(res.data)) {
        const mapped = res.data.map(mapApiPartnerToTechnician);
        setTechs(mapped);
        setCachedModuleData("technicians", mapped);
      }
    } catch (err) {
      console.error("Failed to fetch partners:", err);
    } finally {
      setIsLoadingApi(false);
    }
  }, [techs.length, initialCached]);

  useEffect(() => {
    if (isModuleCacheFresh("technicians") && initialCached && initialCached.length > 0) {
      setIsLoadingApi(false);
      return;
    }
    fetchPartners();
  }, [fetchPartners, initialCached]);

  // Full Partner Onboarding Form States (Aadhaar, Guarantor, Police Thana)
  const [partnerName, setPartnerName] = useState("");
  const [partnerPhone, setPartnerPhone] = useState("");
  const [partnerPhoneVerified, setPartnerPhoneVerified] = useState(false);
  const [partnerEmail, setPartnerEmail] = useState("");
  const [partnerEmailVerified, setPartnerEmailVerified] = useState(false);
  const [partnerAvatar, setPartnerAvatar] = useState("");
  const [partnerCategory, setPartnerCategory] = useState("AC Servicing & Repair");
  const [partnerLocality, setPartnerLocality] = useState("Sigra");
  const [partnerAadhaar, setPartnerAadhaar] = useState("");
  const [partnerAadhaarDoc, setPartnerAadhaarDoc] = useState("");
  const [partnerGuarantorName, setPartnerGuarantorName] = useState("");
  const [partnerGuarantorPhone, setPartnerGuarantorPhone] = useState("");
  const [guarantorPhoneVerified, setGuarantorPhoneVerified] = useState(false);
  const [partnerGuarantorEmail, setPartnerGuarantorEmail] = useState("");
  const [guarantorEmailVerified, setGuarantorEmailVerified] = useState(false);
  const [partnerGuarantorAddress, setPartnerGuarantorAddress] = useState("");
  const [partnerGuarantorAadhaar, setPartnerGuarantorAadhaar] = useState("");
  const [partnerGuarantorAadhaarDoc, setPartnerGuarantorAadhaarDoc] = useState("");
  const [partnerPoliceStatus, setPartnerPoliceStatus] = useState<
    "Pending Verification" | "Verified Clean" | "Submitted to Local Thana" | "Exempted"
  >("Verified Clean");
  const [partnerPoliceStation, setPartnerPoliceStation] = useState("Sigra Police Station");
  const [partnerPoliceToken, setPartnerPoliceToken] = useState("");
  const [partnerPoliceDoc, setPartnerPoliceDoc] = useState("");

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          setter(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const [viewTech, setViewTech] = useState<Technician | null>(null);
  const [detailTab, setDetailTab] = useState<"overview" | "kyc" | "jobs" | "earnings">("overview");
  const [editTech, setEditTech] = useState<Technician | null>(null);
  const [deleteTech, setDeleteTech] = useState<Technician | null>(null);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const handleUploadProof = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofTech) return;

    const targetTech = proofTech;
    const payoutAmt = targetTech.pendingPayout;

    const updated = techs.map((t) => {
      if (t.id === targetTech.id) {
        return {
          ...t,
          payoutProofUrl: proofUrl || "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=300&auto=format&fit=crop&q=80",
          pendingPayout: 0,
          lastPayoutDate: "Just Now (Manual)",
        };
      }
      return t;
    });
    setTechs(updated);
    setProofTech(null);

    setToasts((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type: "success",
        title: "Manual Settlement Processed Successfully!",
        message: `₹${payoutAmt.toLocaleString()} transferred to ${targetTech.name} • Receipt Uploaded`,
      },
    ]);
  };

  const partnerColumns: Column<Technician>[] = [
    {
      key: "name",
      header: "Partner & Role",
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 shrink-0 rounded-xl overflow-hidden border border-slate-200 shadow-xs">
            {row.avatar ? (
              <Image
                src={row.avatar}
                alt={row.name}
                fill
                unoptimized
                className="object-cover"
              />
            ) : null}
          </div>
          <Link href={`/technicians/${row.id}`} className="flex flex-col hover:underline">
            <span className="font-semibold text-slate-900 dark:text-white text-xs">{row.name}</span>
            <span className="text-[10px] text-slate-400 font-medium">{row.role}</span>
          </Link>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category & Zone",
      accessor: (row) => (
        <div className="flex flex-col">
          <span className="font-medium text-brand-600 text-xs">
            {row.category}
          </span>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(row.locality + ", " + row.pincode + ", Varanasi")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 font-medium flex items-center gap-1 group/map"
            title="Open Zone in Google Maps"
          >
            <MapPin className="w-3 h-3 text-slate-400 group-hover/map:text-blue-500" />
            <span>{row.locality} ({row.pincode})</span>
          </a>
        </div>
      ),
    },
    {
      key: "kyc",
      header: "Biometric KYC Check",
      accessor: (row) => (
        <div className="flex items-center gap-1.5">
          <span
            className={`px-2 py-0.5 rounded text-[9px] font-medium ${
              row.aadhaarVerified ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
            }`}
          >
            Aadhaar: {row.aadhaarVerified ? "Pass" : "Fail"}
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[9px] font-medium ${
              row.policeVerified ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
            }`}
          >
            Police Clearance: {row.policeVerified ? "Pass" : "Pending"}
          </span>
        </div>
      ),
    },
    {
      key: "rating",
      header: "Rating",
      accessor: (row) => (
        <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1 text-xs">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {row.rating}
        </span>
      ),
    },
    {
      key: "totalJobs",
      header: "Jobs",
      accessor: (row) => (
        <span className="font-semibold text-slate-900 dark:text-white text-xs font-mono">
          {row.totalJobs || 0} Jobs
        </span>
      ),
    },
    {
      key: "status",
      header: "Duty Status",
      accessor: (row) => {
        let badgeClass = "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
        let IconComp = CheckCircle2;

        if (row.status === "Working" || row.status === "On Job") {
          badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800";
          IconComp = Wrench;
        } else if (row.status === "In Transit") {
          badgeClass = "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800";
          IconComp = Navigation;
        } else if (row.status === "Absent" || row.status === "Offline") {
          badgeClass = "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800";
          IconComp = XCircle;
        } else if (row.status === "Available" || row.status === "Approved") {
          badgeClass = "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800";
          IconComp = CheckCircle2;
        }

        return (
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium border flex items-center gap-1 w-fit ${badgeClass}`}>
            <IconComp className="w-3 h-3" /> {row.status}
          </span>
        );
      },
    },
    {
      key: "id",
      header: "Actions",
      sticky: "right",
      accessor: (row) => (
        <RowActionMenu
          actions={[
            {
              label: "View Profile",
              icon: Eye,
              href: `/technicians/${row.id}`,
            },
            {
              label: "Open in Maps",
              icon: MapPin,
              onClick: () => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(row.locality + ", " + row.pincode + ", Varanasi")}`, '_blank'),
            },
            {
              label: "Edit",
              icon: Edit,
              href: `/technicians/new?id=${row.id}`,
            },
            {
              label: "Delete",
              icon: Trash2,
              onClick: () => setDeleteTech(row),
              danger: true,
            },
          ]}
        />
      ),
    },
  ];

  const commissionColumns: Column<Technician>[] = [
    {
      key: "name",
      header: "Partner & Category",
      accessor: (row) => (
        <Link
          href={`/settlements/${row.id}`}
          className="flex items-center gap-2.5 group cursor-pointer"
        >
          <div className="relative w-8 h-8 shrink-0 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
            {row.avatar ? (
              <Image
                src={row.avatar}
                alt={row.name}
                fill
                unoptimized
                className="object-cover"
              />
            ) : null}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors">{row.name}</span>
            <span className="text-[10px] text-slate-400 font-medium">{row.category} ({row.locality})</span>
          </div>
        </Link>
      ),
      sortable: true,
    },
    {
      key: "lastPayoutDate",
      header: "Settlement Cycle Date",
      accessor: (row) => (
        <div className="flex flex-col">
          <span className="font-mono font-medium text-slate-900 dark:text-white text-xs">
            {row.lastPayoutDate || "14 Aug 2026"}
          </span>
          <span className="text-[10px] text-amber-600 font-medium">Weekly Cycle Payout</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "totalEarnings",
      header: "Gross Revenue (100%)",
      accessor: (row) => (
        <span className="font-semibold text-slate-900 dark:text-white">
          ₹{row.totalEarnings.toLocaleString()}
        </span>
      ),
      sortable: true,
    },
    {
      key: "commissionPaid",
      header: "Helpmate Fee (25%)",
      accessor: (row) => (
        <span className="font-bold text-emerald-600 dark:text-emerald-400">
          ₹{row.commissionPaid.toLocaleString()}
        </span>
      ),
      sortable: true,
    },
    {
      key: "pendingPayout",
      header: "Net Payable (75%)",
      accessor: (row) => (
        <span className="font-black text-amber-600 dark:text-amber-400 text-sm">
          ₹{row.pendingPayout.toLocaleString()}
        </span>
      ),
      sortable: true,
    },
    {
      key: "payoutProofUrl",
      header: "Manual Settlement Action",
      accessor: (row) => (
        <div>
          {row.pendingPayout > 0 ? (
            <button
              onClick={() => setProofTech(row)}
              className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 font-extrabold text-xs border border-amber-300 dark:border-amber-800 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5 text-amber-600" /> Process Manual Settlement
            </button>
          ) : (
            <a
              href={row.payoutProofUrl || "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80"}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400 font-bold text-[11px] hover:underline flex items-center gap-1 w-fit border border-slate-200 dark:border-slate-700"
            >
              <FileCheck className="w-3.5 h-3.5 text-emerald-600" /> View UTR Proof
            </a>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      sticky: "right",
      accessor: (row) => (
        <RowActionMenu
          actions={[
            {
              label: "View",
              icon: Eye,
              href: `/settlements/${row.id}`,
            },
            {
              label: "Edit Settlement",
              icon: Edit,
              onClick: () => setProofTech(row),
            },
          ]}
        />
      ),
    },
  ];

  // Quick Partner Metrics Calculations
  const totalFleet = techs.length;
  const activeFleet = techs.filter((t) => t.status === "Available" || t.status === "Approved").length;
  const onJobFleet = techs.filter((t) => t.status === "On Job").length;
  const verifiedKycCount = techs.filter((t) => t.aadhaarVerified && t.policeVerified).length;
  const totalPendingSettlements = techs.reduce((sum, t) => sum + (t.pendingPayout || 0), 0);
  const avgFleetRating = (techs.reduce((sum, t) => sum + (t.rating || 4.9), 0) / (totalFleet || 1)).toFixed(2);

  if (viewTech) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Top Back Navigation Bar */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <button
            onClick={() => setViewTech(null)}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-extrabold flex items-center gap-2 transition-all shadow-xs"
          >
            ← Back to Partner Directory
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditTech(viewTech);
                setViewTech(null);
              }}
              className="px-4 py-2 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 border border-brand-200 dark:border-brand-800 text-xs font-bold flex items-center gap-1.5"
            >
              <Edit className="w-3.5 h-3.5" /> Edit Profile
            </button>
          </div>
        </div>

        {/* Executive Partner Header Profile Banner */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-brand-500 shadow-md shrink-0">
              {viewTech.avatar ? (
                <Image
                  src={viewTech.avatar}
                  alt={viewTech.name}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : null}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  {viewTech.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 text-[10px] font-bold border border-emerald-300 dark:border-emerald-800">
                  {viewTech.status}
                </span>
              </div>
              <p className="text-xs text-brand-600 dark:text-brand-400 font-bold mt-0.5">
                {viewTech.role} • {viewTech.category}
              </p>
              <p className="text-xs text-slate-500 font-semibold flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> {viewTech.locality} ({viewTech.pincode}) • Joined {viewTech.joiningDate || "2025"}
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-4 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-4 md:pt-0 md:pl-6 text-center">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Rating</span>
              <span className="text-lg font-black text-amber-500 flex items-center justify-center gap-1">
                <Star className="w-4 h-4 fill-amber-500 inline" /> {viewTech.rating}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Jobs</span>
              <span className="text-lg font-black text-slate-900 dark:text-white">
                {viewTech.totalJobs}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Gross Revenue</span>
              <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                ₹{viewTech.totalEarnings.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-bold">
          <button
            onClick={() => setDetailTab("overview")}
            className={`px-4 py-2 rounded-xl transition-all ${
              detailTab === "overview"
                ? "bg-brand-500 text-white shadow-lux"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            Overview & Biometric KYC
          </button>
          <button
            onClick={() => setDetailTab("kyc")}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              detailTab === "kyc"
                ? "bg-brand-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Identity & Guarantor Verification</span>
          </button>
          <button
            onClick={() => setDetailTab("jobs")}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              detailTab === "jobs"
                ? "bg-brand-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Completed Jobs ({viewTech.totalJobs})</span>
          </button>
          <button
            onClick={() => setDetailTab("earnings")}
            className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center gap-2 cursor-pointer ${
              detailTab === "earnings"
                ? "bg-brand-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Earnings & Weekly Settlement</span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW & BIOMETRIC KYC */}
        {detailTab === "overview" && (
          <div className="space-y-6">
            {/* Metric Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rating</span>
                <span className="text-xl font-black text-amber-500 font-mono">★ {viewTech.rating} / 5.0</span>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Completed Jobs</span>
                <span className="text-xl font-black text-brand-600 dark:text-brand-400 font-mono">{viewTech.totalJobs} Jobs</span>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gross Revenue</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">₹{viewTech.totalEarnings.toLocaleString()}</span>
              </div>
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Payout</span>
                <span className="text-xl font-black text-purple-600 dark:text-purple-400 font-mono">₹{viewTech.pendingPayout.toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-brand-600" />
                    <span className="font-extrabold text-slate-900 dark:text-white text-sm">Partner Specifications</span>
                  </div>
                  <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Biometric Verified</span>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                    <span className="text-slate-400 font-bold">Full Name</span>
                    <span className="font-extrabold text-slate-900 dark:text-white">{viewTech.name}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                    <span className="text-slate-400 font-bold">Mobile Phone</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{viewTech.phone}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                    <span className="text-slate-400 font-bold">Varanasi Base Locality</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white">{viewTech.locality} ({viewTech.pincode})</span>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(viewTech.locality + ", " + viewTech.pincode + ", Varanasi")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 font-extrabold text-[10px] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <MapPin className="w-3 h-3 text-blue-500" />
                        <span>Map</span>
                      </a>
                    </div>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                    <span className="text-slate-400 font-bold">Service Category</span>
                    <span className="font-extrabold text-brand-600">{viewTech.category}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400 font-bold">Partner Aadhaar No.</span>
                    <span className="font-mono font-extrabold text-slate-900 dark:text-white">7821-4920-1102</span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span className="font-extrabold text-slate-900 dark:text-white text-sm">Police Verification</span>
                  </div>
                  <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">PCC Passed</span>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                    <span className="text-slate-400 font-bold">Police Clearance (PCC)</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                      {viewTech.policeVerified ? "Verified Clean (PCC Issued)" : "Pending Verification"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                    <span className="text-slate-400 font-bold">Local Police Station</span>
                    <span className="font-bold text-slate-900 dark:text-white">Sigra Police Station</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/60">
                    <span className="text-slate-400 font-bold">PCC Token Number</span>
                    <span className="font-mono font-bold text-brand-600">PCC-VAR-2026-8819</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400 font-bold">Bonded Insurance</span>
                    <span className="font-extrabold text-emerald-600">₹5,00,000 Safety Cover</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: KYC & DOCUMENT ATTACHMENTS */}
        {detailTab === "kyc" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Partner Biometric Aadhaar Document
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Verified
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <FileCheck className="w-6 h-6 text-brand-600" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Partner_Aadhaar_Front_Back.pdf</span>
                    <span className="text-[10px] text-slate-400 font-mono">12-Digit: 7821-4920-1102</span>
                  </div>
                </div>
                <button type="button" className="px-3 py-1.5 rounded-xl bg-brand-600 text-white font-bold text-[11px]">View Document</button>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                  Guarantor Person Aadhaar Document
                </span>
                <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">
                  Guarantor Verified
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <FileCheck className="w-6 h-6 text-purple-600" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">Guarantor_Aadhaar_Record.pdf</span>
                    <span className="text-[10px] text-slate-400">Guarantor: Suresh Chandra Yadav</span>
                  </div>
                </div>
                <button type="button" className="px-3 py-1.5 rounded-xl bg-purple-600 text-white font-bold text-[11px]">View Document</button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: COMPLETED JOBS (MINIMUM 10 ENTRIES) */}
        {detailTab === "jobs" && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-brand-600" />
                <span>Completed Jobs History</span>
              </h3>
              <span className="px-3 py-1 rounded-full bg-brand-50 text-brand-600 text-xs font-extrabold">
                10 Completed Jobs Recorded
              </span>
            </div>
            <div className="space-y-3">
              {[
                { id: "BK-VAR-9981", title: `${viewTech.category} - Power Jet Wash & Gas Check`, customer: "Alok Verma (Sigra)", price: "₹1,999", share: "₹1,499", date: "Today, 11:30 AM" },
                { id: "BK-VAR-9975", title: `${viewTech.category} - Filter Cartridge & RO Sanitization`, customer: "Rajesh Agrawal (Sigra)", price: "₹1,499", share: "₹1,124", date: "08 Aug 2026" },
                { id: "BK-VAR-9968", title: `${viewTech.category} - Full Deep Hydro Wash`, customer: "Vikram Malhotra (Lanka)", price: "₹2,890", share: "₹2,168", date: "05 Aug 2026" },
                { id: "BK-VAR-9954", title: `${viewTech.category} - Commercial Unit Hydro Repair`, customer: "Siddharth Gupta (Cantonment)", price: "₹4,000", share: "₹3,000", date: "02 Aug 2026" },
                { id: "BK-VAR-9941", title: `${viewTech.category} - Inverter AC Gas Refilling (R32)`, customer: "Sunita Agrawal (Assi Ghat)", price: "₹2,500", share: "₹1,875", date: "29 Jul 2026" },
                { id: "BK-VAR-9932", title: `${viewTech.category} - Villa Deep Hydro Cleaning`, customer: "B.P. Srivastava (Lahurabir)", price: "₹5,500", share: "₹4,125", date: "26 Jul 2026" },
                { id: "BK-VAR-9920", title: `${viewTech.category} - Motor & Capacitor Replacement`, customer: "Amitabh Verma (Rathyatra)", price: "₹1,850", share: "₹1,388", date: "22 Jul 2026" },
                { id: "BK-VAR-9912", title: `${viewTech.category} - Degreasing & Filter Wash`, customer: "Priya Sharma (Bhelupur)", price: "₹1,299", share: "₹974", date: "18 Jul 2026" },
                { id: "BK-VAR-9899", title: `${viewTech.category} - Copper Pipe Welding & Leak Repair`, customer: "Ramesh Pandey (Godowlia)", price: "₹3,200", share: "₹2,400", date: "14 Jul 2026" },
                { id: "BK-VAR-9884", title: `${viewTech.category} - Heating Element Replacement`, customer: "Manoj Tripathi (Shivpur)", price: "₹1,650", share: "₹1,238", date: "10 Jul 2026" },
              ].map((job) => (
                <div key={job.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-brand-600 text-sm">#{job.id}</span>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">{job.title}</h4>
                    <p className="text-slate-500 font-semibold">Customer: {job.customer} • {job.date}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-emerald-600 text-base block">{job.share}</span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded inline-block mt-0.5">Completed</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: EARNINGS & SETTLEMENT (SIMPLIFIED BANK CARD WITH BANK NAME AND MANAGE BUTTON + 10 ROWS) */}
        {detailTab === "earnings" && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
              Partner Weekly Settlement & Commission Ledger
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border">
                <span className="text-slate-400 font-bold block uppercase text-[10px]">Gross Revenue</span>
                <span className="text-xl font-black text-slate-900 dark:text-white font-mono">₹{viewTech.totalEarnings.toLocaleString()}</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border">
                <span className="text-slate-400 font-bold block uppercase text-[10px]">HelpMate Comm. (25%)</span>
                <span className="text-xl font-black text-emerald-600 font-mono">₹{viewTech.commissionPaid.toLocaleString()}</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border">
                <span className="text-slate-400 font-bold block uppercase text-[10px]">Pending Weekly Payout</span>
                <span className="text-xl font-black text-purple-600 font-mono">₹{viewTech.pendingPayout.toLocaleString()}</span>
              </div>
            </div>

            {/* SIMPLIFIED BANK CARD SHOWING STRICTLY BANK NAME AND MANAGE BUTTON */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Building className="w-5 h-5 text-brand-600" />
                <div>
                  <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Payout Bank</span>
                  <span className="font-black text-slate-900 dark:text-white text-sm">HDFC Bank (Sigra Branch)</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => alert(`Manage Bank Account for ${viewTech.name}`)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-extrabold text-xs border border-slate-300 dark:border-slate-700 transition-colors"
              >
                Manage Bank Account
              </button>
            </div>

            {/* 10 WEEKLY SETTLEMENT ROWS */}
            <div className="space-y-2 text-xs pt-2">
              <span className="font-extrabold text-slate-900 dark:text-white block">Weekly Payout Cycles (10 Recorded)</span>
              {[
                { id: "SET-32", cycle: "01 Aug - 07 Aug 2026", net: "₹13,800", date: "08 Aug 2026" },
                { id: "SET-31", cycle: "25 Jul - 31 Jul 2026", net: "₹16,500", date: "01 Aug 2026" },
                { id: "SET-30", cycle: "18 Jul - 24 Jul 2026", net: "₹12,600", date: "25 Jul 2026" },
                { id: "SET-29", cycle: "11 Jul - 17 Jul 2026", net: "₹14,625", date: "18 Jul 2026" },
                { id: "SET-28", cycle: "04 Jul - 10 Jul 2026", net: "₹18,150", date: "11 Jul 2026" },
                { id: "SET-27", cycle: "27 Jun - 03 Jul 2026", net: "₹11,700", date: "04 Jul 2026" },
                { id: "SET-26", cycle: "20 Jun - 26 Jun 2026", net: "₹15,750", date: "27 Jun 2026" },
                { id: "SET-25", cycle: "13 Jun - 19 Jun 2026", net: "₹13,425", date: "20 Jun 2026" },
                { id: "SET-24", cycle: "06 Jun - 12 Jun 2026", net: "₹15,300", date: "13 Jun 2026" },
                { id: "SET-23", cycle: "30 May - 05 Jun 2026", net: "₹10,875", date: "06 Jun 2026" },
              ].map((s) => (
                <div key={s.id} className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-emerald-600">{s.id}</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Cycle: {s.cycle}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400">Paid: {s.date}</span>
                    <span className="font-mono font-black text-emerald-600">{s.net}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Simple Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-brand-600" />
            <span>Partners</span>
          </h1>
        </div>

        <Link
          href="/technicians/new"
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Partner</span>
        </Link>
      </div>

      {/* Tabs and Settlement Date Filter Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 w-fit text-xs font-bold shadow-xs">
          <button
            onClick={() => setActiveTab("partner")}
            className={`px-5 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "partner"
                ? "bg-white dark:bg-slate-900 text-brand-600 dark:text-white shadow-xs font-black"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Partner Directory ({techs.length})
          </button>
          <button
            onClick={() => setActiveTab("map")}
            className={`px-5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "map"
                ? "bg-white dark:bg-slate-900 text-brand-600 dark:text-white shadow-xs font-black"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <MapPin className="w-4 h-4 text-rose-500 animate-bounce" />
            <span>Live Varanasi Map</span>
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300">
              LIVE GPS
            </span>
          </button>
          <button
            onClick={() => setActiveTab("settlement")}
            className={`px-5 py-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "settlement"
                ? "bg-white dark:bg-slate-900 text-brand-600 dark:text-white shadow-xs font-black"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Settlement Ledger
          </button>
        </div>

        {activeTab === "settlement" && (
          <DateRangePicker
            startDate={settlementStartDate}
            endDate={settlementEndDate}
            onDateChange={(start, end) => {
              setSettlementStartDate(start);
              setSettlementEndDate(end);
            }}
            align="right"
          />
        )}
      </div>

      {activeTab === "map" ? (
        <PartnerMapView technicians={techs} />
      ) : activeTab === "partner" ? (
        <DataTable
          columns={partnerColumns}
          data={techs}
          searchPlaceholder="Search partner name, locality, or phone..."
          isLoading={isLoadingApi}
        />
      ) : (
        <DataTable
          columns={commissionColumns}
          data={techs.filter((t) =>
            checkDateInRange(t.lastPayoutDate || "14 Aug 2026", settlementStartDate, settlementEndDate)
          )}
          searchPlaceholder="Search partner name or category..."
          isLoading={isLoadingApi}
        />
      )}

      {/* PROCESS MANUAL SETTLEMENT DRAWER */}
      {proofTech && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex justify-end outline-none">
            <form
              onSubmit={handleUploadProof}
              className="w-full max-w-lg bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full p-6 space-y-5 overflow-y-auto shadow-2xl text-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-200 shrink-0">
                    {proofTech.avatar ? (
                      <Image
                        src={proofTech.avatar}
                        alt={proofTech.name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Process Manual Settlement
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">{proofTech.name} • {proofTech.role}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setProofTech(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Manage Commission & GST Controls */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                    <Percent className="w-4 h-4 text-brand-600" />
                    <span>Manage Commission & Partner GST</span>
                  </label>
                  <span className="text-[10px] font-extrabold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200">
                    Live Calculation
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  {/* Commission Rate (%) */}
                  <div>
                    <label className="text-slate-500 font-bold block mb-1">
                      Helpmate Take Rate (%)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={commissionRate}
                        onChange={(e) => setCommissionRate(Math.max(0, Math.min(100, Number(e.target.value))))}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-extrabold text-slate-900 dark:text-white outline-none focus:border-brand-500"
                      />
                      <span className="font-extrabold text-slate-500">%</span>
                    </div>
                  </div>

                  {/* GST Rate (%) Paid by Partner */}
                  <div>
                    <label className="text-slate-500 font-bold block mb-1">
                      Partner GST Rate (%)
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={gstRate}
                        onChange={(e) => setGstRate(Math.max(0, Math.min(100, Number(e.target.value))))}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-extrabold text-slate-900 dark:text-white outline-none focus:border-brand-500"
                      />
                      <span className="font-extrabold text-slate-500">%</span>
                    </div>
                  </div>
                </div>

                {/* Quick Presets for Commission */}
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-bold text-slate-400">Commission Presets:</span>
                  {[10, 15, 20, 25, 30].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setCommissionRate(rate)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                        commissionRate === rate
                          ? "bg-brand-600 text-white shadow-2xs"
                          : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-brand-300"
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Earnings & Payment Breakdown Box */}
              {(() => {
                const grossVol = Math.round(proofTech.pendingPayout / 0.75);
                const commAmt = Math.round(grossVol * (commissionRate / 100));
                const gstAmt = Math.round(commAmt * (gstRate / 100));
                const netPayable = grossVol - commAmt - gstAmt;

                return (
                  <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-2 text-xs">
                    <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300">
                      <span>Gross Job Volume (100%)</span>
                      <span className="font-mono">₹{grossVol.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-rose-600 dark:text-rose-400">
                      <span>Helpmate Platform Share ({commissionRate}%)</span>
                      <span className="font-mono">-₹{commAmt.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-purple-600 dark:text-purple-400">
                      <span>GST Paid by Partner ({gstRate}% GST on Commission)</span>
                      <span className="font-mono">-₹{gstAmt.toLocaleString()}</span>
                    </div>
                    <div className="border-t border-amber-200 dark:border-amber-800 pt-2 flex justify-between font-black text-sm text-slate-900 dark:text-white">
                      <span>Net Bank Payable Payout to Partner</span>
                      <span className="text-amber-600 dark:text-amber-400 text-base font-mono">
                        ₹{netPayable.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Bank Specs Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                  Partner Registered Bank Details
                </span>
                <div className="grid grid-cols-2 gap-2 font-semibold text-slate-800 dark:text-slate-200">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Account Holder</span>
                    <span>{proofTech.bankAccountName || proofTech.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Account Number</span>
                    <span className="font-mono">{proofTech.bankAccountNumber || "9820-1049-8120"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">IFSC Code</span>
                    <span className="font-mono">{proofTech.ifscCode || "SBIN0001240"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">UPI ID</span>
                    <span className="font-mono text-brand-600 dark:text-brand-400">
                      {proofTech.upiId || `${proofTech.name.toLowerCase().replace(/\s+/g, ".")}@okaxis`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Inputs */}
              <div className="space-y-3.5">
                <div>
                  <label className="font-extrabold text-slate-700 dark:text-slate-300 block mb-1">
                    Manual Transfer Mode *
                  </label>
                  <select className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-extrabold outline-none focus:border-brand-500 cursor-pointer">
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
                    required
                    defaultValue={`UTR-VAR-2026-${Math.floor(10000000 + Math.random() * 90000000)}`}
                    placeholder="e.g. UTR-VAR-2026-98124018"
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-extrabold outline-none focus:border-brand-500"
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
                          Manual_Payout_Receipt_UTR.pdf
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">Bank Transfer Slip / Payment Screenshot</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="px-3.5 py-1.5 rounded-lg bg-brand-600 text-white font-extrabold text-xs cursor-pointer"
                    >
                      Uploaded
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setProofTech(null)}
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

      {/* FULL PARTNER ONBOARDING & VERIFICATION DRAWER */}
      {isAddPartnerOpen && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex justify-end outline-none">
            <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300 outline-none">
              {/* Header */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 border border-brand-200 dark:border-brand-800 shadow-sm">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Full Onboard Service Partner & Verification
                    </h3>
                    <p className="text-xs text-slate-500">
                      Personal Identity, Biometric Aadhaar, Guarantor & Police Thana Clearance
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddPartnerOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Form Body */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!partnerName.trim() || !partnerPhone.trim()) return;

                  const newPartner: Technician = {
                    id: `TECH-${Math.floor(1000 + Math.random() * 9000)}`,
                    name: partnerName,
                    phone: partnerPhone,
                    role: "Senior AC & Home Service Specialist",
                    category: partnerCategory,
                    locality: partnerLocality,
                    pincode: "221002",
                    rating: 5.0,
                    totalJobs: 0,
                    totalEarnings: 0,
                    commissionPaid: 0,
                    pendingPayout: 0,
                    status: "Available",
                    aadhaarVerified: true,
                    policeVerified: partnerPoliceStatus === "Verified Clean",
                    bondedInsurance: true,
                    joiningDate: "Today",
                    lastPayoutDate: "N/A",
                    avatar: partnerAvatar || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=150&auto=format&fit=crop&q=80",
                    aadhaarDocUrl: partnerAadhaarDoc || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80",
                    guarantorAadhaarDocUrl: partnerGuarantorAadhaarDoc || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80",
                    policeDocUrl: partnerPoliceDoc || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80",
                  };

                  setTechs([newPartner, ...techs]);
                  setPartnerName("");
                  setPartnerPhone("");
                  setPartnerPhoneVerified(false);
                  setPartnerEmail("");
                  setPartnerEmailVerified(false);
                  setPartnerAvatar("");
                  setPartnerAadhaar("");
                  setPartnerAadhaarDoc("");
                  setPartnerGuarantorName("");
                  setPartnerGuarantorPhone("");
                  setGuarantorPhoneVerified(false);
                  setPartnerGuarantorEmail("");
                  setGuarantorEmailVerified(false);
                  setPartnerGuarantorAddress("");
                  setPartnerGuarantorAadhaar("");
                  setPartnerGuarantorAadhaarDoc("");
                  setPartnerPoliceToken("");
                  setPartnerPoliceDoc("");
                  setIsAddPartnerOpen(false);
                }}
                className="flex-1 p-6 overflow-y-auto space-y-6"
              >
                {/* SECTION 1: PARTNER PERSONAL DETAILS & PROFILE PHOTO UPLOAD */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white font-extrabold text-sm border-b border-slate-200 dark:border-slate-700 pb-2">
                    <User className="w-4 h-4 text-brand-600" />
                    <span>1. Partner Profile Photo & Personal Details</span>
                  </div>

                  {/* Partner Profile Photo Upload Box */}
                  <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-700 shrink-0 border border-slate-200 dark:border-slate-600 flex items-center justify-center shadow-xs">
                      {partnerAvatar ? (
                        <Image
                          src={partnerAvatar}
                          alt="Partner Profile Preview"
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        <User className="w-8 h-8 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1.5 w-full text-xs">
                      <label className="font-extrabold text-slate-900 dark:text-white block">
                        Upload Partner Profile Photo / Avatar *
                      </label>
                      <p className="text-[11px] text-slate-500">
                        Upload official photo (JPG, PNG) or enter image URL for app profile card.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <label className="px-3 py-1.5 rounded-lg bg-brand-50 hover:bg-brand-100 dark:bg-brand-950 dark:hover:bg-brand-900 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 font-bold text-[11px] cursor-pointer flex items-center gap-1.5 shrink-0 justify-center">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Browse Image File...</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, setPartnerAvatar)}
                            className="hidden"
                          />
                        </label>
                        <input
                          type="text"
                          value={partnerAvatar}
                          onChange={(e) => setPartnerAvatar(e.target.value)}
                          placeholder="Or paste Profile Image URL..."
                          className="flex-1 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] bg-slate-50 dark:bg-slate-900 font-mono text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={partnerName}
                        onChange={(e) => setPartnerName(e.target.value)}
                        placeholder="e.g. Ramesh Chandra Yadav"
                        className="w-full h-[42px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:border-brand-500"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-700 dark:text-slate-300 block">
                          Mobile Phone Number *
                        </label>
                        {partnerPhoneVerified ? (
                          <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Verified Mobile
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (!partnerPhone.trim()) { alert("Please enter Partner mobile phone number first."); return; }
                              setPartnerPhoneVerified(true);
                            }}
                            className="text-[10px] font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 underline cursor-pointer"
                          >
                            Verify Mobile (OTP)
                          </button>
                        )}
                      </div>
                      <div className="relative flex items-center">
                        <input
                          type="tel"
                          required
                          value={partnerPhone}
                          onChange={(e) => {
                            setPartnerPhone(e.target.value);
                            if (partnerPhoneVerified) setPartnerPhoneVerified(false);
                          }}
                          placeholder="+91 98390 12345"
                          className="w-full h-[42px] pl-3 pr-20 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:border-brand-500 text-xs"
                        />
                        {!partnerPhoneVerified && (
                          <button
                            type="button"
                            onClick={() => {
                              if (!partnerPhone.trim()) { alert("Please enter Partner mobile phone number first."); return; }
                              setPartnerPhoneVerified(true);
                            }}
                            className="absolute right-1.5 px-2.5 py-1 text-[10px] font-bold rounded-lg bg-brand-600 hover:bg-brand-700 text-white shadow-xs cursor-pointer transition-colors"
                          >
                            Verify
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-700 dark:text-slate-300 block">
                          Email Address (Optional)
                        </label>
                        {partnerEmailVerified ? (
                          <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Verified Email
                          </span>
                        ) : partnerEmail.trim() ? (
                          <button
                            type="button"
                            onClick={() => setPartnerEmailVerified(true)}
                            className="text-[10px] font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 underline cursor-pointer"
                          >
                            Verify Email
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium italic">Non-mandatory</span>
                        )}
                      </div>
                      <div className="relative flex items-center">
                        <input
                          type="email"
                          value={partnerEmail}
                          onChange={(e) => {
                            setPartnerEmail(e.target.value);
                            if (partnerEmailVerified) setPartnerEmailVerified(false);
                          }}
                          placeholder="e.g. ramesh.yadav@gmail.com (optional)"
                          className="w-full h-[42px] pl-3 pr-20 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:border-brand-500 text-xs"
                        />
                        {partnerEmail.trim() && !partnerEmailVerified && (
                          <button
                            type="button"
                            onClick={() => setPartnerEmailVerified(true)}
                            className="absolute right-1.5 px-2.5 py-1 text-[10px] font-bold rounded-lg bg-brand-600 hover:bg-brand-700 text-white shadow-xs cursor-pointer transition-colors"
                          >
                            Verify
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Varanasi Locality Base Zone *
                      </label>
                      <input
                        type="text"
                        required
                        value={partnerLocality}
                        onChange={(e) => setPartnerLocality(e.target.value)}
                        placeholder="Sigra, Varanasi"
                        className="w-full h-[42px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 2: BIOMETRIC AADHAAR IDENTITY & DOCUMENT UPLOAD */}
                <div className="p-5 rounded-2xl bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 space-y-4">
                  <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300 font-extrabold text-sm border-b border-blue-200 dark:border-blue-800 pb-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>2. Partner Aadhaar Biometric Verification & Image Upload</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Partner Aadhaar Number (12-Digit) *
                      </label>
                      <input
                        type="text"
                        maxLength={14}
                        value={partnerAadhaar}
                        onChange={(e) => setPartnerAadhaar(e.target.value)}
                        placeholder="7821-4920-1102"
                        className="w-full h-[42px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Partner Aadhaar Card Image Upload Box */}
                  <div className="space-y-1 text-xs">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">
                      Partner Aadhaar Card (Front & Back Image / Document) *
                    </label>
                    <div className="p-3.5 rounded-xl border border-dashed border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        {partnerAadhaarDoc ? (
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-blue-300 shrink-0">
                            <Image
                              src={partnerAadhaarDoc}
                              alt="Partner Aadhaar Doc"
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center shrink-0 border border-blue-200">
                            <Upload className="w-5 h-5 text-blue-600" />
                          </div>
                        )}
                        <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold truncate">
                          {partnerAadhaarDoc ? "Aadhaar_Document_Uploaded.jpg" : "Select Aadhaar Card Image file..."}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <label className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] cursor-pointer flex items-center gap-1.5 shrink-0 justify-center shadow-xs">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Image...</span>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => handleFileUpload(e, setPartnerAadhaarDoc)}
                            className="hidden"
                          />
                        </label>
                        <input
                          type="text"
                          value={partnerAadhaarDoc}
                          onChange={(e) => setPartnerAadhaarDoc(e.target.value)}
                          placeholder="Or paste Aadhaar Image URL..."
                          className="w-full sm:w-48 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] bg-slate-50 dark:bg-slate-900 font-mono text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 3: GUARANTOR / REFERENCE PERSON */}
                <div className="p-5 rounded-2xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 space-y-4">
                  <div className="flex items-center gap-2 text-purple-900 dark:text-purple-300 font-extrabold text-sm border-b border-purple-200 dark:border-purple-800 pb-2">
                    <ShieldAlert className="w-4 h-4 text-purple-600" />
                    <span>3. Guarantor / Reference Person Identity & Document Upload</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Guarantor Full Name *
                      </label>
                      <input
                        type="text"
                        value={partnerGuarantorName}
                        onChange={(e) => setPartnerGuarantorName(e.target.value)}
                        placeholder="e.g. Suresh Chandra Yadav (Guarantor)"
                        className="w-full h-[42px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-700 dark:text-slate-300 block">
                          Guarantor Mobile Phone *
                        </label>
                        {guarantorPhoneVerified ? (
                          <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Verified Mobile
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (!partnerGuarantorPhone.trim()) { alert("Please enter Guarantor mobile phone number first."); return; }
                              setGuarantorPhoneVerified(true);
                            }}
                            className="text-[10px] font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 underline cursor-pointer"
                          >
                            Verify Mobile (OTP)
                          </button>
                        )}
                      </div>
                      <div className="relative flex items-center">
                        <input
                          type="tel"
                          value={partnerGuarantorPhone}
                          onChange={(e) => {
                            setPartnerGuarantorPhone(e.target.value);
                            if (guarantorPhoneVerified) setGuarantorPhoneVerified(false);
                          }}
                          placeholder="+91 98390 88210"
                          className="w-full h-[42px] pl-3 pr-20 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:border-purple-500 text-xs"
                        />
                        {!guarantorPhoneVerified && (
                          <button
                            type="button"
                            onClick={() => {
                              if (!partnerGuarantorPhone.trim()) { alert("Please enter Guarantor mobile phone number first."); return; }
                              setGuarantorPhoneVerified(true);
                            }}
                            className="absolute right-1.5 px-2.5 py-1 text-[10px] font-bold rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-xs cursor-pointer transition-colors"
                          >
                            Verify
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-bold text-slate-700 dark:text-slate-300 block">
                          Guarantor Email (Optional)
                        </label>
                        {guarantorEmailVerified ? (
                          <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Verified Email
                          </span>
                        ) : partnerGuarantorEmail.trim() ? (
                          <button
                            type="button"
                            onClick={() => setGuarantorEmailVerified(true)}
                            className="text-[10px] font-bold text-purple-600 hover:text-purple-700 dark:text-purple-400 underline cursor-pointer"
                          >
                            Verify Email
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium italic">Non-mandatory</span>
                        )}
                      </div>
                      <div className="relative flex items-center">
                        <input
                          type="email"
                          value={partnerGuarantorEmail}
                          onChange={(e) => {
                            setPartnerGuarantorEmail(e.target.value);
                            if (guarantorEmailVerified) setGuarantorEmailVerified(false);
                          }}
                          placeholder="e.g. suresh.guarantor@gmail.com (optional)"
                          className="w-full h-[42px] pl-3 pr-20 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:border-purple-500 text-xs"
                        />
                        {partnerGuarantorEmail.trim() && !guarantorEmailVerified && (
                          <button
                            type="button"
                            onClick={() => setGuarantorEmailVerified(true)}
                            className="absolute right-1.5 px-2.5 py-1 text-[10px] font-bold rounded-lg bg-purple-600 hover:bg-purple-700 text-white shadow-xs cursor-pointer transition-colors"
                          >
                            Verify
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Guarantor Aadhaar No. (12-Digit)
                      </label>
                      <input
                        type="text"
                        maxLength={14}
                        value={partnerGuarantorAadhaar}
                        onChange={(e) => setPartnerGuarantorAadhaar(e.target.value)}
                        placeholder="7821-4920-5592"
                        className="w-full h-[42px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Guarantor Residence Address
                      </label>
                      <input
                        type="text"
                        value={partnerGuarantorAddress}
                        onChange={(e) => setPartnerGuarantorAddress(e.target.value)}
                        placeholder="Sigra Colony, Varanasi"
                        className="w-full h-[42px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  {/* Guarantor Aadhaar Card Image Upload Box */}
                  <div className="space-y-1 text-xs">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">
                      Guarantor Person Aadhaar Card Document Image *
                    </label>
                    <div className="p-3.5 rounded-xl border border-dashed border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        {partnerGuarantorAadhaarDoc ? (
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-purple-300 shrink-0">
                            <Image
                              src={partnerGuarantorAadhaarDoc}
                              alt="Guarantor Aadhaar Doc"
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950 flex items-center justify-center shrink-0 border border-purple-200">
                            <Upload className="w-5 h-5 text-purple-600" />
                          </div>
                        )}
                        <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold truncate">
                          {partnerGuarantorAadhaarDoc ? "Guarantor_Aadhaar_Uploaded.jpg" : "Select Guarantor Aadhaar file..."}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <label className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] cursor-pointer flex items-center gap-1.5 shrink-0 justify-center shadow-xs">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Image...</span>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => handleFileUpload(e, setPartnerGuarantorAadhaarDoc)}
                            className="hidden"
                          />
                        </label>
                        <input
                          type="text"
                          value={partnerGuarantorAadhaarDoc}
                          onChange={(e) => setPartnerGuarantorAadhaarDoc(e.target.value)}
                          placeholder="Or paste Guarantor Aadhaar URL..."
                          className="w-full sm:w-48 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] bg-slate-50 dark:bg-slate-900 font-mono text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 4: POLICE VERIFICATION & THANA CLEARANCE DOCUMENT UPLOAD */}
                <div className="p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 space-y-4">
                  <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-extrabold text-sm border-b border-amber-200 dark:border-amber-800 pb-2">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>4. Police Verification & Local Thana PCC Clearance Document Upload</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Police Verification Status
                      </label>
                      <select
                        value={partnerPoliceStatus}
                        onChange={(e) => setPartnerPoliceStatus(e.target.value as any)}
                        className="w-full h-[42px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:border-brand-500"
                      >
                        <option value="Verified Clean">Verified Clean (PCC Issued)</option>
                        <option value="Submitted to Local Thana">Submitted to Local Thana</option>
                        <option value="Pending Verification">Pending Verification</option>
                        <option value="Exempted">Exempted</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Local Police Station (Thana)
                      </label>
                      <select
                        value={partnerPoliceStation}
                        onChange={(e) => setPartnerPoliceStation(e.target.value)}
                        className="w-full h-[42px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:border-brand-500"
                      >
                        <option value="Sigra Police Station">Sigra Police Station</option>
                        <option value="Lanka Thana">Lanka Thana</option>
                        <option value="Bhelupur Thana">Bhelupur Thana</option>
                        <option value="Chetganj Thana">Chetganj Thana</option>
                        <option value="Cantt Police Station">Cantt Police Station</option>
                        <option value="Chowk Thana">Chowk Thana</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Police Token / PCC Ref No.
                      </label>
                      <input
                        type="text"
                        value={partnerPoliceToken}
                        onChange={(e) => setPartnerPoliceToken(e.target.value)}
                        placeholder="PCC-VAR-2026-8819"
                        className="w-full h-[42px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold outline-none focus:border-brand-500"
                      />
                    </div>
                  </div>

                  {/* Police Verification PCC Certificate Image Upload Box */}
                  <div className="space-y-1 text-xs">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">
                      Police Thana Clearance Certificate (PCC Document Image)
                    </label>
                    <div className="p-3.5 rounded-xl border border-dashed border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        {partnerPoliceDoc ? (
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-amber-300 shrink-0">
                            <Image
                              src={partnerPoliceDoc}
                              alt="Police Certificate"
                              fill
                              unoptimized
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950 flex items-center justify-center shrink-0 border border-amber-200">
                            <Upload className="w-5 h-5 text-amber-600" />
                          </div>
                        )}
                        <span className="text-[11px] text-slate-600 dark:text-slate-400 font-semibold truncate">
                          {partnerPoliceDoc ? "Police_Clearance_Cert.jpg" : "Upload PCC Certificate (PDF/JPG)..."}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <label className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] cursor-pointer flex items-center gap-1.5 shrink-0 justify-center shadow-xs">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Image...</span>
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => handleFileUpload(e, setPartnerPoliceDoc)}
                            className="hidden"
                          />
                        </label>
                        <input
                          type="text"
                          value={partnerPoliceDoc}
                          onChange={(e) => setPartnerPoliceDoc(e.target.value)}
                          placeholder="Or paste PCC Certificate URL..."
                          className="w-full sm:w-48 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] bg-slate-50 dark:bg-slate-900 font-mono text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddPartnerOpen(false)}
                    className="flex-1 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-extrabold text-xs shadow-lux flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save & Onboard Verified Partner</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* Edit Tech Drawer */}
      {editTech && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/60 backdrop-blur-xs flex justify-end outline-none">
            <div className="absolute inset-0" onClick={() => setEditTech(null)} />
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setTechs(techs.map((t) => (t.id === editTech.id ? editTech : t)));
                setEditTech(null);
              }}
              className="relative z-10 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 max-w-md w-full h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300 outline-none overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Edit Partner Profile</h3>
                <button type="button" onClick={() => setEditTech(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Partner Full Name</label>
                  <input
                    type="text"
                    value={editTech.name}
                    onChange={(e) => setEditTech({ ...editTech, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editTech.phone}
                    onChange={(e) => setEditTech({ ...editTech, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Category</label>
                  <input
                    type="text"
                    value={editTech.category}
                    onChange={(e) => setEditTech({ ...editTech, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setEditTech(null)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-xs">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-brand-500 text-white rounded-xl font-bold text-xs shadow-lux">Save Partner</button>
              </div>
            </form>
          </div>
        </Portal>
      )}

      {/* Delete Tech Modal */}
      {deleteTech && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 outline-none">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl max-w-md w-full space-y-4 ring-1 ring-slate-900/10 dark:ring-slate-800 shadow-2xl outline-none">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Delete Partner</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Are you sure you want to delete partner <strong>{deleteTech.name}</strong> ({deleteTech.phone})?
              </p>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setDeleteTech(null)} className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-xs">Cancel</button>
                <button
                  type="button"
                  onClick={() => {
                    setTechs(techs.filter((t) => t.id !== deleteTech.id));
                    setDeleteTech(null);
                  }}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-lux"
                >
                  Delete Partner
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
