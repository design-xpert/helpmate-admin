"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRbac } from "@/context/RbacContext";
import { CustomSelect } from "@/components/CustomSelect";
import { initialSupportTickets, SupportTicketItem, SupportMessage, officeAdminsList } from "@/lib/mockData";
import {
  ArrowLeft,
  Headphones,
  MessageSquare,
  FileText,
  PhoneCall,
  Send,
  User,
  Phone,
  Mail,
  ExternalLink,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Tag,
  Calendar,
  UserCheck,
} from "lucide-react";

export default function SupportTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const ticketId = resolvedParams.id;
  const { role, currentUser } = useRbac();

  const [tickets, setTickets] = useState<SupportTicketItem[]>(initialSupportTickets);
  const ticket = tickets.find((t) => t.id.toLowerCase() === ticketId.toLowerCase()) || tickets[0];

  const [activeTab, setActiveTab] = useState<"chat" | "notes" | "calls">("chat");
  const [newMessageText, setNewMessageText] = useState("");
  const [newInternalNote, setNewInternalNote] = useState("");

  const handleUpdateStatus = (
    status: "Replied" | "Customer Replied" | "In Progress" | "In Review" | "Answered" | "Closed"
  ) => {
    setTickets((prev) => prev.map((t) => (t.id === ticket.id ? { ...t, status } : t)));
  };

  const handleAssignAdmin = (adminName: string) => {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticket.id
          ? {
              ...t,
              assignedAdmin: adminName || undefined,
              status: !adminName ? "In Review" : t.status,
            }
          : t
      )
    );
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;

    const newMsg: SupportMessage = {
      id: `msg-${Date.now()}`,
      sender: "Support Agent",
      senderName: "HelpMate Support Representative",
      text: newMessageText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticket.id
          ? {
              ...t,
              status: "Replied",
              messages: [...t.messages, newMsg],
              lastUpdated: new Date().toISOString(),
            }
          : t
      )
    );

    setNewMessageText("");
  };

  const handleSimulateCustomerReply = () => {
    const custMsg: SupportMessage = {
      id: `msg-${Date.now()}`,
      sender: "Customer",
      senderName: ticket.customerName,
      text: "Customer Reply: Thank you for following up. Please let me know when the technician will arrive.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticket.id
          ? {
              ...t,
              status: "Customer Replied",
              messages: [...t.messages, custMsg],
              lastUpdated: new Date().toISOString(),
            }
          : t
      )
    );
  };

  const handleAddInternalNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInternalNote.trim()) return;

    const updatedNotes = [...(ticket.internalNotes || []), newInternalNote.trim()];

    setTickets((prev) =>
      prev.map((t) => (t.id === ticket.id ? { ...t, internalNotes: updatedNotes } : t))
    );

    setNewInternalNote("");
  };

  // Office Admin can view unassigned tickets or tickets assigned to themselves, but restricted if assigned to another Office Admin
  const isAssignedToOther = ticket.assignedAdmin && ticket.assignedAdmin !== currentUser.name;
  if (role === "Office Admin" && isAssignedToOther) {
    return (
      <div className="p-8 text-center space-y-4 max-w-lg mx-auto my-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl">
        <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto border border-amber-300 dark:border-amber-800">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Ticket Assigned to Another Admin</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          This support ticket is currently assigned to <strong>{ticket.assignedAdmin}</strong>. You can only access tickets assigned to yourself or unassigned tickets.
        </p>
        <Link
          href="/support"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-auto mx-auto pb-12">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          {/* Secondary Back Button */}
          <Link
            href="/support"
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 text-xs font-extrabold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                {ticket.id}
              </h1>

              {/* Status Badge */}
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 border ${
                  ticket.status === "Replied"
                    ? "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800"
                    : ticket.status === "Customer Replied"
                    ? "bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-800 shadow-xs"
                    : ticket.status === "In Progress"
                    ? "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800"
                    : ticket.status === "In Review"
                    ? "bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-950/80 dark:text-orange-300 dark:border-orange-800"
                    : ticket.status === "Answered"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800"
                    : "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    ticket.status === "Customer Replied" ? "bg-purple-600 animate-pulse" : "bg-current"
                  }`}
                />
                <span>{ticket.status}</span>
              </span>

              {/* Priority Tag */}
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  ticket.priority === "High"
                    ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300"
                    : ticket.priority === "Medium"
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300"
                    : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300"
                }`}
              >
                {ticket.priority} Priority
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Category: {ticket.issueCategory} • Created on {new Date(ticket.createdDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Ticket Details Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Complaint Overview Card */}
        <div className="md:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-brand-600 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Headphones className="w-5 h-5" />
            <h2 className="font-extrabold text-slate-900 dark:text-white text-base">Complaint & Issue Overview</h2>
          </div>

          <div>
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
              Subject Header
            </span>
            <h3 className="text-base font-black text-slate-900 dark:text-white">{ticket.subject}</h3>
          </div>

          <div>
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
              Detailed Description
            </span>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium leading-relaxed">
              {ticket.description}
            </div>
          </div>

          {/* Quick Status Switcher */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs font-extrabold text-slate-600 dark:text-slate-400">
              Update Ticket Status:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(["Replied", "Customer Replied", "In Progress", "In Review", "Answered", "Closed"] as const).map((st) => {
                const isSelected = ticket.status === st;

                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleUpdateStatus(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-colors cursor-pointer border ${
                      isSelected
                        ? st === "Replied"
                          ? "bg-amber-500 text-white border-amber-600 font-black shadow-xs"
                          : st === "Customer Replied"
                          ? "bg-purple-600 text-white border-purple-700 font-black shadow-xs"
                          : st === "In Progress"
                          ? "bg-blue-600 text-white border-blue-700 font-black shadow-xs"
                          : st === "In Review"
                          ? "bg-orange-500 text-white border-orange-600 font-black shadow-xs"
                          : st === "Answered"
                          ? "bg-emerald-600 text-white border-emerald-700 font-black shadow-xs"
                          : "bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-black shadow-xs"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {st}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Customer & Booking Meta Sidebar Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
            <User className="w-5 h-5 text-brand-600" />
            <h2 className="font-extrabold text-base">Customer Info</h2>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Customer Name</span>
              <span className="font-black text-slate-900 dark:text-white text-sm">{ticket.customerName}</span>
            </div>

            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Phone Number</span>
              <a
                href={`tel:${ticket.customerPhone}`}
                className="font-mono font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 mt-0.5"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{ticket.customerPhone}</span>
              </a>
            </div>

            {ticket.customerEmail && (
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Email Address</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{ticket.customerEmail}</span>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Related Booking</span>
              {ticket.bookingId ? (
                <Link
                  href={`/bookings/${ticket.bookingId}`}
                  className="font-mono font-extrabold text-purple-700 dark:text-purple-300 hover:underline flex items-center gap-1 mt-1 text-xs"
                >
                  <span>{ticket.bookingId}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <span className="text-slate-400 font-semibold">General Inquiry</span>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Assigned Office Admin
              </span>
              <CustomSelect
                options={[
                  { label: "Unassigned", value: "" },
                  ...officeAdminsList.map((admin) => ({ label: admin, value: admin })),
                ]}
                value={ticket.assignedAdmin || ""}
                onChange={(val) => handleAssignAdmin(val)}
              />
              <p className="text-[10px] text-slate-400 font-medium">
                Assigned tickets are visible to Super Admin and the assigned Office Admin.
              </p>
            </div>

            {ticket.assignedAgent && (
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Assigned Support Agent</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{ticket.assignedAgent}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Resolution Channels Navigation Workspace */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6 shadow-xs">
        {/* Workspace Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("chat")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "chat"
                ? "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800 shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <MessageSquare className="w-4 h-4 text-brand-600" />
            <span>Live Chat Resolution Timeline ({ticket.messages.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("notes")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "notes"
                ? "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4 text-purple-600" />
            <span>Internal Dispatch Notes ({ticket.internalNotes?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("calls")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "calls"
                ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-xs"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <PhoneCall className="w-4 h-4 text-amber-600" />
            <span>Call Records ({ticket.callLogs.length})</span>
          </button>
        </div>

        {/* TAB 1: LIVE CHAT TIMELINE */}
        {activeTab === "chat" && (
          <div className="space-y-5">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 min-h-[220px] max-h-[420px] overflow-y-auto space-y-4 custom-scrollbar">
              {ticket.messages.length === 0 ? (
                <p className="text-center text-xs text-slate-400 py-10">
                  No chat messages yet. Use the response form below to send the first message to customer.
                </p>
              ) : (
                ticket.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-2xl max-w-lg space-y-1.5 text-xs ${
                      msg.sender === "Support Agent"
                        ? "bg-brand-600 text-white ml-auto shadow-md"
                        : "bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 mr-auto shadow-xs"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] opacity-80 font-bold border-b border-white/20 pb-1 mb-1">
                      <span>{msg.senderName} ({msg.sender})</span>
                      <span>{msg.timestamp}</span>
                    </div>
                    <p className="leading-relaxed font-medium">{msg.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Response Input Form (Contains the Single Primary Button for the page) */}
            <form onSubmit={handleSendMessage} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                placeholder="Type response message to send directly to customer..."
                className="flex-1 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              />
              <div className="flex gap-2 shrink-0">
                {/* Single Primary Button on the Page */}
                <button
                  type="submit"
                  className="px-6 py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl text-xs font-extrabold shadow-lux flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Response</span>
                </button>

                {/* Secondary Action */}
                <button
                  type="button"
                  onClick={handleSimulateCustomerReply}
                  className="px-4 py-3.5 bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 rounded-2xl text-xs font-extrabold border border-purple-200 dark:border-purple-800 transition-colors cursor-pointer"
                  title="Simulate incoming customer reply message"
                >
                  + Customer Reply
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 2: INTERNAL SUPPORT NOTES */}
        {activeTab === "notes" && (
          <div className="space-y-4 text-xs">
            <div className="space-y-2">
              <span className="font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] block">
                Internal Dispatch Notes Feed
              </span>

              {ticket.internalNotes?.map((note, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 font-medium"
                >
                  📌 {note}
                </div>
              ))}
            </div>

            <form onSubmit={handleAddInternalNote} className="flex gap-2">
              <input
                type="text"
                value={newInternalNote}
                onChange={(e) => setNewInternalNote(e.target.value)}
                placeholder="Add internal note visible only to admins & dispatch..."
                className="flex-1 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500 font-medium"
              />
              <button
                type="submit"
                className="px-5 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-2xl cursor-pointer"
              >
                Add Internal Note
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: CALL LOGS */}
        {activeTab === "calls" && (
          <div className="space-y-4 text-xs">
            <span className="font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] block">
              Support Agent Phone Call History
            </span>

            {ticket.callLogs.length === 0 ? (
              <p className="text-center text-slate-400 py-8">No phone call logs recorded for this ticket.</p>
            ) : (
              ticket.callLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2 text-amber-950 dark:text-amber-200"
                >
                  <div className="flex items-center justify-between font-bold text-xs">
                    <span>Agent: {log.agentName}</span>
                    <span>Duration: {log.durationSeconds}s • {log.timestamp}</span>
                  </div>
                  <div className="font-medium text-xs">Outcome: <span className="font-bold">{log.outcome}</span></div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">{log.notes}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
