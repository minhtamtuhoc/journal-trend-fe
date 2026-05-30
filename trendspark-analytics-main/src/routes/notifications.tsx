import { createFileRoute } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Card } from "@/components/Card";
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from "@/hooks/data/use-notifications";
import { Bell, CheckCheck, TrendingUp, FileText, BookOpen, Hash, Activity } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/api/errors";

export const Route = createFileRoute("/notifications")({ component: NotificationsPage });

const iconFor = (t: string) =>
  t === "trend" ? TrendingUp : t === "paper" ? FileText : t === "journal" ? BookOpen : t === "keyword" ? Hash : Activity;

function NotificationsPage() {
  const { data: notifications = [] } = useNotifications();
  const markOne = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const unread = notifications.filter((i) => i.unread).length;

  const onMarkAll = async () => {
    try {
      await markAll.mutateAsync();
      toast.success("Đã đánh dấu tất cả là đã đọc");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Thất bại");
    }
  };

  const onMarkOne = async (id: string) => {
    try {
      await markOne.mutateAsync(id);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Không thể đánh dấu đã đọc");
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Notifications"
        subtitle={`${unread} unread · trend, paper, keyword, journal alerts`}
        action={
          <button
            type="button"
            onClick={onMarkAll}
            disabled={markAll.isPending || unread === 0}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium border border-border bg-surface/50 hover:bg-surface transition-colors disabled:opacity-50"
          >
            <CheckCheck className="size-4" /> Đánh dấu tất cả đã đọc
          </button>
        }
      />

      <Card>
        <div className="divide-y divide-border -mx-6">
          {notifications.map((n) => {
            const Icon = iconFor(n.type);
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => n.unread && onMarkOne(n.id)}
                disabled={!n.unread || markOne.isPending}
                className={`w-full flex items-start gap-4 px-6 py-4 text-left hover:bg-secondary/40 transition-colors disabled:cursor-default ${
                  n.unread ? "bg-brand/5 cursor-pointer" : "cursor-default"
                }`}
              >
                <div
                  className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${
                    n.unread ? "bg-brand/15 text-brand" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  <Icon className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${n.unread ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                      {n.title}
                    </span>
                    {n.unread && <span className="size-1.5 rounded-full bg-brand" />}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{n.body}</div>
                  {n.unread ? (
                    <div className="text-[10px] text-brand mt-1">Bấm để đánh dấu đã đọc</div>
                  ) : null}
                </div>
                <div className="text-[10px] font-mono text-muted-foreground shrink-0">{n.time}</div>
              </button>
            );
          })}
        </div>
        {notifications.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Bell className="size-8 mx-auto mb-2 opacity-50" />
            Chưa có thông báo
          </div>
        )}
      </Card>
    </AppLayout>
  );
}
