"use client";

import { Trash2, Zap } from "lucide-react";
import { TrendingServiceCard } from "./types";
import { SectionCardImage } from "./SectionCardImage";
import { QuickServiceShimmerGrid } from "./SectionShimmers";

interface QuickServicesSectionProps {
  quickServices: TrendingServiceCard[];
  searchQuery: string;
  isQuickLoading: boolean;
  onRequestDelete: (id: string, name: string) => void;
  onOpenCatalogPicker: () => void;
}

export function QuickServicesSection({
  quickServices,
  searchQuery,
  isQuickLoading,
  onRequestDelete,
  onOpenCatalogPicker,
}: QuickServicesSectionProps) {
  const filteredQuick = quickServices.filter(
    (q) =>
      !searchQuery ||
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Cards Edit Grid & Selection for Quick Services */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Quick Service Packages ({quickServices.length}/6)
            </span>
            {quickServices.length >= 6 ? (
              <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                Max 6/6 Slots Filled
              </span>
            ) : (
              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                {6 - quickServices.length} Slots Available
              </span>
            )}
          </div>
        </div>

        {isQuickLoading ? (
          <QuickServiceShimmerGrid count={6} />
        ) : quickServices.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
              <Zap className="w-6 h-6 fill-amber-500 text-amber-500" />
            </div>
            <h4 className="text-sm font-black text-slate-900 dark:text-white">
              No Quick Services Configured
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Pick up to 6 express doorstep packages from your service catalog to
              display in the Quick Services section.
            </p>
            <button
              type="button"
              onClick={onOpenCatalogPicker}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Select from Catalog
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredQuick.map((item, idx) => (
              <div
                key={item.id || item.packageId || idx}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all"
              >
                <div className="relative h-36 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <SectionCardImage
                    src={item.imageUrl}
                    packageId={item.packageId || item.id}
                    title={item.title}
                    badgeSize="w-12 h-12 text-xl"
                    fallback="QS"
                  />
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                    {item.discountPercentage}
                  </div>
                  <div className="absolute top-2 right-2 text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500 text-white">
                    LIVE
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
                    <span className="font-black text-xs text-brand-600 dark:text-brand-400">
                      ₹{item.price}{" "}
                      {item.originalPrice &&
                        Number(item.originalPrice) > Number(item.price) && (
                          <span className="text-slate-400 line-through text-[10px]">
                            ₹{item.originalPrice}
                          </span>
                        )}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Slot #{item.sortOrder || idx + 1}
                    </span>
                  </div>
                </div>

                <div className="px-3 pb-3 flex items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() =>
                      onRequestDelete(item.packageId || item.id, item.title)
                    }
                    className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors cursor-pointer text-[10px] font-extrabold ml-auto flex items-center gap-1"
                    title="Remove from Quick Services"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
            ))}

            {quickServices.length < 6 && (
              <button
                type="button"
                onClick={onOpenCatalogPicker}
                className="rounded-2xl border-2 border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/40 dark:bg-amber-950/20 h-56 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-amber-500 hover:bg-amber-100/50 transition-all text-center p-4"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lux">
                  <Zap className="w-6 h-6 fill-white" />
                </div>
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  Select Quick Service from Catalog
                </span>
                <span className="text-[10px] font-semibold text-slate-500 max-w-[180px]">
                  {6 - quickServices.length} more express slots available
                </span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
