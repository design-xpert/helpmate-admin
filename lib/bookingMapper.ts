import { Booking, BookingStatus } from "@/lib/mockData";

export function mapApiBooking(b: any): Booking {
  const item0 = b.items?.[0];
  const catName =
    (typeof item0?.category === "object"
      ? item0?.category?.name || item0?.category?.categoryName
      : typeof item0?.category === "string"
      ? item0.category
      : "") ||
    b.category ||
    b.categoryName ||
    "General";
  const subCatName = item0?.subCategory?.name || (typeof item0?.subCategory === "string" ? item0.subCategory : "") || "";
  const serviceActionName = item0?.serviceAction?.name || "";
  const pkgTitle = item0?.package?.name || item0?.package?.packageName || serviceActionName || "Service Package";

  const rawOrigin = b.origin || b.bookingSource || "";
  const originStr = String(rawOrigin).toLowerCase();
  const isOnline =
    originStr === "website" ||
    originStr === "app" ||
    originStr === "online" ||
    b.bookingType === "online" ||
    (typeof b.bookingNumber === "string" && b.bookingNumber.startsWith("WEB-"));

  const createdByStr = isOnline
    ? "Customer Online"
    : b.createdBy?.name
      ? b.createdBy.name
      : b.handledBy?.name
        ? b.handledBy.name
        : originStr === "admin"
          ? "Super Admin (HQ)"
          : "Customer Online";

  const workingDateRaw = b.schedule?.bookingDate || b.workingDate || "";
  const rawWorkingDate = workingDateRaw ? workingDateRaw.split("T")[0] : "";
  const formattedWorkingDate = rawWorkingDate
    ? new Date(workingDateRaw).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "Today";

  const callingDateRaw = b.callingDate || b.createdAt || "";
  const rawCallingDate = callingDateRaw ? callingDateRaw.split("T")[0] : "";
  const formattedCallingDate = callingDateRaw
    ? new Date(callingDateRaw).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "";

  const bookingIdDisplay = b.bookingNumber || (b._id ? `BK-${b._id.slice(-6).toUpperCase()}` : "BK-UNKNOWN");

  // Map all items into servicesList
  const servicesList = (b.items || []).map((item: any, idx: number) => {
    const itemTitle = item.package?.name || item.package?.packageName || item.serviceAction?.name || "Service";
    return {
      id: item.package?.id || item.package?._id || item.serviceAction?.id || item._id || String(idx),
      serviceCode: `${bookingIdDisplay}-${String(idx + 1).padStart(2, "0")}`,
      title: itemTitle,
      price: item.totalPrice || item.unitPrice || item.package?.price || 0,
      quantity: item.quantity || 1,
      category: item.category?.name,
      duration: item.package?.duration ? `${item.package.duration} mins` : undefined,
    };
  });

  // Strictly map status from API response (b.bookingStatus || b.status)
  let status: BookingStatus = "Pending";
  const rawStatus = b.status || b.bookingStatus || "";
  const statusStr = rawStatus.toLowerCase().trim();

  if (statusStr === "completed") {
    status = "Completed";
  } else if (statusStr === "cancelled") {
    status = "Cancelled";
  } else if (statusStr === "rejected") {
    status = "Rejected";
  } else if (statusStr === "in_progress" || statusStr === "in progress" || statusStr === "on_the_way") {
    status = "In Progress";
  } else if (statusStr === "assigned" || statusStr === "partner_assigned" || statusStr === "partner assigned") {
    status = "Assigned";
  } else if (statusStr === "accepted" || statusStr === "partner_accepted" || statusStr === "partner accepted") {
    status = "Partner Accepted";
  } else if (statusStr === "pending") {
    status = "Pending";
  } else if (statusStr === "draft") {
    status = "Draft";
  } else if (rawStatus) {
    status = rawStatus
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c: string) => c.toUpperCase()) as BookingStatus;
  }

  // Address mapping
  const addrObj = b.address || b.serviceAddress || {};
  const fullAddress = [
    addrObj.serviceAddress || addrObj.address,
    addrObj.landmark ? `Near ${addrObj.landmark}` : "",
    addrObj.localityName,
    addrObj.pincode,
  ]
    .filter(Boolean)
    .join(", ") || "Varanasi, UP";

  // Financial / Billing mapping
  const billingObj = b.billing || {};
  const basePriceVal = billingObj.sellingPrice ?? billingObj.mrp ?? item0?.totalPrice ?? item0?.unitPrice ?? b.amount ?? 0;
  const convenienceFeeVal = billingObj.platformFee ?? b.convenienceFee ?? 49;
  const totalAmountVal = billingObj.totalAmount ?? b.amount ?? (basePriceVal + convenienceFeeVal);
  const gstVal = billingObj.gst ?? (basePriceVal + convenienceFeeVal) * 0.18;
  const cgstVal = Number((gstVal / 2).toFixed(2));
  const sgstVal = Number((gstVal - cgstVal).toFixed(2));

  const paymentObj = billingObj.payment || {};
  const rawPayMethod = paymentObj.paymentMethod || b.paymentMethod || "";
  const paymentMethodVal = rawPayMethod.toLowerCase() === "upi" ? "UPI" : rawPayMethod || (isOnline ? "Online" : "Cash on Service");
  const paymentStatusVal = paymentObj.paymentStatus || (status === "Completed" ? "paid" : "pending");

  // Partner / Assignment mapping
  const assignmentObj = b.assignment || {};
  const partnerObj =
    (typeof assignmentObj.partnerId === "object" && assignmentObj.partnerId !== null ? assignmentObj.partnerId : null) ||
    b.assignedPartner ||
    b.partner ||
    assignmentObj.partner ||
    {};

  const partnerNameVal =
    partnerObj.name ||
    partnerObj.partnerName ||
    assignmentObj.partnerName ||
    (typeof b.assignedPartner === "string" ? b.assignedPartner : undefined);

  const partnerPhoneVal =
    partnerObj.mobile ||
    partnerObj.phone ||
    assignmentObj.partnerPhone ||
    (typeof assignmentObj.partnerId === "object" ? assignmentObj.partnerId?.mobile || assignmentObj.partnerId?.phone : undefined);

  const partnerIdVal =
    partnerObj._id ||
    partnerObj.id ||
    partnerObj.partnerId ||
    (typeof assignmentObj.partnerId === "string" ? assignmentObj.partnerId : undefined);

  const rawCallingDateStr = b.createdAt || b.workingDate || "";
  const rawTimestampVal = rawCallingDateStr ? new Date(rawCallingDateStr).getTime() : 0;
  const rawBookingNumVal = parseInt((b.bookingNumber || "").replace(/\D/g, ""), 10) || 0;

  return {
    id: b._id || b.bookingNumber,
    rawId: b._id || b.bookingNumber || "",
    rawTimestamp: rawTimestampVal,
    rawBookingNumber: rawBookingNumVal,
    jobId: bookingIdDisplay,
    bookingNumber: b.bookingNumber || bookingIdDisplay,
    customerId: b.customer?.customerId || b.customer?._id,
    customerBookingCount: b.customerBookingCount ?? b.customer?.bookingCount ?? undefined,
    createdBy: createdByStr,
    origin: isOnline ? "online" : "manual",
    bookingSource: rawOrigin || (isOnline ? "website" : "admin"),
    isOnline: isOnline,
    customerName: b.customer?.name || "Customer",
    customerPhone: b.customer?.mobile || b.customer?.phone || "",
    customerEmail: b.customer?.email || "",
    city: "Varanasi",
    locality: addrObj.localityName || "Varanasi Zone",
    pincode: addrObj.pincode || "221002",
    address: fullAddress,
    serviceTitle: pkgTitle,
    serviceName: serviceActionName || pkgTitle,
    scheduledDate: formattedWorkingDate,
    scheduledTime: b.schedule?.timeSlot || b.time || "12:00 PM",
    category: catName,
    subCategory: subCatName,
    packageTitle: pkgTitle,
    addons: (item0?.selectedAddons || []).map((a: any) => a.name || a.title || "Addon"),
    servicesList: servicesList,
    basePrice: basePriceVal,
    convenienceFee: convenienceFeeVal,
    discountAmount: billingObj.discount || 0,
    gst: gstVal,
    cgst: cgstVal,
    sgst: sgstVal,
    totalAmount: totalAmountVal,
    finalAmount: totalAmountVal,
    commissionAmount: Math.round(basePriceVal * 0.25),
    partnerEarnings: Math.round(basePriceVal * 0.75),
    invoiceType: "B2C",
    paymentMethod: paymentMethodVal,
    paymentStatus: paymentStatusVal,
    status: status,
    technicianId: partnerIdVal,
    technicianName: partnerNameVal,
    technicianPhone: partnerPhoneVal,
    bookingDate: formattedCallingDate || formattedWorkingDate,
    callingDate: formattedCallingDate || rawCallingDate,
    callingPerson: b.createdBy?.name || b.handledBy?.name || (isOnline ? "Online Direct" : "HQ Admin"),
    handledBy: b.createdBy?.name || b.handledBy?.name || (isOnline ? "Website Direct" : "HQ Admin"),
    date: formattedWorkingDate,
    workingDateRaw: rawWorkingDate || (workingDateRaw ? workingDateRaw.split("T")[0] : (b.createdAt ? b.createdAt.split("T")[0] : "")),
    timeSlot: b.schedule?.timeSlot || b.time || "12:00 PM",
    isArchived: Boolean(b.isArchived || b.archived),
    archivedAt: b.archivedAt ? String(b.archivedAt) : undefined,
  };
}

