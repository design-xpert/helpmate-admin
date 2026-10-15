"use client";

import { useState, useEffect, useRef, Suspense, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { initialTechnicians, varanasiLocalities } from "@/lib/mockData";
import { CustomSelect } from "@/components/CustomSelect";
import { Portal } from "@/components/Portal";
import { toast } from "@/components/Toast";
import {
  getCategoriesApi,
  getServiceActionsApi,
  getServiceActionDropdownApi,
  getPackagesApi,
  getLocalitiesApi,
  getLocalityDropdownApi,
  getPartnerByIdApi,
  createPartnerApi,
  updatePartnerApi,
  sendPartnerMobileOtpApi,
  verifyPartnerMobileOtpApi,
  sendGuarantorMobileOtpApi,
  verifyGuarantorMobileOtpApi,
  formatImageUrl,
  ApiCategory,
  ApiServiceAction,
  ApiLocality,
  CreatePartnerPayload,
} from "@/lib/api";
import {
  ArrowLeft,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Building,
  Briefcase,
  Upload,
  ArrowRight,
  Wallet,
  FileCheck,
  ChevronRight,
  User,
  BadgeCheck,
  Layers,
  XCircle,
  Plus,
  Trash2,
  Wrench,
  Filter,
  Check,
  X,
  FileText,
  Search,
  ChevronDown,
  RotateCw,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Crop,
  Move,
} from "lucide-react";

export interface CatalogServiceItem {
  id: string;
  serviceActionId?: string;
  category: string;
  subType?: string; // Split AC, Window AC, Cassette AC, RO Purifier, etc.
  type: "Repair & Troubleshooting" | "Installation & Uninstallation" | "Servicing & Deep Cleaning" | "Maintenance & AMC" | string;
  title: string;
  price: number;
  image: string;
  desc: string;
  isPackage?: boolean;
}

export const CATEGORY_SUB_TYPES: Record<string, string[]> = {
  "AC Repair & Service": ["Split AC", "Window AC", "Cassette AC", "Tower AC"],
  "Water Purifier (RO)": ["Wall-mounted RO", "Under-sink RO", "UV+UF Purifier"],
  "Electrician & Wiring": ["Switchboard & MCB", "Inverter & Battery", "Decorative Lighting"],
  "Plumbing & Sanitary": ["Overhead Tank", "Bathroom Fittings", "Drainage Pipeline"],
  "Appliance Repair": ["Front Load Washing Machine", "Top Load Washing Machine", "Double Door Refrigerator", "Single Door Refrigerator"],
};

export const MASTER_SERVICE_CATALOG: CatalogServiceItem[] = [
  // 1. AC Service & Repair
  {
    id: "ac-srv-1",
    category: "AC Repair & Service",
    subType: "Split AC",
    type: "Servicing & Deep Cleaning",
    title: "Split AC Power Jet Servicing",
    price: 599,
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop&q=80",
    desc: "High pressure water jet coil cleaning & anti-bacterial sanitization",
  },
  {
    id: "ac-srv-2",
    category: "AC Repair & Service",
    subType: "Window AC",
    type: "Servicing & Deep Cleaning",
    title: "Window AC Foam Chemical Wash",
    price: 499,
    image: "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=400&auto=format&fit=crop&q=80",
    desc: "Deep chemical foam washing & drain tray cleaning",
  },
  {
    id: "ac-rep-1",
    category: "AC Repair & Service",
    subType: "Split AC",
    type: "Repair & Troubleshooting",
    title: "Split AC Gas Charging & Copper Brazing",
    price: 2200,
    image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&auto=format&fit=crop&q=80",
    desc: "Freon R32 / R410a gas top-up & copper pipe brazing leak test",
  },
  {
    id: "ac-rep-2",
    category: "AC Repair & Service",
    subType: "Split AC",
    type: "Repair & Troubleshooting",
    title: "AC Inverter PCB Board Repair",
    price: 1499,
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=80",
    desc: "Microcontroller IC diagnostic & relay capacitor replacement",
  },
  {
    id: "ac-inst-1",
    category: "AC Repair & Service",
    subType: "Split AC",
    type: "Installation & Uninstallation",
    title: "Split AC Complete Wall Mount Installation",
    price: 1299,
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop&q=80",
    desc: "Indoor & outdoor bracket mounting with vacuum testing",
  },
  {
    id: "ac-inst-2",
    category: "AC Repair & Service",
    subType: "Split AC",
    type: "Installation & Uninstallation",
    title: "Split AC Dismantling / Safe Uninstallation",
    price: 699,
    image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&auto=format&fit=crop&q=80",
    desc: "Pump-down gas lock & safe indoor unit dismantling",
  },
  {
    id: "ac-rep-3",
    category: "AC Repair & Service",
    subType: "Window AC",
    type: "Repair & Troubleshooting",
    title: "Window AC Gas Filling & Compressor Relay",
    price: 1899,
    image: "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=400&auto=format&fit=crop&q=80",
    desc: "Sealed compressor gas charging and thermal overload protector replacement",
  },
  {
    id: "ac-inst-3",
    category: "AC Repair & Service",
    subType: "Window AC",
    type: "Installation & Uninstallation",
    title: "Window AC Bracket & Frame Mounting",
    price: 799,
    image: "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=400&auto=format&fit=crop&q=80",
    desc: "Heavy metal bracket fitting and wooden frame sealing",
  },
  {
    id: "ac-srv-3",
    category: "AC Repair & Service",
    subType: "Cassette AC",
    type: "Servicing & Deep Cleaning",
    title: "Cassette / Tower AC Commercial Jet Service",
    price: 1299,
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop&q=80",
    desc: "Commercial 4-way cassette indoor coil jet wash & drain pump fix",
  },

  // 2. Water Purifier (RO)
  {
    id: "ro-srv-1",
    category: "Water Purifier (RO)",
    subType: "Wall-mounted RO",
    type: "Servicing & Deep Cleaning",
    title: "RO Full Filter & Membrane Replacement",
    price: 899,
    image: "https://images.unsplash.com/photo-1548839140-29a749e1cf4e?w=400&auto=format&fit=crop&q=80",
    desc: "Sediment, Carbon filter & RO Membrane sanitization",
  },
  {
    id: "ro-rep-1",
    category: "Water Purifier (RO)",
    subType: "Under-sink RO",
    type: "Repair & Troubleshooting",
    title: "RO Booster Pump & UV Lamp Repair",
    price: 1199,
    image: "https://images.unsplash.com/photo-1617155093730-a8bf47be792d?w=400&auto=format&fit=crop&q=80",
    desc: "Adapter SMPS replacement & solenoid valve repair",
  },

  // 3. Electrician & Wiring
  {
    id: "elec-rep-1",
    category: "Electrician & Wiring",
    subType: "Switchboard & MCB",
    type: "Repair & Troubleshooting",
    title: "MCB & Main Switchboard Tripping Repair",
    price: 299,
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop&q=80",
    desc: "Short circuit detection & MCB breaker replacement",
  },
  {
    id: "elec-inst-1",
    category: "Electrician & Wiring",
    subType: "Inverter & Battery",
    type: "Installation & Uninstallation",
    title: "Heavy Inverter & Double Battery Setup",
    price: 799,
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&auto=format&fit=crop&q=80",
    desc: "Dual battery terminal wiring & load distribution line",
  },

  // 4. Plumbing & Sanitary
  {
    id: "plumb-rep-1",
    category: "Plumbing & Sanitary",
    subType: "Overhead Tank",
    type: "Repair & Troubleshooting",
    title: "Overhead Tank Leakage & Motor Line Repair",
    price: 499,
    image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&auto=format&fit=crop&q=80",
    desc: "Automatic float valve & CPVC line repair",
  },
  {
    id: "plumb-inst-1",
    category: "Plumbing & Sanitary",
    subType: "Bathroom Fittings",
    type: "Installation & Uninstallation",
    title: "Bathroom Mixer & Shower Concealed Fitting",
    price: 699,
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&auto=format&fit=crop&q=80",
    desc: "Wall mixer fitting & high pressure overhead shower",
  },

  // 5. Appliance Repair
  {
    id: "app-rep-1",
    category: "Appliance Repair",
    subType: "Front Load Washing Machine",
    type: "Repair & Troubleshooting",
    title: "Front Load Washing Machine Drum Repair",
    price: 1299,
    image: "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&auto=format&fit=crop&q=80",
    desc: "Motor belt, spider assembly & electronic PCB fix",
  },
  {
    id: "app-rep-2",
    category: "Appliance Repair",
    subType: "Double Door Refrigerator",
    type: "Repair & Troubleshooting",
    title: "Double Door Refrigerator Gas Charging",
    price: 1899,
    image: "https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400&auto=format&fit=crop&q=80",
    desc: "Compressor relay check & sealed system gas filling",
  },
];

export const VARANASI_PINCODE_ZONES = [
  { pincode: "221001", area: "Sigra, Luxa & Chetganj" },
  { pincode: "221002", area: "Varanasi Cantt, Nadesar & Mint House" },
  { pincode: "221003", area: "Godowlia, Chowk & Dashashwamedh Old City" },
  { pincode: "221004", area: "Mahmoorganj, Shivpur & Orderly Bazar" },
  { pincode: "221005", area: "Lanka, BHU & Assi Ghat" },
  { pincode: "221006", area: "Sarnath, Paharia & Ring Road" },
  { pincode: "221007", area: "Pandeypur, Hukulganj & Azamgarh Road" },
  { pincode: "221010", area: "Bhelupur, Sonarpura & Durgakund" },
];

function TechnicianFormContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id") || searchParams.get("edit");
  const isEditing = pathname.includes("/edit") || Boolean(editId);

  // 4-Stage Stepper: 1 = Personal & Bank, 2 = Service & Zone, 3 = KYC & Guarantor, 4 = Review & Submit
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // ─── API STATE: CATEGORIES, SERVICE ACTIONS, PACKAGES & LOCALITIES ───
  const [apiCategories, setApiCategories] = useState<ApiCategory[]>([]);
  const [apiServiceActions, setApiServiceActions] = useState<ApiServiceAction[]>([]);
  const [allServiceActionsMaster, setAllServiceActionsMaster] = useState<ApiServiceAction[]>([]);
  const [apiPackages, setApiPackages] = useState<any[]>([]);
  const [apiLocalities, setApiLocalities] = useState<ApiLocality[]>([]);
  const [allLocalitiesMaster, setAllLocalitiesMaster] = useState<ApiLocality[]>([]);
  const [selectedServiceActionIds, setSelectedServiceActionIds] = useState<string[]>([]);
  const [selectedServicePincodeIds, setSelectedServicePincodeIds] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchApiOptions = async () => {
      try {
        const [catRes, actionsRes, pkgRes, locRes] = await Promise.all([
          getCategoriesApi(),
          getServiceActionsApi(),
          getPackagesApi(),
          getLocalityDropdownApi(),
        ]);
        if (isMounted) {
          if (catRes && catRes.success && Array.isArray(catRes.data)) {
            setApiCategories(catRes.data);
          }
          if (actionsRes && actionsRes.success && Array.isArray(actionsRes.data)) {
            setApiServiceActions(actionsRes.data);
            setAllServiceActionsMaster(actionsRes.data);
          }
          if (pkgRes && pkgRes.success && Array.isArray(pkgRes.data)) {
            setApiPackages(pkgRes.data);
          }
          if (locRes && locRes.success && Array.isArray(locRes.data)) {
            setApiLocalities(locRes.data);
            setAllLocalitiesMaster(locRes.data);
          }
        }
      } catch (err) {
        console.error("Failed to load partner form API options:", err);
      }
    };
    fetchApiOptions();
    return () => {
      isMounted = false;
    };
  }, []);

  // ─── STEP 1 STATE: PERSONAL & BANK DETAILS ───
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState("");
  const [showPhoneOtpInput, setShowPhoneOtpInput] = useState(false);
  const [mobileVerificationToken, setMobileVerificationToken] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const [isEditLoading, setIsEditLoading] = useState<boolean>(Boolean(editId));

  // Bank Details
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [upiId, setUpiId] = useState("");

  // ─── STEP 2 STATE: HIERARCHICAL MULTI-SELECT SERVICE & AREA-TO-AREA ZONE ───
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All");
  const [selectedSubTypeFilters, setSelectedSubTypeFilters] = useState<string[]>([]);
  const [selectedTypeFilters, setSelectedTypeFilters] = useState<string[]>([]);
  
  // Search & Dropdown State
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [typeSearchQuery, setTypeSearchQuery] = useState("");
  const [subTypeSearchQuery, setSubTypeSearchQuery] = useState("");
  const [serviceSearchQuery, setServiceSearchQuery] = useState("");
  const [pincodeSearchQuery, setPincodeSearchQuery] = useState("");

  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isSubTypeDropdownOpen, setIsSubTypeDropdownOpen] = useState(false);
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
  const [isPincodeDropdownOpen, setIsPincodeDropdownOpen] = useState(false);

  // Helper to open one dropdown while closing all others
  const toggleDropdown = (name: "category" | "subType" | "type" | "service" | "pincode") => {
    setIsCategoryDropdownOpen(name === "category" ? !isCategoryDropdownOpen : false);
    setIsSubTypeDropdownOpen(name === "subType" ? !isSubTypeDropdownOpen : false);
    setIsTypeDropdownOpen(name === "type" ? !isTypeDropdownOpen : false);
    setIsServiceDropdownOpen(name === "service" ? !isServiceDropdownOpen : false);
    setIsPincodeDropdownOpen(name === "pincode" ? !isPincodeDropdownOpen : false);
  };

  const categoryRef = useRef<HTMLDivElement>(null);
  const subTypeRef = useRef<HTMLDivElement>(null);
  const typeRef = useRef<HTMLDivElement>(null);
  const serviceRef = useRef<HTMLDivElement>(null);
  const pincodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const isOutsideCategory = !categoryRef.current || !categoryRef.current.contains(target);
      const isOutsideSubType = !subTypeRef.current || !subTypeRef.current.contains(target);
      const isOutsideType = !typeRef.current || !typeRef.current.contains(target);
      const isOutsideService = !serviceRef.current || !serviceRef.current.contains(target);
      const isOutsidePincode = !pincodeRef.current || !pincodeRef.current.contains(target);

      if (isOutsideCategory && isOutsideSubType && isOutsideType && isOutsideService && isOutsidePincode) {
        setIsCategoryDropdownOpen(false);
        setIsSubTypeDropdownOpen(false);
        setIsTypeDropdownOpen(false);
        setIsServiceDropdownOpen(false);
        setIsPincodeDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const [selectedServices, setSelectedServices] = useState<CatalogServiceItem[]>([]);

  // Pincode Service Areas (Multi-select)
  const [customPincodeInput, setCustomPincodeInput] = useState("");
  const [isPincodeModalOpen, setIsPincodeModalOpen] = useState(false);
  const [modalCustomPincode, setModalCustomPincode] = useState("");
  const [modalCustomArea, setModalCustomArea] = useState("");
  const [coverageZones, setCoverageZones] = useState<string[]>([]);

  const handleAddCustomPincode = () => {
    if (!customPincodeInput.trim()) return;
    const pin = customPincodeInput.trim();
    const pinLabel = pin.length === 6 ? `${pin} - Custom Area` : pin;
    if (!coverageZones.includes(pinLabel)) {
      setCoverageZones([...coverageZones, pinLabel]);
    }
    setCustomPincodeInput("");
  };

  // ─── DYNAMIC API DERIVED LISTS & HANDLERS FOR STEP 2 ───
  const selectedCategoryObj = useMemo(() => {
    if (!selectedCategoryFilter || selectedCategoryFilter === "All") return null;
    return apiCategories.find(
      (c) => c._id === selectedCategoryFilter || c.categoryName.toLowerCase() === selectedCategoryFilter.toLowerCase()
    ) || null;
  }, [apiCategories, selectedCategoryFilter]);

  const selectedSubCategoryObj = useMemo(() => {
    if (!selectedCategoryObj || selectedSubTypeFilters.length === 0) return null;
    const subName = selectedSubTypeFilters[0];
    const subs = selectedCategoryObj.subCategories || [];
    return subs.find((s: any) => s._id === subName || s.name.toLowerCase() === subName.toLowerCase()) || null;
  }, [selectedCategoryObj, selectedSubTypeFilters]);

  const selectedServiceActionObj = useMemo(() => {
    if (selectedTypeFilters.length === 0) return null;
    const actName = selectedTypeFilters[0];
    return apiServiceActions.find(
      (a: any) => a._id === actName || a.serviceAction?.toLowerCase() === actName.toLowerCase() || a.name?.toLowerCase() === actName.toLowerCase()
    ) || null;
  }, [apiServiceActions, selectedTypeFilters]);

  // Re-fetch Service Actions & Packages dynamically when selection changes
  useEffect(() => {
    let isCancelled = false;
    const updateStep2Options = async () => {
      try {
        const categoryId = selectedCategoryObj?._id || "";
        const subCategoryId = selectedSubCategoryObj?._id || "";
        const serviceActionId = selectedServiceActionObj?._id || "";
        const categoryName = selectedCategoryObj?.categoryName || "";
        const subCategoryName = selectedSubCategoryObj?.name || "";

        // 1. Fetch Service Actions: GET /api/service-action/dropdown?categoryId=...&subCategoryId=...
        if (categoryId) {
          const actionParams: { categoryId: string; subCategoryId?: string } = { categoryId };
          if (subCategoryId) actionParams.subCategoryId = subCategoryId;
          const actionsRes = await getServiceActionDropdownApi(actionParams);
          if (!isCancelled && actionsRes && actionsRes.success && Array.isArray(actionsRes.data)) {
            setApiServiceActions(actionsRes.data);
            setAllServiceActionsMaster((prev) => {
              const existingIds = new Set(prev.map((a) => a._id));
              const newItems = actionsRes.data.filter((a: ApiServiceAction) => a._id && !existingIds.has(a._id));
              return newItems.length > 0 ? [...prev, ...newItems] : prev;
            });
          }
        }

        // 2. Fetch Packages: GET /api/package?serviceActionId=...&categoryId=...&subCategoryId=...&categoryName=...&subCategoryName=...&limit=100
        const pkgParams: any = { limit: 100 };
        if (serviceActionId) pkgParams.serviceActionId = serviceActionId;
        if (categoryId) pkgParams.categoryId = categoryId;
        if (subCategoryId) pkgParams.subCategoryId = subCategoryId;
        if (categoryName) pkgParams.categoryName = categoryName;
        if (subCategoryName) pkgParams.subCategoryName = subCategoryName;

        const pkgRes = await getPackagesApi(pkgParams);
        if (!isCancelled && pkgRes && pkgRes.success && Array.isArray(pkgRes.data)) {
          setApiPackages(pkgRes.data);
        }
      } catch (err) {
        console.error("Error updating Step 2 API options:", err);
      }
    };

    updateStep2Options();
    return () => {
      isCancelled = true;
    };
  }, [selectedCategoryObj, selectedSubCategoryObj, selectedServiceActionObj]);

  const categoryList = useMemo(() => {
    if (apiCategories.length > 0) {
      return ["All", ...apiCategories.map((c) => c.categoryName)];
    }
    return ["All"];
  }, [apiCategories]);

  const subCategoryList = useMemo(() => {
    if (!selectedCategoryObj || !Array.isArray(selectedCategoryObj.subCategories)) return [];
    return selectedCategoryObj.subCategories.map((s) => s.name);
  }, [selectedCategoryObj]);

  const availableServiceCatalogItems = useMemo(() => {
    const items: CatalogServiceItem[] = [];

    if (apiPackages.length > 0) {
      apiPackages.forEach((pkg: any) => {
        let saObj = typeof pkg.serviceActionId === "object" ? pkg.serviceActionId : null;
        if (!saObj && typeof pkg.serviceAction === "object") {
          saObj = pkg.serviceAction;
        }
        if (!saObj && Array.isArray(pkg.serviceActions) && pkg.serviceActions.length > 0) {
          saObj = typeof pkg.serviceActions[0] === "object" ? pkg.serviceActions[0] : null;
        }

        let saId = "";
        if (saObj && saObj._id) {
          saId = saObj._id;
        } else if (typeof pkg.serviceActionId === "string" && pkg.serviceActionId) {
          saId = pkg.serviceActionId;
        } else if (typeof pkg.serviceAction === "string" && pkg.serviceAction) {
          saId = pkg.serviceAction;
        } else if (Array.isArray(pkg.serviceActions) && pkg.serviceActions.length > 0 && typeof pkg.serviceActions[0] === "string") {
          saId = pkg.serviceActions[0];
        }

        const saName = saObj?.serviceAction || saObj?.name || "Package Service";

        let catName = "";
        if (typeof pkg.category === "object" && pkg.category?.categoryName) {
          catName = pkg.category.categoryName;
        } else if (pkg.categoryName) {
          catName = pkg.categoryName;
        } else if (saObj?.categoryId && typeof saObj.categoryId === "object" && saObj.categoryId?.categoryName) {
          catName = saObj.categoryId.categoryName;
        } else if (saObj?.categoryName) {
          catName = saObj.categoryName;
        }
        if (!catName) catName = selectedCategoryObj?.categoryName || "Packages";

        let subName = "";
        if (typeof pkg.subCategory === "object" && pkg.subCategory?.name) {
          subName = pkg.subCategory.name;
        } else if (pkg.subCategoryName) {
          subName = pkg.subCategoryName;
        } else if (saObj?.subCategoryId && typeof saObj.subCategoryId === "object" && saObj.subCategoryId?.name) {
          subName = saObj.subCategoryId.name;
        }

        const rawPkgImg = pkg.imageUrl || pkg.thumbnailUrl || pkg.image || pkg.iconUrl || pkg.icon;
        const formattedPkgImg = formatImageUrl(rawPkgImg);
        items.push({
          id: pkg._id,
          serviceActionId: saId || pkg._id,
          category: catName,
          subType: subName || undefined,
          type: saName,
          title: pkg.packageName || pkg.title || "Package Service",
          price: Number(pkg.price) || Number(pkg.originalPrice) || 499,
          image: formattedPkgImg || "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=400&auto=format&fit=crop&q=80",
          desc: pkg.description || pkg.subtitle || "Complete service package",
          isPackage: true,
        });
      });
    }

    if (apiServiceActions.length > 0) {
      apiServiceActions.forEach((act: any) => {
        const catName = typeof act.categoryId === "object" ? act.categoryId?.categoryName : (act.categoryName || selectedCategoryObj?.categoryName || "General Service");
        const subName = typeof act.subCategoryId === "object" ? act.subCategoryId?.name : (act.subCategoryName || "");
        const rawActImg = act.imageUrl || act.thumbnailUrl || act.image || act.iconUrl || act.icon;
        const formattedActImg = formatImageUrl(rawActImg);
        items.push({
          id: act._id,
          serviceActionId: act._id,
          category: catName || "General Service",
          subType: subName || undefined,
          type: (act.serviceAction as any) || "Service Action",
          title: act.serviceAction || act.name || "Service Action",
          price: Number(act.price) || Number(act.originalPrice) || 499,
          image: formattedActImg || "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop&q=80",
          desc: act.description || `${act.serviceAction || "Service"} action`,
          isPackage: false,
        });
      });
    }

    return items;
  }, [apiPackages, apiServiceActions, selectedCategoryObj]);

  const availablePincodeZones = useMemo(() => {
    if (apiLocalities.length > 0) {
      return apiLocalities.map((loc) => ({
        id: loc._id,
        pincode: loc.pincode,
        area: loc.localityName,
        label: `${loc.pincode} - ${loc.localityName}`,
      }));
    }
    return [];
  }, [apiLocalities]);

  const isItemSelected = (item: CatalogServiceItem) => {
    return (
      selectedServices.some((s) => s.id === item.id) ||
      selectedServiceActionIds.includes(item.id)
    );
  };

  const toggleServiceSelection = (item: CatalogServiceItem) => {
    const isSelected = isItemSelected(item);

    if (isSelected) {
      setSelectedServices((prev) => prev.filter((s) => s.id !== item.id));
      setSelectedServiceActionIds((prev) => prev.filter((id) => id !== item.id));
    } else {
      setSelectedServices((prev) => [...prev, item]);
      setSelectedServiceActionIds((prev) => {
        if (!prev.includes(item.id)) return [...prev, item.id];
        return prev;
      });
    }
  };

  const togglePincodeSelection = (zone: { id: string; pincode: string; area: string; label: string }) => {
    const isSelected = selectedServicePincodeIds.includes(zone.id) || coverageZones.some((z) => z.includes(zone.pincode));
    if (isSelected) {
      setSelectedServicePincodeIds(selectedServicePincodeIds.filter((id) => id !== zone.id));
      setCoverageZones(coverageZones.filter((z) => !z.includes(zone.pincode)));
    } else {
      if (zone.id && !zone.id.startsWith("mock-")) {
        setSelectedServicePincodeIds([...selectedServicePincodeIds, zone.id]);
      }
      if (!coverageZones.some((z) => z.includes(zone.pincode))) {
        setCoverageZones([...coverageZones, zone.label]);
      }
    }
  };

  const [role, setRole] = useState("AC Technician");
  const [experience, setExperience] = useState("5+ Years Specialist");
  const [commissionRate, setCommissionRate] = useState("25");

  // ─── STEP 3 STATE: KYC, GUARANTOR & POLICE VERIFICATION ───
  // File Input Refs
  const aadhaarFileInputRef = useRef<HTMLInputElement>(null);
  const aadhaarFrontFileInputRef = useRef<HTMLInputElement>(null);
  const aadhaarBackFileInputRef = useRef<HTMLInputElement>(null);
  const photoFileInputRef = useRef<HTMLInputElement>(null);
  const docTypeFileInputRef = useRef<HTMLInputElement>(null);

  // Partner KYC Aadhaar
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [aadhaarVerified, setAadhaarVerified] = useState(false);
  const [aadhaarDocUploaded, setAadhaarDocUploaded] = useState(false);
  const [aadhaarFileName, setAadhaarFileName] = useState("");

  const [aadhaarFrontFile, setAadhaarFrontFile] = useState<File | null>(null);
  const [aadhaarFrontUploaded, setAadhaarFrontUploaded] = useState(false);
  const [aadhaarFrontFileName, setAadhaarFrontFileName] = useState("");
  const [aadhaarFrontPreview, setAadhaarFrontPreview] = useState<string | null>(null);

  const [aadhaarBackFile, setAadhaarBackFile] = useState<File | null>(null);
  const [aadhaarBackUploaded, setAadhaarBackUploaded] = useState(false);
  const [aadhaarBackFileName, setAadhaarBackFileName] = useState("");
  const [aadhaarBackPreview, setAadhaarBackPreview] = useState<string | null>(null);

  // Additional Required Documents (Current Photo + Dynamic Dropdown Uploads)
  const [photoDocUploaded, setPhotoDocUploaded] = useState(false);
  const [photoFileName, setPhotoFileName] = useState("");
  const [passportPhotoPreview, setPassportPhotoPreview] = useState<string | null>(null);
  const [selectedDocType, setSelectedDocType] = useState("PAN Card");
  const [verificationDocFile, setVerificationDocFile] = useState<File | null>(null);
  const [additionalDocsList, setAdditionalDocsList] = useState<{ id: string; type: string; name: string; file?: File }[]>([]);

  // ─── PARTNER PROFILE IMAGE EDITOR MODAL STATE ───
  const [isImageEditorOpen, setIsImageEditorOpen] = useState(false);
  const [editorRawImage, setEditorRawImage] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropRotation, setCropRotation] = useState(0);
  const [cropOffsetX, setCropOffsetX] = useState(0);
  const [cropOffsetY, setCropOffsetY] = useState(0);
  const [editedPhotoFile, setEditedPhotoFile] = useState<File | null>(null);

  // Dragging State for Direct Cursor Repositioning
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleApplyImageCrop = () => {
    if (!editorRawImage) return;

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = editorRawImage;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const targetSize = 400;
      canvas.width = targetSize;
      canvas.height = targetSize;

      ctx.save();
      ctx.translate(targetSize / 2, targetSize / 2);
      ctx.rotate((cropRotation * Math.PI) / 180);
      ctx.scale(cropZoom, cropZoom);

      const drawWidth = targetSize;
      const drawHeight = (img.height / img.width) * targetSize;
      ctx.drawImage(
        img,
        -drawWidth / 2 + cropOffsetX,
        -drawHeight / 2 + cropOffsetY,
        drawWidth,
        drawHeight
      );

      ctx.restore();

      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      setPassportPhotoPreview(dataUrl);
      setPhotoDocUploaded(true);

      canvas.toBlob((blob) => {
        if (blob) {
          const croppedFile = new File([blob], photoFileName || "partner_profile_photo.jpg", {
            type: "image/jpeg",
          });
          setEditedPhotoFile(croppedFile);
        }
      }, "image/jpeg", 0.92);

      setIsImageEditorOpen(false);
      toast.success("Profile Photo Saved!", "Partner profile photo updated and formatted.");
    };
  };

  // Emergency Guarantor Person Details (Name & Mobile Number ONLY)
  const [guarantorName, setGuarantorName] = useState("");
  const [guarantorRelation, setGuarantorRelation] = useState("Brother");
  const [guarantorPhone, setGuarantorPhone] = useState("");
  const [guarantorPhoneVerified, setGuarantorPhoneVerified] = useState(false);
  const [guarantorOtp, setGuarantorOtp] = useState("");
  const [showGuarantorOtpInput, setShowGuarantorOtpInput] = useState(false);
  const [guarantorVerificationToken, setGuarantorVerificationToken] = useState("");

  const [isSendingPhoneOtp, setIsSendingPhoneOtp] = useState(false);
  const [isVerifyingPhoneOtp, setIsVerifyingPhoneOtp] = useState(false);
  const [isSendingGuarantorOtp, setIsSendingGuarantorOtp] = useState(false);
  const [isVerifyingGuarantorOtp, setIsVerifyingGuarantorOtp] = useState(false);

  // Police Clearance Certificate
  const [policeThanaName, setPoliceThanaName] = useState("");
  const [policeCertificateNumber, setPoliceCertificateNumber] = useState("");
  const [policeDocUploaded, setPoliceDocUploaded] = useState(false);
  const [policeVerified, setPoliceVerified] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"Active" | "Pending">("Active");
  const [successMessage, setSuccessMessage] = useState(false);

  // Load existing partner data from API when editing
  useEffect(() => {
    if (!editId) {
      setIsEditLoading(false);
      return;
    }

    let isMounted = true;
    setIsEditLoading(true);
    const fetchPartnerDetails = async () => {
      try {
        let tech: any = null;

        // 1. Fetch from backend API
        try {
          const res = await getPartnerByIdApi(editId);
          if (res && res.success !== false && res.data) {
            tech = res.data;
          }
        } catch (apiErr) {
          console.warn("getPartnerByIdApi error, falling back to mock list:", apiErr);
        }

        // 2. Fallback to initialTechnicians mock list if API returned null or failed
        if (!tech) {
          tech = initialTechnicians.find(
            (t: any) => t.id === editId || t._id === editId || t.name === editId
          );
        }

        if (isMounted && tech) {
          // Name
          const techName = tech.name || tech.fullName || tech.partnerName || "";
          if (techName) setName(techName);

          // Phone / Mobile
          const rawPhone = tech.mobile || tech.phone || tech.phoneNumber || "";
          if (rawPhone) {
            const cleanDigits = rawPhone.replace(/\D/g, "").slice(-10);
            if (cleanDigits) {
              setPhone(cleanDigits);
              setPhoneVerified(true);
            }
          }

          // Email
          if (tech.email) {
            setEmail(tech.email);
          } else if (techName) {
            const slug = techName.toLowerCase().replace(/[^a-z0-9]/g, "");
            setEmail(`${slug}@helpmate.com`);
          }

          // Address / Locality
          const addr = tech.residentialAddress || tech.address || tech.locality || "";
          if (addr) setAddress(addr);

          // Role / Designation / Category
          const roleVal = tech.designation || tech.role || tech.category || "AC Technician";
          if (roleVal) setRole(roleVal);

          if (tech.commissionRate !== undefined && tech.commissionRate !== null) {
            setCommissionRate(String(tech.commissionRate));
          } else if (tech.commission !== undefined && tech.commission !== null) {
            setCommissionRate(String(tech.commission));
          }

          // Category prefill in Step 2 if category present
          const catName = tech.category || tech.categoryName || tech.serviceCategory;
          if (catName) {
            setSelectedCategoryFilter(catName);
          }

          // Bank Details
          const bDetails = tech.bankDetails || {};
          setBankName(bDetails.bankName || tech.bankName || "HDFC Bank");
          setBankAccountNumber(
            bDetails.accountNumber || tech.accountNumber || tech.bankAccountNumber || "918237465012"
          );
          setIfscCode(bDetails.ifscCode || tech.ifscCode || "HDFC0001234");
          setUpiId(
            bDetails.upiId ||
              tech.upiId ||
              (rawPhone ? `${rawPhone.replace(/\D/g, "").slice(-10)}@upi` : "partner@upi")
          );

          // KYC & Verification Documents
          const kycObj = tech.kyc || {};
          const aadhaarNo = kycObj.aadhaarNumber || tech.aadhaarNumber || tech.aadhaar || "9876 5432 1098";
          setAadhaarNumber(aadhaarNo);
          setAadhaarVerified(kycObj.aadhaarVerified ?? tech.aadhaarVerified ?? true);

          const docTypeDisplay: Record<string, string> = {
            pan_card: "PAN Card",
            driving_license: "Driving License",
            police_clearance_certificate: "Police Clearance Certificate",
            police_clearance: "Police Clearance Certificate",
            "PAN Card": "PAN Card",
            "Driving License": "Driving License",
            "Police Clearance Certificate": "Police Clearance Certificate",
          };

          const docList: { id: string; type: string; name: string }[] = [];

          if (Array.isArray(kycObj.verificationDocuments) && kycObj.verificationDocuments.length > 0) {
            kycObj.verificationDocuments.forEach((vDoc: any, idx: number) => {
              const rawType = vDoc.documentType || vDoc.type || "pan_card";
              const displayType = docTypeDisplay[rawType] || rawType;
              const fileName = vDoc.originalName || vDoc.name || (vDoc.objectName ? String(vDoc.objectName).split("/").pop() : "") || `${displayType}_Document.jpg`;
              docList.push({
                id: `vdoc-${idx}-${Date.now()}`,
                type: displayType,
                name: fileName,
              });
            });
          }

          const singleDocType = kycObj.verificationDocumentType || tech.verificationDocumentType;
          if (singleDocType) {
            const displayType = docTypeDisplay[singleDocType] || singleDocType;
            const fileName = tech.verificationDocumentName || tech.verificationDocument || `${displayType}_Uploaded.pdf`;
            if (!docList.some((d) => d.type === displayType)) {
              docList.push({
                id: `vdoc-single-${Date.now()}`,
                type: displayType,
                name: fileName,
              });
            }
          }

          if (docList.length > 0) {
            setAdditionalDocsList(docList);
            setSelectedDocType(docList[0].type);
          }

          // Photo / Image / Avatar
          const rawPhoto =
            kycObj.passportPhotoUrl ||
            tech.profilePhoto ||
            tech.profileImage ||
            tech.image ||
            tech.avatar;
          if (rawPhoto) {
            setPassportPhotoPreview(formatImageUrl(rawPhoto));
            setPhotoDocUploaded(true);
          }

          // Aadhaar Front & Back Previews
          const frontUrl =
            kycObj.aadhaarFrontUrl ||
            kycObj.aadhaarFront ||
            tech.aadhaarFront ||
            tech.aadhaarFrontUrl ||
            tech.aadhaarDocUrl ||
            tech.payoutProofUrl;
          if (frontUrl) {
            setAadhaarFrontPreview(formatImageUrl(frontUrl));
            setAadhaarFrontUploaded(true);
            setAadhaarDocUploaded(true);
          }

          const backUrl =
            kycObj.aadhaarBackUrl ||
            kycObj.aadhaarBack ||
            tech.aadhaarBack ||
            tech.aadhaarBackUrl;
          if (backUrl) {
            setAadhaarBackPreview(formatImageUrl(backUrl));
            setAadhaarBackUploaded(true);
          }

          // Police Verification
          if (tech.policeVerified || kycObj.policeVerified) {
            setPoliceVerified(true);
            setPoliceDocUploaded(true);
            setPoliceThanaName(tech.policeThanaName || "Sigra Police Station");
            setPoliceCertificateNumber(tech.policeCertificateNumber || "PCC-2026-9812");
          }

          // Guarantor details
          const gObj = tech.guarantor || {};
          const gName = gObj.name || tech.guarantorName || "Suresh Yadav";
          const gRel = gObj.relation || tech.guarantorRelation || "Brother";
          const gMobile = gObj.mobile || gObj.phone || tech.guarantorPhone || "9876543210";
          setGuarantorName(gName);
          setGuarantorRelation(gRel);
          setGuarantorPhone(gMobile.replace(/\D/g, "").slice(-10));
          setGuarantorPhoneVerified(gObj.mobileVerified ?? true);

          // Service Actions prefilling
          if (Array.isArray(tech.serviceActions) && tech.serviceActions.length > 0) {
            const actIds = tech.serviceActions
              .map((sa: any) => (typeof sa === "object" ? sa._id : sa))
              .filter(Boolean);
            setSelectedServiceActionIds(actIds);

            const actNames = tech.serviceActions
              .map((sa: any) => (typeof sa === "object" ? sa.serviceAction || sa.name : ""))
              .filter(Boolean);
            if (actNames.length > 0) {
              setSelectedTypeFilters(actNames);
            }
          }

          // Service Pincodes & Coverage Zones prefilling
          if (Array.isArray(tech.servicePincodes) && tech.servicePincodes.length > 0) {
            const locIds = tech.servicePincodes
              .map((sp: any) => (typeof sp === "object" ? sp._id : sp))
              .filter(Boolean);
            setSelectedServicePincodeIds(locIds);

            const zoneLabels = tech.servicePincodes.map((sp: any) => {
              if (typeof sp === "object" && sp.pincode) {
                return sp.localityName ? `${sp.pincode} - ${sp.localityName}` : sp.pincode;
              }
              return String(sp);
            });
            setCoverageZones(zoneLabels);
          } else if (tech.pincode || tech.locality) {
            const pinStr = tech.pincode || "221002";
            const locStr = tech.locality || "Varanasi";
            const labelStr = `${pinStr} - ${locStr}`;
            setCoverageZones([labelStr]);
          }
        }
      } catch (err) {
        console.error("Error fetching partner details for edit:", err);
      } finally {
        if (isMounted) setIsEditLoading(false);
      }
    };

    fetchPartnerDetails();
    return () => {
      isMounted = false;
    };
  }, [editId]);

  // Verification Handlers via Backend OTP APIs
  const handleVerifyPhone = async () => {
    if (!phone.trim()) return toast.error("Phone Required", "Please enter mobile number first.");
    setIsSendingPhoneOtp(true);
    try {
      const res = await sendPartnerMobileOtpApi(phone.trim().replace(/\D/g, "").slice(-10));
      if (res && res.success !== false) {
        setShowPhoneOtpInput(true);
        toast.success("OTP Sent", res.message || "OTP sent successfully to partner mobile.");
      } else {
        toast.error("Failed to Send OTP", res?.message || "Failed to send partner mobile OTP.");
      }
    } catch (err) {
      console.error("sendPartnerMobileOtpApi error:", err);
      toast.error("Error", "Error sending mobile OTP.");
    } finally {
      setIsSendingPhoneOtp(false);
    }
  };

  const handleConfirmPhoneOtp = async () => {
    if (phoneOtp.trim().length < 4) return toast.error("Invalid OTP", "Please enter valid OTP.");
    setIsVerifyingPhoneOtp(true);
    try {
      const res = await verifyPartnerMobileOtpApi(phone.trim().replace(/\D/g, "").slice(-10), phoneOtp.trim());
      if (res && res.success !== false) {
        setPhoneVerified(true);
        setShowPhoneOtpInput(false);
        const tokenVal = res.mobileVerificationToken || res.data?.mobileVerificationToken || res.token || res.data?.token || "";
        if (tokenVal) setMobileVerificationToken(tokenVal);
        toast.success("Verified!", res.message || "Partner mobile number verified successfully!");
      } else {
        toast.error("Verification Failed", res?.message || "Invalid OTP.");
      }
    } catch (err) {
      console.error("verifyPartnerMobileOtpApi error:", err);
      toast.error("Error", "Error verifying OTP.");
    } finally {
      setIsVerifyingPhoneOtp(false);
    }
  };

  const handleVerifyGuarantorPhone = async () => {
    if (!guarantorPhone.trim()) return toast.error("Guarantor Phone Required", "Please enter guarantor mobile number.");
    setIsSendingGuarantorOtp(true);
    try {
      const res = await sendGuarantorMobileOtpApi(guarantorPhone.trim().replace(/\D/g, "").slice(-10));
      if (res && res.success !== false) {
        setShowGuarantorOtpInput(true);
        toast.success("OTP Sent", res.message || "OTP sent successfully to guarantor mobile.");
      } else {
        toast.error("Failed to Send OTP", res?.message || "Failed to send guarantor OTP.");
      }
    } catch (err) {
      console.error("sendGuarantorMobileOtpApi error:", err);
      toast.error("Error", "Error sending guarantor OTP.");
    } finally {
      setIsSendingGuarantorOtp(false);
    }
  };

  const handleConfirmGuarantorPhoneOtp = async () => {
    if (guarantorOtp.trim().length < 4) return toast.error("Invalid OTP", "Please enter valid OTP.");
    setIsVerifyingGuarantorOtp(true);
    try {
      const res = await verifyGuarantorMobileOtpApi(guarantorPhone.trim().replace(/\D/g, "").slice(-10), guarantorOtp.trim());
      if (res && res.success !== false) {
        setGuarantorPhoneVerified(true);
        setShowGuarantorOtpInput(false);
        const tokenVal = res.guarantorVerificationToken || res.data?.guarantorVerificationToken || res.token || res.data?.token || "";
        if (tokenVal) setGuarantorVerificationToken(tokenVal);
        toast.success("Verified!", res.message || "Guarantor mobile number verified successfully!");
      } else {
        toast.error("Verification Failed", res?.message || "Invalid guarantor OTP.");
      }
    } catch (err) {
      console.error("verifyGuarantorMobileOtpApi error:", err);
      toast.error("Error", "Error verifying guarantor OTP.");
    } finally {
      setIsVerifyingGuarantorOtp(false);
    }
  };

  // Step Navigation Handlers
  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Name Required", "Please enter Partner Name.");
    if (!phone.trim()) return toast.error("Phone Required", "Please enter Mobile Number.");
    setCurrentStep(2);
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentStep(3);
  };

  const handleStep3Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentStep(4);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Resolve and validate Service Actions against MongoDB ServiceAction _ids
      const masterActions = allServiceActionsMaster.length > 0 ? allServiceActionsMaster : apiServiceActions;
      const validActionMap = new Map<string, ApiServiceAction>();
      masterActions.forEach((a) => {
        if (a && a._id) validActionMap.set(a._id, a);
      });
      apiServiceActions.forEach((a) => {
        if (a && a._id) validActionMap.set(a._id, a);
      });

      // Package _id -> ServiceAction _id lookup map
      const packageToServiceActionIdMap = new Map<string, string>();
      apiPackages.forEach((pkg: any) => {
        if (!pkg || !pkg._id) return;
        let sa = pkg.serviceActionId || pkg.serviceAction;
        if (!sa && Array.isArray(pkg.serviceActions) && pkg.serviceActions.length > 0) {
          sa = pkg.serviceActions[0];
        }
        const saId = typeof sa === "object" && sa !== null ? sa._id || sa.id : typeof sa === "string" ? sa : "";
        if (saId) {
          packageToServiceActionIdMap.set(pkg._id, saId);
        }
      });

      const candidateActionIdsSet = new Set<string>();
      const isValidObjectId = (id: string) => typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id.trim());

      // Check selectedServiceActionIds (strictly user-selected service items or prefilled on edit)
      selectedServiceActionIds.forEach((id) => {
        if (!id) return;
        if (validActionMap.has(id)) {
          candidateActionIdsSet.add(id);
        } else if (packageToServiceActionIdMap.has(id)) {
          candidateActionIdsSet.add(packageToServiceActionIdMap.get(id)!);
        } else if (isValidObjectId(id)) {
          candidateActionIdsSet.add(id);
        }
      });

      // Check selectedServices array (strictly user-selected catalog items)
      selectedServices.forEach((srv) => {
        if (srv.serviceActionId && isValidObjectId(srv.serviceActionId)) {
          candidateActionIdsSet.add(srv.serviceActionId);
        }
        if (srv.id) {
          if (validActionMap.has(srv.id)) {
            candidateActionIdsSet.add(srv.id);
          } else if (packageToServiceActionIdMap.has(srv.id)) {
            candidateActionIdsSet.add(packageToServiceActionIdMap.get(srv.id)!);
          } else if (isValidObjectId(srv.id) && !srv.isPackage) {
            candidateActionIdsSet.add(srv.id);
          } else {
            const matched = masterActions.find(
              (a) =>
                (a.serviceAction && (a.serviceAction.toLowerCase() === srv.title.toLowerCase() || a.serviceAction.toLowerCase() === srv.type.toLowerCase())) ||
                (a.name && (a.name.toLowerCase() === srv.title.toLowerCase() || a.name.toLowerCase() === srv.type.toLowerCase()))
            );
            if (matched && matched._id) candidateActionIdsSet.add(matched._id);
          }
        }
      });

      let actionIds = Array.from(candidateActionIdsSet).filter((id) => isValidObjectId(id));
      if (actionIds.length === 0 && masterActions.length > 0 && masterActions[0]._id) {
        actionIds = [masterActions[0]._id];
      }

      // 2. Resolve and validate Locations / Pincodes against MongoDB Locality _ids
      const masterLocalities = allLocalitiesMaster.length > 0 ? allLocalitiesMaster : apiLocalities;
      const validLocalityMap = new Map<string, ApiLocality>();
      masterLocalities.forEach((l) => {
        if (l && l._id) validLocalityMap.set(l._id, l);
      });
      apiLocalities.forEach((l) => {
        if (l && l._id) validLocalityMap.set(l._id, l);
      });

      const candidatePincodeIdsSet = new Set<string>();

      // Check selectedServicePincodeIds (strictly user-selected pincodes)
      selectedServicePincodeIds.forEach((id) => {
        if (validLocalityMap.has(id)) {
          candidatePincodeIdsSet.add(id);
        }
      });

      // Check coverageZones labels (strictly user-selected coverage zone labels)
      coverageZones.forEach((zoneStr) => {
        if (validLocalityMap.has(zoneStr)) {
          candidatePincodeIdsSet.add(zoneStr);
        } else {
          const matched = masterLocalities.find(
            (loc) =>
              loc._id === zoneStr ||
              zoneStr.includes(loc.pincode) ||
              loc.pincode === zoneStr.trim() ||
              (loc.localityName && zoneStr.toLowerCase().includes(loc.localityName.toLowerCase()))
          );
          if (matched) candidatePincodeIdsSet.add(matched._id);
        }
      });

      let pincodeIds = Array.from(candidatePincodeIdsSet).filter((id) => validLocalityMap.has(id));
      if (pincodeIds.length === 0 && masterLocalities.length > 0) {
        pincodeIds = [masterLocalities[0]._id];
      }

      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("mobile", phone.trim().replace(/\D/g, "").slice(-10));
      if (mobileVerificationToken) {
        formData.append("mobileVerificationToken", mobileVerificationToken);
      }
      formData.append("email", email.trim());
      formData.append("residentialAddress", address.trim());
      formData.append("password", "Partner@123");
      formData.append("designation", role || "Technician");
      formData.append("commissionRate", String(commissionRate || 25));

      formData.append("bankDetails", JSON.stringify({
        bankName: bankName.trim(),
        branchName: "Main Branch",
        accountNumber: bankAccountNumber.trim(),
        ifscCode: ifscCode.trim(),
        upiId: upiId.trim(),
      }));

      formData.append("serviceActions", JSON.stringify(actionIds));
      formData.append("servicePincodes", JSON.stringify(pincodeIds));
      formData.append("kyc", JSON.stringify({
        aadhaarNumber: aadhaarNumber.trim().replace(/\D/g, ""),
      }));

      formData.append("guarantor", JSON.stringify({
        name: guarantorName.trim(),
        relation: guarantorRelation || "Brother",
        mobile: guarantorPhone.trim().replace(/\D/g, "").slice(-10),
        mobileVerified: Boolean(guarantorPhoneVerified),
      }));

      if (guarantorVerificationToken) {
        formData.append("guarantorVerificationToken", guarantorVerificationToken);
      }

      const docTypeMapping: Record<string, string> = {
        "PAN Card": "pan_card",
        "Driving License": "driving_license",
        "Police Clearance Certificate": "police_clearance_certificate",
        "Police Clearance": "police_clearance_certificate",
      };

      if (aadhaarFrontFile) {
        formData.append("aadhaarFront", aadhaarFrontFile);
      } else if (aadhaarFrontFileInputRef.current?.files?.[0]) {
        formData.append("aadhaarFront", aadhaarFrontFileInputRef.current.files[0]);
      }

      if (aadhaarBackFile) {
        formData.append("aadhaarBack", aadhaarBackFile);
      } else if (aadhaarBackFileInputRef.current?.files?.[0]) {
        formData.append("aadhaarBack", aadhaarBackFileInputRef.current.files[0]);
      }

      if (editedPhotoFile) {
        formData.append("passportPhoto", editedPhotoFile);
      } else if (photoFileInputRef.current?.files?.[0]) {
        formData.append("passportPhoto", photoFileInputRef.current.files[0]);
      }

      const docsWithFiles = additionalDocsList.filter((d) => d.file);
      if (docsWithFiles.length > 0) {
        docsWithFiles.forEach((d) => {
          const slug = docTypeMapping[d.type] || "pan_card";
          formData.append("verificationDocumentType", slug);
          formData.append("verificationDocument", d.file!);
        });
      } else {
        formData.append("verificationDocumentType", docTypeMapping[selectedDocType] || "pan_card");
        if (verificationDocFile) {
          formData.append("verificationDocument", verificationDocFile);
        } else if (docTypeFileInputRef.current?.files?.[0]) {
          formData.append("verificationDocument", docTypeFileInputRef.current.files[0]);
        }
      }

      let res;
      if (isEditing && editId) {
        res = await updatePartnerApi(editId, formData);
      } else {
        res = await createPartnerApi(formData);
      }

      if (res && res.success !== false) {
        setSuccessMessage(true);
        toast.success(
          isEditing ? "Partner Updated!" : "Partner Created!",
          res.message || (isEditing ? "Partner updated successfully." : "Partner registered & activated successfully.")
        );
        setTimeout(() => {
          router.push("/technicians");
        }, 1200);
      } else {
        toast.error("Submission Failed", res?.message || "Failed to create/update partner.");
      }
    } catch (err) {
      console.error("Error creating partner:", err);
      toast.error("Error", "Failed to submit partner form.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6 pb-16">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
            <Link
              href="/technicians"
              className="inline-flex items-center gap-1 hover:text-brand-600 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-brand-600" />
              <span>Partner Directory</span>
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            {isEditing ? (
              <>
                <span className="text-slate-700 dark:text-slate-300 font-bold">Edit Partner</span>
                {name && (
                  <>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-brand-600 dark:text-brand-400 font-extrabold">{name}</span>
                  </>
                )}
              </>
            ) : (
              <span className="text-brand-600 dark:text-brand-400 font-extrabold">Add Partner</span>
            )}
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2 mt-1">
            <UserCheck className="w-6 h-6 text-brand-600" />
            <span>{isEditing ? "Edit Partner" : "Add Partner"}</span>
          </h1>
        </div>
      </div>

      {/* ─── HIDDEN GLOBAL FILE INPUT REFS (Always Mounted in DOM across all steps) ─── */}
      <input
        type="file"
        ref={photoFileInputRef}
        accept="image/*"
        className="hidden"
        onClick={(e) => {
          (e.target as HTMLInputElement).value = "";
        }}
        onChange={(e) => {
          if (e.target.files?.[0]) {
            const file = e.target.files[0];
            setEditedPhotoFile(file);
            setPhotoFileName(file.name);
            setPassportPhotoPreview(URL.createObjectURL(file));
            setPhotoDocUploaded(true);
            const rawUrl = URL.createObjectURL(file);
            setEditorRawImage(rawUrl);
            setCropZoom(1);
            setCropRotation(0);
            setCropOffsetX(0);
            setCropOffsetY(0);
            setIsImageEditorOpen(true);
          }
        }}
      />

      <input
        type="file"
        ref={aadhaarFrontFileInputRef}
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onClick={(e) => {
          (e.target as HTMLInputElement).value = "";
        }}
        onChange={(e) => {
          if (e.target.files?.[0]) {
            const file = e.target.files[0];
            setAadhaarFrontFile(file);
            setAadhaarFrontFileName(file.name);
            setAadhaarFrontUploaded(true);
            if (file.type.startsWith("image/")) {
              setAadhaarFrontPreview(URL.createObjectURL(file));
            }
          }
        }}
      />

      <input
        type="file"
        ref={aadhaarBackFileInputRef}
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onClick={(e) => {
          (e.target as HTMLInputElement).value = "";
        }}
        onChange={(e) => {
          if (e.target.files?.[0]) {
            const file = e.target.files[0];
            setAadhaarBackFile(file);
            setAadhaarBackFileName(file.name);
            setAadhaarBackUploaded(true);
            if (file.type.startsWith("image/")) {
              setAadhaarBackPreview(URL.createObjectURL(file));
            }
          }
        }}
      />

      <input
        type="file"
        ref={docTypeFileInputRef}
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onClick={(e) => {
          (e.target as HTMLInputElement).value = "";
        }}
        onChange={(e) => {
          if (e.target.files?.[0]) {
            const file = e.target.files[0];
            setVerificationDocFile(file);
            const newDoc = {
              id: `doc-${Date.now()}`,
              type: selectedDocType,
              name: file.name,
              file: file,
            };
            setAdditionalDocsList((prev) => [
              ...prev.filter((d) => d.type !== selectedDocType),
              newDoc,
            ]);
          }
        }}
      />

      {isEditLoading ? (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6 shadow-sm animate-pulse">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-1/3" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl w-full" />
            <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl w-full" />
            <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl w-full" />
            <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl w-full" />
          </div>
          <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full" />
        </div>
      ) : (
        <>

      {/* SUCCESS BANNER */}
      {successMessage && (
        <div className={`p-5 rounded-2xl text-white shadow-lg flex items-center gap-3 animate-in fade-in ${
          submitStatus === "Pending" ? "bg-amber-600" : "bg-emerald-600"
        }`}>
          <CheckCircle2 className="w-6 h-6 shrink-0" />
          <div>
            <h3 className="font-extrabold text-sm">
              {submitStatus === "Pending"
                ? "Partner Profile Saved as Draft (Pending)"
                : isEditing
                ? "Partner Profile Updated & Approved!"
                : "Partner Approved & Activated Successfully!"}
            </h3>
            <p className="text-xs opacity-90">Redirecting to partner directory...</p>
          </div>
        </div>
      )}

      {/* 4-STAGE STEPPER HEADER */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Step 1 Pill */}
        <div
          onClick={() => setCurrentStep(1)}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
            currentStep === 1
              ? "bg-brand-600 text-white border-brand-600 shadow-md"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-brand-300"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
              currentStep === 1 ? "bg-white text-brand-700" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}
          >
            1
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider block opacity-80">Step 1</span>
            <span className="font-extrabold text-xs truncate block">Personal & Bank</span>
          </div>
        </div>

        {/* Step 2 Pill */}
        <div
          onClick={() => {
            if (name && phone) setCurrentStep(2);
          }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
            currentStep === 2
              ? "bg-brand-600 text-white border-brand-600 shadow-md"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-brand-300"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
              currentStep === 2 ? "bg-white text-brand-700" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}
          >
            2
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider block opacity-80">Step 2</span>
            <span className="font-extrabold text-xs truncate block">Services & Pincodes</span>
          </div>
        </div>

        {/* Step 3 Pill */}
        <div
          onClick={() => {
            if (name && phone) setCurrentStep(3);
          }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
            currentStep === 3
              ? "bg-brand-600 text-white border-brand-600 shadow-md"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-brand-300"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
              currentStep === 3 ? "bg-white text-brand-700" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}
          >
            3
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider block opacity-80">Step 3</span>
            <span className="font-extrabold text-xs truncate block">Documents & KYC</span>
          </div>
        </div>

        {/* Step 4 Review & Submit Pill */}
        <div
          onClick={() => {
            if (name && phone) setCurrentStep(4);
          }}
          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
            currentStep === 4
              ? "bg-brand-600 text-white border-brand-600 shadow-md"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-brand-300"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shrink-0 ${
              currentStep === 4 ? "bg-white text-brand-700" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}
          >
            4
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider block opacity-80">Step 4</span>
            <span className="font-extrabold text-xs truncate block">Review & Submit</span>
          </div>
        </div>
      </div>

      {/* ─── STEP 1 FORM: PERSONAL DETAILS & BANK DETAILS ─── */}
      {currentStep === 1 && (
        <form onSubmit={handleStep1Submit} className="space-y-6">
          {/* Personal Information */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 shadow-xs">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <User className="w-5 h-5 text-brand-600" />
              <span>Step 1A: Partner Personal Contact & Profile Photo</span>
            </h3>

            {/* Profile Image Upload in Step 1 */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center gap-4">
              <div className="relative group shrink-0">
                {passportPhotoPreview ? (
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-brand-500 shadow-md">
                    <Image
                      src={passportPhotoPreview}
                      alt="Partner Profile"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-brand-50 dark:bg-brand-950/60 border-2 border-dashed border-brand-300 dark:border-brand-700 flex flex-col items-center justify-center text-brand-600 dark:text-brand-400 shadow-xs">
                    <User className="w-8 h-8" />
                    <span className="text-[9px] font-extrabold mt-0.5">No Image</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => photoFileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-brand-600 text-white shadow-md hover:bg-brand-700 transition-all cursor-pointer"
                  title="Upload Profile Image"
                >
                  <Upload className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1 text-center sm:text-left space-y-1 min-w-0">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                    Partner Profile Photo / Avatar
                  </h4>
                  {photoDocUploaded && (
                    <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                      ✓ Uploaded
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Upload a clear passport size photograph or portrait image of the partner (JPG, PNG).
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => photoFileInputRef.current?.click()}
                    className="px-3.5 py-1.5 rounded-xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{photoDocUploaded ? "Change Image" : "Upload Profile Image"}</span>
                  </button>
                  {passportPhotoPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        if (passportPhotoPreview) {
                          setEditorRawImage(passportPhotoPreview);
                          setIsImageEditorOpen(true);
                        } else {
                          photoFileInputRef.current?.click();
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 hover:bg-slate-100 shadow-2xs"
                    >
                      <Crop className="w-3.5 h-3.5 text-brand-600" />
                      <span>Edit & Crop Image</span>
                    </button>
                  )}
                  {photoFileName && (
                    <span className="text-[11px] font-mono text-slate-500 truncate max-w-[180px]">
                      {photoFileName}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar Yadav"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-brand-500 font-semibold"
                />
              </div>

              {/* Mobile Number + Verification */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  {phoneVerified && (
                    <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="9839100000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-brand-500 font-mono font-bold"
                  />
                  {!phoneVerified ? (
                    <button
                      type="button"
                      onClick={handleVerifyPhone}
                      className="h-11 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 font-extrabold text-xs border border-blue-200 dark:border-blue-800 whitespace-nowrap transition-all cursor-pointer shrink-0 flex items-center justify-center shadow-2xs"
                    >
                      Verify OTP
                    </button>
                  ) : (
                    <span className="h-11 px-3.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold text-xs border border-emerald-200 dark:border-emerald-800 shrink-0 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                    </span>
                  )}
                </div>

                {showPhoneOtpInput && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Enter OTP"
                      value={phoneOtp}
                      onChange={(e) => setPhoneOtp(e.target.value)}
                      className="w-32 px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleConfirmPhoneOtp}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-900 dark:hover:bg-amber-800 text-amber-900 dark:text-amber-200 font-extrabold text-xs border border-amber-300 dark:border-amber-700 transition-colors cursor-pointer"
                    >
                      Submit OTP
                    </button>
                  </div>
                )}
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="partner@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-brand-500 font-semibold"
                />
              </div>

              {/* Full Residential Address */}
              <div className="space-y-1.5 md:col-span-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Full Residential Address <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Enter Partner Complete Residential Home Address, House No, Locality & Pincode..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-brand-500 font-semibold resize-none"
                />
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 shadow-xs">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Wallet className="w-5 h-5 text-emerald-600" />
              <span>Step 1B: Weekly Payout Bank Account Details</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Bank Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Bank Name & Branch
                </label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Bank (Sigra Branch)"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-brand-500 font-semibold"
                />
              </div>

              {/* Account Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Bank Account Number
                </label>
                <input
                  type="text"
                  placeholder="50100299182711"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-brand-500 font-mono font-bold"
                />
              </div>

              {/* IFSC Code */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  IFSC Code
                </label>
                <input
                  type="text"
                  placeholder="HDFC0001827"
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-brand-500 font-mono font-bold uppercase"
                />
              </div>

              {/* UPI ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  UPI ID (Optional Instant Payout)
                </label>
                <input
                  type="text"
                  placeholder="ramesh.yadav@okhdfcbank"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-brand-500 font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <Link
              href="/technicians"
              className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs transition-all"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Next: Service & Zone Setup →</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* ─── STEP 2 FORM: HIERARCHICAL MULTI-SELECT SERVICE & AREA-TO-AREA ZONE ─── */}
      {currentStep === 2 && (
        <form onSubmit={handleStep2Submit} className="space-y-6 animate-in fade-in">
          {/* SECTION 2A: SEARCHABLE CATEGORY & MULTI-SELECT SPECIFIC SERVICES (WITH IMAGES) */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-brand-600" />
                <span>Step 2A: Service Category & Specific Services</span>
              </h3>
              <span className="text-xs font-bold text-slate-500">
                {selectedServices.length} Services Selected
              </span>
            </div>

            {/* Grid for Searchable Dropdowns (1. Category, 2. System Type, 3. Service Action) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 1. Category Dropdown with Search */}
              <div ref={categoryRef} className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                  1. Service Category *
                </label>
                <div className="relative">
                  <div className="relative flex items-center">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      placeholder={selectedCategoryFilter === "All" ? "Search Category (e.g. AC Repair, RO, Plumbing)..." : `Selected: ${selectedCategoryFilter}`}
                      value={isCategoryDropdownOpen ? categorySearchQuery : (categorySearchQuery || (selectedCategoryFilter === "All" ? "" : selectedCategoryFilter))}
                      onChange={(e) => {
                        setCategorySearchQuery(e.target.value);
                        if (!isCategoryDropdownOpen) toggleDropdown("category");
                      }}
                      onFocus={() => {
                        setCategorySearchQuery("");
                        toggleDropdown("category");
                      }}
                      className={`w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500 ${
                        selectedCategoryFilter !== "All" && !isCategoryDropdownOpen ? "border-brand-500 bg-brand-50/20 dark:bg-brand-950/20 text-brand-700 dark:text-brand-300" : ""
                      }`}
                    />
                    {selectedCategoryFilter !== "All" || categorySearchQuery ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategoryFilter("All");
                          setSelectedSubTypeFilters([]);
                          setSelectedTypeFilters([]);
                          setCategorySearchQuery("");
                          toggleDropdown("category");
                        }}
                        className="absolute right-3.5 text-slate-400 hover:text-rose-600 cursor-pointer p-0.5"
                        title="Clear Category"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setCategorySearchQuery("");
                          toggleDropdown("category");
                        }}
                        className="absolute right-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {isCategoryDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-30 max-h-48 overflow-y-auto p-1.5 space-y-1">
                      {categoryList
                        .filter((cat) => cat.toLowerCase().includes(categorySearchQuery.toLowerCase()))
                        .map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              setSelectedCategoryFilter(cat);
                              setSelectedSubTypeFilters([]);
                              setSelectedTypeFilters([]);
                              setCategorySearchQuery("");
                              setIsCategoryDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-between cursor-pointer ${
                              selectedCategoryFilter === cat
                                ? "bg-brand-600 text-white"
                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            }`}
                          >
                            <span>{cat === "All" ? "All Categories" : cat}</span>
                            {selectedCategoryFilter === cat && <Check className="w-4 h-4" />}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. System Type (MULTI-SELECT & DYNAMIC BY CATEGORY) */}
              <div ref={subTypeRef} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                    2. System Type {selectedCategoryFilter !== "All" ? `(${selectedCategoryFilter.split(" ")[0]})` : "(Select Category First)"}
                  </label>
                  {selectedSubTypeFilters.length > 0 && (
                    <span className="text-[10px] font-extrabold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/40 px-2 py-0.5 rounded-full border border-brand-200 dark:border-brand-800">
                      {selectedSubTypeFilters.length} Selected
                    </span>
                  )}
                </div>
                <div className="relative">
                  <div className="relative flex items-center">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      disabled={selectedCategoryFilter === "All" || subCategoryList.length === 0}
                      placeholder={
                        selectedCategoryFilter === "All"
                          ? "Select Category First..."
                          : subCategoryList.length === 0
                          ? "No Subcategories (Service Actions loaded)"
                          : selectedSubTypeFilters.length === 0
                          ? `Search System Type (${subCategoryList[0] || "Split AC"})...`
                          : `${selectedSubTypeFilters.length} System Types Selected`
                      }
                      value={isSubTypeDropdownOpen ? subTypeSearchQuery : (subTypeSearchQuery || selectedSubTypeFilters.join(", "))}
                      onChange={(e) => {
                        if (selectedCategoryFilter === "All" || subCategoryList.length === 0) return;
                        setSubTypeSearchQuery(e.target.value);
                        if (!isSubTypeDropdownOpen) toggleDropdown("subType");
                      }}
                      onFocus={() => {
                        if (selectedCategoryFilter === "All" || subCategoryList.length === 0) return;
                        setSubTypeSearchQuery("");
                        toggleDropdown("subType");
                      }}
                      className={`w-full h-11 pl-10 pr-10 rounded-xl border text-xs font-bold transition-all outline-none ${
                        selectedCategoryFilter === "All" || subCategoryList.length === 0
                          ? "bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-400 cursor-not-allowed opacity-60"
                          : selectedSubTypeFilters.length > 0 && !isSubTypeDropdownOpen
                          ? "border-brand-500 bg-brand-50/30 dark:bg-brand-950/20 text-brand-900 dark:text-brand-300 cursor-pointer font-extrabold"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white cursor-pointer focus:border-brand-500"
                      }`}
                    />
                    {selectedCategoryFilter !== "All" && subCategoryList.length > 0 && (selectedSubTypeFilters.length > 0 || subTypeSearchQuery) ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSubTypeFilters([]);
                          setSelectedTypeFilters([]);
                          setSubTypeSearchQuery("");
                          toggleDropdown("subType");
                        }}
                        className="absolute right-3.5 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                        title="Clear All System Types"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={selectedCategoryFilter === "All" || subCategoryList.length === 0}
                        onClick={() => {
                          if (selectedCategoryFilter === "All" || subCategoryList.length === 0) return;
                          setSubTypeSearchQuery("");
                          toggleDropdown("subType");
                        }}
                        className={`absolute right-3.5 text-slate-400 ${selectedCategoryFilter === "All" || subCategoryList.length === 0 ? "cursor-not-allowed opacity-50" : "hover:text-slate-600 cursor-pointer"}`}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {isSubTypeDropdownOpen && selectedCategoryFilter !== "All" && subCategoryList.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-30 max-h-56 overflow-y-auto p-1.5 space-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSubTypeFilters([]);
                          setSelectedTypeFilters([]);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-between cursor-pointer ${
                          selectedSubTypeFilters.length === 0
                            ? "bg-brand-600 text-white"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        <span>All System Types ({selectedCategoryFilter.split(" ")[0]})</span>
                        {selectedSubTypeFilters.length === 0 && <Check className="w-4 h-4" />}
                      </button>

                      {subCategoryList
                        .filter((sub) => sub.toLowerCase().includes(subTypeSearchQuery.toLowerCase()))
                        .map((sub) => {
                          const isSelected = selectedSubTypeFilters.includes(sub);
                          return (
                            <button
                              key={sub}
                              type="button"
                              onClick={() => {
                                setSelectedTypeFilters([]);
                                if (isSelected) {
                                  setSelectedSubTypeFilters(selectedSubTypeFilters.filter((s) => s !== sub));
                                } else {
                                  setSelectedSubTypeFilters([...selectedSubTypeFilters, sub]);
                                }
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-between cursor-pointer ${
                                isSelected
                                  ? "bg-brand-600 text-white"
                                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${isSelected ? "border-white bg-white text-brand-600" : "border-slate-300 dark:border-slate-600"}`}>
                                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                                <span>{sub}</span>
                              </div>
                              <span className="text-[10px] opacity-80">{isSelected ? "Selected" : "+ Select"}</span>
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>

              {/* 3. Service Action Dropdown (MULTI-SELECT) */}
              <div ref={typeRef} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                    3. Service Action
                  </label>
                  {selectedTypeFilters.length > 0 && (
                    <span className="text-[10px] font-extrabold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/40 px-2 py-0.5 rounded-full border border-brand-200 dark:border-brand-800">
                      {selectedTypeFilters.length} Selected
                    </span>
                  )}
                </div>
                <div className="relative">
                  <div className="relative flex items-center">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      placeholder={selectedTypeFilters.length === 0 ? "Search Action (Repair, Install, Service)..." : `${selectedTypeFilters.length} Actions Selected`}
                      value={isTypeDropdownOpen ? typeSearchQuery : (typeSearchQuery || selectedTypeFilters.join(", "))}
                      onChange={(e) => {
                        setTypeSearchQuery(e.target.value);
                        if (!isTypeDropdownOpen) toggleDropdown("type");
                      }}
                      onFocus={() => {
                        setTypeSearchQuery("");
                        toggleDropdown("type");
                      }}
                      className={`w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500 ${
                        selectedTypeFilters.length > 0 && !isTypeDropdownOpen ? "border-brand-500 bg-brand-50/30 dark:bg-brand-950/20 text-brand-900 dark:text-brand-300 font-extrabold" : ""
                      }`}
                    />
                    {selectedTypeFilters.length > 0 || typeSearchQuery ? (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTypeFilters([]);
                          setTypeSearchQuery("");
                          toggleDropdown("type");
                        }}
                        className="absolute right-3.5 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                        title="Clear All Actions"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setTypeSearchQuery("");
                          toggleDropdown("type");
                        }}
                        className="absolute right-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {isTypeDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-30 max-h-60 overflow-y-auto p-1.5 space-y-1">
                      <button
                        type="button"
                        onClick={() => setSelectedTypeFilters([])}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-between cursor-pointer ${
                          selectedTypeFilters.length === 0
                            ? "bg-brand-600 text-white"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        <span>All Service Actions</span>
                        {selectedTypeFilters.length === 0 && <Check className="w-4 h-4" />}
                      </button>

                      {apiServiceActions
                        .map((act: any) => ({
                          id: act._id,
                          name: act.serviceAction || act.name || "Service Action",
                        }))
                        .filter((act) => act.name.toLowerCase().includes(typeSearchQuery.toLowerCase()))
                        .map((act) => {
                          const isSelected = selectedTypeFilters.includes(act.name) || selectedTypeFilters.includes(act.id);
                          return (
                            <button
                              key={act.id}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedTypeFilters(selectedTypeFilters.filter((t) => t !== act.name && t !== act.id));
                                } else {
                                  setSelectedTypeFilters([...selectedTypeFilters, act.name]);
                                }
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-between cursor-pointer ${
                                isSelected
                                  ? "bg-brand-600 text-white"
                                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${isSelected ? "border-white bg-white text-brand-600" : "border-slate-300 dark:border-slate-600"}`}>
                                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                                <span>{act.name}</span>
                              </div>
                              <span className="text-[10px] opacity-80">{isSelected ? "Selected" : "+ Select"}</span>
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* SELECTED SERVICE ACTIONS SHOWN AT THE BOTTOM */}
            {(selectedTypeFilters.length > 0 || selectedServices.length > 0) && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 pt-3">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Selected Service Actions ({selectedTypeFilters.length + selectedServices.length}):</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTypeFilters([]);
                      setSelectedServices([]);
                      setSelectedServiceActionIds([]);
                    }}
                    className="text-[11px] font-bold text-slate-500 hover:text-slate-700 hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedTypeFilters.map((act) => (
                    <span
                      key={act}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-brand-200 dark:border-brand-800 text-slate-900 dark:text-white text-xs font-extrabold flex items-center gap-2 shadow-2xs"
                    >
                      <Wrench className="w-3.5 h-3.5 text-brand-600" />
                      <span>{act}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedTypeFilters(selectedTypeFilters.filter((t) => t !== act))}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer ml-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                  {selectedServices.map((srv) => (
                    <span
                      key={srv.id}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-brand-200 dark:border-brand-800 text-slate-900 dark:text-white text-xs font-extrabold flex items-center gap-2 shadow-2xs"
                    >
                      <Wrench className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{srv.title} ({srv.type})</span>
                      <button
                        type="button"
                        onClick={() => toggleServiceSelection(srv)}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer ml-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2B: PINCODE SERVICE AREAS (MULTI-SELECT) */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 shadow-xs">
            {/* Header with Add Pincode Button In-Line */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-600" />
                <span>Step 2B: Service Areas & Pincodes</span>
              </h3>

              <button
                type="button"
                onClick={() => setIsPincodeModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 font-extrabold text-xs shrink-0 cursor-pointer transition-all flex items-center gap-1.5 shadow-2xs self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add Pincode & Location</span>
              </button>
            </div>

            {/* Searchable Multi-Select Locality & Pincode Dropdown */}
            <div ref={pincodeRef} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                  Select Locality & Pincode *
                </label>
                <span className="text-[10px] font-extrabold text-brand-600 dark:text-brand-400">
                  {coverageZones.length} Locations Selected
                </span>
              </div>

              <div className="relative">
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    placeholder={
                      coverageZones.length === 0
                        ? "Search & select locality or pincode (e.g. 221002 - Sigra, Lanka)..."
                        : `${coverageZones.length} Locations Selected`
                    }
                    value={isPincodeDropdownOpen ? pincodeSearchQuery : (pincodeSearchQuery || (coverageZones.length > 0 ? `${coverageZones.length} Locations Selected` : ""))}
                    onChange={(e) => {
                      setPincodeSearchQuery(e.target.value);
                      if (!isPincodeDropdownOpen) toggleDropdown("pincode");
                    }}
                    onFocus={() => {
                      setPincodeSearchQuery("");
                      toggleDropdown("pincode");
                    }}
                    className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-brand-500 shadow-2xs"
                  />
                  {pincodeSearchQuery || isPincodeDropdownOpen ? (
                    <button
                      type="button"
                      onClick={() => {
                        setPincodeSearchQuery("");
                        setIsPincodeDropdownOpen(false);
                      }}
                      className="absolute right-3.5 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setPincodeSearchQuery("");
                        toggleDropdown("pincode");
                      }}
                      className="absolute right-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Floating Searchable API Locality Dropdown */}
                {isPincodeDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-40 max-h-72 overflow-y-auto p-2 space-y-1">
                    {availablePincodeZones.filter((zone) => {
                      if (!pincodeSearchQuery.trim()) return true;
                      const q = pincodeSearchQuery.toLowerCase();
                      return (
                        zone.pincode.toLowerCase().includes(q) ||
                        zone.area.toLowerCase().includes(q) ||
                        zone.label.toLowerCase().includes(q)
                      );
                    }).map((zone) => {
                      const isChecked = selectedServicePincodeIds.includes(zone.id) || coverageZones.some((z) => z.includes(zone.pincode));

                      return (
                        <div
                          key={zone.id || zone.pincode}
                          onClick={() => togglePincodeSelection(zone)}
                          className={`p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 border ${
                            isChecked
                              ? "bg-brand-50 dark:bg-brand-950/60 border-brand-300 dark:border-brand-800"
                              : "bg-slate-50/60 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-100"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 font-mono font-black text-xs flex items-center justify-center shrink-0 border border-brand-200 dark:border-brand-800">
                              {zone.pincode}
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                                {zone.area}
                              </h4>
                              <p className="text-[10px] text-slate-500 font-semibold truncate">
                                Locality Pincode: {zone.pincode}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0">
                            <span
                              className={`px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1 ${
                                isChecked
                                  ? "bg-brand-600 text-white shadow-xs"
                                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                              }`}
                            >
                              {isChecked ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Selected</span>
                                </>
                              ) : (
                                <span>+ Select</span>
                              )}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Multi-Select Pincode Grid (Includes All Added Pincodes) */}
            {/* <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                  Select Pincodes Served (Click to Select / Deselect):
                </label>
                <span className="text-xs font-mono font-bold text-brand-600">
                  {coverageZones.length} Pincodes Selected
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {availablePincodeZones.map((zone) => {
                  const isChecked = selectedServicePincodeIds.includes(zone.id) || coverageZones.some((z) => z.includes(zone.pincode));

                  return (
                    <button
                      key={zone.id || zone.pincode}
                      type="button"
                      onClick={() => togglePincodeSelection(zone)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between text-xs font-semibold ${
                        isChecked
                          ? "bg-brand-50 dark:bg-brand-950/40 border-brand-300 dark:border-brand-800 text-slate-900 dark:text-white"
                          : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                      }`}
                    >
                      <div>
                        <span className="font-mono font-extrabold text-brand-600 block">{zone.pincode}</span>
                        <span className="text-[10px] text-slate-500 line-clamp-1">{zone.area}</span>
                      </div>
                      <span
                        className={`w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold ${
                          isChecked ? "bg-brand-600 text-white" : "border border-slate-300 dark:border-slate-600"
                        }`}
                      >
                        {isChecked ? "✓" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div> */}

            {/* Active Selected Pincodes List */}
            {coverageZones.length > 0 && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                    Selected Pincodes ({coverageZones.length}):
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsPincodeModalOpen(true)}
                    className="text-[11px] font-extrabold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Pincode & Location</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {coverageZones.map((z, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold flex items-center gap-2 shadow-2xs"
                    >
                      <MapPin className="w-3.5 h-3.5 text-brand-600" />
                      <span>{z}</span>
                      <button
                        type="button"
                        onClick={() => setCoverageZones(coverageZones.filter((item) => item !== z))}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer ml-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ─── ADD PINCODE & LOCATION DIALOG ─── */}
            {isPincodeModalOpen && (
              <Portal>
                <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 outline-none">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
                    {/* Header */}
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400 border border-brand-200 shrink-0">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                            Add Location & Pincode
                          </h3>
                          <p className="text-xs text-slate-500 font-medium">
                            Pincode and area location name.
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsPincodeModalOpen(false)}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Dialog Body (STRICTLY 2 INPUT FIELDS FOR ADDING LOCATION) */}
                    <div className="p-6 space-y-4 text-xs">
                      {/* Select from Locality Dropdown */}
                      {apiLocalities.length > 0 && (
                        <div>
                          <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                            Select Locality & Pincode
                          </label>
                          <select
                            onChange={(e) => {
                              const selectedId = e.target.value;
                              const found = apiLocalities.find((l) => l._id === selectedId);
                              if (found) {
                                setModalCustomPincode(found.pincode || "");
                                setModalCustomArea(found.localityName || "");
                              }
                            }}
                            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs outline-none focus:border-brand-500 transition-all"
                          >
                            <option value="">-- Choose from Localities ({apiLocalities.length}) --</option>
                            {apiLocalities.map((loc) => (
                              <option key={loc._id} value={loc._id}>
                                {loc.pincode} - {loc.localityName}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Input 1: Pincode */}
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                          Pincode *
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          placeholder="e.g. 221008"
                          value={modalCustomPincode}
                          onChange={(e) => setModalCustomPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!modalCustomPincode.trim()) return;
                              const pin = modalCustomPincode.trim();
                              const area = modalCustomArea.trim() || "Varanasi Area";
                              const entry = `${pin} - ${area}`;
                              if (!coverageZones.includes(entry)) {
                                setCoverageZones([...coverageZones, entry]);
                              }
                              setModalCustomPincode("");
                              setModalCustomArea("");
                              setIsPincodeModalOpen(false);
                            }
                          }}
                          className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold text-xs outline-none focus:border-brand-500 transition-all"
                        />
                      </div>

                      {/* Input 2: Location Name */}
                      <div>
                        <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                          Location / Area Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Sarnath Sector 2"
                          value={modalCustomArea}
                          onChange={(e) => setModalCustomArea(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              e.stopPropagation();
                              if (!modalCustomPincode.trim()) return;
                              const pin = modalCustomPincode.trim();
                              const area = modalCustomArea.trim() || "Varanasi Area";
                              const entry = `${pin} - ${area}`;
                              if (!coverageZones.includes(entry)) {
                                setCoverageZones([...coverageZones, entry]);
                              }
                              setModalCustomPincode("");
                              setModalCustomArea("");
                              setIsPincodeModalOpen(false);
                            }
                          }}
                          className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs outline-none focus:border-brand-500 transition-all"
                        />
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-3">
                        <button
                          type="button"
                          onClick={() => setIsPincodeModalOpen(false)}
                          className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs cursor-pointer hover:bg-slate-200 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={!modalCustomPincode.trim() || !modalCustomArea.trim()}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!modalCustomPincode.trim()) return;
                            const pin = modalCustomPincode.trim();
                            const area = modalCustomArea.trim() || "Varanasi Area";
                            const entry = `${pin} - ${area}`;
                            if (!coverageZones.includes(entry)) {
                              setCoverageZones([...coverageZones, entry]);
                            }
                            setModalCustomPincode("");
                            setModalCustomArea("");
                            setIsPincodeModalOpen(false);
                          }}
                          className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-extrabold text-xs shadow-xs cursor-pointer flex items-center justify-center gap-2 transition-all"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Add Location & Pincode</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Portal>
            )}

            {/* Role & Commission Rate */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Role / Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. AC Technician"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-brand-500 font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Commission Rate (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-brand-500 font-mono font-black"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-5 py-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 transition-all cursor-pointer shadow-2xs"
            >
              ← Back to Step 1
            </button>

            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Next: Documents & KYC →</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* ─── STEP 3 FORM: KYC, GUARANTOR & ADDITIONAL DOCUMENT UPLOADS ─── */}
      {currentStep === 3 && (
        <form onSubmit={handleStep3Submit} className="space-y-6">
          {/* Section 3A: Partner Identity & Aadhaar Both Sides KYC */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 shadow-xs">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <ShieldCheck className="w-5 h-5 text-brand-600" />
              <span>Step 3A: Partner Identity & Aadhaar KYC (First Side & Second Side Copy)</span>
            </h3>

            {/* Partner Aadhaar Card Number */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Partner Aadhaar Card Number (12 Digits) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                maxLength={12}
                placeholder="982341029831"
                value={aadhaarNumber}
                onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, "").slice(0, 12))}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-brand-500 font-mono font-bold"
              />
            </div>

            {/* Separate Inputs for Aadhaar First Side (Front Copy) & Second Side (Back Copy) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
              {/* 1. Aadhaar First Side (Front Copy) */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Aadhaar First Side (Front Copy) <span className="text-rose-500">*</span>
                  </label>
                  {aadhaarFrontUploaded && (
                    <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                      ✓ Front Uploaded
                    </span>
                  )}
                </div>

                {aadhaarFrontPreview ? (
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center gap-3 shadow-2xs">
                    <div className="relative w-16 h-12 rounded-lg overflow-hidden border border-slate-200 shadow-2xs shrink-0">
                      <Image
                        src={aadhaarFrontPreview}
                        alt="Aadhaar Front Preview"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                        {aadhaarFrontFileName || "Aadhaar_Front_Copy.jpg"}
                      </span>
                      <button
                        type="button"
                        onClick={() => aadhaarFrontFileInputRef.current?.click()}
                        className="text-[11px] font-extrabold text-brand-600 hover:text-brand-700 hover:underline mt-0.5"
                      >
                        Change Front File
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-11 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                      {aadhaarFrontUploaded ? `✓ ${aadhaarFrontFileName}` : "Select First Side (Front Copy)"}
                    </span>
                    <button
                      type="button"
                      onClick={() => aadhaarFrontFileInputRef.current?.click()}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap border shadow-2xs ${
                        aadhaarFrontUploaded
                          ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                          : "bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-800"
                      }`}
                    >
                      {aadhaarFrontUploaded ? "✓ Change File" : "Choose File"}
                    </button>
                  </div>
                )}
              </div>

              {/* 2. Aadhaar Second Side (Back Copy) */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Aadhaar Second Side (Back Copy) <span className="text-rose-500">*</span>
                  </label>
                  {aadhaarBackUploaded && (
                    <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                      ✓ Back Uploaded
                    </span>
                  )}
                </div>

                {aadhaarBackPreview ? (
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center gap-3 shadow-2xs">
                    <div className="relative w-16 h-12 rounded-lg overflow-hidden border border-slate-200 shadow-2xs shrink-0">
                      <Image
                        src={aadhaarBackPreview}
                        alt="Aadhaar Back Preview"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                        {aadhaarBackFileName || "Aadhaar_Back_Copy.jpg"}
                      </span>
                      <button
                        type="button"
                        onClick={() => aadhaarBackFileInputRef.current?.click()}
                        className="text-[11px] font-extrabold text-brand-600 hover:text-brand-700 hover:underline mt-0.5"
                      >
                        Change Back File
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-11 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                      {aadhaarBackUploaded ? `✓ ${aadhaarBackFileName}` : "Select Second Side (Back Copy)"}
                    </span>
                    <button
                      type="button"
                      onClick={() => aadhaarBackFileInputRef.current?.click()}
                      className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap border shadow-2xs ${
                        aadhaarBackUploaded
                          ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800"
                          : "bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-800"
                      }`}
                    >
                      {aadhaarBackUploaded ? "✓ Change File" : "Choose File"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3B: Emergency Guarantor Person Details (ONLY NAME & MOBILE NUMBER) */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 shadow-xs">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <UserCheck className="w-5 h-5 text-brand-600" />
              <span>Step 3B: Emergency Guarantor Name & Mobile Number</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Guarantor Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Guarantor Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Suresh Chandra Yadav"
                  value={guarantorName}
                  onChange={(e) => setGuarantorName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-brand-500 font-semibold"
                />
              </div>

              {/* Guarantor Relation */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Guarantor Relation
                </label>
                <CustomSelect
                  value={guarantorRelation}
                  onChange={(val) => setGuarantorRelation(val)}
                  options={[
                    { value: "Father", label: "Father" },
                    { value: "Brother", label: "Brother" },
                    { value: "Mother", label: "Mother" },
                    { value: "Spouse", label: "Spouse" },
                    { value: "Uncle / Relative", label: "Uncle / Relative" },
                  ]}
                />
              </div>

              {/* Guarantor Mobile Number */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Guarantor Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  {guarantorPhoneVerified && (
                    <span className="text-[10px] text-emerald-600 font-extrabold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="9415000000"
                    value={guarantorPhone}
                    onChange={(e) => setGuarantorPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white outline-none focus:border-brand-500 font-mono font-bold"
                  />
                  {!guarantorPhoneVerified ? (
                    <button
                      type="button"
                      disabled={isSendingGuarantorOtp}
                      onClick={handleVerifyGuarantorPhone}
                      className="h-11 px-4 rounded-xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900 text-brand-700 dark:text-brand-300 font-extrabold text-xs border border-brand-200 dark:border-brand-800 whitespace-nowrap transition-all cursor-pointer shrink-0 flex items-center justify-center shadow-2xs"
                    >
                      {isSendingGuarantorOtp ? "Sending..." : "Verify OTP"}
                    </button>
                  ) : (
                    <span className="h-11 px-3 rounded-xl bg-emerald-50 text-emerald-700 font-extrabold text-xs border border-emerald-200 shrink-0 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                    </span>
                  )}
                </div>

                {showGuarantorOtpInput && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Enter OTP"
                      value={guarantorOtp}
                      onChange={(e) => setGuarantorOtp(e.target.value)}
                      className="w-32 px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none"
                    />
                    <button
                      type="button"
                      disabled={isVerifyingGuarantorOtp}
                      onClick={handleConfirmGuarantorPhoneOtp}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-900 dark:hover:bg-amber-800 text-amber-900 dark:text-amber-200 font-extrabold text-xs border border-amber-300 dark:border-amber-700 transition-colors cursor-pointer"
                    >
                      {isVerifyingGuarantorOtp ? "Verifying..." : "Submit OTP"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3C: Additional Verification Documents (Passport Photo & Selectable ID Documents) */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 shadow-xs">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <FileCheck className="w-5 h-5 text-brand-600" />
              <span>Step 3C: Passport Size Photo & Verification Documents</span>
            </h3>

            {/* Hidden Input Elements for Real OS File Picker Selection */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* 1. CURRENT PASSPORT SIZE PHOTO DRAG & DROP BOX WITH PREVIEW */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <User className="w-4 h-4 text-brand-600" />
                    <span>Current Passport Size Photo *</span>
                  </span>
                  {photoDocUploaded && (
                    <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                      ✓ Uploaded
                    </span>
                  )}
                </div>

                {/* Drag & Drop Upload / Live Preview Box */}
                {passportPhotoPreview ? (
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center gap-4 shadow-2xs">
                    <div className="relative w-16 h-20 rounded-xl overflow-hidden border-2 border-brand-500 shadow-sm shrink-0">
                      <Image
                        src={passportPhotoPreview}
                        alt="Passport Photo Preview"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white block truncate">
                        {photoFileName || "Passport_Photo.jpg"}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium block">
                        3.5cm × 4.5cm • Image
                      </span>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => photoFileInputRef.current?.click()}
                          className="text-[11px] font-bold text-brand-600 hover:text-brand-700 underline cursor-pointer"
                        >
                          Change Photo
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (passportPhotoPreview) {
                              setEditorRawImage(passportPhotoPreview);
                              setIsImageEditorOpen(true);
                            }
                          }}
                          className="text-[11px] font-bold text-slate-600 hover:text-slate-800 cursor-pointer"
                        >
                          Edit / Crop
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPhotoDocUploaded(false);
                            setPassportPhotoPreview(null);
                            setPhotoFileName("");
                            setEditedPhotoFile(null);
                          }}
                          className="text-[11px] font-bold text-red-500 hover:text-red-700 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => photoFileInputRef.current?.click()}
                    className="p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 bg-white dark:bg-slate-900 flex flex-col items-center justify-center text-center space-y-2 cursor-pointer transition-all hover:bg-brand-50/20"
                  >
                    <div className="p-3 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 border border-brand-200">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                        Drag & Drop Passport Photo here or <span className="text-brand-600 underline">Browse</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                        Supports JPG, PNG (3.5 × 4.5 cm, Max 3MB)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. SELECTABLE DOCUMENT TYPE (PAN CARD, DRIVING LICENSE, POLICE CLEARANCE) & DRAG & DROP BOX */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <span className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-brand-600" />
                  <span>Document Type & Upload *</span>
                </span>
                
                {/* STRICT 3 DOCUMENT TYPES DROPDOWN */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                      Select Document Type:
                    </label>
                    <CustomSelect
                      value={selectedDocType}
                      onChange={(val) => setSelectedDocType(val)}
                      options={[
                        { value: "PAN Card", label: "PAN Card" },
                        { value: "Driving License", label: "Driving License" },
                        { value: "Police Clearance Certificate", label: "Police Clearance Certificate" },
                      ]}
                    />
                  </div>

                  {/* Drag & Drop Upload Box for Selected Document */}
                  {additionalDocsList.some((d) => d.type === selectedDocType) ? (
                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 rounded-xl bg-brand-50 text-brand-600 border border-brand-200 shrink-0">
                          <FileCheck className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-extrabold text-slate-900 dark:text-white block truncate">
                            {selectedDocType}
                          </span>
                          <span className="text-[10px] text-emerald-600 font-bold block truncate">
                            ✓ {additionalDocsList.find((d) => d.type === selectedDocType)?.name}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => docTypeFileInputRef.current?.click()}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                      >
                        Change File
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => docTypeFileInputRef.current?.click()}
                      className="p-5 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 bg-white dark:bg-slate-900 flex flex-col items-center justify-center text-center space-y-2 cursor-pointer transition-all hover:bg-brand-50/20"
                    >
                      <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 border border-slate-200">
                        <Upload className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                          Drag & Drop <span className="text-brand-600">{selectedDocType}</span> here or <span className="underline">Browse</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                          PDF, JPG, PNG (Max 5MB)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* List of Uploaded Documents Preview Cards */}
            {additionalDocsList.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-extrabold text-slate-900 dark:text-white block">
                  Uploaded Verification Documents ({additionalDocsList.length}):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {additionalDocsList.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 rounded-xl bg-brand-50 text-brand-600 border border-brand-200 shrink-0">
                          <FileCheck className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-extrabold text-slate-900 dark:text-white block truncate">
                            {doc.type}
                          </span>
                          <span className="text-[10px] text-emerald-600 font-bold block truncate">
                            ✓ {doc.name}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAdditionalDocsList(additionalDocsList.filter((d) => d.id !== doc.id))}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer shrink-0"
                        title="Remove Document"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Bar: Navigate to Step 4 Final Review */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-5 py-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 transition-all cursor-pointer shadow-2xs"
            >
              ← Back to Step 2
            </button>

            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>Next: Final Review & Submit →</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* ─── STEP 4: PREVIEW & SUBMIT OPTION ─── */}
      {currentStep === 4 && (
        <form onSubmit={handleFinalSubmit} className="space-y-6 animate-in fade-in">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-600" />
                <span>Summary Review & Final Submission</span>
              </h3>
              <span className="px-3 py-1 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 text-xs font-mono font-bold border border-brand-200">
                Ready for Activation
              </span>
            </div>

            {/* Summary Grid 1: Personal & Bank */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-brand-600" /> Step 1: Personal & Bank Details
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-xs font-bold text-brand-600 hover:underline"
                >
                  Edit Step 1
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block">Partner Name</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">{name || "Ramesh Kumar Yadav"}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Mobile Number</span>
                  <span className="font-mono font-bold text-emerald-600">+91 {phone || "9839122401"} (Verified)</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Email Address</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{email || "ramesh.yadav@gmail.com"}</span>
                </div>
                <div className="sm:col-span-3">
                  <span className="text-slate-400 font-bold block">Residential Home Address</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{address || "House 14/A, Sigra Chauraha, Varanasi, Uttar Pradesh - 221002"}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Payout Bank</span>
                  <span className="font-bold text-slate-900 dark:text-white">{bankName}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Account Number</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{bankAccountNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">IFSC Code</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{ifscCode}</span>
                </div>
              </div>
            </div>

            {/* Summary Grid 2: Service & Zone */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-purple-600" /> Step 2: Services & Service Pincodes
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="text-xs font-bold text-brand-600 hover:underline"
                >
                  Edit Step 2
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block mb-1.5">
                    Selected Services ({selectedServices.length}):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedServices.map((srv) => (
                      <span
                        key={srv.id}
                        className="pl-1.5 pr-3 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-extrabold flex items-center gap-1.5 shadow-2xs"
                      >
                        <div className="relative w-5 h-5 rounded-md overflow-hidden shrink-0">
                          <Image
                            src={srv.image || "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=400&auto=format&fit=crop&q=80"}
                            alt={srv.title}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        </div>
                        <span>{srv.title} ({srv.type} • ₹{srv.price})</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-1">
                  <span className="text-slate-400 font-bold block mb-1.5">
                    Selected Pincodes Served ({coverageZones.length}):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {coverageZones.map((z, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white flex items-center gap-1.5"
                      >
                        <MapPin className="w-3 h-3 text-rose-500" />
                        <span>{z}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="text-slate-400 font-bold block">Designation Role</span>
                    <span className="font-bold text-slate-900 dark:text-white">{role}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold block">HelpMate Take Rate</span>
                    <span className="font-mono font-bold text-emerald-600">{commissionRate}% (Partner gets {100 - Number(commissionRate)}%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Grid 3: KYC, Guarantor & Document Uploads */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Step 3: Identity KYC, Guarantor & Uploaded Documents
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="text-xs font-bold text-brand-600 hover:underline"
                >
                  Edit Step 3
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-bold block">Aadhaar UID & Both Sides Copy</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{aadhaarNumber || "982341029831"} ({aadhaarDocUploaded ? "✓ Both Sides Uploaded" : "Saved"})</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Guarantor Person</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">{guarantorName || "Suresh Chandra Yadav"} ({guarantorRelation})</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Guarantor Mobile</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">+91 {guarantorPhone || "9415000000"}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-bold block">Current Passport Photo</span>
                  <span className={`font-extrabold ${photoDocUploaded ? "text-emerald-600" : "text-slate-400"}`}>{photoDocUploaded ? "✓ Profile Photo Attached" : "Not Provided"}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400 font-bold block">Uploaded Additional Documents ({additionalDocsList.length})</span>
                  <span className="font-bold text-emerald-600">
                    {additionalDocsList.length > 0 ? additionalDocsList.map((d) => d.type).join(", ") : "None Uploaded"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons with Save as Draft & Approve Options */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-extrabold text-xs border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 transition-all cursor-pointer shadow-2xs"
            >
              ← Back to Step 3
            </button>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {/* SAVE AS DRAFT BUTTON */}
              <button
                type="button"
                onClick={(e) => {
                  setSubmitStatus("Pending");
                  handleFinalSubmit(e as any);
                }}
                disabled={isSubmitting}
                className="px-6 py-3.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-300 font-extrabold text-xs shadow-2xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Save as Draft</span>
              </button>

              {/* APPROVED / ACTIVATED PARTNER BUTTON */}
              <button
                type="button"
                onClick={(e) => {
                  setSubmitStatus("Active");
                  handleFinalSubmit(e as any);
                }}
                disabled={isSubmitting}
                className="px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Approve & Activate Partner</span>
              </button>
            </div>
          </div>
        </form>
      )}
      </>
      )}
      {/* ─── INTERACTIVE PROFILE IMAGE EDITOR MODAL ─── */}
      {isImageEditorOpen && (
        <Portal>
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400">
                    <Crop className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Partner Profile Photo Editor
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Zoom, rotate, and align the partner profile image.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsImageEditorOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Image Editor Preview Window with Cursor Dragging & Wheel Zooming */}
              <div className="flex flex-col items-center space-y-3">
                <div
                  onWheel={(e) => {
                    e.preventDefault();
                    const delta = e.deltaY > 0 ? -0.08 : 0.08;
                    setCropZoom((prev) => Math.min(3, Math.max(1, parseFloat((prev + delta).toFixed(2)))));
                  }}
                  onMouseDown={(e) => {
                    setIsDragging(true);
                    setDragStart({ x: e.clientX - cropOffsetX, y: e.clientY - cropOffsetY });
                  }}
                  onMouseMove={(e) => {
                    if (!isDragging) return;
                    const newX = e.clientX - dragStart.x;
                    const newY = e.clientY - dragStart.y;
                    setCropOffsetX(Math.max(-100, Math.min(100, newX)));
                    setCropOffsetY(Math.max(-100, Math.min(100, newY)));
                  }}
                  onMouseUp={() => setIsDragging(false)}
                  onMouseLeave={() => setIsDragging(false)}
                  onTouchStart={(e) => {
                    if (e.touches[0]) {
                      setIsDragging(true);
                      setDragStart({ x: e.touches[0].clientX - cropOffsetX, y: e.touches[0].clientY - cropOffsetY });
                    }
                  }}
                  onTouchMove={(e) => {
                    if (!isDragging || !e.touches[0]) return;
                    const newX = e.touches[0].clientX - dragStart.x;
                    const newY = e.touches[0].clientY - dragStart.y;
                    setCropOffsetX(Math.max(-100, Math.min(100, newX)));
                    setCropOffsetY(Math.max(-100, Math.min(100, newY)));
                  }}
                  onTouchEnd={() => setIsDragging(false)}
                  className={`relative w-60 h-60 rounded-full border-4 border-brand-500 shadow-2xl overflow-hidden bg-slate-950 flex items-center justify-center select-none transition-shadow ${
                    isDragging ? "cursor-grabbing border-brand-400 ring-4 ring-brand-500/30" : "cursor-grab hover:border-brand-400"
                  }`}
                >
                  {editorRawImage && (
                    <Image
                      src={editorRawImage}
                      alt="Editor Raw Preview"
                      fill
                      unoptimized
                      draggable={false}
                      style={{
                        transform: `scale(${cropZoom}) rotate(${cropRotation}deg) translate(${cropOffsetX}px, ${cropOffsetY}px)`,
                        transition: isDragging ? "none" : "transform 0.1s ease-out",
                        objectFit: "contain",
                        userSelect: "none",
                        pointerEvents: "none",
                      }}
                    />
                  )}
                  {/* Circular Avatar Guide Overlay & Instructions */}
                  <div className="absolute inset-0 pointer-events-none rounded-full border-2 border-white/40" />
                  
                  <div className="absolute bottom-3 px-3 py-1 rounded-full bg-slate-950/80 text-white text-[10px] font-extrabold flex items-center gap-1.5 backdrop-blur-md pointer-events-none border border-white/20 shadow-md">
                    <Move className="w-3 h-3 text-brand-400 animate-pulse" />
                    <span>Drag to move • Scroll to zoom</span>
                  </div>
                </div>

                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  Click and drag inside frame to reposition • Mouse wheel to zoom
                </span>
              </div>

              {/* Editor Controls */}
              <div className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                {/* Zoom Controls */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <ZoomIn className="w-3.5 h-3.5 text-brand-600" />
                      <span>Zoom Level ({Math.round(cropZoom * 100)}%)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setCropZoom(1)}
                      className="text-[10px] font-extrabold text-brand-600 hover:underline"
                    >
                      Reset Zoom
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCropZoom((z) => Math.max(1, z - 0.1))}
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.05}
                      value={cropZoom}
                      onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                      className="w-full accent-brand-600 cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => setCropZoom((z) => Math.min(3, z + 0.1))}
                      className="p-1.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Rotation Controls */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Rotation ({cropRotation}°)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCropRotation((r) => (r - 90 + 360) % 360)}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-extrabold flex items-center justify-center gap-1.5 hover:bg-slate-100"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Rotate Left (-90°)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCropRotation((r) => (r + 90) % 360)}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-extrabold flex items-center justify-center gap-1.5 hover:bg-slate-100"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Rotate Right (+90°)</span>
                    </button>
                  </div>
                </div>

                {/* Position Adjustment */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>Position Offset</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCropOffsetX(0);
                        setCropOffsetY(0);
                      }}
                      className="text-[10px] font-extrabold text-brand-600 hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Center Image</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block mb-1">X Offset ({cropOffsetX}px)</span>
                      <input
                        type="range"
                        min={-50}
                        max={50}
                        value={cropOffsetX}
                        onChange={(e) => setCropOffsetX(parseInt(e.target.value))}
                        className="w-full accent-brand-600 cursor-pointer"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold block mb-1">Y Offset ({cropOffsetY}px)</span>
                      <input
                        type="range"
                        min={-50}
                        max={50}
                        value={cropOffsetY}
                        onChange={(e) => setCropOffsetY(parseInt(e.target.value))}
                        className="w-full accent-brand-600 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer Action Buttons - STRICTLY ONE PRIMARY BUTTON! */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pb-1 pt-3">
                <button
                  type="button"
                  onClick={() => photoFileInputRef.current?.click()}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 font-extrabold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Choose Different File</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsImageEditorOpen(false)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 font-extrabold text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                {/* STRICTLY THE SINGLE PRIMARY BUTTON FOR THE MODAL */}
                <button
                  type="button"
                  onClick={handleApplyImageCrop}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Apply & Save Image</span>
                </button>
              </div>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}

export default function NewTechnicianPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-xs font-bold text-slate-500">Loading partner editor wizard...</div>}>
      <TechnicianFormContent />
    </Suspense>
  );
}
