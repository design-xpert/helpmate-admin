"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { Customer, AddressRecipientType, varanasiLocalities, VaranasiLocality } from "@/lib/mockData";
import { CustomSelect } from "@/components/CustomSelect";
import { getLocalitiesApi, createCustomerApi } from "@/lib/api";
import {
  Search,
  UserPlus,
  ChevronDown,
  User,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  X,
  Home,
  Users,
  HeartHandshake,
  Briefcase,
  HelpCircle,
} from "lucide-react";

interface CustomerSearchPickerProps {
  customers: Customer[];
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer, isNewCustomer?: boolean) => void;
  label?: string;
}

export function CustomerSearchPicker({
  customers,
  selectedCustomer,
  onSelectCustomer,
  label = "Select Customer (Search Name or Mobile Phone)",
}: CustomerSearchPickerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [createError, setCreateError] = useState("");
  const [localityOptions, setLocalityOptions] = useState<
    { id: string; name: string; pincode: string; activeBookings?: number; activeTechs?: number; status?: any; isServiceable?: boolean }[]
  >([]);

  useEffect(() => {
    async function loadLocalities() {
      try {
        const res = await getLocalitiesApi({ limit: 100 });
        if (res && res.success && res.data) {
          const raw = res.data.localities || (Array.isArray(res.data) ? res.data : []);
          if (Array.isArray(raw) && raw.length > 0) {
            setLocalityOptions(
              raw.map((l: any) => ({
                id: l._id,
                name: l.localityName || l.name,
                pincode: l.pincode,
                activeBookings: l.activeBookings || 0,
                activeTechs: l.activeTechs || 0,
                status: (l.status === false ? "Normal" : "High Demand") as any,
                isServiceable: l.status !== false,
              }))
            );
          }
        }
      } catch (err) {
        console.error("loadLocalities error:", err);
      }
    }
    loadLocalities();
  }, []);

  // New Customer Inline Form States
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newLocality, setNewLocality] = useState("");
  const [newPincode, setNewPincode] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [recipientType, setRecipientType] = useState<AddressRecipientType>("Self");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [customerCategory, setCustomerCategory] = useState("individual_household");
  const [propertyHouseholdType, setPropertyHouseholdType] = useState("apartment_flat");

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter customers by Name OR Phone
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateAndSelectCustomer = async () => {
    if (!newName.trim() || !newPhone.trim()) {
      setCreateError("Customer name and mobile number are required.");
      return;
    }

    setIsCreatingCustomer(true);
    setCreateError("");

    try {
      const selectedLoc = localityOptions.find((l) => l.name.toLowerCase() === newLocality.toLowerCase()) || localityOptions.find((l) => l.id === newLocality);
      if (!selectedLoc?.id) {
        setCreateError("Please select a locality.");
        setIsCreatingCustomer(false);
        return;
      }
      if (!newAddress.trim()) {
        setCreateError("Service address is required.");
        setIsCreatingCustomer(false);
        return;
      }
      const locId = selectedLoc.id;
      const relType =
        recipientType === "Self" ? "self" :
        recipientType === "Family Member" ? "family_member" :
        recipientType === "Friend / Neighbor" ? "friend_neighbor" :
        recipientType === "Office / Work" ? "office_work" : "other_person";

      const res = await createCustomerApi({
        fullName: newName.trim(),
        mobile: newPhone.trim(),
        email: newEmail.trim(),
        customerCategory: customerCategory,
        propertyHouseholdType: propertyHouseholdType,
        address: {
          addressLabel: recipientType === "Self" ? "Home (Primary)" : `${recipientType} Address`,
          relationshipType: relType,
          localityId: locId,
          pincode: newPincode.trim() || selectedLoc.pincode || "",
          serviceAddress: newAddress.trim(),
        },
      });

      let createdId = `CUST-${Math.floor(1000 + Math.random() * 9000)}`;
      if (res && res.success && res.data?.customer?._id) {
        createdId = res.data.customer._id;
      } else if (res && res.message && !res.success) {
        setCreateError(res.message);
        setIsCreatingCustomer(false);
        return;
      }

      const created: Customer = {
        id: createdId,
        name: newName.trim(),
        phone: newPhone.trim(),
        email: newEmail.trim() || `${newName.toLowerCase().replace(/\s+/g, "")}@gmail.com`,
        locality: newLocality,
        pincode: newPincode,
        address: newAddress || `${newLocality}, Varanasi`,
        tier: "Standard",
        totalSpend: 0,
        totalBookings: 0,
        lastBookingDate: "Never",
        joinedDate: "Today",
      };

      onSelectCustomer(created, true);
      setIsAddingNew(false);
      setIsOpen(false);

      // Reset inline state
      setNewName("");
      setNewPhone("");
      setNewEmail("");
      setNewAddress("");
      setRecipientType("Self");
      setRecipientName("");
      setRecipientPhone("");
      setCustomerCategory("individual_household");
      setPropertyHouseholdType("apartment_flat");
    } catch (err) {
      console.error("handleCreateAndSelectCustomer error:", err);
      setCreateError("Failed to save customer via API.");
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  const recipientTypeOptions: { type: AddressRecipientType; label: string; icon: any; color: string }[] = [
    { type: "Self", label: "Myself / Home", icon: Home, color: "border-brand-500 bg-brand-50/60 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300" },
    { type: "Family Member", label: "Family Member", icon: Users, color: "border-purple-500 bg-purple-50/60 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300" },
    { type: "Friend / Neighbor", label: "Friend / Neighbor", icon: HeartHandshake, color: "border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300" },
    { type: "Office / Work", label: "Office / Work", icon: Briefcase, color: "border-slate-500 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200" },
    { type: "Other", label: "Other Person", icon: HelpCircle, color: "border-amber-500 bg-amber-50/60 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300" },
  ];

  return (
    <div className="space-y-2 text-xs relative" ref={dropdownRef}>
      <div className="flex items-center justify-between">
        <label className="font-bold text-slate-700 dark:text-slate-300 block">
          {label}
        </label>
        <button
          type="button"
          onClick={() => {
            setIsAddingNew(!isAddingNew);
            setIsOpen(false);
          }}
          className="px-3.5 py-1.5 rounded-xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900 font-extrabold text-[11px] shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>{isAddingNew ? "Cancel New Customer" : "+ Add New Customer"}</span>
        </button>
      </div>

      {/* INLINE NEW CUSTOMER CREATION CARD WITH ADDRESS & RECIPIENT BADGE FLOW */}
      {isAddingNew ? (
        <div className="p-4 rounded-2xl bg-brand-50/90 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-800 space-y-4 animate-in fade-in duration-200 shadow-md">
          <div className="flex items-center justify-between border-b border-brand-200 dark:border-brand-800 pb-2">
            <span className="font-extrabold text-xs text-brand-900 dark:text-brand-200 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-brand-600" /> Create & Auto-Select New Customer
            </span>
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Personal Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Alok Verma"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Mobile Phone Number *
              </label>
              <input
                type="tel"
                required
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="+91 99350 98765"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:border-brand-500"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="alok@gmail.com"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {/* Customer Category & Property Household Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Customer Category *
              </label>
              <select
                value={customerCategory}
                onChange={(e) => setCustomerCategory(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:border-brand-500 text-xs"
              >
                <option value="individual_household">Individual / Household</option>
                <option value="business">Business / Commercial</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Property / Household Type *
              </label>
              <select
                value={propertyHouseholdType}
                onChange={(e) => setPropertyHouseholdType(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:border-brand-500 text-xs"
              >
                <option value="apartment_flat">Apartment / Flat</option>
                <option value="independent_house">Independent House</option>
                <option value="villa">Villa / Bungalow</option>
                <option value="office_shop">Office / Shop</option>
                <option value="other">Other Property</option>
              </select>
            </div>
          </div>

          {/* RECIPIENT RELATIONSHIP BADGE SELECTOR */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 space-y-2.5">
            <label className="font-extrabold text-purple-900 dark:text-purple-300 text-xs block flex items-center justify-between">
              <span>Who is this address & booking for?</span>
              <span className="text-[10px] text-purple-600 font-bold uppercase">Recipient Badge</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {recipientTypeOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = recipientType === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setRecipientType(opt.type)}
                    className={`p-2.5 rounded-xl border text-center font-bold text-[11px] transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      isSelected
                        ? opt.color + " shadow-xs ring-1"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-purple-300"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="leading-tight">{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {recipientType !== "Self" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Recipient Person Name *
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g. Rajesh Sharma (Father)"
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Recipient Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Location & Address inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <CustomSelect
              label="Service Locality *"
              value={newLocality}
              onChange={(val) => {
                setNewLocality(val);
                const foundLoc = localityOptions.find((l) => l.name === val);
                if (foundLoc) setNewPincode(foundLoc.pincode);
              }}
              options={localityOptions.map((loc) => ({
                value: loc.name,
                label: `${loc.name} (${loc.pincode})`,
              }))}
              placeholder="Select Locality..."
            />

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Full Delivery / Service Street Address & Landmark *
              </label>
              <input
                type="text"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="House / Flat No., Street, Colony, Landmark..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold outline-none focus:border-brand-500"
              />
            </div>
          </div>

          {createError && (
            <p className="text-xs text-rose-600 dark:text-rose-400 font-bold px-1">
              ⚠️ {createError}
            </p>
          )}

          <div className="pt-2 border-t border-brand-200 dark:border-brand-800 flex gap-2">
            <button
              type="button"
              onClick={() => setIsAddingNew(false)}
              className="px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateAndSelectCustomer}
              disabled={isCreatingCustomer}
              className="flex-1 py-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            >
              {isCreatingCustomer ? (
                <span>SAVING CUSTOMER...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
                  <span>SAVE & AUTO-SELECT CUSTOMER</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        /* SEARCHABLE CUSTOMER DROPDOWN PICKER */
        <div className="space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onFocus={() => setIsOpen(true)}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsOpen(true);
              }}
              placeholder="Type customer name or mobile number..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 shadow-xs"
            />
            {selectedCustomer && (
              <button
                type="button"
                onClick={() => onSelectCustomer(null as any)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Selected Customer Pill */}
          {selectedCustomer && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="font-extrabold text-slate-900 dark:text-white block">{selectedCustomer.name}</span>
                  <span className="text-[11px] text-slate-500 font-mono">{selectedCustomer.phone} • {selectedCustomer.locality}</span>
                </div>
              </div>
              <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                Selected
              </span>
            </div>
          )}

          {/* Dropdown Options Popup */}
          {isOpen && (
            <div className="absolute left-0 right-0 top-full mt-1 z-[9999] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1.5 shadow-2xl max-h-60 overflow-y-auto space-y-1 animate-in fade-in-50 duration-150">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((cust) => {
                  const isSelected = selectedCustomer?.id === cust.id;
                  return (
                    <button
                      key={cust.id}
                      type="button"
                      onClick={() => {
                        onSelectCustomer(cust);
                        setIsOpen(false);
                      }}
                      className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? "bg-brand-600 text-white shadow-xs"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-white"
                      }`}
                    >
                      <div>
                        <span className="font-extrabold text-xs block">{cust.name}</span>
                        <span className={`text-[10px] font-mono ${isSelected ? "text-brand-100" : "text-slate-500"}`}>
                          {cust.phone} • {cust.locality}
                        </span>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </button>
                  );
                })
              ) : (
                <div className="p-3 text-center text-xs text-slate-400">
                  No matching customers found. Click <strong>"+ Add New Customer"</strong> to create one.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
