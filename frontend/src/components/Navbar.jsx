import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import Logo from "@/components/Logo";
import { useQuote } from "@/context/QuoteContext";
import { useLang } from "@/i18n";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { openQuote } = useQuote();
  const { t } = useLang();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const LINKS = [
    { to: "/", label: t("nav.home") },
    { to: "/catalogo", label: t("nav.catalog") },
    { to: "/chi-siamo", label: t("nav.about") },
    { to: "/contatti", label: t("nav.contact") },
  ];

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "glass border-b border-line py-2 shadow-[0_10px_40px_rgba(25,28,34,0.06)]" : "py-4"
      }`}
      data-testid="site-navbar"
    >
      <div className="container-x flex items-center justify-between gap-4">
        <Link to="/" aria-label="CR Coppe & Gadget — Home" data-testid="nav-home-logo">
          <Logo size={42} />
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Navigazione principale">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              data-testid={`nav-link-${l.to === "/" ? "home" : l.to.slice(1)}`}
              className={({ isActive }) =>
                `font-mono text-[11px] font-semibold uppercase tracking-[0.2em] transition-colors ${
                  isActive ? "text-gold-deep" : "text-slate-600 hover:text-gold-deep"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => openQuote()}
            data-testid="nav-quote-button"
            className="btn-gold hidden !px-6 !py-2.5 sm:inline-flex"
          >
            {t("nav.quote")}
          </button>
          <button
            className="rounded-lg border border-line p-2 text-char lg:hidden"
            onClick={() => setOpen(!open)}
            aria-label={open ? t("nav.menu_close") : t("nav.menu_open")}
            data-testid="nav-mobile-toggle"
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="glass overflow-hidden border-b border-line lg:hidden"
            aria-label="Navigazione mobile"
          >
            <div className="container-x flex flex-col gap-1 py-4">
              {LINKS.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  data-testid={`nav-mobile-link-${l.to === "/" ? "home" : l.to.slice(1)}`}
                  className="rounded-lg px-3 py-3 font-display text-lg text-char hover:bg-surface2 hover:text-gold-deep"
                >
                  {l.label}
                </Link>
              ))}
              <button
                onClick={() => {
                  setOpen(false);
                  openQuote();
                }}
                data-testid="nav-mobile-quote-button"
                className="btn-gold mt-3"
              >
                {t("nav.quote")}
              </button>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}