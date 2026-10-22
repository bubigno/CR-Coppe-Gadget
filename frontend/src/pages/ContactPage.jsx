import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Loader2, Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import Seo from "@/components/Seo";
import { Reveal } from "@/components/Reveal";
import { api, formatApiErrorDetail } from "@/lib/api";
import { isPlaceholder } from "@/lib/helpers";
import { useLang } from "@/i18n";
import { trackClick } from "@/lib/track";

const EMPTY = {
  type: "contatto",
  first_name: "",
  last_name: "",
  email: "",
  message: "",
  privacy_accepted: false,
  website: "",
};

export default function ContactPage() {
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const { t, lang } = useLang();

  useEffect(() => {
    api.get("/settings").then((r) => setSettings(r.data)).catch(() => {});
  }, [lang]);

  const set = (k) => (e) =>
    setForm((f) => ({
      ...f,
      [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    trackClick("contact");
    try {
      await api.post("/quote-requests", form);
      setSent(true);
      toast.success(t("ct.success_text"));
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail));
    } finally {
      setSending(false);
    }
  };

  const cards = [
    { icon: Mail, label: t("q.email").replace(" *", ""), value: settings?.email },
    { icon: Phone, label: t("q.phone"), value: settings?.phone },
    { icon: MapPin, label: t("ct.address"), value: settings?.address },
  ];

  const socials = [
    { label: "Facebook", value: settings?.facebook },
    { label: "Instagram", value: settings?.instagram },
    { label: "LinkedIn", value: settings?.linkedin },
  ].filter((s) => s.value);

  return (
    <>
      <Seo
        title="Contatti | CR Coppe & Gadget"
        description="Contatta CR Coppe & Gadget per informazioni, personalizzazioni e preventivi su coppe, trofei, targhe, medaglie e gadget aziendali."
        path="/contatti"
      />

      <section className="hero-glow pt-36 pb-12" data-testid="contact-header">
        <div className="container-x">
          <p className="eyebrow mb-3">{t("nav.contact")}</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-char sm:text-5xl" data-testid="contact-title">
            {t("ct.title")}
          </h1>
          <p className="mt-4 max-w-2xl text-slate-600">{t("ct.sub")}</p>
        </div>
      </section>

      <section className="container-x pb-24 pt-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.2fr]">
          <Reveal>
            <div className="flex flex-col gap-4" data-testid="contact-info-cards">
              {cards.map((c) => (
                <div key={c.label} className="card-surface flex items-start gap-4 p-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-linegold bg-gold/15">
                    <c.icon size={18} className="text-gold-deep" />
                  </span>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold-deep">{c.label}</p>
                    {isPlaceholder(c.value) ? (
                      <p className="mt-1"><span className="ph-chip">{c.value}</span></p>
                    ) : (
                      <p className="mt-1 text-sm text-char" data-testid={`contact-value-${c.label.toLowerCase()}`}>
                        {c.value || "—"}
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {settings?.opening_hours && settings.opening_hours.trim() !== "" && (
                <div className="card-surface p-5" data-testid="contact-opening-hours">
                  <p className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-gold-deep">
                    <Clock size={13} /> {t("ct.hours")}
                  </p>
                  <ul className="flex flex-col gap-1.5 text-sm text-char">
                    {settings.opening_hours.split("\n").filter((l) => l.trim()).map((line, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rotate-45 bg-gold" />
                        {line.trim().startsWith("[") ? (
                          <span className="ph-chip">{line.trim()}</span>
                        ) : (
                          <span>{line}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="card-surface p-5">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold-deep mb-3">{t("ct.follow")}</p>
                <div className="flex flex-wrap gap-2">
                  {socials.map((s) =>
                    isPlaceholder(s.value) ? (
                      <span key={s.label} className="ph-chip">{s.label}: {s.value}</span>
                    ) : (
                      <a key={s.label} href={s.value} target="_blank" rel="noopener noreferrer" className="rounded-full border border-line px-4 py-1.5 text-xs font-semibold text-char transition-colors hover:border-gold hover:text-gold-deep" data-testid={`contact-social-${s.label.toLowerCase()}`}>
                        {s.label}
                      </a>
                    )
                  )}
                  {socials.length === 0 && <p className="text-sm text-slate-500">{t("ct.socials_updating")}</p>}
                </div>
              </div>

              {settings?.map_embed_url && (
                <div className="overflow-hidden rounded-2xl border border-line" data-testid="contact-map">
                  <iframe
                    src={settings.map_embed_url}
                    title="Mappa — CR Coppe & Gadget"
                    className="h-64 w-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              )}
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="card-surface p-6 sm:p-8" data-testid="contact-form-card">
              {sent ? (
                <div className="flex flex-col items-center gap-4 py-14 text-center" data-testid="contact-success">
                  <CheckCircle2 size={44} className="text-emerald-500" />
                  <h2 className="font-display text-2xl font-semibold text-char">{t("ct.success_title")}</h2>
                  <p className="max-w-sm text-sm text-slate-600">{t("ct.success_text")}</p>
                </div>
              ) : (
                <>
                  <h2 className="mb-1 font-display text-2xl font-semibold text-char">{t("ct.write_title")}</h2>
                  <p className="mb-6 text-sm text-slate-500">{t("ct.required")}</p>
                  <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2" data-testid="contact-form">
                    <div>
                      <label className="field-label" htmlFor="c-first">{t("q.first")}</label>
                      <input id="c-first" required minLength={2} maxLength={80} className="field" value={form.first_name} onChange={set("first_name")} data-testid="contact-input-first-name" />
                    </div>
                    <div>
                      <label className="field-label" htmlFor="c-last">{t("q.last")}</label>
                      <input id="c-last" required minLength={2} maxLength={80} className="field" value={form.last_name} onChange={set("last_name")} data-testid="contact-input-last-name" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="field-label" htmlFor="c-email">{t("q.email")}</label>
                      <input id="c-email" type="email" required className="field" value={form.email} onChange={set("email")} data-testid="contact-input-email" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="field-label" htmlFor="c-message">{t("q.message")}</label>
                      <textarea id="c-message" required minLength={10} maxLength={4000} rows={5} className="field resize-y" value={form.message} onChange={set("message")} data-testid="contact-input-message" />
                    </div>
                    <label className="flex items-start gap-3 text-xs text-slate-600 sm:col-span-2">
                      <input type="checkbox" required checked={form.privacy_accepted} onChange={set("privacy_accepted")} className="mt-0.5 h-4 w-4 accent-[#C9A227]" data-testid="contact-input-privacy" />
                      <span>{t("q.privacy")}</span>
                    </label>
                    <input type="text" name="website" value={form.website} onChange={set("website")} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
                    <div className="sm:col-span-2">
                      <button type="submit" disabled={sending} className="btn-gold w-full disabled:opacity-60" data-testid="contact-form-submit">
                        {sending ? <Loader2 size={16} className="animate-spin" /> : null}
                        {sending ? t("ct.sending") : t("ct.send")}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}