import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Card } from "@/components/Card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, ArrowUpRight, Trash2, FolderOpen, Quote, Sparkles, CheckSquare, Square, History, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { useAuth } from "@/auth";
import { ApiError } from "@/api/errors";

import { useCollection, useRemovePaperFromCollection } from "@/hooks/data/use-collections";
import { usePapersByIds } from "@/hooks/data/use-papers";
import { SaveToCollectionButton } from "@/components/SaveToCollectionButton";
import { CitationExportModal } from "@/components/CitationExportModal";
import { AiCollectionAnalysisSheet } from "@/components/AiCollectionAnalysisSheet";
import { AiHistoryDrawer } from "@/components/AiHistoryDrawer";
import { formatTimeAgo } from "@/lib/time";
import type { Paper } from "@/types/domain";
import type { AiCollectionAnalysisResponse, AiCollectionAnalysisRequest } from "@/types/ai-collection-analysis";

export const Route = createFileRoute("/collections/$collectionId")({
  component: CollectionDetailPage,
});

type SortMode = "recent" | "newest" | "oldest";

function CollectionDetailPage() {
  const { collectionId } = Route.useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: collection, isLoading: isLoadingCollection } = useCollection(collectionId);
  const { data: papers = [], isLoading: isLoadingPapers } = usePapersByIds(collection?.paperIds ?? []);
  const removeMutation = useRemovePaperFromCollection();

  const [sort, setSort] = useState<SortMode>("recent");
  const [citeModalOpen, setCiteModalOpen] = useState(false);
  const [selectedPapersForCite, setSelectedPapersForCite] = useState<Paper | Paper[] | null>(null);

  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedPaperIds, setSelectedPaperIds] = useState<Set<string>>(new Set());
  const [analysisSheetOpen, setAnalysisSheetOpen] = useState(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [currentAiAnalysis, setCurrentAiAnalysis] = useState<AiCollectionAnalysisResponse | null>(null);
  const [analysisTimestamp, setAnalysisTimestamp] = useState<string | undefined>();

  const aiStorageKey = user?.email
    ? `journal_trend_ai_collection_analysis_${collectionId}_${user.email.toLowerCase()}`
    : null;

  useEffect(() => {
    if (typeof window === "undefined" || !aiStorageKey) {
      setCurrentAiAnalysis(null);
      setAnalysisTimestamp(undefined);
      return;
    }
    try {
      const cached = localStorage.getItem(aiStorageKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        setCurrentAiAnalysis(parsed.data);
        setAnalysisTimestamp(parsed.timestamp);
      }
    } catch {
      setCurrentAiAnalysis(null);
    }
  }, [aiStorageKey]);

  const analyzeMutation = useMutation<
    AiCollectionAnalysisResponse,
    Error,
    AiCollectionAnalysisRequest
  >({
    mutationFn: async (payload) => {
      const res = await apiClient.post<{ data: AiCollectionAnalysisResponse }>(
        `/v1/ai/analyze-collection/${collectionId}`,
        payload
      );
      return res.data;
    },
    onSuccess: (data) => {
      const now = new Date();
      const timestamp = `${now.toLocaleDateString("en-US")} ${now.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })}`;
      setCurrentAiAnalysis(data);
      setAnalysisTimestamp(timestamp);
      setAnalysisSheetOpen(true);
      if (aiStorageKey) {
        try {
          localStorage.setItem(aiStorageKey, JSON.stringify({ data, timestamp }));
        } catch {}
      }
      queryClient.invalidateQueries({ queryKey: ["ai-history-list"] });
      toast.success(`AI Analysis complete · ${data.analyzedPaperCount} papers analyzed`);
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error(err.message || "Failed to analyze collection with AI");
      }
    },
  });

  const handleRunAnalysis = () => {
    if (isSelectMode) {
      if (selectedPaperIds.size === 0) {
        toast.error("Please select at least 1 paper to analyze, or turn off selection mode for auto-select.");
        return;
      }
      if (selectedPaperIds.size > 30) {
        toast.error(`You selected ${selectedPaperIds.size} papers, but at most 30 can be analyzed at once.`);
        return;
      }
      const paperIdsNum = Array.from(selectedPaperIds).map(Number).filter((n) => !isNaN(n));
      analyzeMutation.mutate({ paperIds: paperIdsNum });
    } else {
      analyzeMutation.mutate({});
    }
  };

  const toggleSelectPaper = (id: string) => {
    setSelectedPaperIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

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
  const isOverSelectedCap = selectedPaperIds.size > 30;

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
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/collections"
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium border border-border bg-surface/50 hover:bg-surface transition-colors"
            >
              <ArrowLeft className="size-4" /> Back
            </Link>

            {savedPapers.length > 0 && (
              <>
                {/* AI History Button */}
                <button
                  onClick={() => setHistoryDrawerOpen(true)}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold border border-border hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                  title="View past AI analysis history"
                >
                  <History className="size-3.5" />
                  <span className="hidden md:inline">History</span>
                </button>

                {/* AI Analysis Toggle Select Mode */}
                <button
                  onClick={() => {
                    setIsSelectMode(!isSelectMode);
                    if (!isSelectMode && selectedPaperIds.size === 0) {
                      // Pre-select up to 30 papers by default when opening selection mode
                      const initial = new Set(savedPapers.slice(0, 30).map((p) => p.id));
                      setSelectedPaperIds(initial);
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    isSelectMode
                      ? "border-brand/40 bg-brand/10 text-brand"
                      : "border-border hover:bg-secondary/50 text-muted-foreground hover:text-foreground"
                  }`}
                  title="Select specific papers to analyze with AI"
                >
                  {isSelectMode ? <CheckSquare className="size-3.5" /> : <Square className="size-3.5" />}
                  <span className="hidden sm:inline">Select Mode</span>
                </button>

                {/* Analyze with AI Button */}
                <button
                  onClick={handleRunAnalysis}
                  disabled={analyzeMutation.isPending || (isSelectMode && isOverSelectedCap)}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-xs font-semibold text-brand-foreground glow-brand disabled:opacity-50 transition-all cursor-pointer"
                  style={{ background: "var(--gradient-brand)" }}
                  title="Analyze collection papers with Groq AI"
                >
                  {analyzeMutation.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="size-3.5" />
                  )}
                  <span>{analyzeMutation.isPending ? "Analyzing..." : "Analyze with AI"}</span>
                </button>

                {currentAiAnalysis && !analyzeMutation.isPending && (
                  <button
                    onClick={() => setAnalysisSheetOpen(true)}
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold border border-brand/40 bg-brand/15 text-brand hover:bg-brand/25 transition-all cursor-pointer"
                    title="View last AI analysis report"
                  >
                    <span>View AI Report</span>
                  </button>
                )}

                {/* Export Citations */}
                <button
                  onClick={() => {
                    setSelectedPapersForCite(savedPapers);
                    setCiteModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold border border-brand/30 bg-brand/10 text-brand hover:bg-brand/20 transition-all cursor-pointer"
                  title="Export citations for all papers in this collection"
                >
                  <Quote className="size-3.5" />
                  <span className="hidden sm:inline">Export Citations</span>
                </button>
              </>
            )}

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

      {/* Selection Mode Counter Banner */}
      {isSelectMode && savedPapers.length > 0 && (
        <div className="mb-4 p-3 rounded-xl border border-brand/30 bg-brand/5 flex items-center justify-between gap-4">
          <div className="text-xs font-medium text-foreground flex items-center gap-2">
            <CheckSquare className="size-4 text-brand" />
            <span>Select papers to analyze (max 30):</span>
            <span
              className={`font-bold font-mono px-2 py-0.5 rounded text-[11px] ${
                isOverSelectedCap
                  ? "bg-destructive/15 text-destructive border border-destructive/30"
                  : "bg-brand/15 text-brand"
              }`}
            >
              {selectedPaperIds.size} / 30 selected
            </span>
            {isOverSelectedCap && (
              <span className="text-destructive font-semibold text-xs">
                Exceeds 30 paper limit!
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const allIds = new Set(savedPapers.slice(0, 30).map((p) => p.id));
                setSelectedPaperIds(allIds);
              }}
              className="text-xs font-semibold text-brand hover:underline cursor-pointer"
            >
              Select Top 30
            </button>
            <button
              onClick={() => setSelectedPaperIds(new Set())}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

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
          {savedPapers.map((p) => {
            const isSelected = selectedPaperIds.has(p.id);

            return (
              <Card
                key={p.id}
                onClick={() => {
                  if (isSelectMode) toggleSelectPaper(p.id);
                }}
                className={`transition-all ${
                  isSelectMode ? "cursor-pointer select-none" : ""
                } ${
                  isSelected
                    ? "border-brand/60 bg-brand/5 shadow-sm"
                    : "hover:border-brand/40"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {isSelectMode && (
                    <div className="pt-1 shrink-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectPaper(p.id)}
                        className="size-4 rounded border-border text-brand focus:ring-brand cursor-pointer"
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">
                      <span className="px-2 py-0.5 rounded bg-brand/10 text-brand">{p.source}</span>
                      <span className="truncate">{p.journal}</span>
                      <span>· {p.year}</span>
                    </div>
                    <Link
                      to="/papers/$id"
                      params={{ id: p.id }}
                      onClick={(e) => {
                        if (isSelectMode) e.stopPropagation();
                      }}
                      className="text-base font-semibold text-foreground hover:text-brand transition-colors"
                    >
                      {p.title}
                    </Link>
                    <div className="text-xs text-muted-foreground mt-1 truncate">{p.authors.join(", ")}</div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        if (isSelectMode) e.stopPropagation();
                        setSelectedPapersForCite(p);
                        setCiteModalOpen(true);
                      }}
                      className="p-1.5 rounded-md border border-border hover:border-brand/40 hover:text-brand transition-colors text-muted-foreground"
                      title="Cite this paper"
                    >
                      <Quote className="size-3.5" />
                    </button>
                    <SaveToCollectionButton paperId={p.id} paperTitle={p.title} />
                    <button
                      onClick={(e) => {
                        if (isSelectMode) e.stopPropagation();
                        onRemove(p.id);
                      }}
                      className="p-1.5 rounded-md border border-border hover:border-destructive/40 hover:text-destructive transition-colors"
                      title="Remove from this collection"
                      disabled={removeMutation.isPending}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                    <Link
                      to="/papers/$id"
                      params={{ id: p.id }}
                      onClick={(e) => {
                        if (isSelectMode) e.stopPropagation();
                      }}
                      className="p-1.5 rounded-md border border-border hover:border-brand/40 hover:text-brand transition-colors"
                      title="Open paper"
                    >
                      <ArrowUpRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* AI Analysis Sheet Result */}
      <AiCollectionAnalysisSheet
        open={analysisSheetOpen}
        onOpenChange={setAnalysisSheetOpen}
        data={currentAiAnalysis}
        timestamp={analysisTimestamp}
      />

      {/* AI History Drawer */}
      <AiHistoryDrawer
        open={historyDrawerOpen}
        onOpenChange={setHistoryDrawerOpen}
        onSelectHistory={(resultData, timestampStr) => {
          // If the selected history item is a COLLECTION_ANALYSIS report, view it in the sheet
          if (resultData && typeof resultData === "object") {
            setCurrentAiAnalysis(resultData);
            setAnalysisTimestamp(timestampStr);
            setAnalysisSheetOpen(true);
          }
        }}
      />

      {/* Citation Export Modal */}
      <CitationExportModal
        open={citeModalOpen}
        onOpenChange={setCiteModalOpen}
        papers={selectedPapersForCite}
        collectionTitle={collection?.name}
      />
    </AppLayout>
  );
}


