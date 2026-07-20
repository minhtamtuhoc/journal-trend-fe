import React from "react";
import { Link } from "@tanstack/react-router";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import type { AiCollectionAnalysisResponse } from "@/types/ai-collection-analysis";
import {
  Sparkles,
  Layers,
  TrendingUp,
  Puzzle,
  ExternalLink,
  BookOpen,
  Lightbulb,
  Users,
  Compass,
  FileText,
  Quote,
  Flame,
} from "lucide-react";

interface AiCollectionAnalysisSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: AiCollectionAnalysisResponse | null;
  timestamp?: string;
  onPaperClick?: (paperId: string) => void;
}

export function AiCollectionAnalysisSheet({
  open,
  onOpenChange,
  data,
  timestamp,
  onPaperClick,
}: AiCollectionAnalysisSheetProps) {
  if (!data) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl p-0 flex flex-col bg-background border-l border-border overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-10">
          <SheetHeader className="text-left space-y-2">
            <div className="flex items-center justify-between pr-8">
              <div className="flex items-center gap-2 text-brand">
                <div className="p-2 rounded-xl bg-brand/10 border border-brand/20 text-brand">
                  <Sparkles className="size-5 animate-pulse" />
                </div>
                <div>
                  <SheetTitle className="text-lg font-bold text-foreground">
                    AI Collection Analysis
                  </SheetTitle>
                  <p className="text-xs text-brand font-semibold truncate max-w-xs">
                    {data.collectionName}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand/10 text-brand border border-brand/20 text-[11px] font-bold">
                  Analyzed {data.analyzedPaperCount} / {data.paperCount} papers
                </span>
                {timestamp && (
                  <p className="text-[10px] text-muted-foreground font-mono mt-1">
                    {timestamp}
                  </p>
                )}
              </div>
            </div>
            <SheetDescription className="text-xs text-muted-foreground">
              Synthesized research insights, topic clustering, and key patterns from Groq AI.
            </SheetDescription>
          </SheetHeader>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* 1. Overall Summary */}
          {data.overallSummary && (
            <div className="p-5 rounded-2xl bg-card border border-border space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand">
                <FileText className="size-4" />
                <span>Executive Summary</span>
              </div>
              <p className="text-sm leading-relaxed text-foreground/90 font-normal">
                {data.overallSummary}
              </p>
            </div>
          )}

          {/* 2. Topic Clusters */}
          {data.topicClusters && data.topicClusters.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Layers className="size-4 text-brand" />
                <span>Topic Clusters ({data.topicClusters.length})</span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {data.topicClusters.map((cluster, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-border bg-secondary/20 hover:border-brand/40 transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <span className="size-5 rounded-full bg-brand/15 text-brand text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        {cluster.name}
                      </h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                        {cluster.paperIds?.length ?? 0} papers
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {cluster.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Trend Over Time & Commonalities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.trendOverTime && (
              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 uppercase tracking-wider">
                  <TrendingUp className="size-4" />
                  <span>Evolution Over Time</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {data.trendOverTime}
                </p>
              </div>
            )}

            {data.commonalities && (
              <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-wider">
                  <Puzzle className="size-4" />
                  <span>Commonalities & Themes</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {data.commonalities}
                </p>
              </div>
            )}
          </div>

          {/* 4. Core Papers */}
          {data.corePapers && data.corePapers.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Flame className="size-4 text-amber-500" />
                <span>Pivotal Core Papers</span>
              </div>

              <div className="space-y-2">
                {data.corePapers.map((cp) => {
                  const paperIdStr = String(cp.paperId);
                  return (
                    <div
                      key={cp.paperId}
                      className="p-3.5 rounded-xl border border-border bg-card hover:border-brand/40 transition-all space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <Link
                          to="/papers/$id"
                          params={{ id: paperIdStr }}
                          onClick={() => onPaperClick?.(paperIdStr)}
                          className="text-xs font-semibold text-foreground hover:text-brand transition-colors flex items-center gap-1.5 min-w-0"
                        >
                          <span className="truncate">{cp.title}</span>
                          <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
                        </Link>
                        {cp.citationCount != null && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 font-bold shrink-0">
                            <Quote className="size-2.5" /> {cp.citationCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {cp.reason}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. Outlier Papers */}
          {data.outliers && data.outliers.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Compass className="size-4 text-purple-400" />
                <span>Outliers & Unique Angles</span>
              </div>

              <div className="space-y-2">
                {data.outliers.map((op) => {
                  const paperIdStr = String(op.paperId);
                  return (
                    <div
                      key={op.paperId}
                      className="p-3.5 rounded-xl border border-border bg-card hover:border-purple-400/40 transition-all space-y-1.5"
                    >
                      <Link
                        to="/papers/$id"
                        params={{ id: paperIdStr }}
                        onClick={() => onPaperClick?.(paperIdStr)}
                        className="text-xs font-semibold text-foreground hover:text-purple-400 transition-colors flex items-center gap-1.5"
                      >
                        <span>{op.title}</span>
                        <ExternalLink className="size-3 text-muted-foreground shrink-0" />
                      </Link>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {op.reason}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6. Research Gaps */}
          {data.researchGaps && data.researchGaps.length > 0 && (
            <div className="p-4 rounded-xl border border-border bg-destructive/5 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-destructive uppercase tracking-wider">
                <BookOpen className="size-4" />
                <span>Identified Research Gaps</span>
              </div>
              <ul className="space-y-1.5 pl-4 list-disc text-xs text-muted-foreground">
                {data.researchGaps.map((gap, i) => (
                  <li key={i} className="leading-relaxed">
                    {gap}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 7. Collaboration Highlights */}
          {data.collaborationHighlights && (
            <div className="p-4 rounded-xl border border-border bg-card space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider">
                <Users className="size-4" />
                <span>Collaboration Highlights</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {data.collaborationHighlights}
              </p>
            </div>
          )}

          {/* 8. Strategic Recommendation */}
          {data.recommendation && (
            <div className="p-5 rounded-2xl border border-brand/30 bg-gradient-to-br from-brand/10 via-brand/5 to-transparent space-y-2 shadow-sm">
              <div className="flex items-center gap-2 text-xs font-bold text-brand uppercase tracking-wider">
                <Lightbulb className="size-4 animate-bounce" />
                <span>Strategic Recommendation</span>
              </div>
              <p className="text-xs text-foreground/90 font-medium leading-relaxed">
                {data.recommendation}
              </p>
            </div>
          )}

        </div>
      </SheetContent>
    </Sheet>
  );
}
