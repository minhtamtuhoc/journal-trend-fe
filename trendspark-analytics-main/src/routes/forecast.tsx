import { createFileRoute } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Card } from "@/components/Card";
import { HotTopicForecastCard } from "@/components/HotTopicForecastCard";
import { ForecastLineChart } from "@/components/ForecastLineChart";
import { useForecastList, useForecastDetail, useRunForecast } from "@/hooks/data/use-forecast";
import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { ApiError } from "@/api/errors";

export const Route = createFileRoute("/forecast")({
  component: ForecastPage,
});

function ForecastPage() {
  const [selectedKeywordId, setSelectedKeywordId] = useState<number | null>(null);
  const { data: forecastList = [], isLoading: loadingList } = useForecastList(10);
  const { data: forecastDetail, isLoading: loadingDetail } = useForecastDetail(selectedKeywordId);
  const runForecast = useRunForecast();

  // Automatically select the first keyword in the list if none is selected
  useEffect(() => {
    if (forecastList.length > 0 && selectedKeywordId === null) {
      setSelectedKeywordId(forecastList[0].keywordId);
    }
  }, [forecastList, selectedKeywordId]);

  const handleRun = () => {
    runForecast.mutate(10, {
      onSuccess: (items) => {
        toast.success(`Forecast generated for ${items.length} keyword(s)`);
        if (items.length > 0) {
          setSelectedKeywordId(items[0].keywordId);
        }
      },
      onError: (err) => {
        toast.error(err instanceof ApiError ? err.message : "Failed to run forecast");
      },
    });
  };

  const isPending = runForecast.isPending;

  return (
    <AppLayout>
      <PageHeader
        title="Hot Topic Forecast"
        subtitle="Predicting the most promising research keywords for the next 6 months"
        action={
          <button
            onClick={handleRun}
            disabled={isPending || loadingList}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold text-brand-foreground glow-brand transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none"
            style={{ background: "var(--gradient-brand)" }}
          >
            <RefreshCw className={`size-4 ${isPending ? "animate-spin" : ""}`} />
            {isPending ? "Running…" : "Run Forecast"}
          </button>
        }
      />
      <div className="space-y-8">
        <Card title="Hot Topics Ranking">
          <HotTopicForecastCard
            items={forecastList}
            isLoading={loadingList || isPending}
            selectedKeywordId={selectedKeywordId}
            onSelect={setSelectedKeywordId}
          />
        </Card>
        <Card title="Trend Projection">
          <ForecastLineChart
            detail={forecastDetail || null}
            isLoading={loadingDetail && !isPending}
          />
        </Card>
      </div>
    </AppLayout>
  );
}
