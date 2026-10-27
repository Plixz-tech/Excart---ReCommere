
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Ban,
  Trash2,
  Smartphone,
  RefreshCw,
  X,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  IndianRupee,
  Settings2,
} from "lucide-react";
import { api } from "../../api/axios";

type Brand = {
  _id: string;
  name: string;
  image?: string;
  active: boolean;
};

type Model = {
  _id: string;
  name: string;
  brand: string | Brand;
  image?: string;
  active: boolean;
};

type Deduction = {
  name: string;
  amount: number;
  active: boolean;
};

type Catalog = {
  _id: string;
  brand: string;
  brandImage?: string;
  model: string;
  modelImage?: string;
  storage?: string;
  ram?: string;
  valuationPrice: number;
  agentCommission: number;
  conditionDeductions?: Deduction[];
  evaluationConfig?: Record<string, {
    enabled?: boolean;
    options?: string[];
    allowMultiple?: boolean;
    inputType?: string;
  }>;
  active: boolean;
};

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T | {
    brands?: T;
    models?: T;
    items?: T;
  };
};

type Notice = {
  type: "success" | "error";
  text: string;
};

type DeductionOption = {
  option: string;
  amount: number;
  active: boolean;
};

type EvaluationSectionConfig = {
  key: string;
  title: string;
  type?: string;
  enabled?: boolean;
  options: string[];
  allowMultiple?: boolean;
  inputType?: string;
};

type EvaluationRule = {
  key: string;
  title: string;
  type?: string;
  enabled?: boolean;
  allowMultiple?: boolean;
  inputType?: string;
  options: DeductionOption[];
};

const ITEMS_PER_PAGE = 8;

const createRules = (
  sections: EvaluationSectionConfig[],
  deductions: Deduction[] = [],
  savedConfig?: Catalog["evaluationConfig"]
): EvaluationRule[] =>
  sections.map((section) => {
    const configuredOptions = savedConfig?.[section.key]?.options;
    const optionNames = Array.isArray(configuredOptions) && configuredOptions.length
      ? configuredOptions
      : section.options;

    return {
      key: section.key,
      title: section.title,
      type: section.type,
      enabled: savedConfig?.[section.key]?.enabled ?? section.enabled ?? true,
      allowMultiple: savedConfig?.[section.key]?.allowMultiple ?? section.allowMultiple,
      inputType: savedConfig?.[section.key]?.inputType ?? section.inputType,
      options: optionNames.map((option) => {
        const saved = deductions.find((deduction) => deduction.name === option);
        return {
          option,
          amount: saved?.amount ?? 0,
          active: saved?.active ?? true,
        };
      }),
    };
  });

const unwrapEvaluationSections = (response: unknown): EvaluationSectionConfig[] => {
  const root = response as { data?: unknown; sections?: unknown } | undefined;
  const outer = root?.data && typeof root.data === "object"
    ? root.data as { data?: unknown; sections?: unknown }
    : root;
  const payload = outer?.data && typeof outer.data === "object"
    ? outer.data as { sections?: unknown }
    : outer;
  const sections = payload?.sections;

  if (!Array.isArray(sections)) return [];

  return sections.filter((section): section is EvaluationSectionConfig => {
    if (!section || typeof section !== "object") return false;
    const value = section as Partial<EvaluationSectionConfig>;
    return typeof value.key === "string" &&
      typeof value.title === "string" &&
      Array.isArray(value.options);
  }).map((section) => ({
    ...section,
    options: section.options.filter((option): option is string => typeof option === "string"),
  }));
};

function unwrapRows<T>(response: ApiResponse<T[]>): T[] {
  const data = response?.data;

  if (Array.isArray(data)) return data;

  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;

    for (const key of ["items", "brands", "models"]) {
      if (Array.isArray(obj[key])) {
        return obj[key] as T[];
      }
    }
  }

  return [];
}

const getErrorMessage = (error: unknown) => {
  const e = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };

  return (
    e.response?.data?.message ||
    e.message ||
    "Something went wrong. Please try again."
  );
};

const money = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);

const getBrandId = (model: Model) =>
  typeof model.brand === "string"
    ? model.brand
    : model.brand?._id;

const getBrandName = (
  item: Catalog,
  brands: Brand[]
) =>
  brands.find(
    (brand) =>
      brand._id === item.brand ||
      brand.name === item.brand
  )?.name || item.brand;

const getModelName = (
  item: Catalog,
  models: Model[]
) =>
  models.find(
    (model) =>
      model._id === item.model ||
      model.name === item.model
  )?.name || item.model;

export default function Catalog() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [evaluationSections, setEvaluationSections] = useState<EvaluationSectionConfig[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingId, setProcessingId] =
    useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<"all" | "active" | "inactive">("all");

  const [currentPage, setCurrentPage] = useState(1);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Catalog | null>(null);
  const [deleteTarget, setDeleteTarget] =
    useState<Catalog | null>(null);
  const [deactivateTarget, setDeactivateTarget] =
    useState<Catalog | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const [brandId, setBrandId] = useState("");
  const [modelId, setModelId] = useState("");
  const [storage, setStorage] = useState("");
  const [ram, setRam] = useState("");
  const [valuationPrice, setValuationPrice] = useState("");
  const [agentCommission, setAgentCommission] = useState("0");
  const [active, setActive] = useState(true);

  const [rules, setRules] =
    useState<EvaluationRule[]>([]);

  const [expandedRule, setExpandedRule] =
    useState<string | null>("screenCondition");

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const [
        brandsResponse,
        modelsResponse,
        catalogResponse,
        evaluationResponse,
      ] = await Promise.all([
        api.get<ApiResponse<Brand[]>>("/brands"),
        api.get<ApiResponse<Model[]>>("/models"),
        api.get<ApiResponse<Catalog[]>>("/device-catalog/all"),
        api.get("/device-catalog/evaluation/default"),
      ]);

      setBrands(unwrapRows<Brand>(brandsResponse.data));
      setModels(unwrapRows<Model>(modelsResponse.data));
      setCatalogs(unwrapRows<Catalog>(catalogResponse.data));
      setEvaluationSections(unwrapEvaluationSections(evaluationResponse.data));
    } catch (error) {
      setNotice({
        type: "error",
        text: getErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!notice) return;

    const timeout = window.setTimeout(
      () => setNotice(null),
      4500
    );

    return () => window.clearTimeout(timeout);
  }, [notice]);

  // RESET TO FIRST PAGE WHEN SEARCH OR FILTER CHANGES
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const availableModels = useMemo(
    () =>
      models.filter(
        (model) =>
          model.active &&
          getBrandId(model) === brandId
      ),
    [models, brandId]
  );

  const filteredCatalogs = useMemo(() => {
    const term = search.trim().toLowerCase();

    return catalogs.filter((item) => {
      const searchableText = [
        getBrandName(item, brands),
        getModelName(item, models),
        item.storage,
        item.ram,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !term || searchableText.includes(term);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && item.active) ||
        (statusFilter === "inactive" && !item.active);

      return matchesSearch && matchesStatus;
    });
  }, [catalogs, brands, models, search, statusFilter]);

  // PAGINATION
  const totalPages = Math.max(
    1,
    Math.ceil(filteredCatalogs.length / ITEMS_PER_PAGE)
  );

  const paginatedCatalogs = filteredCatalogs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const activeCount =
    catalogs.filter((item) => item.active).length;

  const resetForm = () => {
    setBrandId("");
    setModelId("");
    setStorage("");
    setRam("");
    setValuationPrice("");
    setAgentCommission("0");
    setActive(true);
    setRules(createRules(evaluationSections));
    setExpandedRule(evaluationSections[0]?.key ?? null);
  };

  const openCreate = () => {
    setEditing(null);
    resetForm();
    setFormOpen(true);
  };

  const openEdit = (item: Catalog) => {
    setEditing(item);

    const selectedBrand = brands.find(
      (brand) =>
        brand._id === item.brand ||
        brand.name === item.brand
    );

    const selectedModel = models.find(
      (model) =>
        model._id === item.model ||
        model.name === item.model
    );

    setBrandId(selectedBrand?._id || "");
    setModelId(selectedModel?._id || "");
    setStorage(item.storage || "");
    setRam(item.ram || "");
    setValuationPrice(String(item.valuationPrice ?? ""));
    setAgentCommission(String(item.agentCommission ?? 0));
    setActive(item.active);

    const existing = item.conditionDeductions || [];
    setRules(createRules(evaluationSections, existing, item.evaluationConfig));

    setExpandedRule(evaluationSections[0]?.key ?? null);
    setFormOpen(true);
  };

  const updateRule = (
    sectionKey: string,
    option: string,
    changes: Partial<DeductionOption>
  ) => {
    setRules((current) =>
      current.map((section) =>
        section.key !== sectionKey
          ? section
          : {
              ...section,
              options: section.options.map((item) =>
                item.option === option
                  ? { ...item, ...changes }
                  : item
              ),
            }
      )
    );
  };

  const enabledDeductionTotal = rules.reduce(
    (sum, section) =>
      sum +
      section.options.reduce(
        (total, option) =>
          total +
          (option.active ? Number(option.amount || 0) : 0),
        0
      ),
    0
  );

  const saveCatalog = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!brandId || !modelId) {
      setNotice({
        type: "error",
        text: "Please select both a brand and a model.",
      });
      return;
    }

    const price = Number(valuationPrice);
    const commission = Number(agentCommission);

    if (
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isFinite(commission) ||
      commission < 0
    ) {
      setNotice({
        type: "error",
        text: "Enter valid non-negative price and commission amounts.",
      });
      return;
    }

    const selectedBrand = brands.find(
      (brand) => brand._id === brandId
    );

    const selectedModel = models.find(
      (model) => model._id === modelId
    );

    if (!selectedBrand || !selectedModel) {
      setNotice({
        type: "error",
        text: "The selected brand or model is unavailable.",
      });
      return;
    }

    const conditionDeductions = rules.flatMap(
      (section) =>
        section.options.map((option) => ({
          name: option.option,
          amount: Number(option.amount),
          active: option.active,
        }))
    );

    const payload = {
      brand: selectedBrand.name,
      brandImage: selectedBrand.image || "",
      model: selectedModel.name,
      modelImage: selectedModel.image || "",
      storage: storage.trim(),
      ram: ram.trim(),
      valuationPrice: price,
      agentCommission: commission,
      active,
      conditionDeductions,
      evaluationConfig: Object.fromEntries(
        rules.map((section) => [
          section.key,
          {
            enabled: section.enabled ?? true,
            options: section.options.map((option) => option.option),
            ...(section.allowMultiple !== undefined
              ? { allowMultiple: section.allowMultiple }
              : {}),
            ...(section.inputType ? { inputType: section.inputType } : {}),
          },
        ])
      ),
    };

    setSaving(true);

    try {
      if (editing) {
        await api.patch(
          `/device-catalog/${editing._id}`,
          payload
        );

        setNotice({
          type: "success",
          text: "Device catalog updated successfully.",
        });
      } else {
        await api.post("/device-catalog", payload);

        setNotice({
          type: "success",
          text: "Device catalog created successfully.",
        });
      }

      setFormOpen(false);
      setEditing(null);
      resetForm();
      setCurrentPage(1);
      await loadData();
    } catch (error) {
      setNotice({
        type: "error",
        text: getErrorMessage(error),
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (item: Catalog, nextActive: boolean) => {
    setProcessingId(item._id);

    try {
      await api.patch(`/device-catalog/${item._id}`, { active: nextActive });

      setCatalogs((current) =>
        current.map((row) =>
          row._id === item._id ? { ...row, active: nextActive } : row
        )
      );

      if (!nextActive) setDeactivateTarget(null);
      setNotice({
        type: "success",
        text: nextActive
          ? "Device variant activated."
          : "Device variant deactivated.",
      });
    } catch (error) {
      setNotice({ type: "error", text: getErrorMessage(error) });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeactivate = async () => {
    // Deactivation is only allowed through the explicit confirmation modal.
    if (!deactivateTarget || !deactivateTarget.active) return;
    await toggleStatus(deactivateTarget, false);
  };

  const deleteCatalog = async () => {
    if (!deleteTarget) return;

    setDeleting(true);

    try {
      await api.delete(
        `/device-catalog/${deleteTarget._id}`
      );

      setCatalogs((current) =>
        current.filter(
          (item) => item._id !== deleteTarget._id
        )
      );

      setDeleteTarget(null);

      setNotice({
        type: "success",
        text: "Device catalog entry deleted.",
      });
    } catch (error) {
      setNotice({
        type: "error",
        text: getErrorMessage(error),
      });
    } finally {
      setDeleting(false);
    }
  };

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 text-sm text-stone-800 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-50";

  const labelClass =
    "block text-sm font-semibold text-stone-700";

  return (
    <div className="min-h-full space-y-6 pb-10">
      {/* PAGE HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600">
              <Smartphone size={19} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              Device Catalog
            </h1>
          </div>
          <p className="mt-1 text-sm text-stone-500">
            Manage model storage options, pricing and evaluation deductions.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          disabled={
            !brands.some((brand) => brand.active) ||
            !models.some((model) => model.active)
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={18} />
          Add catalog entry
        </button>
      </div>

      {/* NOTIFICATION */}
      {notice && (
        <div
          role="status"
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
            notice.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {notice.type === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}

          <span className="flex-1">{notice.text}</span>

          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* SUMMARY */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          {
            title: "Total entries",
            value: catalogs.length,
            tone: "text-stone-900",
          },
          {
            title: "Active entries",
            value: activeCount,
            tone: "text-emerald-700",
          },
          {
            title: "Inactive entries",
            value: catalogs.length - activeCount,
            tone: "text-stone-500",
          },
        ].map((stat) => (
          <div
            key={stat.title}
            className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-semibold text-stone-500">
              {stat.title}
            </p>

            <p className={`mt-3 text-3xl font-bold ${stat.tone}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* CATALOG TABLE */}
      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-stone-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-stone-900">
              Catalog entries
            </h2>

            <p className="mt-1 text-xs text-stone-500">
              {filteredCatalogs.length} result(s)
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search catalog..."
                className="w-full rounded-xl border border-stone-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-orange-400 sm:w-64"
              />
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as
                      | "all"
                      | "active"
                      | "inactive"
                  )
                }
                aria-label="Filter by status"
                className="h-10 w-full appearance-none rounded-xl border border-stone-200 bg-white pl-3 pr-9 text-sm outline-none focus:border-orange-400 focus:ring-3 focus:ring-orange-500/10"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <ChevronDown
                size={15}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-500"
              />
            </div>

            <button
              type="button"
              onClick={() => void loadData()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-50"
            >
              <RefreshCw
                size={15}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="bg-stone-50">
              <tr className="text-xs font-bold uppercase tracking-wide text-stone-500">
                <th className="px-5 py-3.5">Device</th>
                <th className="px-5 py-3.5">Storage</th>
                <th className="px-5 py-3.5">RAM</th>
                <th className="px-5 py-3.5">Base price</th>
                <th className="px-5 py-3.5">Commission</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-16 text-center text-sm text-stone-500"
                  >
                    <RefreshCw
                      size={22}
                      className="mx-auto animate-spin text-orange-500"
                    />

                    <p className="mt-3">Loading catalog...</p>
                  </td>
                </tr>
              ) : paginatedCatalogs.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-16 text-center"
                  >
                    <Smartphone
                      size={25}
                      className="mx-auto text-stone-400"
                    />

                    <p className="mt-3 font-semibold text-stone-800">
                      No catalog entries found
                    </p>

                    <p className="mt-1 text-sm text-stone-500">
                      Add an entry or change your search.
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedCatalogs.map((item) => (
                  <tr
                    key={item._id}
                    className="transition hover:bg-orange-50/30"
                  >
                    <td className="px-5 py-3">
                      <p className="font-semibold text-stone-900">
                        {getModelName(item, models)}
                      </p>

                      <p className="mt-0.5 text-xs text-stone-500">
                        {getBrandName(item, brands)}
                      </p>
                    </td>

                    <td className="px-5 py-3 text-sm text-stone-700">
                      {item.storage || "—"}
                    </td>

                    <td className="px-5 py-3 text-sm text-stone-700">
                      {item.ram || "—"}
                    </td>

                    <td className="px-5 py-3 font-bold text-stone-900">
                      {money(item.valuationPrice)}
                    </td>

                    <td className="px-5 py-3 text-sm font-medium text-stone-700">
                      {money(item.agentCommission)}
                    </td>

                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          item.active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-stone-100 text-stone-500"
                        }`}
                      >
                        {item.active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(item)}
                          title="Edit entry"
                          className="rounded-lg p-2 text-stone-500 hover:bg-orange-50 hover:text-orange-600"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (item.active) {
                              setDeactivateTarget(item);
                            } else {
                              void toggleStatus(item, true);
                            }
                          }}
                          disabled={processingId === item._id}
                          title={
                            item.active ? "Deactivate" : "Activate"
                          }
                          className="rounded-lg p-2 text-amber-600 hover:bg-amber-50 disabled:opacity-50"
                        >
                          {processingId === item._id ? (
                            <RefreshCw
                              size={16}
                              className="animate-spin"
                            />
                          ) : (
                            <Ban size={16} />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteTarget(item)}
                          title="Delete permanently"
                          className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex flex-col gap-3 border-t border-stone-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-sm text-stone-500">
            Showing{" "}
            {filteredCatalogs.length === 0
              ? 0
              : (currentPage - 1) * ITEMS_PER_PAGE + 1}
            {" "}–{" "}
            {Math.min(
              currentPage * ITEMS_PER_PAGE,
              filteredCatalogs.length
            )}{" "}
            of {filteredCatalogs.length} items
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setCurrentPage((page) => Math.max(1, page - 1))
              }
              disabled={currentPage === 1}
              className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>

            <span className="min-w-24 text-center text-sm font-medium text-stone-700">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() =>
                setCurrentPage((page) =>
                  Math.min(totalPages, page + 1)
                )
              }
              disabled={currentPage === totalPages}
              className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {/* CENTERED MODAL */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-stone-950/50 p-3 backdrop-blur-[2px] sm:p-6">
          <div className="my-auto flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-stone-100 px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-orange-600">
                  Device catalog
                </p>

                <h2 className="mt-1 text-xl font-bold text-stone-900">
                  {editing
                    ? "Edit catalog entry"
                    : "Add catalog entry"}
                </h2>

                <p className="mt-1 text-sm text-stone-500">
                  Select the model and configure its storage, pricing and deductions.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setFormOpen(false)}
                disabled={saving}
                className="rounded-xl p-2 text-stone-500 hover:bg-stone-100"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={saveCatalog}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5 sm:px-6">
                {/* DEVICE DETAILS */}
                <section>
                  <h3 className="mb-4 flex items-center gap-2 font-bold text-stone-900">
                    <Smartphone
                      size={18}
                      className="text-orange-500"
                    />
                    Device details
                  </h3>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className={labelClass}>
                      Brand *
                      <div className="relative">
                        <select
                          required
                          value={brandId}
                          onChange={(event) => {
                            setBrandId(event.target.value);
                            setModelId("");
                          }}
                          className={`${inputClass} appearance-none pr-10`}
                        >
                          <option value="">Select brand</option>

                          {brands
                            .filter((brand) => brand.active)
                            .map((brand) => (
                              <option
                                key={brand._id}
                                value={brand._id}
                              >
                                {brand.name}
                              </option>
                            ))}
                        </select>
                        <ChevronDown
                          size={15}
                          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-500"
                        />
                      </div>
                    </label>

                    <label className={labelClass}>
                      Model *
                      <div className="relative">
                        <select
                          required
                          value={modelId}
                          onChange={(event) =>
                            setModelId(event.target.value)
                          }
                          disabled={!brandId}
                          className={`${inputClass} appearance-none pr-10`}
                        >
                          <option value="">Select model</option>

                          {availableModels.map((model) => (
                            <option
                              key={model._id}
                              value={model._id}
                            >
                              {model.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={15}
                          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-500"
                        />
                      </div>
                    </label>

                    <label className={labelClass}>
                      Storage
                      <input
                        value={storage}
                        onChange={(event) =>
                          setStorage(event.target.value)
                        }
                        placeholder="e.g. 256GB"
                        className={inputClass}
                      />
                    </label>

                    <label className={labelClass}>
                      RAM
                      <input
                        value={ram}
                        onChange={(event) =>
                          setRam(event.target.value)
                        }
                        placeholder="e.g. 8GB"
                        className={inputClass}
                      />
                    </label>
                  </div>
                </section>

                {/* PRICING */}
                <section className="border-t border-stone-100 pt-5">
                  <h3 className="mb-4 flex items-center gap-2 font-bold text-stone-900">
                    <IndianRupee
                      size={18}
                      className="text-orange-500"
                    />
                    Valuation and commission
                  </h3>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className={labelClass}>
                      Base valuation price (₹) *
                      <input
                        required
                        type="number"
                        min="0"
                        step="1"
                        value={valuationPrice}
                        onChange={(event) =>
                          setValuationPrice(event.target.value)
                        }
                        placeholder="25000"
                        className={`${inputClass} appearance-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                      />
                    </label>

                    <label className={labelClass}>
                      Agent commission (₹) *
                      <input
                        required
                        type="number"
                        min="0"
                        step="1"
                        value={agentCommission}
                        onChange={(event) =>
                          setAgentCommission(event.target.value)
                        }
                        className={`${inputClass} appearance-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                      />
                    </label>
                  </div>
                </section>

                {/* CONDITION DEDUCTIONS */}
                <section className="border-t border-stone-100 pt-5">
                  <div className="mb-4">
                    <h3 className="flex items-center gap-2 font-bold text-stone-900">
                      <Settings2
                        size={18}
                        className="text-orange-500"
                      />
                      Evaluation deductions
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-stone-500">
                      Configure the amount to deduct when an applicable issue is selected or an accessory is missing.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {rules.map((section) => {
                      const expanded =
                        expandedRule === section.key;

                      const configured = section.options.filter(
                        (option) =>
                          option.active && option.amount > 0
                      ).length;

                      return (
                        <div
                          key={section.key}
                          className="overflow-hidden rounded-xl border border-stone-200"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedRule(
                                expanded ? null : section.key
                              )
                            }
                            className="flex w-full items-center justify-between gap-3 bg-stone-50 px-4 py-3 text-left hover:bg-orange-50/50"
                          >
                            <span>
                              <span className="block text-sm font-bold text-stone-800">
                                {section.title}
                              </span>

                              <span className="mt-0.5 block text-xs text-stone-500">
                                {configured} option(s) with deductions
                              </span>
                            </span>

                            {expanded ? (
                              <ChevronUp size={17} />
                            ) : (
                              <ChevronDown size={17} />
                            )}
                          </button>

                          {expanded && (
                            <div className="divide-y divide-stone-100">
                              {section.options.map((option) => (
                                <div
                                  key={option.option}
                                  className="grid grid-cols-1 items-center gap-3 px-4 py-3 sm:grid-cols-[1fr_125px_105px]"
                                >
                                  <span className="text-sm text-stone-700">
                                    {section.key === "accessories"
                                      ? `Missing: ${option.option}`
                                      : option.option}
                                  </span>

                                  <label>
                                    <span className="sr-only">
                                      Deduction for {option.option}
                                    </span>

                                    <div className="relative">
                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-stone-400">
                                        ₹
                                      </span>

                                      <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={option.amount === 0 ? "" : String(option.amount)}
                                        onChange={(event) => {
                                          const rawValue = event.target.value;
                                          updateRule(
                                            section.key,
                                            option.option,
                                            {
                                              // Keep zero visually empty while the user edits,
                                              // so Backspace can clear the field completely.
                                              amount: rawValue === "" ? 0 : Math.max(0, Number(rawValue) || 0),
                                            }
                                          );
                                        }}
                                        className="w-full appearance-none [appearance:textfield] rounded-lg border border-stone-200 py-2 pl-7 pr-2 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                      />
                                    </div>
                                  </label>

                                  <label className="flex items-center gap-2 text-xs font-medium text-stone-600">
                                    <input
                                      type="checkbox"
                                      checked={option.active}
                                      onChange={(event) =>
                                        updateRule(
                                          section.key,
                                          option.option,
                                          {
                                            active:
                                              event.target.checked,
                                          }
                                        )
                                      }
                                      className="h-4 w-4 rounded accent-orange-500"
                                    />
                                    Enabled
                                  </label>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 rounded-xl border border-orange-100 bg-orange-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-stone-700">
                        Total enabled deduction rules
                      </span>

                      <span className="font-bold text-orange-700">
                        {money(enabledDeductionTotal)}
                      </span>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-3 border-t border-orange-100 pt-3">
                      <span className="text-sm text-stone-600">
                        Illustrative remaining value
                      </span>

                      <span className="font-bold text-stone-900">
                        {money(
                          Math.max(
                            0,
                            Number(valuationPrice || 0) -
                              enabledDeductionTotal
                          )
                        )}
                      </span>
                    </div>

                    <p className="mt-2 text-xs leading-5 text-stone-500">
                      Preview only. At evaluation time, only the deductions for selected issues and missing accessories should be applied.
                    </p>
                  </div>
                </section>

                {/* STATUS */}
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-stone-200 p-4">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(event) =>
                      setActive(event.target.checked)
                    }
                    className="mt-1 h-4 w-4 accent-orange-500"
                  />

                  <span>
                    <span className="block text-sm font-semibold text-stone-800">
                      Active catalog entry
                    </span>

                    <span className="mt-1 block text-xs text-stone-500">
                      Inactive entries won't be available for new evaluations.
                    </span>
                  </span>
                </label>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-stone-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  disabled={saving}
                  className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
                >
                  {saving && (
                    <RefreshCw
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  {saving
                    ? "Saving..."
                    : editing
                      ? "Save changes"
                      : "Create catalog entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEACTIVATION CONFIRMATION */}
      {deactivateTarget && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-stone-950/45 p-3 backdrop-blur-[3px] sm:p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !processingId) {
              setDeactivateTarget(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="deactivate-catalog-title"
            className="my-auto w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-4 shadow-[0_24px_80px_rgba(28,25,23,0.24)] sm:p-5"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-orange-600">
              <Ban size={20} />
            </div>
            <h2 id="deactivate-catalog-title" className="mt-4 text-base font-bold text-stone-900">
              Deactivate {getModelName(deactivateTarget, models)}?
            </h2>
            <p className="mt-2 text-sm leading-5 text-stone-500">
              This catalog entry will no longer be available for new selections. You can reactivate it later.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setDeactivateTarget(null)}
                disabled={processingId === deactivateTarget._id}
                className="flex-1 rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDeactivate()}
                disabled={processingId === deactivateTarget._id}
                className="flex-1 rounded-xl bg-orange-500 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processingId === deactivateTarget._id ? "Deactivating..." : "Deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-950/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
              <Trash2 size={21} />
            </div>

            <h2 className="mt-4 text-lg font-bold text-stone-900">
              Delete catalog entry?
            </h2>

            <p className="mt-2 text-sm leading-6 text-stone-500">
              This permanently deletes this catalog entry.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-700"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void deleteCatalog()}
                disabled={deleting}
                className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
