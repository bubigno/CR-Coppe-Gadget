import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FolderTree,
  Globe,
  LayoutDashboard,
  LogOut,
  Package,
  ReceiptText,
} from "lucide-react";
import Logo from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import Dashboard from "@/pages/admin/Dashboard";
import AdminProducts from "@/pages/admin/AdminProducts";
import AdminCategories from "@/pages/admin/AdminCategories";
import AdminRequests from "@/pages/admin/AdminRequests";
import AdminContent from "@/pages/admin/AdminContent";

const SECTIONS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "products", label: "Prodotti", icon: Package },
  { id: "categories", label: "Categorie", icon: FolderTree },
  { id: "requests", label: "Richieste", icon: ReceiptText },
  { id: "content", label: "Contenuti & SEO", icon: Globe },
];

export default function AdminLayout() {
  const [section, setSection] = useState("dashboard");
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-paper" data-testid="admin-panel">
      <header className="glass sticky top-0 z-40 border-b border-line" data-testid="admin-header">
        <div className="container-x flex items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-3">
            <Logo size={36} withText={false} />
            <div>
              <p className="font-display text-sm font-semibold text-char">Pannello amministrativo</p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-gold-deep">CR Coppe &amp; Gadget</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-slate-500 sm:block" data-testid="admin-user-login">{user?.username}</span>
            <Link to="/" className="btn-ghost !px-4 !py-2 !text-xs" data-testid="admin-view-site">
              Vai al sito
            </Link>
            <button onClick={logout} className="btn-ghost !px-4 !py-2 !text-xs" data-testid="admin-logout-button">
              <LogOut size={14} /> Esci
            </button>
          </div>
        </div>
        <nav className="container-x flex gap-1 overflow-x-auto pb-2" aria-label="Sezioni amministrative" data-testid="admin-nav">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                section === s.id
                  ? "bg-gold text-char"
                  : "text-slate-600 hover:bg-surface2 hover:text-gold-deep"
              }`}
              data-testid={`admin-nav-${s.id}`}
            >
              <s.icon size={15} /> {s.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="container-x py-8">
        {section === "dashboard" && <Dashboard />}
        {section === "products" && <AdminProducts />}
        {section === "categories" && <AdminCategories />}
        {section === "requests" && <AdminRequests />}
        {section === "content" && <AdminContent />}
      </main>
    </div>
  );
}