"use client";

import { useState, useMemo } from "react";
import { useRbac } from "@/context/RbacContext";
import { CustomSelect } from "@/components/CustomSelect";
import Link from "next/link";
import Image from "next/image";
import { DataTable, Column } from "@/components/DataTable";
import { RowActionMenu } from "@/components/RowActionMenu";
import {
  initialSupportTickets,
  SupportTicketItem,
  SupportMessage,
  SupportCallLog,
  officeAdminsList,
  officeAdminProfiles,
  OfficeAdminProfile,
} from "@/lib/mockData";
import {
  HelpCircle,
  MessageSquare,
  Phone,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Eye,
  Plus,
  User,
  ExternalLink,
  Send,
  PhoneCall,
  ShieldCheck,
  AlertCircle,
  FileText,
  X,
  MessageCircle,
  Headphones,
  UserCheck,
  ShieldAlert,
  UserPlus,
  UserX,
  Building2,
  Mail,
  MapPin,
  Check,
} from "lucide-react";
import { Portal } from "@/components/Portal";

export default function SupportPage() {
  const { role, currentUser } = useRbac();
  const isSuperAdmin = role === "Super Admin";

  const [tickets, setTickets] = useState<SupportTicketItem[]>(initialSupportTickets);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [priorityFilter, setPriorityFilter] = useState<string>("All");
  const [issueFilter, setIssueFilter] = useState<string>("All");

  // Profile & Reassign Modal states
  const [selectedAdminForProfile, setSelectedAdminForProfile] = useState<OfficeAdminProfile | null>(null);
  const [ticketToReassign, setTicketToReassign] = useState<SupportTicketItem | null>(null);

  const [selectedTicket, setSelectedTicket] = useState<SupportTicketItem | null>(null);
  const [activeTab, setActiveTab] = useState<"chat" | "notes">("chat");

  // Chat message state
  const [newMessageText, setNewMessageText] = useState("");

  // Internal notes state
  const [newInternalNote, setNewInternalNote] = useState("");

  const handleAssignAdmin = (ticketId: string, adminName: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? {
            ...t,
            assignedAdmin: adminName || undefined,
            status: !adminName ? "In Review" : t.status,
          }
          : t
      )
    );
    setTicketToReassign(null);
  };

  // RBAC Ticket Visibility Filter
  // Super Admin: sees ALL tickets across all Office Admins
  // Office Admin: sees tickets assigned to self (assignedAdmin === currentUser.name) + unassigned tickets
  const visibleTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (isSuperAdmin) return true;
      if (!t.assignedAdmin) return true;
      return t.assignedAdmin === currentUser.name || (t.assignedAgent && t.assignedAgent.includes(currentUser.name));
    });
  }, [tickets, isSuperAdmin, currentUser.name]);

  // KPI Calculations based on visible tickets
  const totalTicketsCount = visibleTickets.length;
  const highPriorityCount = visibleTickets.filter((t) => t.priority === "High").length;
  const mediumPriorityCount = visibleTickets.filter((t) => t.priority === "Medium").length;
  const lowPriorityCount = visibleTickets.filter((t) => t.priority === "Low").length;

  const repliedCount = visibleTickets.filter((t) => t.status === "Replied").length;
  const customerRepliedCount = visibleTickets.filter((t) => t.status === "Customer Replied").length;
  const answeredCount = visibleTickets.filter((t) => t.status === "Answered" || t.status === "Closed").length;

  const filteredTickets = useMemo(() => {
    return visibleTickets.filter((t) => {
      // Status Filter
      if (statusFilter !== "All") {
        if (statusFilter === "Answered") {
          if (t.status !== "Answered" && t.status !== "Closed") return false;
        } else if (t.status !== statusFilter) {
          return false;
        }
      }

      // Priority Filter
      if (priorityFilter !== "All" && t.priority !== priorityFilter) return false;

      // Issue Category Filter
      if (issueFilter !== "All" && t.issueCategory !== issueFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = t.id.toLowerCase().includes(q);
        const matchesCust = t.customerName.toLowerCase().includes(q);
        const matchesPhone = t.customerPhone.includes(q);
        const matchesBooking = t.bookingId?.toLowerCase().includes(q);
        const matchesSubject = t.subject.toLowerCase().includes(q);
        const matchesAdmin = t.assignedAdmin ? t.assignedAdmin.toLowerCase().includes(q) : false;
        if (!matchesId && !matchesCust && !matchesPhone && !matchesBooking && !matchesSubject && !matchesAdmin) return false;
      }

      return true;
    });
  }, [visibleTickets, statusFilter, priorityFilter, issueFilter, searchQuery]);

  const columns = useMemo<Column<SupportTicketItem>[]>(() => {
    const cols: Column<SupportTicketItem>[] = [
      {
        key: "id",
        header: "Ticket ID",
        accessor: (row) => (
          <Link
            href={`/support/${row.id}`}
            className="font-mono font-black text-brand-600 dark:text-brand-400 hover:underline text-xs cursor-pointer"
          >
            {row.id}
          </Link>
        ),
        sortable: true,
      },
      {
        key: "customerName",
        header: "Customer & Phone",
        accessor: (row) => (
          <div>
            <div className="font-extrabold text-slate-900 dark:text-white text-xs">{row.customerName}</div>
            <div className="font-mono text-[11px] text-slate-500">{row.customerPhone}</div>
          </div>
        ),
        sortable: true,
      },
      {
        key: "bookingId",
        header: "Related Booking",
        accessor: (row) =>
          row.bookingId ? (
            <Link
              href={`/bookings/${row.bookingId}`}
              className="font-mono text-xs font-extrabold text-purple-700 dark:text-purple-300 hover:underline"
            >
              {row.bookingId}
            </Link>
          ) : (
            <span className="text-[11px] text-slate-400">General Inquiry</span>
          ),
        sortable: true,
      },
      {
        key: "issueCategory",
        header: "Issue Category",
        accessor: (row) => (
          <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
            {row.issueCategory}
          </span>
        ),
        sortable: true,
      },
      {
        key: "subject",
        header: "Subject & Complaint Summary",
        accessor: (row) => (
          <div className="max-w-xs space-y-0.5">
            <div className="font-bold text-slate-900 dark:text-white text-xs truncate" title={row.subject}>
              {row.subject}
            </div>
            <p className="text-[11px] text-slate-500 line-clamp-1">{row.description}</p>
          </div>
        ),
      },
      {
        key: "priority",
        header: "Priority",
        accessor: (row) => (
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${row.priority === "High"
                ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300"
                : row.priority === "Medium"
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300"
                  : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300"
              }`}
          >
            {row.priority}
          </span>
        ),
        sortable: true,
      },
      {
        key: "status",
        header: "Ticket Status",
        accessor: (row) => {
          return (
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 border ${row.status === "Replied"
                  ? "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800"
                  : row.status === "Customer Replied"
                    ? "bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-800 shadow-xs"
                    : row.status === "In Progress"
                      ? "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800"
                      : row.status === "In Review"
                        ? "bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-950/80 dark:text-orange-300 dark:border-orange-800"
                        : row.status === "Answered"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800"
                          : "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${row.status === "Customer Replied" ? "bg-purple-600 animate-pulse" : "bg-current"
                  }`}
              />
              <span>{row.status}</span>
            </span>
          );
        },
        sortable: true,
      },
    ];

    // Only Super Admin sees the "Assigned Office Admin" column
    if (isSuperAdmin) {
      cols.push({
        key: "assignedAdmin",
        header: "Assigned Office Admin",
        accessor: (row) => {
          const assignedAdminName = row.assignedAdmin;
          if (!assignedAdminName) {
            return (
              <button
                type="button"
                onClick={() => setTicketToReassign(row)}
                className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Click to assign Office Admin"
              >
                <UserX className="w-3.5 h-3.5 text-slate-400" />
                <span>Not Assigned</span>
              </button>
            );
          }

          const adminProfile = officeAdminProfiles[assignedAdminName];

          return (
            <button
              type="button"
              onClick={() =>
                setSelectedAdminForProfile(
                  adminProfile || {
                    id: `adm-${assignedAdminName}`,
                    name: assignedAdminName,
                    role: "Office Admin",
                    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(assignedAdminName)}&background=6366f1&color=fff`,
                    email: `${assignedAdminName.toLowerCase().replace(" ", ".")}@helpmate.com`,
                    phone: "+91 98390 00000",
                    department: "Operations & Support Desk",
                    location: "Varanasi HQ",
                    assignedTicketsCount: tickets.filter((t) => t.assignedAdmin === assignedAdminName).length,
                  }
                )
              }
              className="inline-flex items-center gap-2 p-1 pr-3 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer group"
              title={`Click to view profile of ${assignedAdminName}`}
            >
              <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0 ring-2 ring-brand-500/40">
                <Image
                  src={
                    adminProfile?.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(assignedAdminName)}&background=6366f1&color=fff`
                  }
                  alt={assignedAdminName}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400">
                {assignedAdminName}
              </span>
            </button>
          );
        },
        sortable: true,
      });
    }

    // Actions Column
    cols.push({
      key: "actions",
      header: "Actions",
      accessor: (row) => (
        <RowActionMenu
          forceDropdown={true}
          actions={[
            {
              label: "View Ticket",
              icon: Eye,
              href: `/support/${row.id}`,
            },
            {
              label: "Assign",
              icon: UserPlus,
              onClick: () => setTicketToReassign(row),
            },
          ]}
        />
      ),
    });

    return cols;
  }, [isSuperAdmin, tickets]);

  return (
    <div className="space-y-6">
      {/* Header Banner & Office Admin Desk Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Headphones className="w-6 h-6 text-brand-600" />
              <span>Customer Support</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[10px] font-black uppercase">
              Office Admin Console
            </span>
          </div>
        </div>

        {/* Office Admin Shift Badge & Quick Ticket Creation Button */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-xs">
            <UserCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <div>
              <div className="font-extrabold text-slate-900 dark:text-white text-[11px]">Priya Sharma (Office Admin)</div>
              <div className="text-[10px] text-slate-500 font-mono">Active Duty • Varanasi HQ</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Executive KPI Cards - Uniform & Clickable Filter Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Support Tickets */}
        <button
          type="button"
          onClick={() => setStatusFilter("All")}
          className={`p-4 rounded-2xl border space-y-2 shadow-xs flex flex-col justify-between text-left transition-all cursor-pointer ${statusFilter === "All"
              ? "bg-brand-50/40 dark:bg-brand-950/40 border-brand-500 ring-2 ring-brand-500/30"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-brand-300 dark:hover:border-brand-800"
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Total Tickets</span>
            <div className="p-2 rounded-xl bg-brand-50 text-brand-600 border border-brand-200 dark:bg-brand-950 dark:border-brand-900">
              <Headphones className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-xl font-black text-slate-900 dark:text-white">{totalTicketsCount} Tickets</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="text-rose-600 font-extrabold">High: {highPriorityCount}</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-amber-600 font-extrabold">Med: {mediumPriorityCount}</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-blue-600 font-extrabold">Low: {lowPriorityCount}</span>
          </div>
        </button>

        {/* Card 2: Agent Replied */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === "Replied" ? "All" : "Replied")}
          className={`p-4 rounded-2xl border space-y-2 shadow-xs flex flex-col justify-between text-left transition-all cursor-pointer ${statusFilter === "Replied"
              ? "bg-amber-50/40 dark:bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/30"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-300 dark:hover:border-amber-800"
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Agent Replied</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950 dark:border-amber-900">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-xl font-black text-amber-600 dark:text-amber-400">{repliedCount} Replied</span>
          </div>
          <div className="text-[10px] font-extrabold text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span>Active support responses</span>
            {statusFilter === "Replied" && <span className="text-amber-600 font-extrabold">Active</span>}
          </div>
        </button>

        {/* Card 3: Customer Replied */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === "Customer Replied" ? "All" : "Customer Replied")}
          className={`p-4 rounded-2xl border space-y-2 shadow-xs flex flex-col justify-between text-left transition-all cursor-pointer ${statusFilter === "Customer Replied"
              ? "bg-purple-50/40 dark:bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/30"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800"
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Customer Replied</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 dark:bg-purple-950 dark:border-purple-900">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-xl font-black text-purple-600 dark:text-purple-400">{customerRepliedCount} Pending Agent</span>
          </div>
          <div className="text-[10px] font-extrabold text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span>Awaiting agent response</span>
            {statusFilter === "Customer Replied" && <span className="text-purple-600 font-extrabold">Active</span>}
          </div>
        </button>

        {/* Card 4: Answered Tickets */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === "Answered" ? "All" : "Answered")}
          className={`p-4 rounded-2xl border space-y-2 shadow-xs flex flex-col justify-between text-left transition-all cursor-pointer ${statusFilter === "Answered"
              ? "bg-emerald-50/40 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-800"
            }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Answered</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950 dark:border-emerald-900">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">{answeredCount} Answered</span>
          </div>
          <div className="text-[10px] font-extrabold text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span>Successfully resolved</span>
            {statusFilter === "Answered" && <span className="text-emerald-600 font-extrabold">Active</span>}
          </div>
        </button>
      </div>



      {/* Main Support DataTable */}
      <DataTable columns={columns} data={filteredTickets} />

      {/* MODAL 1: Office Admin Profile Card Modal */}
      {selectedAdminForProfile && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 outline-none">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-brand-600" />
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Office Admin Profile</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedAdminForProfile(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 ring-4 ring-brand-500/30 shadow-md">
                  {selectedAdminForProfile.avatar ? (
                    <Image
                      src={selectedAdminForProfile.avatar}
                      alt={selectedAdminForProfile.name}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white">{selectedAdminForProfile.name}</h4>
                  <span className="px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 text-[11px] font-extrabold border border-brand-200 dark:border-brand-800 inline-block mt-0.5">
                    {selectedAdminForProfile.role}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Building2 className="w-4 h-4 text-purple-600 shrink-0" />
                  <span className="font-bold">Dept:</span> {selectedAdminForProfile.department}
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Mail className="w-4 h-4 text-brand-600 shrink-0" />
                  <span className="font-bold">Email:</span> {selectedAdminForProfile.email}
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold">Phone:</span> {selectedAdminForProfile.phone}
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-bold">Location:</span> {selectedAdminForProfile.location}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-extrabold">
                  <span>Assigned Support Tickets:</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-200 font-black">
                    {tickets.filter((t) => t.assignedAdmin === selectedAdminForProfile.name).length} Tickets
                  </span>
                </div>
              </div>

              {/* Secondary Close Button */}
              <button
                type="button"
                onClick={() => setSelectedAdminForProfile(null)}
                className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-2xl text-xs font-extrabold cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                Close Profile
              </button>
            </div>
          </div>
        </Portal>
      )}

      {/* MODAL 2: Reassign Office Admin Modal */}
      {ticketToReassign && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 outline-none">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-purple-600" />
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Assign Office Admin</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setTicketToReassign(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                  <span>Ticket ID:</span>
                  <span className="font-mono text-brand-600">{ticketToReassign.id}</span>
                </div>
                <div className="flex justify-between font-medium text-slate-600 dark:text-slate-400">
                  <span>Customer:</span>
                  <span>{ticketToReassign.customerName}</span>
                </div>
                <div className="flex justify-between font-medium text-slate-600 dark:text-slate-400">
                  <span>Currently Assigned:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {ticketToReassign.assignedAdmin || "Not Assigned"}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                  Select New Office Admin:
                </label>
                <CustomSelect
                  options={[
                    { label: "Unassigned", value: "" },
                    ...officeAdminsList.map((admin) => ({ label: admin, value: admin })),
                  ]}
                  value={ticketToReassign.assignedAdmin || ""}
                  onChange={(val) => handleAssignAdmin(ticketToReassign.id, val)}
                />
                <p className="text-[11px] text-slate-400 font-medium pt-1">
                  Assigning to another Office Admin will immediately restrict ticket access to Super Admin and that assigned Office Admin.
                </p>
              </div>

              <div className="flex gap-2">
                {/* Secondary Button */}
                <button
                  type="button"
                  onClick={() => setTicketToReassign(null)}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 rounded-2xl text-xs font-extrabold cursor-pointer border border-slate-200 dark:border-slate-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
