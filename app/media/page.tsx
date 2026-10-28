"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import Image from "next/image";
import {
  FileImage,
  Search,
  Image as ImageIcon,
  Copy,
  Check,
  Edit2,
  X,
  Grid,
  List,
  FolderOpen,
  Filter,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
  Info,
  Calendar,
  FileCode,
  SlidersHorizontal,
} from "lucide-react";
import { Portal } from "@/components/Portal";
import { toast } from "@/components/Toast";
import {
  getMediaLibraryFoldersApi,
  getMediaLibraryApi,
  updateMediaAssetDetailsApi,
  syncMediaLibraryApi,
  ApiMediaAsset,
  formatImageUrl,
} from "@/lib/api";
import { getStoredModuleData, setCachedModuleData, isModuleCacheFresh } from "@/lib/moduleCache";
import { preloadImages } from "@/lib/imageCache";

// Helper: Format raw MinIO folder paths to human-friendly display labels
function formatFolderLabel(folder: string): string {
  if (!folder) return "General";
  const name = folder.replace(/^helpMate\//i, "");
  return name
    .split(/[-_/]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Helper: Format bytes to human readable sizes
function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// Helper: Format date strings
function formatDate(dateStr?: string): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

// Helper: Pagination page numbers with ellipses (standard pattern from DataTable)
function getPageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 3) return Array.from({ length: total }, (_, i) => i + 1);

  const set = new Set<number>();
  set.add(1); // First page
  set.add(current); // Current page
  set.add(total); // Last page

  const sorted = Array.from(set).sort((a, b) => a - b);
  const result: (number | string)[] = [];

  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
      result.push("...");
    }
    result.push(sorted[i]);
  }
  return result;
}

export default function MediaPage() {
  const initialCachedMedia = getStoredModuleData<{ assets: ApiMediaAsset[]; pagination: any }>("media_library_default");
  const initialCachedFolders = getStoredModuleData<string[]>("media_library_folders");

  // Folder & Asset Data
  const [folders, setFolders] = useState<string[]>(() => initialCachedFolders || []);
  const [selectedFolder, setSelectedFolder] = useState<string>("all");
  const [assets, setAssets] = useState<ApiMediaAsset[]>(() => initialCachedMedia?.assets || []);
  const [pagination, setPagination] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>(() => initialCachedMedia?.pagination || {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  // UI & Filter States
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<"uploadedAt" | "fileName" | "size">("uploadedAt");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // Loading & Async Flags
  const [isLoading, setIsLoading] = useState(() => !(isModuleCacheFresh("media_library_default") && initialCachedMedia?.assets && initialCachedMedia.assets.length > 0));
  const [isSyncing, setIsSyncing] = useState(false);
  const [, startTransition] = useTransition();

  // Active Edit Drawer State
  const [editingAsset, setEditingAsset] = useState<ApiMediaAsset | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    altText: "",
    caption: "",
    description: "",
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Copy feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch Folders from API
  const fetchFolders = useCallback(async (force: boolean = false) => {
    if (!force && isModuleCacheFresh("media_library_folders")) {
      const cached = getStoredModuleData<string[]>("media_library_folders");
      if (cached && cached.length > 0) {
        setFolders(cached);
        return;
      }
    }
    try {
      const res = await getMediaLibraryFoldersApi();
      if (res.success && Array.isArray(res.data)) {
        setFolders(res.data);
        setCachedModuleData("media_library_folders", res.data);
      }
    } catch (error) {
      console.error("fetchFolders error:", error);
    }
  }, []);

  // Fetch Media Assets from API
  const fetchAssets = useCallback(
    async (pageToFetch: number = 1, limitToFetch?: number, force: boolean = false) => {
      const isDefaultView = selectedFolder === "all" && !debouncedSearch.trim() && pageToFetch === 1;
      if (!force && isDefaultView && isModuleCacheFresh("media_library_default")) {
        const cached = getStoredModuleData<{ assets: ApiMediaAsset[]; pagination: any }>("media_library_default");
        if (cached && Array.isArray(cached.assets) && cached.assets.length > 0) {
          setAssets(cached.assets);
          if (cached.pagination) setPagination(cached.pagination);
          setIsLoading(false);
          preloadImages(cached.assets.map((a) => a.url));
          return;
        }
      }

      if (assets.length === 0 && (!initialCachedMedia || !initialCachedMedia.assets || initialCachedMedia.assets.length === 0)) {
        setIsLoading(true);
      }
      const effectiveLimit = limitToFetch !== undefined ? limitToFetch : pagination.limit;
      try {
        const res = await getMediaLibraryApi({
          folder: selectedFolder === "all" ? undefined : selectedFolder,
          search: debouncedSearch.trim() || undefined,
          page: pageToFetch,
          limit: effectiveLimit,
          sortBy,
          sortOrder,
        });

        if (res.success && res.data) {
          setAssets(res.data.assets || []);
          preloadImages((res.data.assets || []).map((a) => a.url));
          if (isDefaultView && res.data.assets) {
            setCachedModuleData("media_library_default", res.data);
          }
          if (res.data.pagination) {
            setPagination({
              total: res.data.pagination.total,
              page: res.data.pagination.page,
              limit: res.data.pagination.limit,
              totalPages: res.data.pagination.totalPages || 1,
            });
          }
        } else {
          setAssets([]);
          toast.error(res.message || "Failed to fetch media assets.");
        }
      } catch (error) {
        console.error("fetchAssets error:", error);
        toast.error("Failed to connect to media server.");
      } finally {
        setIsLoading(false);
      }
    },
    [selectedFolder, debouncedSearch, pagination.limit, sortBy, sortOrder, initialCachedMedia, assets.length]
  );

  const handlePageChange = (newPage: number) => {
    fetchAssets(newPage, pagination.limit);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPagination((prev) => ({ ...prev, limit: newSize }));
    fetchAssets(1, newSize);
  };

  // Initial load & preload cached images
  useEffect(() => {
    if (initialCachedMedia?.assets && initialCachedMedia.assets.length > 0) {
      preloadImages(initialCachedMedia.assets.map((a) => a.url));
    }
  }, [initialCachedMedia]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  // Fetch assets whenever filters or folder changes
  useEffect(() => {
    fetchAssets(1);
  }, [fetchAssets]);

  // Sync Library with MinIO
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await syncMediaLibraryApi();
      if (res.success) {
        toast.success(res.message || "Media library synchronized with MinIO!");
        await fetchFolders(true);
        await fetchAssets(pagination.page, undefined, true);
      } else {
        toast.error(res.message || "Sync failed.");
      }
    } catch (error) {
      console.error("handleSync error:", error);
      toast.error("An error occurred during synchronization.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Open Edit Drawer for an Asset
  const handleOpenEdit = (asset: ApiMediaAsset) => {
    setEditingAsset(asset);
    setEditForm({
      title: asset.title || "",
      altText: asset.altText || "",
      caption: asset.caption || "",
      description: asset.description || "",
    });
  };

  // Submit Metadata Changes
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset || isSavingEdit) return;

    setIsSavingEdit(true);
    try {
      const res = await updateMediaAssetDetailsApi(editingAsset.id, {
        title: editForm.title.trim(),
        altText: editForm.altText.trim(),
        caption: editForm.caption.trim(),
        description: editForm.description.trim(),
      });

      if (res.success && res.data) {
        toast.success("Media metadata updated successfully!");
        const updated = res.data;
        // Update local asset in state immediately
        setAssets((prev) =>
          prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a))
        );
        // Also update cached module data so revisit stays updated
        const cached = getStoredModuleData<{ assets: ApiMediaAsset[]; pagination: any }>("media_library_default");
        if (cached && Array.isArray(cached.assets)) {
          setCachedModuleData("media_library_default", {
            ...cached,
            assets: cached.assets.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)),
          });
        }
        // Close sliding form on edit success
        setEditingAsset(null);
      } else {
        toast.error(res.message || "Failed to update media asset details.");
      }
    } catch (error) {
      console.error("handleSaveEdit error:", error);
      toast.error("An error occurred while saving media metadata.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // One-click URL copy
  const handleCopyUrl = (url: string, id: string) => {
    const formatted = formatImageUrl(url);
    const fullUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${formatted}`
        : formatted;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    toast.success("Media URL copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* ─── 1. PAGE HEADER (Strictly ONE Primary Button per AGENTS.md) ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 flex items-center justify-center border border-brand-200 dark:border-brand-800 shadow-xs">
              <FileImage className="w-5 h-5 text-brand-600" />
            </div>
            <span>Media Library</span>
          </h1>
        </div>

        {/* Primary Action Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSync}
            disabled={isSyncing}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-60"
            title="Scan MinIO bucket and index all latest image uploads"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "Synchronizing..." : "Sync with MinIO"}</span>
          </button>
        </div>
      </div>

      {/* ─── 2. EXECUTIVE METRICS RIBBON ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Total Indexed Assets
            </span>
            <ImageIcon className="w-4 h-4 text-brand-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {pagination.total.toLocaleString()}
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> High-Resolution CDN Ready
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
              Directory Folders
            </span>
            <FolderOpen className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {folders.length}
          </p>
          <p className="text-[11px] text-blue-600 dark:text-blue-400 font-bold">
            Addons, Packages, Banners, Zones
          </p>
        </div>
      </div>

      {/* ─── 3. FOLDER SELECTOR TABS ─── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Folder Directory ({folders.length})</span>
          </span>
          {selectedFolder !== "all" && (
            <button
              type="button"
              onClick={() => setSelectedFolder("all")}
              className="text-[11px] font-bold text-brand-600 hover:text-brand-700 cursor-pointer"
            >
              Reset to All Folders
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
          {/* "All" Tab */}
          <button
            type="button"
            onClick={() => setSelectedFolder("all")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedFolder === "all"
                ? "bg-brand-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Folders</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                selectedFolder === "all"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500"
              }`}
            >
              {pagination.total}
            </span>
          </button>

          {/* Dynamic Folders from API */}
          {folders.map((folder) => {
            const isSelected = selectedFolder === folder;
            return (
              <button
                key={folder}
                type="button"
                onClick={() => setSelectedFolder(folder)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-brand-600 text-white font-black shadow-xs"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
                title={folder}
              >
                <FolderOpen className={`w-3.5 h-3.5 ${isSelected ? "text-white" : "text-slate-400"}`} />
                <span>{formatFolderLabel(folder)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── 4. SEARCH, SORT & VIEW BAR ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by file name, title, alt text, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-9 py-2 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:bg-white dark:focus:bg-slate-800 transition-all font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort & View Mode Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Sort Field */}
          <div className="flex items-center gap-1.5 text-xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split("-") as [
                  "uploadedAt" | "fileName" | "size",
                  "desc" | "asc"
                ];
                setSortBy(sb);
                setSortOrder(so);
              }}
              className="px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
            >
              <option value="uploadedAt-desc">Newest Uploaded</option>
              <option value="uploadedAt-asc">Oldest Uploaded</option>
              <option value="fileName-asc">File Name (A - Z)</option>
              <option value="fileName-desc">File Name (Z - A)</option>
              <option value="size-desc">Largest File Size</option>
              <option value="size-asc">Smallest File Size</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs"
                  : "text-slate-400 hover:text-slate-600"
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "list"
                  ? "bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs"
                  : "text-slate-400 hover:text-slate-600"
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── 5. ASSETS GALLERY / DATA TABLE ─── */}
      {isLoading ? (
        /* Shimmer Loading Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 space-y-3 animate-pulse"
            >
              <div className="w-full aspect-square rounded-xl bg-slate-200 dark:bg-slate-800" />
              <div className="h-3 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-2 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      ) : assets.length === 0 ? (
        /* Empty State */
        <div className="p-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <ImageIcon className="w-7 h-7" />
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            No media assets found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {searchQuery
              ? `No images matched "${searchQuery}". Try a different keyword.`
              : selectedFolder !== "all"
              ? `No assets found in folder "${formatFolderLabel(selectedFolder)}".`
              : "No media assets currently indexed in MinIO. Click 'Sync with MinIO' above to scan."}
          </p>
          {selectedFolder !== "all" && (
            <button
              type="button"
              onClick={() => setSelectedFolder("all")}
              className="mt-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 cursor-pointer"
            >
              View All Folders
            </button>
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* ─── Grid View (Click ANY image to open edit drawer) ─── */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {assets.map((asset) => {
            const formattedUrl = formatImageUrl(asset.url);
            const isEditingThis = editingAsset?.id === asset.id;
            return (
              <div
                key={asset.id}
                onClick={() => handleOpenEdit(asset)}
                className={`group bg-white dark:bg-slate-900 rounded-2xl p-2.5 border transition-all duration-200 cursor-pointer flex flex-col justify-between relative shadow-xs hover:shadow-md hover:-translate-y-0.5 ${
                  isEditingThis
                    ? "border-brand-500 ring-2 ring-brand-500/20 bg-brand-50/20 dark:bg-brand-950/20"
                    : "border-slate-200 dark:border-slate-800 hover:border-brand-400"
                }`}
                title="Click to edit image metadata"
              >
                {/* Image Container with Transparent Backdrop */}
                <div className="w-full aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 relative flex items-center justify-center">
                  <Image
                    src={formattedUrl}
                    alt={asset.altText || asset.title || asset.fileName}
                    fill
                    unoptimized
                    loading="eager"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Folder Tag Badge */}
                  <span className="absolute top-2 left-2 text-[9px] font-black uppercase tracking-wider bg-white/90 dark:bg-slate-900/90 text-brand-600 dark:text-brand-400 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700 shadow-xs truncate max-w-[80%]">
                    {formatFolderLabel(asset.folder)}
                  </span>

                  {/* Hover Overlay with Edit Prompt */}
                  <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2 text-white text-center backdrop-blur-2xs">
                    <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-lg">
                      <Edit2 className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-black tracking-wide uppercase">
                      Click to Edit
                    </span>
                  </div>
                </div>

                {/* Information Snippet */}
                <div className="mt-2.5 space-y-1">
                  <h4
                    className="text-xs font-bold text-slate-900 dark:text-white truncate"
                    title={asset.title || asset.fileName}
                  >
                    {asset.title || asset.fileName}
                  </h4>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>{formatBytes(asset.size)}</span>
                    <span className="truncate">{formatDate(asset.uploadedAt).split(",")[0]}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ─── List View (Table rows click to edit) ─── */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Preview</th>
                  <th className="py-3 px-4">File Name / Title</th>
                  <th className="py-3 px-4">Folder</th>
                  <th className="py-3 px-4">SEO Alt Text</th>
                  <th className="py-3 px-4">File Size</th>
                  <th className="py-3 px-4">Uploaded Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {assets.map((asset) => {
                  const formattedUrl = formatImageUrl(asset.url);
                  const isEditingThis = editingAsset?.id === asset.id;
                  return (
                    <tr
                      key={asset.id}
                      onClick={() => handleOpenEdit(asset)}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors cursor-pointer ${
                        isEditingThis
                          ? "bg-brand-50/30 dark:bg-brand-950/30"
                          : ""
                      }`}
                    >
                      {/* Thumbnail */}
                      <td className="py-2.5 px-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 relative flex items-center justify-center">
                          <Image
                            src={formattedUrl}
                            alt={asset.altText || asset.fileName}
                            fill
                            unoptimized
                            loading="eager"
                            className="object-cover"
                          />
                        </div>
                      </td>

                      {/* Title & File Name */}
                      <td className="py-2.5 px-4 max-w-xs">
                        <h5 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                          {asset.title || asset.fileName}
                        </h5>
                        <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                          {asset.fileName}
                        </p>
                      </td>

                      {/* Folder */}
                      <td className="py-2.5 px-4">
                        <span className="text-[10px] font-bold uppercase text-brand-600 bg-brand-50 dark:bg-brand-950 px-2 py-0.5 rounded border border-brand-200 dark:border-brand-800 inline-block">
                          {formatFolderLabel(asset.folder)}
                        </span>
                      </td>

                      {/* Alt text */}
                      <td className="py-2.5 px-4 max-w-xs">
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate italic">
                          {asset.altText ? `"${asset.altText}"` : "-"}
                        </p>
                      </td>

                      {/* Size */}
                      <td className="py-2.5 px-4 font-mono font-bold text-[11px] text-slate-700 dark:text-slate-300">
                        {formatBytes(asset.size)}
                      </td>

                      {/* Date */}
                      <td className="py-2.5 px-4 font-mono text-[10px] text-slate-500 dark:text-slate-400">
                        {formatDate(asset.uploadedAt)}
                      </td>

                      {/* Action */}
                      <td className="py-2.5 px-4 text-right">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => handleCopyUrl(asset.url, asset.id)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-brand-600 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                            title="Copy image URL"
                          >
                            {copiedId === asset.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(asset)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-brand-600 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                            title="Edit metadata"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── 6. PAGINATION BAR (Matching DataTable standard across all modules) ─── */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300 select-none shadow-xs">
        {/* LEFT: Rows Per Page Selector */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-bold">Rows per page:</span>
          <select
            value={pagination.limit}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-extrabold cursor-pointer outline-none focus:border-brand-500 shadow-xs"
          >
            {[10, 20, 50, 100].map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* CENTER: Pagination Controls (First, Second ... Current ... Second-to-last, Last) */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 md:pb-0 no-scrollbar">
          {/* Previous Button */}
          <button
            type="button"
            onClick={() => handlePageChange(Math.max(pagination.page - 1, 1))}
            disabled={pagination.page <= 1 || isLoading}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4 text-slate-700 dark:text-slate-300" />
          </button>

          {/* Page Number Pills */}
          <div className="flex items-center gap-1 shrink-0">
            {getPageNumbers(pagination.page, pagination.totalPages).map((p, idx) => {
              if (p === "...") {
                return (
                  <span key={`ellipsis-${idx}`} className="px-1.5 py-1 text-slate-400 font-mono text-xs">
                    ...
                  </span>
                );
              }
              const pageNum = Number(p);
              const isCurrent = pageNum === pagination.page;
              return (
                <button
                  key={pageNum}
                  type="button"
                  disabled={isLoading}
                  onClick={() => handlePageChange(pageNum)}
                  className={`min-w-[32px] h-8 px-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                    isCurrent
                      ? "bg-brand-500 text-white shadow-lux"
                      : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          {/* Next Button */}
          <button
            type="button"
            onClick={() => handlePageChange(Math.min(pagination.page + 1, pagination.totalPages))}
            disabled={pagination.page >= pagination.totalPages || isLoading}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4 text-slate-700 dark:text-slate-300" />
          </button>
        </div>

        {/* RIGHT: Showing Entries Info */}
        <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px] font-bold">
          Showing {pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}–{Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} entries
        </div>
      </div>

      {/* ─── 7. RIGHT-SIDE SLIDE-OVER EDIT DRAWER ─── */}
      {editingAsset && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/60 backdrop-blur-xs flex justify-end outline-none animate-in fade-in duration-200">
            {/* Backdrop click to close */}
            <div
              className="absolute inset-0"
              onClick={() => {
                if (!isSavingEdit) setEditingAsset(null);
              }}
            />

            {/* Slide-over Right Panel */}
            <form
              onSubmit={handleSaveEdit}
              className="relative z-10 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full sm:w-[480px] md:w-[520px] h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300 outline-none overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-800/30">
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base flex items-center gap-2">
                    <Edit2 className="w-4 h-4 text-brand-600" />
                    <span>Edit Media Metadata</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Update SEO alt tags, title, and descriptive captions
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isSavingEdit}
                  onClick={() => setEditingAsset(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
                {/* Visual Image Preview */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950/5 dark:bg-slate-950 overflow-hidden relative group">
                  <div className="h-56 w-full flex items-center justify-center p-3 relative">
                    <Image
                      src={formatImageUrl(editingAsset.url)}
                      alt={editingAsset.altText || editingAsset.fileName}
                      fill
                      unoptimized
                      className="object-contain p-2"
                    />
                  </div>

                  {/* Quick Overlay Actions */}
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopyUrl(editingAsset.url, editingAsset.id)}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-[11px] text-slate-700 dark:text-slate-300 hover:text-brand-600 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      {copiedId === editingAsset.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Copied URL</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Copy Image Link</span>
                        </>
                      )}
                    </button>

                    <a
                      href={formatImageUrl(editingAsset.url)}
                      target="_blank"
                      rel="noreferrer"
                      className="py-1.5 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-[11px] text-slate-700 dark:text-slate-300 hover:text-brand-600 transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      <span>Open Full Size</span>
                    </a>
                  </div>
                </div>

                {/* Technical File Metadata Card */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-bold">Folder:</span>
                    <span className="font-mono font-bold text-brand-600 bg-brand-50 dark:bg-brand-950 px-2 py-0.5 rounded border border-brand-200 dark:border-brand-800 text-[10px]">
                      {editingAsset.folder}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-bold">File Name:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white truncate max-w-[240px]" title={editingAsset.fileName}>
                      {editingAsset.fileName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-bold">Content Type:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {editingAsset.contentType || "image/png"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-bold">File Size:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {formatBytes(editingAsset.size)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-bold">Uploaded At:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {formatDate(editingAsset.uploadedAt)}
                    </span>
                  </div>
                </div>

                {/* Form Field: Title */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Asset Title
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {editForm.title.length}/200
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={200}
                    placeholder="e.g. Kitchen Chimney Deep Cleaning Service Graphic"
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs focus:outline-none focus:border-brand-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Display name shown in pickers and admin directories.
                  </p>
                </div>

                {/* Form Field: SEO Alt Text */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <span>SEO Alt Text</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded font-black uppercase bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        Accessibility
                      </span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {editForm.altText.length}/500
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={500}
                    placeholder="Describe this image accurately for search engines and visually impaired users..."
                    value={editForm.altText}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, altText: e.target.value }))
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:border-brand-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Used as the HTML &lt;img alt=&quot;...&quot;&gt; attribute on public website pages.
                  </p>
                </div>

                {/* Form Field: Caption */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Caption
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {editForm.caption.length}/500
                    </span>
                  </div>
                  <input
                    type="text"
                    maxLength={500}
                    placeholder="Optional sub-caption or brief tagline..."
                    value={editForm.caption}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, caption: e.target.value }))
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>

                {/* Form Field: Description */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-slate-700 dark:text-slate-300">
                      Detailed Description
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {editForm.description.length}/2000
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={2000}
                    placeholder="Internal notes or extended description for platform catalog documentation..."
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Drawer Footer Actions (Strictly ONE Primary Button per AGENTS.md) */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3 shrink-0 bg-slate-50/50 dark:bg-slate-800/30">
                {/* Secondary Button */}
                <button
                  type="button"
                  disabled={isSavingEdit}
                  onClick={() => setEditingAsset(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>

                {/* Single Primary Button */}
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-black text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {isSavingEdit ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </Portal>
      )}
    </div>
  );
}
