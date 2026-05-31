import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { ApiError } from "@/api/errors";
import { AuthShell } from "@/components/AuthShell";
import { useAuth } from "@/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({ component: RegisterPage });

const schema = z.object({
  name: z.string().min(2, "Name too short"),
  email: z.string().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "Min 8 characters")
    .regex(/[A-Z]/, "Include at least one uppercase letter")
    .regex(/\d/, "Include at least one digit"),
});

const TAKEN = ["taken@helix.io"];

function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-1 w-full h-10 px-3 bg-secondary/40 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/40" />
    </div>
  );
}

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = schema.safeParse({ name, email, password });
    if (!r.success) return setErr(r.error.issues[0].message);
    if (TAKEN.includes(email)) return setErr("Email already in use");
    setErr(null);
    setLoading(true);
    try {
      await register(name, email, password);
      toast.success("Account created");
      navigate({ to: "/dashboard" });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Registration failed";
      setErr(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Join Helix Analytics"
      subtitle="Track citations, trends, and authors across global journals."
      footer={<>Already have an account? <Link to="/login" className="text-brand hover:underline">Sign in</Link></>}
    >
      <form onSubmit={submit} className="space-y-4">
        <Field label="Full name" value={name} onChange={setName} placeholder="Dr. Jane Doe" />
        <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@lab.edu" />
        <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="At least 8 characters" />
        {err && <div className="text-xs text-destructive">{err}</div>}
        <button disabled={loading} type="submit" className="w-full h-10 rounded-lg text-sm font-semibold text-brand-foreground glow-brand transition-transform hover:scale-[1.01] disabled:opacity-60" style={{ background: "var(--gradient-brand)" }}>
          {loading ? "Creating..." : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}