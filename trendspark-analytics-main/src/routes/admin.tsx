import { createFileRoute } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Card } from "@/components/Card";
import { useAdminOverview } from "@/hooks/data/use-admin";
import { useState } from "react";
import { RefreshCw, CheckCircle2, XCircle, AlertTriangle, Activity } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin")({ component: AdminPage });

function AdminPage() {
  const { user } = useAuth();
  const { data: admin } = useAdminOverview();
  const { auditLogs: AUDIT_LOGS, pendingReview: PENDING_REVIEW } = admin;
  const [syncing, setSyncing] = useState(false);

  if (!user) return null;
  if (user.role !== "Admin") {
    return (
      <AppLayout>
        <Card>
          <div className="text-center py-12">
            <AlertTriangle className="size-8 mx-auto text-warning mb-2" />
            <h2 className="font-semibold text-lg">Admin access required</h2>
            <p className="text-muted-foreground text-sm mt-1">Sign in with admin@helix.io to view this page.</p>
          </div>
        </Card>
      </AppLayout>
    );
  }

  const runSync = async () => {
    setSyncing(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSyncing(false);
    toast.success("Manual sync complete · 12,482 records");
  };

  return (
    <AppLayout>
      <PageHeader
        title="Admin Panel"
        subtitle="Synchronization, moderation, and system monitoring"
        action={
          <button onClick={runSync} disabled={syncing} className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold text-brand-foreground glow-brand disabled:opacity-60" style={{ background: "var(--gradient-brand)" }}>
            <RefreshCw className={`size-4 ${syncing ? "animate-spin" : ""}`} /> {syncing ? "Syncing..." : "Run Manual Sync"}
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          ["Sync Health", "99.9%", "ok"],
          ["Last Sync", "02:00", "ok"],
          ["Pending Review", String(PENDING_REVIEW.length), "warn"],
          ["Cron Failures (7d)", "1", "warn"],
        ].map(([l, v, s]) => (
          <div key={l} className="glass rounded-2xl p-5">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">{l}</div>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold font-mono">{v}</span>
              <span className={`size-2 rounded-full ${s === "ok" ? "bg-success" : "bg-warning"} animate-pulse`} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2" title="Pending Review">
          <div className="space-y-3">
            {PENDING_REVIEW.map((p) => (
              <div key={p.id} className="flex items-start justify-between gap-4 p-3 rounded-lg border border-border bg-secondary/30">
                <div className="min-w-0">
                  <div className="text-[10px] font-mono text-muted-foreground uppercase mb-1 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-brand/10 text-brand">{p.source}</span>
                    {p.journal}
                    {p.status === "flagged" && <span className="text-warning flex items-center gap-1"><AlertTriangle className="size-3" /> Flagged</span>}
                  </div>
                  <div className="text-sm font-semibold text-foreground">{p.title}</div>
                  <div className="text-[10px] font-mono text-muted-foreground mt-1">DOI: {p.doi}</div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => toast.success("Approved")} className="p-1.5 rounded-md border border-border hover:border-success/40 hover:text-success transition-colors"><CheckCircle2 className="size-3.5" /></button>
                  <button onClick={() => toast.success("Rejected")} className="p-1.5 rounded-md border border-border hover:border-destructive/40 hover:text-destructive transition-colors"><XCircle className="size-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="API Status">
          <div className="space-y-3">
            {[["Scopus", "ok"], ["CrossRef", "ok"], ["IEEE Xplore", "warn"]].map(([src, st]) => (
              <div key={src} className="flex items-center justify-between text-sm">
                <span>{src}</span>
                <span className={`flex items-center gap-2 text-xs font-mono ${st === "ok" ? "text-success" : "text-warning"}`}>
                  <span className={`size-1.5 rounded-full ${st === "ok" ? "bg-success" : "bg-warning"} animate-pulse`} />
                  {st === "ok" ? "Online" : "Degraded"}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="Audit Logs" action={<span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-1"><Activity className="size-3" /> LIVE</span>}>
        <div className="divide-y divide-border -mx-6">
          {AUDIT_LOGS.map((l) => (
            <div key={l.id} className="px-6 py-3 flex items-center gap-4 text-sm">
              <span className={`size-1.5 rounded-full ${l.status === "ok" ? "bg-success" : "bg-warning"}`} />
              <span className="font-mono text-[11px] text-muted-foreground w-24 shrink-0">{l.time}</span>
              <span className="font-mono text-[11px] text-brand w-40 shrink-0 truncate">{l.actor}</span>
              <span className="flex-1 text-foreground truncate">{l.action}</span>
              <span className="text-xs text-muted-foreground truncate">{l.target}</span>
            </div>
          ))}
        </div>
      </Card>
    </AppLayout>
  );
}