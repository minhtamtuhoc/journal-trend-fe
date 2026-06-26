import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Card, KpiCard } from "@/components/Card";
import { useState } from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { reportsApi } from "@/services/http/reports-api";
import { useAuth, isAdminUser } from "@/auth";
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

function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = isAdminUser(user);
  
  const { data: summary, isLoading, error } = useDashboardSummary();
  const [selectedKeywordId, setSelectedKeywordId] = useState<number | null>(null);
  const { data: chartData } = useKeywordChartData(selectedKeywordId);

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
        <div className="p-8 text-sm text-muted-foreground animate-pulse">Loading dashboard statistics...</div>
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
        <KpiCard label="Total Papers" value={kpi.totalPapers.toLocaleString()} hint="Active papers in system" />
        <KpiCard label="Total Journals" value={kpi.totalJournals.toLocaleString()} hint="Indexed academic sources" />
        <KpiCard label="Total Keywords" value={kpi.totalKeywords.toLocaleString()} hint="Extracted research concepts" />
        <KpiCard label="Trending Keywords" value={kpi.trendingKeywordsCount.toLocaleString()} hint="Keywords exceeding threshold" />
        <KpiCard label="Trending Topics" value={kpi.trendingTopicsCount.toLocaleString()} hint="Derived from Keyword.domain" />
        <KpiCard 
          label="Last Sync Status" 
          value={
            kpi.lastSyncStatus === "SUCCESS" ? (
              <span className="text-success">{kpi.lastSyncStatus}</span>
            ) : kpi.lastSyncStatus === "RUNNING" ? (
              <span className="text-blue-400 animate-pulse">{kpi.lastSyncStatus}</span>
            ) : (
              <span className="text-destructive">{kpi.lastSyncStatus}</span>
            )
          } 
          hint={kpi.lastSyncTime ? `At ${new Date(kpi.lastSyncTime).toLocaleDateString()}` : "No sync logs"} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* SECTION 2 - TOP 10 TRENDING TOPICS */}
        <Card className="lg:col-span-2" title="Top 10 Trending Topics">
          {trendingTopics.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              Chưa có dữ liệu topic trend. Hãy chạy đồng bộ dữ liệu hoặc recalculate trend trong trang Admin.
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
                    <span className={`text-xs font-bold font-mono ${topic.averageTrendScore >= 0 ? "text-success" : "text-destructive"}`}>
                      {topic.averageTrendScore > 0 ? "+" : ""}{topic.averageTrendScore.toFixed(1)}% avg
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground mb-3 font-mono">
                    <span>{topic.trendingKeywordsCount} trending keywords</span>
                    <span className="flex items-center gap-1 text-brand/70"><ArrowUpRight className="size-3" /> View papers</span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {topic.topKeywords.map(kw => (
                      <span key={kw.term} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-mono">
                        {kw.term} ({kw.trendScore > 0 ? "+" : ""}{kw.trendScore.toFixed(0)}%)
                      </span>
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
            <p className="text-sm text-muted-foreground py-4">Chưa có dữ liệu từ khóa thịnh hành.</p>
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
                    <span className={`text-xs font-mono font-bold ${k.trendScore >= 0 ? "text-success" : "text-destructive"}`}>
                      {k.trendScore > 0 ? "+" : ""}{k.trendScore.toFixed(0)}%
                    </span>
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
                <option key={(k as any).keywordId || k.keyword} value={(k as any).keywordId}>
                  {k.keyword}
                </option>
              ))}
            </select>
          </div>
        }
      >
        {!activeKeywordId ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Vui lòng chọn từ khóa để xem biểu đồ.</p>
        ) : chartPoints.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">Không có dữ liệu xu hướng lịch sử cho từ khóa này.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartPoints} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" stroke={chartTheme.axis} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis yAxisId="left" stroke={chartTheme.axis} fontSize={11} tickLine={false} axisLine={false} label={{ value: 'Paper Count', angle: -90, position: 'insideLeft', style: { fill: 'var(--muted-foreground)', fontSize: 10 } }} />
              <YAxis yAxisId="right" orientation="right" stroke={chartTheme.axis} fontSize={11} tickLine={false} axisLine={false} label={{ value: 'Trend Score (%)', angle: 90, position: 'insideRight', style: { fill: 'var(--muted-foreground)', fontSize: 10 } }} />
              <Tooltip contentStyle={tooltipStyle()} />
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
            <p className="text-sm text-muted-foreground py-4">Chưa có bài báo nào được xuất bản.</p>
          ) : (
            <div className="space-y-4">
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
            <p className="text-sm text-muted-foreground py-4">Chưa có dữ liệu tạp chí.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    <th className="pb-3 font-semibold">Journal Name</th>
                    <th className="pb-3 font-semibold text-right">Total Papers</th>
                    <th className="pb-3 font-semibold text-right">Impact Factor</th>
                    <th className="pb-3 font-semibold">Domain</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {topJournals.map((j) => (
                    <tr
                      key={j.journalId}
                      className="hover:bg-brand/5 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 font-medium text-foreground truncate max-w-[220px]">
                        <Link
                          to="/search"
                          search={{ q: j.journalName }}
                          className="group-hover:text-brand transition-colors flex items-center gap-1"
                        >
                          {j.journalName}
                          <ArrowUpRight className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      </td>
                      <td className="py-3 text-right font-mono text-brand font-bold">{j.totalPapers.toLocaleString()}</td>
                      <td className="py-3 text-right font-mono font-semibold">
                        {j.impactFactor ? j.impactFactor.toFixed(3) : "—"}
                      </td>
                      <td className="py-3 text-muted-foreground text-xs">{j.domain}</td>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-4 rounded-xl border border-border bg-secondary/5">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Last Sync Started</p>
              <p className="text-base font-bold font-mono text-foreground">
                {syncMonitor.lastSyncTime ? new Date(syncMonitor.lastSyncTime).toLocaleString() : "N/A"}
              </p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-secondary/5">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Status</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                syncMonitor.syncStatus === 'SUCCESS'
                  ? 'bg-success/10 text-success'
                  : syncMonitor.syncStatus === 'RUNNING'
                    ? 'bg-blue-500/10 text-blue-400 animate-pulse'
                    : 'bg-destructive/10 text-destructive'
              }`}>
                {syncMonitor.syncStatus}
              </span>
            </div>
            <div className="p-4 rounded-xl border border-border bg-secondary/5">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Papers Synced</p>
              <p className="text-base font-bold font-mono text-brand">{syncMonitor.papersSynced}</p>
            </div>
            <div className="p-4 rounded-xl border border-border bg-secondary/5">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Duration</p>
              <p className="text-base font-bold font-mono text-foreground">{syncMonitor.durationSeconds} seconds</p>
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
  );
}