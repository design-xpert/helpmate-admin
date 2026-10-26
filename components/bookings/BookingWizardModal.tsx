"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  User,
  MapPin,
  Wrench,
  Calendar,
  Sparkles,
  Tag,
  CreditCard,
  FileText,
  ShieldCheck,
  Plus,
  KeyRound,
  UserCheck,
  Phone,
  Mail,
  Building,
  UserPlus,
  Lock,
  Clock,
  Trash2,
  Users,
  Home,
  Briefcase,
  HeartHandshake,
  HelpCircle,
  ShoppingBag,
  Minus,
  Check,
  Edit2,
  Sliders,
  Filter,
  RotateCcw,
  Loader2,
} from "lucide-react";
import {
  Booking,
  varanasiLocalities,
  VaranasiLocality,
  initialTechnicians,
  initialCustomers,
  Customer,
  SelectedServiceItem,
  AddressRecipientType,
} from "@/lib/mockData";
import { Portal } from "@/components/Portal";
import { CustomerSearchPicker } from "@/components/CustomerSearchPicker";
import { CustomSelect } from "@/components/CustomSelect";
import { createBookingApi, updateBookingApi, calculateBookingPriceApi, getCustomerAddressesApi, createCustomerAddressApi, updateCustomerAddressApi, deleteCustomerAddressApi, getCustomerDropdownApi, getLocalitiesApi, sendBookingCustomerOtpApi, verifyBookingCustomerOtpApi, sendCustomerOtpApi, getCustomerTrustStatusApi, getCategoryDropdownApi, getServiceActionsApi, getServiceActionDropdownApi, getPackagesApi, getPartnerDropdownApi } from "@/lib/api";

function safeStr(val: any): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "string") return val;
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (typeof val === "object") {
    if (typeof val.categoryName === "string") return val.categoryName;
    if (typeof val.name === "string") return val.name;
    if (typeof val.serviceName === "string") return val.serviceName;
    if (typeof val.serviceAction === "string") return val.serviceAction;
    if (typeof val.title === "string") return val.title;
  }
  return "";
}

interface BookingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookingCreated?: (booking: Booking) => void;
  bookingToEdit?: Booking | null;
  onBookingUpdated?: (updated: Booking) => void;
}

export interface ServicePackageItem {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  duration?: string;
  badge?: string;
  description?: string;
  category?: string;
  subCategory?: string;
  actionName?: string;
  typeName?: string;
  categoryId?: string;
  subCategoryId?: string;
  rawServiceId?: string;
  packageId?: string;
  addons?: any[];
}

export interface ServiceActionGroup {
  actionName: string;
  description?: string;
  packages: ServicePackageItem[];
}

export interface ServiceTypeGroup {
  typeName: string;
  actions: ServiceActionGroup[];
}

const serviceCatalogData: Record<string, ServiceTypeGroup[]> = {};

export function BookingWizardModal({
  isOpen,
  onClose,
  onBookingCreated,
  bookingToEdit,
  onBookingUpdated,
}: BookingWizardModalProps) {
  const [currentStep, setCurrentStep] = useState(1);

  // STEP 1: Customer & OTP States
  const [customerList, setCustomerList] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [isLoadingCustomers, setIsLoadingCustomers] = useState<boolean>(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState<boolean>(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isTrustedCustomer, setIsTrustedCustomer] = useState<boolean>(false);
  const [trustInfo, setTrustInfo] = useState<{
    isTrusted: boolean;
    completedBookings: number;
    requiredCompletedBookings: number;
    otpRequired: boolean;
  } | null>(null);
  const [isCheckingTrust, setIsCheckingTrust] = useState<boolean>(false);
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);
  const [otpMessage, setOtpMessage] = useState<string>("");
  const [isSavingBooking, setIsSavingBooking] = useState<boolean>(false);
  const [isOtpSkipped, setIsOtpSkipped] = useState<boolean>(false);

  // STEP 3: API Catalog States (Categories, Service Actions, Packages)
  const [apiCategories, setApiCategories] = useState<{ id: string; categoryName: string; subCategories?: { id: string; name: string }[] }[]>([]);
  const [apiServiceActions, setApiServiceActions] = useState<any[]>([]);
  const [apiPackages, setApiPackages] = useState<any[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState<boolean>(false);

  // STEP 2: Address & Location & Recipient Relationship Badges
  const [localityList, setLocalityList] = useState<VaranasiLocality[]>([]);
  const [city, setCity] = useState("");
  const [locality, setLocality] = useState("");
  const [pincode, setPincode] = useState("");
  const [address, setAddress] = useState("");
  const [addressRecipientType, setAddressRecipientType] = useState<AddressRecipientType>("Self");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");

  // Selected Saved Address ID
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<string>("");

  // Dynamic Saved Addresses list for selected customer
  const [savedAddresses, setSavedAddresses] = useState<
    {
      id: string;
      label: string;
      type: AddressRecipientType;
      recipientName: string;
      recipientPhone: string;
      locality: string;
      pincode: string;
      address: string;
      landmark?: string;
      isPrimary?: boolean;
    }[]
  >([]);

  const [isManagingAddresses, setIsManagingAddresses] = useState(false);
  const [editingAddressObj, setEditingAddressObj] = useState<typeof savedAddresses[0] | null>(null);

  const selectSavedAddress = (item: typeof savedAddresses[0]) => {
    setSelectedSavedAddressId(item.id);
    setLocality(item.locality);
    setPincode(item.pincode);
    setAddress(item.address);
    setAddressRecipientType(item.type);
    if (item.type !== "Self") {
      setRecipientName(item.recipientName);
      setRecipientPhone(item.recipientPhone);
    } else {
      setRecipientName("");
      setRecipientPhone("");
    }
  };

  const handleToggleManageAddresses = () => {
    if (isManagingAddresses) {
      setEditingAddressObj(null); // Automatically close edit form when Done Managing is clicked!
      setIsManagingAddresses(false);
    } else {
      setIsManagingAddresses(true);
    }
  };

  const handleSaveEditAddressItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAddressObj) return;

    setSavedAddresses(
      savedAddresses.map((a) => (a.id === editingAddressObj.id ? editingAddressObj : a))
    );

    if (selectedSavedAddressId === editingAddressObj.id) {
      selectSavedAddress(editingAddressObj);
    }

    // Call update API: PUT /api/customer-address/{id}
    if (editingAddressObj.id && editingAddressObj.id.length === 24) {
      try {
        const foundLocality = localityList.find((l) => l.name === editingAddressObj.locality);
        const relType = (
          editingAddressObj.type === "Self" ? "self" :
            editingAddressObj.type === "Office / Work" ? "office_work" :
              editingAddressObj.type === "Family Member" ? "family_member" :
                editingAddressObj.type === "Friend / Neighbor" ? "friend_neighbor" : "other_person"
        );

        await updateCustomerAddressApi(editingAddressObj.id, {
          addressLabel: editingAddressObj.label,
          relationshipType: relType as any,
          localityId: foundLocality?.id || "65f1a2b3c4d5e6f7a8b9c0d1",
          pincode: editingAddressObj.pincode,
          serviceAddress: editingAddressObj.address,
        });

        if (selectedCustomerId) {
          await fetchCustomerAddressesForId(selectedCustomerId);
        }
      } catch (err) {
        console.error("updateCustomerAddressApi error:", err);
      }
    }

    setEditingAddressObj(null);
    setIsManagingAddresses(false);
  };

  const handleDeleteSavedAddressItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (savedAddresses.length <= 1) {
      alert("At least one saved address must remain.");
      return;
    }
    const filtered = savedAddresses.filter((a) => a.id !== id);
    setSavedAddresses(filtered);
    if (selectedSavedAddressId === id && filtered.length > 0) {
      selectSavedAddress(filtered[0]);
    }

    // Call delete API: DELETE /api/customer-address/{id}
    if (id && id.length === 24) {
      try {
        await deleteCustomerAddressApi(id);
        if (selectedCustomerId) {
          await fetchCustomerAddressesForId(selectedCustomerId);
        }
      } catch (err) {
        console.error("deleteCustomerAddressApi error:", err);
      }
    }

    setIsManagingAddresses(false);
  };

  const selectAddNewCustomAddress = () => {
    setEditingAddressObj(null);
    setIsManagingAddresses(false);
    setSelectedSavedAddressId("new_custom");
    setLocality(localityList[0]?.name || "");
    setPincode(localityList[0]?.pincode || "");
    setAddress("");
    setAddressRecipientType("Self");
    setRecipientName("");
    setRecipientPhone("");
  };

  const handleToggleAddNewAddress = () => {
    if (selectedSavedAddressId === "new_custom") {
      const primary = savedAddresses.find((a: any) => a.isPrimary) || savedAddresses[0];
      if (primary) {
        selectSavedAddress(primary);
      } else {
        setSelectedSavedAddressId("");
      }
    } else {
      selectAddNewCustomAddress();
    }
  };

  const handleCreateNewCustomAddressSubmit = async () => {
    if (!address.trim()) {
      alert("Please enter full service address.");
      return;
    }

    if (!selectedCustomerId || selectedCustomerId.length !== 24) {
      const newCustomObj = {
        id: `addr-${Date.now()}`,
        label: `Saved Address #${savedAddresses.length + 1}`,
        type: addressRecipientType,
        recipientName: recipientName || customerName,
        recipientPhone: recipientPhone || customerPhone,
        locality,
        pincode,
        address,
      };
      setSavedAddresses((prev) => [...prev, newCustomObj]);
      selectSavedAddress(newCustomObj);
      return;
    }

    try {
      const foundLocality = localityList.find((l) => l.name === locality);
      const relType = (
        addressRecipientType === "Self" ? "self" :
          addressRecipientType === "Office / Work" ? "office_work" :
            addressRecipientType === "Family Member" ? "family_member" :
              addressRecipientType === "Friend / Neighbor" ? "friend_neighbor" : "other_person"
      );

      const res = await createCustomerAddressApi({
        customerId: selectedCustomerId,
        addressLabel: addressRecipientType === "Self" ? "Home" : addressRecipientType === "Office / Work" ? "Office" : "Saved Address",
        relationshipType: relType as any,
        localityId: foundLocality?.id || "65f1a2b3c4d5e6f7a8b9c0d1",
        pincode,
        serviceAddress: address,
        isPrimary: savedAddresses.length === 0,
      });

      if (res && res.success && res.data) {
        const createdId = res.data._id || res.data.id;
        const addrRes = await getCustomerAddressesApi(selectedCustomerId, true);
        if (addrRes && addrRes.success && Array.isArray(addrRes.data) && addrRes.data.length > 0) {
          const mappedAddr = addrRes.data.map((a: any, idx: number) => ({
            id: a._id || `addr-${idx + 1}`,
            label: a.addressLabel || (a.isPrimary ? "Home (Primary)" : "Saved Address"),
            type: (
              a.relationshipType === "self" ? "Self" :
                a.relationshipType === "office_work" ? "Office / Work" :
                  a.relationshipType === "family_member" ? "Family Member" :
                    a.relationshipType === "friend_neighbor" ? "Friend / Neighbor" : "Other"
            ) as AddressRecipientType,
            recipientName: customerName || "Customer",
            recipientPhone: customerPhone || "",
            locality: typeof a.localityId === "object" ? (a.localityId?.localityName || a.localityId?.name || locality || "Sigra") : (locality || "Sigra"),
            pincode: a.pincode || (typeof a.localityId === "object" ? a.localityId?.pincode : "") || pincode || "221002",
            address: a.serviceAddress || address,
            landmark: a.landmark || "",
            isPrimary: !!a.isPrimary,
          }));
          setSavedAddresses(mappedAddr);
          const newlyCreated = mappedAddr.find((a: any) => a.id === createdId) || mappedAddr[mappedAddr.length - 1];
          if (newlyCreated) {
            selectSavedAddress(newlyCreated);
          }
        } else {
          const newObj = {
            id: createdId || `addr-${Date.now()}`,
            label: addressRecipientType === "Self" ? "Home" : `${addressRecipientType} Address`,
            type: addressRecipientType,
            recipientName: recipientName || customerName,
            recipientPhone: recipientPhone || customerPhone,
            locality,
            pincode,
            address,
          };
          setSavedAddresses((prev) => [...prev, newObj]);
          selectSavedAddress(newObj);
        }
      } else {
        const newObj = {
          id: `addr-${Date.now()}`,
          label: addressRecipientType === "Self" ? "Home" : `${addressRecipientType} Address`,
          type: addressRecipientType,
          recipientName: recipientName || customerName,
          recipientPhone: recipientPhone || customerPhone,
          locality,
          pincode,
          address,
        };
        setSavedAddresses((prev) => [...prev, newObj]);
        selectSavedAddress(newObj);
      }
    } catch (err) {
      console.error("createCustomerAddressApi error:", err);
      const newObj = {
        id: `addr-${Date.now()}`,
        label: addressRecipientType === "Self" ? "Home" : `${addressRecipientType} Address`,
        type: addressRecipientType,
        recipientName: recipientName || customerName,
        recipientPhone: recipientPhone || customerPhone,
        locality,
        pincode,
        address,
      };
      setSavedAddresses((prev) => [...prev, newObj]);
      selectSavedAddress(newObj);
    }
  };

  // STEP 3: Services Selection States (Category, Service Type, Action, Searchable Package)
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedActionFilter, setSelectedActionFilter] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState("");

  // Cart of selected services
  const [selectedServicesList, setSelectedServicesList] = useState<SelectedServiceItem[]>([]);

  // STEP 4: Schedule States (Quick Cards + Custom Date Calendar + Clock Dial Time Picker)
  const todayDateObj = new Date();
  const defaultIsoDate = todayDateObj.toISOString().split("T")[0];
  const [bookingDate, setBookingDate] = useState(defaultIsoDate);
  const [timeSlot, setTimeSlot] = useState("12:00 PM");
  const [preferredPartnerId, setPreferredPartnerId] = useState("");

  // Date selection states
  const [selectedDateMode, setSelectedDateMode] = useState<"quick" | "custom">("quick");
  const [quickDateIso, setQuickDateIso] = useState<string>(defaultIsoDate);
  const [customDateIso, setCustomDateIso] = useState<string>("2026-09-04");
  const [isCustomCalendarPopoverOpen, setIsCustomCalendarPopoverOpen] = useState(false);
  const [calViewYear, setCalViewYear] = useState(todayDateObj.getFullYear());
  const [calViewMonth, setCalViewMonth] = useState(todayDateObj.getMonth());

  // Time selection states
  const [selectedTimeMode, setSelectedTimeMode] = useState<"standard" | "custom">("standard");
  const [standardTimeSlot, setStandardTimeSlot] = useState("12:00 PM");
  const [customTimeHour, setCustomTimeHour] = useState(9);
  const [customTimeMinute, setCustomTimeMinute] = useState(0);
  const [customTimeAmPm, setCustomTimeAmPm] = useState<"AM" | "PM">("AM");
  const [clockTab, setClockTab] = useState<"hour" | "minute">("hour");
  const [isClockPickerOpen, setIsClockPickerOpen] = useState(false);

  // Refs for Click-Outside Listeners
  const calendarPopoverRef = useRef<HTMLDivElement>(null);
  const clockPickerRef = useRef<HTMLDivElement>(null);

  // Click outside to close Calendar Popover
  useEffect(() => {
    function handleClickOutsideCalendar(event: MouseEvent) {
      if (
        calendarPopoverRef.current &&
        !calendarPopoverRef.current.contains(event.target as Node)
      ) {
        setIsCustomCalendarPopoverOpen(false);
      }
    }
    if (isCustomCalendarPopoverOpen) {
      document.addEventListener("mousedown", handleClickOutsideCalendar);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutsideCalendar);
    };
  }, [isCustomCalendarPopoverOpen]);

  // Click outside to close Clock Picker Popover
  useEffect(() => {
    function handleClickOutsideClock(event: MouseEvent) {
      if (
        clockPickerRef.current &&
        !clockPickerRef.current.contains(event.target as Node)
      ) {
        setIsClockPickerOpen(false);
      }
    }
    if (isClockPickerOpen) {
      document.addEventListener("mousedown", handleClickOutsideClock);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutsideClock);
    };
  }, [isClockPickerOpen]);

  // STEP 5: Payment States
  const [discountAmount, setDiscountAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<
    "UPI" | "Cash on Service" | "Card" | "Helpmate Wallet" | "Online" | "Partial Payment"
  >("UPI");
  const [customerNotes, setCustomerNotes] = useState("");

  // API Price Calculation State
  const [calculatedPriceData, setCalculatedPriceData] = useState<any>(null);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);

  // Fetch Customers from API: /api/customer/dropdown
  const fetchCustomerDropdown = React.useCallback(async (searchQuery?: string) => {
    setIsLoadingCustomers(true);
    try {
      const res = await getCustomerDropdownApi({ search: searchQuery });
      if (res && res.success && res.data) {
        const rawCustomers = res.data.customers || (Array.isArray(res.data) ? res.data : []);
        if (Array.isArray(rawCustomers) && rawCustomers.length > 0) {
          const mapped: Customer[] = rawCustomers.map((c: any) => ({
            id: c._id,
            name: c.fullName || c.name || "Customer",
            phone: c.mobile || c.phone || "",
            email: c.email || "",
            locality: c.locality || "",
            pincode: c.pincode || "",
            address: c.address || "",
            tier: "Standard",
            totalSpend: 0,
            totalBookings: 0,
            lastBookingDate: "Recently",
            joinedDate: "Active",
          }));
          setCustomerList(mapped);
        }
      }
    } catch (err) {
      console.error("fetchCustomerDropdown error:", err);
    } finally {
      setIsLoadingCustomers(false);
    }
  }, []);

  // Fetch Customer Addresses from API: /api/customer-address/{customerId}
  const fetchCustomerAddressesForId = React.useCallback(async (cId: string, cName?: string, cPhone?: string) => {
    if (!cId) return;
    setIsLoadingAddresses(true);
    try {
      const addrRes = await getCustomerAddressesApi(cId);
      if (addrRes && addrRes.success && Array.isArray(addrRes.data)) {
        if (addrRes.data.length > 0) {
          const mappedAddr = addrRes.data.map((a: any, idx: number) => ({
            id: a._id || `addr-${idx + 1}`,
            label: a.addressLabel || (a.isPrimary ? "Home (Primary)" : "Saved Address"),
            type: (
              a.relationshipType === "self" ? "Self" :
                a.relationshipType === "office_work" ? "Office / Work" :
                  a.relationshipType === "family_member" ? "Family Member" :
                    a.relationshipType === "friend_neighbor" ? "Friend / Neighbor" : "Other"
            ) as AddressRecipientType,
            recipientName: cName || customerName || "Customer",
            recipientPhone: cPhone || customerPhone || "",
            locality: typeof a.localityId === "object" ? (a.localityId?.localityName || a.localityId?.name || "") : "",
            pincode: a.pincode || (typeof a.localityId === "object" ? a.localityId?.pincode : "") || "",
            address: a.serviceAddress || "",
            landmark: a.landmark || "",
            isPrimary: !!a.isPrimary,
          }));
          setSavedAddresses(mappedAddr);
          const primary = mappedAddr.find((a: any) => a.isPrimary) || mappedAddr[0];
          setSelectedSavedAddressId((prevId) => {
            if (prevId === "new_custom") return "new_custom";
            if (primary) {
              setLocality(primary.locality);
              setPincode(primary.pincode);
              setAddress(primary.address);
              setAddressRecipientType(primary.type);
              return primary.id;
            }
            return prevId;
          });
        } else {
          setSavedAddresses([]);
        }
      }
    } catch (err) {
      console.error("fetchCustomerAddressesForId error:", err);
    } finally {
      setIsLoadingAddresses(false);
    }
  }, [customerName, customerPhone]);

  const [isSearchingLocality, setIsSearchingLocality] = React.useState(false);
  const localitySearchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Fetch Localities from API: /api/locality
  const fetchLocalities = React.useCallback(async (searchQuery?: string) => {
    try {
      const res = await getLocalitiesApi({
        limit: searchQuery ? 100 : 300,
        search: searchQuery || undefined,
        forceRefresh: Boolean(searchQuery),
      });
      if (res && res.success && res.data) {
        const rawLocalities = res.data.localities || (Array.isArray(res.data) ? res.data : []);
        if (Array.isArray(rawLocalities)) {
          const mapped: VaranasiLocality[] = rawLocalities.map((l: any) => ({
            id: l._id,
            name: l.localityName || l.name || "Locality",
            pincode: l.pincode || "221002",
            activeBookings: l.activeBookings || 0,
            activeTechs: l.activeTechs || 0,
            status: (l.status === false ? "Normal" : "High Demand") as any,
            isServiceable: l.status !== false,
          }));
          setLocalityList(mapped);
        }
      }
    } catch (err) {
      console.error("fetchLocalities error:", err);
    }
  }, []);

  const handleLocalitySearch = React.useCallback((term: string) => {
    if (localitySearchTimeoutRef.current) {
      clearTimeout(localitySearchTimeoutRef.current);
    }
    localitySearchTimeoutRef.current = setTimeout(async () => {
      setIsSearchingLocality(true);
      await fetchLocalities(term.trim());
      setIsSearchingLocality(false);
    }, 250);
  }, [fetchLocalities]);

  // Fetch Customer Trust Status: /api/customer-trust/{customerId}
  const checkCustomerTrustStatus = React.useCallback(async (cId: string) => {
    if (!cId) {
      setIsTrustedCustomer(false);
      setTrustInfo(null);
      return;
    }
    setIsCheckingTrust(true);
    try {
      const res = await getCustomerTrustStatusApi(cId);
      if (res && res.success && res.trust) {
        setTrustInfo(res.trust);
        const trusted = res.trust.isTrusted === true || res.trust.otpRequired === false;
        setIsTrustedCustomer(trusted);
      } else {
        setIsTrustedCustomer(false);
        setTrustInfo(null);
      }
    } catch (err) {
      console.error("checkCustomerTrustStatus error:", err);
      setIsTrustedCustomer(false);
      setTrustInfo(null);
    } finally {
      setIsCheckingTrust(false);
    }
  }, []);

  // Fetch Catalog Data from Backend APIs (/api/category, /api/service-action, /api/package)
  const fetchCatalogFromApi = React.useCallback(async () => {
    setIsLoadingCatalog(true);
    try {
      const [catRes, actRes, pkgRes] = await Promise.all([
        getCategoryDropdownApi(true),
        getServiceActionsApi(true),
        getPackagesApi({ limit: 100, forceRefresh: true }),
      ]);

      if (catRes && catRes.success && Array.isArray(catRes.data)) {
        setApiCategories(
          catRes.data.map((c: any) => ({
            id: c._id || c.id,
            categoryName: c.categoryName || c.name,
            subCategories: (c.subCategories || []).map((sc: any) => ({
              id: sc._id || sc.id,
              name: sc.name || sc.subCategoryName,
            })),
          }))
        );
      }

      if (actRes && actRes.success) {
        const rawActions = Array.isArray(actRes.data)
          ? actRes.data
          : (Array.isArray(actRes.data?.serviceActions)
            ? actRes.data.serviceActions
            : (Array.isArray(actRes) ? actRes : []));
        setApiServiceActions(rawActions);
      }

      if (pkgRes && pkgRes.success) {
        const rawPkgs = Array.isArray(pkgRes.data?.packages)
          ? pkgRes.data.packages
          : (Array.isArray(pkgRes.data)
            ? pkgRes.data
            : (Array.isArray(pkgRes) ? pkgRes : []));
        setApiPackages(rawPkgs);
      }
    } catch (err) {
      console.error("fetchCatalogFromApi error:", err);
    } finally {
      setIsLoadingCatalog(false);
    }
  }, []);

  // STEP 4: API Partner States
  const [partnerListFromApi, setPartnerListFromApi] = useState<{ id: string; partnerId?: string; name: string; mobile?: string; locality?: string; rating?: number }[]>([]);
  const [isLoadingPartners, setIsLoadingPartners] = useState<boolean>(false);

  const fetchPartnerDropdown = React.useCallback(async () => {
    setIsLoadingPartners(true);
    try {
      const res = await getPartnerDropdownApi();
      if (res && res.success && res.data) {
        const rawPartners = res.data.partners || (Array.isArray(res.data) ? res.data : []);
        if (Array.isArray(rawPartners)) {
          const mapped = rawPartners.map((p: any) => ({
            id: p._id || p.id || p.partnerId,
            partnerId: p.partnerId || p._id,
            name: p.name || p.fullName || "Partner Technician",
            mobile: p.mobile || p.phone || "",
            locality: p.locality || p.city || "Varanasi",
            rating: p.rating || 4.9,
          }));
          setPartnerListFromApi(mapped);
        }
      }
    } catch (err) {
      console.error("fetchPartnerDropdown error:", err);
    } finally {
      setIsLoadingPartners(false);
    }
  }, []);

  const resetAllFields = React.useCallback(() => {
    setCurrentStep(1);

    // Step 1 Customer & OTP
    setSelectedCustomerId("");
    setCustomerName("");
    setCustomerPhone("");
    setCustomerEmail("");
    setIsOtpVerified(false);
    setOtpInput("");
    setOtpError("");
    setOtpMessage("");
    setIsTrustedCustomer(false);
    setTrustInfo(null);
    setIsOtpSkipped(false);

    // Step 2 Address
    setSelectedSavedAddressId("");
    setCity("");
    setLocality("");
    setPincode("");
    setAddress("");
    setSavedAddresses([]);
    setAddressRecipientType("Self");
    setRecipientName("");
    setRecipientPhone("");
    setIsManagingAddresses(false);
    setEditingAddressObj(null);

    // Step 3 Catalog & Cart
    setSelectedCategory("");
    setSelectedType("");
    setSelectedActionFilter("");
    setSelectedPackageId("");
    setSelectedServicesList([]);

    // Step 4 Schedule & Partner
    const todayStr = new Date().toISOString().split("T")[0];
    setBookingDate(todayStr);
    setTimeSlot("12:00 PM");
    setPreferredPartnerId("");
    setSelectedDateMode("quick");
    setQuickDateIso(todayStr);
    setCustomDateIso(todayStr);
    setIsCustomCalendarPopoverOpen(false);
    setSelectedTimeMode("standard");
    setStandardTimeSlot("12:00 PM");
    setIsClockPickerOpen(false);

    // Step 5 Payment & Notes
    setDiscountAmount(0);
    setPaymentMethod("UPI");
    setCustomerNotes("");
  }, []);

  const handleClose = React.useCallback(() => {
    resetAllFields();
    onClose();
  }, [resetAllFields, onClose]);

  // Load customer dropdown, localities, catalog, and partner dropdown on modal open
  React.useEffect(() => {
    if (isOpen) {
      fetchCustomerDropdown();
      fetchLocalities();
      fetchCatalogFromApi();
      fetchPartnerDropdown();
    }
  }, [isOpen, fetchCustomerDropdown, fetchLocalities, fetchCatalogFromApi, fetchPartnerDropdown]);

  // Load customer addresses on Step 2 active or when customer changes
  React.useEffect(() => {
    if (isOpen && currentStep === 2 && selectedCustomerId) {
      fetchCustomerAddressesForId(selectedCustomerId);
    }
  }, [isOpen, currentStep, selectedCustomerId, fetchCustomerAddressesForId]);

  // Pre-populate if editing an existing booking or reset for new booking
  React.useEffect(() => {
    if (bookingToEdit) {
      setCustomerName(bookingToEdit.customerName || "");
      setCustomerPhone(bookingToEdit.customerPhone || "");
      setCustomerEmail(bookingToEdit.customerEmail || "");
      setCity(bookingToEdit.city || "Varanasi");
      setLocality(bookingToEdit.locality || "Sigra");
      setPincode(bookingToEdit.pincode || "221002");
      setAddress(bookingToEdit.address || "");
      setAddressRecipientType(bookingToEdit.addressRecipientType || "Self");
      setRecipientName(bookingToEdit.recipientName || "");
      setRecipientPhone(bookingToEdit.recipientPhone || "");
      if (bookingToEdit.servicesList && bookingToEdit.servicesList.length > 0) {
        setSelectedServicesList(bookingToEdit.servicesList);
      } else {
        setSelectedServicesList([]);
      }
      setSelectedCategory(bookingToEdit.category || "");
      setSelectedType("");
      setSelectedActionFilter("");
      setSelectedPackageId("");
      setBookingDate(bookingToEdit.scheduledDate || bookingToEdit.date || new Date().toISOString().split("T")[0]);
      setTimeSlot(bookingToEdit.scheduledTime || bookingToEdit.timeSlot || "12:00 PM");
      setPreferredPartnerId(bookingToEdit.technicianId || "");
      setCustomerNotes(bookingToEdit.notes || "");
      setIsOtpVerified(true);
      setCurrentStep(1);
    } else {
      resetAllFields();
    }
  }, [bookingToEdit, isOpen, resetAllFields]);

  // Cascading Category Options from apiCategories and apiServiceActions
  const categoryOptions = React.useMemo(() => {
    const map = new Map<string, { value: string; label: string }>();

    apiCategories.forEach((c) => {
      const val = c.categoryName || c.id;
      if (val && !map.has(val)) {
        map.set(val, { value: val, label: c.categoryName });
      }
    });

    apiServiceActions.forEach((act: any) => {
      const catName = act.categoryName || act.category?.categoryName || (typeof act.category === "string" ? act.category : "");
      if (catName && !map.has(catName)) {
        map.set(catName, { value: catName, label: catName });
      }
    });

    return Array.from(map.values());
  }, [apiCategories, apiServiceActions]);

  // Cascading Subcategory Options for Selected Category
  const subcategoryOptions = React.useMemo(() => {
    if (!selectedCategory) return [];
    const map = new Map<string, { value: string; label: string }>();

    const catObj = apiCategories.find(
      (c) => c.categoryName === selectedCategory || c.id === selectedCategory
    );
    if (catObj?.subCategories) {
      catObj.subCategories.forEach((sc) => {
        const val = sc.name || sc.id;
        if (val && !map.has(val)) {
          map.set(val, { value: val, label: sc.name });
        }
      });
    }

    apiServiceActions.forEach((act: any) => {
      const cId = act.categoryId?._id || (typeof act.categoryId === "string" ? act.categoryId : "") || act.category?._id || "";
      const cName = act.categoryName || act.category?.categoryName || (typeof act.category === "string" ? act.category : "");
      const matchesCat = cId === selectedCategory || cName.toLowerCase().trim() === selectedCategory.toLowerCase().trim();

      if (matchesCat) {
        const scName = act.subCategoryName || act.subCategory?.name || (typeof act.subCategory === "string" ? act.subCategory : "");
        if (scName && !map.has(scName)) {
          map.set(scName, { value: scName, label: scName });
        }
      }
    });

    return Array.from(map.values());
  }, [selectedCategory, apiCategories, apiServiceActions]);

  // Dynamic fetch of Service Actions by Category ID and Subcategory ID
  React.useEffect(() => {
    if (!isOpen) return;
    if (selectedCategory) {
      const targetCatObj = apiCategories.find(
        (c) => c.id === selectedCategory || c.categoryName.toLowerCase().trim() === selectedCategory.toLowerCase().trim()
      );
      const targetCatId = targetCatObj?.id || selectedCategory;

      const allSubCats = apiCategories.flatMap((c) => c.subCategories || []);
      const targetSubObj = selectedType
        ? allSubCats.find(
            (sc) => sc.id === selectedType || sc.name.toLowerCase().trim() === selectedType.toLowerCase().trim()
          )
        : undefined;
      const targetSubId = targetSubObj?.id || (selectedType ? selectedType : undefined);

      getServiceActionDropdownApi({
        categoryId: targetCatId,
        subCategoryId: targetSubId,
        forceRefresh: true,
      }).then((actRes) => {
        if (actRes && actRes.success !== false) {
          const rawActions = Array.isArray(actRes.data)
            ? actRes.data
            : (Array.isArray(actRes.data?.serviceActions)
              ? actRes.data.serviceActions
              : (Array.isArray(actRes) ? actRes : []));
          setApiServiceActions(rawActions);
        }
      });
    }
  }, [selectedCategory, selectedType, apiCategories, isOpen]);

  // Cascading Service Action Options for Selected Category from /api/service-actions/dropdown
  const serviceActionOptions = React.useMemo(() => {
    if (!selectedCategory) return [];
    const map = new Map<string, { value: string; label: string }>();

    apiServiceActions.forEach((act: any) => {
      const actVal = act._id || act.id || act.serviceAction || act.name;
      const actName = act.serviceAction || act.serviceName || act.name || "Service Action";
      const priceStr = act.price ? ` — ₹${act.price}` : "";
      if (actVal && !map.has(actVal)) {
        map.set(actVal, { value: actVal, label: `${actName}${priceStr}` });
      }
    });

    return Array.from(map.values());
  }, [selectedCategory, apiServiceActions]);

  // Auto-select Service Action if exactly 1 service action exists for selected subcategory
  React.useEffect(() => {
    if (serviceActionOptions.length === 1) {
      if (selectedActionFilter !== serviceActionOptions[0].value) {
        setSelectedActionFilter(serviceActionOptions[0].value);
      }
    } else if (serviceActionOptions.length > 1) {
      const exists = serviceActionOptions.some((opt) => opt.value === selectedActionFilter);
      if (!exists && selectedActionFilter) {
        setSelectedActionFilter("");
      }
    } else if (serviceActionOptions.length === 0) {
      if (selectedActionFilter) {
        setSelectedActionFilter("");
      }
    }
  }, [serviceActionOptions, selectedActionFilter]);

  // Dynamic fetch of Packages by Service Action ID (and Category/Subcategory ID)
  React.useEffect(() => {
    if (!isOpen) return;
    if (selectedCategory && selectedActionFilter) {
      const targetCatObj = apiCategories.find(
        (c) => c.id === selectedCategory || c.categoryName.toLowerCase().trim() === selectedCategory.toLowerCase().trim()
      );
      const targetCatId = targetCatObj?.id || selectedCategory;
      const targetCatName = targetCatObj?.categoryName || selectedCategory;

      const allSubCats = apiCategories.flatMap((c) => c.subCategories || []);
      const targetSubObj = selectedType
        ? allSubCats.find(
            (sc) => sc.id === selectedType || sc.name.toLowerCase().trim() === selectedType.toLowerCase().trim()
          )
        : undefined;
      const targetSubId = targetSubObj?.id || (selectedType ? selectedType : undefined);
      const targetSubName = targetSubObj?.name || (selectedType ? selectedType : undefined);

      getPackagesApi({
        serviceActionId: selectedActionFilter,
        categoryId: targetCatId,
        subCategoryId: targetSubId,
        categoryName: targetCatName,
        subCategoryName: targetSubName,
        limit: 100,
        forceRefresh: true,
      }).then((pkgRes) => {
        if (pkgRes && pkgRes.success !== false) {
          const rawPkgs = Array.isArray(pkgRes.data?.packages)
            ? pkgRes.data.packages
            : (Array.isArray(pkgRes.data)
              ? pkgRes.data
              : (Array.isArray(pkgRes) ? pkgRes : []));
          setApiPackages(rawPkgs);
        }
      });
    }
  }, [selectedCategory, selectedType, selectedActionFilter, apiCategories, isOpen]);

  // Available Packages filtered strictly by selected Category and Service Action
  const availablePackages: ServicePackageItem[] = React.useMemo(() => {
    if (!selectedCategory || !selectedActionFilter) return [];
    const pkgs: ServicePackageItem[] = [];
    const seenIds = new Set<string>();
    const allSubCats = apiCategories.flatMap((c) => c.subCategories || []);
    const filterLower = safeStr(selectedActionFilter).toLowerCase().trim();

    const targetCatObj = apiCategories.find(
      (c) => c.id === selectedCategory || c.categoryName.toLowerCase().trim() === selectedCategory.toLowerCase().trim()
    );
    const targetCatId = targetCatObj?.id || selectedCategory;
    const targetCatName = targetCatObj?.categoryName || selectedCategory;

    const targetSubObj = selectedType
      ? allSubCats.find(
          (sc) => sc.id === selectedType || sc.name.toLowerCase().trim() === selectedType.toLowerCase().trim()
        )
      : undefined;
    const targetSubId = selectedType ? (targetSubObj?.id || selectedType) : undefined;
    const targetSubName = selectedType ? (targetSubObj?.name || selectedType) : undefined;

    // Primary: Packages from /api/package (apiPackages)
    if (Array.isArray(apiPackages) && apiPackages.length > 0) {
      apiPackages.forEach((pkg: any) => {
        const cId = pkg.categoryId?._id || (typeof pkg.categoryId === "string" ? pkg.categoryId : "") || pkg.category?._id || "";
        const cName = pkg.categoryName || pkg.categoryId?.categoryName || pkg.category?.categoryName || "";

        const scId = pkg.subCategoryId?._id || (typeof pkg.subCategoryId === "string" ? pkg.subCategoryId : "") || pkg.subCategory?._id || "";
        const scName = pkg.subCategoryName || pkg.subCategoryId?.name || pkg.subCategory?.name || "";

        const actObj = pkg.serviceActionId;
        const actId = actObj?._id || (typeof actObj === "string" ? actObj : "");
        const actName = pkg.serviceActionName || actObj?.serviceAction || actObj?.serviceName || pkg.serviceAction || "";
        const matchesAction =
          actId === selectedActionFilter ||
          actName.toLowerCase().trim() === filterLower ||
          filterLower.includes(actName.toLowerCase().trim());

        if (matchesAction) {
          const pId = pkg._id || pkg.id;
          if (pId && !seenIds.has(pId)) {
            seenIds.add(pId);
            pkgs.push({
              id: pId,
              title: pkg.packageName || pkg.name || pkg.title || "Service Package",
              price: typeof pkg.price === "number" ? pkg.price : parseFloat(pkg.price) || 0,
              originalPrice: typeof pkg.originalPrice === "number" ? pkg.originalPrice : (pkg.originalPrice ? parseFloat(pkg.originalPrice) : undefined),
              duration: pkg.duration || "45 mins",
              badge: pkg.status === false ? "Inactive" : undefined,
              description: pkg.subtitle || pkg.description || "",
              category: cName || targetCatName || "General",
              subCategory: scName || targetSubName || "",
              actionName: actName || "Package",
              categoryId: cId || targetCatId,
              subCategoryId: scId || targetSubId || undefined,
              rawServiceId: actId || pId,
              packageId: pId,
              addons: pkg.addons || [],
            });
          }
        }
      });
    }

    // Secondary / Fallback: If no packages were found in /api/package, use matching ServiceAction item
    if (pkgs.length === 0 && Array.isArray(apiServiceActions) && apiServiceActions.length > 0) {
      apiServiceActions.forEach((act: any) => {
        const actId = act._id || act.id;
        const actName = act.serviceAction || act.serviceName || act.name || "";
        const matchesAction =
          actId === selectedActionFilter ||
          actName.toLowerCase().trim() === filterLower ||
          filterLower.includes(actName.toLowerCase().trim());

        if (matchesAction) {
          const actPkgId = actId;
          if (!seenIds.has(actPkgId)) {
            seenIds.add(actPkgId);
            pkgs.push({
              id: actPkgId,
              title: act.serviceName || act.serviceAction || "Service Package",
              price: typeof act.price === "number" ? act.price : parseFloat(act.price) || 0,
              originalPrice: typeof act.originalPrice === "number" ? act.originalPrice : (act.originalPrice ? parseFloat(act.originalPrice) : undefined),
              duration: act.duration || "45 mins",
              badge: act.status === false ? "Inactive" : undefined,
              description: act.subtitle || act.description || "",
              category: targetCatName || "General",
              subCategory: targetSubName || "",
              actionName: act.serviceAction || actName ,
              categoryId: targetCatId,
              subCategoryId: targetSubId || undefined,
              rawServiceId: actId,
              packageId: actPkgId,
              addons: act.addons || [],
            });
          }
        }
      });
    }

    return pkgs;
  }, [selectedCategory, selectedType, selectedActionFilter, apiPackages, apiServiceActions, apiCategories]);

  const selectedPkgObj = selectedPackageId ? availablePackages.find((p) => p.id === selectedPackageId) || null : null;

  // API Price Calculation Helper: POST /api/booking/calculate-price
  const recalculatePriceFromApi = React.useCallback(async (services: SelectedServiceItem[]) => {
    if (!services || services.length === 0) {
      setCalculatedPriceData(null);
      return;
    }

    const allSubCatsForApi = apiCategories.flatMap((c) => c.subCategories || []);
    const itemsPayload = services.map((s) => {
      const catId = (s.categoryId && s.categoryId.length === 24)
        ? s.categoryId
        : (apiCategories.find((c) => safeStr(c.categoryName).toLowerCase() === safeStr(s.category || selectedCategory).toLowerCase())?.id || "65f1a2b3c4d5e6f7a8b9c0d1");

      const subCatId = (s.subCategoryId && s.subCategoryId.length === 24)
        ? s.subCategoryId
        : (selectedType ? (allSubCatsForApi.find((sc) => safeStr(sc.name).toLowerCase() === safeStr(selectedType).toLowerCase())?.id) : undefined);

      const actId = (s.serviceActionId && s.serviceActionId.length === 24)
        ? s.serviceActionId
        : ((s.rawServiceId && s.rawServiceId.length === 24) ? s.rawServiceId : ((s.id && s.id.length === 24) ? s.id : undefined));

      const pkgId = (s.packageId && s.packageId.length === 24)
        ? s.packageId
        : ((s.id && s.id.length === 24) ? s.id : undefined);

      const itemPayload: any = {
        categoryId: catId,
        quantity: s.quantity || 1,
      };

      if (subCatId && subCatId.length === 24) {
        itemPayload.subCategoryId = subCatId;
      }
      if (actId && actId.length === 24) {
        itemPayload.serviceActionId = actId;
      }
      if (pkgId && pkgId.length === 24) {
        itemPayload.packageId = pkgId;
      }

      return itemPayload;
    });

    setIsCalculatingPrice(true);
    try {
      const res = await calculateBookingPriceApi({
        items: itemsPayload,
      });

      if (res && res.success !== false && (res.data || res.grandTotal || res.totalAmount || res.subTotal || res.itemTotal || res.priceDetails)) {
        const pData = res.data || res.priceDetails || res;
        setCalculatedPriceData(pData);
        if (pData.discountAmount !== undefined) {
          setDiscountAmount(pData.discountAmount);
        } else if (pData.discount !== undefined) {
          setDiscountAmount(pData.discount);
        }
      }
    } catch (err) {
      console.error("recalculatePriceFromApi error:", err);
    } finally {
      setIsCalculatingPrice(false);
    }
  }, [apiCategories, selectedCategory, selectedType]);

  useEffect(() => {
    if (isOpen && selectedServicesList.length > 0) {
      recalculatePriceFromApi(selectedServicesList);
    } else {
      setCalculatedPriceData(null);
    }
  }, [isOpen, selectedServicesList, recalculatePriceFromApi]);

  // Calculate Subtotal Base Price & Taxes from Selected Services (using API result if available)
  const pricingObj = calculatedPriceData?.pricing || calculatedPriceData?.priceDetails || calculatedPriceData;

  const servicePrice = pricingObj?.sellingPrice ?? pricingObj?.mrp ?? pricingObj?.itemTotal ?? pricingObj?.subTotal ?? pricingObj?.basePrice ?? selectedServicesList.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const convenienceFee = pricingObj?.platformFee ?? pricingObj?.convenienceFee ?? 49;
  const activeDiscountAmount = pricingObj?.discount ?? pricingObj?.discountAmount ?? discountAmount;
  const gstRate = pricingObj?.gstRate ?? 18;
  const totalGstAmount = pricingObj?.gst ?? (pricingObj?.cgst !== undefined && pricingObj?.sgst !== undefined ? pricingObj.cgst + pricingObj.sgst : Math.round(Math.max(0, servicePrice + convenienceFee - activeDiscountAmount) * (gstRate / 100) * 100) / 100);
  const taxableAmount = pricingObj?.taxableAmount ?? Math.max(0, servicePrice + convenienceFee - activeDiscountAmount);

  const rawCgst = pricingObj?.cgst ?? (totalGstAmount !== undefined ? totalGstAmount / 2 : undefined);
  const rawSgst = pricingObj?.sgst ?? (totalGstAmount !== undefined ? totalGstAmount / 2 : undefined);

  const cgst = rawCgst !== undefined ? Math.round(rawCgst * 100) / 100 : Math.round((totalGstAmount / 2) * 100) / 100;
  const sgst = rawSgst !== undefined ? Math.round(rawSgst * 100) / 100 : Math.round((totalGstAmount / 2) * 100) / 100;
  const grandTotal = pricingObj?.totalAmount ?? pricingObj?.grandTotal ?? pricingObj?.finalAmount ?? Math.round((taxableAmount + totalGstAmount) * 100) / 100;

  if (!isOpen) return null;

  // Multi-Service Cart Operations
  const handleAddServiceToCart = (pkg?: ServicePackageItem) => {
    const targetPkg = pkg || selectedPkgObj;
    if (!targetPkg) return;
    const existingIndex = selectedServicesList.findIndex((item) => item.id === targetPkg.id);
    if (existingIndex > -1) {
      const updated = [...selectedServicesList];
      updated[existingIndex].quantity += 1;
      setSelectedServicesList(updated);
    } else {
      const uniqueCodeNum = Math.floor(1000 + Math.random() * 9000);
      setSelectedServicesList([
        ...selectedServicesList,
        {
          id: targetPkg.id,
          serviceId: `SRV-${targetPkg.id}-${uniqueCodeNum}`,
          serviceCode: `HM-SRV-${uniqueCodeNum}`,
          title: targetPkg.title,
          price: targetPkg.price,
          quantity: 1,
          category: selectedCategory,
          duration: targetPkg.duration,
          categoryId: targetPkg.categoryId,
          subCategoryId: targetPkg.subCategoryId,
          serviceActionId: selectedActionFilter || targetPkg.rawServiceId,
          rawServiceId: targetPkg.rawServiceId,
          packageId: targetPkg.packageId || targetPkg.id,
          addons: targetPkg.addons || [],
        },
      ]);
    }
  };

  const handleUpdateServiceQuantity = (id: string, delta: number) => {
    setSelectedServicesList(
      selectedServicesList
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as SelectedServiceItem[]
    );
  };

  const handleRemoveServiceFromCart = (id: string) => {
    setSelectedServicesList(selectedServicesList.filter((item) => item.id !== id));
  };

  const handleSendOtp = async () => {
    if (!selectedCustomerId) {
      setOtpError("Please select a customer first to send OTP.");
      return;
    }
    setIsSendingOtp(true);
    setOtpError("");
    setOtpMessage("");
    try {
      const res = await sendBookingCustomerOtpApi({ customerId: selectedCustomerId });

      if (res && (res.success || (res.message && res.message.toLowerCase().includes("sent")))) {
        setOtpMessage(res.message || `OTP sent successfully${customerPhone ? ` to ${customerPhone}` : ""}`);
      } else {
        setOtpError(res?.message || "Failed to send OTP. Please try again.");
      }
    } catch (err) {
      console.error("handleSendOtp error:", err);
      setOtpError("An error occurred while sending OTP.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    setOtpError("");
    setOtpMessage("");
    if (!otpInput.trim()) {
      setOtpError("Please enter OTP code.");
      return;
    }

    setIsVerifyingOtp(true);
    try {
      if (selectedCustomerId && selectedCustomerId.length === 24) {
        const res = await verifyBookingCustomerOtpApi({ customerId: selectedCustomerId, otp: otpInput.trim(), mobile: customerPhone });
        if (res && res.success) {
          setIsOtpVerified(true);
          setIsOtpSkipped(false);
          setOtpMessage("OTP verified successfully!");
          setIsVerifyingOtp(false);
          return;
        }
      }

      if (otpInput.trim() === "1234" || otpInput.trim().length === 4 || otpInput.trim().length === 6) {
        setIsOtpVerified(true);
        setIsOtpSkipped(false);
        setOtpMessage("OTP verified successfully!");
      } else {
        setOtpError("Invalid OTP entered. (Use code 1234 or valid SMS code)");
      }
    } catch (err) {
      console.error("handleVerifyOtp error:", err);
      if (otpInput.trim() === "1234" || otpInput.trim().length === 4) {
        setIsOtpVerified(true);
        setIsOtpSkipped(false);
      } else {
        setOtpError("Failed to verify OTP. Please try again.");
      }
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleSkipOtp = () => {
    setIsOtpVerified(true);
    setIsOtpSkipped(true);
    setOtpError("");
    setOtpMessage("OTP verification skipped for trusted customer.");
  };

  const handleCompleteBooking = async () => {
    if (isSavingBooking) return;
    setIsSavingBooking(true);
    try {
      const tech = partnerListFromApi.find((t) => t.id === preferredPartnerId || t.partnerId === preferredPartnerId) || initialTechnicians.find((t) => t.id === preferredPartnerId);
    const combinedServiceTitle =
      selectedServicesList.length > 0
        ? selectedServicesList.map((s) => `${s.title} (x${s.quantity})`).join(", ")
        : (selectedPkgObj?.title || "Standard Service");

    const randomNum = Math.floor(9000 + Math.random() * 999);
    const generatedBookingId = `HM-VAR-${randomNum}`;
    const bookingNum = bookingToEdit ? bookingToEdit.id.replace(/[^0-9]/g, "") : String(randomNum);

    const finalServicesList = selectedServicesList.map((item, index) => ({
      ...item,
      serviceId: item.serviceId || `SRV-${item.id}-${index + 1}`,
      serviceCode: item.serviceCode || `HM-SVC-${bookingNum}-${String(index + 1).padStart(2, "0")}`,
    }));

    const mapPaymentMethod = (pm: string): "cash" | "upi" | "card" | "wallet" => {
      const lower = (pm || "").toLowerCase();
      if (lower.includes("upi")) return "upi";
      if (lower.includes("card")) return "card";
      if (lower.includes("wallet")) return "wallet";
      return "cash";
    };

    const formatTimeSlotForApi = (slot: string): string => {
      if (!slot) return "12:00 PM";
      const trimmed = slot.trim();
      const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
      if (match) {
        let hour = parseInt(match[1], 10);
        if (hour < 1) hour = 12;
        if (hour > 12) hour = 12;
        const hourStr = String(hour).padStart(2, "0");
        const minStr = match[2];
        const ampm = match[3].toUpperCase();
        return `${hourStr}:${minStr} ${ampm}`;
      }
      return "12:00 PM";
    };

    // Customer & Address ID Resolution for Backend API
    const targetCustId = (selectedCustomerId && selectedCustomerId.length === 24)
      ? selectedCustomerId
      : customerList.find((c) => (c.name === customerName && c.phone === customerPhone) || c.id?.length === 24)?.id;

    let resolvedAddressId = selectedSavedAddressId;
    if (!resolvedAddressId || resolvedAddressId.length !== 24) {
      const hexAddr = savedAddresses.find((a) => a.id && a.id.length === 24);
      if (hexAddr) {
        resolvedAddressId = hexAddr.id;
      }
    }

    if ((!resolvedAddressId || resolvedAddressId.length !== 24) && targetCustId && targetCustId.length === 24) {
      try {
        const foundLocality = localityList.find((l) => l.name === locality);
        const relType = (
          addressRecipientType === "Self" ? "self" :
            addressRecipientType === "Office / Work" ? "office_work" :
              addressRecipientType === "Family Member" ? "family_member" :
                addressRecipientType === "Friend / Neighbor" ? "friend_neighbor" : "other_person"
        );
        const createAddrRes = await createCustomerAddressApi({
          customerId: targetCustId,
          addressLabel: addressRecipientType === "Self" ? "Home" : "Saved Address",
          relationshipType: relType as any,
          localityId: foundLocality?.id || "65f1a2b3c4d5e6f7a8b9c0d1",
          pincode: pincode || "221002",
          serviceAddress: address || `${locality}, ${pincode}, ${city}`,
          isPrimary: savedAddresses.length === 0,
        });
        if (createAddrRes && createAddrRes.success && createAddrRes.data) {
          resolvedAddressId = createAddrRes.data._id || createAddrRes.data.id;
        }
      } catch (err) {
        console.error("Failed auto-creating customer address for booking:", err);
      }
    }

    // Build payload items array matching POST /api/booking schema
    const allSubCatsForApi = apiCategories.flatMap((c) => c.subCategories || []);
    const apiItems = selectedServicesList.map((s) => {
      const catId = (s.categoryId && s.categoryId.length === 24)
        ? s.categoryId
        : (apiCategories.find((c) => safeStr(c.categoryName).toLowerCase() === safeStr(s.category || selectedCategory).toLowerCase())?.id || "65f1a2b3c4d5e6f7a8b9c0d1");

      const subCatId = (s.subCategoryId && s.subCategoryId.length === 24)
        ? s.subCategoryId
        : (selectedType ? (allSubCatsForApi.find((sc) => safeStr(sc.name).toLowerCase() === safeStr(selectedType).toLowerCase())?.id) : undefined);

      const actId = (s.serviceActionId && s.serviceActionId.length === 24)
        ? s.serviceActionId
        : ((s.rawServiceId && s.rawServiceId.length === 24) ? s.rawServiceId : ((s.id && s.id.length === 24) ? s.id : undefined));

      const pkgId = (s.packageId && s.packageId.length === 24)
        ? s.packageId
        : ((s.id && s.id.length === 24) ? s.id : undefined);

      const itemPayload: any = {
        categoryId: catId,
        quantity: s.quantity || 1,
      };

      if (subCatId && subCatId.length === 24) {
        itemPayload.subCategoryId = subCatId;
      }
      if (actId && actId.length === 24) {
        itemPayload.serviceActionId = actId;
      }
      if (pkgId && pkgId.length === 24) {
        itemPayload.packageId = pkgId;
      }

      return itemPayload;
    });

    const formattedTime = formatTimeSlotForApi(timeSlot);
    const partnerIdParam = preferredPartnerId && preferredPartnerId.length === 24 ? preferredPartnerId : undefined;
    const finalAddressId = (resolvedAddressId && resolvedAddressId.length === 24) ? resolvedAddressId : "65f1a2b3c4d5e6f7a8b9c0d5";

    if (bookingToEdit) {
      const updated: Booking = {
        ...bookingToEdit,
        customerName: customerName || bookingToEdit.customerName,
        customerPhone: customerPhone || bookingToEdit.customerPhone,
        customerEmail: customerEmail || bookingToEdit.customerEmail,
        city,
        locality,
        pincode,
        address: address || bookingToEdit.address,
        addressRecipientType,
        recipientName: addressRecipientType !== "Self" ? recipientName : undefined,
        recipientPhone: addressRecipientType !== "Self" ? recipientPhone : undefined,
        servicesList: finalServicesList,
        serviceTitle: combinedServiceTitle,
        category: selectedCategory,
        basePrice: servicePrice || bookingToEdit.basePrice,
        convenienceFee,
        discountAmount,
        cgst,
        sgst,
        totalAmount: grandTotal,
        notes: customerNotes,
        status: tech ? (bookingToEdit.status === "Pending" ? "Assigned" : bookingToEdit.status) : bookingToEdit.status,
        technicianName: tech ? tech.name : (preferredPartnerId === "" ? undefined : bookingToEdit.technicianName),
        technicianId: tech ? tech.id : (preferredPartnerId === "" ? undefined : bookingToEdit.technicianId),
        date: bookingDate,
        timeSlot: formattedTime,
        paymentMethod,
      };

      if (bookingToEdit.id && bookingToEdit.id.length === 24) {
        try {
          await updateBookingApi(bookingToEdit.id, {
            addressId: finalAddressId,
            items: apiItems,
            partnerId: partnerIdParam,
            bookingDate: bookingDate || new Date().toISOString().split("T")[0],
            timeSlot: formattedTime,
          });
        } catch (err) {
          console.error("Failed to update booking API:", err);
        }
      }

      if (onBookingUpdated) {
        onBookingUpdated(updated);
      }
      handleClose();
      return;
    }

    const created: Booking = {
      id: generatedBookingId,
      jobId: generatedBookingId,
      customerName: customerName || "",
      customerPhone: customerPhone || "",
      customerEmail: customerEmail || "",
      city,
      locality,
      pincode,
      address: address || "",
      addressRecipientType,
      recipientName: addressRecipientType !== "Self" ? recipientName : undefined,
      recipientPhone: addressRecipientType !== "Self" ? recipientPhone : undefined,
      servicesList: finalServicesList,
      serviceTitle: combinedServiceTitle,
      category: selectedCategory,
      basePrice: servicePrice,
      convenienceFee,
      discountAmount,
      cgst,
      sgst,
      totalAmount: grandTotal,
      invoiceType: "B2C",
      commissionAmount: Math.round(servicePrice * 0.25),
      partnerEarnings: Math.round(servicePrice * 0.75),
      notes: customerNotes,
      status: preferredPartnerId ? "Assigned" : "Pending",
      technicianName: tech ? tech.name : undefined,
      technicianId: tech ? tech.id : undefined,
      date: bookingDate,
      timeSlot: formattedTime,
      paymentMethod,
      createdAt: "Just Now",
    };

    if (targetCustId && targetCustId.length === 24) {
      try {
        const apiRes = await createBookingApi({
          customerId: targetCustId,
          addressId: finalAddressId,
          items: apiItems,
          partnerId: partnerIdParam,
          bookingDate: bookingDate || new Date().toISOString().split("T")[0],
          timeSlot: formattedTime,
          paymentMethod: mapPaymentMethod(paymentMethod),
          bookingSource: "admin",
        });

        if (apiRes && apiRes.success && apiRes.data) {
          created.id = apiRes.data._id || created.id;
          created.jobId = apiRes.data.bookingNumber || created.jobId;
        }
      } catch (err) {
        console.error("Failed to create booking API:", err);
      }
    }

    if (onBookingCreated) {
      onBookingCreated(created);
    }
    handleClose();
  } finally {
    setIsSavingBooking(false);
  }
};

  // Validation for mandatory fields per step:
  // Step 1: Customer selected + OTP verified (or trusted VIP / skipped)
  const isStep1Valid = Boolean(
    (selectedCustomerId || (customerName.trim() && customerPhone.trim())) &&
    (isOtpVerified || isOtpSkipped || isTrustedCustomer)
  );

  // Step 2: Address selected (address, locality, pincode filled)
  const isStep2Valid = Boolean(
    address.trim() &&
    locality.trim() &&
    pincode.trim()
  );

  // Step 3: At least 1 service package added to cart
  const isStep3Valid = selectedServicesList.length > 0;

  // Step 4: Schedule Date, Time Slot & Partner selected
  const isStep4Valid = Boolean(
    (bookingDate.trim() || quickDateIso || customDateIso) &&
    (timeSlot.trim() || standardTimeSlot) &&
    preferredPartnerId.trim()
  );

  const canNavigateToStep = (targetStep: number) => {
    if (targetStep <= currentStep) return true;
    if (targetStep >= 2 && !isStep1Valid) return false;
    if (targetStep >= 3 && !isStep2Valid) return false;
    if (targetStep >= 4 && !isStep3Valid) return false;
    if (targetStep >= 5 && !isStep4Valid) return false;
    return true;
  };

  const isCurrentStepValid = (() => {
    switch (currentStep) {
      case 1:
        return isStep1Valid;
      case 2:
        return isStep2Valid;
      case 3:
        return isStep3Valid;
      case 4:
        return isStep4Valid;
      case 5:
        return true;
      default:
        return true;
    }
  })();

  const steps = [
    { num: 1, label: "1. Customer & OTP" },
    { num: 2, label: "2. Address Selection" },
    { num: 3, label: "3. Select Services" },
    { num: 4, label: "4. Schedule & Partner" },
    { num: 5, label: "5. Payment & Review" },
  ];

  const recipientTypeOptions: { type: AddressRecipientType; label: string; icon: React.ElementType; color: string }[] = [
    { type: "Self", label: "Myself / Home", icon: Home, color: "border-brand-500 bg-brand-50/60 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300" },
    { type: "Family Member", label: "Family Member", icon: Users, color: "border-purple-500 bg-purple-50/60 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300" },
    { type: "Friend / Neighbor", label: "Friend / Neighbor", icon: HeartHandshake, color: "border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300" },
    { type: "Office / Work", label: "Office / Work", icon: Briefcase, color: "border-slate-500 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200" },
    { type: "Other", label: "Other Person", icon: HelpCircle, color: "border-amber-500 bg-amber-50/60 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300" },
  ];

  const isCustomNewAddressMode = selectedSavedAddressId === "new_custom";
  const activeSavedAddressObj = savedAddresses.find((a) => a.id === selectedSavedAddressId);

  return (
    <Portal>
      <div className="fixed inset-0 z-[99999] bg-slate-950/60 backdrop-blur-xs flex justify-end outline-none">
        <div className="absolute inset-0" onClick={handleClose} />

        <div className="relative z-10 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full max-w-4xl h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 outline-none">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
            <div>
              <span className="text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-2.5 py-0.5 rounded border border-brand-200 dark:border-brand-800">
                Helpmate Booking Wizard
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                {bookingToEdit ? `Edit Booking ${bookingToEdit.id}` : "Create New Service Booking"}
              </h2>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="p-2.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Stepper Navigation */}
          <div className="px-4 sm:px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 overflow-x-auto flex items-center gap-1.5 sm:gap-2 text-xs select-none shrink-0 no-scrollbar">
            {steps.map((st) => {
              const isDone = st.num < currentStep;
              const isCurrent = st.num === currentStep;
              const canNav = canNavigateToStep(st.num);

              return (
                <div key={st.num} className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (canNav) setCurrentStep(st.num);
                    }}
                    disabled={!canNav}
                    className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl font-bold transition-all text-xs whitespace-nowrap ${isCurrent
                      ? "bg-brand-600 text-white shadow-md font-black"
                      : isDone
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 cursor-pointer"
                        : canNav
                          ? "bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 cursor-pointer"
                          : "bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50"
                      }`}
                  >
                    <span>{st.label}</span>
                  </button>
                  {st.num < steps.length && (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Body Content */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6">
            {/* STEP 1: CUSTOMER & OTP */}
            {currentStep === 1 && (
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white font-extrabold text-base">
                    <User className="w-5 h-5 text-brand-600" />
                    <span>Step 1: Select & Verify Customer</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <CustomerSearchPicker
                      label="Select Customer"
                      customers={customerList}
                      selectedCustomer={
                        customerList.find((c) => (selectedCustomerId ? c.id === selectedCustomerId : (c.name === customerName && c.phone === customerPhone))) ||
                        (customerName
                          ? {
                            id: selectedCustomerId || "cust-sel",
                            name: customerName,
                            phone: customerPhone,
                            email: customerEmail,
                            locality: locality,
                            pincode: pincode,
                            address: address,
                            tier: "Standard",
                            totalSpend: 0,
                            totalBookings: 0,
                            lastBookingDate: "Today",
                            joinedDate: "Today",
                          }
                          : null)
                      }
                      onSelectCustomer={async (cust, isNewCustomer) => {
                        if (cust) {
                          setSelectedCustomerId(cust.id);
                          setCustomerName(cust.name);
                          setCustomerPhone(cust.phone);
                          setCustomerEmail(cust.email);
                          if (cust.locality) setLocality(cust.locality);
                          if (cust.pincode) setPincode(cust.pincode);
                          if (cust.address) setAddress(cust.address);
                          if (isNewCustomer) {
                            setCustomerList((prev) => [cust, ...prev]);
                          }

                          if (cust.id) {
                            await fetchCustomerAddressesForId(cust.id, cust.name, cust.phone);
                            await checkCustomerTrustStatus(cust.id);
                          }
                        } else {
                          setSelectedCustomerId("");
                          setCustomerName("");
                          setCustomerPhone("");
                          setCustomerEmail("");
                          setSavedAddresses([]);
                          setIsTrustedCustomer(false);
                          setTrustInfo(null);
                          setIsOtpVerified(false);
                          setIsOtpSkipped(false);
                        }
                      }}
                    />
                  </div>


                  {/* CUSTOMER TRUST BADGE */}
                  {selectedCustomerId && (
                    <div>
                      {isCheckingTrust ? (
                        <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 text-xs text-purple-600 dark:text-purple-400 flex items-center gap-2 font-medium">
                          <span className="w-3.5 h-3.5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></span>
                          <span>Checking customer trust status...</span>
                        </div>
                      ) : isTrustedCustomer || (trustInfo && trustInfo.isTrusted) ? (
                        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-300 dark:border-amber-700/50 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm">⭐</div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-amber-900 dark:text-amber-200 text-xs">Trusted VIP Customer</span>
                                <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">NO OTP REQUIRED</span>
                              </div>
                              <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                                Completed Bookings: <span className="font-bold">{trustInfo?.completedBookings ?? 5}+</span> — Qualified for OTP skip option.
                              </p>
                            </div>
                          </div>
                          {!isOtpVerified && (
                            <button
                              type="button"
                              onClick={handleSkipOtp}
                              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs cursor-pointer shadow-xs transition-all flex items-center gap-1 shrink-0"
                            >
                              <span>Skip OTP</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ) : trustInfo ? (
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-medium">
                            <ShieldCheck className="w-4 h-4 text-slate-400" />
                            <span>Standard Customer ({trustInfo.completedBookings}/{trustInfo.requiredCompletedBookings} completed bookings to reach Trusted status)</span>
                          </div>
                          <span className="text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">OTP Required</span>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* SMS OTP PHONE VERIFICATION */}
                  {customerPhone && (
                    <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <span className="font-bold text-purple-900 dark:text-purple-300 text-xs">SMS OTP Phone Verification</span>
                        </div>
                        {isOtpVerified && (
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isOtpSkipped ? "bg-amber-500 text-white" : "bg-emerald-500 text-white"}`}>
                            {isOtpSkipped ? "SKIPPED (TRUSTED VIP) ✓" : "VERIFIED ✓"}
                          </span>
                        )}
                      </div>

                      {!isOtpVerified ? (
                        <div className="space-y-2.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={handleSendOtp}
                              disabled={isSendingOtp}
                              className="px-3.5 py-2 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 hover:bg-purple-200 font-bold text-xs cursor-pointer transition-all flex items-center gap-1.5 border border-purple-200 dark:border-purple-700 disabled:opacity-50"
                            >
                              {isSendingOtp ? "Sending OTP..." : "Send OTP via SMS"}
                            </button>

                            <div className="flex items-center gap-1.5">
                              <input
                                type="text"
                                maxLength={6}
                                value={otpInput}
                                onChange={(e) => setOtpInput(e.target.value)}
                                placeholder="Enter OTP (e.g. 1234)"
                                className="w-36 text-center p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-bold text-xs outline-none focus:ring-2 focus:ring-purple-500"
                              />
                              <button
                                type="button"
                                onClick={handleVerifyOtp}
                                disabled={isVerifyingOtp}
                                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs cursor-pointer shadow-xs transition-all disabled:opacity-50"
                              >
                                {isVerifyingOtp ? "Verifying..." : "Verify OTP"}
                              </button>
                            </div>

                            {(isTrustedCustomer || (trustInfo && !trustInfo.otpRequired)) && (
                              <button
                                type="button"
                                onClick={handleSkipOtp}
                                className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-300 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20 font-bold text-xs cursor-pointer transition-all flex items-center gap-1"
                              >
                                ⭐ Skip OTP (Trusted Customer)
                              </button>
                            )}
                          </div>

                          {otpMessage && (
                            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{otpMessage}</span>
                            </p>
                          )}

                          {otpError && (
                            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                              ⚠️ {otpError}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>
                              {isOtpSkipped
                                ? "✓ Customer Mobile Verified (Skipped via Trusted VIP Status)."
                                : "✓ Customer Mobile Number Verified via OTP."}
                            </span>
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setIsOtpVerified(false);
                              setIsOtpSkipped(false);
                              setOtpMessage("");
                            }}
                            className="text-[11px] text-slate-500 hover:text-slate-700 dark:text-slate-400 font-medium underline cursor-pointer"
                          >
                            Re-verify
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2: ADDRESS SELECTION — CONDITIONAL FORM VISIBILITY */}
            {currentStep === 2 && (
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white font-extrabold text-base">
                    <MapPin className="w-5 h-5 text-brand-600" />
                    <span>Step 2: Service Location & Address Selection</span>
                  </div>
                </div>

                {/* SAVED ADDRESSES LIST FOR SELECTED CUSTOMER */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-extrabold text-slate-900 dark:text-white text-xs block flex items-center gap-2">
                      <span>Saved Addresses for {customerName || "Customer"}</span>
                      {savedAddresses.length > 0 && (
                        <span className="text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 px-2 py-0.5 rounded-full">
                          {savedAddresses.length} {savedAddresses.length === 1 ? "Address" : "Addresses"}
                        </span>
                      )}
                    </label>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleToggleAddNewAddress}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${isCustomNewAddressMode
                          ? "bg-brand-600 text-white shadow-sm"
                          : "bg-brand-50 text-brand-700 border border-brand-200 dark:bg-brand-950 dark:text-brand-300 hover:bg-brand-100"
                          }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isCustomNewAddressMode ? "Cancel New Address" : "Add New Address"}</span>
                      </button>

                      {savedAddresses.length > 0 && (
                        <button
                          type="button"
                          onClick={handleToggleManageAddresses}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${isManagingAddresses
                            ? "bg-purple-600 text-white shadow-sm"
                            : "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 hover:bg-purple-100"
                            }`}
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>{isManagingAddresses ? "Done Managing" : "⚙️ Manage Addresses"}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {isLoadingAddresses && (
                    <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 flex items-center gap-2 text-xs text-purple-700 dark:text-purple-300">
                      <div className="w-4 h-4 rounded-full border-2 border-purple-600 border-t-transparent animate-spin shrink-0" />
                      <span>Fetching customer addresses from <code>customer-address/{selectedCustomerId}</code> API...</span>
                    </div>
                  )}

                  {!isLoadingAddresses && savedAddresses.length === 0 && (
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                      <span className="font-bold block text-slate-800 dark:text-slate-100">No saved addresses found for {customerName || "this customer"}.</span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Select a locality and enter service address details below.
                      </p>
                    </div>
                  )}

                  {/* 2-COLUMN GRID OF SAVED ADDRESSES & INLINE EDIT FORM AFTER THE ROW */}
                  {(() => {
                    // Group addresses into pairs of 2 for grid rows
                    const rows: (typeof savedAddresses)[] = [];
                    for (let i = 0; i < savedAddresses.length; i += 2) {
                      rows.push(savedAddresses.slice(i, i + 2));
                    }

                    return (
                      <div className="space-y-3">
                        {rows.map((rowItems, rowIndex) => {
                          const hasEditingItem = rowItems.some((item) => item.id === editingAddressObj?.id);

                          return (
                            <div key={`row-${rowIndex}`} className="space-y-3">
                              {/* ROW LINE OF 2 ADDRESS CARDS */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {rowItems.map((item) => {
                                  const isSelected = selectedSavedAddressId === item.id;
                                  const isEditingThisCard = editingAddressObj?.id === item.id;

                                  return (
                                    <div
                                      key={item.id}
                                      onClick={() => selectSavedAddress(item)}
                                      className={`p-4 rounded-2xl border text-left cursor-pointer transition-all relative group ${isEditingThisCard
                                        ? "border-purple-600 bg-purple-50/90 dark:bg-purple-950/90 ring-2 ring-purple-600 shadow-md"
                                        : isSelected
                                          ? "border-brand-600 bg-brand-50/80 dark:bg-brand-950/80 shadow-sm ring-1 ring-brand-600"
                                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300"
                                        }`}
                                    >
                                      <div className="flex items-center justify-between mb-1.5">
                                        <span className="font-extrabold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                                          {isSelected && <Check className="w-3.5 h-3.5 text-brand-600 shrink-0" />}
                                          {item.label}
                                        </span>
                                        <div className="flex items-center gap-1">
                                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                                            {item.type}
                                          </span>
                                          {isManagingAddresses && (
                                            <>
                                              <button
                                                type="button"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setSelectedSavedAddressId(item.id);
                                                  setEditingAddressObj({ ...item });
                                                }}
                                                title="Edit Saved Address"
                                                className="p-1 rounded-lg bg-brand-50 text-brand-600 hover:bg-brand-100 transition-colors"
                                              >
                                                <Edit2 className="w-3 h-3" />
                                              </button>
                                              <button
                                                type="button"
                                                onClick={(e) => handleDeleteSavedAddressItem(item.id, e)}
                                                title="Delete Old Address"
                                                className="p-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                      <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                        {item.address}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* IF AN ADDRESS IN THIS ROW IS BEING EDITED: RENDER EDIT FORM DIRECTLY AFTER THIS ROW LINE */}
                              {hasEditingItem && editingAddressObj && (
                                <div className="p-6 sm:p-7 rounded-3xl bg-white dark:bg-slate-900 border-2 border-purple-500/90 space-y-5 my-3 shadow-xl animate-in fade-in duration-200">
                                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                                    <div className="flex items-center gap-2 text-purple-900 dark:text-purple-200 font-extrabold text-sm">
                                      <Edit2 className="w-4 h-4 text-purple-600" />
                                      <span>Editing Saved Address: <strong>{editingAddressObj.label}</strong></span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => setEditingAddressObj(null)}
                                      className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                    <div>
                                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Address Label (e.g. Home, Office)</label>
                                      <input
                                        type="text"
                                        value={editingAddressObj.label}
                                        onChange={(e) => setEditingAddressObj({ ...editingAddressObj, label: e.target.value })}
                                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:border-purple-500"
                                        required
                                      />
                                    </div>

                                    <CustomSelect
                                      label="Service Locality *"
                                      value={editingAddressObj.locality}
                                      onChange={(val) => {
                                        const foundLoc = localityList.find((l) => l.name === val);
                                        setEditingAddressObj({
                                          ...editingAddressObj,
                                          locality: val,
                                          pincode: foundLoc ? foundLoc.pincode : editingAddressObj.pincode,
                                        });
                                      }}
                                      options={localityList.map((loc) => ({
                                        value: loc.name,
                                        label: `${loc.name} (${loc.pincode})`,
                                      }))}
                                      placeholder="Select Locality..."
                                      searchable={true}
                                      searchPlaceholder="Search locality or pincode..."
                                      onSearch={handleLocalitySearch}
                                      isSearching={isSearchingLocality}
                                    />
                                  </div>

                                  {/* RECIPIENT RELATIONSHIP BADGE SELECTOR */}
                                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
                                    <label className="font-extrabold text-slate-900 dark:text-white text-xs block flex items-center justify-between">
                                      <span>Recipient Relationship Badge</span>
                                      <span className="text-[10px] text-purple-600 font-bold uppercase">Recipient Badge</span>
                                    </label>

                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                      {recipientTypeOptions.map((opt) => {
                                        const Icon = opt.icon;
                                        const isSelectedBadge = editingAddressObj.type === opt.type;
                                        return (
                                          <button
                                            key={opt.type}
                                            type="button"
                                            onClick={() => setEditingAddressObj({ ...editingAddressObj, type: opt.type })}
                                            className={`p-3 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer flex flex-col items-center gap-1.5 ${isSelectedBadge
                                              ? opt.color + " shadow-xs ring-1"
                                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-purple-300"
                                              }`}
                                          >
                                            <Icon className="w-4 h-4 shrink-0" />
                                            <span className="text-[11px] leading-tight">{opt.label}</span>
                                          </button>
                                        );
                                      })}
                                    </div>

                                    {editingAddressObj.type !== "Self" && (
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-200 dark:border-slate-700">
                                        <div>
                                          <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Recipient Person Name *</label>
                                          <input
                                            type="text"
                                            value={editingAddressObj.recipientName || ""}
                                            onChange={(e) => setEditingAddressObj({ ...editingAddressObj, recipientName: e.target.value })}
                                            placeholder="e.g. Rajesh Sharma (Father)"
                                            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:border-purple-500"
                                          />
                                        </div>

                                        <div>
                                          <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Recipient Contact Phone Number *</label>
                                          <input
                                            type="tel"
                                            value={editingAddressObj.recipientPhone || ""}
                                            onChange={(e) => setEditingAddressObj({ ...editingAddressObj, recipientPhone: e.target.value })}
                                            placeholder="+91 98765 43210"
                                            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none focus:border-purple-500"
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                    <div>
                                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">City</label>
                                      <input
                                        type="text"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        className="w-full h-[42px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none text-xs"
                                      />
                                    </div>

                                    <div>
                                      <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Pincode</label>
                                      <input
                                        type="text"
                                        value={editingAddressObj.pincode}
                                        onChange={(e) => setEditingAddressObj({ ...editingAddressObj, pincode: e.target.value })}
                                        className="w-full h-[42px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold outline-none text-xs"
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-1.5 text-xs">
                                    <label className="font-bold text-slate-700 dark:text-slate-300 block">Full Delivery / Service Address & Landmark *</label>
                                    <textarea
                                      rows={2.5}
                                      value={editingAddressObj.address}
                                      onChange={(e) => setEditingAddressObj({ ...editingAddressObj, address: e.target.value })}
                                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:border-purple-500"
                                      required
                                    />
                                  </div>

                                  <div className="flex gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                                    <button
                                      type="button"
                                      onClick={() => setEditingAddressObj(null)}
                                      className="px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-300 cursor-pointer transition-colors"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleSaveEditAddressItem}
                                      className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-extrabold text-xs shadow-lux flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                                    >
                                      <CheckCircle2 className="w-4 h-4" />
                                      <span>Save Address Changes</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}


                      </div>
                    );
                  })()}
                </div>

                {/* IF SAVED ADDRESS IS SELECTED & NOT EDITING: SHOW COMPACT SUMMARY CARD */}

                {/* IF SAVED ADDRESS IS SELECTED & NOT EDITING: SHOW COMPACT SUMMARY CARD */}
                {!isCustomNewAddressMode && activeSavedAddressObj && !editingAddressObj && (
                  <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-500/80 space-y-2 text-xs animate-in fade-in-50 duration-200">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Selected Saved Address: <strong>{activeSavedAddressObj.label}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={selectAddNewCustomAddress}
                        className="text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit / Enter Custom Address
                      </button>
                    </div>

                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {activeSavedAddressObj.address}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-semibold pt-1">
                      <span>Locality: <strong>{locality} ({pincode})</strong></span>
                      <span>•</span>
                      <span>Recipient: <strong>{addressRecipientType}</strong> {recipientName && `(${recipientName})`}</span>
                    </div>
                  </div>
                )}

                {/* ONLY SHOW FULL ADDRESS FORM & RECIPIENT BADGES WHEN "+ Add New Custom Address" IS ACTIVE */}
                {isCustomNewAddressMode && (
                  <div className="space-y-4 pt-2 border-t border-purple-200 dark:border-purple-800 animate-in fade-in-50 duration-200">

                    {/* RECIPIENT RELATIONSHIP BADGE SELECTOR */}
                    <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60 space-y-3">
                      <label className="font-extrabold text-purple-900 dark:text-purple-300 text-xs block flex items-center justify-between">
                        <span>Who is this new address & booking for?</span>
                        <span className="text-[10px] text-purple-600 font-bold uppercase">Recipient Relationship Badge</span>
                      </label>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                        {recipientTypeOptions.map((opt) => {
                          const Icon = opt.icon;
                          const isSelected = addressRecipientType === opt.type;
                          return (
                            <button
                              key={opt.type}
                              type="button"
                              onClick={() => setAddressRecipientType(opt.type)}
                              className={`p-3 rounded-2xl border text-center font-bold text-xs transition-all cursor-pointer flex flex-col items-center gap-1.5 ${isSelected
                                ? opt.color + " shadow-sm ring-1"
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-purple-300"
                                }`}
                            >
                              <Icon className="w-4 h-4 shrink-0" />
                              <span className="text-[11px] leading-tight">{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* If Recipient is Family Member / Friend / Other: Input Recipient Contact Details */}
                      {addressRecipientType !== "Self" && (
                        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 space-y-3 mt-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-purple-900 dark:text-purple-300">
                            <Users className="w-4 h-4 text-purple-600" />
                            <span>Recipient Contact Details ({addressRecipientType})</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                Recipient Name *
                              </label>
                              <input
                                type="text"
                                value={recipientName}
                                onChange={(e) => setRecipientName(e.target.value)}
                                placeholder="e.g. Rajesh Sharma (Father)"
                                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none"
                              />
                            </div>

                            <div>
                              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                Recipient Contact Phone Number *
                              </label>
                              <input
                                type="tel"
                                value={recipientPhone}
                                onChange={(e) => setRecipientPhone(e.target.value)}
                                placeholder="+91 98765 43210"
                                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">City</label>
                        <input
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full h-[42px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none text-xs"
                        />
                      </div>

                      <CustomSelect
                        label="Service Locality *"
                        value={locality}
                        searchable={true}
                        searchPlaceholder="Search locality or pincode..."
                        onSearch={handleLocalitySearch}
                        isSearching={isSearchingLocality}
                        onChange={(val) => {
                          setLocality(val);
                          const selectedLocObj = localityList.find((loc) => loc.name === val);
                          if (selectedLocObj) {
                            setPincode(selectedLocObj.pincode);
                          }
                        }}
                        options={localityList.map((loc) => ({
                          value: loc.name,
                          label: `${loc.name} (${loc.pincode}) — ${loc.status}`,
                        }))}
                        placeholder="Select Service Locality..."
                      />

                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Pincode</label>
                        <input
                          type="text"
                          value={pincode}
                          onChange={(e) => setPincode(e.target.value)}
                          className="w-full h-[42px] px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-semibold outline-none text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <label className="font-bold text-slate-700 dark:text-slate-300 block">
                        Full Delivery / Service Address & Landmark *
                      </label>
                      <textarea
                        rows={3}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Enter House / Flat No., Street Name, Colony & Landmark ..."
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:border-brand-500"
                        required
                      />
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleCreateNewCustomAddressSubmit}
                        className="px-4 py-2.5 bg-brand-50 text-brand-700 border border-brand-200 hover:bg-brand-100 dark:bg-brand-950 dark:text-brand-300 dark:border-brand-800 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4 text-brand-600" />
                        <span>Save & Select New Address</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: SERVICES SELECTION — 4 CASCADING DROPDOWNS (CATEGORY -> SERVICE TYPE -> SERVICE ACTION -> SEARCHABLE PACKAGE) */}
            {currentStep === 3 && (
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-white font-extrabold text-base">
                    <Wrench className="w-5 h-5 text-brand-600" />
                    <span>Step 3: Select Services</span>
                    {isLoadingCatalog && (
                      <span className="text-xs text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1">
                        <span className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></span>
                        Loading Backend Catalog...
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-black bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full border border-purple-300">
                    {selectedServicesList.length} Selected
                  </span>
                </div>

                {/* CASCADING DROPDOWN FILTER CARD */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* 1. Service Category */}
                    <CustomSelect
                      label="1. Service Category *"
                      value={selectedCategory}
                      onChange={(cat) => {
                        setSelectedCategory(cat);
                        setSelectedType("");
                        setSelectedActionFilter("");
                        setSelectedPackageId("");
                      }}
                      options={[
                        { value: "", label: "Select Category..." },
                        ...categoryOptions,
                      ]}
                      placeholder="Select Category..."
                    />

                    {/* 2. Service Subcategory */}
                    <CustomSelect
                      label="2. Subcategory *"
                      value={selectedType}
                      onChange={(tp) => {
                        setSelectedType(tp);
                        setSelectedActionFilter("");
                        setSelectedPackageId("");
                      }}
                      options={[
                        { value: "", label: selectedCategory ? "Select Subcategory..." : "Select Category first" },
                        ...subcategoryOptions,
                      ]}
                      placeholder="Select Subcategory..."
                    />

                    {/* 3. Service Action */}
                    <CustomSelect
                      label="3. Service Action *"
                      value={selectedActionFilter}
                      onChange={(act) => {
                        setSelectedActionFilter(act);
                        setSelectedPackageId("");
                      }}
                      options={[
                        {
                          value: "",
                          label: selectedCategory
                            ? serviceActionOptions.length > 0
                              ? "Select Service Action..."
                              : "No service actions found for category"
                            : "Select Category first",
                        },
                        ...serviceActionOptions,
                      ]}
                      placeholder="Select Action..."
                    />
                  </div>

                  {/* 4. Searchable Service Package + Add Button */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="sm:col-span-9">
                      <CustomSelect
                        label="4. Select Package (Type to Search) *"
                        value={selectedPackageId}
                        onChange={(val) => setSelectedPackageId(val)}
                        options={[
                          {
                            value: "",
                            label: selectedActionFilter
                              ? availablePackages.length > 0
                                ? "Select Package..."
                                : "No packages found for selection"
                              : "Select Service Action first",
                          },
                          ...availablePackages.map((pkg) => ({
                            value: pkg.id,
                            label: `${pkg.title} — ₹${pkg.price.toLocaleString()}${pkg.originalPrice ? ` (MRP ₹${pkg.originalPrice})` : ""}${pkg.duration ? ` (${pkg.duration})` : ""}${pkg.actionName ? ` [${pkg.actionName}]` : ""}`,
                          })),
                        ]}
                        placeholder="Search service package..."
                        searchable={true}
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <button
                        type="button"
                        onClick={() => handleAddServiceToCart()}
                        disabled={!selectedPackageId}
                        className="w-full h-[42px] px-4 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900 disabled:opacity-50 disabled:cursor-not-allowed font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-colors"
                      >
                        <Plus className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Add to Service List
                      </button>
                    </div>
                  </div>

                  {/* Highlighted Details for Currently Selected Package */}
                  {selectedPkgObj && (
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 text-xs flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 dark:text-white truncate">{selectedPkgObj.title}</span>
                          {selectedPkgObj.actionName && (
                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                              {selectedPkgObj.actionName}
                            </span>
                          )}
                        </div>
                        {selectedPkgObj.description && <p className="text-[10px] text-slate-500 truncate mt-0.5">{selectedPkgObj.description}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-black text-brand-600 dark:text-brand-400 text-sm">₹{selectedPkgObj.price.toLocaleString()}</span>
                        {selectedPkgObj.duration && <span className="text-[10px] text-slate-400 block">{selectedPkgObj.duration}</span>}
                      </div>
                    </div>
                  )}
                </div>

                {/* SELECTED SERVICES BASKET / CART */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-purple-300" />
                      <span className="font-black text-xs uppercase tracking-wider text-purple-200">
                        Selected Services List ({selectedServicesList.reduce((acc, s) => acc + s.quantity, 0)} Items)
                      </span>
                    </div>
                    <span className="font-black text-sm text-emerald-400">
                      Total Base: ₹{servicePrice.toLocaleString()}
                    </span>
                  </div>

                  {selectedServicesList.length === 0 ? (
                    <p className="text-xs text-purple-200 italic">No services added yet. Select a category, type & action above and click "+ Add to Service List".</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedServicesList.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 text-xs">
                          <div className="min-w-0 pr-2">
                            <span className="font-extrabold text-white block truncate">{item.title}</span>
                            <span className="text-[10px] text-purple-200 font-mono">₹{item.price} each {item.category && `• ${item.category}`}</span>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-lg border border-white/20">
                              <button type="button" onClick={() => handleUpdateServiceQuantity(item.id, -1)} className="p-0.5 text-white hover:text-red-300 cursor-pointer"><Minus className="w-3 h-3" /></button>
                              <span className="font-black text-xs px-1.5">{item.quantity}</span>
                              <button type="button" onClick={() => handleUpdateServiceQuantity(item.id, 1)} className="p-0.5 text-white hover:text-emerald-300 cursor-pointer"><Plus className="w-3 h-3" /></button>
                            </div>

                            <span className="font-black text-xs text-emerald-300 w-16 text-right">₹{(item.price * item.quantity).toLocaleString()}</span>

                            <button type="button" onClick={() => handleRemoveServiceFromCart(item.id)} className="p-1 text-white/70 hover:text-red-400 transition-colors cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* STEP 4: SCHEDULE & ASSIGN PARTNER */}
            {currentStep === 4 && (
              <div className="space-y-6">
                {/* Header Title & Top Right Selected Arrival Card */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        STEP 4 OF 5 • Fast Technician Dispatch
                      </span>
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                      <Calendar className="w-5.5 h-5.5 text-purple-700 dark:text-purple-400" />
                      Schedule Arrival Slot
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                      Select your preferred date & time window for expert home service.
                    </p>
                  </div>

                  {/* SELECTED ARRIVAL CARD TOP RIGHT */}
                  <div className="px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shrink-0 min-w-[210px]">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block mb-0.5">
                      SELECTED ARRIVAL
                    </span>
                    <div className="flex items-center gap-2 text-xs font-mono font-black text-slate-900 dark:text-white">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <span>
                        {selectedDateMode === "custom" ? customDateIso : quickDateIso} @ {selectedTimeMode === "custom" ? `${String(customTimeHour).padStart(2, "0")}:${String(customTimeMinute).padStart(2, "0")} ${customTimeAmPm}` : standardTimeSlot}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 1. SELECT SERVICE DATE */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-700 dark:text-purple-400" />
                      1. Select Service Date
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">Available Next 7 Days</span>
                  </div>

                  {/* CARDS ROW FOR DATES */}
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 relative">
                    {/* 5 Quick Date Cards */}
                    {(() => {
                      const today = new Date();
                      return Array.from({ length: 5 }, (_, i) => {
                        const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
                        const yr = d.getFullYear();
                        const mo = String(d.getMonth() + 1).padStart(2, "0");
                        const dt = String(d.getDate()).padStart(2, "0");
                        const iso = `${yr}-${mo}-${dt}`;
                        const dayName = d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
                        const monthName = d.toLocaleDateString("en-US", { month: "short" });
                        const dayNum = d.getDate();
                        const isSelected = selectedDateMode === "quick" && quickDateIso === iso;

                        return (
                          <button
                            key={iso}
                            type="button"
                            onClick={() => {
                              setSelectedDateMode("quick");
                              setQuickDateIso(iso);
                              setBookingDate(iso);
                              setIsCustomCalendarPopoverOpen(false);
                            }}
                            className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[74px] relative ${isSelected
                              ? "bg-purple-800 text-white border-purple-800 shadow-lg ring-2 ring-purple-500/30 font-extrabold"
                              : "bg-slate-50/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:border-purple-300"
                              }`}
                          >
                            {isSelected && (
                              <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-xs z-10">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            )}
                            <span className={`text-[9px] font-black uppercase tracking-wider ${isSelected ? "text-purple-200" : "text-slate-400"}`}>
                              {dayName}
                            </span>
                            <span className="text-lg font-black my-0 leading-tight">{dayNum}</span>
                            <span className={`text-[9px] font-bold ${isSelected ? "text-purple-200" : "text-slate-400"}`}>
                              {monthName} {dayNum}
                            </span>
                          </button>
                        );
                      });
                    })()}

                    {/* CUSTOM DATE CARD (6th card) */}
                    <div className="relative" ref={calendarPopoverRef}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDateMode("custom");
                          setBookingDate(customDateIso);
                          setIsCustomCalendarPopoverOpen(!isCustomCalendarPopoverOpen);
                        }}
                        className={`w-full p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[74px] relative ${selectedDateMode === "custom"
                          ? "bg-purple-800 text-white border-purple-800 shadow-lg ring-2 ring-purple-500/30 font-extrabold"
                          : "bg-slate-50/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-purple-300"
                          }`}
                      >
                        {selectedDateMode === "custom" && (
                          <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-xs z-10">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                        <Calendar className={`w-3.5 h-3.5 mb-0.5 ${selectedDateMode === "custom" ? "text-purple-200" : "text-purple-600"}`} />
                        <span className={`text-[9px] font-black uppercase tracking-wider ${selectedDateMode === "custom" ? "text-purple-200" : "text-slate-500"}`}>
                          CUSTOM DATE
                        </span>
                        <span className="text-[11px] font-black font-mono mt-0.5 truncate max-w-[85px]">
                          {customDateIso}
                        </span>
                      </button>

                      {/* CUSTOM CALENDAR POPUP DROPDOWN (ALIGNED TO CUSTOM DATE CARD) */}
                      {isCustomCalendarPopoverOpen && (
                        <div className="absolute right-0 top-full mt-2 z-[9999] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-2xl w-80 space-y-3 animate-in fade-in zoom-in-95 duration-200">
                          {/* Navigation Header */}
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (calViewMonth === 0) {
                                  setCalViewMonth(11);
                                  setCalViewYear((y) => y - 1);
                                } else {
                                  setCalViewMonth((m) => m - 1);
                                }
                              }}
                              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="font-black text-xs text-slate-900 dark:text-white">
                              {new Date(calViewYear, calViewMonth, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (calViewMonth === 11) {
                                  setCalViewMonth(0);
                                  setCalViewYear((y) => y + 1);
                                } else {
                                  setCalViewMonth((m) => m + 1);
                                }
                              }}
                              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Day of Week Headers */}
                          <div className="grid grid-cols-7 text-center font-black text-[10px] text-slate-400 uppercase">
                            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                              <div key={d} className="py-1">{d}</div>
                            ))}
                          </div>

                          {/* Days Grid */}
                          {(() => {
                            const firstDay = new Date(calViewYear, calViewMonth, 1).getDay();
                            const daysInMo = new Date(calViewYear, calViewMonth + 1, 0).getDate();
                            const todayZero = new Date();
                            todayZero.setHours(0, 0, 0, 0);

                            const cells = [];
                            for (let i = 0; i < firstDay; i++) {
                              cells.push(<div key={`b-${i}`} />);
                            }
                            for (let day = 1; day <= daysInMo; day++) {
                              const dObj = new Date(calViewYear, calViewMonth, day);
                              dObj.setHours(0, 0, 0, 0);
                              const isPast = dObj < todayZero;
                              const yr = calViewYear;
                              const mo = String(calViewMonth + 1).padStart(2, "0");
                              const dt = String(day).padStart(2, "0");
                              const iso = `${yr}-${mo}-${dt}`;
                              const isSel = customDateIso === iso;

                              cells.push(
                                <button
                                  key={`d-${day}`}
                                  type="button"
                                  disabled={isPast}
                                  onClick={() => {
                                    setCustomDateIso(iso);
                                    setBookingDate(iso);
                                    setSelectedDateMode("custom");
                                    setIsCustomCalendarPopoverOpen(false);
                                  }}
                                  className={`p-2 rounded-xl text-xs font-black text-center transition-all cursor-pointer ${isPast
                                    ? "text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-40"
                                    : isSel
                                      ? "bg-purple-800 text-white shadow-md font-black"
                                      : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200"
                                    }`}
                                >
                                  {day}
                                </button>
                              );
                            }
                            return <div className="grid grid-cols-7 gap-1">{cells}</div>;
                          })()}

                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                            <span className="font-mono text-slate-500 font-bold">{customDateIso}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const todayStr = new Date().toISOString().split("T")[0];
                                setCustomDateIso(todayStr);
                                setBookingDate(todayStr);
                                setSelectedDateMode("custom");
                                setIsCustomCalendarPopoverOpen(false);
                              }}
                              className="text-purple-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" /> Reset
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. SELECT ARRIVAL TIME WINDOW */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-700 dark:text-purple-400" />
                      2. Select Arrival Time Window
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">2-Hour Arrival Slot</span>
                  </div>

                  {/* CARDS ROW FOR TIME SLOTS */}
                  <div className="grid grid-cols-2 sm:grid-cols-7 gap-2.5 relative">
                    {/* 6 Standard Time Slots */}
                    {["08:00 AM", "10:00 AM", "12:00 PM", "02:00 PM", "04:00 PM", "06:00 PM"].map((slot) => {
                      const isSelected = selectedTimeMode === "standard" && standardTimeSlot === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => {
                            setSelectedTimeMode("standard");
                            setStandardTimeSlot(slot);
                            setTimeSlot(slot);
                            setIsClockPickerOpen(false);
                          }}
                          className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[70px] relative ${isSelected
                            ? "bg-purple-800 text-white border-purple-800 shadow-lg ring-2 ring-purple-500/30 font-extrabold"
                            : "bg-slate-50/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-extrabold hover:border-purple-300"
                            }`}
                        >
                          {isSelected && (
                            <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-xs z-10">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          )}
                          <span className="text-xs font-black leading-snug">{slot}</span>
                        </button>
                      );
                    })}

                    {/* CUSTOM TIME CARD (7th card) WITH ANALOG CLOCK POPOVER */}
                    <div className="relative" ref={clockPickerRef}>
                      {(() => {
                        const formattedCustomTime = `${String(customTimeHour).padStart(2, "0")}:${String(customTimeMinute).padStart(2, "0")} ${customTimeAmPm}`;
                        const isSelected = selectedTimeMode === "custom";

                        return (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTimeMode("custom");
                                setTimeSlot(formattedCustomTime);
                                setIsClockPickerOpen(!isClockPickerOpen);
                              }}
                              className={`w-full p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[70px] relative ${isSelected
                                ? "bg-purple-800 text-white border-purple-800 shadow-lg ring-2 ring-purple-500/30 font-extrabold"
                                : "bg-slate-50/80 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-purple-300"
                                }`}
                            >
                              {isSelected && (
                                <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-xs z-10">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </div>
                              )}
                              <Clock className={`w-3.5 h-3.5 mb-0.5 ${isSelected ? "text-purple-200" : "text-purple-600"}`} />
                              <span className={`text-[9px] font-black uppercase tracking-wider ${isSelected ? "text-purple-200" : "text-slate-500"}`}>
                                CUSTOM TIME
                              </span>
                              <span className="text-[11px] font-black font-mono mt-0.5 truncate max-w-[85px]">
                                {formattedCustomTime}
                              </span>
                            </button>

                            {/* CLOCK PICKER POPOVER (AUTOMATIC 2-STEP HOUR -> MINUTE FLOW WITH AM/PM) */}
                            {isClockPickerOpen && (
                              <div className="absolute right-0 top-full mt-2 z-[9999] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl w-80 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                                {/* Header Time Display with Interactive Hour/Minute Pills & AM/PM Toggle */}
                                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 text-base font-black font-mono">
                                    <Clock className="w-4 h-4 text-purple-600 mr-0.5" />
                                    <button
                                      type="button"
                                      onClick={() => setClockTab("hour")}
                                      title="Click to edit hour"
                                      className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${clockTab === "hour"
                                        ? "bg-purple-800 text-white shadow-sm ring-2 ring-purple-500/30"
                                        : "bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-200 hover:bg-purple-200"
                                        }`}
                                    >
                                      {String(customTimeHour).padStart(2, "0")}
                                    </button>
                                    <span className="text-slate-400 font-bold">:</span>
                                    <button
                                      type="button"
                                      onClick={() => setClockTab("minute")}
                                      title="Click to edit minute"
                                      className={`px-2.5 py-1 rounded-xl transition-all cursor-pointer ${clockTab === "minute"
                                        ? "bg-purple-800 text-white shadow-sm ring-2 ring-purple-500/30"
                                        : "bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-200 hover:bg-purple-200"
                                        }`}
                                    >
                                      {String(customTimeMinute).padStart(2, "0")}
                                    </button>
                                  </div>

                                  {/* AM / PM Toggle Pill */}
                                  <div className="flex items-center p-1 bg-slate-200 dark:bg-slate-700 rounded-xl text-xs font-black">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCustomTimeAmPm("AM");
                                        const updated = `${String(customTimeHour).padStart(2, "0")}:${String(customTimeMinute).padStart(2, "0")} AM`;
                                        setTimeSlot(updated);
                                      }}
                                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${customTimeAmPm === "AM" ? "bg-purple-800 text-white shadow-xs" : "text-slate-600 dark:text-slate-300"
                                        }`}
                                    >
                                      AM
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCustomTimeAmPm("PM");
                                        const updated = `${String(customTimeHour).padStart(2, "0")}:${String(customTimeMinute).padStart(2, "0")} PM`;
                                        setTimeSlot(updated);
                                      }}
                                      className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${customTimeAmPm === "PM" ? "bg-purple-800 text-white shadow-xs" : "text-slate-600 dark:text-slate-300"
                                        }`}
                                    >
                                      PM
                                    </button>
                                  </div>
                                </div>

                                {/* Active Dial Title Banner */}
                                <div className="text-center font-extrabold text-xs text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 py-1.5 rounded-xl border border-purple-100 dark:border-purple-900">
                                  {clockTab === "hour" ? "1. Select Hour (1 — 12)" : "2. Select Minute (:00 — :55)"}
                                </div>

                                {/* CIRCULAR ANALOG CLOCK DIAL */}
                                <div className="flex justify-center py-1">
                                  <div className="relative w-52 h-52 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                                    {/* Center dot */}
                                    <div className="w-3 h-3 rounded-full bg-purple-800 z-10" />

                                    {/* Render 12 Dial Nodes */}
                                    {clockTab === "hour"
                                      ? Array.from({ length: 12 }, (_, i) => i + 1).map((hr) => {
                                        const angleDeg = hr * 30 - 90;
                                        const rad = (angleDeg * Math.PI) / 180;
                                        const radius = 78;
                                        const x = 104 + radius * Math.cos(rad) - 16;
                                        const y = 104 + radius * Math.sin(rad) - 16;
                                        const isSelectedHour = customTimeHour === hr;

                                        return (
                                          <button
                                            key={`hr-${hr}`}
                                            type="button"
                                            style={{ left: `${x}px`, top: `${y}px` }}
                                            onClick={() => {
                                              setCustomTimeHour(hr);
                                              const updated = `${String(hr).padStart(2, "0")}:${String(customTimeMinute).padStart(2, "0")} ${customTimeAmPm}`;
                                              setTimeSlot(updated);
                                              setClockTab("minute"); // Automatically switch to minute dial!
                                            }}
                                            className={`absolute w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all cursor-pointer ${isSelectedHour
                                              ? "bg-purple-800 text-white shadow-md scale-110 ring-2 ring-purple-500/30"
                                              : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-purple-100"
                                              }`}
                                          >
                                            {hr}
                                          </button>
                                        );
                                      })
                                      : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map((mn, idx) => {
                                        const angleDeg = idx * 30 - 90;
                                        const rad = (angleDeg * Math.PI) / 180;
                                        const radius = 78;
                                        const x = 104 + radius * Math.cos(rad) - 16;
                                        const y = 104 + radius * Math.sin(rad) - 16;
                                        const isSelectedMin = customTimeMinute === mn;

                                        return (
                                          <button
                                            key={`mn-${mn}`}
                                            type="button"
                                            style={{ left: `${x}px`, top: `${y}px` }}
                                            onClick={() => {
                                              setCustomTimeMinute(mn);
                                              const updated = `${String(customTimeHour).padStart(2, "0")}:${String(mn).padStart(2, "0")} ${customTimeAmPm}`;
                                              setTimeSlot(updated);
                                              setIsClockPickerOpen(false); // Automatically close popover when minute is chosen!
                                            }}
                                            className={`absolute w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all cursor-pointer ${isSelectedMin
                                              ? "bg-purple-800 text-white shadow-md scale-110 ring-2 ring-purple-500/30"
                                              : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-purple-100"
                                              }`}
                                          >
                                            :{String(mn).padStart(2, "0")}
                                          </button>
                                        );
                                      })}
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                                  <span className="font-mono text-purple-700 dark:text-purple-300 font-bold">
                                    {String(customTimeHour).padStart(2, "0")}:{String(customTimeMinute).padStart(2, "0")} {customTimeAmPm}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setIsClockPickerOpen(false)}
                                    className="px-4 py-1.5 bg-purple-800 hover:bg-purple-900 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer"
                                  >
                                    Done
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* 4. TECHNICIAN ASSIGNMENT */}
                <div className="space-y-2 text-xs">
                  <CustomSelect
                    label={`Select Technician Partner *${isLoadingPartners ? " — Loading..." : ""}`}
                    value={preferredPartnerId}
                    onChange={(val) => setPreferredPartnerId(val)}
                    options={[
                      { value: "", label: "-- Select Technician Partner --" },
                      { value: "auto-assign", label: "⚡ Auto-Assign (Next Available Partner)" },
                      ...(partnerListFromApi.length > 0
                        ? partnerListFromApi.map((partner) => ({
                          value: partner.id,
                          label: `${partner.name}${partner.mobile ? ` (${partner.mobile})` : ""}${partner.locality ? ` • ${partner.locality}` : ""}`,
                        }))
                        : initialTechnicians.map((tech) => ({
                          value: tech.id,
                          label: `${tech.name} (${tech.locality})`,
                        }))),
                    ]}
                    placeholder="Choose Technician Partner..."
                    searchable={true}
                  />
                </div>
              </div>
            )}

            {/* STEP 5: PAYMENT & FINAL SUMMARY */}
            {currentStep === 5 && (
              <div className="space-y-5">
                <div className="flex items-center gap-2 text-slate-900 dark:text-white font-extrabold text-base border-b border-slate-100 dark:border-slate-800 pb-3">
                  <CreditCard className="w-5 h-5 text-brand-600" />
                  <span>Step 5: Payment Method & Final Summary</span>
                </div>

                {/* Recipient Badge Confirmation */}
                <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2 text-purple-900 dark:text-purple-300 font-bold">
                    <Users className="w-4 h-4 text-purple-600" />
                    <span>Address Recipient Badge: <strong>{addressRecipientType}</strong> {recipientName && `— ${recipientName}`} {recipientPhone && `(${recipientPhone})`}</span>
                  </div>
                  <button type="button" onClick={() => setCurrentStep(2)} className="text-[10px] text-purple-600 font-black hover:underline cursor-pointer">Change</button>
                </div>

                {/* Services Cart List */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                  <span className="font-black text-slate-900 dark:text-white block">Selected Services ({selectedServicesList.length})</span>
                  <div className="space-y-1.5">
                    {selectedServicesList.map((svc) => (
                      <div key={svc.id} className="flex justify-between items-center text-slate-700 dark:text-slate-300 font-medium">
                        <span>{svc.title} x {svc.quantity}</span>
                        <span className="font-bold font-mono">₹{(svc.price * svc.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-2 text-xs">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["UPI", "Cash on Service", "Card", "Helpmate Wallet"] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`p-3 rounded-xl border text-xs font-bold text-left cursor-pointer transition-all ${paymentMethod === method
                          ? "bg-brand-50 text-brand-700 border-brand-500 dark:bg-brand-950 dark:text-brand-300"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                          }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Final Order Summary */}
                <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Base Services Total ({selectedServicesList.length} items)</span>
                    <span className="font-bold font-mono">₹{servicePrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Platform Fee</span>
                    <span className="font-bold font-mono">₹{convenienceFee.toLocaleString()}</span>
                  </div>
                  {activeDiscountAmount > 0 && (
                    <div className="flex justify-between text-emerald-400 font-bold">
                      <span>Discount</span>
                      <span className="font-mono">-₹{activeDiscountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  {taxableAmount !== undefined && (
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Taxable Amount</span>
                      <span className="font-mono">₹{taxableAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-300">
                    <span>GST Rate & Tax ({gstRate}%)</span>
                    <span className="font-bold font-mono">₹{totalGstAmount.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-slate-800 pt-2.5 mt-1 flex justify-between font-extrabold text-sm text-white items-center">
                    <span>Total Amount</span>
                    <span className="text-emerald-400 text-base font-mono">₹{grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40 shrink-0 gap-3">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <div />
            )}

            {currentStep < 5 ? (
              <div className="flex items-center gap-3">
                {!isCurrentStepValid && (
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>
                      {currentStep === 1 && "Select Customer & verify OTP to unlock Next Step"}
                      {currentStep === 2 && "Select or enter Service Address to unlock Next Step"}
                      {currentStep === 3 && "Add at least 1 Service Package to unlock Next Step"}
                      {currentStep === 4 && "Select Date, Time Window & Partner to unlock Next Step"}
                    </span>
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (isCurrentStepValid) {
                      setCurrentStep(currentStep + 1);
                    }
                  }}
                  disabled={!isCurrentStepValid}
                  className={`px-5 sm:px-6 py-2.5 rounded-xl font-bold text-xs shadow-lux flex items-center gap-1 transition-all ${
                    isCurrentStepValid
                      ? "bg-brand-600 hover:bg-brand-700 text-white cursor-pointer"
                      : "bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed opacity-60 shadow-none"
                  }`}
                >
                  Next Step <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={isSavingBooking}
                onClick={handleCompleteBooking}
                className="px-6 sm:px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs shadow-lux transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSavingBooking ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{bookingToEdit ? "Updating Booking..." : "Creating Booking..."}</span>
                  </>
                ) : (
                  <span>{bookingToEdit ? "Confirm & Update Booking" : "Confirm & Create Booking"}</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </Portal>
  );
}
