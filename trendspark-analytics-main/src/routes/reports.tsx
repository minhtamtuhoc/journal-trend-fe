import { createFileRoute } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Card } from "@/components/Card";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAnalyticsSnapshot } from "@/hooks/data/use-analytics";
import { FileBarChart, Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reports")({ component: ReportsPage });

const reports = [
  { id: "r1", name: "Monthly Trend Digest", desc: "Top 50 keywords, growth %, citation deltas", updated: "2h ago" },
  { id: "r2", name: "Author Velocity Report", desc: "Most active researchers and h-index changes", updated: "1d ago" },
  { id: "r3", name: "Journal Impact Snapshot", desc: "IF rankings, submission-to-publication velocity", updated: "3d ago" },
  { id: "r4", name: "Field Saturation Map", desc: "Which research areas are saturating vs accelerating", updated: "1w ago" },
];

function ReportsPage() {
  const { data: analytics } = useAnalyticsSnapshot();
  const PUBLICATION_VELOCITY = analytics.publicationVelocity;

  return (
    <AppLayout>
      <PageHeader title="Reports" subtitle="Generated insights, ready to share or export" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2" title="Publication Volume by Month">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={PUBLICATION_VELOCITY}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="papers" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card title="Quick Stats">
          <div className="space-y-4">
            {[["Avg monthly growth", "+9.4%"], ["Top growing field", "AI/ML"], ["Most active journal", "Nature Comms"], ["Generated reports", "128"]].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-mono text-foreground">{v}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((r) => (
          <Card key={r.id} className="flex items-start justify-between gap-4 hover:border-brand/40 transition-colors">
            <div className="flex gap-3 min-w-0">
              <div className="size-10 rounded-lg bg-brand/10 border border-brand/30 flex items-center justify-center text-brand shrink-0">
                <FileBarChart className="size-4" />
              </div>
              <div>
                <div className="font-semibold text-sm">{r.name}</div>
                <div className="text-xs text-muted-foreground mt-1">{r.desc}</div>
                <div className="text-[10px] font-mono text-muted-foreground mt-2">Updated {r.updated}</div>
              </div>
            </div>
            <button onClick={() => toast.success("Report downloaded")} className="p-2 rounded-md border border-border hover:border-brand/40 hover:text-brand transition-colors shrink-0">
              <Download className="size-3.5" />
            </button>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}