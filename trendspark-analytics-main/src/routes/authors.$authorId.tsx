import { useState, useMemo } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Card } from "@/components/Card";
import { SaveToCollectionButton } from "@/components/SaveToCollectionButton";
import { useAuthor, useAuthorPapers } from "@/hooks/data/use-authors";
import { ArrowLeft, ArrowUpRight, Building2, FileText, TrendingUp, User, Bookmark } from "lucide-react";
import { useFollowedAuthors, useFollowAuthor, useUnfollowAuthor } from "@/hooks/data/use-follows";
import { useAuth } from "@/auth";
import { toast } from "sonner";
import { ApiError } from "@/api/errors";
import type { Paper } from "@/types/domain";

export const Route = createFileRoute("/authors/$authorId")({
  component: AuthorProfilePage,
  validateSearch: (search: Record<string, unknown>) => search,
});

function AuthorProfilePage() {
  const { authorId } = Route.useParams();
  const { fromReport: fromReportSearch } = Route.useSearch() as { fromReport?: boolean | string };
  const fromReport = fromReportSearch === true || fromReportSearch === 'true';
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 14;
  const { data: author, isLoading, isError } = useAuthor(authorId);
  const { data: papers = [], isLoading: loadingPapers } = useAuthorPapers(authorId);
  const { user } = useAuth();
  const { data: followedAuthors = [] } = useFollowedAuthors();
  const followAuthorMut = useFollowAuthor();
  const unfollowAuthorMut = useUnfollowAuthor();
  const followed = followedAuthors.some((a) => a.id === authorId);

  const hasPagination = papers.length > 14;
  const totalPages = Math.ceil(papers.length / itemsPerPage);
  const paginatedPapers = hasPagination
    ? papers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : papers;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-8 text-sm text-muted-foreground">Loading author profile...</div>
      </AppLayout>
    );
  }

  if (isError || !author) throw notFound();

  return (
    <AppLayout>
      <PageHeader
        title={author.name}
        subtitle={`${author.affiliation} · source: ${author.source ?? "OpenAlex / DB"}`}
        action={
          <div className="flex gap-2">
            {fromReport && (
              <Link
                to="/reports"
                search={(prev: any) => ({ ...prev, authorId })}
                className="inline-flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-medium border border-brand/40 bg-brand/10 text-brand hover:bg-brand/20 transition-all cursor-pointer"
              >
                <ArrowLeft className="size-4" /> Back to Topic Matches
              </Link>
            )}
            <Link
              to="/authors"
              className="inline-flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-medium border border-border hover:bg-secondary/50"
            >
              <ArrowLeft className="size-4" /> Back to Authors
            </Link>
            <button
              type="button"
              disabled={followAuthorMut.isPending || unfollowAuthorMut.isPending}
              onClick={() => {
                if (!user) {
                  toast.error("Please login to follow authors");
                  return;
                }
                if (followed) {
                  unfollowAuthorMut.mutate(author.id, {
                    onSuccess: () => toast.info(`Unfollowed ${author.name}`),
                    onError: (err) => {
                      const msg = err instanceof ApiError ? err.message : "Unfollow failed";
                      toast.error(msg);
                    },
                  });
                } else {
                  followAuthorMut.mutate(author.id, {
                    onSuccess: () => toast.success(`Following ${author.name}`),
                    onError: (err) => {
                      const msg = err instanceof ApiError ? err.message : "Follow failed. Max 20 authors.";
                      toast.error(msg);
                    },
                  });
                }
              }}
              className={`inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                followed
                  ? "border-brand/40 bg-brand/10 text-brand"
                  : "border-border hover:bg-secondary/50 text-foreground"
              }`}
            >
              <Bookmark className="size-4" fill={followed ? "currentColor" : "none"} />
              {followed ? "Followed" : "Follow"}
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Stat label="Papers" value={String(author.papers)} icon={<FileText className="size-4" />} />
        <Stat label="Citations" value={author.citations.toLocaleString()} icon={<TrendingUp className="size-4" />} />
        <Stat label="h-index" value={String(author.hIndex)} icon={<User className="size-4" />} />
      </div>

      {author.openAlexId ? (
        <div className="mb-6 text-xs text-muted-foreground font-mono flex items-center gap-2">
          <Building2 className="size-3.5" />
          OpenAlex ID: {author.openAlexId}
        </div>
      ) : null}

      <Card title={`Author's Papers (${papers.length})`}>
        {loadingPapers ? (
          <p className="text-sm text-muted-foreground p-4">Loading papers list...</p>
        ) : papers.length === 0 ? (
          <p className="text-sm text-muted-foreground p-4">
            No linked papers found in the system. Run sync from Admin to synchronize metadata from OpenAlex.
          </p>
        ) : (
          <>
            <div className="space-y-3">
              {paginatedPapers.map((p) => (
                <div
                  key={p.id}
                  className="flex items-start justify-between gap-4 p-3 rounded-lg border border-border bg-secondary/20 hover:bg-secondary/40 transition-colors"
                >
                  <Link to="/papers/$id" params={{ id: p.id }} className="min-w-0 flex-1">
                    <div className="text-[10px] font-mono text-muted-foreground mb-1 flex items-center gap-2">
                      <span>{p.journal}</span>
                      <span className="text-brand">{p.source}</span>
                      <span className="text-success">+{(p.trendScore ?? 0).toFixed(1)}%</span>
                    </div>
                    <div className="text-sm font-semibold text-foreground hover:text-brand">{p.title}</div>
                    {p.doi ? <div className="text-[10px] font-mono text-muted-foreground mt-1">DOI: {p.doi}</div> : null}
                  </Link>
                  <div className="flex items-center gap-2 shrink-0">
                    <SaveToCollectionButton paperId={p.id} paperTitle={p.title} />
                    <Link
                      to="/papers/$id"
                      params={{ id: p.id }}
                      className="p-1.5 rounded-md border border-border hover:border-brand/40 hover:text-brand"
                    >
                      <ArrowUpRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {hasPagination && totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-6 py-4 border-t border-border">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-xs font-medium border border-border hover:border-brand/40 disabled:opacity-50 disabled:pointer-events-none transition-colors cursor-pointer"
                >
                  Previous
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`inline-flex items-center justify-center size-8 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      currentPage === p
                        ? "bg-brand/10 border-brand/45 text-brand"
                        : "border-border hover:border-brand/40"
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-xs font-medium border border-border hover:border-brand/40 disabled:opacity-50 disabled:pointer-events-none transition-colors cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </Card>
    </AppLayout>
  );
}

function Stat({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
        {icon}
        {label}
      </div>
      <div className={`text-2xl font-bold font-mono ${accent ? "text-brand" : ""}`}>{value}</div>
    </div>
  );
}
