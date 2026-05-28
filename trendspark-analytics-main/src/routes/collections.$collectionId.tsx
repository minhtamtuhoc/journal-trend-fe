import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Card } from "@/components/Card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, ArrowUpRight, Trash2, FolderOpen } from "lucide-react";

import { useCollection, useRemovePaperFromCollection } from "@/hooks/data/use-collections";
import { usePapers } from "@/hooks/data/use-papers";
import { SaveToCollectionButton } from "@/components/SaveToCollectionButton";
import { formatTimeAgo } from "@/lib/time";
import type { Paper } from "@/types/domain";

export const Route = createFileRoute("/collections/$collectionId")({
  component: CollectionDetailPage,
});

type SortMode = "recent" | "newest" | "oldest";

function CollectionDetailPage() {
  const { collectionId } = Route.useParams();
  const { data: collection, isLoading: isLoadingCollection } = useCollection(collectionId);
  const { data: papers = [], isLoading: isLoadingPapers } = usePapers();
  const removeMutation = useRemovePaperFromCollection();

  const [sort, setSort] = useState<SortMode>("recent");

  if (!isLoadingCollection && !collection) throw notFound();

  const savedPapers = useMemo(() => {
    if (!collection) return [];
    const map = new Map<string, Paper>(papers.map((p) => [p.id, p]));
    const ordered = collection.paperIds.map((id) => map.get(id)).filter(Boolean) as Paper[];

    if (sort === "recent") {
      // "Recently saved" uses current saved order (new saves appended).
      return [...ordered].reverse();
    }
    if (sort === "newest") return [...ordered].sort((a, b) => b.year - a.year);
    return [...ordered].sort((a, b) => a.year - b.year);
  }, [collection, papers, sort]);

  const loading = isLoadingCollection || isLoadingPapers;

  const onRemove = async (paperId: string) => {
    try {
      await removeMutation.mutateAsync({ collectionId, paperId });
      toast.success("Removed from collection");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to remove paper");
    }
  };

  const paperCount = collection?.paperIds.length ?? 0;

  return (
    <AppLayout>
      <PageHeader
        title={collection?.name ?? "Collection"}
        subtitle={
          collection
            ? `${paperCount} papers · Updated ${formatTimeAgo(collection.updatedAt)}`
            : "Loading collection…"
        }
        action={
          <div className="flex items-center gap-2">
            <Link
              to="/collections"
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium border border-border bg-surface/50 hover:bg-surface transition-colors"
            >
              <ArrowLeft className="size-4" /> Back
            </Link>
            <div className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-secondary/20">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sort</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortMode)}
                className="h-7 bg-transparent text-xs text-foreground focus:outline-none"
              >
                <option value="recent">Recently saved</option>
                <option value="newest">Newest papers</option>
                <option value="oldest">Oldest papers</option>
              </select>
            </div>
          </div>
        }
      />

      <div className="sm:hidden mb-4">
        <div className="flex items-center gap-2 h-10 px-3 rounded-xl border border-border bg-secondary/20">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Sort</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="h-8 flex-1 bg-transparent text-sm text-foreground focus:outline-none"
          >
            <option value="recent">Recently saved</option>
            <option value="newest">Newest papers</option>
            <option value="oldest">Oldest papers</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-14" />
                  </div>
                  <Skeleton className="h-5 w-5/6" />
                  <Skeleton className="h-4 w-3/5 mt-2" />
                  <Skeleton className="h-4 w-2/5 mt-2" />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && savedPapers.length === 0 && (
        <div className="text-center py-16 glass rounded-2xl border border-border max-w-md mx-auto">
          <div className="size-12 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-brand mx-auto mb-4">
            <FolderOpen className="size-5" />
          </div>
          <h3 className="font-semibold text-sm text-foreground">No papers in this collection</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto px-4">
            Save papers from Search Explorer or paper details to start building this set.
          </p>
          <Link
            to="/search"
            className="mt-6 inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-xs font-semibold text-brand-foreground glow-brand"
            style={{ background: "var(--gradient-brand)" }}
          >
            Browse papers <ArrowUpRight className="size-3" />
          </Link>
        </div>
      )}

      {!loading && savedPapers.length > 0 && (
        <div className="space-y-3">
          {savedPapers.map((p) => (
            <Card key={p.id} className="hover:border-brand/40 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">
                    <span className="px-2 py-0.5 rounded bg-brand/10 text-brand">{p.source}</span>
                    <span className="truncate">{p.journal}</span>
                    <span>· {p.year}</span>
                  </div>
                  <Link to="/papers/$id" params={{ id: p.id }} className="text-base font-semibold text-foreground hover:text-brand transition-colors">
                    {p.title}
                  </Link>
                  <div className="text-xs text-muted-foreground mt-1 truncate">{p.authors.join(", ")}</div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <SaveToCollectionButton paperId={p.id} paperTitle={p.title} />
                  <button
                    onClick={() => onRemove(p.id)}
                    className="p-1.5 rounded-md border border-border hover:border-destructive/40 hover:text-destructive transition-colors"
                    title="Remove from this collection"
                    disabled={removeMutation.isPending}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                  <Link
                    to="/papers/$id"
                    params={{ id: p.id }}
                    className="p-1.5 rounded-md border border-border hover:border-brand/40 hover:text-brand transition-colors"
                    title="Open paper"
                  >
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppLayout>
  );
}

