import { useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import ImageInput from "@/components/admin/ImageInput";
import { api, formatApiErrorDetail } from "@/lib/api";

const EMPTY = {
  name: "",
  slug: "",
  description: "",
  image: "",
  parent_slug: "",
  order: 0,
  seo: { seo_title: "", meta_description: "", noindex: false, og_image: "" },
};

function Editor({ initial, categories, onDone, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY, ...initial });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setSeo = (k, v) => setForm((f) => ({ ...f, seo: { ...f.seo, [k]: v } }));

  const save = async () => {
    if (!form.name || form.name.trim().length < 2) {
      toast.error("Inserisci un nome della categoria");
      return;
    }
    setSaving(true);
    try {
      if (form.id) {
        await api.put(`/admin/categories/${form.id}`, form);
        toast.success("Categoria aggiornata");
      } else {
        await api.post("/admin/categories", form);
        toast.success("Categoria creata");
      }
      onDone();
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto overscroll-contain bg-black/40 p-4 backdrop-blur-sm" data-lenis-prevent data-testid="admin-category-editor">
      <div className="mx-auto my-12 max-w-xl rounded-2xl border border-linegold bg-surface p-6 shadow-[0_40px_100px_rgba(25,28,34,0.30)] sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-char">{form.id ? `Modifica: ${form.name}` : "Nuova categoria"}</h2>
          <button onClick={onCancel} className="rounded-full border border-line p-2 text-slate-500 hover:border-gold hover:text-gold-deep" aria-label="Chiudi editor" data-testid="admin-category-editor-close">
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="field-label">Nome *</label>
            <input className="field" value={form.name} onChange={(e) => set("name", e.target.value)} data-testid="admin-category-name" />
          </div>
          <div>
            <label className="field-label">Slug (vuoto = automatico)</label>
            <input className="field" value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="es. coppe-trofei" data-testid="admin-category-slug" />
          </div>
          <div>
            <label className="field-label">Categoria padre (per le sottocategorie)</label>
            <select className="field" value={form.parent_slug} onChange={(e) => set("parent_slug", e.target.value)} data-testid="admin-category-parent">
              <option value="">— Nessuna (categoria principale) —</option>
              {categories.filter((c) => !c.parent_slug && c.id !== form.id).map((c) => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Descrizione</label>
            <textarea className="field resize-y" rows={2} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>
          <ImageInput label="Immagine categoria" value={form.image} onChange={(v) => set("image", v)} />
          <div>
            <label className="field-label">Ordine di visualizzazione</label>
            <input type="number" className="field" value={form.order} onChange={(e) => set("order", parseInt(e.target.value || "0", 10))} />
          </div>
          <div>
            <label className="field-label">Titolo SEO</label>
            <input className="field" maxLength={70} value={form.seo.seo_title} onChange={(e) => setSeo("seo_title", e.target.value)} />
          </div>
          <div>
            <label className="field-label">Meta description SEO</label>
            <input className="field" maxLength={180} value={form.seo.meta_description} onChange={(e) => setSeo("meta_description", e.target.value)} />
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button onClick={onCancel} className="btn-ghost !px-5 !py-2.5 !text-xs" data-testid="admin-category-cancel">Annulla</button>
          <button onClick={save} disabled={saving} className="btn-gold !px-6 !py-2.5 !text-xs disabled:opacity-60" data-testid="admin-category-save">
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            {saving ? "Salvataggio…" : "Salva categoria"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminCategories() {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);

  const load = () => {
    api.get("/admin/categories").then((r) => setItems(r.data.items || [])).catch(() => toast.error("Impossibile caricare le categorie"));
  };

  useEffect(load, []);

  const remove = async (c) => {
    if (!window.confirm(`Eliminare la categoria "${c.name}"? I prodotti collegati resteranno nel catalogo senza categoria.`)) return;
    try {
      await api.delete(`/admin/categories/${c.id}`);
      toast.success("Categoria eliminata");
      load();
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
    }
  };

  return (
    <div data-testid="admin-categories">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-char">Categorie</h1>
          <p className="text-sm text-slate-600">{items.length} categorie, incluse le sottocategorie</p>
        </div>
        <button onClick={() => setEditing("new")} className="btn-gold !px-5 !py-2.5 !text-xs" data-testid="admin-category-new">
          <Plus size={15} /> Nuova categoria
        </button>
      </div>

      <div className="card-surface overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-line font-mono text-[10px] uppercase tracking-widest text-slate-500">
              <th className="px-5 py-3.5">Categoria</th>
              <th className="px-5 py-3.5">Padre</th>
              <th className="px-5 py-3.5">Ordine</th>
              <th className="px-5 py-3.5 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-b border-line/60 last:border-0 hover:bg-surface2/70" data-testid={`admin-category-row-${c.slug}`}>
                <td className="px-5 py-3.5">
                  <span className={`font-medium ${c.parent_slug ? "pl-5 text-slate-600" : "text-char"}`}>
                    {c.parent_slug ? "↳ " : ""}{c.name}
                  </span>
                  <span className="block font-mono text-[10px] text-slate-500">/{c.slug}</span>
                </td>
                <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{c.parent_slug || "—"}</td>
                <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{c.order}</td>
                <td className="px-5 py-3.5">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditing(c)} className="rounded-lg border border-line p-2 text-slate-600 hover:border-gold hover:text-gold-deep" aria-label={`Modifica ${c.name}`} data-testid={`admin-category-edit-${c.slug}`}>
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => remove(c)} className="rounded-lg border border-line p-2 text-slate-600 hover:border-red-500 hover:text-red-600" aria-label={`Elimina ${c.name}`} data-testid={`admin-category-delete-${c.slug}`}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-500">Nessuna categoria: creane una per organizzare il catalogo.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <Editor
          initial={editing === "new" ? {} : editing}
          categories={items}
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