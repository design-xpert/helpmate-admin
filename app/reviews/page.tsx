"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { DataTable, Column } from "@/components/DataTable";
import {
  getAdminReviewsApi,
  getAdminReviewDetailsApi,
  getAdminReviewsSummaryApi,
  moderateAdminReviewApi,
  updateAdminReviewResponseApi,
  ApiAdminReview,
  ApiAdminReviewDetails,
  ApiAdminReviewSummary,
} from "@/lib/api";
import { toast } from "@/components/Toast";
import {
  Star,
  MessageSquare,
  CheckCircle2,
  ShieldCheck,
  Award,
  Search,
  Filter,
  Eye,
  Flag,
  Check,
  User,
  Calendar,
  ExternalLink,
  MessageCircle,
  X,
  Globe,
  EyeOff,
  Play,
  Pause,
  Video,
  Smartphone,
  Film,
  Loader2,
  AlertTriangle,
  Clock,
  Phone,
  Mail,
  UserCheck,
  Tag,
} from "lucide-react";
import { Portal } from "@/components/Portal";
import { CustomSelect } from "@/components/CustomSelect";

import { getStoredModuleData, setCachedModuleData, isModuleCacheFresh } from "@/lib/moduleCache";

export default function ReviewsPage() {
  const initialCached = getStoredModuleData<ApiAdminReview[]>("reviews");
  const initialCachedSummary = getStoredModuleData<ApiAdminReviewSummary>("reviews_summary");
  const [reviews, setReviews] = useState<ApiAdminReview[]>(() => initialCached || []);
  const [summaryData, setSummaryData] = useState<ApiAdminReviewSummary | null>(() => initialCachedSummary || null);
  const [isLoading, setIsLoading] = useState(() => !(isModuleCacheFresh("reviews") && initialCached && initialCached.length > 0));

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [publishedFilter, setPublishedFilter] = useState<string>("All");

  // Selection & Modal State
  const [selectedReview, setSelectedReview] = useState<ApiAdminReview | null>(null);
  const [modalDetails, setModalDetails] = useState<ApiAdminReviewDetails | null>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [adminReplyText, setAdminReplyText] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const fetchReviews = useCallback(async (force: boolean = false) => {
    if (!force && !searchQuery.trim() && ratingFilter === "All" && statusFilter === "All" && publishedFilter === "All" && page === 1 && isModuleCacheFresh("reviews")) {
      const cached = getStoredModuleData<ApiAdminReview[]>("reviews");
      if (cached && cached.length > 0) {
        setReviews(cached);
        setIsLoading(false);
        return;
      }
    }
    if (reviews.length === 0 && (!initialCached || initialCached.length === 0)) {
      setIsLoading(true);
    }
    try {
      const res = await getAdminReviewsApi({
        search: searchQuery.trim() || undefined,
        rating: ratingFilter !== "All" ? ratingFilter : undefined,
        status: statusFilter !== "All" ? statusFilter : undefined,
        isPublished: publishedFilter !== "All" ? publishedFilter : undefined,
        page,
        limit,
      });

      if (res && res.success && Array.isArray(res.data)) {
        setReviews(res.data);
        setCachedModuleData("reviews", res.data);
        if (res.pagination) {
          setTotalCount(res.pagination.total || res.data.length);
        } else {
          setTotalCount(res.data.length);
        }
      } else {
        setReviews([]);
        setTotalCount(0);
      }
    } catch (err) {
      console.error("fetchReviews error:", err);
      toast.error("Failed to fetch customer reviews.");
      setReviews([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, ratingFilter, statusFilter, publishedFilter, page, limit, initialCached, reviews.length]);

  const fetchSummary = useCallback(async (force: boolean = false) => {
    if (!force && isModuleCacheFresh("reviews_summary")) {
      const cached = getStoredModuleData<ApiAdminReviewSummary>("reviews_summary");
      if (cached) {
        setSummaryData(cached);
        return;
      }
    }
    try {
      const res = await getAdminReviewsSummaryApi(true);
      if (res && res.success && res.data) {
        setSummaryData(res.data);
        setCachedModuleData("reviews_summary", res.data);
      }
    } catch (err) {
      console.error("fetchSummary error:", err);
    }
  }, []);

  useEffect(() => {
    if (page === 1 && ratingFilter === "All" && statusFilter === "All" && publishedFilter === "All" && !searchQuery.trim() && isModuleCacheFresh("reviews") && initialCached && initialCached.length > 0) {
      setIsLoading(false);
      if (!isModuleCacheFresh("reviews_summary")) {
        fetchSummary();
      }
      return;
    }
    fetchReviews();
    fetchSummary();
  }, [fetchReviews, fetchSummary, page, ratingFilter, statusFilter, publishedFilter, searchQuery, initialCached]);

  // Open Manage Modal & Fetch Review Details
  const handleOpenManageModal = async (review: ApiAdminReview) => {
    setSelectedReview(review);
    setModalDetails(null);
    setAdminReplyText(review.officialResponse || "");
    setIsModalLoading(true);

    try {
      const res = await getAdminReviewDetailsApi(review._id);
      if (res && res.success && res.data) {
        setModalDetails(res.data);
        const officialMsg = res.data.officialResponse?.message || review.officialResponse || "";
        setAdminReplyText(officialMsg);
      }
    } catch (err) {
      console.error("handleOpenManageModal error:", err);
    } finally {
      setIsModalLoading(false);
    }
  };

  // Moderation Action Handler
  const handleModerate = async (reviewId: string, action: "approve" | "hide") => {
    setIsActionLoading(reviewId);
    try {
      const res = await moderateAdminReviewApi(reviewId, action);
      if (res && res.success) {
        toast.success(res.message || `Review ${action === "approve" ? "approved & published" : "hidden"} successfully!`);
        await fetchReviews(true);
        await fetchSummary(true);

        // Refresh modal if currently inspecting this review
        if (selectedReview && selectedReview._id === reviewId) {
          const detailsRes = await getAdminReviewDetailsApi(reviewId);
          if (detailsRes && detailsRes.success && detailsRes.data) {
            setModalDetails(detailsRes.data);
            setSelectedReview((prev) =>
              prev
                ? {
                    ...prev,
                    isPublished: action === "approve",
                    moderation: { ...prev.moderation, status: action === "approve" ? "approved" : "hidden" },
                  }
                : null
            );
          }
        }
      } else {
        toast.error(res?.message || "Failed to update review status.");
      }
    } catch (err) {
      console.error("handleModerate error:", err);
      toast.error("An error occurred while moderating review.");
    } finally {
      setIsActionLoading(null);
    }
  };

  // Official Admin Reply Handler
  const handleSaveReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview || !adminReplyText.trim()) {
      toast.error("Response message cannot be empty.");
      return;
    }

    setIsSubmittingReply(true);
    try {
      const res = await updateAdminReviewResponseApi(selectedReview._id, adminReplyText.trim());
      if (res && res.success) {
        toast.success(res.message || "Official response posted successfully!");
        await fetchReviews(true);
        await fetchSummary(true);
        setSelectedReview(null);
        setModalDetails(null);
        setAdminReplyText("");
      } else {
        toast.error(res?.message || "Failed to post official response.");
      }
    } catch (err) {
      console.error("handleSaveReply error:", err);
      toast.error("An error occurred while posting official response.");
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const hasValidVideo = (videoObj: any): boolean => {
    if (!videoObj) return false;
    if (typeof videoObj === "string") return videoObj.trim().length > 0;
    if (typeof videoObj === "object") {
      const url = videoObj.videoUrl || videoObj.url || videoObj.objectName || videoObj.originalName;
      return typeof url === "string" && url.trim().length > 0;
    }
    return false;
  };

  const getVideoUrl = (videoObj: any): string => {
    if (!videoObj) return "";
    if (typeof videoObj === "string") return videoObj;
    const directUrl = videoObj.videoUrl || videoObj.url;
    if (directUrl) return directUrl;
    if (videoObj.objectName) return `https://helpmate-api.kvtmedia.com/uploads/${videoObj.objectName}`;
    return "";
  };

  const getVideoDuration = (videoObj: any): string => {
    if (!videoObj || !videoObj.duration) return "0:30";
    return String(videoObj.duration);
  };

  // KPIs (from API summary /api/admin/reviews/summary)
  const avgRating = summaryData?.averageRating !== undefined
    ? Number(summaryData.averageRating).toFixed(1)
    : (reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / reviews.length).toFixed(1)
        : "5.0");

  const approvedCount = summaryData?.approvedReviews !== undefined
    ? summaryData.approvedReviews
    : reviews.filter((r) => r.moderation?.status === "approved" || r.isPublished).length;

  const webPublishedCount = summaryData?.publishedReviews !== undefined
    ? summaryData.publishedReviews
    : reviews.filter((r) => r.isPublished).length;

  const videoReviewsCount = summaryData?.videoReviews !== undefined
    ? summaryData.videoReviews
    : reviews.filter((r) => hasValidVideo(r.video)).length;

  const tableFilters = (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Published / Website Filter */}
      <div className="w-44">
        <CustomSelect
          size="sm"
          value={publishedFilter}
          onChange={(val) => {
            setPublishedFilter(val);
            setPage(1);
          }}
          options={[
            { value: "All", label: "All Web Status" },
            { value: "true", label: "🌐 Live on Website" },
            { value: "false", label: "🚫 Hidden from Web" },
          ]}
        />
      </div>

      {/* Moderation Status Filter */}
      <div className="w-44">
        <CustomSelect
          size="sm"
          value={statusFilter}
          onChange={(val) => {
            setStatusFilter(val);
            setPage(1);
          }}
          options={[
            { value: "All", label: "All Statuses" },
            { value: "pending", label: "⏳ Pending Approval" },
            { value: "approved", label: "✅ Approved" },
            { value: "rejected", label: "❌ Rejected / Hidden" },
          ]}
        />
      </div>

      {/* Ratings Filter */}
      <div className="w-44">
        <CustomSelect
          size="sm"
          value={ratingFilter}
          onChange={(val) => {
            setRatingFilter(val);
            setPage(1);
          }}
          options={[
            { value: "All", label: "All Ratings" },
            { value: "5", label: "5 Stars ⭐⭐⭐⭐⭐" },
            { value: "4", label: "4 Stars ⭐⭐⭐⭐" },
            { value: "3", label: "3 Stars ⭐⭐⭐" },
            { value: "2", label: "2 Stars ⭐⭐" },
            { value: "1", label: "1 Star ⭐" },
          ]}
        />
      </div>
    </div>
  );

  const columns: Column<ApiAdminReview>[] = [
    {
      key: "booking",
      header: "Booking ID",
      accessor: (row) => {
        const bNum = row.booking?.bookingNumber || "N/A";
        const bId = row.booking?.id || row._id;
        return (
          <div className="space-y-0.5">
            <Link
              href={`/bookings/${bId}`}
              className="font-mono font-black text-brand-600 dark:text-brand-400 hover:underline text-xs"
            >
              {bNum}
            </Link>
            <span className="text-[10px] text-slate-400 block font-medium">
              {row.booking?.status || "Varanasi Order"}
            </span>
          </div>
        );
      },
      sortable: true,
    },
    {
      key: "customer",
      header: "Reviewer & Customer",
      accessor: (row) => {
        const cName = row.customer?.name || "Customer";
        const cMobile = row.customer?.mobile || "";
        const cCode = row.customer?.customerCode || "";
        return (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-extrabold flex items-center justify-center text-xs shrink-0">
              {cName ? cName[0].toUpperCase() : "C"}
            </div>
            <div>
              <div className="font-extrabold text-slate-900 dark:text-white text-xs">{cName}</div>
              <div className="text-[10px] text-slate-400 font-medium">
                {cMobile || cCode || "Verified Customer"}
              </div>
            </div>
          </div>
        );
      },
      sortable: true,
    },
    {
      key: "package",
      header: "Service / Package",
      accessor: (row) => {
        const pkgName = row.package?.name || row.service?.name || "Service Package";
        const partnerName = row.partner?.name || "Helpmate Partner";
        return (
          <div className="space-y-0.5">
            <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">{pkgName}</div>
            <span className="text-[10px] text-brand-600 dark:text-brand-400 font-semibold block">
              Partner: {partnerName}
            </span>
          </div>
        );
      },
      sortable: true,
    },
    {
      key: "rating",
      header: "Rating",
      accessor: (row) => (
        <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800/60 w-fit">
          <div className="flex text-amber-500">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-3 h-3 ${star <= (row.rating || 5) ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-700"}`}
              />
            ))}
          </div>
          <span className="font-black text-amber-800 dark:text-amber-300 text-xs font-mono">{row.rating}.0</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "review",
      header: "Customer Feedback & Media",
      accessor: (row) => (
        <div className="max-w-md space-y-1.5 py-1">
          {row.review ? (
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium line-clamp-2 leading-relaxed">
              "{row.review}"
            </p>
          ) : (
            <span className="text-[10px] text-slate-400 italic">No text review provided</span>
          )}

          {hasValidVideo(row.video) && (
            <div className="flex items-center gap-2 p-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800/80 w-fit">
              <div className="relative w-7 h-10 rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-purple-300">
                {row.video?.thumbnailUrl ? (
                  <Image
                    src={row.video.thumbnailUrl}
                    alt="Video Thumbnail"
                    fill
                    unoptimized
                    className="object-cover opacity-80"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white"><Video className="w-3 h-3" /></div>
                )}
                <Play className="w-3 h-3 text-white absolute inset-0 m-auto fill-white" />
              </div>
              <div className="text-[10px]">
                <span className="font-black text-purple-900 dark:text-purple-200 block flex items-center gap-1">
                  <Film className="w-3 h-3 text-purple-600 shrink-0" />
                  <span>Vertical Video (9:16) • {getVideoDuration(row.video)}</span>
                </span>
                <span className="text-[9px] text-purple-700 dark:text-purple-300 font-medium">Customer Video Review</span>
              </div>
            </div>
          )}

          {row.officialResponse && (
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-[11px] text-purple-900 dark:text-purple-200 font-medium">
              <span className="font-extrabold text-purple-700 dark:text-purple-300 block">💬 Official HelpMate Response:</span>
              <span>{row.officialResponse}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "isPublished",
      header: "Website Status",
      accessor: (row) => {
        const isPublished = !!row.isPublished;
        const isBusy = isActionLoading === row._id;

        return (
          <button
            type="button"
            disabled={isBusy}
            onClick={() => handleModerate(row._id, isPublished ? "hide" : "approve")}
            className={`px-3 py-1 rounded-full text-[10px] font-black tracking-wide inline-flex items-center gap-1.5 cursor-pointer transition-all ${
              isPublished
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-200"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-300 dark:border-slate-700 hover:bg-slate-200"
            }`}
            title={isPublished ? "Click to hide from website" : "Click to publish to website"}
          >
            {isBusy ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : isPublished ? (
              <>
                <Globe className="w-3 h-3 text-emerald-600" />
                <span>🌐 Live on Web</span>
              </>
            ) : (
              <>
                <EyeOff className="w-3 h-3 text-slate-400" />
                <span>🚫 Hidden</span>
              </>
            )}
          </button>
        );
      },
    },
    {
      key: "createdAt",
      header: "Review Date",
      accessor: (row) => {
        const dStr = row.createdAt ? new Date(row.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "N/A";
        return <span className="text-slate-500 font-medium text-xs whitespace-nowrap">{dStr}</span>;
      },
      sortable: true,
    },
    {
      key: "moderationStatus",
      header: "Moderation Status",
      accessor: (row) => {
        const st = (row.moderation?.status || (row.isPublished ? "approved" : "pending")).toLowerCase();
        return (
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 ${
              st === "approved"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                : st === "pending"
                ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            <span>{st}</span>
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      accessor: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleOpenManageModal(row)}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
            title="Inspect & Moderation"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Manage</span>
          </button>

          {!row.isPublished && (
            <button
              type="button"
              disabled={isActionLoading === row._id}
              onClick={() => handleModerate(row._id, "approve")}
              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-100 font-bold text-xs flex items-center gap-1 cursor-pointer"
              title="Quick Approve & Publish"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
          )}

          {row.isPublished && (
            <button
              type="button"
              disabled={isActionLoading === row._id}
              onClick={() => handleModerate(row._id, "hide")}
              className="p-1.5 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 hover:bg-rose-100 font-bold text-xs flex items-center gap-1 cursor-pointer"
              title="Hide / Unpublish"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Star className="w-6 h-6 text-brand-600 fill-brand-600" />
            <span>Reviews & Ratings</span>
          </h1>
        </div>
      </div>

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Average Rating</span>
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950 dark:border-amber-900">
              <Star className="w-5 h-5 fill-amber-500" />
            </div>
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-white">★ {avgRating} / 5.0</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Published on Website</span>
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950 dark:border-emerald-900">
              <Globe className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <span className="text-2xl font-black text-emerald-600">{webPublishedCount} Live</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Video Reviews (9:16)</span>
            <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200 dark:bg-purple-950 dark:border-purple-900">
              <Smartphone className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <span className="text-2xl font-black text-purple-600">{videoReviewsCount} Videos</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Approved Reviews</span>
            <div className="p-2.5 rounded-2xl bg-brand-50 text-brand-600 border border-brand-200 dark:bg-brand-950 dark:border-brand-900">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-white">{approvedCount} Approved</span>
        </div>
      </div>

      {/* Main DataTable with Integrated Shimmer Loading */}
      <DataTable
        columns={columns}
        data={reviews}
        idField="_id"
        searchPlaceholder="Search reviewer, partner, booking ID, review content..."
        extraFilters={tableFilters}
        isLoading={isLoading}
      />

      {/* Review Management Drawer / Modal */}
      {selectedReview && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 outline-none overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-xl w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-150 my-8">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                    <Star className="w-6 h-6 fill-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Review & Rating Details</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Booking: {modalDetails?.booking?.bookingNumber || selectedReview.booking?.bookingNumber || "HM-VAR-8821"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedReview(null);
                    setModalDetails(null);
                  }}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {isModalLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400 text-xs font-semibold">
                  <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
                  <span>Fetching full review details...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Website Visibility Controls */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-brand-600" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Website Live Status</span>
                    </div>

                    <button
                      type="button"
                      disabled={isActionLoading === selectedReview._id}
                      onClick={() => handleModerate(selectedReview._id, (modalDetails?.moderation?.isPublished ?? selectedReview.isPublished) ? "hide" : "approve")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all ${
                        (modalDetails?.moderation?.isPublished ?? selectedReview.isPublished)
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {isActionLoading === selectedReview._id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (modalDetails?.moderation?.isPublished ?? selectedReview.isPublished) ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Published to Live Website</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" />
                          <span>Hidden from Website</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Enhanced Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Customer Box */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-1.5">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-brand-600" /> Customer Information
                      </span>
                      <div className="font-extrabold text-slate-900 dark:text-white">
                        {modalDetails?.customer?.name || selectedReview.customer?.name || "Customer"}
                      </div>
                      <div className="text-slate-500 font-medium flex items-center gap-1.5 text-[11px]">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{modalDetails?.customer?.mobile || selectedReview.customer?.mobile || "N/A"}</span>
                      </div>
                      {modalDetails?.customer?.email && (
                        <div className="text-slate-500 font-medium flex items-center gap-1.5 text-[11px] truncate">
                          <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{modalDetails.customer.email}</span>
                        </div>
                      )}
                    </div>

                    {/* Booking Box */}
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-1.5">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5 text-purple-600" /> Booking Overview
                      </span>
                      <div className="font-mono font-black text-brand-600 dark:text-brand-400">
                        {modalDetails?.booking?.bookingNumber || selectedReview.booking?.bookingNumber || "N/A"}
                      </div>
                      <div className="text-slate-500 font-medium text-[11px] flex items-center justify-between">
                        <span>Status: <strong className="text-slate-800 dark:text-slate-200">{modalDetails?.booking?.status || selectedReview.booking?.status || "Completed"}</strong></span>
                      </div>
                      {modalDetails?.booking?.bookingDate && (
                        <div className="text-slate-500 font-medium text-[11px] flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{modalDetails.booking.bookingDate} {modalDetails.booking.timeSlot ? `• ${modalDetails.booking.timeSlot}` : ""}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Vertical Video Player (9:16 Aspect Ratio) */}
                  {hasValidVideo(modalDetails?.video || selectedReview.video) && (
                    <div className="p-4 rounded-2xl bg-gradient-to-b from-purple-900/10 to-slate-900/10 dark:from-purple-950/40 dark:to-slate-900/80 border border-purple-200 dark:border-purple-800/80 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                          <Smartphone className="w-4 h-4 text-purple-600" />
                          <span>Customer Video Review (9:16 Format)</span>
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 border border-purple-300">
                          {getVideoDuration(modalDetails?.video || selectedReview.video)} • Vertical 9:16
                        </span>
                      </div>

                      <div className="flex justify-center">
                        <div className="relative w-56 h-[340px] rounded-2xl overflow-hidden bg-black border-2 border-purple-500 shadow-xl group">
                          <video
                            src={getVideoUrl(modalDetails?.video || selectedReview.video)}
                            poster={(modalDetails?.video?.thumbnailUrl || selectedReview.video?.thumbnailUrl)}
                            controls
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Review Details Text Card */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">
                        {modalDetails?.customer?.name || selectedReview.customer?.name || "Customer"}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {selectedReview.createdAt ? new Date(selectedReview.createdAt).toLocaleDateString("en-IN") : "N/A"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex text-amber-500">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${star <= (modalDetails?.rating || selectedReview.rating || 5) ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-700"}`}
                          />
                        ))}
                      </div>
                      <span className="font-black text-slate-900 dark:text-white font-mono text-sm">
                        {modalDetails?.rating || selectedReview.rating}.0 Rating
                      </span>
                    </div>

                    {(modalDetails?.review || selectedReview.review) && (
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 italic leading-relaxed">
                        "{modalDetails?.review || selectedReview.review}"
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 text-[11px] font-semibold text-slate-500 flex-wrap gap-2">
                      <span>
                        Package: <strong className="text-slate-900 dark:text-white">{modalDetails?.package?.name || selectedReview.package?.name || "Service Package"}</strong>
                        {modalDetails?.package?.price ? ` (₹${modalDetails.package.price})` : ""}
                      </span>
                      {modalDetails?.partner?.name && (
                        <span>Assigned Partner: <strong className="text-brand-600 dark:text-brand-400">{modalDetails.partner.name}</strong></span>
                      )}
                    </div>
                  </div>

                  {/* Status Actions (Rule Check: Secondary Buttons!) */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Moderation Action</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={isActionLoading === selectedReview._id}
                        onClick={() => handleModerate(selectedReview._id, "approve")}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                          (modalDetails?.moderation?.isPublished ?? selectedReview.isPublished)
                            ? "bg-emerald-600 text-white font-extrabold"
                            : "bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                        }`}
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve & Publish</span>
                      </button>

                      <button
                        type="button"
                        disabled={isActionLoading === selectedReview._id}
                        onClick={() => handleModerate(selectedReview._id, "hide")}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                          !(modalDetails?.moderation?.isPublished ?? selectedReview.isPublished)
                            ? "bg-rose-600 text-white font-extrabold"
                            : "bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                        }`}
                      >
                        <Flag className="w-4 h-4" />
                        <span>Flag / Hide Review</span>
                      </button>
                    </div>
                  </div>

                  {/* Official Admin Response Form */}
                  <form onSubmit={handleSaveReply} className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Add Official HelpMate Customer Response
                      </label>
                      <textarea
                        rows={3}
                        value={adminReplyText}
                        onChange={(e) => setAdminReplyText(e.target.value)}
                        placeholder="Type official reply (e.g. Thank you for your valuable feedback. We are glad you were satisfied with our service.)"
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                      />
                    </div>

                    {/* SINGLE PRIMARY BUTTON IN MODAL ACCORDING TO RULE */}
                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedReview(null);
                          setModalDetails(null);
                        }}
                        className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        Close
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingReply}
                        className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-extrabold shadow-lux flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
                      >
                        {isSubmittingReply ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <MessageCircle className="w-4 h-4" />
                        )}
                        <span>{isSubmittingReply ? "Posting..." : "Post Official Response"}</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}


