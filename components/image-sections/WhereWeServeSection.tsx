"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  MapPin,
  Users,
  X,
  Save,
  GripVertical,
  Upload,
} from "lucide-react";
import { Portal } from "@/components/Portal";
import { ZoneCard } from "./types";
import { SectionCardImage } from "./SectionCardImage";
import { ZoneCardShimmerGrid } from "./SectionShimmers";
import {
  addWebsiteZoneApi,
  updateWebsiteZoneApi,
  formatImageUrl,
  getTitleInitials,
} from "@/lib/api";

interface WhereWeServeSectionProps {
  zones: ZoneCard[];
  searchQuery: string;
  isZonesLoading: boolean;
  fetchZones: () => Promise<void>;
  onRequestDelete: (id: string, name: string) => void;
  isAddModalOpen?: boolean;
  onCloseAddModal?: () => void;
}

export function WhereWeServeSection({
  zones,
  searchQuery,
  isZonesLoading,
  fetchZones,
  onRequestDelete,
  isAddModalOpen = false,
  onCloseAddModal,
}: WhereWeServeSectionProps) {
  const [previewZone, setPreviewZone] = useState<ZoneCard | null>(null);
  const [zoneModal, setZoneModal] = useState<{
    open: boolean;
    mode: "add" | "edit";
    data: Partial<ZoneCard>;
    file?: File | null;
    areasInput?: string;
  }>({
    open: false,
    mode: "add",
    data: {},
    areasInput: "",
  });

  // Listen to parent's isAddModalOpen trigger
  useEffect(() => {
    if (isAddModalOpen) {
      setZoneModal({
        open: true,
        mode: "add",
        data: {
          name: "",
          city: "Varanasi",
          proCount: 0,
          imageUrl: "",
          isActive: true,
          areas: [],
          sortOrder: zones.length + 1,
        },
        file: null,
        areasInput: "",
      });
      if (onCloseAddModal) {
        onCloseAddModal();
      }
    }
  }, [isAddModalOpen, zones.length, onCloseAddModal]);

  const filteredZones = zones.filter(
    (z) =>
      !searchQuery ||
      z.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      z.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleZoneStatus = async (zone: ZoneCard) => {
    const nextStatus = !zone.isActive;
    const formData = new FormData();
    formData.append("status", String(nextStatus));
    try {
      const res = await updateWebsiteZoneApi(zone.id, formData);
      if (res && res.success) {
        await fetchZones();
      } else {
        alert(res?.message || "Failed to update zone status.");
      }
    } catch (err) {
      console.error("Failed to toggle zone status:", err);
    }
  };

  const saveZone = async () => {
    const d = zoneModal.data;
    if (!d.name?.trim()) {
      alert("Zone name is required.");
      return;
    }
    if (!d.city?.trim()) {
      alert("City is required.");
      return;
    }

    const rawAreas =
      zoneModal.areasInput !== undefined
        ? zoneModal.areasInput
        : (d.areas || []).join(", ");
    const parsedAreas = rawAreas
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean);

    const formData = new FormData();
    formData.append("zoneName", d.name.trim());
    formData.append("city", d.city.trim());
    formData.append("proCount", String(d.proCount || 0));
    formData.append("sortOrder", String(d.sortOrder || 1));
    formData.append("areasCovered", parsedAreas.join(", "));
    formData.append("status", String(d.isActive ?? true));

    if (zoneModal.file) {
      formData.append("image", zoneModal.file);
    }

    try {
      if (zoneModal.mode === "add") {
        if (!zoneModal.file && !d.imageUrl) {
          alert("Zone image file or image URL is required.");
          return;
        }
        const res = await addWebsiteZoneApi(formData);
        if (res && res.success) {
          await fetchZones();
          setZoneModal({ open: false, mode: "add", data: {}, file: null, areasInput: "" });
        } else {
          alert(res?.message || "Failed to add zone.");
        }
      } else {
        if (!d.id) return;
        const res = await updateWebsiteZoneApi(d.id, formData);
        if (res && res.success) {
          await fetchZones();
          setZoneModal({ open: false, mode: "add", data: {}, file: null, areasInput: "" });
        } else {
          alert(res?.message || "Failed to update zone.");
        }
      }
    } catch (err) {
      console.error("Error saving zone:", err);
    }
  };

  const inputCls =
    "w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-500";

  return (
    <div className="space-y-6">
      {/* Zone Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-sm text-slate-900 dark:text-white">
            Neighborhood Zone Cards ({zones.length})
          </h3>
        </div>

        {isZonesLoading ? (
          <ZoneCardShimmerGrid count={6} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredZones.map((zone) => (
              <div
                key={zone.id}
                className={`rounded-2xl border overflow-hidden bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all ${
                  zone.isActive
                    ? "border-slate-200 dark:border-slate-700"
                    : "border-dashed border-slate-300 dark:border-slate-700 opacity-60"
                }`}
              >
                <div className="relative h-40 bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <SectionCardImage
                    src={zone.imageUrl}
                    title={zone.name}
                    badgeSize="w-14 h-14 text-2xl"
                    fallback="WZ"
                  />
                  <div
                    className={`absolute top-2 right-2 text-[9px] font-black px-2 py-0.5 rounded-full ${
                      zone.isActive ? "bg-emerald-500 text-white" : "bg-slate-500 text-white"
                    }`}
                  >
                    {zone.isActive ? "LIVE" : "HIDDEN"}
                  </div>
                  <div className="absolute top-2 left-2 bg-black/50 text-white text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                    <GripVertical className="w-2.5 h-2.5" />#{zone.sortOrder}
                  </div>
                </div>

                <div className="p-3 space-y-2">
                  <div>
                    <h3 className="font-black text-sm text-slate-900 dark:text-white">
                      {zone.name}
                    </h3>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 text-brand-600" />
                      {zone.city}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px]">
                    <Users className="w-3 h-3 text-purple-500" />
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {zone.proCount} Pros
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500">{zone.areas.length} Areas</span>
                  </div>
                  {zone.areas.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {zone.areas.slice(0, 4).map((a) => (
                        <span
                          key={a}
                          className="text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded-md"
                        >
                          {a}
                        </span>
                      ))}
                      {zone.areas.length > 4 && (
                        <span className="text-[9px] font-bold bg-purple-100 dark:bg-purple-900/40 text-purple-600 px-1.5 py-0.5 rounded-md">
                          +{zone.areas.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="px-3 pb-3 flex items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPreviewZone(zone)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-purple-600 transition-colors cursor-pointer"
                    title="View Details"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setZoneModal({
                        open: true,
                        mode: "edit",
                        data: { ...zone },
                        file: null,
                        areasInput: (zone.areas || []).join(", "),
                      })
                    }
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-brand-600 transition-colors cursor-pointer"
                    title="Edit Zone"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleZoneStatus(zone)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                      zone.isActive
                        ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                    }`}
                  >
                    {zone.isActive ? "Live" : "Hidden"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onRequestDelete(zone.id, zone.name)}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-600 transition-colors cursor-pointer ml-auto"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() =>
                setZoneModal({
                  open: true,
                  mode: "add",
                  data: {
                    name: "",
                    city: "Varanasi",
                    proCount: 0,
                    imageUrl: "",
                    isActive: true,
                    areas: [],
                    sortOrder: zones.length + 1,
                  },
                  file: null,
                  areasInput: "",
                })
              }
              className="rounded-2xl border-2 border-dashed border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20 h-64 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-all"
            >
              <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center">
                <Plus className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-xs font-bold text-purple-600">Add New Zone</span>
            </button>
          </div>
        )}
      </div>

      {/* ZONE PREVIEW MODAL */}
      {previewZone && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-800">
              <div className="relative h-52 bg-slate-200 overflow-hidden">
                <SectionCardImage
                  src={previewZone.imageUrl}
                  title={previewZone.name}
                  badgeSize="w-16 h-16 text-3xl"
                  fallback="WZ"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setPreviewZone(null)}
                  className="absolute top-3 right-3 bg-black/40 text-white rounded-full p-1.5 cursor-pointer hover:bg-black/60 transition-colors z-10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <h2 className="font-black text-lg text-slate-900 dark:text-white">
                    {previewZone.name}
                  </h2>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {previewZone.city}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-purple-500" />
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {previewZone.proCount} Pros
                  </span>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">
                    Areas Covered
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {previewZone.areas.map((a) => (
                      <span
                        key={a}
                        className="text-[11px] font-semibold bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-800 px-2 py-0.5 rounded-lg"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* ZONE ADD/EDIT MODAL */}
      {zoneModal.open && (
        <Portal>
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="font-black text-slate-900 dark:text-white text-base">
                  {zoneModal.mode === "add" ? "Add Neighborhood Zone" : "Edit Zone"}
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    setZoneModal({ open: false, mode: "add", data: {}, file: null, areasInput: "" })
                  }
                  className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
              <div className="p-5 space-y-3 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Upload Zone Image *
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-bold cursor-pointer hover:bg-purple-100 transition-colors w-full">
                      <Upload className="w-4 h-4 text-purple-600" />
                      <span>Upload Image File</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setZoneModal({
                                ...zoneModal,
                                file,
                                data: { ...zoneModal.data, imageUrl: reader.result as string },
                              });
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    <input
                      type="text"
                      placeholder="Or paste image URL (https://...)"
                      value={zoneModal.data.imageUrl || ""}
                      onChange={(e) =>
                        setZoneModal({
                          ...zoneModal,
                          data: { ...zoneModal.data, imageUrl: e.target.value },
                        })
                      }
                      className={inputCls}
                    />
                  </div>
                  {zoneModal.data.imageUrl ? (
                    <img
                      src={formatImageUrl(zoneModal.data.imageUrl)}
                      alt="preview"
                      className="mt-2 w-full h-28 object-cover rounded-xl border border-slate-200 dark:border-slate-700"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : zoneModal.data.name ? (
                    <div className="mt-2 w-full h-28 rounded-xl bg-gradient-to-br from-[#48073d] via-[#610c52] to-[#801C6E] flex flex-col items-center justify-center text-white border border-slate-200 dark:border-slate-700">
                      <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 text-white font-black text-xl flex items-center justify-center shadow-md tracking-wider">
                        {getTitleInitials(zoneModal.data.name, "WZ")}
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
                      Zone Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Lanka"
                      value={zoneModal.data.name || ""}
                      onChange={(e) =>
                        setZoneModal({
                          ...zoneModal,
                          data: { ...zoneModal.data, name: e.target.value },
                        })
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Varanasi"
                      value={zoneModal.data.city || ""}
                      onChange={(e) =>
                        setZoneModal({
                          ...zoneModal,
                          data: { ...zoneModal.data, city: e.target.value },
                        })
                      }
                      className={inputCls}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Pro Count
                    </label>
                    <input
                      type="number"
                      placeholder="120"
                      value={zoneModal.data.proCount || ""}
                      onChange={(e) =>
                        setZoneModal({
                          ...zoneModal,
                          data: { ...zoneModal.data, proCount: Number(e.target.value) },
                        })
                      }
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      placeholder="1"
                      value={zoneModal.data.sortOrder || ""}
                      onChange={(e) =>
                        setZoneModal({
                          ...zoneModal,
                          data: { ...zoneModal.data, sortOrder: Number(e.target.value) },
                        })
                      }
                      className={inputCls}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Areas Covered (comma separated)
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Separate each area with a comma
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Assi Ghat, Lanka, Durgakund, BHU Campus..."
                    value={
                      zoneModal.areasInput ?? (zoneModal.data.areas || []).join(", ")
                    }
                    onChange={(e) =>
                      setZoneModal({ ...zoneModal, areasInput: e.target.value })
                    }
                    className={`${inputCls} resize-none`}
                  />
                  {(() => {
                    const currentText =
                      zoneModal.areasInput ?? (zoneModal.data.areas || []).join(", ");
                    const tags = currentText
                      .split(",")
                      .map((a) => a.trim())
                      .filter(Boolean);
                    if (tags.length === 0) return null;
                    return (
                      <div className="mt-2 flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pt-0.5">
                        {tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-semibold bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded-md"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="zone-active"
                    checked={zoneModal.data.isActive ?? true}
                    onChange={(e) =>
                      setZoneModal({
                        ...zoneModal,
                        data: { ...zoneModal.data, isActive: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded accent-purple-600 cursor-pointer"
                  />
                  <label
                    htmlFor="zone-active"
                    className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Show on website (Live)
                  </label>
                </div>
              </div>

              <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setZoneModal({ open: false, mode: "add", data: {}, file: null, areasInput: "" })
                  }
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveZone}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Zone
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
