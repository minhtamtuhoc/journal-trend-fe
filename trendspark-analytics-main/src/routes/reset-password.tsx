import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { AuthShell } from "@/components/AuthShell";
import { toast } from "sonner";
import { getServices } from "@/services";
import { Eye, EyeOff } from "lucide-react";

const searchSchema = z.object({
  token: z.string().catch(""),
});

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  validateSearch: (s) => searchSchema.parse(s),
});

function ResetPasswordPage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isTokenInvalid = !token || token.trim() === "";

  // Realtime validation
  const showPasswordError = newPassword.length > 0 && newPassword.length < 8;
  const showConfirmError = confirmPassword.length > 0 && confirmPassword !== newPassword;

  const isFormValid =
    !isTokenInvalid &&
    newPassword.length >= 8 &&
    confirmPassword === newPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !isFormValid) return;

    setApiError(null);
    setLoading(true);

    try {
      await getServices().auth.resetPassword(token, newPassword);
      toast.success("Password has been successfully changed!");
      navigate({ to: "/login" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Password reset failed";
      setApiError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Reset Password"
      subtitle="Enter your new password below."
      footer={
        <Link to="/login" className="text-brand hover:underline">
          Back to sign in
        </Link>
      }
    >
      {isTokenInvalid ? (
        <div className="space-y-4">
          <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/10 text-sm text-destructive">
            Invalid or expired reset link
          </div>
          <button
            disabled
            className="w-full h-10 rounded-lg text-sm font-semibold text-brand-foreground opacity-50 cursor-not-allowed"
            style={{ background: "var(--gradient-brand)" }}
          >
            Reset Password
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              New Password
            </label>
            <div className="relative mt-1">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                placeholder="Min 8 characters"
                className="w-full h-10 pl-3 pr-10 bg-secondary/40 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {showPasswordError && (
              <div className="mt-1 text-xs text-destructive">
                Password must be at least 8 characters
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Confirm Password
            </label>
            <div className="relative mt-1">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                placeholder="Confirm your password"
                className="w-full h-10 pl-3 pr-10 bg-secondary/40 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {showConfirmError && (
              <div className="mt-1 text-xs text-destructive">
                Passwords do not match
              </div>
            )}
          </div>

          {apiError && (
            <div className="text-xs text-destructive">{apiError}</div>
          )}

          <button
            type="submit"
            disabled={loading || !isFormValid}
            className="w-full h-10 rounded-lg text-sm font-semibold text-brand-foreground glow-brand disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "var(--gradient-brand)" }}
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
