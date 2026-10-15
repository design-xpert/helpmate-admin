"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  CheckCircle2,
  UserCheck,
  MapPin,
  Phone,
  Mail,
  FileText,
  Award,
  Building2,
  Wrench,
  FileCheck,
  ExternalLink,
  Download,
  CreditCard,
  User,
  Shield,
  Clock,
  Briefcase,
  Star,
  CheckCircle,
  Eye,
  File,
  Lock,
  Percent,
} from "lucide-react";

export default function PartnerProfilePage() {
  const [activeDocPreview, setActiveDocPreview] = useState<string | null>(null);

  const profileData = {
    id: "HM-TECH-901",
    name: "Ramesh Kumar Yadav",
    avatar: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=300&auto=format&fit=crop&q=80",
    role: "Senior AC Servicing & Power-Jet HVAC Specialist",
    category: "AC Service & Repair",
    phone: "+91 98390 11220",
    email: "ramesh.yadav@helpmate.in",
    address: "H.No 42/B, Sigra-Rathyatra Main Road, Sigra, Varanasi, Uttar Pradesh - 221002",
    pincodes: ["221001 (Bhelupur)", "221002 (Sigra)", "221005 (Lanka)", "221010 (Mahmoorganj)"],
    joiningDate: "14 Jan 2025",
    rating: 4.9,
    totalJobs: 128,
    commissionRate: "25%",
    status: "Active & Verified",

    // Bank Account Payout
    bankName: "HDFC Bank Ltd",
    branch: "Sigra Main Branch, Varanasi",
    accountNumber: "50100299182711",
    ifscCode: "HDFC0001820",
    upiId: "ramesh.yadav@okaxis",

    // Aadhaar KYC Details
    aadhaarNumber: "9823 4102 9831",
    aadhaarVerified: true,
    aadhaarDocName: "Aadhaar_Both_Sides_Verified.pdf",

    // Emergency Guarantor
    guarantorName: "Suresh Chandra Yadav",
    guarantorRelation: "Father / Next of Kin",
    guarantorPhone: "+91 94150 09821",
    guarantorPhoneVerified: true,
    guarantorDocName: "Guarantor_Identity_Address_Proof.pdf",

    // Police Clearance
    policeStatus: "Cleared & Approved",
    policeThana: "Sigra Police Station (Varanasi Zone)",
    policeNocNumber: "UP-VAR-POL-2026-99210",
    policeIssueDate: "12 Jan 2026",
    policeExpiryDate: "11 Jan 2027",
    policeDocName: "Sigra_Thana_Police_Verification_NOC.pdf",

    // Uploaded Documents Vault
    uploadedDocs: [
      {
        id: "doc-1",
        title: "Current Passport Size Photo",
        fileName: "Ramesh_Yadav_Passport_Photo.png",
        type: "ID Badge Photo",
        dateUploaded: "14 Jan 2025",
        status: "Verified ✓",
        url: "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=500&auto=format&fit=crop&q=80",
      },
      {
        id: "doc-2",
        title: "Aadhaar Card (Front & Back Both Sides)",
        fileName: "Aadhaar_Both_Sides_Color_Scan.pdf",
        type: "Government Identity Proof",
        dateUploaded: "14 Jan 2025",
        status: "Verified e-KYC ✓",
        url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=80",
      },
      {
        id: "doc-3",
        title: "PAN Card Copy",
        fileName: "PAN_Card_Copy.pdf",
        type: "Tax Verification",
        dateUploaded: "14 Jan 2025",
        status: "Verified ✓",
        url: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=500&auto=format&fit=crop&q=80",
      },
      {
        id: "doc-4",
        title: "Driving License (DL Both Sides)",
        fileName: "DL_Both_Sides_UP65_2022.pdf",
        type: "Vehicle & Identity Proof",
        dateUploaded: "14 Jan 2025",
        status: "Verified ✓",
        url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=80",
      },
      {
        id: "doc-5",
        title: "Police Verification NOC Certificate",
        fileName: "Sigra_Police_Thana_NOC_Cert.pdf",
        type: "Governance Clearance",
        dateUploaded: "12 Jan 2026",
        status: "Approved NOC ✓",
        url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=500&auto=format&fit=crop&q=80",
      },
      {
        id: "doc-6",
        title: "Bank Passbook / Cancelled Cheque",
        fileName: "HDFC_Bank_Passbook_Copy.pdf",
        type: "Weekly Payout Verification",
        dateUploaded: "14 Jan 2025",
        status: "Bank Verified ✓",
        url: "https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=500&auto=format&fit=crop&q=80",
      },
    ],
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300 pb-16">
      {/* ─── PROFILE HEADER CARD ─── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
          <div className="relative">
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden border-4 border-white dark:border-slate-800 shadow-lg shrink-0">
              {profileData.avatar ? (
                <Image
                  src={profileData.avatar}
                  alt={profileData.name}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : null}
            </div>
            <span className="absolute -bottom-1 -right-1 p-1.5 bg-emerald-500 text-white rounded-full text-xs ring-4 ring-white dark:ring-slate-900 z-10">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {profileData.name}
              </h1>
              <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-black border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Police Cleared & Verified</span>
              </span>
            </div>

            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Account ID: <span className="font-mono font-extrabold text-slate-900 dark:text-white">{profileData.id}</span> • {profileData.role}
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 pt-1 text-xs font-bold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5 text-amber-500 font-extrabold">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{profileData.rating} Rating ({profileData.totalJobs} Jobs Completed)</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <Phone className="w-3.5 h-3.5 text-brand-600" />
                <span>{profileData.phone}</span>
                <span className="text-[10px] text-emerald-600 font-black">✓ Verified</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                <Mail className="w-3.5 h-3.5 text-brand-600" />
                <span>{profileData.email}</span>
              </span>
            </div>

            <p className="text-xs text-slate-500 font-medium pt-1 flex items-start justify-center md:justify-start gap-1">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
              <span>{profileData.address}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto text-center">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
            <span className="text-slate-400 font-bold uppercase text-[10px] block">HelpMate Take-Rate</span>
            <span className="text-lg font-black text-brand-600 font-mono">{profileData.commissionRate}</span>
          </div>
        </div>
      </div>

      {/* ─── SECTION 1: AADHAAR & EMERGENCY GUARANTOR DETAILS ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CARD 1A: AADHAAR E-KYC CARD */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-600" />
              <span>1. Personal Identity & Aadhaar e-KYC</span>
            </h3>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[11px] font-black border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> e-KYC Verified
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Aadhaar Card Number (12 Digits)</span>
              <span className="text-lg font-mono font-black text-slate-900 dark:text-white tracking-wider">
                {profileData.aadhaarNumber}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="w-5 h-5 text-brand-600 shrink-0" />
                <div className="min-w-0">
                  <span className="font-extrabold text-slate-900 dark:text-white block truncate">
                    Aadhaar Copy (Both Sides - Front & Back)
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold block truncate">
                    ✓ {profileData.aadhaarDocName}
                  </span>
                </div>
              </div>
              <a
                href="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80"
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-extrabold text-xs border border-brand-200 shrink-0 cursor-pointer flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" /> View Copy
              </a>
            </div>
          </div>
        </div>

        {/* CARD 1B: EMERGENCY GUARANTOR DETAILS */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-purple-600" />
              <span>2. Emergency Guarantor Details</span>
            </h3>
            <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 text-[11px] font-black border border-purple-200">
              Verified Next of Kin
            </span>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Guarantor Name</span>
                <span className="font-extrabold text-slate-900 dark:text-white text-sm block">{profileData.guarantorName}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Relation</span>
                <span className="font-extrabold text-slate-900 dark:text-white text-sm block">{profileData.guarantorRelation}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Guarantor Mobile Number</span>
                <span className="font-mono font-extrabold text-slate-900 dark:text-white text-sm">{profileData.guarantorPhone}</span>
              </div>
              <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold text-xs border border-emerald-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> OTP Verified
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── SECTION 2: POLICE VERIFICATION & THANA NOC CLEARANCE ─── */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                3. Varanasi Police Background Verification & Thana Clearance NOC
              </h3>
              <p className="text-xs text-slate-400">
                Official Police NOC Clearance Certificate issued by UP Police Varanasi Sector.
              </p>
            </div>
          </div>

          <span className="px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-black text-xs border border-emerald-300 flex items-center gap-1.5 shrink-0 w-fit">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>BACKGROUND CLEARED</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400 font-bold uppercase text-[10px] block">Issued Police Station</span>
            <span className="font-extrabold text-slate-900 dark:text-white block mt-1">{profileData.policeThana}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400 font-bold uppercase text-[10px] block">NOC Clearance Cert No</span>
            <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400 block mt-1">{profileData.policeNocNumber}</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-slate-400 font-bold uppercase text-[10px] block">Validity Period</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 block mt-1">
              {profileData.policeIssueDate} – {profileData.policeExpiryDate}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-slate-400 font-bold uppercase text-[10px] block">Official NOC PDF</span>
              <span className="font-bold text-slate-900 dark:text-white truncate block">Police_NOC_Cert.pdf</span>
            </div>
            <a
              href="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs cursor-pointer shrink-0 flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> PDF
            </a>
          </div>
        </div>
      </div>

      {/* ─── SECTION 3: UPLOADED DOCUMENTS & CERTIFICATES VAULT ─── */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-purple-600" />
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
              4. Uploaded Verification Documents & Certificates Vault ({profileData.uploadedDocs.length})
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-400">All Files Audited & Sealed</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {profileData.uploadedDocs.map((doc) => (
            <div
              key={doc.id}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 hover:border-brand-300 transition-all group"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400 border border-purple-200 shrink-0">
                    <File className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-xs leading-snug">
                      {doc.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-semibold">{doc.type}</span>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-black shrink-0 border border-emerald-200">
                  {doc.status}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                <span className="text-[10px] text-slate-400 font-mono">Uploaded: {doc.dateUploaded}</span>
                <a
                  href={doc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-extrabold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" /> View Document
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── SECTION 4: BANK ACCOUNT & SERVICED PINCODES ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BANK ACCOUNT CARD */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Building2 className="w-5 h-5 text-emerald-600" />
            <span>5. Verified Bank Account for Weekly Payouts</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Bank Name</span>
                <span className="font-extrabold text-slate-900 dark:text-white text-xs block">{profileData.bankName}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Branch</span>
                <span className="font-extrabold text-slate-900 dark:text-white text-xs block">{profileData.branch}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Account Number</span>
                <span className="font-mono font-black text-slate-900 dark:text-white text-xs block">{profileData.accountNumber}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">IFSC Code</span>
                <span className="font-mono font-black text-slate-900 dark:text-white text-xs block">{profileData.ifscCode}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-slate-400 font-bold uppercase text-[10px] block">UPI ID for Direct Transfer</span>
                <span className="font-mono font-extrabold text-brand-600 text-xs">{profileData.upiId}</span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-200">
                Auto Payout Active
              </span>
            </div>
          </div>
        </div>

        {/* SERVICED PINCODES CARD */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <MapPin className="w-5 h-5 text-rose-500" />
            <span>6. Operating Service Localities & Pincodes</span>
          </h3>

          <div className="space-y-3 text-xs">
            <span className="text-slate-500 font-semibold block">
              Assigned Varanasi Service Pincodes ({profileData.pincodes.length} Zones):
            </span>
            <div className="flex flex-wrap gap-2">
              {profileData.pincodes.map((pin, idx) => (
                <span
                  key={idx}
                  className="px-3 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-extrabold text-slate-900 dark:text-white flex items-center gap-2 shadow-2xs"
                >
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>{pin}</span>
                </span>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-brand-50/50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800/60 text-xs font-semibold text-brand-900 dark:text-brand-200 space-y-1">
              <span className="font-extrabold block">Primary Base Locality</span>
              <p className="text-[11px] opacity-90">
                Registered Home Base: <strong>Sigra (Pincode: 221002)</strong>. Dispatched for AC service requests within a 12 km radius.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
