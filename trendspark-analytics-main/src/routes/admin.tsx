import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Card } from "@/components/Card";
import { useAdminOverview, useAdminSources, useUpdateAdminSource, useApprovePaper, useDeletePaper, usePendingReview } from "@/hooks/data/use-admin";
import { useState } from "react";
import { RefreshCw, CheckCircle2, XCircle, AlertTriangle, Activity, UserCheck, UserX, ExternalLink, ArrowRight, History } from "lucide-react";
import { toast } from "sonner";
import { useAuth, isAdminUser } from "@/auth";
import { useQueryClient } from "@tanstack/react-query";
import { getServices, queryKeys } from "@/services";
import { ApiError } from "@/api/errors";
import { useAdminRoleRequests, useApproveRoleRequest, useRoleLogs } from "@/hooks/data/use-role-request";
import { RoleRequestRejectModal } from "@/components/RoleRequestRejectModal";
import type { RoleRequestStatus, RoleUpgradeRequestResponse, RoleChangeLogResponse } from "@/types/role-request";

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

      <RoleRequestsAdminSection />

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

function RoleRequestsAdminSection() {
  const [statusFilter, setStatusFilter] = useState<RoleRequestStatus>("PENDING");
  const [page, setPage] = useState(0);
  const [rejectingRequest, setRejectingRequest] = useState<RoleUpgradeRequestResponse | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [subTab, setSubTab] = useState<"requests" | "logs">("requests");

  const { data: requestsPage, isLoading: isLoadingRequests, refetch: refetchRequests } = useAdminRoleRequests(statusFilter, page, 20);
  const approveMutation = useApproveRoleRequest();
  const { data: roleLogsPage } = useRoleLogs(undefined, 0, 20);

  const requests: RoleUpgradeRequestResponse[] = requestsPage?.content ?? [];
  const logs: RoleChangeLogResponse[] = roleLogsPage?.content ?? [];

  const handleApprove = async (req: RoleUpgradeRequestResponse) => {
    try {
      await approveMutation.mutateAsync({ requestId: req.id });
      toast.success(`Đã duyệt nâng role thành công cho ${req.userName} (${req.requestedRole})`);
      void refetchRequests();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Duyệt thất bại";
      toast.error(msg);
    }
  };

  return (
    <Card className="mb-6" title="Quản lý Yêu cầu Đổi Role & Lịch sử">
      {/* Sub tabs & status filter */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4 mb-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSubTab("requests")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              subTab === "requests" ? "bg-brand text-brand-foreground" : "bg-secondary/40 text-muted-foreground hover:text-foreground"
            }`}
          >
            Đơn yêu cầu ({statusFilter})
          </button>
          <button
            type="button"
            onClick={() => setSubTab("logs")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              subTab === "logs" ? "bg-brand text-brand-foreground" : "bg-secondary/40 text-muted-foreground hover:text-foreground"
            }`}
          >
            <History className="size-3.5" />
            Nhật ký đổi role (Role Logs)
          </button>
        </div>

        {subTab === "requests" && (
          <div className="flex gap-1 bg-secondary/30 p-1 rounded-lg border border-border/50">
            {(["PENDING", "APPROVED", "REJECTED"] as RoleRequestStatus[]).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setStatusFilter(st);
                  setPage(0);
                }}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                  statusFilter === st ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        )}
      </div>

      {subTab === "requests" ? (
        isLoadingRequests ? (
          <p className="text-sm text-muted-foreground py-4">Đang tải danh sách đơn...</p>
        ) : requests.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Không có đơn xin đổi role nào ở trạng thái <strong>{statusFilter}</strong>.</p>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div key={req.id} className="p-4 rounded-xl border border-border bg-secondary/20 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                      <span>{req.userName}</span>
                      <span className="text-xs font-normal text-muted-foreground">({req.userEmail})</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 font-mono">
                      <span>{req.currentRole}</span>
                      <ArrowRight className="size-3 text-brand" />
                      <span className="text-brand font-bold">{req.requestedRole}</span>
                      <span className="text-muted-foreground/60">• {new Date(req.createdAt).toLocaleString("vi-VN")}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                        req.status === "PENDING"
                          ? "bg-warning/20 text-warning"
                          : req.status === "APPROVED"
                          ? "bg-success/20 text-success"
                          : "bg-destructive/20 text-destructive"
                      }`}
                    >
                      {req.status}
                    </span>

                    {req.status === "PENDING" && (
                      <div className="flex gap-1.5 ml-2">
                        <button
                          type="button"
                          disabled={approveMutation.isPending}
                          onClick={() => handleApprove(req)}
                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-success/10 text-success border border-success/30 hover:bg-success/20 transition-colors flex items-center gap-1"
                        >
                          <UserCheck className="size-3.5" />
                          Duyệt
                        </button>
                        <button
                          type="button"
                          disabled={approveMutation.isPending}
                          onClick={() => {
                            setRejectingRequest(req);
                            setShowRejectModal(true);
                          }}
                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20 transition-colors flex items-center gap-1"
                        >
                          <UserX className="size-3.5" />
                          Từ chối
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reason HTML */}
                {req.reason && (
                  <div className="p-3 bg-background/60 rounded-lg border border-border/50 text-xs leading-relaxed space-y-1">
                    <div className="text-[10px] font-semibold uppercase text-muted-foreground">Lý do trình bày:</div>
                    <div
                      className="prose prose-xs dark:prose-invert max-w-none text-foreground"
                      dangerouslySetInnerHTML={{ __html: req.reason }}
                    />
                  </div>
                )}

                {/* Proof Link & Rejection Reason note */}
                <div className="flex flex-wrap items-center justify-between text-xs pt-1 border-t border-border/40 gap-2">
                  {req.proofUrl ? (
                    <a
                      href={req.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-brand hover:underline font-medium"
                    >
                      <ExternalLink className="size-3" /> Link minh chứng chứng minh
                    </a>
                  ) : (
                    <span className="text-muted-foreground italic">Không đính kèm link minh chứng</span>
                  )}

                  {req.status === "REJECTED" && req.rejectionReasonText && (
                    <span className="text-destructive font-medium">Lý do từ chối: {req.rejectionReasonText}</span>
                  )}
                  {req.status === "APPROVED" && req.reviewedByEmail && (
                    <span className="text-muted-foreground">Duyệt bởi: {req.reviewedByEmail}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        logs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Chưa có bản ghi nhật ký đổi role nào.</p>
        ) : (
          <div className="divide-y divide-border/60 border border-border/80 rounded-xl overflow-hidden">
            {logs.map((log) => (
              <div key={log.id} className="p-3 bg-secondary/10 flex items-center justify-between text-xs gap-4">
                <div className="space-y-0.5">
                  <div className="font-semibold text-foreground">
                    {log.targetUserEmail} <span className="font-mono text-muted-foreground font-normal">({log.oldRole} → {log.newRole})</span>
                  </div>
                  <div className="text-muted-foreground">{log.reason || "Đổi role thành công"}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono text-[11px] text-brand">{log.operatorEmail}</div>
                  <div className="text-[10px] text-muted-foreground">{new Date(log.createdAt).toLocaleString("vi-VN")}</div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      <RoleRequestRejectModal
        request={rejectingRequest}
        open={showRejectModal}
        onOpenChange={setShowRejectModal}
        onSuccess={() => void refetchRequests()}
      />
    </Card>
  );
}