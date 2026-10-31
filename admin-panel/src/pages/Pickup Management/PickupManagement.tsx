import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  MoreHorizontal,
  Package,
  Phone,
  RefreshCw,
  Search,
  Smartphone,
  Truck,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import { api } from "../../api/axios";

type AnyRecord = Record<string, any>;
type PickupStatus = "Scheduled" | "Agent Assigned" | "In Transit" | "Completed" | "Cancelled" | "Needs Assignment";
type PickupOrder = {
  id: string;
  orderNumber: string;
  rawStatus: string;
  customerName: string;
  customerPhone: string;
  address: string;
  deviceName: string;
  deviceMeta: string;
  agentName: string;
  agentId: string;
  agentCode: string;
  scheduledDate: string;
  scheduledTime: string;
  estimatedAmount: number | null;
  status: PickupStatus;
  raw: AnyRecord;
};

const PAGE_SIZE = 8;
const EMPTY_VALUE = "Not available";
const displayText = (value: unknown, fallback = EMPTY_VALUE): string => {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
};
const dateLabel = (value?: string) => {
  if (!value) return EMPTY_VALUE;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? EMPTY_VALUE
    : new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(date);
};
const dateInput = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
};
const getPickupStatus = (order: AnyRecord): PickupStatus => {
  const status = String(order.status || "").toLowerCase();
  const pickupStatus = String(order.pickup?.status || "").toLowerCase();
  if (["cancelled", "rejected"].includes(status) || pickupStatus === "cancelled") return "Cancelled";
  if (["completed", "ready_stock"].includes(status) || pickupStatus === "completed") return "Completed";
  if (["picked_up", "pickup_completed", "payment_pending", "payment_completed", "in_transit", "inspection_pending", "inspection_in_progress", "inspection_completed", "under_inspection", "approved", "ready_stock", "completed"].includes(status)) return "In Transit";
  const assignedAgent = order.agent ?? order.pickup?.assignedAgent ?? order.assignedAgent;
  const assignedAgentId = order.agentId ?? order.assignedAgentId ?? order.pickup?.assignedAgentId;
  const hasAssignedAgent = Boolean(
    (assignedAgent && (typeof assignedAgent === "string" || assignedAgent._id || assignedAgent.id || assignedAgent.fullName || assignedAgent.name)) ||
    assignedAgentId
  );
  if (status === "assigned" || hasAssignedAgent) return "Agent Assigned";
  if (["pending", "pickup_scheduled", ""].includes(status)) return "Scheduled";
  return "Scheduled";
};
const mapOrder = (order: AnyRecord): PickupOrder => {
  const customer = order.customer || {};
  const device = order.device || {};
  const agentValue = order.agent ?? order.pickup?.assignedAgent ?? order.assignedAgent ?? {};
  const agent = typeof agentValue === "object" && agentValue !== null ? agentValue : {};
  const rawAgentId = typeof agentValue === "string" ? agentValue : (agent._id || agent.id || order.agentId || order.assignedAgentId || order.pickup?.assignedAgentId || "");
  const address = order.pickup?.address || customer.address || {};
  const deviceName = [device.brand, device.model].filter(Boolean).join(" ") || displayText(device.name);
  const addressLine = [address.line1, address.line2, address.city, address.district, address.state, address.pinCode || address.pincode]
    .filter((part) => typeof part === "string" && part.trim())
    .join(", ");
  const amountValue = order.payment?.estimatedAmount ?? order.estimatedAmount ?? device.valuationPrice ?? device.estimatedPrice;
  const amount = amountValue === undefined || amountValue === null || amountValue === "" ? null : Number(amountValue);

  return {
    id: String(order._id || order.id || ""),
    orderNumber: displayText(order.orderNumber, String(order._id || order.id || EMPTY_VALUE)),
    rawStatus: String(order.status || "pending").toLowerCase(),
    customerName: displayText(customer.fullName || customer.name),
    customerPhone: displayText(customer.phone || customer.mobile),
    address: addressLine || displayText(typeof address === "string" ? address : ""),
    deviceName,
    deviceMeta: [device.storage, device.color, device.variant].filter(Boolean).join(" • ") || EMPTY_VALUE,
    agentName: displayText(agent.fullName || agent.name),
    agentId: String(rawAgentId || ""),
    agentCode: displayText(agent.agentProfile?.agentId || agent.agentId || agent.code),
    scheduledDate: order.pickup?.scheduledDate || order.pickupDate || "",
    scheduledTime: displayText(order.pickup?.scheduledTime || order.pickupTime),
    estimatedAmount: amount !== null && Number.isFinite(amount) ? amount : null,
    status: getPickupStatus(order),
    raw: order,
  };
};
const statusStyles: Record<PickupStatus, string> = {
  Scheduled: "text-violet-700",
  "Agent Assigned": "text-orange-700",
  "In Transit": "text-amber-700",
  Completed: "text-emerald-700",
  Cancelled: "text-rose-700",
  "Needs Assignment": "text-orange-700",
};
const tabs = ["All Pickups", "Scheduled", "In Transit", "Completed", "Cancelled"] as const;
type PickupTab = (typeof tabs)[number];

export default function PickupManagement() {
  const [orders, setOrders] = useState<PickupOrder[]>([]);
  const [agents, setAgents] = useState<AnyRecord[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [activeTab, setActiveTab] = useState<PickupTab>("All Pickups");
  const [search, setSearch] = useState("");
  const [agentFilter, setAgentFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [agentChoice, setAgentChoice] = useState("");
  const [statusChoice, setStatusChoice] = useState("pickup_scheduled");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [firstOrderResponse, agentResponse] = await Promise.all([
        api.get("/admin/orders", { params: { page: 1, limit: 100, sortBy: "createdAt", order: "desc" } }),
        api.get("/admin/agents", { params: { page: 1, limit: 100 } }).catch(() => null),
      ]);

      const extractRows = (responseData: AnyRecord) => {
        const payload = responseData?.data ?? responseData?.orders ?? responseData;
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.orders)) return payload.orders;
        if (Array.isArray(payload?.items)) return payload.items;
        return [];
      };

      const orderRows = extractRows(firstOrderResponse.data);
      const totalPages = Math.max(1, Number(firstOrderResponse.data?.pagination?.totalPages ?? firstOrderResponse.data?.data?.pagination?.totalPages) || 1);
      const allOrderRows = [...orderRows];

      for (let currentPage = 2; currentPage <= totalPages; currentPage += 1) {
        const response = await api.get("/admin/orders", {
          params: { page: currentPage, limit: 100, sortBy: "createdAt", order: "desc" },
        });
        allOrderRows.push(...extractRows(response.data));
      }

      const agentRows = extractRows(agentResponse?.data ?? {});
      setAgents(agentRows);
      const agentsById = new Map<string, AnyRecord>();
      agentRows.forEach((agent: AnyRecord) => {
        const id = String(agent?._id ?? agent?.id ?? "");
        if (id) agentsById.set(id, agent);
      });

      const mapped = allOrderRows.map((source: AnyRecord) => {
        const directAgent = source.agent ?? source.pickup?.assignedAgent ?? source.assignedAgent;
        const directAgentId = typeof directAgent === "string"
          ? directAgent
          : String(directAgent?._id ?? directAgent?.id ?? source.agentId ?? source.assignedAgentId ?? source.pickup?.assignedAgentId ?? "");
        const resolvedAgent = (directAgent && typeof directAgent === "object" ? directAgent : null)
          ?? agentsById.get(directAgentId)
          ?? (directAgentId ? { _id: directAgentId } : {});
        return mapOrder({ ...source, agent: resolvedAgent, agentId: directAgentId || source.agentId });
      }).filter((item: PickupOrder) => item.id);

      setOrders(mapped);
      setSelectedId((current) => current && mapped.some((order) => order.id === current) ? current : "");
    } catch (cause: any) {
      setError(cause?.response?.data?.message || "Unable to load pickup information. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => orders.filter((order) => {
    const matchesTab = activeTab === "All Pickups" || (activeTab === "Scheduled" ? ["Scheduled", "Agent Assigned", "Needs Assignment"].includes(order.status) : order.status === activeTab);
    const query = search.trim().toLowerCase();
    const searchable = [order.orderNumber, order.customerName, order.customerPhone, order.deviceName, order.agentName];
    const matchesSearch = !query || searchable.some((value) => value.toLowerCase().includes(query));
    const matchesAgent = agentFilter === "all" || order.agentId === agentFilter;
    const matchesDate = !dateFilter || dateInput(order.scheduledDate) === dateFilter;
    return matchesTab && matchesSearch && matchesAgent && matchesDate;
  }), [orders, activeTab, search, agentFilter, dateFilter]);

  const counts = useMemo(() => ({
    all: orders.length,
    scheduled: orders.filter((order) => order.status === "Scheduled" || order.status === "Agent Assigned" || order.status === "Needs Assignment").length,
    transit: orders.filter((order) => order.status === "In Transit").length,
    completed: orders.filter((order) => order.status === "Completed").length,
    cancelled: orders.filter((order) => order.status === "Cancelled").length,
  }), [orders]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageOrders = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const selected = orders.find((order) => order.id === selectedId);
  const firstItem = filtered.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const lastItem = Math.min(currentPage * PAGE_SIZE, filtered.length);

  useEffect(() => { setPage(1); }, [activeTab, search, agentFilter, dateFilter]);
  useEffect(() => {
    if (!showDetails && !showSchedule) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setShowDetails(false); setShowSchedule(false); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [showDetails, showSchedule]);

  const runAction = async (action: () => Promise<unknown>, successMessage: string) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(successMessage);
      setShowSchedule(false);
      setShowDetails(false);
      await load();
    } catch (cause: any) {
      setError(cause?.response?.data?.message || "The action could not be completed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const reassign = () => {
    if (!selected || !agentChoice) return;
    if (!["pending", "pickup_scheduled", "assigned"].includes(selected.rawStatus)) {
      setError("This pickup cannot be reassigned because it has progressed beyond the assignable stage.");
      return;
    }
    void runAction(() => api.patch(`/admin/orders/${selected.id}/assign`, { agentId: agentChoice }), "Pickup agent updated successfully.");
  };

  const reschedule = () => {
    if (!selected || !scheduleDate || !scheduleTime) return;
    if (new Date(`${scheduleDate}T${scheduleTime}:00`) <= new Date()) {
      setError("Choose a future pickup date and time.");
      return;
    }
    if (!["pending", "pickup_scheduled", "assigned"].includes(selected.rawStatus)) {
      setError("Only pickups that have not been collected can be rescheduled.");
      return;
    }
    void runAction(
      () => api.patch(`/admin/orders/${selected.id}`, { pickup: { scheduledDate: scheduleDate, scheduledTime: scheduleTime } }),
      "Pickup schedule updated successfully.",
    );
  };

  const updateStatus = () => {
    if (!selected) return;
    void runAction(() => api.patch(`/admin/orders/${selected.id}/status`, { status: statusChoice }), "Order status updated successfully.");
  };

  const openDetails = (order: PickupOrder) => {
    setSelectedId(order.id);
    setAgentChoice(order.agentId);
    setStatusChoice(order.rawStatus || "pickup_scheduled");
    setShowDetails(true);
    setError("");
  };

  const resetFilters = () => {
    setSearch("");
    setAgentFilter("all");
    setDateFilter("");
    setActiveTab("All Pickups");
    setPage(1);
  };

  return (
    <div className="excart-admin-page w-full space-y-5 pb-2 text-slate-800 [&_h1]:text-[22px] [&_h1]:leading-7 [&_h1]:font-semibold [&_h2]:text-base [&_h2]:leading-6 [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:leading-5 [&_h3]:font-semibold">
      {notice && <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><CheckCircle2 size={17} /><span>{notice}</span><button className="ml-auto" onClick={() => setNotice("")} aria-label="Dismiss notification"><X size={16} /></button></div>}
      {error && !showDetails && !showSchedule && <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><AlertCircle size={17} /><span>{error}</span><button className="ml-auto" onClick={() => setError("")} aria-label="Dismiss error"><X size={16} /></button></div>}

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        {[
          { label: "Total Pickups", value: counts.all.toLocaleString("en-IN"), note: "all pickups", icon: Truck, box: "bg-purple-50 text-purple-500" },
          { label: "Scheduled", value: counts.scheduled.toLocaleString("en-IN"), note: "awaiting collection", icon: Clock3, box: "bg-red-50 text-red-400" },
          { label: "In Transit", value: counts.transit.toLocaleString("en-IN"), note: "with agent", icon: Package, box: "bg-blue-50 text-blue-500" },
          { label: "Completed", value: counts.completed.toLocaleString("en-IN"), note: "completed pickups", icon: CheckCircle2, box: "bg-emerald-50 text-emerald-500" },
          { label: "Cancelled", value: counts.cancelled.toLocaleString("en-IN"), note: "cancelled pickups", icon: XCircle, box: "bg-red-50 text-red-500" },
        ].map(({ label, value, note, icon: Icon, box }) => (
          <div key={label} className="group relative flex min-h-[104px] min-w-0 items-center gap-3.5 overflow-hidden rounded-xl border border-slate-200/90 bg-white px-4 py-4 shadow-[0_2px_10px_rgba(15,23,42,0.035)] transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-[0_8px_22px_rgba(15,23,42,0.07)]">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${box} ring-1 ring-inset ring-black/[0.025]`}><Icon size={20} strokeWidth={1.8} /></div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] leading-4 text-slate-500">{label}</p>
              <p className="mt-0.5 text-[27px] font-semibold leading-8 tracking-tight text-slate-900 tabular-nums">{loading ? "—" : value}</p>
              <div className="mt-1 truncate text-[11px] leading-4 text-slate-400">{note}</div>
            </div>
          </div>
        ))}
      </div>

      <section className="w-full overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.045)]">
        <div className="flex gap-1 overflow-x-auto border-b border-slate-100 bg-slate-50/60 px-4 pt-3">
          {tabs.map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={`whitespace-nowrap border-b-2 px-3.5 py-3.5 text-[13px] font-semibold transition-colors ${activeTab === tab ? "border-orange-500 text-orange-600" : "border-transparent text-slate-500 hover:text-slate-900"}`}>
            {tab}{tab === "All Pickups" ? ` (${counts.all})` : tab === "Scheduled" ? ` (${counts.scheduled})` : tab === "In Transit" ? ` (${counts.transit})` : tab === "Completed" ? ` (${counts.completed})` : ` (${counts.cancelled})`}
          </button>)}
        </div>

        <div className="grid grid-cols-1 gap-2.5 border-b border-slate-100 bg-white p-4 md:grid-cols-[minmax(220px,1fr)_190px_170px_auto] md:gap-3">
          <div className="relative"><Search className="absolute left-3 top-1/2 -transtone-y-1/2 text-stone-400" size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order, customer, phone..." className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 py-2.5 pl-9 pr-3 text-[13px] text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100/70" /></div>
          <select value={agentFilter} onChange={(event) => setAgentFilter(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-[13px] font-medium text-slate-700 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100/70"><option value="all">All agents</option>{agents.map((agent) => <option key={String(agent._id || agent.id)} value={String(agent._id || agent.id)}>{agent.fullName || agent.name || agent.agentProfile?.agentId || "Agent"}</option>)}</select>
          <input aria-label="Filter by pickup date" type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-[13px] text-slate-600 outline-none transition focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100/70" />
          <button onClick={resetFilters} className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-600 transition hover:border-orange-200 hover:bg-orange-50/60 hover:text-orange-700">Reset</button>
        </div>

        {loading ? <div className="flex min-h-56 items-center justify-center gap-2 text-sm text-stone-500"><RefreshCw className="animate-spin" size={18} />Loading pickup data…</div> : error && orders.length === 0 ? <div className="px-5 py-12 text-center"><AlertCircle className="mx-auto mb-3 text-rose-500" size={28} /><p className="font-semibold text-stone-800">Pickup data is unavailable</p><p className="mt-1 text-sm text-stone-500">{error}</p><button onClick={() => void load()} className="mt-4 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600">Try again</button></div> : (
          <div className="w-full">
            <table className="w-full table-auto border-separate border-spacing-0 text-left">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-[0.11em] text-slate-500"><tr>
                {["Order / Date", "Customer", "Device", "Assigned Agent", "Pickup Schedule", "Status", ""].map((heading) => <th key={heading} className={`border-y border-slate-100 px-3 py-3.5 ${heading === "Order / Date" ? "pl-5 sm:pl-6" : ""}`}>{heading}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {pageOrders.map((order) => <tr key={order.id} onClick={() => openDetails(order)} className="cursor-pointer transition-colors hover:bg-orange-50/35">
                  <td className="border-b border-slate-100 px-3 py-4 pl-5 sm:pl-6"><p className="break-words text-[12px] font-bold tracking-tight text-orange-700">{order.orderNumber}</p><p className="mt-1 text-[11px] text-slate-400">Created {dateLabel(order.raw.createdAt)}</p></td>
                  <td className="border-b border-slate-100 px-3 py-4"><div className="flex min-w-0 items-center gap-2.5"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-bold text-slate-600 ring-1 ring-inset ring-slate-200">{order.customerName.split(" ").filter(Boolean).slice(0,2).map((part) => part[0]).join("").toUpperCase() || "U"}</span><div className="min-w-0"><p className="truncate text-[13px] font-semibold text-slate-800">{order.customerName}</p><p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500"><Phone size={10}/>{order.customerPhone}</p></div></div></td>
                  <td className="border-b border-slate-100 px-3 py-4"><div className="flex items-center gap-2"><span className="rounded-xl bg-slate-100 p-2.5 text-slate-500 ring-1 ring-inset ring-slate-200/70"><Smartphone size={16} /></span><div><p className="text-[13px] font-semibold text-slate-800">{order.deviceName}</p><p className="mt-0.5 text-[11px] text-slate-500">{order.deviceMeta}</p></div></div></td>
                  <td className="border-b border-slate-100 px-3 py-4"><div className="flex min-w-0 items-center gap-2.5"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${order.agentId ? "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-100" : "bg-slate-100 text-slate-400 ring-1 ring-inset ring-slate-200"}`}>{order.agentName.split(" ").filter(Boolean).slice(0,2).map((part) => part[0]).join("").toUpperCase() || "—"}</span><div className="min-w-0"><p className="truncate text-[13px] font-semibold text-slate-800">{order.agentName}</p><p className="mt-0.5 truncate text-[11px] font-medium text-slate-400">{order.agentCode}</p></div></div></td>
                  <td className="border-b border-slate-100 px-3 py-4"><p className="text-sm text-stone-700">{dateLabel(order.scheduledDate)}</p><p className="mt-1 text-xs text-stone-500">{order.scheduledTime}</p></td>
                  <td className="border-b border-slate-100 px-3 py-4"><span className={`inline-flex whitespace-nowrap items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${order.status === "Completed" ? "border-emerald-100 bg-emerald-50 text-emerald-700" : order.status === "Cancelled" ? "border-rose-100 bg-rose-50 text-rose-700" : order.status === "In Transit" ? "border-blue-100 bg-blue-50 text-blue-700" : order.status === "Agent Assigned" ? "border-orange-100 bg-orange-50 text-orange-700" : "border-violet-100 bg-violet-50 text-violet-700"}` }>{order.status}</span></td>
                  <td className="border-b border-slate-100 px-3 py-4"><button aria-label={`View ${order.orderNumber}`} onClick={(event) => { event.stopPropagation(); openDetails(order); }} className="rounded-lg p-2 text-slate-400 transition hover:bg-orange-50 hover:text-orange-600"><MoreHorizontal size={18} /></button></td>
                </tr>)}
                {!pageOrders.length && <tr><td colSpan={7} className="px-4 py-14 text-center"><div className="mx-auto mb-3 w-fit rounded-2xl bg-stone-100 p-3 text-stone-400"><Truck size={24} /></div><p className="font-semibold text-stone-800">No pickup data available</p><p className="mt-1 text-sm text-stone-500">No records match the selected filters.</p><button onClick={resetFilters} className="mt-3 text-sm font-semibold text-orange-600 hover:text-orange-700">Clear filters</button></td></tr>}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/40 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium text-slate-500">{filtered.length ? `Showing ${firstItem}–${lastItem} of ${filtered.length} pickups` : "No pickups to display"}</p>
          <div className="flex items-center gap-1 self-end sm:self-auto">
            <button aria-label="Previous page" disabled={currentPage <= 1 || loading} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border border-stone-200 p-2 text-stone-600 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={16} /></button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => <button key={pageNumber} onClick={() => setPage(pageNumber)} className={`min-w-9 rounded-lg border px-3 py-2 text-sm font-semibold ${currentPage === pageNumber ? "border-orange-500 bg-orange-500 text-white" : "border-stone-200 text-stone-600 hover:bg-stone-50"}`}>{pageNumber}</button>)}
            <button aria-label="Next page" disabled={currentPage >= totalPages || loading} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="rounded-lg border border-stone-200 p-2 text-stone-600 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight size={16} /></button>
            <button onClick={() => void load()} disabled={loading} aria-label="Refresh pickup data" className="ml-1 rounded-lg border border-stone-200 p-2 text-stone-600 hover:bg-stone-50 disabled:opacity-40"><RefreshCw size={15} /></button>
          </div>
        </div>
      </section>

      {showDetails && selected && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-stone-950/55 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowDetails(false); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="pickup-details-title" className="w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
          <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-4 sm:px-7">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <span className="mt-0.5 rounded-xl border border-orange-100 bg-orange-50 p-2.5 text-orange-600">
                  <Truck size={20} />
                </span>
                <div className="min-w-0">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-orange-600">Pickup management</p>
                    <span className={`text-[11px] font-semibold ${statusStyles[selected.status]}`}>{selected.status}</span>
                  </div>
                  <h2 id="pickup-details-title" className="break-words text-xl font-semibold tracking-tight text-stone-900 sm:text-2xl">{selected.orderNumber}</h2>
                  <p className="mt-1 text-sm text-stone-500">Pickup details <span className="px-1 text-stone-300">·</span> Created {dateLabel(selected.raw.createdAt)}</p>
                </div>
              </div>
              <button onClick={() => setShowDetails(false)} aria-label="Close pickup details" className="shrink-0 rounded-xl border border-stone-200 p-2 text-stone-500 transition-colors hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600">
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-7">
            <section className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-3"><span className="rounded-xl bg-white p-2.5 text-stone-600 shadow-sm"><UserRound size={19} /></span><div><h3 className="font-bold text-stone-900">Customer</h3><p className="text-xs text-stone-500">Contact and pickup address</p></div></div>
              <dl className="space-y-3 text-sm"><div><dt className="text-xs font-medium uppercase tracking-wide text-stone-400">Full name</dt><dd className="mt-1 break-words font-semibold text-stone-800">{selected.customerName}</dd></div><div><dt className="text-xs font-medium uppercase tracking-wide text-stone-400">Phone</dt><dd className="mt-1 flex items-center gap-2 font-medium text-stone-700"><Phone size={14} className="text-stone-400" />{selected.customerPhone}</dd></div><div><dt className="text-xs font-medium uppercase tracking-wide text-stone-400">Address</dt><dd className="mt-1 flex items-start gap-2 leading-5 text-stone-700"><MapPin size={14} className="mt-1 shrink-0 text-stone-400" />{selected.address}</dd></div></dl>
            </section>

            <section className="rounded-2xl border border-stone-200 bg-stone-50/70 p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-3"><span className="rounded-xl bg-white p-2.5 text-stone-600 shadow-sm"><Smartphone size={19} /></span><div><h3 className="font-bold text-stone-900">Device</h3><p className="text-xs text-stone-500">Device details and estimate</p></div></div>
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="break-words font-semibold text-stone-900">{selected.deviceName}</p><p className="mt-1 text-sm text-stone-500">{selected.deviceMeta}</p></div><div className="shrink-0 rounded-xl border border-orange-100 bg-orange-50 px-3 py-2 text-right"><p className="text-[10px] font-bold uppercase tracking-wide text-orange-600">Estimated value</p><p className="mt-1 text-lg font-semibold text-stone-900">{selected.estimatedAmount === null ? EMPTY_VALUE : `₹${selected.estimatedAmount.toLocaleString("en-IN")}`}</p></div></div>
              <div className="mt-4 border-t border-stone-200 pt-3"><p className="text-xs font-medium uppercase tracking-wide text-stone-400">Order status</p><p className="mt-1 font-semibold text-stone-800">{displayText(selected.raw.status, EMPTY_VALUE).replace(/_/g, " ")}</p></div>
            </section>

            <section className="rounded-2xl border border-stone-200 p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-3"><span className="rounded-xl bg-orange-50 p-2.5 text-orange-600"><CalendarDays size={19} /></span><div><h3 className="font-bold text-stone-900">Pickup schedule</h3><p className="text-xs text-stone-500">Collection appointment</p></div></div>
              <div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-stone-50 p-3"><p className="text-xs text-stone-500">Date</p><p className="mt-1 text-sm font-semibold text-stone-800">{dateLabel(selected.scheduledDate)}</p></div><div className="rounded-xl bg-stone-50 p-3"><p className="text-xs text-stone-500">Time</p><p className="mt-1 text-sm font-semibold text-stone-800">{selected.scheduledTime}</p></div></div>
              <div className="mt-4"><label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500">Assigned agent</label><div className="flex gap-2"><select value={agentChoice} onChange={(event) => setAgentChoice(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"><option value="">Select agent</option>{agents.map((agent) => <option key={String(agent._id || agent.id)} value={String(agent._id || agent.id)}>{agent.fullName || agent.name || agent.agentProfile?.agentId || "Agent"}</option>)}</select><button disabled={busy || !agentChoice || !["pending", "pickup_scheduled", "assigned"].includes(selected.rawStatus)} onClick={reassign} className="rounded-xl border border-orange-200 bg-orange-50 px-3 text-xs font-bold text-orange-700 transition-colors hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-40">Assign</button></div>{!["pending", "pickup_scheduled", "assigned"].includes(selected.rawStatus) && <p className="mt-2 text-xs text-stone-400">Reassignment is unavailable after pickup progresses.</p>}</div>
            </section>

            <section className="rounded-2xl border border-stone-200 p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-3"><span className="rounded-xl bg-blue-50 p-2.5 text-blue-600"><Clock3 size={19} /></span><div><h3 className="font-bold text-stone-900">Activity & status</h3><p className="text-xs text-stone-500">Recent order activity</p></div></div>
              {Array.isArray(selected.raw.timeline) && selected.raw.timeline.length > 0 ? <div className="space-y-2">{selected.raw.timeline.slice(-2).reverse().map((event: AnyRecord, index: number) => <div key={`${event.createdAt || index}`} className="flex items-start gap-2 rounded-xl bg-stone-50 p-3"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-orange-500" /><div className="min-w-0"><p className="text-sm font-semibold capitalize text-stone-800">{displayText(event.status, "Order update").replace(/_/g, " ")}</p><p className="mt-0.5 text-xs text-stone-500">{displayText(event.message, "No additional details")}</p></div></div>)}</div> : <p className="rounded-xl bg-stone-50 px-3 py-4 text-sm text-stone-500">No activity history available for this order.</p>}
              <label className="mb-1.5 mt-4 block text-xs font-semibold uppercase tracking-wide text-stone-500">Update order status</label><div className="flex gap-2"><select value={statusChoice} onChange={(event) => setStatusChoice(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-orange-400">{[["pickup_scheduled", "Pickup scheduled"], ["assigned", "Agent assigned"], ["picked_up", "Picked up"], ["cancelled", "Cancelled"]].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button onClick={updateStatus} disabled={busy || selected.rawStatus === statusChoice} className="rounded-xl bg-orange-500 px-3 py-2.5 text-xs font-bold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40">Update</button></div>
            </section>
          </div>
          {error && <div className="mx-5 mb-3 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700 sm:mx-7"><AlertCircle size={16} className="shrink-0" /><span>{error}</span></div>}
          <div className="flex flex-col-reverse gap-2 border-t border-stone-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7"><p className="text-xs text-stone-500">Fields without saved values display as “Not available”.</p><div className="flex flex-wrap justify-end gap-2"><button onClick={() => { setScheduleDate(dateInput(selected.scheduledDate)); setScheduleTime(""); setShowSchedule(true); }} disabled={busy || !["pending", "pickup_scheduled", "assigned"].includes(selected.rawStatus)} className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"><CalendarDays size={15} />Reschedule</button><button onClick={() => setShowDetails(false)} className="rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600">Done</button></div></div>
        </section>
      </div>}

      {showSchedule && selected && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-stone-950/55 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowSchedule(false); }}><section role="dialog" aria-modal="true" aria-labelledby="schedule-title" className="w-full max-w-md overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl"><div className="flex items-start justify-between border-b border-stone-100 bg-white px-5 py-4"><div className="flex items-start gap-3"><span className="rounded-xl border border-orange-100 bg-orange-50 p-2.5 text-orange-600"><CalendarDays size={19} /></span><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-orange-600">Pickup management</p><h2 id="schedule-title" className="mt-1 text-lg font-semibold text-stone-900">Reschedule pickup</h2><p className="mt-1 text-sm text-stone-500">{selected.orderNumber}</p></div></div><button onClick={() => setShowSchedule(false)} className="rounded-xl border border-stone-200 p-2 text-stone-500 hover:bg-orange-50 hover:text-orange-600" aria-label="Close schedule dialog"><X size={18} /></button></div><div className="space-y-4 p-5"><div><label className="mb-1.5 block text-sm font-semibold text-stone-700">Pickup date</label><input type="date" value={scheduleDate} min={dateInput(new Date().toISOString())} onChange={(event) => setScheduleDate(event.target.value)} className="w-full rounded-xl border border-stone-200 px-3 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" /></div><div><label className="mb-1.5 block text-sm font-semibold text-stone-700">Pickup time</label><input type="time" value={scheduleTime} onChange={(event) => setScheduleTime(event.target.value)} className="w-full rounded-xl border border-stone-200 px-3 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100" /></div>{error && <p className="text-sm text-rose-600">{error}</p>}</div><div className="flex justify-end gap-2 border-t border-stone-100 bg-white px-5 py-4"><button onClick={() => setShowSchedule(false)} className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-600">Back</button><button disabled={busy || !scheduleDate || !scheduleTime} onClick={reschedule} className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50">{busy ? "Saving…" : "Save schedule"}</button></div></section></div>}
    </div>
  );
}
