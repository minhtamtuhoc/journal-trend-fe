export function Card({ children, className = "", title, action }: { children: React.ReactNode; className?: string; title?: string; action?: React.ReactNode }) {
  return (
    <div className={`glass rounded-2xl p-6 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-6">
          {title && <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function KpiCard({ label, value, delta, hint, accent = false }: { label: string; value: React.ReactNode; delta?: string; hint?: string; accent?: boolean }) {
  const valueStr = typeof value === "string" || typeof value === "number" ? String(value) : "";
  const length = valueStr.length;

  let fontSizeClass = "text-2xl sm:text-3xl lg:text-2xl xl:text-3xl";
  let trackingClass = "";

  if (length > 10) {
    fontSizeClass = "text-base sm:text-xl lg:text-sm xl:text-lg";
    trackingClass = "tracking-tighter";
  } else if (length > 8) {
    fontSizeClass = "text-xl sm:text-3xl lg:text-base xl:text-2xl";
    trackingClass = "tracking-tighter";
  } else if (length > 6) {
    fontSizeClass = "text-xl sm:text-3xl lg:text-lg xl:text-2xl";
    trackingClass = "tracking-tight";
  }

  return (
    <div className="glass rounded-2xl p-4 sm:p-5 lg:p-4 xl:p-6 relative overflow-hidden group hover:border-brand/30 transition-colors">
      {delta && (
        <div className={`absolute top-4 right-4 font-mono text-xs font-bold ${delta.startsWith("-") ? "text-destructive" : "text-success"}`}>{delta}</div>
      )}
      <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-2">{label}</p>
      <div className={`${fontSizeClass} ${trackingClass} font-bold text-foreground font-mono ${accent ? "bg-clip-text text-transparent" : ""}`} style={accent ? { backgroundImage: "var(--gradient-brand)" } : undefined}>
        {value}
      </div>
      {hint && <p className="mt-2 text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}