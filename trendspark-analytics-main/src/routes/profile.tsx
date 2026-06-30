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
  const [notif, setNotif] = useState({ trends: true, papers: true, journals: false });

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  if (!user) return null;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Họ tên không được để trống");
      return;
    }
    setSaving(true);
    try {
      await updateProfile(trimmed);
      toast.success("Đã cập nhật hồ sơ");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Cập nhật thất bại";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <PageHeader title="Profile Settings" subtitle="Manage your account and notification preferences" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Account" className="lg:col-span-2">
          <form onSubmit={onSubmit} className="space-y-4">
            <Field label="Full name" value={name} onChange={setName} />
            <Field label="Email" value={user.email} onChange={() => { }} type="email" disabled hint="Email không thể đổi qua hệ thống" />
            <Field label="Role" value={user.role} onChange={() => { }} disabled />
            <button
              type="submit"
              disabled={saving}
              className="h-10 px-5 rounded-lg text-sm font-semibold text-brand-foreground glow-brand disabled:opacity-60"
              style={{ background: "var(--gradient-brand)" }}
            >
              {saving ? "Đang lưu…" : "Save changes"}
            </button>
          </form>
        </Card>

        <Card title="Notification Preferences">
          <p className="text-xs text-muted-foreground mb-3">Lưu cục bộ trên trình duyệt (sắp có đồng bộ server).</p>
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
