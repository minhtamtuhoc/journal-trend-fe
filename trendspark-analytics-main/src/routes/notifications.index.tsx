import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Card } from "@/components/Card";
import {
  useMarkAllNotificationsRead,
  useNotificationsBulk,
  useDeleteAllNotifications,
  useDeleteAllReadNotifications,
  useMarkMultipleNotificationsRead,
  useDeleteMultipleNotifications,
} from "@/hooks/data/use-notifications";
import {
  Bell,
  CheckCheck,
  TrendingUp,
  FileText,
  Activity,
  Check,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/api/errors";
import { useState, useEffect, useMemo } from "react";
import { formatDistanceToNow, parseISO, isValid } from "date-fns";
import { useAuth } from "@/auth";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { z } from "zod";
import { groupNotifications, type NotificationGroup, type PaperSummary } from "@/utils/notification-grouper";


const notificationsSearchSchema = z.object({
  page: z.coerce.number().catch(1).optional(),
});

export const Route = createFileRoute("/notifications/")({
  component: NotificationsPage,
  validateSearch: (s) => notificationsSearchSchema.parse(s),
});

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



interface NotificationGroupCardProps {
  group: NotificationGroup;
  onClick: () => void;
  onMarkRead: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  isMarkReadPending: boolean;
  isDeletePending: boolean;
}

function NotificationGroupCard({
  group,
  onClick,
  onMarkRead,
  onDelete,
  isMarkReadPending,
  isDeletePending,
}: NotificationGroupCardProps) {
  const Icon = getNotificationIcon(group.uiType);

  const getGroupTitleText = () => {
    if (group.uiType === "system") {
      return group.keyword;
    }
    const count = group.papers.length;
    if (group.triggerType === "TRENDING_KEYWORD") {
      return `📈 Keyword "${group.keyword}" is trending!`;
    }
    const typeLabel = group.key?.startsWith("author-") ? "from author" : group.key?.startsWith("journal-") ? "in journal" : "for keyword";
    return `📚 ${count} new ${count === 1 ? "paper" : "papers"} ${typeLabel} "${group.keyword}"`;
  };

  return (
    <div
      role="button"
      onClick={onClick}
      className={`w-full flex items-start gap-4 px-6 py-4 text-left hover:bg-secondary/40 transition-colors cursor-pointer border-b border-border last:border-0 ${
        group.unread ? "bg-brand/5" : ""
      }`}
    >
      <div
        className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${
          group.unread ? "bg-brand/15 text-brand" : "bg-secondary text-muted-foreground"
        }`}
      >
        <Icon className="size-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm ${group.unread ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
            {getGroupTitleText()}
          </span>
          {group.unread && <span className="size-1.5 rounded-full bg-brand shrink-0" />}
        </div>
        {group.papers.length > 0 && (
          <div className="text-xs text-muted-foreground mt-1.5 line-clamp-1 italic font-serif">
            Latest: "{group.papers[0]?.title}"
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0 self-center">
        <div className="text-[10px] font-mono text-muted-foreground shrink-0">
          {formatTime(group.latestCreatedAt)}
        </div>
        <div className="flex items-center gap-1">
          {group.unread && (
            <button
              type="button"
              onClick={onMarkRead}
              disabled={isMarkReadPending}
              title="Mark group as read"
              className="p-1.5 rounded-md border border-border bg-surface/50 hover:bg-surface text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Check className="size-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeletePending}
            title="Delete group"
            className="p-1.5 rounded-md border border-border bg-surface/50 hover:bg-surface text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors cursor-pointer"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function PaginationBar({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-1.5 py-4 border-t border-border mt-4 shrink-0">
      <button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="h-8 px-3 rounded-lg text-xs font-medium border border-border hover:bg-secondary disabled:opacity-50 disabled:hover:bg-transparent transition-colors flex items-center gap-1 cursor-pointer"
      >
        <ChevronLeft className="size-3.5" /> Prev
      </button>

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPageChange(p)}
          className={`size-8 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
            currentPage === p
              ? "bg-brand/10 border-brand/30 text-brand font-bold"
              : "border-border hover:bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          {p}
        </button>
      ))}

      <button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="h-8 px-3 rounded-lg text-xs font-medium border border-border hover:bg-secondary disabled:opacity-50 disabled:hover:bg-transparent transition-colors flex items-center gap-1 cursor-pointer"
      >
        Next <ChevronRight className="size-3.5" />
      </button>
    </div>
  );
}

function NotificationsPage() {
  const { page = 1 } = Route.useSearch();
  const { data: notifications = [], isLoading } = useNotificationsBulk(1000);

  const { user, updateNotificationPreferences } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [notifyKeywords, setNotifyKeywords] = useState(user?.notifyKeywords ?? true);
  const [notifyAuthors, setNotifyAuthors] = useState(user?.notifyAuthors ?? true);
  const [notifyJournals, setNotifyJournals] = useState(user?.notifyJournals ?? true);
  const [notifyEmail, setNotifyEmail] = useState(user?.notifyEmail ?? true);

  useEffect(() => {
    if (user) {
      setNotifyKeywords(user.notifyKeywords ?? true);
      setNotifyAuthors(user.notifyAuthors ?? true);
      setNotifyJournals(user.notifyJournals ?? true);
      setNotifyEmail(user.notifyEmail ?? true);
    }
  }, [user, isSettingsOpen]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await updateNotificationPreferences({
        notifyKeywords,
        notifyAuthors,
        notifyJournals,
        notifyEmail,
      });
      toast.success("Notification settings updated");
      setIsSettingsOpen(false);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to update notification settings";
      toast.error(msg);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const navigate = useNavigate();
  const markAll = useMarkAllNotificationsRead();
  const markMultiple = useMarkMultipleNotificationsRead();
  const deleteMultiple = useDeleteMultipleNotifications();
  const deleteAll = useDeleteAllNotifications();
  const deleteAllRead = useDeleteAllReadNotifications();

  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  // Group notifications using memoized selector
  const grouped = useMemo(() => groupNotifications(notifications), [notifications]);

  const unreadGroupsCount = useMemo(() => grouped.filter((g) => g.unread).length, [grouped]);

  const filteredGroups = useMemo(() => {
    return grouped.filter((g) => {
      if (filter === "unread") return g.unread;
      if (filter === "read") return !g.unread;
      return true;
    });
  }, [grouped, filter]);

  const totalPages = Math.ceil(filteredGroups.length / 20);
  const currentPage = Math.max(1, Math.min(page, totalPages || 1));

  const paginatedGroups = useMemo(() => {
    return filteredGroups.slice((currentPage - 1) * 20, currentPage * 20);
  }, [filteredGroups, currentPage]);

  const onPageChange = (newPage: number) => {
    void navigate({
      to: "/notifications",
      search: {
        page: newPage,
      },
    });
  };

  const handleGroupClick = (group: NotificationGroup) => {
    const groupId = group.keyword.toLowerCase() + "~" + group.triggerType;
    void navigate({
      to: `/notifications/${encodeURIComponent(groupId)}`,
    });
    if (group.unread && group.unreadIds.length > 0) {
      void markMultiple.mutateAsync(group.unreadIds);
    }
  };

  const handleGroupMarkRead = async (group: NotificationGroup, e: React.MouseEvent) => {
    e.stopPropagation();
    if (group.unreadIds.length === 0) return;
    try {
      await markMultiple.mutateAsync(group.unreadIds);
      toast.success("Group marked as read");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed");
    }
  };

  const handleGroupDelete = async (group: NotificationGroup, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteMultiple.mutateAsync(group.ids);
      toast.success("Group deleted");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed");
    }
  };

  const onMarkAll = async () => {
    try {
      await markAll.mutateAsync();
      toast.success("Marked all notifications as read");
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

  // Safe navigation effect: reset current page if page is out of bounds
  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      void navigate({
        to: "/notifications",
        search: {
          page: totalPages,
        },
      });
    }
  }, [page, totalPages, navigate]);

  return (
    <AppLayout>
      <PageHeader
        title="Notifications"
        subtitle={`${unreadGroupsCount} unread groups · keyword, trend, and paper alerts`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="inline-flex items-center justify-center size-9 rounded-lg border border-border bg-surface/50 hover:bg-surface text-foreground transition-colors cursor-pointer"
              title="Notification Settings"
            >
              <Settings className="size-4" />
            </button>
            <button
              type="button"
              onClick={onMarkAll}
              disabled={markAll.isPending || unreadGroupsCount === 0}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium border border-border bg-surface/50 hover:bg-surface text-foreground transition-colors disabled:opacity-50 cursor-pointer"
            >
              <CheckCheck className="size-3.5" /> Mark all read
            </button>
            <button
              type="button"
              onClick={onDeleteAllRead}
              disabled={deleteAllRead.isPending || grouped.filter((g) => !g.unread).length === 0}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium border border-border bg-surface/50 hover:bg-surface text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="size-3.5" /> Delete read
            </button>
            <button
              type="button"
              onClick={onDeleteAll}
              disabled={deleteAll.isPending || grouped.length === 0}
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
                onClick={() => {
                  setFilter(t);
                  void navigate({
                    to: "/notifications",
                    search: {
                      page: 1,
                    },
                  });
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  filter === t
                    ? "bg-brand/10 text-brand font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)} ({
                  t === "all"
                    ? grouped.length
                    : t === "unread"
                    ? unreadGroupsCount
                    : grouped.length - unreadGroupsCount
                })
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-border -mx-6 flex flex-col min-h-[400px]">
          <div className="flex-1">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <NotificationSkeleton key={idx} />
              ))
            ) : paginatedGroups.length > 0 ? (
              paginatedGroups.map((g) => (
                <NotificationGroupCard
                  key={g.keyword.toLowerCase() + "-" + g.triggerType}
                  group={g}
                  onClick={() => handleGroupClick(g)}
                  onMarkRead={(e) => handleGroupMarkRead(g, e)}
                  onDelete={(e) => handleGroupDelete(g, e)}
                  isMarkReadPending={markMultiple.isPending}
                  isDeletePending={deleteMultiple.isPending}
                />
              ))
            ) : (
              <div className="text-center py-20 text-muted-foreground flex flex-col items-center justify-center">
                <Bell className="size-8 mb-3 opacity-40" />
                <p className="text-sm font-medium">
                  {filter === "unread"
                    ? "No unread notification groups"
                    : filter === "read"
                    ? "No read notification groups"
                    : "No notification alerts found"}
                </p>
              </div>
            )}
          </div>

          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      </Card>

      <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Notification Settings</SheetTitle>
            <SheetDescription>
              Configure how and when you want to receive alerts and notifications.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSaveSettings} className="space-y-6 mt-6">
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer p-1 rounded hover:bg-secondary/20 transition-colors">
                <input
                  type="checkbox"
                  checked={notifyKeywords}
                  onChange={(e) => setNotifyKeywords(e.target.checked)}
                  className="mt-0.5 size-4 accent-[var(--brand)] rounded border-border"
                />
                <div className="grid gap-0.5 leading-none">
                  <span className="text-sm font-semibold">Keyword follows</span>
                  <span className="text-xs text-muted-foreground">Receive alerts when followed keywords have new papers.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer p-1 rounded hover:bg-secondary/20 transition-colors">
                <input
                  type="checkbox"
                  checked={notifyAuthors}
                  onChange={(e) => setNotifyAuthors(e.target.checked)}
                  className="mt-0.5 size-4 accent-[var(--brand)] rounded border-border"
                />
                <div className="grid gap-0.5 leading-none">
                  <span className="text-sm font-semibold">Author follows</span>
                  <span className="text-xs text-muted-foreground">Receive alerts when followed authors publish new papers.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer p-1 rounded hover:bg-secondary/20 transition-colors">
                <input
                  type="checkbox"
                  checked={notifyJournals}
                  onChange={(e) => setNotifyJournals(e.target.checked)}
                  className="mt-0.5 size-4 accent-[var(--brand)] rounded border-border"
                />
                <div className="grid gap-0.5 leading-none">
                  <span className="text-sm font-semibold">Journal follows</span>
                  <span className="text-xs text-muted-foreground">Receive alerts when followed journals publish new papers.</span>
                </div>
              </label>

              <div className="h-px bg-border my-4" />

              <label className="flex items-start gap-3 cursor-pointer p-1 rounded hover:bg-secondary/20 transition-colors">
                <input
                  type="checkbox"
                  checked={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.checked)}
                  className="mt-0.5 size-4 accent-[var(--brand)] rounded border-border"
                />
                <div className="grid gap-0.5 leading-none">
                  <span className="text-sm font-semibold">Email notifications</span>
                  <span className="text-xs text-muted-foreground">Receive alerts via Email.</span>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="h-10 px-4 rounded-lg text-sm font-semibold border border-border hover:bg-secondary transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingSettings}
                className="h-10 px-5 rounded-lg text-sm font-semibold text-brand-foreground glow-brand disabled:opacity-60 flex items-center justify-center cursor-pointer"
                style={{ background: "var(--gradient-brand)" }}
              >
                {isSavingSettings ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}
