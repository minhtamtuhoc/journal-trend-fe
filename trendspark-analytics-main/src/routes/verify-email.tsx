import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { AuthShell } from "@/components/AuthShell";
import { apiClient } from "@/api/client";
import { ApiError } from "@/api/errors";
import { toast } from "sonner";
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";

const verifyEmailSchema = z.object({
  email: z.string().email().optional(),
});

export const Route = createFileRoute("/verify-email")({
  component: VerifyEmailPage,
  validateSearch: (s) => verifyEmailSchema.parse(s),
});

function VerifyEmailPage() {
  const { email } = Route.useSearch();
  const navigate = useNavigate();
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!email) {
      toast.error("Verification email not found. Please register again.");
      navigate({ to: "/register" });
      return;
    }

    // Polling interval: 3 seconds
    const interval = setInterval(async () => {
      try {
        const response = await apiClient.get<{ verified: boolean }>("/auth/check-verification-status", {
          params: { email },
        });

        if (response?.verified) {
          clearInterval(interval);
          setVerified(true);
          toast.success("Email verification successful!");
          
          // Wait 2 seconds and redirect to login
          setTimeout(() => {
            navigate({ to: "/login" });
          }, 2000);
        }
      } catch (error) {
        console.error("Error checking verification status:", error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [email, navigate]);

  // Countdown timer for resend button to prevent spamming
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResend = async () => {
    if (!email || countdown > 0 || resending) return;

    setResending(true);
    try {
      await apiClient.post("/auth/resend-verification", null, {
        params: { email },
      });
      toast.success("A new verification email has been sent. Please check your inbox!");
      setCountdown(60); // Cool down of 60 seconds
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Resending verification email failed";
      toast.error(message);
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell
      title={verified ? "Verification Successful!" : "Verify Your Email"}
      subtitle={verified ? "Your account is ready to use." : "Please check your inbox to activate your account."}
      footer={
        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-brand transition-colors">
          <ArrowLeft className="size-3" /> Back to Login
        </Link>
      }
    >
      <div className="flex flex-col items-center justify-center py-6 text-center space-y-6">
        {verified ? (
          <div className="size-16 rounded-full bg-success/10 border border-success/30 flex items-center justify-center animate-bounce text-success">
            <CheckCircle2 className="size-8" />
          </div>
        ) : (
          <div className="relative flex items-center justify-center">
            <div className="size-16 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
              <Mail className="size-7" />
            </div>
            <div className="absolute -inset-1 rounded-full border border-dashed border-brand/40 animate-spin" style={{ animationDuration: "8s" }} />
          </div>
        )}

        <div className="space-y-2 max-w-sm">
          {verified ? (
            <p className="text-sm text-muted-foreground">
              The system will automatically redirect you to the login page shortly...
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                We have sent a verification email to:
              </p>
              <p className="text-sm font-semibold text-foreground bg-secondary/30 px-3 py-1.5 rounded-lg border border-border/50 inline-block font-mono">
                {email}
              </p>
              <p className="text-xs text-muted-foreground pt-2">
                Please check your inbox (including spam folder) and click the verification link to activate your account.
              </p>
            </>
          )}
        </div>

        {!verified && (
          <div className="w-full pt-4 space-y-3">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground font-medium">
              <Loader2 className="size-3 animate-spin text-brand" />
              Waiting for email verification...
            </div>

            <button
              onClick={handleResend}
              disabled={resending || countdown > 0}
              className="w-full h-10 rounded-lg text-xs font-semibold border border-border bg-secondary/20 hover:bg-secondary/40 hover:border-brand/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              {resending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Resending...
                </>
              ) : countdown > 0 ? (
                `Resend in (${countdown}s)`
              ) : (
                "Resend confirmation email"
              )}
            </button>
          </div>
        )}
      </div>
    </AuthShell>
  );
}
