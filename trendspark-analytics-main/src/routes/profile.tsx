import { createFileRoute } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Card } from "@/components/Card";
import { useAuth } from "@/auth";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/api/errors";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  if (!user) return null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Full name cannot be empty");
      return;
    }
    setSaving(true);
    try {
      await updateProfile(trimmed);
      toast.success("Profile updated successfully");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Update failed";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <PageHeader title="Profile Settings" subtitle="Manage your account profile" />

      <div className="max-w-2xl mx-auto w-full">
        <Card title="Account">
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Full name" value={name} onChange={setName} />
            <Field label="Email" value={user.email} onChange={() => {}} type="email" disabled hint="Email cannot be changed through the system" />
            <Field label="Role" value={user.role} onChange={() => {}} disabled />
            <button
              type="submit"
              disabled={saving}
              className="h-10 px-5 rounded-lg text-sm font-semibold text-brand-foreground glow-brand disabled:opacity-60"
              style={{ background: "var(--gradient-brand)" }}
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </form>
        </Card>
      </div>
    </AppLayout>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  disabled = false,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="mt-1 w-full h-10 px-3 bg-secondary/40 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 disabled:opacity-60"
      />
      {hint ? <p className="text-[10px] text-muted-foreground mt-1">{hint}</p> : null}
    </div>
  );
}
