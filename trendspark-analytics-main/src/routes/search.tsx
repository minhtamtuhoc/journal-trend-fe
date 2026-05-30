import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Card } from "@/components/Card";
import { usePapers } from "@/hooks/data/use-papers";
import { useSavedItems } from "@/hooks/use-saved-items";
import type { Paper } from "@/types/domain";
import { useMemo, useState } from "react";
import { Search as SearchIcon, Download, SlidersHorizontal, ArrowUpRight } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { SaveToCollectionButton } from "@/components/SaveToCollectionButton";

const searchSchema = z.object({ q: z.string().optional() });

export const Route = createFileRoute("/search")({
  component: SearchPage,
  validateSearch: (s) => searchSchema.parse(s),
});

const SUGGESTIONS = ["CRISPR", "Quantum", "Neural Radiance", "Solid-state battery", "Edge AI", "Climate"];

function SearchPage() {
  const { data: PAPERS = [] } = usePapers();
  const { q: initial } = Route.useSearch();
  const [q, setQ] = useState(initial ?? "");
  const [sort, setSort] = useState<"trend" | "citations" | "year">("trend");
  const [year, setYear] = useState("all");
  const [category, setCategory] = useState("all");
  const [minCitations, setMinCitations] = useState(0);

  const { isKeywordFollowed, toggleKeywordFollow } = useSavedItems();

  const results = useMemo(() => {
    let r: Paper[] = PAPERS;
    if (q) {
      const needle = q.toLowerCase();
      r = r.filter(
        (p) =>
          p.title.toLowerCase().includes(needle) ||
          p.authors.some((a) => a.toLowerCase().includes(needle)) ||
          p.keywords.some((k) => k.toLowerCase().includes(needle)) ||
          p.journal.toLowerCase().includes(needle),
      );
    }
    if (year !== "all") r = r.filter((p) => p.year === Number(year));
    if (category !== "all") r = r.filter((p) => p.category === category);
    if (minCitations > 0) r = r.filter((p) => p.citations >= minCitations);
    r = [...r].sort((a, b) => (sort === "trend" ? b.trendScore - a.trendScore : sort === "citations" ? b.citations - a.citations : b.year - a.year));
    return r;
  }, [PAPERS, q, sort, year, category, minCitations]);

  const exportCsv = () => {
    const header = "title,authors,journal,year,citations,trendScore,doi";
    const rows = results.map((p) => [p.title, p.authors.join(";"), p.journal, p.year, p.citations, p.trendScore, p.doi].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "papers.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${results.length} papers exported`);
  };

  const categories = Array.from(new Set(PAPERS.map((p) => p.category)));

  return (
    <AppLayout>
      <PageHeader
        title="Search Explorer"
        subtitle="Search papers synced from OpenAlex, Crossref, and Semantic Scholar"
        action={
          <button onClick={exportCsv} className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium border border-border bg-surface/50 hover:bg-surface transition-colors">
            <Download className="size-4" /> Export CSV
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <aside className="space-y-4">
          <Card title="Filters" action={<SlidersHorizontal className="size-4 text-muted-foreground" />}>
            <div className="space-y-4">
              <Select label="Year" value={year} onChange={setYear} options={[["all", "All years"], ["2024", "2024"], ["2023", "2023"]]} />
              <Select label="Category" value={category} onChange={setCategory} options={[["all", "All categories"], ...categories.map((c) => [c, c] as [string, string])]} />
              <Select label="Sort by" value={sort} onChange={(v) => setSort(v as never)} options={[["trend", "Trend Score"], ["citations", "Citations"], ["year", "Year"]]} />
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Min Citations</label>
                <input type="range" min="0" max="500" step="50" value={minCitations} onChange={(e) => setMinCitations(Number(e.target.value))} className="w-full mt-2 accent-[var(--brand)]" />
                <div className="text-xs font-mono text-foreground mt-1">{minCitations}+</div>
              </div>
            </div>
          </Card>
          <Card title="Recent Searches">
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => setQ(s)} className="text-[11px] px-2.5 py-1 rounded-full border border-border bg-secondary/40 hover:border-brand/40 hover:text-brand transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </Card>
        </aside>

        <div className="space-y-4">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search papers, authors, keywords, DOIs..."
              className="w-full h-12 pl-11 pr-4 rounded-xl bg-surface/60 border border-border focus:outline-none focus:ring-2 focus:ring-brand/40 text-sm"
            />
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{results.length} results</span>
            <span className="font-mono">sorted by {sort}</span>
          </div>

          <div className="space-y-3">
            {results.map((p) => {
              return (
                <Card key={p.id} className="hover:border-brand/40 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">
                        <span className="px-2 py-0.5 rounded bg-brand/10 text-brand">{p.source}</span>
                        <span>{p.journal}</span>
                        <span>· {p.year}</span>
                      </div>
                      <Link to="/papers/$id" params={{ id: p.id }} className="text-base font-semibold text-foreground hover:text-brand transition-colors">
                        {p.title}
                      </Link>
                      <div className="text-xs text-muted-foreground mt-1">
                        {p.authorRefs?.length
                          ? p.authorRefs.map((ref, i) => (
                              <span key={ref.id}>
                                {i > 0 ? ", " : ""}
                                <Link
                                  to="/authors/$authorId"
                                  params={{ authorId: ref.id }}
                                  className="hover:text-brand"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {ref.name}
                                </Link>
                              </span>
                            ))
                          : p.authors.join(", ")}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {p.keywords.map((k) => {
                          const followed = isKeywordFollowed(k);
                          return (
                            <button
                              key={k}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                const added = toggleKeywordFollow(k);
                                if (added) {
                                  toast.success(`Following keyword: ${k}`);
                                } else {
                                  toast.info(`Unfollowed keyword: ${k}`);
                                }
                              }}
                              className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 transition-all cursor-pointer ${
                                followed
                                  ? "border-brand/40 bg-brand/10 text-brand font-medium hover:bg-brand/20"
                                  : "border-border bg-secondary/40 text-muted-foreground hover:border-brand/30 hover:text-foreground"
                              }`}
                            >
                              <span>{k}</span>
                              <span className="text-[8px] opacity-75">{followed ? "✓" : "+"}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-success">+{p.trendScore.toFixed(1)}%</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">{p.citations} cites</div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-widest">IF {p.impactFactor}</div>
                      <div className="flex gap-1 mt-3 justify-end">
                        <SaveToCollectionButton paperId={p.id} paperTitle={p.title} />
                        <Link to="/papers/$id" params={{ id: p.id }} className="p-1.5 rounded-md border border-border hover:border-brand/40 hover:text-brand transition-colors">
                          <ArrowUpRight className="size-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full h-9 px-3 bg-secondary/40 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/40">
        {options.map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>
    </div>
  );
}