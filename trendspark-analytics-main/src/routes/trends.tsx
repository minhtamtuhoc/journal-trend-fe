import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Card } from "@/components/Card";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAnalyticsSnapshot } from "@/hooks/data/use-analytics";
import { useFollowedTopics, useFollowTopic, useUnfollowTopic, useFollowedAuthors, useFollowAuthor, useUnfollowAuthor } from "@/hooks/data/use-follows";
import { Flame, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/auth";
import { ApiError } from "@/api/errors";
import { useQueries } from "@tanstack/react-query";
import { useDashboardSummary } from "@/hooks/data/use-dashboard";
import { apiClient } from "@/api/client";
import { mockQueryDefaults } from "@/hooks/data/query-options";
import { useMemo, useState } from "react";

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

  // Fetch Dashboard Top 10 Keywords History for Chart
  const { data: summary, isLoading: loadingSummary } = useDashboardSummary();
  const top10Keywords = useMemo(() => {
    return (summary?.trendingKeywords ?? []).slice(0, 10);
  }, [summary]);

  const keywordChartsQueries = useQueries({
    queries: top10Keywords.map((kw) => ({
      queryKey: ["dashboard", "keyword-chart", kw.keywordId],
      queryFn: async () => {
        const res = await apiClient.get<{ data: any }>("/v1/dashboard/keyword-chart", {
          params: { keywordId: kw.keywordId },
        });
        return res.data;
      },
      enabled: Boolean(kw.keywordId),
      ...mockQueryDefaults,
    })),
  });

  const isLoadingChart = loadingSummary || keywordChartsQueries.some((q) => q.isLoading);

  const combinedChartData = useMemo(() => {
    const timePointsMap: { [key: string]: { name: string; sortKey: number;[kwName: string]: any } } = {};

    keywordChartsQueries.forEach((query) => {
      const data = query.data;
      if (!data || !data.history) return;

      const keywordName = data.keyword;
      data.history.forEach((pt: any) => {
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
            <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground animate-pulse">
              Đang tải dữ liệu biểu đồ xu hướng...
            </div>
          ) : finalChartData.length === 0 ? (
            <div className="h-[300px] flex items-center justify-center text-sm text-muted-foreground">
              Không có dữ liệu xu hướng lịch sử cho các từ khóa này.
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
                * Chú thích: Biểu đồ hiển thị điểm xu hướng (%) của Top 10 từ khóa thịnh hành trong 4 tháng gần nhất có dữ liệu.
              </p>
            </>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title={`TREND SCORE RANKING - ${getPreviousMonthName()}`}>
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
                      className={`py-3 text-right font-mono ${k.trendScore >= 15 ? "text-success" : k.trendScore < 0 ? "text-destructive" : "text-muted-foreground"}`}
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

        <Card title="Trending Authors">
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
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-mono ${a.trendScore >= 0 ? "text-success" : "text-destructive"}`}>
                      {a.trendScore > 0 ? "+" : ""}{a.trendScore.toFixed(1)}%
                    </span>
                    <button
                      disabled={followAuthorMut.isPending || unfollowAuthorMut.isPending}
                      onClick={() => {
                        if (!user) {
                          toast.error("Đăng nhập để theo dõi tác giả");
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

