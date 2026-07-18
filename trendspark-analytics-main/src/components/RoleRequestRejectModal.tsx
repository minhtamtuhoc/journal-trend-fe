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
      toast.error("Vui lòng nhập lý do cụ thể khi chọn OTHER");
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
      toast.success(`Đã từ chối đơn của ${request.userEmail}`);
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Thao tác từ chối thất bại";
      toast.error(msg);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-background border-border/80 shadow-2xl rounded-2xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-2 text-destructive">
            <AlertOctagon className="size-5" />
            <DialogTitle className="text-xl font-bold">Từ chối đơn xin đổi role</DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground text-sm">
            Xác nhận từ chối yêu cầu từ <strong>{request.userName}</strong> ({request.userEmail}) xin chuyển sang <strong>{request.requestedRole}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleReject} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Lý do từ chối (Vui lòng chọn từ danh sách)</Label>
            <Select
              value={rejectionReason}
              onValueChange={(val) => setRejectionReason(val as RoleRequestRejectionReason)}
            >
              <SelectTrigger className="w-full bg-secondary/30 border-border">
                <SelectValue placeholder="Chọn lý do từ chối..." />
              </SelectTrigger>
              <SelectContent>
                {REASON_OPTIONS.map((code) => {
                  const item = REJECTION_REASON_LABELS[code];
                  return (
                    <SelectItem key={code} value={code}>
                      <div className="py-1">
                        <div className="font-semibold text-sm">{code} — {item.title}</div>
                        <div className="text-xs text-muted-foreground">{item.desc}</div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Reason Textarea when OTHER is selected */}
          {rejectionReason === "OTHER" && (
            <div className="space-y-1.5 animate-in fade-in-50 duration-200">
              <Label className="text-sm font-medium text-destructive">
                Chi tiết lý do từ chối <span className="text-destructive">*</span>
              </Label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Nhập chi tiết hướng dẫn hoặc lý do cụ thể gửi tới người dùng..."
                className="w-full min-h-[90px] p-3 rounded-lg border border-border bg-secondary/30 text-sm outline-none focus:border-brand transition-all resize-none"
              />
            </div>
          )}

          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-xs space-y-1">
            <p className="font-semibold text-destructive">Lưu ý hệ thống thông báo:</p>
            <p className="text-muted-foreground">
              Người dùng sẽ nhận được thông báo tự động với nội dung mô tả lý do: <br />
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
              Hủy
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={rejectMutation.isPending}
              className="font-semibold"
            >
              {rejectMutation.isPending ? "Đang xử lý..." : "Xác nhận Từ chối"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
