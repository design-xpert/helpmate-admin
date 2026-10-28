"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { DataTable, Column } from "@/components/DataTable";
import {
  initialLeadItems,
  LeadCRMItem,
  LeadStatus,
  LeadSource,
  LeadPriority,
  LeadInteraction,
} from "@/lib/mockData";
import {
  Target,
  UserPlus,
  Search,
  Filter,
  Kanban,
  Table as TableIcon,
  Phone,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  TrendingUp,
  DollarSign,
  User,
  MapPin,
  Calendar,
  X,
  Plus,
  ArrowRight,
  ChevronRight,
  Send,
  FileText,
  Building2,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Download,
  GripVertical,
  Globe,
  Share2,
  PhoneIncoming,
  Users as UsersIcon,
  Check,
  Zap,
  Layers,
  ArrowUpRight,
  Briefcase,
  AlertCircle,
  BarChart3,
  Wrench,
  CalendarCheck,
} from "lucide-react";
import { Portal } from "@/components/Portal";

const STAGES: {
  label: LeadStatus;
  color: string;
  bgColor: string;
  borderColor: string;
  headerBadgeBg: string;
  stepNum: number;
  sla: string;
  description: string;
}[] = [
  {
    label: "New Inquiry",
    color: "text-blue-700 dark:text-blue-400",
    bgColor: "bg-blue-50/70 dark:bg-blue-950/40",
    borderColor: "border-blue-200 dark:border-blue-900",
    headerBadgeBg: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    stepNum: 1,
    sla: "< 15 Mins",
    description: "Inquiry received via WhatsApp, Website, App, or Call",
  },
  {
    label: "Contacted & Qualified",
    color: "text-purple-700 dark:text-purple-400",
    bgColor: "bg-purple-50/70 dark:bg-purple-950/40",
    borderColor: "border-purple-200 dark:border-purple-900",
    headerBadgeBg: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    stepNum: 2,
    sla: "< 2 Hours",
    description: "Scope, address locality & timeline verified",
  },
  {
    label: "Inspection Scheduled",
    color: "text-amber-700 dark:text-amber-400",
    bgColor: "bg-amber-50/70 dark:bg-amber-950/40",
    borderColor: "border-amber-200 dark:border-amber-900",
    headerBadgeBg: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    stepNum: 3,
    sla: "< 24 Hours",
    description: "Inspector assigned for laser dampness check / site audit",
  },
  {
    label: "Quotation Sent",
    color: "text-indigo-700 dark:text-indigo-400",
    bgColor: "bg-indigo-50/70 dark:bg-indigo-950/40",
    borderColor: "border-indigo-200 dark:border-indigo-900",
    headerBadgeBg: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
    stepNum: 4,
    sla: "< 4 Hours",
    description: "HelpMate rate-card estimate delivered to customer",
  },
  {
    label: "Converted",
    color: "text-emerald-700 dark:text-emerald-400",
    bgColor: "bg-emerald-50/70 dark:bg-emerald-950/40",
    borderColor: "border-emerald-200 dark:border-emerald-900",
    headerBadgeBg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
    stepNum: 5,
    sla: "Instant",
    description: "Converted to live HelpMate booking & technician dispatched",
  },
];

const VARANASI_LOCALITIES = [
  "Lanka",
  "Sigra",
  "Ravindrapuri",
  "Mahmoorganj",
  "Sarnath",
  "Cantonment",
  "Assi Ghat",
  "Shivpur",
  "Bhelupur",
  "Kuber Nagar",
  "Godowlia",
  "Pandeypur",
];

const LEAD_SOURCES: LeadSource[] = [
  "WhatsApp Inquiry",
  "Website Form",
  "Google Ads",
  "Missed Call Desk",
  "Customer Referral",
  "Mobile App Sign-up",
  "Support Desk",
];

const TEAM_MEMBERS = [
  "Aman Verma (HQ)",
  "Rahul Singh (VNS Lead)",
  "Priya Sharma (Ops)",
  "Rajeev Verma (Lead)",
  "Varanasi Ops Admin",
  "Unassigned",
];

function getSourceIcon(source: LeadSource) {
  switch (source) {
    case "WhatsApp Inquiry":
      return <MessageSquare className="w-3 h-3 text-emerald-500" />;
    case "Website Form":
      return <Globe className="w-3 h-3 text-blue-500" />;
    case "Google Ads":
      return <Zap className="w-3 h-3 text-amber-500" />;
    case "Missed Call Desk":
      return <PhoneIncoming className="w-3 h-3 text-purple-500" />;
    case "Customer Referral":
      return <Share2 className="w-3 h-3 text-pink-500" />;
    case "Mobile App Sign-up":
      return <UserPlus className="w-3 h-3 text-indigo-500" />;
    default:
      return <Target className="w-3 h-3 text-slate-500" />;
  }
}

export default function LeadCRMPage() {
  const [leads, setLeads] = useState<LeadCRMItem[]>(initialLeadItems);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");

  // Drag & Drop State & Persistent Refs
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<LeadStatus | null>(null);
  const draggedLeadRef = useRef<string | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [priorityFilter, setPriorityFilter] = useState<string>("All");
  const [sourceFilter, setSourceFilter] = useState<string>("All");
  const [localityFilter, setLocalityFilter] = useState<string>("All");

  // Selected Lead for Drawer
  const [selectedLead, setSelectedLead] = useState<LeadCRMItem | null>(null);

  // New Note state in drawer
  const [newNoteText, setNewNoteText] = useState("");
  const [newNoteType, setNewNoteType] = useState<LeadInteraction["type"]>("Note");

  // Create Lead Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newLeadData, setNewLeadData] = useState({
    customerName: "",
    phone: "",
    email: "",
    locality: "Lanka, Varanasi",
    address: "",
    serviceCategory: "AC & Appliance Repair",
    serviceRequested: "",
    leadSource: "WhatsApp Inquiry" as LeadSource,
    estimatedValue: "3500",
    priority: "High" as LeadPriority,
    assignedTo: "Aman Verma (HQ)",
    notesText: "",
  });

  // Toast / Conversion notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // KPI Calculations
  const totalLeads = leads.length;
  const hotLeadsCount = leads.filter(
    (l) => l.leadScore >= 75 && l.status !== "Lost" && l.status !== "Converted"
  ).length;
  const pipelineValue = leads
    .filter((l) => l.status !== "Lost" && l.status !== "Converted")
    .reduce((sum, l) => sum + l.estimatedValue, 0);
  const convertedCount = leads.filter((l) => l.status === "Converted").length;
  const conversionRate = totalLeads > 0 ? Math.round((convertedCount / totalLeads) * 100) : 0;
  const overdueFollowups = leads.filter(
    (l) => l.status !== "Converted" && l.status !== "Lost" && l.followUpDate.startsWith("2026-08-24")
  ).length;

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter((item) => {
      if (statusFilter !== "All" && item.status !== statusFilter) return false;
      if (priorityFilter !== "All" && item.priority !== priorityFilter) return false;
      if (sourceFilter !== "All" && item.leadSource !== sourceFilter) return false;
      if (localityFilter !== "All" && !item.locality.toLowerCase().includes(localityFilter.toLowerCase()))
        return false;

      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const matchesName = item.customerName.toLowerCase().includes(q);
        const matchesPhone = item.phone.includes(q);
        const matchesId = item.id.toLowerCase().includes(q);
        const matchesService = item.serviceRequested.toLowerCase().includes(q);
        const matchesLocality = item.locality.toLowerCase().includes(q);
        return matchesName || matchesPhone || matchesId || matchesService || matchesLocality;
      }
      return true;
    });
  }, [leads, statusFilter, priorityFilter, sourceFilter, localityFilter, searchQuery]);

  // Handle Drag & Drop Status Updates
  const handleUpdateStatus = (leadId: string, newStatus: LeadStatus) => {
    const targetLead = leads.find((l) => l.id === leadId);
    if (targetLead && targetLead.status === newStatus) return;

    const isConverted = newStatus === "Converted";
    const newBookingId = isConverted ? `BK-VNS-${Math.floor(1000 + Math.random() * 9000)}` : targetLead?.convertedBookingId;

    const updated = leads.map((l) => {
      if (l.id === leadId) {
        const newInteraction: LeadInteraction = {
          id: `nt-${Date.now()}`,
          type: "StatusChange",
          author: "Aman Verma (HQ)",
          text: `Moved pipeline stage from "${l.status}" to "${newStatus}"${
            newBookingId ? ` (Auto-generated HelpMate Booking ${newBookingId})` : ""
          }.`,
          timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
        };
        return {
          ...l,
          status: newStatus,
          convertedBookingId: newBookingId,
          notesHistory: [newInteraction, ...l.notesHistory],
        };
      }
      return l;
    });

    setLeads(updated);

    if (selectedLead && selectedLead.id === leadId) {
      const currentUpdated = updated.find((u) => u.id === leadId);
      if (currentUpdated) setSelectedLead(currentUpdated);
    }

    setToastMessage(`Updated ${leadId} stage to "${newStatus}"!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDropLead = (e: React.DragEvent, targetStage: LeadStatus) => {
    e.preventDefault();
    e.stopPropagation();
    const dataId = e.dataTransfer.getData("text/plain");
    const leadId = dataId || draggedLeadRef.current || draggedLeadId;
    if (leadId) {
      handleUpdateStatus(leadId, targetStage);
    }
    draggedLeadRef.current = null;
    setDragOverStage(null);
    setDraggedLeadId(null);
  };

  // Reassign Agent
  const handleReassign = (leadId: string, newAssignee: string) => {
    const updated = leads.map((l) => {
      if (l.id === leadId) {
        const newInteraction: LeadInteraction = {
          id: `nt-${Date.now()}`,
          type: "Note",
          author: "Aman Verma (HQ)",
          text: `Reassigned lead ownership to ${newAssignee}.`,
          timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
        };
        return {
          ...l,
          assignedTo: newAssignee,
          notesHistory: [newInteraction, ...l.notesHistory],
        };
      }
      return l;
    });
    setLeads(updated);
    if (selectedLead && selectedLead.id === leadId) {
      const currentUpdated = updated.find((u) => u.id === leadId);
      if (currentUpdated) setSelectedLead(currentUpdated);
    }
  };

  // Add Note in Drawer
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLead || !newNoteText.trim()) return;

    const interaction: LeadInteraction = {
      id: `nt-${Date.now()}`,
      type: newNoteType,
      author: "Aman Verma (HQ)",
      text: newNoteText.trim(),
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
    };

    const updatedLeads = leads.map((l) => {
      if (l.id === selectedLead.id) {
        return {
          ...l,
          lastContacted: new Date().toISOString().slice(0, 16).replace("T", " "),
          notesHistory: [interaction, ...l.notesHistory],
        };
      }
      return l;
    });

    setLeads(updatedLeads);
    const updatedCurrent = updatedLeads.find((u) => u.id === selectedLead.id);
    if (updatedCurrent) setSelectedLead(updatedCurrent);
    setNewNoteText("");
  };

  // Convert Lead Trigger
  const handleConvertLead = (lead: LeadCRMItem) => {
    handleUpdateStatus(lead.id, "Converted");
    setToastMessage(`🎉 Lead ${lead.id} converted! Active HelpMate booking created.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Create Lead Form Submit
  const handleCreateLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `LEAD-2026-${Math.floor(911 + Math.random() * 80)}`;
    const createdDateStr = new Date().toISOString().slice(0, 16).replace("T", " ");

    const initialNote: LeadInteraction = {
      id: `nt-${Date.now()}`,
      type: "Note",
      author: "Aman Verma (HQ)",
      text: newLeadData.notesText || "New lead captured into Operations CRM.",
      timestamp: createdDateStr,
    };

    const newLead: LeadCRMItem = {
      id: newId,
      customerName: newLeadData.customerName,
      phone: newLeadData.phone.startsWith("+91") ? newLeadData.phone : `+91 ${newLeadData.phone}`,
      email: newLeadData.email || `${newLeadData.customerName.toLowerCase().replace(/\s+/g, ".")}@gmail.com`,
      locality: newLeadData.locality,
      address: newLeadData.address || `${newLeadData.locality}, Varanasi`,
      serviceCategory: newLeadData.serviceCategory,
      serviceRequested: newLeadData.serviceRequested || "General Service Request",
      leadSource: newLeadData.leadSource,
      leadScore: Math.floor(75 + Math.random() * 20),
      estimatedValue: parseFloat(newLeadData.estimatedValue) || 3500,
      status: "New Inquiry",
      priority: newLeadData.priority,
      assignedTo: newLeadData.assignedTo,
      followUpDate: `${createdDateStr.split(" ")[0]} 16:00`,
      createdDate: createdDateStr,
      lastContacted: createdDateStr,
      notesHistory: [initialNote],
    };

    setLeads([newLead, ...leads]);
    setIsCreateModalOpen(false);
    setNewLeadData({
      customerName: "",
      phone: "",
      email: "",
      locality: "Lanka, Varanasi",
      address: "",
      serviceCategory: "AC & Appliance Repair",
      serviceRequested: "",
      leadSource: "WhatsApp Inquiry",
      estimatedValue: "3500",
      priority: "High",
      assignedTo: "Aman Verma (HQ)",
      notesText: "",
    });
    setToastMessage(`Lead ${newId} created successfully!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Table Columns Definition
  const tableColumns: Column<LeadCRMItem>[] = [
    {
      key: "customer",
      header: "Lead ID & Customer",
      accessor: (row) => (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-xs text-slate-900 dark:text-white">{row.customerName}</span>
            <span className="text-[10px] font-mono font-semibold text-slate-400 dark:text-slate-500">
              {row.id}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 font-mono">
              <Phone className="w-3 h-3 text-brand-600" />
              {row.phone}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              {row.locality}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "service",
      header: "Service & Est. Value",
      accessor: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
            {row.serviceRequested}
          </span>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="font-black text-emerald-600 dark:text-emerald-400">
              ₹{row.estimatedValue.toLocaleString()}
            </span>
            <span className="text-slate-400 text-[10px]">({row.serviceCategory})</span>
          </div>
        </div>
      ),
    },
    {
      key: "source",
      header: "Source & Intent Gauge",
      accessor: (row) => (
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
            {getSourceIcon(row.leadSource)}
            {row.leadSource}
          </span>
          <div className="flex items-center gap-2">
            <div className="w-20 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  row.leadScore >= 80 ? "bg-emerald-500" : row.leadScore >= 60 ? "bg-amber-500" : "bg-rose-500"
                }`}
                style={{ width: `${row.leadScore}%` }}
              />
            </div>
            <span className="text-[10px] font-extrabold text-slate-600 dark:text-slate-300">
              {row.leadScore}%
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "stage",
      header: "Pipeline Stage Dropdown",
      accessor: (row) => (
        <select
          value={row.status}
          onChange={(e) => handleUpdateStatus(row.id, e.target.value as LeadStatus)}
          className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border focus:outline-none transition-all cursor-pointer ${
            row.status === "Converted"
              ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300"
              : row.status === "Lost"
              ? "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400"
              : "bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-950 dark:text-brand-300"
          }`}
        >
          {STAGES.map((stg) => (
            <option key={stg.label} value={stg.label}>
              {stg.label}
            </option>
          ))}
          <option value="Lost">Lost Inquiry</option>
        </select>
      ),
    },
    {
      key: "assigned",
      header: "Assigned Rep & Follow-up",
      accessor: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {row.assignedTo}
          </span>
          <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
            <Clock className="w-3 h-3 text-amber-500" />
            {row.followUpDate}
          </span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions & Project Links",
      accessor: (row) => (
        <div className="flex items-center gap-2">
          {/* Secondary styled Action trigger button */}
          <button
            type="button"
            onClick={() => setSelectedLead(row)}
            className="px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors"
          >
            View Lead
          </button>
          {row.convertedBookingId ? (
            <Link
              href={`/bookings?search=${row.convertedBookingId}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 transition-colors"
            >
              <CalendarCheck className="w-3 h-3 text-emerald-600" />
              Booking
            </Link>
          ) : row.status !== "Lost" ? (
            <button
              type="button"
              onClick={() => handleConvertLead(row)}
              title="Convert lead directly to Active Booking"
              className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Standard Clean Page Header (matching all other pages in HelpmateAdmin) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Target className="w-6 h-6 text-brand-600" />
            <span>Lead CRM</span>
          </h1>
        </div>

        {/* Header Controls (STRICT AGENTS.md RULE: ONLY ONE PRIMARY BUTTON ON PAGE HEADER) */}
        <div className="flex items-center gap-3 flex-wrap shrink-0">
          {/* View Mode Toggle (Secondary Buttons) */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                viewMode === "kanban"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban Board</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Data Table</span>
            </button>
          </div>

          {/* Export CSV (Secondary Button) */}
          <button
            type="button"
            onClick={() => alert("Exporting Lead CRM records...")}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>

          {/* SINGLE PRIMARY BUTTON FOR THE PAGE HEADER */}
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add New Lead</span>
          </button>
        </div>
      </div>

      {/* Standard KPI Metric Cards Banner */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Total Inquiries</span>
            <Target className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{totalLeads}</div>
          <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +14% vs last week
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Hot Intent Leads</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{hotLeadsCount}</div>
          <div className="text-[10px] text-slate-400 font-semibold mt-1">High Score & Immediate intent</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Pipeline Est. Value</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            ₹{pipelineValue.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 font-semibold mt-1">Active Pipeline Volume</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Conversion Rate</span>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">{conversionRate}%</div>
          <div className="text-[10px] text-slate-400 font-semibold mt-1">{convertedCount} converted to jobs</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider">Today's Follow-ups</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{overdueFollowups}</div>
          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-1">
            Pending agent call today
          </div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leads by customer name, phone, service, locality..."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-semibold"
          >
            <option value="All">All Pipeline Stages</option>
            {STAGES.map((s) => (
              <option key={s.label} value={s.label}>
                {s.label}
              </option>
            ))}
            <option value="Lost">Lost Inquiries</option>
          </select>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-semibold"
          >
            <option value="All">All Lead Sources</option>
            {LEAD_SOURCES.map((src) => (
              <option key={src} value={src}>
                {src}
              </option>
            ))}
          </select>

          {/* Locality Filter */}
          <select
            value={localityFilter}
            onChange={(e) => setLocalityFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-semibold"
          >
            <option value="All">All Varanasi Localities</option>
            {VARANASI_LOCALITIES.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* DYNAMIC VIEW AREA */}
      {viewMode === "kanban" ? (
        /* INTERACTIVE DRAG AND DROP KANBAN BOARD */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-6 select-none">
          {STAGES.map((stage) => {
            const stageLeads = filteredLeads.filter((l) => l.status === stage.label);
            const stageValueSum = stageLeads.reduce((sum, l) => sum + l.estimatedValue, 0);
            const isTargetDrop = dragOverStage === stage.label;

            return (
              <div
                key={stage.label}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragOverStage !== stage.label) setDragOverStage(stage.label);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  if (dragOverStage === stage.label) setDragOverStage(null);
                }}
                onDrop={(e) => handleDropLead(e, stage.label)}
                className={`flex flex-col rounded-3xl border p-3.5 transition-all duration-200 min-w-[270px] min-h-[500px] ${
                  isTargetDrop
                    ? "bg-brand-50/80 dark:bg-brand-950/40 border-brand-500 ring-2 ring-brand-500/40 scale-[1.01]"
                    : "bg-slate-50/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800"
                }`}
              >
                {/* Stage Column Header */}
                <div className="flex flex-col gap-1.5 mb-2.5 pb-2.5 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-xs">
                        {stage.stepNum}
                      </span>
                      <h3 className="text-xs font-black text-slate-900 dark:text-white tracking-tight">
                        {stage.label}
                      </h3>
                    </div>
                    <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${stage.headerBadgeBg}`}>
                      {stageLeads.length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="font-semibold">SLA: {stage.sla}</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400">₹{stageValueSum.toLocaleString()}</span>
                  </div>
                </div>

                {/* Drop Indicator hint */}
                {isTargetDrop && (
                  <div className="p-2 mb-3 rounded-xl border-2 border-dashed border-brand-500 bg-brand-100/50 dark:bg-brand-950/60 text-center animate-pulse">
                    <p className="text-[11px] font-black text-brand-700 dark:text-brand-300">
                      Release to move lead here
                    </p>
                  </div>
                )}

                {/* Lead Cards List */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragOverStage !== stage.label) setDragOverStage(stage.label);
                  }}
                  onDrop={(e) => handleDropLead(e, stage.label)}
                  className="space-y-3 flex-1 overflow-y-auto pr-0.5"
                >
                  {stageLeads.length === 0 ? (
                    <div className="h-32 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                      <Layers className="w-5 h-5 text-slate-300 dark:text-slate-700 mb-1" />
                      <p className="text-[11px] font-bold text-slate-400">No leads in stage</p>
                    </div>
                  ) : (
                    stageLeads.map((lead) => {
                      const isBeingDragged = draggedLeadId === lead.id;

                      return (
                        <div
                          key={lead.id}
                          draggable={true}
                          onDragStart={(e) => {
                            e.dataTransfer.setData("text/plain", lead.id);
                            e.dataTransfer.effectAllowed = "move";
                            draggedLeadRef.current = lead.id;
                            isDraggingRef.current = true;
                            setDraggedLeadId(lead.id);
                          }}
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (dragOverStage !== stage.label) setDragOverStage(stage.label);
                          }}
                          onDrop={(e) => handleDropLead(e, stage.label)}
                          onDragEnd={() => {
                            setTimeout(() => {
                              draggedLeadRef.current = null;
                              isDraggingRef.current = false;
                              setDraggedLeadId(null);
                              setDragOverStage(null);
                            }, 150);
                          }}
                          onClick={() => {
                            if (isDraggingRef.current) return;
                            setSelectedLead(lead);
                          }}
                          className={`group p-3.5 bg-white dark:bg-slate-900 border rounded-2xl shadow-xs hover:shadow-lg transition-all cursor-grab active:cursor-grabbing space-y-2.5 relative ${
                            isBeingDragged
                              ? "opacity-40 border-brand-500 border-dashed scale-95"
                              : "border-slate-200 dark:border-slate-800 hover:border-brand-500 dark:hover:border-brand-500"
                          }`}
                        >
                          {/* Drag Handle & Score Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <GripVertical className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-brand-500 transition-colors" />
                              <span className="text-[10px] font-mono font-bold text-slate-400">{lead.id}</span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {/* Lead Score Badge */}
                              <span
                                className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                                  lead.leadScore >= 80
                                    ? "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-300 border border-red-200"
                                    : lead.leadScore >= 60
                                    ? "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200"
                                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                }`}
                              >
                                {lead.leadScore}% Intent
                              </span>
                              {lead.priority === "Urgent" && (
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                                  URGENT
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Customer Name & Locality */}
                          <div>
                            <h4 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors flex items-center justify-between">
                              <span>{lead.customerName}</span>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:translate-x-0.5 transition-transform" />
                            </h4>
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span className="font-medium truncate">{lead.locality}</span>
                            </div>
                          </div>

                          {/* Service Requested & Price Tag */}
                          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 truncate max-w-[150px]">
                              {getSourceIcon(lead.leadSource)}
                              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                                {lead.serviceRequested}
                              </span>
                            </div>
                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 shrink-0">
                              ₹{lead.estimatedValue.toLocaleString()}
                            </span>
                          </div>

                          {/* Project Booking Reference Link if Converted */}
                          {lead.convertedBookingId && (
                            <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[10px]">
                              <span className="font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                                <CalendarCheck className="w-3 h-3" />
                                {lead.convertedBookingId}
                              </span>
                              <Link
                                href={`/bookings?search=${lead.convertedBookingId}`}
                                onClick={(e) => e.stopPropagation()}
                                className="font-bold text-emerald-800 hover:underline flex items-center gap-0.5"
                              >
                                View Job <ArrowUpRight className="w-3 h-3" />
                              </Link>
                            </div>
                          )}

                          {/* Footer: Quick Stage Shift Dropdown & Quick Actions */}
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400">
                            {/* Quick Stage Change Dropdown */}
                            <select
                              value={lead.status}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleUpdateStatus(lead.id, e.target.value as LeadStatus);
                              }}
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 outline-none cursor-pointer hover:border-brand-500"
                              title="Quickly shift lead stage"
                            >
                              {STAGES.map((s) => (
                                <option key={s.label} value={s.label}>
                                  Stage {s.stepNum}: {s.label}
                                </option>
                              ))}
                              <option value="Lost">Mark Lost</option>
                            </select>

                            {/* Quick Call & WhatsApp Shortcuts */}
                            <div className="flex items-center gap-1">
                              <a
                                href={`tel:${lead.phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-brand-50 hover:text-brand-600 transition-colors text-slate-600 dark:text-slate-300"
                                title="Call Customer"
                              >
                                <Phone className="w-3 h-3" />
                              </a>
                              <a
                                href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, "")}`}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-colors"
                                title="WhatsApp Customer"
                              >
                                <MessageSquare className="w-3 h-3" />
                              </a>
                            </div>
                          </div>

                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* DATA TABLE VIEW */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
          <DataTable data={filteredLeads} columns={tableColumns} searchPlaceholder="Filter lead records..." />
        </div>
      )}

      {/* LEAD DETAIL DRAWER (MODAL PORTAL) */}
      {selectedLead && (
        <Portal>
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
            <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
              
              {/* Drawer Header (Strict User Rule: ONLY ONE Primary Button in Drawer Header) */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
                    <Target className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-black text-slate-900 dark:text-white">
                        {selectedLead.customerName}
                      </h2>
                      <span className="text-xs font-mono text-slate-400">{selectedLead.id}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedLead.locality} • {selectedLead.serviceRequested}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Primary Action Button inside Drawer Header */}
                  {selectedLead.status !== "Converted" && selectedLead.status !== "Lost" ? (
                    <button
                      type="button"
                      onClick={() => handleConvertLead(selectedLead)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Convert to Booking
                    </button>
                  ) : (
                    <Link
                      href={`/bookings?search=${selectedLead.convertedBookingId || ""}`}
                      className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100"
                    >
                      <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
                      Booking: {selectedLead.convertedBookingId || "Converted"}
                    </Link>
                  )}

                  {/* Secondary Close Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedLead(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                
                {/* Visual Pipeline Progress Stepper */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-extrabold text-slate-900 dark:text-white">
                    <span>Helpmate Operational Stepper</span>
                    <span className="text-brand-600 dark:text-brand-400">{selectedLead.status}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 pt-1">
                    {STAGES.map((stg) => {
                      const isCurrent = selectedLead.status === stg.label;
                      const targetStageObj = STAGES.find((s) => s.label === selectedLead.status);
                      const isPast = (targetStageObj?.stepNum || 1) >= stg.stepNum;

                      return (
                        <button
                          key={stg.label}
                          type="button"
                          onClick={() => handleUpdateStatus(selectedLead.id, stg.label)}
                          className={`h-2 rounded-full transition-all ${
                            isCurrent
                              ? "bg-brand-600 ring-2 ring-brand-500/50"
                              : isPast
                              ? "bg-brand-400"
                              : "bg-slate-200 dark:bg-slate-700"
                          }`}
                          title={`Move stage to ${stg.label}`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Lead Summary Overview Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Est. Value</span>
                    <p className="text-base font-black text-emerald-600 dark:text-emerald-400">
                      ₹{selectedLead.estimatedValue.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Intent Score</span>
                    <p className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1">
                      {selectedLead.leadScore}%
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Priority</span>
                    <p className="text-xs font-black text-rose-600 mt-1">{selectedLead.priority}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Lead Source</span>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1 truncate">
                      {selectedLead.leadSource}
                    </p>
                  </div>
                </div>

                {/* Contact Information & Action Shortcuts */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Customer Contact Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 font-semibold">Phone:</span>
                      <p className="font-mono font-bold text-slate-900 dark:text-white">{selectedLead.phone}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold">Email:</span>
                      <p className="font-bold text-slate-900 dark:text-white">{selectedLead.email}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 font-semibold">Full Address:</span>
                      <p className="font-medium text-slate-800 dark:text-slate-200">{selectedLead.address}</p>
                    </div>
                  </div>

                  {/* Secondary Quick Contact Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <a
                      href={`tel:${selectedLead.phone}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-brand-600" />
                      Direct Call
                    </a>
                    <a
                      href={`https://wa.me/${selectedLead.phone.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 rounded-xl border border-emerald-200 dark:border-emerald-800 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      Send WhatsApp
                    </a>
                  </div>
                </div>

                {/* Assignee Selection Control */}
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">Assigned Representative:</span>
                  <select
                    value={selectedLead.assignedTo}
                    onChange={(e) => handleReassign(selectedLead.id, e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1 text-xs font-bold text-slate-900 dark:text-white"
                  >
                    {TEAM_MEMBERS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Activity & Interactions Feed */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center justify-between">
                    Activity & Interaction Logs
                    <span className="text-[11px] font-semibold text-slate-400">
                      {selectedLead.notesHistory.length} records
                    </span>
                  </h3>

                  {/* Add Log Form */}
                  <form onSubmit={handleAddNote} className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <select
                        value={newNoteType}
                        onChange={(e) => setNewNoteType(e.target.value as any)}
                        className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-white"
                      >
                        <option value="Note">Internal Note</option>
                        <option value="Call">Call Log</option>
                        <option value="WhatsApp">WhatsApp Chat</option>
                        <option value="Quotation">Quotation Sent</option>
                      </select>
                    </div>
                    <div className="relative">
                      <textarea
                        value={newNoteText}
                        onChange={(e) => setNewNoteText(e.target.value)}
                        placeholder="Log customer response, quotation note, or follow-up update..."
                        rows={2}
                        className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"
                      />
                      {/* Secondary Submit Button for Form inside Drawer */}
                      <button
                        type="submit"
                        disabled={!newNoteText.trim()}
                        className="absolute right-2.5 bottom-2.5 px-3 py-1 text-xs font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/80 hover:bg-brand-100 rounded-lg border border-brand-200 dark:border-brand-800 disabled:opacity-50"
                      >
                        Add Log
                      </button>
                    </div>
                  </form>

                  {/* Timeline Feed */}
                  <div className="space-y-3 relative pl-4 border-l-2 border-slate-200 dark:border-slate-800">
                    {selectedLead.notesHistory.map((item) => (
                      <div key={item.id} className="relative group">
                        <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-brand-500 ring-4 ring-white dark:ring-slate-900" />
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800/80 space-y-1">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-extrabold text-slate-900 dark:text-white">
                              {item.author} • <span className="text-brand-600 dark:text-brand-400">{item.type}</span>
                            </span>
                            <span className="text-slate-400 font-semibold">{item.timestamp}</span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300">{item.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* CREATE NEW LEAD MODAL */}
      {isCreateModalOpen && (
        <Portal>
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
              
              {/* Modal Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-brand-600" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">Add New Operations Lead</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleCreateLeadSubmit} className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Customer Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newLeadData.customerName}
                      onChange={(e) => setNewLeadData({ ...newLeadData, customerName: e.target.value })}
                      placeholder="e.g. Ramesh Chandra"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={newLeadData.phone}
                      onChange={(e) => setNewLeadData({ ...newLeadData, phone: e.target.value })}
                      placeholder="+91 98390 XXXXX"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Varanasi Locality
                    </label>
                    <select
                      value={newLeadData.locality.split(",")[0]}
                      onChange={(e) => setNewLeadData({ ...newLeadData, locality: `${e.target.value}, Varanasi` })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-semibold"
                    >
                      {VARANASI_LOCALITIES.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Lead Source
                    </label>
                    <select
                      value={newLeadData.leadSource}
                      onChange={(e) => setNewLeadData({ ...newLeadData, leadSource: e.target.value as any })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 font-semibold"
                    >
                      {LEAD_SOURCES.map((src) => (
                        <option key={src} value={src}>
                          {src}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Service Requested *
                    </label>
                    <input
                      type="text"
                      required
                      value={newLeadData.serviceRequested}
                      onChange={(e) => setNewLeadData({ ...newLeadData, serviceRequested: e.target.value })}
                      placeholder="e.g. AC Deep Servicing"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Est. Value (₹)
                    </label>
                    <input
                      type="number"
                      value={newLeadData.estimatedValue}
                      onChange={(e) => setNewLeadData({ ...newLeadData, estimatedValue: e.target.value })}
                      placeholder="3500"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Initial Lead Notes
                  </label>
                  <textarea
                    value={newLeadData.notesText}
                    onChange={(e) => setNewLeadData({ ...newLeadData, notesText: e.target.value })}
                    placeholder="Customer requirement details, preferred time slot..."
                    rows={2}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                {/* Modal Footer Controls (STRICT USER RULE COMPLIANCE: ONLY ONE PRIMARY BUTTON) */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  {/* Single Primary Button in Modal Footer */}
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-black text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md transition-all active:scale-95"
                  >
                    Save Lead
                  </button>
                </div>
              </form>

            </div>
          </div>
        </Portal>
      )}

    </div>
  );
}
