import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Card } from "@/components/Card";
import { usePaper, useRelatedPapers, usePaperReferences, usePaperCitations } from "@/hooks/data/use-papers";
import { useState, useRef, useEffect } from "react";
import { PaperGraph } from "@/components/PaperGraph";
import { buildPaperCitationSeries } from "@/utils/paper-series";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { UserPlus, ArrowUpRight, ExternalLink, UserCheck, BookMarked, Quote } from "lucide-react";
import { toast } from "sonner";
import { SaveToCollectionButton } from "@/components/SaveToCollectionButton";
import { CitationExportModal } from "@/components/CitationExportModal";
import { useAuth } from "@/auth";
import { useFollowedJournals, useFollowJournal, useUnfollowJournal, useFollowedTopics, useFollowTopic, useUnfollowTopic, useFollowedAuthors, useFollowAuthor, useUnfollowAuthor } from "@/hooks/data/use-follows";
import { ApiError } from "@/api/errors";

export const Route = createFileRoute("/papers/$id")({
  component: PaperDetailPage,
});

function PaperDetailPage() {
  const { id } = Route.useParams();
  const { data: paper, isLoading, isError } = usePaper(id);
  const category = paper?.category ?? "General";
  const { data: related = [] } = useRelatedPapers(id, category);

  const [activeTab, setActiveTab] = useState<"overview" | "graph">("overview");
  const [citeModalOpen, setCiteModalOpen] = useState(false);

  // References configuration
  const [refLimit, setRefLimit] = useState(50);
  const { data: references = [], isLoading: isLoadingRefs } = usePaperReferences(
    id,
    refLimit,
    activeTab === "graph"
  );

  // Citations configuration
  const [citeLimit, setCiteLimit] = useState(20);
  const [citeSort, setCiteSort] = useState<"citations" | "recent">("citations");
  const [citeYearFrom, setCiteYearFrom] = useState<number | undefined>(undefined);
  const [citeYearTo, setCiteYearTo] = useState<number | undefined>(undefined);
  const { data: citations = [], isLoading: isLoadingCites } = usePaperCitations(
    id,
    {
      limit: citeLimit,
      sort: citeSort,
      yearFrom: citeYearFrom,
      yearTo: citeYearTo,
    },
    activeTab === "graph"
  );

  // Filter toggles to show/hide references or citations dynamically on client-side
  const [showRefs, setShowRefs] = useState(true);
  const [showCites, setShowCites] = useState(true);

  // Combine and format nodes
  const combinedNodes = [
    ...(showRefs ? references.map((n) => ({ ...n, relationType: "reference" as const })) : []),
    ...(showCites ? citations.map((n) => ({ ...n, relationType: "citation" as const })) : []),
  ];

  const [isAuthorDropdownOpen, setIsAuthorDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAuthorDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { user } = useAuth();
  const { data: followedAuthors = [] } = useFollowedAuthors();
  const followAuthorMut = useFollowAuthor();
  const unfollowAuthorMut = useUnfollowAuthor();
  const isAuthorFollowed = (authorId: string | null) => authorId ? followedAuthors.some((a) => a.id === authorId) : false;

  const { data: followedJournals = [] } = useFollowedJournals();
  const followJournal = useFollowJournal();
  const unfollowJournal = useUnfollowJournal();
  const { data: followedTopics = [] } = useFollowedTopics();
  const followTopic = useFollowTopic();
  const unfollowTopic = useUnfollowTopic();

  const isTopicFollowed = (topicId: string) => followedTopics.some((t) => t.id === topicId);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-8 text-sm text-muted-foreground animate-pulse">Loading paper…</div>
      </AppLayout>
    );
  }

  if (isError) {
    return (
      <AppLayout>
        <div className="p-8 text-sm text-destructive font-medium border border-destructive/20 rounded-xl bg-destructive/5 max-w-md mx-auto mt-12 text-center">
          Failed to load paper details. The server might be busy. Please try again.
        </div>
      </AppLayout>
    );
  }

  if (!paper) throw notFound();

  const authors = paper.authors?.length ? paper.authors : ["Unknown author"];
  const keywords = paper.keywords ?? [];
  const series = buildPaperCitationSeries(paper.id, paper.citations ?? 0);

  const primaryAuthorRef = paper.authorRefs?.[0];
  const mainAuthorName = primaryAuthorRef?.name ?? authors[0];
  const mainAuthorId = primaryAuthorRef?.id ?? null;
  const mainAuthorFollowed = isAuthorFollowed(mainAuthorId);

  const journalId = paper?.journalId ?? null;
  const journalFollowed = journalId ? followedJournals.some((j) => j.id === journalId) : false;

  const handleAuthorFollow = (authorId: string | null, authorName: string) => {
    if (!user) {
      toast.error("Please log in to follow authors");
      return;
    }
    if (!authorId) {
      toast.error("This author is not registered in the system and cannot be followed.");
      return;
    }
    const followed = isAuthorFollowed(authorId);
    if (followed) {
      unfollowAuthorMut.mutate(authorId, {
        onSuccess: () => toast.info(`Unfollowed ${authorName}`),
        onError: (err) => {
          const msg = err instanceof ApiError ? err.message : "Unfollow failed";
          toast.error(msg);
        },
      });
    } else {
      followAuthorMut.mutate(authorId, {
        onSuccess: () => toast.success(`Following ${authorName}`),
        onError: (err) => {
          const msg = err instanceof ApiError ? err.message : "Follow failed. Max 20 authors.";
          toast.error(msg);
        },
      });
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title={paper.title}
        subtitle={`${paper.journal} · ${paper.year} · ${paper.source}`}
        action={
          <div className="flex gap-2">
            <SaveToCollectionButton paperId={paper.id} paperTitle={paper.title} size="md" />
            <button
              type="button"
              onClick={() => setCiteModalOpen(true)}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-sm font-semibold border border-border bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer text-foreground"
              title="Export citation for this paper"
            >
              <Quote className="size-4 text-brand" />
              Cite
            </button>
            {user && journalId ? (
              <button
                type="button"
                disabled={followJournal.isPending || unfollowJournal.isPending}
                onClick={() => {
                  const mutate = journalFollowed ? unfollowJournal : followJournal;
                  mutate.mutate(journalId, {
                    onSuccess: () =>
                      toast.success(journalFollowed ? `Unfollowed journal: ${paper.journal}` : `Following journal: ${paper.journal}`),
                    onError: (err) => {
                      const msg = err instanceof ApiError ? err.message : "Failed to update journal follow status";
                      toast.error(msg);
                    },
                  });
                }}
                className={`inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold border transition-all ${
                  journalFollowed ? "bg-brand/10 border-brand/45 text-brand" : "border-border hover:border-brand/40"
                }`}
              >
                <BookMarked className="size-4" />
                {journalFollowed ? "Following journal" : "Follow journal"}
              </button>
            ) : null}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsAuthorDropdownOpen(!isAuthorDropdownOpen)}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold text-brand-foreground glow-brand transition-all hover:scale-[1.02] cursor-pointer"
                style={{ background: "var(--gradient-brand)" }}
              >
                <UserPlus className="size-4" />
                Follow Authors
              </button>

              {isAuthorDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl bg-popover border border-border shadow-2xl p-2 z-50 animate-fade-in">
                  <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold px-3 py-1.5 border-b border-border/50 mb-1">
                    Author List
                  </p>
                  <div className="max-h-56 overflow-y-auto space-y-1">
                    {(paper.authorRefs?.length
                      ? paper.authorRefs.map((ref) => ({ id: ref.id, name: ref.name }))
                      : paper.authors.map((name) => ({ id: null as string | null, name }))
                    ).map((author) => {
                      const followed = isAuthorFollowed(author.id);
                      return (
                        <div
                          key={author.id ?? author.name}
                          className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-secondary/40 transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-foreground truncate" title={author.name}>
                              {author.name}
                            </p>
                          </div>
                          {author.id ? (
                            <button
                              type="button"
                              disabled={followAuthorMut.isPending || unfollowAuthorMut.isPending}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAuthorFollow(author.id, author.name);
                              }}
                              className={`text-[10px] font-bold px-2 py-1 rounded-md border transition-all cursor-pointer ${
                                followed
                                  ? "border-brand/40 bg-brand/10 text-brand"
                                  : "border-border hover:border-brand/40 hover:text-brand"
                              }`}
                            >
                              {followed ? "Following" : "Follow"}
                            </button>
                          ) : (
                            <span
                              className="text-[9px] text-muted-foreground px-2 py-1 bg-secondary/20 rounded border border-border/30 cursor-not-allowed"
                              title="Author not in system"
                            >
                              New
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-border pb-3">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                activeTab === "overview"
                  ? "bg-brand/10 border border-brand/40 text-brand"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("graph")}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                activeTab === "graph"
                  ? "bg-brand/10 border border-brand/40 text-brand"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Interactive Network Graph
            </button>
          </div>

          {activeTab === "overview" && (
            <>
              <Card title="Abstract">
                <p className="text-sm text-muted-foreground leading-relaxed">{paper.abstract || "No abstract available."}</p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {keywords.map((k) => {
                    const followed = isTopicFollowed(k.id);
                    return (
                      <button
                        key={k.id}
                        onClick={() => {
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
                        className={`text-xs px-2.5 py-1 rounded-full border flex items-center gap-1 transition-all cursor-pointer ${
                          followed
                            ? "border-brand/40 bg-brand/10 text-brand font-medium hover:bg-brand/20"
                            : "border-border bg-secondary/40 text-foreground hover:border-brand/30"
                        }`}
                      >
                        <span>{k.name}</span>
                        <span className="text-[9px] opacity-75">{followed ? "✓" : "+"}</span>
                      </button>
                    );
                  })}
                </div>
              </Card>

              <Card title="Citation Trajectory">
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={series}>
                    <defs>
                      <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="m" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                    <Area type="monotone" dataKey="c" stroke="var(--chart-1)" fill="url(#cg)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              <Card title="Related Papers">
                <div className="space-y-3">
                  {related.map((p) => (
                    <Link key={p.id} to="/papers/$id" params={{ id: p.id }} className="flex items-start justify-between gap-4 p-3 -mx-3 rounded-lg hover:bg-secondary/40 transition-colors group">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground group-hover:text-brand transition-colors">{p.title}</div>
                        <div className="text-[10px] text-muted-foreground mt-1 font-mono">{p.journal} · {p.year}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <SaveToCollectionButton paperId={p.id} paperTitle={p.title} />
                        <ArrowUpRight className="size-4 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              </Card>
            </>
          )}

          {activeTab === "graph" && (
            <Card
              title="Interactive Network Map"
              action={
                <div className="flex flex-wrap items-center gap-4 bg-secondary/20 p-2 rounded-xl border border-border/40">
                  {/* Toggle References / Citations */}
                  <div className="flex items-center gap-3 pr-3 border-r border-border/50">
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={showRefs}
                        onChange={(e) => setShowRefs(e.target.checked)}
                        className="rounded border-border bg-background text-chart-2 focus:ring-chart-2 size-3.5"
                      />
                      <span className={showRefs ? "text-chart-2" : ""}>References ({references.length})</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground font-semibold cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={showCites}
                        onChange={(e) => setShowCites(e.target.checked)}
                        className="rounded border-border bg-background text-chart-5 focus:ring-chart-5 size-3.5"
                      />
                      <span className={showCites ? "text-chart-5" : ""}>Citations ({citations.length})</span>
                    </label>
                  </div>

                  {/* References Limit */}
                  {showRefs && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="font-semibold">Ref Max:</span>
                      <select
                        className="bg-background text-foreground border border-border rounded-lg text-xs px-2 py-0.5 focus:border-brand focus:outline-none"
                        value={refLimit}
                        onChange={(e) => setRefLimit(Number(e.target.value))}
                      >
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                  )}

                  {/* Citations Limit & Filters */}
                  {showCites && (
                    <div className="flex flex-wrap items-center gap-3 pl-1">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-muted-foreground font-semibold">Cite Sort:</span>
                        <select
                          className="bg-background text-foreground border border-border rounded-lg text-[11px] px-1.5 py-0.5 focus:border-brand focus:outline-none"
                          value={citeSort}
                          onChange={(e) => setCiteSort(e.target.value as "citations" | "recent")}
                        >
                          <option value="citations">Citations</option>
                          <option value="recent">Recent</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-semibold font-mono">
                        <span>Year:</span>
                        <input
                          type="number"
                          placeholder="From"
                          className="w-12 bg-background border border-border rounded px-1.5 py-0.5 text-[11px] focus:outline-none focus:border-brand text-center font-mono"
                          value={citeYearFrom || ""}
                          onChange={(e) => setCiteYearFrom(e.target.value ? Number(e.target.value) : undefined)}
                        />
                        <span>-</span>
                        <input
                          type="number"
                          placeholder="To"
                          className="w-12 bg-background border border-border rounded px-1.5 py-0.5 text-[11px] focus:outline-none focus:border-brand text-center font-mono"
                          value={citeYearTo || ""}
                          onChange={(e) => setCiteYearTo(e.target.value ? Number(e.target.value) : undefined)}
                        />
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-[11px] text-muted-foreground font-semibold">Cite Max:</span>
                        <select
                          className="bg-background text-foreground border border-border rounded-lg text-[11px] px-1.5 py-0.5 focus:border-brand focus:outline-none"
                          value={citeLimit}
                          onChange={(e) => setCiteLimit(Number(e.target.value))}
                        >
                          <option value={10}>10</option>
                          <option value={20}>20</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              }
            >
              <PaperGraph
                currentPaperTitle={paper.title}
                nodes={combinedNodes}
                isLoading={isLoadingRefs || isLoadingCites}
              />
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card title="Metrics">
            <div className="grid grid-cols-2 gap-4">
              <Metric label="Citations" value={(paper.citations ?? 0).toLocaleString()} />
              <Metric label="Year" value={paper.year.toString()} />
            </div>
          </Card>

          <Card title="Identifiers">
            <dl className="text-xs space-y-2">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">DOI</dt>
                <dd className="font-mono text-foreground truncate">{paper.doi}</dd>
              </div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Source</dt><dd className="font-mono">{paper.source}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Category</dt><dd>{paper.category}</dd></div>
            </dl>
            {paper.doi ? (
              <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1 text-xs text-brand hover:underline">
                View at publisher <ExternalLink className="size-3" />
              </a>
            ) : null}
          </Card>

          <Card title="Authors">
            <div className="space-y-3">
              {(() => {
                const authorsList = paper.authorRefs?.length
                  ? paper.authorRefs.map((ref) => ({ id: ref.id, name: ref.name, position: ref.authorPosition }))
                  : paper.authors.map((name) => ({ id: null as string | null, name, position: undefined as any }));

                const hasAnyPosition = authorsList.some(
                  (a) => a.position === "first" || a.position === "last" || a.position === "middle"
                );

                if (!hasAnyPosition && authorsList.length > 0) {
                  return authorsList.map((author, index) => {
                    let position = "middle";
                    if (index === 0) {
                      position = "first";
                    } else if (index === authorsList.length - 1) {
                      position = "last";
                    }
                    return { ...author, position };
                  });
                }
                return authorsList;
              })().map((author) => {
                const a = author.name;
                const followed = isAuthorFollowed(author.id);
                return (
                  <div key={author.id ?? a} className="flex items-center gap-3">
                    <div className="size-8 rounded-full flex items-center justify-center text-[10px] font-bold text-brand-foreground" style={{ background: "var(--gradient-brand)" }}>
                      {a.split(",")[0].slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 text-sm text-foreground flex items-center gap-2 flex-wrap">
                      {author.id ? (
                        <Link to="/authors/$authorId" params={{ authorId: author.id }} className="hover:text-brand font-medium">
                          {a}
                        </Link>
                      ) : (
                        a
                      )}
                      {author.position === "first" && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold uppercase tracking-wider">
                          Lead
                        </span>
                      )}
                      {author.position === "last" && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold uppercase tracking-wider">
                          Senior
                        </span>
                      )}
                    </div>
                    {author.id ? (
                      <button
                        disabled={followAuthorMut.isPending || unfollowAuthorMut.isPending}
                        onClick={() => handleAuthorFollow(author.id, a)}
                        className={`text-[10px] px-2 py-1 rounded-md border transition-all ${
                          followed
                            ? "border-brand/40 bg-brand/10 text-brand"
                            : "border-border hover:border-brand/40 hover:text-brand"
                        }`}
                      >
                        {followed ? "Following" : "Follow"}
                      </button>
                    ) : (
                      <span className="text-[10px] px-2 py-1 text-muted-foreground" title="Author not in system">
                        —
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      <CitationExportModal
        open={citeModalOpen}
        onOpenChange={setCiteModalOpen}
        papers={paper}
      />
    </AppLayout>
  );
}

function Metric({ label, value, accent = false, tooltip }: { label: string; value: string; accent?: boolean | "success" | "destructive"; tooltip?: string }) {
  const colorClass = accent === "success" || accent === true
    ? "text-success"
    : accent === "destructive"
    ? "text-destructive"
    : "text-foreground";
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1">
        <span>{label}</span>
        {tooltip && (
          <span title={tooltip} className="cursor-help text-[10px] text-muted-foreground opacity-60 hover:opacity-100 transition-opacity">
            ⓘ
          </span>
        )}
      </p>
      <p className={`text-lg font-bold font-mono mt-1 ${colorClass}`}>{value}</p>
    </div>
  );
}
