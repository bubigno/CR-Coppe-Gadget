import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Award, Headset, PenTool, Printer, Sparkles } from "lucide-react";
import Seo from "@/components/Seo";
import Marquee from "@/components/Marquee";
import { MaskedLines, Reveal } from "@/components/Reveal";
import ProductCard from "@/components/ProductCard";
import ShopComingSoon from "@/components/ShopComingSoon";
import { useQuote } from "@/context/QuoteContext";
import { useLang } from "@/i18n";
import { api } from "@/lib/api";

const HERO_IMG =
  "https://images.unsplash.com/photo-1714548474564-44012ae413c9?crop=entropy&cs=srgb&fm=jpg&q=85";
const ABOUT_IMG =
  "https://images.unsplash.com/photo-1601802126876-6a3575905ab1?crop=entropy&cs=srgb&fm=jpg&q=85";

const SERVICES = [
  { icon: PenTool, t: "serv.s1t", d: "serv.s1d" },
  { icon: Printer, t: "serv.s2t", d: "serv.s2d" },
  { icon: Sparkles, t: "serv.s3t", d: "serv.s3d" },
  { icon: Headset, t: "serv.s4t", d: "serv.s4d" },
];

function Hero({ settings }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const yGlow = useTransform(scrollYProgress, [0, 1], [0, 120]);
  const yImg = useTransform(scrollYProgress, [0, 1], [0, -70]);
  const { openQuote } = useQuote();
  const { t } = useLang();
  const lines = (settings.hero_title || "Premiare l'eccellenza.\nPersonalizzare il futuro.")
    .split("\n")
    .filter(Boolean);

  return (
    <section ref={ref} className="hero-glow relative flex min-h-screen items-center overflow-hidden pt-28 pb-16" data-testid="home-hero">
      <div className="container-x grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="eyebrow mb-5"
          >
            {t("hero.eyebrow")}
          </motion.p>
          <h1 className="font-display text-4xl font-semibold leading-[1.04] tracking-tight text-char sm:text-6xl lg:text-7xl" data-testid="home-hero-title">
            <MaskedLines
              lines={lines}
              lineClass={(i) =>
                lines.length > 1 && i === lines.length - 1 ? "gold-text" : ""
              }
            />
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.75 }}
            className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg"
            data-testid="home-hero-subtitle"
          >
            {settings.hero_subtitle ||
              "Coppe, trofei, targhe, medaglie e gadget aziendali personalizzati per aziende, club e società sportive."}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.9 }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <button onClick={() => openQuote()} className="btn-gold" data-testid="hero-quote-button">
              {t("hero.cta_quote")} <ArrowRight size={16} />
            </button>
            <Link to="/catalogo" className="btn-ghost" data-testid="hero-catalog-button">
              {t("hero.cta_browse")}
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="mt-10 flex flex-wrap gap-2"
          >
            {["mq.1", "mq.3", "mq.4", "mq.5"].map((k) => (
              <span key={k} className="rounded-full border border-line bg-surface/70 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-600">
                {t(k)}
              </span>
            ))}
          </motion.div>
        </div>

        <motion.div style={{ y: yGlow }} className="relative mx-auto w-full max-w-md lg:max-w-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.94, rotate: 2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="absolute -inset-8 rounded-[2.5rem] bg-[radial-gradient(circle_at_50%_35%,rgba(201,162,39,0.25),transparent_65%)] blur-2xl animate-shine" />
            <motion.div style={{ y: yImg }} className="relative overflow-hidden rounded-3xl border border-linegold shadow-[0_40px_90px_rgba(25,28,34,0.25)]">
              <img
                src={HERO_IMG}
                alt="Trofeo dorato personalizzato CR Coppe & Gadget"
                className="aspect-[4/5] w-full object-cover"
                data-testid="home-hero-image"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <div className="glass-dark absolute bottom-5 left-5 right-5 rounded-2xl border border-gold/30 p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold-bright">{t("hero.badge_label")}</p>
                <p className="mt-1 text-sm font-medium text-white">{t("hero.badge_text")}</p>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function AboutTeaser({ settings }) {
  const { t } = useLang();
  return (
    <section className="container-x py-20 lg:py-28" data-testid="home-about">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <div className="relative">
            <div className="overflow-hidden rounded-3xl border border-line shadow-[0_30px_70px_rgba(25,28,34,0.12)]">
              <img src={ABOUT_IMG} alt="Set regalo aziendale personalizzato" className="aspect-[4/3] w-full object-cover" />
            </div>
            <div className="glass absolute -bottom-5 left-6 rounded-2xl border border-linegold px-5 py-3.5">
              <p className="flex items-center gap-2 text-sm font-medium text-char">
                <Award size={16} className="text-gold-deep" /> {t("about.badge")}
              </p>
            </div>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="eyebrow mb-4">{t("about.eyebrow")}</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-char sm:text-4xl" data-testid="home-about-title">
            {t("about.title")}
          </h2>
          <p className="mt-5 leading-relaxed text-slate-600">
            {settings.about_short || t("about.text_fallback")}
          </p>
          <ul className="mt-7 flex flex-col gap-3 text-sm text-slate-600">
            {[t("about.b1"), t("about.b2"), t("about.b3")].map((b) => (
              <li key={b} className="flex items-center gap-3">
                <span className="h-1.5 w-1.5 rotate-45 bg-gold" /> {b}
              </li>
            ))}
          </ul>
          <Link to="/chi-siamo" className="btn-ghost mt-9" data-testid="home-about-link">
            {t("about.cta")}
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

function Categories({ categories }) {
  const { t } = useLang();
  const top = categories.filter((c) => !c.parent_slug);
  return (
    <section className="container-x py-20 lg:py-28" data-testid="home-categories">
      <Reveal>
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-3">{t("cats.eyebrow")}</p>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-char sm:text-4xl">{t("cats.title")}</h2>
          </div>
          <Link to="/catalogo" className="btn-ghost !py-2.5" data-testid="home-categories-all">
            {t("cats.all")}
          </Link>
        </div>
      </Reveal>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {top.slice(0, 4).map((c, i) => (
          <Reveal key={c.slug} delay={i * 0.07} className="h-full">
            <Link
              to={`/catalogo?categoria=${c.slug}`}
              className="card-surface group relative flex h-full flex-col overflow-hidden hover:-translate-y-1.5 hover:border-linegold hover:shadow-[0_20px_50px_rgba(25,28,34,0.12)]"
              data-testid={`home-category-${c.slug}`}
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-surface2">
                {c.image ? (
                  <img src={c.image} alt={`Categoria ${c.name}`} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                ) : (
                  <div className="h-full w-full bg-surface2" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
              </div>
              <div className="flex flex-1 items-end p-5">
                <div>
                  <h3 className="font-display text-xl font-semibold text-char group-hover:text-gold-deep">{c.name}</h3>
                  {c.description && <p className="mt-1 line-clamp-2 text-sm text-slate-600">{c.description}</p>}
                </div>
                <ArrowRight size={18} className="ml-auto shrink-0 text-gold-deep transition-transform duration-300 group-hover:translate-x-1" />
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Featured({ products }) {
  const { t } = useLang();
  if (products.length === 0) return null;
  return (
    <section className="container-x py-20 lg:py-28" data-testid="home-featured">
      <Reveal>
        <div className="mb-10">
          <p className="eyebrow mb-3">{t("feat.eyebrow")}</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-char sm:text-4xl">{t("feat.title")}</h2>
        </div>
      </Reveal>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.slice(0, 4).map((p, i) => (
          <Reveal key={p.slug} delay={i * 0.07} className="h-full">
            <ProductCard product={p} index={i} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function Bento() {
  const { t } = useLang();
  return (
    <section className="container-x py-20 lg:py-28" data-testid="home-services">
      <Reveal>
        <div className="mb-10 max-w-2xl">
          <p className="eyebrow mb-3">{t("serv.eyebrow")}</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-char sm:text-4xl">{t("serv.title")}</h2>
        </div>
      </Reveal>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {SERVICES.map((s, i) => (
          <Reveal key={s.t} delay={i * 0.07} className="h-full">
            <div className="card-surface flex h-full flex-col gap-4 p-6 hover:-translate-y-1.5 hover:border-linegold hover:shadow-[0_20px_50px_rgba(25,28,34,0.10)] sm:p-8">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-linegold bg-gold/15">
                <s.icon size={20} className="text-gold-deep" />
              </span>
              <h3 className="font-display text-lg font-semibold text-char">{t(s.t)}</h3>
              <p className="text-sm leading-relaxed text-slate-600">{t(s.d)}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function FinalCta() {
  const { openQuote } = useQuote();
  const { t } = useLang();
  return (
    <section className="container-x py-20 lg:py-28" data-testid="home-cta">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-linegold bg-[#16181D] px-6 py-16 text-center sm:px-12">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,rgba(201,162,39,0.2),transparent_70%)]" />
          <div className="relative">
            <p className="eyebrow mb-4 !text-gold">{t("cta.eyebrow")}</p>
            <h2 className="mx-auto max-w-2xl font-display text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              {t("cta.title1")} <span className="gold-text">{t("cta.title2")}</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-300">{t("cta.text")}</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <button onClick={() => openQuote()} className="btn-gold" data-testid="home-cta-quote-button">
                {t("cta.quote")}
              </button>
              <Link to="/contatti" className="btn-ghost !text-white/90 hover:!text-gold-bright" data-testid="home-cta-contact-button">
                {t("cta.contact")}
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export default function HomePage() {
  const { lang } = useLang();
  const [settings, setSettings] = useState({});
  const [categories, setCategories] = useState([]);
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    api.get("/settings").then((r) => setSettings(r.data)).catch(() => {});
    api.get("/categories").then((r) => setCategories(r.data.items || [])).catch(() => {});
    api
      .get("/products", { params: { featured: "true", limit: 8 } })
      .then((r) => setFeatured(r.data.items || []))
      .catch(() => {});
  }, [lang]);

  return (
    <>
      <Seo
        title={settings.seo?.seo_title || "CR Coppe & Gadget | Coppe, trofei e gadget personalizzati"}
        description={
          settings.seo?.meta_description ||
          "Coppe, trofei, targhe, medaglie e gadget aziendali personalizzati. Catalogo completo e richiesta preventivo gratuita."
        }
        path="/"
      />
      <Hero settings={settings} />
      <Marquee />
      <AboutTeaser settings={settings} />
      <Categories categories={categories} />
      <Featured products={featured} />
      <Bento />
      <ShopComingSoon />
      <FinalCta />
    </>
  );
}