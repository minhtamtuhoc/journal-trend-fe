import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { AuthShell } from "@/components/AuthShell";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({ component: ForgotPage });

function ForgotPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = z.string().email().safeParse(email);
    if (!r.success) return setErr("Enter a valid email");
    setErr(null);
    await new Promise((res) => setTimeout(res, 400));
    setSent(true);
    toast.success("Reset link sent (simulated)");
  };

  return (
    <AuthShell title="Reset your password" subtitle="We'll send a reset link to your inbox." footer={<Link to="/login" className="text-brand hover:underline">Back to sign in</Link>}>
      {sent ? (
        <div className="p-4 rounded-lg border border-success/30 bg-success/10 text-sm">
          If <span className="font-mono">{email}</span> exists, a reset link is on its way.
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@lab.edu" className="mt-1 w-full h-10 px-3 bg-secondary/40 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/40" />
          </div>
          {err && <div className="text-xs text-destructive">{err}</div>}
          <button type="submit" className="w-full h-10 rounded-lg text-sm font-semibold text-brand-foreground glow-brand" style={{ background: "var(--gradient-brand)" }}>
            Send reset link
          </button>
        </form>
      )}
    </AuthShell>
  );
}