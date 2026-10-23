import { useMemo, useState } from "react";
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
    className = "",
}: {
    title: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <section className={`rounded-xl border border-stone-200 bg-white ${className}`}>
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
                    <div className="space-y-2">
                        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.35fr_0.95fr_1.1fr_0.9fr]">
                            <DetailSection title="Order Information">
                                <DetailRow label="Order ID" value={order.id} />
                                <DetailRow label="Invoice ID" value={`#INV-${order.id.match(/(\\d+)$/)?.[1] ?? ""}`} />
                                <DetailRow label="Created On" value={`${order.date} · 10:30 AM`} />
                                <DetailRow label="Pickup Address" value={order.location} />
                                <DetailRow label="User Address" value={order.location} />
                            </DetailSection>

                            <DetailSection title="Agent & Pickup Details">
                                <p className="mb-2 text-xs font-medium text-stone-500">Assigned Agent</p>
                                <div className="flex items-center gap-2 rounded-lg border border-stone-200 p-2.5">
                                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">
                                        {order.agent === "Not assigned" ? "—" : order.agent.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-stone-700">{order.agent}</p>
                                        <p className="text-xs text-stone-500">+91 98765 10000</p>
                                    </div>
                                    <ChevronRight size={15} className="text-stone-400" />
                                </div>
                                <div className="mt-4">
                                    <p className="mb-2 text-xs font-medium text-stone-500">Pickup Date</p>
                                    <div className="flex items-center justify-between rounded-lg border border-stone-200 px-3 py-2.5 text-sm text-stone-700">
                                        <span>{order.date}</span><History size={15} className="text-stone-400" />
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <p className="mb-2 text-xs font-medium text-stone-500">Pickup Time</p>
                                    <div className="flex items-center justify-between rounded-lg border border-stone-200 px-3 py-2.5 text-sm text-stone-700">
                                        <span>10:30 AM – 12:00 PM</span><Clock3 size={15} className="text-stone-400" />
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <p className="text-xs font-medium text-stone-500">Pickup Status</p>
                                    <div className="mt-2"><StatusBadge status={order.status} /></div>
                                </div>
                                <p className="mt-2 text-xs text-stone-500">On {order.date}, 11:00 AM</p>
                            </DetailSection>

                            <DetailSection title="Status & Progress">
                                <div className="space-y-4">
                                    {([
                                        ["Order Status", "Order Confirmed", true],
                                        ["Order Status", order.status, ["Picked Up", "Inspection", "Payment Pending", "Completed"].includes(order.status)],
                                        ["Payment Status", order.paymentStatus, order.paymentStatus === "Paid"],
                                        ["Inspection Status", order.inspectionStatus, order.inspectionStatus === "Passed"],
                                        ["Inventory Status", order.status === "Completed" ? "Confirmed" : "Not Confirmed", order.status === "Completed"],
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
                                                    ["Order Created", "Picked Up", "Payment Pending", "Inspection Pending", "Inventory"].reduce(
                                                        (lastDone, _step, index) => {
                                                            const done =
                                                                index === 0 ||
                                                                (index === 1 && ["Picked Up", "Inspection", "Payment Pending", "Completed"].includes(order.status)) ||
                                                                (index === 2 && order.paymentStatus === "Paid") ||
                                                                (index === 3 && order.inspectionStatus === "Passed") ||
                                                                (index === 4 && order.status === "Completed");
                                                            return done ? (index / 4) * 80 : lastDone;
                                                        },
                                                        0
                                                    )
                                                )}%`,
                                            }}
                                        />
                                        <div className="relative grid grid-cols-5">
                                            {["Order Created", "Picked Up", "Payment Pending", "Inspection Pending", "Inventory"].map((step, index) => {
                                                const done =
                                                    index === 0 ||
                                                    (index === 1 && ["Picked Up", "Inspection", "Payment Pending", "Completed"].includes(order.status)) ||
                                                    (index === 2 && order.paymentStatus === "Paid") ||
                                                    (index === 3 && order.inspectionStatus === "Passed") ||
                                                    (index === 4 && order.status === "Completed");

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
                                <div className="relative">
                                    {order.timeline.map((item, index) => {
                                        const activityDetails: Record<string, { description: string; category: string }> = {
                                            "Order created": {
                                                description: "The trade-in order was created and recorded in the system.",
                                                category: "Order",
                                            },
                                            "Pickup completed": {
                                                description: `Device pickup recorded for ${order.customer}.`,
                                                category: "Pickup",
                                            },
                                            "Pickup scheduled": {
                                                description: `Pickup arranged for ${order.location}.`,
                                                category: "Pickup",
                                            },
                                            "Inspection completed": {
                                                description: `Device inspection finished. Result: ${order.inspectionStatus}.`,
                                                category: "Inspection",
                                            },
                                            "Inspection in progress": {
                                                description: "Device checks are currently being carried out.",
                                                category: "Inspection",
                                            },
                                            "Inspection pending": {
                                                description: "The device is waiting for inspection to begin.",
                                                category: "Inspection",
                                            },
                                            "Payment completed": {
                                                description: `Payment status: ${order.paymentStatus}.`,
                                                category: "Payment",
                                            },
                                            "Payment pending": {
                                                description: "Payment is awaiting processing or confirmation.",
                                                category: "Payment",
                                            },
                                            "Agent assignment": {
                                                description: "An agent still needs to be assigned to this order.",
                                                category: "Assignment",
                                            },
                                            "Order cancelled": {
                                                description: "This order has been marked as cancelled.",
                                                category: "Order",
                                            },
                                        };

                                        const details = activityDetails[item.title] ?? {
                                            description: item.completed
                                                ? "This order activity has been recorded."
                                                : "This activity is waiting to be completed.",
                                            category: "Activity",
                                        };

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
                                                    <p className="mt-0.5 truncate text-[10px] leading-3 text-stone-500" title={details.description}>
                                                        {details.description}
                                                    </p>
                                                    <div className="mt-1 flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 border-t border-stone-100 pt-1">
                                                        <span className="text-[9px] font-medium text-stone-400">
                                                            {details.category}
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
                                <textarea defaultValue="Customer requested careful handling of the device during pickup." rows={4} maxLength={1000} className="w-full resize-y rounded-lg border border-stone-200 px-3 py-2.5 text-sm text-stone-700 outline-none focus:border-orange-400" placeholder="Write your notes here..." />
                                <p className="mt-2 text-xs text-blue-600">ⓘ These notes will not be visible to the user</p>
                            </DetailSection>
                            <DetailSection title="Cancel Order">
                                <p className="mb-3 text-xs text-stone-500">If you want to cancel this order, please select a reason and add comments.</p>
                                <label className="mb-2 block text-xs text-stone-500">Reason for cancellation<span className="text-red-500">*</span></label>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.5fr)]">
                                    <select defaultValue="" className="h-10 rounded-lg border border-stone-200 bg-white px-3 text-xs text-stone-600 outline-none focus:border-orange-400">
                                        <option value="" disabled>Select reason</option>
                                        <option>Customer requested cancellation</option>
                                        <option>Device not available</option>
                                        <option>Pickup failed</option>
                                        <option>Other</option>
                                    </select>
                                    <textarea rows={3} maxLength={1000} className="min-h-20 resize-y rounded-lg border border-stone-200 px-3 py-2.5 text-xs text-stone-600 outline-none focus:border-orange-400" placeholder="Provide more details (optional)..." />
                                </div>
                                <button type="button" onClick={() => updateOrderStatus("Cancelled")} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50">
                                    <XCircle size={15} /> Cancel Order
                                </button>
                            </DetailSection>
                        </div>
                    </div>
                );

            case "Device Details":
                return (
                    <div className="space-y-3">
                        <div className="grid grid-cols-1 items-start gap-3 xl:grid-cols-[minmax(245px,0.9fr)_minmax(0,2.1fr)]">
                            <div className="space-y-3">
                                {/* Device information */}
                                <DetailSection title="Device Information">
                                    <div className="space-y-0">
                                        {[
                                            ["Device Name", order.device],
                                            ["Storage", order.variant.split(" · ")[0] || "Not specified"],
                                            ["Color", order.variant.includes(" · ") ? order.variant.split(" · ").slice(1).join(" · ") : "Not specified"],
                                            ["IMEI", order.imei],
                                            ["Network", "5G"],
                                            ["SIM Slot", "Dual SIM (Nano + Nano)"],
                                            ["eSIM", "Not Supported"],
                                        ].map(([label, value]) => (
                                            <div key={label} className="flex items-start justify-between gap-3 border-b border-stone-100 py-2 last:border-b-0">
                                                <span className="shrink-0 text-xs text-stone-500">{label}</span>
                                                <span className="break-words text-right text-xs font-medium text-stone-800">{value}</span>
                                            </div>
                                        ))}
                                        <div className="flex items-center justify-between gap-3 border-b border-stone-100 py-2">
                                            <span className="text-xs text-stone-500">Purchase Bill</span>
                                            <button type="button" className="text-xs font-semibold text-blue-600 hover:underline" onClick={() => window.alert("Purchase bill is not attached in the sample data.")}>View Document</button>
                                        </div>
                                        <div className="flex items-center justify-between gap-3 py-2">
                                            <span className="text-xs text-stone-500">Warranty Status</span>
                                            <span className="rounded bg-orange-50 px-2 py-1 text-[10px] font-medium text-orange-600">Out of warranty</span>
                                        </div>
                                    </div>
                                </DetailSection>

                                {/* Quick inspection summary stays in the left column */}
                                <div className="flex flex-col justify-center gap-8 rounded-xl border border-stone-200 bg-white px-5 py-5">
                                    {(
                                        [
                                            ["Screen Condition", "Excellent", Smartphone],
                                            ["Display Issues", "No Issues", Monitor],
                                            ["Body Condition", order.condition, Smartphone],
                                            ["Battery Health", "Above 85%", BatteryCharging],
                                            ["Repair Status", "Original/Not repaired", Wrench],
                                        ] as Array<[string, string, typeof Smartphone]>
                                    ).map(([label, value, Icon]) => {
                                        const SummaryIcon = Icon;

                                        return (
                                            <div key={label as string} className="flex items-center gap-3">
                                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-orange-50 text-orange-500">
                                                    <SummaryIcon size={21} strokeWidth={2.1} />
                                                </span>
                                                <span className="min-w-0 flex-1 text-sm font-medium text-stone-600">
                                                    {label}
                                                </span>
                                                <span className="shrink-0 text-sm font-medium text-emerald-600">
                                                    {value as string}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Device images and inspection reports */}
                            <div className="space-y-3">
                                <DetailSection title="Device Images">
                                    <div className="mb-3 flex items-center justify-between gap-3">
                                        <p className="text-xs text-stone-500">Photos submitted for this device</p>
                                        <button type="button" onClick={() => window.alert("Device photos are not attached in the sample data.")} className="rounded-md border border-stone-200 px-2.5 py-1.5 text-[10px] font-semibold text-stone-600 transition hover:border-orange-300 hover:text-orange-600">View All (0)</button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                                        {["Front", "Back", "Left Side", "Right Side", "Ports"].map((view) => (
                                            <div key={view} className="flex min-w-0 flex-col items-center justify-center rounded-md border border-stone-200 bg-white p-2">
                                                <div className="flex h-[72px] w-full items-center justify-center rounded bg-stone-50 text-stone-400">
                                                    <Smartphone size={view.includes("Side") || view === "Ports" ? 25 : 38} strokeWidth={1.3} className={view.includes("Side") ? "rotate-90" : ""} />
                                                </div>
                                                <span className="mt-2 text-[10px] text-stone-500">{view}</span>
                                            </div>
                                        ))}
                                    </div>
                                </DetailSection>

                                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                    <DetailSection title="Functional Status (Reported by Agent)" className="min-h-[190px]">
                                        <div className="grid grid-cols-2 gap-x-4">
                                            {[
                                                ["Display", "Working"],
                                                ["Speaker", "Working"],
                                                ["Touch Screen", "Working"],
                                                ["Microphone", "Working"],
                                                ["Buttons", "Working"],
                                                ["Charging", "Working"],
                                                ["Camera (Front)", "Working"],
                                                ["Battery Health", "Above 85%"],
                                                ["Camera (Back)", "Working"],
                                                ["Face ID / Fingerprint", "Working"],
                                            ].map(([label, value]) => (
                                                <div key={label} className="flex min-w-0 items-start justify-between gap-2 border-b border-stone-100 py-1.5 last:border-b-0">
                                                    <span className="text-[10px] leading-4 text-stone-600">{label}</span>
                                                    <span className="shrink-0 text-[10px] font-medium text-emerald-600">{value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </DetailSection>

                                    <DetailSection title="Accessories (Reported)" className="min-h-[190px]">
                                        <div className="space-y-0">
                                            {[
                                                ["Original Box", "Yes"],
                                                ["Charger", "Yes"],
                                                ["Cable", "Yes"],
                                                ["Earphones", "No"],
                                                ["Other Accessories", "—"],
                                            ].map(([label, value]) => (
                                                <div key={label} className="flex items-center justify-between gap-3 border-b border-stone-100 py-1.5 last:border-b-0">
                                                    <span className="text-[10px] text-stone-600">{label}</span>
                                                    <span className={`text-[10px] font-medium ${value === "Yes" ? "text-stone-700" : "text-stone-500"}`}>{value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </DetailSection>
                                </div>

                                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                    <DetailSection title="Physical Condition (Reported by Agent)" className="min-h-[190px]">
                                        <div className="grid grid-cols-2 gap-x-4">
                                            {[
                                                ["Overall", order.condition],
                                                ["Display Condition", "Good"],
                                                ["Condition", order.condition],
                                                ["Scratches", "Minor"],
                                                ["Back Panel", "Good"],
                                                ["Dents", "Good"],
                                                ["Frame", "Good"],
                                            ].map(([label, value]) => (
                                                <div key={label} className="flex min-w-0 items-start justify-between gap-2 border-b border-stone-100 py-1.5 last:border-b-0">
                                                    <span className="text-[10px] leading-4 text-stone-600">{label}</span>
                                                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${value === "Minor" ? "bg-orange-50 text-orange-600" : "bg-emerald-50 text-emerald-600"}`}>{value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </DetailSection>

                                    <DetailSection title="Additional Notes (by Agent)" className="min-h-[190px]">
                                        <p className="text-xs leading-5 text-stone-600">Device overall in {order.condition.toLowerCase()} condition. Minor scratches may be present on the back panel.</p>
                                    </DetailSection>
                                </div>
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
                state: order.inspectionStatus === "Passed" ? "done" : "pending",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2.5 py-1.5"
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                    item.state === "done"
                      ? "bg-emerald-100 text-emerald-600"
                      : "border border-stone-300 text-stone-400"
                  }`}
                >
                  {item.state === "done" ? (
                    <CheckCircle2 size={12} />
                  ) : (
                    <span className="text-[10px]">−</span>
                  )}
                </span>
                <span
                  className={`text-xs ${
                    item.state === "done"
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
      <div className="flex min-w-0 flex-col gap-2">
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
                {formatAmount(order.amount + 2500)}
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
                className={`rounded-md px-3 py-1 text-xs font-semibold ${
                  order.paymentStatus === "Paid"
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
                return (
                    <div className="grid grid-cols-1 items-stretch gap-3 xl:grid-cols-[1.05fr_1.05fr_1.25fr]">
                        {/* Payment conditions */}
                        <DetailSection title="Payment Conditions" className="h-full">
                            <div className="flex min-h-[255px] flex-col items-center justify-center px-2 py-3 text-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                                    <CheckCircle2 size={34} strokeWidth={1.8} />
                                </div>
                                <p className="mt-4 max-w-[190px] text-[11px] leading-5 text-stone-500">
                                    Complete user payment to proceed with device inspection.
                                </p>
                                <div className="mt-5 w-full max-w-[190px] rounded-lg border border-stone-100 px-3 py-2.5 text-left">
                                    {[
                                        { label: "Offer Approved", done: true },
                                        { label: "Pickup Completed", done: true },
                                        { label: "Payment Pending", done: false },
                                        { label: "Inspection Pending", done: false },
                                    ].map((step) => (
                                        <div key={step.label} className="flex items-center gap-2 py-1.5">
                                            {step.done ? (
                                                <CheckCircle2 size={13} className="shrink-0 text-emerald-500" />
                                            ) : (
                                                <span className="h-[13px] w-[13px] shrink-0 rounded-full border border-stone-300" />
                                            )}
                                            <span className={`text-[10px] ${step.done ? "text-stone-600" : "text-stone-400"}`}>{step.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </DetailSection>

                        {/* Offer summary */}
                        <DetailSection title="Offer Summary" className="h-full">
                            <div className="space-y-0.5">
                                <div className="flex items-center justify-between gap-3 py-2">
                                    <span className="text-[11px] text-stone-500">Estimated Offer</span>
                                    <span className="text-[11px] font-medium text-stone-700">{formatAmount(order.amount + 2500)}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3 py-2">
                                    <span className="text-[11px] text-stone-500">Deductions</span>
                                    <span className="text-[11px] font-semibold text-red-500">-{formatAmount(2500)}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3 border-t border-stone-100 py-3">
                                    <span className="text-[11px] font-medium text-stone-600">Final Offer (Approved)</span>
                                    <span className="text-[12px] font-bold text-emerald-600">{formatAmount(order.amount)}</span>
                                </div>
                                <div className="flex items-center justify-between gap-3 py-2">
                                    <span className="text-[11px] text-stone-500">Customer Approval</span>
                                    <span className={`rounded px-2 py-1 text-[10px] font-semibold ${order.paymentStatus === "Paid" ? "bg-emerald-50 text-emerald-700" : "bg-emerald-50 text-emerald-700"}`}>
                                        Approved
                                    </span>
                                </div>
                            </div>
                            <div className="mt-5 rounded-lg bg-stone-50 px-3 py-3">
                                <p className="text-[10px] text-stone-500">Payment Status</p>
                                <p className={`mt-1 text-xs font-semibold ${order.paymentStatus === "Paid" ? "text-emerald-600" : "text-orange-600"}`}>
                                    {order.paymentStatus === "Paid" ? "Payment Completed" : order.paymentStatus === "Pending" ? "Payment Pending" : "Awaiting Payment"}
                                </p>
                            </div>
                        </DetailSection>

                        {/* Payment actions */}
                        <DetailSection title="Payment Actions" className="h-full">
                            <p className="mb-3 text-[10px] text-stone-500">Review details and initiate payment</p>
                            <div className="rounded-lg border border-stone-200 p-3">
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-2">
                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-100 text-[10px] font-bold text-stone-600">
                                            {order.customer.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="truncate text-[11px] font-semibold text-stone-800">{order.customer}</p>
                                            <span className="mt-0.5 inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700">
                                                <CheckCircle2 size={10} /> Verified Account
                                            </span>
                                        </div>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="text-[9px] text-stone-500">Amount to Pay</p>
                                        <p className="mt-0.5 text-sm font-bold text-orange-600">{formatAmount(order.amount)}</p>
                                    </div>
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-stone-100 pt-3">
                                    <div>
                                        <p className="text-[9px] text-stone-500">Bank Name</p>
                                        <p className="mt-1 text-[10px] font-medium text-stone-700">HDFC Bank</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-stone-500">Account Number</p>
                                        <p className="mt-1 text-[10px] font-medium text-stone-700">XXXXXX3214</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-stone-500">IFSC Code</p>
                                        <p className="mt-1 text-[10px] font-medium text-stone-700">HDFC0001234</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] text-stone-500">Account Type</p>
                                        <p className="mt-1 text-[10px] font-medium text-stone-700">Savings Account</p>
                                    </div>
                                </div>
                            </div>
                            <label className="mt-3 block text-[10px] font-medium text-stone-600" htmlFor="payment-account">Pay From Account</label>
                            <select id="payment-account" defaultValue="hdfc" className="mt-1.5 h-9 w-full rounded-md border border-stone-200 bg-white px-2.5 text-[10px] text-stone-700 outline-none focus:border-orange-400">
                                <option value="hdfc">HDFC Bank - A/c ending 3214</option>
                                <option value="icici">ICICI Bank - A/c ending 7821</option>
                            </select>
                            <label className="mt-3 block text-[10px] font-medium text-stone-600" htmlFor="payment-remarks">Remarks (Optional)</label>
                            <input id="payment-remarks" type="text" placeholder={`Payment for order ${order.id}`} className="mt-1.5 h-9 w-full rounded-md border border-stone-200 px-2.5 text-[10px] text-stone-700 outline-none placeholder:text-stone-400 focus:border-orange-400" />
                            <button
                                type="button"
                                disabled={order.paymentStatus === "Paid"}
                                onClick={() => window.alert("This is a sample UI. No real payment has been initiated.")}
                                className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-orange-500 px-3 text-[11px] font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-emerald-600"
                            >
                                <Wallet size={13} /> {order.paymentStatus === "Paid" ? "Payment Completed" : `Pay Now ${formatAmount(order.amount)}`}
                            </button>
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
            <div className="space-y-3 pb-10">
                {/* Keep the order controls, summary and tabs together while scrolling */}
                <div className="top-0 z-40 space-y-2 bg-stone-50 pb-1">
                    <div>
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedOrderId(null);
                                setActiveTab("Overview");
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
                                <span className="inline-flex items-center gap-1.5 rounded-md bg-orange-100 px-3 py-2 text-xs font-medium text-orange-600"><ClipboardCheck size={14} />{selectedOrder.inspectionStatus === "Passed" ? "Inspection Completed" : selectedOrder.inspectionStatus === "In Progress" ? "Inspection In Progress" : "Inspection Pending"}</span>
                                <span className="inline-flex items-center gap-1.5 rounded-md bg-orange-100 px-3 py-2 text-xs font-medium text-orange-600"><Wallet size={14} />{selectedOrder.paymentStatus === "Paid" ? "Payment Completed" : "Payment Pending"}</span>
                            </div>
                            <p className="mt-1 text-sm font-medium text-orange-600">#INV-{selectedOrder.id.match(/(\d+)$/)?.[1] ?? ""}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                            <button type="button" onClick={() => window.print()} className="inline-flex h-9 items-center gap-2 rounded-md border border-stone-200 bg-white px-3 text-sm font-medium text-stone-600 hover:bg-stone-50"><FileText size={15} /> Print</button>
                            <button type="button" onClick={() => window.print()} className="inline-flex h-9 items-center gap-2 rounded-md border border-stone-200 bg-white px-3 text-sm font-medium text-stone-600 hover:border-orange-300 hover:bg-orange-50"><FileText size={15} /> Download Invoice</button>
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
                                    <button type="button" onClick={() => setActiveTab("Overview")} className="mt-2 text-xs font-semibold text-blue-600 hover:underline">View User</button>
                                </div>
                            </div>
                            <div className="flex min-w-0 items-center gap-3 p-4">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-orange-700">{selectedOrder.agent === "Not assigned" ? "—" : selectedOrder.agent.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</div>
                                <div className="min-w-0">
                                    <p className="text-sm text-stone-500">Agent</p><p className="mt-1 truncate text-sm font-bold text-stone-700">{selectedOrder.agent}</p><p className="mt-1 truncate text-sm text-stone-600">{selectedOrder.location}</p>
                                    <button type="button" onClick={() => setActiveTab("Overview")} className="mt-2 text-xs font-semibold text-blue-600 hover:underline">View Agent</button>
                                </div>
                            </div>
                            <div className="p-4">
                                <p className="text-sm text-stone-500">Order Date</p><p className="mt-3 text-sm font-semibold text-stone-700">{selectedOrder.date}</p><p className="mt-1 text-sm text-stone-500">10:30 AM</p>
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
                                }}
                                className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    // Current order edits are held in local React state in this static preview.
                                    setSelectedOrderId(null);
                                    setActiveTab("Overview");
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
                                        className={`whitespace-nowrap px-4 text-xs font-bold tracking-wide text-stone-600 ${heading === "PRICE" || heading === "ACTION" ? "text-center" : ""
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
