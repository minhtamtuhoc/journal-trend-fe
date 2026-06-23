import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Card } from "@/components/Card";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useDeleteNotification,
  useDeleteAllNotifications,
  useDeleteAllReadNotifications,
} from "@/hooks/data/use-notifications";
import { Bell, CheckCheck, TrendingUp, FileText, BookOpen, Hash, Activity, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/api/errors";
import { useState, useEffect } from "react";
import { formatDistanceToNow, parseISO, isValid } from "date-fns";
import type { NotificationItem } from "@/types/domain";

export const Route = createFileRoute("/notifications")({ component: NotificationsPage });

const getNotificationIcon = (uiType: "paper" | "trend" | "system") => {
  switch (uiType) {
    case "paper":
      return FileText;
    case "trend":
      return TrendingUp;
    case "system":
      return Bell;
    default:
      return Activity;
  }
};

const getNotificationTitle = (uiType: "paper" | "trend" | "system") => {
  switch (uiType) {
    case "paper":
      return "📄 New Paper";
    case "trend":
      return "📈 Trending Keyword";
    case "system":
      return "🔔 System";
    default:
      return "🔔 Notification";
  }
};

export function getNotificationTarget(n: NotificationItem): string {
  if (n.uiType === "paper" || n.paperId) {
    return `/papers/${n.paperId || n.id}`;
  }
  if (n.uiType === "trend" || n.keywordId) {
    return "/trends";
  }
  if (n.authorId) {
    return "/authors";
  }
  if (n.journalId) {
    return "/journals";
  }
  return "/notifications";
}

const formatTime = (timeStr: string) => {
  try {
    const date = parseISO(timeStr);
    if (isValid(date)) {
      return formatDistanceToNow(date, { addSuffix: true });
    }
  } catch {
    // Ignore and fallback
  }
  return timeStr;
};

function NotificationSkeleton() {
  return (
    <div className="w-full flex items-start gap-4 px-6 py-4 border-b border-border last:border-0 animate-pulse">
      <div className="size-9 rounded-lg bg-secondary shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <div className="h-4 bg-secondary rounded w-1/4" />
        <div className="h-3 bg-secondary rounded w-3/4" />
      </div>
      <div className="h-3 bg-secondary rounded w-16 shrink-0" />
    </div>
  );
}

function NotificationsPage() {
  const {
    notifications,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useNotifications();

  const navigate = useNavigate();
  const markOne = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const deleteOne = useDeleteNotification();
  const deleteAll = useDeleteAllNotifications();
  const deleteAllRead = useDeleteAllReadNotifications();

  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  const unreadCount = notifications.filter((i) => i.unread).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return n.unread;
    if (filter === "read") return !n.unread;
    return true;
  });

  // Infinite Scroll Effect
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100 &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        void fetchNextPage();
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const onMarkAll = async () => {
    try {
      await markAll.mutateAsync();
      toast.success("Marked all as read");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed");
    }
  };

  const onMarkOne = async (id: string) => {
    try {
      await markOne.mutateAsync(id);
      toast.success("Marked as read");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed");
    }
  };

  const onDeleteOne = async (id: string) => {
    try {
      await deleteOne.mutateAsync(id);
      toast.success("Notification deleted");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed");
    }
  };

  const onDeleteAllRead = async () => {
    try {
      await deleteAllRead.mutateAsync();
      toast.success("Deleted all read notifications");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed");
    }
  };

  const onDeleteAll = async () => {
    try {
      await deleteAll.mutateAsync();
      toast.success("Deleted all notifications");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed");
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Notifications"
        subtitle={`${unreadCount} unread · trend, paper, keyword, journal alerts`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onMarkAll}
              disabled={markAll.isPending || unreadCount === 0}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium border border-border bg-surface/50 hover:bg-surface text-foreground transition-colors disabled:opacity-50 cursor-pointer"
            >
              <CheckCheck className="size-3.5" /> Mark all read
            </button>
            <button
              type="button"
              onClick={onDeleteAllRead}
              disabled={deleteAllRead.isPending || notifications.filter(n => !n.unread).length === 0}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium border border-border bg-surface/50 hover:bg-surface text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="size-3.5" /> Delete read
            </button>
            <button
              type="button"
              onClick={onDeleteAll}
              disabled={deleteAll.isPending || notifications.length === 0}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium border border-border bg-surface/50 hover:bg-surface text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="size-3.5" /> Delete all
            </button>
          </div>
        }
      />

      <Card>
        <div className="border-b border-border -mx-6 px-6 py-2 bg-surface/20">
          <div className="flex gap-2">
            {(["all", "unread", "read"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFilter(t)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  filter === t
                    ? "bg-brand/10 text-brand font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)} ({
                  t === "all"
                    ? notifications.length
                    : t === "unread"
                    ? unreadCount
                    : notifications.length - unreadCount
                })
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-border -mx-6">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <NotificationSkeleton key={idx} />
            ))
          ) : (
            filteredNotifications.map((n) => {
              const Icon = getNotificationIcon(n.uiType);
              return (
                <div
                  key={n.id}
                  role="button"
                  onClick={() => {
                    const target = getNotificationTarget(n);
                    if (target) {
                      navigate({ to: target });
                    }
                  }}
                  className={`w-full flex items-start gap-4 px-6 py-4 text-left hover:bg-secondary/40 transition-colors cursor-pointer ${
                    n.unread ? "bg-brand/5" : ""
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
                        {getNotificationTitle(n.uiType)}
                      </span>
                      {n.unread && <span className="size-1.5 rounded-full bg-brand" />}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{n.message}</div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 self-center">
                    <div className="text-[10px] font-mono text-muted-foreground shrink-0">
                      {formatTime(n.createdAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      {n.unread && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkOne(n.id);
                          }}
                          disabled={markOne.isPending}
                          title="Mark as read"
                          className="p-1.5 rounded-md border border-border bg-surface/50 hover:bg-surface text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                          <Check className="size-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteOne(n.id);
                        }}
                        disabled={deleteOne.isPending}
                        title="Delete"
                        className="p-1.5 rounded-md border border-border bg-surface/50 hover:bg-surface text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors cursor-pointer"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {isFetchingNextPage && (
            Array.from({ length: 2 }).map((_, idx) => (
              <NotificationSkeleton key={`next-page-${idx}`} />
            ))
          )}
        </div>

        {!isLoading && filteredNotifications.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Bell className="size-8 mx-auto mb-2 opacity-50" />
            {filter === "unread"
              ? "No unread notifications"
              : filter === "read"
              ? "No read notifications"
              : "No notifications"}
          </div>
        )}
      </Card>
    </AppLayout>
  );
}
