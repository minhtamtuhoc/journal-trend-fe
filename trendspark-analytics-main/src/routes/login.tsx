import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { authStorage } from "@/auth/storage";
import { z } from "zod";
import { ApiError } from "@/api/errors";
import { AuthShell } from "@/components/AuthShell";
import { useAuth } from "@/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({ component: LoginPage });

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Min 8 characters"),
});

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    authStorage.setSession(null);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse({ email, password });
    if (!r.success) return setErr(r.error.issues[0].message);
    setErr(null);
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back");
      navigate({ to: "/dashboard" });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Sign in failed";
      setErr(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Sign in to your observatory"
      subtitle="Demo admin: admin@helix.io / admin12345"
      footer={
        <>
          No account? <Link to="/register" className="text-brand hover:underline">Create one</Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@lab.edu" className="mt-1 w-full h-10 px-3 bg-secondary/40 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/40" />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Password</label>
            <Link to="/forgot-password" className="text-[11px] text-brand hover:underline">Forgot?</Link>
          </div>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="mt-1 w-full h-10 px-3 bg-secondary/40 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/40" />
        </div>
        {err && <div className="text-xs text-destructive">{err}</div>}
        <button disabled={loading} type="submit" className="w-full h-10 rounded-lg text-sm font-semibold text-brand-foreground glow-brand transition-transform hover:scale-[1.01] disabled:opacity-60" style={{ background: "var(--gradient-brand)" }}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}