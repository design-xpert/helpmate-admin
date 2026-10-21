"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Portal } from "@/components/Portal";
import {
  Megaphone,
  Upload,
  Eye,
  Image as ImageIcon,
  Sparkles,
  X,
  Plus,
  Link as LinkIcon,
  CheckCircle2,
  Sliders,
  Layers,
  Power,
  Trash2,
  Smartphone,
  Monitor,
  ExternalLink,
  Zap,
  Globe,
  Clock,
  MousePointer,
  Check,
  ChevronRight,
  ShieldCheck,
  Tag,
  BarChart3,
  Copy,
  Info,
  Phone,
  Play,
  CheckCircle,
  FileText,
  Save,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { getWebsiteBannerApi, updateWebsiteBannerApi, formatImageUrl } from "@/lib/api";
import { toast } from "@/components/Toast";

interface PromoBannerItem {
  id: string;
  title: string;
  location: "Homepage Top Carousel" | "Category Offer Banner" | "Checkout Promo";
  imageUrl: string;
  secondImageIconUrl?: string;
  targetUrl: string;
  status: "Active" | "Inactive";
  clicksCount?: number;
  bannerSize?: string;
}

const PRESET_BANNER_IMAGES = [
  { label: "16:9 Hero Banner", dimensions: "1200 x 675 px", aspect: "16/9", url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200&h=675&auto=format&fit=crop&q=80" },
  { label: "4:1 Wide Leaderboard", dimensions: "1200 x 300 px", aspect: "4/1", url: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&h=300&auto=format&fit=crop&q=80" },
  { label: "1:1 Square Mobile", dimensions: "800 x 800 px", aspect: "1/1", url: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&h=800&auto=format&fit=crop&q=80" },
  { label: "3:1 Category Strip", dimensions: "900 x 300 px", aspect: "3/1", url: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=900&h=300&auto=format&fit=crop&q=80" },
  { label: "9:16 Vertical Story", dimensions: "720 x 1280 px", aspect: "9/16", url: "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=720&h=1280&auto=format&fit=crop&q=80" },
];

export default function BannersPage() {
  const [activeTab, setActiveTab] = useState<"popupModal" | "homepageBanners">("popupModal");

  // POPUP STYLE MODE: "rich_text_image" | "pure_image"
  const [popupStyle, setPopupStyle] = useState<"rich_text_image" | "pure_image">("pure_image");

  // WEBSITE VISITOR POPUP API & SYNC STATE
  const [isLoadingBanner, setIsLoadingBanner] = useState(true);
  const [isSavingBanner, setIsSavingBanner] = useState(false);
  const [bannerId, setBannerId] = useState<string | null>(null);

  // File uploads
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [badgeIconFile, setBadgeIconFile] = useState<File | null>(null);
  const [removeBadgeIcon, setRemoveBadgeIcon] = useState(false);

  // WEBSITE VISITOR POPUP COMMON STATE
  const [isBannerEnabled, setIsBannerEnabled] = useState(true);
  const [targetLinkUrl, setTargetLinkUrl] = useState("");
  const [popupDelaySeconds, setPopupDelaySeconds] = useState(3);
  const [popupFrequency, setPopupFrequency] = useState<"once-per-session" | "once-per-24-hours">("once-per-session");
  const [isBannerPreviewOpen, setIsBannerPreviewOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [copiedLink, setCopiedLink] = useState(false);

  // STYLE 1: RICH TEXT + IMAGE MODE STATE
  const [richBannerImage, setRichBannerImage] = useState(
    "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200&auto=format&fit=crop&q=80"
  );
  const [warrantyBadgeText, setWarrantyBadgeText] = useState("FREE 45 DAYS WARRANTY");
  const [supportPhoneText, setSupportPhoneText] = useState("0542-2974740 • 7705004040");
  const [appStoreBtnText, setAppStoreBtnText] = useState("Get it on Google Play");
  const [specialOfferBadgeText, setSpecialOfferBadgeText] = useState("SPECIAL OFFER");
  const [offerHeadline, setOfferHeadline] = useState("15% OFF ON YOUR SECOND AC SERVICE");
  const [offerFeaturePills, setOfferFeaturePills] = useState("PRICE, QUALITY, SERVICE");
  const [featuredServicesSectionTitle, setFeaturedServicesSectionTitle] = useState("FEATURED AC SERVICES");
  const [featuredServicesListText, setFeaturedServicesListText] = useState(
    "Gas Filling, AC Repairing, Duct Cleaning, Electrical Control Setup, Compressor Cleaning, Installation, Uninstallation, AC Shifting, Filter Replacement, Thermostat & Capacitor Replacement"
  );

  // STYLE 2: PURE IMAGE MODE STATE
  const [pureBannerImageUrl, setPureBannerImageUrl] = useState("");
  const [secondBannerIconUrl, setSecondBannerIconUrl] = useState("");
  const [badgeText, setBadgeText] = useState("Verified Partner Special Offer");
  const [badgePosition, setBadgePosition] = useState<"bottom-left" | "bottom-right" | "top-left" | "top-right">("bottom-left");

  // Fetch website banner configuration from API
  const fetchWebsiteBanner = useCallback(async () => {
    try {
      setIsLoadingBanner(true);
      const res = await getWebsiteBannerApi();
      if (res && res.success && res.data) {
        const d = res.data;
        if (d._id) setBannerId(d._id);
        setIsBannerEnabled(d.isActive ?? true);
        setBadgeText(d.badgeText ?? "");
        setBadgePosition(d.badgePosition || "bottom-left");
        setTargetLinkUrl(d.clickTargetUrl || "");
        setPopupDelaySeconds(d.popupDelaySeconds ?? 3);
        setPopupFrequency(d.displayFrequency || "once-per-session");
        if (d.mainImageUrl) setPureBannerImageUrl(formatImageUrl(d.mainImageUrl));
        if (d.badgeIconUrl) {
          setSecondBannerIconUrl(formatImageUrl(d.badgeIconUrl));
          setRemoveBadgeIcon(false);
        } else {
          setSecondBannerIconUrl("");
        }
      }
    } catch (err) {
      console.error("fetchWebsiteBanner error:", err);
      toast.error("Failed to load website banner configuration.");
    } finally {
      setIsLoadingBanner(false);
    }
  }, []);

  useEffect(() => {
    fetchWebsiteBanner();
  }, [fetchWebsiteBanner]);

  // Handle Save / Update Banner
  const handleSaveBanner = async () => {
    if (!pureBannerImageUrl && !mainImageFile) {
      toast.error("Main banner image is required. Please upload an image file.");
      return;
    }

    if (targetLinkUrl.trim()) {
      try {
        const parsed = new URL(targetLinkUrl.trim());
        if (!["http:", "https:"].includes(parsed.protocol)) {
          toast.error("Target URL must start with http:// or https://");
          return;
        }
      } catch {
        toast.error("Please enter a valid HTTP(S) URL for the Click Target URL.");
        return;
      }
    }

    try {
      setIsSavingBanner(true);
      const formData = new FormData();

      if (mainImageFile) {
        formData.append("mainImage", mainImageFile);
      }

      if (badgeIconFile) {
        formData.append("badgeIcon", badgeIconFile);
      } else if (removeBadgeIcon) {
        formData.append("removeBadgeIcon", "true");
      }

      formData.append("badgeText", badgeText.trim());
      formData.append("badgePosition", badgePosition);
      formData.append("clickTargetUrl", targetLinkUrl.trim());
      formData.append("popupDelaySeconds", String(popupDelaySeconds));
      formData.append("displayFrequency", popupFrequency);
      formData.append("isActive", String(isBannerEnabled));

      const res = await updateWebsiteBannerApi(formData);
      if (res && res.success) {
        toast.success(res.message || "Website banner saved successfully!");
        if (res.data) {
          const d = res.data;
          if (d._id) setBannerId(d._id);
          setIsBannerEnabled(d.isActive ?? true);
          setBadgeText(d.badgeText ?? "");
          setBadgePosition(d.badgePosition || "bottom-left");
          setTargetLinkUrl(d.clickTargetUrl || "");
          setPopupDelaySeconds(d.popupDelaySeconds ?? 3);
          setPopupFrequency(d.displayFrequency || "once-per-session");
          if (d.mainImageUrl) setPureBannerImageUrl(formatImageUrl(d.mainImageUrl));
          if (d.badgeIconUrl) {
            setSecondBannerIconUrl(formatImageUrl(d.badgeIconUrl));
            setRemoveBadgeIcon(false);
          } else {
            setSecondBannerIconUrl("");
          }
          setMainImageFile(null);
          setBadgeIconFile(null);
        }
      } else {
        toast.error(res?.message || "Failed to save banner configuration.");
      }
    } catch (err: any) {
      console.error("handleSaveBanner error:", err);
      toast.error(err?.message || "Network error while saving banner configuration.");
    } finally {
      setIsSavingBanner(false);
    }
  };

  // HOMEPAGE PROMO BANNERS STATE
  const [promoBanners, setPromoBanners] = useState<PromoBannerItem[]>([
    {
      id: "b-1",
      title: "Summer AC Servicing Special Offer - 15% OFF",
      location: "Homepage Top Carousel",
      imageUrl: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200&h=675&auto=format&fit=crop&q=80",
      secondImageIconUrl: "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=300&auto=format&fit=crop&q=80",
      targetUrl: "https://helpmate-theta.vercel.app/services/ac",
      status: "Active",
      clicksCount: 1420,
      bannerSize: "16:9 Hero (1200x675)",
    },
    {
      id: "b-2",
      title: "Deep Home Cleaning & Sanitization Deal",
      location: "Category Offer Banner",
      imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&h=300&auto=format&fit=crop&q=80",
      secondImageIconUrl: "https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=300&auto=format&fit=crop&q=80",
      targetUrl: "https://helpmate-theta.vercel.app/services/cleaning",
      status: "Active",
      clicksCount: 890,
      bannerSize: "4:1 Wide Leaderboard (1200x300)",
    },
    {
      id: "b-3",
      title: "Electrical Circuit & MCB Safety Fest",
      location: "Checkout Promo",
      imageUrl: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&h=800&auto=format&fit=crop&q=80",
      secondImageIconUrl: "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=300&auto=format&fit=crop&q=80",
      targetUrl: "https://helpmate-theta.vercel.app/services/electrical",
      status: "Active",
      clicksCount: 640,
      bannerSize: "1:1 Square Mobile (800x800)",
    },
  ]);

  const [isAddBannerOpen, setIsAddBannerOpen] = useState(false);
  const [newBannerTitle, setNewBannerTitle] = useState("");
  const [newBannerLocation, setNewBannerLocation] = useState<"Homepage Top Carousel" | "Category Offer Banner" | "Checkout Promo">("Homepage Top Carousel");
  const [newBannerSize, setNewBannerSize] = useState("16:9 Hero (1200x675)");
  const [newBannerImageUrl, setNewBannerImageUrl] = useState("https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200&h=675&auto=format&fit=crop&q=80");
  const [newBannerSecondIconUrl, setNewBannerSecondIconUrl] = useState("https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=300&auto=format&fit=crop&q=80");
  const [newBannerTargetUrl, setNewBannerTargetUrl] = useState("https://helpmate-theta.vercel.app/services/ac");

  const handleCreatePromoBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBannerTitle.trim()) return;

    const newBanner: PromoBannerItem = {
      id: `b-${Date.now()}`,
      title: newBannerTitle.trim(),
      location: newBannerLocation,
      imageUrl: newBannerImageUrl,
      secondImageIconUrl: newBannerSecondIconUrl,
      targetUrl: newBannerTargetUrl,
      status: "Active",
      clicksCount: 0,
      bannerSize: newBannerSize,
    };

    setPromoBanners([newBanner, ...promoBanners]);
    setNewBannerTitle("");
    setIsAddBannerOpen(false);
  };

  const togglePromoBannerStatus = (id: string) => {
    setPromoBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: b.status === "Active" ? "Inactive" : "Active" } : b))
    );
  };

  const copyTargetUrl = () => {
    navigator.clipboard.writeText(targetLinkUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const parsedFeaturedServices = featuredServicesListText
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const parsedOfferPills = offerFeaturePills
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="space-y-6">

      {/* Simple Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-brand-600" />
            <span>Banners & Visitor Popups</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Manage website visitor popups (Pure Image & Badge), category 2nd image badges, and hero offer banners.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Secondary Button */}
          <button
            type="button"
            onClick={() => setIsBannerPreviewOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 flex-1 sm:flex-none"
          >
            <Eye className="w-4 h-4" />
            <span>Preview Popup</span>
          </button>

          {/* Strictly ONLY ONE Primary Button per view */}
          {activeTab === "popupModal" ? (
            <button
              type="button"
              onClick={handleSaveBanner}
              disabled={isSavingBanner || isLoadingBanner}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-50 flex-1 sm:flex-none"
            >
              {isSavingBanner ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSavingBanner ? "Saving..." : "Save Banner"}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsAddBannerOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 flex-1 sm:flex-none"
            >
              <Plus className="w-4 h-4" />
              <span>Add Banner</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("popupModal")}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "popupModal"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-extrabold"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Megaphone className="w-4 h-4 text-brand-600" />
            <span>Website Visitor Popup Manager</span>
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${activeTab === "popupModal" ? "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300" : "bg-slate-200 dark:bg-slate-700 text-slate-500"}`}>
              {isBannerEnabled ? "LIVE" : "OFF"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("homepageBanners")}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "homepageBanners"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-extrabold"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <ImageIcon className="w-4 h-4 text-purple-600" />
            <span>Homepage Offer Banners</span>
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${activeTab === "homepageBanners" ? "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300" : "bg-slate-200 dark:bg-slate-700 text-slate-500"}`}>
              {promoBanners.length}
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: WEBSITE VISITOR POPUP BANNER CMS */}
      {activeTab === "popupModal" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* LEFT 7 COLS: FORM CONTROLS */}
          <div className="lg:col-span-7 space-y-5">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 shadow-sm">
              
              {/* Status & Style Selector Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400 border border-purple-200 dark:border-purple-800 shrink-0">
                    <Megaphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Website Visitor Popup CMS
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Configure visitor promotional modal design style & content.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    isBannerEnabled
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  }`}>
                    {isBannerEnabled ? "● LIVE ON WEBSITE" : "○ DISABLED"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsBannerEnabled(!isBannerEnabled)}
                    className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer flex items-center ${
                      isBannerEnabled ? "bg-emerald-500 justify-end" : "bg-slate-300 dark:bg-slate-700 justify-start"
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-white shadow-md block" />
                  </button>
                </div>
              </div>

              {/* POPUP STYLE SWITCHER BUTTONS */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <label className="text-xs font-extrabold text-slate-900 dark:text-white block flex items-center justify-between">
                  <span>Select Popup Design Style Option:</span>
                  <span className="text-[10px] text-purple-600 font-bold uppercase">2 Styles Supported</span>
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPopupStyle("rich_text_image")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      popupStyle === "rich_text_image"
                        ? "border-brand-600 bg-brand-50/60 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 ring-1 ring-brand-600 font-extrabold"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-slate-300"
                    }`}
                  >
                    <FileText className="w-4 h-4 text-purple-600 shrink-0" />
                    <div>
                      <div className="text-xs font-black">Rich Text + Image Mode</div>
                      <div className="text-[10px] opacity-75">Offer title, hotline & checklist</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPopupStyle("pure_image")}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      popupStyle === "pure_image"
                        ? "border-brand-600 bg-brand-50/60 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 ring-1 ring-brand-600 font-extrabold"
                        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:border-slate-300"
                    }`}
                  >
                    <ImageIcon className="w-4 h-4 text-purple-600 shrink-0" />
                    <div>
                      <div className="text-xs font-black">Pure Image Mode</div>
                      <div className="text-[10px] opacity-75">Full-bleed banner image only</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* FORM FIELDS FOR STYLE 1: RICH TEXT + IMAGE */}
              {popupStyle === "rich_text_image" ? (
                <div className="space-y-4">
                  {/* Image Upload & Size Presets */}
                  <div className="p-4 rounded-2xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/60 space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="font-extrabold text-purple-900 dark:text-purple-300 text-xs block">
                        Main Showcase Photo Upload & Dimensions
                      </label>
                      <span className="text-[10px] text-purple-700 dark:text-purple-300 font-bold bg-purple-100 dark:bg-purple-900 px-2 py-0.5 rounded-full">
                        Multi-Size Support
                      </span>
                    </div>

                    {/* Image Preview & Upload Box */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                      {/* Live Image Preview Thumbnail */}
                      <div className="relative aspect-[16/9] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-xs">
                        {richBannerImage ? (
                          <img
                            src={formatImageUrl(richBannerImage)}
                            alt="Banner Showcase Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : null}
                        <div className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[9px] font-mono px-1.5 py-0.5 rounded z-10">
                          Preview
                        </div>
                      </div>

                      {/* File Upload Dropzone / Button */}
                      <div className="sm:col-span-2 space-y-2">
                        <label className="flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-purple-300 dark:border-purple-800 hover:border-purple-500 bg-white dark:bg-slate-900 cursor-pointer transition-colors text-xs font-bold text-purple-700 dark:text-purple-300">
                          <Upload className="w-4 h-4 text-purple-600" />
                          <span>Click to Upload Local Image File</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (re) => setRichBannerImage(re.target?.result as string);
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>

                        <div className="flex gap-2 items-center">
                          <span className="text-[10px] text-slate-400 font-bold shrink-0">OR URL:</span>
                          <input
                            type="url"
                            value={richBannerImage}
                            onChange={(e) => setRichBannerImage(e.target.value)}
                            className="flex-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs outline-none"
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Quick Preset Size Selector */}
                    <div className="space-y-1.5 pt-2 border-t border-purple-100 dark:border-purple-900/40">
                      <span className="text-[10px] font-extrabold uppercase text-slate-500 block">
                        Select Preset Image Dimensions & Sizes:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_BANNER_IMAGES.map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => setRichBannerImage(preset.url)}
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                              richBannerImage === preset.url
                                ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                            }`}
                          >
                            <span>{preset.label}</span>
                            <span className="opacity-75 font-mono text-[9px]">({preset.dimensions})</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Top-Left Warranty Badge Text</label>
                      <input
                        type="text"
                        value={warrantyBadgeText}
                        onChange={(e) => setWarrantyBadgeText(e.target.value)}
                        className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs outline-none font-medium"
                        placeholder="e.g. FREE 45 DAYS WARRANTY"
                      />
                    </div>
                  </div>

                  {/* Right Header: Phone, Subtitle & App Store Button */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Support Phone Numbers</label>
                      <input
                        type="text"
                        value={supportPhoneText}
                        onChange={(e) => setSupportPhoneText(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold outline-none"
                        placeholder="0542-2974740 • 7705004040"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Top Right App CTA Button Text</label>
                      <input
                        type="text"
                        value={appStoreBtnText}
                        onChange={(e) => setAppStoreBtnText(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold outline-none"
                        placeholder="Get it on Google Play"
                      />
                    </div>
                  </div>

                  {/* Special Offer Box Content */}
                  <div className="p-4 rounded-2xl bg-pink-50/50 dark:bg-purple-950/20 border border-pink-200 dark:border-purple-900/60 space-y-3">
                    <label className="font-extrabold text-purple-900 dark:text-purple-300 text-xs block">
                      Special Offer Box Details
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Badge Title</label>
                        <input
                          type="text"
                          value={specialOfferBadgeText}
                          onChange={(e) => setSpecialOfferBadgeText(e.target.value)}
                          className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs outline-none font-bold"
                          placeholder="SPECIAL OFFER"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Offer Tag Pills (comma separated)</label>
                        <input
                          type="text"
                          value={offerFeaturePills}
                          onChange={(e) => setOfferFeaturePills(e.target.value)}
                          className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs outline-none font-bold"
                          placeholder="PRICE, QUALITY, SERVICE"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Main Offer Headline</label>
                        <input
                          type="text"
                          value={offerHeadline}
                          onChange={(e) => setOfferHeadline(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-black outline-none focus:border-brand-500"
                          placeholder="15% OFF ON YOUR SECOND AC SERVICE"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Featured Services Checklist */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Services Section Title</label>
                        <input
                          type="text"
                          value={featuredServicesSectionTitle}
                          onChange={(e) => setFeaturedServicesSectionTitle(e.target.value)}
                          className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs outline-none font-bold"
                          placeholder="FEATURED AC SERVICES"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">Checklist Items (comma separated)</label>
                        <textarea
                          rows={3}
                          value={featuredServicesListText}
                          onChange={(e) => setFeaturedServicesListText(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs outline-none font-medium resize-none"
                          placeholder="Gas Filling, AC Repairing, Duct Cleaning..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* FORM FIELDS FOR STYLE 2: PURE IMAGE (API BACKEND SYNCED) */
                <div className="space-y-4">
                  {/* Main Banner Image Upload */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
                    <label className="font-extrabold text-slate-900 dark:text-white text-xs block flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-brand-600" />
                        <span>Main Banner Showcase Image</span>
                      </span>
                      <span className="text-[10px] text-brand-600 dark:text-brand-400 font-bold uppercase">Required File</span>
                    </label>

                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                      <div className="w-28 h-20 rounded-2xl overflow-hidden border-2 border-brand-500 shrink-0 bg-slate-200 dark:bg-slate-700 shadow-md relative group flex items-center justify-center">
                        {pureBannerImageUrl ? (
                          <img
                            src={formatImageUrl(pureBannerImageUrl)}
                            alt="Visitor Banner Image"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-2 text-center text-[10px] font-bold">
                            <ImageIcon className="w-5 h-5 mb-1" />
                            <span>No Image</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 space-y-2 w-full">
                        <div className="flex items-center gap-2 flex-wrap">
                          <label className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors">
                            <Upload className="w-3.5 h-3.5" />
                            <span>{mainImageFile ? "Change Image File" : "Upload Banner Image"}</span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setMainImageFile(file);
                                  const preview = URL.createObjectURL(file);
                                  setPureBannerImageUrl(preview);
                                }
                              }}
                            />
                          </label>
                          <span className="text-[11px] text-slate-400 font-medium">PNG, JPG, WebP up to 5MB</span>
                        </div>
                        {mainImageFile ? (
                          <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Selected file: {mainImageFile.name} ({(mainImageFile.size / 1024).toFixed(1)} KB)</span>
                          </div>
                        ) : pureBannerImageUrl ? (
                          <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                            Current: {pureBannerImageUrl}
                          </div>
                        ) : (
                          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                            Please select an image file to display on the visitor modal.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Secondary Icon Badge & Overlay Text */}
                  <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60 space-y-3">
                    <label className="font-extrabold text-purple-900 dark:text-purple-300 text-xs block flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span>Secondary Icon Badge &amp; Overlay Text</span>
                      </span>
                      <span className="text-[10px] text-purple-600 font-bold uppercase">Optional Floating Badge</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex gap-2 items-center">
                        <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-purple-500 shrink-0 bg-white dark:bg-slate-800 shadow-md p-1 relative flex items-center justify-center">
                          {secondBannerIconUrl ? (
                            <img
                              src={formatImageUrl(secondBannerIconUrl)}
                              alt="Second Icon Badge"
                              className="w-full h-full object-contain p-0.5"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[9px] text-slate-400 text-center font-medium">
                              No Icon
                            </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <label className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer w-fit shadow-xs">
                              <Upload className="w-3 h-3" />
                              <span>{badgeIconFile ? "Change Icon" : "Upload Icon"}</span>
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setBadgeIconFile(file);
                                    setRemoveBadgeIcon(false);
                                    const preview = URL.createObjectURL(file);
                                    setSecondBannerIconUrl(preview);
                                  }
                                }}
                              />
                            </label>

                            {secondBannerIconUrl && (
                              <button
                                type="button"
                                onClick={() => {
                                  setBadgeIconFile(null);
                                  setSecondBannerIconUrl("");
                                  setRemoveBadgeIcon(true);
                                }}
                                className="px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer border border-red-200 dark:border-red-800 transition-colors"
                                title="Remove badge icon"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Remove</span>
                              </button>
                            )}
                          </div>

                          {badgeIconFile ? (
                            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 block truncate">
                              ✓ {badgeIconFile.name}
                            </span>
                          ) : removeBadgeIcon ? (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium block">
                              Icon will be removed on save
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-medium block">
                              PNG, JPG, WebP icon
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-0.5">
                            Badge Text (Max 150 chars)
                          </label>
                          <input
                            type="text"
                            maxLength={150}
                            value={badgeText}
                            onChange={(e) => setBadgeText(e.target.value)}
                            placeholder="e.g. Verified Partner Special Offer"
                            className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs outline-none focus:border-purple-500 font-medium"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-0.5">Badge Position</label>
                          <select
                            value={badgePosition}
                            onChange={(e) => setBadgePosition(e.target.value as any)}
                            className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs outline-none focus:border-purple-500 font-bold cursor-pointer"
                          >
                            <option value="bottom-left">Bottom Left</option>
                            <option value="bottom-right">Bottom Right</option>
                            <option value="top-left">Top Left</option>
                            <option value="top-right">Top Right</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TARGET REDIRECTION & POPUP DISPLAY BEHAVIOR */}
              <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Banner Click Target URL (Website Redirection)
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <LinkIcon className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="url"
                        value={targetLinkUrl}
                        onChange={(e) => setTargetLinkUrl(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs outline-none focus:border-brand-500"
                        placeholder="https://example.com/services"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={copyTargetUrl}
                      className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-brand-600 font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? "Copied!" : "Copy"}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Popup Delay Timer
                    </label>
                    <select
                      value={popupDelaySeconds}
                      onChange={(e) => setPopupDelaySeconds(Number(e.target.value))}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none font-bold cursor-pointer"
                    >
                      <option value={0}>Instant (0 sec)</option>
                      <option value={2}>2 Seconds</option>
                      <option value={3}>3 Seconds (Recommended)</option>
                      <option value={5}>5 Seconds</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Display Frequency
                    </label>
                    <select
                      value={popupFrequency}
                      onChange={(e) => setPopupFrequency(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none font-bold cursor-pointer"
                    >
                      <option value="once-per-session">Once Per Session</option>
                      <option value="once-per-24-hours">Once Every 24 Hours</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SAVE ACTION BUTTON ROW AT FORM BOTTOM */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  {isLoadingBanner ? (
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Fetching live settings...
                    </span>
                  ) : bannerId ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Synced with backend
                    </span>
                  ) : (
                    <span>Ready to save configuration</span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSaveBanner}
                  disabled={isSavingBanner || isLoadingBanner}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white font-extrabold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingBanner ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{isSavingBanner ? "Saving Changes..." : "Save Banner Configuration"}</span>
                </button>
              </div>

            </div>
          </div>

          {/* RIGHT 5 COLS: STICKY INTERACTIVE PREVIEW CANVAS */}
          <div className="lg:col-span-5 sticky self-start" style={{ top: "calc(5rem + 1.5rem)" }}>
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
              
              {/* Device Preview Header Bar */}
              <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/30">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-purple-600 shrink-0" />
                  <span className="font-black text-xs text-slate-900 dark:text-white">Live Interactive Studio</span>
                </div>

                <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("desktop")}
                    className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                      previewDevice === "desktop"
                        ? "bg-brand-600 text-white shadow-xs"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                    title="Desktop Preview"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice("mobile")}
                    className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                      previewDevice === "mobile"
                        ? "bg-brand-600 text-white shadow-xs"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                    title="Mobile Preview"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Website Canvas Mockup Frame */}
              <div className="p-4 bg-slate-950/90 relative overflow-hidden flex items-center justify-center min-h-[420px]">
                
                {/* Background blurred mockup */}
                <div className="absolute inset-0 opacity-15 pointer-events-none p-4 space-y-4 filter blur-xs">
                  <div className="h-8 bg-slate-700 rounded-xl w-full" />
                  <div className="h-32 bg-slate-800 rounded-2xl w-full" />
                </div>

                {/* STYLE 1: RICH TEXT + IMAGE PREVIEW IN STUDIO */}
                {popupStyle === "rich_text_image" ? (
                  <div className={`relative transition-all duration-300 z-10 ${
                    previewDevice === "mobile" ? "w-[260px]" : "w-[380px]"
                  }`}>
                    <div className="rounded-2xl overflow-hidden shadow-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 relative">
                      {/* Close button */}
                      <div className="absolute top-2 right-2 z-30 w-6 h-6 rounded-full bg-slate-900/80 text-white flex items-center justify-center">
                        <X className="w-3 h-3" />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-12">
                        {/* Left image half */}
                        <div className="md:col-span-5 relative bg-slate-800 min-h-[140px] md:min-h-[220px]">
                          {richBannerImage ? (
                            <img
                              src={formatImageUrl(richBannerImage)}
                              alt="Showcase"
                              className="w-full h-full object-cover"
                            />
                          ) : null}
                          {warrantyBadgeText && (
                            <div className="absolute top-2 left-2 w-12 h-12 rounded-full border border-dashed border-white/80 text-white font-black text-[7px] uppercase tracking-wider flex items-center justify-center text-center p-1 bg-black/40 backdrop-blur-xs">
                              {warrantyBadgeText}
                            </div>
                          )}
                          <div className="absolute bottom-2 left-2 bg-white/95 dark:bg-slate-900/95 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 text-[8px] font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                            <span>HM</span>
                            <span className="truncate">Helpmate</span>
                          </div>
                        </div>

                        {/* Right text content half */}
                        <div className="md:col-span-7 p-3 space-y-2 text-left">
                          <div>
                            <span className="text-[7px] font-black uppercase text-purple-700 dark:text-purple-400 block tracking-widest">
                              BOOK VERIFIED SUPPORT
                            </span>
                            <span className="text-[9px] font-bold text-slate-800 dark:text-slate-200 block truncate">
                              📞 {supportPhoneText}
                            </span>
                          </div>

                          {/* Offer card */}
                          <div className="p-2 rounded-xl bg-pink-50/60 dark:bg-purple-950/40 border border-pink-200 dark:border-purple-800/60 space-y-1">
                            <span className="text-[7px] font-black uppercase text-purple-800 dark:text-purple-300 block">
                              {specialOfferBadgeText}
                            </span>
                            <h5 className="font-black text-[10px] text-slate-900 dark:text-white leading-tight">
                              {offerHeadline}
                            </h5>
                            <div className="flex flex-wrap gap-1">
                              {parsedOfferPills.map((pill) => (
                                <span key={pill} className="text-[6px] font-black bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1 py-0.2 rounded border border-slate-200">
                                  {pill}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Services */}
                          <div>
                            <span className="text-[7px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-widest block mb-1">
                              ✨ {featuredServicesSectionTitle}
                            </span>
                            <div className="grid grid-cols-2 gap-1 text-[7px] font-bold text-slate-700 dark:text-slate-300">
                              {parsedFeaturedServices.slice(0, 6).map((svc) => (
                                <span key={svc} className="flex items-center gap-0.5 truncate">
                                  <CheckCircle className="w-2 h-2 text-emerald-500 shrink-0" /> {svc}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* STYLE 2: PURE IMAGE PREVIEW IN STUDIO */
                  <div className={`relative transition-all duration-300 z-10 ${
                    previewDevice === "mobile" ? "w-[240px]" : "w-[340px]"
                  }`}>
                    <div className="rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-slate-900 group">
                      <div className="absolute top-2.5 right-2.5 z-30 p-1.5 rounded-full bg-slate-950/70 text-white hover:bg-slate-950 transition-colors shadow-lg">
                        <X className="w-3.5 h-3.5" />
                      </div>

                      <div className="relative w-full aspect-[16/10] bg-slate-800 overflow-hidden flex items-center justify-center">
                        {pureBannerImageUrl ? (
                          <img
                            src={formatImageUrl(pureBannerImageUrl)}
                            alt="Pure Image Promo Popup"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                            <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                            <span className="text-[11px] font-semibold">No Banner Image</span>
                          </div>
                        )}

                        {(secondBannerIconUrl || badgeText) && (
                          <div className={`absolute z-20 p-1.5 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl border border-white/40 flex items-center gap-1.5 max-w-[170px] ${
                            badgePosition === "bottom-left" ? "bottom-2.5 left-2.5" :
                            badgePosition === "bottom-right" ? "bottom-2.5 right-2.5" :
                            badgePosition === "top-left" ? "top-2.5 left-2.5" : "top-2.5 right-2.5"
                          }`}>
                            {secondBannerIconUrl && (
                              <div className="relative w-6 h-6 shrink-0 overflow-hidden flex items-center justify-center">
                                <img
                                  src={formatImageUrl(secondBannerIconUrl)}
                                  alt="Second Icon Badge"
                                  className="w-full h-full object-contain rounded-md"
                                />
                              </div>
                            )}
                            {badgeText && (
                              <span className="text-[9px] font-black text-slate-900 dark:text-white leading-tight truncate">
                                {badgeText}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Info Footer */}
              <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-[11px] text-slate-500 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-purple-600" />
                  <span>Triggers in <strong>{popupDelaySeconds}s</strong></span>
                </span>
                <button
                  type="button"
                  onClick={() => setIsBannerPreviewOpen(true)}
                  className="font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  Full Screen Test Modal →
                </button>
              </div>

            </div>
          </div>

        </div>
      )}



      {/* TAB 3: HOMEPAGE OFFER BANNERS */}
      {activeTab === "homepageBanners" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                Homepage Carousel & Offer Banners ({promoBanners.length})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage promotional banners placed in hero carousels and checkout sidebars.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddBannerOpen(true)}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-md flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Banner
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {promoBanners.map((banner) => (
              <div
                key={banner.id}
                className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden flex flex-col justify-between group hover:shadow-md transition-all"
              >
                <div>
                  <div className="relative aspect-[16/9] bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    {banner.imageUrl ? (
                      <img
                        src={formatImageUrl(banner.imageUrl)}
                        alt={banner.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : null}

                    <div className="absolute top-3 left-3 z-10">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1 ${
                        banner.status === "Active"
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-900/80 text-white backdrop-blur-md"
                      }`}>
                        <CheckCircle2 className="w-3 h-3" /> {banner.status}
                      </span>
                    </div>

                    {banner.secondImageIconUrl && (
                      <div className="absolute bottom-3 right-3 z-10 w-9 h-9 rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1 shadow-md border border-white/40 overflow-hidden flex items-center justify-center">
                        <img
                          src={formatImageUrl(banner.secondImageIconUrl)}
                          alt="2nd Badge"
                          className="w-full h-full object-contain p-0.5"
                        />
                      </div>
                    )}
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-2.5 py-0.5 rounded-full border border-brand-200 dark:border-brand-800">
                        {banner.location}
                      </span>
                      {banner.bannerSize && (
                        <span className="text-[9px] font-mono font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800">
                          {banner.bannerSize}
                        </span>
                      )}
                      {banner.clicksCount !== undefined && (
                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                          <MousePointer className="w-3 h-3 text-purple-500" /> {banner.clicksCount} Clicks
                        </span>
                      )}
                    </div>

                    <h4 className="font-extrabold text-slate-900 dark:text-white text-xs leading-snug line-clamp-2">
                      {banner.title}
                    </h4>

                    <p className="text-[10px] text-slate-400 font-mono truncate">
                      {banner.targetUrl}
                    </p>
                  </div>
                </div>

                <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => togglePromoBannerStatus(banner.id)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
                      banner.status === "Active"
                        ? "bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300"
                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                    }`}
                  >
                    {banner.status === "Active" ? "Pause Banner" : "Activate Banner"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setPromoBanners(promoBanners.filter((b) => b.id !== banner.id))}
                    className="p-1.5 rounded-xl bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300 border border-red-200 dark:border-red-800 hover:bg-red-100 transition-colors cursor-pointer"
                    title="Delete Banner"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}



      {/* ADD HOMEPAGE OFFER BANNER MODAL */}
      {isAddBannerOpen && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Add New Offer Banner</h3>
                <button type="button" onClick={() => setIsAddBannerOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreatePromoBanner} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Banner Title *</label>
                  <input
                    type="text"
                    required
                    value={newBannerTitle}
                    onChange={(e) => setNewBannerTitle(e.target.value)}
                    placeholder="e.g. Special Festive 20% Discount"
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Target Location</label>
                    <select
                      value={newBannerLocation}
                      onChange={(e) => setNewBannerLocation(e.target.value as any)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold outline-none cursor-pointer"
                    >
                      <option value="Homepage Top Carousel">Homepage Top Carousel</option>
                      <option value="Category Offer Banner">Category Offer Banner</option>
                      <option value="Checkout Promo">Checkout Promo</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Target Redirection URL</label>
                    <input
                      type="url"
                      value={newBannerTargetUrl}
                      onChange={(e) => setNewBannerTargetUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-[10px] outline-none"
                    />
                  </div>
                </div>

                {/* Banner Size / Aspect Ratio Selector */}
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Select Banner Size / Aspect Ratio</label>
                  <select
                    value={newBannerSize}
                    onChange={(e) => setNewBannerSize(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold outline-none cursor-pointer"
                  >
                    <option value="16:9 Hero (1200x675)">16:9 Hero Banner (1200 x 675 px)</option>
                    <option value="4:1 Wide Leaderboard (1200x300)">4:1 Wide Leaderboard (1200 x 300 px)</option>
                    <option value="1:1 Square Mobile (800x800)">1:1 Square Mobile App (800 x 800 px)</option>
                    <option value="3:1 Category Strip (900x300)">3:1 Category Strip (900 x 300 px)</option>
                    <option value="9:16 Vertical Story (720x1280)">9:16 Vertical Story (720 x 1280 px)</option>
                  </select>
                </div>

                {/* Image Upload Dropzone & Multi-Size Presets */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-extrabold text-slate-900 dark:text-white block">
                      Main Banner Image File & Presets
                    </label>
                    <span className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-bold">
                      JPG, PNG, WEBP
                    </span>
                  </div>

                  {/* Upload Box & URL Input */}
                  <div className="flex flex-col sm:flex-row gap-2.5 items-center">
                    <label className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-xs transition-colors">
                      <Upload className="w-4 h-4" /> Upload Local Image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (re) => setNewBannerImageUrl(re.target?.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>

                    <input
                      type="url"
                      value={newBannerImageUrl}
                      onChange={(e) => setNewBannerImageUrl(e.target.value)}
                      placeholder="Or paste image URL..."
                      className="w-full flex-1 p-2 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-[10px] bg-white dark:bg-slate-900"
                    />
                  </div>

                  {/* Preset Size Images */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">
                      Quick Preset Dimension Images:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {PRESET_BANNER_IMAGES.map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => {
                            setNewBannerImageUrl(preset.url);
                            setNewBannerSize(`${preset.aspect} ${preset.label} (${preset.dimensions})`);
                          }}
                          className={`p-1.5 rounded-xl border text-left text-[10px] transition-all cursor-pointer flex items-center gap-2 ${
                            newBannerImageUrl === preset.url
                              ? "bg-brand-50 dark:bg-brand-950/60 border-brand-500 font-bold text-brand-700 dark:text-brand-300"
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          <div className="relative w-7 h-7 rounded overflow-hidden shrink-0">
                            <img
                              src={preset.url}
                              alt={preset.label}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold truncate">{preset.label}</div>
                            <div className="opacity-75 text-[9px] font-mono">{preset.dimensions}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddBannerOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-600 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-brand-600 text-white font-extrabold shadow-md cursor-pointer"
                  >
                    Save Banner
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* LIVE FULL SCREEN WEBSITE VISITOR POPUP TEST PREVIEW MODAL */}
      {isBannerPreviewOpen && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
            
            {/* FULL SCREEN MODAL BODY */}
            {popupStyle === "rich_text_image" ? (
              /* STYLE 1: EXACT MATCH TO USER'S SCREENSHOT (RICH TEXT + IMAGE) */
              <div className="relative max-w-4xl w-full rounded-[36px] overflow-hidden shadow-2xl bg-white dark:bg-slate-900 border border-white/20 animate-in zoom-in-95 duration-200 text-slate-900 dark:text-white">
                
                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setIsBannerPreviewOpen(false)}
                  className="absolute top-5 right-5 z-40 w-10 h-10 rounded-full bg-[#352c42] text-white hover:bg-slate-900 flex items-center justify-center transition-colors shadow-lg cursor-pointer"
                  title="Close Preview"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-12 min-h-[480px]">
                  {/* Left Side: Photo + Badges */}
                  <div className="md:col-span-5 relative bg-slate-800 overflow-hidden min-h-[260px] md:min-h-full">
                    {richBannerImage ? (
                      <img
                        src={formatImageUrl(richBannerImage)}
                        alt="Service Technician Showcase"
                        className="w-full h-full object-cover"
                      />
                    ) : null}

                    {/* Circular Warranty Badge top left */}
                    {warrantyBadgeText && (
                      <div className="absolute top-6 left-6 z-20 w-24 h-24 rounded-full border-2 border-dashed border-white/80 text-white font-black text-[9px] uppercase tracking-wider flex items-center justify-center text-center p-2 backdrop-blur-xs bg-black/20 shadow-xl">
                        {warrantyBadgeText}
                      </div>
                    )}

                    {/* Helpmate Logo & Subtitle bottom left */}
                    <div className="absolute bottom-6 left-6 z-20 flex flex-col gap-1">
                      <div className="px-3.5 py-1.5 rounded-xl bg-white/95 dark:bg-slate-900/95 border border-white/40 shadow-xl flex items-center gap-2 w-fit">
                        <div className="w-6 h-6 rounded-md bg-[#6b1652] text-white font-black text-[10px] flex items-center justify-center">
                          HM
                        </div>
                        <span className="font-black text-xs text-slate-900 dark:text-white tracking-tight">
                          HELPMATE
                        </span>
                      </div>
                      <p className="text-[11px] text-white/90 font-bold italic drop-shadow-md pl-1">
                        Helpmate for your home care
                      </p>
                    </div>
                  </div>

                  {/* Right Side: Rich Text, Offer Box & Checklist */}
                  <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                    {/* Top Support & App Store Row */}
                    <div className="flex items-start justify-between gap-4 pr-12">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-black uppercase text-[#6b1652] dark:text-purple-400 tracking-widest block">
                          BOOK VERIFIED SUPPORT
                        </span>
                        <div className="flex items-center gap-2 text-sm sm:text-base font-black text-[#4a0d39] dark:text-white">
                          <Phone className="w-4 h-4 text-[#6b1652] dark:text-purple-400" />
                          <span>{supportPhoneText}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => window.open(targetLinkUrl, "_blank")}
                        className="px-4 py-2 rounded-full bg-[#0e0c1a] hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer transition-colors shrink-0"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span>{appStoreBtnText}</span>
                      </button>
                    </div>

                    {/* Special Offer Highlight Box */}
                    <div className="rounded-3xl border border-[#f0c7e2] dark:border-purple-900/60 bg-[#fbf2f8] dark:bg-purple-950/30 p-5 space-y-3 shadow-2xs">
                      <span className="text-[10px] font-black uppercase text-[#731257] dark:text-purple-300 tracking-widest block">
                        {specialOfferBadgeText}
                      </span>
                      <h3 className="font-black text-lg sm:text-xl text-[#0e0c1a] dark:text-white leading-tight">
                        {offerHeadline}
                      </h3>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {parsedOfferPills.map((pill) => (
                          <span key={pill} className="px-3 py-1 rounded-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[9px] font-black uppercase tracking-wider border border-slate-200/80 dark:border-slate-700">
                            {pill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Featured Services Checklist */}
                    <div className="space-y-3">
                      <span className="text-[11px] font-bold text-[#6b1652] dark:text-purple-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        {featuredServicesSectionTitle}
                      </span>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                        {parsedFeaturedServices.map((service) => (
                          <div key={service} className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-300 dark:border-emerald-800">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                            <span className="truncate">{service}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Action */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[11px] font-mono truncate max-w-xs">
                        {targetLinkUrl}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsBannerPreviewOpen(false)}
                        className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold cursor-pointer transition-colors shadow-sm"
                      >
                        Close Modal Preview
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* STYLE 2: PURE IMAGE MODAL PREVIEW */
              <div className="relative max-w-2xl w-full rounded-3xl overflow-hidden shadow-2xl border border-white/20 animate-in zoom-in-95 duration-200 group">
                <button
                  type="button"
                  onClick={() => setIsBannerPreviewOpen(false)}
                  className="absolute top-4 right-4 z-30 p-2 rounded-full bg-slate-950/80 text-white hover:bg-slate-950 transition-colors shadow-lg cursor-pointer"
                  title="Close Visitor Modal Preview"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="relative w-full aspect-[16/9] sm:aspect-[16/8] bg-slate-900 overflow-hidden flex items-center justify-center">
                  {pureBannerImageUrl ? (
                    <img
                      src={formatImageUrl(pureBannerImageUrl)}
                      alt="Pure Image Visitor Promo Popup Banner"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                      <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                      <span className="text-sm font-semibold">No Banner Image</span>
                    </div>
                  )}

                  {(secondBannerIconUrl || badgeText) && (
                    <div className={`absolute z-20 p-2.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl border border-white/40 flex items-center gap-2 max-w-[220px] ${
                      badgePosition === "bottom-left" ? "bottom-4 left-4" :
                      badgePosition === "bottom-right" ? "bottom-4 right-4" :
                      badgePosition === "top-left" ? "top-4 left-4" : "top-4 right-4"
                    }`}>
                      {secondBannerIconUrl && (
                        <div className="relative w-8 h-8 rounded-lg shrink-0 overflow-hidden flex items-center justify-center">
                          <img
                            src={formatImageUrl(secondBannerIconUrl)}
                            alt="Second Icon Badge"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )}
                      {badgeText && (
                        <span className="text-[11px] font-extrabold text-slate-900 dark:text-white leading-tight">
                          {badgeText}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-4 bg-slate-900 text-white flex items-center justify-between text-xs border-t border-slate-800">
                  <span className="text-slate-400 text-[11px] font-mono truncate max-w-sm">
                    Target URL: {targetLinkUrl}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsBannerPreviewOpen(false)}
                    className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold cursor-pointer transition-colors shadow-sm"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            )}
          </div>
        </Portal>
      )}

    </div>
  );
}
