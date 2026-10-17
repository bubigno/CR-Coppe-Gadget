import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Eye,
  MousePointerClick,
  Package,
  ReceiptText,
  Users,
} from "lucide-react";
import { api } from "@/lib/api";

const PERIODS = [7, 30, 90];

function StatCard({ icon: Icon, label, value, testid }) {
  return (
    <div className="card-surface p-5" data-testid={testid}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <Icon size={16} className="text-gold-deep" />
      </div>
      <p className="mt-2 font-display text-3xl font-semibold text-char">{value}</p>
    </div>
  );
}

function hostOf(referrer) {
  if (!referrer || referrer === "Diretto") return "Visite dirette";
  try {
    return new URL(referrer).hostname;
  } catch (e) {
    return referrer.slice(0, 40);
  }
}

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [stats, setStats] = useState(null);
  const [days, setDays] = useState(7);

  useEffect(() => {
    api.get("/admin/overview").then((r) => setOverview(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setStats(null);
    api
      .get("/admin/stats", { params: { days } })
      .then((r) => setStats(r.data))
      .catch(() => setStats({ empty: true }));
  }, [days]);

  return (
    <div className="flex flex-col gap-8" data-testid="admin-dashboard">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-char">Dashboard</h1>
          <p className="text-sm text-slate-600">Panoramica del sito e delle richieste ricevute.</p>
        </div>
        <div className="flex gap-2" data-testid="admin-period-selector">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setDays(p)}
              className={`rounded-full border px-4 py-1.5 font-mono text-[11px] uppercase tracking-widest transition-all ${
                days === p ? "border-gold bg-gold text-char" : "border-line text-slate-600 hover:border-gold"
              }`}
              data-testid={`admin-period-${p}`}
            >
              {p} giorni
            </button>
          ))}
        </div>
      </div>

      {overview && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={ReceiptText} label="Richieste totali" value={overview.requests_total} testid="admin-card-requests-total" />
          <StatCard icon={ReceiptText} label="Da gestire (nuove/aperte)" value={overview.requests_new + overview.requests_open} testid="admin-card-requests-open" />
          <StatCard icon={Package} label="Prodotti pubblicati" value={`${overview.published}/${overview.products}`} testid="admin-card-products" />
          <StatCard icon={Eye} label="Visite ultime 24h" value={overview.views_today} testid="admin-card-views-today" />
        </div>
      )}

      {!overview?.ga4_configured && (
        <p className="rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-3 text-xs text-sky-700" data-testid="admin-ga4-notice">
          Google Analytics 4 non è configurato: le statistiche mostrano solo i dati reali raccolti da questo
          sito (visite, clic e richieste). Potrai collegare GA4 dalle Impostazioni quando vorrai.
        </p>
      )}

      {stats && !stats.empty && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard icon={Eye} label={`Visite (${days}gg)`} value={stats.pageviews} testid="admin-card-pageviews" />
            <StatCard icon={Users} label="Sessioni uniche" value={stats.sessions} testid="admin-card-sessions" />
            <StatCard icon={MousePointerClick} label="Clic su preventivo" value={stats.clicks_quote} testid="admin-card-clicks-quote" />
            <StatCard icon={MousePointerClick} label="Clic su contatti" value={stats.clicks_contact} testid="admin-card-clicks-contact" />
          </div>

          <div className="card-surface p-5" data-testid="admin-chart-views">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
              Visite nel tempo
            </h2>
            {stats.timeseries.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={stats.timeseries}>
                  <defs>
                    <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C9A227" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#C9A227" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(25,28,34,0.08)" vertical={false} />
                  <XAxis dataKey="d" tick={{ fill: "#8a8f9c", fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: "#8a8f9c", fontSize: 11 }} tickLine={false} axisLine={false} width={30} />
                  <Tooltip
                    contentStyle={{ background: "#FFFFFF", border: "1px solid rgba(25,28,34,0.12)", borderRadius: 12, color: "#191C22" }}
                    labelStyle={{ color: "#5A6070" }}
                  />
                  <Area type="monotone" dataKey="v" stroke="#C9A227" strokeWidth={2} fill="url(#goldGrad)" name="Visite" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-sm text-slate-500">
                Nessun dato registrato nel periodo selezionato: qui compariranno solo visite reali, mai numeri
                dimostrativi.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="card-surface p-5" data-testid="admin-top-pages">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Pagine più viste</h2>
              {stats.top_pages.length ? (
                <ul className="flex flex-col gap-2 text-sm">
                  {stats.top_pages.map((p) => (
                    <li key={p.path} className="flex items-center justify-between gap-3">
                      <span className="truncate text-slate-600">{p.path}</span>
                      <span className="font-mono text-xs text-gold-deep">{p.v}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">Nessun dato nel periodo.</p>
              )}
            </div>

            <div className="card-surface p-5" data-testid="admin-top-products">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Prodotti più consultati</h2>
              {stats.top_products.some((p) => p.views > 0) ? (
                <ul className="flex flex-col gap-2 text-sm">
                  {stats.top_products.filter((p) => p.views > 0).map((p) => (
                    <li key={p.slug} className="flex items-center justify-between gap-3">
                      <span className="truncate text-slate-600">{p.name}</span>
                      <span className="font-mono text-xs text-gold-deep">{p.views}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">Nessuna consultazione registrata nel periodo.</p>
              )}
            </div>

            <div className="card-surface p-5" data-testid="admin-sources">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Provenienza traffico</h2>
              {stats.sources.length ? (
                <ul className="flex flex-col gap-2 text-sm">
                  {stats.sources.map((s) => (
                    <li key={s.referrer} className="flex items-center justify-between gap-3">
                      <span className="truncate text-slate-600">{hostOf(s.referrer)}</span>
                      <span className="font-mono text-xs text-gold-deep">{s.v}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">Nessun dato nel periodo.</p>
              )}
            </div>
          </div>

          <div className="card-surface p-5" data-testid="admin-requests-status">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
              Richieste negli ultimi {days} giorni
            </h2>
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="font-display text-2xl font-semibold text-char">{stats.requests_total}</p>
                <p className="text-xs text-slate-500">Totali</p>
              </div>
              <div>
                <p className="font-display text-2xl font-semibold text-amber-600">{stats.requests_by_status.nuova}</p>
                <p className="text-xs text-slate-500">Nuove</p>
              </div>
              <div>
                <p className="font-display text-2xl font-semibold text-sky-600">{stats.requests_by_status.in_lavorazione}</p>
                <p className="text-xs text-slate-500">In lavorazione</p>
              </div>
              <div>
                <p className="font-display text-2xl font-semibold text-emerald-600">{stats.requests_by_status.completata}</p>
                <p className="text-xs text-slate-500">Completate</p>
              </div>
            </div>
          </div>
        </>
      )}

      {!stats && <p className="text-sm text-slate-600">Caricamento statistiche…</p>}
      {stats && stats.empty && (
        <p className="text-sm text-slate-600">
          Statistiche momentaneamente non disponibili: riprova tra qualche istante.
        </p>
      )}
    </div>
  );
}