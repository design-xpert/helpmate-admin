"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Phone,
  Mail,
  Calendar,
  X,
  Edit2,
  Trash2,
  Plus,
  UserCheck,
  CheckCircle2,
  ArrowLeft,
  Receipt,
  Briefcase,
  ExternalLink,
  CreditCard,
  User,
  AlertCircle,
  Loader2,
  RefreshCw,
  Star,
  ShieldCheck,
  Check,
  Tag,
  Building,
  Ban,
} from "lucide-react";
import {
  getCustomerDetailsApi,
  updateCustomerApi,
  updateCustomerStatusApi,
  deleteCustomerApi,
  createCustomerAddressApi,
  updateCustomerAddressApi,
  deleteCustomerAddressApi,
  getLocalitiesApi,
  ApiCustomerDetailsData,
  ApiCustomerDetailsAddress,
  ApiCustomerDetailsBooking,
  ApiCustomerDetailsInvoice,
  ApiCustomerDetailsReview,
  ApiLocality,
} from "@/lib/api";
import { CustomSelect } from "@/components/CustomSelect";
import { Portal } from "@/components/Portal";
import { DataTable, Column } from "@/components/DataTable";
import { toast } from "@/components/Toast";

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromPath = searchParams?.get("from");
  const custId = (params?.id as string) || "";

  // ─── API DATA STATES ───
  const [data, setData] = useState<ApiCustomerDetailsData | null>(null);
  const [localities, setLocalities] = useState<ApiLocality[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Tab Navigation: Profile -> Bookings -> Invoices -> Manage Address -> Reviews
  const [activeTab, setActiveTab] = useState<
    "profile" | "bookings" | "invoices" | "addresses" | "reviews"
  >("profile");

  // Slide-Over Profile Edit Drawer State
  const [isEditProfileDrawerOpen, setIsEditProfileDrawerOpen] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAlternatePhone, setEditAlternatePhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editCustomerCategory, setEditCustomerCategory] = useState("individual_household");
  const [editPropertyType, setEditPropertyType] = useState("apartment_flat");
  const [editLocalityId, setEditLocalityId] = useState("");
  const [editPincode, setEditPincode] = useState("221002");
  const [editAddress, setEditAddress] = useState("");
  const [editLandmark, setEditLandmark] = useState("");
  const [editAddressLabel, setEditAddressLabel] = useState("Home (Primary)");
  const [editRelationshipType, setEditRelationshipType] = useState<any>("self");

  // Slide-Over Address Drawer State (Add / Edit)
  const [isAddressDrawerOpen, setIsAddressDrawerOpen] = useState(false);
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [editingAddr, setEditingAddr] = useState<ApiCustomerDetailsAddress | null>(null);
  const [addrFormLabel, setAddrFormLabel] = useState("Home (Primary)");
  const [addrFormType, setAddrFormType] = useState<string>("self");
  const [addrFormRecipientName, setAddrFormRecipientName] = useState("");
  const [addrFormRecipientPhone, setAddrFormRecipientPhone] = useState("");
  const [addrFormLocalityId, setAddrFormLocalityId] = useState("");
  const [addrFormPincode, setAddrFormPincode] = useState("221002");
  const [addrFormAddress, setAddrFormAddress] = useState("");
  const [addrFormLandmark, setAddrFormLandmark] = useState("");
  const [addrFormIsPrimary, setAddrFormIsPrimary] = useState(false);

  // Delete Modals
  const [deleteModalCustomer, setDeleteModalCustomer] = useState(false);
  const [isDeletingCustomer, setIsDeletingCustomer] = useState(false);
  const [deleteModalAddress, setDeleteModalAddress] = useState<ApiCustomerDetailsAddress | null>(null);
  const [isDeletingAddress, setIsDeletingAddress] = useState(false);

  // ─── FETCH CUSTOMER DETAILS ───
  const fetchCustomerDetails = useCallback(
    async (showLoading = true, forceRefresh = false) => {
      if (!custId) {
        setErrorMsg("Missing Customer ID.");
        setLoading(false);
        return;
      }
      if (showLoading) setLoading(true);
      setErrorMsg(null);

      try {
        const res = await getCustomerDetailsApi(custId, forceRefresh);
        if (res && res.success && res.data) {
          setData(res.data);
        } else {
          setErrorMsg(res?.message || "Customer not found or failed to load details.");
        }
      } catch (err: any) {
        console.error("fetchCustomerDetails error:", err);
        setErrorMsg(err.message || "Failed to connect to backend server.");
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [custId]
  );

  // ─── FETCH LOCALITIES ───
  const fetchLocalities = useCallback(async () => {
    try {
      const res = await getLocalitiesApi();
      if (res && res.success && Array.isArray(res.data)) {
        setLocalities(res.data);
      }
    } catch (err) {
      console.error("fetchLocalities error:", err);
    }
  }, []);

  useEffect(() => {
    fetchCustomerDetails(true);
    fetchLocalities();
  }, [fetchCustomerDetails, fetchLocalities]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchCustomerDetails(false, true);
  };

  // ─── DERIVED API VALUES ───
  const customer = data?.customer;
  const addresses = useMemo(() => data?.addresses || [], [data?.addresses]);
  const bookings = useMemo(() => data?.bookings || [], [data?.bookings]);
  const invoices = useMemo(() => data?.invoices || [], [data?.invoices]);
  const reviews = useMemo(() => data?.reviews || [], [data?.reviews]);
  const summary = useMemo(
    () =>
      data?.summary || {
        totalAddresses: addresses.length,
        totalBookings: bookings.length,
        totalInvoices: invoices.length,
        totalReviews: reviews.length,
      },
    [data?.summary, addresses.length, bookings.length, invoices.length, reviews.length]
  );

  // Primary Address (from API addresses array)
  const primaryAddress = useMemo(
    () => addresses.find((a) => a.isPrimary) || addresses[0] || null,
    [addresses]
  );

  // Locality label resolver helper
  const getLocalityLabel = useCallback(
    (locId: any, pincode?: string) => {
      if (locId && typeof locId === "object") {
        return locId.localityName
          ? `${locId.localityName}${locId.pincode || pincode ? ` (${locId.pincode || pincode})` : ""}`
          : "";
      }
      const found = localities.find((l) => l._id === locId);
      if (found) {
        return `${found.localityName} (${found.pincode || pincode || ""})`;
      }
      return pincode ? `Varanasi (${pincode})` : "Varanasi";
    },
    [localities]
  );

  // Total Lifetime Invoiced Spend from invoices
  const totalLifetimeSpend = useMemo(
    () =>
      invoices.reduce((acc, inv) => acc + (inv.billing?.totalAmount || 0), 0),
    [invoices]
  );

  // Average review rating from reviews
  const avgRating = useMemo(() => {
    if (reviews.length === 0) return null;
    const total = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  // ─── OPEN PROFILE EDIT DRAWER ───
  const handleOpenEditProfile = () => {
    if (!customer) return;
    setProfileError(null);
    setEditName(customer.fullName || "");
    setEditPhone(customer.mobile || "");
    setEditAlternatePhone(customer.alternatePhone || "");
    setEditEmail(customer.email || "");
    setEditCustomerCategory(
      customer.customerCategory === "business" ? "business" : "individual_household"
    );
    const validProps = ["apartment_flat", "independent_house", "villa", "office_shop", "other"];
    setEditPropertyType(
      validProps.includes(customer.propertyHouseholdType || "")
        ? (customer.propertyHouseholdType as string)
        : "apartment_flat"
    );

    // Primary address fields fallback from API
    if (primaryAddress) {
      setEditAddressLabel(primaryAddress.addressLabel || "Home (Primary)");
      setEditRelationshipType(primaryAddress.relationshipType || "self");
      const locId =
        typeof primaryAddress.localityId === "object"
          ? primaryAddress.localityId?._id
          : primaryAddress.localityId || (localities[0]?._id || "");
      setEditLocalityId(locId);
      setEditPincode(primaryAddress.pincode || (localities[0]?.pincode || "221002"));
      setEditAddress(primaryAddress.serviceAddress || "");
      setEditLandmark(primaryAddress.landmark || "");
    } else {
      setEditAddressLabel("Home (Primary)");
      setEditRelationshipType("self");
      setEditLocalityId(localities[0]?._id || "");
      setEditPincode(localities[0]?.pincode || "221002");
      setEditAddress("");
      setEditLandmark("");
    }

    setIsEditProfileDrawerOpen(true);
  };

  // ─── SAVE PROFILE CHANGES ───
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);

    if (!editName.trim()) {
      setProfileError("Full Name is required.");
      return;
    }
    if (!editPhone.trim() || !/^[6-9]\d{9}$/.test(editPhone.trim())) {
      setProfileError("Valid 10-digit mobile number starting with 6-9 is required.");
      return;
    }
    if (!editLocalityId) {
      setProfileError("Please select a valid Varanasi locality.");
      return;
    }
    if (!editAddress.trim()) {
      setProfileError("Service address is required.");
      return;
    }

    setProfileSaving(true);
    try {
      const payload: any = {
        fullName: editName.trim(),
        mobile: editPhone.trim(),
        alternatePhone: editAlternatePhone.trim(),
        email: editEmail.trim(),
        customerCategory: editCustomerCategory,
        propertyHouseholdType: editPropertyType,
        address: {
          addressLabel: editAddressLabel.trim() || "Home (Primary)",
          relationshipType: editRelationshipType || "self",
          localityId: editLocalityId,
          pincode: editPincode.trim() || "221002",
          serviceAddress: editAddress.trim(),
          landmark: editLandmark.trim(),
        },
      };

      const res = await updateCustomerApi(custId, payload);
      if (res && res.success !== false) {
        setIsEditProfileDrawerOpen(false);
        await fetchCustomerDetails(false, true);
      } else {
        setProfileError(res?.message || "Failed to update customer profile.");
      }
    } catch (err: any) {
      console.error("handleSaveProfile error:", err);
      setProfileError(err.message || "An error occurred while saving profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  // ─── OPEN ADD ADDRESS DRAWER ───
  const handleOpenAddAddressDrawer = () => {
    setEditingAddr(null);
    setAddressError(null);
    setAddrFormLabel("Home (Primary)");
    setAddrFormType("self");
    setAddrFormRecipientName(customer?.fullName || "");
    setAddrFormRecipientPhone(customer?.mobile || "");
    const defaultLoc = localities[0];
    setAddrFormLocalityId(defaultLoc?._id || "");
    setAddrFormPincode(defaultLoc?.pincode || "221002");
    setAddrFormAddress("");
    setAddrFormLandmark("");
    setAddrFormIsPrimary(addresses.length === 0);
    setIsAddressDrawerOpen(true);
  };

  // ─── OPEN EDIT ADDRESS DRAWER ───
  const handleOpenEditAddressDrawer = (addr: ApiCustomerDetailsAddress) => {
    setEditingAddr(addr);
    setAddressError(null);
    setAddrFormLabel(addr.addressLabel || "Home Address");
    setAddrFormType(addr.relationshipType || "self");
    setAddrFormRecipientName(addr.recipientName || customer?.fullName || "");
    setAddrFormRecipientPhone(addr.recipientMobile || customer?.mobile || "");
    const locId =
      typeof addr.localityId === "object"
        ? addr.localityId?._id
        : addr.localityId || (localities[0]?._id || "");
    setAddrFormLocalityId(locId);
    setAddrFormPincode(addr.pincode || "221002");
    setAddrFormAddress(addr.serviceAddress || "");
    setAddrFormLandmark(addr.landmark || "");
    setAddrFormIsPrimary(Boolean(addr.isPrimary));
    setIsAddressDrawerOpen(true);
  };

  // ─── SAVE ADDRESS FORM (ADD / EDIT) ───
  const handleSaveAddressForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError(null);

    if (!addrFormLabel.trim()) {
      setAddressError("Address title label is required.");
      return;
    }
    if (!addrFormLocalityId) {
      setAddressError("Please select a Varanasi locality.");
      return;
    }
    if (!addrFormAddress.trim()) {
      setAddressError("Full service address is required.");
      return;
    }

    setAddressSaving(true);
    try {
      if (editingAddr) {
        // Update existing address
        const res = await updateCustomerAddressApi(editingAddr._id, {
          customerId: custId,
          addressLabel: addrFormLabel.trim(),
          relationshipType: addrFormType,
          localityId: addrFormLocalityId,
          pincode: addrFormPincode.trim(),
          serviceAddress: addrFormAddress.trim(),
          landmark: addrFormLandmark.trim(),
          recipientName: addrFormRecipientName.trim() || undefined,
          recipientMobile: addrFormRecipientPhone.trim() || undefined,
          isPrimary: addrFormIsPrimary,
        });
        if (res && res.success !== false) {
          setIsAddressDrawerOpen(false);
          await fetchCustomerDetails(false, true);
        } else {
          setAddressError(res?.message || "Failed to update address.");
        }
      } else {
        // Create new address
        const res = await createCustomerAddressApi({
          customerId: custId,
          addressLabel: addrFormLabel.trim(),
          relationshipType: addrFormType,
          localityId: addrFormLocalityId,
          pincode: addrFormPincode.trim(),
          serviceAddress: addrFormAddress.trim(),
          landmark: addrFormLandmark.trim(),
          recipientName: addrFormRecipientName.trim() || undefined,
          recipientMobile: addrFormRecipientPhone.trim() || undefined,
          isPrimary: addrFormIsPrimary || addresses.length === 0,
        });
        if (res && res.success !== false) {
          setIsAddressDrawerOpen(false);
          await fetchCustomerDetails(false, true);
        } else {
          setAddressError(res?.message || "Failed to save new address.");
        }
      }
    } catch (err: any) {
      console.error("handleSaveAddressForm error:", err);
      setAddressError(err.message || "An error occurred while saving address.");
    } finally {
      setAddressSaving(false);
    }
  };

  // ─── DELETE ADDRESS ───
  const handleConfirmDeleteAddress = async () => {
    if (!deleteModalAddress) return;
    setIsDeletingAddress(true);
    try {
      const res = await deleteCustomerAddressApi(deleteModalAddress._id);
      if (res && res.success !== false) {
        setDeleteModalAddress(null);
        await fetchCustomerDetails(false, true);
      } else {
        alert(res?.message || "Failed to delete address.");
      }
    } catch (err: any) {
      console.error("deleteCustomerAddress error:", err);
      alert(err.message || "An error occurred while deleting address.");
    } finally {
      setIsDeletingAddress(false);
    }
  };

  // ─── DELETE CUSTOMER ACCOUNT ───
  const handleConfirmDeleteCustomer = async () => {
    if (!customer) return;
    setIsDeletingCustomer(true);
    try {
      const res = await deleteCustomerApi(custId);
      if (res && res.success !== false) {
        setDeleteModalCustomer(false);
        router.push("/customers");
      } else {
        alert(res?.message || "Failed to delete customer.");
      }
    } catch (err: any) {
      console.error("deleteCustomer error:", err);
      alert(err.message || "An error occurred while deleting customer.");
    } finally {
      setIsDeletingCustomer(false);
    }
  };

  // ─── TOGGLE CUSTOMER STATUS (Active <-> Inactive via PATCH /api/admin/customer/:id/status) ───
  const handleToggleStatus = async () => {
    if (!customer || isUpdatingStatus) return;
    const newStatus = customer.status === false ? true : false;
    const actionText = newStatus ? "activate" : "deactivate";

    setIsUpdatingStatus(true);
    // Optimistic local state update
    setData((prev) => {
      if (!prev || !prev.customer) return prev;
      return {
        ...prev,
        customer: {
          ...prev.customer,
          status: newStatus,
        },
      };
    });

    try {
      const res = await updateCustomerStatusApi(customer._id || custId, newStatus);
      if (res && res.success !== false) {
        toast.success(
          `Customer ${newStatus ? "Activated" : "Deactivated"}`,
          `${customer.fullName} is now ${newStatus ? "active" : "inactive"}.`
        );
      } else {
        // Revert optimistic update
        setData((prev) => {
          if (!prev || !prev.customer) return prev;
          return {
            ...prev,
            customer: {
              ...prev.customer,
              status: !newStatus,
            },
          };
        });
        toast.error("Failed", res?.message || `Failed to ${actionText} customer.`);
      }
    } catch (err: any) {
      // Revert optimistic update
      setData((prev) => {
        if (!prev || !prev.customer) return prev;
        return {
          ...prev,
          customer: {
            ...prev.customer,
            status: !newStatus,
          },
        };
      });
      toast.error("Error", err?.message || `Failed to ${actionText} customer.`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // ─── DATATABLE: BOOKING COLUMNS ───
  const bookingColumns: Column<ApiCustomerDetailsBooking>[] = [
    {
      key: "bookingNumber",
      header: "Booking Number",
      accessor: (row) => (
        <span className="font-mono text-xs font-black text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-2.5 py-1 rounded-lg border border-brand-200 dark:border-brand-800">
          {row.bookingNumber || row._id.slice(-6).toUpperCase()}
        </span>
      ),
      sortable: true,
    },
    {
      key: "serviceItems",
      header: "Services & Packages",
      accessor: (row) => {
        const firstItem = row.items?.[0];
        const pkgName = firstItem?.package?.name || firstItem?.serviceAction?.name || "Home Servicing";
        const catName = firstItem?.category?.name || "General Service";
        const totalItemsCount = row.items?.length || 1;

        return (
          <div>
            <h4 className="font-extrabold text-slate-900 dark:text-white text-xs line-clamp-1">
              {pkgName}
              {totalItemsCount > 1 && (
                <span className="ml-1.5 text-[10px] text-brand-600 font-bold">
                  +{totalItemsCount - 1} more
                </span>
              )}
            </h4>
            <span className="text-[10px] text-slate-400 font-bold uppercase">{catName}</span>
          </div>
        );
      },
    },
    {
      key: "schedule",
      header: "Schedule Date & Slot",
      accessor: (row) => {
        const bDate = row.schedule?.bookingDate
          ? new Date(row.schedule.bookingDate).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
          : new Date(row.createdAt || Date.now()).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
        return (
          <div className="text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200 block">{bDate}</span>
            <span className="text-[10px] text-slate-400 font-mono">
              {row.schedule?.timeSlot || "Standard Slot"}
            </span>
          </div>
        );
      },
    },
    {
      key: "technician",
      header: "Assigned Partner",
      accessor: (row) => (
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
          {row.assignment?.partnerName || (
            <span className="text-slate-400 italic">Unassigned</span>
          )}
        </span>
      ),
    },
    {
      key: "billing",
      header: "Total Amount",
      accessor: (row) => {
        const amt = row.billing?.totalAmount || row.billing?.sellingPrice || 0;
        return (
          <div>
            <span className="font-mono font-black text-slate-900 dark:text-white text-xs block">
              ₹{amt.toLocaleString("en-IN")}
            </span>
            <span className="text-[9px] uppercase font-bold text-slate-400">
              {row.billing?.payment?.paymentMethod?.replace(/_/g, " ") || "Pay Later"}
            </span>
          </div>
        );
      },
      sortable: true,
    },
    {
      key: "status",
      header: "Status",
      accessor: (row) => {
        const st = (row.status || "pending").toLowerCase();
        let badgeStyle = "bg-amber-50 text-amber-700 border-amber-200";
        if (st === "completed") badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
        else if (st === "cancelled") badgeStyle = "bg-rose-50 text-rose-700 border-rose-200";
        else if (st === "in_progress" || st === "assigned")
          badgeStyle = "bg-blue-50 text-blue-700 border-blue-200";

        return (
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase ${badgeStyle}`}
          >
            {row.status.replace(/_/g, " ")}
          </span>
        );
      },
      sortable: true,
    },
    {
      key: "actions",
      header: "Actions",
      accessor: (row) => (
        <Link
          href={`/bookings/${row._id}`}
          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-extrabold text-[11px] transition-colors inline-flex items-center gap-1 cursor-pointer"
        >
          <span>View</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      ),
    },
  ];

  // ─── DATATABLE: INVOICE COLUMNS ───
  const invoiceColumns: Column<ApiCustomerDetailsInvoice>[] = [
    {
      key: "invoiceNumber",
      header: "Invoice Number",
      accessor: (row) => (
        <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
          {row.invoiceNumber || row._id.slice(-6).toUpperCase()}
        </span>
      ),
      sortable: true,
    },
    {
      key: "bookingNumber",
      header: "Booking Ref",
      accessor: (row) => (
        <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
          {row.bookingNumber || (row.bookingId ? `#${row.bookingId.slice(-6)}` : "—")}
        </span>
      ),
      sortable: true,
    },
    {
      key: "serviceSummary",
      header: "Service Description",
      accessor: (row) => {
        const first = row.items?.[0];
        const title = first?.packageName || first?.categoryName || "Home Services Invoice";
        return (
          <div>
            <h4 className="font-extrabold text-slate-900 dark:text-white text-xs line-clamp-1">
              {title}
            </h4>
            <span className="text-[10px] text-slate-400 font-mono">
              {row.address?.localityName ? `📍 ${row.address.localityName}` : "Varanasi Service"}
            </span>
          </div>
        );
      },
    },
    {
      key: "date",
      header: "Issued Date",
      accessor: (row) => {
        const invDate = row.generatedAt || row.createdAt;
        return (
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {invDate
              ? new Date(invDate).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
              : "—"}
          </span>
        );
      },
      sortable: true,
    },
    {
      key: "totalAmount",
      header: "Total (incl. GST)",
      accessor: (row) => {
        const total = row.billing?.totalAmount || row.billing?.sellingPrice || 0;
        const gst = row.billing?.gst || 0;
        return (
          <div>
            <span className="font-mono font-black text-slate-900 dark:text-white text-xs block">
              ₹{total.toLocaleString("en-IN")}
            </span>
            {gst > 0 && (
              <span className="text-[10px] text-slate-400 font-medium">
                (incl. GST ₹{gst.toLocaleString("en-IN")})
              </span>
            )}
          </div>
        );
      },
      sortable: true,
    },
    {
      key: "status",
      header: "Payment Status",
      accessor: (row) => {
        const isPaid =
          row.billing?.paymentStatus === "completed" ||
          row.billing?.paymentStatus === "paid" ||
          row.invoiceStatus === "paid";
        return (
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${isPaid
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 border-emerald-200"
                : "bg-amber-50 text-amber-700 dark:bg-amber-950 border-amber-200"
              }`}
          >
            {isPaid ? "Paid" : "Pending"}
          </span>
        );
      },
      sortable: true,
    },
    {
      key: "actions",
      header: "Actions",
      accessor: (row) => (
        <Link
          href={`/billing?search=${encodeURIComponent(row.invoiceNumber || row._id)}`}
          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-extrabold text-[11px] transition-colors inline-flex items-center gap-1 cursor-pointer"
        >
          <span>View Invoice</span>
          <ExternalLink className="w-3 h-3" />
        </Link>
      ),
    },
  ];

  // ─── LOADING SHIMMER STATE ───
  if (loading) {
    return (
      <div className="w-full space-y-6 pb-16 animate-pulse">
        {/* Header Shimmer */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            <div className="space-y-2">
              <div className="h-6 w-60 bg-slate-200 dark:bg-slate-800 rounded-xl" />
              <div className="h-4 w-96 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            </div>
          </div>
        </div>
        {/* KPI Shimmer */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            />
          ))}
        </div>
        {/* Body Shimmer */}
        <div className="h-96 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800" />
      </div>
    );
  }

  // ─── ERROR / NOT FOUND STATE ───
  if (errorMsg || !customer) {
    return (
      <div className="w-full max-w-2xl mx-auto py-16 px-4 text-center space-y-6 animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center justify-center mx-auto shadow-md">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Customer Not Found
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            {errorMsg || "The requested customer profile could not be located in the database."}
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push(fromPath || "/customers")}
            className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <button
            type="button"
            onClick={() => fetchCustomerDetails(true, true)}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-extrabold shadow-lux transition-colors cursor-pointer inline-flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Loading</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-16 animate-in fade-in duration-300">
      {/* ─── CUSTOMER HEADER CARD ─── */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <button
            type="button"
            onClick={() => {
              if (fromPath) {
                router.push(fromPath);
              } else {
                router.push("/customers");
              }
            }}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-brand-600 transition-colors bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-brand-600" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-extrabold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400 border border-slate-200 dark:border-slate-700">
              {customer.customerCode || `ID: ${customer._id.slice(-6).toUpperCase()}`}
            </span>
            <button
              type="button"
              disabled={isRefreshing}
              onClick={handleManualRefresh}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh Customer Details"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-600 text-white font-black text-2xl flex items-center justify-center shadow-md shrink-0">
              {customer.fullName ? customer.fullName.charAt(0).toUpperCase() : "C"}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {customer.fullName}
                </h1>

                <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                  {customer.customerCategory === "business"
                    ? "Commercial Business"
                    : "Individual Household"}
                </span>

                <button
                  type="button"
                  onClick={handleToggleStatus}
                  disabled={isUpdatingStatus}
                  title={customer.status !== false ? "Click to deactivate customer" : "Click to activate customer"}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-60 ${customer.status !== false
                      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700"
                    }`}
                >
                  {isUpdatingStatus ? (
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  ) : (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        customer.status !== false ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                      }`}
                    />
                  )}
                  <span>{customer.status !== false ? "Active Account" : "Inactive"}</span>
                </button>

                {customer.isPasswordSet && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-purple-600" />
                    <span>App Access Verified</span>
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold flex items-center gap-3 flex-wrap pt-1">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <strong className="font-mono">{customer.mobile}</strong>
                </span>
                {customer.email && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-purple-600" />
                      <span className="font-mono text-[11px]">{customer.email}</span>
                    </span>
                  </>
                )}
                {primaryAddress && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-brand-600" />
                      <span>
                        {getLocalityLabel(primaryAddress.localityId, primaryAddress.pincode)}
                      </span>
                    </span>
                  </>
                )}
                {customer.createdAt && (
                  <>
                    <span>•</span>
                    <span className="text-slate-400 text-[11px]">
                      Registered{" "}
                      {new Date(customer.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Action Buttons: Strict Rule — ONLY ONE PRIMARY BUTTON ("Edit Profile") */}
          <div className="flex items-center gap-2.5 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-slate-800 flex-wrap">
            <button
              type="button"
              onClick={handleOpenEditProfile}
              className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-lux transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>

            {/* Status Toggle Secondary Button */}
            <button
              type="button"
              onClick={handleToggleStatus}
              disabled={isUpdatingStatus}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shrink-0 disabled:opacity-50 ${
                customer.status !== false
                  ? "bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 dark:bg-slate-800 dark:hover:bg-rose-950/40 dark:text-slate-300 dark:hover:text-rose-300 border border-slate-200 dark:border-slate-700 hover:border-rose-200"
                  : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              }`}
              title={customer.status !== false ? "Deactivate customer account" : "Activate customer account"}
            >
              {isUpdatingStatus ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
              ) : customer.status !== false ? (
                <Ban className="w-4 h-4 text-rose-500" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              )}
              <span>{customer.status !== false ? "Deactivate" : "Activate"}</span>
            </button>

            <a
              href={`tel:${customer.mobile}`}
              className="px-4 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>Call Customer</span>
            </a>

            <button
              type="button"
              onClick={() => setDeleteModalCustomer(true)}
              className="px-4 py-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 cursor-pointer transition-all flex items-center gap-2 shrink-0 font-bold text-xs"
              title="Delete Customer Account"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── KPI / LIFETIME SUMMARY CARDS (STRICTLY FROM API DATA) ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Bookings */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
              Total Bookings
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1 block">
              {summary.totalBookings}
            </span>
            <span className="text-[10px] font-bold text-brand-600 mt-0.5 block">
              {bookings.filter((b) => b.status === "completed").length} Completed
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 border border-purple-200 dark:border-purple-800 flex items-center justify-center shrink-0">
            <Briefcase className="w-6 h-6" />
          </div>
        </div>

        {/* Total Invoices & Spend */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
              Lifetime Spend
            </span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">
              ₹{totalLifetimeSpend.toLocaleString("en-IN")}
            </span>
            <span className="text-[10px] font-bold text-slate-500 mt-0.5 block">
              {summary.totalInvoices} Invoices Generated
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
        </div>

        {/* Saved Addresses */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
              Saved Locations
            </span>
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1 block">
              {summary.totalAddresses}
            </span>
            <span className="text-[10px] font-bold text-amber-600 mt-0.5 block">
              {primaryAddress ? "Primary Address Set" : "No Primary Set"}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 border border-amber-200 dark:border-amber-800 flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6" />
          </div>
        </div>

        {/* Customer Reviews & Rating */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block">
              Customer Reviews
            </span>
            <span className="text-2xl font-black text-amber-500 font-mono mt-1 flex items-center gap-1.5">
              <span>{avgRating ? `${avgRating}` : "—"}</span>
              {avgRating && <Star className="w-5 h-5 fill-amber-400 text-amber-400" />}
            </span>
            <span className="text-[10px] font-bold text-slate-500 mt-0.5 block">
              {summary.totalReviews} Total Feedback
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 border border-amber-200 dark:border-amber-800 flex items-center justify-center shrink-0">
            <Star className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ─── SEGMENTED TAB BAR (ONLY REAL API TABS) ─── */}
      <div className="bg-[#F1F3F9] dark:bg-slate-800/80 p-1.5 rounded-2xl flex items-center gap-1.5 border border-slate-200/80 dark:border-slate-700/80 shadow-xs w-full sm:w-fit overflow-x-auto no-scrollbar max-w-full flex-nowrap">
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 ${activeTab === "profile"
              ? "bg-[#7B1FA2] text-white shadow-sm scale-[1.01]"
              : "text-slate-700 dark:text-slate-300 hover:text-[#7B1FA2] hover:bg-white/60 dark:hover:bg-slate-700/60"
            }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Profile</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("bookings")}
          className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 ${activeTab === "bookings"
              ? "bg-[#7B1FA2] text-white shadow-sm scale-[1.01]"
              : "text-slate-700 dark:text-slate-300 hover:text-[#7B1FA2] hover:bg-white/60 dark:hover:bg-slate-700/60"
            }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Bookings</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === "bookings"
                ? "bg-white/20 text-white"
                : "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300"
              }`}
          >
            {summary.totalBookings}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("invoices")}
          className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 ${activeTab === "invoices"
              ? "bg-[#7B1FA2] text-white shadow-sm scale-[1.01]"
              : "text-slate-700 dark:text-slate-300 hover:text-[#7B1FA2] hover:bg-white/60 dark:hover:bg-slate-700/60"
            }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Invoices</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === "invoices"
                ? "bg-white/20 text-white"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
              }`}
          >
            {summary.totalInvoices}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("addresses")}
          className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 ${activeTab === "addresses"
              ? "bg-[#7B1FA2] text-white shadow-sm scale-[1.01]"
              : "text-slate-700 dark:text-slate-300 hover:text-[#7B1FA2] hover:bg-white/60 dark:hover:bg-slate-700/60"
            }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Manage Address</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === "addresses"
                ? "bg-white/20 text-white"
                : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
              }`}
          >
            {summary.totalAddresses}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("reviews")}
          className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 ${activeTab === "reviews"
              ? "bg-[#7B1FA2] text-white shadow-sm scale-[1.01]"
              : "text-slate-700 dark:text-slate-300 hover:text-[#7B1FA2] hover:bg-white/60 dark:hover:bg-slate-700/60"
            }`}
        >
          <Star className="w-4 h-4" />
          <span>Reviews</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeTab === "reviews"
                ? "bg-white/20 text-white"
                : "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
              }`}
          >
            {summary.totalReviews}
          </span>
        </button>
      </div>

      {/* ─── TAB 1: PROFILE VIEW ─── */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Identity & Contact Specifications */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-brand-600" />
                  <span>Customer Identity & Contact Specifications</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px]">
                    Full Registered Name
                  </span>
                  <p className="font-extrabold text-slate-900 dark:text-white text-sm mt-1">
                    {customer.fullName}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px]">
                    Customer Code
                  </span>
                  <p className="font-mono font-extrabold text-brand-600 text-sm mt-1">
                    {customer.customerCode || "—"}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px]">
                    Primary Contact Mobile
                  </span>
                  <p className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-sm mt-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{customer.mobile}</span>
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px]">
                    Alternate Phone
                  </span>
                  <p className="font-mono font-bold text-slate-700 dark:text-slate-300 text-xs mt-1">
                    {customer.alternatePhone || "—"}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px]">
                    Email Address
                  </span>
                  <p className="font-mono font-bold text-slate-900 dark:text-white text-xs mt-1">
                    {customer.email || "—"}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px]">
                    Customer Category
                  </span>
                  <p className="font-extrabold text-slate-900 dark:text-white text-xs mt-1">
                    {customer.customerCategory === "business"
                      ? "Commercial / Business Customer"
                      : "Individual Household"}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px]">
                    Property Household Type
                  </span>
                  <p className="font-bold text-slate-700 dark:text-slate-300 text-xs mt-1 capitalize">
                    {(customer.propertyHouseholdType || "apartment_flat").replace(/_/g, " ")}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px]">
                    Registration Date
                  </span>
                  <p className="font-semibold text-slate-700 dark:text-slate-300 text-xs mt-1">
                    {customer.createdAt
                      ? new Date(customer.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                      : "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Primary Delivery Address Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-brand-600" />
                  <span>Primary Delivery Location</span>
                </h3>
                {primaryAddress && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Active Primary
                  </span>
                )}
              </div>

              {primaryAddress ? (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-extrabold text-brand-600 dark:text-brand-400 block">
                      {getLocalityLabel(primaryAddress.localityId, primaryAddress.pincode)}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase px-2 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      {primaryAddress.addressLabel || "Home"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
                    {primaryAddress.serviceAddress}
                  </p>

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      Recipient:{" "}
                      <strong>
                        {primaryAddress.recipientName || customer.fullName}
                      </strong>
                      {(primaryAddress.recipientMobile || customer.mobile) && (
                        <span className="font-mono ml-1">
                          ({primaryAddress.recipientMobile || customer.mobile})
                        </span>
                      )}
                    </span>
                    {primaryAddress.landmark && (
                      <span className="italic">Landmark: {primaryAddress.landmark}</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-center space-y-2">
                  <p className="text-xs text-slate-400">No primary address registered yet.</p>
                  <button
                    type="button"
                    onClick={handleOpenAddAddressDrawer}
                    className="px-3 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 text-xs font-bold cursor-pointer transition-colors"
                  >
                    + Add Primary Address
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Account Security & System Metadata */}
          <div className="space-y-6">
            {/* Account Status Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Account Security & Access</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Mobile Authentication
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Password / App Access
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${customer.isPasswordSet
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                        }`}
                    >
                      {customer.isPasswordSet ? "Active & Verified" : "Pending First Login"}
                    </span>
                  </div>
                  {customer.passwordSetAt && (
                    <span className="text-[10px] text-slate-400 block pt-0.5">
                      Set on:{" "}
                      {new Date(customer.passwordSetAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  )}
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">
                        Account Status
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                        Platform Standing
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleStatus}
                      disabled={isUpdatingStatus}
                      className={`px-3 py-1 rounded-xl text-[11px] font-black border transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60 ${
                        customer.status !== false
                          ? "bg-emerald-50 hover:bg-rose-50 text-emerald-800 hover:text-rose-700 border-emerald-200 hover:border-rose-200 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-300"
                          : "bg-rose-50 hover:bg-emerald-50 text-rose-800 hover:text-emerald-700 border-rose-200 hover:border-emerald-200 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-300"
                      }`}
                      title={customer.status !== false ? "Click to deactivate" : "Click to activate"}
                    >
                      {isUpdatingStatus ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : customer.status !== false ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Ban className="w-3 h-3 text-rose-600" />
                      )}
                      <span>{customer.status !== false ? "Active (Click to Deactivate)" : "Inactive (Click to Activate)"}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {customer.status !== false
                      ? "Account is active. The customer can place service bookings and log in."
                      : "Account is inactive/suspended. The customer is restricted from booking or logging in."}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Database Object ID
                  </span>
                  <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400 break-all select-all">
                    {customer._id}
                  </span>
                </div>
              </div>
            </div>

            {/* Financial Ledger Summary Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <span>Financial Ledger Summary</span>
              </h3>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <span className="text-[10px] uppercase font-extrabold text-emerald-800 dark:text-emerald-300 tracking-wider block">
                    Total Invoiced Spending
                  </span>
                  <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono mt-0.5 block">
                    ₹{totalLifetimeSpend.toLocaleString("en-IN")}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 block mt-0.5">
                    {summary.totalInvoices} Invoices Recorded
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
                  <span className="text-[10px] uppercase font-extrabold text-purple-800 dark:text-purple-300 tracking-wider block">
                    Completed Service Orders
                  </span>
                  <span className="text-2xl font-black text-purple-700 dark:text-purple-400 font-mono mt-0.5 block">
                    {bookings.filter((b) => b.status === "completed").length} Orders
                  </span>
                  <span className="text-[10px] font-bold text-purple-600 block mt-0.5">
                    {summary.totalBookings} Total Bookings Placed
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: BOOKINGS VIEW (LIVE API DATA) ─── */}
      {activeTab === "bookings" && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-purple-600" />
                <span>Customer Bookings & Service History</span>
              </h3>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                Official booking records from the database for {customer.fullName}
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              {summary.totalBookings} Total
            </span>
          </div>

          <DataTable
            columns={bookingColumns}
            data={bookings}
            searchPlaceholder="Search customer bookings by ID, service, technician..."
            statusField="status"
          />
        </div>
      )}

      {/* ─── TAB 3: INVOICES VIEW (LIVE API DATA) ─── */}
      {activeTab === "invoices" && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                <span>Customer Tax Invoices & B2C/B2B Ledgers</span>
              </h3>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                Generated tax invoices and payment records for {customer.fullName}
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              {summary.totalInvoices} Invoices
            </span>
          </div>

          <DataTable
            columns={invoiceColumns}
            data={invoices}
            searchPlaceholder="Search tax invoices by ID, booking number, service..."
            statusField="invoiceStatus"
          />
        </div>
      )}

      {/* ─── TAB 4: MANAGE ADDRESS VIEW (LIVE API DATA) ─── */}
      {activeTab === "addresses" && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-600" />
                <span>Customer Address Book & Delivery Locations</span>
              </h3>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                Saved delivery locations registered for {customer.fullName} in Varanasi
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAddAddressDrawer}
              className="px-4 py-2.5 rounded-xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/40 dark:hover:bg-brand-900/40 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Delivery Address</span>
            </button>
          </div>

          {addresses.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <MapPin className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                No Delivery Addresses Saved Yet
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Add an address to enable one-click scheduling and technician assignments.
              </p>
              <button
                type="button"
                onClick={handleOpenAddAddressDrawer}
                className="px-4 py-2 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Address</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div
                  key={addr._id}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3 relative group hover:border-brand-300 transition-all shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                        {addr.addressLabel || "Address"}
                      </span>
                      {addr.isPrimary && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
                          Primary Address
                        </span>
                      )}
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 capitalize">
                      {(addr.relationshipType || "self").replace(/_/g, " ")}
                    </span>
                  </div>

                  <div className="text-xs space-y-1">
                    {(addr.recipientName || addr.recipientMobile) && (
                      <p className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-brand-500" />
                        <span>
                          Recipient:{" "}
                          <strong>{addr.recipientName || customer.fullName}</strong>
                          {addr.recipientMobile && ` (${addr.recipientMobile})`}
                        </span>
                      </p>
                    )}
                    <p className="text-slate-600 dark:text-slate-400 font-semibold flex items-start gap-1.5 pt-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span>
                        {addr.serviceAddress},{" "}
                        {getLocalityLabel(addr.localityId, addr.pincode)}
                      </span>
                    </p>
                    {addr.landmark && (
                      <p className="text-[11px] text-slate-400 italic pl-5">
                        Landmark: {addr.landmark}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditAddressDrawer(addr)}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteModalAddress(addr)}
                      className="p-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all cursor-pointer border border-rose-200 dark:border-rose-900"
                      title="Delete Address"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 5: REVIEWS & RATINGS VIEW (LIVE API DATA) ─── */}
      {activeTab === "reviews" && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                <span>Customer Feedback & Ratings</span>
              </h3>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                Reviews submitted by {customer.fullName} for completed services
              </p>
            </div>
            {avgRating && (
              <span className="text-sm font-black text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200 flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>{avgRating} / 5.0 Average</span>
              </span>
            )}
          </div>

          {reviews.length === 0 ? (
            <div className="text-center py-12 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 space-y-2">
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No reviews recorded for this customer
              </p>
              <p className="text-xs text-slate-400">
                Feedback will appear here once the customer rates completed bookings.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((rev) => (
                <div
                  key={rev._id}
                  className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${s <= rev.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-slate-300 dark:text-slate-700"
                            }`}
                        />
                      ))}
                      <span className="font-bold text-xs text-slate-700 dark:text-slate-300 ml-1.5">
                        {rev.rating}.0
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${rev.isPublished
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-600"
                        }`}
                    >
                      {rev.isPublished ? "Published" : rev.status || "Pending"}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
                      {rev.packageId?.packageName || "Service Review"}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 italic">
                      &ldquo;{rev.review}&rdquo;
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-[10px] text-slate-400 flex items-center justify-between">
                    <span>
                      {rev.createdAt
                        ? new Date(rev.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                        : "—"}
                    </span>
                    {rev.bookingId && (
                      <span className="font-mono">Booking Ref: #{rev.bookingId.slice(-6)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── SLIDE-OVER PROFILE EDIT DRAWER ─── */}
      {isEditProfileDrawerOpen && (
        <Portal>
          <div className="fixed inset-0 z-[99999] flex justify-end bg-slate-950/60 backdrop-blur-xs transition-opacity">
            <div className="w-full max-w-xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-brand-600 via-brand-700 to-purple-800 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-white/10 text-white backdrop-blur-md border border-white/20 shadow-xs">
                    <Edit2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-lg tracking-tight">
                      Edit Customer Profile
                    </h3>
                    <p className="text-xs text-brand-100 font-medium">
                      Update specifications for {customer.fullName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditProfileDrawerOpen(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors backdrop-blur-md"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {profileError && (
                <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{profileError}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full h-[42px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:border-brand-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Primary Mobile *
                    </label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className="w-full h-[42px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold outline-none focus:border-brand-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Alternate Phone
                    </label>
                    <input
                      type="tel"
                      value={editAlternatePhone}
                      onChange={(e) => setEditAlternatePhone(e.target.value)}
                      className="w-full h-[42px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold outline-none focus:border-brand-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full h-[42px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:border-brand-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Customer Category
                    </label>
                    <select
                      value={editCustomerCategory}
                      onChange={(e) => setEditCustomerCategory(e.target.value)}
                      className="w-full h-[42px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:border-brand-500"
                    >
                      <option value="individual_household">Individual Household</option>
                      <option value="business">Commercial Business</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Property Household Type
                    </label>
                    <select
                      value={editPropertyType}
                      onChange={(e) => setEditPropertyType(e.target.value)}
                      className="w-full h-[42px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:border-brand-500"
                    >
                      <option value="apartment_flat">Apartment / Flat</option>
                      <option value="independent_house">Independent House</option>
                      <option value="villa">Villa</option>
                      <option value="office_shop">Office / Commercial Shop</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Primary Address Section */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <span className="font-black text-slate-900 dark:text-white text-xs block">
                    Primary Service Address
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <CustomSelect
                      label="Varanasi Locality *"
                      value={editLocalityId}
                      onChange={(val) => {
                        setEditLocalityId(val);
                        const found = localities.find((l) => l._id === val);
                        if (found) setEditPincode(found.pincode);
                      }}
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
                        value={editPincode}
                        onChange={(e) => setEditPincode(e.target.value)}
                        className="w-full h-[42px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Street Address *
                    </label>
                    <textarea
                      rows={2}
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:border-brand-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Landmark
                    </label>
                    <input
                      type="text"
                      value={editLandmark}
                      onChange={(e) => setEditLandmark(e.target.value)}
                      placeholder="e.g. Near Railway Station"
                      className="w-full h-[40px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex gap-3 sticky bottom-0 bg-white dark:bg-slate-900 py-3">
                  <button
                    type="button"
                    onClick={() => setIsEditProfileDrawerOpen(false)}
                    className="px-5 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl font-extrabold shadow-lux cursor-pointer transition-colors flex items-center justify-center gap-2"
                  >
                    {profileSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Save Profile Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* ─── SLIDE-OVER ADDRESS FORM DRAWER ─── */}
      {isAddressDrawerOpen && (
        <Portal>
          <div className="fixed inset-0 z-[99999] flex justify-end bg-slate-950/60 backdrop-blur-xs transition-opacity">
            <div className="w-full max-w-xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-brand-600 via-brand-700 to-amber-600 text-white flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-white/10 text-white backdrop-blur-md border border-white/20 shadow-xs">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-lg tracking-tight">
                      {editingAddr ? "Edit Delivery Address" : "Add New Delivery Address"}
                    </h3>
                    <p className="text-xs text-brand-100 font-medium">
                      {editingAddr
                        ? "Update address & recipient specifications"
                        : `Register new address for ${customer.fullName}`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddressDrawerOpen(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors backdrop-blur-md"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {addressError && (
                <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{addressError}</span>
                </div>
              )}

              <form onSubmit={handleSaveAddressForm} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
                {/* SECTION 1: LABEL & RECIPIENT */}
                <div className="p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 space-y-4">
                  <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-extrabold text-sm border-b border-amber-200 dark:border-amber-800 pb-2">
                    <User className="w-4 h-4 text-amber-600" />
                    <span>1. Address Label & Recipient</span>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Address Title Label *
                    </label>
                    <input
                      type="text"
                      value={addrFormLabel}
                      onChange={(e) => setAddrFormLabel(e.target.value)}
                      placeholder="e.g. Home (Primary Residence), Office HQ, Parents Flat"
                      className="w-full h-[42px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:border-amber-500 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Relationship Type
                    </label>
                    <select
                      value={addrFormType}
                      onChange={(e) => setAddrFormType(e.target.value)}
                      className="w-full h-[42px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none"
                    >
                      <option value="self">Self</option>
                      <option value="family_member">Family Member</option>
                      <option value="friend_neighbor">Friend / Neighbor</option>
                      <option value="office_work">Office / Work</option>
                      <option value="other_person">Other Person</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Recipient Name
                      </label>
                      <input
                        type="text"
                        value={addrFormRecipientName}
                        onChange={(e) => setAddrFormRecipientName(e.target.value)}
                        placeholder="e.g. Rajesh Sharma"
                        className="w-full h-[40px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                        Recipient Mobile
                      </label>
                      <input
                        type="tel"
                        value={addrFormRecipientPhone}
                        onChange={(e) => setAddrFormRecipientPhone(e.target.value)}
                        placeholder="10-digit mobile"
                        className="w-full h-[40px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-semibold outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 2: LOCALITY & STREET */}
                <div className="p-5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 space-y-4">
                  <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-extrabold text-sm border-b border-emerald-200 dark:border-emerald-800 pb-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    <span>2. Varanasi Locality & Street Address</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <CustomSelect
                      label="Varanasi Zone / Locality *"
                      value={addrFormLocalityId}
                      onChange={(val) => {
                        setAddrFormLocalityId(val);
                        const found = localities.find((l) => l._id === val);
                        if (found) setAddrFormPincode(found.pincode);
                      }}
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
                        value={addrFormPincode}
                        onChange={(e) => setAddrFormPincode(e.target.value)}
                        className="w-full h-[42px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Full House No., Building & Street Address *
                    </label>
                    <textarea
                      rows={3}
                      value={addrFormAddress}
                      onChange={(e) => setAddrFormAddress(e.target.value)}
                      placeholder="House No., Building Name, Road, Varanasi"
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Landmark (Optional)
                    </label>
                    <input
                      type="text"
                      value={addrFormLandmark}
                      onChange={(e) => setAddrFormLandmark(e.target.value)}
                      placeholder="e.g. Opposite Durga Temple"
                      className="w-full h-[40px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="addrIsPrimary"
                      checked={addrFormIsPrimary}
                      onChange={(e) => setAddrFormIsPrimary(e.target.checked)}
                      className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                    />
                    <label
                      htmlFor="addrIsPrimary"
                      className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer"
                    >
                      Set as Primary Delivery Address
                    </label>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex gap-3 sticky bottom-0 bg-white dark:bg-slate-900 py-3">
                  <button
                    type="button"
                    onClick={() => setIsAddressDrawerOpen(false)}
                    className="px-5 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addressSaving}
                    className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl font-extrabold shadow-lux cursor-pointer transition-colors flex items-center justify-center gap-2 text-xs"
                  >
                    {addressSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving Address...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{editingAddr ? "Save Address Changes" : "Save Delivery Address"}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {/* ─── DELETE ADDRESS CONFIRMATION MODAL ─── */}
      {deleteModalAddress && (
        <Portal>
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Delete Delivery Address?
                </h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to remove &ldquo;{deleteModalAddress.addressLabel}&rdquo; from{" "}
                  {customer.fullName}&apos;s address book?
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalAddress(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeletingAddress}
                  onClick={handleConfirmDeleteAddress}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-extrabold shadow-md cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                >
                  {isDeletingAddress ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Confirm Delete</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* ─── DELETE CUSTOMER CONFIRMATION MODAL ─── */}
      {deleteModalCustomer && (
        <Portal>
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Permanently Delete Customer?
                </h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to delete <strong>{customer.fullName}</strong> (
                  {customer.customerCode || customer.mobile})? This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalCustomer(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeletingCustomer}
                  onClick={handleConfirmDeleteCustomer}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-extrabold shadow-md cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                >
                  {isDeletingCustomer ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting Account...</span>
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
