import { useEffect } from "react";
import { BrowserRouter, Link, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Lenis from "lenis";
import { useAuth, AuthProvider } from "@/context/AuthContext";
import { QuoteProvider } from "@/context/QuoteContext";
import { LangProvider } from "@/i18n";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ErrorBoundary from "@/components/ErrorBoundary";
import { Toaster } from "@/components/ui/sonner";
import { track } from "@/lib/track";
import HomePage from "@/pages/HomePage";
import CatalogPage from "@/pages/CatalogPage";
import ProductPage from "@/pages/ProductPage";
import AboutPage from "@/pages/AboutPage";
import ContactPage from "@/pages/ContactPage";
import ContentPage from "@/pages/ContentPage";
import SitemapPage from "@/pages/SitemapPage";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminLayout from "@/pages/admin/AdminLayout";

function SiteChrome() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

function ScrollAndTrack() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
    if (!pathname.startsWith("/admin")) {
      track("pageview", pathname);
    }
  }, [pathname]);
  return null;
}

function LenisSetup() {
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    let raf;
    const loop = (t) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);
  return null;
}

function ProtectedAdmin() {
  const { user } = useAuth();
  if (user === null)
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink text-sm text-slate-400" data-testid="admin-loading">
        Verifica sessione…
      </div>
    );
  if (user === false) return <Navigate to="/admin/login" replace />;
  return <AdminLayout />;
}

function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper px-6 text-center" data-testid="not-found-page">
      <p className="eyebrow">Errore 404</p>
      <h1 className="font-display text-4xl font-semibold text-char">Pagina non trovata</h1>
      <p className="max-w-md text-slate-600">La pagina che cerchi non esiste o è stata spostata.</p>
      <Link to="/" className="btn-gold mt-2" data-testid="not-found-home-link">
        Torna alla home
      </Link>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <LangProvider>
          <AuthProvider>
            <BrowserRouter>
              <LenisSetup />
              <ScrollAndTrack />
              <QuoteProvider>
                <Routes>
                  <Route element={<SiteChrome />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/catalogo" element={<CatalogPage />} />
                    <Route path="/prodotti/:slug" element={<ProductPage />} />
                    <Route path="/chi-siamo" element={<AboutPage />} />
                    <Route path="/contatti" element={<ContactPage />} />
                    <Route path="/informazioni/:slug" element={<ContentPage />} />
                    <Route path="/mappa-sito" element={<SitemapPage />} />
                  </Route>
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin" element={<ProtectedAdmin />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </QuoteProvider>
              <Toaster position="top-center" richColors />
            </BrowserRouter>
          </AuthProvider>
        </LangProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;