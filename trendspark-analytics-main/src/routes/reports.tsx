import { useState, useEffect, useRef, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Card } from "@/components/Card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SaveToCollectionButton } from "@/components/SaveToCollectionButton";
import { usePersonalReport } from "@/hooks/data/use-personal-report";
import { useCollections } from "@/hooks/data/use-collections";
import { useAuthor, useAuthorPapers } from "@/hooks/data/use-authors";
import { useFollowedTopics, useFollowedAuthors, useFollowAuthor, useUnfollowAuthor, useFollowedJournals } from "@/hooks/data/use-follows";
import { useAuth } from "@/auth";
import { toast } from "sonner";
import { ApiError } from "@/api/errors";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  Sparkles,
  Lock,
  BookOpen,
  User,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
  ChevronDown,
  Check,
  ArrowLeft,
  FileText,
  TrendingUp,
  ArrowUpRight,
  Bookmark,
  Building2,
} from "lucide-react";
import type { KeywordTrendPoint } from "@/types/report";

export const Route = createFileRoute("/reports")({
  component: ReportsPage,
  validateSearch: (search: Record<string, unknown>) => search,
});

// Transformer helper for Recharts LineChart
function transformLineChartData(points: KeywordTrendPoint[]) {
  const periodMap: Record<string, { label: string; sortKey: number; values: Record<string, number> }> = {};
  const terms = new Set<string>();

  // 1. Gather all unique terms
  points.forEach((p) => terms.add(p.term));

  // 2. Generate expected last 3 months dynamically
  const generateLast3Months = () => {
    const list: { label: string; sortKey: number }[] = [];
    const now = new Date();
    for (let i = 3; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const paddedMonth = String(month).padStart(2, "0");
      list.push({
        label: `${paddedMonth}/${year}`,
        sortKey: year * 100 + month
      });
    }
    return list;
  };

  const periods = generateLast3Months();
  periods.forEach((p) => {
    periodMap[p.label] = {
      label: p.label,
      sortKey: p.sortKey,
      values: {}
    };
    // Initialize count to 0 for all terms
    terms.forEach((term) => {
      periodMap[p.label].values[term] = 0;
    });
  });

  // 3. Populate with actual values from points
  points.forEach((p) => {
    if (p.month !== undefined && p.month !== null) {
      const paddedMonth = String(p.month).padStart(2, "0");
      const label = `${paddedMonth}/${p.year}`;
      if (periodMap[label]) {
        periodMap[label].values[p.term] = p.paperCount;
      }
    }
  });

  const chartData = Object.values(periodMap)
    .sort((a, b) => a.sortKey - b.sortKey)
    .map((item) => ({
      period: item.label,
      ...item.values,
    }));

  return { chartData, terms: Array.from(terms) };
}

const translateReason = (reason: string) => {
  if (!reason) return "";
  const mapping: Record<string, string> = {
    "Bài viết mới nhất từ tác giả bạn đang theo dõi": "Latest paper from followed authors",
    "Bài viết có tầm ảnh hưởng (trích dẫn cao) trong chủ đề quan tâm": "Highly cited paper in your topics of interest",
    "Nghiên cứu thịnh hành nổi bật trên hệ thống": "Trending research highlighted in the system",
    "Bài viết trending trong journal bạn đang theo dõi": "Trending paper in your followed journal",
    "Nghiên cứu mới đang nổi bật trong chủ đề bạn quan tâm": "New and rising research in your topics of interest"
  };
  
  if (mapping[reason]) {
    return mapping[reason];
  }
  
  if (reason.includes("Khớp tác giả follow & trùng khớp")) {
    const matchCount = reason.match(/\d+/)?.[0] ?? "";
    return `Matches followed author & overlaps with ${matchCount} keywords`;
  }
  
  if (reason.includes("Trùng khớp") && reason.includes("từ khóa nghiên cứu bạn đang follow")) {
    const matchCount = reason.match(/\d+/)?.[0] ?? "";
    return `Overlaps with ${matchCount} of your followed keywords`;
  }
  
  if (reason.includes("Trùng khớp") && reason.includes("keyword đang trending")) {
    const matchCount = reason.match(/\d+/)?.[0] ?? "";
    return `Overlaps with ${matchCount} trending keywords`;
  }
  
  return reason;
};

function CustomReportStat({
  label,
  value,
  icon,
  accent,
  subtext,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: boolean;
  subtext?: React.ReactNode;
}) {
  return (
    <div className="glass rounded-2xl p-5 flex flex-col justify-between min-h-[110px]">
      <div>
        <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
          {icon}
          {label}
        </div>
        <div className={`text-2xl font-bold font-mono ${accent ? "text-brand" : ""}`}>{value}</div>
      </div>
      {subtext}
    </div>
  );
}

function CustomAuthorReportView({ authorId }: { authorId: string }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 14;
  
  const { data: author, isLoading: loadingAuthor, isError } = useAuthor(authorId);
  const { data: papers = [], isLoading: loadingPapers } = useAuthorPapers(authorId);
  const { data: followedTopics = [] } = useFollowedTopics();
  const { data: followedAuthors = [] } = useFollowedAuthors();
  const { user } = useAuth();
  
  const followAuthorMut = useFollowAuthor();
  const unfollowAuthorMut = useUnfollowAuthor();
  const followed = followedAuthors.some((a) => a.id === authorId);

  const followedTerms = useMemo(() => new Set(followedTopics.map(t => t.name.toLowerCase())), [followedTopics]);

  const matchedPapers = useMemo(() => {
    return papers.filter(p => p.keywords?.some(k => followedTerms.has(k.name.toLowerCase())));
  }, [papers, followedTerms]);

  const matchedFollowedKeywords = useMemo(() => {
    const matches = new Set<string>();
    papers.forEach(p => {
      p.keywords?.forEach(k => {
        const kwLower = k.name.toLowerCase();
        if (followedTerms.has(kwLower)) {
          const original = followedTopics.find(t => t.name.toLowerCase() === kwLower);
          matches.add(original ? original.name : k.name);
        }
      });
    });
    return Array.from(matches);
  }, [papers, followedTerms, followedTopics]);

  const hasPagination = matchedPapers.length > 14;
  const totalPages = Math.ceil(matchedPapers.length / itemsPerPage);
  const paginatedPapers = hasPagination
    ? matchedPapers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : matchedPapers;

  if (loadingAuthor || loadingPapers) {
    return (
      <div className="p-8 text-sm text-muted-foreground animate-pulse flex items-center justify-center min-h-[300px]">
        Loading custom author analysis report...
      </div>
    );
  }

  if (isError || !author) {
    return (
      <div className="p-8 text-sm text-destructive flex items-center gap-2 justify-center min-h-[300px]">
        <AlertTriangle className="size-4" />
        Failed to load author report details.
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      <PageHeader
        title={author.name}
        subtitle={`${author.affiliation} · source: ${author.source ?? "OpenAlex / DB"}`}
        action={
          <div className="flex gap-2">
            <Link
              to="/reports"
              search={(prev: any) => ({})}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-medium border border-border hover:bg-secondary/50 cursor-pointer"
            >
              <ArrowLeft className="size-4" /> Back to Reports
            </Link>
            <Link
              to="/authors/$authorId"
              params={{ authorId }}
              search={(prev: any) => ({ ...prev, fromReport: true })}
              className="inline-flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-medium border border-border hover:bg-secondary/50 text-foreground bg-secondary/10 cursor-pointer"
            >
              <User className="size-4" /> Author
            </Link>
            <button
              type="button"
              disabled={followAuthorMut.isPending || unfollowAuthorMut.isPending}
              onClick={() => {
                if (!user) {
                  toast.error("Please login to follow authors");
                  return;
                }
                if (followed) {
                  unfollowAuthorMut.mutate(author.id, {
                    onSuccess: () => toast.info(`Unfollowed ${author.name}`),
                    onError: (err) => {
                      const msg = err instanceof ApiError ? err.message : "Unfollow failed";
                      toast.error(msg);
                    },
                  });
                } else {
                  followAuthorMut.mutate(author.id, {
                    onSuccess: () => toast.success(`Following ${author.name}`),
                    onError: (err) => {
                      const msg = err instanceof ApiError ? err.message : "Follow failed. Max 20 authors.";
                      toast.error(msg);
                    },
                  });
                }
              }}
              className={`inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                followed
                  ? "border-brand/40 bg-brand/10 text-brand"
                  : "border-border hover:bg-secondary/50 text-foreground"
              }`}
            >
              <Bookmark className="size-4" fill={followed ? "currentColor" : "none"} />
              {followed ? "Followed" : "Follow"}
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <CustomReportStat
          label="Papers with Followed Keywords"
          value={String(matchedPapers.length)}
          icon={<FileText className="size-4" />}
          accent
        />
        <CustomReportStat
          label="Matched Keywords"
          value={String(matchedFollowedKeywords.length)}
          icon={<Sparkles className="size-4" />}
          subtext={
            matchedFollowedKeywords.length > 0 ? (
              <div className="flex flex-wrap gap-1 mt-2">
                {matchedFollowedKeywords.map(k => (
                  <span key={k} className="text-[9px] px-1.5 py-0.5 rounded bg-brand/10 border border-brand/20 text-brand font-mono font-medium">
                    {k}
                  </span>
                ))}
              </div>
            ) : null
          }
        />
        <CustomReportStat
          label="h-index"
          value={String(author.hIndex)}
          icon={<User className="size-4" />}
        />
      </div>

      {author.openAlexId ? (
        <div className="mb-6 text-xs text-muted-foreground font-mono flex items-center gap-2">
          <Building2 className="size-3.5" />
          OpenAlex ID: {author.openAlexId}
        </div>
      ) : null}

      <Card title={`Papers with Followed Keywords (${matchedPapers.length})`}>
        {matchedPapers.length === 0 ? (
          <p className="text-sm text-muted-foreground p-4">
            No papers containing followed keywords found.
          </p>
        ) : (
          <>
            <div className="space-y-3">
              {paginatedPapers.map((p) => {
                const paperMatchedKws = p.keywords
                  ? p.keywords
                      .filter(k => followedTerms.has(k.name.toLowerCase()))
                      .map(k => k.name)
                  : [];
                return (
                  <div
                    key={p.id}
                    className="flex items-start justify-between gap-4 p-3 rounded-lg border border-border bg-secondary/20 hover:bg-secondary/40 transition-colors"
                  >
                    <Link to="/papers/$id" params={{ id: p.id }} className="min-w-0 flex-1">
                      <div className="text-[10px] font-mono text-muted-foreground mb-1 flex items-center gap-2">
                        <span>{p.journal}</span>
                        <span className="text-brand">{p.source}</span>
                        <span className="text-success">+{(p.trendScore ?? 0).toFixed(1)}%</span>
                      </div>
                      <div className="text-sm font-semibold text-foreground hover:text-brand">{p.title}</div>
                      {p.doi ? <div className="text-[10px] font-mono text-muted-foreground mt-1">DOI: {p.doi}</div> : null}
                      
                      {paperMatchedKws.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {paperMatchedKws.map(k => (
                            <span key={k} className="text-[8px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                              {k}
                            </span>
                          ))}
                        </div>
                      )}
                    </Link>
                    <div className="flex items-center gap-2 shrink-0">
                      <SaveToCollectionButton paperId={p.id} paperTitle={p.title} />
                      <Link
                        to="/papers/$id"
                        params={{ id: p.id }}
                        className="p-1.5 rounded-md border border-border hover:border-brand/40 hover:text-brand"
                      >
                        <ArrowUpRight className="size-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {hasPagination && totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-1.5 mt-6 py-4 border-t border-border">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-xs font-medium border border-border hover:border-brand/40 disabled:opacity-50 disabled:pointer-events-none transition-colors cursor-pointer"
                >
                  Previous
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p)}
                    className={`inline-flex items-center justify-center size-8 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      currentPage === p
                        ? "bg-brand/10 border-brand/45 text-brand"
                        : "border-border hover:border-brand/40"
                    }`}
                  >
                    {p}
                  </button>
                ))}

                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-xs font-medium border border-border hover:border-brand/40 disabled:opacity-50 disabled:pointer-events-none transition-colors cursor-pointer"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

function ReportsPage() {
  const { authorId } = Route.useSearch() as { authorId?: string };
  const [activeTab, setActiveTab] = useState<"ALL" | "KEYWORD" | "AUTHOR" | "JOURNAL">("ALL");
  const { data: report, isLoading, error } = usePersonalReport(activeTab);
  const { data: collectionsData } = useCollections();
  const collections = useMemo(() => collectionsData ?? [], [collectionsData]);

  const { data: followedTopics = [], isLoading: isLoadingTopics } = useFollowedTopics();
  const { data: followedAuthors = [], isLoading: isLoadingAuthors } = useFollowedAuthors();
  const { data: followedJournals = [], isLoading: isLoadingJournals } = useFollowedJournals();

  const isPageLoading = isLoading || isLoadingTopics || isLoadingAuthors || isLoadingJournals;
  const hasFollowedEntities = followedTopics.length > 0 || followedAuthors.length > 0 || followedJournals.length > 0;

  const followedKeywordNames = useMemo(() => {
    return new Set(followedTopics.map((t) => t.name.toLowerCase()));
  }, [followedTopics]);

  // Render CustomAuthorReportView conditionally at the end to satisfy rules of hooks

  const { chartData, terms: allTerms } = useMemo(() => {
    return transformLineChartData(report?.trends?.lineChart ?? []);
  }, [report?.trends?.lineChart]);

  const displayedTerms = useMemo(() => {
    return allTerms.filter((term) => followedKeywordNames.has(term.toLowerCase()));
  }, [allTerms, followedKeywordNames]);

  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const hasInitialized = useRef(false);
  const displayedTermsSerialized = displayedTerms.join(",");

  useEffect(() => {
    if (displayedTerms.length > 0) {
      if (!hasInitialized.current) {
        setSelectedKeywords(displayedTerms);
        hasInitialized.current = true;
      } else {
        setSelectedKeywords((prev) => prev.filter((k) => displayedTerms.includes(k)));
      }
    } else {
      setSelectedKeywords([]);
    }
  }, [displayedTermsSerialized]);

  const handleToggleKeyword = (term: string) => {
    setSelectedKeywords((prev) =>
      prev.includes(term) ? prev.filter((t) => t !== term) : [...prev, term]
    );
  };

  const handleToggleAll = () => {
    if (selectedKeywords.length === displayedTerms.length) {
      setSelectedKeywords([]);
    } else {
      setSelectedKeywords(displayedTerms);
    }
  };

  const [showKeywordDropdown, setShowKeywordDropdown] = useState(false);
  const trendDropdownRef = useRef<HTMLDivElement>(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (trendDropdownRef.current && !trendDropdownRef.current.contains(event.target as Node)) {
        setShowKeywordDropdown(false);
      }
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter out recommended papers that the user has already bookmarked (optimistic reactive update)
  const visibleRecommendations = report?.recommendations?.filter(
    (paper) => !collections.some((c) => c.paperIds.includes(String(paper.id)))
  ) ?? [];

  const followStats = report?.followStats;
  const showKeywordTab = (followStats?.keywordCount ?? followedTopics.length) >= 1;
  const showAuthorTab  = (followStats?.authorCount  ?? followedAuthors.length) >= 1;
  const showJournalTab = (followStats?.journalCount ?? followedJournals.length) >= 1;

  const getBadgeStyle = (matchType: string) => {
    switch (matchType) {
      case "FOLLOWED_AUTHOR":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "KEYWORD_OVERLAP":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "TOP_CITED":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "POPULAR":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "COMBINED_MATCH":
        return "bg-indigo-500/15 text-indigo-400 border-indigo-500/30 font-bold bg-gradient-to-r from-indigo-500/10 to-brand/10";
      case "TRENDING_KEYWORD":
        return "bg-teal-500/10 text-teal-500 border-teal-500/20";
      case "TRENDING_JOURNAL":
        return "bg-cyan-500/10 text-cyan-500 border-cyan-500/20";
      case "RISING":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      default:
        return "bg-secondary text-secondary-foreground border-transparent";
    }
  };

  const getBadgeLabel = (matchType: string) => {
    switch (matchType) {
      case "FOLLOWED_AUTHOR":
        return "Followed Author";
      case "KEYWORD_OVERLAP":
        return "Keyword Match";
      case "TOP_CITED":
        return "Highly Cited";
      case "POPULAR":
        return "Trending";
      case "COMBINED_MATCH":
        return "Author & Keyword";
      case "TRENDING_KEYWORD":
        return "Trending Keyword";
      case "TRENDING_JOURNAL":
        return "Trending in Journal";
      case "RISING":
        return "Rising Paper";
      default:
        return matchType;
    }
  };

  // Recharts line colors generator
  const getLineColor = (index: number) => {
    const colors = [
      "var(--chart-1, #3b82f6)",
      "var(--chart-2, #10b981)",
      "var(--chart-3, #f59e0b)",
      "var(--chart-4, #8b5cf6)",
      "var(--chart-5, #ec4899)",
    ];
    return colors[index % colors.length];
  };

  if (authorId) {
    return (
      <AppLayout>
        <CustomAuthorReportView authorId={authorId} />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PageHeader
        title="Reports & Insights"
        subtitle="Personalized intelligence and analytics reports tailored for your research"
      />

      <div className="space-y-8 mt-6">
          {isPageLoading ? (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Skeleton className="h-[360px] lg:col-span-2 rounded-2xl" />
                <Skeleton className="h-[360px] rounded-2xl" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-10 w-48 rounded" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-40 rounded-xl" />
                  ))}
                </div>
              </div>
            </div>
          ) : error || !report ? (
            <Card className="p-12 text-center">
              <AlertTriangle className="size-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-bold">Failed to load report</h3>
              <p className="text-muted-foreground text-sm mt-2">
                An error occurred while fetching your personalized report. Please try again later.
              </p>
            </Card>
          ) : !hasFollowedEntities ? (
            <div className="max-w-3xl mx-auto py-12 px-4">
              <div className="glass border border-border/60 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden shadow-2xl">
                {/* Glowing decorative background pattern */}
                <div className="absolute -top-40 -right-40 size-80 bg-brand/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute -bottom-40 -left-40 size-80 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center">
                  <div className="size-16 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand mb-6 shadow-inner animate-pulse">
                    <Lock className="size-8" />
                  </div>

                  <h2 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight mb-4">
                    Personalized Intelligence Reports Locked
                  </h2>

                  <p className="text-muted-foreground text-sm md:text-base max-w-xl leading-relaxed mb-8">
                    To unlock the full features of your reports, please follow at least one author, keyword, or journal. Followed entities help us tailor research recommendations, key trends, and word clouds specifically to your fields of interest.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mt-4">
                    {/* Keywords Option */}
                    <div className="glass border border-border/40 hover:border-brand/40 rounded-2xl p-5 flex flex-col items-center justify-between text-center transition-all hover:scale-[1.02] group">
                      <div className="size-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3 group-hover:bg-blue-500/20 group-hover:scale-110 transition-all">
                        <Sparkles className="size-5" />
                      </div>
                      <h4 className="font-bold text-sm text-foreground mb-1">Keywords</h4>
                      <p className="text-[11px] text-muted-foreground mb-4">Track emerging topics and research trends in real-time.</p>
                      <Link
                        to="/trends"
                        hash="trend-score-ranking"
                        className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-xs font-semibold text-white transition-transform hover:scale-[1.03] w-full mt-auto"
                        style={{ background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)" }}
                      >
                        Explore Trends
                      </Link>
                    </div>

                    {/* Authors Option */}
                    <div className="glass border border-border/40 hover:border-brand/40 rounded-2xl p-5 flex flex-col items-center justify-between text-center transition-all hover:scale-[1.02] group">
                      <div className="size-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 group-hover:bg-emerald-500/20 group-hover:scale-110 transition-all">
                        <User className="size-5" />
                      </div>
                      <h4 className="font-bold text-sm text-foreground mb-1">Authors</h4>
                      <p className="text-[11px] text-muted-foreground mb-4">Stay updated with publications from top researchers.</p>
                      <Link
                        to="/authors"
                        className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-xs font-semibold text-white transition-transform hover:scale-[1.03] w-full mt-auto"
                        style={{ background: "linear-gradient(135deg, #10b981 0%, #0d9488 100%)" }}
                      >
                        Browse Authors
                      </Link>
                    </div>

                    {/* Journals Option */}
                    <div className="glass border border-border/40 hover:border-brand/40 rounded-2xl p-5 flex flex-col items-center justify-between text-center transition-all hover:scale-[1.02] group">
                      <div className="size-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3 group-hover:bg-purple-500/20 group-hover:scale-110 transition-all">
                        <BookOpen className="size-5" />
                      </div>
                      <h4 className="font-bold text-sm text-foreground mb-1">Journals</h4>
                      <p className="text-[11px] text-muted-foreground mb-4">Monitor publications in your target journals.</p>
                      <Link
                        to="/search"
                        className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-xs font-semibold text-white transition-transform hover:scale-[1.03] w-full mt-auto"
                        style={{ background: "linear-gradient(135deg, #a855f7 0%, #6366f1 100%)" }}
                      >
                        Search Journals
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* PHẦN 1: XU HƯỚNG LĨNH VỰC (TRENDS) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1.1 Line Chart */}
                <Card
                  className="lg:col-span-2"
                  title="Keyword Trends by Month"
                  action={
                    displayedTerms.length > 0 && (
                      <div className="relative" ref={trendDropdownRef}>
                        <button
                          onClick={() => setShowKeywordDropdown(!showKeywordDropdown)}
                          className="inline-flex items-center justify-between gap-1.5 h-8 px-3 rounded-lg border border-border bg-secondary/40 hover:bg-secondary/70 hover:text-foreground text-xs font-semibold text-muted-foreground transition-all cursor-pointer min-w-[180px] text-left"
                        >
                          <span className="truncate">
                            {selectedKeywords.length === displayedTerms.length
                              ? "All followed keywords"
                              : selectedKeywords.length === 0
                              ? "No keywords selected"
                              : selectedKeywords.length === 1
                              ? selectedKeywords[0]
                              : `${selectedKeywords.length} keywords selected`}
                          </span>
                          <ChevronDown className="size-3.5 opacity-75 shrink-0" />
                        </button>

                        {showKeywordDropdown && (
                          <div className="absolute right-0 top-[calc(100%+6px)] w-56 max-h-60 overflow-y-auto bg-popover border border-border rounded-xl shadow-lg p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                            <div
                              onClick={handleToggleAll}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-colors cursor-pointer select-none text-left"
                            >
                              <div className={`size-3.5 rounded border flex items-center justify-center shrink-0 transition-all ${
                                selectedKeywords.length === displayedTerms.length
                                  ? "bg-brand border-brand text-brand-foreground"
                                  : "border-border hover:border-brand/40 bg-background"
                              }`}>
                                {selectedKeywords.length === displayedTerms.length && <Check className="size-2.5 stroke-[3]" />}
                              </div>
                              <span className="font-semibold text-foreground">All followed keywords</span>
                            </div>
                            
                            <div className="h-px bg-border my-1" />

                            {displayedTerms.map((t) => {
                              const isSelected = selectedKeywords.includes(t);
                              return (
                                <div
                                  key={t}
                                  onClick={() => handleToggleKeyword(t)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-colors cursor-pointer select-none text-left"
                                >
                                  <div className={`size-3.5 rounded border flex items-center justify-center shrink-0 transition-all ${
                                    isSelected
                                      ? "bg-brand border-brand text-brand-foreground"
                                      : "border-border hover:border-brand/40 bg-background"
                                  }`}>
                                    {isSelected && <Check className="size-2.5 stroke-[3]" />}
                                  </div>
                                  <span className="truncate text-foreground">{t}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )
                  }
                >
                  {report.trends?.lineChart?.length === 0 ? (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                      No followed keywords to display trends.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData}>
                        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="period"
                          stroke="var(--muted-foreground)"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="var(--muted-foreground)"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "var(--popover)",
                            border: "1px solid var(--border)",
                            borderRadius: 8,
                            fontSize: 12,
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        {displayedTerms
                          .filter((term) => selectedKeywords.includes(term))
                          .map((term) => (
                            <Line
                              key={term}
                              type="monotone"
                              dataKey={term}
                              stroke={getLineColor(allTerms.indexOf(term))}
                              strokeWidth={2}
                              activeDot={{ r: 6 }}
                            />
                          ))}
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </Card>

                {/* 1.2 Bar Chart */}
                <Card title="Top Journals in Your Field">
                  {report.trends?.barChart?.length === 0 ? (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                      No popular journals in your followed research area.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart layout="vertical" data={report.trends.barChart}>
                        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis
                          dataKey="journalName"
                          type="category"
                          stroke="var(--muted-foreground)"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          width={140}
                          tickFormatter={(val) => (val && val.length > 20) ? `${val.substring(0, 18)}...` : (val || "")}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "var(--popover)",
                            border: "1px solid var(--border)",
                            borderRadius: 8,
                            fontSize: 11,
                          }}
                        />
                        <Bar dataKey="paperCount" fill="var(--chart-1)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Card>
              </div>

              {/* PHẦN 2: GỢI Ý ĐỌC TIẾP (RECOMMENDATIONS) */}
              <div>
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <BookOpen className="size-5 text-brand" />
                  <h2 className="text-lg font-bold uppercase tracking-wider text-foreground">Recommended Reads for You</h2>
                  <span className="text-xs text-muted-foreground font-mono">({visibleRecommendations.length} papers)</span>

                  {/* Filter dropdown — chỉ hiện khi có ít nhất 1 tab filter khả dụng */}
                  {(showKeywordTab || showAuthorTab || showJournalTab) && (
                    <div className="relative ml-auto" ref={filterDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                        className="inline-flex items-center justify-between gap-1.5 h-8 px-3 rounded-lg border border-border bg-secondary/40 hover:bg-secondary/70 hover:text-foreground text-xs font-semibold text-muted-foreground transition-all cursor-pointer min-w-[140px] text-left"
                      >
                        <span className="truncate">
                          Filter: {activeTab === "ALL" ? "All" : activeTab === "KEYWORD" ? "Keywords" : activeTab === "AUTHOR" ? "Authors" : "Journals"}
                        </span>
                        <ChevronDown className="size-3.5 opacity-75 shrink-0" />
                      </button>

                      {showFilterDropdown && (
                        <div className="absolute right-0 top-[calc(100%+6px)] w-44 bg-popover border border-border rounded-xl shadow-lg p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                          {(["ALL", showKeywordTab && "KEYWORD", showAuthorTab && "AUTHOR", showJournalTab && "JOURNAL"] as const)
                            .filter(Boolean)
                            .map((tab) => {
                              if (!tab) return null;
                              const isSelected = activeTab === tab;
                              return (
                                <div
                                  key={tab as string}
                                  onClick={() => {
                                    setActiveTab(tab as typeof activeTab);
                                    setShowFilterDropdown(false);
                                  }}
                                  className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium rounded-lg text-muted-foreground hover:bg-secondary/40 hover:text-foreground transition-colors cursor-pointer select-none text-left"
                                >
                                  <span className={isSelected ? "font-semibold text-brand" : "text-foreground"}>
                                    {tab === "ALL" ? "All" : tab === "KEYWORD" ? "Keywords" : tab === "AUTHOR" ? "Authors" : "Journals"}
                                  </span>
                                  {isSelected && <Check className="size-3.5 text-brand stroke-[3]" />}
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {visibleRecommendations.length === 0 ? (
                  <Card className="p-8 text-center text-muted-foreground text-sm space-y-2">
                    {activeTab === "ALL" ? (
                      <p>💡 No recommended papers. Follow more topics or authors to get new recommendations!</p>
                    ) : activeTab === "KEYWORD" ? (
                      <>
                        <p>No trending papers found for your followed keywords.</p>
                        <p className="text-xs text-muted-foreground">Try switching to the <strong>All</strong> tab, or follow more keywords.</p>
                      </>
                    ) : activeTab === "AUTHOR" ? (
                      <>
                        <p>No recent papers from your followed authors.</p>
                        <p className="text-xs text-muted-foreground">Try switching to the <strong>All</strong> tab, or follow more authors.</p>
                      </>
                    ) : (
                      <>
                        <p>No trending papers found in your followed journals.</p>
                        <p className="text-xs text-muted-foreground">Try switching to the <strong>All</strong> tab, or follow more journals.</p>
                      </>
                    )}
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {visibleRecommendations.map((paper) => (
                      <div
                        key={paper.id}
                        className="glass border border-border/60 hover:border-brand/40 transition-all rounded-xl p-5 flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <span className="text-xs font-semibold text-muted-foreground font-mono">
                              {paper.journal} · {paper.year}
                            </span>
                            <Badge variant="outline" className={getBadgeStyle(paper.matchType)}>
                              {getBadgeLabel(paper.matchType)}
                            </Badge>
                          </div>

                          <Link to="/papers/$id" params={{ id: String(paper.id) }} className="hover:no-underline block">
                            <h3 className="font-bold text-foreground text-sm line-clamp-2 group-hover:text-brand transition-colors mb-2 cursor-pointer">
                              {paper.title}
                            </h3>
                          </Link>

                          <p className="text-xs text-muted-foreground line-clamp-1 mb-3">
                            {paper.authors.join(", ")}
                          </p>

                          <div className="bg-secondary/40 border border-border/30 rounded-lg p-2.5 mb-4 text-[11px] text-foreground/80 flex items-start gap-2">
                            <Lightbulb className="size-3.5 text-brand shrink-0 mt-0.5" />
                            <span className="italic">{translateReason(paper.recommendationReason)}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-border/40 pt-3 mt-auto">
                          <span className="text-[10px] font-mono text-muted-foreground">
                            🔥 {paper.citations.toLocaleString()} citations
                          </span>

                          <div className="flex items-center gap-2">
                            {paper.doi && (
                              <a
                                href={`https://doi.org/${paper.doi}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-md border border-border hover:border-brand/40 hover:text-brand transition-all text-muted-foreground"
                                title="Open DOI Link"
                              >
                                <ExternalLink className="size-3.5" />
                              </a>
                            )}
                            <SaveToCollectionButton
                              paperId={String(paper.id)}
                              paperTitle={paper.title}
                              size="sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* PHẦN 3: TOÀN CẢNH LĨNH VỰC (LANDSCAPE) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* 3.1 Leader Authors Cards Grid */}
                  <Card title="Leading Authors by Followed Keywords">
                    {report.landscape?.bubbleChart?.length === 0 ? (
                      <div className="text-muted-foreground text-sm p-4">
                        No prominent authors found in these topics.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {report.landscape.bubbleChart.slice(0, 6).map((author) => {
                          const cardContent = (
                            <div className="flex items-center gap-3 p-4 rounded-xl border border-border/45 bg-surface-elevated/40 hover:bg-secondary/20 hover:border-brand/40 transition-all cursor-pointer h-full">
                              <div className="size-10 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shrink-0">
                                <User className="size-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-sm truncate text-foreground group-hover:text-brand transition-colors">
                                  {author.authorName}
                                </div>
                                <div className="text-[10px] text-muted-foreground truncate">{author.mainDomain}</div>
                                <div className="flex gap-2 mt-1.5">
                                  <Badge className="text-[9px] px-1.5 py-0">
                                    {author.paperCount} papers
                                  </Badge>
                                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-brand/20 bg-brand/5 text-brand">
                                    Matches {author.matchingKeywordCount} keywords
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          );

                          if (author.authorId) {
                            return (
                              <Link
                                key={author.authorName}
                                to="/reports"
                                search={(prev: any) => ({ ...prev, authorId: String(author.authorId) })}
                                className="block no-underline group"
                              >
                                {cardContent}
                              </Link>
                            );
                          }

                          return (
                            <div key={author.authorName} className="block">
                              {cardContent}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card>

                  {/* 3.3 Research Gaps */}
                  <Card title="Research Gaps">
                    <p className="text-xs text-muted-foreground mb-4">
                      Keywords with the lowest number of research papers in your followed fields. These represent potential niche opportunities for research.
                    </p>
                    {report.landscape?.researchGaps?.length === 0 ? (
                      <div className="text-muted-foreground text-sm">No research gaps detected yet.</div>
                    ) : (
                      <div className="divide-y divide-border/30">
                        {report.landscape.researchGaps.map((gap) => {
                          const gapContent = (
                            <div className="flex items-center justify-between py-2.5 text-sm hover:bg-secondary/10 px-2 rounded-lg transition-colors cursor-pointer group">
                              <span className="font-semibold text-foreground group-hover:text-brand transition-colors">{gap.term}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono text-muted-foreground">{gap.paperCount} papers</span>
                                <Badge variant="outline" className="text-[10px] border-amber-500/20 bg-amber-500/10 text-amber-500 font-bold">
                                  Niche / Low Competition
                                </Badge>
                              </div>
                            </div>
                          );

                          if (gap.paperId) {
                            return (
                              <Link
                                key={gap.term}
                                to="/papers/$id"
                                params={{ id: String(gap.paperId) }}
                                className="block no-underline"
                              >
                                {gapContent}
                              </Link>
                            );
                          }

                          return (
                            <Link
                              key={gap.term}
                              to="/search"
                              search={{ q: gap.term }}
                              className="block no-underline"
                            >
                              {gapContent}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </Card>
                </div>

                {/* 3.2 Tag Cloud (Word Cloud) */}
                <Card title="Keyword Co-occurrence (Word Cloud)">
                  <p className="text-xs text-muted-foreground mb-4">
                    Keywords commonly co-occurring with your followed keywords. Chip color and trend indicator show keyword growth rate.
                  </p>
                  {report.landscape?.tagCloud?.length === 0 ? (
                    <div className="text-muted-foreground text-sm">No word cloud data available.</div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-center gap-2 p-6 border border-border/40 bg-surface-elevated/20 rounded-2xl min-h-[320px]">
                        {report.landscape.tagCloud.map((tag) => {
                          let colorClass = "text-muted-foreground border-border/40 bg-secondary/5 hover:bg-secondary/10 hover:border-border/80";
                          let trendIcon = "•";
                          if (tag.growthRate > 5.0) {
                            colorClass = "text-rose-400 border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 hover:border-rose-500/60 hover:shadow-[0_0_12px_rgba(244,63,94,0.15)]";
                            trendIcon = "↗️";
                          } else if (tag.growthRate > 1.5) {
                            colorClass = "text-amber-400 border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/60 hover:shadow-[0_0_12px_rgba(245,158,11,0.15)]";
                            trendIcon = "↗";
                          } else if (tag.growthRate > 0) {
                            colorClass = "text-sky-400 border-sky-500/30 bg-sky-500/5 hover:bg-sky-500/10 hover:border-sky-500/60 hover:shadow-[0_0_12px_rgba(56,189,248,0.15)]";
                            trendIcon = "→";
                          }

                          return (
                            <Link
                               key={tag.term}
                               to="/search"
                               search={{ q: tag.term }}
                               className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all hover:scale-105 cursor-pointer no-underline ${colorClass}`}
                               title={`Frequency: ${tag.coOccurrenceCount} times | Growth: +${tag.growthRate}%`}
                             >
                               <span>{tag.term}</span>
                               <span className="opacity-80 text-[10px] font-mono">{trendIcon} {tag.growthRate > 0 ? `+${tag.growthRate.toFixed(1)}%` : `${tag.growthRate.toFixed(1)}%`}</span>
                             </Link>
                          );
                        })}
                      </div>

                      {/* Chú thích màu sắc thể hiện tốc độ phát triển */}
                      <div className="flex flex-wrap justify-center gap-6 pt-3 text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-block size-3.5 rounded bg-rose-500/5 border border-rose-500/30" />
                          <span>Hot Growth (&gt; 5.0%)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="inline-block size-3.5 rounded bg-amber-500/5 border border-amber-500/30" />
                          <span>High Growth (1.5% - 5.0%)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="inline-block size-3.5 rounded bg-sky-500/5 border border-sky-500/30" />
                          <span>Stable Growth (0.0% - 1.5%)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="inline-block size-3.5 rounded bg-secondary/5 border border-border/40" />
                          <span>Static / No Change (&le; 0.0%)</span>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            </>
          )}
      </div>
    </AppLayout>
  );
}