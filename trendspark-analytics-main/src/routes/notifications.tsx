import { createFileRoute } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Card } from "@/components/Card";
import { useNotifications } from "@/hooks/data/use-notifications";
import { useState } from "react";
import { Bell, CheckCheck, TrendingUp, FileText, BookOpen, Hash, Activity } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/notifications")({ component: NotificationsPage });

const iconFor = (t: string) =>
  t === "trend" ? TrendingUp : t === "paper" ? FileText : t === "journal" ? BookOpen : t === "keyword" ? Hash : Activity;

function NotificationsPage() {
  const { data: notifications = [] } = useNotifications();
  const [markAllRead, setMarkAllRead] = useState(false);
  const items = notifications.map((i) => ({ ...i, unread: markAllRead ? false : i.unread }));
  const unread = items.filter((i) => i.unread).length;

  return (
    <AppLayout>
      <PageHeader
        title="Notifications"
        subtitle={`${unread} unread · trend, paper, keyword, journal alerts`}
        action={
          <button
            onClick={() => {
              setMarkAllRead(true);
              toast.success("All marked as read");
            }}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium border border-border bg-surface/50 hover:bg-surface transition-colors"
          >
            <CheckCheck className="size-4" /> Mark all read
          </button>
        }
      />

      <Card>
        <div className="divide-y divide-border -mx-6">
          {items.map((n) => {
            const Icon = iconFor(n.type);
            return (
              <div key={n.id} className={`flex items-start gap-4 px-6 py-4 hover:bg-secondary/40 transition-colors ${n.unread ? "bg-brand/5" : ""}`}>
                <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${n.unread ? "bg-brand/15 text-brand" : "bg-secondary text-muted-foreground"}`}>
                  <Icon className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${n.unread ? "font-semibold text-foreground" : "text-muted-foreground"}`}>{n.title}</span>
                    {n.unread && <span className="size-1.5 rounded-full bg-brand" />}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{n.body}</div>
                </div>
                <div className="text-[10px] font-mono text-muted-foreground shrink-0">{n.time}</div>
              </div>
            );
          })}
        </div>
        {items.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Bell className="size-8 mx-auto mb-2 opacity-50" />
            No notifications yet
          </div>
        )}
      </Card>
    </AppLayout>
  );
}