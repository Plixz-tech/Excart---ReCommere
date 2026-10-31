import { useMemo, useState } from "react";
import type { ElementType } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Package,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
  Truck,
  Users,
  X,
} from "lucide-react";
import {
  getAdminDashboard,
  type DashboardData,
} from "../../api/dashboard.api";

type DashboardInventoryBrand = { brand?: string; count?: number };
type DashboardInventoryBucket = {
  count?: number;
  purchaseAmount?: number;
  listedAmount?: number;
  soldAmount?: number;
};
type DashboardViewData = Omit<DashboardData, "inventory"> & {
  inventory?: {
    in_inventory?: DashboardInventoryBucket;
    listed?: DashboardInventoryBucket;
    sold?: DashboardInventoryBucket;
    removed?: DashboardInventoryBucket;
  };
  inventoryBrands?: DashboardInventoryBrand[];
  orderTrend?: { year?: number; month?: number; label?: string; count?: number }[];
};

const number = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value)
    ? value.toLocaleString("en-IN")
    : "—";

const money = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value)
    ? `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
    : "—";

const titleCase = (value: unknown) =>
  String(value ?? "Not available")
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const dateLabel = (value?: string | Date) => {
  if (!value) return "Not scheduled";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not scheduled"
    : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const timeAgo = (value?: string | Date) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const minutes = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / 1440)}d ago`;
};

const statusTone = (status: string) => {
  const value = status.toLowerCase();
  if (value.includes("complete") || value.includes("ready") || value.includes("approved")) return "bg-emerald-50 text-emerald-700";
  if (value.includes("transit") || value.includes("picked")) return "bg-sky-50 text-sky-700";
  if (value.includes("reject") || value.includes("cancel") || value.includes("fail")) return "bg-rose-50 text-rose-700";
  if (value.includes("pending") || value.includes("scheduled") || value.includes("inspection")) return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-600";
};

function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_10px_rgba(15,23,42,0.025)] ${className}`}>
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-slate-800">{title}</h2>
          {subtitle && <p className="mt-1 text-[12px] leading-4 text-slate-400">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function DonutChart({
  items,
  total,
  centerLabel,
  centerValue,
  size = 174,
}: {
  items: { label: string; value: number; color: string }[];
  total: number;
  centerLabel: string;
  centerValue?: string;
  size?: number;
}) {
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const valid = items.filter((item) => item.value > 0 && Number.isFinite(item.value));
  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 160 160" className="h-full w-full -rotate-90" role="img" aria-label={`${centerLabel} distribution`}>
          <circle cx="80" cy="80" r={radius} fill="none" stroke="#eef2f7" strokeWidth="18" />
          {total > 0 && valid.map((item) => {
            const length = (item.value / total) * circumference;
            const currentOffset = offset;
            offset += length;
            return (
              <circle
                key={item.label}
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth="18"
                strokeDasharray={`${Math.max(length - 2, 0)} ${circumference}`}
                strokeDashoffset={-currentOffset}
                strokeLinecap="round"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[26px] font-semibold tracking-tight text-slate-900">{centerValue ?? number(total)}</span>
          <span className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">{centerLabel}</span>
        </div>
      </div>
      <div className="mt-4 grid w-full grid-cols-2 gap-x-3 gap-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex min-w-0 items-center gap-2 text-[12px]">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="min-w-0 flex-1 truncate text-slate-500">{item.label}</span>
            <span className="font-semibold tabular-nums text-slate-700">{number(item.value)}</span>
          </div>
        ))}
        {items.length === 0 && <p className="col-span-2 text-center text-[13px] text-slate-400">No data available</p>}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
  accent,
  comparison,
  helper,
}: {
  label: string;
  value: string;
  icon: ElementType;
  accent: string;
  comparison?: number | null;
  helper?: string;
}) {
  const positive = comparison != null && comparison >= 0;
  return (
    <div className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_2px_10px_rgba(15,23,42,0.025)] transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] font-semibold uppercase tracking-[0.09em] text-slate-400">{label}</p>
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent}`}><Icon size={17} strokeWidth={1.8} /></span>
      </div>
      <p className="mt-3 text-[28px] font-semibold leading-none tracking-[-0.04em] text-slate-900">{value}</p>
      <div className="mt-3 flex min-h-4 items-center gap-1.5 text-[11px]">
        {comparison != null ? (
          <>
            {positive ? <ArrowUpRight size={13} className="text-emerald-600" /> : <ArrowDownRight size={13} className="text-rose-600" />}
            <span className={positive ? "font-semibold text-emerald-700" : "font-semibold text-rose-700"}>{comparison > 0 ? "+" : ""}{comparison.toFixed(1)}%</span>
            <span className="text-slate-400">vs previous period</span>
          </>
        ) : <span className="text-slate-400">{helper ?? "Current total"}</span>}
      </div>
    </div>
  );
}

function HorizontalBars({ items }: { items: { label: string; value: number; color?: string }[] }) {
  const max = Math.max(...items.map((item) => item.value), 1);
  if (!items.length) return <p className="py-8 text-center text-[13px] text-slate-400">No performance data available</p>;
  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between gap-3 text-[12px]">
            <span className="truncate font-medium text-slate-600">{item.label}</span>
            <span className="font-semibold tabular-nums text-slate-800">{number(item.value)}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className={`h-full rounded-full ${item.color ?? "bg-orange-500"} transition-all duration-500`} style={{ width: `${Math.max((item.value / max) * 100, item.value > 0 ? 2 : 0)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

type OrderRow = {
  id: string;
  customer: string;
  device: string;
  status: string;
  agent: string;
  pickupDate: string;
  amount: string;
  createdAt?: string;
};

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [paymentsOpen, setPaymentsOpen] = useState(false);

  const query = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: getAdminDashboard,
    staleTime: 20_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

  const data = query.data as DashboardViewData | undefined;
  const loading = query.isLoading;
  const failed = query.isError;

  const orders: OrderRow[] = useMemo(() => (data?.recentOrders ?? []).map((order: any) => ({
    id: String(order.orderNumber ?? order._id ?? order.id ?? "—"),
    customer: String(order.customer?.fullName ?? order.customer?.name ?? "Customer unavailable"),
    device: [order.device?.brand, order.device?.model, order.device?.storage].filter(Boolean).join(" ") || "Device unavailable",
    status: titleCase(order.status ?? "pending"),
    agent: String(order.agent?.fullName ?? order.agent?.name ?? "Unassigned"),
    pickupDate: dateLabel(order.pickup?.scheduledDate),
    amount: money(order.payment?.finalAmount ?? order.payment?.estimatedAmount),
    createdAt: order.createdAt,
  })), [data?.recentOrders]);

  const filteredOrders = useMemo(() => orders.filter((order) =>
    `${order.id} ${order.customer} ${order.device} ${order.agent}`.toLowerCase().includes(search.toLowerCase())
  ), [orders, search]);

  const pipeline = [
    { label: "New", value: data?.orderPipeline?.newOrders ?? 0, color: "#f97316" },
    { label: "Scheduled", value: data?.orderPipeline?.scheduled ?? 0, color: "#8b5cf6" },
    { label: "Picked up", value: data?.orderPipeline?.pickedUp ?? 0, color: "#0ea5e9" },
    { label: "In transit", value: data?.orderPipeline?.inTransit ?? 0, color: "#14b8a6" },
    { label: "Inspected", value: data?.orderPipeline?.inspected ?? 0, color: "#eab308" },
    { label: "Ready stock", value: data?.orderPipeline?.readyStock ?? 0, color: "#22c55e" },
  ];
  const pipelineTotal = pipeline.reduce((sum, item) => sum + item.value, 0);

  const inventory = data?.inventory;
  const inventoryStatuses = [
    { label: "In stock", value: inventory?.in_inventory?.count ?? 0, color: "#f97316" },
    { label: "Listed", value: inventory?.listed?.count ?? 0, color: "#3b82f6" },
    { label: "Sold", value: inventory?.sold?.count ?? 0, color: "#10b981" },
    { label: "Removed", value: inventory?.removed?.count ?? 0, color: "#a78bfa" },
  ];
  const inventoryStatusTotal = inventoryStatuses.reduce((sum, item) => sum + item.value, 0);

  const brandItems = (data?.inventoryBrands ?? []).map((brand: DashboardInventoryBrand, index: number) => ({
    label: brand.brand || "Unknown brand",
    value: Number(brand.count) || 0,
    color: ["#f97316", "#3b82f6", "#10b981", "#8b5cf6", "#eab308", "#ec4899", "#06b6d4", "#64748b"][index % 8],
  }));
  const brandTotal = brandItems.reduce((sum, item) => sum + item.value, 0);

  const payments = data?.payments;
  const pendingCount =
    typeof payments?.pendingPayments === "number" &&
    Number.isFinite(payments.pendingPayments)
      ? payments.pendingPayments
      : null;
  const pendingAmount = payments?.pendingPaymentAmount;
  const paymentRows = Array.isArray(data?.pendingPayments)
    ? data.pendingPayments
    : [];

  const inspection = data?.inspectionSummary;
  const inspectionItems = [
    { label: "Passed", value: inspection?.passed ?? 0, color: "#10b981" },
    { label: "Failed", value: inspection?.failed ?? 0, color: "#f43f5e" },
    { label: "Pending", value: inspection?.pending ?? 0, color: "#f59e0b" },
    { label: "In progress", value: inspection?.inProgress ?? 0, color: "#3b82f6" },
  ];
  const inspectionTotal = inspectionItems.reduce((sum, item) => sum + item.value, 0);

  const pickup = data?.pickupManagement;
  const pickupItems = [
    { label: "Completed", value: pickup?.completed ?? 0, color: "bg-emerald-500" },
    { label: "In progress", value: pickup?.inProgress ?? 0, color: "bg-sky-500" },
    { label: "Pending", value: pickup?.pending ?? 0, color: "bg-amber-400" },
  ];

  const agents = (data?.agentPerformance ?? [])
    .map((agent) => ({
      label: String(agent.fullName ?? agent.name ?? "Agent"),
      value: Number(agent.completedOrders ?? 0),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  const refresh = () => void query.refetch();

  return (
    <div className="min-h-full space-y-4 bg-transparent pb-2 text-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100 text-orange-600"><Activity size={17} /></span>
            <h1 className="text-[23px] font-semibold tracking-[-0.035em] text-slate-900">Business overview</h1>
          </div>
          <p className="mt-1 pl-10 text-[13px] text-slate-400">A live view of orders, inventory and operations</p>
        </div>
        <button type="button" onClick={refresh} disabled={query.isFetching} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] font-semibold text-slate-600 shadow-sm transition hover:border-orange-200 hover:text-orange-600 disabled:opacity-60">
          <RefreshCw size={14} className={query.isFetching ? "animate-spin" : ""} />
          {query.isFetching ? "Refreshing" : "Refresh"}
        </button>
      </div>

      {failed && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[13px] text-rose-700">
          <span>Dashboard information couldn't be loaded.</span>
          <button type="button" onClick={refresh} className="font-semibold underline underline-offset-2">Try again</button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setPaymentsOpen((open) => !open)}
        className="group flex w-full flex-wrap items-center justify-between gap-4 rounded-2xl border border-orange-200 bg-gradient-to-r from-orange-50 via-white to-amber-50 px-4 py-4 text-left shadow-[0_4px_18px_rgba(249,115,22,0.06)] transition hover:border-orange-300 sm:px-5"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white shadow-sm shadow-orange-200">
            <Bell size={19} />
            {pendingCount !== null && pendingCount > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[10px] font-bold text-white">{pendingCount !== null && pendingCount > 99 ? "99+" : pendingCount}</span>}
          </span>
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2 text-[14px] font-semibold text-slate-900">
              Payment approvals
              {pendingCount !== null && pendingCount > 0 && <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-700">Action required</span>}
            </span>
            <span className="mt-1 block text-[12px] text-slate-500">
              {loading
                ? "Checking payment queue…"
                : pendingCount === null
                  ? "Payment queue information is unavailable"
                  : pendingCount > 0
                    ? `${number(pendingCount)} payments are awaiting processing`
                    : "No payments are awaiting processing"}
            </span>
          </span>
        </div>
        <span className="ml-auto flex items-center gap-4">
          <span className="text-right">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">Pending amount</span>
            <span className="mt-0.5 block text-[20px] font-semibold tracking-tight text-slate-900">{loading ? "—" : money(pendingAmount)}</span>
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-orange-600 shadow-sm transition group-hover:translate-x-0.5"><ArrowRight size={16} /></span>
        </span>
      </button>

      {paymentsOpen && (
        <Panel title="Payments awaiting approval" subtitle={`${number(pendingCount)} pending payment(s) · ${money(pendingAmount)} total`}>
          {paymentRows.length ? (
            <div className="divide-y divide-slate-100">
              {paymentRows.map((payment: any, index: number) => (
                <div key={String(payment._id ?? payment.id ?? index)} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-slate-800">{payment.order?.orderNumber ?? payment.orderNumber ?? payment.orderId ?? `Payment ${index + 1}`}</p>
                    <p className="mt-1 truncate text-[12px] text-slate-500">{[payment.customer?.fullName, payment.device?.brand, payment.device?.model].filter(Boolean).join(" · ") || "Payment details"}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{timeAgo(payment.createdAt ?? payment.updatedAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[15px] font-semibold text-slate-900">{money(payment.amount ?? payment.finalAmount ?? payment.payment?.finalAmount ?? payment.payment?.estimatedAmount)}</p>
                    <span className={`mt-1 inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${statusTone(titleCase(payment.status ?? payment.paymentStatus ?? payment.payment?.status))}`}>{titleCase(payment.status ?? payment.paymentStatus ?? payment.payment?.status)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="py-5 text-center text-[13px] text-slate-400">There are no payment records to display.</p>}
          <p className="mt-4 border-t border-slate-100 pt-3 text-[11px] text-slate-400">Showing the latest payment records returned by the dashboard.</p>
        </Panel>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Total orders" value={loading ? "…" : number(data?.overview?.totalOrders)} icon={Smartphone} accent="bg-orange-50 text-orange-600" comparison={data?.comparisons?.totalOrders?.percentageChange} />
        <Metric label="Active agents" value={loading ? "…" : number(data?.overview?.activeAgents)} icon={Users} accent="bg-violet-50 text-violet-600" helper="Currently active" />
        <Metric label="In stock devices" value={loading ? "…" : number(data?.overview?.inventoryDevices)} icon={Package} accent="bg-sky-50 text-sky-600" helper="Inventory + listed" />
        <Metric label="Pending inspections" value={loading ? "…" : number(data?.overview?.pendingInspections)} icon={ShieldCheck} accent="bg-amber-50 text-amber-600" helper="Awaiting inspection" />
        <Metric label="Today's pickups" value={loading ? "…" : number(data?.overview?.todayPickups)} icon={Truck} accent="bg-emerald-50 text-emerald-600" comparison={data?.comparisons?.todayPickups?.percentageChange} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_1fr_1fr]">
        <Panel title="Order pipeline" subtitle="Orders grouped by their current stage">
          <DonutChart
            items={pipeline.map((item) => ({ label: item.label, value: item.value, color: item.color }))}
            total={pipelineTotal}
            centerLabel="Orders"
            centerValue={loading ? "…" : number(pipelineTotal)}
          />
        </Panel>
        <Panel title="Inventory by brand" subtitle="Device counts from active inventory records">
          <DonutChart
            items={brandItems}
            total={brandTotal}
            centerLabel="Devices"
            centerValue={loading ? "…" : number(brandTotal)}
          />
          {brandItems.length > 0 && <p className="mt-3 text-center text-[11px] text-slate-400">{number(brandItems.length)} brands represented</p>}
        </Panel>
        <Panel title="Inventory status" subtitle="Where each inventory device currently stands">
          <DonutChart
            items={inventoryStatuses.map((item) => ({ ...item, color: item.color }))}
            total={inventoryStatusTotal}
            centerLabel="Units"
            centerValue={loading ? "…" : number(inventoryStatusTotal)}
          />
          <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2.5">
            <div className="flex items-center justify-between text-[11px] text-slate-500">
              <span>Inventory purchase value</span>
              <span className="font-semibold text-slate-800">{money((inventory?.in_inventory?.purchaseAmount ?? 0) + (inventory?.listed?.purchaseAmount ?? 0))}</span>
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.45fr_1fr]">
        <Panel title="Recent orders" subtitle="The latest customer orders across ExCart" className="h-full" action={<Link to="/orders" className="text-[12px] font-semibold text-orange-600 hover:text-orange-700">View all</Link>}>
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2">
            <Search size={14} className="text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order, customer or device…" className="w-full bg-transparent text-[13px] text-slate-700 outline-none placeholder:text-slate-400" />
            {search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search"><X size={13} className="text-slate-400" /></button>}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left">
              <thead><tr className="border-b border-slate-100 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400"><th className="pb-3 pr-3">Order</th><th className="pb-3 pr-3">Customer / Device</th><th className="pb-3 pr-3">Status</th><th className="pb-3 pr-3">Agent</th><th className="pb-3">Pickup</th></tr></thead>
              <tbody>
                {filteredOrders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-3 pr-3 text-[12px] font-semibold text-orange-600">{order.id}</td>
                    <td className="py-3 pr-3"><p className="text-[12px] font-semibold text-slate-700">{order.customer}</p><p className="mt-0.5 text-[11px] text-slate-400">{order.device}</p></td>
                    <td className="py-3 pr-3"><span className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-medium ${statusTone(order.status)}`}>{order.status}</span></td>
                    <td className="py-3 pr-3 text-[11px] text-slate-500">{order.agent}</td>
                    <td className="whitespace-nowrap py-3 text-[11px] text-slate-500">{order.pickupDate}</td>
                  </tr>
                ))}
                {!filteredOrders.length && <tr><td colSpan={5} className="py-8 text-center text-[13px] text-slate-400">{loading ? "Loading orders…" : search ? "No matching orders found." : "No recent orders available."}</td></tr>}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Agent performance" subtitle="Top 10 agents by completed orders" className="h-full">
          <HorizontalBars items={agents.map((agent, index) => ({ ...agent, color: ["bg-orange-500", "bg-violet-500", "bg-sky-500", "bg-emerald-500", "bg-amber-500", "bg-cyan-500"][index] }))} />
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-400">
            <span>Top agents by completed orders</span>
            <span>{number(data?.agentPerformance?.length ?? 0)} agents</span>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-3">
        <Panel title="Inspection outcomes" subtitle="Quality checks across received devices" className="h-full">
          <DonutChart items={inspectionItems} total={inspectionTotal} centerLabel="Checks" centerValue={loading ? "…" : number(inspectionTotal)} size={150} />
        </Panel>
        <Panel title="Today's pickup progress" subtitle="Scheduled collections and completion" className="h-full">
          <div className="flex items-end justify-between gap-3">
            <div><p className="text-[31px] font-semibold tracking-tight text-slate-900">{loading ? "…" : number(pickup?.total ?? 0)}</p><p className="text-[11px] text-slate-400">Total scheduled pickups</p></div>
            <span className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700">{pickup?.total ? `${Math.round(((pickup.completed ?? 0) / pickup.total) * 100)}% completed` : "—"}</span>
          </div>
          <div className="mt-5 flex h-2.5 overflow-hidden rounded-full bg-slate-100">
            {pickupItems.map((item) => <div key={item.label} className={item.color} style={{ width: pickup?.total ? `${(item.value / pickup.total) * 100}%` : "0%" }} />)}
          </div>
          <div className="mt-5 space-y-3">
            {pickupItems.map((item) => <div key={item.label} className="flex items-center justify-between text-[12px]"><span className="flex items-center gap-2 text-slate-500"><span className={`h-2 w-2 rounded-full ${item.color}`} />{item.label}</span><span className="font-semibold tabular-nums text-slate-800">{number(item.value)}</span></div>)}
          </div>
        </Panel>
        <Panel title="Payment summary" subtitle="Payment values recorded by the backend" className="h-full">
          <div className="space-y-4">
            <div className="rounded-xl bg-emerald-50/80 p-3.5"><p className="text-[11px] font-medium text-emerald-700">Completed payment value</p><p className="mt-1 text-[23px] font-semibold tracking-tight text-emerald-900">{loading ? "…" : money(payments?.completedPaymentAmount)}</p><p className="mt-1 text-[11px] text-emerald-700/70">{number(payments?.completedPayments)} completed payments</p></div>
            <div className="rounded-xl bg-orange-50/80 p-3.5"><p className="text-[11px] font-medium text-orange-700">Pending payment value</p><p className="mt-1 text-[23px] font-semibold tracking-tight text-orange-900">{loading ? "…" : money(payments?.pendingPaymentAmount)}</p><p className="mt-1 text-[11px] text-orange-700/70">{number(payments?.pendingPayments)} awaiting processing</p></div>
          </div>
        </Panel>
      </div>

    </div>
  );
}
