import { Reveal } from "@/components/Reveal";
import { Clock } from "lucide-react";
import { useLang } from "@/i18n";

export default function ShopComingSoon() {
  const { t } = useLang();
  return (
    <section className="container-x py-10 lg:py-14">
      <Reveal>
        <div
          className="flex flex-col items-start gap-4 rounded-2xl border border-dashed border-gold-deep/40 bg-gold/5 p-6 sm:flex-row sm:items-center sm:gap-6 sm:p-8"
          data-testid="shop-coming-soon"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-linegold bg-gold/15">
            <Clock size={22} className="text-gold-deep" />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-xl font-semibold text-char">
              {t("shop.title")}
            </h3>
            <p className="mt-1 text-sm text-slate-600">{t("shop.text")}</p>
          </div>
        </div>
      </Reveal>
    </section>
  );
}