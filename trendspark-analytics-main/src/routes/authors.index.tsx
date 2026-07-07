import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Card } from "@/components/Card";
import { useAuthors, useAuthorSpotlight } from "@/hooks/data/use-authors";
import { useFollowedAuthors, useFollowAuthor, useUnfollowAuthor } from "@/hooks/data/use-follows";
import { ArrowUpRight, Bookmark, Search, User, FileText, Quote, TrendingUp, Check, ChevronDown, SlidersHorizontal } from "lucide-react";
import type { AuthorSpotlightEntry } from "@/types/domain";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { useAuth } from "@/auth";
import { ApiError } from "@/api/errors";

export const Route = createFileRoute("/authors/")({ component: AuthorsIndexPage });

function getVisiblePages(current: number, total: number) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "...", total];
  if (current >= total - 3) return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "...", current - 1, current, current + 1, "...", total];
}

function AuthorsIndexPage() {
  const { user } = useAuth();
  const { data: followedAuthors = [] } = useFollowedAuthors();
  const { data: spotlight, isLoading: isLoadingSpotlight } = useAuthorSpotlight();
  const followAuthorMut = useFollowAuthor();
  const unfollowAuthorMut = useUnfollowAuthor();
  const isAuthorFollowed = (authorId: string) => followedAuthors.some((a) => a.id === authorId);

  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<"default" | "papers" | "citations" | "hIndex">("default");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const pageSize = 24;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1); // Reset to page 1 on search change
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: pageData, isLoading, isError } = useAuthors({
    page: page - 1,
    size: pageSize,
    q: debouncedQuery.trim() || undefined,
  });

  const authorsList = pageData?.content ?? [];
  const totalPages = pageData?.totalPages ?? 0;

  const sortedAuthors = [...authorsList].sort((a, b) => {
    if (sortBy === "papers") return b.papers - a.papers;
    if (sortBy === "citations") return b.citations - a.citations;
    if (sortBy === "hIndex") return b.hIndex - a.hIndex;
    return 0;
  });

  return (
    <AppLayout>
      <PageHeader
        title="Trending Authors"
        subtitle="Most active researchers categorized by category and trend score"
        action={
          <span className="text-xs text-muted-foreground font-mono">
            Auto-enriched via OpenAlex IDs
          </span>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <SpotlightCard label="Most Papers" icon={FileText} entry={spotlight?.mostPapers} metric="papers" isLoading={isLoadingSpotlight} />
        <SpotlightCard label="Most Cited" icon={Quote} entry={spotlight?.mostCitations} metric="citations" isLoading={isLoadingSpotlight} />
        <SpotlightCard label="Highest h-index" icon={TrendingUp} entry={spotlight?.mostHIndex} metric="hIndex" isLoading={isLoadingSpotlight} />
      </div>

      <div className="flex flex-col md:flex-row items-stretch gap-4 mb-6">
        <div className="flex-1 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search authors by name..."
              className="w-full h-14 pl-11 pr-4 rounded-2xl bg-surface/60 border border-border focus:outline-none focus:ring-2 focus:ring-brand/40 text-sm placeholder:text-muted-foreground"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="relative shrink-0" ref={sortDropdownRef}>
            <button
              type="button"
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center gap-2 h-14 px-4 rounded-2xl border border-border bg-surface/60 hover:bg-surface/80 hover:text-foreground text-sm font-semibold text-muted-foreground transition-all cursor-pointer select-none"
            >
              <SlidersHorizontal className="size-4 opacity-75" />
              <span>
                {sortBy === "default"
                  ? "Sort: Default"
                  : sortBy === "papers"
                  ? "Sort: Papers"
                  : sortBy === "citations"
                  ? "Sort: Citations"
                  : "Sort: h-index"}
              </span>
              <ChevronDown className="size-4 opacity-75" />
            </button>

            {showSortDropdown && (
              <div className="absolute right-0 top-[calc(100%+6px)] w-48 bg-popover border border-border rounded-2xl shadow-lg p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {(["default", "papers", "citations", "hIndex"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setSortBy(type);
                      setShowSortDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium rounded-xl transition-colors cursor-pointer text-left ${
                      sortBy === type
                        ? "bg-brand/10 text-brand font-semibold"
                        : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                    }`}
                  >
                    <span>
                      {type === "default"
                        ? "Default"
                        : type === "papers"
                        ? "Papers"
                        : type === "citations"
                        ? "Citations"
                        : "h-index"}
                    </span>
                    {sortBy === type && <Check className="size-4" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-4 shrink-0">
          <button
            onClick={() => {
              setQuery("");
              setPage(1);
            }}
            className="glass rounded-2xl p-4 flex flex-col justify-between min-w-32 border border-border hover:border-brand/40 hover:bg-brand/5 transition-all text-left group cursor-pointer"
            title="Click to reset search"
          >
            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Total Authors</div>
            <div className="text-2xl font-bold font-mono text-foreground group-hover:text-brand">
              {isLoading && !pageData ? "..." : (pageData?.totalElements ?? 0).toLocaleString()}
            </div>
          </button>

          <Link
            to="/bookmarks"
            className="glass rounded-2xl p-4 flex flex-col justify-between min-w-32 border border-border hover:border-brand/40 hover:bg-brand/5 transition-all text-left group cursor-pointer"
          >
            <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Followed Authors</div>
            <div className="text-2xl font-bold font-mono text-foreground group-hover:text-brand">
              {followedAuthors.length}
            </div>
          </Link>
        </div>
      </div>

      {isError && (
        <p className="text-sm text-warning mb-4">
          Failed to load authors list. Check the backend (port 8080) and run sync from Admin.
        </p>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground p-8">Loading authors...</p>
      ) : authorsList.length === 0 ? (
        <Card>
          <p className="text-sm text-muted-foreground py-6 text-center">
            {debouncedQuery.trim()
              ? `No authors found matching "${debouncedQuery.trim()}".`
              : "No authors in system. Log in as Admin → Run Manual Sync."}
          </p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {sortedAuthors.map((a) => {
              const followed = isAuthorFollowed(a.id);
              return (
                <div
                  key={a.id}
                  className="glass rounded-2xl p-5 border border-border hover:border-brand/40 transition-colors group relative"
                >
                  <Link
                    to="/authors/$authorId"
                    params={{ authorId: a.id }}
                    className="block"
                  >
                    <div className="flex items-start justify-between gap-3 pr-8">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="size-10 rounded-full flex items-center justify-center text-xs font-bold text-brand-foreground shrink-0"
                          style={{ background: "var(--gradient-brand)" }}
                        >
                          <User className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-sm text-foreground group-hover:text-brand truncate">{a.name}</div>
                          <div className="text-xs text-muted-foreground truncate">{a.affiliation}</div>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                      <div>
                        <div className="text-[10px] uppercase text-muted-foreground">Papers</div>
                        <div className="font-mono font-bold text-sm">{a.papers}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-muted-foreground">Cites</div>
                        <div className="font-mono font-bold text-sm">{a.citations.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase text-muted-foreground">h-index</div>
                        <div className="font-mono font-bold text-sm">{a.hIndex}</div>
                      </div>
                    </div>
                  </Link>
                  <button
                    type="button"
                    disabled={followAuthorMut.isPending || unfollowAuthorMut.isPending}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!user) {
                        toast.error("Please login to follow authors");
                        return;
                      }
                      if (followed) {
                        unfollowAuthorMut.mutate(a.id, {
                          onSuccess: () => toast.info(`Unfollowed ${a.name}`),
                          onError: (err) => {
                            const msg = err instanceof ApiError ? err.message : "Unfollow failed";
                            toast.error(msg);
                          },
                        });
                      } else {
                        followAuthorMut.mutate(a.id, {
                          onSuccess: () => toast.success(`Following ${a.name}`),
                          onError: (err) => {
                            const msg = err instanceof ApiError ? err.message : "Follow failed. Max 20 authors.";
                            toast.error(msg);
                          },
                        });
                      }
                    }}
                    className={`absolute top-4 right-4 z-10 p-1.5 rounded-md border transition-colors cursor-pointer ${followed
                        ? "border-brand/40 bg-brand/10 text-brand"
                        : "border-border text-muted-foreground hover:border-brand/40 hover:text-brand"
                      }`}
                    title={followed ? "Unfollow author" : "Follow author"}
                  >
                    <Bookmark className="size-3" fill={followed ? "currentColor" : "none"} />
                  </button>
                </div>
              );
            })}
          </div>

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
        </>
      )}
    </AppLayout>
  );
}

function SpotlightCard({
  label,
  icon: Icon,
  entry,
  metric,
  isLoading,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  entry: AuthorSpotlightEntry | null | undefined;
  metric: "papers" | "citations" | "hIndex";
  isLoading: boolean;
}) {
  return (
    <Card>
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
        <Icon className="size-3.5" /> {label}
      </div>
      {isLoading ? (
        <div className="space-y-2 animate-pulse py-1">
          <div className="h-4 bg-secondary/20 rounded w-3/4"></div>
          <div className="h-3 bg-secondary/15 rounded w-1/2"></div>
          <div className="h-5 bg-brand/10 rounded w-1/3 mt-2"></div>
        </div>
      ) : entry ? (
        <Link to="/authors/$authorId" params={{ authorId: entry.id }} className="block group">
          <div className="font-semibold text-sm text-foreground group-hover:text-brand truncate">{entry.name}</div>
          <div className="text-xs text-muted-foreground truncate">{entry.affiliation || "No affiliation listed"}</div>
          <div className="font-mono font-bold text-lg text-brand mt-1">
            {metric === "citations" ? entry.citations.toLocaleString() : entry[metric]}
          </div>
        </Link>
      ) : (
        <p className="text-xs text-muted-foreground py-2 italic">No data yet</p>
      )}
    </Card>
  );
}
