import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Card } from "@/components/Card";
import { useNotificationsBulk } from "@/hooks/data/use-notifications";
import { usePapersByIds } from "@/hooks/data/use-papers";
import type { Paper } from "@/types/domain";
import { SaveToCollectionButton } from "@/components/SaveToCollectionButton";
import { z } from "zod";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  BookOpen,
  TrendingUp,
  Sparkles,
  FileText,
  Bookmark,
  Activity,
  Globe,
  Award
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { formatDistanceToNow, parseISO, isValid } from "date-fns";
import { groupNotifications, type NotificationGroup } from "@/utils/notification-grouper";

const groupDetailSearchSchema = z.object({
  filter: z.enum(["all", "openAccess", "highImpact"]).catch("all").optional(),
  sort: z.enum(["default", "trendScore", "citations"]).catch("default").optional(),
  page: z.coerce.number().catch(1).optional(),
});

export const Route = createFileRoute("/notifications/$groupId")({
  component: NotificationGroupDetailPage,
  validateSearch: (s) => groupDetailSearchSchema.parse(s),
});

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

function PaperRow({ paper }: { paper: Paper }) {
  const navigate = useNavigate();

  return (
    <div
      role="button"
      onClick={() => {
        void navigate({ to: `/papers/${paper.id}` });
      }}
      className="p-5 rounded-xl border border-border hover:border-brand/40 hover:bg-brand/5 transition-all text-left group cursor-pointer relative"
    >
      <div className="flex justify-between items-start gap-4 mb-2">
        <h4 className="text-sm font-semibold text-foreground group-hover:text-brand transition-colors line-clamp-2 pr-2">
          {paper.title}
        </h4>
        <div className="flex items-center gap-2 shrink-0">
          <div
            onClick={(e) => e.stopPropagation()}
            className="z-10 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <SaveToCollectionButton paperId={paper.id} paperTitle={paper.title} size="sm" />
          </div>
          <span className="flex items-center gap-0.5 text-xs text-brand font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            View <ArrowUpRight className="size-3.5" />
          </span>
        </div>
      </div>

      <div className="text-xs text-muted-foreground space-y-1">
        {paper.journal && (
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <BookOpen className="size-3.5 text-muted-foreground" />
            <span>{paper.journal}</span>
          </div>
        )}
        <div className="flex items-center gap-3 font-mono text-[10px] text-muted-foreground">
          {paper.trendScore !== undefined && paper.trendScore > 0 && (
            <span className="text-brand font-semibold flex items-center gap-0.5">
              Trend Score: {paper.trendScore} 🔥
            </span>
          )}
          {paper.year && (
            <span>Year: {paper.year}</span>
          )}
          {paper.citations !== undefined && (
            <span>Citations: {paper.citations}</span>
          )}
          {paper.openAccess && (
            <span className="text-emerald-500 font-semibold flex items-center gap-0.5">
              Open Access 🔓
            </span>
          )}
        </div>
        {paper.abstract && (
          <p className="text-[11px] text-muted-foreground mt-2.5 line-clamp-2 italic bg-secondary/10 p-2.5 rounded-lg border border-border/30">
            {paper.abstract}
          </p>
        )}
      </div>
    </div>
  );
}

function FeaturedHighlightCard({ paper }: { paper: Paper }) {
  const navigate = useNavigate();
  return (
    <div
      role="button"
      onClick={() => {
        void navigate({ to: `/papers/${paper.id}` });
      }}
      className="p-3.5 rounded-xl border border-brand/20 bg-brand/5 hover:border-brand/40 hover:bg-brand/10 transition-all text-left flex gap-3 cursor-pointer relative group"
    >
      <div className="size-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0">
        <TrendingUp className="size-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <h4 className="text-xs font-bold text-foreground line-clamp-2 group-hover:text-brand transition-colors">
            {paper.title}
          </h4>
          <div className="flex items-center gap-1.5 shrink-0">
            <div
              onClick={(e) => e.stopPropagation()}
              className="z-10 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <SaveToCollectionButton paperId={paper.id} paperTitle={paper.title} size="sm" />
            </div>
            <ArrowUpRight className="size-3.5 text-brand opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
        <div className="flex items-center gap-2 mt-1.5 text-[10px] font-mono text-muted-foreground">
          <span className="font-semibold text-brand">Score: {paper.trendScore}</span>
          <span>·</span>
          <span>{paper.journal}</span>
          <span>·</span>
          <span>{paper.year}</span>
          {paper.openAccess && (
            <>
              <span>·</span>
              <span className="text-emerald-500 font-semibold">OA 🔓</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function NotificationGroupDetailPage() {
  const { groupId } = Route.useParams();
  const { filter: quickFilter = "all", sort: sortBy = "default", page: currentPage = 1 } = Route.useSearch();
  const navigate = useNavigate();
  const { data: notifications = [], isLoading: isNotificationsLoading } = useNotificationsBulk(1000);

  const ITEMS_PER_PAGE = 10;

  const setQuickFilter = (val: "all" | "openAccess" | "highImpact") => {
    void navigate({
      search: { filter: val, sort: sortBy, page: 1 } as any,
    });
  };

  const setSortBy = (val: "default" | "trendScore" | "citations") => {
    void navigate({
      search: { filter: quickFilter, sort: val, page: 1 } as any,
    });
  };

  const setCurrentPage = (val: number) => {
    void navigate({
      search: { filter: quickFilter, sort: sortBy, page: val } as any,
    });
  };

  // Decode keyword and trigger type from groupId parameter
  const { keyword, triggerType } = useMemo(() => {
    const decoded = decodeURIComponent(groupId);
    const separatorIdx = decoded.lastIndexOf("~");
    if (separatorIdx !== -1) {
      return {
        keyword: decoded.substring(0, separatorIdx),
        triggerType: decoded.substring(separatorIdx + 1)
      };
    }
    return { keyword: decoded, triggerType: "" };
  }, [groupId]);

  // Group notifications and find the target group
  const grouped = useMemo(() => groupNotifications(notifications), [notifications]);
  const group = useMemo(() => {
    return grouped.find(
      (g) => g.keyword.toLowerCase() === keyword.toLowerCase() && g.triggerType === triggerType
    );
  }, [grouped, keyword, triggerType]);

  // Gather paper IDs to fetch bulk details
  const paperIds = useMemo(() => {
    return group?.papers.map((p) => p.id).filter(Boolean) ?? [];
  }, [group]);

  const { data: detailedPapers = [], isLoading: isPapersLoading } = usePapersByIds(paperIds);

  const isLoading = isNotificationsLoading || isPapersLoading;

  // Map original sync order
  const originalOrderMap = useMemo(() => {
    const map = new Map<string, number>();
    group?.papers.forEach((p, idx) => {
      map.set(p.id, idx);
    });
    return map;
  }, [group]);

  // Title-based deduplication
  const uniquePapers = useMemo(() => {
    const seenTitles = new Set<string>();
    const result: Paper[] = [];
    for (const paper of detailedPapers) {
      if (!paper) continue;
      const normalizedTitle = paper.title.trim().toLowerCase();
      if (!seenTitles.has(normalizedTitle)) {
        seenTitles.add(normalizedTitle);
        result.push(paper);
      }
    }
    return result;
  }, [detailedPapers]);

  // Featured Highlights (Top 3 highest Trend Score)
  const highlights = useMemo(() => {
    const sorted = [...uniquePapers].sort((a, b) => (b.trendScore || 0) - (a.trendScore || 0));
    return sorted.slice(0, 3);
  }, [uniquePapers]);

  // Remaining papers (excluding highlights)
  const remainingPapers = useMemo(() => {
    const highlightIds = new Set(highlights.map((h) => h.id));
    return uniquePapers.filter((p) => !highlightIds.has(p.id));
  }, [uniquePapers, highlights]);

  // Filtered and Sorted papers
  const filteredAndSortedPapers = useMemo(() => {
    let result = [...remainingPapers];

    // Apply quick filters
    if (quickFilter === "openAccess") {
      result = result.filter((p) => p.openAccess);
    } else if (quickFilter === "highImpact") {
      result = result.filter((p) => p.citations >= 10 || (p.trendScore !== undefined && p.trendScore >= 300));
    }

    // Apply sorting
    if (sortBy === "default") {
      result.sort((a, b) => (originalOrderMap.get(a.id) ?? 0) - (originalOrderMap.get(b.id) ?? 0));
    } else if (sortBy === "trendScore") {
      result.sort((a, b) => (b.trendScore || 0) - (a.trendScore || 0));
    } else if (sortBy === "citations") {
      result.sort((a, b) => (b.citations || 0) - (a.citations || 0));
    }

    return result;
  }, [remainingPapers, quickFilter, sortBy, originalOrderMap]);

  // Statistics for left panel
  const stats = useMemo(() => {
    if (uniquePapers.length === 0) return null;
    const oaCount = uniquePapers.filter(p => p.openAccess).length;
    const hiCount = uniquePapers.filter(p => p.citations >= 10 || (p.trendScore !== undefined && p.trendScore >= 300)).length;

    // Source counts
    const sources: Record<string, number> = {};
    uniquePapers.forEach(p => {
      sources[p.source] = (sources[p.source] || 0) + 1;
    });

    return {
      total: uniquePapers.length,
      oaRate: Math.round((oaCount / uniquePapers.length) * 100),
      hiRate: Math.round((hiCount / uniquePapers.length) * 100),
      sources
    };
  }, [uniquePapers]);

  const totalPages = Math.ceil(filteredAndSortedPapers.length / ITEMS_PER_PAGE);
  const paginatedPapers = filteredAndSortedPapers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <AppLayout>
      <PageHeader
        title={group ? (group.uiType === "system" ? group.keyword : `Alert: ${group.keyword}`) : `Alert Details`}
        subtitle={group ? `Latest alert received ${formatTime(group.latestCreatedAt)}` : ""}
        action={
          <Link
            to="/notifications"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold border border-border bg-surface/50 hover:bg-surface text-foreground transition-colors cursor-pointer"
          >
            <ChevronLeft className="size-3.5" /> Back to Notifications
          </Link>
        }
      />

      {isLoading ? (
        <Card className="py-20 flex flex-col items-center justify-center gap-3">
          <div className="size-8 rounded-full border-4 border-brand border-t-transparent animate-spin" />
          <span className="text-sm text-muted-foreground font-medium">Loading paper details...</span>
        </Card>
      ) : !group ? (
        <Card className="py-20 text-center text-muted-foreground">
          <FileText className="size-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm font-medium">Notification alert group not found.</p>
          <Link to="/notifications" className="text-brand text-xs font-semibold mt-2 inline-block hover:underline">
            Return to list
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Column: Stats & Highlights */}
          <div className="space-y-6 lg:col-span-1">
            {/* Stats Insights Panel */}
            {stats && (
              <Card className="p-5">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-1.5">
                  <Activity className="size-3.5 text-brand" /> Batch Insights
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-border/50">
                    <span className="text-xs text-muted-foreground">Total New Papers</span>
                    <span className="text-sm font-bold text-foreground">{stats.total}</span>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Globe className="size-3 text-emerald-500" /> Open Access Rate
                      </span>
                      <span className="font-semibold text-foreground">{stats.oaRate}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${stats.oaRate}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Award className="size-3 text-amber-500" /> High Impact Rate
                      </span>
                      <span className="font-semibold text-foreground">{stats.hiRate}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${stats.hiRate}%` }} />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/50">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">Source Distribution</span>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {Object.entries(stats.sources).map(([source, count]) => (
                        <div key={source} className="bg-secondary/40 border border-border/40 rounded-lg p-2">
                          <span className="text-[9px] font-mono text-muted-foreground block truncate" title={source}>{source}</span>
                          <span className="text-xs font-bold text-foreground mt-0.5 block">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Highlights Panel */}
            {highlights.length > 0 && (
              <Card className="p-5">
                <h3 className="text-xs font-bold text-brand uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-brand" /> Featured Highlights
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {highlights.map((paper) => (
                    <FeaturedHighlightCard key={paper.id} paper={paper} />
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Right Column: Main List & Filters */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              {/* Filters Header */}
              <div className="flex flex-wrap gap-3 mb-6 items-center justify-between border-b border-border pb-4">
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { key: "all", label: "Tất cả" },
                      { key: "openAccess", label: "Open Access 🔓" },
                      { key: "highImpact", label: "High Impact ⚡" },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setQuickFilter(f.key)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-all cursor-pointer ${quickFilter === f.key
                          ? "bg-brand/10 border-brand/30 text-brand font-bold"
                          : "bg-surface text-muted-foreground border-border hover:bg-secondary"
                        }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-secondary/40 border border-border text-xs font-semibold rounded-md px-3 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-brand/40 cursor-pointer"
                  >
                    <option value="default">Default Order</option>
                    <option value="trendScore">Trend Score</option>
                    <option value="citations">Citations</option>
                  </select>
                </div>
              </div>

              {/* Feed List */}
              {paginatedPapers.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                  <FileText className="size-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">Không có bài báo nào phù hợp với bộ lọc hiện tại.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paginatedPapers.map((paper) => (
                    <PaperRow key={paper.id} paper={paper} />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1.5 pt-6 border-t border-border mt-6">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                    className="h-9 px-4 rounded-lg text-xs font-semibold border border-border hover:bg-secondary disabled:opacity-50 disabled:hover:bg-transparent transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <ChevronLeft className="size-4" /> Prev
                  </button>

                  <span className="text-xs font-semibold text-muted-foreground px-4">
                    Page {currentPage} of {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(currentPage + 1)}
                    className="h-9 px-4 rounded-lg text-xs font-semibold border border-border hover:bg-secondary disabled:opacity-50 disabled:hover:bg-transparent transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    Next <ChevronRight className="size-4" />
                  </button>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
