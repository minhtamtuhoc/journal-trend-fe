import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Card } from "@/components/Card";
import { useSearchPapers, useAvailableYears } from "@/hooks/data/use-papers";
import { useFollowedTopics, useFollowTopic, useUnfollowTopic } from "@/hooks/data/use-follows";
import type { Paper } from "@/types/domain";
import { useAuth } from "@/auth";
import { useRecentSearches, useRecordSearch } from "@/hooks/data/use-search-history";
import { useEffect, useState, useRef } from "react";
import { Search as SearchIcon, Download, SlidersHorizontal, ArrowUpRight, Check, ChevronDown } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { SaveToCollectionButton } from "@/components/SaveToCollectionButton";

const searchSchema = z.object({
  q: z.string().optional(),
  topicId: z.coerce.number().optional(),
  searchType: z.enum(["papers", "authors", "keywords"]).optional(),
});

export const Route = createFileRoute("/search")({
  component: SearchPage,
  validateSearch: (s) => searchSchema.parse(s),
});



const categories = [
  "Computer Science",
  "Medicine",
  "Engineering",
  "Philosophy",
  "Physics",
  "Chemistry",
  "Psychology",
  "Education",
  "Business",
  "Biology",
  "Mathematics",
  "General"
];

function getVisiblePages(current: number, total: number) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "...", total];
  if (current >= total - 3) return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
}

function SearchPage() {
  const { q: initial, topicId: initialTopicId, searchType: initialSearchType } = Route.useSearch();
  const navigate = useNavigate();
  const [q, setQ] = useState(initial ?? "");
  const [searchType, setSearchType] = useState<"papers" | "authors" | "keywords">(initialSearchType ?? "papers");
  const [showDropdown, setShowDropdown] = useState(false);
  const [sort, setSort] = useState<"citations" | "year">("citations");
  const [fromYear, setFromYear] = useState<string>("all");
  const [toYear, setToYear] = useState<string>("all");
  const [category, setCategory] = useState("all");
  const [minCitations, setMinCitations] = useState(0);

  const { user } = useAuth();
  const { data: recentSearches = [] } = useRecentSearches();
  const recordSearch = useRecordSearch();

  const { data: followedTopics = [] } = useFollowedTopics();
  const { data: availableYears = [] } = useAvailableYears();
  const followTopic = useFollowTopic();
  const unfollowTopic = useUnfollowTopic();

  const isTopicFollowed = (topicId: string) => followedTopics.some((t) => t.id === topicId);

  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  useEffect(() => {
    setPage(1);
  }, [initial, initialSearchType, sort, fromYear, toYear, category, minCitations]);

  useEffect(() => {
    setQ(initial ?? "");
  }, [initial]);

  useEffect(() => {
    if (initialSearchType) {
      setSearchType(initialSearchType);
    }
  }, [initialSearchType]);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const sortParam =
    sort === "year"
      ? "publicationDate,desc"
      : "citationCount,desc";

  const { data, isLoading } = useSearchPapers({
    ...(initialTopicId != null
      ? { topicId: initialTopicId }
      : { q: initial || undefined }),
    searchType: initialSearchType || undefined,
    page: page - 1,
    size: PAGE_SIZE,
    sort: sortParam,
    fromYear: fromYear !== "all" ? Number(fromYear) : undefined,
    toYear: toYear !== "all" ? Number(toYear) : undefined,
    category: category !== "all" ? category : undefined,
    minCitations: minCitations > 0 ? minCitations : undefined,
  });

  const results = data?.content ?? [];
  const totalResults = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const startIndex = (page - 1) * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, totalResults);
  const paginatedResults = results;

  const exportCsv = () => {
    const header = "title,authors,journal,year,citations,trendScore,doi";
    const rows = results.map((p) => [p.title, p.authors.join(";"), p.journal, p.year, p.citations, p.trendScore, p.doi].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${searchType}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${results.length} ${searchType} exported`);
  };

  const yearOptions: [string, string][] = [
    ["all", "All years"],
    ...availableYears.map(y => [y.toString(), y.toString()] as [string, string])
  ];

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
              <div className="grid grid-cols-2 gap-2">
                <Select label="From Year" value={fromYear} onChange={setFromYear} options={yearOptions} />
                <Select label="To Year" value={toYear} onChange={setToYear} options={yearOptions} />
              </div>
              <Select label="Category" value={category} onChange={setCategory} options={[["all", "All categories"], ...categories.map((c) => [c, c] as [string, string])]} />
              <Select label="Sort by" value={sort} onChange={(v) => setSort(v as never)} options={[["citations", "Citations"], ["year", "Year"]]} />
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Min Citations</label>
                <input type="range" min="0" max="500" step="50" value={minCitations} onChange={(e) => setMinCitations(Number(e.target.value))} className="w-full mt-2 accent-[var(--brand)]" />
                <div className="text-xs font-mono text-foreground mt-1">{minCitations}+</div>
              </div>
            </div>
          </Card>
          {user && (
            <Card title="Recent Searches">
              <div className="flex flex-wrap gap-2">
                {recentSearches.length === 0 ? (
                  <span className="text-xs text-muted-foreground italic px-1">No recent searches</span>
                ) : (
                  recentSearches.map((entry) => (
                    <button
                      key={`${entry.query}-${entry.searchType}`}
                      onClick={() => {
                        setQ(entry.query);
                        setSearchType(entry.searchType);
                        if (user) {
                          recordSearch.mutate({ query: entry.query, searchType: entry.searchType });
                        }
                        navigate({
                          to: "/search",
                          search: {
                            q: entry.query,
                            searchType: entry.searchType,
                            topicId: undefined,
                          },
                          replace: true,
                        });
                      }}
                      className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full border border-border bg-secondary/40 hover:border-brand/40 hover:text-brand transition-colors"
                    >
                      <span>{entry.query}</span>
                      <span className="text-[9px] opacity-50 capitalize">({entry.searchType === "keywords" ? "keyword" : entry.searchType === "authors" ? "author" : "paper"})</span>
                    </button>
                  ))
                )}
              </div>
            </Card>
          )}
        </aside>

        <div className="space-y-4">
          <div className="relative w-full" ref={dropdownRef}>
            <div className="relative flex items-center bg-surface/60 border border-border rounded-xl focus-within:ring-2 focus-within:ring-brand/40 h-12 w-full pl-4 pr-3">
              <SearchIcon className="size-4 text-muted-foreground shrink-0" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setShowDropdown(false);
                    const trimmedQ = q.trim();
                    if (trimmedQ && user) {
                      recordSearch.mutate({ query: trimmedQ, searchType });
                    }
                    navigate({
                      to: "/search",
                      search: {
                        q: trimmedQ || undefined,
                        searchType,
                        topicId: undefined,
                      },
                      replace: true,
                    });
                  }
                }}
                placeholder={
                  searchType === "papers"
                    ? "Search papers..."
                    : searchType === "authors"
                    ? "Search authors..."
                    : "Search keywords..."
                }
                className="flex-1 h-full pl-3 pr-2 bg-transparent border-none focus:outline-none text-sm placeholder:text-muted-foreground"
              />
              <button
                type="button"
                onClick={() => setShowDropdown((prev) => !prev)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-secondary/45 hover:bg-secondary/70 hover:text-foreground text-[11px] font-semibold text-muted-foreground transition-all cursor-pointer select-none shrink-0"
              >
                <span>{searchType === "papers" ? "Papers" : searchType === "authors" ? "Authors" : "Keywords"}</span>
                <ChevronDown className="size-3.5 opacity-75" />
              </button>
            </div>

            {showDropdown && (
              <div className="absolute right-0 top-[calc(100%+6px)] w-48 bg-popover border border-border rounded-xl shadow-lg p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-3 py-1.5 mb-1 border-b border-border/40">
                  Search Option
                </div>
                {(["papers", "authors", "keywords"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setSearchType(type);
                      setShowDropdown(false);
                      navigate({
                        to: "/search",
                        search: {
                          q: q || undefined,
                          searchType: type,
                          topicId: undefined,
                        },
                        replace: true,
                      });
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer text-left ${
                      searchType === type
                        ? "bg-brand/10 text-brand font-semibold"
                        : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                    }`}
                  >
                    <span className="capitalize">{type}</span>
                    {searchType === type && <Check className="size-3.5" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {totalResults === 0
                ? `Showing 0 of 0 ${searchType}`
                : `Showing ${startIndex + 1}-${endIndex} of ${totalResults} ${searchType}`}
            </span>
            <span className="font-mono">sorted by {sort}</span>
          </div>

          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-32 rounded-xl bg-secondary/10 border border-border" />
              ))}
            </div>
          ) : paginatedResults.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {searchType === "papers"
                ? "No papers found matching your search criteria."
                : searchType === "authors"
                ? "No authors found matching your search criteria."
                : "No keywords found matching your search criteria."}
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedResults.map((p) => {
                return (
                  <Card key={p.id} className="hover:border-brand/40 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-2">
                          <span className="shrink-0 px-2 py-0.5 rounded bg-brand/10 text-brand">{p.source}</span>
                          <span className="truncate">{p.journal}</span>
                          <span className="shrink-0">· {p.year}</span>
                        </div>
                        <Link to="/papers/$id" params={{ id: p.id }} className="text-base font-semibold text-foreground hover:text-brand transition-colors line-clamp-3 break-words">
                          {p.title}
                        </Link>
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2 break-words">
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
                            const followed = isTopicFollowed(k.id);
                            return (
                              <button
                                key={k.id}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (followed) {
                                    unfollowTopic.mutate(k.id, {
                                      onSuccess: () => toast.info(`Unfollowed keyword: ${k.name}`),
                                    });
                                  } else {
                                    followTopic.mutate(k.id, {
                                      onSuccess: () => toast.success(`Following keyword: ${k.name}`),
                                    });
                                  }
                                }}
                                className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 transition-all cursor-pointer ${followed
                                    ? "border-brand/40 bg-brand/10 text-brand font-medium hover:bg-brand/20"
                                    : "border-border bg-secondary/40 text-muted-foreground hover:border-brand/30 hover:text-foreground"
                                  }`}
                              >
                                <span>{k.name}</span>
                                <span className="text-[8px] opacity-75">{followed ? "✓" : "+"}</span>
                              </button>
                            );
                          })}
                          {p.trendScore > 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/15 border border-success/30 text-success font-medium">
                              Related Topic Trend: +{p.trendScore.toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest">{p.citations} cites</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">IF {p.impactFactor}</div>
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
          )}

          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-6 py-4 border-t border-border">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-xs font-medium border border-border hover:border-brand/40 disabled:opacity-50 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                Previous
              </button>

              {getVisiblePages(page, totalPages).map((p, i) => (
                p === "..." ? (
                  <span key={`dots-${i}`} className="px-1 text-muted-foreground">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className={`inline-flex items-center justify-center size-8 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${page === p
                        ? "bg-brand/10 border-brand/45 text-brand"
                        : "border-border hover:border-brand/40"
                      }`}
                  >
                    {p}
                  </button>
                )
              ))}

              <button
                type="button"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-xs font-medium border border-border hover:border-brand/40 disabled:opacity-50 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
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