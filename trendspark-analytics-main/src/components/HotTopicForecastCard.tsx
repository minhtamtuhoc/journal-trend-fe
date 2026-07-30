import type { ForecastCategory, ForecastListItem } from "@/types/forecast";
import {
  Tooltip as UiTooltip,
  TooltipTrigger as UiTooltipTrigger,
  TooltipContent as UiTooltipContent,
  TooltipProvider as UiTooltipProvider,
} from "@/components/ui/tooltip";
import { ExternalLink, BookOpen } from "lucide-react";

const CATEGORY_BADGE: Record<ForecastCategory, { label: string; class: string }> = {
  EARLY_BOOM: { label: "Early Boom",    class: "bg-orange-500/15 text-orange-500 border-orange-500/30" },
  BREAKOUT:   { label: "Breakout",      class: "bg-purple-500/15 text-purple-500 border-purple-500/30" },
  STEADY:     { label: "Steady Growth", class: "bg-blue-500/15   text-blue-500   border-blue-500/30"   },
};
const FALLBACK_BADGE = { label: "Unknown", class: "bg-muted text-muted-foreground border-border" };

type Props = {
  items: ForecastListItem[];
  isLoading: boolean;
  months?: number;
  selectedKeywordId?: number | null;
  onSelect?: (keywordId: number) => void;
};

export function HotTopicForecastCard({ items, isLoading, months = 6, selectedKeywordId, onSelect }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pulse p-4">
        <div className="space-y-3">
          <div className="h-10 bg-secondary/40 rounded-xl" />
          <div className="h-10 bg-secondary/40 rounded-xl" />
          <div className="h-10 bg-secondary/40 rounded-xl" />
          <div className="h-10 bg-secondary/40 rounded-xl" />
          <div className="h-10 bg-secondary/40 rounded-xl" />
        </div>
        <div className="space-y-3">
          <div className="h-10 bg-secondary/40 rounded-xl" />
          <div className="h-10 bg-secondary/40 rounded-xl" />
          <div className="h-10 bg-secondary/40 rounded-xl" />
          <div className="h-10 bg-secondary/40 rounded-xl" />
          <div className="h-10 bg-secondary/40 rounded-xl" />
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-2xl h-[200px]">
        <p className="font-semibold text-foreground mb-1">No forecast data yet</p>
        <p className="text-xs max-w-xs">Click "Run Forecast" to generate it.</p>
      </div>
    );
  }

  const leftItems = items.slice(0, 5);
  const rightItems = items.slice(5, 10);

  const renderTable = (sliceItems: ForecastListItem[], startIndex: number) => {
    const tableMonthsHeader = sliceItems[0]?.forecastMonthsCount ?? months;
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              <th className="py-3 px-4 w-12 text-center">#</th>
              <th className="py-3 px-4">Keyword</th>
              <th className="py-3 px-4 text-center cursor-help">
                <UiTooltip>
                  <UiTooltipTrigger asChild>
                    <span className="underline decoration-dotted underline-offset-4 hover:opacity-85 transition-opacity">
                      sTPS
                    </span>
                  </UiTooltipTrigger>
                  <UiTooltipContent side="top" align="center" className="p-3 max-w-[300px] bg-popover text-popover-foreground border border-border shadow-lg rounded-xl pointer-events-auto">
                    <div className="space-y-1.5 text-xs font-sans text-left normal-case tracking-normal">
                      <p className="font-bold text-brand uppercase tracking-wider text-[10px]">
                        Scaled Trend Potential Score (sTPS)
                      </p>
                      <div className="text-[11px] text-muted-foreground leading-relaxed">
                        <p className="font-medium text-foreground mb-1">Formula:</p>
                        <code className="block bg-secondary/40 p-1.5 rounded-md font-mono text-[10px] mb-2 text-center text-foreground font-semibold">
                          (w_slope × Slope_norm + w_acc × Acc_norm + w_vol × Volume_norm) × 100
                        </code>
                        <p className="text-[10px] border-t border-border pt-1.5 leading-snug">
                          Standardized composite score (0-100) evaluating growth rate, speed change, and publication volume using SAW & Min-Max Normalization.
                        </p>
                        <div className="mt-2 text-[10px] border-t border-border pt-1.5 space-y-1">
                          <p className="font-semibold text-foreground flex items-center gap-1">
                            <BookOpen className="size-3 text-brand shrink-0" />
                            <span>Methodology References:</span>
                          </p>
                          <div className="flex flex-col gap-1 pl-4">
                            <a
                              href="https://doi.org/10.1287/opre.15.3.537"
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-brand hover:underline font-medium text-[10px] transition-colors"
                            >
                              <span>SAW Method (Fishburn 1967)</span>
                              <ExternalLink className="size-2.5 shrink-0" />
                            </a>
                            <a
                              href="https://doi.org/10.1016/C2009-0-61819-5"
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-brand hover:underline font-medium text-[10px] transition-colors"
                            >
                              <span>Min-Max Normalization (Han et al.)</span>
                              <ExternalLink className="size-2.5 shrink-0" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </UiTooltipContent>
                </UiTooltip>
              </th>
              <th className="py-3 px-4 text-center cursor-help">
                <UiTooltip>
                  <UiTooltipTrigger asChild>
                    <span className="underline decoration-dotted underline-offset-4 hover:opacity-85 transition-opacity">
                      {tableMonthsHeader}M Forecast
                    </span>
                  </UiTooltipTrigger>
                  <UiTooltipContent side="top" align="center" className="p-3 max-w-[300px] bg-popover text-popover-foreground border border-border shadow-lg rounded-xl pointer-events-auto">
                    <div className="space-y-1.5 text-xs font-sans text-left normal-case tracking-normal">
                      <p className="font-bold text-brand uppercase tracking-wider text-[10px]">
                        Predicted Publications ({tableMonthsHeader} Months)
                      </p>
                      <div className="text-[11px] text-muted-foreground leading-relaxed">
                        <p className="font-medium text-foreground mb-1">Formula:</p>
                        <code className="block bg-secondary/40 p-1.5 rounded-md font-mono text-[10px] mb-2 text-center text-foreground font-semibold">
                          Σ (Slope × Month + Intercept)
                        </code>
                        <p className="text-[10px] border-t border-border pt-1.5 leading-snug">
                          Extrapolated total publication count over the next {tableMonthsHeader} months using Linear Regression.
                        </p>
                        <div className="mt-2 text-[10px] border-t border-border pt-1.5 space-y-1">
                          <p className="font-semibold text-foreground flex items-center gap-1">
                            <BookOpen className="size-3 text-brand shrink-0" />
                            <span>Formula References:</span>
                          </p>
                          <div className="flex flex-col gap-1 pl-4">
                            <a
                              href="https://en.wikipedia.org/wiki/Simple_linear_regression"
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-brand hover:underline font-medium text-[10px] transition-colors"
                            >
                              <span>Simple Linear Regression (Wikipedia)</span>
                              <ExternalLink className="size-2.5 shrink-0" />
                            </a>
                            <a
                              href="https://otexts.com/fpp3/regression-intro.html"
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-brand hover:underline font-medium text-[10px] transition-colors"
                            >
                              <span>Regression Intro (fpp3)</span>
                              <ExternalLink className="size-2.5 shrink-0" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </UiTooltipContent>
                </UiTooltip>
              </th>
              <th className="py-3 px-4 text-center cursor-help">
                <UiTooltip>
                  <UiTooltipTrigger asChild>
                    <span className="underline decoration-dotted underline-offset-4 hover:opacity-85 transition-opacity">
                      Growth
                    </span>
                  </UiTooltipTrigger>
                  <UiTooltipContent side="top" align="center" className="p-3 max-w-[300px] bg-popover text-popover-foreground border border-border shadow-lg rounded-xl pointer-events-auto">
                    <div className="space-y-1.5 text-xs font-sans text-left normal-case tracking-normal">
                      <p className="font-bold text-brand uppercase tracking-wider text-[10px]">Net Growth Rate</p>
                      <div className="text-[11px] text-muted-foreground leading-relaxed">
                        <p className="font-medium text-foreground mb-1">Formula:</p>
                        <code className="block bg-secondary/40 p-1.5 rounded-md font-mono text-[10px] mb-2 text-center text-foreground font-semibold">
                          (Predicted₂ − Baseline) / Baseline × 100
                        </code>
                        <p className="text-[10px] border-t border-border pt-1.5 leading-snug">
                          Baseline = avg monthly × N months. Compares forecast output against recent average pace — <span className="text-destructive font-semibold">negative</span> means slower than current pace.
                        </p>
                        <div className="mt-2 text-[10px] border-t border-border pt-1.5 space-y-1">
                          <p className="font-semibold text-foreground flex items-center gap-1">
                            <BookOpen className="size-3 text-brand shrink-0" />
                            <span>Formula References:</span>
                          </p>
                          <div className="flex flex-col gap-1 pl-4">
                            <a
                              href="https://en.wikipedia.org/wiki/Percentage_change"
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-brand hover:underline font-medium text-[10px] transition-colors"
                            >
                              <span>Percentage Change (Wikipedia)</span>
                              <ExternalLink className="size-2.5 shrink-0" />
                            </a>
                            <a
                              href="https://en.wikipedia.org/wiki/Relative_growth_rate"
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-brand hover:underline font-medium text-[10px] transition-colors"
                            >
                              <span>Relative Growth Rate (Wikipedia)</span>
                              <ExternalLink className="size-2.5 shrink-0" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </UiTooltipContent>
                </UiTooltip>
              </th>
              <th className="py-3 px-4 cursor-help">
                <UiTooltip>
                  <UiTooltipTrigger asChild>
                    <span className="underline decoration-dotted underline-offset-4 hover:opacity-85 transition-opacity">
                      Category
                    </span>
                  </UiTooltipTrigger>
                  <UiTooltipContent side="top" align="center" className="p-3 max-w-[320px] bg-popover text-popover-foreground border border-border shadow-lg rounded-xl pointer-events-auto">
                    <div className="space-y-2 text-xs font-sans text-left normal-case tracking-normal">
                      <p className="font-bold text-brand uppercase tracking-wider text-[10px]">Forecast Category Rules</p>
                      <div className="text-[11px] text-muted-foreground leading-relaxed space-y-1.5">
                        <div className="p-1.5 rounded-md bg-orange-500/10 border border-orange-500/20 text-orange-400">
                          <strong className="text-orange-400">🔥 Early Boom (EARLY_BOOM):</strong>
                          <p className="text-[10px] text-foreground/90 mt-0.5">sTPS ≥ 80 AND Positive Acceleration (&gt; 0)</p>
                        </div>
                        <div className="p-1.5 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-400">
                          <strong className="text-purple-400">⚡ Breakout (BREAKOUT):</strong>
                          <p className="text-[10px] text-foreground/90 mt-0.5">sTPS ≥ 60</p>
                        </div>
                        <div className="p-1.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400">
                          <strong className="text-blue-400">📈 Steady Growth (STEADY):</strong>
                          <p className="text-[10px] text-foreground/90 mt-0.5">sTPS &lt; 60 (Standard steady pace)</p>
                        </div>
                      </div>
                    </div>
                  </UiTooltipContent>
                </UiTooltip>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {sliceItems.map((item, idx) => {
              const isSelected = selectedKeywordId === item.keywordId;
              const badge = CATEGORY_BADGE[item.forecastReason] ?? FALLBACK_BADGE;
              
              let scoreClass = "text-brand";
              if (item.potentialScore >= 80) scoreClass = "text-orange-500 font-bold";
              else if (item.potentialScore >= 60) scoreClass = "text-purple-500 font-bold";

              return (
                <tr
                  key={item.keywordId}
                  onClick={() => onSelect?.(item.keywordId)}
                  className={`cursor-pointer transition-all hover:bg-secondary/40 ${
                    isSelected ? "bg-secondary/60 font-medium" : ""
                  }`}
                >
                  <td className="py-3 px-4 text-center font-mono text-xs text-muted-foreground">
                    {String(startIndex + idx + 1).padStart(2, "0")}
                  </td>
                  <td className="py-3 px-4 font-semibold text-foreground truncate max-w-[120px]" title={item.term}>
                    {item.term}
                  </td>
                  <td className={`py-3 px-4 text-center font-mono cursor-help ${scoreClass}`}>
                    <UiTooltip>
                      <UiTooltipTrigger asChild>
                        <span className="underline decoration-dotted underline-offset-4 hover:opacity-85 transition-opacity">
                          {item.potentialScore}
                        </span>
                      </UiTooltipTrigger>
                      <UiTooltipContent side="top" align="center" className="p-3 max-w-[300px] bg-popover text-popover-foreground border border-border shadow-lg rounded-xl pointer-events-auto">
                        <div className="space-y-1.5 text-xs font-sans text-left">
                          <p className="font-bold text-brand uppercase tracking-wider text-[10px]">
                            sTPS - {item.term}
                          </p>
                          <div className="text-[11px] text-muted-foreground leading-relaxed">
                            <p className="font-medium text-foreground mb-1">Formula:</p>
                            <code className="block bg-secondary/40 p-1.5 rounded-md font-mono text-[10px] mb-2 text-center text-foreground font-semibold">
                              (w_slope × Slope_norm + w_acc × Acc_norm + w_vol × Volume_norm) × 100
                            </code>
                            <p className="font-medium text-foreground mb-1">Calculated Score:</p>
                            <p className="font-mono text-xs text-foreground font-bold mb-2">{item.potentialScore} / 100</p>
                            <div className="text-[10px] border-t border-border pt-1.5 space-y-1">
                              <p className="font-semibold text-foreground flex items-center gap-1">
                                <BookOpen className="size-3 text-brand shrink-0" />
                                <span>Methodology References:</span>
                              </p>
                              <div className="flex flex-col gap-1 pl-4">
                                <a
                                  href="https://doi.org/10.1287/opre.15.3.537"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 text-brand hover:underline font-medium text-[10px] transition-colors"
                                >
                                  <span>SAW Method (Fishburn 1967)</span>
                                  <ExternalLink className="size-2.5 shrink-0" />
                                </a>
                                <a
                                  href="https://doi.org/10.1016/C2009-0-61819-5"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 text-brand hover:underline font-medium text-[10px] transition-colors"
                                >
                                  <span>Min-Max Normalization (Han et al.)</span>
                                  <ExternalLink className="size-2.5 shrink-0" />
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </UiTooltipContent>
                    </UiTooltip>
                  </td>
                  <td className="py-3 px-4 text-center font-mono cursor-help">
                    <UiTooltip>
                      <UiTooltipTrigger asChild>
                        <span className="underline decoration-dotted underline-offset-4 hover:opacity-85 transition-opacity">
                          {item.predictedPapers}
                        </span>
                      </UiTooltipTrigger>
                      <UiTooltipContent side="top" align="center" className="p-3 max-w-[300px] bg-popover text-popover-foreground border border-border shadow-lg rounded-xl pointer-events-auto">
                        <div className="space-y-1.5 text-xs font-sans text-left">
                          <p className="font-bold text-brand uppercase tracking-wider text-[10px]">
                            {tableMonthsHeader}M Forecast - {item.term}
                          </p>
                          <div className="text-[11px] text-muted-foreground leading-relaxed">
                            <p className="font-medium text-foreground mb-1">Formula:</p>
                            <code className="block bg-secondary/40 p-1.5 rounded-md font-mono text-[10px] mb-2 text-center text-foreground font-semibold">
                              Σ (Slope × Month + Intercept)
                            </code>
                            <p className="font-medium text-foreground mb-1">Forecast Details:</p>
                            <ul className="list-disc pl-4 space-y-0.5 font-mono text-[10px] mb-2">
                              <li>Horizon: <span className="text-foreground font-bold">{tableMonthsHeader} months</span></li>
                              <li>Predicted Papers: <span className="text-foreground font-bold">{item.predictedPapers}</span></li>
                              <li>Growth: <span className={`font-bold ${
                                item.predictedGrowthRate > 0 ? "text-success" :
                                item.predictedGrowthRate < 0 ? "text-destructive" :
                                "text-muted-foreground"
                              }`}>{item.predictedGrowthRate > 0 ? "+" : ""}{item.predictedGrowthRate.toFixed(1)}%</span></li>
                            </ul>
                            <div className="text-[10px] border-t border-border pt-1.5 space-y-1">
                              <p className="font-semibold text-foreground flex items-center gap-1">
                                <BookOpen className="size-3 text-brand shrink-0" />
                                <span>Formula References:</span>
                              </p>
                              <div className="flex flex-col gap-1 pl-4">
                                <a
                                  href="https://en.wikipedia.org/wiki/Simple_linear_regression"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 text-brand hover:underline font-medium text-[10px] transition-colors"
                                >
                                  <span>Simple Linear Regression (Wikipedia)</span>
                                  <ExternalLink className="size-2.5 shrink-0" />
                                </a>
                                <a
                                  href="https://otexts.com/fpp3/regression-intro.html"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 text-brand hover:underline font-medium text-[10px] transition-colors"
                                >
                                  <span>Regression Intro (fpp3)</span>
                                  <ExternalLink className="size-2.5 shrink-0" />
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </UiTooltipContent>
                    </UiTooltip>
                  </td>
                  <td className={`py-3 px-4 text-center font-mono font-semibold cursor-help ${
                    item.predictedGrowthRate > 0 ? "text-success" :
                    item.predictedGrowthRate < 0 ? "text-destructive" :
                    "text-muted-foreground"
                  }`}>
                    <UiTooltip>
                      <UiTooltipTrigger asChild>
                        <span className="underline decoration-dotted underline-offset-4 hover:opacity-85 transition-opacity">
                          {item.predictedGrowthRate > 0 ? "+" : ""}{item.predictedGrowthRate.toFixed(1)}%
                        </span>
                      </UiTooltipTrigger>
                      <UiTooltipContent side="top" align="center" className="p-3 max-w-[300px] bg-popover text-popover-foreground border border-border shadow-lg rounded-xl pointer-events-auto">
                        <div className="space-y-1.5 text-xs font-sans text-left">
                          <p className="font-bold text-brand uppercase tracking-wider text-[10px]">
                            Net Growth Rate - {item.term}
                          </p>
                          <div className="text-[11px] text-muted-foreground leading-relaxed">
                            <p className="font-medium text-foreground mb-1">Formula:</p>
                            <code className="block bg-secondary/40 p-1.5 rounded-md font-mono text-[10px] mb-2 text-center text-foreground font-semibold">
                              (Predicted − Baseline) / Baseline × 100
                            </code>
                            <p className="font-medium text-foreground mb-1">Growth Value:</p>
                            <p className={`font-mono text-xs font-bold mb-2 ${
                              item.predictedGrowthRate > 0 ? "text-success" :
                              item.predictedGrowthRate < 0 ? "text-destructive" :
                              "text-muted-foreground"
                            }`}>
                              {item.predictedGrowthRate > 0 ? "+" : ""}{item.predictedGrowthRate.toFixed(2)}%
                            </p>
                            <div className="text-[10px] border-t border-border pt-1.5 space-y-1">
                              <p className="font-semibold text-foreground flex items-center gap-1">
                                <BookOpen className="size-3 text-brand shrink-0" />
                                <span>Formula References:</span>
                              </p>
                              <div className="flex flex-col gap-1 pl-4">
                                <a
                                  href="https://en.wikipedia.org/wiki/Percentage_change"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 text-brand hover:underline font-medium text-[10px] transition-colors"
                                >
                                  <span>Percentage Change (Wikipedia)</span>
                                  <ExternalLink className="size-2.5 shrink-0" />
                                </a>
                                <a
                                  href="https://en.wikipedia.org/wiki/Relative_growth_rate"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 text-brand hover:underline font-medium text-[10px] transition-colors"
                                >
                                  <span>Relative Growth Rate (Wikipedia)</span>
                                  <ExternalLink className="size-2.5 shrink-0" />
                                </a>
                              </div>
                            </div>
                          </div>
                        </div>
                      </UiTooltipContent>
                    </UiTooltip>
                  </td>
                  <td className="py-3 px-4 cursor-help">
                    <UiTooltip>
                      <UiTooltipTrigger asChild>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border cursor-pointer hover:opacity-90 transition-opacity ${badge.class}`}>
                          {badge.label}
                        </span>
                      </UiTooltipTrigger>
                      <UiTooltipContent side="top" align="center" className="p-3 max-w-[280px] bg-popover text-popover-foreground border border-border shadow-lg rounded-xl pointer-events-auto">
                        <div className="space-y-1.5 text-xs font-sans text-left">
                          <p className="font-bold text-brand uppercase tracking-wider text-[10px]">
                            {badge.label} Category Criteria
                          </p>
                          <div className="text-[11px] text-muted-foreground leading-relaxed space-y-1">
                            {item.forecastReason === "EARLY_BOOM" && (
                              <p className="text-orange-400 font-semibold">
                                🔥 sTPS score ≥ 80 with accelerating growth pace.
                              </p>
                            )}
                            {item.forecastReason === "BREAKOUT" && (
                              <p className="text-purple-400 font-semibold">
                                ⚡ sTPS score ≥ 60 (High potential breakout).
                              </p>
                            )}
                            {item.forecastReason === "STEADY" && (
                              <p className="text-blue-400 font-semibold">
                                📈 sTPS score &lt; 60 (Steady &amp; consistent growth).
                              </p>
                            )}
                            <div className="text-[10px] border-t border-border pt-1.5 text-muted-foreground space-y-0.5">
                              <p className="font-bold text-foreground">Category Classification Rules:</p>
                              <p>• <strong>Early Boom</strong>: sTPS ≥ 80 &amp; Acc &gt; 0</p>
                              <p>• <strong>Breakout</strong>: sTPS ≥ 60</p>
                              <p>• <strong>Steady Growth</strong>: sTPS &lt; 60</p>
                            </div>
                          </div>
                        </div>
                      </UiTooltipContent>
                    </UiTooltip>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <UiTooltipProvider delayDuration={100}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>{renderTable(leftItems, 0)}</div>
        <div>{renderTable(rightItems, 5)}</div>
      </div>
    </UiTooltipProvider>
  );
}

