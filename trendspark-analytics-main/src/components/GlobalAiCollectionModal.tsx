import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Layers, CheckSquare, Square, Loader2, BookOpen, CheckCircle2, ListFilter, FileText } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import { useAuth } from "@/auth";
import { toast } from "sonner";
import { ApiError } from "@/api/errors";
import { usePapersByIds } from "@/hooks/data/use-papers";
import type { Collection } from "@/types/domain";
import type { AiCollectionAnalysisResponse, AiCollectionAnalysisRequest } from "@/types/ai-collection-analysis";

interface GlobalAiCollectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collections: Collection[];
  onAnalysisSuccess: (response: AiCollectionAnalysisResponse, timestamp: string, collectionId: string) => void;
}

export function GlobalAiCollectionModal({
  open,
  onOpenChange,
  collections,
  onAnalysisSuccess,
}: GlobalAiCollectionModalProps) {
  const { user } = useAuth();
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedPaperIds, setSelectedPaperIds] = useState<Set<string>>(new Set());

  // Default select first collection if available when opening modal
  useEffect(() => {
    if (open) {
      if (collections.length > 0 && !selectedCollectionId) {
        setSelectedCollectionId(collections[0].id);
      }
      setIsSelectMode(false);
      setSelectedPaperIds(new Set());
    }
  }, [open, collections]);

  const activeCollection = useMemo(() => {
    return collections.find((c) => c.id === selectedCollectionId) ?? null;
  }, [collections, selectedCollectionId]);

  const paperIds = activeCollection?.paperIds ?? [];
  const { data: papers = [], isLoading: isLoadingPapers } = usePapersByIds(paperIds);

  const togglePaperSelection = (paperId: string) => {
    setSelectedPaperIds((prev) => {
      const next = new Set(prev);
      if (next.has(paperId)) {
        next.delete(paperId);
      } else {
        if (next.size >= 30) {
          toast.warning("Maximum 30 papers allowed per AI analysis.");
          return prev;
        }
        next.add(paperId);
      }
      return next;
    });
  };

  const selectAllPapers = () => {
    if (papers.length > 30) {
      toast.info("Selected first 30 papers (maximum supported per analysis).");
      setSelectedPaperIds(new Set(papers.slice(0, 30).map((p) => p.id)));
    } else {
      setSelectedPaperIds(new Set(papers.map((p) => p.id)));
    }
  };

  const deselectAllPapers = () => {
    setSelectedPaperIds(new Set());
  };

  const queryClient = useQueryClient();

  const aiMutation = useMutation({
    mutationFn: async ({ collectionId, req }: { collectionId: string; req: AiCollectionAnalysisRequest }) => {
      const res = await apiClient.post<{ data: AiCollectionAnalysisResponse }>(
        `/v1/ai/analyze-collection/${collectionId}`,
        req,
        { timeoutMs: 120_000 }
      );
      return res.data;
    },
    onSuccess: (responseData) => {
      queryClient.invalidateQueries({ queryKey: ["ai-history-list"] });
      const nowFormatted = new Date().toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      if (user?.email && selectedCollectionId) {
        const key = `journal_trend_ai_collection_analysis_${selectedCollectionId}_${user.email.toLowerCase()}`;
        try {
          localStorage.setItem(key, JSON.stringify({ data: responseData, timestamp: nowFormatted }));
        } catch (e) {
          console.warn("Failed to cache AI analysis to localStorage:", e);
        }
      }

      toast.success(`AI Analysis complete for "${responseData.collectionName}"!`);
      onAnalysisSuccess(responseData, nowFormatted, selectedCollectionId);
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        if (error.status === 429) {
          toast.error("AI rate limit reached. Please try again in a few minutes.");
          return;
        }
        if (error.status === 400) {
          toast.error(error.message || "Cannot analyze collection with no valid papers.");
          return;
        }
        toast.error(error.message || "Failed to analyze collection.");
      } else {
        toast.error("An unexpected error occurred while analyzing collection.");
      }
    },
  });

  const handleStartAnalysis = () => {
    if (!selectedCollectionId || !activeCollection) {
      toast.error("Please select a collection first.");
      return;
    }

    if (activeCollection.paperIds.length === 0) {
      toast.error("The selected collection has no papers.");
      return;
    }

    const payload: AiCollectionAnalysisRequest = {};
    if (isSelectMode) {
      if (selectedPaperIds.size === 0) {
        toast.error("Please select at least 1 paper to analyze.");
        return;
      }
      payload.paperIds = Array.from(selectedPaperIds);
    }

    aiMutation.mutate({ collectionId: selectedCollectionId, req: payload });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl sm:max-w-2xl max-h-[90vh] flex flex-col p-6 bg-card border border-border shadow-2xl rounded-2xl z-50">
        <DialogHeader className="pb-2 border-b border-border/60">
          <div className="flex items-center gap-3 text-brand">
            <div className="p-2.5 rounded-xl bg-brand/10 border border-brand/20 text-brand">
              <Sparkles className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                AI Collection Analysis
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Synthesize research themes, gaps, and topic clusters from Groq AI.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto flex-1 pr-1 custom-scrollbar my-3">
          {/* STEP 1: SELECT COLLECTION */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Layers className="size-3.5 text-brand" />
              <span>1. Target Collection</span>
            </label>

            {collections.length === 0 ? (
              <p className="text-xs text-muted-foreground italic p-4 rounded-xl border border-border bg-secondary/10">
                No collections found. Create a collection first before running AI analysis.
              </p>
            ) : (
              <Select
                value={selectedCollectionId}
                onValueChange={(val) => {
                  setSelectedCollectionId(val);
                  setSelectedPaperIds(new Set());
                }}
              >
                <SelectTrigger className="w-full h-11 px-3.5 bg-secondary/30 border-border rounded-xl text-sm font-semibold text-foreground focus:ring-2 focus:ring-brand/40 transition-colors">
                  <SelectValue placeholder="Select a collection..." />
                </SelectTrigger>
                <SelectContent className="bg-card border border-border text-foreground rounded-xl shadow-2xl z-50 max-h-60">
                  {collections.map((c) => (
                    <SelectItem
                      key={c.id}
                      value={c.id}
                      className="cursor-pointer focus:bg-brand/10 focus:text-brand transition-colors py-2.5 px-3 rounded-lg"
                    >
                      <div className="flex items-center justify-between w-full gap-4">
                        <span className="font-semibold text-sm truncate max-w-[320px]">{c.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary/80 text-muted-foreground font-bold shrink-0">
                          {c.paperIds.length} paper{c.paperIds.length === 1 ? "" : "s"}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* STEP 2: SELECTION MODE & PAPERS */}
          {activeCollection && (
            <div className="space-y-4 pt-2 border-t border-border/60">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <BookOpen className="size-3.5 text-brand" />
                <span>2. Papers to Analyze</span>
              </label>

              {activeCollection.paperIds.length === 0 ? (
                <div className="p-4 rounded-xl border border-border bg-secondary/10 text-xs text-muted-foreground text-center">
                  This collection has no papers. Add papers to run AI analysis.
                </div>
              ) : (
                <>
                  {/* Mode Selector Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSelectMode(false);
                        setSelectedPaperIds(new Set());
                      }}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        !isSelectMode
                          ? "border-brand/50 bg-brand/10 text-foreground ring-1 ring-brand/30"
                          : "border-border bg-secondary/20 hover:border-brand/30 hover:bg-secondary/40 text-muted-foreground"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <FileText className="size-3.5 text-brand" />
                          Analyze All Papers
                        </span>
                        {!isSelectMode && <CheckCircle2 className="size-4 text-brand" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-snug">
                        Full collection analysis ({activeCollection.paperIds.length} paper{activeCollection.paperIds.length === 1 ? "" : "s"})
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsSelectMode(true)}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelectMode
                          ? "border-brand/50 bg-brand/10 text-foreground ring-1 ring-brand/30"
                          : "border-border bg-secondary/20 hover:border-brand/30 hover:bg-secondary/40 text-muted-foreground"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          <ListFilter className="size-3.5 text-brand" />
                          Custom Paper Selection
                        </span>
                        {isSelectMode && <CheckCircle2 className="size-4 text-brand" />}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-snug">
                        Choose specific papers (up to 30)
                      </p>
                    </button>
                  </div>

                  {/* Paper Checklist (Shown in Custom Selection Mode) */}
                  {isSelectMode && (
                    <div className="space-y-3 bg-secondary/15 p-4 rounded-xl border border-border">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          Selected: <strong className="text-brand font-mono font-bold">{selectedPaperIds.size}</strong> / {papers.length} (Max 30)
                        </span>
                        <div className="flex items-center gap-3 font-medium">
                          <button
                            type="button"
                            onClick={selectAllPapers}
                            className="hover:text-brand transition-colors text-[11px] underline underline-offset-2"
                          >
                            Select all
                          </button>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={deselectAllPapers}
                            className="hover:text-foreground transition-colors text-[11px] underline underline-offset-2"
                          >
                            Deselect all
                          </button>
                        </div>
                      </div>

                      {isLoadingPapers ? (
                        <div className="space-y-2">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-10 w-full rounded-lg" />
                          ))}
                        </div>
                      ) : (
                        <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                          {papers.map((p) => {
                            const checked = selectedPaperIds.has(p.id);
                            return (
                              <div
                                key={p.id}
                                onClick={() => togglePaperSelection(p.id)}
                                className={`p-2.5 rounded-lg border flex items-center justify-between gap-3 text-xs cursor-pointer transition-colors ${
                                  checked
                                    ? "border-brand/40 bg-brand/10 text-foreground font-medium"
                                    : "border-border/60 bg-card/60 text-muted-foreground hover:bg-secondary/40"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  {checked ? (
                                    <CheckSquare className="size-4 text-brand shrink-0" />
                                  ) : (
                                    <Square className="size-4 text-muted-foreground/60 shrink-0" />
                                  )}
                                  <span className="truncate">{p.title}</span>
                                </div>
                                <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                                  {p.year}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-border/60 flex items-center justify-between">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={aiMutation.isPending}
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleStartAnalysis}
            disabled={
              aiMutation.isPending ||
              !selectedCollectionId ||
              (activeCollection?.paperIds.length === 0) ||
              (isSelectMode && selectedPaperIds.size === 0)
            }
            className="gap-2 text-brand-foreground glow-brand px-5"
            style={{ background: "var(--gradient-brand)" }}
          >
            {aiMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Analyzing Collection...
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Run AI Analysis
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
