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
import { Download, ArrowUpRight, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { SaveToCollectionButton } from "@/components/SaveToCollectionButton";

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
  const { data: analytics } = useAnalyticsSnapshot();
  const { data: papers = [] } = usePapers();
  const {
    kpis: KPIS,
    publicationVelocity: PUBLICATION_VELOCITY,
    categoryDistribution: CATEGORY_DISTRIBUTION,
    radarFields: RADAR_FIELDS,
    trendingKeywords: TRENDING_KEYWORDS,
  } = analytics;

  return (
    <AppLayout>
      <PageHeader
        title="Analytics Overview"
        subtitle="Simulated global research trends · last updated 2 min ago"
        action={
          <button onClick={() => toast.success("CSV export queued")} className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium text-brand-foreground glow-brand transition-transform hover:scale-[1.02]" style={{ background: "var(--gradient-brand)" }}>
            <Download className="size-4" /> Export Dataset
          </button>
        }
      />

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Trend Score" value={KPIS.trendScore.toFixed(1)} delta={`+${KPIS.trendScoreDelta}%`} accent />
        <KpiCard label="Active Keywords" value={KPIS.activeKeywords.toLocaleString()} hint="Across 12 major journals" />
        <KpiCard label="Citation Volume" value={KPIS.citationVolume} hint="Growth spike detected" delta="+12.4%" />
        <KpiCard label="Sync Health" value={`${KPIS.syncHealth}%`} hint="Scopus / CrossRef / IEEE" />
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