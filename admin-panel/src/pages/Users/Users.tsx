import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Users as UsersIcon,
  UserRoundCheck,
  UserRoundX,
  UserPlus,
  Search,
  SlidersHorizontal,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CalendarDays,
  Phone,
  CheckCircle2,
  LoaderCircle,
  AlertCircle,
  MoreHorizontal,
  ArrowLeft,
  Wallet,
  Smartphone,
  CreditCard,
  Banknote,
  RefreshCw,
  X,
  Eye,
  ListOrdered,
  Clock3,
  FileText,
  Camera,
} from "lucide-react";
import { api } from "../../api/axios";

type UserStatus = "active" | "blocked" | "deleted";

interface UserRecord {
  _id: string;
  fullName?: string;
  email?: string;
  phone?: string;
  profileImage?: string;
  status?: UserStatus;
  isPhoneVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

type UserOrder = {
  _id?: string;
  orderNumber?: string;
  status?: string;
  createdAt?: string;
  device?: {
    brand?: string;
    model?: string;
    variant?: string;
    color?: string;
    storage?: string;
  };
  pickup?: {
    verification?: {
      customerPhoto?: { url?: string; fileName?: string; uploadedAt?: string };
      aadhaar?: { document?: { url?: string; fileName?: string; uploadedAt?: string }; xml?: { url?: string; fileName?: string; uploadedAt?: string } };
    };
  };
  payment?: {
    status?: string;
    estimatedAmount?: number;
    finalAmount?: number;
    paymentMethod?: string | null;
    transactionId?: string;
    paidAt?: string | null;
    payout?: { status?: string; amount?: number };
  };
};

interface UserDetailsResponse {
  success: boolean;
  message?: string;
  data?: {
    user?: UserRecord;
    stats?: {
      totalOrders?: number;
      completedOrders?: number;
      totalPaid?: number;
      paidOrders?: number;
    };
    orders?: UserOrder[];
    payoutAccount?: {
      type?: "bank" | "upi" | string;
      accountHolderName?: string;
      bankAccountNumber?: string;
      maskedBankAccountNumber?: string;
      bankIfsc?: string;
      upiId?: string;
      isVerified?: boolean;
      verifiedAt?: string | null;
      status?: string;
      cashfreeBeneficiaryStatus?: string;
    } | null;
  };
}

interface UsersApiResponse {
  success: boolean;
  message?: string;
  data?: {
    users?: UserRecord[];
    pagination?: {
      currentPage?: number;
      totalPages?: number;
      totalUsers?: number;
      limit?: number;
    };
  };
}

const PAGE_SIZE = 8;

const formatCurrency = (value?: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value) || 0);

const formatDate = (value?: string) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const getInitials = (name?: string) => {
  const cleanName = name?.trim();

  if (!cleanName) return "U";

  return cleanName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

const displayName = (user: UserRecord) =>
  user.fullName?.trim() || "Unnamed User";

const displayEmail = (user: UserRecord) =>
  user.email?.trim() || "—";

const displayPhone = (user: UserRecord) =>
  user.phone?.trim() || "—";

const statusLabel = (status?: UserStatus) => {
  if (status === "blocked") return "Blocked";
  if (status === "deleted") return "Deleted";
  return "Active";
};

const statusClass = (status?: UserStatus) => {
  if (status === "blocked") {
    return "bg-red-50 text-red-600";
  }

  if (status === "deleted") {
    return "bg-stone-100 text-stone-500";
  }

  return "bg-emerald-50 text-emerald-700";
};

function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconClass,
}: {
  title: string;
  value: number | string;
  subtitle: string;
  icon: typeof UsersIcon;
  iconClass: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-lg border border-stone-200 bg-white px-3.5 py-3.5">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconClass}`}
      >
        <Icon size={19} strokeWidth={1.8} />
      </div>

      <div className="min-w-0">
        <p className="text-[14px] font-medium leading-5 text-[#514b46]">
          {title}
        </p>
        <p className="text-[25px] font-semibold leading-7 tracking-tight text-[#292524]">
          {value}
        </p>
        <p className="mt-0.5 truncate text-[12px] leading-4 text-stone-400">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

export default function Users() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilter, setShowFilter] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [userDetails, setUserDetails] = useState<UserDetailsResponse["data"] | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isRefreshingDetails, setIsRefreshingDetails] = useState(false);
  const [showOrdersModal, setShowOrdersModal] = useState(false);

  const fetchUsers = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    if (!silent) setIsLoading(true);
    setLoadError("");

    try {
      const firstResponse = await api.get<UsersApiResponse>("/admin/users", {
        params: {
          page: 1,
          limit: 100,
          sortBy: "createdAt",
          order: "desc",
        },
      });

      const firstData = firstResponse.data?.data;
      const allUsers = Array.isArray(firstData?.users)
        ? [...firstData.users]
        : [];

      const totalPages = Math.max(
        1,
        Number(firstData?.pagination?.totalPages) || 1
      );

      for (let currentPage = 2; currentPage <= totalPages; currentPage += 1) {
        const response = await api.get<UsersApiResponse>("/admin/users", {
          params: {
            page: currentPage,
            limit: 100,
            sortBy: "createdAt",
            order: "desc",
          },
        });

        const pageUsers = response.data?.data?.users;

        if (Array.isArray(pageUsers)) {
          allUsers.push(...pageUsers);
        }
      }

      setUsers(allUsers);
    } catch (error: any) {
      if (!silent) setLoadError(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to load users. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsers();
    const refreshUsers = () => {
      if (document.visibilityState === "visible") void fetchUsers({ silent: true });
    };
    const interval = window.setInterval(refreshUsers, 15000);
    document.addEventListener("visibilitychange", refreshUsers);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refreshUsers);
    };
  }, [fetchUsers]);

  const summary = useMemo(() => {
    const now = new Date();

    const active = users.filter(
      (user) => (user.status ?? "active") === "active"
    ).length;

    const blocked = users.filter((user) => user.status === "blocked").length;

    const newThisMonth = users.filter((user) => {
      if (!user.createdAt) return false;

      const createdAt = new Date(user.createdAt);

      return (
        !Number.isNaN(createdAt.getTime()) &&
        createdAt.getMonth() === now.getMonth() &&
        createdAt.getFullYear() === now.getFullYear()
      );
    }).length;

    return {
      total: users.length,
      active,
      blocked,
      newThisMonth,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !query ||
        [user.fullName ?? "", user.email ?? "", user.phone ?? ""].some(
          (value) => value.toLowerCase().includes(query)
        );

      const normalizedStatus = user.status ?? "active";
      const matchesStatus =
        statusFilter === "all" || normalizedStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [users, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const visibleUsers = filteredUsers.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const exportUsers = () => {
    const headers = [
      "User ID",
      "Name",
      "Email",
      "Phone",
      "Status",
      "Phone Verified",
      "Joined On",
    ];

    const escapeCsv = (value: unknown) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const rows = filteredUsers.map((user) => [
      user._id,
      displayName(user),
      displayEmail(user),
      displayPhone(user),
      statusLabel(user.status),
      user.isPhoneVerified ? "Yes" : "No",
      formatDate(user.createdAt),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "excart-users.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const changeStatusFilter = (value: string) => {
    setStatusFilter(value);
    setPage(1);
    setShowFilter(false);
  };

  const refreshUserDetails = useCallback(async (user: UserRecord, options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    if (silent) setIsRefreshingDetails(true);
    else setIsLoadingDetails(true);
    setDetailError("");

    try {
      const response = await api.get<UserDetailsResponse>(`/admin/users/${user._id}/details`);
      const payload = response.data?.data;
      if (!response.data?.success || !payload?.user) {
        throw new Error(response.data?.message || "Unable to load user details.");
      }
      setUserDetails(payload);
      setSelectedUser((current) => current?._id === user._id ? { ...current, ...payload.user } : current);
      setUsers((current) => current.map((item) => item._id === user._id ? { ...item, ...payload.user } : item));
    } catch (error: any) {
      if (!silent) {
        setDetailError(error?.response?.data?.message || error?.message || "Unable to load this user's details.");
      }
    } finally {
      setIsLoadingDetails(false);
      setIsRefreshingDetails(false);
    }
  }, []);

  const openUserDetails = async (user: UserRecord) => {
    setSelectedUser(user);
    setUserDetails(null);
    setShowOrdersModal(false);
    await refreshUserDetails(user);
  };

  useEffect(() => {
    if (!selectedUser?._id) return;
    const selected = selectedUser;
    const refresh = () => {
      if (document.visibilityState === "visible") void refreshUserDetails(selected, { silent: true });
    };
    const interval = window.setInterval(refresh, 30000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [selectedUser?._id, refreshUserDetails]);

  const updateUserStatus = async () => {
    if (!selectedUser) return;
    const nextStatus = selectedUser.status === "blocked" ? "active" : "blocked";
    setIsUpdatingStatus(true);
    setDetailError("");
    try {
      const response = await api.patch(`/admin/users/${selectedUser._id}/status`, { status: nextStatus });
      const updated = response.data?.data?.user ?? response.data?.data ?? {};
      const nextUser = { ...selectedUser, ...updated, status: updated.status ?? nextStatus } as UserRecord;
      setUsers((current) => current.map((user) => user._id === selectedUser._id ? nextUser : user));
      setSelectedUser(nextUser);
    } catch (error: any) {
      setDetailError(error?.response?.data?.message || error?.message || "Unable to update this user's status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (selectedUser) {
    return (
      <div className="min-w-0 space-y-5 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <button
              type="button"
              onClick={() => { setSelectedUser(null); setUserDetails(null); setShowOrdersModal(false); setDetailError(""); }}
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-stone-500 transition hover:text-orange-600"
            >
              <ArrowLeft size={16} /> Back to Users
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${statusClass(selectedUser.status)}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${selectedUser.status === "blocked" ? "bg-red-500" : selectedUser.status === "deleted" ? "bg-stone-400" : "bg-emerald-500"}`} />
              {statusLabel(selectedUser.status)}
            </span>
            <button
              type="button"
              onClick={() => void updateUserStatus()}
              disabled={isUpdatingStatus || selectedUser.status === "deleted"}
              className={`inline-flex items-center justify-center rounded-lg px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${selectedUser.status === "blocked" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-500 hover:bg-red-600"}`}
            >
              {isUpdatingStatus ? <LoaderCircle size={15} className="mr-2 animate-spin" /> : null}
              {isUpdatingStatus ? "Updating…" : selectedUser.status === "blocked" ? "Activate account" : "Block account"}
            </button>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_8px_28px_rgba(28,25,23,0.07)]">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex min-w-0 items-center gap-4">
              {selectedUser.profileImage ? (
                <img src={selectedUser.profileImage} alt={displayName(selectedUser)} className="h-16 w-16 shrink-0 rounded-2xl border border-stone-100 object-cover" />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-lg font-semibold text-orange-600 ring-1 ring-inset ring-orange-100">{getInitials(selectedUser.fullName)}</div>
              )}
              <div className="min-w-0">
                <h2 title={displayName(selectedUser)} className="max-w-full truncate text-lg font-semibold tracking-tight text-stone-900 sm:max-w-[440px] sm:text-xl">{displayName(selectedUser)}</h2>
                <p title={displayEmail(selectedUser)} className="mt-1 max-w-full truncate text-sm text-stone-500 sm:max-w-[440px]">{displayEmail(selectedUser)}</p>
                <p title={displayPhone(selectedUser)} className="mt-1 inline-flex items-center gap-1.5 text-sm text-stone-600"><Phone size={13} className="shrink-0" />{displayPhone(selectedUser)}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
                  <span className="font-mono">ID: <span className="text-orange-600">{selectedUser._id}</span></span>
                  <span className="hidden h-1 w-1 rounded-full bg-stone-300 sm:inline-block" />
                  <span>Joined {formatDate(selectedUser.createdAt)}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:min-w-[250px]">
              <div className="rounded-xl border border-stone-100 bg-stone-50/80 px-3 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-stone-500">Phone verified</p>
                <p className={`mt-1.5 flex items-center gap-1.5 text-sm font-semibold ${selectedUser.isPhoneVerified ? "text-emerald-700" : "text-amber-700"}`}>
                  <CheckCircle2 size={15} />{selectedUser.isPhoneVerified ? "Verified" : "Not verified"}
                </p>
              </div>
              <div className="rounded-xl border border-stone-100 bg-stone-50/80 px-3 py-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-stone-500">Member since</p>
                <p className="mt-1.5 text-sm font-semibold text-stone-800">{formatDate(selectedUser.createdAt)}</p>
              </div>
            </div>
          </div>
        </section>

        {detailError && !isLoadingDetails && <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><AlertCircle size={17} className="mt-0.5 shrink-0" />{detailError}</div>}

        {isLoadingDetails && !userDetails ? (
          <div className="flex min-h-44 items-center justify-center gap-3 rounded-2xl border border-stone-200 bg-white text-sm text-stone-500 shadow-sm">
            <LoaderCircle size={20} className="animate-spin text-orange-500" /> Loading user details…
          </div>
        ) : (
          <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.75fr)]">
            <div className="min-w-0 space-y-5">
              <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
                  <div><h3 className="text-sm font-semibold text-stone-900">Personal information</h3><p className="mt-1 text-xs text-stone-500">Contact details and account activity</p></div>
                  <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-stone-500">User profile</span>
                </div>
                <div className="grid grid-cols-1 gap-x-8 px-5 sm:grid-cols-2">
                  {[["Full name", displayName(selectedUser)], ["Email address", displayEmail(selectedUser)], ["Phone number", displayPhone(selectedUser)], ["Phone verification", selectedUser.isPhoneVerified ? "Verified" : "Not verified"], ["Account status", statusLabel(selectedUser.status)], ["Member since", formatDate(selectedUser.createdAt)], ["Last updated", formatDate(selectedUser.updatedAt)], ["User ID", selectedUser._id]].map(([label, value]) => (
                    <div key={label} className="flex min-w-0 items-start justify-between gap-3 border-b border-stone-100 py-3.5 last:border-0 sm:[&:nth-last-child(2)]:border-0">
                      <span className="shrink-0 text-xs font-medium text-stone-500">{label}</span><span title={value} className="min-w-0 break-all text-right text-sm font-medium text-stone-800">{value}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 px-5 py-4">
                  <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600"><ListOrdered size={18} /></div><div><h3 className="text-sm font-semibold text-stone-900">Orders & payments</h3><p className="mt-1 text-xs text-stone-500">Order overview without a long scrolling list</p></div></div>
                  <button type="button" onClick={() => setShowOrdersModal(true)} disabled={!userDetails?.orders?.length} className="inline-flex items-center gap-2 rounded-lg bg-stone-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-40"><Eye size={14} /> View all orders <span className="rounded-md bg-white/15 px-1.5 py-0.5">{userDetails?.orders?.length ?? 0}</span></button>
                </div>
                <div className="grid grid-cols-2 gap-3 p-5 sm:grid-cols-4">
                  {[
                    { label: "Total orders", value: userDetails?.stats?.totalOrders ?? userDetails?.orders?.length ?? 0 },
                    { label: "Completed", value: userDetails?.stats?.completedOrders ?? 0 },
                    { label: "Paid orders", value: userDetails?.stats?.paidOrders ?? 0 },
                    { label: "Total paid", value: formatCurrency(userDetails?.stats?.totalPaid ?? 0) },
                  ].map((item) => <div key={item.label} className="rounded-xl border border-stone-100 bg-stone-50/80 p-3.5"><p className="text-xs text-stone-500">{item.label}</p><p className="mt-2 break-words text-lg font-semibold tracking-tight text-stone-900">{item.value}</p></div>)}
                </div>
                <div className="border-t border-stone-100 p-5">
                  {(() => {
                    const latestOrder = [...(userDetails?.orders ?? [])].sort(
                      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
                    )[0];
                    const deviceName = latestOrder
                      ? [latestOrder.device?.brand, latestOrder.device?.model, latestOrder.device?.variant || latestOrder.device?.storage, latestOrder.device?.color].filter(Boolean).join(" · ")
                      : "";
                    const orderStatus = (latestOrder?.status || "unknown").replace(/_/g, " ");
                    const paymentStatus = (latestOrder?.payment?.status || "pending").replace(/_/g, " ");
                    return (
                      <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-4">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-semibold text-stone-900">Latest order</h4>
                            <p className="mt-1 break-all text-xs text-stone-500">{latestOrder?.orderNumber || "No order number"}</p>
                          </div>
                          {latestOrder && <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold capitalize text-stone-700 ring-1 ring-stone-200">{orderStatus}</span>}
                        </div>
                        {latestOrder ? (
                          <>
                            <div className="flex items-start gap-3">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-stone-600 ring-1 ring-stone-200"><Smartphone size={22} /></div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-stone-900">{deviceName || "Device details unavailable"}</p>
                                <p className="mt-1 text-xs text-stone-500">Created {formatDate(latestOrder.createdAt)}</p>
                              </div>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-stone-200 pt-3">
                              <div><p className="text-[11px] uppercase tracking-wide text-stone-400">Estimated amount</p><p className="mt-1 text-sm font-semibold text-stone-800">{formatCurrency(latestOrder.payment?.estimatedAmount)}</p></div>
                              <div><p className="text-[11px] uppercase tracking-wide text-stone-400">Final amount</p><p className="mt-1 text-sm font-semibold text-stone-800">{formatCurrency(latestOrder.payment?.finalAmount)}</p></div>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                              <p className="text-xs text-stone-500">Payment: <span className={`font-semibold capitalize ${paymentStatus === "completed" ? "text-emerald-700" : "text-amber-700"}`}>{paymentStatus}</span></p>
                              <button type="button" onClick={() => setShowOrdersModal(true)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 transition hover:text-orange-700">View order details <ChevronRight size={14} /></button>
                            </div>
                          </>
                        ) : (
                          <div className="py-5 text-center"><Smartphone size={24} className="mx-auto text-stone-300" /><p className="mt-2 text-sm font-medium text-stone-700">No orders found</p><p className="mt-1 text-xs text-stone-500">The latest order will appear here when available.</p></div>
                        )}
                      </div>
                    );
                  })()}
                  <div className="mt-3 flex justify-end"><button type="button" onClick={() => void refreshUserDetails(selectedUser, { silent: true })} disabled={isRefreshingDetails} className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-600 transition hover:bg-stone-50 disabled:opacity-50">{isRefreshingDetails ? <LoaderCircle size={14} className="animate-spin" /> : <RefreshCw size={14} />} {isRefreshingDetails ? "Refreshing…" : "Refresh data"}</button></div>
                </div>
              </section>
            </div>

            <div className="min-w-0 space-y-5">
            <section className="min-w-0 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-stone-100 px-5 py-4"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600"><Wallet size={18} /></div><div><h3 className="text-sm font-semibold text-stone-900">Payout account</h3><p className="mt-1 text-xs text-stone-500">Bank or UPI details and verification</p></div></div>
              <div className="p-5">
                {!userDetails?.payoutAccount ? (
                  <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50/70 px-4 py-8 text-center"><Wallet size={24} className="mx-auto text-stone-300" /><p className="mt-2 text-sm font-semibold text-stone-800">No payout account added</p><p className="mt-1 text-xs leading-5 text-stone-500">This user has not added bank or UPI details.</p><span className="mt-3 inline-flex rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">Not available</span></div>
                ) : (() => {
                  const account = userDetails.payoutAccount;
                  const verified = account.isVerified === true;
                  const isBank = account.type === "bank";
                  const accountNumber = account.maskedBankAccountNumber || account.bankAccountNumber;
                  return <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3 rounded-xl border border-stone-100 bg-stone-50/70 p-4"><div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-orange-600 shadow-sm">{isBank ? <Banknote size={19} /> : <Smartphone size={19} />}</div><div className="min-w-0"><p className="text-sm font-semibold text-stone-900">{isBank ? "Bank account" : account.type === "upi" ? "UPI account" : "Payout account"}</p><p className="mt-0.5 truncate text-xs text-stone-500">{account.accountHolderName || "Account holder not provided"}</p></div></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${verified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{verified ? "Verified" : "Not verified"}</span></div>
                    <div className="divide-y divide-stone-100 rounded-xl border border-stone-100 px-4">
                      <div className="flex items-start justify-between gap-4 py-3"><span className="text-xs text-stone-500">Account holder</span><span className="break-words text-right text-sm font-medium text-stone-800">{account.accountHolderName || "—"}</span></div>
                      {isBank ? <><div className="flex items-start justify-between gap-4 py-3"><span className="text-xs text-stone-500">Account number</span><span className="break-all text-right font-mono text-sm font-medium text-stone-800">{accountNumber || "Not provided"}</span></div><div className="flex items-start justify-between gap-4 py-3"><span className="text-xs text-stone-500">IFSC code</span><span className="text-right text-sm font-medium text-stone-800">{account.bankIfsc || "—"}</span></div></> : <div className="flex items-start justify-between gap-4 py-3"><span className="text-xs text-stone-500">UPI ID</span><span className="break-all text-right text-sm font-medium text-stone-800">{account.upiId || "Not provided"}</span></div>}
                      <div className="flex items-start justify-between gap-4 py-3"><span className="text-xs text-stone-500">Account status</span><span className="text-right text-sm font-medium capitalize text-stone-800">{(account.status || "unknown").replace(/_/g, " ")}</span></div>
                      <div className="flex items-start justify-between gap-4 py-3"><span className="text-xs text-stone-500">Cashfree beneficiary</span><span className="text-right text-sm font-medium capitalize text-stone-800">{(account.cashfreeBeneficiaryStatus || "not created").replace(/_/g, " ")}</span></div>
                      <div className="flex items-start justify-between gap-4 py-3"><span className="text-xs text-stone-500">Verified on</span><span className="text-right text-sm font-medium text-stone-800">{verified ? formatDate(account.verifiedAt || undefined) : "Not verified"}</span></div>
                    </div>
                    {!verified && <p className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-800">This payout account has not been verified. Confirm its details before initiating a payout.</p>}
                  </div>;
                })()}
              </div>
            </section>

            <section className="min-w-0 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
              <div className="flex items-center gap-3 border-b border-stone-100 px-5 py-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600"><FileText size={18} /></div>
                <div><h3 className="text-sm font-semibold text-stone-900">User documents</h3><p className="mt-1 text-xs text-stone-500">Photo and Aadhaar documents from orders</p></div>
              </div>
              <div className="space-y-3 p-5">
                {(() => {
                  const orders = userDetails?.orders ?? [];
                  const livePhotoOrder = orders.find((order) => order.pickup?.verification?.customerPhoto?.url);
                  const aadhaarOrder = orders.find((order) => order.pickup?.verification?.aadhaar?.document?.url);
                  const documents = [
                    { label: "Photo", description: livePhotoOrder?.pickup?.verification?.customerPhoto?.fileName || "Customer verification photo", url: livePhotoOrder?.pickup?.verification?.customerPhoto?.url, orderNumber: livePhotoOrder?.orderNumber, icon: Camera },
                    { label: "Aadhaar card", description: aadhaarOrder?.pickup?.verification?.aadhaar?.document?.fileName || "Identity verification document", url: aadhaarOrder?.pickup?.verification?.aadhaar?.document?.url, orderNumber: aadhaarOrder?.orderNumber, icon: CreditCard },
                  ];
                  return documents.map((document) => {
                    const DocumentIcon = document.icon;
                    return <div key={document.label} className="flex items-center gap-3 rounded-xl border border-stone-100 p-3.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-50 text-stone-500"><DocumentIcon size={18} /></div>
                      <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-stone-800">{document.label}</p><p className="mt-0.5 truncate text-xs text-stone-500">{document.url ? document.description : "Not uploaded"}</p>{document.url && document.orderNumber && <p className="mt-1 truncate text-[11px] text-stone-400">Order {document.orderNumber}</p>}</div>
                      {document.url ? <a href={document.url} target="_blank" rel="noreferrer" download className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"><Download size={14} /><span className="hidden sm:inline">Download</span></a> : <span className="shrink-0 rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-semibold text-stone-500">Not uploaded</span>}
                    </div>;
                  });
                })()}
                <p className="text-[11px] leading-5 text-stone-400">Documents are shown when available in the user's order records. Access to these sensitive files should remain restricted to authorized admins.</p>
              </div>
            </section>
            </div>
          </div>
        )}

        {showOrdersModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/50 p-3 backdrop-blur-[3px] sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowOrdersModal(false); }}>
            <section role="dialog" aria-modal="true" aria-labelledby="orders-modal-title" className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-stone-100 bg-white px-5 py-4 sm:px-6"><div className="flex min-w-0 items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600"><ListOrdered size={20} /></div><div className="min-w-0"><h2 id="orders-modal-title" className="text-base font-semibold text-stone-900 sm:text-lg">All orders & payments</h2><p className="mt-1 text-xs text-stone-500">{displayName(selectedUser)} · {userDetails?.orders?.length ?? 0} records · auto-refreshes every 30 seconds</p></div></div><div className="flex shrink-0 items-center gap-2"><button type="button" onClick={() => void refreshUserDetails(selectedUser, { silent: true })} disabled={isRefreshingDetails} className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50 disabled:opacity-50">{isRefreshingDetails ? <LoaderCircle size={14} className="animate-spin" /> : <RefreshCw size={14} />}<span className="hidden sm:inline">Refresh</span></button><button type="button" onClick={() => setShowOrdersModal(false)} aria-label="Close orders" className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"><X size={19} /></button></div></div>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-stone-50/70 p-4 sm:p-6">
                {!userDetails?.orders?.length ? <div className="rounded-xl border border-dashed border-stone-200 bg-white px-5 py-12 text-center"><CreditCard size={26} className="mx-auto text-stone-300" /><p className="mt-3 text-sm font-semibold text-stone-800">No orders found</p></div> : userDetails.orders.map((order, index) => {
                  const deviceName = [order.device?.brand, order.device?.model, order.device?.variant || order.device?.storage, order.device?.color].filter(Boolean).join(" · ") || "Device details unavailable";
                  const paymentStatus = order.payment?.status || "pending";
                  const status = (order.status || "unknown").replace(/_/g, " ");
                  return <article key={order._id || order.orderNumber || index} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><p className="break-all text-xs font-semibold text-orange-600">{order.orderNumber || order._id || `Order ${index + 1}`}</p><h3 className="mt-1.5 text-sm font-semibold text-stone-900">{deviceName}</h3><p className="mt-1 text-xs text-stone-500">Created {formatDate(order.createdAt)}</p></div><span className="w-fit rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold capitalize text-stone-700">{status}</span></div><div className="mt-4 grid grid-cols-2 gap-3 border-t border-stone-100 pt-4 sm:grid-cols-4"><div><p className="text-[11px] uppercase tracking-wide text-stone-400">Estimated</p><p className="mt-1 text-sm font-semibold text-stone-800">{formatCurrency(order.payment?.estimatedAmount)}</p></div><div><p className="text-[11px] uppercase tracking-wide text-stone-400">Final amount</p><p className="mt-1 text-sm font-semibold text-stone-800">{formatCurrency(order.payment?.finalAmount)}</p></div><div><p className="text-[11px] uppercase tracking-wide text-stone-400">Payment status</p><p className={`mt-1 text-sm font-semibold capitalize ${paymentStatus === "completed" ? "text-emerald-700" : "text-amber-700"}`}>{paymentStatus.replace(/_/g, " ")}</p></div><div><p className="text-[11px] uppercase tracking-wide text-stone-400">Payout transfer</p><p className="mt-1 text-sm font-semibold capitalize text-stone-700">{(order.payment?.payout?.status || "not_started").replace(/_/g, " ")}</p></div></div>{order.payment?.transactionId && <div className="mt-3 border-t border-stone-100 pt-3"><p className="text-[11px] uppercase tracking-wide text-stone-400">Transaction ID</p><p className="mt-1 break-all font-mono text-xs text-stone-700">{order.payment.transactionId}</p></div>}</article>;
                })}
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-stone-100 bg-white px-5 py-3.5"><p className="text-xs text-stone-500">Latest data is fetched automatically while this profile is open.</p><button type="button" onClick={() => setShowOrdersModal(false)} className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-700">Done</button></div>
            </section>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-2">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Users"
          value={summary.total}
          subtitle="All registered users"
          icon={UsersIcon}
          iconClass="bg-purple-50 text-purple-500"
        />
        <SummaryCard
          title="Active Users"
          value={summary.active}
          subtitle="Currently active accounts"
          icon={UserRoundCheck}
          iconClass="bg-emerald-50 text-emerald-500"
        />
        <SummaryCard
          title="New Users This Month"
          value={summary.newThisMonth}
          subtitle="Based on registration date"
          icon={UserPlus}
          iconClass="bg-amber-50 text-amber-500"
        />
        <SummaryCard
          title="Blocked Users"
          value={summary.blocked}
          subtitle="Accounts currently blocked"
          icon={UserRoundX}
          iconClass="bg-rose-50 text-rose-500"
        />
      </div>

      <section className="overflow-visible rounded-lg border border-stone-200 bg-white">
        <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-[18px] font-semibold tracking-tight text-[#211f1d]">
            All Users
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-0 flex-1 sm:w-44 sm:flex-none">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search users..."
                aria-label="Search users"
                className="h-[38px] w-full rounded-lg border border-stone-200 bg-white pl-9 pr-3 text-[14px] text-stone-700 outline-none placeholder:text-stone-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 sm:w-44"
              />
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowFilter((current) => !current)}
                className="inline-flex h-[38px] min-w-[126px] items-center justify-between gap-2 rounded-lg border border-stone-200 bg-white px-3 text-[14px] text-stone-700 shadow-sm transition hover:bg-stone-50"
                aria-expanded={showFilter}
              >
                <span className="inline-flex items-center gap-2">
                  <SlidersHorizontal size={15} />
                  Filter
                </span>
                <ChevronDown size={15} className="text-stone-500" />
              </button>

              {showFilter && (
                <div className="absolute right-0 top-[44px] z-30 w-44 rounded-lg border border-stone-200 bg-white p-1.5 shadow-lg">
                  {[
                    { label: "All users", value: "all" },
                    { label: "Active", value: "active" },
                    { label: "Blocked", value: "blocked" },
                  ].map((option) => (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() => changeStatusFilter(option.value)}
                      className={`w-full rounded-md px-3 py-2 text-left text-[14px] transition hover:bg-stone-50 ${
                        statusFilter === option.value
                          ? "bg-orange-50 font-medium text-orange-600"
                          : "text-stone-700"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={exportUsers}
              disabled={filteredUsers.length === 0}
              className="inline-flex h-[38px] items-center justify-center gap-2 rounded-lg border border-stone-200 bg-white px-3.5 text-[14px] text-stone-700 shadow-sm transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={15} />
              Export
            </button>
          </div>
        </div>


        {loadError && (
          <div className="mx-2 mb-2 flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-[14px] text-red-700 sm:mx-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{loadError}</span>
            </span>
            <button
              type="button"
              onClick={() => void fetchUsers()}
              className="self-start font-medium underline underline-offset-2 sm:self-auto"
            >
              Try again
            </button>
          </div>
        )}

        <div className="overflow-x-auto px-2 pb-0 sm:px-2">
          <table className="w-full min-w-[1020px] border-separate border-spacing-0 text-left">
            <thead>
              <tr className="bg-stone-100">
                <th className="rounded-tl-md px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-[#514b46]">
                  User ID
                </th>
                <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-[#514b46]">
                  User
                </th>
                <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-[#514b46]">
                  Status
                </th>
                <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-[#514b46]">
                  Phone
                </th>
                <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-[#514b46]">
                  Joined On
                </th>
                <th className="px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-[#514b46]">
                  Phone Verification
                </th>
                <th className="rounded-tr-md px-4 py-3 text-center text-[12px] font-semibold uppercase tracking-wide text-[#514b46]">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="h-64 text-center">
                    <div className="inline-flex items-center gap-2 text-[14px] text-stone-500">
                      <LoaderCircle
                        size={18}
                        className="animate-spin text-orange-500"
                      />
                      Loading users...
                    </div>
                  </td>
                </tr>
              ) : !loadError && visibleUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="h-64 text-center">
                    <div className="mx-auto flex max-w-sm flex-col items-center px-5">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-stone-100 text-stone-400">
                        <UsersIcon size={22} />
                      </div>
                      <p className="text-[15px] font-semibold text-[#292524]">
                        {search || statusFilter !== "all"
                          ? "No matching users"
                          : "No users yet"}
                      </p>
                      <p className="mt-1 text-[14px] text-stone-500">
                        {search || statusFilter !== "all"
                          ? "Try changing your search or filter."
                          : "Registered customer accounts will appear here."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                visibleUsers.map((user) => (
                  <tr
                    key={user._id}
                    className="group transition-colors hover:bg-orange-50/40"
                  >
                    <td className="border-b border-stone-100 px-4 py-3">
                      <span className="font-mono text-[13px] font-medium text-orange-600" title={user._id}>
                        {user._id}
                      </span>
                    </td>
                    <td className="border-b border-stone-100 px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        {user.profileImage ? (
                          <img
                            src={user.profileImage}
                            alt={displayName(user)}
                            className="h-9 w-9 shrink-0 rounded-full border border-stone-100 object-cover"
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[12px] font-semibold text-orange-600">
                            {getInitials(user.fullName)}
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-semibold text-[#292524]">
                            {displayName(user)}
                          </p>
                          <p className="mt-0.5 truncate text-[12px] text-stone-500">
                            {displayEmail(user)}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="border-b border-stone-100 px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium ${statusClass(user.status)}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            user.status === "blocked"
                              ? "bg-red-500"
                              : user.status === "deleted"
                                ? "bg-stone-400"
                                : "bg-emerald-500"
                          }`}
                        />
                        {statusLabel(user.status)}
                      </span>
                    </td>

                    <td className="border-b border-stone-100 px-4 py-3">
                      <span className="inline-flex items-center gap-2 whitespace-nowrap text-[14px] text-stone-600">
                        {user.phone ? (
                          <>
                            <Phone
                              size={13}
                              className="shrink-0 text-stone-400"
                            />
                            {user.phone}
                          </>
                        ) : (
                          "—"
                        )}
                      </span>
                    </td>

                    <td className="border-b border-stone-100 px-4 py-3">
                      <span className="inline-flex items-center gap-2 whitespace-nowrap text-[14px] text-stone-600">
                        <CalendarDays
                          size={13}
                          className="shrink-0 text-stone-400"
                        />
                        {formatDate(user.createdAt)}
                      </span>
                    </td>

                    <td className="border-b border-stone-100 px-4 py-3">
                      {user.isPhoneVerified ? (
                        <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-emerald-700">
                          <CheckCircle2 size={14} />
                          Verified
                        </span>
                      ) : (
                        <span className="text-[13px] text-stone-500">
                          Not verified
                        </span>
                      )}
                    </td>

                    <td className="border-b border-stone-100 px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => void openUserDetails(user)}
                        aria-label={`Open ${displayName(user)} details`}
                        title="View user details"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-stone-400 transition hover:bg-orange-50 hover:text-orange-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                      >
                        <MoreHorizontal size={19} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[14px] text-stone-500">
            {isLoading
              ? "Loading user records..."
              : filteredUsers.length === 0
                ? "No user records"
                : `Showing ${(safePage - 1) * PAGE_SIZE + 1} to ${Math.min(
                    safePage * PAGE_SIZE,
                    filteredUsers.length
                  )} of ${filteredUsers.length} users`}
          </p>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              disabled={safePage <= 1 || isLoading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              aria-label="Previous page"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-stone-200 text-stone-500 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={15} />
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1)
              .filter(
                (number) =>
                  number === 1 ||
                  number === totalPages ||
                  Math.abs(number - safePage) <= 1
              )
              .map((number, index, visiblePages) => (
                <span key={number} className="inline-flex items-center gap-1.5">
                  {index > 0 &&
                    number - visiblePages[index - 1] > 1 && (
                      <span className="px-0.5 text-xs text-stone-400">
                        …
                      </span>
                    )}

                  <button
                    type="button"
                    onClick={() => setPage(number)}
                    aria-current={safePage === number ? "page" : undefined}
                    className={`inline-flex h-7 min-w-7 items-center justify-center rounded-md border px-2 text-[14px] transition ${
                      safePage === number
                        ? "border-orange-500 bg-orange-500 text-white"
                        : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
                    }`}
                  >
                    {number}
                  </button>
                </span>
              ))}

            <button
              type="button"
              disabled={safePage >= totalPages || isLoading}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              aria-label="Next page"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-stone-200 text-stone-500 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={15} />
            </button>

            <span className="ml-1 whitespace-nowrap text-[12px] text-stone-500">
              Rows per page
            </span>
            <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-md border border-stone-200 px-2 text-[14px] text-stone-600">
              {PAGE_SIZE}
            </span>
          </div>
        </div>
      </section>

    </div>
  );
}
