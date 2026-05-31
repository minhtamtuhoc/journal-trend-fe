import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Card, KpiCard } from "@/components/Card";
import { Heatmap } from "@/components/Heatmap";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAnalyticsSnapshot } from "@/hooks/data/use-analytics";
import { usePapers } from "@/hooks/data/use-papers";
import { Download, ArrowUpRight, TrendingUp, Hash, User, FileText, Bookmark } from "lucide-react";
import type { DashboardHighlights, HighlightCard, TopicTrend } from "@/types/domain";
import { toast } from "sonner";
import { SaveToCollectionButton } from "@/components/SaveToCollectionButton";
import { reportsApi } from "@/services/http/reports-api";
import { useAuth } from "@/auth";
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

function DashboardPage() {
  const { user } = useAuth();
  const { data: analytics, isLoading } = useAnalyticsSnapshot();
  const { data: papers = [] } = usePapers();

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
        <div className="p-8 text-sm text-muted-foreground">Loading analytics…</div>
      </AppLayout>
    );
  }

  const {
    kpis: KPIS,
    publicationVelocity: PUBLICATION_VELOCITY,
    categoryDistribution: CATEGORY_DISTRIBUTION,
    radarFields: RADAR_FIELDS,
    trendingKeywords: TRENDING_KEYWORDS,
    trendingTopics = [],
    highlights,
  } = analytics;

  const TOPIC_TRENDS: TopicTrend[] = trendingTopics ?? [];
  const HIGHLIGHTS: DashboardHighlights = highlights!;

  return (
    <AppLayout>
      <PageHeader
        title="Analytics Overview"
        subtitle="Topic trends from OpenAlex sync · click a topic to view papers"
        action={
          <button type="button" onClick={exportDataset} className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium text-brand-foreground glow-brand transition-transform hover:scale-[1.02]" style={{ background: "var(--gradient-brand)" }}>
            <Download className="size-4" /> Export Dataset
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <HighlightTile card={HIGHLIGHTS.topKeyword} icon={<Hash className="size-4" />} label="Top keyword" linkTo="topic" />
        <HighlightTile card={HIGHLIGHTS.topAuthor} icon={<User className="size-4" />} label="Top author" linkTo="author" />
        <HighlightTile card={HIGHLIGHTS.topPaper} icon={<FileText className="size-4" />} label="Top paper" linkTo="paper" />
        <HighlightTile card={HIGHLIGHTS.topFollowedTopic} icon={<Bookmark className="size-4" />} label="Most followed topic" linkTo="topic" />
      </div>

      <Card className="mb-6" title="Top 10 Topic Trends" action={<Link to="/trends" className="text-xs text-brand hover:underline">Trend explorer</Link>}>
        {TOPIC_TRENDS.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            Chưa có dữ liệu topic trend. Đăng nhập Admin → <strong>Run Manual Sync</strong>, sau đó tải lại trang.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {TOPIC_TRENDS.slice(0, 10).map((t) => (
              <Link
                key={t.id}
                to="/topics/$topicId"
                params={{ topicId: t.id }}
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-border hover:border-brand/40 hover:bg-brand/5 transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[10px] font-mono text-muted-foreground w-5">{String(t.rank).padStart(2, "0")}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground group-hover:text-brand truncate">{t.name}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{t.paperCount} papers</div>
                  </div>
                </div>
                <span className={`text-xs font-mono shrink-0 ${t.trendScore >= 15 ? "text-success" : "text-muted-foreground"}`}>
                  {t.trendScore >= 0 ? "+" : ""}{t.trendScore.toFixed(1)}%
                </span>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Trend Score" value={KPIS.trendScore.toFixed(1)} delta={`+${KPIS.trendScoreDelta}%`} accent />
        <KpiCard label="Active Keywords" value={KPIS.activeKeywords.toLocaleString()} hint="Across 12 major journals" />
        <KpiCard label="Citation Volume" value={KPIS.citationVolume} hint="Growth spike detected" delta="+12.4%" />
        <KpiCard label="Sync Health" value={`${KPIS.syncHealth}%`} hint="OpenAlex · Crossref · Semantic Scholar" />
      </div>

      {/* Main charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2" title="Publication Velocity" action={<span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">MONTHLY · 2024</span>}>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={PUBLICATION_VELOCITY}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" stroke={chartTheme.axis} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke={chartTheme.axis} fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle()} />
              <Area type="monotone" dataKey="citations" stroke="var(--chart-2)" fill="url(#g2)" strokeWidth={2} />
              <Area type="monotone" dataKey="papers" stroke="var(--chart-1)" fill="url(#g1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Top Trending Keywords">
          <div className="space-y-3">
            {TRENDING_KEYWORDS.slice(0, 6).map((k, i) => (
              <div key={k.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[10px] font-mono text-muted-foreground w-4">{String(i + 1).padStart(2, "0")}</span>
                  <span className="size-2 rounded-full" style={{ background: `var(--chart-${(i % 5) + 1})` }} />
                  <span className="text-foreground truncate">{k.term}</span>
                </div>
                <span className={`text-xs font-mono ${k.trendScore >= 15 ? "text-success" : "text-muted-foreground"}`}>
                  {k.trendScore >= 0 ? "+" : ""}{k.trendScore.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
          <Link to="/trends" className="mt-6 inline-flex items-center gap-1 text-xs text-brand hover:underline">
            View trend explorer <ArrowUpRight className="size-3" />
          </Link>
        </Card>
      </div>

      {/* Secondary chart row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card title="Domain Distribution">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={CATEGORY_DISTRIBUTION} dataKey="value" innerRadius={55} outerRadius={90} paddingAngle={3}>
                {CATEGORY_DISTRIBUTION.map((d, i) => (
                  <Cell key={i} fill={d.fill} stroke="var(--background)" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle()} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: "var(--muted-foreground)" }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Field Velocity (Radar)">
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={RADAR_FIELDS}>
              <PolarGrid stroke={chartTheme.grid} />
              <PolarAngleAxis dataKey="field" stroke={chartTheme.axis} fontSize={11} />
              <PolarRadiusAxis stroke="transparent" tick={false} />
              <Radar name="Current" dataKey="current" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.35} />
              <Radar name="Previous" dataKey="previous" stroke="var(--chart-2)" fill="var(--chart-2)" fillOpacity={0.15} />
              <Tooltip contentStyle={tooltipStyle()} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Citation Growth (12mo)">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={PUBLICATION_VELOCITY}>
              <CartesianGrid stroke={chartTheme.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" stroke={chartTheme.axis} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke={chartTheme.axis} fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle()} />
              <Line type="monotone" dataKey="citations" stroke="var(--chart-2)" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Heatmap + feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2" title="Submission Heatmap (12w)" action={<span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">UTC</span>}>
          <Heatmap />
        </Card>

        <Card title="Signal Feed" action={<span className="inline-flex items-center gap-1 text-[10px] font-mono text-success uppercase tracking-widest"><span className="size-1.5 rounded-full bg-success animate-pulse" /> LIVE</span>}>
          <div className="space-y-4">
            {papers.slice(0, 4).map((p) => (
              <div key={p.id} className="group rounded-lg hover:bg-secondary/40 transition-colors p-2 -m-2">
                <div className="flex items-start justify-between gap-3">
                  <Link to="/papers/$id" params={{ id: p.id }} className="block min-w-0 flex-1">
                    <div className="text-[10px] font-mono text-muted-foreground mb-1 flex items-center justify-between">
                      <span>{p.journal}</span>
                      <span className="flex items-center gap-1 text-success"><TrendingUp className="size-2.5" /> {p.trendScore.toFixed(1)}</span>
                    </div>
                    <div className="text-xs font-medium leading-snug text-foreground group-hover:text-brand transition-colors">{p.title}</div>
                    <div className="text-[10px] text-muted-foreground mt-1 font-mono truncate">DOI: {p.doi}</div>
                  </Link>
                  <div className="shrink-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <SaveToCollectionButton paperId={p.id} paperTitle={p.title} />
                    <Link to="/papers/$id" params={{ id: p.id }} className="p-1.5 rounded-md border border-border hover:border-brand/40 hover:text-brand transition-colors">
                      <ArrowUpRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}

function HighlightTile({
  card,
  icon,
  label,
  linkTo,
}: {
  card: HighlightCard;
  icon: React.ReactNode;
  label: string;
  linkTo: "topic" | "paper" | "search" | "author";
}) {
  const inner = (
    <div className="glass rounded-2xl p-4 h-full border border-border hover:border-brand/30 transition-colors">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
        {icon}
        {label}
      </div>
      <div className="text-sm font-semibold text-foreground line-clamp-2">{card.title || "—"}</div>
      <div className="text-[10px] text-muted-foreground mt-1 truncate">{card.subtitle}</div>
      {card.metricLabel ? (
        <div className="text-lg font-bold font-mono text-brand mt-2">
          {card.metricLabel === "trend %"
            ? `${card.metric >= 0 ? "+" : ""}${card.metric.toFixed(1)}%`
            : card.metric.toLocaleString()}
          <span className="text-[10px] text-muted-foreground font-sans ml-1">{card.metricLabel}</span>
        </div>
      ) : null}
    </div>
  );

  if (!card.id) return inner;

  if (linkTo === "topic") {
    return (
      <Link to="/topics/$topicId" params={{ topicId: card.id }} className="block">
        {inner}
      </Link>
    );
  }
  if (linkTo === "paper") {
    return (
      <Link to="/papers/$id" params={{ id: card.id }} className="block">
        {inner}
      </Link>
    );
  }
  if (linkTo === "author") {
    return (
      <Link to="/authors/$authorId" params={{ authorId: card.id }} className="block">
        {inner}
      </Link>
    );
  }
  return (
    <Link to="/search" search={{ q: card.title }} className="block">
      {inner}
    </Link>
  );
}