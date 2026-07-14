import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Card } from "@/components/Card";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAnalyticsSnapshot } from "@/hooks/data/use-analytics";
import { useFollowedTopics, useFollowTopic, useUnfollowTopic, useFollowedAuthors, useFollowAuthor, useUnfollowAuthor } from "@/hooks/data/use-follows";
import { Flame, TrendingUp, Sparkles, Brain, CheckCircle, Lightbulb, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/auth";
import { ApiError } from "@/api/errors";
import { useQueries, useMutation, useQuery } from "@tanstack/react-query";
import { useDashboardSummary, KeywordChartResponse, KeywordChartPointDto } from "@/hooks/data/use-dashboard";
import { apiClient } from "@/api/client";
import { mockQueryDefaults } from "@/hooks/data/query-options";
import { useMemo, useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


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
    trendingAuthors: TRENDING_AUTHORS = [],
  } = analytics ?? {};

  // Current main month of the table (previous calendar month)
  const currentMainMonth = useMemo(() => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - 1);
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
    };
  }, []);

  // Fetch current month's trending keywords from the database
  const { data: databaseTrendingKeywords = [] } = useQuery({
    queryKey: ["trending-keywords-month", currentMainMonth.year, currentMainMonth.month],
    queryFn: async () => {
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
          year: currentMainMonth.year,
          month: currentMainMonth.month,
        },
      });

      // Normalize raw TrendingKeywordResponse to Keyword
      return (res.data ?? []).map((raw) => ({
        id: String(raw.keywordId),
        term: raw.term,
        count: raw.paperCount,
        trendScore: raw.trendScore,
        monthsTrending: 3,
        category: raw.domain ?? "Research",
      }));
    },
    ...mockQueryDefaults,
  });

  const TRENDING_KEYWORDS = useMemo(() => {
    return databaseTrendingKeywords.filter((k) => k.count !== null && k.count > 0).slice(0, 8);
  }, [databaseTrendingKeywords]);



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

  const checkMonthsQueries = useQueries({
    queries: previousMonthsList.map((m) => ({
      queryKey: ["trending-keywords-month-check", m.year, m.month],
      queryFn: async () => {
        const res = await apiClient.get<{
          data: Array<{
            paperCount: number;
          }>;
        }>("/v1/keywords/trending", {
          params: {
            year: m.year,
            month: m.month,
          },
        });
        const hasData = (res.data ?? []).some((raw) => raw.paperCount > 0);
        return {
          ...m,
          hasData,
        };
      },
      ...mockQueryDefaults,
    })),
  });

  const availableCompareMonths = useMemo(() => {
    return checkMonthsQueries
      .map((q) => q.data)
      .filter((d): d is NonNullable<typeof d> => !!d && d.hasData);
  }, [checkMonthsQueries]);

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

  const filteredCompareKeywords = useMemo(() => {
    return compareKeywords.filter((k) => k.count !== null && k.count > 0);
  }, [compareKeywords]);

  // Helper to get comparison info for the bottom table row-by-row
  const getCompareRowData = (bk: any, index: number) => {
    const tk = TRENDING_KEYWORDS.find(k => k.term === bk.term);
    if (tk) {
      const rank_in_top = TRENDING_KEYWORDS.findIndex(k => k.term === bk.term) + 1;
      const rank_in_bottom = index + 1;
      return {
        key: bk.id,
        id: bk.id,
        term: bk.term,
        count: bk.count,
        trendScore: bk.trendScore,
        monthsTrending: bk.monthsTrending,
        isReplaced: false,
        replacingTerm: null,
        diffPapers: tk.count - bk.count,
        diffScore: tk.trendScore - bk.trendScore,
        diffRank: rank_in_bottom - rank_in_top,
      };
    }

    const replacingTk = TRENDING_KEYWORDS[index];
    return {
      key: bk.id,
      id: bk.id,
      term: bk.term,
      count: bk.count,
      trendScore: bk.trendScore,
      monthsTrending: bk.monthsTrending,
      isReplaced: true,
      replacingTerm: replacingTk ? replacingTk.term : null,
      diffPapers: null,
      diffScore: null,
      diffRank: null,
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
                * Legend: Chart displays trend scores (%) of Top 10 trending keywords in the last 4 months with data.
              </p>

              {/* Checkbox Panel (Option 1) */}
              <div className="mt-6 p-4 border border-border rounded-xl bg-secondary/10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                  <div>
                    <h4 className="text-xs font-bold text-foreground">SELECT KEYWORDS TO DISPLAY & ANALYZE</h4>
                    <p className="text-[10px] text-muted-foreground">Select keywords to display trend lines and send data to AI for deep analysis.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedKeywordIds(top10Keywords.map(k => k.keywordId))}
                      className="text-[10px] text-brand hover:underline cursor-pointer font-semibold"
                    >
                      Select All
                    </button>
                    <span className="text-muted-foreground text-[10px]">|</span>
                    <button
                      onClick={() => setSelectedKeywordIds([])}
                      className="text-[10px] text-muted-foreground hover:text-foreground hover:underline cursor-pointer font-semibold"
                    >
                      Deselect All
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
                        toast.error("Please log in to use AI analysis features");
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
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Brain className="size-3" />
                        Analyze with AI
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
                      <p className="text-xs font-bold text-foreground">Groq AI model is processing data</p>
                      <p className="text-[10px] text-muted-foreground max-w-sm">
                        Synthesizing info and comparing trends for {selectedKeywordIds.length} selected keywords over the past 12 months to generate deep insights...
                      </p>
                    </div>
                  </div>
                )}

                {aiMutation.isError && (
                  <div className="p-4 border border-destructive/20 rounded-xl bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                    <span>An error occurred during analysis: {aiMutation.error.message}</span>
                  </div>
                )}

                {aiMutation.isSuccess && aiMutation.data && (
                  <div className="p-5 border border-brand/20 rounded-xl bg-gradient-to-br from-card to-brand/5 space-y-4 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                      <div className="flex items-center gap-2">
                        <div className="size-6.5 bg-brand/10 rounded-lg flex items-center justify-center text-brand">
                          <Brain className="size-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-foreground">Automated Analysis Report</h4>
                          <p className="text-[10px] text-muted-foreground">Deep analysis by Groq AI model</p>
                        </div>
                      </div>
                      <div>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${aiMutation.data.overallVerdict === 'GROWING' ? 'bg-success/15 text-success' :
                            aiMutation.data.overallVerdict === 'MIXED' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-secondary text-muted-foreground'
                          }`}>
                          <TrendingUp className="size-3" />
                          Overall Trend: {aiMutation.data.overallVerdict}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Brain className="size-3 text-brand" /> Comparative Analysis
                      </h5>
                      <p className="text-sm text-foreground leading-relaxed">
                        {aiMutation.data.analysis}
                      </p>
                    </div>

                    {aiMutation.data.topGrowingKeywords && aiMutation.data.topGrowingKeywords.length > 0 && (
                      <div className="space-y-1">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                          <Flame className="size-3 text-brand" /> Top Growing Keywords
                        </h5>
                        <div className="flex flex-wrap gap-1">
                          {aiMutation.data.topGrowingKeywords.map((kw, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 rounded-md bg-brand/10 text-brand font-bold border border-brand/20">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-2.5">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <CheckCircle className="size-3 text-brand" /> Core Insights
                      </h5>
                      <ul className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                        {aiMutation.data.keyInsights.map((insight, i) => (
                          <li key={i} className="p-3 border border-border rounded-lg bg-card/60 text-xs text-muted-foreground leading-relaxed flex items-start gap-1.5">
                            <span className="font-bold text-brand text-xs">0{i + 1}.</span>
                            <span>{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3.5 bg-brand/5 border border-brand/20 rounded-lg flex gap-2.5 items-start">
                      <div className="size-5.5 bg-brand/20 rounded-md flex items-center justify-center text-brand shrink-0">
                        <Lightbulb className="size-3.5" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-brand uppercase tracking-wider">Research Direction Recommendations</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{aiMutation.data.recommendation}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Row 1 (Top Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-stretch">
        <Card
          className="h-full flex flex-col"
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
                    const selected = availableCompareMonths.find(m => m.year === year && m.month === month);
                    if (selected) setCompareMonth(selected);
                  }
                }}
              >
                <SelectTrigger className="h-8 text-xs bg-secondary/20 border-border hover:border-brand/40">
                  <SelectValue placeholder="Compare with month..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No comparison</SelectItem>
                  {availableCompareMonths.map((m) => (
                    <SelectItem key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
                      {m.name} {m.year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          }
        >
          {TRENDING_KEYWORDS.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground font-medium text-center px-4">
              No trend data available for this month. Please run Manual Sync in Admin panel.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">
                  <th className="text-left font-medium pb-3 w-12">Rank</th>
                  <th className="text-left font-medium pb-3 pr-4">Keyword</th>
                  <th className="text-right font-medium pb-3 px-4 w-24">Papers</th>
                  <th className="text-right font-medium pb-3 px-4 w-28">Score</th>
                  <th className="text-right font-medium pb-3 pl-4 w-20">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {TRENDING_KEYWORDS.map((k, index) => {
                  const followed = isTopicFollowed(k.id);
                  return (
                    <tr key={k.id} className="hover:bg-secondary/40 transition-colors">
                      <td className="py-3 text-left font-mono text-muted-foreground w-12">#{index + 1}</td>
                      <td className="py-3 text-left font-medium pr-4 max-w-[220px]">
                        <Link
                          to="/topics/$topicId"
                          params={{ topicId: k.id }}
                          className="hover:text-brand transition-colors cursor-pointer hover:underline block truncate"
                          title={k.term}
                        >
                          {k.term}
                        </Link>
                      </td>
                      <td className="py-3 text-right font-mono text-muted-foreground px-4 w-24">{k.count}</td>
                      <td
                        className={`py-3 text-right font-mono px-4 w-28 ${k.trendScore >= 15
                            ? "text-success"
                            : k.trendScore < 0
                              ? "text-destructive"
                              : "text-muted-foreground"
                          }`}
                      >
                        {k.trendScore > 0 ? "+" : ""}{k.trendScore.toFixed(1)}%
                      </td>
                      <td className="py-3 text-right pl-4 w-20">
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
          )}
        </Card>

        <Card className="h-full flex flex-col" title="Top Cited Authors">
          <div className={`space-y-3 pb-4 overflow-y-auto pr-1 ${compareMonth ? "max-h-[345px]" : "max-h-[430px]"}`}>
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
                      className="text-sm font-medium text-foreground hover:text-brand transition-colors block truncate"
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

      {/* Row 2 (Bottom Cards) */}
      {compareMonth && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-stretch">
          <Card
            className="h-full flex flex-col"
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
            ) : filteredCompareKeywords.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground font-medium">
                No trend data available for this month.
              </div>
            ) : (
              <div className="max-h-[345px] overflow-y-auto pr-1 pb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-widest text-muted-foreground border-b border-border">
                      <th className="text-left font-medium pb-3 w-12">Rank</th>
                      <th className="text-left font-medium pb-3 pr-4">Keyword</th>
                      <th className="text-right font-medium pb-3 px-4 w-24">Papers</th>
                      <th className="text-right font-medium pb-3 px-4 w-28">Score</th>
                      <th className="text-right font-medium pb-3 pl-4 w-20">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredCompareKeywords.slice(0, 8).map((bk, index) => {
                      const rowData = getCompareRowData(bk, index);
                      const followed = isTopicFollowed(rowData.id);
                      return (
                        <tr key={rowData.key} className="hover:bg-secondary/40 transition-colors">
                          <td className="py-3 text-left font-mono text-muted-foreground w-12">
                            <div className="flex flex-col items-start justify-center">
                              <span className="font-medium text-muted-foreground">#{index + 1}</span>
                              {rowData.diffRank !== null ? (
                                <span
                                  className={`text-[10px] font-semibold flex items-center gap-0.5 ${
                                    rowData.diffRank > 0
                                      ? "text-success"
                                      : rowData.diffRank < 0
                                        ? "text-destructive"
                                        : "text-muted-foreground/60"
                                  }`}
                                >
                                  {rowData.diffRank > 0
                                    ? `▲ +${rowData.diffRank}`
                                    : rowData.diffRank < 0
                                      ? `▼ ${rowData.diffRank}`
                                      : `▬ 0`}
                                </span>
                              ) : (
                                <span className="text-[10px] text-warning font-semibold flex items-center gap-0.5" title="Replaced">
                                  ↻
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 text-left font-medium pr-4 max-w-[220px]">
                            <div className="flex flex-col">
                              <Link
                                to="/topics/$topicId"
                                params={{ topicId: rowData.id }}
                                className="hover:text-brand transition-colors cursor-pointer hover:underline block truncate"
                                title={rowData.term}
                              >
                                {rowData.term}
                              </Link>
                              {rowData.isReplaced && (
                                <span className="text-[10px] text-destructive/80 font-normal mt-0.5 flex items-center gap-1 block truncate max-w-[200px]" title={`Replaced by: "${rowData.replacingTerm ?? '—'}"`}>
                                  <span className="text-warning font-bold">↻</span> Replaced by: "{rowData.replacingTerm ?? '—'}"
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 text-right font-mono px-4 w-24">
                            <div className="flex flex-col items-end justify-center">
                              <span className="text-foreground font-medium">
                                {rowData.count !== null ? rowData.count : "—"}
                              </span>
                              {rowData.diffPapers !== null && (
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
                          <td className="py-3 text-right font-mono px-4 w-28">
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
                              {rowData.diffScore !== null && (
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
                          <td className="py-3 text-right pl-4 w-20">
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
              </div>
            )}
          </Card>

          <Card className="h-full flex flex-col" title="Comparison Guide">
            <div className="space-y-5 text-xs flex-1 flex flex-col justify-between">
              <p className="text-muted-foreground leading-relaxed">
                Comparing the selected historical month's data with the current month's trends:
              </p>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-success/5 border border-success/10">
                  <span className="text-success font-bold font-mono text-sm shrink-0">▲</span>
                  <div>
                    <div className="font-semibold text-foreground">Increased</div>
                    <div className="text-[10px] text-muted-foreground">Metric improved</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-destructive/5 border border-destructive/10">
                  <span className="text-destructive font-bold font-mono text-sm shrink-0">▼</span>
                  <div>
                    <div className="font-semibold text-foreground">Decreased</div>
                    <div className="text-[10px] text-muted-foreground">Metric declined</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-secondary/20 border border-border">
                  <span className="text-muted-foreground font-bold font-mono text-sm shrink-0">▬</span>
                  <div>
                    <div className="font-semibold text-foreground">Unchanged</div>
                    <div className="text-[10px] text-muted-foreground">No change</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3.5 rounded-xl bg-warning/5 border border-warning/10">
                  <span className="text-warning font-bold font-mono text-sm shrink-0">↻</span>
                  <div>
                    <div className="font-semibold text-foreground">Replaced</div>
                    <div className="text-[10px] text-muted-foreground">Fell out of Top list</div>
                  </div>
                </div>
              </div>
              <div className="mt-4 p-3.5 rounded-xl bg-secondary/30 border border-border text-[11px] text-muted-foreground leading-relaxed">
                <strong className="text-foreground">Replacement Logic:</strong> If a keyword fell out of the current month's trending list, the table indicates which current keyword took its corresponding rank.
              </div>
            </div>
          </Card>
        </div>
      )}
    </AppLayout>
  );
}

