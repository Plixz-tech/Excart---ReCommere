import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Ban,
  Trash2,
  X,
  UploadCloud,
  RefreshCw,
  Smartphone,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Image as ImageIcon,
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
  createdAt?: string;
  updatedAt?: string;
};

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T | { models?: T; brands?: T; items?: T };
};

type Notice = { type: "success" | "error"; text: string };

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

function unwrapRows<T>(
  payload: ApiResponse<T[]>,
  key: "models" | "brands"
): T[] {
  const data = payload?.data;

  if (Array.isArray(data)) return data;

  if (data && typeof data === "object") {
    const rows =
      (data as Record<string, unknown>)[key] ??
      (data as Record<string, unknown>).items;

    if (Array.isArray(rows)) return rows as T[];
  }

  return [];
}

const getBrand = (model: Model) =>
  typeof model.brand === "object" && model.brand ? model.brand : null;

const getBrandId = (model: Model) =>
  typeof model.brand === "string" ? model.brand : model.brand?._id ?? "";

const getBrandName = (model: Model) =>
  getBrand(model)?.name || "Unknown brand";

export default function Models() {
  const [models, setModels] = useState<Model[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [name, setName] = useState("");
  const [brandId, setBrandId] = useState("");
  const [active, setActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  const [notice, setNotice] = useState<Notice | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Model | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Model | null>(null);
  const [processingAction, setProcessingAction] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const [modelsResponse, brandsResponse] = await Promise.all([
        api.get<ApiResponse<Model[]>>("/models?activeOnly=false"),
        api.get<ApiResponse<Brand[]>>("/brands?activeOnly=false"),
      ]);

      setModels(unwrapRows<Model>(modelsResponse.data, "models"));
      setBrands(unwrapRows<Brand>(brandsResponse.data, "brands"));
    } catch (error) {
      setNotice({ type: "error", text: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!notice) return;

    const timeout = window.setTimeout(() => setNotice(null), 4500);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    if (!imageFile) return;

    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  const filteredModels = useMemo(() => {
    const term = search.trim().toLowerCase();

    return models.filter((model) => {
      const matchesSearch =
        !term ||
        model.name.toLowerCase().includes(term) ||
        getBrandName(model).toLowerCase().includes(term);

      const matchesBrand =
        brandFilter === "all" || getBrandId(model) === brandFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && model.active) ||
        (statusFilter === "inactive" && !model.active);

      return matchesSearch && matchesBrand && matchesStatus;
    });
  }, [models, search, brandFilter, statusFilter]);

  const resetForm = () => {
    setEditingModel(null);
    setName("");
    setBrandId("");
    setActive(true);
    setImageFile(null);
    setImagePreview("");
    setFormOpen(false);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openCreate = () => {
    setEditingModel(null);
    setName("");
    setBrandId(brands.find((brand) => brand.active)?._id ?? "");
    setActive(true);
    setImageFile(null);
    setImagePreview("");
    setFormOpen(true);
  };

  const openEdit = (model: Model) => {
    setEditingModel(model);
    setName(model.name);
    setBrandId(getBrandId(model));
    setActive(model.active);
    setImageFile(null);
    setImagePreview(model.image || "");
    setFormOpen(true);
  };

  const handleFileChange = (file?: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setNotice({
        type: "error",
        text: "Please select a valid image file.",
      });

      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setNotice({
        type: "error",
        text: "Model image must be 2 MB or smaller.",
      });

      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setImageFile(file);
  };

  const handleSave = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const trimmedName = name.trim();

    if (trimmedName.length < 2 || trimmedName.length > 100) {
      setNotice({
        type: "error",
        text: "Model name must contain between 2 and 100 characters.",
      });
      return;
    }

    if (!brandId) {
      setNotice({ type: "error", text: "Please select a brand." });
      return;
    }

    setSaving(true);

    try {
      if (imageFile) {
        const body = new FormData();

        body.append("name", trimmedName);
        body.append("brand", brandId);
        body.append("active", String(active));
        body.append("image", imageFile);

        if (editingModel) {
          await api.patch(`/models/${editingModel._id}`, body, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        } else {
          await api.post("/models", body, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }
      } else if (editingModel) {
        await api.patch(`/models/${editingModel._id}`, {
          name: trimmedName,
          brand: brandId,
          active,
        });
      } else {
        await api.post("/models", {
          name: trimmedName,
          brand: brandId,
          active,
        });
      }

      setNotice({
        type: "success",
        text: editingModel
          ? "Model updated successfully."
          : "Model created successfully.",
      });

      resetForm();
      await loadData();
    } catch (error) {
      setNotice({ type: "error", text: getErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deactivateTarget) return;

    setProcessingAction(true);
    try {
      await api.delete(`/models/${deactivateTarget._id}`);
      setNotice({
        type: "success",
        text: `${deactivateTarget.name} deactivated successfully.`,
      });
      setDeactivateTarget(null);
      await loadData();
    } catch (error) {
      setNotice({ type: "error", text: getErrorMessage(error) });
    } finally {
      setProcessingAction(false);
    }
  };

  const handlePermanentDelete = async () => {
    if (!deleteTarget) return;

    setProcessingAction(true);
    try {
      await api.delete(`/models/${deleteTarget._id}/permanent`);
      setNotice({
        type: "success",
        text: `${deleteTarget.name} permanently deleted.`,
      });
      setDeleteTarget(null);
      await loadData();
    } catch (error) {
      setNotice({ type: "error", text: getErrorMessage(error) });
    } finally {
      setProcessingAction(false);
    }
  };

  const activeCount = models.filter((model) => model.active).length;
  const inactiveCount = models.length - activeCount;

  const actionButtonClass =
    "flex h-8 w-8 items-center justify-center rounded-lg transition disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="space-y-5 text-stone-800">
      {/* Page header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600">
              <Smartphone size={19} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              Models
            </h1>
          </div>
          <p className="mt-1 text-sm text-stone-500">
            Manage mobile models and link them to their brands.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          disabled={!brands.some((brand) => brand.active)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          <Plus size={17} />
          Add Model
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-[0_3px_14px_rgba(28,25,23,0.035)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Total models
          </p>
          <p className="mt-2 text-2xl font-bold text-stone-900">
            {models.length}
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-[0_3px_14px_rgba(28,25,23,0.035)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Active
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">
            {activeCount}
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-[0_3px_14px_rgba(28,25,23,0.035)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Inactive
          </p>
          <p className="mt-2 text-2xl font-bold text-stone-500">
            {inactiveCount}
          </p>
        </div>
      </div>

      {/* Notifications */}
      {notice && (
        <div
          role="status"
          className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
            notice.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
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

      {/* Models list */}
      <section className="min-w-0 overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-[0_3px_14px_rgba(28,25,23,0.035)]">
        <div className="flex flex-col gap-3 border-b border-stone-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-sm font-semibold text-stone-900">
              All models
            </h2>
            <p className="mt-0.5 text-sm text-stone-500">
              {filteredModels.length}{" "}
              {filteredModels.length === 1 ? "model" : "models"} found
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative block">
              <span className="sr-only">Search models</span>
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search models or brands..."
                className="h-10 w-full rounded-xl border border-stone-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-orange-400 focus:ring-3 focus:ring-orange-500/10 sm:w-56"
              />
            </label>

            <div className="relative">
              <select
                value={brandFilter}
                onChange={(event) => setBrandFilter(event.target.value)}
                aria-label="Filter by brand"
                className="h-10 w-full appearance-none rounded-xl border border-stone-200 bg-white pl-3 pr-9 text-sm outline-none focus:border-orange-400 focus:ring-3 focus:ring-orange-500/10"
              >
                <option value="all">All brands</option>
                {brands.map((brand) => (
                  <option key={brand._id} value={brand._id}>
                    {brand.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={15}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-stone-500"
              />
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as typeof statusFilter)
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
              title="Refresh models"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-stone-200 px-3 text-sm text-stone-600 transition hover:bg-stone-50"
            >
              <RefreshCw size={15} />
              <span className="sm:hidden">Refresh</span>
            </button>
          </div>
        </div>

        {/* Mobile cards */}
        <div className="space-y-3 p-4 sm:hidden">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-stone-500">
              <RefreshCw size={16} className="animate-spin" />
              Loading models…
            </div>
          ) : filteredModels.length === 0 ? (
            <div className="py-10 text-center">
              <Smartphone size={20} className="mx-auto text-stone-400" />
              <p className="mt-3 text-sm font-semibold text-stone-800">
                No models found
              </p>
              <p className="mt-1 text-sm text-stone-500">
                Try another search or add a model.
              </p>
            </div>
          ) : (
            filteredModels.map((model) => (
              <article
                key={model._id}
                className="rounded-xl border border-stone-200 p-3.5"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-stone-100 bg-stone-50">
                    {model.image ? (
                      <img
                        src={model.image}
                        alt={model.name}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <ImageIcon size={19} className="text-stone-300" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-semibold text-stone-800">
                      {model.name}
                    </p>
                    <p className="mt-0.5 text-xs text-stone-500">
                      {getBrandName(model)}
                    </p>
                    <span
                      className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        model.active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-stone-100 text-stone-500"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          model.active ? "bg-emerald-500" : "bg-stone-400"
                        }`}
                      />
                      {model.active ? "Active" : "Inactive"}
                    </span>
                    <p className="mt-2 text-xs text-stone-500">
                      Created {formatDate(model.createdAt)}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEdit(model)}
                      title={`Edit ${model.name}`}
                      aria-label={`Edit ${model.name}`}
                      className={`${actionButtonClass} border border-stone-200 text-stone-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600`}
                    >
                      <Pencil size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeactivateTarget(model)}
                      title={`Deactivate ${model.name}`}
                      aria-label={`Deactivate ${model.name}`}
                      disabled={!model.active}
                      className={`${actionButtonClass} border border-amber-100 bg-amber-50 text-amber-600 hover:bg-amber-100`}
                    >
                      <Ban size={14} />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeleteTarget(model)}
                      title={`Delete ${model.name}`}
                      aria-label={`Delete ${model.name}`}
                      className={`${actionButtonClass} border border-red-100 bg-red-50 text-red-500 hover:bg-red-100`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[800px] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-stone-50/90 text-xs font-semibold uppercase tracking-[0.06em] text-stone-500">
                <th className="w-12 px-5 py-3 sm:px-6">#</th>
                <th className="px-5 py-3 sm:px-6">Model</th>
                <th className="px-5 py-3 sm:px-6">Brand</th>
                <th className="px-5 py-3 sm:px-6">Status</th>
                <th className="px-5 py-3 sm:px-6">Created at</th>
                <th className="px-5 py-3 text-right sm:px-6">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-stone-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-14 text-center text-sm text-stone-500"
                  >
                    <span className="inline-flex items-center gap-2">
                      <RefreshCw size={16} className="animate-spin" />
                      Loading models…
                    </span>
                  </td>
                </tr>
              ) : filteredModels.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center">
                    <Smartphone
                      size={20}
                      className="mx-auto text-stone-400"
                    />
                    <p className="mt-3 text-sm font-semibold text-stone-800">
                      No models found
                    </p>
                    <p className="mt-1 text-sm text-stone-500">
                      Try another search or add a model.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredModels.map((model, index) => (
                  <tr
                    key={model._id}
                    className="transition-colors hover:bg-orange-50/30"
                  >
                    <td className="px-5 py-3.5 text-xs text-stone-400 sm:px-6">
                      {index + 1}
                    </td>

                    <td className="px-5 py-3.5 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-stone-100 bg-stone-50">
                          {model.image ? (
                            <img
                              src={model.image}
                              alt={model.name}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <ImageIcon
                              size={17}
                              className="text-stone-300"
                            />
                          )}
                        </div>
                        <span className="font-semibold text-stone-800">
                          {model.name}
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 text-stone-600 sm:px-6">
                      {getBrandName(model)}
                    </td>

                    <td className="px-5 py-3.5 sm:px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          model.active
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-stone-100 text-stone-500"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            model.active ? "bg-emerald-500" : "bg-stone-400"
                          }`}
                        />
                        {model.active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-stone-500 sm:px-6">
                      {formatDate(model.createdAt)}
                    </td>

                    <td className="px-5 py-3.5 sm:px-6">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(model)}
                          title={`Edit ${model.name}`}
                          aria-label={`Edit ${model.name}`}
                          className={`${actionButtonClass} border border-stone-200 text-stone-600 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600`}
                        >
                          <Pencil size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeactivateTarget(model)}
                          title={`Deactivate ${model.name}`}
                          aria-label={`Deactivate ${model.name}`}
                          disabled={!model.active}
                          className={`${actionButtonClass} border border-amber-100 bg-amber-50 text-amber-600 hover:bg-amber-100`}
                        >
                          <Ban size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteTarget(model)}
                          title={`Delete ${model.name}`}
                          aria-label={`Delete ${model.name}`}
                          className={`${actionButtonClass} border border-red-100 bg-red-50 text-red-500 hover:bg-red-100`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-1 border-t border-stone-100 bg-stone-50/50 px-5 py-3 text-xs text-stone-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>
            Showing {filteredModels.length} of {models.length} models
          </span>
          <span>{brands.length} brands available</span>
        </div>
      </section>

      {/* Create/Edit modal */}
      {formOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-stone-950/45 p-3 backdrop-blur-[3px] sm:p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              resetForm();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="model-form-title"
            className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-stone-200 bg-white shadow-[0_24px_80px_rgba(28,25,23,0.24)]"
          >
            <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
              <div>
                <h2
                  id="model-form-title"
                  className="text-lg font-bold text-stone-900"
                >
                  {editingModel ? "Edit Model" : "Add Model"}
                </h2>
                <p className="mt-0.5 text-sm text-stone-500">
                  {editingModel
                    ? "Update model details."
                    : "Add a model to your device catalog."}
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                aria-label="Close form"
                className="rounded-lg p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700 disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5 p-5">
              <div>
                <label
                  htmlFor="model-name"
                  className="mb-2 block text-sm font-semibold text-stone-700"
                >
                  Model name <span className="text-orange-600">*</span>
                </label>
                <input
                  id="model-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. iPhone 15 Pro"
                  minLength={2}
                  maxLength={100}
                  required
                  className="h-11 w-full rounded-xl border border-stone-200 px-3.5 text-sm outline-none transition placeholder:text-stone-400 focus:border-orange-400 focus:ring-3 focus:ring-orange-500/10"
                />
              </div>

              <div>
                <label
                  htmlFor="model-brand"
                  className="mb-2 block text-sm font-semibold text-stone-700"
                >
                  Brand <span className="text-orange-600">*</span>
                </label>

                <div className="relative">
                  <select
                    id="model-brand"
                    value={brandId}
                    onChange={(event) => setBrandId(event.target.value)}
                    required
                    className="h-11 w-full appearance-none rounded-xl border border-stone-200 bg-white pl-3.5 pr-11 text-sm outline-none transition focus:border-orange-400 focus:ring-3 focus:ring-orange-500/10"
                  >
                    <option value="">Select a brand</option>
                    {brands
                      .filter(
                        (brand) =>
                          brand.active || brand._id === brandId
                      )
                      .map((brand) => (
                        <option key={brand._id} value={brand._id}>
                          {brand.name}
                          {brand.active ? "" : " (Inactive)"}
                        </option>
                      ))}
                  </select>

                  <ChevronDown
                    size={17}
                    aria-hidden="true"
                    className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-600"
                  />
                </div>

                {brands.length === 0 && (
                  <p className="mt-1.5 text-xs text-amber-700">
                    Add a brand before creating a model.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-stone-700">
                  Model image{" "}
                  <span className="text-stone-400">(optional)</span>
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) =>
                    handleFileChange(event.target.files?.[0])
                  }
                />

                <div className="flex items-center gap-4 rounded-xl border border-dashed border-stone-300 bg-stone-50/70 p-3">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-stone-200 bg-white">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Model preview"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <ImageIcon size={24} className="text-stone-300" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-stone-700">
                      Upload model image
                    </p>
                    <p className="mt-0.5 text-xs text-stone-500">
                      PNG, JPG, WebP or another image format · max 2 MB
                    </p>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2 inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:border-orange-200 hover:bg-orange-50"
                    >
                      <UploadCloud size={14} />
                      Choose image
                    </button>

                    {imageFile && (
                      <p className="mt-1 truncate text-xs text-stone-500">
                        {imageFile.name}
                      </p>
                    )}
                  </div>

                  {imagePreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview("");
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                      className="self-start rounded-lg p-1.5 text-stone-400 hover:bg-stone-200 hover:text-stone-700"
                      aria-label="Remove image"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50/70 px-3.5 py-3">
                <div>
                  <p className="text-sm font-semibold text-stone-800">
                    Model status
                  </p>
                  <p className="mt-0.5 text-xs text-stone-500">
                    Inactive models won't be available for new selections.
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-label="Model status"
                  aria-checked={active}
                  onClick={() => setActive((value) => !value)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
                    active ? "bg-orange-500" : "bg-stone-300"
                  }`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                      active ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-stone-100 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving || !brands.some((brand) => brand._id === brandId)
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && (
                    <RefreshCw size={15} className="animate-spin" />
                  )}
                  {saving
                    ? "Saving…"
                    : editingModel
                      ? "Save changes"
                      : "Create model"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Deactivate confirmation */}
      {deactivateTarget && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-stone-950/45 p-4 backdrop-blur-[3px]" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !processingAction) setDeactivateTarget(null);
        }}>
          <section role="dialog" aria-modal="true" aria-labelledby="deactivate-model-title" className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-5 shadow-2xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600"><Ban size={20} /></div>
            <h2 id="deactivate-model-title" className="mt-4 text-base font-bold text-stone-900">Deactivate {deactivateTarget.name}?</h2>
            <p className="mt-2 text-sm leading-5 text-stone-500">This model won't be available for new selections. You can reactivate it later.</p>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setDeactivateTarget(null)} disabled={processingAction} className="flex-1 rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:opacity-50">Cancel</button>
              <button type="button" onClick={() => void handleDeactivate()} disabled={processingAction} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60">
                {processingAction && <RefreshCw size={15} className="animate-spin" />}{processingAction ? "Deactivating…" : "Deactivate"}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Permanent delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-stone-950/45 p-4 backdrop-blur-[3px]" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !processingAction) setDeleteTarget(null);
        }}>
          <section role="dialog" aria-modal="true" aria-labelledby="permanent-delete-model-title" className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-5 shadow-2xl">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-500"><Trash2 size={20} /></div>
            <h2 id="permanent-delete-model-title" className="mt-4 text-base font-bold text-stone-900">Permanently delete {deleteTarget.name}?</h2>
            <p className="mt-2 text-sm leading-5 text-stone-500">This can't be undone. You can only delete this model if it isn't used by the device catalog.</p>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setDeleteTarget(null)} disabled={processingAction} className="flex-1 rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:opacity-50">Cancel</button>
              <button type="button" onClick={() => void handlePermanentDelete()} disabled={processingAction} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60">
                {processingAction && <RefreshCw size={15} className="animate-spin" />}{processingAction ? "Deleting…" : "Delete permanently"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
