import React, { useState, useMemo, useEffect } from "react";
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
import {
  History,
  Trash2,
  TrendingUp,
  Sparkles,
  FolderOpen,
  Brain,
  Loader2,
  ChevronRight,
  AlertTriangle,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";

export type AiHistoryTabFilter = "ALL" | "COLLECTION_ANALYSIS" | "TRENDS";

interface AiHistoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectHistory: (
    resultData: any,
    timestampStr: string,
    type: "TOP_TRENDS" | "SINGLE_KEYWORD" | "COLLECTION_ANALYSIS"
  ) => void;
  defaultTab?: AiHistoryTabFilter;
}

function cleanCollectionSummary(text?: string): string {
  if (!text) return "";
  let cleaned = text
    .trim()
    .replace(/^"|"$/g, "")
    .replace(/^This collection of papers focuses on\s*/i, "")
    .replace(/^This collection focuses on\s*/i, "")
    .replace(/^This collection of papers\s*/i, "")
    .replace(/^This collection\s*/i, "");

  if (cleaned.length > 0) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
  return cleaned;
}

function AiHistoryItemCard({
  item,
  selectedIdForLoad,
  isLoadingDetail,
  onSelect,
  onDelete,
  deleteMutationPending,
  deleteMutationVariables,
  formatItemDate,
}: {
  item: AiAnalysisHistorySummaryItem;
  selectedIdForLoad: number | null;
  isLoadingDetail: boolean;
  onSelect: (id: number) => void;
  onDelete: (e: React.MouseEvent, id: number) => void;
  deleteMutationPending: boolean;
  deleteMutationVariables?: number;
  formatItemDate: (dateStr: string) => string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { data: detailData, isLoading: loadingPaperList } = useAiHistoryDetail(
    isExpanded ? item.id : null
  );

  const isLoadingThis = selectedIdForLoad === item.id && isLoadingDetail;
  const isDeleting = deleteMutationPending && deleteMutationVariables === item.id;
  const isCollection = item.analysisType === "COLLECTION_ANALYSIS";
  const collectionTitle =
    isCollection && item.targetKeywords?.[0] ? item.targetKeywords[0] : "Collection Analysis";
  const cleanedSummary = isCollection ? cleanCollectionSummary(item.overallVerdict) : "";

  return (
    <div
      onClick={() => onSelect(item.id)}
      className={`group relative p-4 rounded-xl border border-border bg-card hover:border-brand/40 hover:shadow-md transition-all cursor-pointer space-y-2.5 ${
        isLoadingThis ? "opacity-75 bg-brand/5 border-brand" : ""
      } ${isDeleting ? "opacity-30 pointer-events-none" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap text-[10px] text-muted-foreground font-mono">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand/10 text-brand font-bold uppercase tracking-wider">
              {isCollection ? <FolderOpen className="size-3" /> : <Sparkles className="size-3" />}
              {isCollection
                ? "Collection"
                : item.analysisType === "TOP_TRENDS"
                ? "Top Trends"
                : "Single Keyword"}
            </span>
            <span>·</span>
            <span className="font-semibold text-muted-foreground">
              {formatItemDate(item.createdAt)}
            </span>
          </div>

          {isCollection ? (
            <h4 className="font-bold text-sm text-foreground group-hover:text-brand transition-colors pt-1 truncate">
              {collectionTitle}
            </h4>
          ) : null}
        </div>

        <button
          onClick={(e) => onDelete(e, item.id)}
          className="p-1 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 rounded transition-colors cursor-pointer shrink-0"
          title="Delete item"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {isCollection ? (
        <>
          {item.targetKeywords && item.targetKeywords.length > 1 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {item.targetKeywords.slice(1).map((clusterName, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md bg-brand/10 border border-brand/20 text-brand text-[10px] font-semibold flex items-center gap-1"
                >
                  <Sparkles className="size-2.5" />
                  {clusterName}
                </span>
              ))}
            </div>
          )}
          {cleanedSummary ? (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed bg-secondary/30 p-2.5 rounded-xl border border-border/40 font-normal">
              "{cleanedSummary}"
            </p>
          ) : null}

          {/* Accordion Toggle for Paper List */}
          <div className="pt-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded((prev) => !prev);
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-border/60 bg-secondary/20 hover:bg-secondary/40 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <FileText className="size-3.5 text-brand" />
                <span>{isExpanded ? "Hide Analyzed Papers" : "View Analyzed Papers"}</span>
              </span>
              {isExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </button>

            {isExpanded && (
              <div
                className="mt-1.5 p-2 bg-secondary/30 rounded-xl border border-border/50 space-y-1.5 max-h-44 overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {loadingPaperList ? (
                  <div className="flex items-center gap-2 py-2 px-1 text-muted-foreground text-[11px]">
                    <Loader2 className="size-3.5 animate-spin text-brand" />
                    <span>Loading paper list...</span>
                  </div>
                ) : (
                  (() => {
                    const result = detailData?.result;
                    const papersMap = new Map<
                      string,
                      { title: string; paperId?: number; tag?: string }
                    >();

                    result?.corePapers?.forEach((cp: any) => {
                      if (cp.title) {
                        papersMap.set(cp.title, {
                          title: cp.title,
                          paperId: cp.paperId,
                          tag: "Core",
                        });
                      }
                    });

                    result?.outliers?.forEach((op: any) => {
                      if (op.title && !papersMap.has(op.title)) {
                        papersMap.set(op.title, {
                          title: op.title,
                          paperId: op.paperId,
                          tag: "Outlier",
                        });
                      }
                    });

                    result?.topicClusters?.forEach((tc: any) => {
                      tc.papers?.forEach((p: any) => {
                        if (p.title && !papersMap.has(p.title)) {
                          papersMap.set(p.title, {
                            title: p.title,
                            paperId: p.paperId,
                            tag: tc.name,
                          });
                        }
                      });
                    });

                    const papersList = Array.from(papersMap.values());

                    if (papersList.length === 0) {
                      return (
                        <div className="text-[11px] text-muted-foreground p-2 italic">
                          No paper details available for this session.
                        </div>
                      );
                    }

                    return papersList.map((p, idx) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between gap-2 p-1.5 rounded-lg bg-card/60 hover:bg-card border border-border/30 transition-colors"
                      >
                        <div className="flex items-start gap-1.5 min-w-0 flex-1">
                          <FileText className="size-3 text-muted-foreground shrink-0 mt-0.5" />
                          <span className="text-[11px] font-medium text-foreground line-clamp-2 leading-snug">
                            {p.title}
                          </span>
                        </div>
                        {p.tag && (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 ${
                              p.tag === "Core"
                                ? "bg-brand/10 text-brand border border-brand/20"
                                : p.tag === "Outlier"
                                ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                : "bg-secondary text-muted-foreground"
                            }`}
                          >
                            {p.tag}
                          </span>
                        )}
                      </div>
                    ));
                  })()
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {item.overallVerdict && (
            <div className="pt-0.5">
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
            </div>
          )}
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
        </>
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
}

export function AiHistoryDrawer({
  open,
  onOpenChange,
  onSelectHistory,
  defaultTab = "ALL",
}: AiHistoryDrawerProps) {
  const [selectedIdForLoad, setSelectedIdForLoad] = useState<number | null>(null);
  const [isConfirmingClearAll, setIsConfirmingClearAll] = useState(false);
  const [activeTab, setActiveTab] = useState<AiHistoryTabFilter>(defaultTab);

  useEffect(() => {
    if (open) {
      setActiveTab(defaultTab);
    }
  }, [open, defaultTab]);

  const { data: historyPage, isLoading, isError } = useAiHistoryList(0, 20);
  const deleteMutation = useDeleteAiHistory();
  const clearAllMutation = useClearAllAiHistory();

  // Fetch detail when user clicks an item
  const { data: detailData, isLoading: isLoadingDetail } = useAiHistoryDetail(selectedIdForLoad);

  React.useEffect(() => {
    if (detailData && selectedIdForLoad) {
      const dateObj = new Date(detailData.createdAt);
      const formattedTimestamp = `${dateObj.toLocaleDateString(
        "en-US"
      )} ${dateObj.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })}`;
      onSelectHistory(detailData.result, formattedTimestamp, detailData.analysisType);
      setSelectedIdForLoad(null);
      onOpenChange(false);
      toast.success("Loaded historical AI analysis report");
    }
  }, [detailData, selectedIdForLoad, onSelectHistory, onOpenChange]);

  const items = historyPage?.content ?? [];

  const filteredItems = useMemo(() => {
    if (activeTab === "COLLECTION_ANALYSIS") {
      return items.filter((i) => i.analysisType === "COLLECTION_ANALYSIS");
    }
    if (activeTab === "TRENDS") {
      return items.filter(
        (i) => i.analysisType === "TOP_TRENDS" || i.analysisType === "SINGLE_KEYWORD"
      );
    }
    return items;
  }, [items, activeTab]);

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
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col bg-background border-l border-border"
      >
        {/* Header */}
        <div className="p-6 border-b border-border bg-card/50">
          <SheetHeader className="text-left space-y-1">
            <div className="flex items-center justify-between pr-6">
              <div className="flex items-center gap-2 text-brand">
                <History className="size-5" />
                <SheetTitle className="text-base font-bold text-foreground">
                  AI Analysis History
                </SheetTitle>
              </div>
              {items.length > 0 &&
                (!isConfirmingClearAll ? (
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
                ))}
            </div>
            <SheetDescription className="text-xs text-muted-foreground">
              Review and restore your past Groq AI analysis sessions.
            </SheetDescription>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary/50 border border-border mt-3">
              <button
                onClick={() => setActiveTab("ALL")}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "ALL"
                    ? "bg-card text-foreground shadow-sm font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All ({items.length})
              </button>
              <button
                onClick={() => setActiveTab("COLLECTION_ANALYSIS")}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "COLLECTION_ANALYSIS"
                    ? "bg-card text-foreground shadow-sm font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Collections ({items.filter((i) => i.analysisType === "COLLECTION_ANALYSIS").length})
              </button>
              <button
                onClick={() => setActiveTab("TRENDS")}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "TRENDS"
                    ? "bg-card text-foreground shadow-sm font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Trends (
                {
                  items.filter(
                    (i) => i.analysisType === "TOP_TRENDS" || i.analysisType === "SINGLE_KEYWORD"
                  ).length
                }
                )
              </button>
            </div>
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

          {!isLoading && !isError && filteredItems.length === 0 && (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-2 border border-dashed border-border rounded-2xl bg-secondary/10">
              <div className="size-10 bg-secondary/50 rounded-full flex items-center justify-center text-muted-foreground">
                <Brain className="size-5" />
              </div>
              <p className="text-xs font-bold text-foreground">No analysis history found</p>
              <p className="text-[11px] text-muted-foreground max-w-xs">
                {activeTab === "COLLECTION_ANALYSIS"
                  ? 'Run "Analyze with AI" in Collections to save your first collection session.'
                  : activeTab === "TRENDS"
                  ? 'Run an "Analyze with AI" query on the Trend Analytics dashboard to save your first trend session.'
                  : "Run AI analysis on Collections or Trend Analytics to save your sessions."}
              </p>
            </div>
          )}

          {!isLoading &&
            filteredItems.map((item: AiAnalysisHistorySummaryItem) => (
              <AiHistoryItemCard
                key={item.id}
                item={item}
                selectedIdForLoad={selectedIdForLoad}
                isLoadingDetail={isLoadingDetail}
                onSelect={(id) => setSelectedIdForLoad(id)}
                onDelete={handleDeleteItem}
                deleteMutationPending={deleteMutation.isPending}
                deleteMutationVariables={deleteMutation.variables}
                formatItemDate={formatItemDate}
              />
            ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

