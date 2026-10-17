import { useEffect, useState } from "react";
import { Eye, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import ImageInput from "@/components/admin/ImageInput";
import { api, formatApiErrorDetail } from "@/lib/api";

const EMPTY = {
  name: "",
  slug: "",
  code: "",
  short_description: "",
  full_description: "",
  category_slug: "",
  main_image: "",
  image_alt: "",
  gallery: [],
  materials: "",
  dimensions: "",
  colors: "",
  variants: "",
  specs: [],
  price: "",
  availability: "",
  customization_info: "",
  published: true,
  featured: false,
  is_demo: false,
  seo: { seo_title: "", meta_description: "", noindex: false, og_image: "" },
};

const F = ({ label, children }) => (
  <div>
    <label className="field-label">{label}</label>
    {children}
  </div>
);

function Editor({ initial, categories, onDone, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY, ...initial });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setSeo = (k, v) => setForm((f) => ({ ...f, seo: { ...f.seo, [k]: v } }));

  const save = async () => {
    if (!form.name || form.name.trim().length < 2) {
      toast.error("Inserisci un nome del prodotto (almeno 2 caratteri)");
      return;
    }
    setSaving(true);
    try {
      if (form.id) {
        await api.put(`/admin/products/${form.id}`, form);
        toast.success("Prodotto aggiornato");
      } else {
        await api.post("/admin/products", form);
        toast.success("Prodotto creato");
      }
      onDone();
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto overscroll-contain bg-black/40 p-4 backdrop-blur-sm" data-lenis-prevent data-testid="admin-product-editor">
      <div className="mx-auto my-8 mb-16 max-w-3xl rounded-2xl border border-linegold bg-surface p-6 shadow-[0_40px_100px_rgba(25,28,34,0.30)] sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-char">
            {form.id ? `Modifica: ${form.name}` : "Nuovo prodotto"}
          </h2>
          <button onClick={onCancel} className="rounded-full border border-line p-2 text-slate-500 hover:border-gold hover:text-gold-deep" aria-label="Chiudi editor" data-testid="admin-product-editor-close">
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <F label="Nome *">
            <input className="field" value={form.name} onChange={(e) => set("name", e.target.value)} data-testid="admin-product-name" />
          </F>
          <F label="Slug / URL (vuoto = automatico)">
            <input className="field" value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="es. coppa-aurea-classica" data-testid="admin-product-slug" />
          </F>
          <F label="Categoria">
            <select className="field" value={form.category_slug} onChange={(e) => set("category_slug", e.target.value)} data-testid="admin-product-category">
              <option value="">— Nessuna —</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.parent_slug ? `↳ ${c.name}` : c.name}
                </option>
              ))}
            </select>
          </F>
          <F label="Codice prodotto">
            <input className="field" value={form.code} onChange={(e) => set("code", e.target.value)} data-testid="admin-product-code" />
          </F>

          <div className="sm:col-span-2">
            <F label="Descrizione breve">
              <textarea className="field resize-y" rows={2} maxLength={400} value={form.short_description} onChange={(e) => set("short_description", e.target.value)} data-testid="admin-product-short-description" />
            </F>
          </div>
          <div className="sm:col-span-2">
            <F label="Descrizione completa">
              <textarea className="field resize-y" rows={5} value={form.full_description} onChange={(e) => set("full_description", e.target.value)} data-testid="admin-product-full-description" />
            </F>
          </div>

          <ImageInput label="Immagine principale" value={form.main_image} onChange={(v) => set("main_image", v)} />
          <F label="Testo alternativo immagine (alt)">
            <input className="field" value={form.image_alt} onChange={(e) => set("image_alt", e.target.value)} data-testid="admin-product-image-alt" />
          </F>

          <div className="sm:col-span-2">
            <label className="field-label">Galleria immagini</label>
            <div className="flex flex-col gap-3">
              {form.gallery.map((g, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="flex-1">
                    <ImageInput value={g} onChange={(v) => set("gallery", form.gallery.map((x, j) => (j === i ? v : x)))} />
                  </div>
                  <button
                    type="button"
                    onClick={() => set("gallery", form.gallery.filter((_, j) => j !== i))}
                    className="mt-1 rounded-lg border border-line p-2 text-slate-500 hover:border-red-500 hover:text-red-600"
                    aria-label={`Rimuovi immagine ${i + 1}`}
                    data-testid={`admin-product-gallery-remove-${i}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => set("gallery", [...form.gallery, ""])} className="btn-ghost self-start !px-4 !py-2 !text-xs" data-testid="admin-product-gallery-add">
                <Plus size={14} /> Aggiungi immagine
              </button>
            </div>
          </div>

          <F label="Materiali"><input className="field" value={form.materials} onChange={(e) => set("materials", e.target.value)} /></F>
          <F label="Dimensioni"><input className="field" value={form.dimensions} onChange={(e) => set("dimensions", e.target.value)} /></F>
          <F label="Colori"><input className="field" value={form.colors} onChange={(e) => set("colors", e.target.value)} /></F>
          <F label="Varianti"><input className="field" value={form.variants} onChange={(e) => set("variants", e.target.value)} /></F>
          <F label="Prezzo (solo se confermato)"><input className="field" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="Lascia vuoto se non previsto" /></F>
          <F label="Disponibilità (solo se gestita)"><input className="field" value={form.availability} onChange={(e) => set("availability", e.target.value)} /></F>

          <div className="sm:col-span-2">
            <F label="Informazioni sulla personalizzazione">
              <textarea className="field resize-y" rows={2} value={form.customization_info} onChange={(e) => set("customization_info", e.target.value)} />
            </F>
          </div>

          <div className="sm:col-span-2">
            <label className="field-label">Specifiche tecniche</label>
            <div className="flex flex-col gap-2">
              {form.specs.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <input className="field flex-1" placeholder="Etichetta (es. Materiale)" value={s.label} onChange={(e) => set("specs", form.specs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                  <input className="field flex-1" placeholder="Valore (es. Metallo dorato)" value={s.value} onChange={(e) => set("specs", form.specs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} />
                  <button type="button" onClick={() => set("specs", form.specs.filter((_, j) => j !== i))} className="rounded-lg border border-line px-3 text-slate-500 hover:border-red-500 hover:text-red-600" aria-label={`Rimuovi specifica ${i + 1}`}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => set("specs", [...form.specs, { label: "", value: "" }])} className="btn-ghost self-start !px-4 !py-2 !text-xs" data-testid="admin-product-specs-add">
                <Plus size={14} /> Aggiungi specifica
              </button>
            </div>
          </div>

          <F label="Titolo SEO"><input className="field" maxLength={70} value={form.seo.seo_title} onChange={(e) => setSeo("seo_title", e.target.value)} /></F>
          <F label="Meta description SEO"><input className="field" maxLength={180} value={form.seo.meta_description} onChange={(e) => setSeo("meta_description", e.target.value)} /></F>

          <div className="flex flex-wrap items-center gap-5 sm:col-span-2">
            {[
              ["published", "Pubblicato"],
              ["featured", "In evidenza"],
              ["is_demo", "Prodotto dimostrativo"],
            ].map(([k, label]) => (
              <label key={k} className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={form[k]} onChange={(e) => set(k, e.target.checked)} className="h-4 w-4 accent-[#C9A227]" data-testid={`admin-product-${k.replace("_", "-")}`} />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button onClick={onCancel} className="btn-ghost !px-5 !py-2.5 !text-xs" data-testid="admin-product-cancel">Annulla</button>
          <button onClick={save} disabled={saving} className="btn-gold !px-6 !py-2.5 !text-xs disabled:opacity-60" data-testid="admin-product-save">
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            {saving ? "Salvataggio…" : "Salva prodotto"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminProducts() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");

  const load = () => {
    api.get("/admin/products").then((r) => setItems(r.data.items || [])).catch(() => toast.error("Impossibile caricare i prodotti"));
  };

  useEffect(() => {
    load();
    api.get("/admin/categories").then((r) => setCategories(r.data.items || [])).catch(() => {});
  }, []);

  const remove = async (p) => {
    if (!window.confirm(`Eliminare definitivamente "${p.name}"? L'operazione non è reversibile.`)) return;
    try {
      await api.delete(`/admin/products/${p.id}`);
      toast.success("Prodotto eliminato");
      load();
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
    }
  };

  const togglePublish = async (p) => {
    try {
      await api.put(`/admin/products/${p.id}`, { ...p, published: !p.published });
      load();
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
    }
  };

  const filtered = items.filter((p) =>
    search ? `${p.name} ${p.code} ${p.category_slug}`.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <div data-testid="admin-products">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-char">Prodotti</h1>
          <p className="text-sm text-slate-600">{items.length} prodotti nel catalogo</p>
        </div>
        <div className="flex gap-3">
          <input className="field w-56" placeholder="Cerca…" value={search} onChange={(e) => setSearch(e.target.value)} data-testid="admin-products-search" />
          <button onClick={() => setEditing("new")} className="btn-gold !px-5 !py-2.5 !text-xs" data-testid="admin-product-new">
            <Plus size={15} /> Nuovo prodotto
          </button>
        </div>
      </div>

      <div className="card-surface overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-line font-mono text-[10px] uppercase tracking-widest text-slate-500">
              <th className="px-5 py-3.5">Prodotto</th>
              <th className="px-5 py-3.5">Categoria</th>
              <th className="px-5 py-3.5">Stato</th>
              <th className="px-5 py-3.5 text-right">Visite</th>
              <th className="px-5 py-3.5 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-line/60 last:border-0 hover:bg-surface2/70" data-testid={`admin-product-row-${p.slug}`}>
                <td className="px-5 py-3.5">
                  <span className="font-medium text-char">{p.name}</span>
                  <span className="block font-mono text-[10px] text-slate-500">/{p.slug}</span>
                </td>
                <td className="px-5 py-3.5 text-slate-600">{p.category_label || "—"}</td>
                <td className="px-5 py-3.5">
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => togglePublish(p)}
                      className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        p.published ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600" : "border-slate-400/50 bg-slate-400/10 text-slate-500"
                      }`}
                      data-testid={`admin-product-toggle-published-${p.slug}`}
                    >
                      {p.published ? "Pubblicato" : "Bozza"}
                    </button>
                    {p.featured && <span className="rounded-full border border-gold-deep/40 bg-gold/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold-deep">Evidenza</span>}
                    {p.is_demo && <span className="rounded-full border border-dashed border-gold-deep/50 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold-deep">Demo</span>}
                  </div>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <span className="inline-flex items-center gap-1 font-mono text-xs text-slate-500">
                    <Eye size={12} /> {p.views || 0}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditing(p)} className="rounded-lg border border-line p-2 text-slate-600 hover:border-gold hover:text-gold-deep" aria-label={`Modifica ${p.name}`} data-testid={`admin-product-edit-${p.slug}`}>
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => remove(p)} className="rounded-lg border border-line p-2 text-slate-600 hover:border-red-500 hover:text-red-600" aria-label={`Elimina ${p.name}`} data-testid={`admin-product-delete-${p.slug}`}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                  Nessun prodotto trovato. Creane uno nuovo o modifica la ricerca.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <Editor
          initial={editing === "new" ? {} : editing}
          categories={categories}
          onDone={() => {
            setEditing(null);
            load();
          }}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}