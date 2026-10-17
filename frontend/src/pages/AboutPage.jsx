import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Seo from "@/components/Seo";
import { Reveal } from "@/components/Reveal";
import { useQuote } from "@/context/QuoteContext";
import { useLang } from "@/i18n";

export default function AboutPage() {
  const [page, setPage] = useState(null);
  const [missing, setMissing] = useState(false);
  const { openQuote } = useQuote();
  const { t } = useLang();

  useEffect(() => {
    api
      .get("/pages/chi-siamo")
      .then((r) => setPage(r.data))
      .catch(() => setMissing(true));
  }, []);

  const seo = page?.seo || {};

  return (
    <>
      <Seo
        title={seo.seo_title || "Chi siamo | CR Coppe & Gadget"}
        description={seo.meta_description || "CR Coppe & Gadget: coppe, trofei, targhe, medaglie e gadget aziendali personalizzati."}
        path="/chi-siamo"
      />

      <section className="hero-glow pt-36 pb-14" data-testid="about-header">
        <div className="container-x">
          <p className="eyebrow mb-3">CR Coppe &amp; Gadget</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-char sm:text-5xl" data-testid="about-title">
            {page?.title || "Chi siamo"}
          </h1>
        </div>
      </section>

      {page?.hero_image && (
        <section className="container-x">
          <Reveal>
            <div className="overflow-hidden rounded-3xl border border-line shadow-[0_30px_70px_rgba(25,28,34,0.12)]" data-testid="about-hero-image">
              <img src={page.hero_image} alt="CR Coppe & Gadget — presentazione azienda" className="aspect-[21/9] w-full object-cover" />
            </div>
          </Reveal>
        </section>
      )}

      <section className="container-x py-16 lg:py-24" data-testid="about-body">
        {missing && <p className="text-slate-600">{t("ab.missing")}</p>}
        <div className="mx-auto flex max-w-3xl flex-col gap-12">
          {(page?.blocks || []).map((b, i) => (
            <Reveal key={i} delay={i * 0.05}>
              <section>
                <h2 className="mb-3 font-display text-2xl font-semibold text-char" data-testid={`about-block-title-${i}`}>
                  {b.heading}
                </h2>
                {String(b.text || "")
                  .split("\n")
                  .filter((txt) => txt.trim())
                  .map((par, j) => (
                    <p
                      key={j}
                      className={`mb-3 leading-relaxed ${
                        par.trim().startsWith("[")
                          ? "rounded-lg border border-dashed border-gold-deep/50 bg-gold/10 p-3 text-sm text-gold-deep"
                          : "text-slate-600"
                      }`}
                    >
                      {par}
                    </p>
                  ))}
              </section>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="mx-auto mt-16 max-w-3xl rounded-3xl border border-linegold bg-surface p-8 text-center shadow-[0_20px_60px_rgba(25,28,34,0.08)] sm:p-12">
            <h2 className="font-display text-2xl font-semibold text-char sm:text-3xl">{t("ab.quote_title")}</h2>
            <p className="mt-3 text-slate-600">{t("ab.quote_text")}</p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
              <button onClick={() => openQuote()} className="btn-gold" data-testid="about-quote-button">
                {t("ab.quote_btn")}
              </button>
              <a href="/catalogo" className="btn-ghost" data-testid="about-catalog-link">
                {t("ab.catalog_btn")}
              </a>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}