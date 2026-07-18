import { useState } from "react";
import { useRejectRoleRequest } from "@/hooks/data/use-role-request";
import {
  REJECTION_REASON_LABELS,
  type RoleRequestRejectionReason,
  type RoleUpgradeRequestResponse,
} from "@/types/role-request";
import { toast } from "sonner";
import { ApiError } from "@/api/errors";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertOctagon } from "lucide-react";

interface RoleRequestRejectModalProps {
  request: RoleUpgradeRequestResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const REASON_OPTIONS: RoleRequestRejectionReason[] = [
  "INSUFFICIENT_PROOF",
  "INVALID_PROOF",
  "OTHER",
];

export function RoleRequestRejectModal({ request, open, onOpenChange, onSuccess }: RoleRequestRejectModalProps) {
  const rejectMutation = useRejectRoleRequest();
  const [rejectionReason, setRejectionReason] = useState<RoleRequestRejectionReason>("INSUFFICIENT_PROOF");
  const [customReason, setCustomReason] = useState("");

  if (!request) return null;

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rejectionReason === "OTHER" && !customReason.trim()) {
      toast.error("Please enter a specific note when selecting OTHER");
      return;
    }

    try {
      await rejectMutation.mutateAsync({
        requestId: request.id,
        body: {
          rejectionReason,
          customReason: rejectionReason === "OTHER" ? customReason.trim() : undefined,
        } as any,
      });
      toast.success(`Rejected role request for ${request.userEmail}`);
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Rejection failed";
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-background border-border/80 shadow-2xl rounded-2xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2 text-destructive">
            <AlertOctagon className="size-5" />
            <DialogTitle className="text-xl font-bold">Reject Role Change Request</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground text-sm">
            Confirm rejection of request from <strong>{request.userName}</strong> ({request.userEmail}) requesting <strong>{request.requestedRole}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleReject} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Rejection Reason (Select from list)</Label>
            <Select
              value={rejectionReason}
              onValueChange={(val) => setRejectionReason(val as RoleRequestRejectionReason)}
            >
              <SelectTrigger className="w-full bg-secondary/30 border-border text-left font-medium text-sm">
                <SelectValue placeholder="Select rejection reason..." />
              </SelectTrigger>
              <SelectContent>
                {REASON_OPTIONS.map((code) => (
                  <SelectItem key={code} value={code}>
                    {code.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Reason Textarea when OTHER is selected */}
          {rejectionReason === "OTHER" && (
            <div className="space-y-1.5 animate-in fade-in-50 duration-200">
              <Label className="text-sm font-medium text-destructive">
                Detailed Rejection Note <span className="text-destructive">*</span>
              </Label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter detailed explanation or feedback for the user..."
                className="w-full min-h-[90px] p-3 rounded-lg border border-border bg-secondary/30 text-sm outline-none focus:border-brand transition-all resize-none"
              />
            </div>
          )}

          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs space-y-1">
            <p className="font-semibold text-destructive">System Notification Preview:</p>
            <p className="text-muted-foreground">
              The user will receive an automated notification containing: <br />
              <span className="font-mono italic text-foreground block mt-1">
                "{rejectionReason === "OTHER" && customReason.trim() ? customReason : REJECTION_REASON_LABELS[rejectionReason].desc}"
              </span>
            </p>
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={rejectMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={rejectMutation.isPending}
              className="font-semibold"
            >
              {rejectMutation.isPending ? "Processing..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
