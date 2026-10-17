import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiErrorDetail } from "@/lib/api";
import { useLang } from "@/i18n";

const EMPTY = {
  first_name: "",
  last_name: "",
  company: "",
  email: "",
  phone: "",
  product_slug: "",
  quantity: "",
  message: "",
  privacy_accepted: false,
  website: "",
};

export default function QuoteModal({ open, onClose, product = null }) {
  const { t } = useLang();
  const [form, setForm] = useState(EMPTY);
  const [products, setProducts] = useState([]);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (open && products.length === 0) {
      api
        .get("/products", { params: { limit: 100 } })
        .then((r) => setProducts(r.data.items || []))
        .catch(() => {});
    }
  }, [open, products.length]);

  useEffect(() => {
    if (open) {
      setSent(false);
      setForm({
        ...EMPTY,
        product_slug: product ? product.slug : "",
      });
    }
  }, [open, product]);

  const set = (k) => (e) =>
    setForm((f) => ({
      ...f,
      [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post("/quote-requests", form);
      setSent(true);
      toast.success(t("q.success_text"));
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail));
    } finally {
      setSending(false);
    }
  };

  const selectedProduct = products.find((p) => p.slug === form.product_slug);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto overscroll-contain bg-black/40 p-4 backdrop-blur-sm"
          data-lenis-prevent
          onClick={onClose}
          data-testid="quote-modal"
        >
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative my-8 mb-16 w-full max-w-xl rounded-2xl border border-linegold bg-surface p-6 shadow-[0_40px_100px_rgba(25,28,34,0.35)] sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              aria-label="Chiudi finestra"
              data-testid="quote-modal-close"
              className="absolute right-4 top-4 rounded-full border border-line p-2 text-slate-500 transition-colors hover:border-gold hover:text-gold-deep"
            >
              <X size={16} />
            </button>

            {sent ? (
              <div className="flex flex-col items-center gap-4 py-10 text-center" data-testid="quote-success">
                <CheckCircle2 size={48} className="text-emerald-500" />
                <h3 className="font-display text-2xl font-semibold text-char">{t("q.success_title")}</h3>
                <p className="max-w-sm text-sm text-slate-600">{t("q.success_text")}</p>
                <button onClick={onClose} className="btn-gold mt-2" data-testid="quote-success-close">
                  {t("q.close")}
                </button>
              </div>
            ) : (
              <>
                <p className="eyebrow mb-2">{t("q.eyebrow")}</p>
                <h3 className="mb-1 font-display text-2xl font-semibold text-char sm:text-3xl">{t("q.title")}</h3>
                <p className="mb-6 text-sm text-slate-600">{t("q.sub")}</p>

                <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2" data-testid="quote-form">
                  <div>
                    <label className="field-label" htmlFor="q-first">{t("q.first")}</label>
                    <input id="q-first" required minLength={2} maxLength={80} className="field" value={form.first_name} onChange={set("first_name")} data-testid="quote-input-first-name" />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="q-last">{t("q.last")}</label>
                    <input id="q-last" required minLength={2} maxLength={80} className="field" value={form.last_name} onChange={set("last_name")} data-testid="quote-input-last-name" />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="q-company">{t("q.company")}</label>
                    <input id="q-company" maxLength={120} className="field" value={form.company} onChange={set("company")} placeholder={t("q.company_ph")} data-testid="quote-input-company" />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="q-email">{t("q.email")}</label>
                    <input id="q-email" type="email" required className="field" value={form.email} onChange={set("email")} data-testid="quote-input-email" />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="q-phone">{t("q.phone")}</label>
                    <input id="q-phone" type="tel" maxLength={40} className="field" value={form.phone} onChange={set("phone")} placeholder={t("q.phone_ph")} data-testid="quote-input-phone" />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="q-quantity">{t("q.qty")}</label>
                    <input id="q-quantity" maxLength={40} className="field" value={form.quantity} onChange={set("quantity")} placeholder={t("q.qty_ph")} data-testid="quote-input-quantity" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="field-label" htmlFor="q-product">{t("q.product")}</label>
                    <select id="q-product" className="field" value={form.product_slug} onChange={set("product_slug")} data-testid="quote-input-product">
                      <option value="">{t("q.product_none")}</option>
                      {products.map((p) => (
                        <option key={p.slug} value={p.slug}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="field-label" htmlFor="q-message">{t("q.message")}</label>
                    <textarea id="q-message" required minLength={10} maxLength={4000} rows={4} className="field resize-y" value={form.message} onChange={set("message")} placeholder={t("q.message_ph")} data-testid="quote-input-message" />
                  </div>

                  <label className="flex items-start gap-3 text-xs text-slate-600 sm:col-span-2" data-testid="quote-privacy-label">
                    <input type="checkbox" required checked={form.privacy_accepted} onChange={set("privacy_accepted")} className="mt-0.5 h-4 w-4 accent-[#C9A227]" data-testid="quote-input-privacy" />
                    <span>{t("q.privacy")}</span>
                  </label>

                  <input
                    type="text"
                    name="website"
                    value={form.website}
                    onChange={set("website")}
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    className="hidden"
                  />

                  <div className="sm:col-span-2">
                    <button type="submit" disabled={sending} className="btn-gold w-full disabled:opacity-60" data-testid="quote-form-submit">
                      {sending ? <Loader2 size={16} className="animate-spin" /> : null}
                      {sending
                        ? t("q.submitting")
                        : selectedProduct
                          ? t("q.submit_for", { name: selectedProduct.name })
                          : t("q.submit")}
                    </button>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}