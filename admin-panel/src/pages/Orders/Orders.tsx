import { useMemo, useState } from "react";
import {
 ArrowLeft,
 SlidersHorizontal,
 ChevronLeft,
 ChevronRight,
 Smartphone,
 UserRound,
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
} from "lucide-react";

type OrderStatus =
 | "New"
 | "Scheduled"
 | "Picked Up"
 | "Inspection"
 | "Payment Pending"
 | "Completed"
 | "Cancelled";

type Order = {
 id: string;
 customer: string;
 phone: string;
 device: string;
 variant: string;
 amount: number;
 status: OrderStatus;
 agent: string;
 date: string;
 location: string;
 imei: string;
 paymentMethod: string;
 paymentStatus: string;
 inspectionStatus: string;
 condition: string;
 timeline: { title: string; date: string; completed: boolean }[];
};

const initialOrders: Order[] = [
  {
    id: "EXC-2026-1041",
    customer: "Hafiz Rahman",
    phone: "+91 98471 23456",
    device: "Apple iPhone 14 Pro",
    variant: "256GB · Deep Purple",
    amount: 42000,
    status: "Completed",
    agent: "Muhammed Shamil",
    date: "13 Oct 2026",
    location: "Manjeri, Malappuram",
    imei: "356789102345672",
    paymentMethod: "Bank Transfer",
    paymentStatus: "Paid",
    inspectionStatus: "Passed",
    condition: "Excellent",
    timeline: [
      { title: "Order created", date: "12 Oct 2026, 10:00 AM", completed: true },
      { title: "Pickup completed", date: "12 Oct 2026, 2:00 PM", completed: true },
      { title: "Inspection completed", date: "13 Oct 2026, 10:00 AM", completed: true },
      { title: "Payment completed", date: "13 Oct 2026, 1:00 PM", completed: true },
    ],
  },
  {
    id: "EXC-2026-1040",
    customer: "Fathima N",
    phone: "+91 97450 12345",
    device: "Samsung Galaxy S22",
    variant: "128GB · Green",
    amount: 24500,
    status: "Payment Pending",
    agent: "Shahid Ali",
    date: "12 Oct 2026",
    location: "Kottakkal, Malappuram",
    imei: "358123456789013",
    paymentMethod: "UPI",
    paymentStatus: "Pending",
    inspectionStatus: "Passed",
    condition: "Good",
    timeline: [
      { title: "Order created", date: "11 Oct 2026, 9:00 AM", completed: true },
      { title: "Pickup completed", date: "11 Oct 2026, 1:00 PM", completed: true },
      { title: "Inspection completed", date: "12 Oct 2026, 10:00 AM", completed: true },
      { title: "Payment pending", date: "Awaiting payment", completed: false },
    ],
  },
  {
    id: "EXC-2026-1039",
    customer: "Ashraf K",
    phone: "+91 98950 11223",
    device: "OnePlus 10 Pro",
    variant: "256GB · Emerald Forest",
    amount: 18000,
    status: "Inspection",
    agent: "Abdul Basith",
    date: "12 Oct 2026",
    location: "Perinthalmanna, Malappuram",
    imei: "351234567890124",
    paymentMethod: "Bank Transfer",
    paymentStatus: "Not Initiated",
    inspectionStatus: "In Progress",
    condition: "Pending",
    timeline: [
      { title: "Order created", date: "11 Oct 2026, 9:30 AM", completed: true },
      { title: "Pickup completed", date: "11 Oct 2026, 3:00 PM", completed: true },
      { title: "Inspection in progress", date: "12 Oct 2026, 11:00 AM", completed: false },
    ],
  },
  {
    id: "EXC-2026-1038",
    customer: "Naseema P",
    phone: "+91 96330 45678",
    device: "Apple iPhone 13 Pro",
    variant: "128GB · Sierra Blue",
    amount: 29000,
    status: "Picked Up",
    agent: "Rashid K",
    date: "11 Oct 2026",
    location: "Tirur, Malappuram",
    imei: "352345678901235",
    paymentMethod: "UPI",
    paymentStatus: "Not Initiated",
    inspectionStatus: "Pending",
    condition: "Pending",
    timeline: [
      { title: "Order created", date: "11 Oct 2026, 8:00 AM", completed: true },
      { title: "Pickup completed", date: "11 Oct 2026, 2:00 PM", completed: true },
      { title: "Inspection pending", date: "Waiting for inspection", completed: false },
    ],
  },
  {
    id: "EXC-2026-1037",
    customer: "Junaid M",
    phone: "+91 99610 67890",
    device: "Google Pixel 7",
    variant: "128GB · Obsidian",
    amount: 16500,
    status: "Scheduled",
    agent: "Nihal T",
    date: "10 Oct 2026",
    location: "Manjeri, Malappuram",
    imei: "353456789012346",
    paymentMethod: "Bank Transfer",
    paymentStatus: "Not Initiated",
    inspectionStatus: "Pending",
    condition: "Pending",
    timeline: [
      { title: "Order created", date: "10 Oct 2026, 11:00 AM", completed: true },
      { title: "Pickup scheduled", date: "13 Oct 2026, 10:00 AM", completed: false },
    ],
  },
  {
    id: "EXC-2026-1036",
    customer: "Rifana T",
    phone: "+91 98470 67891",
    device: "Samsung Galaxy A54",
    variant: "128GB · Awesome Graphite",
    amount: 10500,
    status: "New",
    agent: "Not assigned",
    date: "10 Oct 2026",
    location: "Kondotty, Malappuram",
    imei: "354567890123457",
    paymentMethod: "Not selected",
    paymentStatus: "Not Initiated",
    inspectionStatus: "Pending",
    condition: "Pending",
    timeline: [
      { title: "Order created", date: "10 Oct 2026, 2:30 PM", completed: true },
      { title: "Agent assignment", date: "Awaiting assignment", completed: false },
    ],
  },
  {
    id: "EXC-2026-1035",
    customer: "Basheer V",
    phone: "+91 98951 22334",
    device: "Redmi Note 13 Pro",
    variant: "256GB · Midnight Black",
    amount: 12500,
    status: "Cancelled",
    agent: "Not assigned",
    date: "9 Oct 2026",
    location: "Wandoor, Malappuram",
    imei: "355678901234568",
    paymentMethod: "Not selected",
    paymentStatus: "Not Initiated",
    inspectionStatus: "Not Started",
    condition: "Pending",
    timeline: [
      { title: "Order created", date: "9 Oct 2026, 12:00 PM", completed: true },
      { title: "Order cancelled", date: "9 Oct 2026, 1:30 PM", completed: true },
    ],
  },
  {
    id: "EXC-2026-1034",
    customer: "Shameer A",
    phone: "+91 97460 11223",
    device: "Apple iPhone 12 Pro",
    variant: "128GB · Pacific Blue",
    amount: 19500,
    status: "Completed",
    agent: "Muhammed Shamil",
    date: "9 Oct 2026",
    location: "Manjeri, Malappuram",
    imei: "356789102345673",
    paymentMethod: "Bank Transfer",
    paymentStatus: "Paid",
    inspectionStatus: "Passed",
    condition: "Good",
    timeline: [
      { title: "Order created", date: "8 Oct 2026, 10:00 AM", completed: true },
      { title: "Pickup completed", date: "8 Oct 2026, 2:00 PM", completed: true },
      { title: "Inspection completed", date: "9 Oct 2026, 10:00 AM", completed: true },
      { title: "Payment completed", date: "9 Oct 2026, 12:00 PM", completed: true },
    ],
  },
  {
    id: "EXC-2026-1033",
    customer: "Muneer P",
    phone: "+91 96330 12345",
    device: "Samsung Galaxy S21 FE",
    variant: "128GB · Olive",
    amount: 14500,
    status: "Payment Pending",
    agent: "Shahid Ali",
    date: "8 Oct 2026",
    location: "Kottakkal, Malappuram",
    imei: "357890123456781",
    paymentMethod: "UPI",
    paymentStatus: "Pending",
    inspectionStatus: "Passed",
    condition: "Good",
    timeline: [
      { title: "Order created", date: "7 Oct 2026, 9:00 AM", completed: true },
      { title: "Pickup completed", date: "7 Oct 2026, 1:00 PM", completed: true },
      { title: "Inspection completed", date: "8 Oct 2026, 10:00 AM", completed: true },
      { title: "Payment pending", date: "Awaiting payment", completed: false },
    ],
  },
  {
    id: "EXC-2026-1032",
    customer: "Haseena K",
    phone: "+91 99610 98765",
    device: "OnePlus Nord 3",
    variant: "128GB · Misty Green",
    amount: 13500,
    status: "Inspection",
    agent: "Abdul Basith",
    date: "8 Oct 2026",
    location: "Perinthalmanna, Malappuram",
    imei: "358901234567892",
    paymentMethod: "Bank Transfer",
    paymentStatus: "Not Initiated",
    inspectionStatus: "In Progress",
    condition: "Pending",
    timeline: [
      { title: "Order created", date: "7 Oct 2026, 10:00 AM", completed: true },
      { title: "Pickup completed", date: "7 Oct 2026, 3:00 PM", completed: true },
      { title: "Inspection in progress", date: "8 Oct 2026, 11:00 AM", completed: false },
    ],
  },
  {
    id: "EXC-2026-1031",
    customer: "Adil Rahman",
    phone: "+91 98471 56789",
    device: "Apple iPhone 11",
    variant: "128GB · Black",
    amount: 12000,
    status: "Picked Up",
    agent: "Rashid K",
    date: "7 Oct 2026",
    location: "Tirur, Malappuram",
    imei: "359012345678903",
    paymentMethod: "UPI",
    paymentStatus: "Not Initiated",
    inspectionStatus: "Pending",
    condition: "Pending",
    timeline: [
      { title: "Order created", date: "7 Oct 2026, 8:00 AM", completed: true },
      { title: "Pickup completed", date: "7 Oct 2026, 2:00 PM", completed: true },
      { title: "Inspection pending", date: "Waiting for inspection", completed: false },
    ],
  },
  {
    id: "EXC-2026-1030",
    customer: "Faseela C",
    phone: "+91 98950 33445",
    device: "Google Pixel 6",
    variant: "128GB · Stormy Black",
    amount: 11000,
    status: "Scheduled",
    agent: "Nihal T",
    date: "7 Oct 2026",
    location: "Manjeri, Malappuram",
    imei: "350123456789014",
    paymentMethod: "Bank Transfer",
    paymentStatus: "Not Initiated",
    inspectionStatus: "Pending",
    condition: "Pending",
    timeline: [
      { title: "Order created", date: "7 Oct 2026, 9:30 AM", completed: true },
      { title: "Pickup scheduled", date: "10 Oct 2026, 11:00 AM", completed: false },
    ],
  },
  {
    id: "EXC-2026-1029",
    customer: "Suhail T",
    phone: "+91 97450 99887",
    device: "Samsung Galaxy A34",
    variant: "128GB · Awesome Silver",
    amount: 9000,
    status: "New",
    agent: "Not assigned",
    date: "6 Oct 2026",
    location: "Kondotty, Malappuram",
    imei: "351234567890125",
    paymentMethod: "Not selected",
    paymentStatus: "Not Initiated",
    inspectionStatus: "Pending",
    condition: "Pending",
    timeline: [
      { title: "Order created", date: "6 Oct 2026, 1:00 PM", completed: true },
      { title: "Agent assignment", date: "Awaiting assignment", completed: false },
    ],
  },
  {
    id: "EXC-2026-1028",
    customer: "Nabeel P",
    phone: "+91 96330 44556",
    device: "Redmi Note 11",
    variant: "128GB · Star Blue",
    amount: 6500,
    status: "Cancelled",
    agent: "Not assigned",
    date: "6 Oct 2026",
    location: "Wandoor, Malappuram",
    imei: "352345678901236",
    paymentMethod: "Not selected",
    paymentStatus: "Not Initiated",
    inspectionStatus: "Not Started",
    condition: "Pending",
    timeline: [
      { title: "Order created", date: "6 Oct 2026, 10:00 AM", completed: true },
      { title: "Order cancelled", date: "6 Oct 2026, 11:00 AM", completed: true },
    ],
  },
  {
    id: "EXC-2026-1027",
    customer: "Afsal M",
    phone: "+91 99610 44556",
    device: "Apple iPhone XR",
    variant: "64GB · Coral",
    amount: 8000,
    status: "Completed",
    agent: "Muhammed Shamil",
    date: "5 Oct 2026",
    location: "Manjeri, Malappuram",
    imei: "353456789012347",
    paymentMethod: "Bank Transfer",
    paymentStatus: "Paid",
    inspectionStatus: "Passed",
    condition: "Fair",
    timeline: [
      { title: "Order created", date: "4 Oct 2026, 10:00 AM", completed: true },
      { title: "Pickup completed", date: "4 Oct 2026, 2:00 PM", completed: true },
      { title: "Inspection completed", date: "5 Oct 2026, 10:00 AM", completed: true },
      { title: "Payment completed", date: "5 Oct 2026, 12:00 PM", completed: true },
    ],
  },
  {
    id: "EXC-2026-1026",
    customer: "Ramees K",
    phone: "+91 98470 99887",
    device: "Samsung Galaxy M34",
    variant: "128GB · Midnight Blue",
    amount: 7500,
    status: "Payment Pending",
    agent: "Shahid Ali",
    date: "5 Oct 2026",
    location: "Kottakkal, Malappuram",
    imei: "354567890123458",
    paymentMethod: "UPI",
    paymentStatus: "Pending",
    inspectionStatus: "Passed",
    condition: "Good",
    timeline: [
      { title: "Order created", date: "4 Oct 2026, 9:00 AM", completed: true },
      { title: "Pickup completed", date: "4 Oct 2026, 1:00 PM", completed: true },
      { title: "Inspection completed", date: "5 Oct 2026, 10:00 AM", completed: true },
      { title: "Payment pending", date: "Awaiting payment", completed: false },
    ],
  },
  {
    id: "EXC-2026-1025",
    customer: "Shifana A",
    phone: "+91 98951 55667",
    device: "OnePlus Nord CE 3",
    variant: "256GB · Aqua Surge",
    amount: 9500,
    status: "New",
    agent: "Not assigned",
    date: "4 Oct 2026",
    location: "Perinthalmanna, Malappuram",
    imei: "355678901234569",
    paymentMethod: "Not selected",
    paymentStatus: "Not Initiated",
    inspectionStatus: "Pending",
    condition: "Pending",
    timeline: [
      { title: "Order created", date: "4 Oct 2026, 2:00 PM", completed: true },
      { title: "Agent assignment", date: "Awaiting assignment", completed: false },
    ],
  },
];

const tabs = [
 { label: "Overview", icon: ShoppingBag },
 { label: "Device Details", icon: Smartphone },
 { label: "Payments", icon: Wallet },
 { label: "Inspection", icon: ClipboardCheck },
 { label: "Documents", icon: FileText },
 { label: "Timeline", icon: History },
 { label: "Inventory & Sales", icon: PackageCheck },
];

const statusStyles: Record<OrderStatus, string> = {
 New: "bg-blue-50 text-blue-700 ring-blue-200",
 Scheduled: "bg-violet-50 text-violet-700 ring-violet-200",
 "Picked Up": "bg-cyan-50 text-cyan-700 ring-cyan-200",
 Inspection: "bg-amber-50 text-amber-700 ring-amber-200",
 "Payment Pending": "bg-orange-50 text-orange-700 ring-orange-200",
 Completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
 Cancelled: "bg-red-50 text-red-700 ring-red-200",
};

function formatAmount(amount: number) {
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
}: {
 title: string;
 children: React.ReactNode;
}) {
 return (
 <section className="rounded-xl border border-stone-200 bg-white">
 <div className="border-b border-stone-100 px-5 py-4">
 <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
 </div>
 <div className="p-5">{children}</div>
 </section>
 );
}

function DetailRow({ label, value }: { label: string; value: string }) {
 return (
 <div className="flex flex-col gap-1 border-b border-stone-100 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
 <span className="text-sm text-stone-500">{label}</span>
 <span className="break-words text-sm font-medium text-stone-900 sm:text-right">{value}</span>
 </div>
 );
}

export default function Orders() {
 const [orders, setOrders] = useState(initialOrders);
 const [search] = useState("");
 const [statusFilter, setStatusFilter] = useState("All");
 const [dateFilter] = useState("All time");
 const [page, setPage] = useState(1);
 const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
 const [activeTab, setActiveTab] = useState("Overview");

 const selectedOrder = orders.find((order) => order.id === selectedOrderId);

 const filteredOrders = useMemo(() => {
 const query = search.trim().toLowerCase();

 return orders.filter((order) => {
 const matchesSearch =
 !query ||
 order.id.toLowerCase().includes(query) ||
 order.customer.toLowerCase().includes(query) ||
 order.phone.toLowerCase().includes(query) ||
 order.device.toLowerCase().includes(query);

 const matchesStatus =
 statusFilter === "All" || order.status === statusFilter;

 const matchesDate =
 dateFilter === "All time" ||
 (dateFilter === "Today" && order.date === "16 Oct 2026") ||
 (dateFilter === "Last 7 days" &&
 ["16 Oct 2026", "15 Oct 2026", "14 Oct 2026"].includes(order.date));

 return matchesSearch && matchesStatus && matchesDate;
 });
 }, [orders, search, statusFilter, dateFilter]);

 const pageSize = 8;
 const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
 const visibleOrders = filteredOrders.slice(
 (page - 1) * pageSize,
 page * pageSize,
 );

 const openOrder = (order: Order) => {
 setSelectedOrderId(order.id);
 setActiveTab("Overview");
 };

 const updateOrderStatus = (status: OrderStatus) => {
 if (!selectedOrder) return;

 setOrders((current) =>
 current.map((order) =>
 order.id === selectedOrder.id ? { ...order, status } : order,
 ),
 );
 };

 const selectFilter = (value: string) => {
 setStatusFilter(value);
 setPage(1);
 };

 const renderTabContent = (order: Order) => {
 switch (activeTab) {
 case "Overview":
 return (
 <div className="space-y-4 pb-20">
   <div className="grid gap-4 xl:grid-cols-[1.35fr_1fr]">
     <DetailSection title="Order Information">
       <DetailRow label="Order ID" value={order.id} />
       <DetailRow label="Invoice ID" value={`INV-${order.id.replace("EXC-", "")}`} />
       <DetailRow label="Order Date" value={`${order.date} · 10:30 AM`} />
       <DetailRow label="Order Type" value="Device Trade-in" />
       <DetailRow label="Payment Status" value={order.paymentStatus} />
     </DetailSection>
     <DetailSection title="Agent & Pickup Details">
       <DetailRow label="Assigned Agent" value={order.agent} />
       <DetailRow label="Agent Contact" value="+91 98765 10000" />
       <DetailRow label="Pickup Address" value={order.location} />
       <DetailRow label="Pickup Date" value={order.date} />
       <DetailRow label="Pickup Slot" value="10:00 AM – 12:00 PM" />
     </DetailSection>
   </div>
   <div className="grid gap-4 xl:grid-cols-2">
     <DetailSection title="Status & Progress">
       <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-stone-50 p-3">
         <div><p className="text-xs text-stone-500">Current order status</p><div className="mt-2"><StatusBadge status={order.status} /></div></div>
         <label className="text-xs font-medium text-stone-600">Update status<select value={order.status} onChange={(event) => updateOrderStatus(event.target.value as OrderStatus)} className="mt-1 block rounded-lg border border-stone-200 bg-white px-2.5 py-2 text-sm outline-none focus:border-orange-400">{Object.keys(statusStyles).map((status) => <option key={status} value={status}>{status}</option>)}</select></label>
       </div>
       <div className="space-y-4">
         {["Order Created", "Agent Assigned", "Device Picked Up", "Inspection", "Payment"].map((step, index) => {
           const done = index === 0 || (index === 1 && order.agent !== "Not assigned") || (index === 2 && ["Picked Up", "Inspection", "Payment Pending", "Completed"].includes(order.status)) || (index === 3 && ["Inspection", "Payment Pending", "Completed"].includes(order.status)) || (index === 4 && order.status === "Completed");
           return <div key={step} className="flex items-center gap-3"><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${done ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-400"}`}>{done ? <CheckCircle2 size={15}/> : <Clock3 size={15}/>}</span><div className="flex-1"><p className="text-sm font-medium text-stone-800">{step}</p><p className="mt-0.5 text-xs text-stone-500">{done ? "Completed" : "Pending"}</p></div><span className={`text-xs font-medium ${done ? "text-emerald-600" : "text-stone-400"}`}>{done ? "Done" : "Waiting"}</span></div>;
         })}
       </div>
     </DetailSection>
     <DetailSection title="Activity Timeline">
       <div className="space-y-0">{order.timeline.map((item, index) => <div key={`${item.title}-${index}`} className="relative flex gap-3 pb-5 last:pb-0">{index !== order.timeline.length - 1 && <span className="absolute left-[10px] top-6 h-full w-px bg-stone-200"/>}<span className={`relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${item.completed ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>{item.completed ? <CheckCircle2 size={13}/> : <Clock3 size={13}/>}</span><div className="min-w-0 flex-1"><p className="text-sm font-medium text-stone-800">{item.title}</p><p className="mt-1 text-xs text-stone-500">{item.date}</p></div></div>)}</div>
     </DetailSection>
   </div>
   <div className="grid gap-4 xl:grid-cols-2">
     <DetailSection title="Internal Notes"><textarea defaultValue="Customer requested careful handling of the device during pickup." rows={3} className="w-full resize-y rounded-lg border border-stone-200 px-3 py-2.5 text-sm text-stone-700 outline-none focus:border-orange-400" placeholder="Add internal notes..."/><p className="mt-2 text-xs text-stone-400">Notes are for internal admin use only.</p></DetailSection>
     <DetailSection title="Cancel Order"><div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600"><XCircle size={18}/></span><div className="flex-1"><p className="text-sm font-semibold text-stone-800">Cancel this order</p><p className="mt-1 text-xs leading-5 text-stone-500">Cancel this order only if it should no longer proceed. This demo action updates local sample data only.</p><button type="button" onClick={() => updateOrderStatus("Cancelled")} className="mt-3 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50">Cancel Order</button></div></div></DetailSection>
   </div>
 </div>
 );

 case "Device Details":
 return (
 <div className="grid gap-5 xl:grid-cols-2">
 <DetailSection title="Device Information">
 <DetailRow label="Device Name" value={order.device} />
 <DetailRow label="Variant" value={order.variant} />
 <DetailRow label="IMEI Number" value={order.imei} />
 <DetailRow label="Device Condition" value={order.condition} />
 </DetailSection>
 <DetailSection title="Device Identification">
 <div className="flex items-center gap-4 rounded-xl bg-stone-50 p-4">
 <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white text-orange-500 shadow-sm">
 <Smartphone size={28} />
 </div>
 <div>
 <p className="font-semibold text-stone-900">{order.device}</p>
 <p className="mt-1 text-sm text-stone-500">{order.variant}</p>
 <p className="mt-2 text-xs text-stone-500">IMEI: {order.imei}</p>
 </div>
 </div>
 <div className="mt-4"><DetailRow label="Verification" value="Sample data - not verified" /></div>
 </DetailSection>
 </div>
 );

 case "Payments":
 return (
 <div className="grid gap-5 xl:grid-cols-2">
 <DetailSection title="Payment Summary">
 <DetailRow label="Order Amount" value={formatAmount(order.amount)} />
 <DetailRow label="Payment Status" value={order.paymentStatus} />
 <DetailRow label="Payment Method" value={order.paymentMethod} />
 <DetailRow label="Transaction Reference" value="Not available in sample data" />
 </DetailSection>
 <DetailSection title="Payment Processing">
 <div className="rounded-xl bg-stone-50 p-4">
 <div className="flex items-center gap-3">
 <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
 <Wallet size={22} />
 </div>
 <div>
 <p className="font-semibold text-stone-900">{formatAmount(order.amount)}</p>
 <p className="mt-1 text-sm text-stone-500">{order.paymentStatus}</p>
 </div>
 </div>
 </div>
 <p className="mt-4 text-xs leading-5 text-stone-500">
 This is a static preview. No real payment is initiated or processed.
 </p>
 </DetailSection>
 </div>
 );

 case "Inspection":
 return (
 <div className="grid gap-5 xl:grid-cols-2">
 <DetailSection title="Inspection Summary">
 <DetailRow label="Inspection Status" value={order.inspectionStatus} />
 <DetailRow label="Device Condition" value={order.condition} />
 <DetailRow label="Inspection Result" value={order.inspectionStatus === "Passed" ? "Passed" : "Awaiting completion"} />
 <DetailRow label="Inspector" value={order.agent} />
 </DetailSection>
 <DetailSection title="Inspection Checklist">
 {["Display and touch", "Battery health", "Camera and audio", "Buttons and connectivity", "Physical condition"].map((item, index) => (
 <div key={item} className="flex items-center justify-between gap-3 border-b border-stone-100 py-3 last:border-0">
 <span className="text-sm text-stone-600">{item}</span>
 {order.inspectionStatus === "Passed" ? (
 <CheckCircle2 size={18} className="text-emerald-600" />
 ) : (
 <span className="text-xs text-stone-400">{index === 0 && order.inspectionStatus === "In Progress" ? "In progress" : "Pending"}</span>
 )}
 </div>
 ))}
 </DetailSection>
 </div>
 );

 case "Documents":
 return (
 <DetailSection title="Order Documents">
 <div className="flex flex-col items-center py-10 text-center">
 <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
 <FileText size={28} />
 </div>
 <h3 className="mt-4 text-sm font-semibold text-stone-900">No documents attached</h3>
 <p className="mt-2 max-w-sm text-sm leading-6 text-stone-500">
 Invoices and verification documents can be displayed here when the document workflow is implemented.
 </p>
 </div>
 </DetailSection>
 );

 case "Timeline":
 return (
 <DetailSection title="Order Activity">
 <div className="space-y-0">
 {order.timeline.map((item, index) => (
 <div key={`${item.title}-${index}`} className="relative flex gap-4 pb-7 last:pb-0">
 {index !== order.timeline.length - 1 && (
 <span className="absolute left-[11px] top-7 h-full w-px bg-stone-200" />
 )}
 <div className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${item.completed ? "bg-emerald-100 text-emerald-600" : "bg-stone-100 text-stone-400"}`}>
 {item.completed ? <CheckCircle2 size={15} /> : <Clock3 size={15} />}
 </div>
 <div className="min-w-0 flex-1">
 <p className="text-sm font-semibold text-stone-900">{item.title}</p>
 <p className="mt-1 text-xs text-stone-500">{item.date}</p>
 </div>
 <span className={`text-xs font-medium ${item.completed ? "text-emerald-600" : "text-stone-400"}`}>
 {item.completed ? "Completed" : "Pending"}
 </span>
 </div>
 ))}
 </div>
 </DetailSection>
 );

 case "Inventory & Sales":
 return (
 <div className="grid gap-5 xl:grid-cols-2">
 <DetailSection title="Inventory Status">
 <DetailRow label="Inventory Record" value="Not created in sample data" />
 <DetailRow label="Listing Status" value="Not listed" />
 <DetailRow label="Sale Status" value="Not sold" />
 </DetailSection>
 <DetailSection title="Pricing">
 <DetailRow label="Customer Purchase Amount" value={formatAmount(order.amount)} />
 <DetailRow label="Listing Price" value="Not set" />
 <DetailRow label="Sale Price" value="Not sold" />
 </DetailSection>
 </div>
 );

 default:
 return null;
 }
 };

   if (selectedOrder) {
    return (
      <div className="space-y-4">
        <button type="button" onClick={() => setSelectedOrderId(null)} className="inline-flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-orange-600"><ArrowLeft size={16}/> Back to Orders</button>
        <div className="rounded-xl border border-stone-200 bg-white p-4 sm:p-5">
          <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
            <div><div className="flex flex-wrap items-center gap-2"><h1 className="text-xl font-bold text-stone-900">{selectedOrder.id}</h1><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Trade-in Order</span><StatusBadge status={selectedOrder.status}/></div><p className="mt-1.5 text-sm text-stone-500">Order details and fulfillment management</p></div>
            <div className="flex flex-wrap gap-2"><button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"><FileText size={15}/> Print</button><button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"><FileText size={15}/> Download Invoice</button></div>
          </div>
          <div className="mt-5 grid gap-4 border-t border-stone-100 pt-5 sm:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1fr_1fr]">
            <div className="flex items-center gap-3"><div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-500"><Smartphone size={32}/></div><div><p className="text-xs text-stone-500">Device</p><p className="mt-1 font-semibold text-stone-900">{selectedOrder.device}</p><p className="mt-1 text-xs text-stone-500">{selectedOrder.variant}</p></div></div>
            <div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600"><UserRound size={19}/></div><div><p className="text-xs text-stone-500">Customer</p><p className="mt-1 text-sm font-semibold text-stone-900">{selectedOrder.customer}</p><p className="mt-1 text-xs text-stone-500">{selectedOrder.phone}</p></div></div>
            <div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600"><Truck size={19}/></div><div><p className="text-xs text-stone-500">Assigned Agent</p><p className="mt-1 text-sm font-semibold text-stone-900">{selectedOrder.agent}</p><p className="mt-1 text-xs text-stone-500">Pickup: {selectedOrder.location}</p></div></div>
            <div><p className="text-xs text-stone-500">Order Date</p><p className="mt-1 text-sm font-semibold text-stone-900">{selectedOrder.date}</p><p className="mt-3 text-xs text-stone-500">Final Amount</p><p className="mt-1 text-xl font-bold text-stone-900">{formatAmount(selectedOrder.amount)}</p></div>
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white"><div className="flex min-w-max">{tabs.map(({ label, icon: Icon }) => <button type="button" key={label} onClick={() => setActiveTab(label)} className={`inline-flex items-center gap-2 border-b-2 px-4 py-3.5 text-sm font-medium transition ${activeTab === label ? "border-orange-500 bg-orange-50/40 text-orange-600" : "border-transparent text-stone-500 hover:bg-stone-50 hover:text-stone-900"}`}><Icon size={16}/>{label}</button>)}</div></div>
        {renderTabContent(selectedOrder)}
        {activeTab === "Overview" && <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-stone-200 bg-white/95 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] backdrop-blur lg:left-[240px] sm:px-6"><div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-3"><p className="hidden text-xs text-stone-500 sm:block">Changes are local to this static preview.</p><div className="ml-auto flex gap-2"><button type="button" onClick={() => updateOrderStatus("Cancelled")} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">Cancel Order</button><button type="button" onClick={() => window.alert("Changes saved in this static preview.")} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">Save Changes</button></div></div></div>}
      </div>
    );
  }


 return (
  <div className="space-y-2">
   {/* Summary cards */}
  

<div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
  {[
    { label: "Total Orders", value: "2,845", change: "↑ 12.5%", note: "from last month", icon: PackageCheck, box: "bg-purple-50 text-purple-500", positive: true },
    { label: "Pending", value: "54", change: "↑ 9.1%", note: "from last month", icon: Clock3, box: "bg-red-50 text-red-400", positive: true },
    { label: "In Progress", value: "54", change: "↑ 12.4%", note: "from last month", icon: Truck, box: "bg-amber-50 text-amber-500", positive: true },
    { label: "Completed", value: "328", change: "↓ 6.3%", note: "vs last week", icon: PackageCheck, box: "bg-green-50 text-green-600", positive: false },
    { label: "Cancelled", value: "11", change: "↑ 11.7%", note: "vs yesterday", icon: XCircle, box: "bg-red-50 text-red-500", positive: true },
  ].map(({ label, value, change, note, icon: Icon, box, positive }) => (
    <div
      key={label}
      className="flex h-[91px] min-w-0 items-center gap-4 rounded-lg border border-stone-200 bg-white px-6"
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${box}`}
      >
        <Icon size={24} strokeWidth={1.7} />
      </div>

      <div className="min-w-0">
        <p className="text-sm font-medium leading-5 text-stone-600">
          {label}
        </p>

        <p className="text-2xl font-semibold leading-7 text-stone-700">
          {value}
        </p>

        <p className="mt-0.5 whitespace-nowrap text-xs">
          <span className={positive ? "text-emerald-600" : "text-red-500"}>
            {change}
          </span>
          <span className="ml-1 text-stone-500">{note}</span>
        </p>
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
        {Object.keys(statusStyles).map((status) => (
          <option key={status} value={status}>
            {status}
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
            String(order.amount),
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
            className={`whitespace-nowrap px-4 text-xs font-bold tracking-wide text-stone-600 ${
              heading === "PRICE" || heading === "ACTION" ? "text-center" : ""
            }`}
          >
            {heading}
          </th>
        ))}
      </tr>
    </thead>

    <tbody className="divide-y divide-stone-100">
      {visibleOrders.map((order, index) => {
        const initials = order.customer
          .split(" ")
          .map((part) => part[0])
          .slice(0, 2)
          .join("")
          .toUpperCase();

        const displayStatus =
          order.status === "Completed" ? "Ready for stock" :
          order.status === "Scheduled" ? "Pickup Scheduled" :
          order.status === "Inspection" ? "Under Inspection" :
          order.status;

        const badgeColor =
          order.status === "Completed" ? "bg-emerald-50 text-emerald-600" :
          order.status === "Scheduled" ? "bg-blue-50 text-blue-600" :
          order.status === "Inspection" ? "bg-orange-50 text-orange-600" :
          order.status === "Cancelled" ? "bg-red-50 text-red-600" :
          order.status === "Picked Up" ? "bg-cyan-50 text-cyan-600" :
          "bg-orange-50 text-orange-600";

        const deviceImage =
          order.device.toLowerCase().includes("samsung")
            ? "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=100&h=150&fit=crop"
            : order.device.toLowerCase().includes("oneplus")
            ? "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=100&h=150&fit=crop"
            : order.device.toLowerCase().includes("xiaomi")
            ? "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=100&h=150&fit=crop"
            : order.device.toLowerCase().includes("google")
            ? "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=100&h=150&fit=crop"
            : "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=100&h=150&fit=crop";

        const invoiceNumber = order.id.match(/(\d+)$/)?.[1] ?? String(1089 - index);

        return (
          <tr key={order.id} className="h-[58px] transition-colors hover:bg-orange-50/30">
            <td className="px-4 py-2">
              <button type="button" onClick={() => openOrder(order)} className="text-left">
                <span className="block whitespace-nowrap text-sm font-semibold text-stone-700">
                  {order.id}
                </span>
                <span className="mt-1 block text-xs font-medium text-orange-600">
                  #INV-{invoiceNumber}
                </span>
              </button>
            </td>

            <td className="px-4 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-stone-600">
                  {initials}
                </span>
                <span className="truncate text-sm font-semibold text-stone-700">
                  {order.customer.toUpperCase()}
                </span>
              </div>
            </td>

            <td className="truncate px-4 py-2 text-sm font-medium text-stone-600">
              {order.agent === "Not assigned" ? "—" : order.agent.toUpperCase()}
            </td>

            <td className="px-4 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <img
                  src={deviceImage}
                  alt={order.device}
                  className="h-[42px] w-[32px] shrink-0 rounded-md border border-stone-200 bg-stone-100 object-cover"
                  loading="lazy"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-stone-700">
                    {order.device}
                  </p>
                  <p className="mt-1 text-xs text-orange-600">
                    {order.variant.split(" · ")[0]}
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
              {order.date.replace(" Oct ", "-")}
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

      {visibleOrders.length === 0 && (
        <tr>
          <td colSpan={8} className="py-10 text-center text-base text-stone-500">
            No orders found.
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>


    <div className="flex min-h-[37px] flex-wrap items-center justify-between gap-2 px-3 py-2">
     <p className="text-sm text-stone-500">Showing {filteredOrders.length === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredOrders.length)} of {filteredOrders.length} orders</p>
     <div className="flex items-center gap-1.5">
      <button type="button" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded border border-stone-200 p-1 text-stone-500 disabled:opacity-40" aria-label="Previous page"><ChevronLeft size={13} /></button>
      {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => <button key={pageNumber} type="button" onClick={() => setPage(pageNumber)} className={`h-7 min-w-7 rounded px-2 text-sm ${page === pageNumber ? "bg-orange-500 font-semibold text-white" : "border border-stone-200 text-stone-600 hover:bg-stone-50"}`}>{pageNumber}</button>)}
      <button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="rounded border border-stone-200 p-1 text-stone-500 disabled:opacity-40" aria-label="Next page"><ChevronRight size={13} /></button>
      <span className="ml-2 whitespace-nowrap text-xs text-stone-500">Rows per page</span><span className="rounded border border-stone-200 px-2 py-1 text-sm text-stone-600">{pageSize}</span>
     </div>
    </div>
   </section>
  </div>
 );
}
