import { createFileRoute } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Card } from "@/components/Card";
import { Heatmap } from "@/components/Heatmap";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAnalyticsSnapshot } from "@/hooks/data/use-analytics";
import { useSavedItems } from "@/hooks/use-saved-items";
import { useFollowedTopics, useFollowTopic, useUnfollowTopic } from "@/hooks/data/use-follows";
import { Flame, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/trends")({ component: TrendsPage });

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--popover-foreground)",
  fontSize: 12,
} as const;

function TrendsPage() {
  const { data: analytics } = useAnalyticsSnapshot();
  const { isAuthorFollowed, toggleAuthorFollow } = useSavedItems();
  const { data: followedTopics = [] } = useFollowedTopics();
  const followTopic = useFollowTopic();
  const unfollowTopic = useUnfollowTopic();

  const isTopicFollowed = (topicId: string) => followedTopics.some((t) => t.id === topicId);

  // const { publicationVelocity: PUBLICATION_VELOCITY, radarFields: RADAR_FIELDS, trendingKeywords: TRENDING_KEYWORDS, trendingAuthors: TRENDING_AUTHORS } =
  //   analytics;
  // const trending = TRENDING_KEYWORDS.filter((k) => k.trendScore >= 15 && k.monthsTrending >= 3);
  // Sửa từ dòng 25 - 28 thành:
  const {
    publicationVelocity: PUBLICATION_VELOCITY = [],
    radarFields: RADAR_FIELDS = [],
    trendingKeywords: TRENDING_KEYWORDS = [],
    trendingAuthors: TRENDING_AUTHORS = [],
  } = analytics ?? {};

  const trending = TRENDING_KEYWORDS.filter((k) => k.trendScore >= 15 && k.monthsTrending >= 3);
  return (
    <AppLayout>
      <PageHeader
        title="Trend Analytics"
        subtitle="Trend score = ((current − previous) / previous) × 100. Trending when ≥15% for 3 consecutive months."
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        <KPI
          label="Trending Keywords"
          value={trending.length.toString()}
          icon={<Flame className="size-4" />}
        />
        <KPI label="Trending Authors" value="142" icon={<TrendingUp className="size-4" />} />
        <KPI label="Avg Trend Score" value="+21.4%" />
        <KPI label="Peak Velocity" value="6,108/mo" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2" title="Citation Growth vs Publication Volume">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={PUBLICATION_VELOCITY}>
              <defs>
                <linearGradient id="ga" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="var(--muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area
                type="monotone"
                dataKey="citations"
                stroke="var(--chart-1)"
                fill="url(#ga)"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="papers"
                stroke="var(--chart-2)"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Domain Radar">
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={RADAR_FIELDS}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="field" stroke="var(--muted-foreground)" fontSize={11} />
              <Radar
                dataKey="current"
                stroke="var(--chart-1)"
                fill="var(--chart-1)"
                fillOpacity={0.4}
              />
              <Radar
                dataKey="previous"
                stroke="var(--chart-2)"
                fill="var(--chart-2)"
                fillOpacity={0.15}
              />
              <Tooltip contentStyle={tooltipStyle} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="Trend Score Ranking">
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
                    <td className="py-3 text-foreground font-medium">{k.term}</td>
                    <td className="py-3 text-right font-mono text-muted-foreground">{k.count}</td>
                    <td
                      className={`py-3 text-right font-mono ${k.trendScore >= 15 ? "text-success" : "text-muted-foreground"}`}
                    >
                      +{k.trendScore.toFixed(1)}%
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
                        className={`text-[10px] px-2.5 py-0.5 rounded-md border transition-all cursor-pointer ${
                          followed
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
              const followed = isAuthorFollowed(a.name);
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
                    <div className="text-sm font-medium text-foreground truncate">{a.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {a.affiliation} · h-index {a.hIndex}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-mono text-success">
                      +{a.trendScore.toFixed(1)}%
                    </span>
                    <button
                      onClick={() => {
                        const added = toggleAuthorFollow({ id: a.id, name: a.name });
                        if (added) {
                          toast.success(`Following ${a.name}`);
                        } else {
                          toast.info(`Unfollowed ${a.name}`);
                        }
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                        followed
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

      <Card title="Activity Heatmap (12 weeks)">
        <Heatmap />
      </Card>
    </AppLayout>
  );
}

function KPI({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        {icon && <span className="text-brand">{icon}</span>}
      </div>
      <p className="text-2xl font-bold font-mono text-foreground">{value}</p>
    </div>
  );
}