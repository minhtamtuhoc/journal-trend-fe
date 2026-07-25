import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Card } from "@/components/Card";
import { useAdminOverview, useAdminSources, useUpdateAdminSource, useApprovePaper, useDeletePaper, usePendingReview } from "@/hooks/data/use-admin";
import { useState, useEffect } from "react";
import { RefreshCw, CheckCircle2, XCircle, AlertTriangle, Activity, Sparkles, Cpu, Zap, Sliders, Check } from "lucide-react";
import { toast } from "sonner";
import { useAuth, isAdminUser } from "@/auth";
import { useQueryClient } from "@tanstack/react-query";
import { getServices, queryKeys } from "@/services";
import { ApiError } from "@/api/errors";
import { useAiCollectionAnalysisLimit, useUpdateAiCollectionAnalysisLimit } from "@/hooks/data/use-ai-limit";

export const Route = createFileRoute("/admin")({ component: AdminPage });

function AdminPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isExactAdmin = pathname === "/admin" || pathname === "/admin/";

  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: admin, isLoading: isLoadingAdmin, isError: isAdminError, refetch: refetchAdmin } = useAdminOverview();
  const { data: sources = [] } = useAdminSources();
  const updateSource = useUpdateAdminSource();
  const approvePaper = useApprovePaper();
  const deletePaper = useDeletePaper();
  const { data: PENDING_REVIEW = [] } = usePendingReview();
  const [syncing, setSyncing] = useState(false);

  if (!isExactAdmin) {
    return <Outlet />;
  }

  const AUDIT_LOGS = admin?.auditLogs ?? [];

  if (!user) return null;
  if (!isAdminUser(user)) {
    return (
      <AppLayout>
        <Card>
          <div className="text-center py-12">
            <AlertTriangle className="size-8 mx-auto text-warning mb-2" />
            <h2 className="font-semibold text-lg">Admin access required</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Sign in with admin@helix.io to view this page.
            </p>
          </div>
        </Card>
      </AppLayout>
    );
  }

  const invalidateAfterSync = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.overview }),
      queryClient.invalidateQueries({ queryKey: queryKeys.papers.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.analytics.snapshot }),
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.collections.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.summary }),
    ]);

  const pollSyncUntilDone = async () => {
    const admin = getServices().admin;
    for (let i = 0; i < 90; i++) {
      await new Promise((r) => setTimeout(r, 4000));
      const status = await admin.getSyncStatus();
      if (status.status === "RUNNING") {
        continue;
      }
      await invalidateAfterSync();
      if (status.status === "SUCCESS") {
        toast.success(status.message || `Sync completed · ${status.papersFetched} papers`);
      } else {
        toast.error(status.message || "Sync failed — check Audit Logs");
      }
      return;
    }
    toast.warning("Sync is still running. Check progress in Audit Logs.");
    await invalidateAfterSync();
  };

  const resetStaleSync = async () => {
    try {
      const result = await getServices().admin.resetStaleSync();
      await invalidateAfterSync();
      toast.success(result.message || "Stale sync reset — you can run sync again");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to reset sync";
      toast.error(msg);
    }
  };

  const runSync = async () => {
    setSyncing(true);
    try {
      const result = await getServices().admin.triggerSync();
      if (result.status === "RUNNING") {
        toast.info(result.message || "Syncing metadata from OpenAlex...");
        await pollSyncUntilDone();
      } else if (result.status === "FAILED") {
        await invalidateAfterSync();
        toast.error(result.message || "Sync failed — try resetting stale sync and run again");
      } else {
        await invalidateAfterSync();
        if (result.status === "SUCCESS") {
          toast.success(result.message || `Sync completed · ${result.papersFetched} papers`);
        } else {
          toast.info(result.message || "Sync status updated");
        }
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Sync failed";
      toast.error(msg);
    } finally {
      setSyncing(false);
    }
  };

  if (isLoadingAdmin) {
    return (
      <AppLayout>
        <div className="p-8 text-sm text-muted-foreground">Loading admin data...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {isAdminError && (
        <div className="mb-4 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm flex items-center justify-between gap-4">
          <span>Failed to load audit logs. Is the backend running on port 8080? Please log in again using admin@helix.io.</span>
          <button type="button" onClick={() => refetchAdmin()} className="text-xs font-semibold text-brand hover:underline shrink-0">
            Retry
          </button>
        </div>
      )}
      <PageHeader
        title="Admin Panel"
        subtitle="Synchronization, moderation, and system monitoring"
        action={

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={resetStaleSync}
              disabled={syncing}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-medium border border-border hover:bg-secondary/50 disabled:opacity-60"
            >
              Reset Stale Sync
            </button>
            <button
              type="button"
              onClick={runSync}
              disabled={syncing}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold text-brand-foreground glow-brand disabled:opacity-60"
              style={{ background: "var(--gradient-brand)" }}
            >
              <RefreshCw className={`size-4 ${syncing ? "animate-spin" : ""}`} /> {syncing ? "Syncing..." : "Run Manual Sync"}
            </button>
          </div>


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
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
              {l}
            </div>
            <div className="flex items-end justify-between">
              <span className="text-2xl font-bold font-mono">{v}</span>
              <span
                className={`size-2 rounded-full ${s === "ok" ? "bg-success" : "bg-warning"} animate-pulse`}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="lg:col-span-2" title="Pending Review">

          {PENDING_REVIEW.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No papers pending review. Run <strong>Manual Sync</strong> to fetch papers from OpenAlex.
            </p>
          ) : (
            <div className="space-y-3">
              {PENDING_REVIEW.map((p) => (
                <div key={p.id} className="flex items-start justify-between gap-4 p-3 rounded-lg border border-border bg-secondary/30">
                  <Link to="/papers/$id" params={{ id: p.id }} className="min-w-0 flex-1 hover:opacity-90">
                    <div className="text-[10px] font-mono text-muted-foreground uppercase mb-1 flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-brand/10 text-brand">{p.source}</span>
                      <span>{p.journal}</span>
                      {p.status === "flagged" && (
                        <span className="text-warning flex items-center gap-1">
                          <AlertTriangle className="size-3" /> Missing metadata
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-semibold text-foreground">{p.title}</div>
                    <div className="text-xs text-muted-foreground mt-1">{(p.authors ?? []).join(", ") || "—"}</div>
                    {p.doi ? (
                      <div className="text-[10px] font-mono text-muted-foreground mt-1">DOI: {p.doi}</div>
                    ) : null}
                  </Link>
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={approvePaper.isPending || deletePaper.isPending}
                      onClick={() => {
                        approvePaper.mutate(
                          { id: p.id },
                          {
                            onSuccess: () => toast.success("Paper approved successfully"),
                            onError: (err) => {
                              const msg = err instanceof ApiError ? err.message : "Approval failed";
                              toast.error(msg);
                            },
                          }
                        );
                      }}
                      className="p-1.5 rounded-md border border-border hover:border-success/40 hover:text-success transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={approvePaper.isPending || deletePaper.isPending}
                      onClick={() => {
                        deletePaper.mutate(p.id, {
                          onSuccess: () => toast.success("Paper deleted successfully"),
                          onError: (err) => {
                            const msg = err instanceof ApiError ? err.message : "Deletion failed";
                            toast.error(msg);
                          },
                        });
                      }}
                      className="p-1.5 rounded-md border border-border hover:border-destructive/40 hover:text-destructive transition-colors disabled:opacity-50"
                    >
                      <XCircle className="size-3.5" />
                    </button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Metadata APIs (OpenAlex · Crossref · S2)">
          {sources.length === 0 ? (
            <p className="text-sm text-muted-foreground">Loading source configurations...</p>
          ) : (
            <div className="space-y-4">
              {sources.map((src) => (
                <div key={src.name} className="flex items-start justify-between gap-3 text-sm border-b border-border/60 pb-3 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <div className="font-medium text-foreground">{src.name}</div>
                    <div className="text-[10px] font-mono text-muted-foreground truncate">{src.baseUrl}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      Cron: {src.syncSchedule ?? "—"}
                      {src.successRate != null ? ` · ${src.successRate.toFixed(1)}% OK` : ""}
                    </div>
                  </div>
                  <label className="flex items-center gap-2 shrink-0 cursor-pointer">
                    <span className="text-[10px] font-mono text-muted-foreground">{src.enabled ? "ON" : "OFF"}</span>
                    <input
                      type="checkbox"
                      checked={src.enabled}
                      disabled={updateSource.isPending}
                      onChange={(e) => {
                        updateSource.mutate(
                          { name: src.name, enabled: e.target.checked },
                          {
                            onSuccess: () => toast.success(`${src.name}: ${e.target.checked ? "ON" : "OFF"}`),
                            onError: (err) => {
                              const msg = err instanceof ApiError ? err.message : "Failed to update source";
                              toast.error(msg);
                            },
                          },
                        );
                      }}
                      className="size-4 accent-[var(--brand)]"
                    />
                  </label>
                </div>
              ))}
            </div>
          )}

        </Card>
      </div>

      <AiCollectionAnalysisSettingsSection />

      <Card
        title="Audit Logs"
        action={
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest flex items-center gap-1">
            <Activity className="size-3" /> LIVE
          </span>
        }
      >
        <div className="divide-y divide-border -mx-6">
          {AUDIT_LOGS.map((l) => (
            <div key={l.id} className="px-6 py-3 flex items-center gap-4 text-sm">
              <span
                className={`size-1.5 rounded-full ${
                  l.status === "ok" || l.status === "SUCCESS" || l.status === "success"
                    ? "bg-success"
                    : l.status === "RUNNING" || l.status === "running"
                      ? "bg-blue-400 animate-pulse"
                      : l.status === "FAILED" || l.status === "failed" || l.status === "error"
                        ? "bg-destructive"
                        : "bg-warning"
                }`}
                title={l.status}
              />
              <span className="font-mono text-[11px] text-muted-foreground w-24 shrink-0">
                {l.time}
              </span>
              <span className="font-mono text-[11px] text-brand w-40 shrink-0 truncate">
                {l.actor}
              </span>
              <span className="flex-1 text-foreground truncate">{l.action}</span>
              <span className="text-xs text-muted-foreground truncate">{l.target}</span>
            </div>
          ))}
        </div>
      </Card>
    </AppLayout>
  );
}



function AiCollectionAnalysisSettingsSection() {
  const { data: limitData } = useAiCollectionAnalysisLimit();
  const updateMutation = useUpdateAiCollectionAnalysisLimit();

  const currentLimit = limitData?.maxPapers ?? 30;
  const [maxPapers, setMaxPapers] = useState<number>(30);
  const [isModified, setIsModified] = useState(false);

  useEffect(() => {
    if (limitData?.maxPapers) {
      setMaxPapers(limitData.maxPapers);
      setIsModified(false);
    }
  }, [limitData?.maxPapers]);

  const handlePreset = (val: number) => {
    setMaxPapers(val);
    setIsModified(val !== currentLimit);
  };

  const handleSliderChange = (val: number) => {
    setMaxPapers(val);
    setIsModified(val !== currentLimit);
  };

  const handleSave = async () => {
    if (maxPapers < 1 || maxPapers > 100) {
      toast.error("Limit must be between 1 and 100 papers");
      return;
    }
    try {
      await updateMutation.mutateAsync(maxPapers);
      toast.success(`AI Collection Analysis limit updated to ${maxPapers} papers`);
      setIsModified(false);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Failed to update AI limit";
      toast.error(msg);
    }
  };

  // Performance metrics estimation matching Groq Llama 3.3 70B & BE metadata prompt
  const estTokens = maxPapers * 200 + 600;
  const speedRating =
    maxPapers <= 20
      ? { label: "Fast (~2.0s)", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" }
      : maxPapers <= 50
      ? { label: "Balanced (~3.8s)", color: "text-brand bg-brand/10 border-brand/30" }
      : { label: "Deep Analysis (~7.5s)", color: "text-amber-400 bg-amber-500/10 border-amber-500/30" };

  const sliderPercent = Math.min(100, Math.max(0, ((maxPapers - 1) / 99) * 100));

  return (
    <Card
      className="mb-6 overflow-hidden border-border/80 shadow-lg"
      title="AI Collection Analysis Configuration"
      action={
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 border border-brand/25 text-xs">
          <span className="relative flex size-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand opacity-75"></span>
            <span className="relative inline-flex rounded-full size-2 bg-brand"></span>
          </span>
          <span className="font-mono text-muted-foreground">
            Active Limit: <strong className="text-brand font-bold">{currentLimit} / 100 papers</strong>
          </span>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Top Control Hero Box */}
        <div className="relative overflow-hidden p-5 rounded-2xl border border-brand/20 bg-gradient-to-r from-brand/10 via-secondary/30 to-brand/5 backdrop-blur-sm transition-all shadow-inner">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-brand/20 text-brand border border-brand/30 glow-brand">
                  <Cpu className="size-5" />
                </div>
                <h4 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
                  Maximum Papers Analyzed Per Run
                </h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed pl-0.5">
                Controls the maximum number of papers processed by Groq AI LLM per analysis request.
                Updates sync instantly across all user modals and notification thresholds.
              </p>
            </div>

            {/* Stepper + Input */}
            <div className="flex items-center gap-3 shrink-0 bg-background/80 p-2 rounded-xl border border-border/80 shadow-sm">
              <button
                type="button"
                onClick={() => handleSliderChange(Math.max(1, maxPapers - 1))}
                className="size-8 rounded-lg bg-secondary/80 hover:bg-secondary text-foreground font-bold flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
                disabled={maxPapers <= 1}
              >
                -
              </button>

              <div className="flex items-center gap-1.5 px-1">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={maxPapers}
                  onChange={(e) => handleSliderChange(Math.max(1, Math.min(100, Number(e.target.value))))}
                  className="w-16 h-9 px-2 rounded-lg border border-brand/40 bg-secondary/40 text-foreground text-base font-extrabold font-mono text-center focus:ring-2 focus:ring-brand focus:outline-none transition-all"
                />
                <span className="text-xs font-semibold text-muted-foreground">papers</span>
              </div>

              <button
                type="button"
                onClick={() => handleSliderChange(Math.min(100, maxPapers + 1))}
                className="size-8 rounded-lg bg-secondary/80 hover:bg-secondary text-foreground font-bold flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
                disabled={maxPapers >= 100}
              >
                +
              </button>
            </div>
          </div>

          {/* AI Estimated Metrics Indicator Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-border/40 text-xs">
            <div className="flex items-center gap-2">
              <Zap className="size-3.5 text-brand shrink-0" />
              <span className="text-muted-foreground">Estimated Speed:</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${speedRating.color}`}>
                {speedRating.label}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Cpu className="size-3.5 text-brand shrink-0" />
              <span className="text-muted-foreground">Token Context:</span>
              <span className="font-mono font-bold text-foreground">~{estTokens.toLocaleString()} tokens</span>
            </div>

            <div className="flex items-center gap-2 col-span-2 sm:col-span-1">
              <Sliders className="size-3.5 text-brand shrink-0" />
              <span className="text-muted-foreground">Status:</span>
              <span className={`font-mono text-[11px] font-semibold ${isModified ? "text-amber-400" : "text-emerald-400"}`}>
                {isModified ? "Unsaved Changes" : "Saved & Active"}
              </span>
            </div>
          </div>
        </div>

        {/* Custom Glowing Slider Section */}
        <div className="space-y-3 px-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
            <span className="font-semibold">1 paper (Min)</span>
            <div className="px-3 py-1 rounded-full bg-brand/15 text-brand font-bold font-mono border border-brand/30 shadow-sm flex items-center gap-1.5">
              <Sparkles className="size-3" />
              <span>Current Target: {maxPapers} papers</span>
            </div>
            <span className="font-semibold">100 papers (Max)</span>
          </div>

          <div className="relative py-1">
            <input
              type="range"
              min={1}
              max={100}
              step={1}
              value={maxPapers}
              onChange={(e) => handleSliderChange(Number(e.target.value))}
              className="w-full h-2.5 bg-secondary/80 rounded-lg appearance-none cursor-pointer accent-brand transition-all hover:bg-secondary focus:outline-none"
              style={{
                background: `linear-gradient(to right, var(--brand) 0%, var(--brand) ${sliderPercent}%, var(--secondary) ${sliderPercent}%, var(--secondary) 100%)`,
              }}
            />
          </div>
        </div>

        {/* Quick Presets & Save Action Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-border/60">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground mr-1">Quick Presets:</span>
            {[
              { val: 15, tag: "Fast" },
              { val: 30, tag: "Recommended" },
              { val: 50, tag: "Extended" },
              { val: 100, tag: "Maximum" },
            ].map(({ val, tag }) => (
              <button
                key={val}
                type="button"
                onClick={() => handlePreset(val)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                  maxPapers === val
                    ? "bg-brand text-brand-foreground border-brand font-bold shadow-md shadow-brand/20 scale-105"
                    : "bg-secondary/40 text-muted-foreground border-border hover:border-brand/40 hover:text-foreground hover:bg-secondary/80"
                }`}
              >
                <span>{val}</span>
                <span className="text-[10px] opacity-75">({tag})</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={updateMutation.isPending || !isModified}
            className="inline-flex items-center justify-center gap-2 h-10 px-6 rounded-xl text-xs font-bold uppercase tracking-wider text-brand-foreground glow-brand transition-all hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer shadow-md"
            style={{ background: "var(--gradient-brand)" }}
          >
            {updateMutation.isPending ? (
              <span>Saving...</span>
            ) : (
              <>
                <Check className="size-4" />
                <span>Save Configuration</span>
              </>
            )}
          </button>
        </div>
      </div>
    </Card>
  );
}