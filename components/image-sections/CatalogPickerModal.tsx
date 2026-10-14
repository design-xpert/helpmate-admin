"use client";

import { X, Search, Zap, Flame, Layers } from "lucide-react";
import { Portal } from "@/components/Portal";
import { SectionCardImage } from "./SectionCardImage";
import { PackageRowShimmer } from "./SectionShimmers";
import {
  TabType,
  TrendingServiceCard,
  CategorySectionData,
} from "./types";
import { ApiTrendingCatalogItem } from "@/lib/api";

interface CatalogPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: TabType;
  targetCatalogSectionId: string | null;
  quickServices: TrendingServiceCard[];
  trendingServices: TrendingServiceCard[];
  categorySections: CategorySectionData[];
  catalogPackages: ApiTrendingCatalogItem[];
  isCatalogLoading: boolean;
  catalogSearch: string;
  setCatalogSearch: (search: string) => void;
  onAddTrending: (packageId: string) => void;
  onRemoveTrending: (packageId: string) => void;
  onAddQuick: (catItem: ApiTrendingCatalogItem) => void;
  onRemoveQuick: (packageId: string) => void;
  onAddCategorySectionPackage: (catItem: ApiTrendingCatalogItem) => void;
  onRemoveCategorySectionPackage: (sectionId: string, packageId: string) => void;
}

export function CatalogPickerModal({
  isOpen,
  onClose,
  activeTab,
  targetCatalogSectionId,
  quickServices,
  trendingServices,
  categorySections,
  catalogPackages,
  isCatalogLoading,
  catalogSearch,
  setCatalogSearch,
  onAddTrending,
  onRemoveTrending,
  onAddQuick,
  onRemoveQuick,
  onAddCategorySectionPackage,
  onRemoveCategorySectionPackage,
}: CatalogPickerModalProps) {
  if (!isOpen) return null;

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div
            className={`flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 text-white ${
              activeTab === "quick"
                ? "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600"
                : "bg-gradient-to-r from-amber-500 to-rose-600"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {activeTab === "quick" ? (
                <Zap className="w-5 h-5 fill-white text-white" />
              ) : (
                <Flame className="w-5 h-5 fill-white text-white" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-white text-base">
                    {activeTab === "quick"
                      ? "Select Quick Service from Catalog"
                      : "Select Service from Catalog"}
                  </h3>
                  {activeTab === "quick" && (
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                        quickServices.length >= 6
                          ? "bg-amber-400 text-slate-900 border-amber-300 font-extrabold"
                          : "bg-white/20 text-white border-white/30"
                      }`}
                    >
                      {quickServices.length}/6 Slots Filled
                    </span>
                  )}
                </div>
                <p className="text-xs text-amber-100">
                  {activeTab === "quick"
                    ? "Choose up to 6 express services to feature in website Quick Services (15-30 min arrival)"
                    : "Choose existing services to feature in website Trending Best Sellers"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-white/20 text-white cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Search catalog service name or category..."
                className="w-full h-10 pl-10 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-amber-500 font-medium"
              />
            </div>
          </div>

          {/* Catalog Services List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isCatalogLoading ? (
              <PackageRowShimmer count={5} />
            ) : catalogPackages.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-medium">
                No matching catalog packages found.
              </div>
            ) : (
              catalogPackages.map((catItem) => {
                const isSelected =
                  activeTab === "quick"
                    ? quickServices.some(
                        (q) => q.packageId === catItem.packageId
                      )
                    : trendingServices.some(
                        (t) => t.packageId === catItem.packageId
                      );

                const isQuickAtLimit =
                  activeTab === "quick" &&
                  !isSelected &&
                  quickServices.length >= 6;

                const isAlreadyInTargetSec = targetCatalogSectionId
                  ? categorySections
                      .find((s) => s.id === targetCatalogSectionId)
                      ?.services.some((s) => s.id === catItem.packageId)
                  : false;

                return (
                  <div
                    key={catItem.packageId}
                    className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-300 transition-all flex items-center justify-between gap-4 shadow-xs"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                        <SectionCardImage
                          src={catItem.imageUrl || catItem.thumbnailUrl}
                          packageId={catItem.packageId}
                          title={catItem.packageName}
                          badgeSize="w-8 h-8 text-xs rounded-lg"
                          fallback="PK"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-slate-900 dark:text-white text-xs">
                            {catItem.packageName}
                          </h4>
                          <span className="px-2 py-0.5 rounded text-[9px] font-black bg-brand-50 text-brand-600 border border-brand-200">
                            {catItem.category?.name || "Service"}
                          </span>
                          {catItem.serviceAction?.name && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-purple-50 text-purple-600 border border-purple-200">
                              {catItem.serviceAction.name}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-semibold flex items-center gap-2 mt-0.5">
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            ₹{catItem.price}
                          </span>
                          <span className="text-slate-400 line-through text-[10px]">
                            ₹{catItem.originalPrice}
                          </span>
                          <span>•</span>
                          <span className="text-amber-600 font-bold">
                            {catItem.discountPercentage}% OFF
                          </span>
                          {catItem.duration && (
                            <span>• {catItem.duration} mins</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={activeTab === "quick" && isQuickAtLimit}
                      onClick={() => {
                        if (targetCatalogSectionId) {
                          if (isAlreadyInTargetSec) {
                            onRemoveCategorySectionPackage(
                              targetCatalogSectionId,
                              catItem.packageId
                            );
                          } else {
                            onAddCategorySectionPackage(catItem);
                          }
                        } else if (activeTab === "quick") {
                          if (isSelected) {
                            onRemoveQuick(catItem.packageId);
                          } else {
                            if (quickServices.length >= 6) {
                              alert("Maximum 6 quick services are allowed.");
                              return;
                            }
                            onAddQuick(catItem);
                          }
                        } else {
                          if (isSelected) {
                            onRemoveTrending(catItem.packageId);
                          } else {
                            onAddTrending(catItem.packageId);
                          }
                        }
                      }}
                      className={`px-4 py-2 rounded-xl font-extrabold text-xs transition-all flex items-center gap-1.5 shrink-0 ${
                        targetCatalogSectionId
                          ? isAlreadyInTargetSec
                            ? "bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-600 hover:text-white cursor-pointer"
                            : "bg-brand-600 hover:bg-brand-700 text-white shadow-lux cursor-pointer"
                          : isSelected
                          ? "bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-600 hover:text-white cursor-pointer"
                          : isQuickAtLimit
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60"
                          : "bg-amber-500 hover:bg-amber-600 text-white shadow-lux cursor-pointer"
                      }`}
                    >
                      {targetCatalogSectionId ? (
                        <Layers className="w-3.5 h-3.5" />
                      ) : activeTab === "quick" ? (
                        <Zap
                          className={`w-3.5 h-3.5 ${
                            isSelected
                              ? "text-rose-600"
                              : isQuickAtLimit
                              ? "text-slate-400"
                              : "fill-white text-white"
                          }`}
                        />
                      ) : (
                        <Flame
                          className={`w-3.5 h-3.5 ${
                            isSelected
                              ? "text-rose-600"
                              : "fill-white text-white"
                          }`}
                        />
                      )}
                      <span>
                        {targetCatalogSectionId
                          ? isAlreadyInTargetSec
                            ? "Remove from Section"
                            : "+ Add to Category Section"
                          : isSelected
                          ? activeTab === "quick"
                            ? "Remove from Quick"
                            : "Remove from Trending"
                          : isQuickAtLimit
                          ? "Max 6 Slots Full"
                          : activeTab === "quick"
                          ? "+ Add to Quick Services"
                          : "+ Add to Trending"}
                      </span>
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-extrabold text-xs shadow-lux cursor-pointer"
            >
              {targetCatalogSectionId
                ? "Done Adding to Section"
                : activeTab === "quick"
                ? "Done Managing Quick Services"
                : "Done Managing Trending"}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  );
}
