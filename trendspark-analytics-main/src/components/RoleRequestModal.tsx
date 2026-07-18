import { useEffect, useState } from "react";
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

const AVAILABLE_ROLES: { value: UserRequestableRole; label: string }[] = [
  { value: "STUDENT", label: "Student" },
  { value: "RESEARCHER", label: "Researcher" },
  { value: "LECTURER", label: "Lecturer" },
];

export function RoleRequestModal({ open, onOpenChange, currentRole, onSuccess }: RoleRequestModalProps) {
  const submitMutation = useSubmitRoleRequest();

  const normalizedCurrentRole = (currentRole || "").toUpperCase();

  // Order roles so current user role appears first, followed by others
  const orderedRoles = [...AVAILABLE_ROLES].sort((a, b) => {
    if (a.value.toUpperCase() === normalizedCurrentRole) return -1;
    if (b.value.toUpperCase() === normalizedCurrentRole) return 1;
    return 0;
  });

  const [requestedRole, setRequestedRole] = useState<UserRequestableRole>("STUDENT");

  useEffect(() => {
    if (open) {
      const match = AVAILABLE_ROLES.find((r) => r.value.toUpperCase() === normalizedCurrentRole);
      setRequestedRole(match ? match.value : "STUDENT");
    }
  }, [open, normalizedCurrentRole]);

  const [reasonText, setReasonText] = useState("");
  const [proofUrl, setProofUrl] = useState("");

  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isList, setIsList] = useState(false);

  const checkActiveFormats = () => {
    try {
      setIsBold(document.queryCommandState("bold"));
      setIsItalic(document.queryCommandState("italic"));
      setIsList(document.queryCommandState("insertUnorderedList"));
    } catch {
      // ignore
    }
  };

  const formatText = (command: string) => {
    const editorEl = document.getElementById("tiptap-reason-editor");
    if (editorEl) {
      editorEl.focus();
    }
    document.execCommand(command, false, undefined);
    checkActiveFormats();
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
              <SelectTrigger className="w-full bg-secondary/30 border-border text-left font-medium text-sm">
                <SelectValue placeholder="Select role..." />
              </SelectTrigger>
              <SelectContent>
                {orderedRoles.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label} {r.value.toUpperCase() === normalizedCurrentRole ? " (Current)" : ""}
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
              <div className="flex items-center gap-1.5 p-1.5 border-b border-border/60 bg-secondary/40">
                <button
                  type="button"
                  onClick={() => formatText("bold")}
                  className={`p-1.5 rounded transition-all flex items-center gap-1 text-xs font-semibold ${
                    isBold
                      ? "bg-brand/20 text-brand border border-brand/40"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                  title="Bold (Ctrl+B)"
                >
                  <Bold className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => formatText("italic")}
                  className={`p-1.5 rounded transition-all flex items-center gap-1 text-xs font-semibold ${
                    isItalic
                      ? "bg-brand/20 text-brand border border-brand/40"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                  title="Italic (Ctrl+I)"
                >
                  <Italic className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => formatText("insertUnorderedList")}
                  className={`p-1.5 rounded transition-all flex items-center gap-1 text-xs font-semibold ${
                    isList
                      ? "bg-brand/20 text-brand border border-brand/40"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                  title="Bullet List"
                >
                  <List className="size-3.5" />
                </button>
              </div>

              {/* Editable content area */}
              <div
                id="tiptap-reason-editor"
                contentEditable
                onInput={(e) => {
                  setReasonText(e.currentTarget.innerHTML);
                  checkActiveFormats();
                }}
                onKeyUp={checkActiveFormats}
                onMouseUp={checkActiveFormats}
                className="p-3 min-h-[100px] max-h-[200px] overflow-y-auto outline-none text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5"
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
