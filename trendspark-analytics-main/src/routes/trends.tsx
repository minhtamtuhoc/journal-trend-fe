import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Card } from "@/components/Card";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAnalyticsSnapshot } from "@/hooks/data/use-analytics";
import { useFollowedTopics, useFollowTopic, useUnfollowTopic, useFollowedAuthors, useFollowAuthor, useUnfollowAuthor } from "@/hooks/data/use-follows";
import { Flame, TrendingUp, Sparkles, Brain, CheckCircle, Lightbulb, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/auth";
import { ApiError } from "@/api/errors";
import { useQueries, useMutation } from "@tanstack/react-query";
import { useDashboardSummary, KeywordChartResponse, KeywordChartPointDto } from "@/hooks/data/use-dashboard";
import { apiClient } from "@/api/client";
import { mockQueryDefaults } from "@/hooks/data/query-options";
import { useMemo, useState, useEffect } from "react";

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

interface AiTopTrendsAnalysisRequest {
  keywordIds?: number[];
  months?: number;
  chartImageBase64?: string;
  chartImageMimeType?: string;
}

interface AiTopTrendsAnalysisResponse {
  overallVerdict: "GROWING" | "STABLE" | "MIXED";
  analyzedKeywords: string[];
  topGrowingKeywords: string[];
  analysis: string;
  keyInsights: string[];
  recommendation: string;
}

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

  const [selectedKeywordIds, setSelectedKeywordIds] = useState<number[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (top10Keywords.length > 0 && !isInitialized) {
      setSelectedKeywordIds(top10Keywords.map((k) => k.keywordId));
      setIsInitialized(true);
    }
  }, [top10Keywords, isInitialized]);

  const aiMutation = useMutation<
    AiTopTrendsAnalysisResponse,
    Error,
    AiTopTrendsAnalysisRequest
  >({
    mutationFn: async (payload) => {
      const res = await apiClient.post<{ data: AiTopTrendsAnalysisResponse }>(
        "/v1/ai/analyze-top-trends",
        payload
      );
      return res.data;
    },
  });

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

  const isLoadingChart = loadingSummary || keywordChartsQueries.some((q) => q.isLoading);

  const combinedChartData = useMemo(() => {
    const timePointsMap: { [key: string]: { name: string; sortKey: number; [kwName: string]: string | number } } = {};

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
                    if (!selectedKeywordIds.includes(kw.keywordId)) return null;
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

              {/* Checkbox Panel (Option 1) */}
              <div className="mt-6 p-4 border border-border rounded-xl bg-secondary/10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                  <div>
                    <h4 className="text-xs font-bold text-foreground">CHỌN TỪ KHÓA ĐỂ HIỂN THỊ & PHÂN TÍCH</h4>
                    <p className="text-[10px] text-muted-foreground">Tích chọn từ khóa để hiển thị đường biểu diễn và gửi dữ liệu cho AI phân tích.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedKeywordIds(top10Keywords.map(k => k.keywordId))}
                      className="text-[10px] text-brand hover:underline cursor-pointer font-semibold"
                    >
                      Chọn tất cả
                    </button>
                    <span className="text-muted-foreground text-[10px]">|</span>
                    <button
                      onClick={() => setSelectedKeywordIds([])}
                      className="text-[10px] text-muted-foreground hover:text-foreground hover:underline cursor-pointer font-semibold"
                    >
                      Bỏ chọn tất cả
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {top10Keywords.map((kw, index) => {
                    const isChecked = selectedKeywordIds.includes(kw.keywordId);
                    const color = KEYWORD_COLORS[index % KEYWORD_COLORS.length];
                    return (
                      <label
                        key={kw.keywordId}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] cursor-pointer select-none transition-all duration-200 hover:bg-secondary/40"
                        style={{
                          borderColor: isChecked ? color : "var(--border)",
                          backgroundColor: isChecked ? `${color}15` : "transparent",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          className="rounded border-border text-brand focus:ring-brand size-3.5 cursor-pointer"
                          onChange={() => {
                            setSelectedKeywordIds((prev) =>
                              prev.includes(kw.keywordId)
                                ? prev.filter((id) => id !== kw.keywordId)
                                : [...prev, kw.keywordId]
                            );
                          }}
                        />
                        <span
                          className="font-semibold"
                          style={{ color: isChecked ? "var(--foreground)" : "var(--muted-foreground)" }}
                        >
                          {kw.keyword}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* AI Trend Analyst Trigger & Results */}
              <div className="mt-6 border-t border-border pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-brand animate-pulse" />
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">AI Trend Analyst</h4>
                  </div>
                  <button
                    disabled={aiMutation.isPending || selectedKeywordIds.length === 0}
                    onClick={() => {
                      if (!user) {
                        toast.error("Vui lòng đăng nhập để sử dụng tính năng phân tích AI");
                        return;
                      }
                      aiMutation.mutate({
                        keywordIds: selectedKeywordIds,
                        months: 12,
                      });
                    }}
                    className="flex items-center gap-1.5 text-[11px] font-bold px-3.5 py-1.5 bg-brand text-brand-foreground rounded-lg shadow-sm hover:bg-brand/90 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed uppercase"
                  >
                    {aiMutation.isPending ? (
                      <>
                        <RefreshCw className="size-3 animate-spin" />
                        Đang phân tích...
                      </>
                    ) : (
                      <>
                        <Brain className="size-3" />
                        Phân tích bằng AI
                      </>
                    )}
                  </button>
                </div>

                {aiMutation.isPending && (
                  <div className="p-6 border border-border rounded-xl bg-card/40 flex flex-col items-center justify-center text-center space-y-2">
                    <div className="relative flex items-center justify-center">
                      <div className="absolute size-8 bg-brand/10 rounded-full animate-ping" />
                      <div className="relative size-8 bg-brand/20 rounded-full flex items-center justify-center text-brand">
                        <Sparkles className="size-4 animate-pulse" />
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-foreground">Mô hình Gemini đang xử lý dữ liệu</p>
                      <p className="text-[10px] text-muted-foreground max-w-sm">
                        Đang tổng hợp thông tin, so sánh xu hướng {selectedKeywordIds.length} từ khóa đã chọn trong 12 tháng qua để đưa ra nhận định chuyên sâu...
                      </p>
                    </div>
                  </div>
                )}

                {aiMutation.isError && (
                  <div className="p-4 border border-destructive/20 rounded-xl bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                    <span>Có lỗi xảy ra trong quá trình phân tích: {aiMutation.error.message}</span>
                  </div>
                )}

                {aiMutation.isSuccess && aiMutation.data && (
                  <div className="p-5 border border-brand/20 rounded-xl bg-gradient-to-br from-card to-brand/5 space-y-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                      <div className="flex items-center gap-2">
                        <div className="size-6 bg-brand/10 rounded-lg flex items-center justify-center text-brand">
                          <Brain className="size-3.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-foreground">Báo cáo phân tích tự động</h4>
                          <p className="text-[9px] text-muted-foreground">Phân tích chuyên sâu bởi mô hình Gemini AI</p>
                        </div>
                      </div>
                      <div>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          aiMutation.data.overallVerdict === 'GROWING' ? 'bg-success/15 text-success' :
                          aiMutation.data.overallVerdict === 'MIXED' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-secondary text-muted-foreground'
                        }`}>
                          <TrendingUp className="size-2.5" />
                          Xu hướng chung: {aiMutation.data.overallVerdict}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h5 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Brain className="size-2.5 text-brand" /> Phân tích đối sánh
                      </h5>
                      <p className="text-xs text-foreground leading-relaxed">
                        {aiMutation.data.analysis}
                      </p>
                    </div>

                    {aiMutation.data.topGrowingKeywords && aiMutation.data.topGrowingKeywords.length > 0 && (
                      <div className="space-y-1">
                        <h5 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Flame className="size-2.5 text-brand" /> Từ khóa tăng trưởng mạnh nhất
                        </h5>
                        <div className="flex flex-wrap gap-1">
                          {aiMutation.data.topGrowingKeywords.map((kw, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-brand/10 text-brand font-bold border border-brand/20">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2.5">
                      <h5 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <CheckCircle className="size-2.5 text-brand" /> Điểm nhận định cốt lõi
                      </h5>
                      <ul className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                        {aiMutation.data.keyInsights.map((insight, i) => (
                          <li key={i} className="p-3 border border-border rounded-lg bg-card/60 text-[11px] text-muted-foreground leading-relaxed flex items-start gap-1.5">
                            <span className="font-bold text-brand text-[11px]">0{i+1}.</span>
                            <span>{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 bg-brand/5 border border-brand/20 rounded-lg flex gap-2.5 items-start">
                      <div className="size-5 bg-brand/20 rounded-md flex items-center justify-center text-brand shrink-0">
                        <Lightbulb className="size-3" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-brand uppercase tracking-wider">Khuyến nghị hướng nghiên cứu</p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">{aiMutation.data.recommendation}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
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

