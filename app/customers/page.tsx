"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  MapPin,
  Phone,
  Mail,
  X,
  Eye,
  Edit2,
  Trash2,
  Plus,
  UserPlus,
  Building,
  CreditCard,
  CheckCircle2,
  Filter,
  Home,
  Briefcase,
  TrendingUp,
  Activity,
  User,
  HeartHandshake,
  HelpCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import {
  getAdminCustomersApi,
  createCustomerApi,
  updateCustomerApi,
  deleteCustomerApi,
  getLocalitiesApi,
  ApiAdminCustomerItem,
  ApiLocality,
} from "@/lib/api";
import { CustomSelect } from "@/components/CustomSelect";
import { DataTable, Column } from "@/components/DataTable";
import { RowActionMenu } from "@/components/RowActionMenu";
import { Portal } from "@/components/Portal";
import { ShimmerRow } from "@/components/ShimmerLoader";

export interface CustomerRow {
  id: string;
  customerCode: string;
  fullName: string;
  mobile: string;
  alternatePhone?: string;
  email?: string;
  customerCategory: "individual_household" | "business" | string;
  propertyHouseholdType: "apartment_flat" | "independent_house" | "villa" | "office_shop" | "other" | string;
  localityId: string;
  localityName: string;
  pincode: string;
  serviceAddress: string;
  addressLabel: string;
  relationshipType: "self" | "family_member" | "friend_neighbor" | "office_work" | "other_person" | string;
  landmark?: string;
  status: boolean;
  createdAt?: string;
  raw: ApiAdminCustomerItem;
}

import { getStoredModuleData, setCachedModuleData, isModuleCacheFresh } from "@/lib/moduleCache";

export default function CustomersPage() {
  const initialCached = getStoredModuleData<CustomerRow[]>("customers");
  const initialCachedLocs = getStoredModuleData<ApiLocality[]>("customer_localities");
  const [customers, setCustomers] = useState<CustomerRow[]>(() => initialCached || []);
  const [localities, setLocalities] = useState<ApiLocality[]>(() => initialCachedLocs || []);
  const [loading, setLoading] = useState(() => !(isModuleCacheFresh("customers", 30000) && initialCached && initialCached.length > 0));
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [localityFilter, setLocalityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Slide-Over Drawer State (Used for BOTH Add & Edit)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerRow | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Confirmation Modal State
  const [deleteCustomer, setDeleteCustomer] = useState<CustomerRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Unified Form States for Add & Edit
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formAlternatePhone, setFormAlternatePhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formCustomerCategory, setFormCustomerCategory] = useState<"individual_household" | "business">("individual_household");
  const [formPropertyType, setFormPropertyType] = useState<"apartment_flat" | "independent_house" | "villa" | "office_shop" | "other">("apartment_flat");
  const [formAddressLabel, setFormAddressLabel] = useState("Home (Primary)");
  const [formRelationshipType, setFormRelationshipType] = useState<"self" | "family_member" | "friend_neighbor" | "office_work" | "other_person">("self");
  const [formLocalityId, setFormLocalityId] = useState("");
  const [formPincode, setFormPincode] = useState("");
  const [formServiceAddress, setFormServiceAddress] = useState("");
  const [formLandmark, setFormLandmark] = useState("");

  const recipientTypeOptions = [
    { type: "self", label: "Self", icon: User, color: "bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800" },
    { type: "family_member", label: "Family", icon: Users, color: "bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800" },
    { type: "friend_neighbor", label: "Friend", icon: HeartHandshake, color: "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800" },
    { type: "office_work", label: "Office", icon: Briefcase, color: "bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800" },
    { type: "other_person", label: "Other", icon: HelpCircle, color: "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700" },
  ] as const;

  // Load Localities from API
  const fetchLocalities = useCallback(async (force: boolean = false) => {
    if (!force && isModuleCacheFresh("customer_localities", 30000)) {
      const cached = getStoredModuleData<ApiLocality[]>("customer_localities");
      if (cached && cached.length > 0) {
        setLocalities(cached);
        return;
      }
    }
    try {
      const res = await getLocalitiesApi({ limit: 200, forceRefresh: force });
      if (res && res.success !== false && Array.isArray(res.data)) {
        setLocalities(res.data);
        setCachedModuleData("customer_localities", res.data);
      }
    } catch (err) {
      console.error("Error fetching localities:", err);
    }
  }, []);

  // Fetch Customers from Backend API
  const fetchCustomers = useCallback(async (force: boolean = false) => {
    if (!force && !searchQuery && isModuleCacheFresh("customers", 30000)) {
      const cached = getStoredModuleData<CustomerRow[]>("customers");
      if (cached && cached.length > 0) {
        setCustomers(cached);
        setLoading(false);
        return;
      }
    }
    if (customers.length === 0 && (!initialCached || initialCached.length === 0)) {
      setLoading(true);
    }
    setErrorMsg(null);
    try {
      const res = await getAdminCustomersApi({
        search: searchQuery || undefined,
        limit: 100,
      });

      if (res && res.success !== false) {
        const rawList: ApiAdminCustomerItem[] = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.customers)
          ? res.customers
          : [];

        const formatted: CustomerRow[] = rawList.map((item) => {
          const addressObj = item.primaryAddress;
          let locName = "Varanasi";
          let locPincode = addressObj?.pincode || "221002";
          let locId = "";

          if (addressObj?.localityId) {
            if (typeof addressObj.localityId === "object") {
              locName = addressObj.localityId.localityName || "Varanasi";
              locPincode = addressObj.localityId.pincode || addressObj.pincode || "221002";
              locId = addressObj.localityId._id || "";
            } else {
              locId = addressObj.localityId;
            }
          }

          return {
            id: item._id,
            customerCode: item.customerCode || item._id,
            fullName: item.fullName,
            mobile: item.mobile,
            alternatePhone: item.alternatePhone || "",
            email: item.email || "",
            customerCategory: item.customerCategory || "individual_household",
            propertyHouseholdType: item.propertyHouseholdType || "apartment_flat",
            localityId: locId,
            localityName: locName,
            pincode: locPincode,
            serviceAddress: addressObj?.serviceAddress || "",
            addressLabel: addressObj?.addressLabel || "Home (Primary)",
            relationshipType: addressObj?.relationshipType || "self",
            landmark: addressObj?.landmark || "",
            status: item.status ?? true,
            createdAt: item.createdAt,
            raw: item,
          };
        });

        setCustomers(formatted);
        setCachedModuleData("customers", formatted);
      
      } else {
        setErrorMsg(res?.message || "Failed to load customers from server.");
      }
    } catch (err: any) {
      console.error("Error loading customers:", err);
      setErrorMsg(err?.message || "An error occurred while fetching customers.");
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchLocalities();
  }, [fetchLocalities]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Open Drawer for Creating a New Customer
  const handleOpenAddDrawer = () => {
    setEditingCustomer(null);
    setFormError(null);
    setFormName("");
    setFormPhone("");
    setFormAlternatePhone("");
    setFormEmail("");
    setFormCustomerCategory("individual_household");
    setFormPropertyType("apartment_flat");
    setFormAddressLabel("Home (Primary)");
    setFormRelationshipType("self");

    // Default locality to empty so select locality placeholder is shown
    setFormLocalityId("");
    setFormPincode("");
    setFormServiceAddress("");
    setFormLandmark("");
    setIsDrawerOpen(true);
  };

  // Open Drawer for Editing an Existing Customer
  const handleOpenEditDrawer = (cust: CustomerRow) => {
    setEditingCustomer(cust);
    setFormError(null);
    setFormName(cust.fullName);
    setFormPhone(cust.mobile);
    setFormAlternatePhone(cust.alternatePhone || "");
    setFormEmail(cust.email || "");

    const cat = cust.customerCategory === "business" ? "business" : "individual_household";
    setFormCustomerCategory(cat);

    const validProps = ["apartment_flat", "independent_house", "villa", "office_shop", "other"];
    const propType = validProps.includes(cust.propertyHouseholdType)
      ? (cust.propertyHouseholdType as any)
      : "apartment_flat";
    setFormPropertyType(propType);

    setFormAddressLabel(cust.addressLabel || "Home (Primary)");

    const validRels = ["self", "family_member", "friend_neighbor", "office_work", "other_person"];
    const rel = validRels.includes(cust.relationshipType)
      ? (cust.relationshipType as any)
      : "self";
    setFormRelationshipType(rel);

    setFormLocalityId(cust.localityId || (localities[0] ? localities[0]._id : ""));
    setFormPincode(cust.pincode || (localities[0] ? localities[0].pincode : "221002"));
    setFormServiceAddress(cust.serviceAddress || "");
    setFormLandmark(cust.landmark || "");
    setIsDrawerOpen(true);
  };

  // Select Locality Change Handler
  const handleLocalityChange = (locId: string) => {
    setFormLocalityId(locId);
    const found = localities.find((l) => l._id === locId);
    if (found) {
      setFormPincode(found.pincode);
    }
  };

  // Submit Handler for Add & Edit Drawer Form
  const handleSaveCustomerForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError("Customer full name is required.");
      return;
    }
    if (!formPhone.trim() || !/^[6-9]\d{9}$/.test(formPhone.trim())) {
      setFormError("Valid 10-digit mobile number starting with 6-9 is required.");
      return;
    }
    if (!formLocalityId) {
      setFormError("Please select a valid Varanasi locality.");
      return;
    }
    if (!formPincode.trim()) {
      setFormError("Pincode is required.");
      return;
    }
    if (!formServiceAddress.trim()) {
      setFormError("Service address is required.");
      return;
    }

    setFormSubmitting(true);

    const payload = {
      fullName: formName.trim(),
      mobile: formPhone.trim(),
      alternatePhone: formAlternatePhone.trim() || undefined,
      email: formEmail.trim() || undefined,
      customerCategory: formCustomerCategory,
      propertyHouseholdType: formPropertyType,
      address: {
        addressLabel: formAddressLabel.trim() || "Home (Primary)",
        relationshipType: formRelationshipType,
        localityId: formLocalityId,
        pincode: formPincode.trim(),
        serviceAddress: formServiceAddress.trim(),
        landmark: formLandmark.trim() || undefined,
      },
    };

    try {
      let res;
      if (editingCustomer) {
        res = await updateCustomerApi(editingCustomer.id, payload);
      } else {
        res = await createCustomerApi(payload);
      }

      if (res && res.success !== false) {
        setIsDrawerOpen(false);
        await fetchCustomers();
      } else {
        setFormError(res?.message || "Failed to save customer. Please try again.");
      }
    } catch (err: any) {
      console.error("Save Customer Error:", err);
      setFormError(err?.message || "An unexpected error occurred while saving customer.");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete Customer Handler
  const handleDeleteCustomer = async () => {
    if (!deleteCustomer) return;
    setIsDeleting(true);
    try {
      const res = await deleteCustomerApi(deleteCustomer.id);
      if (res && res.success !== false) {
        setDeleteCustomer(null);
        await fetchCustomers();
      } else {
        alert(res?.message || "Failed to delete customer.");
      }
    } catch (err: any) {
      console.error("Delete Customer Error:", err);
      alert(err?.message || "An error occurred while deleting customer.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Client-side filtering over fetched list
  const filteredCustomers = customers.filter((c) => {
    const matchesLocality = localityFilter === "all" || c.localityId === localityFilter || c.localityName.toLowerCase() === localityFilter.toLowerCase();
    const matchesCategory = categoryFilter === "all" || c.customerCategory === categoryFilter;
    return matchesLocality && matchesCategory;
  });

  // Table Columns
  const columns: Column<CustomerRow>[] = [
    {
      key: "fullName",
      header: "Customer & Code",
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400 font-extrabold text-xs flex items-center justify-center border border-brand-200 dark:border-brand-800 shrink-0 shadow-xs">
            {row.fullName.charAt(0).toUpperCase()}
          </div>
          <Link href={`/customers/${row.id}`} className="flex flex-col hover:underline">
            <span className="font-extrabold text-slate-900 dark:text-white text-xs">{row.fullName}</span>
            <span className="text-[10px] text-slate-400 font-mono">Code: {row.customerCode}</span>
          </Link>
        </div>
      ),
    },
    {
      key: "mobile",
      header: "Contact Details",
      accessor: (row) => (
        <div className="flex flex-col">
          <span className="font-bold text-brand-600 dark:text-brand-400 text-xs flex items-center gap-1">
            <Phone className="w-3 h-3 text-emerald-500" />
            <span>{row.mobile}</span>
          </span>
          {row.email && (
            <span className="text-[10px] text-slate-500 flex items-center gap-0.5 mt-0.5 truncate max-w-[180px]">
              <Mail className="w-3 h-3 text-slate-400 shrink-0" /> {row.email}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "localityName",
      header: "Locality & Address",
      accessor: (row) => (
        <div className="flex flex-col text-xs max-w-[220px]">
          <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
            <span className="truncate">{row.localityName} ({row.pincode})</span>
          </span>
          <span className="text-[10px] text-slate-500 truncate mt-0.5">
            {row.serviceAddress || "Address on record"}
          </span>
        </div>
      ),
    },
    {
      key: "customerCategory",
      header: "Account Category",
      accessor: (row) => {
        const isB2B = row.customerCategory === "business";
        const categoryLabel = isB2B ? "Commercial B2B" : "Individual Household";
        
        let propLabel = "Apartment / Flat";
        if (row.propertyHouseholdType === "independent_house") propLabel = "Independent House";
        else if (row.propertyHouseholdType === "villa") propLabel = "Villa / Bungalow";
        else if (row.propertyHouseholdType === "office_shop") propLabel = "Office / Shop";
        else if (row.propertyHouseholdType === "other") propLabel = "Other";

        return (
          <div className="flex flex-col gap-1 text-xs">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border w-fit ${
                isB2B
                  ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800"
                  : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
              }`}
            >
              {isB2B ? "🏢 " : "🏠 "}
              {categoryLabel}
            </span>
            <span className="text-[10px] text-slate-500 font-semibold">{propLabel}</span>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      accessor: (row) => (
        <span
          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border inline-flex items-center gap-1 ${
            row.status
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${row.status ? "bg-emerald-500" : "bg-rose-500"}`} />
          {row.status ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "id",
      header: "Actions",
      sticky: "right",
      accessor: (row) => (
        <RowActionMenu
          actions={[
            {
              label: "View",
              icon: Eye,
              href: `/customers/${row.id}`,
            },
            {
              label: "Edit",
              icon: Edit2,
              onClick: () => handleOpenEditDrawer(row),
            },
            {
              label: "Delete",
              icon: Trash2,
              onClick: () => setDeleteCustomer(row),
              danger: true,
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header with STRICTLY ONE PRIMARY BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-600" />
            <span>Customer Directory & Accounts</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Manage registered clients, service delivery addresses & account classifications.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddDrawer}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* ERROR BANNER IF API FAILS */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-between gap-3 text-rose-800 dark:text-rose-300 text-xs font-semibold">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchCustomers(true)}
            className="px-3 py-1 bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-lg text-xs font-bold hover:bg-rose-100 flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}

      {/* QUICK STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm relative overflow-hidden group hover:border-brand-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Clients
            </span>
            <div className="p-2.5 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 border border-brand-200 dark:border-brand-800 shadow-sm">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {customers.length}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-600 inline" /> Registered Customers
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm relative overflow-hidden group hover:border-brand-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Commercial B2B
            </span>
            <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 border border-purple-200 dark:border-purple-800 shadow-sm">
              <Building className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
              {customers.filter((c) => c.customerCategory === "business").length}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
            <Activity className="w-3 h-3 text-purple-500 inline" /> Business Accounts
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm relative overflow-hidden group hover:border-brand-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Individual Households
            </span>
            <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 border border-blue-200 dark:border-blue-800 shadow-sm">
              <Home className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
              {customers.filter((c) => c.customerCategory !== "business").length}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-blue-600 inline" /> Residential Clients
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm relative overflow-hidden group hover:border-brand-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Active Zones
            </span>
            <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 border border-amber-200 dark:border-amber-800 shadow-sm">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {new Set(customers.map((c) => c.localityName)).size} Localities
            </span>
          </div>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
            Varanasi Active Coverage
          </p>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone or code..."
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold outline-none focus:border-brand-500 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <CustomSelect
            value={categoryFilter}
            onChange={(val) => setCategoryFilter(val)}
            options={[
              { value: "all", label: "All Categories" },
              { value: "individual_household", label: "Individual Household" },
              { value: "business", label: "Commercial B2B" },
            ]}
            placeholder="Filter Category"
            className="w-44 text-xs"
          />

          <CustomSelect
            value={localityFilter}
            onChange={(val) => setLocalityFilter(val)}
            options={[
              { value: "all", label: "All Localities" },
              ...localities.map((loc) => ({
                value: loc._id,
                label: `${loc.localityName} (${loc.pincode})`,
              })),
            ]}
            placeholder="Filter Locality"
            className="w-48 text-xs"
          />

          <button
            type="button"
            onClick={() => fetchCustomers(true)}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-brand-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* DATA TABLE */}
      {loading ? (
        <ShimmerRow count={6} />
      ) : (
        <DataTable
          columns={columns as Column<any>[]}
          data={filteredCustomers}
          searchPlaceholder="Filter table results..."
        />
      )}

      {/* ─── SLIDE-OVER CUSTOMER FORM DRAWER (UNIFIED FOR ADD & EDIT) ─── */}
      {isDrawerOpen && (
        <Portal>
          <div className="fixed inset-0 z-[99999] flex justify-end bg-slate-950/60 backdrop-blur-xs transition-opacity">
            <div className="w-full max-w-xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-800">
                    {editingCustomer ? <Edit2 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-lg tracking-tight">
                      {editingCustomer ? "Edit Customer Account" : "Add New Customer"}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {editingCustomer
                        ? `Update details for ${editingCustomer.fullName} (${editingCustomer.customerCode})`
                        : "Register new customer & primary address into Varanasi backend database"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Form Body */}
              <form onSubmit={handleSaveCustomerForm} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
                {formError && (
                  <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-2 text-rose-800 dark:text-rose-300 text-xs font-bold">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* SECTION 1: PERSONAL & CONTACT IDENTITY */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white font-extrabold text-sm border-b border-slate-200 dark:border-slate-700 pb-2">
                    <User className="w-4 h-4 text-brand-600" />
                    <span>1. Customer Identity & Phone</span>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Customer Full Name *
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Rajesh Kumar Agrawal"
                      className="w-full h-[42px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all text-xs"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Mobile Phone (10 digits) *
                      </label>
                      <input
                        type="tel"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="9839012345"
                        className="w-full h-[42px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all text-xs"
                        required
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Alternate Phone
                      </label>
                      <input
                        type="tel"
                        value={formAlternatePhone}
                        onChange={(e) => setFormAlternatePhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="9450199000"
                        className="w-full h-[42px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold outline-none focus:border-brand-500 transition-all text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="rajesh.agrawal@gmail.com"
                      className="w-full h-[42px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold outline-none focus:border-brand-500 transition-all text-xs"
                    />
                  </div>
                </div>

                {/* SECTION 2: ACCOUNT & PROPERTY TYPE */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white font-extrabold text-sm border-b border-slate-200 dark:border-slate-700 pb-2">
                    <Building className="w-4 h-4 text-purple-600" />
                    <span>2. Account Category & Household Type</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <CustomSelect
                      label="Customer Category *"
                      value={formCustomerCategory}
                      onChange={(val) => setFormCustomerCategory(val as any)}
                      options={[
                        { value: "individual_household", label: "Individual Household" },
                        { value: "business", label: "Commercial Business / B2B" },
                      ]}
                      placeholder="Select Category..."
                    />

                    <CustomSelect
                      label="Property Household Type *"
                      value={formPropertyType}
                      onChange={(val) => setFormPropertyType(val as any)}
                      options={[
                        { value: "apartment_flat", label: "Apartment / Flat" },
                        { value: "independent_house", label: "Independent House" },
                        { value: "villa", label: "Villa / Bungalow" },
                        { value: "office_shop", label: "Commercial Office / Shop" },
                        { value: "other", label: "Other" },
                      ]}
                      placeholder="Select Property Type..."
                    />
                  </div>
                </div>

                {/* SECTION 3: DELIVERY ADDRESS & RECIPIENT */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white font-extrabold text-sm border-b border-slate-200 dark:border-slate-700 pb-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>3. Delivery Address Details</span>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Address Label *
                    </label>
                    <input
                      type="text"
                      value={formAddressLabel}
                      onChange={(e) => setFormAddressLabel(e.target.value)}
                      placeholder="e.g. Home (Primary), Main Office"
                      className="w-full h-[42px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold outline-none text-xs focus:border-brand-500 transition-all"
                      required
                    />
                  </div>

                  {/* RELATIONSHIP TYPE BADGES */}
                  <div className="space-y-2">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block">
                      Address Relationship Type *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {recipientTypeOptions.map((opt) => {
                        const Icon = opt.icon;
                        const isSelected = formRelationshipType === opt.type;
                        return (
                          <button
                            key={opt.type}
                            type="button"
                            onClick={() => setFormRelationshipType(opt.type as any)}
                            className={`p-2.5 rounded-xl border text-center font-bold text-[11px] transition-all cursor-pointer flex flex-col items-center gap-1 ${
                              isSelected
                                ? opt.color + " shadow-xs ring-1"
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-purple-300"
                            }`}
                          >
                            <Icon className="w-4 h-4 shrink-0" />
                            <span className="leading-tight">{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <CustomSelect
                      label="Locality *"
                      value={formLocalityId}
                      onChange={handleLocalityChange}
                      options={localities.map((loc) => ({
                        value: loc._id,
                        label: `${loc.localityName} (${loc.pincode})`,
                      }))}
                      placeholder="Select Locality..."
                    />

                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Pincode *
                      </label>
                      <input
                        type="text"
                        value={formPincode}
                        onChange={(e) => setFormPincode(e.target.value)}
                        placeholder="221002"
                        className="w-full h-[42px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold outline-none text-xs focus:border-brand-500 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Complete Service Address *
                    </label>
                    <textarea
                      rows={3}
                      value={formServiceAddress}
                      onChange={(e) => setFormServiceAddress(e.target.value)}
                      placeholder="House No., Building Name, Street Road, Varanasi"
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      value={formLandmark}
                      onChange={(e) => setFormLandmark(e.target.value)}
                      placeholder="e.g. Near IP Sigra Mall"
                      className="w-full h-[40px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium outline-none text-xs focus:border-brand-500 transition-all"
                    />
                  </div>
                </div>

                {/* STICKY BOTTOM ACTION BAR */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex gap-3 sticky bottom-0 bg-white dark:bg-slate-900 py-3">
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    disabled={formSubmitting}
                    className="px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-extrabold hover:bg-slate-200 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-extrabold shadow-xs cursor-pointer transition-colors flex items-center justify-center gap-2 text-xs disabled:opacity-50"
                  >
                    {formSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving Customer...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{editingCustomer ? "Update Customer" : "Save Customer"}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* ─── MODAL DELETE CONFIRMATION ─── */}
      {deleteCustomer && (
        <Portal>
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-black text-slate-900 dark:text-white text-lg">Delete Customer Account?</h3>
              <p className="text-xs text-slate-500 font-semibold">
                Are you sure you want to delete <strong>{deleteCustomer.fullName}</strong> ({deleteCustomer.mobile})? This action cannot be undone.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteCustomer(null)}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs cursor-pointer hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteCustomer}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-extrabold text-xs shadow-lux cursor-pointer transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Delete Account</span>
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
