import { createFileRoute } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Card } from "@/components/Card";
import { useAuth } from "@/auth";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/api/errors";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, ShieldCheck, KeyRound, Eye, EyeOff, Lock, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

function ProfilePage() {
  const { user, updateProfile, changePassword } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  if (!user) return null;

  const onSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Họ và tên không được để trống");
      return;
    }
    setSaving(true);
    try {
      await updateProfile(trimmed);
      toast.success("Cập nhật thông tin cá nhân thành công");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Cập nhật thất bại";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const onChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error("Vui lòng nhập mật khẩu hiện tại");
      return;
    }
    if (!newPassword) {
      toast.error("Vui lòng nhập mật khẩu mới");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Mật khẩu mới phải có ít nhất 8 ký tự");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không trùng khớp");
      return;
    }

    setChangingPw(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success("Đổi mật khẩu thành công!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Đổi mật khẩu thất bại";
      toast.error(msg);
    } finally {
      setChangingPw(false);
    }
  };

  // Password requirements calculation
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumberOrSpecial = /[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);

  return (
    <AppLayout>
      <PageHeader title="Profile Settings" subtitle="Quản lý thông tin tài khoản và bảo mật cá nhân" />

      <div className="max-w-3xl mx-auto w-full">
        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 h-12 p-1 bg-secondary/50 rounded-xl border border-border/50">
            <TabsTrigger
              value="account"
              className="flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <User className="w-4 h-4 text-brand" />
              <span>Thông tin tài khoản</span>
            </TabsTrigger>

            <TabsTrigger
              value="security"
              className="flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <ShieldCheck className="w-4 h-4 text-brand" />
              <span>Đổi mật khẩu & Bảo mật</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            <Card title="Thông tin cá nhân">
              <form onSubmit={onSubmitProfile} className="space-y-5">
                <Field label="Họ và tên" value={name} onChange={setName} placeholder="Nhập họ và tên..." />
                <Field
                  label="Địa chỉ Email"
                  value={user.email}
                  onChange={() => {}}
                  type="email"
                  disabled
                  hint="Email là định danh tài khoản và không thể tự thay đổi"
                />
                <Field label="Vai trò hệ thống" value={user.role} onChange={() => {}} disabled />

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="h-10 px-6 rounded-lg text-sm font-semibold text-brand-foreground glow-brand disabled:opacity-60 transition-all hover:brightness-110"
                    style={{ background: "var(--gradient-brand)" }}
                  >
                    {saving ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </div>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card title="Cập nhật mật khẩu">
              <form onSubmit={onChangePasswordSubmit} className="space-y-5">
                <PasswordField
                  label="Mật khẩu hiện tại"
                  value={currentPassword}
                  onChange={setCurrentPassword}
                  show={showCurrentPw}
                  toggleShow={() => setShowCurrentPw(!showCurrentPw)}
                  placeholder="Nhập mật khẩu hiện tại..."
                  hint="Nhập mật khẩu bạn đang sử dụng để xác minh"
                />

                <PasswordField
                  label="Mật khẩu mới"
                  value={newPassword}
                  onChange={setNewPassword}
                  show={showNewPw}
                  toggleShow={() => setShowNewPw(!showNewPw)}
                  placeholder="Nhập mật khẩu mới..."
                />

                {/* Password strength guide */}
                {newPassword.length > 0 && (
                  <div className="p-3 bg-secondary/30 rounded-lg border border-border/40 text-xs space-y-1.5">
                    <p className="font-semibold text-muted-foreground mb-1">Yêu cầu mật khẩu an toàn:</p>
                    <RequirementItem met={hasMinLength} text="Tối thiểu 8 ký tự" />
                    <RequirementItem met={hasUppercase} text="Chứa ít nhất 1 chữ cái in hoa (A-Z)" />
                    <RequirementItem met={hasLowercase} text="Chứa ít nhất 1 chữ cái in thường (a-z)" />
                    <RequirementItem met={hasNumberOrSpecial} text="Chứa ít nhất 1 chữ số hoặc ký tự đặc biệt" />
                  </div>
                )}

                <PasswordField
                  label="Xác nhận mật khẩu mới"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  show={showConfirmPw}
                  toggleShow={() => setShowConfirmPw(!showConfirmPw)}
                  placeholder="Nhập lại mật khẩu mới..."
                />

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={changingPw}
                    className="h-10 px-6 rounded-lg text-sm font-semibold text-brand-foreground glow-brand disabled:opacity-60 transition-all hover:brightness-110 flex items-center gap-2"
                    style={{ background: "var(--gradient-brand)" }}
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>{changingPw ? "Đang cập nhật..." : "Cập nhật mật khẩu"}</span>
                  </button>
                </div>
              </form>
            </Card>
          </TabsContent>
        </Tabs>
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
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  disabled?: boolean;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="mt-1.5 w-full h-10 px-3.5 bg-secondary/40 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 disabled:opacity-60 transition-all"
      />
      {hint ? <p className="text-[11px] text-muted-foreground mt-1">{hint}</p> : null}
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  show,
  toggleShow,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  toggleShow: () => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div>
      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</label>
      <div className="relative mt-1.5">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-10 pl-3.5 pr-10 bg-secondary/40 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 transition-all"
        />
        <button
          type="button"
          onClick={toggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {hint ? <p className="text-[11px] text-muted-foreground mt-1">{hint}</p> : null}
    </div>
  );
}

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-2 ${met ? "text-emerald-500 font-medium" : "text-muted-foreground"}`}>
      <CheckCircle2 className={`w-3.5 h-3.5 ${met ? "opacity-100" : "opacity-30"}`} />
      <span>{text}</span>
    </div>
  );
}
