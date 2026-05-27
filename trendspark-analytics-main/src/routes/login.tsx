import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse({ email, password });
    if (!r.success) return setErr(r.error.issues[0].message);
    setErr(null);
    setLoading(true);
    await login(email, password);
    toast.success("Welcome back");
    navigate({ to: "/dashboard" });
  };

  return (
    <AuthShell
      title="Sign in to your observatory"
      subtitle="Use admin@helix.io for admin access (any password 8+ chars)"
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