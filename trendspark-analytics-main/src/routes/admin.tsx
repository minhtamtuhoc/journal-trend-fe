import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Card } from "@/components/Card";
import { useAdminOverview, useAdminSources, useUpdateAdminSource, useApprovePaper, useDeletePaper, usePendingReview } from "@/hooks/data/use-admin";
import { useState } from "react";
import { RefreshCw, CheckCircle2, XCircle, AlertTriangle, Activity } from "lucide-react";
import { toast } from "sonner";
import { useAuth, isAdminUser } from "@/auth";
import { useQueryClient } from "@tanstack/react-query";
import { getServices, queryKeys } from "@/services";
import { ApiError } from "@/api/errors";

export const Route = createFileRoute("/admin")({ component: AdminPage });

function AdminPage() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isExactAdmin = pathname === "/admin" || pathname === "/admin/";

  if (!isExactAdmin) {
    return <Outlet />;
  }

  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: admin, isLoading: isLoadingAdmin, isError: isAdminError, refetch: refetchAdmin } = useAdminOverview();
  const { data: sources = [] } = useAdminSources();
  const updateSource = useUpdateAdminSource();
  const approvePaper = useApprovePaper();
  const deletePaper = useDeletePaper();
  const { data: PENDING_REVIEW = [] } = usePendingReview();
  const AUDIT_LOGS = admin?.auditLogs ?? [];
  const [syncing, setSyncing] = useState(false);


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
        toast.success(status.message || `Đồng bộ xong · ${status.papersFetched} bài báo`);
      } else {
        toast.error(status.message || "Đồng bộ thất bại — xem Audit Logs");
      }
      return;
    }
    toast.warning("Sync vẫn đang chạy. Xem tiến độ trong Audit Logs.");
    await invalidateAfterSync();
  };

  const resetStaleSync = async () => {
    try {
      const result = await getServices().admin.resetStaleSync();
      await invalidateAfterSync();
      toast.success(result.message || "Đã reset sync kẹt — bạn có thể chạy sync lại");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Không reset được sync";
      toast.error(msg);
    }
  };

  const runSync = async () => {
    setSyncing(true);
    try {
      const result = await getServices().admin.triggerSync();
      if (result.status === "RUNNING") {
        toast.info(result.message || "Đang đồng bộ metadata từ OpenAlex…");
        await pollSyncUntilDone();
      } else if (result.status === "FAILED") {
        await invalidateAfterSync();
        toast.error(result.message || "Đồng bộ thất bại — thử Reset sync kẹt rồi chạy lại");
      } else {
        await invalidateAfterSync();
        if (result.status === "SUCCESS") {
          toast.success(result.message || `Đồng bộ xong · ${result.papersFetched} bài báo`);
        } else {
          toast.info(result.message || "Trạng thái sync đã cập nhật");
        }
      }
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Đồng bộ thất bại";
      toast.error(msg);
    } finally {
      setSyncing(false);
    }
  };

  if (isLoadingAdmin) {
    return (
      <AppLayout>
        <div className="p-8 text-sm text-muted-foreground">Loading admin data…</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {isAdminError && (
        <div className="mb-4 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm flex items-center justify-between gap-4">
          <span>Không tải được audit logs. Backend có đang chạy trên port 8080? Hãy đăng nhập lại bằng admin@helix.io.</span>
          <button type="button" onClick={() => refetchAdmin()} className="text-xs font-semibold text-brand hover:underline shrink-0">
            Thử lại
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
              Reset sync kẹt
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
              Không có bài chờ duyệt. Chạy <strong>Manual Sync</strong> để nạp bài từ OpenAlex.
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
                          <AlertTriangle className="size-3" /> Thiếu metadata
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
                            onSuccess: () => toast.success("Đã duyệt bài báo thành công"),
                            onError: (err) => {
                              const msg = err instanceof ApiError ? err.message : "Duyệt thất bại";
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
                          onSuccess: () => toast.success("Đã xóa bài báo thành công"),
                          onError: (err) => {
                            const msg = err instanceof ApiError ? err.message : "Xóa thất bại";
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
            <p className="text-sm text-muted-foreground">Đang tải cấu hình nguồn…</p>
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
                            onSuccess: () => toast.success(`${src.name}: ${e.target.checked ? "bật" : "tắt"}`),
                            onError: (err) => {
                              const msg = err instanceof ApiError ? err.message : "Không cập nhật được nguồn";
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