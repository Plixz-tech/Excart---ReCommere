import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../api/axios";
import { getAdminSocket } from "../../api/socket";
import {
ArrowLeft,
SlidersHorizontal,
ChevronLeft,
ChevronRight,
Smartphone,
Monitor,
BatteryCharging,
Wrench,
ClipboardCheck,
Wallet,
FileText,
History,
PackageCheck,
ShoppingBag,
Clock3,
CheckCircle2,
XCircle,
Truck,
ContactRound,
UserCheck,
ScanFace,
ReceiptText,
Receipt,
Download,
Info,
Images,
Camera,
Volume2,
Mic,
Power,
Hand,
Wifi,
Bluetooth,
Radio,
Check,
} from "lucide-react";
type OrderStatus =
| "New"
| "Scheduled"
| "Agent Assigned"
| "Picked Up"
| "In Transit"
| "Inspection"
| "Payment Pending"
| "Completed"
| "Ready Stock"
| "Cancelled";
type Order = {
backendId: string;
deviceBackendId: string;
rawStatus: string;
id: string;
customer: string;
phone: string;
device: string;
storage: string;
color: string;
variant: string;
amount: number | null;
dateValue: string | null;
createdAtLabel: string;
customerAddress: string;
agentPhone: string;
purchaseInvoiceUrl: string;
purchaseInvoiceNumber: string;
pickupDate: string;
pickupTime: string;
inventoryStatus: string;
internalNotes: string;
status: OrderStatus;
agent: string;
agentBackendId: string;
date: string;
location: string;
imei: string;
paymentMethod: string;
paymentStatus: string;
invoiceFileName: string | null;
inspectionStatus: string;
condition: string;
deviceInfo: Record<string, string>;
inspectionInfo: Record<string, string>;
functionalChecks: Array<{ label: string; value: string }>;
accessories: Array<{ label: string; value: string }>;
physicalConditions: Array<{ label: string; value: string }>;
deviceImages: Array<{ label: string; url: string }>;
purchaseBillUrl: string;
documents: Array<{
id: string;
type: string;
title: string;
url: string;
fileName: string;
uploadedAt: string | null;
status: string;
}>;
agentNotes: string;
timeline: { title: string; description: string; date: string; actor: string; role: string; completed: boolean }[];
};
type ApiOrder = Record<string, any>;
const statusFromApi = (status: string): OrderStatus => {
const map: Record<string, OrderStatus> = {
pending: "New",
pickup_scheduled: "Scheduled",
assigned: "Agent Assigned",
picked_up: "Picked Up",
in_transit: "In Transit",
inspection_pending: "Inspection",
inspection_in_progress: "Inspection",
inspection_completed: "Inspection",
approved: "Ready Stock",
ready_stock: "Ready Stock",
completed: "Completed",
payment_pending: "Payment Pending",
payment_completed: "In Transit",
cancelled: "Cancelled",
rejected: "Cancelled",
};
return map[status] ?? "New";
};
const formatBackendStatus = (status: string) => status
.replace(/[_-]+/g, " ")
.replace(/\b\w/g, (letter) => letter.toUpperCase());
const tabs = [
{ label: "Overview", icon: Monitor },
{ label: "Device Details", icon: Smartphone },
{ label: "Payments", icon: Wallet },
{ label: "Inspection", icon: ClipboardCheck },
{ label: "Documents", icon: FileText },
{ label: "Timeline", icon: History },
{ label: "Inventory & Sales", icon: ShoppingBag },
];
const statusStyles: Record<OrderStatus, string> = {
New: "bg-blue-50 text-blue-700 ring-blue-200",
Scheduled: "bg-violet-50 text-violet-700 ring-violet-200",
"Agent Assigned": "bg-orange-50 text-orange-700 ring-orange-200",
"Picked Up": "bg-cyan-50 text-cyan-700 ring-cyan-200",
"In Transit": "bg-blue-50 text-blue-700 ring-blue-200",
Inspection: "bg-amber-50 text-amber-700 ring-amber-200",
"Payment Pending": "bg-orange-50 text-orange-700 ring-orange-200",
Completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
"Ready Stock": "bg-emerald-50 text-emerald-700 ring-emerald-200",
Cancelled: "bg-red-50 text-red-700 ring-red-200",
};
const formatDate = (value?: string | Date | null) => {
if (!value) return "—";
const date = new Date(value);
if (Number.isNaN(date.getTime())) return "—";
return new Intl.DateTimeFormat("en-IN", {
day: "2-digit", month: "short", year: "numeric",
}).format(date);
};
const asText = (value: unknown, fallback = "—") =>
typeof value === "string" && value.trim() ? value : fallback;
const asAmount = (...values: unknown[]): number | null => {
for (const value of values) {
if (typeof value === "number" && Number.isFinite(value)) return value;
if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
}
return null;
};
const orderAgentNameForTimeline = (agent: ApiOrder) =>
  asText(agent?.fullName ?? agent?.user?.fullName ?? agent?.name ?? agent?.user?.name, "Agent");
const mapApiOrder = (source: ApiOrder): Order => {
const customer = source.customer ?? {};
const agent = source.agent ?? source.pickup?.assignedAgent ?? {};
const device = source.device ?? {};
const payment = source.payment ?? {};
const pickupAddress = source.pickup?.address ?? {};
const customerAddress = customer.address ?? customer.contactAddress ?? {};
const addressText = (address: ApiOrder) => typeof address === "string"
? address
: [
address?.line1 ?? address?.addressLine1 ?? address?.street,
address?.line2 ?? address?.addressLine2,
address?.area ?? address?.locality,
address?.city ?? address?.district,
address?.state,
address?.pinCode ?? address?.postalCode ?? address?.pincode ?? address?.zipCode,
].filter(Boolean).join(", ");
const pickupScheduledAt = source.pickup?.scheduledAt ?? source.pickup?.scheduledDate ?? source.pickup?.date;
const pickupSlot = source.pickup?.timeSlot ?? source.pickup?.slot ?? source.pickup?.scheduledTime;
const location = [pickupAddress.line1, pickupAddress.city, pickupAddress.state, pickupAddress.pinCode]
.filter(Boolean).join(", ");
const brandModel = [device.brand, device.model].filter(Boolean).join(" ");
const variant = [device.storage, device.ram, device.color || device.variant]
.filter(Boolean).join(" · ");
const rawStatus = String(source.status ?? "pending");
const rawPaymentStatus = typeof payment.status === "string" && payment.status.trim()
? payment.status
: "";
const purchaseInvoice = Array.isArray(source.documents)
? source.documents.find((document: ApiOrder) => document?.type === "purchase_invoice" && (document?.url || document?.fileName))
: undefined;
// Keep the actual PDF filename separate from the invoice number shown to the user.
// The backend should expose invoiceNumber/invoiceNo/number from the generated invoice.
const invoiceFileName = typeof purchaseInvoice?.fileName === "string" && purchaseInvoice.fileName.trim()
? purchaseInvoice.fileName.trim()
: null;
const purchaseInvoiceNumber = purchaseInvoice
? asText(purchaseInvoice.invoiceNumber ?? purchaseInvoice.invoiceNo ?? purchaseInvoice.number, "")
: "";
const inspection = source.inspection ?? {};
const customerEvaluation = device.customerEvaluation ?? source.customerEvaluation ?? source.device?.customerEvaluation ?? {};
const agentEvaluation = device.agentEvaluation ?? source.agentEvaluation ?? source.device?.agentEvaluation ?? {};
const stringifyValue = (value: unknown): string => {
if (typeof value === "boolean") return value ? "Yes" : "No";
if (typeof value === "number") return String(value);
if (typeof value === "string" && value.trim()) return value;
if (Array.isArray(value)) return value.length ? value.map((item) => typeof item === "string" ? item : asText(item?.label ?? item?.name ?? item?.value)).filter(Boolean).join(", ") : "No issues";
if (value && typeof value === "object") {
const record = value as ApiOrder;
if (typeof record.repaired === "boolean") return record.repaired ? "Repaired" : "Not repaired";
if (typeof record.value === "string" || typeof record.value === "number" || typeof record.value === "boolean") return stringifyValue(record.value);
if (typeof record.status === "string") return record.status;
}
return "—";
};
const labelValueList = (value: unknown): Array<{ label: string; value: string }> => {
if (Array.isArray(value)) {
return value.map((item: ApiOrder, index: number) => ({
label: asText(item?.label ?? item?.name ?? item?.key, `Item ${index + 1}`),
value: stringifyValue(item?.value ?? item?.status ?? item?.result ?? item?.checked),
}));
}
if (value && typeof value === "object") {
return Object.entries(value as Record<string, unknown>).map(([key, item]) => ({
label: key.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ").replace(/^./, (letter) => letter.toUpperCase()),
value: stringifyValue(item),
}));
}
return [];
};
const sourceDocuments = Array.isArray(source.documents) ? source.documents : [];
const pickupVerification = source.pickup?.verification ?? source.verification ?? {};
const aadhaarVerification = pickupVerification.aadhaar ?? {};
const aadhaarFile = aadhaarVerification.document ?? {};
const aadhaarXml = aadhaarVerification.xml ?? {};
const customerPhoto = pickupVerification.customerPhoto ?? {};
const documentTitles: Record<string, string> = {
  aadhaar: "Aadhaar Document",
  aadhaar_offline_ekyc: "Aadhaar e-KYC",
  pan: "PAN Card",
  device_invoice: "Device Invoice",
  purchase_invoice: "Purchase Invoice",
  payment_slip: "Payment Slip",
  ownership: "Ownership Proof",
  purchase_proof: "Purchase Proof",
  purchase_bill: "Purchase Bill",
  purchase_receipt: "Purchase Receipt",
  device_purchase_bill: "Device Purchase Bill",
  other: "Other Document",
};
const documentTitle = (type: string) =>
  documentTitles[type] ?? type.replace(/[_-]+/g, " ").replace(/\\b\\w/g, (letter) => letter.toUpperCase());
const mappedDocuments = sourceDocuments.map((document: ApiOrder, index: number) => {
  const type = String(document?.type ?? "other").toLowerCase();
  return {
    id: String(document?._id ?? document?.publicId ?? `${type}-${index}`),
    type,
    title: documentTitle(type),
    url: typeof document?.url === "string" ? document.url : "",
    fileName: typeof document?.fileName === "string" ? document.fileName : "",
    uploadedAt: document?.uploadedAt ? String(document.uploadedAt) : null,
    status: document?.url ? "Available" : "Missing",
  };
});
const pickupDocuments = [
  { type: "live_photo", title: "Live Photo", file: customerPhoto },
  { type: "aadhaar", title: "Aadhaar Document", file: aadhaarFile },
  { type: "aadhaar_offline_ekyc", title: "Aadhaar e-KYC", file: aadhaarXml },
].filter((item) => Boolean(item.file?.url)).map((item) => ({
  id: `${item.type}-${String(item.file?.publicId ?? item.file?.fileName ?? item.type)}`,
  type: item.type,
  title: item.title,
  url: String(item.file?.url ?? ""),
  fileName: String(item.file?.fileName ?? ""),
  uploadedAt: item.file?.uploadedAt ? String(item.file.uploadedAt) : null,
  status: "Available",
}));
const orderDocuments = [...pickupDocuments, ...mappedDocuments];
const purchaseBill = sourceDocuments.find((document: ApiOrder) =>
["purchase_bill", "purchase_receipt", "device_purchase_bill"].includes(String(document?.type ?? "").toLowerCase()) && document?.url
);
const imageCandidates = device.images ?? device.deviceImages ?? device.photos ?? source.deviceImages ?? source.devicePhotos ?? inspection.images ?? inspection.deviceImages ?? inspection.photos ?? [];
const deviceImages = Array.isArray(imageCandidates) ? imageCandidates.map((image: ApiOrder, index: number) => ({
label: asText(image?.label ?? image?.view ?? image?.type, `Image ${index + 1}`),
url: typeof image === "string" ? image : asText(image?.url ?? image?.secure_url, ""),
})).filter((image: { label: string; url: string }) => Boolean(image.url)) : [];
const functionalChecks = labelValueList(agentEvaluation.functionalChecks ?? inspection.functionalChecks ?? inspection.functionalStatus ?? inspection.checks);
const accessories = labelValueList(customerEvaluation.accessories ?? agentEvaluation.accessories ?? inspection.accessories ?? device.accessories ?? source.accessories);
const physicalConditions = labelValueList(agentEvaluation.physicalCondition ?? agentEvaluation.physicalConditions ?? inspection.physicalCondition ?? inspection.physicalConditions ?? inspection.conditionDetails);
const timelineEvents = Array.isArray(source.timeline) ? source.timeline : [];
const timeline = timelineEvents.length
? timelineEvents.map((event: ApiOrder) => {
    const eventStatus = String(event.status ?? event.event ?? event.action ?? "").replaceAll("_", " ");
    const title = asText(event.message ?? event.title ?? event.description, eventStatus ? formatBackendStatus(eventStatus) : "Order update");
    const description = asText(event.description ?? event.details, title);
    const normalized = `${title} ${description} ${eventStatus}`.toLowerCase();
    const actorValue = event.actor ?? event.performedBy ?? event.user ?? event.updatedBy ?? event.createdBy;
    const rawActorName = typeof actorValue === "string"
      ? actorValue
      : actorValue?.fullName ?? actorValue?.name ?? actorValue?.displayName ?? "";
    const actorId = typeof actorValue === "string" ? actorValue : String(actorValue?._id ?? actorValue?.id ?? "");
    const looksLikeId = /^[a-f\\d]{20,}$/i.test(String(rawActorName || actorId).trim());
    const eventActorRole = String(event.role ?? (typeof actorValue === "object" ? actorValue?.role : "") ?? "").toLowerCase();

    // Resolve responsibility from the activity itself, not from the presence of an actor ID.
    const selfAssigned = /self.?assign|agent assigned (?:themselves|himself|herself)|assigned (?:themselves|himself|herself)/i.test(normalized)
      || Boolean(event.selfAssigned ?? event.isSelfAssigned ?? (String(event.assignmentType ?? "").toLowerCase() === "self"));
    const isAssignment = normalized.includes("assign");
    const isPaymentCompleted = /(payment|payout).*(completed|successful|processed|paid|recorded)|(?:completed|successful|processed|paid).*(payment|payout)/i.test(normalized);
    const isPaymentOnly = normalized.includes("payment") || normalized.includes("payout");
    const isStoreReceipt = /received at store|device received at (?:the )?store|store receipt/i.test(normalized);
    const isInspection = /inspection|inspect|quality check|approved|approval/i.test(normalized);
    const isInventory = /inventory|added to stock|stock/i.test(normalized);
    const isPickup = /pickup|picked up|pick-up|accepted the pickup request/i.test(normalized);
    const isVerification = /aadhaar|document|verification|customer photo/i.test(normalized);
    let actor = !looksLikeId && rawActorName ? String(rawActorName) : "";
    let role = asText(event.role ?? (typeof actorValue === "object" ? actorValue?.role : ""), "");

    if (isAssignment) {
      if (selfAssigned) { actor = orderAgentNameForTimeline(agent); role = "Agent"; }
      else { actor = "Admin"; role = "Admin"; }
    } else if (isStoreReceipt || isInspection) {
      actor = "Admin"; role = "Admin";
    } else if (isPickup || isVerification) {
      actor = orderAgentNameForTimeline(agent); role = "Agent";
    } else if (isPaymentOnly) {
      actor = "Admin"; role = "Admin";
    } else if (isInventory) {
      actor = "Inventory Team"; role = "Team";
    } else if (/created order|order created|order was created/i.test(normalized)) {
      actor = "System"; role = "";
    } else if (eventActorRole.includes("admin")) {
      actor = "Admin"; role = "Admin";
    } else if (eventActorRole.includes("agent")) {
      actor = orderAgentNameForTimeline(agent); role = "Agent";
    } else if (!actor) {
      actor = "System"; role = "";
    }
    const eventDate = event.createdAt ?? event.timestamp ?? event.date;
    return {
      title,
      description,
      date: eventDate
        ? `${formatDate(eventDate)}${Number.isNaN(new Date(eventDate).getTime()) ? "" : ` · ${new Date(eventDate).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`}`
        : "—",
      actor,
      role,
      completed: true,
    };
  })
: source.createdAt
  ? [{
      title: "Order Created",
      description: "The order was created.",
      date: `${formatDate(source.createdAt)}${Number.isNaN(new Date(source.createdAt).getTime()) ? "" : ` · ${new Date(source.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`}`,
      actor: "System",
      role: "",
      completed: true,
    }]
  : [];
return {
backendId: String(source._id ?? source.id ?? ""),
deviceBackendId: String(device._id ?? device.id ?? ""),
rawStatus,
id: asText(source.orderNumber, String(source._id ?? "Order")),
customer: asText(customer.fullName),
phone: asText(customer.phone),
device: asText(brandModel),
storage: asText(device.storage),
color: asText(device.color ?? device.variant),
variant: asText(variant, "—"),
amount: (() => {
const amount = asAmount(payment.finalAmount, payment.estimatedAmount, source.estimatedAmount);
return amount !== null && amount > 0 ? amount : null;
})(),
status: statusFromApi(rawStatus),
agent: asText(agent.fullName ?? agent.user?.fullName ?? agent.name ?? agent.user?.name, "Unassigned"),
agentBackendId: String(agent._id ?? agent.id ?? (typeof source.agent === "string" ? source.agent : "") ?? source.pickup?.assignedAgent?._id ?? ""),
date: formatDate(source.createdAt),
dateValue: source.createdAt ? String(source.createdAt) : null,
createdAtLabel: source.createdAt
? `${formatDate(source.createdAt)} · ${new Date(source.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
: "—",
customerAddress: addressText(customerAddress) || "—",
agentPhone: asText(agent.phone ?? agent.mobile ?? agent.phoneNumber ?? agent.mobileNumber ?? agent.contactNumber ?? agent.user?.phone ?? agent.user?.mobile ?? agent.profile?.phone ?? agent.profile?.mobile),
purchaseInvoiceUrl: asText(purchaseInvoice?.url, ""),
purchaseInvoiceNumber,
pickupDate: formatDate(pickupScheduledAt),
pickupTime: asText(pickupSlot),
inventoryStatus: asText(source.inventory?.status ?? source.inventoryStatus),
internalNotes: asText(source.internalNotes ?? source.notes, ""),
location: location || "—",
imei: asText(device.imei1),
paymentMethod: asText(payment.paymentMethod).replaceAll("_", " "),
paymentStatus: rawPaymentStatus ? (rawPaymentStatus === "completed" ? "Paid" : rawPaymentStatus.replaceAll("_", " ")) : "—",
invoiceFileName,
inspectionStatus: asText(source.inspection?.status, rawStatus.includes("inspection") ? rawStatus.replaceAll("inspection_", "") : "Not Started"),
condition: stringifyValue(customerEvaluation.bodyCondition ?? agentEvaluation.bodyCondition ?? inspection.condition),
deviceInfo: {
network: stringifyValue(device.network ?? device.networkType ?? device.connectivity),
simSlot: stringifyValue(device.simSlot ?? device.simSlots ?? device.simType),
esim: stringifyValue(device.esimSupport ?? device.eSIMSupport ?? device.esim ?? device.eSIM),
warrantyStatus: stringifyValue(device.warrantyStatus ?? inspection.warrantyStatus),
},
inspectionInfo: {
screenCondition: stringifyValue(customerEvaluation.screenCondition ?? agentEvaluation.screenCondition ?? inspection.screenCondition ?? inspection.physicalCondition?.screen ?? inspection.physicalConditions?.screen),
displayIssues: stringifyValue(customerEvaluation.displayIssues ?? agentEvaluation.displayIssues ?? inspection.displayIssues ?? inspection.displayIssue ?? inspection.functionalChecks?.display),
batteryHealth: stringifyValue(customerEvaluation.batteryHealth ?? agentEvaluation.batteryHealth ?? inspection.batteryHealth ?? inspection.functionalChecks?.batteryHealth ?? device.batteryHealth),
repairStatus: stringifyValue(customerEvaluation.repairHistory ?? agentEvaluation.repairHistory ?? inspection.repairStatus ?? inspection.repairHistory ?? device.repairStatus),
displayCondition: stringifyValue(inspection.displayCondition ?? inspection.physicalCondition?.display),
scratches: stringifyValue(inspection.scratches ?? inspection.physicalCondition?.scratches),
backPanel: stringifyValue(inspection.backPanel ?? inspection.physicalCondition?.backPanel),
dents: stringifyValue(inspection.dents ?? inspection.physicalCondition?.dents),
frame: stringifyValue(inspection.frame ?? inspection.physicalCondition?.frame),
},
functionalChecks,
accessories,
physicalConditions,
deviceImages,
purchaseBillUrl: asText(purchaseBill?.url, ""),
documents: orderDocuments,
agentNotes: asText(inspection.notes ?? inspection.agentNotes ?? inspection.additionalNotes, ""),
timeline,
};
};
const FUNCTIONAL_CHECK_LABELS = [
"Display", "Speaker", "Touch Screen", "Microphone", "Buttons",
"Charging", "Camera (Front)", "Battery Health", "Camera (Back)", "Face ID / Fingerprint",
];
const ACCESSORY_LABELS = ["Original Box", "Charger", "Cable", "Earphones", "Other Accessories"];
const PHYSICAL_CONDITION_LABELS = ["Overall", "Display Condition", "Condition", "Scratches", "Back Panel", "Dents"];
const normalizeLabel = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
const getReportedValue = (items: Array<{ label: string; value: string }>, label: string) => {
const aliases: Record<string, string[]> = {
display: ["screen", "displaystatus"],
touchscreen: ["touch", "touchresponse"],
camerafront: ["frontcamera"],
cameraback: ["backcamera", "rearcamera"],
faceidfingerprint: ["faceid", "fingerprint", "biometrics"],
originalbox: ["box"],
otheraccessories: ["other"],
overall: ["overallcondition", "bodycondition"],
condition: ["bodycondition", "overallcondition"],
};
const possible = [normalizeLabel(label), ...(aliases[normalizeLabel(label)] ?? [])];
const match = items.find((item) => possible.includes(normalizeLabel(item.label)));
return match?.value && match.value !== "—" ? match.value : "";
};
const inspectionValueClass = (label: string, value: string) => {
const normalized = value.trim().toLowerCase();
if (!normalized || normalized === "—") return "text-stone-700";
if (label === "Battery Health") {
const numeric = Number(normalized.match(/\d+(?:\.\d+)?/)?.[0]);
if (Number.isFinite(numeric)) return numeric < 70 ? "text-red-600" : numeric > 90 ? "text-emerald-600" : "text-orange-600";
}
if (label === "Repair Status") {
if (/repaired|repair required|replaced|yes/.test(normalized) && !/not repaired|original|no repair|no/.test(normalized)) return "text-red-600";
if (/not repaired|original|no repair|no/.test(normalized)) return "text-emerald-600";
}
if (/poor|issue|damaged|broken|crack|fault|not working|bad/.test(normalized)) return "text-red-600";
if (/average|fair|minor|moderate|warning/.test(normalized)) return "text-orange-600";
if (/good|excellent|working|healthy|no issues|not repaired|original/.test(normalized)) return "text-emerald-600";
return "text-stone-700";
};
interface OrdersResponse {
success: boolean;
data: ApiOrder[];
pagination?: { total?: number; page?: number; limit?: number; totalPages?: number };
}
function formatAmount(amount: number | null | undefined) {
if (typeof amount !== "number" || !Number.isFinite(amount)) return "—";
return new Intl.NumberFormat("en-IN", {
style: "currency",
currency: "INR",
maximumFractionDigits: 0,
}).format(amount);
}
function StatusBadge({ status }: { status: OrderStatus }) {
return (
<span
className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyles[status]}`}
>
<span className="mr-1.5"></span>
{status}
</span>
);
}
function DetailSection({
title,
children,
className = "",
}: {
title: string;
children: React.ReactNode;
className?: string;
}) {
return (
<section className={`group overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-[0_2px_10px_rgba(28,25,23,0.035)] transition-shadow duration-200 hover:shadow-[0_6px_20px_rgba(28,25,23,0.06)] ${className}`}>
<div className="flex items-center gap-3 border-b border-stone-100 bg-gradient-to-r from-stone-50/90 via-white to-white px-5 py-4">
<span className="h-5 w-1 shrink-0 rounded-full bg-orange-500" />
<h3 className="text-sm font-semibold tracking-tight text-stone-900">{title}</h3>
</div>
<div className="p-5">{children}</div>
</section>
);
}
function DetailRow({ label, value }: { label: string; value: string }) {
return (
<div className="group flex flex-col gap-1.5 border-b border-stone-100/90 py-3.5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
<span className="text-[13px] font-medium text-stone-500 transition-colors group-hover:text-stone-700">{label}</span>
<span className="break-words text-[13px] font-semibold leading-5 text-stone-800 sm:text-right">{value || "—"}</span>
</div>
);
}
// Compare orders created in the most recent 30 days with the previous 30 days.
 // These are live comparisons calculated from the loaded order records, not hardcoded percentages.
type TrendPeriod = "month" | "week" | "day";

// Trends are calculated from real order records. Status trends group records by
// their current status and creation date; pickup trends use the scheduled pickup date.
function getCardTrend(
  orders: Order[],
  statuses?: string[],
  period: TrendPeriod = "month",
  usePickupDate = false,
) {
  const now = new Date();
  const currentStart = new Date(now);
  const previousStart = new Date(now);
  const periodLabel =
    period === "day" ? "vs yesterday" :
    period === "week" ? "vs last week" :
    "from last month";

  if (period === "day") {
    currentStart.setHours(0, 0, 0, 0);
    previousStart.setTime(currentStart.getTime());
    previousStart.setDate(previousStart.getDate() - 1);
  } else if (period === "week") {
    currentStart.setDate(currentStart.getDate() - 7);
    previousStart.setDate(previousStart.getDate() - 14);
  } else {
    currentStart.setDate(currentStart.getDate() - 30);
    previousStart.setDate(previousStart.getDate() - 60);
  }

  const matchesStatus = (order: Order) =>
    !statuses || statuses.includes(String(order.rawStatus).toLowerCase());

  const inRange = (order: Order, start: Date, end: Date) => {
    if (!matchesStatus(order)) return false;
    const dateValue = usePickupDate ? order.pickupDate : order.dateValue;
    if (!dateValue) return false;
    const recordDate = new Date(dateValue);
    return !Number.isNaN(recordDate.getTime()) && recordDate >= start && recordDate < end;
  };

  const current = orders.filter((order) => inRange(order, currentStart, now)).length;
  const previous = orders.filter((order) => inRange(order, previousStart, currentStart)).length;

  // A percentage is undefined when the previous period had zero records.
  // Show the real count difference instead of the unhelpful "No previous data".
  // This keeps the card dynamic without inventing a percentage.
  if (previous === 0) {
    const difference = current - previous;
    return {
      text: difference > 0 ? `+${difference} ${difference === 1 ? "order" : "orders"}` : "0 orders",
      direction: difference > 0 ? "up" as const : "flat" as const,
      period: periodLabel,
    };
  }

  const change = ((current - previous) / previous) * 100;
  return {
    text: `${change > 0 ? "+" : ""}${change.toFixed(1)}%`,
    direction: change > 0 ? "up" as const : change < 0 ? "down" as const : "flat" as const,
    period: periodLabel,
  };
}

export default function Orders() {
const [orders, setOrders] = useState<Order[]>([]);
const [agents, setAgents] = useState<any[]>([]);
const [selectedAgentId, setSelectedAgentId] = useState("");
const [isAssigningAgent, setIsAssigningAgent] = useState(false);
const [internalNotesDraft, setInternalNotesDraft] = useState("");
const [isSavingNotes, setIsSavingNotes] = useState(false);
const [cancelReason, setCancelReason] = useState("");
const [cancelError, setCancelError] = useState("");
const [cancelRemarks, setCancelRemarks] = useState("");
const [search, setSearch] = useState("");
const [statusFilter, setStatusFilter] = useState("All");
const [dateFilter] = useState("All time");
const [page, setPage] = useState(1);
const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
const [activeTab, setActiveTab] = useState("Overview");
const [showAllDeviceImages, setShowAllDeviceImages] = useState(false);
const [isLoading, setIsLoading] = useState(true);
const [isSaving, setIsSaving] = useState(false);
const [loadError, setLoadError] = useState("");
const [successMessage, setSuccessMessage] = useState("");
const [inspectionRecord, setInspectionRecord] = useState<any | null>(null);
const [inspectionLoading, setInspectionLoading] = useState(false);
const [inspectionSaving, setInspectionSaving] = useState(false);
const [inspectionLoadError, setInspectionLoadError] = useState("");
const [inspectionMessage, setInspectionMessage] = useState("");
const [inspectionStep, setInspectionStep] = useState("Functional Check");
const [inspectionCompletionRequested, setInspectionCompletionRequested] = useState(false);
const [inspectionForm, setInspectionForm] = useState<any>({
screenCondition: "",
bodyCondition: "",
batteryHealth: "",
functionalTests: { camera: null, speaker: null, microphone: null, buttons: null, touchScreen: null, wifi: null, bluetooth: null, faceId: null, fingerprint: null, chargingPort: null, network: null, vibration: null, gps: null },
accessories: { charger: false, cable: false, box: false, bill: false, simEjector: false, earphones: false },
repairHistory: { repaired: false, remarks: "" },
overallGrade: "",
sellingPrice: "",
warrantyType: "no_warranty",
warrantyProvider: "",
warrantyDuration: "",
warrantyValidUntil: "",
remarks: "",
});
const fetchOrders = useCallback(async (options?: { silent?: boolean }) => {
  const silent = options?.silent ?? false;

  if (!silent) {
    setIsLoading(true);
  }

  setLoadError("");
try {
// The backend allows a maximum of 100 records per request. Load every
// backend page so search, filters, and summary cards use the complete
// order dataset rather than only the first 100 records.
const firstResponse = await api.get<OrdersResponse>("/admin/orders", {
params: { page: 1, limit: 20 },
});
const firstPageOrders = Array.isArray(firstResponse.data?.data)
? firstResponse.data.data
: [];
const totalPages = Math.max(1, Number(firstResponse.data?.pagination?.totalPages) || 1);
const allApiOrders = [...firstPageOrders];
for (let currentPage = 2; currentPage <= totalPages; currentPage += 1) {
const pageResponse = await api.get<OrdersResponse>("/admin/orders", {
params: { page: currentPage, limit: 20 },
});
if (Array.isArray(pageResponse.data?.data)) {
allApiOrders.push(...pageResponse.data.data);
}
}
setOrders(allApiOrders.map(mapApiOrder));
try {
const agentsResponse = await api.get("/admin/agents", { params: { page: 1, limit: 100 } });
const agentPayload = agentsResponse.data?.data;
const agentList = Array.isArray(agentPayload) ? agentPayload : Array.isArray(agentPayload?.agents) ? agentPayload.agents : Array.isArray(agentsResponse.data?.agents) ? agentsResponse.data.agents : [];
setAgents(agentList);
} catch {
// Keep order loading available if the agent-list endpoint is unavailable.
}
} catch (error: any) {
setLoadError(error?.response?.data?.message || error?.message || "Unable to load orders.");
} finally {
  if (!silent) {
    setIsLoading(false);
  }
}
}, []);
useEffect(() => {
  // Load the current data when the Orders page opens and manage the loading state.
  void fetchOrders();

  const socket = getAdminSocket();

  if (!socket) {
    console.warn(
      "[ExCart Orders] Real-time socket is not initialized; automatic updates are unavailable until it connects.",
    );
    return;
  }

  const relevantEntities = new Set([
    "orders",
    "order",
    "agents",
    "agent",
    "users",
    "user",
    "devices",
    "device",
    "inspections",
    "inspection",
    "inventory",
    "payments",
    "payment",
    "pickups",
    "pickup",
  ]);

  const handleDataChanged = (payload: {
    entity?: string;
    action?: string;
    recordId?: string;
    timestamp?: string;
  }) => {
    const entity = payload?.entity?.toLowerCase();

    if (!entity || !relevantEntities.has(entity)) {
      return;
    }

    console.info(
      "[ExCart Orders] Refreshing orders after real-time event:",
      payload,
    );

    void fetchOrders();
  };

  // Refresh this page when another admin changes an order or related data.
  socket.on("data:changed", handleDataChanged);

  // Re-fetch after a reconnect so changes made while disconnected are not missed.
  socket.on("connect", handleReconnect);

  function handleReconnect() {
    void fetchOrders();
  }

  return () => {
    socket.off("data:changed", handleDataChanged);
    socket.off("connect", handleReconnect);
  };
}, [fetchOrders]);
const selectedOrder = orders.find((order) => order.id === selectedOrderId);
useEffect(() => {
setSelectedAgentId(selectedOrder?.agentBackendId ?? "");
const existingNotes = selectedOrder?.internalNotes ?? "";
setInternalNotesDraft(/notification testing/i.test(existingNotes) ? "" : existingNotes === "—" ? "" : existingNotes);
setCancelReason("");
setCancelRemarks("");
}, [selectedOrder?.backendId, selectedOrder?.agentBackendId, selectedOrder?.internalNotes]);
const hydrateInspectionForm = (record: any) => {
setInspectionForm({
screenCondition: record?.screenCondition ?? "",
bodyCondition: record?.bodyCondition ?? "",
batteryHealth: record?.batteryHealth ?? "",
functionalTests: {
camera: record?.functionalTests?.camera ?? null,
speaker: record?.functionalTests?.speaker ?? null,
microphone: record?.functionalTests?.microphone ?? null,
buttons: record?.functionalTests?.buttons ?? null,
touchScreen: record?.functionalTests?.touchScreen ?? null,
wifi: record?.functionalTests?.wifi ?? null,
bluetooth: record?.functionalTests?.bluetooth ?? null,
faceId: record?.functionalTests?.faceId ?? null,
fingerprint: record?.functionalTests?.fingerprint ?? null,
chargingPort: record?.functionalTests?.chargingPort ?? null,
network: record?.functionalTests?.network ?? null,
vibration: record?.functionalTests?.vibration ?? null,
gps: record?.functionalTests?.gps ?? null,
},
accessories: {
charger: Boolean(record?.accessories?.charger),
cable: Boolean(record?.accessories?.cable),
box: Boolean(record?.accessories?.box),
bill: Boolean(record?.accessories?.bill),
simEjector: Boolean(record?.accessories?.simEjector),
earphones: Boolean(record?.accessories?.earphones),
},
repairHistory: {
repaired: Boolean(record?.repairHistory?.repaired),
remarks: record?.repairHistory?.remarks ?? "",
},
overallGrade: record?.overallGrade ?? "",
sellingPrice: record?.sellingPrice ?? record?.estimatedPrice ?? "",
warrantyType: record?.warranty?.type ? "warranty" : (record?.warrantyType ?? "no_warranty"),
warrantyProvider: record?.warranty?.provider ?? record?.warrantyProvider ?? "",
warrantyDuration: record?.warranty?.duration ?? record?.warrantyDuration ?? "",
warrantyValidUntil: record?.warranty?.validUntil ? String(record.warranty.validUntil).slice(0, 10) : (record?.warrantyValidUntil ? String(record.warrantyValidUntil).slice(0, 10) : ""),
remarks: record?.remarks ?? "",
});
};
const loadInspection = useCallback(async () => {
if (!selectedOrder) return;
setInspectionLoading(true);
setInspectionLoadError("");
setInspectionMessage("");
setInspectionCompletionRequested(false);
try {
const response = await api.get("/admin/inspections", { params: { page: 1, limit: 100 } });
const payload = response.data?.data;
const records = Array.isArray(payload?.inspections) ? payload.inspections : Array.isArray(payload) ? payload : [];
const found = records.find((item: any) => String(item?.order?._id ?? item?.order ?? "") === selectedOrder.backendId);
setInspectionRecord(found ?? null);
if (found) hydrateInspectionForm(found);
else hydrateInspectionForm(null);
} catch (error: any) {
setInspectionLoadError(error?.response?.data?.message || error?.message || "Unable to load inspection details.");
} finally {
setInspectionLoading(false);
}
}, [selectedOrder?.backendId]);
useEffect(() => {
if (activeTab === "Inspection" && selectedOrder) void loadInspection();
}, [activeTab, selectedOrder?.backendId, loadInspection]);
const startInspection = async () => {
if (!selectedOrder) return;
if (!selectedOrder.deviceBackendId) {
setInspectionLoadError("This order does not have a linked device ID, so an inspection cannot be started.");
return;
}
setInspectionSaving(true);
setInspectionLoadError("");
setInspectionMessage("");
try {
const response = await api.post("/admin/inspections", {
order: selectedOrder.backendId,
device: selectedOrder.deviceBackendId,
});
const created = response.data?.data;
setInspectionRecord(created);
hydrateInspectionForm(created);
await fetchOrders();
setInspectionMessage("Inspection started. Enter the actual device test results and save them.");
} catch (error: any) {
setInspectionLoadError(error?.response?.data?.message || error?.message || "Unable to start inspection.");
} finally {
setInspectionSaving(false);
}
};
const saveInspection = async () => {
if (!inspectionRecord?._id) return;
setInspectionSaving(true);
setInspectionLoadError("");
setInspectionMessage("");
const functionalTests = Object.fromEntries(Object.entries(inspectionForm.functionalTests).filter(([, value]) => typeof value === "boolean"));
try {
const response = await api.patch(`/admin/inspections/${inspectionRecord._id}`, {
...(inspectionForm.screenCondition ? { screenCondition: inspectionForm.screenCondition } : {}),
...(inspectionForm.bodyCondition ? { bodyCondition: inspectionForm.bodyCondition } : {}),
...(inspectionForm.batteryHealth !== "" ? { batteryHealth: Number(inspectionForm.batteryHealth) } : {}),
functionalTests,
accessories: inspectionForm.accessories,
repairHistory: inspectionForm.repairHistory,
...(inspectionForm.overallGrade ? { overallGrade: inspectionForm.overallGrade } : {}),
...(inspectionForm.sellingPrice !== "" ? { sellingPrice: Number(inspectionForm.sellingPrice), estimatedPrice: Number(inspectionForm.sellingPrice) } : {}),
warrantyType: inspectionForm.warrantyType,
warranty: inspectionForm.warrantyType === "warranty" ? { type: inspectionForm.warrantyType, provider: inspectionForm.warrantyProvider, duration: inspectionForm.warrantyDuration, validUntil: inspectionForm.warrantyValidUntil || null } : { type: "no_warranty", provider: "", duration: "", validUntil: null },
warrantyProvider: inspectionForm.warrantyProvider,
warrantyDuration: inspectionForm.warrantyDuration,
warrantyValidUntil: inspectionForm.warrantyValidUntil || null,
remarks: inspectionForm.remarks,
});
const updated = response.data?.data;
if (updated) {
setInspectionRecord(updated);
hydrateInspectionForm(updated);
}
if (inspectionCompletionRequested) {
const estimatedPrice = Number(inspectionForm.sellingPrice);
if (!Number.isFinite(estimatedPrice) || estimatedPrice <= 0) {
  setInspectionStep("Overall Condition");
  setInspectionLoadError("Enter a valid selling price before completing the inspection.");
  setInspectionSaving(false);
  return;
}
await api.patch(`/admin/inspections/${inspectionRecord._id}/complete`, { estimatedPrice, sellingPrice: estimatedPrice });
// This workflow requests the Ready Stock transition immediately after inspection completion.
// The existing backend status endpoint performs the approved/ready_stock transition.
await api.patch(`/admin/inspections/${inspectionRecord._id}/status`, { status: "approved" });
setInspectionCompletionRequested(false);
setInspectionMessage("Inspection completed successfully. Order status updated to Ready Stock.");
setInspectionStep("Add to Inventory");
await loadInspection();
} else {
setInspectionMessage("Inspection details saved successfully.");
}
await fetchOrders();
} catch (error: any) {
setInspectionLoadError(error?.response?.data?.message || error?.message || "Unable to save inspection details.");
} finally {
setInspectionSaving(false);
}
};
const filteredOrders = useMemo(() => {
const query = search.trim().toLowerCase();
const today = new Date();
const last7 = new Date();
last7.setDate(today.getDate() - 7);
return orders.filter((order) => {
const matchesSearch = !query || [order.id, order.customer, order.phone, order.device, order.agent, order.variant]
.some((value) => value !== "—" && value.toLowerCase().includes(query));
const matchesStatus = statusFilter === "All" || order.rawStatus === statusFilter;
const sourceDate = order.dateValue ? new Date(order.dateValue) : null;
const validDate = sourceDate !== null && !Number.isNaN(sourceDate.getTime());
const matchesDate = dateFilter === "All time" ||
(dateFilter === "Today" && validDate && sourceDate!.toDateString() === today.toDateString()) ||
(dateFilter === "Last 7 days" && validDate && sourceDate! >= last7);
return matchesSearch && matchesStatus && matchesDate;
});
}, [orders, search, statusFilter, dateFilter]);
const pageSize = 8;
const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
const safePage = Math.min(page, totalPages);
const visibleOrders = filteredOrders.slice((safePage - 1) * pageSize, safePage * pageSize);
const openOrder = (order: Order) => {
setSelectedOrderId(order.id);
setActiveTab("Overview");
setShowAllDeviceImages(false);
setSuccessMessage("");
setLoadError("");
};
const isAgentReassignmentLocked = (order: Order) => {
  const status = String(order.rawStatus ?? "").toLowerCase().replace(/[\s-]+/g, "_");
  const progressedStatuses = ["picked_up", "pickup_completed", "in_transit", "payment_pending", "payment_completed", "inspection_pending", "inspection_in_progress", "under_inspection", "inspection_completed", "ready_stock", "ready_for_sale", "in_stock", "completed", "cancelled", "rejected"];
  return progressedStatuses.includes(status) || Boolean((order as any).pickedUpAt || (order as any).pickupCompletedAt || (order as any).deviceReceivedAt);
};
const assignAgent = async () => {
if (!selectedOrder || !selectedAgentId) return;
if (isAgentReassignmentLocked(selectedOrder)) {
setLoadError("Agent assignment is locked after pickup. This order can no longer be reassigned.");
return;
}
setIsAssigningAgent(true);
setLoadError("");
setSuccessMessage("");
try {
const response = await api.patch(`/admin/orders/${selectedOrder.backendId}/assign`, { agentId: selectedAgentId });
const updated = response.data?.data;
if (updated) {
const mapped = mapApiOrder(updated);
setOrders((current) => current.map((order) => order.backendId === mapped.backendId ? mapped : order));
} else {
await fetchOrders();
}
setSuccessMessage(selectedOrder.agentBackendId ? "Agent reassigned successfully." : "Agent assigned successfully.");
} catch (error: any) {
setLoadError(error?.response?.data?.message || error?.message || "Unable to assign agent.");
} finally {
setIsAssigningAgent(false);
}
};
const saveInternalNotes = async () => {
if (!selectedOrder) return;
setIsSavingNotes(true);
setLoadError("");
setSuccessMessage("");
try {
const response = await api.patch(`/admin/orders/${selectedOrder.backendId}`, { notes: internalNotesDraft.trim() });
const updated = response.data?.data;
if (updated) {
const mapped = mapApiOrder(updated);
setOrders((current) => current.map((order) => order.backendId === mapped.backendId ? mapped : order));
} else {
await fetchOrders();
}
setSuccessMessage("Internal notes saved successfully.");
} catch (error: any) {
setLoadError(error?.response?.data?.message || error?.message || "Unable to save internal notes.");
} finally {
setIsSavingNotes(false);
}
};
const cancelOrder = async () => {
if (!selectedOrder) return;
if (!cancelReason.trim()) {
setCancelError("Please select a cancellation reason before cancelling the order.");
return;
}
setIsSaving(true);
setCancelError("");
setLoadError("");
setSuccessMessage("");
try {
const existingNotes = selectedOrder.internalNotes && selectedOrder.internalNotes !== "—" && !/notification testing/i.test(selectedOrder.internalNotes) ? selectedOrder.internalNotes.trim() : "";
const cancellationDetails = [`Cancellation reason: ${cancelReason}`, cancelRemarks.trim() ? `Remarks: ${cancelRemarks.trim()}` : ""].filter(Boolean).join("\n");
const cancellationNote = [existingNotes, cancellationDetails].filter(Boolean).join("\n\n");
// Save the cancellation reason and remarks to the order's existing notes field first.
await api.patch(`/admin/orders/${selectedOrder.backendId}`, { notes: cancellationNote });
const response = await api.patch(`/admin/orders/${selectedOrder.backendId}/status`, { status: "cancelled" });
const updated = response.data?.data;
if (updated) {
const mapped = mapApiOrder({ ...updated, notes: updated.notes ?? cancellationNote });
setOrders((current) => current.map((order) => order.backendId === mapped.backendId ? mapped : order));
} else {
await fetchOrders();
}
setSuccessMessage("Order cancelled and cancellation details saved.");
setCancelReason("");
setCancelRemarks("");
setCancelError("");
} catch (error: any) {
setCancelError(error?.response?.data?.message || error?.message || "Unable to cancel the order or save its cancellation details.");
} finally {
setIsSaving(false);
}
};
const selectFilter = (value: string) => {
setStatusFilter(value);
setPage(1);
};
const hasPurchaseInvoice = (order: Order) => Boolean(order.purchaseInvoiceUrl || order.invoiceFileName);
const showInvoiceUnavailable = () => {
window.alert("Invoice is not available yet. It will be available after payment is completed.");
};
const downloadInvoice = async () => {
if (!selectedOrder) return;
if (!hasPurchaseInvoice(selectedOrder)) {
showInvoiceUnavailable();
return;
}
try {
// Prefer the actual invoice document URL returned by the backend.
if (selectedOrder.purchaseInvoiceUrl) {
const link = document.createElement("a");
link.href = selectedOrder.purchaseInvoiceUrl;
link.download = selectedOrder.invoiceFileName || `invoice-${selectedOrder.id}.pdf`;
link.target = "_blank";
link.rel = "noopener noreferrer";
document.body.appendChild(link);
link.click();
link.remove();
return;
}
// If no document URL is included in the order payload, request the
// backend's purchase-invoice endpoint and download its response.
const response = await api.get(`/admin/orders/${selectedOrder.backendId}/purchase-invoice`, {
responseType: "blob",
});
const blobUrl = URL.createObjectURL(response.data);
const link = document.createElement("a");
link.href = blobUrl;
link.download = selectedOrder.invoiceFileName || `invoice-${selectedOrder.id}.pdf`;
document.body.appendChild(link);
link.click();
link.remove();
URL.revokeObjectURL(blobUrl);
} catch (error: any) {
window.alert(error?.response?.data?.message || error?.message || "Unable to download the invoice. Please check that an invoice has been generated for this order.");
}
};
const renderTabContent = (order: Order) => {
switch (activeTab) {
case "Overview":
return (
<div className="space-y-3">
<div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_0.95fr_1.1fr_0.9fr]">
<DetailSection title="Order Information">
<DetailRow label="Order ID" value={order.id} />
<DetailRow label="Invoice ID" value={hasPurchaseInvoice(order) ? (order.purchaseInvoiceNumber || "Invoice generated") : "No invoice generated"} />
<DetailRow label="Created On" value={order.createdAtLabel} />
<DetailRow label="Pickup Address" value={order.location} />
<DetailRow label="User Address" value={order.location} />
</DetailSection>
<DetailSection title="Agent & Pickup Details">
<p className="mb-2 text-xs font-medium text-stone-500">Assigned Agent</p>
<div className="space-y-2 rounded-lg border border-stone-200 p-2.5">
<select value={selectedAgentId} onChange={(event) => setSelectedAgentId(event.target.value)} disabled={isAgentReassignmentLocked(order)} aria-label="Choose assigned agent" className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 outline-none focus:border-orange-400 disabled:cursor-not-allowed disabled:bg-stone-100">
<option value="">Unassigned</option>
{agents.map((agentOption) => {
const agentId = String(agentOption?._id ?? agentOption?.id ?? "");
const agentName = agentOption?.fullName ?? agentOption?.user?.fullName ?? agentOption?.name ?? agentOption?.user?.name ?? "Unnamed agent";
return <option key={agentId} value={agentId}>{agentName}</option>;
})}
</select>
<p className="text-xs text-stone-500">{order.agentPhone}</p>{isAgentReassignmentLocked(order) && <p className="inline-flex max-w-full flex-wrap items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800"><span>Agent reassignment unavailable</span><span className="text-amber-500">·</span><span>Order status:</span><strong className="font-semibold">{({ picked_up: "Picked Up", pickup_completed: "Picked Up", in_transit: "In Transit", payment_pending: "Payment Pending", payment_completed: "In Transit", inspection_pending: "Inspection Pending", inspection_in_progress: "Inspection In Progress", under_inspection: "Under Inspection", inspection_completed: "Inspection Completed", approved: "Ready for Stock", ready_stock: "Ready for Stock", ready_for_sale: "Ready for Sale", in_stock: "In Stock", completed: "Completed", cancelled: "Cancelled", rejected: "Cancelled" } as Record<string, string>)[String(order.rawStatus ?? "").toLowerCase().replace(/[\s-]+/g, "_")] ?? formatBackendStatus(String(order.rawStatus ?? "in progress"))}</strong></p>}
<button type="button" onClick={() => void assignAgent()} disabled={!selectedAgentId || isAssigningAgent || selectedAgentId === order.agentBackendId || isAgentReassignmentLocked(order)} className="w-full rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-stone-300">{isAssigningAgent ? "Saving..." : order.agentBackendId ? "Reassign Agent" : "Assign Agent"}</button>
</div>
<div className="mt-4">
<p className="mb-2 text-xs font-medium text-stone-500">Pickup Date</p>
<div className="flex items-center justify-between rounded-lg border border-stone-200 px-3 py-2.5 text-sm text-stone-700">
<span>{order.pickupDate}</span><History size={15} className="text-stone-400" />
</div>
</div>
<div className="mt-3">
<p className="mb-2 text-xs font-medium text-stone-500">Pickup Time</p>
<div className="flex items-center justify-between rounded-lg border border-stone-200 px-3 py-2.5 text-sm text-stone-700">
<span>{order.pickupTime}</span><Clock3 size={15} className="text-stone-400" />
</div>
</div>
<div className="mt-3">
<p className="text-xs font-medium text-stone-500">Pickup Status</p>
<div className="mt-2"><StatusBadge status={order.status} /></div>
</div>
</DetailSection>
<DetailSection title="Status & Progress">
<div className="space-y-4">
{([
["Order Created", order.date, Boolean(order.dateValue)],
["Order Status", order.status, ["Picked Up", "In Transit", "Inspection", "Payment Pending", "Ready Stock", "Completed"].includes(order.status)],
["Payment Status", order.paymentStatus, order.paymentStatus === "Paid"],
["Inspection Status", formatBackendStatus(order.inspectionStatus), ["passed", "approved", "completed", "inspection_completed"].includes(order.inspectionStatus.toLowerCase().replace(/[_-]+/g, " "))],
["Inventory Status", formatBackendStatus(order.inventoryStatus), ["available", "listed", "ready stock", "ready_stock", "in stock", "in_stock", "added"].includes(order.inventoryStatus.toLowerCase().replace(/[_-]+/g, " "))],
] as [string, string, boolean][]).map(([label, value, done], index) => (
<div key={`${label}-${index}`} className="grid grid-cols-[minmax(0,1fr)_minmax(0,auto)] items-center gap-x-3">
<span className="text-xs font-medium text-stone-500">{label}</span>
<span className={`inline-flex items-center justify-end gap-1.5 text-xs font-medium ${done ? "text-stone-600" : "text-orange-600"}`}>
{done ? <CheckCircle2 size={13} className="shrink-0 text-emerald-500" /> : <span className="h-3 w-3 shrink-0 rounded-full border border-orange-500" />}
<span className="text-right">{String(value)}</span>
</span>
</div>
))}
</div>
{/* Evenly aligned five-step progress tracker */}
<div className="mt-7 px-1 pb-1">
<div className="relative">
<div className="absolute left-[10%] right-[10%] top-3 h-0.5 bg-stone-200" />
<div
className="absolute left-[10%] top-3 h-0.5 bg-emerald-500 transition-all"
style={{
width: `${(
["Order Created", "Picked Up", order.paymentStatus === "Paid" ? "Payment Completed" : "Payment Pending", "Inspection Pending", "Inventory"].reduce(
(lastDone, _step, index) => {
const done =
index === 0 ||
(index === 1 && ["Picked Up", "In Transit", "Inspection", "Payment Pending", "Ready Stock", "Completed"].includes(order.status)) ||
(index === 2 && order.paymentStatus === "Paid") ||
(index === 3 && ["passed", "approved", "completed"].includes(order.inspectionStatus.toLowerCase().replace(/[_-]+/g, " "))) ||
(index === 4 && ["Ready Stock", "Completed"].includes(order.status));
return done ? (index / 4) * 80 : lastDone;
},
0
)
)}%`,
}}
/>
<div className="relative grid grid-cols-5">
{["Order Created", "Picked Up", order.paymentStatus === "Paid" ? "Payment Completed" : "Payment Pending", "Inspection Pending", "Inventory"].map((step, index) => {
const done =
index === 0 ||
(index === 1 && ["Picked Up", "In Transit", "Inspection", "Payment Pending", "Ready Stock", "Completed"].includes(order.status)) ||
(index === 2 && order.paymentStatus === "Paid") ||
(index === 3 && ["passed", "approved", "completed"].includes(order.inspectionStatus.toLowerCase().replace(/[_-]+/g, " "))) ||
(index === 4 && ["Ready Stock", "Completed"].includes(order.status));
return (
<div key={step} className="flex min-w-0 flex-col items-center px-0.5 text-center">
<span className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-4 ring-white ${done ? "bg-emerald-500 text-white" : "bg-orange-500 text-white"}`}>
{done ? <CheckCircle2 size={13} /> : index === 4 ? <PackageCheck size={13} /> : <Clock3 size={13} />}
</span>
<span className="mt-2 min-h-[26px] max-w-[64px] text-[9px] leading-3 text-stone-500">
{step}
</span>
</div>
);
})}
</div>
</div>
</div>
</DetailSection>
<DetailSection title="Activity Timeline">
<div className={`relative px-1 pb-2 pt-8 ${order.timeline.length > 3 ? "max-h-[360px] overflow-y-auto scroll-py-4" : "overflow-visible"}`}>
{order.timeline.map((item, index) => {
const normalizedTitle = item.title.toLowerCase();
const category = normalizedTitle.includes("payment") ? "Payment"
: normalizedTitle.includes("pickup") ? "Pickup"
: normalizedTitle.includes("inspection") ? "Inspection"
: normalizedTitle.includes("agent") || normalizedTitle.includes("assign") ? "Assignment"
: "Order";
return (
<div key={`${item.title}-${index}`} className="relative flex gap-2.5 pb-3 last:pb-0">
{index !== order.timeline.length - 1 && (
<span className="absolute bottom-0 left-3 top-6 w-px bg-stone-200" />
)}
<span className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-2 ring-white ${item.completed ? "bg-emerald-500 text-white" : "bg-orange-100 text-orange-600"}`}>
{item.completed ? <CheckCircle2 size={12} /> : <Clock3 size={12} />}
</span>
<div className="min-w-0 flex-1 rounded-lg border border-stone-100 bg-white px-2.5 py-1.5">
<div className="flex flex-wrap items-start justify-between gap-2">
<p className="text-[11px] font-semibold leading-4 text-stone-800">
{item.title}
</p>
<span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${item.completed ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"}`}>
{item.completed ? "Completed" : "Pending"}
</span>
</div>
<div className="mt-1 flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 border-t border-stone-100 pt-1">
<span className="text-[9px] font-medium text-stone-400">
{category}
</span>
<span className="text-[9px] text-stone-500">
{item.date}
</span>
</div>
</div>
</div>
);
})}
</div>
</DetailSection>
</div>
<div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
<DetailSection title="Internal Notes">
<p className="mb-3 text-xs text-stone-500">Add notes about inspection, customer request, pickup issue, price revision reason, etc.</p>
<textarea value={internalNotesDraft} onChange={(event) => setInternalNotesDraft(event.target.value)} rows={4} maxLength={1000} className="w-full resize-y rounded-lg border border-stone-200 px-3 py-2.5 text-sm text-stone-700 outline-none focus:border-orange-400" placeholder="Write your notes here..." />
<div className="mt-3 flex items-center justify-between gap-3"><p className="text-xs text-blue-600">These notes will not be visible to the user.</p><button type="button" onClick={() => void saveInternalNotes()} disabled={isSavingNotes} className="rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-stone-300">{isSavingNotes ? "Saving..." : "Save Notes"}</button></div>
</DetailSection>
<DetailSection title="Cancel Order">
<p className="mb-3 text-xs text-stone-500">If you want to cancel this order, please select a reason and add comments.</p>
<label className="mb-2 block text-xs text-stone-500">Reason for cancellation<span className="text-red-500">*</span></label>
<div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.5fr)]">
<select value={cancelReason} onChange={(event) => { setCancelReason(event.target.value); setCancelError(""); }} aria-invalid={Boolean(cancelError)} aria-describedby={cancelError ? "cancel-order-error" : undefined} className={`h-10 rounded-lg border bg-white px-3 text-xs text-stone-600 outline-none focus:border-orange-400 ${cancelError ? "border-red-300" : "border-stone-200"}`}>
<option value="">Select reason</option>
<option value="Customer requested cancellation">Customer requested cancellation</option>
<option value="Device not available">Device not available</option>
<option value="Pickup failed">Pickup failed</option>
<option value="Other">Other</option>
</select>
<textarea value={cancelRemarks} onChange={(event) => setCancelRemarks(event.target.value)} rows={3} maxLength={1000} className="min-h-20 resize-y rounded-lg border border-stone-200 px-3 py-2.5 text-xs text-stone-600 outline-none focus:border-orange-400" placeholder="Provide more details (optional)..." />
</div>
{cancelError && <p id="cancel-order-error" role="alert" className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{cancelError}</p>}
{successMessage && successMessage.toLowerCase().includes("cancel") && <p role="status" className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{successMessage}</p>}
<button type="button" onClick={() => void cancelOrder()} disabled={isSaving} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60">
<XCircle size={15} /> {isSaving ? "Cancelling..." : "Cancel Order"}
</button>
</DetailSection>
</div>
</div>
);
case "Device Details":
return (
<div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,2fr)]">
{/* Left column: device information and compact inspection summary */}
<div className="flex min-w-0 flex-col gap-3">
<section className="rounded-2xl border border-stone-200/90 bg-white px-6 py-5 shadow-[0_2px_10px_rgba(28,25,23,0.035)]">
<h3 className="mb-4 text-sm font-bold leading-5 text-stone-950">Device Information</h3>
<div className="space-y-0">
{([
["Device Name", order.device],
["Storage", order.storage],
["Color", order.color],
["IMEI", order.imei],
["Network", order.deviceInfo.network],
["SIM Slot", order.deviceInfo.simSlot],
["eSIM", order.deviceInfo.esim],
] as Array<[string, string]>).map(([label, value]) => (
<div key={label} className="grid min-h-[32px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-stone-100 py-1.5 last:border-b-0">
<span className="text-xs leading-5 text-stone-600">{label}</span>
<span className="break-words text-right text-xs font-medium leading-5 text-stone-800">{value || "—"}</span>
</div>
))}
<div className="grid min-h-[32px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-stone-100 py-1.5">
<span className="text-xs text-stone-600">Purchase Bill</span>
{order.purchaseBillUrl ? (
<a href={order.purchaseBillUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-blue-600 hover:underline">View Document</a>
) : <span className="rounded bg-stone-50 px-2 py-1 text-xs text-stone-500">—</span>}
</div>
<div className="grid min-h-[32px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-1.5">
<span className="text-xs text-stone-600">Warranty Status</span>
<span className="rounded bg-stone-50 px-2 py-1 text-xs font-medium text-stone-600">{order.deviceInfo.warrantyStatus || "—"}</span>
</div>
</div>
</section>
<section className="min-h-[240px] rounded-xl border border-stone-200 bg-white px-6 py-6">
<div className="space-y-3">
{([
["Screen Condition", order.inspectionInfo.screenCondition, Smartphone],
["Display Issues", order.inspectionInfo.displayIssues, Monitor],
["Body Condition", order.condition, Smartphone],
["Battery Health", order.inspectionInfo.batteryHealth, BatteryCharging],
["Repair Status", order.inspectionInfo.repairStatus, Wrench],
] as Array<[string, string, typeof Smartphone]>).map(([label, value, Icon]) => {
const SummaryIcon = Icon;
return (
<div key={label} className="flex min-w-0 items-center gap-3 py-0.5">
<span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-orange-50 text-orange-500">
<SummaryIcon size={15} strokeWidth={2} />
</span>
<span className="min-w-0 flex-1 text-xs leading-5 text-stone-700">{label}</span>
<span className={`shrink-0 text-right text-xs font-medium leading-5 ${inspectionValueClass(label, value)}`}>{value && value !== "—" ? value : "—"}</span>
</div>
);
})}
</div>
</section>
</div>
{/* Right column: image gallery, checks, accessories, condition and notes */}
<div className="flex min-w-0 flex-col gap-3">
<section className="rounded-2xl border border-stone-200/90 bg-white px-5 py-4 shadow-[0_2px_10px_rgba(28,25,23,0.035)]">
<div className="mb-3 flex items-center justify-between gap-3">
<h3 className="text-sm font-bold leading-5 text-stone-950">Device Images</h3>
{order.deviceImages.length > 0 && (
<button
type="button"
onClick={() => setShowAllDeviceImages((current) => !current)}
className="shrink-0 rounded-md border border-stone-200 px-3 py-1.5 text-xs font-semibold text-orange-600 transition hover:border-orange-300 hover:bg-orange-50"
>
<span className="inline-flex items-center gap-1.5"><Images size={14} strokeWidth={1.8} />{showAllDeviceImages ? "Show Less" : `View All (${order.deviceImages.length})`}</span>
</button>
)}
</div>
{order.deviceImages.length ? (
<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
{(showAllDeviceImages ? order.deviceImages : order.deviceImages.slice(0, 5)).map((image, index) => (
<a
key={`${image.url}-${index}`}
href={image.url}
target="_blank"
rel="noreferrer"
title={`Open ${image.label}`}
className="flex aspect-square min-w-0 items-center justify-center overflow-hidden rounded-lg border border-stone-200 bg-white p-2 transition hover:border-orange-300"
>
<img src={image.url} alt={image.label} loading="lazy" className="h-full w-full object-contain object-center" />
</a>
))}
</div>
) : (
<div className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-stone-200 px-4 text-sm text-stone-500">
No device images available for this order.
</div>
)}
</section>
<div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.25fr_0.85fr]">
<section className="rounded-2xl border border-stone-200/90 bg-white px-6 py-5 shadow-[0_2px_10px_rgba(28,25,23,0.035)]">
<h3 className="mb-4 text-sm font-bold leading-5 text-stone-950">Functional Status (Reported by Agent)</h3>
<div className="grid grid-cols-2 gap-x-3">
{FUNCTIONAL_CHECK_LABELS.map((label, index) => {
const value = getReportedValue(order.functionalChecks, label);
const CheckIcon = [Monitor, Smartphone, CheckCircle2, ScanFace, BatteryCharging, Clock3][index % 6];
return (
<div key={label} className="flex min-w-0 items-center justify-between gap-2 border-b border-stone-100 py-2 last:border-b-0">
<span className="flex min-w-0 items-center gap-2 text-xs leading-5 text-stone-600">
<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-orange-50 text-orange-500"><CheckIcon size={15} strokeWidth={1.8} /></span>
<span className="min-w-0">{label}</span>
</span>
<span className={`shrink-0 text-right text-xs font-medium leading-5 ${inspectionValueClass(label, value)}`}>{value || "—"}</span>
</div>
);
})}
</div>
</section>
<section className="rounded-2xl border border-stone-200/90 bg-white px-6 py-5 shadow-[0_2px_10px_rgba(28,25,23,0.035)]">
<h3 className="mb-4 text-sm font-bold leading-5 text-stone-950">Accessories (Reported)</h3>
<div className="space-y-0">
{ACCESSORY_LABELS.map((label, index) => {
const value = getReportedValue(order.accessories, label);
const AccessoryIcon = [PackageCheck, BatteryCharging, PackageCheck, ReceiptText, ShoppingBag][index];
return (
<div key={label} className="flex items-center justify-between gap-2 border-b border-stone-100 py-2 last:border-b-0">
<span className="flex min-w-0 items-center gap-2 text-xs leading-5 text-stone-600">
<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-orange-50 text-orange-500"><AccessoryIcon size={15} strokeWidth={1.8} /></span>
<span>{label}</span>
</span>
<span className="flex min-w-5 justify-end" aria-label={`${label}: ${value || "not recorded"}`}>
{(() => {
const normalized = value.trim().toLowerCase();
const present = /^(yes|true|present|included|available|working|available)$/i.test(normalized);
const absent = /^(no|false|absent|not included|not available|missing)$/i.test(normalized);
if (present) {
return <CheckCircle2 size={18} className="text-emerald-600" strokeWidth={2.2} />;
}
if (absent) {
return <span className="text-base leading-none text-stone-400">—</span>;
}
return value ? <span className="text-right text-xs font-medium leading-5 text-stone-700">{value}</span> : <span className="text-base leading-none text-stone-400">—</span>;
})()}
</span>
</div>
);
})}
</div>
</section>
</div>
<div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.25fr_0.85fr]">
<section className="rounded-xl border border-stone-200 bg-white px-6 py-5">
<h3 className="mb-4 text-sm font-bold leading-5 text-stone-950">Physical Condition (Reported by Agent)</h3>
<div className="grid grid-cols-2 gap-x-3">
{PHYSICAL_CONDITION_LABELS.map((label, index) => {
const value = label === "Overall"
? (order.condition === "—" ? "" : order.condition)
: getReportedValue(order.physicalConditions, label);
const ConditionIcon = [ClipboardCheck, Smartphone, Monitor, ScanFace, Wrench, CheckCircle2, Smartphone][index];
return (
<div key={label} className="flex min-w-0 items-center justify-between gap-2 border-b border-stone-100 py-2 last:border-b-0">
<span className="flex min-w-0 items-center gap-2 text-xs leading-5 text-stone-600">
<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-orange-50 text-orange-500"><ConditionIcon size={15} strokeWidth={1.8} /></span>
<span className="min-w-0">{label}</span>
</span>
<span className={`break-words text-right text-xs font-medium leading-5 ${inspectionValueClass(label, value)}`}>{value || "—"}</span>
</div>
);
})}
</div>
</section>
<section className="rounded-xl border border-stone-200 bg-white px-6 py-5">
<h3 className="mb-4 text-sm font-bold leading-5 text-stone-950">Additional Notes (by Agent)</h3>
<p className="whitespace-pre-wrap text-xs leading-5 text-stone-600">{order.agentNotes || "No additional notes recorded."}</p>
</section>
</div>
</div>
</div>
);
case "Payments":
return (
<div className="grid grid-cols-1 items-stretch gap-2 xl:grid-cols-[1fr_1fr_1.2fr]">
{/* Payment Conditions */}
<section className="flex min-w-0 flex-col rounded-xl border border-stone-200 bg-white">
<div className="border-b border-stone-100 px-5 py-4">
<h3 className="text-base font-bold text-stone-900">
Payment Conditions
</h3>
</div>
<div className="flex flex-1 flex-col items-center justify-center px-5 py-4">
<div className="flex h-[88px] w-[88px] items-center justify-center rounded-full bg-emerald-100">
<CheckCircle2
size={43}
strokeWidth={1.8}
className="text-emerald-700"
/>
</div>
<p className="mt-4 text-center text-xs leading-5 text-stone-600">
Complete user payment to proceed
<br />
with device inspection.
</p>
<div className="mt-5 w-full max-w-[240px] rounded-lg border border-stone-200 px-4 py-3">
{[
{ label: "Offer Approved", state: "done" },
{ label: "Pickup Completed", state: "done" },
{
label: "Payment Pending",
state: order.paymentStatus === "Paid" ? "done" : "pending",
},
{
label: "Inspection Pending",
state: ["passed", "approved", "completed"].includes(order.inspectionStatus.toLowerCase().replace(/[_-]+/g, " ")) ? "done" : "pending",
},
].map((item) => (
<div
key={item.label}
className="flex items-center gap-2.5 py-1.5"
>
<span
className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${item.state === "done"
? "bg-emerald-100 text-emerald-600"
: "border border-stone-300 text-stone-400"
}`}
>
{item.state === "done" ? (
<CheckCircle2 size={12} />
) : (
<span className="text-[10px]"></span>
)}
</span>
<span
className={`text-xs ${item.state === "done"
? "text-stone-600"
: "text-stone-400"
}`}
>
{item.label}
</span>
</div>
))}
</div>
</div>
</section>
{/* Offer and Payment Summary */}
<div className="flex min-w-0 flex-col gap-3">
<section className="rounded-xl border border-stone-200 bg-white">
<div className="border-b border-stone-100 px-5 py-4">
<h3 className="text-base font-bold text-stone-900">
Offer Summary
</h3>
</div>
<div className="space-y-4 px-5 py-4">
<div className="flex items-center justify-between gap-3">
<span className="text-xs text-stone-600">Estimated Offer:</span>
<span className="text-sm font-semibold text-stone-700">
{formatAmount((order.amount ?? 0) + 2500)}
</span>
</div>
<div className="flex items-center justify-between gap-3">
<span className="text-xs text-stone-600">Deductions:</span>
<span className="text-sm font-semibold text-red-600">
-{formatAmount(2500)}
</span>
</div>
<div className="flex items-center justify-between gap-3 border-t border-stone-100 pt-3">
<span className="text-xs font-medium text-stone-700">
Final Offer (Approved):
</span>
<span className="text-sm font-bold text-emerald-600">
{formatAmount(order.amount)}
</span>
</div>
<div className="flex items-center justify-between gap-3 pt-1">
<span className="text-xs text-stone-600">Customer Approval:</span>
<span className="rounded-md bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
Approved
</span>
</div>
</div>
</section>
<section className="flex-1 rounded-xl border border-stone-200 bg-white">
<div className="border-b border-stone-100 px-5 py-4">
<h3 className="text-base font-bold text-stone-900">
Payment Summary
</h3>
</div>
<div className="space-y-4 px-5 py-4">
<div className="flex items-center justify-between gap-3">
<span className="text-xs text-stone-600">Amount to Pay:</span>
<span className="text-sm font-semibold text-stone-700">
{formatAmount(order.amount)}
</span>
</div>
<div className="flex items-center justify-between gap-3">
<span className="text-xs text-stone-600">Payment Status:</span>
<span
className={`rounded-md px-3 py-1 text-xs font-semibold ${order.paymentStatus === "Paid"
? "bg-emerald-50 text-emerald-700"
: "bg-orange-100 text-orange-600"
}`}
>
{order.paymentStatus === "Paid" ? "Paid" : "To Pay"}
</span>
</div>
<div className="flex items-center justify-between gap-3">
<span className="text-xs text-stone-600">Transaction ID:</span>
<span className="text-xs text-stone-500">-</span>
</div>
</div>
</section>
</div>
{/* Payment Actions */}
<section className="flex min-w-0 flex-col rounded-xl border border-stone-200 bg-white">
<div className="border-b border-stone-100 px-5 py-4">
<h3 className="text-base font-bold text-stone-900">
Payment Actions
</h3>
<p className="mt-1 text-xs text-stone-500">
Review details and initiate payment
</p>
</div>
<div className="flex flex-1 flex-col gap-3 p-4">
{/* Beneficiary details */}
<div className="rounded-lg border border-orange-100 bg-orange-50/60 p-3">
<div className="flex items-center justify-between gap-3">
<div className="flex min-w-0 items-center gap-2.5">
<span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-bold text-stone-600">
{order.customer
.split(" ")
.map((part) => part[0])
.slice(0, 2)
.join("")
.toUpperCase()}
</span>
<div className="min-w-0">
<p className="truncate text-xs font-semibold text-stone-800">
{order.customer}
</p>
<span className="mt-1 inline-flex rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
<CheckCircle2 size={11} className="mr-1" />
Verified Account
</span>
</div>
</div>
<div className="shrink-0 text-right">
<p className="text-[10px] text-stone-500">Amount to Pay</p>
<p className="text-base font-bold text-orange-600">
{formatAmount(order.amount)}
</p>
</div>
</div>
<div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3 border-t border-orange-100 pt-3 sm:grid-cols-4">
{[
["Bank Name", "HDFC Bank"],
["Account Number", "XXXXXXXX3214"],
["IFSC Code", "HDFC0001234"],
["Account Type", "Savings Account"],
].map(([label, value]) => (
<div key={label} className="min-w-0">
<p className="text-[10px] text-stone-500">{label}</p>
<p className="mt-1 break-words text-[10px] font-medium text-stone-700">
{value}
</p>
</div>
))}
</div>
</div>
{/* Account selection and remarks */}
<div className="flex flex-1 flex-col gap-3 rounded-lg border border-stone-200 p-3">
<label className="block">
<span className="mb-1.5 block text-xs font-medium text-stone-700">
Pay From Account <span className="text-red-500">*</span>
</span>
<select
defaultValue="excart"
className="h-10 w-full rounded-md border border-stone-200 bg-white px-3 text-xs text-stone-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
>
<option value="excart">
Excart Main Account — ICICI Bank (A/C XXXX1234)
</option>
<option value="hdfc">
HDFC Bank — Account ending 3214
</option>
</select>
</label>
<label className="block">
<span className="mb-1.5 block text-xs font-medium text-stone-700">
Remarks (Optional)
</span>
<input
type="text"
defaultValue={`Payout for order ${order.id}`}
className="h-10 w-full rounded-md border border-stone-200 px-3 text-xs text-stone-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
/>
</label>
</div>
<button
type="button"
disabled={order.paymentStatus === "Paid"}
onClick={() =>
window.alert(
"Payment processing is not connected yet. No payment has been initiated."
)
}
className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-orange-500 px-4 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-emerald-600"
>
<Wallet size={16} />
{order.paymentStatus === "Paid"
? "Payment Completed"
: `Pay Now ${formatAmount(order.amount)}`}
</button>
</div>
</section>
</div>
);
case "Inspection": {
const inspectionStatus = String(inspectionRecord?.status ?? selectedOrder?.inspectionStatus ?? "pending").toLowerCase();
const isEditable = inspectionStatus === "in_progress";
const functionalLabels: Array<{ key: string; label: string; detail: string; Icon: any }> = [
{ key: "camera", label: "Camera", detail: "Front & Back", Icon: Camera },
{ key: "speaker", label: "Speaker", detail: "Sound Output", Icon: Volume2 },
{ key: "microphone", label: "Microphone", detail: "Mic Input", Icon: Mic },
{ key: "buttons", label: "Buttons", detail: "All Physical Buttons", Icon: Power },
{ key: "touchScreen", label: "Touch Screen", detail: "Touch Response", Icon: Hand },
{ key: "wifi", label: "Wi-Fi", detail: "Wi-Fi Connection", Icon: Wifi },
{ key: "bluetooth", label: "Bluetooth", detail: "Connection", Icon: Bluetooth },
{ key: "faceId", label: "Fingerprint/FaceID", detail: "Biometric Function", Icon: ScanFace },
{ key: "chargingPort", label: "Charging Port", detail: "Charging Function", Icon: BatteryCharging },
{ key: "network", label: "SIM & Network", detail: "Network & SIM", Icon: Radio },
{ key: "vibration", label: "Vibration", detail: "Vibration Feedback", Icon: Smartphone },
{ key: "gps", label: "GPS", detail: "Location Accuracy", Icon: Monitor },
];
const steps = ["Basic Information", "Physical Condition", "Display", "Functional Check", "Accessories", "Warranty Status", "Overall Condition", "Add to Inventory"];
const done = (step: string) => {
if (step === "Basic Information") return Boolean(selectedOrder?.device && selectedOrder?.customer);
if (step === "Physical Condition") return Boolean(inspectionForm.bodyCondition && inspectionForm.batteryHealth !== "");
if (step === "Display") return Boolean(inspectionForm.screenCondition);
if (step === "Functional Check") return functionalLabels.every(({ key }) => typeof inspectionForm.functionalTests[key] === "boolean");
if (step === "Accessories") return ["charger", "cable", "earphones", "box", "bill"].every((key) => typeof inspectionForm.accessories?.[key] === "boolean");
if (step === "Warranty Status") return inspectionForm.warrantyType === "no_warranty" || Boolean(inspectionForm.warrantyProvider && inspectionForm.warrantyDuration && inspectionForm.warrantyValidUntil);
if (step === "Overall Condition") return Boolean(inspectionForm.overallGrade && inspectionForm.sellingPrice !== "" && Number(inspectionForm.sellingPrice) > 0);
if (step === "Add to Inventory") return inspectionStatus === "approved";
return false;
};
const selectClass = "mt-1 h-9 w-full rounded-md border border-stone-200 bg-white px-3 text-xs text-stone-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:bg-stone-50 disabled:text-stone-400";
const inputClass = "mt-1 h-9 w-full rounded-md border border-stone-200 bg-white px-3 text-xs text-stone-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:bg-stone-50 disabled:text-stone-400";
return (
<div className="-mx-1 flex min-h-[304px] flex-col overflow-hidden bg-[#f8f8f7]">
{inspectionLoadError && <div className="mx-3 mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{inspectionLoadError}</div>}
{inspectionMessage && <div className="mx-3 mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">{inspectionMessage}</div>}
{inspectionLoading ? (
<div className="flex min-h-[304px] items-center justify-center text-sm text-stone-500">Loading inspection details...</div>
) : !inspectionRecord ? (
<div className="flex min-h-[304px] flex-col items-center justify-center px-6 text-center">
<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500"><ClipboardCheck size={24} /></div>
<h3 className="mt-3 text-sm font-semibold text-stone-900">No inspection record yet</h3>
<p className="mt-1 max-w-md text-xs leading-5 text-stone-500">Start inspection after the device has been received at the store. The results will be saved against this order.</p>
{["in_transit", "payment_completed"].includes(String(selectedOrder?.rawStatus ?? "").toLowerCase()) ? (
<button type="button" disabled={inspectionSaving} onClick={async () => {
  if (!selectedOrder) return;
  setInspectionSaving(true); setInspectionLoadError(""); setInspectionMessage("");
  try {
    const response = await api.patch(`/admin/orders/${selectedOrder.backendId}/receive`, {});
    const updated = response.data?.data;
    if (updated) {
      const mapped = mapApiOrder(updated);
      setOrders((current) => current.map((item) => item.backendId === mapped.backendId ? mapped : item));
    } else { await fetchOrders(); }
    setInspectionMessage("Device received at store. Inspection can now be started.");
    await loadInspection();
  } catch (error: any) {
    setInspectionLoadError(error?.response?.data?.message || error?.message || "Unable to receive device. Please confirm the receive-device API endpoint is available.");
  } finally { setInspectionSaving(false); }
}} className="mt-4 inline-flex h-9 items-center gap-2 rounded-md bg-orange-500 px-4 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-60">{inspectionSaving ? "Receiving..." : "Receive Device"}</button>
) : selectedOrder?.rawStatus === "inspection_pending" ? (
<button type="button" disabled={inspectionSaving} onClick={() => void startInspection()} className="mt-4 inline-flex h-9 items-center gap-2 rounded-md bg-orange-500 px-4 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-60">{inspectionSaving ? "Starting..." : "Start Inspection"}</button>
) : <p className="mt-3 text-xs text-stone-500">Current order status: {selectedOrder?.rawStatus?.replaceAll("_", " ") ?? "—"}</p>}
</div>
) : (
<>
<div className="grid min-h-[304px] grid-cols-1 gap-2 p-2 md:grid-cols-[196px_minmax(0,1fr)]">
{/* Left progress rail */}
<section className="rounded-lg border border-stone-200 bg-white p-4">
<h3 className="text-base font-semibold text-stone-900">
Inspection Progress
</h3>
<p className="mt-1 text-xs leading-5 text-stone-500">
Complete all checks before adding to inventory.
</p>
<div className="relative mt-4">
{/* Vertical timeline connector */}
<div className="absolute left-[12px] top-[9px] h-[308px] w-px bg-stone-200" />
{steps.map((step) => {
const active = inspectionStep === step;
const complete =
(inspectionStatus === "completed" || inspectionStatus === "approved") && step !== "Add to Inventory"
? done(step)
: !active && done(step);
return (
<button
key={step}
type="button"
onClick={() => setInspectionStep(step)}
className={`relative flex h-[44px] w-full items-center gap-3 rounded-md px-1 text-left transition ${active
? "text-orange-600"
: "text-stone-600 hover:bg-stone-50"
}`}
>
{/* Progress circle */}
<span
className={`relative z-10 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border ${complete
? "border-emerald-500 bg-emerald-500 text-white"
: active
? "border-orange-500 bg-orange-500 text-white"
: "border-stone-300 bg-white"
}`}
>
{complete ? (
<Check size={12} strokeWidth={3} />
) : active ? (
<span className="h-[2px] w-[8px] rounded-full bg-white" />
) : null}
</span>
{/* Step label */}
<span
className={`text-xs leading-5 ${active ? "font-semibold" : "font-normal"
}`}
>
{step}
</span>
</button>
);
})}
</div>
</section>
{/* Center active inspection step */}
<section className="min-w-0 rounded-[10px] border border-stone-200 bg-white p-3.5">
{inspectionStep === "Functional Check" ? (
<>
<h3 className="text-[14px] font-semibold text-stone-900">
Functional Checks
</h3>
<p className="mt-1 text-[10px] leading-[14px] text-stone-500">
Test all key features to ensure device is fully operational.
</p>
<div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
{functionalLabels.map(({ key, label, detail, Icon }) => {
const value = inspectionForm.functionalTests[key];
return (
<div
key={key}
className="flex min-w-0 items-center gap-2 rounded-[7px] border border-stone-200 bg-white px-2.5 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.025)]"
>
<span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-md bg-stone-50 text-stone-600">
<Icon size={15} strokeWidth={1.8} />
</span>
<div className="min-w-0 flex-1">
<p className="truncate text-[11px] font-semibold leading-4 text-stone-700">
{label}
</p>
<p className="truncate text-[9px] leading-3.5 text-stone-400">
{detail}
</p>
</div>
<div className="relative h-[36px] w-[112px] shrink-0">
<select
aria-label={`${label} result`}
disabled={!isEditable}
value={
value === null || value === undefined
? ""
: String(value)
}
onChange={(e) =>
setInspectionForm((f: any) => ({
...f,
functionalTests: {
...f.functionalTests,
[key]:
e.target.value === ""
? null
: e.target.value === "true",
},
}))
}
className={`h-full w-full appearance-none cursor-pointer rounded-md border pl-3 pr-8 text-[13px] font-medium leading-none outline-none transition ${value === true
? "border-emerald-200 bg-emerald-50 text-emerald-700 focus:ring-2 focus:ring-emerald-100"
: value === false
? "border-red-200 bg-red-50 text-red-700 focus:ring-2 focus:ring-red-100"
: "border-stone-200 bg-white text-stone-600 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
}`}
>
<option value="">Pending</option>
<option value="true">Good</option>
<option value="false">Issue</option>
</select>
<svg
aria-hidden="true"
className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-current"
viewBox="0 0 20 20"
fill="none"
stroke="currentColor"
strokeWidth="1.8"
>
<path
d="m5 7.5 5 5 5-5"
strokeLinecap="round"
strokeLinejoin="round"
/>
</svg>
</div>
</div>
);
})}
</div>
<label className="mt-3 block text-[11px] font-medium text-stone-700">
Remarks{" "}
<span className="font-normal text-stone-400">(Optional)</span>
<textarea
rows={2}
disabled={!isEditable}
value={inspectionForm.remarks}
onChange={(e) =>
setInspectionForm((f: any) => ({
...f,
remarks: e.target.value,
}))
}
className="mt-1.5 w-full resize-none rounded-md border border-stone-200 bg-white px-3 py-2.5 text-[11px] font-normal text-stone-700 outline-none placeholder:text-stone-400 transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:bg-stone-50"
placeholder="Add any notes about functional checks..."
/>
</label>
</>
) : inspectionStep === "Basic Information" ? (
<>
<div className="flex items-start gap-3">
<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-orange-100 bg-orange-50 text-orange-600"><ClipboardCheck size={20} strokeWidth={1.8} /></span>
<div><h3 className="text-base font-semibold tracking-tight text-stone-900">Basic Information</h3><p className="mt-1 text-sm text-stone-500">Confirm the order and device details before inspection.</p></div>
</div>
<div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
{([
["Order ID", selectedOrder?.id ?? "—"],
["Customer", selectedOrder?.customer ?? "—"],
["Device", selectedOrder?.device ?? "—"],
["Variant", selectedOrder?.variant ?? "—"],
["IMEI", selectedOrder?.imei ?? "—"],
["Assigned Agent", selectedOrder?.agent ?? "—"],
] as Array<[string, string]>).map(([label, value]) => (
<div key={label} className="min-w-0 rounded-lg border border-stone-200 bg-white px-4 py-3 transition-colors hover:border-orange-200 hover:bg-orange-50/30">
<p className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</p>
<p className="mt-1.5 break-words text-sm font-semibold leading-5 text-stone-800">{value || "—"}</p>
</div>
))}
</div>
</>
) : inspectionStep === "Physical Condition" ? (
<>
<h3 className="text-sm font-semibold text-stone-900">Physical Condition</h3>
<p className="mt-1 text-xs text-stone-500">Record the device body condition and battery health.</p>
<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
<label className="text-xs font-medium text-stone-700">Body Condition<select className={selectClass} disabled={!isEditable} value={inspectionForm.bodyCondition} onChange={(e) => setInspectionForm((f:any) => ({...f, bodyCondition:e.target.value}))}><option value="">Select condition</option><option value="Excellent">Excellent</option><option value="Good">Good</option><option value="Fair">Fair</option><option value="Poor">Poor</option></select></label>
<label className="text-xs font-medium text-stone-700">Battery Health (%)<input className={inputClass} disabled={!isEditable} type="number" min="0" max="100" value={inspectionForm.batteryHealth} onChange={(e) => setInspectionForm((f:any) => ({...f, batteryHealth:e.target.value}))} placeholder="Enter battery health" /></label>
</div>
</>
) : inspectionStep === "Display" ? (
<>
<h3 className="text-sm font-semibold text-stone-900">Display Condition</h3>
<p className="mt-1 text-xs text-stone-500">Check the screen for cracks, dead pixels and touch/display issues.</p>
<label className="mt-4 block text-xs font-medium text-stone-700">Screen Condition<select className={selectClass} disabled={!isEditable} value={inspectionForm.screenCondition} onChange={(e) => setInspectionForm((f:any) => ({...f, screenCondition:e.target.value}))}><option value="">Select screen condition</option><option value="Excellent">Excellent</option><option value="Good">Good</option><option value="Minor scratches">Minor scratches</option><option value="Cracked / Damaged">Cracked / Damaged</option></select></label>
</>
) : inspectionStep === "Accessories" ? (
<>
<h3 className="text-sm font-semibold text-stone-900">Accessories Check</h3>
<p className="mt-1 text-xs text-stone-500">Mark the accessories received with the device.</p>
<div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
{[{key:"charger",label:"Original Charger"},{key:"cable",label:"USB Cable"},{key:"earphones",label:"Earphones"},{key:"box",label:"Original Box"},{key:"bill",label:"Bill / Invoice"},{key:"simEjector",label:"SIM Ejector"}].map((item) => <label key={item.key} className="flex items-center gap-2 rounded-lg border border-stone-200 p-3 text-xs text-stone-700"><input type="checkbox" disabled={!isEditable} checked={Boolean(inspectionForm.accessories?.[item.key])} onChange={(e) => setInspectionForm((f:any) => ({...f, accessories:{...f.accessories,[item.key]:e.target.checked}}))} className="h-4 w-4 accent-orange-500" />{item.label}</label>)}
</div>
</>
) : inspectionStep === "Warranty Status" ? (
<>
<div className="flex items-start gap-3">
<span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600"><ClipboardCheck size={20} strokeWidth={1.8} /></span>
<div>
<h3 className="text-sm font-semibold text-stone-900">Warranty Details</h3>
<p className="mt-1 text-xs leading-5 text-stone-500">Choose whether the device has an active warranty. If it does not, select No Warranty and continue.</p>
</div>
</div>
<div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
{[{value:"warranty", label:"Has Warranty", description:"The device is covered by warranty"},{value:"no_warranty", label:"No Warranty", description:"No active warranty is available"}].map((option) => {
const selected = inspectionForm.warrantyType === option.value;
return (
<button key={option.value} type="button" disabled={!isEditable} aria-pressed={selected} onClick={() => setInspectionForm((f:any) => ({...f, warrantyType:option.value}))} className={`relative flex min-h-[78px] items-start justify-between gap-3 rounded-xl border px-4 py-3 text-left transition ${selected ? "border-orange-500 bg-orange-50/80 ring-1 ring-orange-200" : "border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50"}`}>
<span><span className="block text-xs font-semibold text-stone-800">{option.label}</span><span className="mt-1.5 block text-[11px] leading-4 text-stone-500">{option.description}</span></span>
<span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${selected ? "border-orange-500 bg-orange-500 text-white" : "border-stone-300 bg-white text-transparent"}`}>{selected ? <Check size={12} strokeWidth={3} /> : null}</span>
</button>
);
})}
</div>
{inspectionForm.warrantyType === "warranty" ? (
<div className="mt-3 rounded-xl border border-stone-200 bg-white p-4">
<h4 className="text-xs font-semibold text-stone-800">Warranty Information</h4>
<div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
<label className="text-[11px] font-medium text-stone-700">Warranty Type <span className="text-red-500">*</span><select className={selectClass} disabled={!isEditable} value={inspectionForm.warrantyDuration} onChange={(e) => setInspectionForm((f:any) => ({...f, warrantyDuration:e.target.value}))}><option value="">Select warranty type</option><option value="Manufacturer">Manufacturer</option><option value="Seller">Seller</option><option value="Extended">Extended warranty</option><option value="Manufacturer - 1 year">Manufacturer - 1 year</option><option value="Manufacturer - 2 years">Manufacturer - 2 years</option></select></label>
<label className="text-[11px] font-medium text-stone-700">Valid Until <span className="text-red-500">*</span><input className={inputClass} disabled={!isEditable} type="date" value={inspectionForm.warrantyValidUntil} onChange={(e) => setInspectionForm((f:any) => ({...f, warrantyValidUntil:e.target.value}))} /></label>
<label className="text-[11px] font-medium text-stone-700 sm:col-span-2">Warranty Provider (Optional)<input className={inputClass} disabled={!isEditable} value={inspectionForm.warrantyProvider} onChange={(e) => setInspectionForm((f:any) => ({...f, warrantyProvider:e.target.value}))} placeholder="Enter brand, seller or warranty provider" /></label>
</div>
</div>
) : inspectionForm.warrantyType === "no_warranty" ? (
<div className="mt-3 flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-3 text-[11px] text-stone-600"><CheckCircle2 size={15} className="shrink-0 text-emerald-600"/><span>No warranty selected. You can move to the next step.</span></div>
) : null}
</>
) : inspectionStep === "Overall Condition" ? (
<>
<h3 className="text-sm font-semibold text-stone-900">Overall Condition & Selling Price</h3>
<p className="mt-1 text-xs text-stone-500">Assign the final grade and set the price used when the device enters inventory.</p>
<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
<label className="text-xs font-medium text-stone-700">Overall Grade<select className={selectClass} disabled={!isEditable} value={inspectionForm.overallGrade} onChange={(e) => setInspectionForm((f:any) => ({...f, overallGrade:e.target.value}))}><option value="">Select grade</option><option value="A+">Grade A+</option><option value="A">Grade A</option><option value="B">Grade B</option><option value="C">Grade C</option><option value="D">Grade D</option></select></label>
<label className="text-xs font-medium text-stone-700">Selling Price ()<input className={inputClass} disabled={!isEditable} type="number" min="1" value={inspectionForm.sellingPrice} onChange={(e) => setInspectionForm((f:any) => ({...f, sellingPrice:e.target.value}))} placeholder="Enter selling price" /></label>
</div>
</>
) : (
<>
<div className="flex items-start gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><CheckCircle2 size={22}/></span><div><h3 className="text-sm font-semibold text-stone-900">Add to Inventory</h3><p className="mt-1 text-xs leading-5 text-stone-500">The inspection must be completed and approved before this device can be added to inventory.</p></div></div>
<div className="mt-4 rounded-lg border border-stone-200 p-3"><p className="text-xs font-medium text-stone-700">Inspection status</p><p className="mt-1 text-sm font-semibold capitalize text-orange-600">{inspectionStatus.replaceAll("_", " ")}</p><p className="mt-2 text-xs text-stone-500">Complete the required steps, then click Complete Inspection and the global Save Changes button.</p></div>
</>
)}
</section>
{/* Duplicate right-side Accessories and Warranty panels removed; both are editable in the centre steps. */}
</div>
{isEditable && (
<div className="mx-2 mb-2 flex items-center justify-between gap-3 rounded-lg border border-orange-100 bg-white px-4 py-3">
<div><p className="text-xs font-semibold text-stone-800">Ready to finish?</p><p className="mt-0.5 text-[11px] text-stone-500">Complete all required steps, click Complete Inspection, then click the global Save Changes button to submit for approval.</p></div>
<button type="button" disabled={inspectionSaving} onClick={() => { setInspectionCompletionRequested(true); setInspectionStep("Add to Inventory"); setInspectionMessage("Completion requested. Click the bottom Save Changes button to save and complete this inspection."); }} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md bg-orange-500 px-4 text-xs font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60"><CheckCircle2 size={16}/>Complete Inspection</button>
</div>
)}
</>
)}
</div>
);
}
case "Documents": {
const documentCards = [
  {
    type: "aadhaar",
    title: "Aadhaar Card",
    description: "Customer identity document",
    icon: ContactRound,
    color: "orange",
    aliases: ["aadhaar", "aadhaar_offline_ekyc"],
  },
  {
    type: "live_photo",
    title: "Live Photo",
    description: "Customer photo captured at pickup",
    icon: ScanFace,
    color: "purple",
    aliases: ["live_photo"],
  },
  {
    type: "device_invoice",
    title: "Device Invoice",
    description: "Invoice or proof provided for the device",
    icon: ReceiptText,
    color: "blue",
    aliases: ["device_invoice", "purchase_bill", "purchase_receipt", "device_purchase_bill", "purchase_proof", "ownership"],
  },
  {
    type: "purchase_invoice",
    title: "Purchase Invoice",
    description: "Generated order purchase invoice",
    icon: FileText,
    color: "red",
    aliases: ["purchase_invoice"],
  },
  {
    type: "payment_slip",
    title: "Payment Slip",
    description: "Generated payment confirmation",
    icon: Receipt,
    color: "green",
    aliases: ["payment_slip"],
  },
];
const iconColors: Record<string, string> = {
  orange: "bg-orange-100 text-orange-500",
  purple: "bg-purple-100 text-purple-500",
  blue: "bg-blue-100 text-blue-500",
  red: "bg-red-100 text-red-500",
  green: "bg-emerald-100 text-emerald-600",
};
const normalizeDocumentType = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
const orderDocuments = Array.isArray(order.documents) ? order.documents : [];
const getDocumentForCard = (card: typeof documentCards[number]) =>
  orderDocuments.find((document) => card.aliases.some((alias) => normalizeDocumentType(alias) === normalizeDocumentType(document.type)) && Boolean(document.url));
return (
<DetailSection title="Documents">
  <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
    <p className="text-sm text-stone-600">Documents attached to this order, loaded from the backend.</p>
    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">{orderDocuments.filter((document) => Boolean(document.url)).length} available</span>
  </div>
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
    {documentCards.map((document) => {
      const Icon = document.icon;
      const uploadedDocument = getDocumentForCard(document);
      const isAvailable = Boolean(uploadedDocument?.url);
      const status = isAvailable ? "Available" : "Not uploaded";
      return (
        <div key={document.type} className="group flex min-h-[238px] min-w-0 flex-col items-center rounded-xl border border-stone-200 bg-white px-5 py-5 text-center shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md">
          <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl ${iconColors[document.color]} ring-1 ring-black/5`}>
            <Icon size={29} strokeWidth={1.8} />
          </div>
          <h3 className="text-base font-semibold tracking-tight text-stone-900">{document.title}</h3>
          <p className="mt-2 min-h-[40px] max-w-[230px] text-sm leading-5 text-stone-500">{document.description}</p>
          <div className="mt-3 flex min-h-[62px] w-full flex-col items-center">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${isAvailable ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100" : "bg-stone-100 text-stone-600 ring-1 ring-stone-200"}`}>
              {isAvailable ? <CheckCircle2 size={12} /> : <Clock3 size={12} />}
              {status}
            </span>
            <p className="mt-2 min-h-[18px] text-xs text-stone-400">
              {uploadedDocument?.uploadedAt ? `Uploaded ${formatDate(uploadedDocument.uploadedAt)}` : "\u00a0"}
            </p>
          </div>
          {isAvailable ? (
            <a href={uploadedDocument!.url} target="_blank" rel="noopener noreferrer" className="mt-auto flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white text-sm font-semibold text-stone-700 shadow-sm transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 group-hover:border-stone-300">
              <Download size={15} /> View / Download
            </a>
          ) : (
            <span className="mt-auto flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-lg border border-dashed border-stone-300 bg-stone-50 text-sm font-medium text-stone-500">
              <Clock3 size={15} />
              No file attached
            </span>
          )}
        </div>
      );
    })}
  </div>
  {orderDocuments.some((document) => Boolean(document.url) && !documentCards.some((card) => card.aliases.some((alias) => normalizeDocumentType(alias) === normalizeDocumentType(document.type)))) && (
    <div className="mt-5">
      <h4 className="mb-3 text-base font-semibold text-stone-800">Other uploaded documents</h4>
      <div className="divide-y divide-stone-100 rounded-lg border border-stone-200">
        {orderDocuments.filter((document) => Boolean(document.url) && !documentCards.some((card) => card.aliases.some((alias) => normalizeDocumentType(alias) === normalizeDocumentType(document.type)))).map((document) => (
          <div key={document.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <FileText size={20} className="shrink-0 text-stone-400" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-stone-800">{document.title}</p>
                <p className="truncate text-xs text-stone-500">{document.fileName || document.type}{document.uploadedAt ? ` · ${formatDate(document.uploadedAt)}` : ""}</p>
              </div>
            </div>
            <a href={document.url} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700">
              <Download size={15} /> View / Download
            </a>
          </div>
        ))}
      </div>
    </div>
  )}
  <div className="mt-6 flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/80 px-5 py-4">
    <Info size={21} className="mt-0.5 shrink-0 text-blue-600" />
    <div>
      <p className="text-sm font-semibold text-stone-800">Document status</p>
      <p className="mt-1 text-sm leading-5 text-stone-600">Availability reflects files returned by the backend. A file being available does not by itself mean that identity verification or document approval is complete.</p>
    </div>
  </div>
</DetailSection>
);
}
case "Timeline": {
const timelineIconFor = (title: string) => {
  const value = title.toLowerCase();
  if (value.includes("payment") || value.includes("payout")) return Wallet;
  if (value.includes("inspection") || value.includes("inspect") || value.includes("quality check")) return ClipboardCheck;
  if (value.includes("inventory") || value.includes("stock")) return ShoppingBag;
  if (value.includes("received at store") || value.includes("device received")) return ContactRound;
  if (value.includes("pickup") || value.includes("picked up") || value.includes("transit") || value.includes("deliver")) return Truck;
  if (value.includes("assign") || value.includes("accepted the pickup request")) return UserCheck;
  if (value.includes("cancel") || value.includes("reject")) return XCircle;
  if (value.includes("verify") || value.includes("aadhaar") || value.includes("document")) return ScanFace;
  if (value.includes("created") || value.includes("order created")) return FileText;
  return History;
};
const timelineToneFor = (title: string) => {
  const value = title.toLowerCase();
  if (value.includes("cancel") || value.includes("reject")) return "red";
  if (value.includes("inspection") || value.includes("inspect") || value.includes("quality check")) return "orange";
  if (value.includes("inventory") || value.includes("stock")) return "purple";
  if (value.includes("received at store") || value.includes("device received") || value.includes("transit") || value.includes("deliver")) return "blue";
  return "emerald";
};
const timelineTones: Record<string, { icon: string; badge: string }> = {
  emerald: { icon: "border-emerald-400 bg-emerald-50 text-emerald-600", badge: "bg-emerald-50 text-emerald-700" },
  blue: { icon: "border-blue-400 bg-blue-50 text-blue-600", badge: "bg-blue-50 text-blue-700" },
  orange: { icon: "border-orange-400 bg-orange-50 text-orange-600", badge: "bg-orange-50 text-orange-700" },
  purple: { icon: "border-purple-400 bg-purple-50 text-purple-600", badge: "bg-purple-50 text-purple-700" },
  red: { icon: "border-red-400 bg-red-50 text-red-600", badge: "bg-red-50 text-red-700" },
};
const splitTimelineDate = (date: string) => {
  const [datePart, timePart] = date.split(" · ");
  return { datePart: datePart || "—", timePart: timePart || "" };
};
return (
<DetailSection title="Timeline">
  <p className="mb-4 text-sm text-stone-500">Track the progress of this order</p>
  {order.timeline.length ? (
    <div className="relative">
      {order.timeline.map((item, index) => {
        const TimelineIcon = timelineIconFor(item.title);
        const tone = timelineTones[timelineToneFor(item.title)] || timelineTones.emerald;
        const { datePart, timePart } = splitTimelineDate(item.date);
        return (
          <div key={`${item.title}-${item.date}-${index}`} className="relative grid grid-cols-[36px_minmax(0,1fr)] gap-x-3 sm:grid-cols-[36px_minmax(0,1fr)_170px_180px] sm:gap-x-4">
            {index !== order.timeline.length - 1 && <span className="absolute bottom-0 left-[16px] top-9 w-px bg-stone-200" />}
            <div className="relative z-10 flex justify-center pt-2">
              <span className={`flex h-8 w-8 items-center justify-center rounded-full border ${tone.icon}`}>
                <TimelineIcon size={16} strokeWidth={1.8} />
              </span>
            </div>
            <div className="min-w-0 border-b border-stone-100 py-2.5 sm:py-3">
              <p className="text-sm font-semibold leading-5 text-stone-800">{item.title}</p>
              <p className="mt-1 text-sm leading-5 text-stone-500">{item.description}</p>
            </div>
            <div className="col-start-2 flex flex-col gap-1 border-b border-stone-100 pb-3 text-xs text-stone-600 sm:col-start-3 sm:justify-center sm:py-3">
              <span className="flex items-center gap-2"><History size={13} className="shrink-0 text-stone-400" />{datePart}</span>
              {timePart && <span className="flex items-center gap-2"><Clock3 size={13} className="shrink-0 text-stone-400" />{timePart}</span>}
            </div>
            <div className="col-start-2 flex items-center border-b border-stone-100 pb-3 sm:col-start-4 sm:justify-center sm:py-3">
              <span className={`inline-flex min-h-9 w-full max-w-[180px] flex-col items-center justify-center rounded-lg px-3 py-2 text-xs font-medium leading-4 ${tone.badge}`}>
                <span className="w-full break-words text-center">{item.actor || "System"}</span>
                {item.role && item.role !== "—" && <span className="mt-0.5 text-[10px] font-normal">{item.role}</span>}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  ) : (
    <div className="py-8 text-sm text-stone-500">No activity recorded yet.</div>
  )}
</DetailSection>
);
}
case "Inventory & Sales": {
const inventoryStatusRaw = String(order.inventoryStatus ?? "").trim();
const normalizedInventoryStatus = inventoryStatusRaw.toLowerCase().replace(/[ _-]+/g, " ");
const inventoryRecord = (selectedOrder as any)?.inventory ?? (selectedOrder as any)?.inventoryRecord ?? {};
const isInStock = ["in stock", "available", "listed", "ready stock", "in inventory", "added to stock"].includes(normalizedInventoryStatus)
  || order.status === "Ready Stock"
  || Boolean(inventoryRecord.addedAt || inventoryRecord.receivedAt || inventoryRecord.stockedAt);
const inventoryAddedAt = inventoryRecord.addedAt ?? inventoryRecord.receivedAt ?? inventoryRecord.createdAt ?? inventoryRecord.stockedAt;
const inventorySku = inventoryRecord.sku ?? inventoryRecord.SKU ?? inventoryRecord.inventoryId ?? inventoryRecord._id ?? "";
const quantityValue = inventoryRecord.quantity ?? inventoryRecord.stockQuantity ?? inventoryRecord.availableQuantity;
const stockQuantity = typeof quantityValue === "number" && Number.isFinite(quantityValue)
  ? quantityValue
  : isInStock ? 1 : 0;
const listedPrice = inventoryRecord.listedPrice ?? inventoryRecord.sellingPrice ?? inventoryRecord.mrp;
const soldAt = inventoryRecord.soldAt ?? inventoryRecord.soldDate;
const zohoItemId = inventoryRecord.zohoItemId ?? inventoryRecord.zoho?.itemId ?? "";
const zohoInvoiceId = inventoryRecord.zohoInvoiceId ?? inventoryRecord.zoho?.invoiceId ?? "";
const salesStatus = inventoryRecord.salesStatus ?? inventoryRecord.listingStatus ?? "";
const syncHistory = Array.isArray(inventoryRecord.zohoSyncHistory) ? inventoryRecord.zohoSyncHistory : [];
const displayTimestamp = (value: unknown) => {
  if (!value) return "—";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "—";
  return `${formatDate(date)} ${date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}`;
};
return (
<div className="space-y-3">
  <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-3">
    <DetailSection title="Inventory Information" className="h-full">
      <div className="space-y-0">
        <DetailRow label="Inventory ID (SKU)" value={inventorySku ? String(inventorySku) : "Not assigned"} />
        <DetailRow label="Availability" value={isInStock ? "In Stock" : inventoryStatusRaw ? formatBackendStatus(inventoryStatusRaw) : "Not added yet"} />
        <DetailRow label="Stock Quantity" value={String(stockQuantity)} />
        <DetailRow label="Added to Inventory" value={displayTimestamp(inventoryAddedAt)} />
        <DetailRow label="IMEI Number" value={order.imei} />
        <div className="mt-3 flex items-center justify-between gap-3 rounded-lg bg-purple-50/70 px-3 py-3">
          <span className="text-sm font-semibold text-stone-700">Purchase Price</span>
          <span className="text-sm font-bold text-stone-700">{order.amount === null ? "—" : formatAmount(order.amount)}</span>
        </div>
      </div>
    </DetailSection>

    <DetailSection title="Zoho Books Sync" className="h-full">
      <div className="space-y-0">
        <DetailRow label="Zoho Item ID" value={zohoItemId ? String(zohoItemId) : "Not connected"} />
        <DetailRow label="Item Name in Zoho" value={zohoItemId ? `${order.device}${order.variant && order.variant !== "—" ? ` ${order.variant}` : ""}` : "Available after integration"} />
        <DetailRow label="Last Synced" value={inventoryRecord.zohoLastSyncedAt ? displayTimestamp(inventoryRecord.zohoLastSyncedAt) : "Not synced"} />
        <div className="mt-3 rounded-lg bg-blue-50 px-3 py-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700">
            <Info size={13} />
            Zoho Books integration planned
          </div>
          <p className="mt-1 text-xs leading-5 text-blue-700/80">Sync details will appear here after Zoho Books is connected.</p>
        </div>
      </div>
    </DetailSection>

    <DetailSection title="Sales in Zoho Books" className="h-full">
      <div className="space-y-0">
        <DetailRow label="Sales Status" value={salesStatus ? formatBackendStatus(String(salesStatus)) : "Not listed"} />
        <DetailRow label="Listed Price (MRP)" value={listedPrice !== undefined && listedPrice !== null && listedPrice !== "" ? formatAmount(Number(listedPrice)) : "Not configured"} />
        <DetailRow label="Linked Zoho Invoice" value={zohoInvoiceId ? String(zohoInvoiceId) : "—"} />
        <DetailRow label="Sold Date" value={soldAt ? displayTimestamp(soldAt) : "—"} />
        <div className="mt-3 rounded-lg bg-blue-50 px-3 py-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-blue-700">
            <Info size={13} />
            {isInStock ? "Item is available for sale" : "Item is not yet in stock"}
          </div>
          <p className="mt-1 text-[10px] leading-4 text-stone-500">Sales and invoice details will update when the relevant workflow is connected.</p>
        </div>
      </div>
    </DetailSection>
  </div>

  <DetailSection title="Zoho Sync History">
    {syncHistory.length > 0 ? (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-xs">
          <thead className="bg-stone-50 text-stone-600">
            <tr>
              <th className="px-3 py-3 font-medium">Date &amp; Time</th>
              <th className="px-3 py-3 font-medium">Action</th>
              <th className="px-3 py-3 font-medium">Zoho Item ID</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium">Synced By</th>
              <th className="px-3 py-3 font-medium">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {syncHistory.map((entry: ApiOrder, index: number) => (
              <tr key={String(entry._id ?? entry.id ?? `${entry.action ?? "sync"}-${index}`)} className="border-t border-stone-100 text-stone-600">
                <td className="px-3 py-3">{displayTimestamp(entry.createdAt ?? entry.syncedAt ?? entry.date)}</td>
                <td className="px-3 py-3">{asText(entry.action ?? entry.event, "—")}</td>
                <td className="px-3 py-3">{asText(entry.zohoItemId ?? entry.itemId, "—")}</td>
                <td className="px-3 py-3"><span className={`rounded px-2 py-1 text-[10px] font-medium ${String(entry.status ?? "").toLowerCase() === "success" || String(entry.status ?? "").toLowerCase() === "synced" ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"}`}>{asText(entry.status, "Pending")}</span></td>
                <td className="px-3 py-3">{asText(entry.syncedByName ?? entry.syncedBy?.fullName ?? entry.syncedBy, "—")}</td>
                <td className="px-3 py-3">{asText(entry.remarks ?? entry.message, "—")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-stone-500"><History size={18} /></div>
        <p className="mt-3 text-sm font-medium text-stone-700">No sync history yet</p>
        <p className="mt-1 max-w-md text-xs leading-5 text-stone-500">Zoho sync activity will be recorded here after the integration is enabled. No sample history is shown.</p>
      </div>
    )}
  </DetailSection>
</div>
);
}
default:
return null;
}
};
if (selectedOrder) {
return (
<div className="space-y-3 pb-10">
{/* Keep the order controls, summary and tabs together while scrolling */}
<div className="top-0 z-40 space-y-2 bg-stone-50 pb-1">
<div>
<button
type="button"
onClick={() => {
setSelectedOrderId(null);
setActiveTab("Overview");
setSuccessMessage("");
setLoadError("");
}}
className="inline-flex items-center gap-2 rounded-md py-1 text-sm font-semibold text-stone-600 transition hover:text-orange-600"
>
<ArrowLeft size={16} />
Back to Orders
</button>
</div>
<div className="flex min-h-[76px] flex-col justify-between gap-3 border-b border-stone-200 bg-white px-5 py-3 sm:flex-row sm:items-center">
<div className="min-w-0">
<div className="flex flex-wrap items-center gap-2.5">
<h1 className="text-xl font-bold tracking-tight text-stone-700 sm:text-2xl">{selectedOrder.id}</h1>
<button type="button" onClick={() => navigator.clipboard?.writeText(selectedOrder.id)} aria-label="Copy order ID" title="Copy order ID" className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"><FileText size={15} /></button>
<span className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium ${["paid", "completed", "success", "succeeded"].includes(selectedOrder.paymentStatus.toLowerCase())
? "bg-emerald-100 text-emerald-700"
: ["", "—", "not started", "not_started", "not initiated"].includes(selectedOrder.paymentStatus.toLowerCase())
? "bg-stone-100 text-stone-500"
: "bg-orange-100 text-orange-600"
}`}>
<Wallet size={14} />
{["paid", "completed", "success", "succeeded"].includes(selectedOrder.paymentStatus.toLowerCase())
? "Payment Completed"
: ["", "—", "not started", "not_started", "not initiated"].includes(selectedOrder.paymentStatus.toLowerCase())
? "Payment Not Started"
: "Payment Pending"}
</span>
<span className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium ${["passed", "completed", "approved", "done"].includes(selectedOrder.inspectionStatus.toLowerCase().replace(/[_-]/g, " "))
? "bg-emerald-100 text-emerald-700"
: ["", "—", "not started", "pending setup", "not initiated"].includes(selectedOrder.inspectionStatus.toLowerCase().replace(/[_-]/g, " "))
? "bg-stone-100 text-stone-500"
: "bg-orange-100 text-orange-600"
}`}>
<ClipboardCheck size={14} />
{["passed", "completed", "approved", "done"].includes(selectedOrder.inspectionStatus.toLowerCase().replace(/[_-]/g, " "))
? "Inspection Completed"
: ["in progress", "started", "inspection in progress"].includes(selectedOrder.inspectionStatus.toLowerCase().replace(/[_-]/g, " "))
? "Inspection In Progress"
: ["", "—", "not started", "pending setup", "not initiated"].includes(selectedOrder.inspectionStatus.toLowerCase().replace(/[_-]/g, " "))
? "Inspection Not Started"
: "Inspection Pending"}
</span>
</div>
<p className="mt-1 text-sm font-medium text-orange-600">{hasPurchaseInvoice(selectedOrder) ? (selectedOrder.purchaseInvoiceNumber || "Invoice generated") : "No invoice generated"}</p>
</div>
<div className="flex shrink-0 items-center gap-2">
<button type="button" onClick={() => { if (!hasPurchaseInvoice(selectedOrder)) { showInvoiceUnavailable(); return; } window.print(); }} className="inline-flex h-9 items-center gap-2 rounded-md border border-stone-200 bg-white px-3 text-sm font-medium text-stone-600 hover:bg-stone-50"><FileText size={15} /> Print</button>
<button type="button" onClick={() => void downloadInvoice()} className="inline-flex h-9 items-center gap-2 rounded-md border border-stone-200 bg-white px-3 text-sm font-medium text-stone-600 hover:border-orange-300 hover:bg-orange-50"><Download size={15} /> Download Invoice</button>
</div>
</div>
<section className="overflow-hidden rounded-xl border border-stone-200 bg-white">
<div className="grid grid-cols-1 divide-y divide-stone-200 md:grid-cols-2 md:divide-y-0 xl:grid-cols-[1.55fr_0.9fr_0.9fr_1fr] xl:divide-x">
<div className="flex min-w-0 items-center gap-4 p-4">
<div className="flex h-[88px] w-[68px] shrink-0 items-center justify-center rounded-md border border-stone-200 bg-stone-50 text-stone-500"><Smartphone size={36} strokeWidth={1.5} /></div>
<div className="min-w-0">
<p className="truncate text-base font-bold text-stone-700">{selectedOrder.device}</p>
<p className="mt-1 text-sm text-stone-600"><span className="font-semibold text-orange-600">{selectedOrder.variant.split(" · ")[0]}</span>{selectedOrder.variant.includes(" · ") ? ` | ${selectedOrder.variant.split(" · ").slice(1).join(" · ")}` : ""}</p>
<div className="mt-3"><StatusBadge status={selectedOrder.status} /></div>
</div>
</div>
<div className="flex min-w-0 items-center gap-3 p-4">
<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-bold text-stone-600">{selectedOrder.customer.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</div>
<div className="min-w-0">
<p className="text-sm text-stone-500">User</p><p className="mt-1 truncate text-sm font-bold text-stone-700">{selectedOrder.customer}</p><p className="mt-1 text-sm text-stone-600">{selectedOrder.phone}</p>
<button type="button" className="mt-2 cursor-default text-xs font-semibold text-blue-600">View User</button>
</div>
</div>
<div className="flex min-w-0 items-center gap-3 p-4">
<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">{["—", "Not assigned"].includes(selectedOrder.agent) ? "—" : selectedOrder.agent.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</div>
<div className="min-w-0">
<p className="text-sm text-stone-500">Agent</p><p className="mt-1 truncate text-sm font-bold text-stone-700">{selectedOrder.agent}</p><p className="mt-1 truncate text-sm text-stone-600">{selectedOrder.agentPhone}</p>
<button type="button" className="mt-2 cursor-default text-xs font-semibold text-blue-600">View Agent</button>
</div>
</div>
<div className="p-4">
<p className="text-sm text-stone-500">Order Date</p><p className="mt-3 text-sm font-semibold text-stone-700">{selectedOrder.date}</p><p className="mt-1 text-sm text-stone-500">{selectedOrder.createdAtLabel.includes(" · ") ? selectedOrder.createdAtLabel.split(" · ").slice(1).join(" · ") : "—"}</p>
<p className="mt-3 text-sm text-stone-500">Order Amount (Final)</p><p className="mt-1 text-2xl font-bold text-stone-700">{formatAmount(selectedOrder.amount)}</p>
</div>
</div>
</section>
<nav className="overflow-x-auto rounded-t-xl border border-stone-200 bg-white">
<div className="flex min-w-[1100px] items-center justify-between px-3">
{tabs.map(({ label, icon: Icon }) => (
<button type="button" key={label} onClick={() => setActiveTab(label)} className={`inline-flex min-h-[52px] items-center justify-center gap-2 border-b-[3px] px-4 text-sm font-semibold transition sm:px-5 ${activeTab === label ? "border-orange-500 text-orange-600" : "border-transparent text-stone-600 hover:bg-stone-50 hover:text-orange-600"}`}>
<Icon size={17} strokeWidth={1.7} />{label}
</button>
))}
</div>
</nav>
</div>
{((loadError && !loadError.toLowerCase().includes("cancellation reason")) || (successMessage && !successMessage.toLowerCase().includes("cancel"))) && <div role={loadError ? "alert" : "status"} className={`rounded-lg border px-4 py-3 text-sm ${loadError ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>{loadError || successMessage}</div>}
{renderTabContent(selectedOrder)}
<div className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-200 bg-white/95 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] backdrop-blur lg:left-[240px] sm:px-6">
<div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-3">
<p className="hidden text-xs text-stone-500 sm:block">Review all details before saving changes.</p>
<div className="ml-auto flex gap-2">
<button
type="button"
onClick={() => {
setSelectedOrderId(null);
setActiveTab("Overview");
setSuccessMessage("");
setLoadError("");
}}
className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50"
>
Cancel
</button>
<button
type="button"
onClick={async () => {
if (activeTab === "Inspection") {
await saveInspection();
return;
}
await fetchOrders();
setSuccessMessage("Order details refreshed successfully.");
}}
className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
>
<CheckCircle2 size={14} className="mr-1.5 inline" />Save Changes
</button>
</div>
</div>
</div>
</div>
);
}
return (
<div className="space-y-2">
{loadError && (
<div role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
<span>{loadError}</span>
<button type="button" onClick={() => void fetchOrders()} className="font-semibold underline">Retry</button>
</div>
)}
{successMessage && !selectedOrderId && (
<div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</div>
)}
{/* Summary cards */}
<div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
{[
{ label: "Total Orders", value: orders.length.toLocaleString("en-IN"), note: "all orders", icon: PackageCheck, box: "bg-purple-50 text-purple-500", trend: getCardTrend(orders, undefined, "month") },
{ label: "Pending", value: orders.filter((item) => ["pending", "pickup_scheduled", "assigned"].includes(String(item.rawStatus).toLowerCase())).length.toLocaleString("en-IN"), note: "pending orders", icon: Clock3, box: "bg-red-50 text-red-400", trend: getCardTrend(orders, ["pending", "pickup_scheduled", "assigned"], "month") },
{ label: "In Transit", value: orders.filter((item) => ["in_transit", "payment_completed"].includes(item.rawStatus)).length.toLocaleString("en-IN"), note: "with agent", icon: Truck, box: "bg-blue-50 text-blue-500", trend: getCardTrend(orders, ["in_transit", "payment_completed"], "day", true) },
{ label: "Cancelled", value: orders.filter((item) => ["cancelled", "rejected"].includes(item.rawStatus)).length.toLocaleString("en-IN"), note: "cancelled orders", icon: XCircle, box: "bg-red-50 text-red-500", trend: getCardTrend(orders, ["cancelled", "rejected"], "month") },
{ label: "Inspection Pending", value: orders.filter((item) => ["inspection_pending", "inspection_in_progress", "under_inspection"].includes(String(item.rawStatus).toLowerCase())).length.toLocaleString("en-IN"), note: "awaiting inspection", icon: ClipboardCheck, box: "bg-amber-50 text-amber-500", trend: getCardTrend(orders, ["inspection_pending", "inspection_in_progress", "under_inspection"], "week") },
 ].map(({ label, value, note, icon: Icon, box, trend }) => (
<div key={label} className="flex h-[91px] min-w-0 items-center gap-3 rounded-lg border border-stone-200 bg-white px-3.5">
<div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${box}`}><Icon size={22} strokeWidth={1.7} /></div>
<div className="min-w-0">
<p className="text-xs font-medium leading-4 text-stone-600">{label}</p>
<p className="text-2xl font-semibold leading-7 text-stone-700">{value}</p>
<div className="mt-0.5 flex min-w-0 items-center gap-1 whitespace-nowrap text-[10px] leading-3">
<span className={trend?.direction === "down" ? "font-semibold text-red-500" : trend?.direction === "up" ? "font-semibold text-emerald-600" : "font-medium text-stone-500"}>
{trend?.direction === "down" ? "↘" : trend?.direction === "up" ? "↗" : "→"} {trend?.text}
</span>
<span className="truncate text-stone-400">{trend?.period ?? note}</span>
</div>
</div>
</div>
))}
</div>
{/* Orders table */}
<section className="overflow-hidden rounded-lg border border-stone-200 bg-white">
<div className="flex min-h-[52px] items-center justify-between gap-4 px-5 py-3">
<h2 className="text-lg font-medium text-stone-900">
All Orders
</h2>
<div className="flex items-center gap-3">
<input
type="search"
value={search}
onChange={(event) => { setSearch(event.target.value); setPage(1); }}
placeholder="Search orders..."
aria-label="Search orders"
className="h-[38px] w-44 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
/>
{/* Premium Filter */}
<label className="flex h-[38px] cursor-pointer items-center gap-2 rounded-lg border border-stone-200 bg-white px-3.5 text-stone-600 shadow-sm transition-all duration-200 hover:border-orange-300 hover:bg-orange-50/50 hover:text-orange-600 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100">
<SlidersHorizontal
size={16}
strokeWidth={1.8}
className="shrink-0"
/>
<select
value={statusFilter}
onChange={(event) => selectFilter(event.target.value)}
aria-label="Filter orders"
className="cursor-pointer bg-transparent text-sm font-medium outline-none"
>
<option value="All">Filter</option>
{Array.from(new Set(orders.map((order) => order.rawStatus).filter(Boolean))).sort().map((status) => (
<option key={status} value={status}>
{formatBackendStatus(status)}
</option>
))}
</select>
</label>
{/* Premium Export */}
<button
type="button"
onClick={() => {
const rows = [
["ORDER ID", "USER NAME", "AGENT", "PHONE MODEL", "STATUS", "PRICE", "DATE"],
...filteredOrders.map((order) => [
order.id,
order.customer,
order.agent,
order.device,
order.status,
order.amount === null ? "—" : String(order.amount),
order.date,
]),
];
const csv = rows
.map((row) =>
row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
)
.join("\n");
const url = URL.createObjectURL(
new Blob([csv], { type: "text/csv;charset=utf-8;" })
);
const link = document.createElement("a");
link.href = url;
link.download = "excart-orders.csv";
link.click();
URL.revokeObjectURL(url);
}}
className="group flex h-[38px] items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 text-sm font-medium text-stone-700 shadow-sm transition-all duration-200 hover:border-orange-300 hover:bg-orange-500 hover:text-white hover:shadow-md active:scale-[0.98]"
>
<FileText
size={16}
strokeWidth={1.8}
/>
Export
</button>
</div>
</div>
<div className="mx-2 overflow-x-auto rounded-lg border border-stone-200">
<table className="w-full min-w-[1100px] table-fixed border-collapse text-left">
<colgroup>
<col style={{ width: "14%" }} />
<col style={{ width: "14%" }} />
<col style={{ width: "12%" }} />
<col style={{ width: "20%" }} />
<col style={{ width: "14%" }} />
<col style={{ width: "10%" }} />
<col style={{ width: "9%" }} />
<col style={{ width: "7%" }} />
</colgroup>
<thead>
<tr className="h-[40px] bg-stone-100">
{["ORDER ID", "USER NAME", "AGENT", "PHONE MODEL", "STATUS", "PRICE", "DATE", "ACTION"].map((heading) => (
<th
key={heading}
className={`whitespace-nowrap px-4 text-xs font-bold tracking-wide text-stone-600 ${heading === "PRICE" || heading === "ACTION" ? "text-center" : ""
}`}
>
{heading}
</th>
))}
</tr>
</thead>
<tbody className="divide-y divide-stone-100">
{isLoading ? (
<tr><td colSpan={8} className="px-6 py-12 text-center text-sm text-stone-500">Loading orders from the backend...</td></tr>
) : visibleOrders.length === 0 ? (
<tr><td colSpan={8} className="px-6 py-12 text-center text-sm text-stone-500">No orders found.</td></tr>
) : visibleOrders.map((order) => {
const initials = order.customer === "—" ? "—" : order.customer
.split(" ")
.map((part) => part[0])
.slice(0, 2)
.join("")
.toUpperCase();
const displayStatus =
order.status === "In Transit" ? "In Transit" :
order.status === "Ready Stock" ? "Ready for stock" :
order.status === "Scheduled" ? "Pickup Scheduled" :
order.status === "Inspection" ? "Under Inspection" :
order.status;
const badgeColor =
order.status === "In Transit" ? "bg-blue-50 text-blue-600" :
order.status === "Ready Stock" || order.status === "Completed" ? "bg-emerald-50 text-emerald-600" :
order.status === "Scheduled" ? "bg-blue-50 text-blue-600" :
order.status === "Inspection" ? "bg-orange-50 text-orange-600" :
order.status === "Cancelled" ? "bg-red-50 text-red-600" :
order.status === "Picked Up" ? "bg-cyan-50 text-cyan-600" :
"bg-orange-50 text-orange-600";
return (
<tr key={order.id} className="h-[58px] transition-colors hover:bg-orange-50/30">
<td className="px-4 py-2">
<button type="button" onClick={() => openOrder(order)} className="text-left">
<span className="block whitespace-nowrap text-sm font-semibold text-orange-600">
{order.id}
</span>
</button>
</td>
<td className="px-4 py-2">
<div className="flex min-w-0 items-center gap-2">
<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-stone-600">
{initials}
</span>
<span className="truncate text-sm font-semibold text-stone-700">
{order.customer === "—" ? "—" : order.customer.toUpperCase()}
</span>
</div>
</td>
<td className="truncate px-4 py-2 text-sm font-medium text-stone-600">
{order.agent === "—" ? "—" : order.agent.toUpperCase()}
</td>
<td className="px-4 py-2">
<div className="flex min-w-0 items-center gap-2">
<span className="flex h-[42px] w-[32px] shrink-0 items-center justify-center rounded-md border border-stone-200 bg-stone-50 text-stone-400" aria-hidden="true">
<Smartphone size={20} strokeWidth={1.5} />
</span>
<div className="min-w-0">
<p className="truncate text-sm font-semibold text-stone-700">
{order.device}
</p>
<p className="mt-1 text-xs text-orange-600">
{order.variant === "—" ? "—" : order.variant.split(" · ")[0]}
</p>
</div>
</div>
</td>
<td className="px-4 py-2">
<span className={`inline-flex whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium ${badgeColor}`}>
{displayStatus}
</span>
</td>
<td className="px-4 py-2 text-center">
<p className="whitespace-nowrap text-sm font-semibold text-stone-700">
{formatAmount(order.amount)}
</p>
<p className={`mt-1 text-xs ${order.paymentStatus === "Paid" ? "text-emerald-600" : "text-orange-600"}`}>
{order.paymentStatus}
</p>
</td>
<td className="whitespace-nowrap px-3 py-2 text-sm text-stone-600">
{order.date}
</td>
<td className="px-3 py-2">
<button
type="button"
onClick={() => openOrder(order)}
aria-label={`View ${order.id}`}
className="mx-auto flex items-center justify-center gap-1 rounded-md p-2 text-stone-400 transition hover:bg-orange-50 hover:text-orange-600"
>
<span className="h-1 w-1 rounded-full bg-current" />
<span className="h-1 w-1 rounded-full bg-current" />
<span className="h-1 w-1 rounded-full bg-current" />
</button>
</td>
</tr>
);
})}
</tbody>
</table>
</div>
<div className="flex min-h-[37px] flex-wrap items-center justify-between gap-2 px-3 py-2">
<p className="text-sm text-stone-500">Showing {filteredOrders.length === 0 ? 0 : (safePage - 1) * pageSize + 1} to {Math.min(safePage * pageSize, filteredOrders.length)} of {filteredOrders.length} orders</p>
<div className="flex items-center gap-1.5">
<button type="button" disabled={safePage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded border border-stone-200 p-1 text-stone-500 disabled:opacity-40" aria-label="Previous page"><ChevronLeft size={13} /></button>
{Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => <button key={pageNumber} type="button" onClick={() => setPage(pageNumber)} className={`h-7 min-w-7 rounded px-2 text-sm ${safePage === pageNumber ? "bg-orange-500 font-semibold text-white" : "border border-stone-200 text-stone-600 hover:bg-stone-50"}`}>{pageNumber}</button>)}
<button type="button" disabled={safePage >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="rounded border border-stone-200 p-1 text-stone-500 disabled:opacity-40" aria-label="Next page"><ChevronRight size={13} /></button>
<span className="ml-2 whitespace-nowrap text-xs text-stone-500">Rows per page</span><span className="rounded border border-stone-200 px-2 py-1 text-sm text-stone-600">{pageSize}</span>
</div>
</div>
</section>
</div>
);
}
