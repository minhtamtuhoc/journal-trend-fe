import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Card } from "@/components/Card";
import { SaveToCollectionButton } from "@/components/SaveToCollectionButton";
import { useTopic } from "@/hooks/data/use-topics";
import { useSearchPapers } from "@/hooks/data/use-papers";
import { ArrowLeft, ArrowUpRight, TrendingUp, Bell, BellOff, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/auth";
import { useFollowedTopics, useFollowTopic, useUnfollowTopic } from "@/hooks/data/use-follows";
import { toast } from "sonner";
import { ApiError } from "@/api/errors";
import { useState } from "react";

export const Route = createFileRoute("/topics/$topicId")({ component: TopicPapersPage });

function TopicPapersPage() {
  const { topicId } = Route.useParams();
  const { user } = useAuth();
  const [page, setPage] = useState(1);

  const numericTopicId = Number(topicId);
  const isNumeric = !isNaN(numericTopicId);

  const { data: topic, isLoading: loadingTopic, isError } = useTopic(topicId);
  const { data: pageResponse, isLoading: loadingPapers } = useSearchPapers({
    ...(isNumeric ? { topicId: numericTopicId } : { q: topicId, searchType: "keywords" }),
    page: page - 1,
    size: 20,
  });

  const papers = pageResponse?.content ?? [];
  const totalPages = pageResponse?.totalPages ?? 0;
  const totalElements = pageResponse?.totalElements ?? 0;

  const { data: followedTopics = [] } = useFollowedTopics();
  const followTopic = useFollowTopic();
  const unfollowTopic = useUnfollowTopic();
  const isFollowing = followedTopics.some((t) => t.id === topicId);

  if (loadingTopic) {
    return (
      <AppLayout>
        <div className="p-8 text-sm text-muted-foreground">Loading topic…</div>
      </AppLayout>
    );
  }

  if (isError || !topic) throw notFound();

  return (
    <AppLayout>
      <PageHeader
        title={topic.name}
        subtitle={
          topic.description ||
          `${totalElements || topic.paperCount} papers · trend ${topic.trendScore >= 0 ? "+" : ""}${topic.trendScore.toFixed(1)}%`
        }
        action={
          <div className="flex flex-wrap gap-2">
            {user ? (
              <button
                type="button"
                disabled={followTopic.isPending || unfollowTopic.isPending}
                onClick={() => {
                  const mutate = isFollowing ? unfollowTopic : followTopic;
                  mutate.mutate(topicId, {
                    onSuccess: () =>
                      toast.success(isFollowing ? `Unfollowed topic: ${topic.name}` : `Following topic: ${topic.name}`),
                    onError: (err) => {
                      const msg = err instanceof ApiError ? err.message : "Failed to update follow status";
                      toast.error(msg);
                    },
                  });
                }}
                className={`inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold border transition-colors ${
                  isFollowing ? "border-brand/45 bg-brand/10 text-brand" : "text-brand-foreground glow-brand border-transparent"
                }`}
                style={isFollowing ? undefined : { background: "var(--gradient-brand)" }}
              >
                {isFollowing ? <BellOff className="size-4" /> : <Bell className="size-4" />}
                {isFollowing ? "Following" : "Follow topic"}
              </button>
            ) : null}
            <Link
              to="/bookmarks"
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium border border-border hover:bg-secondary/50"
            >
              <ArrowLeft className="size-4" /> Bookmarks
            </Link>
          </div>
        }
      />

      <Card title={`Related papers (${totalElements || papers.length})`}>
        {loadingPapers ? (
          <p className="text-sm text-muted-foreground p-4">Loading papers…</p>
        ) : papers.length === 0 ? (
          <p className="text-sm text-muted-foreground p-4">No papers linked to this topic yet. Run sync from Admin.</p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-3">
              {papers.map((p) => (
                <div
                  key={p.id}
                  className="flex items-start justify-between gap-4 p-3 rounded-lg border border-border bg-secondary/20 hover:bg-secondary/40 transition-colors"
                >
                  <Link to="/papers/$id" params={{ id: p.id }} className="min-w-0 flex-1">
                    <div className="text-[10px] font-mono text-muted-foreground mb-1 flex items-center gap-2">
                      <span>{p.journal}</span>
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

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border mt-4 text-xs font-mono">
                <span className="text-muted-foreground">
                  Page <strong className="text-foreground">{page}</strong> of <strong className="text-foreground">{totalPages}</strong> ({totalElements} total papers)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || loadingPapers}
                    className="h-8 px-3 rounded-lg border border-border bg-secondary/30 hover:bg-secondary text-foreground flex items-center gap-1 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="size-3.5" /> Previous
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages || loadingPapers}
                    className="h-8 px-3 rounded-lg border border-border bg-secondary/30 hover:bg-secondary text-foreground flex items-center gap-1 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    Next <ChevronRight className="size-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </AppLayout>
  );
}
