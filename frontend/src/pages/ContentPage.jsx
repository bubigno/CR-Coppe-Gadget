import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { api } from "@/lib/api";
import Seo from "@/components/Seo";
import { Reveal } from "@/components/Reveal";
import { useQuote } from "@/context/QuoteContext";
import { useLang } from "@/i18n";

export default function ContentPage() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [missing, setMissing] = useState(false);
  const { openQuote } = useQuote();
  const { t } = useLang();

  useEffect(() => {
    setPage(null);
    setMissing(false);
    api
      .get(`/pages/${slug}`)
      .then((r) => setPage(r.data))
      .catch(() => setMissing(true));
  }, [slug]);

  const seo = page?.seo || {};

  return (
    <>
      <Seo
        title={seo.seo_title || `${page?.title || "Pagina"} | CR Coppe & Gadget`}
        description={seo.meta_description || "CR Coppe & Gadget: coppe, trofei, targhe, medaglie e gadget aziendali personalizzati."}
        path={`/informazioni/${slug}`}
      />
      {seo.noindex && (
        <Helmet>
          <meta name="robots" content="noindex" />
        </Helmet>
      )}

      <section className="hero-glow pt-36 pb-14" data-testid="content-header">
        <div className="container-x">
          <p className="eyebrow mb-3">CR Coppe &amp; Gadget</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-char sm:text-5xl" data-testid="content-title">
            {page?.title || "—"}
          </h1>
        </div>
      </section>

      <section className="container-x pb-16 lg:pb-24">
        {missing && <p className="text-slate-600">{t("ab.missing")}</p>}
        <div className="mx-auto flex max-w-3xl flex-col gap-12">
          {(page?.blocks || []).map((b, i) => (
            <Reveal key={i} delay={i * 0.05}>
              <section>
                <h2 className="mb-3 font-display text-2xl font-semibold text-char" data-testid={`content-block-title-${i}`}>
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
              <button onClick={() => openQuote()} className="btn-gold" data-testid="content-quote-button">
                {t("ab.quote_btn")}
              </button>
              <a href="/mappa-sito" className="btn-ghost" data-testid="content-sitemap-link">
                {t("legal.sitemap_t")}
              </a>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}