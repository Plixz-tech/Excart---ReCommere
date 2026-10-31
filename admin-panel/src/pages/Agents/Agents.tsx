import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import {
  Users, UserRoundCheck, UserRoundX, UserPlus, Search, SlidersHorizontal,
  Download, ChevronLeft, ChevronRight, ChevronDown, CalendarDays, Phone,
  CheckCircle2, LoaderCircle, AlertCircle, MoreHorizontal, ArrowLeft, Mail,
  MapPin, BriefcaseBusiness, ShieldCheck, FileText,
   Upload, Eye, X, Save, UserRound, Banknote, Clock3, BadgeCheck, WalletCards, TrendingUp,
} from "lucide-react";
import { api } from "../../api/axios";

type AgentStatus = "active" | "inactive" | "blocked" | "deleted" | string;
type AgentDocument = { url?: string; fileName?: string; uploadedAt?: string };
type AgentRecord = {
  _id: string; fullName?: string; email?: string; phone?: string; countryCode?: string;
  profileImage?: string; status?: AgentStatus; isPhoneVerified?: boolean;
  createdAt?: string; updatedAt?: string;
  agentProfile?: {
    agentId?: string; experience?: number | string; alternatePhone?: string;
    workingHours?: { start?: string; end?: string };
    address?: { line1?: string; city?: string; state?: string; pinCode?: string };
    operatingArea?: string; onboardingDate?: string;
    coverage?: { primaryArea?: string; areasCovered?: string[] };
    aadhaarNumber?: string; aadhaarNumberVerified?: boolean;
    panNumber?: string; panNumberVerified?: boolean;
    bankDetails?: { accountHolderName?: string; accountNumber?: string; maskedAccountNumber?: string; ifscCode?: string; bankName?: string; branchName?: string; accountType?: string; upiId?: string; isVerified?: boolean };
    payoutAccount?: { accountHolderName?: string; bankAccountNumber?: string; maskedBankAccountNumber?: string; bankIfsc?: string; bankName?: string; branchName?: string; upiId?: string; type?: string; isVerified?: boolean; status?: string };
    aadhaarVerification?: { referenceId?: string; verifiedAt?: string; provider?: string };
    verificationDocuments?: {
      aadhaar?: AgentDocument; panCard?: AgentDocument; drivingLicense?: AgentDocument;
      policeClearance?: AgentDocument; photo?: AgentDocument;
    };
  };
};
type AgentListResponse = { success?: boolean; message?: string; data?: { agents?: AgentRecord[]; pagination?: { currentPage?: number; totalPages?: number; totalAgents?: number; limit?: number } } };
type AgentOrder = { _id?: string; orderNumber?: string; status?: string; createdAt?: string; assignedAt?: string; completedAt?: string; device?: { brand?: string; model?: string; variant?: string; storage?: string; color?: string }; customer?: { fullName?: string; name?: string; phone?: string }; payment?: { estimatedAmount?: number; finalAmount?: number; status?: string }; agentCommission?: number; commissionAmount?: number };
type AgentEarning = { _id?: string; amount?: number; commissionAmount?: number; status?: string; createdAt?: string; order?: AgentOrder | string };
type AgentDetailResponse = { success?: boolean; message?: string; data?: { agent?: AgentRecord; commissionSummary?: Record<string, number>; earnings?: AgentEarning[]; orders?: AgentOrder[]; stats?: { totalOrders?: number; assignedOrders?: number; completedOrders?: number; pendingOrders?: number } } | AgentRecord };

const PAGE_SIZE = 8;
const money = (value?: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value) || 0);
const dateText = (value?: string) => { if (!value) return "—"; const d = new Date(value); return Number.isNaN(d.getTime()) ? "—" : new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(d); };
const initials = (name?: string) => name?.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "A";
const nameOf = (agent: AgentRecord) => agent.fullName?.trim() || "Unnamed Agent";
const emailOf = (agent: AgentRecord) => agent.email?.trim() || "—";
const phoneOf = (agent: AgentRecord) => [agent.countryCode, agent.phone].filter(Boolean).join(" ") || "—";
const statusLabel = (status?: string) => ({ active: "Active", inactive: "Inactive", blocked: "Blocked", deleted: "Deleted" }[status || "inactive"] || "Inactive");
const statusClass = (status?: string) => status === "active" ? "bg-emerald-50 text-emerald-700" : status === "blocked" ? "bg-red-50 text-red-600" : status === "deleted" ? "bg-stone-100 text-stone-500" : "bg-amber-50 text-amber-700";
const errorMessage = (error: any, fallback: string) => {
  const status = Number(error?.response?.status || 0);
  const code = error?.response?.data?.code || error?.code;
  const raw = String(error?.response?.data?.message || error?.response?.data?.error || error?.message || "");
  const duplicateKey = code === 11000 || code === "11000" || /E11000|duplicate key/i.test(raw);
  if (duplicateKey) {
    if (/phone_1|phone/i.test(raw)) return "This mobile number is already in use in ExCart. Enter a different mobile number, then send the Aadhaar OTP again.";
    if (/email_1|email/i.test(raw)) return "This email address is already registered. Enter a different email address.";
    return "A record with one of these details already exists. Check the mobile number and email address, then try again.";
  }
  if (status === 409 || /already exists|already registered/i.test(raw)) {
    if (/phone|mobile/i.test(raw)) return "This mobile number is already registered. Enter a different mobile number to create this agent.";
    if (/email/i.test(raw)) return "This email address is already registered. Enter a different email address.";
  }
  return raw || fallback;
};

function SummaryCard({ title, value, subtitle, icon: Icon, iconClass }: { title: string; value: number | string; subtitle: string; icon: typeof Users; iconClass: string }) {
  return <div className="flex min-w-0 items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(28,25,23,0.02)]"><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}><Icon size={19} strokeWidth={1.8} /></div><div className="min-w-0"><p className="text-sm font-medium leading-5 text-stone-600">{title}</p><p className="text-2xl font-semibold leading-7 tracking-tight text-stone-900">{value}</p><p className="mt-0.5 truncate text-xs text-stone-400">{subtitle}</p></div></div>;
}
function Field({ label, children, required }: { label: string; children: ReactNode; required?: boolean }) {
  return <label className="block min-w-0"><span className="mb-1.5 block text-xs font-semibold text-stone-600">{label}{required && <span className="ml-1 text-orange-600">*</span>}</span>{children}</label>;
}
const inputClass = "h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100";
const localDateISO = () => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; };
const displayDate = (value: string) => { if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value; const [year, month, day] = value.split("-"); return `${day}/${month}/${year}`; };
const parseDisplayDate = (value: string) => { const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); if (!match) return ""; const day = Number(match[1]); const month = Number(match[2]); const year = Number(match[3]); const date = new Date(year, month - 1, day); return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}` : ""; };
const timeTo12Hour = (value: string) => { if (!value) return ""; const [hour, minute] = value.split(":").map(Number); return `${String(hour % 12 || 12).padStart(2, "0")}:${String(minute).padStart(2, "0")}`; };
const timePeriod = (value: string) => value && Number(value.split(":")[0]) >= 12 ? "PM" : "AM";
const timeTo24Hour = (value: string, period: string) => { const match = value.trim().match(/^(\d{1,2}):(\d{2})$/); if (!match) return ""; let hour = Number(match[1]); const minute = Number(match[2]); if (hour < 1 || hour > 12 || minute > 59) return ""; hour = hour % 12 + (period === "PM" ? 12 : 0); return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`; };

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"list" | "add" | "details">("list");
  const [selectedAgent, setSelectedAgent] = useState<AgentRecord | null>(null);
  const [detailData, setDetailData] = useState<AgentDetailResponse["data"] | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [showEarningsModal, setShowEarningsModal] = useState(false);

  // Keep the page behind open dialogs from scrolling or shifting.
  useEffect(() => {
    if (!showEarningsModal && !showOrdersModal) return;
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [showEarningsModal, showOrdersModal]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [documentFiles, setDocumentFiles] = useState<Record<string, File | null>>({});
  const [form, setForm] = useState({ fullName: "", email: "", countryCode: "+91", phone: "", alternatePhone: "", experience: "", operatingArea: "", workingStart: "", workingEnd: "", addressLine1: "", city: "", state: "Kerala", pinCode: "", primaryArea: "", areasCovered: "", aadhaarNumber: "", panNumber: "", onboardingDate: localDateISO() });
  const [experienceUnit, setExperienceUnit] = useState("years");
  const [workingStartText, setWorkingStartText] = useState("");
  const [workingEndText, setWorkingEndText] = useState("");
  const [workingStartPeriod, setWorkingStartPeriod] = useState("AM");
  const [workingEndPeriod, setWorkingEndPeriod] = useState("AM");
  const [onboardingDateText, setOnboardingDateText] = useState(displayDate(localDateISO()));
  const [draftAgentId, setDraftAgentId] = useState("");
  const [aadhaarOtp, setAadhaarOtp] = useState("");
  const [aadhaarOtpSent, setAadhaarOtpSent] = useState(false);
  const [aadhaarVerified, setAadhaarVerified] = useState(false);
  const [panVerified, setPanVerified] = useState(false);
  const [verificationBusy, setVerificationBusy] = useState<"aadhaar-send" | "aadhaar-verify" | "pan" | "" >("");
  const [verificationMessage, setVerificationMessage] = useState("");

  const fetchAgents = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setLoadError("");
    try {
      const response = await api.get<AgentListResponse>("/admin/agents", { params: { page: 1, limit: 100, sortBy: "createdAt", order: "desc" } });
      const payload = response.data?.data;
      const allAgents = Array.isArray(payload?.agents) ? [...payload.agents] : [];
      const totalPages = Math.max(1, Number(payload?.pagination?.totalPages) || 1);
      for (let currentPage = 2; currentPage <= totalPages; currentPage += 1) {
        const next = await api.get<AgentListResponse>("/admin/agents", { params: { page: currentPage, limit: 100, sortBy: "createdAt", order: "desc" } });
        if (Array.isArray(next.data?.data?.agents)) allAgents.push(...next.data.data.agents);
      }
      setAgents(allAgents);
    } catch (error: any) {
      if (!silent) setLoadError(errorMessage(error, "Unable to load agents. Please try again."));
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void fetchAgents(); }, [fetchAgents]);

  const openDetails = async (agent: AgentRecord) => {
    setSelectedAgent(agent); setDetailData(null); setDetailError(""); setView("details"); setDetailLoading(true);
    try {
      const response = await api.get<AgentDetailResponse>(`/admin/agents/${agent._id}`);
      const payload: any = response.data?.data;
      const detailAgent = payload?.agent || payload;
      if (!detailAgent || !(detailAgent._id || detailAgent.fullName)) throw new Error(response.data?.message || "Agent details were not returned by the API.");
      setSelectedAgent({ ...agent, ...detailAgent });
      setDetailData(payload);
    } catch (error: any) { setDetailError(errorMessage(error, "Unable to load agent details.")); }
    finally { setDetailLoading(false); }
  };
  const backToList = () => { setView("list"); setSelectedAgent(null); setDetailData(null); setDetailError(""); setFormError(""); setSuccessMessage(""); };

  const filteredAgents = useMemo(() => {
    const query = search.trim().toLowerCase();
    return agents.filter((agent) => {
      const matchesSearch = !query || [agent.agentProfile?.agentId || "", agent.fullName || "", agent.email || "", agent.phone || ""].some((value) => value.toLowerCase().includes(query));
      const matchesStatus = statusFilter === "all" || (agent.status || "inactive") === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [agents, search, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredAgents.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visibleAgents = filteredAgents.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const summary = useMemo(() => {
    const now = new Date();
    return {
      total: agents.length,
      active: agents.filter((a) => a.status === "active").length,
      inactive: agents.filter((a) => !a.status || a.status === "inactive").length,
      newThisMonth: agents.filter((a) => { if (!a.createdAt) return false; const d = new Date(a.createdAt); return !Number.isNaN(d.getTime()) && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length,
    };
  }, [agents]);
  const exportAgents = () => {
    const rows = [["Agent ID", "Name", "Email", "Phone", "Status", "Phone Verified", "Joined On"], ...filteredAgents.map((a) => [a.agentProfile?.agentId || a._id, nameOf(a), emailOf(a), phoneOf(a), statusLabel(a.status), a.isPhoneVerified ? "Yes" : "No", dateText(a.createdAt)])];
    const csv = rows.map((row) => row.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a"); link.href = url; link.download = "excart-agents.csv"; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  };
  const updateField = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (name === "aadhaarNumber") { setAadhaarOtpSent(false); setAadhaarVerified(false); setAadhaarOtp(""); setVerificationMessage(""); }
    if (name === "panNumber") { setPanVerified(false); setVerificationMessage(""); }
  };
  const updateOnboardingDate = (value: string) => {
    setOnboardingDateText(value);
    const parsedDate = parseDisplayDate(value);
    if (parsedDate) setForm((current) => ({ ...current, onboardingDate: parsedDate }));
  };
  const updateWorkingTime = (which: "start" | "end", value: string, period?: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    const text = digits.length >= 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
    const currentPeriod = period || (which === "start" ? workingStartPeriod : workingEndPeriod);
    if (which === "start") setWorkingStartText(text);
    else setWorkingEndText(text);
    const converted = timeTo24Hour(text, currentPeriod);
    if (converted) setForm((current) => ({ ...current, [which === "start" ? "workingStart" : "workingEnd"]: converted }));
    else setForm((current) => ({ ...current, [which === "start" ? "workingStart" : "workingEnd"]: "" }));
  };
  const updateWorkingPeriod = (which: "start" | "end", period: string) => {
    if (which === "start") setWorkingStartPeriod(period);
    else setWorkingEndPeriod(period);
    const text = which === "start" ? workingStartText : workingEndText;
    const converted = timeTo24Hour(text, period);
    setForm((current) => ({ ...current, [which === "start" ? "workingStart" : "workingEnd"]: converted }));
  };
  const updateFiles = (event: ChangeEvent<HTMLInputElement>) => setDocumentFiles((current) => ({ ...current, [event.target.name]: event.target.files?.[0] || null }));

  const createTemporaryPassword = () => {
    const bytes = new Uint8Array(24);
    if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(bytes);
    else for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("") + "!aA9";
  };

  const ensureDraftAgent = async () => {
    if (draftAgentId) return draftAgentId;
    if (!form.fullName.trim() || !form.email.trim() || !form.phone.trim()) {
      throw new Error("Enter the agent's full name, email address and mobile number first. The verification API requires an agent record.");
    }
    const response = await api.post<any>("/admin/agents", {
      fullName: form.fullName.trim(), email: form.email.trim(), countryCode: "+91",
      phone: form.phone.trim(), password: createTemporaryPassword(),
    });
    const created = response.data?.data?.agent ?? response.data?.agent ?? response.data?.data;
    const id = String(created?._id || created?.id || "");
    if (!id) throw new Error("The agent API did not return an agent ID, so verification cannot continue.");
    setDraftAgentId(id);
    return id;
  };

  const sendAadhaarOtp = async () => {
    const aadhaar = form.aadhaarNumber.replace(/\D/g, "");
    if (!/^\d{12}$/.test(aadhaar)) { setVerificationMessage("Enter a valid 12-digit Aadhaar number."); return; }
    setVerificationBusy("aadhaar-send"); setVerificationMessage("");
    try {
      const id = await ensureDraftAgent();
      const response = await api.post<any>(`/admin/agents/${id}/aadhaar/send-otp`, { aadhaarNumber: aadhaar });
      setAadhaarOtpSent(true);
      setVerificationMessage(response.data?.message || "OTP sent successfully. Enter the 6-digit OTP to complete Aadhaar verification.");
    } catch (error: any) { setVerificationMessage(errorMessage(error, "Unable to send Aadhaar OTP.")); }
    finally { setVerificationBusy(""); }
  };

  const verifyAadhaarOtp = async () => {
    if (!aadhaarOtpSent || !draftAgentId) {
      setVerificationMessage("Click Send OTP first. The OTP input appears below the Aadhaar number after the provider confirms the OTP was sent.");
      return;
    }
    if (!/^\d{6}$/.test(aadhaarOtp)) { setVerificationMessage("Enter the 6-digit OTP."); return; }
    setVerificationBusy("aadhaar-verify"); setVerificationMessage("");
    try {
      const id = await ensureDraftAgent();
      const response = await api.post<any>(`/admin/agents/${id}/aadhaar/verify-otp`, { otp: aadhaarOtp });
      setAadhaarVerified(true);
      setVerificationMessage(response.data?.message || "Aadhaar verified successfully.");
    } catch (error: any) { setVerificationMessage(errorMessage(error, "Unable to verify Aadhaar OTP.")); }
    finally { setVerificationBusy(""); }
  };

  const verifyPan = async () => {
    const pan = form.panNumber.trim().toUpperCase();
    if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(pan)) { setVerificationMessage("Enter a valid PAN number, for example ABCDE1234F."); return; }
    setVerificationBusy("pan"); setVerificationMessage("");
    try {
      const id = await ensureDraftAgent();
      const response = await api.post<any>(`/admin/agents/${id}/verify-pan`, { panNumber: pan });
      setPanVerified(true);
      setForm((current) => ({ ...current, panNumber: pan }));
      setVerificationMessage(response.data?.message || "PAN verified successfully.");
    } catch (error: any) { setVerificationMessage(errorMessage(error, "Unable to verify PAN.")); }
    finally { setVerificationBusy(""); }
  };

  const submitAgent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSubmitting(true); setFormError(""); setSuccessMessage("");
    let createdId = draftAgentId;
    try {
      if (createdId) {
        await api.put(`/admin/agents/${createdId}`, {
          fullName: form.fullName.trim(), email: form.email.trim(), countryCode: "+91", phone: form.phone.trim(),
        });
      } else {
        const response = await api.post<any>("/admin/agents", {
          fullName: form.fullName.trim(), email: form.email.trim(), countryCode: "+91", phone: form.phone.trim(),
          password: createTemporaryPassword(),
        });
        const created = response.data?.data?.agent ?? response.data?.agent ?? response.data?.data;
        createdId = String(created?._id || created?.id || "");
        if (!createdId) throw new Error("Agent may have been created, but the API response did not include an agent ID. Please refresh the list before retrying.");
      }
      const profile: Record<string, any> = {};
      if (form.alternatePhone.trim()) profile.alternatePhone = form.alternatePhone.trim();
      if (form.experience.trim() !== "") profile.experience = `${form.experience.trim()} ${experienceUnit}`;
      if (form.operatingArea.trim()) profile.operatingArea = form.operatingArea.trim();
      if (form.workingStart || form.workingEnd) profile.workingHours = { start: form.workingStart, end: form.workingEnd };
      if (form.addressLine1 || form.city || form.state || form.pinCode) profile.address = { line1: form.addressLine1, city: form.city, state: form.state, pinCode: form.pinCode };
      if (form.primaryArea || form.areasCovered) profile.coverage = { primaryArea: form.primaryArea, areasCovered: form.areasCovered.split(",").map((s) => s.trim()).filter(Boolean) };
      if (form.aadhaarNumber.trim()) profile.aadhaarNumber = form.aadhaarNumber.replace(/\D/g, "");
      if (form.panNumber.trim()) profile.panNumber = form.panNumber.trim().toUpperCase();
      if (aadhaarVerified) profile.aadhaarNumberVerified = true;
      if (panVerified) profile.panNumberVerified = true;
      if (form.onboardingDate) profile.onboardingDate = form.onboardingDate;
      if (Object.keys(profile).length) await api.put(`/admin/agents/${createdId}`, { agentProfile: profile });
      const files = Object.entries(documentFiles).filter(([, file]) => file);
      if (files.length) {
        const data = new FormData(); files.forEach(([key, file]) => data.append(key, file as File));
        await api.post(`/admin/agents/${createdId}/documents`, data, { headers: { "Content-Type": "multipart/form-data" } });
      }
      await fetchAgents(true); setSuccessMessage("Agent created successfully.");
      const refreshed = await api.get<AgentDetailResponse>(`/admin/agents/${createdId}`).catch(() => null);
      const payload: any = refreshed?.data?.data;
      const agent = payload?.agent || payload;
      if (agent?._id) { setSelectedAgent(agent); setDetailData(payload); setView("details"); }
      else { setSelectedAgent({ _id: createdId, fullName: form.fullName, email: form.email, phone: form.phone, countryCode: "+91", status: "inactive" }); setDetailData(null); setView("details"); }
      setDraftAgentId("");
    } catch (error: any) {
      setFormError(errorMessage(error, "Unable to create agent. Please check the details and try again."));
      if (createdId) setFormError((current) => `${current} Agent record ID: ${createdId}. You can retry saving without creating a duplicate.`);
    } finally { setSubmitting(false); }
  };

  const renderDocument = (label: string, doc?: AgentDocument) => <div key={label} className="flex items-center gap-3 rounded-xl border border-stone-200 p-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600"><FileText size={17} /></div><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-stone-800">{label}</p><p className="mt-0.5 truncate text-xs text-stone-500">{doc?.fileName || (doc?.url ? "Uploaded document" : "Not uploaded")}</p></div>{doc?.url ? <a href={doc.url} target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-stone-200 px-2.5 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50"><Eye size={14} /> View</a> : <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-semibold text-stone-500">Missing</span>}</div>;

  if (view === "add") return <div className="agent-onboarding-page min-w-0 space-y-4 pb-5 [&_input]:h-11 [&_input]:rounded-xl [&_input]:border-slate-200 [&_input]:text-[13px] [&_textarea]:rounded-xl [&_textarea]:border-slate-200 [&_textarea]:text-[13px] [&_select]:text-[13px] [&_h2]:text-base [&_h2]:font-bold [&_h2]:tracking-tight [&_h3]:text-sm [&_h3]:font-bold [&_h3]:tracking-tight [&_label>span:first-child]:text-[13px] [&_label>span:first-child]:font-semibold">
    <div className="flex flex-wrap items-center justify-between gap-3"><button type="button" onClick={backToList} className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 transition hover:text-orange-600"><ArrowLeft size={14}/> Back to Agents</button><span className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700"><UserPlus size={14}/> Agent onboarding</span></div>
    {formError && <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><AlertCircle size={17} className="mt-0.5 shrink-0"/><div className="min-w-0 flex-1">{formError}</div><button type="button" onClick={() => setFormError("")} aria-label="Dismiss error"><X size={15}/></button></div>}
    {successMessage && <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"><CheckCircle2 size={17}/>{successMessage}</div>}
    <form onSubmit={submitAgent} className="space-y-4 pb-4">
      <div className="grid grid-cols-1 items-start gap-3.5 xl:grid-cols-3">
        <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.045)] transition-shadow duration-200 hover:shadow-[0_12px_34px_rgba(15,23,42,0.07)] xl:col-span-1"><div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50/90 via-white to-white px-5 py-4"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 ring-1 ring-inset ring-orange-100"><UserRound size={19}/></div><div><h2 className="text-sm font-semibold text-stone-900">Personal information</h2><p className="mt-0.5 text-xs text-stone-500">Agent identity and profile details</p></div></div><div className="space-y-3.5 p-4.5">
          <Field label="Full name" required><input name="fullName" value={form.fullName} onChange={updateField} required minLength={3} maxLength={100} placeholder="Enter full name" className={inputClass}/></Field>
          <Field label="Email address" required><input name="email" type="email" value={form.email} onChange={updateField} required placeholder="agent@email.com" className={inputClass}/></Field>
          <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3.5"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold text-stone-700">Agent ID</p><p className="mt-1 text-xs text-stone-500">Generated automatically when the agent record is created.</p></div><span className="shrink-0 rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 font-mono text-xs font-semibold text-stone-600">{draftAgentId ? `Saved · ${draftAgentId.slice(-6).toUpperCase()}` : "AUTO"}</span></div></div>
          <Field label="Experience">
            <div className="flex h-10 w-full items-center overflow-hidden rounded-lg border border-stone-200 bg-white transition focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100">
              <input name="experience" type="text" inputMode="numeric" value={form.experience} onChange={(event) => setForm((current) => ({ ...current, experience: event.target.value.replace(/[^0-9.]/g, "") }))} placeholder="Enter duration" className="h-full min-w-0 flex-1 rounded-l-lg border-0 bg-transparent px-3 text-sm text-stone-800 outline-none focus:ring-0"/>
              <div className="relative flex h-full shrink-0 items-center border-l border-orange-600 bg-orange-500">
                <select aria-label="Experience unit" value={experienceUnit} onChange={(event) => setExperienceUnit(event.target.value)} className="h-full appearance-none rounded-none border-0 bg-orange-500 py-0 pl-3 pr-12 text-sm font-semibold text-white outline-none transition-colors hover:bg-orange-600 focus:ring-0">
                  <option value="months">Months</option>
                  <option value="years">Years</option>
                </select>
                <ChevronDown size={15} strokeWidth={2.5} className="pointer-events-none absolute right-3 text-white" />
              </div>
            </div>
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
            <Field label="Onboarding date">
              <input name="onboardingDateDisplay" type="text" inputMode="numeric" placeholder="DD/MM/YYYY" value={onboardingDateText} onChange={(event) => updateOnboardingDate(event.target.value)} className={inputClass}/>
            </Field>
            <Field label="Working hours start" required>
              <div className="flex h-10 w-full overflow-hidden rounded-lg border border-stone-200 bg-white transition focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100">
                <input aria-label="Working hours start time" type="text" inputMode="numeric" placeholder="HH:MM" value={workingStartText} onChange={(event) => updateWorkingTime("start", event.target.value)} required className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-stone-800 outline-none focus:ring-0"/>
                <div className="relative flex h-full shrink-0 items-center border-l border-orange-600 bg-orange-500">
                  <select aria-label="Working hours start AM or PM" value={workingStartPeriod} onChange={(event) => updateWorkingPeriod("start", event.target.value)} className="h-full appearance-none rounded-none border-0 bg-orange-500 py-0 pl-3 pr-10 text-sm font-semibold text-white outline-none transition-colors hover:bg-orange-600 focus:ring-0"><option value="AM">AM</option><option value="PM">PM</option></select>
                  <ChevronDown size={15} strokeWidth={2.5} className="pointer-events-none absolute right-3 text-white" />
                </div>
              </div>
            </Field>
            <Field label="Working hours end" required>
              <div className="flex h-10 w-full overflow-hidden rounded-lg border border-stone-200 bg-white transition focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100">
                <input aria-label="Working hours end time" type="text" inputMode="numeric" placeholder="HH:MM" value={workingEndText} onChange={(event) => updateWorkingTime("end", event.target.value)} required className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-stone-800 outline-none focus:ring-0"/>
                <div className="relative flex h-full shrink-0 items-center border-l border-orange-600 bg-orange-500">
                  <select aria-label="Working hours end AM or PM" value={workingEndPeriod} onChange={(event) => updateWorkingPeriod("end", event.target.value)} className="h-full appearance-none rounded-none border-0 bg-orange-500 py-0 pl-3 pr-10 text-sm font-semibold text-white outline-none transition-colors hover:bg-orange-600 focus:ring-0"><option value="AM">AM</option><option value="PM">PM</option></select>
                  <ChevronDown size={15} strokeWidth={2.5} className="pointer-events-none absolute right-3 text-white" />
                </div>
              </div>
            </Field>
          </div>
          <div className="border-t border-stone-100 pt-4"><div className="mb-3 flex items-center justify-between gap-2"><div><h3 className="text-sm font-semibold text-stone-800">Identity verification</h3><p className="mt-1 text-xs text-stone-500">Verify Aadhaar and PAN.</p></div><ShieldCheck size={18} className="text-stone-400"/></div>
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/70 p-3.5 shadow-[0_3px_12px_rgba(15,23,42,0.035)]"><div className="mb-2 flex items-center justify-between gap-2"><div><label htmlFor="agent-aadhaar" className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Aadhaar verification</label><p className="mt-1 text-xs font-medium text-slate-700">12-digit identity number</p></div>{aadhaarVerified && <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700"><CheckCircle2 size={13}/> Verified</span>}</div><div className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 transition focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-100"><input id="agent-aadhaar" name="aadhaarNumber" value={form.aadhaarNumber} onChange={updateField} maxLength={12} inputMode="numeric" placeholder="Enter 12-digit Aadhaar" className="h-10 min-w-0 flex-1 border-0 bg-transparent px-3 text-sm outline-none focus:ring-0" /><button type="button" onClick={sendAadhaarOtp} disabled={!!verificationBusy || aadhaarVerified} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-900 px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50">{verificationBusy==="aadhaar-send"?<LoaderCircle size={14} className="animate-spin"/>:<ShieldCheck size={14}/>}{aadhaarVerified?"Verified":"Send OTP"}</button></div>{aadhaarOtpSent && !aadhaarVerified && <div className="mt-3 rounded-xl border border-orange-100 bg-orange-50/60 p-3"><p className="mb-2 text-xs font-semibold text-stone-700">Enter the 6-digit OTP</p><div className="flex min-w-0 items-center gap-2 rounded-xl border border-orange-200 bg-white p-1.5 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100"><input aria-label="Aadhaar OTP" value={aadhaarOtp} onChange={(e)=>setAadhaarOtp(e.target.value.replace(/\D/g,"").slice(0,6))} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000" className="h-10 min-w-0 flex-1 border-0 bg-transparent px-3 text-sm tracking-[0.2em] outline-none focus:ring-0"/><button type="button" onClick={verifyAadhaarOtp} disabled={!!verificationBusy || aadhaarOtp.length !== 6} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-orange-500 px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50">{verificationBusy==="aadhaar-verify"?<LoaderCircle size={14} className="animate-spin"/>:<CheckCircle2 size={14}/>}Verify OTP</button></div><p className="mt-2 text-[11px] text-stone-500">Enter the OTP received on the mobile number linked to Aadhaar.</p></div>}</div>
              <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/70 p-3.5 shadow-[0_3px_12px_rgba(15,23,42,0.035)]"><div className="mb-2 flex items-center justify-between gap-2"><div><label htmlFor="agent-pan" className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">PAN verification</label><p className="mt-1 text-xs font-medium text-slate-700">Permanent Account Number</p></div>{panVerified && <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700"><CheckCircle2 size={13}/> Verified</span>}</div><div className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 transition focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-100"><input id="agent-pan" name="panNumber" value={form.panNumber} onChange={updateField} maxLength={10} autoCapitalize="characters" placeholder="ABCDE1234F" className="h-10 min-w-0 flex-1 border-0 bg-transparent px-3 text-sm uppercase outline-none focus:ring-0"/><button type="button" onClick={verifyPan} disabled={!!verificationBusy || panVerified} className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-900 px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50">{verificationBusy==="pan"?<LoaderCircle size={14} className="animate-spin"/>:<ShieldCheck size={14}/>}{panVerified?"Verified":"Verify PAN"}</button></div><p className="mt-2 text-[11px] leading-4 text-stone-500">Use a valid PAN number to confirm identity.</p></div>
              {verificationMessage && <div role="status" aria-live="polite" className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs leading-5 ${/failed|unable|error|invalid|already|duplicate|not returned|please request|enter a valid|powerapi request/i.test(verificationMessage) ? "border-red-100 bg-red-50 text-red-700" : /verified successfully|otp sent successfully/i.test(verificationMessage) ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-stone-200 bg-stone-50 text-stone-600"}`}><ShieldCheck size={15} className="mt-0.5 shrink-0"/><span>{verificationMessage}</span></div>}
            </div>
          </div>
        </div></section>
        <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.045)] transition-shadow duration-200 hover:shadow-[0_12px_34px_rgba(15,23,42,0.07)] xl:col-span-1"><div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50/90 via-white to-white px-5 py-4"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-100"><Phone size={19}/></div><div><h2 className="text-sm font-semibold text-stone-900">Contact & address</h2><p className="mt-0.5 text-xs text-stone-500">Where the agent can be reached</p></div></div><div className="space-y-3.5 p-4.5">
          <Field label="Mobile number" required><div className="flex min-w-0 gap-2"><div className="flex h-10 w-[84px] shrink-0 items-center justify-center gap-1 rounded-lg border border-stone-200 bg-stone-50 px-2 text-sm font-medium text-stone-700"><span>🇮🇳</span><span>+91</span><ChevronDown size={13} className="text-stone-400"/></div><input name="phone" type="tel" value={form.phone} onChange={updateField} required minLength={10} maxLength={10} inputMode="numeric" placeholder="10-digit mobile number" className={`${inputClass} min-w-0 flex-1`}/></div><span className="mt-1.5 block text-[11px] text-stone-500">Indian mobile numbers only.</span></Field>
          <Field label="Alternative number"><input name="alternatePhone" type="tel" value={form.alternatePhone} onChange={updateField} maxLength={10} inputMode="numeric" placeholder="Optional alternate number" className={inputClass}/></Field>
          <Field label="Complete address"><textarea name="addressLine1" value={form.addressLine1} onChange={updateField} rows={4} placeholder="House / building, street, locality" className="w-full resize-y rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"/></Field>
          <Field label="Operating area" required><input name="operatingArea" value={form.operatingArea} onChange={updateField} required placeholder="e.g. Malappuram town" className={inputClass}/></Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Field label="City"><input name="city" value={form.city} onChange={updateField} placeholder="City" className={inputClass}/></Field><Field label="State"><input name="state" value={form.state} onChange={updateField} placeholder="State" className={inputClass}/></Field></div>
          <Field label="PIN code" required><input name="pinCode" value={form.pinCode} onChange={updateField} required maxLength={6} inputMode="numeric" placeholder="6-digit PIN code" className={inputClass}/></Field>
          <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-3.5"><div className="flex items-start gap-2.5"><MapPin size={17} className="mt-0.5 shrink-0 text-sky-700"/><div><p className="text-xs font-semibold text-sky-900">Service location</p><p className="mt-1 text-xs leading-5 text-sky-800/80">Use the operating area and PIN code to identify the agent's service coverage.</p></div></div></div>
        </div></section>
        <section className="min-w-0 self-start overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.045)] transition-shadow duration-200 hover:shadow-[0_12px_34px_rgba(15,23,42,0.07)] xl:col-span-1"><div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50/90 via-white to-white px-5 py-4"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-100"><MapPin size={19}/></div><div><h2 className="text-sm font-semibold text-stone-900">Coverage area</h2><p className="mt-0.5 text-xs text-stone-500">Define the locations assigned to this agent</p></div></div><div className="space-y-3.5 p-4.5">
          <Field label="Primary area" required><input name="primaryArea" value={form.primaryArea} onChange={updateField} required placeholder="Main service area" className={inputClass}/></Field>
          <Field label="Areas covered" required><textarea name="areasCovered" value={form.areasCovered} onChange={updateField} required rows={3} placeholder="Enter areas separated by commas" className="w-full resize-y rounded-lg border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"/></Field>
          <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold text-stone-700">Coverage summary</p><p className="mt-1 text-xs text-stone-500">Areas currently entered</p></div><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-orange-600 ring-1 ring-stone-200"><MapPin size={18}/></span></div><p className="mt-3 text-2xl font-semibold tracking-tight text-stone-900">{form.areasCovered.split(",").map((a)=>a.trim()).filter(Boolean).length}<span className="ml-1.5 text-sm font-medium text-stone-500">areas</span></p><div className="mt-3 flex flex-wrap gap-1.5">{form.areasCovered.split(",").map((a)=>a.trim()).filter(Boolean).map((area,i)=><span key={`${area}-${i}`} className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[11px] font-medium text-stone-600">{area}</span>)}{!form.areasCovered.trim()&&<span className="text-xs text-stone-400">Area tags will appear here</span>}</div></div>
          <div className="rounded-xl border border-dashed border-stone-200 p-4"><p className="text-xs font-semibold text-stone-700">Pickup capacity</p><p className="mt-1 text-xs leading-5 text-stone-500">Maximum pickups per day is not configured, so no limit is applied here.</p><span className="mt-3 inline-flex rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-semibold text-stone-500">Not configured</span></div>
          <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-3"><div className="flex items-start gap-2.5"><MapPin size={16} className="mt-0.5 shrink-0 text-violet-700"/><div><p className="text-xs font-semibold text-violet-900">Coverage planning</p><p className="mt-1 text-xs leading-5 text-violet-800/80">Add nearby towns and localities separated by commas. Keep the primary area as the agent's main service location so assignments stay clear.</p></div></div></div>
        </div></section>
      </div>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_6px_22px_rgba(15,23,42,0.045)]"><div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50/90 via-white to-white px-5 py-4"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 ring-1 ring-inset ring-orange-100"><FileText size={19}/></div><div><h2 className="text-sm font-semibold text-stone-900">Agent documents</h2><p className="mt-0.5 text-xs text-stone-500">Upload clear copies of the required documents.</p></div><span className="ml-auto rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-600">{Object.values(documentFiles).filter(Boolean).length}/5 added</span></div><div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">{[{key:"aadhaar",label:"Aadhaar card",description:"Government identity proof"},{key:"panCard",label:"PAN card",description:"Permanent Account Number"},{key:"drivingLicense",label:"Driving licence",description:"Valid driving licence"},{key:"policeClearance",label:"Police clearance",description:"Police verification certificate"},{key:"photo",label:"Profile photo",description:"Recent agent photo"}].map((doc)=> <label key={doc.key} className="group flex min-w-0 cursor-pointer flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_2px_8px_rgba(15,23,42,0.025)] transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-200 hover:bg-orange-50/30 hover:shadow-[0_10px_24px_rgba(234,88,12,0.08)]"><span className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-50 text-stone-600 transition group-hover:bg-orange-50 group-hover:text-orange-600"><FileText size={18}/></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-stone-800">{doc.label}</span><span className="mt-1 block text-xs leading-4 text-stone-500">{doc.description}</span></span><CheckCircle2 size={16} className={documentFiles[doc.key]?"shrink-0 text-emerald-600":"shrink-0 text-stone-200"}/></span><span className="mt-4 flex min-h-[72px] flex-col items-center justify-center rounded-lg border border-dashed border-stone-300 bg-stone-50/70 px-3 py-3 text-center transition group-hover:border-orange-200"><Upload size={17} className="text-stone-500"/><span className="mt-1.5 max-w-full truncate text-xs font-semibold text-stone-700">{documentFiles[doc.key]?.name || "Choose a file"}</span><span className="mt-1 text-[10px] text-stone-400">PDF or image</span></span><input type="file" name={doc.key} accept="image/*,.pdf" onChange={updateFiles} className="sr-only"/></label>)}</div></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_6px_22px_rgba(15,23,42,0.045)]"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-600"><UserRound size={19}/></div><div><h3 className="text-sm font-semibold text-stone-900">Agent preview</h3><p className="mt-1 text-xs text-stone-500">A quick preview of the details being entered</p></div></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[650px] text-left text-xs"><thead className="border-b border-stone-100 text-stone-500"><tr>{["Agent ID","Phone Number","Experience","Working Hours","Primary Area","Areas Covered","Documents"].map(x=><th key={x} className="px-3 py-2.5 font-semibold">{x}</th>)}</tr></thead><tbody><tr className="text-stone-700"><td className="px-3 py-3 font-mono">{draftAgentId ? draftAgentId.slice(-6).toUpperCase() : "Auto"}</td><td className="px-3 py-3">{form.phone?`+91 ${form.phone}`:"—"}</td><td className="px-3 py-3">{form.experience!==""?`${form.experience} ${experienceUnit}`:"—"}</td><td className="px-3 py-3">{form.workingStart&&form.workingEnd?`${form.workingStart} – ${form.workingEnd}`:"—"}</td><td className="px-3 py-3">{form.primaryArea||"—"}</td><td className="px-3 py-3">{form.areasCovered.split(",").filter(x=>x.trim()).length||"—"}</td><td className="px-3 py-3">{Object.values(documentFiles).filter(Boolean).length}/5</td></tr></tbody></table></div></section>
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-stone-200 bg-white/95 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur lg:left-[240px]">
        <div className="flex w-full items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <p className="text-xs text-stone-500">Review the details before creating the agent.</p>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={backToList} className="inline-flex h-10 items-center justify-center rounded-lg border border-stone-200 bg-white px-4 text-sm font-medium text-stone-600 transition hover:bg-stone-50">Cancel</button>
            <button type="submit" disabled={submitting} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-orange-500 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60">{submitting ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}{submitting ? "Saving…" : "Create Agent"}</button>
          </div>
        </div>
      </div>
    </form>
  </div>;
  if (view === "details" && selectedAgent) {
    const profile = selectedAgent.agentProfile;
    const docs = profile?.verificationDocuments;
    const summaryData: any = (detailData as any)?.commissionSummary || {};
    const earnings: AgentEarning[] = Array.isArray((detailData as any)?.earnings) ? (detailData as any).earnings : [];
    const payoutRequests: any[] = Array.isArray((detailData as any)?.payoutRequests) ? (detailData as any).payoutRequests : Array.isArray((detailData as any)?.commissionPayoutRequests) ? (detailData as any).commissionPayoutRequests : [];
    const rawOrders: AgentOrder[] = Array.isArray((detailData as any)?.orders) ? (detailData as any).orders : [];
    const earningOrders: AgentOrder[] = earnings.map((earning) => earning.order).filter((order): order is AgentOrder => !!order && typeof order === "object");
    const orders: AgentOrder[] = rawOrders.length ? rawOrders : earningOrders;
    const orderStats: any = (detailData as any)?.stats || {};
    const completedOrders = Number(orderStats.completedOrders ?? orders.filter((order) => ["completed", "delivered", "closed"].includes(String(order.status || "").toLowerCase())).length);
    const pendingOrders = Number(orderStats.pendingOrders ?? orders.filter((order) => !["completed", "delivered", "closed", "cancelled", "rejected"].includes(String(order.status || "").toLowerCase())).length);
    const assignedOrders = Number(orderStats.assignedOrders ?? orderStats.totalOrders ?? (rawOrders.length || orders.length));
    const bank: any = (profile as any)?.bankDetails || (profile as any)?.payoutAccount || (selectedAgent as any)?.bankDetails || (selectedAgent as any)?.payoutAccount || {};
    const back = () => { setView("list"); setSelectedAgent(null); setDetailData(null); setDetailError(""); };
    const orderDeviceName = (order: any) => {
      const candidates = [order?.device, order?.deviceDetails, order?.evaluation?.device, order?.orderEvaluation?.device, order?.catalogItem, order?.product, order?.deviceSnapshot];
      for (const candidate of candidates) {
        if (!candidate || typeof candidate !== "object") continue;
        const name = [candidate.brand, candidate.model, candidate.variant, candidate.storage, candidate.color].filter(Boolean).join(" · ");
        if (name) return name;
        if (candidate.name || candidate.title || candidate.deviceName) return candidate.name || candidate.title || candidate.deviceName;
      }
      return order?.deviceName || order?.modelName || order?.productName || "Device details pending";
    };
    const orderStatusClass = (value: string) => {
      const normalized = value.toLowerCase().replace(/[ _-]/g, "");
      if (["readystock", "completed", "delivered", "paid", "approved"].includes(normalized)) return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100";
      if (["inspectioncompleted", "inprogress", "inspectioninprogress", "pickup", "intransit"].includes(normalized)) return "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-100";
      if (["cancelled", "rejected", "failed", "blocked"].includes(normalized)) return "bg-red-50 text-red-700 ring-1 ring-inset ring-red-100";
      return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-100";
    };
    return <div className="agent-details-page min-w-0 space-y-6 pb-8 [&_h3]:text-base [&_h3]:font-bold [&_h3]:tracking-tight [&_section_p]:leading-relaxed">
      <div className="flex flex-wrap items-center justify-between gap-3"><button type="button" onClick={back} className="inline-flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-orange-600"><ArrowLeft size={16} /> Back to Agents</button><span className={`rounded-full px-3 py-1.5 text-xs font-semibold ${statusClass(selectedAgent.status)}`}>{statusLabel(selectedAgent.status)}</span></div>
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_4px_18px_rgba(15,23,42,0.045)]"><div className="flex flex-col gap-3.5 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4"><div className="flex min-w-0 items-center gap-3">{selectedAgent.profileImage ? <img src={selectedAgent.profileImage} alt={nameOf(selectedAgent)} className="h-12 w-12 shrink-0 rounded-xl border border-slate-200 object-cover" /> : <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-sm font-semibold text-orange-600 ring-1 ring-inset ring-orange-100">{initials(selectedAgent.fullName)}</div>}<div className="min-w-0"><h2 className="truncate text-xl font-bold tracking-tight text-slate-950 sm:text-[22px]">{nameOf(selectedAgent)}</h2><p className="mt-0.5 truncate text-xs font-medium text-slate-500">{emailOf(selectedAgent)}</p><p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700"><Phone size={12} />{phoneOf(selectedAgent)}</p><div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-medium text-slate-500"><span>Agent ID: <strong className="font-mono text-orange-600">{profile?.agentId || selectedAgent._id}</strong></span><span>Joined {dateText(selectedAgent.createdAt)}</span></div></div></div><div className="grid grid-cols-2 gap-2 sm:w-[220px] sm:shrink-0"><div className="rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2"><p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">Phone verification</p><p className={`mt-1 flex items-center gap-1 text-xs font-bold ${selectedAgent.isPhoneVerified ? "text-emerald-700" : "text-amber-700"}`}><CheckCircle2 size={13} />{selectedAgent.isPhoneVerified ? "Verified" : "Not verified"}</p></div><div className="rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2"><p className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-400">Experience</p><p className="mt-1 text-sm font-bold tracking-tight text-slate-900">{profile?.experience !== undefined ? `${profile.experience} years` : "—"}</p></div></div></div></section>
      {detailError && <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><AlertCircle size={17} className="mt-0.5 shrink-0" />{detailError}</div>}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_6px_22px_rgba(15,23,42,0.045)]"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white px-5 py-4"><div><h3 className="text-sm font-semibold text-stone-900">Order overview</h3><p className="mt-1 text-xs text-stone-500">Assigned order activity recorded for this agent</p></div><button type="button" onClick={() => setShowOrdersModal(true)} disabled={orders.length === 0} className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40">View Order Details <span className="rounded bg-white/15 px-1.5 py-0.5">{orders.length}</span><Eye size={15} className="ml-1 text-white"/></button></div><div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">{[{label:"Total assigned orders",value:assignedOrders},{label:"Completed orders",value:completedOrders},{label:"Pending orders",value:pendingOrders},{label:"Total commission",value:money(Number(summaryData.total ?? earnings.reduce((sum, earning) => sum + Number(earning.amount ?? earning.commissionAmount ?? 0), 0)))}].map((item) => <div key={item.label} className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-[0_2px_8px_rgba(15,23,42,0.025)]"><p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">{item.label}</p><p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">{item.value}</p></div>)}</div></section>
      {detailLoading && !detailData ? <div className="flex min-h-36 items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white text-sm text-stone-500"><LoaderCircle size={18} className="animate-spin text-orange-500" /> Loading agent details…</div> : <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]"><div className="min-w-0 space-y-4">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_6px_22px_rgba(15,23,42,0.045)]"><div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50/90 via-white to-white px-5 py-4"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 ring-1 ring-inset ring-orange-100"><UserRound size={18} /></div><div><h3 className="text-sm font-semibold text-stone-900">Personal & work information</h3><p className="mt-1 text-xs text-stone-500">Contact details, work area and schedule</p></div></div><div className="grid grid-cols-1 gap-x-8 px-5 sm:grid-cols-2">{[["Full name",nameOf(selectedAgent)],["Email address",emailOf(selectedAgent)],["Phone number",phoneOf(selectedAgent)],["Alternate phone",profile?.alternatePhone || "—"],["Operating area",profile?.operatingArea || "—"],["Primary coverage",profile?.coverage?.primaryArea || "—"],["Areas covered",profile?.coverage?.areasCovered?.join(", ") || "—"],["Working hours",[profile?.workingHours?.start,profile?.workingHours?.end].filter(Boolean).join(" – ") || "—"],["Address",[profile?.address?.line1,profile?.address?.city,profile?.address?.state,profile?.address?.pinCode].filter(Boolean).join(", ") || "—"],["Onboarding date",dateText(profile?.onboardingDate)],["Created",dateText(selectedAgent.createdAt)],["Last updated",dateText(selectedAgent.updatedAt)]].map(([label,value]) => <div key={label} className="flex min-w-0 items-start justify-between gap-4 border-b border-slate-100 py-4"><span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.07em] text-slate-400">{label}</span><span className="min-w-0 break-words text-right text-[13px] font-semibold leading-5 text-slate-800">{value}</span></div>)}</div></section>
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_6px_22px_rgba(15,23,42,0.045)]"><div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50/90 via-white to-white px-5 py-4"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100"><Banknote size={18} /></div><div><h3 className="text-sm font-semibold text-stone-900">Commission overview</h3><p className="mt-1 text-xs text-stone-500">Commission totals and payment activity</p></div></div><div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">{[{label:"Total earned",value:summaryData.total ?? 0,note:"Lifetime commission",icon:TrendingUp,tone:"text-stone-600",iconBg:"bg-stone-100",line:"bg-stone-300"},{label:"Pending",value:summaryData.pending ?? 0,note:"Awaiting approval",icon:Clock3,tone:"text-stone-600",iconBg:"bg-stone-100",line:"bg-stone-300"},{label:"Approved",value:summaryData.approved ?? 0,note:"Ready for payout",icon:BadgeCheck,tone:"text-stone-600",iconBg:"bg-stone-100",line:"bg-stone-300"},{label:"Paid out",value:summaryData.paid ?? 0,note:"Successfully transferred",icon:WalletCards,tone:"text-stone-600",iconBg:"bg-stone-100",line:"bg-stone-300"}].map((item) => { const Icon = item.icon; return <article key={item.label} className="group relative min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/80 p-5 shadow-[0_3px_12px_rgba(15,23,42,0.035)] transition-all duration-200 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-[0_10px_24px_rgba(15,23,42,0.07)]"><div className="flex items-start justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">{item.label}</p><p className="mt-3 text-[27px] font-bold leading-8 tracking-tight text-slate-950">{typeof item.value === "number" ? money(item.value) : item.value}</p></div><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.iconBg} ${item.tone}`}><Icon size={19} strokeWidth={1.8}/></div></div><div className="mt-4 flex items-center gap-2 border-t border-stone-100 pt-3"><span className="h-1.5 w-1.5 rounded-full bg-stone-300" /><p className="text-xs font-medium text-stone-500">{item.note}</p></div></article>;})}</div><div className="border-t border-stone-100 p-5"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><h4 className="text-sm font-semibold text-stone-800">Commission payout requests</h4><p className="mt-1 text-xs text-stone-500">Requests submitted by the agent from their wallet</p></div><span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">{payoutRequests.filter((request) => ["pending", "requested", "under_review"].includes(String(request.status || "pending").toLowerCase())).length} pending</span></div>{payoutRequests.length ? <div className="space-y-3">{payoutRequests.map((request, index) => <div key={request._id || request.id || index} className="flex flex-col gap-3 rounded-xl border border-stone-200 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="text-sm font-semibold text-stone-900">{money(Number(request.amount ?? request.requestedAmount ?? 0))}</p><p className="mt-1 text-xs text-stone-500">Requested {dateText(request.createdAt || request.requestedAt)}{request.reference ? ` · Ref: ${request.reference}` : ""}</p><span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${["pending", "requested", "under_review"].includes(String(request.status || "pending").toLowerCase()) ? "bg-amber-50 text-amber-700" : String(request.status).toLowerCase() === "paid" ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-600"}`}>{String(request.status || "pending").replace(/_/g, " ")}</span></div><button type="button" disabled title="Payment processing requires the commission payout API endpoint" onClick={() => setDetailError("The payout request is visible, but payment processing cannot be enabled until the backend payout API endpoint is connected.")} className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">Pay</button></div>)}</div> : <p className="rounded-xl border border-dashed border-stone-200 px-4 py-6 text-center text-sm text-stone-500">No payout requests yet.</p>}</div><div className="border-t border-stone-100 p-5"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h4 className="text-sm font-semibold text-stone-800">Recent earnings</h4><p className="mt-1 text-xs text-stone-500">Latest commission activity</p></div>{earnings.length > 0 && <button type="button" onClick={() => setShowEarningsModal(true)} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-orange-500 px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600">View All Earnings <ChevronRight size={15}/></button>}</div>{earnings.length ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{earnings.slice(0,2).map((earning,i) => <article key={earning._id || i} className="rounded-xl border border-stone-200 bg-white p-4 transition hover:border-stone-300"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-xs font-semibold text-orange-600">{(typeof earning.order === "object" ? earning.order?.orderNumber : undefined) || (typeof earning.order === "string" ? earning.order : undefined) || "Commission earning"}</p><p className="mt-1 text-xs text-stone-500">{dateText(earning.createdAt)}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${String(earning.status || "pending").toLowerCase()==="paid" ? "bg-emerald-50 text-emerald-700" : String(earning.status || "pending").toLowerCase()==="approved" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>{(earning.status || "pending").replace(/_/g," ")}</span></div><p className="mt-4 text-xl font-semibold tracking-tight text-stone-900">{money(earning.amount ?? earning.commissionAmount)}</p><p className="mt-1 text-xs text-stone-500">Commission amount</p></article>)}</div> : <p className="rounded-xl border border-dashed border-stone-200 px-4 py-6 text-center text-sm text-stone-500">No earnings yet.</p>}</div></section>
      </div><div className="min-w-0 space-y-4">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_6px_22px_rgba(15,23,42,0.045)]"><div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50/90 via-white to-white px-5 py-4"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100"><Banknote size={18}/></div><div><h3 className="text-sm font-semibold text-stone-900">Bank & payout details</h3><p className="mt-1 text-xs text-stone-500">Bank account information saved for agent payouts</p></div><span className={`ml-auto rounded-full px-2.5 py-1 text-[11px] font-semibold ${bank.isVerified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{bank.isVerified ? "Verified" : "Unverified"}</span></div><div className="divide-y divide-stone-100 px-5">{[["Account holder",bank.accountHolderName || "—"],["Bank name",bank.bankName || "—"],["Branch",bank.branchName || "—"],["Account number",bank.maskedAccountNumber || bank.maskedBankAccountNumber || bank.accountNumber || bank.bankAccountNumber || "—"],["IFSC code",bank.ifscCode || bank.bankIfsc || "—"],["Account type",bank.accountType || bank.type || "—"],["UPI ID",bank.upiId || "—"],["Payout status",bank.status || "—"]].map(([label,value])=><div key={label} className="flex items-start justify-between gap-4 py-3"><span className="text-xs text-stone-500">{label}</span><span className="max-w-[65%] break-all text-right text-sm font-medium capitalize text-stone-800">{String(value).replace(/_/g," ")}</span></div>)}</div>{!bank.accountHolderName && !bank.bankAccountNumber && !bank.accountNumber && !bank.upiId && <p className="px-5 pb-4 text-xs leading-5 text-stone-400">No bank details have been added yet.</p>}</section>
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_6px_22px_rgba(15,23,42,0.045)]"><div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50/90 via-white to-white px-5 py-4"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-700"><ShieldCheck size={18} /></div><div><h3 className="text-sm font-semibold text-stone-900">Verification status</h3><p className="mt-1 text-xs text-stone-500">Identity checks recorded on the agent profile</p></div></div><div className="space-y-3 p-5">{[{label:"Aadhaar verification",verified:profile?.aadhaarNumberVerified===true,detail:profile?.aadhaarNumber ? `Number: ${profile.aadhaarNumber}` : "Aadhaar number not available"},{label:"PAN verification",verified:profile?.panNumberVerified===true,detail:profile?.panNumber ? `PAN: ${profile.panNumber}` : "PAN number not available"},{label:"Phone verification",verified:selectedAgent.isPhoneVerified===true,detail:phoneOf(selectedAgent)}].map((item) => <div key={item.label} className="flex items-start justify-between gap-3 rounded-xl border border-stone-100 p-3.5"><div className="min-w-0"><p className="text-sm font-semibold text-stone-800">{item.label}</p><p className="mt-1 break-all text-xs text-stone-500">{item.detail}</p></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${item.verified ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{item.verified ? "Verified" : "Pending"}</span></div>)}</div></section>
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_6px_22px_rgba(15,23,42,0.045)]"><div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50/90 via-white to-white px-5 py-4"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700"><FileText size={18} /></div><div><h3 className="text-sm font-semibold text-stone-900">Agent documents</h3><p className="mt-1 text-xs text-stone-500">Documents available in the agent record</p></div></div><div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">{renderDocument("Aadhaar card",docs?.aadhaar)}{renderDocument("PAN card",docs?.panCard)}{renderDocument("Driving licence",docs?.drivingLicense)}{renderDocument("Police clearance",docs?.policeClearance)}{renderDocument("Profile photo",docs?.photo)}</div></section>

      </div></div>}
      {showOrdersModal && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-950/50 p-3 backdrop-blur-[3px] sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowOrdersModal(false); }}><section role="dialog" aria-modal="true" aria-labelledby="agent-orders-modal-title" className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 to-white px-5 py-4 sm:px-6"><div><h2 id="agent-orders-modal-title" className="text-base font-semibold text-stone-900 sm:text-lg">Assigned orders</h2><p className="mt-1 text-xs text-stone-500">{nameOf(selectedAgent)} · {orders.length} order records</p></div><button type="button" onClick={() => setShowOrdersModal(false)} aria-label="Close order details" className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"><X size={19}/></button></div><div className="agent-modal-scroll min-h-0 flex-1 space-y-3 overflow-y-auto bg-stone-50/70 p-4 sm:p-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{orders.length ? orders.map((order,index)=>{const deviceName=orderDeviceName(order); const status=String(order.status || "Pending").replace(/_/g," "); return <article key={order._id || order.orderNumber || index} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><p className="break-all text-xs font-semibold text-orange-600">{order.orderNumber || order._id || `Order ${index+1}`}</p><h3 className="mt-1.5 text-sm font-semibold text-stone-900">{deviceName}</h3><p className="mt-1 text-xs text-stone-500">Assigned {dateText(order.assignedAt || order.createdAt)}{order.completedAt ? ` · Completed ${dateText(order.completedAt)}` : ""}</p></div><span className={`w-fit shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${orderStatusClass(status)}`}>{status}</span></div><div className="mt-4 grid grid-cols-2 gap-3 border-t border-stone-100 pt-4 sm:grid-cols-4"><div><p className="text-[11px] uppercase tracking-wide text-stone-400">Customer</p><p className="mt-1 break-words text-sm font-medium text-stone-800">{order.customer?.fullName || order.customer?.name || "—"}</p></div><div><p className="text-[11px] uppercase tracking-wide text-stone-400">Customer phone</p><p className="mt-1 text-sm font-medium text-stone-800">{order.customer?.phone || "—"}</p></div><div><p className="text-[11px] uppercase tracking-wide text-stone-400">Final amount</p><p className="mt-1 text-sm font-semibold text-stone-800">{money(order.payment?.finalAmount)}</p></div><div><p className="text-[11px] uppercase tracking-wide text-stone-400">Agent commission</p><p className="mt-1 text-sm font-semibold text-stone-800">{money(order.agentCommission ?? order.commissionAmount)}</p></div></div></article>;}) : <div className="rounded-xl border border-dashed border-stone-200 bg-white px-5 py-12 text-center"><BriefcaseBusiness size={26} className="mx-auto text-stone-300"/><p className="mt-3 text-sm font-semibold text-stone-800">No order details available</p><p className="mt-1 text-xs text-stone-500">The agent details API has not returned assigned order records. The order endpoint will need to supply them to populate this modal.</p></div>}</div><div className="flex items-center justify-between gap-3 border-t border-stone-100 bg-white px-5 py-3.5"><button type="button" onClick={() => setShowOrdersModal(false)} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600">Done</button></div></section></div>}
      {showEarningsModal && <div className="fixed inset-0 z-[110] flex items-center justify-center bg-stone-950/50 p-3 backdrop-blur-[3px] sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowEarningsModal(false); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="agent-earnings-modal-title" className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
          <div className="shrink-0 border-b border-stone-100 bg-white px-5 py-4 sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-orange-100 bg-orange-50 text-orange-600"><WalletCards size={20}/></div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-600">Agent finance</p>
                  <h2 id="agent-earnings-modal-title" className="mt-0.5 text-lg font-semibold tracking-tight text-stone-900">All Earnings</h2>
                  <p className="mt-0.5 truncate text-sm text-stone-500">{nameOf(selectedAgent)} <span className="px-1 text-stone-300">·</span> Complete commission history</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowEarningsModal(false)} aria-label="Close earnings" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"><X size={18}/></button>
            </div>
          </div>
          <div className="shrink-0 grid grid-cols-1 gap-3 border-b border-stone-100 bg-stone-50/70 p-4 sm:grid-cols-3 sm:px-6">
            <div className="rounded-xl border border-stone-200 bg-white p-3.5"><div className="flex items-center gap-2 text-xs font-medium text-stone-500"><Banknote size={15} className="text-orange-500"/> Total earnings</div><p className="mt-2 text-xl font-semibold tracking-tight text-stone-900">{money(earnings.reduce((sum, earning) => sum + Number(earning.amount ?? earning.commissionAmount ?? 0), 0))}</p></div>
            <div className="rounded-xl border border-stone-200 bg-white p-3.5"><div className="flex items-center gap-2 text-xs font-medium text-stone-500"><CheckCircle2 size={15} className="text-emerald-600"/> Paid records</div><p className="mt-2 text-xl font-semibold tracking-tight text-stone-900">{earnings.filter((earning) => String(earning.status || "").toLowerCase() === "paid").length}</p></div>
            <div className="rounded-xl border border-stone-200 bg-white p-3.5"><div className="flex items-center gap-2 text-xs font-medium text-stone-500"><Clock3 size={15} className="text-amber-600"/> Pending / other</div><p className="mt-2 text-xl font-semibold tracking-tight text-stone-900">{earnings.filter((earning) => !["paid"].includes(String(earning.status || "").toLowerCase())).length}</p></div>
          </div>
          <div className="agent-earnings-content min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(110px,0.8fr)_minmax(100px,0.7fr)_minmax(110px,0.6fr)] gap-4 border-b border-stone-100 bg-white px-6 py-3 text-[11px] font-semibold uppercase tracking-wide text-stone-500 sm:grid"><span>Order / Reference</span><span>Date</span><span>Status</span><span className="text-right">Commission</span></div>
            {earnings.length ? <div className="divide-y divide-stone-100">{earnings.map((earning,index) => {
              const status = String(earning.status || "pending").toLowerCase();
              const orderRef = (typeof earning.order === "object" ? earning.order?.orderNumber : undefined) || (typeof earning.order === "string" ? earning.order : undefined) || "Commission earning";
              return <div key={earning._id || index} className="grid grid-cols-1 items-center gap-3 px-5 py-4 transition hover:bg-orange-50/30 sm:grid-cols-[minmax(0,1.5fr)_minmax(110px,0.8fr)_minmax(100px,0.7fr)_minmax(110px,0.6fr)] sm:gap-4 sm:px-6">
                <div className="flex min-w-0 items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600"><TrendingUp size={17}/></div><div className="min-w-0"><p className="break-all text-sm font-semibold text-stone-800">{orderRef}</p><p className="mt-1 text-xs text-stone-500">{earning._id ? `Ref: ${earning._id}` : "Commission record"}</p></div></div>
                <div className="flex items-center gap-2 text-sm text-stone-600 sm:block"><CalendarDays size={14} className="text-stone-400 sm:hidden"/><span>{dateText(earning.createdAt)}</span></div>
                <div><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${status === "paid" ? "bg-emerald-50 text-emerald-700" : status === "approved" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>{status.replace(/_/g," ")}</span></div>
                <p className="text-base font-semibold text-stone-900 sm:text-right">{money(earning.amount ?? earning.commissionAmount)}</p>
              </div>;
            })}</div> : <div className="flex min-h-56 flex-col items-center justify-center px-6 py-12 text-center"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-stone-100 text-stone-400"><WalletCards size={22}/></div><p className="mt-3 text-sm font-semibold text-stone-800">No earnings available</p><p className="mt-1 max-w-sm text-xs leading-5 text-stone-500">Commission records will appear here when earnings are returned by the agent details API.</p></div>}
          </div>
          <div className="shrink-0 flex items-center justify-between gap-3 border-t border-stone-100 bg-white px-5 py-3.5 sm:px-6"><p className="text-xs text-stone-500">{earnings.length} commission record{earnings.length === 1 ? "" : "s"}</p><button type="button" onClick={() => setShowEarningsModal(false)} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600">Done</button></div>
        </section>
      </div>}
    </div>;
  }

  return <div className="excart-admin-page min-w-0 space-y-4 pb-6 [&_h1]:text-[22px] [&_h1]:leading-7 [&_h1]:font-semibold [&_h2]:text-base [&_h2]:leading-6 [&_h2]:font-semibold [&_h3]:text-sm [&_h3]:leading-5 [&_h3]:font-semibold">
    {successMessage && <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"><CheckCircle2 size={17} />{successMessage}<button type="button" onClick={() => setSuccessMessage("")} className="ml-auto rounded p-1 hover:bg-emerald-100" aria-label="Dismiss message"><X size={15} /></button></div>}
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"><SummaryCard title="Total Agents" value={summary.total} subtitle="All registered agents" icon={Users} iconClass="bg-violet-50 text-violet-600"/><SummaryCard title="Active Agents" value={summary.active} subtitle="Currently active accounts" icon={UserRoundCheck} iconClass="bg-emerald-50 text-emerald-600"/><SummaryCard title="Inactive Agents" value={summary.inactive} subtitle="Awaiting activation or inactive" icon={UserRoundX} iconClass="bg-amber-50 text-amber-600"/><SummaryCard title="New This Month" value={summary.newThisMonth} subtitle="Based on registration date" icon={CalendarDays} iconClass="bg-orange-50 text-orange-600"/></div>
    <section className="overflow-visible rounded-2xl border border-slate-200 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.045)]"><div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-orange-600">People · Operations</p><h2 className="text-lg font-bold tracking-tight text-slate-900">Agent list</h2><p className="mt-1 text-xs text-slate-500">Manage your field team and account access</p></div><div className="flex flex-wrap items-center gap-2"><div className="relative min-w-0 flex-1 sm:w-56 sm:flex-none"><Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"/><input type="search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search agents..." aria-label="Search agents" className="h-10 w-full rounded-lg border border-stone-200 bg-white pl-9 pr-3 text-sm text-stone-700 outline-none placeholder:text-stone-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 sm:w-56"/></div><div className="relative"><button type="button" onClick={() => setFilterOpen((v) => !v)} aria-expanded={filterOpen} className="inline-flex h-10 items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700 hover:bg-stone-50"><SlidersHorizontal size={15}/>Filter<ChevronDown size={14} className="text-stone-400"/></button>{filterOpen && <div className="absolute right-0 top-11 z-30 w-44 rounded-xl border border-stone-200 bg-white p-1.5 shadow-lg">{[{label:"All agents",value:"all"},{label:"Active",value:"active"},{label:"Inactive",value:"inactive"},{label:"Blocked",value:"blocked"}].map((item) => <button key={item.value} type="button" onClick={() => { setStatusFilter(item.value); setPage(1); setFilterOpen(false); }} className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-stone-50 ${statusFilter===item.value?"bg-orange-50 font-semibold text-orange-700":"text-stone-600"}`}>{item.label}</button>)}</div>}</div><button type="button" onClick={exportAgents} disabled={!filteredAgents.length} className="inline-flex h-10 items-center gap-2 rounded-lg border border-stone-200 bg-white px-3.5 text-sm text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"><Download size={15}/>Export</button><button type="button" onClick={() => { setFormError(""); setSuccessMessage(""); setDraftAgentId(""); setAadhaarOtp(""); setAadhaarOtpSent(false); setAadhaarVerified(false); setPanVerified(false); setVerificationMessage(""); setView("add"); }} className="inline-flex h-10 items-center gap-2 rounded-lg bg-orange-500 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"><UserPlus size={16}/>Add Agent</button></div></div>
      {loadError && <div className="mx-4 mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700"><AlertCircle size={16} className="mt-0.5 shrink-0"/><span className="flex-1">{loadError}</span><button type="button" onClick={() => void fetchAgents()} className="shrink-0 font-semibold underline">Try again</button></div>}
      <div className="overflow-x-auto px-2"><table className="w-full min-w-[950px] border-separate border-spacing-0 text-left"><thead><tr className="bg-slate-50"><th className="rounded-tl-lg px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Agent ID</th><th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Agent</th><th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Status</th><th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Phone</th><th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Joined On</th><th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Phone Verification</th><th className="rounded-tr-lg px-4 py-3 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Action</th></tr></thead><tbody>{loading ? <tr><td colSpan={7} className="h-56 text-center"><span className="inline-flex items-center gap-2 text-sm text-stone-500"><LoaderCircle size={18} className="animate-spin text-orange-500"/>Loading agents…</span></td></tr> : !loadError && visibleAgents.length===0 ? <tr><td colSpan={7} className="h-56 text-center"><div className="mx-auto flex max-w-sm flex-col items-center px-5"><div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-stone-100 text-stone-400"><Users size={22}/></div><p className="text-sm font-semibold text-stone-800">{search || statusFilter!=="all" ? "No matching agents" : "No agents yet"}</p><p className="mt-1 text-sm text-stone-500">{search || statusFilter!=="all" ? "Try changing your search or filter." : "Newly created agent accounts will appear here."}</p></div></td></tr> : visibleAgents.map((agent) => <tr key={agent._id} className="transition-colors hover:bg-orange-50/50"><td className="border-b border-slate-100 px-4 py-3.5"><span className="font-mono text-xs font-semibold text-orange-600" title={agent._id}>{agent.agentProfile?.agentId || agent._id}</span></td><td className="border-b border-slate-100 px-4 py-3.5"><div className="flex min-w-0 items-center gap-3">{agent.profileImage ? <img src={agent.profileImage} alt={nameOf(agent)} className="h-9 w-9 shrink-0 rounded-full border border-stone-100 object-cover" onError={(e) => { e.currentTarget.style.display="none"; }}/> : <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-orange-700">{initials(agent.fullName)}</div>}<div className="min-w-0"><p className="truncate text-sm font-semibold text-stone-900">{nameOf(agent)}</p><p className="mt-0.5 flex items-center gap-1 truncate text-xs text-stone-500"><Mail size={11}/>{emailOf(agent)}</p></div></div></td><td className="border-b border-slate-100 px-4 py-3.5"><span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${statusClass(agent.status)}`}><span className={`h-1.5 w-1.5 rounded-full ${agent.status==="active"?"bg-emerald-500":agent.status==="blocked"?"bg-red-500":"bg-amber-500"}`}/>{statusLabel(agent.status)}</span></td><td className="border-b border-slate-100 px-4 py-3.5"><span className="inline-flex items-center gap-2 whitespace-nowrap text-sm text-stone-600"><Phone size={13} className="text-stone-400"/>{phoneOf(agent)}</span></td><td className="border-b border-slate-100 px-4 py-3.5"><span className="inline-flex items-center gap-2 whitespace-nowrap text-sm text-stone-600"><CalendarDays size={13} className="text-stone-400"/>{dateText(agent.createdAt)}</span></td><td className="border-b border-slate-100 px-4 py-3.5">{agent.isPhoneVerified ? <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700"><CheckCircle2 size={14}/>Verified</span> : <span className="text-xs text-stone-500">Not verified</span>}</td><td className="border-b border-slate-100 px-4 py-3.5 text-center"><button type="button" onClick={() => void openDetails(agent)} aria-label={`View ${nameOf(agent)} details`} title="View agent details" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-stone-400 transition hover:bg-orange-50 hover:text-orange-600"><MoreHorizontal size={19}/></button></td></tr>)}</tbody></table></div>
      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-stone-500">{loading ? "Loading agent records…" : filteredAgents.length===0 ? "No agent records" : `Showing ${(safePage-1)*PAGE_SIZE+1} to ${Math.min(safePage*PAGE_SIZE,filteredAgents.length)} of ${filteredAgents.length} agents`}</p><div className="flex flex-wrap items-center gap-1.5"><button type="button" disabled={safePage<=1 || loading} onClick={() => setPage((p) => Math.max(1,p-1))} aria-label="Previous page" className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50 disabled:opacity-40"><ChevronLeft size={16}/></button>{Array.from({length:totalPages},(_,i)=>i+1).filter((n)=>n===1||n===totalPages||Math.abs(n-safePage)<=1).map((n,i,arr)=><span key={n} className="inline-flex items-center gap-1">{i>0&&n-arr[i-1]>1&&<span className="px-1 text-stone-400">…</span>}<button type="button" onClick={()=>setPage(n)} aria-current={safePage===n?"page":undefined} className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 text-sm ${safePage===n?"border-orange-500 bg-orange-500 text-white":"border-stone-200 bg-white text-stone-600 hover:bg-stone-50"}`}>{n}</button></span>)}<button type="button" disabled={safePage>=totalPages||loading} onClick={()=>setPage((p)=>Math.min(totalPages,p+1))} aria-label="Next page" className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 text-stone-500 hover:bg-stone-50 disabled:opacity-40"><ChevronRight size={16}/></button><span className="ml-2 text-xs text-stone-500">Rows per page</span><span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-stone-200 px-2 text-sm text-stone-600">{PAGE_SIZE}</span></div></div>
    </section>
  </div>;
}
