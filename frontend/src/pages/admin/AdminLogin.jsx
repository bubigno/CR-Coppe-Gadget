import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, LogIn } from "lucide-react";
import Logo from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import { formatApiErrorDetail } from "@/lib/api";

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username.trim(), password.trim());
      navigate("/admin", { replace: true });
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hero-glow flex min-h-screen items-center justify-center px-4 py-16" data-testid="admin-login-page">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo size={52} />
        </div>
        <div className="card-surface p-8 shadow-[0_30px_80px_rgba(25,28,34,0.10)]" data-testid="admin-login-card">
          <p className="eyebrow mb-2 text-center">Area riservata</p>
          <h1 className="mb-1 text-center font-display text-2xl font-semibold text-char">Pannello amministrativo</h1>
          <p className="mb-7 text-center text-sm text-slate-600">
            Accesso consentito solo agli amministratori autorizzati.
          </p>

          <form onSubmit={submit} className="flex flex-col gap-4" data-testid="admin-login-form">
            <div>
              <label className="field-label" htmlFor="a-username">Username</label>
              <input
                id="a-username"
                type="text"
                required
                minLength={3}
                maxLength={80}
                autoComplete="username"
                autoCapitalize="none"
                className="field"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                data-testid="admin-login-username"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="a-password">Password</label>
              <input
                id="a-password"
                type="password"
                required
                autoComplete="current-password"
                className="field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="admin-login-password"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-600" data-testid="admin-login-error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-gold w-full disabled:opacity-60" data-testid="admin-login-button">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
              {loading ? "Verifica in corso…" : "Accedi"}
            </button>
          </form>
        </div>
        <p className="mt-6 text-center text-xs text-slate-500">
          Non esiste una registrazione pubblica: le credenziali vengono gestite lato server.
        </p>
      </div>
    </div>
  );
}