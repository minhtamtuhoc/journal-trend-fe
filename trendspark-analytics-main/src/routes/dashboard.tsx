import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Card, KpiCard } from "@/components/Card";
import { useState, useEffect, useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  useDashboardSummary,
  useKeywordChartData,
} from "@/hooks/data/use-dashboard";
import {
  Download,
  Calendar,
  Layers,
  FileText,
  Activity,
  Award,
  Hash,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  HelpCircle,
  Calculator,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import {
  Tooltip as UiTooltip,
  TooltipTrigger as UiTooltipTrigger,
  TooltipContent as UiTooltipContent,
  TooltipProvider as UiTooltipProvider,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { reportsApi } from "@/services/http/reports-api";
import { useAuth, isAdminUser, isStudentUser } from "@/auth";
import { ApiError } from "@/api/errors";

export const Route = createFileRoute("/dashboard")({ component: DashboardPage });

const chartTheme = {
  axis: "var(--muted-foreground)",
  grid: "var(--border)",
  tooltipBg: "var(--popover)",
};

function tooltipStyle() {
  return {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    color: "var(--popover-foreground)",
    fontSize: 12,
  } as const;
}

const MONTH_NAMES = [
  "", "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

function formatMonthYear(month: number, year: number) {
  const m = MONTH_NAMES[month] || String(month);
  return `${m} ${year}`;
}

function TrendingKeywordTooltipContent({
  keywordId,
  keyword,
  trendScore,
}: {
  keywordId: number;
  keyword: string;
  trendScore: number;
}) {
  const { data: chartData, isLoading } = useKeywordChartData(keywordId);

  const recentMonths = useMemo(() => {
    const now = new Date();
    const m1Date = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const m2Date = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const m3Date = new Date(now.getFullYear(), now.getMonth() - 3, 1);

    const m1Num = m1Date.getMonth() + 1;
    const m2Num = m2Date.getMonth() + 1;
    const m3Num = m3Date.getMonth() + 1;

    return [
      {
        year: m3Date.getFullYear(),
        month: m3Num,
        label: MONTH_NAMES[m3Num] || `Month ${m3Num}`,
      },
      {
        year: m2Date.getFullYear(),
        month: m2Num,
        label: MONTH_NAMES[m2Num] || `Month ${m2Num}`,
      },
      {
        year: m1Date.getFullYear(),
        month: m1Num,
        label: MONTH_NAMES[m1Num] || `Month ${m1Num}`,
        isCurrent: true,
      },
    ];
  }, []);

  const history = chartData?.history || [];
  const m3Info = history.find((h) => h.year === recentMonths[0].year && h.month === recentMonths[0].month);
  const m2Info = history.find((h) => h.year === recentMonths[1].year && h.month === recentMonths[1].month);
  const m1Info = history.find((h) => h.year === recentMonths[2].year && h.month === recentMonths[2].month);

  const scoreM3 = m3Info?.trendScore;
  const scoreM2 = m2Info?.trendScore;
  const scoreM1 = m1Info?.trendScore ?? trendScore;

  const countM1 = m1Info?.paperCount;
  const countM2 = m2Info?.paperCount;

  return (
    <UiTooltipContent
      side="left"
      className="w-80 p-3.5 space-y-3 bg-card border border-border text-foreground shadow-2xl rounded-xl z-50"
    >
      <div className="flex items-center justify-between border-b border-border/50 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-brand">
          <Activity className="size-4" />
          <span>Keyword Growth Rate</span>
        </div>
        <span className="text-[11px] font-semibold text-foreground truncate max-w-[120px]" title={keyword}>
          "{keyword}"
        </span>
      </div>

      {isLoading ? (
        <div className="text-xs text-muted-foreground py-3 text-center animate-pulse">
          Loading growth metrics...
        </div>
      ) : (
        <div className="space-y-3">
          {/* Lịch sử 3 tháng gần nhất */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold text-muted-foreground flex justify-between">
              <span>Growth History (Last 3 Months):</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {recentMonths.map((m, idx) => {
                const score = idx === 0 ? scoreM3 : idx === 1 ? scoreM2 : scoreM1;
                const ptCount = idx === 0 ? m3Info?.paperCount : idx === 1 ? m2Info?.paperCount : countM1;

                return (
                  <div
                    key={m.label}
                    className={`p-2 rounded-lg border text-center transition-all ${
                      m.isCurrent
                        ? "bg-brand/10 border-brand/40 text-brand font-bold shadow-sm"
                        : "bg-secondary/40 border-border/40 text-muted-foreground"
                    }`}
                  >
                    <div className="text-[10px] opacity-80">{m.label}</div>
                    <div
                      className={`text-xs font-mono font-bold mt-0.5 ${
                        score === undefined
                          ? "text-muted-foreground"
                          : score >= 0
                          ? "text-success"
                          : "text-destructive"
                      }`}
                    >
                      {score !== undefined ? `${score > 0 ? "+" : ""}${score.toFixed(0)}%` : "N/A"}
                    </div>
                    {ptCount !== undefined && (
                      <div className="text-[9px] font-mono text-muted-foreground mt-0.5">
                        {ptCount} papers
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Công thức tính toán cho tháng hiện tại */}
          <div className="bg-secondary/50 p-2.5 rounded-lg border border-border/60 space-y-1.5">
            <div className="text-[11px] font-bold text-foreground flex items-center justify-between">
              <span>Formula ({recentMonths[2].label}):</span>
              <span className={`font-mono font-bold ${scoreM1 >= 0 ? "text-success" : "text-destructive"}`}>
                {scoreM1 > 0 ? "+" : ""}
                {scoreM1.toFixed(0)}%
              </span>
            </div>

            <div className="text-[10px] font-mono bg-background/90 p-2 rounded border border-border/40 text-foreground leading-relaxed space-y-1">
              <div>
                Formula: <span className="text-brand font-bold">((C - P) / P) × 100%</span>
              </div>

              {countM1 !== undefined && countM2 !== undefined ? (
                <>
                  <div className="text-muted-foreground">
                    Values: (({countM1} - {countM2}) / {countM2 > 0 ? countM2 : "1"}) × 100%
                  </div>
                  <div className="text-success font-bold">
                    = {countM2 === 0 ? "+100% (default when P = 0)" : `${scoreM1 > 0 ? "+" : ""}${scoreM1.toFixed(1)}%`}
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground">
                  = (({recentMonths[2].label} - {recentMonths[1].label}) / {recentMonths[1].label}) × 100%
                </div>
              )}
            </div>
            <p className="text-[9px] text-muted-foreground italic leading-tight">
              * C: Paper count for {recentMonths[2].label}, P: Paper count for {recentMonths[1].label}.
            </p>
          </div>
        </div>
      )}
    </UiTooltipContent>
  );
}

function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = isAdminUser(user);

  const { data: summary, isLoading, error } = useDashboardSummary();
  const [selectedKeywordId, setSelectedKeywordId] = useState<number | null>(null);
  const { data: chartData } = useKeywordChartData(selectedKeywordId);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const syncMonitor = summary?.syncMonitor;
    if (syncMonitor?.syncStatus === 'RUNNING' && syncMonitor.lastSyncTime) {
      const startTime = new Date(syncMonitor.lastSyncTime).getTime();
      const initialElapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedSeconds(initialElapsed > 0 ? initialElapsed : 0);

      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setElapsedSeconds(elapsed > 0 ? elapsed : 0);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [summary?.syncMonitor?.syncStatus, summary?.syncMonitor?.lastSyncTime]);

  const exportDataset = async () => {
    if (!user) {
      toast.error("Đăng nhập để xuất báo cáo CSV");
      return;
    }
    try {
      await reportsApi.downloadTopicTrendsCsv();
      toast.success("Đã tải topic-trends.csv");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Xuất CSV thất bại";
      toast.error(msg);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <PageHeader
          title="Dashboard Overview"
          subtitle="Scientific journal publication statistics and dynamically derived topic trends"
        />
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl border border-border bg-card/40 p-4 space-y-2">
                <div className="h-3 w-20 bg-muted rounded" />
                <div className="h-6 w-16 bg-muted rounded" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-72 rounded-xl border border-border bg-card/40 p-6 space-y-4">
              <div className="h-4 w-40 bg-muted rounded" />
              <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-24 rounded-lg bg-muted/40" />
                ))}
              </div>
            </div>
            <div className="h-72 rounded-xl border border-border bg-card/40 p-6 space-y-3">
              <div className="h-4 w-36 bg-muted rounded" />
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-8 rounded bg-muted/30" />
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !summary) {
    return (
      <AppLayout>
        <div className="p-8 text-sm text-destructive flex items-center gap-2">
          <AlertTriangle className="size-4" />
          Failed to load dashboard data. Please try again.
        </div>
      </AppLayout>
    );
  }

  const { kpi, trendingTopics, trendingKeywords, recentPublications, topJournals, syncMonitor } = summary;

  const defaultKeywordId = trendingKeywords.length > 0 ? trendingKeywords[0].keywordId : null;
  const activeKeywordId = selectedKeywordId || defaultKeywordId;

  // Prepare chart data format
  const chartPoints = chartData?.history.map(pt => ({
    name: formatMonthYear(pt.month, pt.year),
    "Paper Count": pt.paperCount,
    "Trend Score (%)": pt.trendScore
  })) || [];

  return (
    <UiTooltipProvider>
      <AppLayout>
      <PageHeader
        title="Dashboard Overview"
        subtitle="Scientific journal publication statistics and dynamically derived topic trends"
        action={
          <button
            type="button"
            onClick={exportDataset}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium text-brand-foreground glow-brand transition-transform hover:scale-[1.02]"
            style={{ background: "var(--gradient-brand)" }}
          >
            <Download className="size-4" /> Export Dataset
          </button>
        }
      />

      {/* SECTION 1 - KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
        <KpiCard
          label="Total Papers"
          value={kpi.totalPapers.toLocaleString()}
          delta={isAdminUser(user) && kpi.papersSynced && kpi.papersSynced > 0 ? `+${kpi.papersSynced.toLocaleString()}` : undefined}
          hint={isAdminUser(user) && kpi.papersSynced && kpi.papersSynced > 0 ? `Active papers (Previous: ${(kpi.totalPapers - kpi.papersSynced).toLocaleString()})` : "Active papers in system"}
        />
        <KpiCard label="Total Journals" value={kpi.totalJournals.toLocaleString()} hint="Indexed academic sources" />
        <KpiCard label="Total Keywords" value={kpi.totalKeywords.toLocaleString()} hint="Extracted research concepts" />

        <UiTooltip>
          <UiTooltipTrigger asChild>
            <div className="cursor-help">
              <KpiCard label="Trending Keywords" value={kpi.trendingKeywordsCount.toLocaleString()} hint="Keywords exceeding threshold" />
            </div>
          </UiTooltipTrigger>
          <UiTooltipContent side="top" className="max-w-xs p-3 space-y-1 bg-card border border-border text-foreground shadow-xl rounded-xl z-50">
            <div className="flex items-center gap-1.5 text-xs font-bold text-brand">
              <TrendingUp className="size-3.5" />
              <span>Trending Keywords</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Keywords with a trend score &gt; 15% for 3 consecutive months.
            </p>
            <div className="mt-2 text-[10px] border-t border-border/50 pt-1.5 space-y-1">
              <p className="font-semibold text-foreground flex items-center gap-1">
                <BookOpen className="size-3 text-brand shrink-0" />
                <span>Formula References:</span>
              </p>
              <div className="flex flex-col gap-1 pl-4">
                <a
                  href="https://www.wallstreetprep.com/knowledge/month-over-month-growth-rate/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-brand hover:underline font-medium text-[10px] transition-colors"
                >
                  <span>Month-over-Month Growth Rate (WallStreetPrep)</span>
                  <ExternalLink className="size-2.5 shrink-0" />
                </a>
              </div>
            </div>
          </UiTooltipContent>
        </UiTooltip>

        <UiTooltip>
          <UiTooltipTrigger asChild>
            <div className="cursor-help">
              <KpiCard label="Trending Topics" value={kpi.trendingTopicsCount.toLocaleString()} hint="Derived from Keyword.domain" />
            </div>
          </UiTooltipTrigger>
          <UiTooltipContent side="top" className="max-w-xs p-3 space-y-1 bg-card border border-border text-foreground shadow-xl rounded-xl z-50">
            <div className="flex items-center gap-1.5 text-xs font-bold text-brand">
              <Layers className="size-3.5" />
              <span>Trending Topics</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Topics based on the trending keywords belonging to each domain.
            </p>
          </UiTooltipContent>
        </UiTooltip>

        <KpiCard
          label="Last Sync"
          value={
            kpi.lastSyncTime
              ? new Date(kpi.lastSyncTime).toLocaleDateString("en-US", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
              : "N/A"
          }
          hint={
            kpi.lastSyncTime
              ? `At ${new Date(kpi.lastSyncTime).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}`
              : "No sync logs"
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* SECTION 2 - TOP 10 TRENDING TOPICS */}
        <Card className="lg:col-span-2" title="Top 10 Trending Topics">
          {trendingTopics.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No topic trend data available. Please run data sync or recalculate trends in the Admin panel.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trendingTopics.map((topic, i) => (
                <Link
                  key={topic.topicName}
                  to="/topics/domain/$domain"
                  params={{ domain: encodeURIComponent(topic.topicName) }}
                  className="flex flex-col justify-between p-4 rounded-xl border border-border hover:border-brand/40 hover:bg-brand/5 transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-mono text-muted-foreground">#{i + 1}</span>
                      <div className="text-sm font-bold text-foreground group-hover:text-brand truncate">
                        {topic.topicName}
                      </div>
                    </div>
                    <UiTooltip>
                      <UiTooltipTrigger asChild>
                        <span className={`text-xs font-bold font-mono cursor-help px-1.5 py-0.5 rounded bg-secondary/50 border border-border/50 ${topic.averageTrendScore >= 0 ? "text-success" : "text-destructive"}`}>
                          {topic.averageTrendScore > 0 ? "+" : ""}{topic.averageTrendScore.toFixed(1)}% avg
                        </span>
                      </UiTooltipTrigger>
                      <UiTooltipContent side="top" className="max-w-xs p-3 space-y-1 bg-card border border-border text-foreground shadow-xl rounded-xl z-50">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-brand">
                          <TrendingUp className="size-3.5" />
                          <span>Average Topic Growth</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          Average growth rate of <strong>{topic.trendingKeywordsCount} trending keywords</strong> under <span className="text-foreground font-semibold">{topic.topicName}</span> compared to previous month.
                        </p>
                      </UiTooltipContent>
                    </UiTooltip>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-muted-foreground mb-3 font-mono">
                    <span>{topic.trendingKeywordsCount} trending keywords</span>
                    <span className="flex items-center gap-1 text-brand/70"><ArrowUpRight className="size-3" /> View papers</span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {topic.topKeywords.map(kw => (
                      <UiTooltip key={kw.term}>
                        <UiTooltipTrigger asChild>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-mono cursor-help hover:bg-secondary/80">
                            {kw.term} ({kw.trendScore > 0 ? "+" : ""}{kw.trendScore.toFixed(0)}%)
                          </span>
                        </UiTooltipTrigger>
                        <UiTooltipContent side="top" className="p-2 text-[11px] bg-card border border-border text-foreground shadow-lg rounded-lg z-50">
                          Keyword <span className="font-bold text-brand">{kw.term}</span>: growth rate <span className="font-mono font-bold text-success">{kw.trendScore > 0 ? "+" : ""}{kw.trendScore.toFixed(0)}%</span> in published papers compared to previous month.
                        </UiTooltipContent>
                      </UiTooltip>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* SECTION 3 - TOP 10 TRENDING KEYWORDS */}
        <Card title="Top 10 Trending Keywords">
          {trendingKeywords.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No trending keywords data available.</p>
          ) : (
            <div className="space-y-3.5">
              {trendingKeywords.slice(0, 10).map((k) => (
                <Link
                  key={k.keyword}
                  to="/search"
                  search={{ topicId: k.keywordId }}
                  className="flex items-center justify-between text-sm p-1.5 -mx-1.5 rounded-lg hover:bg-brand/5 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[10px] font-mono text-muted-foreground w-4">
                      {String(k.rank).padStart(2, "0")}
                    </span>
                    <span className="text-foreground truncate font-medium group-hover:text-brand">{k.keyword}</span>
                    <span className="text-[9px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                      {k.domain}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[10px] text-muted-foreground font-mono">{k.paperCount} papers</span>
                    <UiTooltip>
                      <UiTooltipTrigger asChild>
                        <span className={`text-xs font-mono font-bold cursor-help px-1.5 py-0.5 rounded hover:bg-secondary/60 ${k.trendScore >= 0 ? "text-success" : "text-destructive"}`}>
                          {k.trendScore > 0 ? "+" : ""}{k.trendScore.toFixed(0)}%
                        </span>
                      </UiTooltipTrigger>
                      <TrendingKeywordTooltipContent
                        keywordId={k.keywordId}
                        keyword={k.keyword}
                        trendScore={k.trendScore}
                      />
                    </UiTooltip>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* SECTION 4 - KEYWORD TREND CHART */}
      <Card
        className="mb-6"
        title="Keyword Trend Chart"
        action={
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Select Keyword:</span>
            <select
              className="bg-background text-foreground border border-border rounded-lg text-xs px-2.5 py-1.5 focus:border-brand focus:outline-none max-w-[200px]"
              value={activeKeywordId || ""}
              onChange={(e) => setSelectedKeywordId(Number(e.target.value))}
            >
              {trendingKeywords.map(k => (
                <option key={k.keywordId} value={k.keywordId}>
                  {k.keyword}
                </option>
              ))}
            </select>
          </div>
        }
      >
        {!activeKeywordId ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Please select a keyword to view the chart.</p>
        ) : chartPoints.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">No historical trend data available for this keyword.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartPoints} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" stroke={chartTheme.axis} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis yAxisId="left" stroke={chartTheme.axis} fontSize={11} tickLine={false} axisLine={false} label={{ value: 'Paper Count', angle: -90, position: 'insideLeft', style: { fill: 'var(--muted-foreground)', fontSize: 10 } }} />
              <YAxis yAxisId="right" orientation="right" stroke={chartTheme.axis} fontSize={11} tickLine={false} axisLine={false} label={{ value: 'Trend Score (%)', angle: 90, position: 'insideRight', style: { fill: 'var(--muted-foreground)', fontSize: 10 } }} />
              <Tooltip
                contentStyle={tooltipStyle()}
                formatter={(value: any, name: any) => {
                  if (name === "Trend Score (%)") {
                    const numVal = typeof value === "number" ? value : Number(value);
                    const formattedScore = isNaN(numVal)
                      ? `${value}%`
                      : `${numVal > 0 ? "+" : ""}${Number.isInteger(numVal) ? numVal : numVal.toFixed(1)}%`;
                    return [formattedScore, name];
                  }
                  return [value, name];
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line yAxisId="left" type="monotone" dataKey="Paper Count" stroke="var(--chart-1)" strokeWidth={2.5} activeDot={{ r: 6 }} />
              <Line yAxisId="right" type="monotone" dataKey="Trend Score (%)" stroke="var(--chart-2)" strokeWidth={2} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* SECTION 5 - RECENT PUBLICATIONS */}
        <Card title="Recent Publications">
          {recentPublications.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No recent publications available.</p>
          ) : (
            <div className="space-y-4 h-[480px] overflow-y-auto pr-2 custom-scrollbar">
              {recentPublications.map((p) => (
                <Link
                  key={p.paperId}
                  to="/papers/$id"
                  params={{ id: String(p.paperId) }}
                  className="block p-3 rounded-lg border border-border bg-secondary/10 hover:bg-secondary/20 hover:border-brand/40 transition-all group"
                >
                  <div className="flex justify-between items-start gap-3 mb-1">
                    <h4 className="text-sm font-semibold text-foreground group-hover:text-brand line-clamp-2 leading-snug">
                      {p.title}
                    </h4>
                    <span className="text-[10px] font-mono font-bold text-brand bg-brand/10 px-2 py-0.5 rounded shrink-0">
                      {p.citationCount} citations
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-medium mb-2">
                    <span className="text-brand truncate max-w-[200px]">{p.journal}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      {p.publicationDate ? new Date(p.publicationDate).toLocaleDateString() : "Unknown"}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {p.topKeywords.slice(0, 4).map(k => (
                      <span key={k} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                        {k}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        {/* SECTION 6 - TOP JOURNALS */}
        <Card title="Top Journals by Volume">
          {topJournals.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No journal data available.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left table-fixed">
                <thead>
                  <tr className="border-b border-border text-[13px] font-bold uppercase tracking-wider text-muted-foreground">
                    <th className="pb-3 pr-4 font-semibold w-[45%]">Journal Name</th>
                    <th className="pb-3 px-4 font-semibold text-right w-[25%]">Total Papers</th>
                    <UiTooltip>
                      <UiTooltipTrigger asChild>
                        <th className="pb-3 pl-2 pr-4 font-semibold text-right w-[30%] cursor-help">
                          <span className="inline-flex items-center justify-end gap-1 hover:text-brand transition-colors text-right leading-tight">
                            <span>Citations per Publication</span>
                            <HelpCircle className="size-3.5 text-muted-foreground opacity-70 shrink-0" />
                          </span>
                        </th>
                      </UiTooltipTrigger>
                      <UiTooltipContent side="top" align="end" sideOffset={6} className="max-w-xs p-3.5 space-y-2 bg-card/95 backdrop-blur-md border border-border text-foreground shadow-2xl rounded-2xl z-50">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-brand">
                          <Calculator className="size-3.5" />
                          <span>Calculation Formula (CPP)</span>
                        </div>
                        <div className="text-xs font-mono font-bold text-brand bg-brand/10 p-2 rounded-xl border border-brand/20 text-center">
                          CPP = Total Citations ÷ Total Papers
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          Average citations per published paper for this journal (proxy bibliometric impact metric).
                        </p>
                        <div className="mt-2 text-[10px] border-t border-border/50 pt-1.5 space-y-1">
                          <p className="font-semibold text-foreground flex items-center gap-1">
                            <BookOpen className="size-3 text-brand shrink-0" />
                            <span>Formula References:</span>
                          </p>
                          <div className="flex flex-col gap-1 pl-4">
                            <a
                              href="https://link.springer.com/article/10.1007/s11192-007-1838-1"
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-brand hover:underline font-medium text-[10px] transition-colors"
                            >
                              <span>Bibliometric CPP Indicator (Springer)</span>
                              <ExternalLink className="size-2.5 shrink-0" />
                            </a>
                          </div>
                        </div>
                      </UiTooltipContent>
                    </UiTooltip>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {topJournals.map((j) => (
                    <tr
                      key={j.journalId}
                      className="hover:bg-brand/5 transition-colors group"
                    >
                      <td
                        className="py-3 pr-4 font-medium text-foreground truncate max-w-[220px]"
                        title={j.journalName}
                      >
                        {j.journalName}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-brand font-bold">{j.totalPapers.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold">
                        {j.impactFactor != null && j.impactFactor > 0 ? j.impactFactor.toFixed(3) : "0"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* SECTION 7 - ADMIN SYNC MONITORING */}
      {isAdmin && syncMonitor && (
        <Card title="Admin Sync Monitoring">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-4 rounded-xl border border-border bg-secondary/5">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Last Sync Started</p>
              <p className="text-sm font-bold font-mono text-foreground truncate">
                {syncMonitor.lastSyncTime ? new Date(syncMonitor.lastSyncTime).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "N/A"}
              </p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-secondary/5">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Status</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold mt-0.5 ${syncMonitor.syncStatus === 'SUCCESS'
                  ? 'bg-success/10 text-success'
                  : syncMonitor.syncStatus === 'RUNNING'
                    ? 'bg-blue-500/10 text-blue-400 animate-pulse'
                    : 'bg-destructive/10 text-destructive'
                }`}>
                {syncMonitor.syncStatus}
              </span>
            </div>
            <div className="p-4 rounded-xl border border-border bg-secondary/5">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Papers Before Sync</p>
              <p className="text-base font-bold font-mono text-foreground">
                {Math.max(0, kpi.totalPapers - (syncMonitor.papersSynced || 0)).toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-secondary/5">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Papers Synced</p>
              <p className="text-base font-bold font-mono text-brand">+{syncMonitor.papersSynced.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-secondary/5">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Duration</p>
              <p className="text-base font-bold font-mono text-foreground">
                {syncMonitor.syncStatus === 'RUNNING'
                  ? `${elapsedSeconds}s`
                  : `${syncMonitor.durationSeconds}s`}
              </p>
            </div>
          </div>
          {syncMonitor.errorMessage && (
            <div className="mt-4 p-3 rounded-lg border border-destructive/20 bg-destructive/5 text-xs text-destructive font-mono">
              <strong>Error Message:</strong> {syncMonitor.errorMessage}
            </div>
          )}
        </Card>
      )}
    </AppLayout>
  </UiTooltipProvider>
);
}