export default function Logo({ size = 40, withText = true, light = false }) {
  return (
    <span className="inline-flex items-center gap-3">
      <img
        src="/logo-cr.png"
        alt="Logo CR Coppe & Gadget"
        width={size}
        height={size}
        className="shrink-0 rounded-full"
        style={{ width: size, height: size, objectFit: "cover" }}
      />
      {withText && (
        <span className="leading-tight">
          <span className={`block font-display text-[15px] font-semibold tracking-tight ${light ? "text-white" : "text-char"}`}>
            CR Coppe &amp; Gadget
          </span>
          <span className="block font-mono text-[9px] uppercase tracking-[0.22em] text-gold-deep">
            Coppe &amp; Gadget S.R.L.
          </span>
        </span>
      )}
    </span>
  );
}