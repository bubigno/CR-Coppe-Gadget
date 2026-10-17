import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import Seo from "@/components/Seo";
import { Reveal } from "@/components/Reveal";
import { useLang } from "@/i18n";
import { api } from "@/lib/api";

export default function SitemapPage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const { t } = useLang();

  useEffect(() => {
    Promise.all([api.get("/categories"), api.get("/products", { params: { limit: 100 } })])
      .then(([c, p]) => {
        setCategories(c.data.items || []);
        setProducts(p.data.items || []);
      })
      .catch(() => {});
  }, []);

  const staticPages = [
    { to: "/", label: t("nav.home") },
    { to: "/catalogo", label: t("nav.catalog") },
    { to: "/chi-siamo", label: t("nav.about") },
    { to: "/contatti", label: t("nav.contact") },
    { to: "/informazioni/privacy-policy", label: t("legal.privacy_t") },
    { to: "/informazioni/cookie-policy", label: t("legal.cookie_t") },
    { to: "/informazioni/termini-uso", label: t("legal.terms_t") },
  ];

  return (
    <>
      <Seo
        title="Mappa del sito | CR Coppe & Gadget"
        description="Tutte le pagine, le categorie e i prodotti del sito di CR Coppe & Gadget in un unico elenco."
        path="/mappa-sito"
      />

      <section className="hero-glow pt-36 pb-14" data-testid="sitemap-header">
        <div className="container-x">
          <p className="eyebrow mb-3">{t("legal.sitemap_t")}</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-char sm:text-5xl" data-testid="sitemap-title">
            {t("legal.sitemap_d")}
          </h1>
        </div>
      </section>

      <section className="container-x pb-24" data-testid="sitemap-body">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <Reveal>
            <div className="card-surface h-full p-6">
              <h2 className="mb-4 font-display text-lg font-semibold text-char">{t("sm.pages")}</h2>
              <ul className="flex flex-col gap-2.5 text-sm">
                {staticPages.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="inline-flex items-center gap-1 text-slate-600 transition-colors hover:text-gold-deep" data-testid={`sitemap-link-${l.to}`}>
                      <ChevronRight size={13} className="text-gold" /> {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="card-surface h-full p-6">
              <h2 className="mb-4 font-display text-lg font-semibold text-char">{t("sm.categories")}</h2>
              <ul className="flex flex-col gap-2.5 text-sm">
                {categories.map((c) => (
                  <li key={c.slug}>
                    <Link to={`/catalogo?categoria=${c.slug}`} className="inline-flex items-center gap-1 text-slate-600 transition-colors hover:text-gold-deep" data-testid={`sitemap-category-${c.slug}`}>
                      <ChevronRight size={13} className="text-gold" /> {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.16}>
            <div className="card-surface h-full p-6">
              <h2 className="mb-4 font-display text-lg font-semibold text-char">{t("sm.products")}</h2>
              <ul className="flex max-h-96 flex-col gap-2.5 overflow-y-auto pr-1 text-sm">
                {products.map((p) => (
                  <li key={p.slug}>
                    <Link to={`/prodotti/${p.slug}`} className="inline-flex items-center gap-1 text-slate-600 transition-colors hover:text-gold-deep" data-testid={`sitemap-product-${p.slug}`}>
                      <ChevronRight size={13} className="text-gold" /> {p.name}
                    </Link>
                  </li>
                ))}
                {products.length === 0 && <li className="text-slate-500">{t("ft.catalog_updating")}</li>}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}