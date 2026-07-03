import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Card } from "@/components/Card";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAnalyticsSnapshot } from "@/hooks/data/use-analytics";
import { useFollowedTopics, useFollowTopic, useUnfollowTopic, useFollowedAuthors, useFollowAuthor, useUnfollowAuthor } from "@/hooks/data/use-follows";
import { Flame, TrendingUp, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/auth";
import { ApiError } from "@/api/errors";
import { useQueries, useQuery } from "@tanstack/react-query";
import { useDashboardSummary, KeywordChartResponse, KeywordChartPointDto } from "@/hooks/data/use-dashboard";
import { apiClient } from "@/api/client";
import { mockQueryDefaults } from "@/hooks/data/query-options";
import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Keyword } from "@/types/domain";

export const Route = createFileRoute("/trends")({ component: TrendsPage });

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--popover-foreground)",
  fontSize: 12,
} as const;

const MONTH_NAMES = [
  "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const KEYWORD_COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Green
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#f97316", // Orange
  "#14b8a6", // Teal
  "#a855f7", // Violet
];

function getPreviousMonthName() {
  const d = new Date();
  d.setDate(1); // prevent month rollover bug
  d.setMonth(d.getMonth() - 1);
  return d.toLocaleString("en-US", { month: "long" });
}

function TrendsPage() {
  const { data: analytics } = useAnalyticsSnapshot();
  const { user } = useAuth();
  const { data: followedAuthors = [] } = useFollowedAuthors();
  const followAuthorMut = useFollowAuthor();
  const unfollowAuthorMut = useUnfollowAuthor();
  const { data: followedTopics = [] } = useFollowedTopics();
  const followTopic = useFollowTopic();
  const unfollowTopic = useUnfollowTopic();

  const isTopicFollowed = (topicId: string) => followedTopics.some((t) => t.id === topicId);
  const isAuthorFollowed = (authorId: string) => followedAuthors.some((a) => a.id === authorId);

  const {
    trendingKeywords: TRENDING_KEYWORDS = [],
    trendingAuthors: TRENDING_AUTHORS = [],
  } = analytics ?? {};

  // State for the selected month to compare
  const [compareMonth, setCompareMonth] = useState<{ month: number; year: number; name: string } | null>(null);

  // Generate the rolling 5 previous months starting from the currentMainMonth
  const previousMonthsList = useMemo(() => {
    const list = [];
    const date = new Date();
    date.setDate(1); // prevent rollover
    date.setMonth(date.getMonth() - 1); // start from previous calendar month (main month of the table)
    
    for (let i = 0; i < 5; i++) {
      date.setMonth(date.getMonth() - 1);
      list.push({
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        name: date.toLocaleString("en-US", { month: "long" }),
      });
    }
    return list;
  }, []);

  // Fetch Dashboard Top 10 Keywords History for Chart
  const { data: summary, isLoading: loadingSummary } = useDashboardSummary();
  const top10Keywords = useMemo(() => {
    return (summary?.trendingKeywords ?? []).slice(0, 10);
  }, [summary]);

  const keywordChartsQueries = useQueries({
    queries: top10Keywords.map((kw) => ({
      queryKey: ["dashboard", "keyword-chart", kw.keywordId],
      queryFn: async () => {
        const res = await apiClient.get<{ data: KeywordChartResponse }>("/v1/dashboard/keyword-chart", {
          params: { keywordId: kw.keywordId },
        });
        return res.data;
      },
      enabled: Boolean(kw.keywordId),
      ...mockQueryDefaults,
    })),
  });

  // Fetch keywords for the selected comparison month
  const { data: compareKeywords = [], isLoading: loadingCompareKeywords } = useQuery({
    queryKey: ["trending-keywords-month", compareMonth?.year, compareMonth?.month],
    queryFn: async () => {
      if (!compareMonth) return [];
      const res = await apiClient.get<{
        data: Array<{
          keywordId: number;
          term: string;
          domain?: string;
          paperCount: number;
          trendScore: number;
          rank: number;
        }>;
      }>("/v1/keywords/trending", {
        params: {
          year: compareMonth.year,
          month: compareMonth.month,
        },
      });

      // Normalize raw TrendingKeywordResponse to Keyword
      return (res.data ?? []).map((raw) => ({
        id: String(raw.keywordId),
        term: raw.term,
        count: raw.paperCount,
        trendScore: raw.trendScore,
        monthsTrending: 3, // placeholder like BE does for snapshot
        category: raw.domain ?? "Research",
      }));
    },
    enabled: Boolean(compareMonth),
    ...mockQueryDefaults,
  });

  // Keywords that are in the top table but not in the bottom table (New in Top)
  const newInTop = useMemo(() => {
    const bottomTerms = compareKeywords.map(bk => bk.term);
    return TRENDING_KEYWORDS.filter(tk => !bottomTerms.includes(tk.term));
  }, [TRENDING_KEYWORDS, compareKeywords]);

  // Keywords that are in the bottom table but not in the top table (Gone in Bottom)
  const goneInBottom = useMemo(() => {
    const topTerms = TRENDING_KEYWORDS.map(tk => tk.term);
    return compareKeywords.filter(bk => !topTerms.includes(bk.term));
  }, [TRENDING_KEYWORDS, compareKeywords]);

  // Helper to get data and comparison info for the bottom table row-by-row
  const getBottomRowData = (index: number) => {
    const tk = TRENDING_KEYWORDS[index];
    if (!tk) return null;

    const matchedBk = compareKeywords.find(bk => bk.term === tk.term);
    if (matchedBk) {
      const diffPapers = tk.count - matchedBk.count;
      const diffScore = tk.trendScore - matchedBk.trendScore;
      return {
        key: tk.id,
        term: tk.term,
        id: tk.id,
        count: matchedBk.count,
        trendScore: matchedBk.trendScore,
        monthsTrending: matchedBk.monthsTrending,
        isReplaced: false,
        replacingTerm: null,
        isNewEntry: false,
        diffPapers,
        diffScore,
      };
    }

    const newIdx = newInTop.findIndex(k => k.term === tk.term);
    const bk = newIdx !== -1 ? goneInBottom[newIdx] : null;

    if (bk) {
      return {
        key: bk.id,
        term: bk.term,
        id: bk.id,
        count: bk.count,
        trendScore: bk.trendScore,
        monthsTrending: bk.monthsTrending,
        isReplaced: true,
        replacingTerm: tk.term,
        isNewEntry: false,
        diffPapers: 0,
        diffScore: 0,
      };
    }

    // New Entry (no corresponding keyword in bottom month)
    return {
      key: tk.id,
      term: tk.term,
      id: tk.id,
      count: null,
      trendScore: null,
      monthsTrending: tk.monthsTrending,
      isReplaced: false,
      replacingTerm: null,
      isNewEntry: true,
      diffPapers: 0,
      diffScore: 0,
    };
  };

  const isLoadingChart = loadingSummary || keywordChartsQueries.some((q) => q.isLoading);

  const combinedChartData = useMemo(() => {
    const timePointsMap: { [key: string]: { name: string; sortKey: number;[kwName: string]: string | number } } = {};

    keywordChartsQueries.forEach((query) => {
      const data = query.data;
      if (!data || !data.history) return;

      const keywordName = data.keyword;
      data.history.forEach((pt: KeywordChartPointDto) => {
        const sortKey = pt.year * 100 + pt.month;
        const key = `${pt.year}-${pt.month}`;

        if (!timePointsMap[key]) {
          const monthName = MONTH_NAMES[pt.month] || String(pt.month);
          timePointsMap[key] = {
            name: `${monthName} ${pt.year}`,
            sortKey,
          };
        }

        timePointsMap[key][keywordName] = pt.trendScore;
      });
    });

    return Object.values(timePointsMap).sort((a, b) => a.sortKey - b.sortKey);
  }, [keywordChartsQueries]);

  const finalChartData = useMemo(() => {
    return combinedChartData.slice(-4);
  }, [combinedChartData]);

  return (
    <AppLayout>
      <PageHeader
        title="Trend Analytics"
      />

      <div className="mb-6">
        <Card title="Historical Trend Scores of Top 10 Keywords (%)">
          {isLoadingChart ? (
            <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground animate-pulse font-medium">
              Loading trend chart data...
            </div>
          ) : finalChartData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground font-medium">
              No historical trend data available for these keywords.
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={finalChartData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} label={{ value: 'Trend Score (%)', angle: -90, position: 'insideLeft', style: { fill: 'var(--muted-foreground)', fontSize: 10 } }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  {top10Keywords.map((kw, index) => {
                    const color = KEYWORD_COLORS[index % KEYWORD_COLORS.length];
                    return (
                      <Line
                        key={kw.keyword}
                        type="monotone"
                        dataKey={kw.keyword}
                        stroke={color}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
              <p className="mt-4 text-[10px] text-muted-foreground text-center font-medium">
                * Legend: Chart displays trend scores (%) of Top 10 trending keywords in the last 4 months with data.
              </p>
            </>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-start">
        <div className="space-y-6">
          <Card
            title={`TREND SCORE RANKING - ${getPreviousMonthName()}`}
            action={
              <div className="w-[180px]">
                <Select
                  value={compareMonth ? `${compareMonth.year}-${compareMonth.month}` : "none"}
                  onValueChange={(val) => {
                    if (val === "none") {
                      setCompareMonth(null);
                    } else {
                      const [year, month] = val.split("-").map(Number);
                      const selected = previousMonthsList.find(m => m.year === year && m.month === month);
                      if (selected) setCompareMonth(selected);
                    }
                  }}
                >
                  <SelectTrigger className="h-8 text-xs bg-secondary/20 border-border hover:border-brand/40">
                    <SelectValue placeholder="Compare with month..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No comparison</SelectItem>
                    {previousMonthsList.map((m) => (
                      <SelectItem key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
                        {m.name} {m.year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            }
          >
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">
                  <th className="text-left font-medium pb-3">Keyword</th>
                  <th className="text-right font-medium pb-3">Papers</th>
                  <th className="text-right font-medium pb-3">Score</th>
                  <th className="text-right font-medium pb-3">Months</th>
                  <th className="text-right font-medium pb-3 w-20">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {TRENDING_KEYWORDS.map((k) => {
                  const followed = isTopicFollowed(k.id);
                  return (
                    <tr key={k.id} className="hover:bg-secondary/40 transition-colors">
                      <td className="py-3 text-foreground font-medium">
                        <Link
                          to="/topics/$topicId"
                          params={{ topicId: k.id }}
                          className="hover:text-brand transition-colors cursor-pointer hover:underline"
                        >
                          {k.term}
                        </Link>
                      </td>
                      <td className="py-3 text-right font-mono text-muted-foreground">{k.count}</td>
                      <td
                        className={`py-3 text-right font-mono ${
                          k.trendScore >= 15
                            ? "text-success"
                            : k.trendScore < 0
                            ? "text-destructive"
                            : "text-muted-foreground"
                        }`}
                      >
                        {k.trendScore > 0 ? "+" : ""}{k.trendScore.toFixed(1)}%
                      </td>
                      <td className="py-3 text-right font-mono text-muted-foreground">
                        {k.monthsTrending}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => {
                            if (followed) {
                              unfollowTopic.mutate(k.id, {
                                onSuccess: () => toast.info(`Unfollowed keyword: ${k.term}`),
                              });
                            } else {
                              followTopic.mutate(k.id, {
                                onSuccess: () => toast.success(`Following keyword: ${k.term}`),
                              });
                            }
                          }}
                          className={`text-[10px] px-2.5 py-0.5 rounded-md border transition-all cursor-pointer ${followed
                            ? "border-brand/40 bg-brand/10 text-brand font-medium hover:bg-brand/20"
                            : "border-border hover:border-brand/40 hover:text-brand"
                            }`}
                        >
                          {followed ? "Following" : "Follow"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          {compareMonth && (
            <Card
              title={`TREND SCORE RANKING - ${compareMonth.name.toUpperCase()} ${compareMonth.year}`}
              action={
                <button
                  onClick={() => setCompareMonth(null)}
                  className="p-1 hover:bg-secondary rounded transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Close comparison"
                >
                  <X className="h-4 w-4" />
                </button>
              }
            >
              {loadingCompareKeywords ? (
                <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground animate-pulse font-medium">
                  Loading data for {compareMonth.name} {compareMonth.year}...
                </div>
              ) : compareKeywords.length === 0 ? (
                <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground font-medium">
                  No trend data available for this month.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">
                      <th className="text-left font-medium pb-3">Keyword</th>
                      <th className="text-right font-medium pb-3">Papers</th>
                      <th className="text-right font-medium pb-3">Score</th>
                      <th className="text-right font-medium pb-3">Months</th>
                      <th className="text-right font-medium pb-3 w-20">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {Array.from({ length: TRENDING_KEYWORDS.length }).map((_, index) => {
                      const rowData = getBottomRowData(index);
                      if (!rowData) return null;
                      const followed = isTopicFollowed(rowData.id);
                      return (
                        <tr key={rowData.key} className="hover:bg-secondary/40 transition-colors">
                          <td className="py-3 text-foreground font-medium">
                            <Link
                              to="/topics/$topicId"
                              params={{ topicId: rowData.id }}
                              className="hover:text-brand transition-colors cursor-pointer hover:underline"
                            >
                              {rowData.term}
                            </Link>
                          </td>
                          <td className="py-3 text-right font-mono">
                            <div className="flex flex-col items-end justify-center">
                              <span className="text-foreground font-medium">
                                {rowData.count !== null ? rowData.count : "—"}
                              </span>
                              {rowData.isReplaced ? (
                                <span className="text-[10px] text-destructive font-medium">
                                  Replaced
                                </span>
                              ) : rowData.isNewEntry ? (
                                <span className="text-[10px] text-success font-medium">
                                  New Entry
                                </span>
                              ) : (
                                <span
                                  className={`text-[10px] font-semibold flex items-center gap-0.5 ${
                                    rowData.diffPapers > 0
                                      ? "text-success"
                                      : rowData.diffPapers < 0
                                      ? "text-destructive"
                                      : "text-muted-foreground/60"
                                  }`}
                                >
                                  {rowData.diffPapers > 0
                                    ? `▲ +${rowData.diffPapers}`
                                    : rowData.diffPapers < 0
                                    ? `▼ ${rowData.diffPapers}`
                                    : `▬ 0`}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 text-right font-mono">
                            <div className="flex flex-col items-end justify-center">
                              <span
                                className={`font-semibold ${
                                  rowData.trendScore !== null
                                    ? rowData.trendScore >= 15
                                      ? "text-success"
                                      : rowData.trendScore < 0
                                      ? "text-destructive"
                                      : "text-muted-foreground"
                                    : "text-muted-foreground/40"
                                }`}
                              >
                                {rowData.trendScore !== null
                                  ? `${rowData.trendScore > 0 ? "+" : ""}${rowData.trendScore.toFixed(1)}%`
                                  : "—"}
                              </span>
                              {rowData.isReplaced ? (
                                <span
                                  className="text-[10px] text-destructive/80 font-normal truncate max-w-[120px]"
                                  title={rowData.replacingTerm ? `Replaced by ${rowData.replacingTerm}` : "Replaced"}
                                >
                                  by "{rowData.replacingTerm ? rowData.replacingTerm : '—'}"
                                </span>
                              ) : rowData.isNewEntry ? (
                                <span className="text-[10px] text-success/80 font-normal">
                                  New
                                </span>
                              ) : (
                                <span
                                  className={`text-[10px] font-semibold flex items-center gap-0.5 ${
                                    rowData.diffScore > 0
                                      ? "text-success"
                                      : rowData.diffScore < 0
                                      ? "text-destructive"
                                      : "text-muted-foreground/60"
                                  }`}
                                >
                                  {rowData.diffScore > 0
                                    ? `▲ +${rowData.diffScore.toFixed(1)}%`
                                    : rowData.diffScore < 0
                                    ? `▼ ${rowData.diffScore.toFixed(1)}%`
                                    : `▬ 0.0%`}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 text-right font-mono text-muted-foreground">
                            {rowData.monthsTrending}
                          </td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => {
                                if (followed) {
                                  unfollowTopic.mutate(rowData.id, {
                                    onSuccess: () => toast.info(`Unfollowed keyword: ${rowData.term}`),
                                  });
                                } else {
                                  followTopic.mutate(rowData.id, {
                                    onSuccess: () => toast.success(`Following keyword: ${rowData.term}`),
                                  });
                                }
                              }}
                              className={`text-[10px] px-2.5 py-0.5 rounded-md border transition-all cursor-pointer ${followed
                                ? "border-brand/40 bg-brand/10 text-brand font-medium hover:bg-brand/20"
                                : "border-border hover:border-brand/40 hover:text-brand"
                                }`}
                            >
                              {followed ? "Following" : "Follow"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </Card>
          )}
        </div>

        <Card title="Top Cited Authors">
          <div className="space-y-3">
            {TRENDING_AUTHORS.map((a, i) => {
              const followed = isAuthorFollowed(a.id);
              return (
                <div
                  key={a.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/40 transition-colors"
                >
                  <div
                    className="size-8 rounded-full flex items-center justify-center text-[10px] font-bold text-brand-foreground shrink-0"
                    style={{ background: "var(--gradient-brand)" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      to="/authors/$authorId"
                      params={{ authorId: a.id }}
                      className="text-sm font-medium text-foreground hover:text-brand transition-colors cursor-pointer block truncate"
                    >
                      {a.name}
                    </Link>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {a.affiliation} · h-index {a.hIndex}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-mono text-muted-foreground font-semibold">
                        {(a.citations ?? 0).toLocaleString()} citations
                      </div>
                    </div>
                    <button
                      disabled={followAuthorMut.isPending || unfollowAuthorMut.isPending}
                      onClick={() => {
                        if (!user) {
                          toast.error("Log in to follow authors");
                          return;
                        }
                        if (followed) {
                          unfollowAuthorMut.mutate(a.id, {
                            onSuccess: () => toast.info(`Unfollowed ${a.name}`),
                            onError: (err) => {
                              const msg = err instanceof ApiError ? err.message : "Unfollow failed";
                              toast.error(msg);
                            },
                          });
                        } else {
                          followAuthorMut.mutate(a.id, {
                            onSuccess: () => toast.success(`Following ${a.name}`),
                            onError: (err) => {
                              const msg = err instanceof ApiError ? err.message : "Follow failed. Max 20 authors.";
                              toast.error(msg);
                            },
                          });
                        }
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ${followed
                        ? "border-brand/40 bg-brand/10 text-brand"
                        : "border-border hover:border-brand/40 hover:text-brand"
                        }`}
                    >
                      {followed ? "Following" : "Follow"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}

