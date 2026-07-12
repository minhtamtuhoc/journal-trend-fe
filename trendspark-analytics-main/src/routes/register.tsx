import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { ApiError } from "@/api/errors";
import { AuthShell } from "@/components/AuthShell";
import { useAuth, type RegisterRole } from "@/auth";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/register")({ component: RegisterPage });

const schema = z.object({
  name: z.string().min(2, "Name too short"),
  email: z.string().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "Min 8 characters")
    .regex(/[A-Z]/, "Include at least one uppercase letter")
    .regex(/\d/, "Include at least one digit"),
  role: z.enum(["STUDENT", "LECTURER", "RESEARCHER"], {
    errorMap: () => ({ message: "Please select a role" }),
  }),
});

const TAKEN = ["taken@helix.io"];

const ROLE_OPTIONS = [
  { label: "Student", value: "STUDENT" },
  { label: "Lecturer", value: "LECTURER" },
  { label: "Researcher", value: "RESEARCHER" },
];

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
  const [role, setRole] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);
  const [roleErr, setRoleErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setRoleErr(null);

    const r = schema.safeParse({ name, email, password, role });
    if (!r.success) {
      const roleIssue = r.error.issues.find((issue) => issue.path.includes("role"));
      if (roleIssue) {
        setRoleErr(roleIssue.message);
        return;
      }
      return setErr(r.error.issues[0].message);
    }
    if (TAKEN.includes(email)) return setErr("Email already in use");
    setErr(null);
    setLoading(true);
    
    const data = { name, email, password, role };
    console.log("FORM DATA", data);

    try {
      await register(name, email, password, role as RegisterRole);
      toast.success("Registration successful. Please verify your email.");
      navigate({ to: "/verify-email", search: { email } });
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Registration failed";
      
      if (message.toLowerCase().includes("role")) {
        setRoleErr(message);
      } else {
        setErr(message);
        toast.error(message);
      }
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
        
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</label>
          <Select value={role} onValueChange={(val) => { setRole(val); setRoleErr(null); }}>
            <SelectTrigger className="mt-1 w-full h-10 px-3 bg-secondary/40 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 text-left cursor-pointer">
              <SelectValue placeholder="Select your role" />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="cursor-pointer">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {roleErr && <div className="mt-1 text-xs text-destructive">{roleErr}</div>}
        </div>

        {err && <div className="text-xs text-destructive">{err}</div>}
        <button disabled={loading} type="submit" className="w-full h-10 rounded-lg text-sm font-semibold text-brand-foreground glow-brand transition-transform hover:scale-[1.01] disabled:opacity-60" style={{ background: "var(--gradient-brand)" }}>
          {loading ? "Creating..." : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}