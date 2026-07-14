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
  name: z
    .string()
    .trim()
    .min(1, "Please enter your full name")
    .min(2, "Full name must be at least 2 characters"),
  email: z
    .string()
    .trim()
    .min(1, "Please enter your email address")
    .email("Enter a valid email address"),
  password: z
    .string()
    .min(1, "Please enter a password")
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

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  error?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`mt-1 w-full h-10 px-3 bg-secondary/40 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 ${
          error ? "border-destructive focus:ring-destructive/40" : "border-border"
        }`}
      />
      {error && <div className="mt-1 text-xs text-destructive">{error}</div>}
    </div>
  );
}

type FormErrors = {
  name?: string;
  email?: string;
  password?: string;
  role?: string;
  global?: string;
};

function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const r = schema.safeParse({ name, email, password, role });
    if (!r.success) {
      const fieldErrors: FormErrors = {};
      for (const issue of r.error.issues) {
        const key = issue.path[0] as keyof FormErrors;
        if (key && !fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }
    if (TAKEN.includes(email)) {
      setErrors({ email: "Email already in use" });
      return;
    }

    setLoading(true);

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
        setErrors({ role: message });
      } else if (message.toLowerCase().includes("email")) {
        setErrors({ email: message });
      } else {
        setErrors({ global: message });
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
        <Field
          label="Full name"
          value={name}
          onChange={(v) => {
            setName(v);
            if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
          }}
          placeholder="Dr. Jane Doe"
          error={errors.name}
        />
        <Field
          label="Email"
          type="email"
          value={email}
          onChange={(v) => {
            setEmail(v);
            if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
          }}
          placeholder="you@lab.edu"
          error={errors.email}
        />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={(v) => {
            setPassword(v);
            if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
          }}
          placeholder="At least 8 characters"
          error={errors.password}
        />
        
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</label>
          <Select
            value={role}
            onValueChange={(val) => {
              setRole(val);
              if (errors.role) setErrors((prev) => ({ ...prev, role: undefined }));
            }}
          >
            <SelectTrigger className={`mt-1 w-full h-10 px-3 bg-secondary/40 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 text-left cursor-pointer ${
              errors.role ? "border-destructive focus:ring-destructive/40" : "border-border"
            }`}>
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
          {errors.role && <div className="mt-1 text-xs text-destructive">{errors.role}</div>}
        </div>

        {errors.global && <div className="text-xs text-destructive">{errors.global}</div>}
        <button disabled={loading} type="submit" className="w-full h-10 rounded-lg text-sm font-semibold text-brand-foreground glow-brand transition-transform hover:scale-[1.01] disabled:opacity-60" style={{ background: "var(--gradient-brand)" }}>
          {loading ? "Creating..." : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}