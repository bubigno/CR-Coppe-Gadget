import { useEffect, useState } from "react";
import { ExternalLink, KeyRound, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import ImageInput from "@/components/admin/ImageInput";
import { api, formatApiErrorDetail, API } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

function PagesTab() {
  const [pages, setPages] = useState([]);
  const [slug, setSlug] = useState("chi-siamo");
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/admin/pages").then((r) => setPages(r.data.items || [])).catch(() => toast.error("Impossibile caricare le pagine"));
  }, []);

  useEffect(() => {
    if (pages.length > 0 && !pages.find((p) => p.slug === slug)) setSlug(pages[0].slug);
  }, [pages, slug]);

  useEffect(() => {
    const p = pages.find((x) => x.slug === slug);
    if (p) setForm({ title: p.title, hero_image: p.hero_image || "", blocks: p.blocks || [], seo: p.seo || {} });
  }, [pages, slug]);

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/pages/${slug}`, form);
      toast.success("Pagina aggiornata");
      const r = await api.get("/admin/pages");
      setPages(r.data.items || []);
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
    } finally {
      setSaving(false);
    }
  };

  if (!form) return <p className="text-sm text-slate-600">Caricamento pagina…</p>;

  const setBlock = (i, k, v) =>
    setForm((f) => ({ ...f, blocks: f.blocks.map((b, j) => (j === i ? { ...b, [k]: v } : b)) }));

  return (
    <div className="flex flex-col gap-6" data-testid="admin-pages">
      <div>
        <label className="field-label" htmlFor="page-select">Pagina da modificare</label>
        <select id="page-select" className="field max-w-sm" value={slug} onChange={(e) => setSlug(e.target.value)} data-testid="admin-pages-select">
          {pages.map((p) => (
            <option key={p.slug} value={p.slug}>/{p.slug}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="field-label" htmlFor="page-title">Titolo</label>
        <input id="page-title" className="field max-w-lg" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} data-testid="admin-pages-title" />
      </div>

      <ImageInput label="Immagine principale" value={form.hero_image} onChange={(v) => setForm((f) => ({ ...f, hero_image: v }))} />

      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="field-label">Sezioni di testo</label>
          <button onClick={() => setForm((f) => ({ ...f, blocks: [...f.blocks, { heading: "", text: "" }] }))} className="btn-ghost !px-4 !py-1.5 !text-xs" data-testid="admin-pages-block-add">
            <Plus size={13} /> Aggiungi sezione
          </button>
        </div>
        <div className="flex flex-col gap-4">
          {form.blocks.map((b, i) => (
            <div key={i} className="rounded-xl border border-line p-4" data-testid={`admin-pages-block-${i}`}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <input className="field flex-1" placeholder={`Titolo sezione ${i + 1}`} value={b.heading || ""} onChange={(e) => setBlock(i, "heading", e.target.value)} />
                <button
                  onClick={() => setForm((f) => ({ ...f, blocks: f.blocks.filter((_, j) => j !== i) }))}
                  className="rounded-lg border border-line p-2 text-slate-500 hover:border-red-500 hover:text-red-600"
                  aria-label={`Rimuovi sezione ${i + 1}`}
                  data-testid={`admin-pages-block-remove-${i}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <textarea className="field resize-y" rows={4} placeholder="Testo della sezione…" value={b.text || ""} onChange={(e) => setBlock(i, "text", e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label">Titolo SEO</label>
          <input className="field" maxLength={70} value={form.seo.seo_title || ""} onChange={(e) => setForm((f) => ({ ...f, seo: { ...f.seo, seo_title: e.target.value } }))} />
        </div>
        <div>
          <label className="field-label">Meta description SEO</label>
          <input className="field" maxLength={180} value={form.seo.meta_description || ""} onChange={(e) => setForm((f) => ({ ...f, seo: { ...f.seo, meta_description: e.target.value } }))} />
        </div>
      </div>

      <button onClick={save} disabled={saving} className="btn-gold self-start !px-6 !py-2.5 !text-xs disabled:opacity-60" data-testid="admin-pages-save">
        {saving ? <Loader2 size={14} className="animate-spin" /> : null}
        {saving ? "Salvataggio…" : "Salva pagina"}
      </button>
    </div>
  );
}

function HomeTab({ settings, reloadSettings }) {
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => setForm(settings), [settings]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/admin/settings", form);
      toast.success("Home aggiornata: i testi in inglese verranno ritradotti automaticamente");
      reloadSettings();
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl" data-testid="admin-home">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="field-label" htmlFor="home-hero-title">Titolo hero (una riga per linea)</label>
          <textarea id="home-hero-title" className="field resize-y" rows={2} value={form.hero_title || ""} onChange={(e) => set("hero_title", e.target.value)} data-testid="admin-home-hero-title" />
        </div>
        <div>
          <label className="field-label" htmlFor="home-hero-sub">Sottotitolo hero</label>
          <textarea id="home-hero-sub" className="field resize-y" rows={2} value={form.hero_subtitle || ""} onChange={(e) => set("hero_subtitle", e.target.value)} data-testid="admin-home-hero-subtitle" />
        </div>
        <div>
          <label className="field-label" htmlFor="home-about">Testo breve presentazione (homepage)</label>
          <textarea id="home-about" className="field resize-y" rows={3} value={form.about_short || ""} onChange={(e) => set("about_short", e.target.value)} data-testid="admin-home-about-short" />
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-500">La versione inglese di questi testi viene generata automaticamente.</p>
      <button onClick={save} disabled={saving} className="btn-gold mt-4 !px-6 !py-2.5 !text-xs disabled:opacity-60" data-testid="admin-home-save">
        {saving ? <Loader2 size={14} className="animate-spin" /> : null}
        {saving ? "Salvataggio…" : "Salva home"}
      </button>
    </div>
  );
}

function SeoTab({ settings, reloadSettings }) {
  const [siteUrl, setSiteUrl] = useState(settings.site_url || "");
  const [redirects, setRedirects] = useState([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/admin/redirects").then((r) => setRedirects(r.data.items || [])).catch(() => {});
  }, []);

  const saveDomain = async () => {
    setSaving(true);
    try {
      await api.put("/admin/settings", { ...settings, site_url: siteUrl });
      toast.success("Dominio aggiornato");
      reloadSettings();
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
    } finally {
      setSaving(false);
    }
  };

  const addRedirect = async () => {
    if (!from || !to) {
      toast.error("Compila entrambi i campi del redirect");
      return;
    }
    try {
      await api.post("/admin/redirects", { from_slug: from, to_slug: to });
      toast.success("Redirect creato");
      setFrom("");
      setTo("");
      const r = await api.get("/admin/redirects");
      setRedirects(r.data.items || []);
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
    }
  };

  const removeRedirect = async (id) => {
    if (!window.confirm("Eliminare questo redirect?")) return;
    await api.delete(`/admin/redirects/${id}`).catch(() => {});
    const r = await api.get("/admin/redirects");
    setRedirects(r.data.items || []);
  };

  return (
    <div className="flex max-w-2xl flex-col gap-8" data-testid="admin-seo">
      <div className="card-surface p-5">
        <h3 className="mb-1 font-display text-lg font-semibold text-char">Dominio del sito</h3>
        <p className="mb-4 text-xs text-slate-600">
          Quando il sito avrà un dominio definitivo, inseriscilo qui: verrà usato per canonical, Open Graph e
          sitemap. Fino ad allora i riferimenti assoluti restano volutamente disattivati.
        </p>
        <div className="flex gap-2">
          <input className="field flex-1" placeholder="https://www.tuodominio.it" value={siteUrl} onChange={(e) => setSiteUrl(e.target.value)} data-testid="admin-seo-site-url" />
          <button onClick={saveDomain} disabled={saving} className="btn-gold !px-5 !py-2.5 !text-xs" data-testid="admin-seo-save-domain">
            {saving ? <Loader2 size={14} className="animate-spin" /> : null} Salva
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-600">
          Sitemap generata dal backend:{" "}
          {siteUrl ? (
            <a className="text-gold-deep underline" href={`${API}/sitemap.xml`} target="_blank" rel="noopener noreferrer" data-testid="admin-seo-sitemap-link">
              {API}/sitemap.xml <ExternalLink size={10} className="inline" />
            </a>
          ) : (
            <span className="ph-chip">disponibile dopo l'inserimento del dominio</span>
          )}
        </p>
      </div>

      <div className="card-surface p-5">
        <h3 className="mb-1 font-display text-lg font-semibold text-char">Redirect 301</h3>
        <p className="mb-4 text-xs text-slate-600">
          Quando uno slug di prodotto cambia, il sistema crea il redirect automaticamente. Puoi aggiungerne
          anche manualmente qui.
        </p>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row">
          <input className="field flex-1" placeholder="vecchio-slug" value={from} onChange={(e) => setFrom(e.target.value)} data-testid="admin-seo-redirect-from" />
          <input className="field flex-1" placeholder="nuovo-slug" value={to} onChange={(e) => setTo(e.target.value)} data-testid="admin-seo-redirect-to" />
          <button onClick={addRedirect} className="btn-gold !px-5 !py-2.5 !text-xs" data-testid="admin-seo-redirect-add">Aggiungi</button>
        </div>
        <ul className="flex flex-col gap-2" data-testid="admin-seo-redirect-list">
          {redirects.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 rounded-lg border border-line px-4 py-2.5 text-sm">
              <span className="font-mono text-xs text-slate-600">
                /{r.from_slug} <span className="text-gold-deep">→</span> /{r.to_slug}
              </span>
              <button onClick={() => removeRedirect(r.id)} className="text-slate-500 hover:text-red-600" aria-label="Elimina redirect" data-testid={`admin-seo-redirect-remove-${r.id}`}>
                <Trash2 size={14} />
              </button>
            </li>
          ))}
          {redirects.length === 0 && <li className="text-sm text-slate-500">Nessun redirect attivo.</li>}
        </ul>
      </div>

      <div className="card-surface p-5">
        <h3 className="mb-1 font-display text-lg font-semibold text-char">Google Search Console</h3>
        <p className="text-xs leading-relaxed text-slate-600">
          Dopo la pubblicazione: verifica il dominio su Search Console, invia la sitemap e richiedi
          l'indicizzazione. Sitemap e robots.txt sono già predisposti; l'indicizzazione richiede comunque
          giorni o settimane.
        </p>
      </div>
    </div>
  );
}

function SettingsTab({ settings, reloadSettings }) {
  const [form, setForm] = useState(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => setForm(settings), [settings]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/admin/settings", form);
      toast.success("Impostazioni salvate");
      reloadSettings();
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    ["company_name", "Nome azienda"],
    ["tagline", "Slogan"],
    ["email", "Email (segnaposto se non confermata)"],
    ["phone", "Telefono (segnaposto se non confermato)"],
    ["address", "Indirizzo (segnaposto se non confermato)"],
    ["map_embed_url", "URL mappa Google (iframe src, facoltativo)"],
    ["facebook", "Link Facebook (o segnaposto)"],
    ["instagram", "Link Instagram (o segnaposto)"],
    ["linkedin", "Link LinkedIn (o segnaposto)"],
    ["google_analytics_id", "ID Google Analytics 4 (es. G-XXXXXXX)"],
  ];

  return (
    <div className="max-w-2xl" data-testid="admin-settings">
      <div className="grid grid-cols-1 gap-4">
        {fields.map(([k, label]) => (
          <div key={k}>
            <label className="field-label" htmlFor={`set-${k}`}>{label}</label>
            <input id={`set-${k}`} className="field" value={form[k] || ""} onChange={(e) => set(k, e.target.value)} data-testid={`admin-settings-${k.replace(/_/g, "-")}`} />
          </div>
        ))}
        <div>
          <label className="field-label" htmlFor="set-hours">Giorni e orari di apertura (una riga per voce)</label>
          <textarea
            id="set-hours"
            className="field resize-y"
            rows={3}
            value={form.opening_hours || ""}
            onChange={(e) => set("opening_hours", e.target.value)}
            placeholder={"Lunedì – Venerdì: 9:00 – 18:00\nSabato: su appuntamento\nDomenica: chiuso"}
            data-testid="admin-settings-opening-hours"
          />
          <p className="mt-1.5 text-xs text-slate-500">
            Ogni riga appare nella pagina Contatti. Usa [parentesi quadre] finché i dati non sono confermati.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="set-seo-title">Titolo SEO predefinito</label>
            <input id="set-seo-title" className="field" maxLength={70} value={form.seo?.seo_title || ""} onChange={(e) => setForm((f) => ({ ...f, seo: { ...f.seo, seo_title: e.target.value } }))} />
          </div>
          <div>
            <label className="field-label" htmlFor="set-seo-desc">Meta description predefinita</label>
            <input id="set-seo-desc" className="field" maxLength={180} value={form.seo?.meta_description || ""} onChange={(e) => setForm((f) => ({ ...f, seo: { ...f.seo, meta_description: e.target.value } }))} />
          </div>
        </div>
      </div>

      <button onClick={save} disabled={saving} className="btn-gold mt-6 !px-6 !py-2.5 !text-xs disabled:opacity-60" data-testid="admin-settings-save">
        {saving ? <Loader2 size={14} className="animate-spin" /> : null}
        {saving ? "Salvataggio…" : "Salva impostazioni"}
      </button>
    </div>
  );
}

function AccountTab() {
  const { user, refreshUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!currentPassword) {
      toast.error("Inserisci la password attuale per confermare la modifica");
      return;
    }
    if (!newUsername && !newPassword) {
      toast.error("Inserisci un nuovo username oppure una nuova password");
      return;
    }
    if (newUsername && !/^[a-zA-Z0-9._-]{3,80}$/.test(newUsername.trim())) {
      toast.error("Username non valido: 3-80 caratteri tra lettere, numeri, punto, trattino o underscore");
      return;
    }
    if (newPassword && newPassword.length < 8) {
      toast.error("La nuova password deve avere almeno 8 caratteri");
      return;
    }
    if (newPassword && newPassword !== confirm) {
      toast.error("Le due password non coincidono");
      return;
    }
    setSaving(true);
    try {
      await api.put("/admin/credentials", {
        current_password: currentPassword,
        new_username: newUsername ? newUsername.trim() : null,
        new_password: newPassword || null,
      });
      toast.success("Credenziali aggiornate con successo");
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
      if (newUsername) {
        setNewUsername("");
        await refreshUser();
      }
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl" data-testid="admin-account">
      <div className="card-surface p-5 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-linegold bg-gold/15">
            <KeyRound size={18} className="text-gold-deep" />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold text-char">Credenziali di accesso</h2>
            <p className="text-xs text-slate-600">
              Accesso attuale: <span className="font-mono text-gold-deep" data-testid="admin-account-current-username">{user?.username}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="field-label" htmlFor="acc-current">Password attuale *</label>
            <input
              id="acc-current"
              type="password"
              autoComplete="current-password"
              className="field"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Obbligatoria per confermare qualsiasi modifica"
              data-testid="admin-account-current-password"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="acc-username">Nuovo username (facoltativo)</label>
            <input
              id="acc-username"
              type="text"
              autoComplete="off"
              autoCapitalize="none"
              className="field"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Lascia vuoto per non modificarlo (min. 3 caratteri)"
              data-testid="admin-account-new-username"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="acc-new">Nuova password (facoltativa)</label>
            <input
              id="acc-new"
              type="password"
              autoComplete="new-password"
              className="field"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimo 8 caratteri"
              data-testid="admin-account-new-password"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="acc-confirm">Conferma nuova password</label>
            <input
              id="acc-confirm"
              type="password"
              autoComplete="new-password"
              className="field"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Ripeti la nuova password"
              data-testid="admin-account-confirm-password"
            />
          </div>
          <p className="rounded-lg border border-line bg-[#FBFAF5] px-4 py-3 text-xs leading-relaxed text-slate-600">
            Le modifiche hanno effetto immediato: dalla prossima volta dovrai accedere con il nuovo username
            e la nuova password. Non esistono altri modi per recuperarle se le dimentichi: annotale in un
            luogo sicuro.
          </p>
          <button onClick={save} disabled={saving} className="btn-gold self-start !px-6 !py-2.5 !text-xs disabled:opacity-60" data-testid="admin-account-save">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
            {saving ? "Salvataggio…" : "Aggiorna credenziali"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminContent() {
  const [tab, setTab] = useState("pages");
  const [settings, setSettings] = useState(null);

  const reloadSettings = () => {
    api.get("/settings").then((r) => setSettings(r.data)).catch(() => {});
  };

  useEffect(reloadSettings, []);

  return (
    <div data-testid="admin-content">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-char">Contenuti &amp; SEO</h1>
        <p className="text-sm text-slate-600">Gestisci pagine, metadati, impostazioni aziendali, credenziali e redirect.</p>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto" data-testid="admin-content-tabs">
        {[
          ["home", "Home"],
          ["pages", "Pagine"],
          ["seo", "SEO"],
          ["settings", "Impostazioni generali"],
          ["account", "Account admin"],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              tab === id ? "bg-gold text-char" : "text-slate-600 hover:bg-surface2 hover:text-gold-deep"
            }`}
            data-testid={`admin-content-tab-${id}`}
          >
            {label}
          </button>
        ))}
      </div>

      {!settings && <p className="text-sm text-slate-600">Caricamento…</p>}
      {settings && tab === "home" && <HomeTab settings={settings} reloadSettings={reloadSettings} />}
      {settings && tab === "pages" && <PagesTab />}
      {settings && tab === "seo" && <SeoTab settings={settings} reloadSettings={reloadSettings} />}
      {settings && tab === "settings" && <SettingsTab settings={settings} reloadSettings={reloadSettings} />}
      {settings && tab === "account" && <AccountTab />}
    </div>
  );
}