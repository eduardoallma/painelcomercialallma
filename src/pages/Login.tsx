import { useState, FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthProvider";

export default function Login() {
  const { session, loading, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (session) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const { error } = await signIn(email, password);
    if (error) {
      setError("Credenciais inválidas.");
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="font-display text-2xl font-bold text-foreground">Allma</h1>
          <p className="text-sm text-muted-foreground mt-1">Painel Comercial</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full h-10 px-3 bg-card text-foreground text-sm rounded-md border-0 outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1.5">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full h-10 px-3 bg-card text-foreground text-sm rounded-md border-0 outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-xs text-destructive">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-10 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {submitting ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
