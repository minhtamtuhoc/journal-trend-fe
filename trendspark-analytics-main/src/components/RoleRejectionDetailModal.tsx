import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight, ShieldX } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

interface RoleRejectionDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message?: string;
  createdAt?: string;
}

export function RoleRejectionDetailModal({
  open,
  onOpenChange,
  message = "",
  createdAt,
}: RoleRejectionDetailModalProps) {
  const navigate = useNavigate();

  // Extract reason text from message (e.g., "Your role upgrade request has been rejected. Reason: The proof provided is insufficient or unclear")
  let reasonText = message;
  const reasonPrefix = "Reason:";
  if (message.includes(reasonPrefix)) {
    reasonText = message.split(reasonPrefix)[1].trim();
  }

  const formattedDate = createdAt
    ? new Date(createdAt).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-background border-border/80 shadow-2xl rounded-2xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2 text-destructive">
            <ShieldX className="size-6" />
            <DialogTitle className="text-xl font-bold">Role Change Rejection Reason</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground text-sm">
            Detailed feedback notification from System Administrator {formattedDate && `• ${formattedDate}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="p-4 bg-destructive/10 border border-destructive/25 rounded-xl space-y-2">
            <div className="flex items-center gap-2 font-semibold text-destructive text-sm">
              <AlertCircle className="size-4 shrink-0" />
              <span>Admin Rejection Reason:</span>
            </div>
            <div className="p-3 bg-background/80 rounded-lg border border-destructive/20 font-mono text-xs text-foreground leading-relaxed">
              "{reasonText}"
            </div>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            You can provide additional proof or prepare a clearer application before submitting a new role request in your Profile settings.
          </p>
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            onClick={() => {
              onOpenChange(false);
              void navigate({ to: "/profile" });
            }}
            className="w-full sm:w-auto bg-brand hover:brightness-110 text-brand-foreground font-semibold flex items-center gap-1.5"
          >
            <span>Go to Profile to submit new request</span>
            <ArrowRight className="size-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
