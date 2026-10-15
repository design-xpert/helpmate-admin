"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import {
  FileImage,
  Upload,
  Search,
  Image as ImageIcon,
  CheckCircle2,
  Download,
  Trash2,
  Copy,
  Check,
  Plus,
  Edit2,
  X,
  Tag,
  Grid,
  List,
  Eye,
  Sparkles,
  HardDrive,
  FolderOpen,
  Filter,
  ExternalLink,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { Portal } from "@/components/Portal";

export interface MediaAsset {
  id: string;
  name: string;
  altText: string;
  type: string;
  dimensions: string;
  size: string;
  category: "Branding" | "Campaigns" | "Services" | "Badges" | "Partners";
  tags: string[];
  url: string;
  uploadedAt: string;
}

export default function MediaPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<MediaAsset | null>(null);
  const [previewAsset, setPreviewAsset] = useState<MediaAsset | null>(null);

  // File Upload Extra Metadata State
  const [fileMeta, setFileMeta] = useState<{ type: string; size: string; dimensions: string } | null>(null);

  // Upload Form State
  const [uploadForm, setUploadForm] = useState({
    name: "",
    altText: "",
    category: "Campaigns" as MediaAsset["category"],
    url: "",
    tagsStr: "Varanasi, Marketing",
  });

  // Edit Form State
  const [editForm, setEditForm] = useState({
    name: "",
    altText: "",
    category: "Campaigns" as MediaAsset["category"],
    tagsStr: "",
  });

  // Initial Media Items
  const [assets, setAssets] = useState<MediaAsset[]>([
    {
      id: "media-1",
      name: "HelpMate Brand Logo (Magenta #8D397E)",
      altText: "Official HelpMate brand vector logo high resolution",
      type: "PNG Logo",
      dimensions: "1254 x 1254",
      size: "142 KB",
      category: "Branding",
      tags: ["Logo", "Brand", "Vector"],
      url: "https://helpmate-theta.vercel.app/logo.png",
      uploadedAt: "24 Jul 2026",
    },
    {
      id: "media-2",
      name: "Power Jet AC Service Campaign Banner",
      altText: "AC Foam Jet Servicing promotional banner for Varanasi households",
      type: "WebP Banner",
      dimensions: "1920 x 1080",
      size: "480 KB",
      category: "Campaigns",
      tags: ["AC Service", "Banner", "Summer Campaign"],
      url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80",
      uploadedAt: "22 Jul 2026",
    },
    {
      id: "media-3",
      name: "Elite Deep Cleaning Equipment Showcase",
      altText: "Industrial vacuum and hydro cleaning machines in action",
      type: "JPEG Photo",
      dimensions: "1200 x 800",
      size: "320 KB",
      category: "Services",
      tags: ["Deep Cleaning", "Equipment", "Varanasi"],
      url: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop&q=80",
      uploadedAt: "20 Jul 2026",
    },
    {
      id: "media-4",
      name: "Ayurvedic Home Spa & Wellness Banner",
      altText: "Home salon and massage therapy promotional imagery",
      type: "JPEG Photo",
      dimensions: "1200 x 800",
      size: "290 KB",
      category: "Services",
      tags: ["Salon", "Spa", "Wellness"],
      url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80",
      uploadedAt: "18 Jul 2026",
    },
    {
      id: "media-5",
      name: "Biometric Aadhaar & Police Verified Seal",
      altText: "100% Aadhaar & Police Verified HelpMate Partner Security Seal",
      type: "SVG Vector",
      dimensions: "512 x 512",
      size: "45 KB",
      category: "Badges",
      tags: ["Badge", "KYC", "Security"],
      url: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&auto=format&fit=crop&q=80",
      uploadedAt: "15 Jul 2026",
    },
    {
      id: "media-6",
      name: "Smart Home Wiring & Circuit Inspection",
      altText: "Certified electrician installing MCB fuse box in Sigra locality",
      type: "JPEG Photo",
      dimensions: "1200 x 800",
      size: "380 KB",
      category: "Services",
      tags: ["Electrician", "MCB", "Safety"],
      url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80",
      uploadedAt: "12 Jul 2026",
    },
  ]);

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const matchCategory = selectedCategory === "All" || asset.category === selectedCategory;
      const matchSearch =
        searchQuery === "" ||
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.altText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [assets, selectedCategory, searchQuery]);

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteAsset = (id: string) => {
    if (confirm("Are you sure you want to delete this media asset?")) {
      setAssets(assets.filter((a) => a.id !== id));
    }
  };

  // Local File Selector Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formattedSize = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
      : `${(file.size / 1024).toFixed(0)} KB`;

    const formattedType = file.type.includes("png") ? "PNG Image"
      : file.type.includes("jpeg") || file.type.includes("jpg") ? "JPEG Photo"
      : file.type.includes("svg") ? "SVG Vector"
      : file.type.includes("webp") ? "WebP Asset" : "Image File";

    const cleanTitle = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      
      // Calculate image dimensions
      const img = new window.Image();
      img.onload = () => {
        setFileMeta({
          type: formattedType,
          size: formattedSize,
          dimensions: `${img.width} x ${img.height}`,
        });
      };
      img.src = dataUrl;

      setUploadForm((prev) => ({
        ...prev,
        url: dataUrl,
        name: prev.name || cleanTitle,
        altText: prev.altText || `${cleanTitle} for HelpMate Varanasi`,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.name || !uploadForm.url) return;

    const newAsset: MediaAsset = {
      id: `media-${Date.now()}`,
      name: uploadForm.name,
      altText: uploadForm.altText || uploadForm.name,
      type: fileMeta?.type || "WebP Asset",
      dimensions: fileMeta?.dimensions || "1200 x 800",
      size: fileMeta?.size || "350 KB",
      category: uploadForm.category,
      tags: uploadForm.tagsStr.split(",").map((t) => t.trim()).filter(Boolean),
      url: uploadForm.url,
      uploadedAt: "Just now",
    };

    setAssets([newAsset, ...assets]);
    setIsUploadOpen(false);
    setFileMeta(null);
    setUploadForm({
      name: "",
      altText: "",
      category: "Campaigns",
      url: "",
      tagsStr: "Varanasi, Marketing",
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset || !editForm.name) return;

    setAssets(
      assets.map((a) =>
        a.id === editingAsset.id
          ? {
              ...a,
              name: editForm.name,
              altText: editForm.altText,
              category: editForm.category,
              tags: editForm.tagsStr.split(",").map((t) => t.trim()).filter(Boolean),
            }
          : a
      )
    );

    setEditingAsset(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-10">

      {/* Simple Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileImage className="w-6 h-6 text-brand-600" />
            <span>Media & Brand Asset Management</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Upload, organize, and edit promotional banners, verified badge graphics, and service media files for Varanasi operations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsUploadOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 w-full sm:w-auto"
        >
          <Upload className="w-4 h-4" />
          <span>Add Media</span>
        </button>
      </div>

      {/* ─── 2. EXECUTIVE METRICS RIBBON ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Media Assets</span>
            <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 flex items-center justify-center border border-brand-200 dark:border-brand-800">
              <ImageIcon className="w-4.5 h-4.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{assets.length} Files</p>
          <p className="text-[11px] text-brand-600 dark:text-brand-400 font-bold">100% CDN Optimized</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Storage Utilized</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center border border-purple-200 dark:border-purple-800">
              <HardDrive className="w-4.5 h-4.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400">1.68 MB</p>
          <p className="text-[11px] text-purple-700 dark:text-purple-300 font-bold">Limit: 10.0 GB Cloud Storage</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Asset Categories</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center border border-blue-200 dark:border-blue-800">
              <FolderOpen className="w-4.5 h-4.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">5 Categories</p>
          <p className="text-[11px] text-blue-600 dark:text-blue-400 font-bold">Branding, Campaigns, Badges</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">SEO Alt Tag Coverage</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">100% Tagged</p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">Optimized for Google Search</p>
        </div>
      </div>

      {/* ─── 3. FILTER BAR & VIEW TOGGLE ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-3">
        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {["All", "Branding", "Campaigns", "Services", "Badges", "Partners"].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? "bg-brand-500 text-white shadow-xs font-black"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search & View Mode Switcher */}
        <div className="flex items-center gap-3">
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search title, alt text, or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "grid" ? "bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs" : "text-slate-400"
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === "list" ? "bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs" : "text-slate-400"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ─── 4. MEDIA DISPLAY (GRID / LIST) ─── */}
      {filteredAssets.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <ImageIcon className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-400">No media assets found</p>
          <p className="text-xs text-slate-400">Try adjusting your search query or filter category.</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 hover:border-brand-400 hover:shadow-lg transition-all duration-300 flex flex-col justify-between space-y-4 group"
            >
              {/* Image Box */}
              <div className="h-48 w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 relative">
                {asset.url ? (
                  <Image
                    src={asset.url}
                    alt={asset.altText}
                    fill
                    unoptimized
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : null}
                <span className="absolute top-3 left-3 text-[10px] font-black uppercase bg-white/90 dark:bg-slate-900/90 text-brand-600 dark:text-brand-400 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-xs">
                  {asset.category}
                </span>

                {/* Hover overlay preview button */}
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewAsset(asset)}
                    className="p-2.5 rounded-full bg-white text-slate-900 font-bold hover:scale-110 transition-transform shadow-lg cursor-pointer"
                    title="Quick Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAsset(asset);
                      setEditForm({
                        name: asset.name,
                        altText: asset.altText,
                        category: asset.category,
                        tagsStr: asset.tags.join(", "),
                      });
                    }}
                    className="p-2.5 rounded-full bg-brand-500 text-white font-bold hover:scale-110 transition-transform shadow-lg cursor-pointer"
                    title="Edit Metadata"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Asset Information */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-black text-slate-900 dark:text-white truncate" title={asset.name}>
                  {asset.name}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium line-clamp-2" title={asset.altText}>
                  <span className="font-bold text-slate-400">Alt:</span> &quot;{asset.altText}&quot;
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono font-bold pt-1">
                  <span>{asset.type} · {asset.dimensions}</span>
                  <span>{asset.size}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(asset.url, asset.id)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 text-xs font-bold transition-all cursor-pointer"
                >
                  {copiedId === asset.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Copy URL</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEditingAsset(asset);
                    setEditForm({
                      name: asset.name,
                      altText: asset.altText,
                      category: asset.category,
                      tagsStr: asset.tags.join(", "),
                    });
                  }}
                  className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-brand-600 transition-colors cursor-pointer"
                  title="Edit Name & Alt Text"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteAsset(asset.id)}
                  className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-red-600 transition-colors cursor-pointer"
                  title="Delete Asset"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View: Responsive High-End Data Table */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Media Artwork</th>
                  <th className="py-3.5 px-4">Asset Name & SEO Alt Description</th>
                  <th className="py-3.5 px-4">Category & Tags</th>
                  <th className="py-3.5 px-4">Type & Resolution</th>
                  <th className="py-3.5 px-4">Size</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                    {/* Artwork Preview */}
                    <td className="py-3 px-4">
                      <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 relative group">
                        {asset.url ? (
                          <Image
                            src={asset.url}
                            alt={asset.altText}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setPreviewAsset(asset)}
                          className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                    {/* Name & Alt Tag */}
                    <td className="py-3 px-4 max-w-xs">
                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-white truncate" title={asset.name}>
                        {asset.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5" title={asset.altText}>
                        Alt: &quot;{asset.altText}&quot;
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                        Uploaded: {asset.uploadedAt}
                      </span>
                    </td>

                    {/* Category & Tags */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase text-brand-600 bg-brand-50 dark:bg-brand-950 px-2 py-0.5 rounded border border-brand-200 dark:border-brand-800 inline-block">
                          {asset.category}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {asset.tags.map((t) => (
                            <span key={t} className="text-[9px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded">
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>

                    {/* Type & Resolution */}
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <div className="font-bold text-slate-900 dark:text-white">{asset.type}</div>
                      <div className="text-slate-400 text-[10px]">{asset.dimensions}</div>
                    </td>

                    {/* Size */}
                    <td className="py-3 px-4 font-mono font-bold text-xs text-slate-900 dark:text-white">
                      {asset.size}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopy(asset.url, asset.id)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-brand-600 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                        >
                          {copiedId === asset.id ? "Copied!" : "Copy URL"}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingAsset(asset);
                            setEditForm({
                              name: asset.name,
                              altText: asset.altText,
                              category: asset.category,
                              tagsStr: asset.tags.join(", "),
                            });
                          }}
                          className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-brand-600 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                          title="Edit Metadata"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteAsset(asset.id)}
                          className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-red-600 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                          title="Delete Asset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── SLIDE-OVER DRAWER: UPLOAD NEW ASSET ─── */}
      {isUploadOpen && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/70 backdrop-blur-xs flex justify-end outline-none">
            <div className="absolute inset-0" onClick={() => setIsUploadOpen(false)} />
            <form
              onSubmit={handleUploadSubmit}
              className="relative z-10 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300 outline-none overflow-y-auto"
            >
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-base">Add Media</h3>
                    <p className="text-[11px] text-slate-400">Select local file or enter CDN URL</p>
                  </div>
                  <button type="button" onClick={() => setIsUploadOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Hidden Native File Input */}
                <input
                  id="media-file-input"
                  type="file"
                  accept="image/png, image/jpeg, image/webp, image/svg+xml"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {/* Interactive Clickable Upload Dropzone */}
                <div
                  onClick={() => document.getElementById("media-file-input")?.click()}
                  className="p-6 rounded-2xl border-2 border-dashed border-brand-300 dark:border-brand-800 bg-brand-50/40 dark:bg-brand-950/30 hover:bg-brand-50 text-center space-y-3 transition-all cursor-pointer group"
                >
                  {uploadForm.url ? (
                    <div className="space-y-2">
                      <div className="h-32 w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200 dark:border-slate-700 relative">
                        <Image
                          src={uploadForm.url}
                          alt="Selected preview"
                          fill
                          unoptimized
                          className="object-contain"
                        />
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                        <CheckCircle2 className="w-4 h-4" /> Image Selected ({fileMeta?.dimensions || "Ready"})
                      </span>
                      <p className="text-[10px] text-slate-400">Click to pick a different image file</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-900/60 text-brand-600 dark:text-brand-300 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 dark:text-white text-sm">Click here to browse & upload local image</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Supports PNG, JPEG, WebP, SVG files</p>
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Image URL / CDN Path *</label>
                  <input
                    type="text"
                    required
                    placeholder="https://... or selected file Data URL"
                    value={uploadForm.url}
                    onChange={(e) => setUploadForm({ ...uploadForm, url: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Asset Name / Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Split AC Servicing Campaign Banner"
                    value={uploadForm.name}
                    onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">SEO Alt Text Description *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Describe image for screen readers and search engines..."
                    value={uploadForm.altText}
                    onChange={(e) => setUploadForm({ ...uploadForm, altText: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Category</label>
                    <select
                      value={uploadForm.category}
                      onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value as MediaAsset["category"] })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none"
                    >
                      <option value="Branding">Branding</option>
                      <option value="Campaigns">Campaigns</option>
                      <option value="Services">Services</option>
                      <option value="Badges">Badges</option>
                      <option value="Partners">Partners</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Search Tags (Comma separated)</label>
                    <input
                      type="text"
                      placeholder="AC, Varanasi, Banner"
                      value={uploadForm.tagsStr}
                      onChange={(e) => setUploadForm({ ...uploadForm, tagsStr: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-black text-xs shadow-lux cursor-pointer"
                >
                  Upload & Register Asset
                </button>
              </div>
            </form>
          </div>
        </Portal>
      )}

      {/* ─── SLIDE-OVER DRAWER: EDIT METADATA (NAME, ALT TEXT, CATEGORY) ─── */}
      {editingAsset && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/70 backdrop-blur-xs flex justify-end outline-none">
            <div className="absolute inset-0" onClick={() => setEditingAsset(null)} />
            <form
              onSubmit={handleEditSubmit}
              className="relative z-10 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300 outline-none overflow-y-auto"
            >
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-base">Edit Media Metadata</h3>
                    <p className="text-[11px] text-slate-400">Update name, SEO alt tag, category, and search tags</p>
                  </div>
                  <button type="button" onClick={() => setEditingAsset(null)} className="text-slate-400 hover:text-slate-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Preview Thumbnail */}
                <div className="h-40 w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 dark:border-slate-700 relative">
                  {editingAsset.url ? (
                    <Image
                      src={editingAsset.url}
                      alt={editingAsset.name}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : null}
                  <span className="absolute bottom-2 left-2 text-[10px] font-mono font-bold bg-slate-900/80 text-white px-2 py-0.5 rounded">
                    {editingAsset.dimensions} · {editingAsset.size}
                  </span>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Asset Name / Title *</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">SEO Alt Text Description *</label>
                  <textarea
                    rows={3}
                    required
                    value={editForm.altText}
                    onChange={(e) => setEditForm({ ...editForm, altText: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Category</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value as MediaAsset["category"] })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none"
                  >
                    <option value="Branding">Branding</option>
                    <option value="Campaigns">Campaigns</option>
                    <option value="Services">Services</option>
                    <option value="Badges">Badges</option>
                    <option value="Partners">Partners</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Tags (Comma separated)</label>
                  <input
                    type="text"
                    value={editForm.tagsStr}
                    onChange={(e) => setEditForm({ ...editForm, tagsStr: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingAsset(null)}
                  className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-black text-xs shadow-lux cursor-pointer"
                >
                  Save Metadata Changes
                </button>
              </div>
            </form>
          </div>
        </Portal>
      )}

      {/* ─── PREVIEW MODAL ─── */}
      {previewAsset && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="font-black text-slate-900 dark:text-white text-sm truncate">{previewAsset.name}</h3>
                <button type="button" onClick={() => setPreviewAsset(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="h-80 w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center relative">
                {previewAsset.url ? (
                  <Image
                    src={previewAsset.url}
                    alt={previewAsset.altText}
                    fill
                    unoptimized
                    className="object-contain"
                  />
                ) : null}
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Alt Tag: &quot;{previewAsset.altText}&quot;</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{previewAsset.type} · {previewAsset.dimensions} · {previewAsset.size}</p>
                </div>
                <a
                  href={previewAsset.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-brand-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open High Res</span>
                </a>
              </div>
            </div>
          </div>
        </Portal>
      )}

    </div>
  );
}
