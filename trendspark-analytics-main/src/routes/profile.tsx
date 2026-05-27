import { createFileRoute } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Card } from "@/components/Card";
import { useAuth } from "@/auth";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

function ProfilePage() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [notif, setNotif] = useState({ trends: true, papers: true, journals: false });

  if (!user) return null;

  return (
    <AppLayout>
      <PageHeader title="Profile Settings" subtitle="Manage your account and notification preferences" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Account" className="lg:col-span-2">
          <form onSubmit={(e) => { e.preventDefault(); toast.success("Profile updated"); }} className="space-y-4">
            <Field label="Full name" value={name} onChange={setName} />
            <Field label="Email" value={email} onChange={setEmail} type="email" />
            <Field label="Role" value={user.role} onChange={() => {}} disabled />
            <button type="submit" className="h-10 px-5 rounded-lg text-sm font-semibold text-brand-foreground glow-brand" style={{ background: "var(--gradient-brand)" }}>Save changes</button>
          </form>
        </Card>

        <Card title="Notification Preferences">
          <div className="space-y-4">
            {([["trends", "Trend alerts"], ["papers", "New papers"], ["journals", "Journal updates"]] as const).map(([k, l]) => (
              <label key={k} className="flex items-center justify-between text-sm">
                <span>{l}</span>
                <input
                  type="checkbox"
                  checked={notif[k]}
                  onChange={(e) => setNotif({ ...notif, [k]: e.target.checked })}
                  className="size-4 accent-[var(--brand)]"
                />
              </label>
            ))}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}

function Field({ label, value, onChange, type = "text", disabled = false }: { label: string; value: string; onChange: (v: string) => void; type?: string; disabled?: boolean }) {
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
    </div>
  );
}