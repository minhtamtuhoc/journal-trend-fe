import type { ForecastCategory, ForecastListItem } from "@/types/forecast";

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
              <th className="py-3 px-4 text-center">sTPS</th>
              <th className="py-3 px-4 text-center">{tableMonthsHeader}M Forecast</th>
              <th className="py-3 px-4 text-center">Growth</th>
              <th className="py-3 px-4">Category</th>
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
                  <td className={`py-3 px-4 text-center font-mono ${scoreClass}`}>
                    {item.potentialScore}
                  </td>
                  <td className="py-3 px-4 text-center font-mono">
                    {item.predictedPapers}
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-success font-semibold">
                    +{item.predictedGrowthRate.toFixed(1)}%
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${badge.class}`}>
                      {badge.label}
                    </span>
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div>{renderTable(leftItems, 0)}</div>
      <div>{renderTable(rightItems, 5)}</div>
    </div>
  );
}
