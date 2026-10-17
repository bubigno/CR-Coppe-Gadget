import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useQuote } from "@/context/QuoteContext";
import { useLang } from "@/i18n";

export default function ProductCard({ product, index = 0 }) {
  const { openQuote } = useQuote();
  const { t } = useLang();

  return (
    <article
      className="card-surface group relative flex h-full flex-col overflow-hidden bg-surface hover:-translate-y-1.5 hover:border-linegold hover:shadow-[0_24px_50px_rgba(25,28,34,0.12)]"
      data-testid={`product-card-${product.slug}`}
    >
      <Link
        to={`/prodotti/${product.slug}`}
        className="relative block aspect-[4/5] overflow-hidden bg-surface2"
        aria-label={`Vedi scheda prodotto: ${product.name}`}
      >
        {product.main_image ? (
          <img
            src={product.main_image}
            alt={product.image_alt || product.name}
            loading={index > 3 ? "lazy" : "eager"}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.06]"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-mono text-xs uppercase tracking-widest text-slate-400">
            {t("p.image_pending")}
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/25 to-transparent" />
        {product.is_demo && (
          <span className="absolute left-3 top-3 rounded-full border border-dashed border-gold-deep/60 bg-paper/90 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-gold-deep" data-testid="product-demo-badge">
            {t("p.demo")}
          </span>
        )}
        {product.featured && !product.is_demo && (
          <span className="absolute left-3 top-3 rounded-full bg-gold px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-char">
            {t("p.featured")}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-5">
        {product.category_label && (
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold-deep">
            {product.category_label}
          </span>
        )}
        <h3 className="font-display text-lg font-semibold leading-snug text-char">
          <Link to={`/prodotti/${product.slug}`} className="transition-colors hover:text-gold-deep">
            {product.name}
          </Link>
        </h3>
        {product.short_description && (
          <p className="mb-3 line-clamp-2 text-sm text-slate-600">{product.short_description}</p>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <Link
            to={`/prodotti/${product.slug}`}
            className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold uppercase tracking-widest text-slate-600 transition-colors hover:text-gold-deep"
            data-testid={`product-view-${product.slug}`}
          >
            {t("p.details")} <ArrowUpRight size={13} />
          </Link>
          <button
            onClick={() => openQuote(product)}
            className="rounded-full border border-line px-3.5 py-1.5 text-[11px] font-semibold text-gold-deep transition-all hover:border-gold hover:bg-gold hover:text-char"
            data-testid={`product-quote-${product.slug}`}
          >
            {t("p.request_info")}
          </button>
        </div>
      </div>
    </article>
  );
}