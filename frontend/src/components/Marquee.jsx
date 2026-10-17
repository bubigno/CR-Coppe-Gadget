import { useLang } from "@/i18n";

function Row({ ariaHidden = false, items }) {
  return (
    <div aria-hidden={ariaHidden} className="flex shrink-0 items-center">
      {items.map((t, i) => (
        <span key={i} className="flex items-center">
          <span className="whitespace-nowrap px-6 font-display text-2xl font-medium uppercase tracking-wide text-char/25 sm:text-3xl">
            {t}
          </span>
          <span className="h-1.5 w-1.5 rotate-45 bg-gold/70" />
        </span>
      ))}
    </div>
  );
}

export default function Marquee() {
  const { t } = useLang();
  const items = ["mq.1", "mq.2", "mq.3", "mq.4", "mq.5", "mq.6", "mq.7"].map((k) => t(k));
  return (
    <div
      className="relative overflow-hidden border-y border-line bg-surface/60 py-6"
      data-testid="editorial-marquee"
    >
      <div className="flex w-max animate-marquee">
        <Row items={items} />
        <Row items={items} ariaHidden />
      </div>
    </div>
  );
}