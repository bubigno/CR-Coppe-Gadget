import { useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiErrorDetail } from "@/lib/api";
import { formatDate } from "@/lib/helpers";

const STATUSES = {
  nuova: { label: "Nuova", cls: "border-amber-500/40 bg-amber-500/10 text-amber-600" },
  in_lavorazione: { label: "In lavorazione", cls: "border-sky-500/40 bg-sky-500/10 text-sky-700" },
  completata: { label: "Completata", cls: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600" },
};

function Detail({ req, onClose, onSaved }) {
  const [form, setForm] = useState({ status: req.status, admin_notes: req.admin_notes || "" });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch(`/admin/requests/${req.id}`, form);
      toast.success("Richiesta aggiornata");
      onSaved();
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Eliminare definitivamente questa richiesta? Lo storico andrà perso.")) return;
    try {
      await api.delete(`/admin/requests/${req.id}`);
      toast.success("Richiesta eliminata");
      onSaved();
    } catch (e) {
      toast.error(formatApiErrorDetail(e.response?.data?.detail));
    }
  };

  const rows = [
    ["Richiedente", `${req.first_name} ${req.last_name}`],
    ["Azienda", req.company || "—"],
    ["Email", req.email],
    ["Telefono", req.phone || "—"],
    ["Prodotto", req.product_name || "—"],
    ["Quantità indicativa", req.quantity || "—"],
    ["Tipo richiesta", req.type],
    ["Ricevuta il", formatDate(req.created_at)],
  ];

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto overscroll-contain bg-black/40 p-4 backdrop-blur-sm" data-lenis-prevent data-testid="admin-request-detail">
      <div className="mx-auto my-12 max-w-xl rounded-2xl border border-linegold bg-surface p-6 shadow-[0_40px_100px_rgba(25,28,34,0.30)] sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow mb-1">{req.type === "contatto" ? "Messaggio di contatto" : "Richiesta di preventivo"}</p>
            <h2 className="font-display text-xl font-semibold text-char">{req.first_name} {req.last_name}</h2>
          </div>
          <span className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider ${STATUSES[req.status]?.cls}`}>
            {STATUSES[req.status]?.label}
          </span>
        </div>

        <dl className="mb-5 divide-y divide-line rounded-xl border border-line">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-start justify-between gap-6 px-4 py-2.5">
              <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">{k}</dt>
              <dd className="text-right text-sm text-char/90">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="mb-5">
          <p className="field-label">Messaggio</p>
          <p className="whitespace-pre-line rounded-xl border border-line bg-[#FBFAF5] p-4 text-sm leading-relaxed text-char/90" data-testid="admin-request-message">
            {req.message}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="field-label" htmlFor="r-status">Stato</label>
            <select id="r-status" className="field" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} data-testid="admin-request-status-select">
              <option value="nuova">Nuova</option>
              <option value="in_lavorazione">In lavorazione</option>
              <option value="completata">Completata</option>
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="r-notes">Note interne</label>
            <textarea id="r-notes" className="field resize-y" rows={3} value={form.admin_notes} onChange={(e) => setForm((f) => ({ ...f, admin_notes: e.target.value }))} placeholder="Note visibili solo nell'area admin" data-testid="admin-request-notes" />
          </div>
        </div>

        <div className="mt-8 flex justify-between gap-3">
          <button onClick={remove} className="btn-ghost !px-5 !py-2.5 !text-xs !text-red-600 hover:!border-red-500 hover:!text-red-600" data-testid="admin-request-delete">
            <Trash2 size={14} /> Elimina
          </button>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-ghost !px-5 !py-2.5 !text-xs" data-testid="admin-request-close">Chiudi</button>
            <button onClick={save} disabled={saving} className="btn-gold !px-6 !py-2.5 !text-xs disabled:opacity-60" data-testid="admin-request-save">
              {saving ? <Loader2 size={14} className="animate-spin" /> : null}
              {saving ? "Salvataggio…" : "Salva"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminRequests() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [detail, setDetail] = useState(null);

  const load = () => {
    setLoading(true);
    api
      .get("/admin/requests", { params: { status, date_from: dateFrom, date_to: dateTo } })
      .then((r) => setItems(r.data.items || []))
      .catch(() => toast.error("Impossibile caricare le richieste"))
      .finally(() => setLoading(false));
  };

  useEffect(load, [status, dateFrom, dateTo]);

  return (
    <div data-testid="admin-requests">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-char">Richieste di preventivo e contatti</h1>
        <p className="text-sm text-slate-600">Tutte le richieste ricevute dal sito, con storico completo.</p>
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-3" data-testid="admin-requests-filters">
        <div>
          <label className="field-label" htmlFor="f-status">Stato</label>
          <select id="f-status" className="field w-44" value={status} onChange={(e) => setStatus(e.target.value)} data-testid="admin-requests-filter-status">
            <option value="">Tutte</option>
            <option value="nuova">Nuove</option>
            <option value="in_lavorazione">In lavorazione</option>
            <option value="completata">Completate</option>
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="f-from">Dal</label>
          <input id="f-from" type="date" className="field w-40" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} data-testid="admin-requests-filter-from" />
        </div>
        <div>
          <label className="field-label" htmlFor="f-to">Al</label>
          <input id="f-to" type="date" className="field w-40" value={dateTo} onChange={(e) => setDateTo(e.target.value)} data-testid="admin-requests-filter-to" />
        </div>
        {(status || dateFrom || dateTo) && (
          <button
            onClick={() => { setStatus(""); setDateFrom(""); setDateTo(""); }}
            className="btn-ghost !px-4 !py-2 !text-xs"
            data-testid="admin-requests-filters-reset"
          >
            Azzera filtri
          </button>
        )}
      </div>

      <div className="card-surface overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-line font-mono text-[10px] uppercase tracking-widest text-slate-500">
              <th className="px-5 py-3.5">Data</th>
              <th className="px-5 py-3.5">Richiedente</th>
              <th className="px-5 py-3.5">Tipo</th>
              <th className="px-5 py-3.5">Prodotto</th>
              <th className="px-5 py-3.5">Stato</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr
                key={r.id}
                onClick={() => setDetail(r)}
                className="cursor-pointer border-b border-line/60 last:border-0 hover:bg-surface2/70"
                data-testid={`admin-request-row-${r.id}`}
              >
                <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{formatDate(r.created_at)}</td>
                <td className="px-5 py-3.5">
                  <span className="font-medium text-char">{r.first_name} {r.last_name}</span>
                  {r.company && <span className="block text-xs text-slate-500">{r.company}</span>}
                </td>
                <td className="px-5 py-3.5 text-slate-600">{r.type}</td>
                <td className="px-5 py-3.5 text-slate-600">{r.product_name || "—"}</td>
                <td className="px-5 py-3.5">
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${STATUSES[r.status]?.cls}`}>
                    {STATUSES[r.status]?.label}
                  </span>
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-500">Nessuna richiesta con questi filtri.</td></tr>
            )}
            {loading && (
              <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-500">Caricamento…</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {detail && (
        <Detail
          req={detail}
          onClose={() => setDetail(null)}
          onSaved={() => {
            setDetail(null);
            load();
          }}
        />
      )}
    </div>
  );
}