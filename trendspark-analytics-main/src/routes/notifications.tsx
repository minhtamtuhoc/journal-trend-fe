import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Card } from "@/components/Card";
import {
  useMarkAllNotificationsRead,
  useNotifications,
  useDeleteAllNotifications,
  useDeleteAllReadNotifications,
<<<<<<< HEAD
  useMarkMultipleNotificationsRead,
  useDeleteMultipleNotifications,
=======
  useDeleteMultipleNotifications,
  useMarkMultipleNotificationsRead,
>>>>>>> ca7f2111c87963d2646163452effd381ef8a47d0
} from "@/hooks/data/use-notifications";
import { usePaper } from "@/hooks/data/use-papers";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Bell,
  CheckCheck,
  TrendingUp,
  FileText,
  BookOpen,
  Activity,
  Check,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/api/errors";
import { useState, useEffect, useMemo } from "react";
import { formatDistanceToNow, parseISO, isValid } from "date-fns";
<<<<<<< HEAD
import { z } from "zod";
import { groupNotifications, type NotificationGroup, type PaperSummary } from "@/utils/notification-grouper";
=======
import type { NotificationItem } from "@/types/domain";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
>>>>>>> ca7f2111c87963d2646163452effd381ef8a47d0

const notificationsSearchSchema = z.object({
  page: z.coerce.number().catch(1).optional(),
});

export const Route = createFileRoute("/notifications")({
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

function PaperRow({ paper }: { paper: PaperSummary }) {
  const { data: paperDetail, isLoading } = usePaper(paper.id);
  const navigate = useNavigate();

  return (
    <div
      role="button"
      onClick={() => {
        void navigate({ to: `/papers/${paper.id}` });
      }}
      className="p-4 rounded-xl border border-border hover:border-brand/40 hover:bg-brand/5 transition-all text-left group cursor-pointer relative"
    >
      <div className="flex justify-between items-start gap-4 mb-2">
        <h4 className="text-sm font-semibold text-foreground group-hover:text-brand transition-colors line-clamp-2 pr-12">
          {paper.title}
        </h4>
        <span className="flex items-center gap-0.5 text-xs text-brand font-medium shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          View <ArrowUpRight className="size-3.5" />
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-1.5 mt-2">
          <div className="h-3 bg-secondary rounded w-1/3 animate-pulse" />
          <div className="h-3 bg-secondary rounded w-2/3 animate-pulse" />
        </div>
      ) : paperDetail ? (
        <div className="text-xs text-muted-foreground space-y-1">
          {paperDetail.journal && (
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <BookOpen className="size-3.5 text-muted-foreground" />
              <span>{paperDetail.journal}</span>
            </div>
          )}
          <div className="flex items-center gap-3 font-mono text-[10px] text-muted-foreground">
            {paperDetail.year && (
              <span>Year: {paperDetail.year}</span>
            )}
            {paperDetail.citations !== undefined && (
              <span>Citations: {paperDetail.citations}</span>
            )}
          </div>
          {paperDetail.abstract && (
            <p className="text-[11px] text-muted-foreground mt-2.5 line-clamp-2 italic bg-secondary/10 p-2.5 rounded-lg border border-border/30">
              {paperDetail.abstract}
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

interface NotificationPaperModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: NotificationGroup | null;
}

function NotificationPaperModal({ isOpen, onClose, group }: NotificationPaperModalProps) {
  if (!group) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="border-b border-border pb-3 shrink-0">
          <DialogTitle className="text-base font-bold text-foreground">
            {group.papers.length > 0 ? (
              <span>📚 {group.papers.length} new papers for "{group.keyword}"</span>
            ) : (
              <span>🔔 {group.keyword}</span>
            )}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Latest Alert: {formatTime(group.latestCreatedAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3.5 py-4 min-h-0 pr-1">
          {group.papers.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {group.keyword} has no detailed papers available.
            </div>
          ) : (
            group.papers.map((paperSummary) => (
              <PaperRow key={paperSummary.id} paper={paperSummary} />
            ))
          )}
        </div>

        <div className="border-t border-border pt-3 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-4 rounded-lg text-sm font-medium border border-border hover:bg-secondary transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
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
    const typeLabel = group.ids[0] && group.ids[0].includes("author") ? "from author" : group.ids[0] && group.ids[0].includes("journal") ? "in journal" : "for keyword";
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
  const { notifications, isLoading } = useNotifications();

  const navigate = useNavigate();
  const markAll = useMarkAllNotificationsRead();
<<<<<<< HEAD
  const markMultiple = useMarkMultipleNotificationsRead();
=======
  const deleteOne = useDeleteNotification();
>>>>>>> ca7f2111c87963d2646163452effd381ef8a47d0
  const deleteMultiple = useDeleteMultipleNotifications();
  const deleteAll = useDeleteAllNotifications();
  const deleteAllRead = useDeleteAllReadNotifications();
  const markMultipleRead = useMarkMultipleNotificationsRead();

  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
<<<<<<< HEAD
  const [selectedGroup, setSelectedGroup] = useState<NotificationGroup | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
=======
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState<{
    ids: string[];
    message: string;
    isDeleteAllAction?: boolean;
  } | null>(null);
>>>>>>> ca7f2111c87963d2646163452effd381ef8a47d0

  // Group notifications using memoized selector
  const grouped = useMemo(() => groupNotifications(notifications), [notifications]);

  const unreadGroupsCount = useMemo(() => grouped.filter((g) => g.unread).length, [grouped]);

<<<<<<< HEAD
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
    setSelectedGroup(group);
    setIsModalOpen(true);
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
=======
  // Reset selected IDs when filter or notifications change
  useEffect(() => {
    setSelectedIds([]);
  }, [filter]);

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
>>>>>>> ca7f2111c87963d2646163452effd381ef8a47d0

  const onMarkMultipleRead = async () => {
    if (selectedIds.length === 0) return;
    try {
      await markMultipleRead.mutateAsync(selectedIds);
      setSelectedIds([]);
      toast.success("Selected notifications marked as read");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to mark read");
    }
  };

  const onMarkAll = async () => {
    try {
      await markAll.mutateAsync();
<<<<<<< HEAD
      toast.success("Marked all notifications as read");
=======
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

  const executeDelete = async (ids: string[]) => {
    try {
      if (ids.length === 1) {
        await deleteOne.mutateAsync(ids[0]);
      } else {
        await deleteMultiple.mutateAsync(ids);
      }
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
      toast.success(ids.length === 1 ? "Notification deleted" : `${ids.length} notifications deleted`);
>>>>>>> ca7f2111c87963d2646163452effd381ef8a47d0
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete");
    }
  };

  const handleDeleteOneClick = (n: NotificationItem) => {
    if (n.unread) {
      setConfirmDeleteTarget({
        ids: [n.id],
        message: "Thông báo này bạn chưa đọc, bạn có muốn xóa nó không?",
      });
    } else {
      void executeDelete([n.id]);
    }
  };

  const handleDeleteSelectedClick = () => {
    if (selectedIds.length === 0) return;
    const hasUnread = notifications.some((n) => selectedIds.includes(n.id) && n.unread);
    if (hasUnread) {
      setConfirmDeleteTarget({
        ids: selectedIds,
        message: "Bạn có thông báo chưa đọc, bạn có muốn xóa chúng không?",
      });
    } else {
      void executeDelete(selectedIds);
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

<<<<<<< HEAD
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
=======
  const handleDeleteAllClick = () => {
    const hasUnread = notifications.some((n) => n.unread);
    if (hasUnread) {
      setConfirmDeleteTarget({
        ids: [],
        message: "Bạn có thông báo chưa đọc, bạn có muốn xóa tất cả không?",
        isDeleteAllAction: true,
      });
    } else {
      void onDeleteAll();
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteTarget) return;
    const { ids, isDeleteAllAction } = confirmDeleteTarget;
    setConfirmDeleteTarget(null);
    if (isDeleteAllAction) {
      await onDeleteAll();
    } else {
      await executeDelete(ids);
    }
  };

  const isAllSelected =
    filteredNotifications.length > 0 &&
    filteredNotifications.every((n) => selectedIds.includes(n.id));

  const handleSelectAll = (checked: boolean) => {
    if (!checked) {
      setSelectedIds((prev) => prev.filter((id) => !filteredNotifications.some((n) => n.id === id)));
    } else {
      setSelectedIds((prev) => {
        const next = [...prev];
        filteredNotifications.forEach((n) => {
          if (!next.includes(n.id)) {
            next.push(n.id);
          }
        });
        return next;
      });
    }
  };
>>>>>>> ca7f2111c87963d2646163452effd381ef8a47d0

  return (
    <AppLayout>
      <PageHeader
        title="Notifications"
        subtitle={`${unreadGroupsCount} unread groups · keyword, trend, and paper alerts`}
        action={
          <div className="flex flex-wrap items-center gap-2">
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
<<<<<<< HEAD
              onClick={onDeleteAllRead}
              disabled={deleteAllRead.isPending || grouped.filter((g) => !g.unread).length === 0}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium border border-border bg-surface/50 hover:bg-surface text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors disabled:opacity-50 cursor-pointer"
=======
              onClick={handleDeleteSelectedClick}
              disabled={deleteOne.isPending || deleteMultiple.isPending || selectedIds.length === 0}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium border border-border bg-surface/50 hover:bg-surface text-muted-foreground hover:text-destructive hover:border-destructive/30 disabled:hover:text-muted-foreground disabled:hover:border-border transition-colors disabled:opacity-50 cursor-pointer"
>>>>>>> ca7f2111c87963d2646163452effd381ef8a47d0
            >
              <Trash2 className="size-3.5" /> Delete selected {selectedIds.length > 0 && `(${selectedIds.length})`}
            </button>
            <button
              type="button"
<<<<<<< HEAD
              onClick={onDeleteAll}
              disabled={deleteAll.isPending || grouped.length === 0}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium border border-border bg-surface/50 hover:bg-surface text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors disabled:opacity-50 cursor-pointer"
=======
              onClick={onMarkMultipleRead}
              disabled={markMultipleRead.isPending || selectedIds.length === 0}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium border border-border bg-surface/50 hover:bg-surface text-muted-foreground hover:text-foreground disabled:hover:text-muted-foreground disabled:hover:border-border transition-colors disabled:opacity-50 cursor-pointer"
>>>>>>> ca7f2111c87963d2646163452effd381ef8a47d0
            >
              <CheckCheck className="size-3.5" /> Mark selected read {selectedIds.length > 0 && `(${selectedIds.length})`}
            </button>
            <button
              type="button"
              onClick={() => handleSelectAll(!isAllSelected)}
              disabled={filteredNotifications.length === 0}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-medium border border-border bg-surface/50 hover:bg-surface text-foreground transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Check className="size-3.5" />
              {isAllSelected ? "Deselect all" : "Select all"}
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

<<<<<<< HEAD
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
=======
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
                    className="self-center shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={selectedIds.includes(n.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedIds((prev) => [...prev, n.id]);
                        } else {
                          setSelectedIds((prev) => prev.filter((id) => id !== n.id));
                        }
                      }}
                      aria-label="Select notification"
                    />
                  </div>
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
                          handleDeleteOneClick(n);
                        }}
                        disabled={deleteOne.isPending || deleteMultiple.isPending}
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
>>>>>>> ca7f2111c87963d2646163452effd381ef8a47d0
          </div>

          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      </Card>

<<<<<<< HEAD
      <NotificationPaperModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        group={selectedGroup}
      />
=======
      <AlertDialog
        open={Boolean(confirmDeleteTarget)}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDeleteTarget?.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmDeleteTarget(null)}>Không</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Có
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
>>>>>>> ca7f2111c87963d2646163452effd381ef8a47d0
    </AppLayout>
  );
}
