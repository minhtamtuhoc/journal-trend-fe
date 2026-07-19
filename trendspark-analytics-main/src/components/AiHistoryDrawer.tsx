import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  useAiHistoryList,
  useDeleteAiHistory,
  useClearAllAiHistory,
  useAiHistoryDetail,
  AiAnalysisHistorySummaryItem,
} from "@/hooks/data/use-ai-history";
import { History, Trash2, TrendingUp, Sparkles, Brain, Loader2, ChevronRight, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface AiHistoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectHistory: (resultData: any, timestampStr: string) => void;
}

export function AiHistoryDrawer({ open, onOpenChange, onSelectHistory }: AiHistoryDrawerProps) {
  const [selectedIdForLoad, setSelectedIdForLoad] = useState<number | null>(null);
  const [isConfirmingClearAll, setIsConfirmingClearAll] = useState(false);

  const { data: historyPage, isLoading, isError } = useAiHistoryList(0, 20);
  const deleteMutation = useDeleteAiHistory();
  const clearAllMutation = useClearAllAiHistory();

  // Fetch detail when user clicks an item
  const { data: detailData, isLoading: isLoadingDetail } = useAiHistoryDetail(selectedIdForLoad);

  React.useEffect(() => {
    if (detailData && selectedIdForLoad) {
      const dateObj = new Date(detailData.createdAt);
      const formattedTimestamp = `${dateObj.toLocaleDateString("en-US")} ${dateObj.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })}`;
      onSelectHistory(detailData.result, formattedTimestamp);
      setSelectedIdForLoad(null);
      onOpenChange(false);
      toast.success("Loaded historical AI analysis report");
    }
  }, [detailData, selectedIdForLoad, onSelectHistory, onOpenChange]);

  const items = historyPage?.content ?? [];

  const handleDeleteItem = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Analysis history item deleted"),
      onError: (err) => toast.error(`Failed to delete: ${err.message}`),
    });
  };

  const handleClearAll = () => {
    clearAllMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success("All AI analysis history cleared");
        setIsConfirmingClearAll(false);
      },
      onError: (err) => toast.error(`Failed to clear history: ${err.message}`),
    });
  };

  const formatItemDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${d.toLocaleDateString("en-US")} ${d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col bg-background border-l border-border">
        {/* Header */}
        <div className="p-6 border-b border-border bg-card/50">
          <SheetHeader className="text-left space-y-1">
            <div className="flex items-center justify-between pr-6">
              <div className="flex items-center gap-2 text-brand">
                <History className="size-5" />
                <SheetTitle className="text-base font-bold text-foreground">AI Analysis History</SheetTitle>
              </div>
              {items.length > 0 && (
                !isConfirmingClearAll ? (
                  <button
                    onClick={() => setIsConfirmingClearAll(true)}
                    className="text-[11px] text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1 cursor-pointer font-medium"
                    title="Clear all history"
                  >
                    <Trash2 className="size-3.5" />
                    <span>Clear All</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 bg-destructive/10 px-2 py-1 rounded-md border border-destructive/20">
                    <span className="text-[10px] text-destructive font-semibold">Confirm?</span>
                    <button
                      onClick={handleClearAll}
                      disabled={clearAllMutation.isPending}
                      className="text-[10px] bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded font-bold hover:bg-destructive/90 cursor-pointer disabled:opacity-50"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setIsConfirmingClearAll(false)}
                      className="text-[10px] text-muted-foreground hover:text-foreground font-semibold cursor-pointer"
                    >
                      No
                    </button>
                  </div>
                )
              )}
            </div>
            <SheetDescription className="text-xs text-muted-foreground">
              Review and restore your past Groq AI trend analysis sessions.
            </SheetDescription>
          </SheetHeader>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading && (
            <div className="h-40 flex flex-col items-center justify-center space-y-2 text-muted-foreground">
              <Loader2 className="size-6 animate-spin text-brand" />
              <p className="text-xs font-medium">Loading history...</p>
            </div>
          )}

          {isError && (
            <div className="p-4 border border-destructive/20 rounded-xl bg-destructive/10 text-destructive text-xs flex items-center gap-2">
              <AlertTriangle className="size-4 shrink-0" />
              <span>Failed to load history. Please log in or try again.</span>
            </div>
          )}

          {!isLoading && !isError && items.length === 0 && (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-2 border border-dashed border-border rounded-2xl bg-secondary/10">
              <div className="size-10 bg-secondary/50 rounded-full flex items-center justify-center text-muted-foreground">
                <Brain className="size-5" />
              </div>
              <p className="text-xs font-bold text-foreground">No analysis history yet</p>
              <p className="text-[11px] text-muted-foreground max-w-xs">
                Run an "Analyze with AI" query on the Trend Analytics dashboard to save your first session.
              </p>
            </div>
          )}

          {!isLoading && items.map((item: AiAnalysisHistorySummaryItem) => {
            const isLoadingThis = selectedIdForLoad === item.id && isLoadingDetail;
            const isDeleting = deleteMutation.isPending && deleteMutation.variables === item.id;

            return (
              <div
                key={item.id}
                onClick={() => setSelectedIdForLoad(item.id)}
                className={`group relative p-4 rounded-xl border border-border bg-card hover:border-brand/40 hover:shadow-md transition-all cursor-pointer space-y-2.5 ${
                  isLoadingThis ? "opacity-75 bg-brand/5 border-brand" : ""
                } ${isDeleting ? "opacity-30 pointer-events-none" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-[10px] font-bold text-foreground uppercase tracking-wider">
                        <Sparkles className="size-2.5 text-brand" />
                        {item.analysisType === "TOP_TRENDS" ? "Top Trends" : "Single Keyword"}
                      </span>
                      {item.overallVerdict && (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            item.overallVerdict === "GROWING"
                              ? "bg-success/15 text-success"
                              : item.overallVerdict === "MIXED" || item.overallVerdict === "STABLE"
                              ? "bg-amber-500/10 text-amber-500"
                              : "bg-destructive/15 text-destructive"
                          }`}
                        >
                          <TrendingUp className="size-2.5" />
                          {item.overallVerdict}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-muted-foreground font-medium">
                      {formatItemDate(item.createdAt)}
                    </p>
                  </div>

                  <button
                    onClick={(e) => handleDeleteItem(e, item.id)}
                    className="p-1 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 rounded transition-colors cursor-pointer"
                    title="Delete item"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>

                {/* Keywords list */}
                {item.targetKeywords && item.targetKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {item.targetKeywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-full bg-secondary/60 text-[10px] font-semibold text-foreground"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}

                <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] font-semibold text-brand group-hover:translate-x-0.5 transition-transform">
                  <span>{isLoadingThis ? "Loading report..." : "Restore & View Report"}</span>
                  {isLoadingThis ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <ChevronRight className="size-3.5" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
