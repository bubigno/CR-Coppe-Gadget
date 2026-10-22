import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  ArrowUpRight,
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import Logo from "@/components/Logo";
import { api } from "@/lib/api";
import { isPlaceholder } from "@/lib/helpers";
import { useLang } from "@/i18n";

const LEGAL = [
  { id: "privacy", to: "/informazioni/privacy-policy", t: "legal.privacy_t", d: "legal.privacy_d" },
  { id: "cookie", to: "/informazioni/cookie-policy", t: "legal.cookie_t", d: "legal.cookie_d" },
  { id: "terms", to: "/informazioni/termini-uso", t: "legal.terms_t", d: "legal.terms_d" },
  { id: "sitemap", to: "/mappa-sito", t: "legal.sitemap_t", d: "legal.sitemap_d" },
];

function FooterLanguage() {
  const { lang, setLang, t } = useLang();
  return (
    <div className="flex items-center gap-3" data-testid="footer-lang">
      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15">
        <Globe size={14} className="text-gold" />
      </span>
      <span className="text-xs text-slate-500">{t("lang.label")}</span>
      <div className="flex overflow-hidden rounded-full border border-white/15">
        {["it", "en"].map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            aria-pressed={lang === l}
            data-testid={`lang-switch-${l}`}
            className={`px-3.5 py-1.5 text-[11px] font-medium transition-colors ${
              lang === l ? "bg-gold text-char" : "text-slate-400 hover:text-gold-bright"
            }`}
          >
            {l === "it" ? "Italiano" : "English"}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Footer() {
  const [settings, setSettings] = useState(null);
  const [categories, setCategories] = useState([]);
  const { t, lang } = useLang();
  const location = useLocation();

  useEffect(() => {
    api.get("/settings").then((r) => setSettings(r.data)).catch(() => {});
    api
      .get("/categories")
      .then((r) => setCategories((r.data.items || []).filter((c) => !c.parent_slug).slice(0, 4)))
      .catch(() => {});
  }, [lang]);

  const contactValue = (v) =>
    isPlaceholder(v) ? (
      <span className="ph-chip !border-gold/50 !bg-gold/10 !text-gold-bright" data-testid="footer-placeholder">{v}</span>
    ) : (
      <span>{v}</span>
    );

  const social = [
    { label: "Facebook", icon: Facebook, value: settings?.facebook },
    { label: "Instagram", icon: Instagram, value: settings?.instagram },
    { label: "LinkedIn", icon: Linkedin, value: settings?.linkedin },
  ].filter((s) => s.value);

  if (location.pathname.startsWith("/admin")) return null;

  return (
    <footer className="border-t border-line bg-[#16181D] text-slate-300" data-testid="site-footer">
      <div className="container-x grid grid-cols-1 gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-4">
          <Logo size={44} light />
          <p className="text-sm leading-relaxed text-slate-400">
            {settings?.tagline || t("ft.tagline_fallback")}
          </p>
          <div className="flex items-center gap-2">
            {social.map((s) => (
              <a
                key={s.label}
                href={isPlaceholder(s.value) ? "#" : s.value}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                title={isPlaceholder(s.value) ? "Link da configurare nel pannello admin" : s.label}
                data-testid={`footer-social-${s.label.toLowerCase()}`}
                className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                  isPlaceholder(s.value)
                    ? "border-dashed border-gold/40 text-gold-bright/80"
                    : "border-white/15 text-slate-300 hover:border-gold hover:text-gold-bright"
                }`}
              >
                <s.icon size={15} />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="eyebrow mb-4 !text-gold">{t("ft.explore")}</h4>
          <ul className="flex flex-col gap-2.5 text-sm">
            {[
              { to: "/", label: t("nav.home") },
              { to: "/catalogo", label: t("nav.catalog") },
              { to: "/chi-siamo", label: t("nav.about") },
              { to: "/contatti", label: t("nav.contact") },
            ].map((l) => (
              <li key={l.to}>
                <NavLink to={l.to} className="transition-colors hover:text-gold-bright" data-testid={`footer-link-${l.to.slice(1) || "home"}`}>
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="eyebrow mb-4 !text-gold">{t("ft.categories")}</h4>
          <ul className="flex flex-col gap-2.5 text-sm">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link to={`/catalogo?categoria=${c.slug}`} className="transition-colors hover:text-gold-bright" data-testid={`footer-category-${c.slug}`}>
                  {c.name}
                </Link>
              </li>
            ))}
            {categories.length === 0 && <li className="text-slate-500">{t("ft.catalog_updating")}</li>}
          </ul>
        </div>

        <div>
          <h4 className="eyebrow mb-4 !text-gold">{t("ft.contacts")}</h4>
          <ul className="flex flex-col gap-3 text-sm">
            <li className="flex items-start gap-2.5">
              <Mail size={15} className="mt-0.5 shrink-0 text-gold" />
              {settings ? contactValue(settings.email) : "—"}
            </li>
            <li className="flex items-start gap-2.5">
              <Phone size={15} className="mt-0.5 shrink-0 text-gold" />
              {settings ? contactValue(settings.phone) : "—"}
            </li>
            <li className="flex items-start gap-2.5">
              <MapPin size={15} className="mt-0.5 shrink-0 text-gold" />
              {settings ? contactValue(settings.address) : "—"}
            </li>
          </ul>
          <Link
            to="/contatti"
            className="mt-5 inline-flex items-center gap-1 font-mono text-[11px] font-semibold uppercase tracking-widest text-gold transition-colors hover:text-gold-bright"
            data-testid="footer-contact-cta"
          >
            {t("ft.write")} <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>

      <div className="border-t border-white/10" data-testid="footer-legal">
        <div className="container-x flex flex-wrap items-center justify-center gap-x-8 gap-y-2 py-5">
          {LEGAL.map((l) => (
            <Link
              key={l.id}
              to={l.to}
              className="text-xs font-medium text-slate-400 transition-colors hover:text-gold-bright"
              data-testid={`footer-legal-${l.id}`}
            >
              {t(l.t)}
            </Link>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-4 py-6 text-center text-xs text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} CR Coppe &amp; Gadget. {t("ft.rights")}</p>
          <p className="font-mono uppercase tracking-widest">{t("ft.coming_soon")}</p>
          <FooterLanguage />
        </div>
      </div>
    </footer>
  );
}