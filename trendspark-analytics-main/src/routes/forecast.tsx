import { createFileRoute } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Card } from "@/components/Card";
import { HotTopicForecastCard } from "@/components/HotTopicForecastCard";
import { ForecastLineChart } from "@/components/ForecastLineChart";
import { useForecastList, useForecastDetail, useRunForecast } from "@/hooks/data/use-forecast";
import { useState, useEffect } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { useAuth, isStudentUser } from "@/auth";
import { toast } from "sonner";
import { ApiError } from "@/api/errors";
import {
  FORECAST_MONTHS_MIN,
  FORECAST_MONTHS_MAX,
  FORECAST_MONTHS_DEFAULT,
} from "@/types/forecast";


export const Route = createFileRoute("/forecast")({
  component: ForecastPage,
});

function ForecastPage() {
  const { user } = useAuth();

  if (isStudentUser(user)) {
    return (
      <AppLayout>
        <Card>
          <div className="text-center py-12">
            <AlertTriangle className="size-8 mx-auto text-warning mb-2" />
            <h2 className="font-semibold text-lg">Access Denied</h2>
            <p className="text-muted-foreground text-sm mt-1">
              The Hot Topic Forecast feature is only available for Lecturers, Researchers, and Admins.
            </p>
          </div>
        </Card>
      </AppLayout>
    );
  }

  const [monthsRaw, setMonthsRaw] = useState<number>(FORECAST_MONTHS_DEFAULT);
  const [months, setMonths] = useState<number>(FORECAST_MONTHS_DEFAULT);

  // Debounce months changes to avoid spamming API while dragging slider
  useEffect(() => {
    const t = setTimeout(() => setMonths(monthsRaw), 300);
    return () => clearTimeout(t);
  }, [monthsRaw]);

  const [selectedKeywordId, setSelectedKeywordId] = useState<number | null>(null);

  const { data: forecastList = [], isLoading: loadingList } = useForecastList(10, months);
  const { data: forecastDetail, isLoading: loadingDetail } = useForecastDetail(selectedKeywordId, months);
  const runForecast = useRunForecast();

  // Automatically select the first keyword in the list if none is selected
  useEffect(() => {
    if (forecastList.length > 0 && selectedKeywordId === null) {
      setSelectedKeywordId(forecastList[0].keywordId);
    }
  }, [forecastList, selectedKeywordId]);

  const handleRun = () => {
    runForecast.mutate(
      { limit: 10, months },
      {
        onSuccess: (items) => {
          toast.success(`Forecast generated for ${items.length} keyword(s)`);
          if (items.length > 0) {
            setSelectedKeywordId(items[0].keywordId);
          }
        },
        onError: (err) => {
          toast.error(err instanceof ApiError ? err.message : "Failed to run forecast");
        },
      }
    );
  };

  const isPending = runForecast.isPending;

  return (
    <AppLayout>
      <PageHeader
        title="Hot Topic Forecast"
        subtitle={`Predicting the most promising research keywords for the next ${monthsRaw} month(s)`}
        action={
          <div className="flex items-center gap-3">
            {/* Range Slider for full 1-12 Months Selection */}
            <div className="flex items-center gap-2 bg-secondary/30 border border-border/60 px-3 py-1.5 rounded-lg">
              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Horizon:</span>
              <input
                type="range"
                min={FORECAST_MONTHS_MIN}
                max={FORECAST_MONTHS_MAX}
                step={1}
                value={monthsRaw}
                onChange={(e) => setMonthsRaw(Number(e.target.value))}
                className="w-28 accent-brand cursor-pointer"
              />
              <span className="text-xs font-semibold font-mono w-7 text-center text-foreground">
                {monthsRaw}M
              </span>
            </div>

            <button
              onClick={handleRun}
              disabled={isPending || loadingList}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold text-brand-foreground glow-brand transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none"
              style={{ background: "var(--gradient-brand)" }}
            >
              <RefreshCw className={`size-4 ${isPending ? "animate-spin" : ""}`} />
              {isPending ? "Running…" : "Run Forecast"}
            </button>
          </div>
        }
      />
      <div className="space-y-8">
        <Card title="Hot Topics Ranking">
          <HotTopicForecastCard
            items={forecastList}
            isLoading={loadingList || isPending}
            months={months}
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



