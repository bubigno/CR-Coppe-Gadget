import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, PackageSearch } from "lucide-react";
import Seo from "@/components/Seo";
import ProductCard from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { useQuote } from "@/context/QuoteContext";
import { useLang } from "@/i18n";
import { api } from "@/lib/api";

export default function ProductPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { openQuote } = useQuote();
  const { t, lang } = useLang();
  const [state, setState] = useState({ loading: true, notFound: false, product: null, related: [] });
  const [mainImage, setMainImage] = useState("");

  useEffect(() => {
    setState({ loading: true, notFound: false, product: null, related: [] });
    api
      .get(`/products/${slug}`)
      .then((r) => {
        const p = r.data.product;
        setState({ loading: false, notFound: false, product: p, related: r.data.related || [] });
        setMainImage(p.main_image);
        if (p.slug !== slug) {
          navigate(`/prodotti/${p.slug}`, { replace: true });
        }
      })
      .catch(() => setState((s) => ({ ...s, loading: false, notFound: true })));
  }, [slug, navigate, lang]);

  if (state.loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-sm text-slate-500" data-testid="product-loading">
        {t("p.loading")}
      </div>
    );
  }

  if (state.notFound || !state.product) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-6 text-center" data-testid="product-not-found">
        <PackageSearch size={36} className="text-gold-deep" />
        <h1 className="font-display text-3xl font-semibold text-char">{t("p.not_found_title")}</h1>
        <p className="max-w-md text-slate-600">{t("p.not_found_text")}</p>
        <Link to="/catalogo" className="btn-gold" data-testid="product-back-to-catalog">
          <ArrowLeft size={16} /> {t("p.back")}
        </Link>
      </div>
    );
  }

  const p = state.product;
  const images = [p.main_image, ...(p.gallery || [])].filter(Boolean);
  const infoRows = [
    [t("p.i_materials"), p.materials],
    [t("p.i_dimensions"), p.dimensions],
    [t("p.i_colors"), p.colors],
    [t("p.i_variants"), p.variants],
    [t("p.i_availability"), p.availability],
    [t("p.i_code"), p.code],
  ].filter(([, v]) => v);

  return (
    <>
      <Seo
        title={(p.seo && p.seo.seo_title) || `${p.name} | CR Coppe & Gadget`}
        description={(p.seo && p.seo.meta_description) || p.short_description}
        path={`/prodotti/${p.slug}`}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: p.name,
          description: p.short_description,
          category: p.category_label,
          ...(p.main_image ? { image: [p.main_image] } : {}),
          ...(p.code ? { sku: p.code } : {}),
          brand: { "@type": "Brand", name: "CR Coppe & Gadget" },
        }}
      />

      <article className="pt-28 lg:pt-32" data-testid="product-page">
        <div className="container-x">
          <nav className="flex flex-wrap items-center gap-1.5 py-6 font-mono text-[11px] uppercase tracking-widest text-slate-500" aria-label="Percorso">
            <Link to="/" className="hover:text-gold-deep">{t("p.home")}</Link>
            <ChevronRight size={12} />
            <Link to="/catalogo" className="hover:text-gold-deep">{t("p.cat")}</Link>
            {p.category_slug && (
              <>
                <ChevronRight size={12} />
                <Link to={`/catalogo?categoria=${p.category_slug}`} className="hover:text-gold-deep">
                  {p.category_label || p.category_slug.replace(/-/g, " ")}
                </Link>
              </>
            )}
            <ChevronRight size={12} />
            <span className="text-slate-700">{p.name}</span>
          </nav>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
            <Reveal>
              <div className="relative overflow-hidden rounded-3xl border border-linegold bg-surface shadow-[0_30px_70px_rgba(25,28,34,0.12)]" data-testid="product-gallery">
                {mainImage ? (
                  <img src={mainImage} alt={p.image_alt || p.name} className="aspect-square w-full object-cover" />
                ) : (
                  <div className="flex aspect-square items-center justify-center font-mono text-xs uppercase tracking-widest text-slate-400">
                    {t("p.image_pending")}
                  </div>
                )}
                {p.is_demo && (
                  <span className="absolute left-4 top-4 rounded-full border border-dashed border-gold-deep/60 bg-paper/90 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-gold-deep" data-testid="product-demo-badge">
                    {t("p.demo_full")}
                  </span>
                )}
              </div>
              {images.length > 1 && (
                <div className="mt-4 grid grid-cols-4 gap-3" data-testid="product-gallery-thumbs">
                  {images.slice(0, 4).map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setMainImage(img)}
                      className={`overflow-hidden rounded-xl border transition-all ${
                        mainImage === img ? "border-gold" : "border-line hover:border-linegold"
                      }`}
                      aria-label={`Vedi immagine ${i + 1} di ${p.name}`}
                      data-testid={`product-thumb-${i}`}
                    >
                      <img src={img} alt="" className="aspect-square w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </Reveal>

            <Reveal delay={0.1}>
              <div className="flex flex-col gap-5">
                <div>
                  {p.category_label && (
                    <p className="eyebrow mb-2">{p.category_label}</p>
                  )}
                  <h1 className="font-display text-3xl font-semibold tracking-tight text-char sm:text-4xl" data-testid="product-title">
                    {p.name}
                  </h1>
                  {p.short_description && (
                    <p className="mt-3 leading-relaxed text-slate-600">{p.short_description}</p>
                  )}
                </div>

                {p.price && (
                  <p className="font-display text-2xl font-semibold text-gold-deep" data-testid="product-price">
                    {p.price}
                  </p>
                )}

                <div className="flex flex-wrap gap-3">
                  <button onClick={() => openQuote(p)} className="btn-gold" data-testid="product-request-quote-button">
                    {t("p.request_quote")}
                  </button>
                  <Link to="/contatti" className="btn-ghost" data-testid="product-contact-link">
                    {t("p.contact_us")}
                  </Link>
                </div>

                {p.customization_info && (
                  <div className="rounded-2xl border border-linegold bg-gold/10 p-5" data-testid="product-customization">
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-gold-deep mb-1.5">{t("p.customization")}</p>
                    <p className="text-sm leading-relaxed text-char/90">{p.customization_info}</p>
                  </div>
                )}

                {infoRows.length > 0 && (
                  <dl className="divide-y divide-line rounded-2xl border border-line" data-testid="product-info-table">
                    {infoRows.map(([k, v]) => (
                      <div key={k} className="flex items-start justify-between gap-6 px-5 py-3.5">
                        <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">{k}</dt>
                        <dd className="text-right text-sm text-char/90">{v}</dd>
                      </div>
                    ))}
                  </dl>
                )}

                {p.specs && p.specs.length > 0 && (
                  <div data-testid="product-specs">
                    <h2 className="mb-3 font-display text-lg font-semibold text-char">{t("p.specs")}</h2>
                    <ul className="flex flex-col gap-2.5">
                      {p.specs.map((s, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rotate-45 bg-gold" />
                          <span>
                            <span className="font-medium text-char">{s.label}:</span> {s.value}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Reveal>
          </div>

          {p.full_description && (
            <Reveal className="mt-16">
              <div className="max-w-3xl" data-testid="product-description">
                <h2 className="mb-4 font-display text-2xl font-semibold text-char">{t("p.description")}</h2>
                {p.full_description.split("\n").filter(Boolean).map((par, i) => (
                  <p key={i} className="mb-3 leading-relaxed text-slate-600">{par}</p>
                ))}
              </div>
            </Reveal>
          )}
        </div>
      </article>

      {state.related.length > 0 && (
        <section className="container-x py-16 lg:py-24" data-testid="product-related">
          <h2 className="mb-8 font-display text-2xl font-semibold text-char sm:text-3xl">{t("p.related")}</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {state.related.map((rp, i) => (
              <Reveal key={rp.slug} delay={i * 0.06} className="h-full">
                <ProductCard product={rp} index={i} />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </>
  );
}