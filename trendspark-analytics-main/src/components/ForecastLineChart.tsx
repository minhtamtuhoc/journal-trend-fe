import type { ForecastDetail } from "@/types/forecast";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

const MONTH_NAMES = [
  "",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

type Props = {
  detail: ForecastDetail | null;
  isLoading?: boolean;
};

export function ForecastLineChart({ detail, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="h-[350px] w-full rounded-2xl border border-border bg-secondary/5 flex flex-col items-center justify-center text-sm text-muted-foreground animate-pulse">
        Loading chart data...
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="h-[350px] w-full rounded-2xl border border-border bg-secondary/5 flex flex-col items-center justify-center p-6 text-center text-sm text-muted-foreground">
        <p className="font-semibold text-foreground mb-1">No keyword selected</p>
        <p className="text-xs max-w-sm">Select a keyword from the forecast ranking to view its 6-month prediction chart.</p>
      </div>
    );
  }

  const lastHistorical = detail.historicalMonths?.at(-1);

  // Combine and sort data chronologically
  const chartData = [
    ...(detail.historicalMonths || []).map((p) => ({
      label: `${MONTH_NAMES[p.month]} ${p.year}`,
      sortKey: p.year * 100 + p.month,
      historical: p.paperCount,
      // Bridge point: assign the last historical value to forecast series as well
      forecast: lastHistorical && p.year === lastHistorical.year && p.month === lastHistorical.month
        ? p.paperCount
        : undefined,
    })),
    ...(detail.forecastMonths || []).map((p) => ({
      label: `${MONTH_NAMES[p.month]} ${p.year}`,
      sortKey: p.year * 100 + p.month,
      forecast: p.paperCount,
    })),
  ].sort((a, b) => a.sortKey - b.sortKey);

  // Label index for ReferenceLine "Now"
  const nowIndex = lastHistorical
    ? chartData.findIndex(
        (d) =>
          d.sortKey === lastHistorical.year * 100 + lastHistorical.month
      )
    : -1;

  const nowLabel = nowIndex !== -1 ? chartData[nowIndex].label : "";

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="text-sm font-bold text-foreground">Forecast Chart: {detail.term}</h4>
          <p className="text-xs text-muted-foreground font-mono mt-0.5">
            sTPS Potential Score: <strong className="text-brand">{detail.potentialScore}</strong> · 6M Growth: <strong className="text-success">+{detail.predictedGrowthRate.toFixed(1)}%</strong>
          </p>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
            <XAxis
              dataKey="label"
              stroke="var(--muted-foreground)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="var(--muted-foreground)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              label={{ value: "Papers / month", angle: -90, position: "insideLeft", offset: 10, style: { fontSize: 10, fill: "var(--muted-foreground)" } }}
            />
            <Tooltip
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--popover-foreground)",
                fontSize: 11,
              }}
              labelClassName="font-bold text-foreground mb-1"
            />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11 }}
            />
            {nowLabel && (
              <ReferenceLine
                x={nowLabel}
                stroke="var(--brand)"
                strokeDasharray="3 3"
                label={{ value: "Now", position: "top", fill: "var(--brand)", fontSize: 10, fontWeight: "bold" }}
              />
            )}
            <Line
              type="monotone"
              name="Actual data"
              dataKey="historical"
              stroke="#6366f1"
              strokeWidth={2.5}
              dot={{ r: 3, strokeWidth: 1 }}
              activeDot={{ r: 5 }}
              connectNulls={false}
            />
            <Line
              type="monotone"
              name="6-month forecast"
              dataKey="forecast"
              stroke="#a855f7"
              strokeWidth={2.5}
              strokeDasharray="5 5"
              dot={{ r: 3, strokeWidth: 1 }}
              activeDot={{ r: 5 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
