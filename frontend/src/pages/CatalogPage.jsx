import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Filter, Search, X } from "lucide-react";
import Seo from "@/components/Seo";
import ProductCard from "@/components/ProductCard";
import ShopComingSoon from "@/components/ShopComingSoon";
import { Reveal } from "@/components/Reveal";
import { useLang } from "@/i18n";
import { api } from "@/lib/api";

export default function CatalogPage() {
  const { t, lang } = useLang();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [material, setMaterial] = useState("");
  const [params, setParams] = useSearchParams();
  const cat = params.get("categoria") || "";

  useEffect(() => {
    Promise.all([
      api.get("/products", { params: { limit: 100 } }),
      api.get("/categories"),
    ])
      .then(([p, c]) => {
        setProducts(p.data.items || []);
        setCategories(c.data.items || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [lang]);

  const materials = useMemo(
    () =>
      [...new Set(products.map((p) => p.materials).filter(Boolean))]
        .map((m) => m.split(/[·,]/)[0].trim())
        .filter(Boolean)
        .sort(),
    [products]
  );

  const filtered = useMemo(
    () =>
      products.filter((p) => {
        if (cat && p.category_slug !== cat) return false;
        if (material && !(p.materials || "").toLowerCase().includes(material.toLowerCase())) return false;
        if (search) {
          const q = search.toLowerCase();
          return [p.name, p.short_description, p.code, p.full_description]
            .join(" ")
            .toLowerCase()
            .includes(q);
        }
        return true;
      }),
    [products, cat, material, search]
  );

  const catName = categories.find((c) => c.slug === cat)?.name;

  return (
    <>
      <Seo
        title={catName ? `${catName} — Catalogo | CR Coppe & Gadget` : "Catalogo prodotti | CR Coppe & Gadget"}
        description="Esplora il catalogo completo di coppe, trofei, targhe, medaglie e gadget aziendali personalizzati. Richiedi informazioni e preventivi gratuiti."
        path={cat ? `/catalogo?categoria=${cat}` : "/catalogo"}
      />

      <section className="hero-glow border-b border-line pt-36 pb-12" data-testid="catalog-header">
        <div className="container-x">
          <p className="eyebrow mb-3">Catalogo prodotti</p>
          <h1 className="font-display text-4xl font-semibold tracking-tight text-char sm:text-5xl" data-testid="catalog-title">
            {catName || t("cat.title")}
          </h1>
          <p className="mt-4 max-w-2xl text-slate-600">{t("cat.sub")}</p>
        </div>
      </section>

      <section className="container-x py-12 lg:py-16">
        <div className="mb-8 flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("cat.search_ph")}
                className="field !pl-10"
                aria-label="Cerca prodotti"
                data-testid="catalog-search-input"
              />
            </div>
            <select
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              className="field sm:w-56"
              aria-label="Filtra per materiale"
              data-testid="catalog-material-select"
            >
              <option value="">{t("cat.all_materials")}</option>
              {materials.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2" data-testid="catalog-category-chips">
            <button
              onClick={() => setParams({})}
              className={`rounded-full border px-4 py-1.5 font-mono text-[11px] uppercase tracking-widest transition-all ${
                !cat ? "border-gold bg-gold text-char" : "border-line text-slate-600 hover:border-gold hover:text-gold-deep"
              }`}
              data-testid="catalog-chip-all"
            >
              {t("cat.all")}
            </button>
            {categories.map((c) => (
              <button
                key={c.slug}
                onClick={() => setParams({ categoria: c.slug })}
                className={`rounded-full border px-4 py-1.5 font-mono text-[11px] uppercase tracking-widest transition-all ${
                  cat === c.slug ? "border-gold bg-gold text-char" : "border-line text-slate-600 hover:border-gold hover:text-gold-deep"
                }`}
                data-testid={`catalog-chip-${c.slug}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <p className="mb-6 font-mono text-[11px] uppercase tracking-widest text-slate-500" data-testid="catalog-count">
          {loading ? t("cat.loading") : t("cat.count", { n: filtered.length })}
        </p>

        {!loading && filtered.length === 0 ? (
          <div className="card-surface flex flex-col items-center gap-4 p-16 text-center" data-testid="catalog-empty-state">
            <Filter size={28} className="text-gold-deep" />
            <h2 className="font-display text-xl font-semibold text-char">{t("cat.empty_title")}</h2>
            <p className="max-w-sm text-sm text-slate-600">{t("cat.empty_text")}</p>
            <button
              onClick={() => {
                setSearch("");
                setMaterial("");
                setParams({});
              }}
              className="btn-gold !px-5 !py-2.5"
              data-testid="catalog-reset-filters"
            >
              <X size={15} /> {t("cat.reset")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p, i) => (
              <Reveal key={p.slug} delay={Math.min(i, 6) * 0.05} className="h-full">
                <ProductCard product={p} index={i} />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      <ShopComingSoon />
    </>
  );
}