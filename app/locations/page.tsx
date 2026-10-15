"use client";

import { useState, useEffect } from "react";
import { getStoredModuleData, setCachedModuleData, isModuleCacheFresh, clearModuleCache } from "@/lib/moduleCache";
import { DataTable, Column } from "@/components/DataTable";
import { RowActionMenu } from "@/components/RowActionMenu";
import {
  getCitiesApi,
  addCityApi,
  updateCityApi,
  deleteCityApi,
  getLocalitiesApi,
  addLocalityApi,
  updateLocalityApi,
  deleteLocalityApi,
  ApiCity,
  ApiLocality,
} from "@/lib/api";
import { toast } from "@/components/Toast";
import { ShimmerRow } from "@/components/ShimmerLoader";
import {
  Building2,
  Plus,
  CheckCircle2,
  MapPin,
  Users,
  X,
  Edit,
  Trash2,
  Loader2,
  Search,
  Globe,
} from "lucide-react";
import { Portal } from "@/components/Portal";

export default function LocationsPage() {
  const initialCachedLocalities = getStoredModuleData<ApiLocality[]>("locations_localities") || [];
  const initialCachedCities = getStoredModuleData<ApiCity[]>("locations_cities") || [];

  // Locality State
  const [localities, setLocalities] = useState<ApiLocality[]>(() => initialCachedLocalities);
  const [isLocalitiesLoading, setIsLocalitiesLoading] = useState(() => !(isModuleCacheFresh("locations_localities", 30000) && initialCachedLocalities.length > 0));
  const [localitySearch, setLocalitySearch] = useState("");
  const [activeTab, setActiveTab] = useState<"pincodes" | "cities">("pincodes");

  const [localityModal, setLocalityModal] = useState<{
    open: boolean;
    mode: "add" | "edit";
    data: Partial<ApiLocality>;
  }>({
    open: false,
    mode: "add",
    data: {},
  });
  const [isSavingLocality, setIsSavingLocality] = useState(false);

  const [deleteLocalityModal, setDeleteLocalityModal] = useState<{
    open: boolean;
    locality: ApiLocality | null;
  }>({
    open: false,
    locality: null,
  });

  // Cities Backend State
  const [cities, setCities] = useState<ApiCity[]>(() => initialCachedCities);
  const [isCitiesLoading, setIsCitiesLoading] = useState(() => !(isModuleCacheFresh("locations_cities", 30000) && initialCachedCities.length > 0));
  const [citySearch, setCitySearch] = useState("");
  const [cityModal, setCityModal] = useState<{
    open: boolean;
    mode: "add" | "edit";
    data: Partial<ApiCity>;
  }>({
    open: false,
    mode: "add",
    data: {},
  });
  const [isSavingCity, setIsSavingCity] = useState(false);
  const [deleteCityModal, setDeleteCityModal] = useState<{
    open: boolean;
    city: ApiCity | null;
  }>({
    open: false,
    city: null,
  });

  const fetchLocalities = async (force: boolean = false) => {
    if (!force && isModuleCacheFresh("locations_localities", 30000)) {
      const cached = getStoredModuleData<ApiLocality[]>("locations_localities");
      if (cached && cached.length > 0) {
        setLocalities(cached);
        setIsLocalitiesLoading(false);
        return;
      }
    }
    if (localities.length === 0 && (!initialCachedLocalities || initialCachedLocalities.length === 0)) {
      setIsLocalitiesLoading(true);
    }
    try {
      const res = await getLocalitiesApi({ forceRefresh: force });
      if (res && res.success) {
        const rawLocalities = res.data?.localities || (Array.isArray(res.data) ? res.data : (res.localities || []));
        if (Array.isArray(rawLocalities)) {
          setLocalities(rawLocalities);
          setCachedModuleData("locations_localities", rawLocalities);
        } else {
          setLocalities([]);
        }
      } else {
        setLocalities([]);
      }
    } catch (err) {
      console.error("Failed to fetch localities:", err);
      toast.error("Failed to fetch localities.");
    } finally {
      setIsLocalitiesLoading(false);
    }
  };

  const fetchCities = async (force: boolean = false) => {
    if (!force && isModuleCacheFresh("locations_cities", 30000)) {
      const cached = getStoredModuleData<ApiCity[]>("locations_cities");
      if (cached && cached.length > 0) {
        setCities(cached);
        setIsCitiesLoading(false);
        return;
      }
    }
    if (cities.length === 0 && (!initialCachedCities || initialCachedCities.length === 0)) {
      setIsCitiesLoading(true);
    }
    try {
      const res = await getCitiesApi({ forceRefresh: force });
      if (res && res.success && Array.isArray(res.data)) {
        setCities(res.data);
        setCachedModuleData("locations_cities", res.data);
      }
    } catch (err) {
      console.error("Failed to fetch cities:", err);
    } finally {
      setIsCitiesLoading(false);
    }
  };

  useEffect(() => {
    if (!isModuleCacheFresh("locations_localities", 30000) || initialCachedLocalities.length === 0) {
      fetchLocalities();
    }
    if (!isModuleCacheFresh("locations_cities", 30000) || initialCachedCities.length === 0) {
      fetchCities();
    }
  }, []);

  const handleSaveLocality = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingLocality) return;
    const d = localityModal.data;
    if (!d.localityName?.trim() || !d.pincode?.trim()) {
      toast.error("Locality Name and Pincode are required.");
      return;
    }

    setIsSavingLocality(true);
    try {
      if (localityModal.mode === "add") {
        const res = await addLocalityApi({
          localityName: d.localityName.trim(),
          pincode: d.pincode.trim(),
        });

        if (res && res.success) {
          toast.success("Locality added successfully!");
          await fetchLocalities();
          setLocalityModal({ open: false, mode: "add", data: {} });
        } else {
          toast.error(res?.message || "Failed to add locality.");
        }
      } else {
        if (!d._id) return;
        const res = await updateLocalityApi(d._id, {
          localityName: d.localityName.trim(),
          pincode: d.pincode.trim(),
          status: d.status ?? true,
        });

        if (res && res.success) {
          toast.success("Locality updated successfully!");
          await fetchLocalities();
          setLocalityModal({ open: false, mode: "add", data: {} });
        } else {
          toast.error(res?.message || "Failed to update locality.");
        }
      }
    } catch (err) {
      console.error("Locality save error:", err);
      toast.error("An error occurred while saving locality.");
    } finally {
      setIsSavingLocality(false);
    }
  };

  const handleToggleLocalityStatus = async (locality: ApiLocality) => {
    try {
      const newStatus = locality.status === false ? true : false;
      const res = await updateLocalityApi(locality._id, { status: newStatus });
      if (res && res.success) {
        toast.success(`Locality status updated to ${newStatus ? "Active" : "Inactive"}`);
        await fetchLocalities();
      } else {
        toast.error(res?.message || "Failed to update locality status.");
      }
    } catch (err) {
      console.error("Locality status toggle error:", err);
      toast.error("An error occurred while updating status.");
    }
  };

  const handleConfirmDeleteLocality = async () => {
    if (!deleteLocalityModal.locality) return;
    try {
      const res = await deleteLocalityApi(deleteLocalityModal.locality._id);
      if (res && res.success) {
        toast.success("Locality deleted successfully!");
        await fetchLocalities();
        setDeleteLocalityModal({ open: false, locality: null });
      } else {
        toast.error(res?.message || "Failed to delete locality.");
      }
    } catch (err) {
      console.error("Locality delete error:", err);
      toast.error("An error occurred while deleting locality.");
    }
  };

  const handleSaveCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingCity) return;
    const d = cityModal.data;
    if (!d.cityName?.trim() || !d.stateName?.trim()) {
      toast.error("City Name and State Name are required.");
      return;
    }

    setIsSavingCity(true);
    try {
      if (cityModal.mode === "add") {
        const res = await addCityApi({
          cityName: d.cityName.trim(),
          stateName: d.stateName.trim(),
          status: d.status ?? true,
        });

        if (res && res.success) {
          toast.success("City added successfully!");
          await fetchCities();
          setCityModal({ open: false, mode: "add", data: {} });
        } else {
          toast.error(res?.message || "Failed to add city.");
        }
      } else {
        if (!d._id) return;
        const res = await updateCityApi(d._id, {
          cityName: d.cityName.trim(),
          stateName: d.stateName.trim(),
          status: d.status ?? true,
        });

        if (res && res.success) {
          toast.success("City updated successfully!");
          await fetchCities();
          setCityModal({ open: false, mode: "add", data: {} });
        } else {
          toast.error(res?.message || "Failed to update city.");
        }
      }
    } catch (err) {
      console.error("City save error:", err);
      toast.error("An error occurred while saving city.");
    } finally {
      setIsSavingCity(false);
    }
  };

  const handleToggleCityStatus = async (city: ApiCity) => {
    try {
      const newStatus = !city.status;
      const res = await updateCityApi(city._id, { status: newStatus });
      if (res && res.success) {
        toast.success(`City status updated to ${newStatus ? "Active" : "Inactive"}`);
        await fetchCities();
      } else {
        toast.error(res?.message || "Failed to update city status.");
      }
    } catch (err) {
      console.error("City status toggle error:", err);
      toast.error("An error occurred while updating status.");
    }
  };

  const handleConfirmDeleteCity = async () => {
    if (!deleteCityModal.city) return;
    try {
      const res = await deleteCityApi(deleteCityModal.city._id);
      if (res && res.success) {
        toast.success("City deleted successfully!");
        await fetchCities();
        setDeleteCityModal({ open: false, city: null });
      } else {
        toast.error(res?.message || "Failed to delete city.");
      }
    } catch (err) {
      console.error("City delete error:", err);
      toast.error("An error occurred while deleting city.");
    }
  };

  const pincodeColumns: Column<ApiLocality>[] = [
    {
      key: "localityName",
      header: "Locality / Zone Name",
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
          <span className="font-black text-slate-900 dark:text-white">{row.localityName}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "pincode",
      header: "Pincode",
      accessor: (row) => (
        <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          {row.pincode}
        </span>
      ),
      sortable: true,
    },
    {
      key: "status",
      header: "Operational Status",
      accessor: (row) => (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
            row.status !== false
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
          }`}
        >
          <CheckCircle2 className="w-3 h-3" />
          {row.status !== false ? "Active Operations" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      sticky: "right",
      accessor: (row) => (
        <RowActionMenu
          actions={[
            {
              label: row.status !== false ? "Set Inactive" : "Set Active",
              icon: CheckCircle2,
              onClick: () => handleToggleLocalityStatus(row),
            },
            {
              label: "Edit Locality",
              icon: Edit,
              onClick: () =>
                setLocalityModal({ open: true, mode: "edit", data: row }),
            },
            {
              label: "Delete Locality",
              icon: Trash2,
              onClick: () =>
                setDeleteLocalityModal({ open: true, locality: row }),
              danger: true,
            },
          ]}
        />
      ),
    },
  ];

  const cityColumns: Column<ApiCity>[] = [
    {
      key: "cityName",
      header: "City Name",
      accessor: (row) => (
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-brand-600 shrink-0" />
          <span className="font-black text-slate-900 dark:text-white">{row.cityName}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "stateName",
      header: "State",
      accessor: (row) => (
        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          {row.stateName}
        </span>
      ),
      sortable: true,
    },
    {
      key: "status",
      header: "Operational Status",
      accessor: (row) => (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
            row.status
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
          }`}
        >
          <CheckCircle2 className="w-3 h-3" />
          {row.status ? "Active Operations" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      sticky: "right",
      accessor: (row) => (
        <RowActionMenu
          actions={[
            {
              label: row.status ? "Set Inactive" : "Set Active",
              icon: CheckCircle2,
              onClick: () => handleToggleCityStatus(row),
            },
            {
              label: "Edit City",
              icon: Edit,
              onClick: () =>
                setCityModal({ open: true, mode: "edit", data: row }),
            },
            {
              label: "Delete City",
              icon: Trash2,
              onClick: () =>
                setDeleteCityModal({ open: true, city: row }),
              danger: true,
            },
          ]}
        />
      ),
    },
  ];

  const filteredLocalities = localities.filter(
    (l) =>
      !localitySearch ||
      l.localityName?.toLowerCase().includes(localitySearch.toLowerCase()) ||
      l.pincode?.includes(localitySearch)
  );

  const filteredCities = cities.filter(
    (c) =>
      !citySearch ||
      c.cityName?.toLowerCase().includes(citySearch.toLowerCase()) ||
      c.stateName?.toLowerCase().includes(citySearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Simple Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <MapPin className="w-6 h-6 text-brand-600" />
            <span>Locations & City Operations</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Manage operational cities, serviceable pincodes, demand surges, and technician allocation.
          </p>
        </div>

        {activeTab === "pincodes" ? (
          <button
            type="button"
            onClick={() =>
              setLocalityModal({
                open: true,
                mode: "add",
                data: { localityName: "", pincode: "", status: true },
              })
            }
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Pincode Zone</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() =>
              setCityModal({
                open: true,
                mode: "add",
                data: { cityName: "", stateName: "Uttar Pradesh", status: true },
              })
            }
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add New City</span>
          </button>
        )}
      </div>

      {/* TAB NAVIGATION BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => setActiveTab("pincodes")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "pincodes"
                ? "bg-brand-600 text-white shadow-md font-black"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Pincodes & Localities</span>
            <span
              className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                activeTab === "pincodes"
                  ? "bg-white/20 text-white"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-500"
              }`}
            >
              {localities.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("cities")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "cities"
                ? "bg-brand-600 text-white shadow-md font-black"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Cities & States</span>
            <span
              className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                activeTab === "cities"
                  ? "bg-white/20 text-white"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-500"
              }`}
            >
              {cities.length}
            </span>
          </button>
        </div>

        {activeTab === "pincodes" ? (
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search locality or pincode..."
              value={localitySearch}
              onChange={(e) => setLocalitySearch(e.target.value)}
              className="pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 w-56"
            />
          </div>
        ) : (
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search cities or states..."
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              className="pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:border-brand-500 w-56"
            />
          </div>
        )}
      </div>

      {/* 4 Executive Quick Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Serviceable Pincodes</span>
            <div className="p-2.5 rounded-2xl bg-brand-50 text-brand-600 border border-brand-200">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-white">{localities.length} Pincodes</span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Active Operational Cities</span>
            <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl font-black text-purple-600">
            {cities.filter((c) => c.status).length} Cities Live
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Active Localities</span>
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl font-black text-emerald-600">
            {localities.filter((l) => l.status !== false).length} Active
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">State Coverage</span>
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
              <Globe className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl font-black text-slate-900 dark:text-white">
            {new Set(cities.map((c) => c.stateName)).size || 1} States
          </span>
        </div>
      </div>

      {/* MAIN TAB CONTENT */}
      {activeTab === "pincodes" ? (
        <div className="space-y-4">
          {isLocalitiesLoading ? (
            <ShimmerRow count={6} />
          ) : (
            <DataTable columns={pincodeColumns} data={filteredLocalities} idField="_id" />
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {isCitiesLoading ? (
            <ShimmerRow count={6} />
          ) : (
            <DataTable columns={cityColumns} data={filteredCities} idField="_id" />
          )}
        </div>
      )}

      {/* ADD / EDIT LOCALITY MODAL */}
      {localityModal.open && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-brand-600" />
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                    {localityModal.mode === "add" ? "Add New Locality" : "Edit Locality"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setLocalityModal({ open: false, mode: "add", data: {} })}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveLocality} className="p-6 space-y-4">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 text-xs">
                    Locality / Zone Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={localityModal.data.localityName || ""}
                    onChange={(e) =>
                      setLocalityModal({
                        ...localityModal,
                        data: { ...localityModal.data, localityName: e.target.value },
                      })
                    }
                    placeholder="e.g. Akhri, Sigra, Lanka"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:border-brand-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 text-xs">
                    Pincode *
                  </label>
                  <input
                    type="text"
                    required
                    value={localityModal.data.pincode || ""}
                    onChange={(e) =>
                      setLocalityModal({
                        ...localityModal,
                        data: { ...localityModal.data, pincode: e.target.value },
                      })
                    }
                    placeholder="e.g. 221011, 221002"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-xs outline-none focus:border-brand-500 font-semibold"
                  />
                </div>



                <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    disabled={isSavingLocality}
                    onClick={() => setLocalityModal({ open: false, mode: "add", data: {} })}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingLocality}
                    className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs shadow-lux flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    {isSavingLocality ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{localityModal.mode === "add" ? "Adding Locality..." : "Updating Locality..."}</span>
                      </>
                    ) : (
                      <span>{localityModal.mode === "add" ? "Add Locality" : "Save Changes"}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* DELETE LOCALITY CONFIRMATION MODAL */}
      {deleteLocalityModal.open && deleteLocalityModal.locality && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 text-center animate-in fade-in zoom-in-95 duration-200">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-800">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-slate-900 dark:text-white text-base">
                  Delete Locality?
                </h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to delete{" "}
                  <strong className="text-slate-800 dark:text-slate-200">
                    "{deleteLocalityModal.locality.localityName}"
                  </strong>
                  ?
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteLocalityModal({ open: false, locality: null })}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteLocality}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-lux cursor-pointer transition-colors"
                >
                  Delete Locality
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* ADD / EDIT CITY MODAL */}
      {cityModal.open && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-brand-600" />
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                    {cityModal.mode === "add" ? "Add New City" : "Edit City"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setCityModal({ open: false, mode: "add", data: {} })}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveCity} className="p-6 space-y-4">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 text-xs">
                    City Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={cityModal.data.cityName || ""}
                    onChange={(e) =>
                      setCityModal({
                        ...cityModal,
                        data: { ...cityModal.data, cityName: e.target.value },
                      })
                    }
                    placeholder="e.g. Lucknow, Varanasi"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:border-brand-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 text-xs">
                    State Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={cityModal.data.stateName || ""}
                    onChange={(e) =>
                      setCityModal({
                        ...cityModal,
                        data: { ...cityModal.data, stateName: e.target.value },
                      })
                    }
                    placeholder="e.g. Uttar Pradesh"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs outline-none focus:border-brand-500 font-semibold"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="city-status"
                    checked={cityModal.data.status ?? true}
                    onChange={(e) =>
                      setCityModal({
                        ...cityModal,
                        data: { ...cityModal.data, status: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded accent-brand-600 cursor-pointer"
                  />
                  <label
                    htmlFor="city-status"
                    className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                  >
                    Active Operations (Enabled)
                  </label>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    disabled={isSavingCity}
                    onClick={() => setCityModal({ open: false, mode: "add", data: {} })}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingCity}
                    className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs shadow-lux flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    {isSavingCity ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{cityModal.mode === "add" ? "Adding City..." : "Updating City..."}</span>
                      </>
                    ) : (
                      <span>{cityModal.mode === "add" ? "Add City" : "Save Changes"}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* DELETE CITY CONFIRMATION MODAL */}
      {deleteCityModal.open && deleteCityModal.city && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 text-center animate-in fade-in zoom-in-95 duration-200">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-800">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-slate-900 dark:text-white text-base">
                  Delete City?
                </h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to delete{" "}
                  <strong className="text-slate-800 dark:text-slate-200">
                    "{deleteCityModal.city.cityName}"
                  </strong>
                  ?
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteCityModal({ open: false, city: null })}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteCity}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-lux cursor-pointer transition-colors"
                >
                  Delete City
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}

