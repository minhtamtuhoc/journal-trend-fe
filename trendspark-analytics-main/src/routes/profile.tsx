import { createFileRoute } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Card } from "@/components/Card";
import { useAuth, isAdminUser } from "@/auth";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ApiError } from "@/api/errors";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, ShieldCheck, KeyRound, Eye, EyeOff, Lock, CheckCircle2, Sparkles, Clock, ExternalLink, AlertCircle } from "lucide-react";
import { useMyRoleRequest } from "@/hooks/data/use-role-request";
import { RoleRequestModal } from "@/components/RoleRequestModal";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

function ProfilePage() {
  const { user, updateProfile, changePassword } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);

  const { data: pendingRequest, refetch: refetchPendingRequest } = useMyRoleRequest();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [currentPwError, setCurrentPwError] = useState<string | null>(null);
  const [newPwError, setNewPwError] = useState<string | null>(null);
  const [confirmPwError, setConfirmPwError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  if (!user) return null;

  const displayRole = user.rawRole || user.role;

  const handleCurrentPwChange = (val: string) => {
    setCurrentPassword(val);
    if (currentPwError) setCurrentPwError(null);
  };

  const handleNewPwChange = (val: string) => {
    setNewPassword(val);
    if (newPwError) setNewPwError(null);
  };

  const handleConfirmPwChange = (val: string) => {
    setConfirmPassword(val);
    if (confirmPwError) setConfirmPwError(null);
  };

  const onSubmitProfile = async (e: React.FormEvent) => {
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
      const msg = err instanceof ApiError ? err.message : "Profile update failed";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const onChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPwError(null);
    setNewPwError(null);
    setConfirmPwError(null);

    let hasBlankError = false;

    if (!currentPassword) {
      setCurrentPwError("Please enter your current password");
      hasBlankError = true;
    }
    if (!newPassword) {
      setNewPwError("Please enter a new password");
      hasBlankError = true;
    }
    if (!confirmPassword) {
      setConfirmPwError("Please confirm your new password");
      hasBlankError = true;
    }

    if (hasBlankError) {
      return;
    }

    if (!hasMinLength || !hasUppercase || !hasDigit) {
      setNewPwError("New password must be at least 8 characters long and contain at least one uppercase letter and one digit (0-9)");
      return;
    }
    if (newPassword !== confirmPassword) {
      setConfirmPwError("Confirm password does not match new password");
      return;
    }

    setChangingPw(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setCurrentPwError(null);
      setNewPwError(null);
      setConfirmPwError(null);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Password change failed";
      if (
        msg.toLowerCase().includes("current password") ||
        msg.toLowerCase().includes("incorrect")
      ) {
        setCurrentPwError("Incorrect current password. Please check and try again.");
      } else {
        toast.error(msg);
      }
    } finally {
      setChangingPw(false);
    }
  };

  // Password requirements calculation (matching BE PasswordValidator: min 8, uppercase, digit)
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasDigit = /[0-9]/.test(newPassword);

  const confirmPasswordStatus =
    confirmPassword.length > 0
      ? confirmPassword === newPassword
        ? { type: "success" as const, text: "Passwords match" }
        : { type: "error" as const, text: "Confirm password does not match new password" }
      : undefined;

  const formattedDate = pendingRequest?.createdAt
    ? new Date(pendingRequest.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <AppLayout>
      <PageHeader title="Profile Settings" subtitle="Manage your account information and personal security" />

      <div className="max-w-3xl mx-auto w-full">
        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 h-12 p-1 bg-secondary/50 rounded-xl border border-border/50">
            <TabsTrigger
              value="account"
              className="flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <User className="w-4 h-4 text-brand" />
              <span>Account Information</span>
            </TabsTrigger>

            <TabsTrigger
              value="security"
              className="flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <ShieldCheck className="w-4 h-4 text-brand" />
              <span>Password & Security</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            <Card title="Personal Information">
              <form onSubmit={onSubmitProfile} className="space-y-5">
                <Field label="Full Name" value={name} onChange={setName} placeholder="Enter your full name..." />
                <Field
                  label="Email Address"
                  value={user.email}
                  onChange={() => {}}
                  type="email"
                  disabled
                  hint="Email is your account identifier and cannot be changed"
                />

                {/* Role field with upgrade request action / status banner */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      System Role
                    </label>

                    {/* Show request button if no pending request */}
                    {!pendingRequest && !isAdminUser(user) && (
                      <button
                        type="button"
                        onClick={() => setShowRoleModal(true)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-brand hover:underline"
                      >
                        <Sparkles className="size-3.5" />
                        <span>Request Role Change</span>
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      disabled
                      value={displayRole}
                      className="w-full h-10 px-3 rounded-lg border border-border bg-secondary/50 text-foreground text-sm font-medium opacity-80 cursor-not-allowed"
                    />
                  </div>

                  {/* Pending Request Status Banner */}
                  {pendingRequest && (
                    <div className="p-3 bg-brand/10 border border-brand/30 rounded-xl space-y-1 text-xs">
                      <div className="flex items-center justify-between font-semibold text-brand">
                        <span className="flex items-center gap-1.5">
                          <Clock className="size-3.5 animate-spin" />
                          Pending Review: {pendingRequest.currentRole} → {pendingRequest.requestedRole}
                        </span>
                        <span className="text-[11px] font-mono text-muted-foreground">{formattedDate}</span>
                      </div>
                      {pendingRequest.proofUrl && (
                        <a
                          href={pendingRequest.proofUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-brand hover:underline"
                        >
                          <ExternalLink className="size-3" />
                          Submitted Proof
                        </a>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="h-10 px-6 rounded-lg text-sm font-semibold text-brand-foreground glow-brand disabled:opacity-60 transition-all hover:brightness-110"
                    style={{ background: "var(--gradient-brand)" }}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </Card>

            <RoleRequestModal
              open={showRoleModal}
              onOpenChange={setShowRoleModal}
              currentRole={user.role}
              onSuccess={() => void refetchPendingRequest()}
            />
          </TabsContent>

          <TabsContent value="security">
            <Card title="Update Password">
              <form onSubmit={onChangePasswordSubmit} className="space-y-5">
                <PasswordField
                  label="Current Password"
                  value={currentPassword}
                  onChange={handleCurrentPwChange}
                  show={showCurrentPw}
                  toggleShow={() => setShowCurrentPw(!showCurrentPw)}
                  placeholder="Enter current password..."
                  hint="Enter your current password to verify identity"
                  error={currentPwError || undefined}
                />

                <PasswordField
                  label="New Password"
                  value={newPassword}
                  onChange={handleNewPwChange}
                  show={showNewPw}
                  toggleShow={() => setShowNewPw(!showNewPw)}
                  placeholder="Enter new password..."
                  error={newPwError || undefined}
                />

                {/* Password strength guide */}
                {newPassword.length > 0 && (
                  <div className="p-3 bg-secondary/30 rounded-lg border border-border/40 text-xs space-y-1.5">
                    <p className="font-semibold text-muted-foreground mb-1">Password Security Requirements:</p>
                    <RequirementItem met={hasMinLength} text="At least 8 characters long" />
                    <RequirementItem met={hasUppercase} text="Contains at least 1 uppercase letter (A-Z)" />
                    <RequirementItem met={hasLowercase} text="Contains at least 1 lowercase letter (a-z)" />
                    <RequirementItem met={hasDigit} text="Contains at least 1 digit (0-9)" />
                  </div>
                )}

                <PasswordField
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChange={handleConfirmPwChange}
                  show={showConfirmPw}
                  toggleShow={() => setShowConfirmPw(!showConfirmPw)}
                  placeholder="Re-enter new password..."
                  error={confirmPwError || undefined}
                  statusMessage={!confirmPwError ? confirmPasswordStatus : undefined}
                />

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={changingPw || Boolean(confirmPasswordStatus && confirmPasswordStatus.type === "error")}
                    className="h-10 px-6 rounded-lg text-sm font-semibold text-brand-foreground glow-brand disabled:opacity-60 transition-all hover:brightness-110 flex items-center gap-2"
                    style={{ background: "var(--gradient-brand)" }}
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>{changingPw ? "Updating..." : "Update Password"}</span>
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
  error,
  statusMessage,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  toggleShow: () => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  statusMessage?: { type: "success" | "error"; text: string };
}) {
  const isError = Boolean(error) || (statusMessage && statusMessage.type === "error");
  const isSuccess = statusMessage && statusMessage.type === "success";

  return (
    <div>
      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</label>
      <div className="relative mt-1.5">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full h-10 pl-3.5 pr-10 bg-secondary/40 border rounded-lg text-sm outline-none transition-all ${
            isError
              ? "border-destructive focus:ring-2 focus:ring-destructive/30"
              : isSuccess
              ? "border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/30"
              : "border-border focus:ring-2 focus:ring-brand/40"
          }`}
        />
        <button
          type="button"
          onClick={toggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {error ? (
        <div className="flex items-center gap-1.5 text-xs text-destructive mt-1 font-medium animate-in fade-in-50">
          <AlertCircle className="size-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : statusMessage ? (
        <div
          className={`flex items-center gap-1.5 text-xs mt-1 font-medium animate-in fade-in-50 ${
            statusMessage.type === "success" ? "text-emerald-500" : "text-destructive"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="size-3.5 shrink-0" />
          ) : (
            <AlertCircle className="size-3.5 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      ) : hint ? (
        <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>
      ) : null}
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
