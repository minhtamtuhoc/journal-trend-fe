import { useState } from "react";
import { useSubmitRoleRequest } from "@/hooks/data/use-role-request";
import type { UserRequestableRole } from "@/types/role-request";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bold, Italic, List, ShieldAlert, Sparkles } from "lucide-react";

interface RoleRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRole: string;
  onSuccess?: () => void;
}

const AVAILABLE_ROLES: { value: UserRequestableRole; label: string; desc: string }[] = [
  { value: "STUDENT", label: "Student", desc: "Standard access and basic trend tracking" },
  { value: "RESEARCHER", label: "Researcher", desc: "Advanced analytics access and extended data retrieval" },
  { value: "LECTURER", label: "Lecturer", desc: "Designed for academic staff and scientific advisors" },
];

export function RoleRequestModal({ open, onOpenChange, currentRole, onSuccess }: RoleRequestModalProps) {
  const submitMutation = useSubmitRoleRequest();
  const [requestedRole, setRequestedRole] = useState<UserRequestableRole>(
    currentRole === "STUDENT" ? "RESEARCHER" : "STUDENT"
  );
  const [reasonText, setReasonText] = useState("");
  const [proofUrl, setProofUrl] = useState("");

  // Filter out current role
  const selectableRoles = AVAILABLE_ROLES.filter((r) => r.value !== currentRole);

  const formatText = (command: string) => {
    document.execCommand(command, false, undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const editorEl = document.getElementById("tiptap-reason-editor");
    const rawHtml = editorEl ? editorEl.innerHTML : reasonText;
    const trimmedHtml = rawHtml.trim();

    if (!trimmedHtml || trimmedHtml === "<p></p>" || trimmedHtml === "<br>") {
      toast.error("Please enter a reason for your role change request");
      return;
    }

    // Wrap in <p> if not already wrapped in HTML tags
    const htmlPayload = trimmedHtml.startsWith("<") ? trimmedHtml : `<p>${trimmedHtml}</p>`;

    try {
      await submitMutation.mutateAsync({
        requestedRole,
        reason: htmlPayload,
        proofUrl: proofUrl.trim() || undefined,
      });
      toast.success("Role change request submitted successfully! Please wait for Admin approval.");
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to submit request";
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] bg-background border-border/80 shadow-2xl rounded-2xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2 text-brand">
            <Sparkles className="size-5" />
            <DialogTitle className="text-xl font-bold">Request Role Change</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground text-sm">
            Submit a request to change your account role and unlock features suited for your work.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Requested Role Selection */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Desired Role</Label>
            <Select
              value={requestedRole}
              onValueChange={(val) => setRequestedRole(val as UserRequestableRole)}
            >
              <SelectTrigger className="w-full bg-secondary/30 border-border">
                <SelectValue placeholder="Select role..." />
              </SelectTrigger>
              <SelectContent>
                {selectableRoles.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    <div className="py-0.5">
                      <div className="font-semibold text-sm">{r.label}</div>
                      <div className="text-xs text-muted-foreground">{r.desc}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Proof URL (Optional) */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Proof URL (Optional)</Label>
            <Input
              type="url"
              placeholder="https://orcid.org/... or link to student ID / profile..."
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              className="bg-secondary/30 border-border text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              Provide an ORCID link, Google Scholar profile, faculty page, or student ID to help Admins review faster.
            </p>
          </div>

          {/* Reason Rich Text Editor */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Detailed Reason & Description <span className="text-destructive">*</span></Label>
            <div className="border border-border/80 rounded-lg overflow-hidden bg-secondary/20">
              {/* Rich text toolbar */}
              <div className="flex items-center gap-1 p-1.5 border-b border-border/60 bg-secondary/40">
                <button
                  type="button"
                  onClick={() => formatText("bold")}
                  className="p-1.5 rounded hover:bg-background/80 text-muted-foreground hover:text-foreground transition-colors"
                  title="Bold"
                >
                  <Bold className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => formatText("italic")}
                  className="p-1.5 rounded hover:bg-background/80 text-muted-foreground hover:text-foreground transition-colors"
                  title="Italic"
                >
                  <Italic className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => formatText("insertUnorderedList")}
                  className="p-1.5 rounded hover:bg-background/80 text-muted-foreground hover:text-foreground transition-colors"
                  title="Bullet list"
                >
                  <List className="size-3.5" />
                </button>
              </div>

              {/* Editable content area */}
              <div
                id="tiptap-reason-editor"
                contentEditable
                onInput={(e) => setReasonText(e.currentTarget.innerHTML)}
                className="p-3 min-h-[100px] max-h-[200px] overflow-y-auto outline-none text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">Content will be formatted as HTML and submitted for Admin review.</p>
          </div>

          <DialogFooter className="pt-3 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitMutation.isPending}
              className="bg-brand hover:brightness-110 text-brand-foreground font-semibold"
            >
              {submitMutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
