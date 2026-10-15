"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Flame,
  Trash2,
  X,
  Save,
  Loader2,
} from "lucide-react";
import { Portal } from "@/components/Portal";
import { TrendingServiceCard } from "./types";
import { SectionCardImage } from "./SectionCardImage";
import { TrendingCardShimmerGrid } from "./SectionShimmers";
import { formatImageUrl, getTitleInitials } from "@/lib/api";

interface TrendingServicesSectionProps {
  trendingServices: TrendingServiceCard[];
  searchQuery: string;
  isTrendingLoading: boolean;
  onUpdateTrendingServices: (updater: (prev: TrendingServiceCard[]) => TrendingServiceCard[]) => void;
  onRequestDelete: (id: string, name: string) => void;
  onOpenCatalogPicker: () => void;
}

export function TrendingServicesSection({
  trendingServices,
  searchQuery,
  isTrendingLoading,
  onUpdateTrendingServices,
  onRequestDelete,
  onOpenCatalogPicker,
}: TrendingServicesSectionProps) {
  const [trendingModal, setTrendingModal] = useState<{
    open: boolean;
    mode: "add" | "edit";
    data: Partial<TrendingServiceCard>;
  }>({
    open: false,
    mode: "add",
    data: {},
  });
  const [isSavingTrending, setIsSavingTrending] = useState(false);

  const filteredTrending = trendingServices.filter(
    (t) =>
      !searchQuery ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleTrendingActive = (id: string) => {
    onUpdateTrendingServices((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isActive: !t.isActive } : t))
    );
  };

  const saveTrending = () => {
    if (isSavingTrending) return;
    const d = trendingModal.data;
    if (!d.title || !d.imageUrl) return;

    setIsSavingTrending(true);
    try {
      if (trendingModal.mode === "add") {
        const newTrending: TrendingServiceCard = {
          id: `trend-${Date.now()}`,
          title: d.title!,
          category: d.category || "General",
          durationMins: d.durationMins || 60,
          rating: d.rating || 4.9,
          reviewsCount: d.reviewsCount || 100,
          description: d.description || "",
          discountPercentage: d.discountPercentage || "20% OFF",
          price: d.price || "999",
          originalPrice: d.originalPrice || "1499",
          imageUrl: d.imageUrl!,
          bookCtaText: d.bookCtaText || "Book Now →",
          bookCtaLink: d.bookCtaLink || "/services",
          isActive: d.isActive ?? true,
          sortOrder: d.sortOrder || trendingServices.length + 1,
        };
        onUpdateTrendingServices((prev) => [...prev, newTrending]);
      } else {
        onUpdateTrendingServices((prev) =>
          prev.map((t) => (t.id === d.id ? ({ ...t, ...d } as TrendingServiceCard) : t))
        );
      }
      setTrendingModal({ open: false, mode: "add", data: {} });
    } finally {
      setIsSavingTrending(false);
    }
  };

  const inputCls =
    "w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500";

  return (
    <div className="space-y-6">
      {/* Cards Edit Grid & Selection */}
      <div className="space-y-4">
        {isTrendingLoading ? (
          <TrendingCardShimmerGrid count={6} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTrending.map((item) => (
              <div
                key={item.id}
                className={`rounded-2xl border overflow-hidden bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all ${
                  item.isActive
                    ? "border-slate-200 dark:border-slate-700"
                    : "border-dashed border-slate-300 dark:border-slate-700 opacity-60"
                }`}
              >
                <div className="relative h-36 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <SectionCardImage
                    src={item.imageUrl}
                    packageId={item.packageId || item.id}
                    title={item.title}
                    badgeSize="w-12 h-12 text-xl"
                    fallback="TS"
                  />
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                    {item.discountPercentage}
                  </div>
                  <div
                    className={`absolute top-2 right-2 text-[9px] font-black px-2 py-0.5 rounded-full ${
                      item.isActive ? "bg-emerald-500 text-white" : "bg-slate-500 text-white"
                    }`}
                  >
                    {item.isActive ? "LIVE" : "HIDDEN"}
                  </div>
                </div>

                <div className="p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                    <span>
                      {item.category} • {item.durationMins} mins
                    </span>
                    <span className="text-amber-500 font-bold">★ {item.rating}</span>
                  </div>

                  <h4 className="font-black text-xs text-slate-900 dark:text-white leading-snug line-clamp-1">
                    {item.title}
                  </h4>
                  <p className="text-[10px] text-slate-500 line-clamp-2">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <span className="font-black text-xs text-purple-600 dark:text-purple-400">
                      ₹{item.price}{" "}
                      <span className="text-slate-400 line-through text-[10px]">
                        ₹{item.originalPrice}
                      </span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Rank #{item.sortOrder}
                    </span>
                  </div>
                </div>

                <div className="px-3 pb-3 flex items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => toggleTrendingActive(item.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                      item.isActive
                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    }`}
                  >
                    {item.isActive ? "Live" : "Hidden"}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onRequestDelete(item.packageId || item.id, item.title)
                    }
                    className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer text-[10px] font-extrabold ml-auto flex items-center gap-1"
                    title="Remove from Trending"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={onOpenCatalogPicker}
              className="rounded-2xl border-2 border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/40 dark:bg-amber-950/20 h-56 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-amber-500 hover:bg-amber-100/50 transition-all text-center p-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lux">
                <Flame className="w-6 h-6 fill-white" />
              </div>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                Select Service from Catalog
              </span>
              <span className="text-[10px] font-semibold text-slate-500 max-w-[180px]">
                Pick any service from Catalog to add to Trending
              </span>
            </button>
          </div>
        )}
      </div>

      {/* TRENDING SERVICE ADD/EDIT MODAL */}
      {trendingModal.open && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="font-black text-slate-900 dark:text-white text-base">
                  {trendingModal.mode === "add"
                    ? "Add Trending Package"
                    : "Edit Trending Package"}
                </h2>
                <button
                  type="button"
                  onClick={() => setTrendingModal({ open: false, mode: "add", data: {} })}
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Package Image URL *
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={trendingModal.data.imageUrl || ""}
                    onChange={(e) =>
                      setTrendingModal({
                        ...trendingModal,
                        data: { ...trendingModal.data, imageUrl: e.target.value },
                      })
                    }
                    className={inputCls}
                  />
                  {trendingModal.data.imageUrl ? (
                    <div className="relative mt-2 w-full h-28 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                      <Image
                        src={formatImageUrl(trendingModal.data.imageUrl)}
                        alt="preview"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                  ) : trendingModal.data.title ? (
                    <div className="mt-2 w-full h-28 rounded-xl bg-gradient-to-br from-[#48073d] via-[#610c52] to-[#801C6E] flex flex-col items-center justify-center text-white border border-slate-200 dark:border-slate-700">
                      <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 text-white font-black text-xl flex items-center justify-center shadow-md tracking-wider">
                        {getTitleInitials(trendingModal.data.title, "TS")}
                      </div>
                      <span className="text-[10px] text-white/70 mt-1">
                        Letters Preview (No Image)
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Classic Deep Home Cleaning"
                      value={trendingModal.data.title || ""}
                      onChange={(e) =>
                        setTrendingModal({
                          ...trendingModal,
                          data: { ...trendingModal.data, title: e.target.value },
                        })
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Cleaning"
                      value={trendingModal.data.category || ""}
                      onChange={(e) =>
                        setTrendingModal({
                          ...trendingModal,
                          data: { ...trendingModal.data, category: e.target.value },
                        })
                      }
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Duration (mins)
                    </label>
                    <input
                      type="number"
                      placeholder="240"
                      value={trendingModal.data.durationMins || ""}
                      onChange={(e) =>
                        setTrendingModal({
                          ...trendingModal,
                          data: { ...trendingModal.data, durationMins: Number(e.target.value) },
                        })
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Rating (★)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="4.92"
                      value={trendingModal.data.rating || ""}
                      onChange={(e) =>
                        setTrendingModal({
                          ...trendingModal,
                          data: { ...trendingModal.data, rating: Number(e.target.value) },
                        })
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Reviews Count
                    </label>
                    <input
                      type="number"
                      placeholder="1240"
                      value={trendingModal.data.reviewsCount || ""}
                      onChange={(e) =>
                        setTrendingModal({
                          ...trendingModal,
                          data: { ...trendingModal.data, reviewsCount: Number(e.target.value) },
                        })
                      }
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Offer Badge
                    </label>
                    <input
                      type="text"
                      placeholder="24% OFF"
                      value={trendingModal.data.discountPercentage || ""}
                      onChange={(e) =>
                        setTrendingModal({
                          ...trendingModal,
                          data: { ...trendingModal.data, discountPercentage: e.target.value },
                        })
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Discount Price (₹)
                    </label>
                    <input
                      type="text"
                      placeholder="1899"
                      value={trendingModal.data.price || ""}
                      onChange={(e) =>
                        setTrendingModal({
                          ...trendingModal,
                          data: { ...trendingModal.data, price: e.target.value },
                        })
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Original Price (₹)
                    </label>
                    <input
                      type="text"
                      placeholder="2499"
                      value={trendingModal.data.originalPrice || ""}
                      onChange={(e) =>
                        setTrendingModal({
                          ...trendingModal,
                          data: { ...trendingModal.data, originalPrice: e.target.value },
                        })
                      }
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Our signature, multi-room deep cleaning..."
                    value={trendingModal.data.description || ""}
                    onChange={(e) =>
                      setTrendingModal({
                        ...trendingModal,
                        data: { ...trendingModal.data, description: e.target.value },
                      })
                    }
                    className={`${inputCls} resize-none`}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="trend-active"
                    checked={trendingModal.data.isActive ?? true}
                    onChange={(e) =>
                      setTrendingModal({
                        ...trendingModal,
                        data: { ...trendingModal.data, isActive: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded accent-purple-600 cursor-pointer"
                  />
                  <label
                    htmlFor="trend-active"
                    className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Show on website (Live)
                  </label>
                </div>
              </div>

              <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  disabled={isSavingTrending}
                  onClick={() => setTrendingModal({ open: false, mode: "add", data: {} })}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSavingTrending}
                  onClick={saveTrending}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                >
                  {isSavingTrending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{trendingModal.mode === "add" ? "Adding Package..." : "Updating Package..."}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>{trendingModal.mode === "add" ? "Save Package" : "Update Package"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
