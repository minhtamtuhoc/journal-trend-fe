import { useAnalyticsSnapshot } from "@/hooks/data/use-analytics";

export function Heatmap() {
  const { data: analytics } = useAnalyticsSnapshot();
  const HEATMAP = analytics?.heatmap ?? [];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weeks = Array.from(new Set(HEATMAP.map((h) => h.week)));
  const max = Math.max(...HEATMAP.map((h) => h.value));
  const cell = (week: string, day: string) => HEATMAP.find((h) => h.week === week && h.day === day);

  return (
    <div className="overflow-x-auto">
      <div className="inline-grid gap-1" style={{ gridTemplateColumns: `auto repeat(${weeks.length}, 1fr)` }}>
        <div />
        {weeks.map((w) => (
          <div key={w} className="text-[9px] text-muted-foreground font-mono text-center">{w}</div>
        ))}
        {days.map((d) => (
          <FragmentRow key={d} day={d} weeks={weeks} cell={cell} max={max} />
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 text-[10px] text-muted-foreground">
        <span>Less</span>
        {[0.2, 0.4, 0.6, 0.8, 1].map((o) => (
          <span key={o} className="size-3 rounded-sm" style={{ background: `color-mix(in oklab, var(--brand) ${o * 100}%, transparent)` }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

function FragmentRow({ day, weeks, cell, max }: { day: string; weeks: string[]; cell: (w: string, d: string) => { value: number } | undefined; max: number }) {
  return (
    <>
      <div className="text-[9px] text-muted-foreground font-mono pr-2 self-center">{day}</div>
      {weeks.map((w) => {
        const c = cell(w, day);
        const v = c?.value ?? 0;
        const o = Math.max(0.08, v / max);
        return (
          <div
            key={w + day}
            title={`${day} ${w}: ${v}`}
            className="size-6 rounded-sm border border-border/30 transition-transform hover:scale-110"
            style={{ background: `color-mix(in oklab, var(--brand) ${o * 100}%, var(--surface))` }}
          />
        );
      })}
    </>
  );
}
