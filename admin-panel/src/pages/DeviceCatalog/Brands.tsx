import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Ban,
  X,
  UploadCloud,
  RefreshCw,
  Tags,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { api } from "../../api/axios";

type Brand = {
  _id: string;
  name: string;
  image?: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
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

const getErrorMessage = (error: unknown) => {
  const e = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return e.response?.data?.message || e.message || "Something went wrong. Please try again.";
};

export default function Brands() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [formOpen, setFormOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);
  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState<Brand | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadBrands = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<ApiResponse<Brand[]>>("/brands?activeOnly=false");
      const rows = Array.isArray(response.data?.data) ? response.data.data : [];
      setBrands(rows);
    } catch (error) {
      setNotice({ type: "error", text: getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBrands();
  }, [loadBrands]);

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

  const filteredBrands = useMemo(() => {
    const term = search.trim().toLowerCase();
    return brands.filter((brand) => {
      const matchesSearch = !term || brand.name.toLowerCase().includes(term);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && brand.active) ||
        (statusFilter === "inactive" && !brand.active);
      return matchesSearch && matchesStatus;
    });
  }, [brands, search, statusFilter]);

  const resetForm = () => {
    setEditingBrand(null);
    setName("");
    setActive(true);
    setImageFile(null);
    setImagePreview("");
    setFormOpen(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openCreate = () => {
    setEditingBrand(null);
    setName("");
    setActive(true);
    setImageFile(null);
    setImagePreview("");
    setFormOpen(true);
  };

  const openEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setName(brand.name);
    setActive(brand.active);
    setImageFile(null);
    setImagePreview(brand.image || "");
    setFormOpen(true);
  };

  const handleFileChange = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setNotice({ type: "error", text: "Please select a valid image file." });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setNotice({ type: "error", text: "Brand logo must be 2 MB or smaller." });
      return;
    }
    setImageFile(file);
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();

    if (trimmedName.length < 2) {
      setNotice({ type: "error", text: "Brand name must contain at least 2 characters." });
      return;
    }

    setSaving(true);
    try {
      if (imageFile) {
        const body = new FormData();
        body.append("name", trimmedName);
        body.append("active", String(active));
        body.append("image", imageFile);

        if (editingBrand) {
          await api.patch(`/brands/${editingBrand._id}`, body, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          setNotice({ type: "success", text: "Brand updated successfully." });
        } else {
          await api.post("/brands", body, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          setNotice({ type: "success", text: "Brand created successfully." });
        }
      } else if (editingBrand) {
        await api.patch(`/brands/${editingBrand._id}`, {
          name: trimmedName,
          active,
        });
        setNotice({ type: "success", text: "Brand updated successfully." });
      } else {
        await api.post("/brands", {
          name: trimmedName,
          active,
        });
        setNotice({ type: "success", text: "Brand created successfully." });
      }

      resetForm();
      await loadBrands();
    } catch (error) {
      setNotice({ type: "error", text: getErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/brands/${deleteTarget._id}`);
      setNotice({ type: "success", text: `${deleteTarget.name} has been deactivated.` });
      setDeleteTarget(null);
      await loadBrands();
    } catch (error) {
      setNotice({ type: "error", text: getErrorMessage(error) });
    }
  };

  const handlePermanentDelete = async () => {
    if (!permanentDeleteTarget) return;

    setDeleting(true);
    try {
      await api.delete(`/brands/${permanentDeleteTarget._id}/permanent`);
      setNotice({
        type: "success",
        text: `${permanentDeleteTarget.name} was permanently deleted.`,
      });
      setPermanentDeleteTarget(null);
      await loadBrands();
    } catch (error) {
      setNotice({ type: "error", text: getErrorMessage(error) });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5 text-stone-800">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600">
              <Tags size={19} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">Brands</h1>
          </div>
          <p className="mt-1 text-sm text-stone-500">
            Manage mobile brands used in the device catalog.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 sm:w-auto text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 active:scale-[0.98]"
        >
          <Plus size={17} />
          Add Brand
        </button>
      </div>

      {notice && (
        <div
          role="status"
          className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
            notice.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {notice.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="flex-1">{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss notification">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-5">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-[0_3px_14px_rgba(28,25,23,0.035)]">
          <div className="flex flex-col gap-3 border-b border-stone-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-sm font-semibold text-stone-900">All brands</h2>
              <p className="mt-0.5 text-sm text-stone-500">
                {filteredBrands.length} {filteredBrands.length === 1 ? "brand" : "brands"} found
              </p>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-row">
              <label className="relative block">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search brands..."
                  className="h-10 w-full rounded-xl border border-stone-200 bg-white pl-9 pr-3 text-sm outline-none transition focus:border-orange-400 focus:ring-3 focus:ring-orange-500/10 sm:w-52"
                />
              </label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
                className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none transition focus:border-orange-400 focus:ring-3 focus:ring-orange-500/10 sm:w-auto"
                aria-label="Filter by status"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <button
                type="button"
                onClick={() => void loadBrands()}
                title="Refresh brands"
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-stone-200 px-3 text-sm text-stone-600 transition hover:bg-stone-50 sm:w-auto"
              >
                <RefreshCw size={15} />
                <span className="sm:hidden">Refresh</span>
              </button>
            </div>
          </div>

          {/* Mobile layout: stacked cards avoid forcing a wide table onto small screens. */}
          <div className="space-y-3 p-4 sm:hidden">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-stone-500">
                <RefreshCw size={16} className="animate-spin" /> Loading brands…
              </div>
            ) : filteredBrands.length === 0 ? (
              <div className="py-10 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-100 text-stone-500"><Tags size={20} /></div>
                <p className="mt-3 text-sm font-semibold text-stone-800">No brands found</p>
                <p className="mt-1 text-sm text-stone-500">Try another search or add a new brand.</p>
              </div>
            ) : filteredBrands.map((brand) => (
              <article key={brand._id} className="rounded-xl border border-stone-200 p-3.5">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-stone-200 bg-white p-2 shadow-sm">
                    {brand.image ? (
                      <img
                        src={brand.image}
                        alt={`${brand.name} logo`}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span className="text-xs font-bold text-stone-500">
                        {brand.name.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-semibold text-stone-800">{brand.name}</p>
                    <span className={`mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${brand.active ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${brand.active ? "bg-emerald-500" : "bg-stone-400"}`} />
                      {brand.active ? "Active" : "Inactive"}
                    </span>
                    <p className="mt-2 text-xs text-stone-500">Created {formatDate(brand.createdAt)}</p>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <button type="button" onClick={() => openEdit(brand)} title={`Edit ${brand.name}`} aria-label={`Edit ${brand.name}`} className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 text-stone-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"><Pencil size={14} /></button>
                    <button type="button" onClick={() => setDeleteTarget(brand)} title={`Deactivate ${brand.name}`} aria-label={`Deactivate ${brand.name}`} disabled={!brand.active} className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-100 bg-amber-50 text-amber-600 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40"><Ban size={14} /></button>
                    <button type="button" onClick={() => setPermanentDeleteTarget(brand)} title={`Permanently delete ${brand.name}`} aria-label={`Permanently delete ${brand.name}`} className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-500 transition hover:bg-red-100"><Trash2 size={14} /></button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Desktop/tablet layout */}
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[620px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-stone-50/90 text-xs font-semibold uppercase tracking-[0.06em] text-stone-500">
                  <th className="w-12 px-5 py-3 sm:px-6">#</th>
                  <th className="px-5 py-3 sm:px-6">Brand</th>
                  <th className="px-5 py-3 sm:px-6">Logo</th>
                  <th className="px-5 py-3 sm:px-6">Status</th>
                  <th className="px-5 py-3 sm:px-6">Created at</th>
                  <th className="px-5 py-3 text-right sm:px-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {loading ? (
                  <tr><td colSpan={6} className="px-4 py-14 text-center text-sm text-stone-500">
                    <span className="inline-flex items-center gap-2"><RefreshCw size={16} className="animate-spin" /> Loading brands…</span>
                  </td></tr>
                ) : filteredBrands.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-14 text-center">
                      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-stone-100 text-stone-500"><Tags size={20} /></div>
                      <p className="mt-3 text-sm font-semibold text-stone-800">No brands found</p>
                      <p className="mt-1 text-sm text-stone-500">Try another search or add a new brand.</p>
                    </td>
                  </tr>
                ) : (
                  filteredBrands.map((brand, index) => (
                    <tr key={brand._id} className="transition-colors hover:bg-orange-50/30">
                      <td className="px-5 py-3.5 text-sm text-stone-500 sm:px-6">{index + 1}</td>
                      <td className="px-5 py-3.5 font-semibold text-stone-800 sm:px-6">{brand.name}</td>
                      <td className="px-5 py-3.5 sm:px-6">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-stone-200 bg-white p-2 shadow-sm">
                          {brand.image ? (
                            <img
                              src={brand.image}
                              alt={`${brand.name} logo`}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <span className="text-xs font-bold text-stone-500">
                              {brand.name.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 sm:px-6">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          brand.active ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${brand.active ? "bg-emerald-500" : "bg-stone-400"}`} />
                          {brand.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-stone-500 sm:px-6">{formatDate(brand.createdAt)}</td>
                      <td className="px-5 py-3.5 sm:px-6">
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEdit(brand)}
                            title={`Edit ${brand.name}`}
                            aria-label={`Edit ${brand.name}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 text-stone-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(brand)}
                            title={`Deactivate ${brand.name}`}
                            aria-label={`Deactivate ${brand.name}`}
                            disabled={!brand.active}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-100 bg-amber-50 text-amber-600 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Ban size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPermanentDeleteTarget(brand)}
                            title={`Permanently delete ${brand.name}`}
                            aria-label={`Permanently delete ${brand.name}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-red-500 transition hover:bg-red-100"
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
            <span>Showing {filteredBrands.length} of {brands.length} brands</span>
          </div>
        </section>

        {formOpen && (
          <div
            className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-stone-950/45 p-3 backdrop-blur-[3px] sm:p-4"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !saving) resetForm();
            }}
          >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="brand-form-title"
            className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-stone-200 bg-white shadow-[0_24px_80px_rgba(28,25,23,0.24)]"
          >
            <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
              <div>
                <h2 id="brand-form-title" className="text-lg font-bold text-stone-900">{editingBrand ? "Edit Brand" : "Add Brand"}</h2>
                <p className="mt-0.5 text-sm text-stone-500">{editingBrand ? "Update brand details." : "Add a brand to your device catalog."}</p>
              </div>
              <button type="button" onClick={resetForm} aria-label="Close form" className="rounded-lg p-2 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5 p-5">
              <div>
                <label htmlFor="brand-name" className="mb-2 block text-sm font-semibold text-stone-700">Brand name <span className="text-orange-600">*</span></label>
                <input
                  id="brand-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Apple"
                  maxLength={100}
                  required
                  className="h-11 w-full rounded-xl border border-stone-200 px-3.5 text-sm outline-none transition placeholder:text-stone-400 focus:border-orange-400 focus:ring-3 focus:ring-orange-500/10"
                />
              </div>

              <div>
                  <label className="mb-2 block text-sm font-semibold text-stone-700">Brand logo <span className="text-stone-400">(optional)</span></label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="sr-only"
                    onChange={(event) => handleFileChange(event.target.files?.[0])}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      handleFileChange(event.dataTransfer.files?.[0]);
                    }}
                    className="flex min-h-[132px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-stone-300 bg-stone-50/70 px-4 py-5 text-center transition hover:border-orange-400 hover:bg-orange-50/40"
                  >
                    {imagePreview ? (
                      <img src={imagePreview} alt="Brand logo preview" className="mb-2 h-14 max-w-32 object-contain" />
                    ) : (
                      <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600"><UploadCloud size={22} /></span>
                    )}
                    <span className="text-sm font-semibold text-stone-700">{imageFile ? imageFile.name : "Click to upload or drag and drop"}</span>
                    <span className="mt-1 text-xs text-stone-400">PNG, JPG, WEBP or SVG · Max 2 MB</span>
                  </button>
                  {imageFile && (
                    <button type="button" onClick={() => { setImageFile(null); setImagePreview(""); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="mt-2 text-xs font-medium text-orange-600 hover:text-orange-700">
                      Remove selected image
                    </button>
                  )}
              </div>

              <div className="flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50/70 px-3.5 py-3">
                <div>
                  <p className="text-sm font-semibold text-stone-800">Brand status</p>
                  <p className="mt-0.5 text-xs text-stone-500">Inactive brands won't be available for new selections.</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={active}
                  onClick={() => setActive((value) => !value)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ease-in-out ${active ? "bg-orange-500" : "bg-stone-300"}`}
                >
                  <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${active ? "translate-x-5" : "translate-x-0"}`} />
                </button>
              </div>

              <div className="flex gap-2 border-t border-stone-100 pt-4">
                <button type="button" onClick={resetForm} disabled={saving} className="flex-1 rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60">
                  {saving && <RefreshCw size={15} className="animate-spin" />}
                  {saving ? "Saving…" : editingBrand ? "Save Changes" : "Save Brand"}
                </button>
              </div>
            </form>
          </section>
          </div>
        )}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-stone-950/45 p-3 backdrop-blur-[2px] sm:p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDeleteTarget(null); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="deactivate-brand-title" className="my-auto w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-4 shadow-2xl sm:p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-500"><Trash2 size={20} /></div>
            <h2 id="deactivate-brand-title" className="mt-4 text-base font-bold text-stone-900">Deactivate {deleteTarget.name}?</h2>
            <p className="mt-2 text-sm leading-5 text-stone-500">This will mark the brand as inactive. Existing records are not deleted.</p>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setDeleteTarget(null)} className="flex-1 rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50">Cancel</button>
              <button type="button" onClick={() => void handleDeactivate()} className="flex-1 rounded-xl bg-red-500 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600">Deactivate</button>
            </div>
          </div>
        </div>
      )}

      {permanentDeleteTarget && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-stone-950/45 p-3 backdrop-blur-[2px] sm:p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deleting) {
              setPermanentDeleteTarget(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="permanent-delete-brand-title"
            className="my-auto w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-4 shadow-2xl sm:p-5"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-500">
              <Trash2 size={20} />
            </div>
            <h2 id="permanent-delete-brand-title" className="mt-4 text-base font-bold text-stone-900">
              Delete {permanentDeleteTarget.name} permanently?
            </h2>
            <p className="mt-2 text-sm leading-5 text-stone-500">
              This cannot be undone. If the brand is used by a model or catalog entry, the backend will prevent deletion.
            </p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setPermanentDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 rounded-xl border border-stone-200 px-3 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handlePermanentDelete()}
                disabled={deleting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting && <RefreshCw size={15} className="animate-spin" />}
                {deleting ? "Deleting…" : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
