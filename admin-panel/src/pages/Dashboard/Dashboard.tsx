import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getAdminDashboard } from "../../api/dashboard.api";

import {
 Activity,
 ArrowDownRight,
 ArrowRight,
 ArrowUpRight,
 Box,
 CalendarDays,
 CheckCircle2,
 ChevronDown,
 ChevronUp,
 Clock3,
 FileText,
 MapPin,
 Search,
 ShieldCheck,
 ShoppingBag,
 Truck,
 Users,
 Wallet,
 X,
} from "lucide-react";

type Order = {
 id: string;
 customer: string;
 phone: string;
 storage: string;
 status: string;
 agent: string;
 date: string;
 transitStatus: string;
 amount: string;
};

const payments = [
 { id: "PAY-2026-010", orderId: "PICK-2026-010", phone: "iPhone 15 Pro (256 GB)", amount: "58,500", status: "Pending approval", time: "40 min ago" },
 { id: "PAY-2026-009", orderId: "PICK-2026-009", phone: "iPhone 14 (128 GB)", amount: "45,200", status: "Pending approval", time: "30 min ago" },
 { id: "PAY-2026-008", orderId: "PICK-2026-007", phone: "Samsung S24 Ultra", amount: "35,100", status: "Pending approval", time: "20 min ago" },
 { id: "PAY-2026-006", orderId: "PICK-2026-002", phone: "Google Pixel 9 Pro", amount: "25,200", status: "Pending approval", time: "18 min ago" },
];

const stats = [
 { label: "Total Orders", value: "2,845", change: "+12.5%", description: "from last month", icon: ShoppingBag, color: "bg-purple-50 text-purple-600", positive: true },
 { label: "Active Agents", value: "24", change: "+9.1%", description: "from last month", icon: Users, color: "bg-rose-50 text-rose-600", positive: true },
 { label: "Pending Inspections", value: "54", change: "+12.4%", description: "from last month", icon: ShieldCheck, color: "bg-amber-50 text-amber-600", positive: true },
 { label: "Inventory (devices)", value: "328", change: "-6.3%", description: "vs last week", icon: Box, color: "bg-green-50 text-green-600", positive: false },
 { label: "Today's Pickups", value: "11", change: "+11.7%", description: "vs yesterday", icon: Truck, color: "bg-sky-50 text-sky-600", positive: true },
];

const pipeline = [
 { label: "New Orders", value: 124, change: "+10 today", color: "text-purple-600", icon: FileText },
 { label: "Scheduled", value: 89, change: "+8 today", color: "text-orange-500", icon: CalendarDays },
 { label: "Picked Up", value: 76, change: "+15 today", color: "text-blue-600", icon: Truck },
 { label: "In Transit", value: 10, change: "+2 today", color: "text-teal-600", icon: Truck },
 { label: "Inspected", value: 54, change: "+13 today", color: "text-amber-600", icon: Search },
 { label: "Ready Stock", value: 43, change: "+20 today", color: "text-green-600", icon: CheckCircle2 },
];

function SectionTitle({
 title,
 action,
 onAction,
}: {
 title: string;
 action?: string;
 onAction?: () => void;
}) {
 return (
 <div className="mb-4 flex items-center justify-between gap-3">
 <h2 className="text-lg font-bold text-stone-800">{title}</h2>
 {action && (
 <button
 type="button"
 onClick={onAction}
 className="text-sm font-semibold text-orange-600 hover:text-orange-700"
 >
 {action}
 </button>
 )}
 </div>
 );
}

function StatusBadge({ status }: { status: string }) {
 const normalized = status.toLowerCase();

 const color = normalized.includes("transit")
 ? "bg-blue-50 text-blue-700"
 : normalized.includes("delivered") || normalized.includes("ready")
 ? "bg-green-50 text-green-700"
 : normalized.includes("inspection")
 ? "bg-orange-50 text-orange-700"
 : normalized.includes("pending") || normalized.includes("scheduled")
 ? "bg-amber-50 text-amber-700"
 : "bg-stone-100 text-stone-600";

 return (
 <span className={`inline-flex whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium ${color}`}>
 {status}
 </span>
 );
}

function MiniBar({ value }: { value: number }) {
 return (
 <div className="h-2 w-14 overflow-hidden rounded-full bg-stone-100">
 <div
 className="h-full rounded-full bg-green-500"
 style={{ width: `${value}%` }}
 />
 </div>
 );
}

function MetricCard({
 label,
 value,
 change,
 description,
 icon: Icon,
 color,
 positive,
}: (typeof stats)[number]) {
 return (
 <section className="rounded-xl border border-stone-200 bg-white p-5 transition hover:shadow-md sm:p-6">
 <div className="flex items-center gap-3">
 <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${color}`}>
 <Icon size={29} strokeWidth={1.8} />
 </div>
 <div className="min-w-0">
 <p className="text-base font-medium text-stone-500">{label}</p>
 <p className="mt-1 text-3xl font-bold tracking-tight text-stone-900">{value}</p>
 </div>
 </div>
 <p className="mt-3 flex flex-wrap items-center gap-1 text-sm">
 {positive ? (
 <ArrowUpRight size={17} className="text-green-600" />
 ) : (
 <ArrowDownRight size={17} className="text-red-500" />
 )}
 <span className={positive ? "font-semibold text-green-600" : "font-semibold text-red-500"}>
 {change}
 </span>
 <span className="text-stone-400">{description}</span>
 </p>
 </section>
 );
}

function InspectionSummary() {
 const items = [
 { label: "Pending", value: 10, icon: CalendarDays, color: "text-amber-600 bg-amber-50" },
 { label: "Passed", value: 18, icon: CheckCircle2, color: "text-green-600 bg-green-50" },
 { label: "Failed", value: 3, icon: X, color: "text-red-600 bg-red-50" },
 { label: "In progress", value: 5, icon: Activity, color: "text-blue-600 bg-blue-50" },
 ];

 return (
 <section className="rounded-2xl border border-stone-200/80 bg-white p-6">
 <SectionTitle title="Inspection Summary" />
 <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 2xl:grid-cols-2">
 {items.map(({ label, value, icon: Icon, color }) => (
 <div key={label} className="rounded-lg bg-stone-50/70 p-3 text-center">
 <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
 <Icon size={24} />
 </div>
 <p className="text-2xl font-bold">{value}</p>
 <p className="mt-1 text-sm text-stone-500">{label}</p>
 </div>
 ))}
 </div>
 </section>
 );
}

export default function Dashboard() {

 const dashboardQuery = useQuery({
 queryKey: ["admin-dashboard"],
 queryFn: getAdminDashboard,
 staleTime: 30_000,
 refetchOnWindowFocus: true,
 });

 const dashboardData = dashboardQuery.data;
 const dashboardLoading = dashboardQuery.isLoading;
 const dashboardError = dashboardQuery.isError;

 const orders: Order[] = dashboardData?.recentOrders?.length
 ? dashboardData.recentOrders.map((order: any) => ({
 id: String(order.orderNumber ?? ""),
 customer: String(order.customer?.fullName ?? "Unknown"),
 phone: [
 order.device?.brand,
 order.device?.model,
 ]
 .filter(Boolean)
 .join(" ") || "Unknown device",
 storage: String(order.device?.storage ?? ""),
 status: String(
 order.status ?? order.inspection?.status ?? "Pending",
 ),
 agent: String(order.agent?.fullName ?? "Unassigned"),
 date: order.pickup?.scheduledDate
 ? new Date(order.pickup.scheduledDate).toLocaleDateString("en-IN")
 : "Not scheduled",
 transitStatus: String(
 order.status === "in_transit"
 ? "In Transit"
 : order.pickup?.status ?? "Not scheduled",
 ),
 amount: String(
 order.payment?.finalAmount ??
 order.payment?.estimatedAmount ??
 0,
 ),
 }))
 : [];
 const [search, setSearch] = useState("");
 const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
 const [showAllTransit, setShowAllTransit] = useState(false);
 const [showAllAgents, setShowAllAgents] = useState(false);
 const [agentPerformancePeriod, setAgentPerformancePeriod] =
 useState<"week" | "month" | "year" | "all">("week");

 const filteredOrders = useMemo(
 () =>
 orders.filter((order) =>
 `${order.id} ${order.customer} ${order.phone} ${order.agent}`
 .toLowerCase()
 .includes(search.toLowerCase()),
 ),
 [orders, search],
 );

 const transitOrders = orders.filter(
 (order) => order.transitStatus === "In Transit",
 );

 const openOrder = (orderId: string) => {
 const order = orders.find((item) => item.id === orderId);
 if (order) setSelectedOrder(order);
 };

 return (
 <div className="space-y-5 text-stone-800">
 {showAllTransit ? (
 <section className="rounded-xl border border-stone-200 bg-white p-5">
 <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
 <div>
 <h2 className="text-lg font-bold">Orders in Transit</h2>
 <p className="mt-1 text-sm text-stone-500">
 Review pickup and delivery progress for each order.
 </p>
 </div>
 <button
 type="button"
 onClick={() => setShowAllTransit(false)}
 className="rounded-lg border border-stone-200 px-4 py-2 text-sm hover:bg-stone-50"
 >
 Back to Dashboard
 </button>
 </div>

 <div className="space-y-3">
 {transitOrders.map((order) => (
 <button
 type="button"
 key={order.id}
 onClick={() => openOrder(order.id)}
 className="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-100 p-4 text-left transition hover:border-orange-200 hover:bg-orange-50/30"
 >
 <div className="flex items-center gap-3">
 <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
 <Truck size={26} />
 </div>
 <div>
 <p className="text-sm font-bold">{order.id}</p>
 <p className="mt-1 text-sm text-stone-500">
 {order.customer} · {order.phone}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-3">
 <div className="text-right">
 <p className="text-sm text-stone-400">Assigned agent</p>
 <p className="mt-1 text-base font-semibold">{order.agent}</p>
 </div>
 <StatusBadge status={order.transitStatus} />
 <ArrowRight size={18} className="text-stone-400" />
 </div>
 </button>
 ))}
 </div>
 </section>
 ) : (
 <>
 <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-5">
 {stats.map((stat) => {
 const apiValues: Record<string, number | undefined> = {
 "Total Orders": dashboardData?.overview.totalOrders,
 "Active Agents": dashboardData?.overview.activeAgents,
 "Pending Inspections": dashboardData?.overview.pendingInspections,
 "Inventory (devices)": dashboardData?.overview.inventoryDevices,
 "Today's Pickups": dashboardData?.overview.todayPickups,
 };

 const apiValue = apiValues[stat.label];

 return (
 <MetricCard
 key={stat.label}
 {...stat}
 value={
 dashboardLoading
 ? "..."
 : dashboardError
 ? "—"
 : apiValue !== undefined
 ? apiValue.toLocaleString("en-IN")
 : "0"
 }
 />
 );
 })}
 </section>

 <section className="rounded-2xl border border-stone-200/80 bg-white p-6">
 <SectionTitle
 title="Order Pipeline"
 action="View Transit Orders"
 onAction={() => setShowAllTransit(true)}
 />
 <div className="grid grid-cols-2 gap-y-7 sm:grid-cols-3 lg:grid-cols-6">
 {pipeline.map((item) => {
 const apiValues: Record<string, number | undefined> = {
 "New Orders": dashboardData?.orderPipeline.newOrders,
 Scheduled: dashboardData?.orderPipeline.scheduled,
 "Picked Up": dashboardData?.orderPipeline.pickedUp,
 Inspected: dashboardData?.orderPipeline.inspected,
 "In Transit": dashboardData?.orderPipeline.inTransit,
 "Ready Stock": dashboardData?.orderPipeline.readyStock,
 };

 const { label, change, color, icon: Icon } = item;
 const apiValue = apiValues[label];
 const value =
 dashboardLoading
 ? "..."
 : dashboardError
 ? "—"
 : apiValue !== undefined
 ? apiValue
 : 0;

 return (
 <button
 type="button"
 key={label}
 onClick={() => {
 if (label === "In Transit") setShowAllTransit(true);
 else setSearch("");
 }}
 className="group flex flex-col items-center rounded-lg p-3 text-center transition hover:bg-stone-50"
 >
 <div
 className={`flex h-16 w-16 items-center justify-center rounded-full bg-stone-50 transition group-hover:bg-orange-50 ${color}`}
 >
 <Icon size={32} strokeWidth={1.8} />
 </div>
 <p className="mt-3 text-sm text-stone-500">{label}</p>
 <p className="mt-1 text-3xl font-bold">{value}</p>
 <p className="mt-1.5 text-sm font-semibold text-green-600">
 {change}
 </p>
 </button>
 );
 })}
 </div>
 </section>

 <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(360px,1fr)]">
 {/* LEFT COLUMN */}
 <div className="space-y-5">
 <section className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white p-6">
 <SectionTitle
 title="Recent Orders"
 action="View All"
 onAction={() => setSearch("")}
 />

 <label className="mb-4 flex items-center gap-3 rounded-lg border border-stone-200 px-3 py-3">
 <Search size={20} className="text-stone-400" />
 <input
 value={search}
 onChange={(event) => setSearch(event.target.value)}
 placeholder="Search orders, customers or agents..."
 className="w-full bg-transparent text-base outline-none"
 />
 {search && (
 <button type="button" onClick={() => setSearch("")} aria-label="Clear search">
 <X size={17} />
 </button>
 )}
 </label>

 <div className="overflow-x-auto">
 <table className="w-full min-w-[680px] text-left">
 <thead>
 <tr className="border-b border-stone-100 text-xs uppercase tracking-wide text-stone-400">
 <th className="pb-3 pr-4">Order ID</th>
 <th className="pb-3 pr-4">Customer</th>
 <th className="pb-3 pr-4">Phone Model</th>
 <th className="pb-3 pr-4">Status</th>
 <th className="pb-3 pr-4">Agent</th>
 <th className="pb-3">Pickup Date</th>
 </tr>
 </thead>
 <tbody>
 {filteredOrders.slice(0, 4).map((order) => (
 <tr
 key={order.id}
 onClick={() => openOrder(order.id)}
 className="cursor-pointer border-b border-stone-50 transition hover:bg-orange-50/40"
 >
 <td className="py-4 pr-4 text-sm font-semibold text-orange-600">{order.id}</td>
 <td className="py-4 pr-4 text-base font-medium">{order.customer}</td>
 <td className="py-3 pr-4">
 <p className="whitespace-nowrap text-base font-medium">{order.phone}</p>
 <p className="mt-1 text-sm text-stone-400">{order.storage}</p>
 </td>
 <td className="py-3 pr-4"><StatusBadge status={order.status} /></td>
 <td className="py-4 pr-4 text-sm font-semibold text-stone-500">{order.agent}</td>
 <td className="whitespace-nowrap py-4 text-sm text-stone-500">{order.date}</td>
 </tr>
 ))}
 {filteredOrders.length === 0 && (
 <tr>
 <td colSpan={6} className="py-8 text-center text-base text-stone-400">
 No matching orders found.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 <p className="mt-3 text-sm text-stone-400"> Select a row to view details.</p>
 </section>

 <section className="rounded-2xl border border-stone-200/80 bg-white p-6">
 <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
 <h2 className="text-lg font-bold text-stone-800">Agent Performance</h2>
 <div className="flex flex-wrap items-center gap-2">
 <div className="relative">
 <select
 value={agentPerformancePeriod}
 onChange={(e) => setAgentPerformancePeriod(e.target.value as "week" | "month" | "year" | "all")}
 className="appearance-none rounded-lg border border-stone-200 bg-stone-50 py-2 pl-3 pr-9 text-sm font-medium text-stone-700 outline-none transition hover:border-orange-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
 >
 <option value="week">This week</option>
 <option value="month">This month</option>
 <option value="year">This year</option>
 <option value="all">All time</option>
 </select>
 <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-500" />
 </div>
 <button type="button" onClick={() => setShowAllAgents((prev) => !prev)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-orange-600 transition hover:bg-orange-50 hover:text-orange-700">
 {showAllAgents ? "Show Less" : "View All"}
 {showAllAgents ? <ChevronUp size={16} /> : <ArrowRight size={16} />}
 </button>
 </div>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full min-w-[420px] text-left">
 <thead>
 <tr className="text-xs uppercase text-stone-400">
 <th className="pb-3">Agent</th>
 <th className="pb-3">Assigned</th>
 <th className="pb-3">Completed</th>
 <th className="pb-3">Pending</th>
 <th className="pb-3">Success Rate</th>
 </tr>
 </thead>

 <tbody className="text-sm">
 {(dashboardData?.agentPerformance ?? [])
 .slice(0, showAllAgents ? undefined : 5)
 .map((agent) => {
 const assigned = agent.assignedOrders ?? 0;
 const completed = agent.completedOrders ?? 0;
 const pending = Math.max(assigned - completed, 0);

 const rate =
 assigned > 0
 ? Math.round((completed / assigned) * 100)
 : 0;

 return (
 <tr
 key={agent.agentId}
 className="border-t border-stone-100"
 >
 <td className="py-3 font-medium">
 {String(agent.fullName ?? agent.name ?? "Agent")}
 </td>

 <td className="py-3">{assigned}</td>
 <td className="py-3">{completed}</td>
 <td className="py-3">{pending}</td>

 <td className="py-3">
 <div className="flex items-center gap-2">
 <span>{rate}%</span>
 <MiniBar value={rate} />
 </div>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </section>

 {/* Moved here to use the previously empty left-side space */}
 <InspectionSummary />
 </div>

 {/* RIGHT COLUMN */}
 <div className="space-y-5">
 <section className="rounded-2xl border border-stone-200/80 bg-white p-6">
 <SectionTitle
 title="Pending Payments"
 action="View All"
 onAction={() => openOrder(payments[0].orderId)}
 />
 <div className="space-y-3">
 {payments.map((payment) => (
 <button
 type="button"
 key={payment.id}
 onClick={() => openOrder(payment.orderId)}
 className="flex w-full items-start justify-between gap-3 rounded-lg border-b border-stone-100 pb-3 text-left last:border-0 last:pb-0 hover:bg-orange-50/40"
 >
 <div className="min-w-0">
 <p className="text-xs font-semibold text-orange-600">{payment.orderId}</p>
 <p className="mt-1 truncate text-sm font-medium">{payment.phone}</p>
 <p className="mt-1 text-sm text-stone-400">
 <Clock3 size={14} className="mr-1 inline" />
 {payment.time}
 </p>
 <p className="mt-1 text-xs text-amber-600">{payment.status}</p>
 </div>
 <div className="shrink-0 text-right">
 <p className="text-sm text-stone-400">Amount</p>
 <p className="mt-1 text-sm font-bold">{payment.amount}</p>
 <ArrowRight size={17} className="ml-auto mt-2 text-stone-400" />
 </div>
 </button>
 ))}
 </div>
 <button
 type="button"
 onClick={() => openOrder(payments[0].orderId)}
 className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-orange-200 bg-orange-50/50 py-3 text-sm font-semibold text-orange-600 transition hover:bg-orange-50"
 >
 <Wallet size={18} />
 View Payment Notifications
 </button>
 </section>

 <section className="rounded-2xl border border-stone-200/80 bg-white p-6">
 <SectionTitle
 title="Transit Status"
 action="View All"
 onAction={() => setShowAllTransit(true)}
 />
 {transitOrders.length > 0 ? (
 transitOrders.map((order) => (
 <button
 type="button"
 key={order.id}
 onClick={() => openOrder(order.id)}
 className="mb-3 flex w-full items-start gap-3 rounded-lg border border-stone-100 p-3 text-left transition hover:border-blue-200 hover:bg-blue-50/40"
 >
 <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
 <Truck size={25} />
 </div>
 <div className="min-w-0 flex-1">
 <p className="text-sm font-bold">{order.id}</p>
 <p className="mt-1 text-sm text-stone-500">{order.customer} · {order.agent}</p>
 <div className="mt-2"><StatusBadge status={order.transitStatus} /></div>
 </div>
 <ArrowRight size={18} className="mt-1 text-stone-400" />
 </button>
 ))
 ) : (
 <p className="text-base text-stone-500">No orders currently in transit.</p>
 )}
 <p className="mt-3 text-sm text-stone-400">Transit status is based on the latest order pickup data.</p>
 </section>

 <section className="rounded-2xl border border-stone-200/80 bg-white p-6">
 <SectionTitle title="Pickup Management (Today)" />
 <div className="flex flex-wrap items-center gap-5">
 <div
 className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full"
 style={{
 background: "conic-gradient(#58b368 0% 48%, #7796ff 48% 80%, #fbbf24 80% 100%)",
 }}
 >
 <div className="flex h-[82px] w-[82px] flex-col items-center justify-center rounded-full bg-white">
 <span className="text-3xl font-bold">25</span>
 <span className="text-sm text-stone-400">Total</span>
 </div>
 </div>
 <div className="min-w-0 flex-1 space-y-3 text-sm">
 <p className="flex items-center gap-2">
 <span className="h-3 w-3 rounded-sm bg-green-500" />
 Completed <span className="ml-auto font-semibold">12 (48%)</span>
 </p>
 <p className="flex items-center gap-2">
 <span className="h-3 w-3 rounded-sm bg-blue-500" />
 In progress <span className="ml-auto font-semibold">8 (32%)</span>
 </p>
 <p className="flex items-center gap-2">
 <span className="h-3 w-3 rounded-sm bg-amber-400" />
 Pending <span className="ml-auto font-semibold">5 (20%)</span>
 </p>
 </div>
 </div>
 </section>

 <section className="rounded-2xl border border-stone-200/80 bg-white p-6">
 <SectionTitle title="Inventory Overview" />
 <div className="flex flex-wrap items-center gap-5">
 <div
 className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full"
 style={{
 background: "conic-gradient(#51bb7b 0% 35%, #45a2f5 35% 60%, #a68af7 60% 78%, #ffad68 78% 100%)",
 }}
 >
 <div className="flex h-[86px] w-[86px] flex-col items-center justify-center rounded-full bg-white">
 <span className="text-2xl font-bold">328</span>
 <span className="text-sm text-stone-400">Devices</span>
 </div>
 </div>
 <div className="min-w-0 flex-1 space-y-3 text-sm">
 {[
 ["iPhone", "112 (34%)", "bg-green-500"],
 ["Samsung", "98 (30%)", "bg-blue-500"],
 ["OnePlus", "54 (16%)", "bg-purple-500"],
 ["Google Pixel", "21 (6%)", "bg-orange-400"],
 ["Other", "43 (14%)", "bg-pink-400"],
 ].map(([name, value, color]) => (
 <div key={name} className="flex items-center gap-2">
 <span className={`h-3 w-3 shrink-0 rounded-sm ${color}`} />
 <span className="min-w-0 flex-1 truncate text-stone-600">{name}</span>
 <span className="shrink-0 text-xs text-stone-500">{value}</span>
 </div>
 ))}
 </div>
 </div>
 </section>
 </div>
 </div>
 </>
 )}

 {selectedOrder && (
 <div
 className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
 onClick={() => setSelectedOrder(null)}
 >
 <section
 role="dialog"
 aria-modal="true"
 aria-labelledby="order-detail-title"
 className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
 onClick={(event) => event.stopPropagation()}
 >
 <div className="mb-5 flex items-start justify-between gap-3">
 <div>
 <p className="text-sm font-medium text-orange-600">Order Details</p>
 <h2 id="order-detail-title" className="mt-1 text-xl font-bold">{selectedOrder.id}</h2>
 </div>
 <button
 type="button"
 onClick={() => setSelectedOrder(null)}
 aria-label="Close order details"
 className="rounded-lg p-2 text-stone-500 hover:bg-stone-100"
 >
 <X size={20} />
 </button>
 </div>

 <div className="mb-5 rounded-xl border border-stone-100 bg-stone-50 p-4">
 <div className="flex items-center justify-between gap-3">
 <span className="text-sm text-stone-500">Current order status</span>
 <StatusBadge status={selectedOrder.status} />
 </div>
 <div className="mt-3 flex items-center justify-between gap-3">
 <span className="text-sm text-stone-500">Transit status</span>
 <StatusBadge status={selectedOrder.transitStatus} />
 </div>
 </div>

 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
 <div>
 <p className="text-sm text-stone-400">Customer</p>
 <p className="mt-1 text-base font-semibold">{selectedOrder.customer}</p>
 </div>
 <div>
 <p className="text-sm text-stone-400">Device</p>
 <p className="mt-1 text-base font-semibold">{selectedOrder.phone}</p>
 <p className="text-sm text-stone-500">{selectedOrder.storage}</p>
 </div>
 <div>
 <p className="text-sm text-stone-400">Assigned Agent</p>
 <p className="mt-1 text-base font-semibold">{selectedOrder.agent}</p>
 </div>
 <div>
 <p className="text-sm text-stone-400">Pickup Date</p>
 <p className="mt-1 text-base font-semibold">{selectedOrder.date}</p>
 </div>
 <div>
 <p className="text-sm text-stone-400">Order Amount</p>
 <p className="mt-1 text-base font-bold">{selectedOrder.amount}</p>
 </div>
 </div>

 <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/60 p-4">
 <div className="flex items-start gap-3">
 <MapPin size={22} className="mt-0.5 shrink-0 text-blue-600" />
 <div>
 <p className="text-sm font-semibold text-blue-900">Pickup and Transit</p>
 <p className="mt-1 text-sm leading-5 text-blue-800">{selectedOrder.transitStatus}</p>
 <p className="mt-1 text-xs text-blue-700">
 Live location and timestamp updates require backend integration.
 </p>
 </div>
 </div>
 </div>

 <button
 type="button"
 onClick={() => setSelectedOrder(null)}
 className="mt-6 w-full rounded-xl bg-orange-500 px-4 py-3 text-base font-semibold text-white transition hover:bg-orange-600"
 >
 Close Details
 </button>
 </section>
 </div>
 )}
 </div>
 );
}