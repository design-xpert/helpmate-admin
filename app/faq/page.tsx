"use client";

import { useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Search,
  ChevronDown,
  ChevronUp,
  MessageCircleQuestion,
  Eye,
  EyeOff,
  Tag,
  ArrowUp,
  ArrowDown,
  FileText,
} from "lucide-react";
import { Portal } from "@/components/Portal";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  isActive: boolean;
  sortOrder: number;
}

interface FaqSectionHeader {
  badge: string;
  title: string;
  subtitle: string;
  viewAllText: string;
  viewAllLink: string;
}

const CATEGORIES = ["General", "Booking", "Payment", "Cancellation", "Services", "Account", "Safety"];

const initialHeader: FaqSectionHeader = {
  badge: "CLEAR INFORMATION",
  title: "Frequently Asked Questions",
  subtitle: "Everything you need to know about our luxury booking guidelines and services.",
  viewAllText: "View all FAQs →",
  viewAllLink: "/faqs",
};

const initialFaqs: FaqItem[] = [
  { id: "faq-1", question: "What is HelpMate's Minimal Luxury standard?", answer: "HelpMate's Minimal Luxury standard ensures every service is delivered with premium-grade equipment, uniformed and background-verified professionals, and a satisfaction guarantee. We focus on quality, punctuality, and a seamless experience at every booking.", category: "General", isActive: true, sortOrder: 1 },
  { id: "faq-2", question: "How do I cancel or reschedule a booking?", answer: "You can cancel or reschedule a booking up to 2 hours before the scheduled time through the app or website. Free cancellation is available within this window. Late cancellations may attract a nominal fee of ₹50.", category: "Cancellation", isActive: true, sortOrder: 2 },
  { id: "faq-3", question: "Are there any hidden charges?", answer: "No. HelpMate follows a transparent pricing policy. The price shown at checkout is the final amount you pay — no hidden fees, service charges, or surprise costs. GST is included in all displayed prices.", category: "Payment", isActive: true, sortOrder: 3 },
  { id: "faq-4", question: "How does the HelpMate Wallet and membership work?", answer: "HelpMate Wallet lets you store credits and pay instantly. Membership plans (Silver, Gold, Platinum) offer exclusive discounts, priority booking, and dedicated account managers. Credits earned on every booking can be redeemed on future services.", category: "Account", isActive: true, sortOrder: 4 },
  { id: "faq-5", question: "Are all professionals background-verified?", answer: "Yes. Every HelpMate partner undergoes Aadhaar-based identity verification, police clearance check, and skill assessment before being onboarded. You can view a professional's verification badge on their profile before confirming a booking.", category: "Safety", isActive: true, sortOrder: 5 },
  { id: "faq-6", question: "What areas does HelpMate currently serve?", answer: "HelpMate currently operates in Varanasi across 6 key zones — Lanka, Godowlia, Cantonment, Sigra, Sarnath, and Pandeypur — covering 30+ localities. We are expanding to new cities shortly.", category: "General", isActive: true, sortOrder: 6 },
  { id: "faq-7", question: "How long does a typical deep cleaning service take?", answer: "A standard deep cleaning for a 2BHK apartment typically takes 4–6 hours. The duration depends on the home size, add-on services selected, and current condition. Our live calculator shows exact time estimates before you book.", category: "Services", isActive: false, sortOrder: 7 },
  { id: "faq-8", question: "What payment methods are accepted?", answer: "We accept all major UPI apps (GPay, PhonePe, Paytm), credit/debit cards, net banking, and HelpMate Wallet credits. Cash payment is also available for select services.", category: "Payment", isActive: true, sortOrder: 8 },
];

export default function FaqPage() {
  const [faqs, setFaqs] = useState<FaqItem[]>(initialFaqs);
  const [header, setHeader] = useState<FaqSectionHeader>(initialHeader);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingHeader, setEditingHeader] = useState(false);
  const [headerDraft, setHeaderDraft] = useState<FaqSectionHeader>(initialHeader);

  const [faqModal, setFaqModal] = useState<{ open: boolean; mode: "add" | "edit"; data: Partial<FaqItem> }>({ open: false, mode: "add", data: {} });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string; question: string } | null>(null);

  const filtered = faqs
    .filter((f) => selectedCategory === "All" || f.category === selectedCategory)
    .filter((f) => !searchQuery || f.question.toLowerCase().includes(searchQuery.toLowerCase()) || f.answer.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const saveFaq = () => {
    const d = faqModal.data;
    if (!d.question || !d.answer) return;
    if (faqModal.mode === "add") {
      const newFaq: FaqItem = {
        id: `faq-${Date.now()}`,
        question: d.question!,
        answer: d.answer!,
        category: d.category || "General",
        isActive: d.isActive ?? true,
        sortOrder: d.sortOrder || faqs.length + 1,
      };
      setFaqs([...faqs, newFaq]);
    } else {
      setFaqs(faqs.map((f) => f.id === d.id ? { ...f, ...d } as FaqItem : f));
    }
    setFaqModal({ open: false, mode: "add", data: {} });
  };

  const deleteFaq = () => {
    if (!deleteModal) return;
    setFaqs(faqs.filter((f) => f.id !== deleteModal.id));
    setDeleteModal(null);
  };

  const toggleActive = (id: string) =>
    setFaqs(faqs.map((f) => f.id === id ? { ...f, isActive: !f.isActive } : f));

  const moveUp = (id: string) => {
    const sorted = [...faqs].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex((f) => f.id === id);
    if (idx === 0) return;
    const updated = sorted.map((f, i) => {
      if (i === idx) return { ...f, sortOrder: sorted[idx - 1].sortOrder };
      if (i === idx - 1) return { ...f, sortOrder: sorted[idx].sortOrder };
      return f;
    });
    setFaqs(updated);
  };

  const moveDown = (id: string) => {
    const sorted = [...faqs].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex((f) => f.id === id);
    if (idx === sorted.length - 1) return;
    const updated = sorted.map((f, i) => {
      if (i === idx) return { ...f, sortOrder: sorted[idx + 1].sortOrder };
      if (i === idx + 1) return { ...f, sortOrder: sorted[idx].sortOrder };
      return f;
    });
    setFaqs(updated);
  };

  const saveHeader = () => {
    setHeader(headerDraft);
    setEditingHeader(false);
  };

  const inputCls = "w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500";
  const activeCount = faqs.filter((f) => f.isActive).length;

  return (
    <div className="space-y-6">

      {/* Simple Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <MessageCircleQuestion className="w-6 h-6 text-brand-600" />
            <span>FAQ Manager</span>
          </h1>
        </div>
      </div>

      {/* TWO-COLUMN BODY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ─── LEFT: all management fields ─── */}
        <div className="lg:col-span-7 space-y-5">

          {/* SECTION HEADER EDITOR */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="font-black text-sm text-slate-900 dark:text-white">Section Header Text</span>
                <span className="text-[10px] text-slate-400 hidden sm:inline">— controls heading shown above FAQs</span>
              </div>
              {!editingHeader ? (
                <button type="button" onClick={() => { setHeaderDraft(header); setEditingHeader(true); }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-brand-600 cursor-pointer transition-colors">
                  <Edit2 className="w-3 h-3" /> Edit
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setEditingHeader(false)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 cursor-pointer transition-colors">Cancel</button>
                  <button type="button" onClick={saveHeader}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white cursor-pointer transition-colors">
                    <Save className="w-3 h-3" />Save
                  </button>
                </div>
              )}
            </div>

            {!editingHeader ? (
              <div className="px-5 py-4 grid grid-cols-2 gap-x-6 gap-y-3">
                {([["Badge", header.badge], ["View All Text", header.viewAllText], ["Title", header.title], ["Subtitle", header.subtitle]] as [string, string][]).map(([label, val]) => (
                  <div key={label} className={label === "Title" || label === "Subtitle" ? "col-span-2" : ""}>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{val}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Badge Text</label>
                  <input type="text" value={headerDraft.badge} onChange={(e) => setHeaderDraft({ ...headerDraft, badge: e.target.value })} className={inputCls} placeholder="CLEAR INFORMATION" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Section Title</label>
                  <input type="text" value={headerDraft.title} onChange={(e) => setHeaderDraft({ ...headerDraft, title: e.target.value })} className={inputCls} placeholder="Frequently Asked Questions" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Subtitle</label>
                  <input type="text" value={headerDraft.subtitle} onChange={(e) => setHeaderDraft({ ...headerDraft, subtitle: e.target.value })} className={inputCls} placeholder="Everything you need to know..." />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">View All Button Text</label>
                  <input type="text" value={headerDraft.viewAllText} onChange={(e) => setHeaderDraft({ ...headerDraft, viewAllText: e.target.value })} className={inputCls} placeholder="View all FAQs →" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">View All Link</label>
                  <input type="text" value={headerDraft.viewAllLink} onChange={(e) => setHeaderDraft({ ...headerDraft, viewAllLink: e.target.value })} className={inputCls} placeholder="/faqs" />
                </div>
              </div>
            )}
          </div>

          {/* FILTERS + SEARCH + ADD */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar flex-1 min-w-0">
              {["All", ...CATEGORIES].map((cat) => (
                <button key={cat} type="button" onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-colors shrink-0 ${selectedCategory === cat ? "bg-brand-600 text-white shadow-sm" : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50"}`}>
                  {cat}
                  {cat === "All"
                    ? <span className="ml-1 text-[10px] opacity-70">({faqs.length})</span>
                    : faqs.filter(f => f.category === cat).length > 0
                      ? <span className="ml-1 text-[10px] opacity-70">({faqs.filter(f => f.category === cat).length})</span>
                      : null}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" placeholder="Search FAQs..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 w-44" />
              </div>
              <button type="button"
                onClick={() => setFaqModal({ open: true, mode: "add", data: { question: "", answer: "", category: "General", isActive: true, sortOrder: faqs.length + 1 } })}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs cursor-pointer shadow-sm transition-colors shrink-0">
                <Plus className="w-3.5 h-3.5" /> Add FAQ
              </button>
            </div>
          </div>

          {/* FAQ LIST */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-500 px-1">{filtered.length} FAQ{filtered.length !== 1 ? "s" : ""} found</p>

            {filtered.length === 0 && (
              <div className="rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400 space-y-2">
                <MessageCircleQuestion className="w-8 h-8 mx-auto opacity-40 text-purple-500" />
                <p className="text-sm font-bold">No FAQs found</p>
                <p className="text-xs">Try a different search or category filter.</p>
              </div>
            )}

            {filtered.map((faq, idx) => (
              <div key={faq.id} className={`rounded-2xl border bg-white dark:bg-slate-900 shadow-xs transition-all ${faq.isActive ? "border-slate-200 dark:border-slate-800" : "border-dashed border-slate-300 dark:border-slate-700 opacity-60"}`}>
                <div className="flex items-start gap-3 p-4">
                  {/* Sort controls */}
                  <div className="flex flex-col gap-0.5 shrink-0 pt-0.5">
                    <button type="button" onClick={() => moveUp(faq.id)} disabled={idx === 0}
                      className="p-0.5 rounded text-slate-400 hover:text-brand-600 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-colors">
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <span className="text-[10px] font-black text-slate-400 text-center">{faq.sortOrder}</span>
                    <button type="button" onClick={() => moveDown(faq.id)} disabled={idx === filtered.length - 1}
                      className="p-0.5 rounded text-slate-400 hover:text-brand-600 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-colors">
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-bold text-sm text-slate-900 dark:text-white leading-snug">{faq.question}</p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5" />{faq.category}
                        </span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${faq.isActive ? "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
                          {faq.isActive ? "LIVE" : "HIDDEN"}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{faq.answer}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button type="button" onClick={() => setFaqModal({ open: true, mode: "edit", data: { ...faq } })}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-brand-600 transition-colors cursor-pointer" title="Edit">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" onClick={() => toggleActive(faq.id)}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-purple-600 transition-colors cursor-pointer" title={faq.isActive ? "Hide" : "Show"}>
                      {faq.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button type="button" onClick={() => setDeleteModal({ open: true, id: faq.id, question: faq.question })}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-600 transition-colors cursor-pointer" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── RIGHT: sticky live preview ─── */}
        <div className="lg:col-span-5 sticky self-start" style={{ top: "calc(5rem + 1.5rem)" }}>
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
            {/* Preview header bar */}
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/30">
              <Eye className="w-4 h-4 text-purple-600 shrink-0" />
              <span className="font-black text-sm text-slate-900 dark:text-white">Live Website Preview</span>
              <span className="ml-auto text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60 border border-purple-200 dark:border-purple-800 px-2.5 py-0.5 rounded-full shrink-0">
                {activeCount} LIVE
              </span>
            </div>

            {/* Scrollable preview body */}
            <div className="p-5 space-y-3" style={{ maxHeight: "calc(100vh - 20rem)", overflowY: "auto" }}>
              {/* Section heading as on website */}
              <div className="text-center space-y-1 pb-4 border-b border-slate-100 dark:border-slate-800">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-brand-600">{header.badge}</p>
                <h2 className="text-sm font-black text-slate-900 dark:text-white leading-snug">{header.title}</h2>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">{header.subtitle}</p>
              </div>

              {/* FAQ accordion */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {faqs
                  .filter(f => f.isActive)
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((faq) => (
                    <div key={faq.id} className="py-2.5">
                      <button type="button" onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                        className="w-full flex items-center justify-between text-left cursor-pointer group gap-3">
                        <span className="font-bold text-xs text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors leading-snug">{faq.question}</span>
                        {expandedId === faq.id
                          ? <ChevronUp className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          : <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                      </button>
                      {expandedId === faq.id && (
                        <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed pr-5">{faq.answer}</p>
                      )}
                    </div>
                  ))}
              </div>

              {/* View all link */}
              <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-brand-600 hover:text-brand-700 cursor-pointer hover:underline">{header.viewAllText}</span>
              </div>
            </div>
          </div>

          {/* Quick stat pills */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            {([
              ["Total", faqs.length, "text-slate-700 dark:text-slate-300"],
              ["Live", activeCount, "text-purple-600 dark:text-purple-400"],
              ["Hidden", faqs.length - activeCount, "text-slate-400"],
            ] as [string, number, string][]).map(([label, val, color]) => (
              <div key={label} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-center">
                <div className={`font-black text-lg ${color}`}>{val}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {faqModal.open && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="font-black text-slate-900 dark:text-white text-base">
                  {faqModal.mode === "add" ? "Add New FAQ" : "Edit FAQ"}
                </h2>
                <button type="button" onClick={() => setFaqModal({ open: false, mode: "add", data: {} })}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Question <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="What is HelpMate's..." value={faqModal.data.question || ""}
                    onChange={(e) => setFaqModal({ ...faqModal, data: { ...faqModal.data, question: e.target.value } })} className={inputCls} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Answer <span className="text-red-500">*</span></label>
                  <textarea rows={5} placeholder="Provide a clear, detailed answer..." value={faqModal.data.answer || ""}
                    onChange={(e) => setFaqModal({ ...faqModal, data: { ...faqModal.data, answer: e.target.value } })}
                    className={`${inputCls} resize-none`} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Category</label>
                    <select value={faqModal.data.category || "General"}
                      onChange={(e) => setFaqModal({ ...faqModal, data: { ...faqModal.data, category: e.target.value } })} className={inputCls}>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Sort Order</label>
                    <input type="number" placeholder="1" value={faqModal.data.sortOrder || ""}
                      onChange={(e) => setFaqModal({ ...faqModal, data: { ...faqModal.data, sortOrder: Number(e.target.value) } })} className={inputCls} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="faq-active" checked={faqModal.data.isActive ?? true}
                    onChange={(e) => setFaqModal({ ...faqModal, data: { ...faqModal.data, isActive: e.target.checked } })}
                    className="w-4 h-4 rounded accent-purple-600 cursor-pointer" />
                  <label htmlFor="faq-active" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">Show on website (Live)</label>
                </div>
              </div>

              <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button type="button" onClick={() => setFaqModal({ open: false, mode: "add", data: {} })}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 cursor-pointer transition-colors">Cancel</button>
                <button type="button" onClick={saveFaq}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm">
                  <Save className="w-3.5 h-3.5" />Save FAQ
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* DELETE MODAL */}
      {deleteModal?.open && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm p-6 space-y-4 border border-slate-200 dark:border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-black text-slate-900 dark:text-white text-base">Delete this FAQ?</h3>
                <p className="text-xs text-slate-500 px-2 line-clamp-2">"{deleteModal.question}"</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setDeleteModal(null)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 cursor-pointer transition-colors">Cancel</button>
                <button type="button" onClick={deleteFaq}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 cursor-pointer transition-colors">Delete</button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
