import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Card } from "@/components/Card";
import { useAnalyticsSnapshot } from "@/hooks/data/use-analytics";
import { useFeaturedAuthors } from "@/hooks/data/use-authors";
import { useQueries } from "@tanstack/react-query";
import { getServices, queryKeys } from "@/services";
import { mockQueryDefaults } from "@/hooks/data/query-options";

import type { Author, FollowedAuthor } from "@/types/domain";
import { useMemo, useState } from "react";

import { Download, Trash2, Users, Hash, Flame, ArrowRight, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/auth";
import { useFollowedJournals, useUnfollowJournal, useFollowedTopics, useUnfollowTopic, useFollowedAuthors, useUnfollowAuthor } from "@/hooks/data/use-follows";
import { ApiError } from "@/api/errors";

export const Route = createFileRoute("/bookmarks")({ component: BookmarksPage });

type SavedAuthorCard = Author & { profileId: string | null };

function resolveStoredAuthorId(
  author: FollowedAuthor,
  trendingAuthors: Author[],
  featuredAuthors: Author[],
): string | null {
  if (author.id) return author.id;
  const needle = author.name.toLowerCase();
  const fromFeatured = featuredAuthors.find((a) => a.name.toLowerCase() === needle);
  if (fromFeatured) return fromFeatured.id;
  const fromTrending = trendingAuthors.find((a) => a.name.toLowerCase() === needle);
  return fromTrending?.id ?? null;
}

function BookmarksPage() {
  const { user } = useAuth();
  const { data: analytics } = useAnalyticsSnapshot();

  const { data: featuredAuthors = [] } = useFeaturedAuthors();

  const { data: followedJournals = [], isLoading: loadingJournals } = useFollowedJournals();
  const unfollowJournal = useUnfollowJournal();
  const { data: followedTopics = [] } = useFollowedTopics();
  const unfollowTopic = useUnfollowTopic();
  const { data: followedAuthors = [], isLoading: loadingAuthors } = useFollowedAuthors();
  const unfollowAuthor = useUnfollowAuthor();


  //const TRENDING_AUTHORS = analytics.trendingAuthors;
  //const TRENDING_KEYWORDS = analytics.trendingKeywords;
  const TRENDING_AUTHORS = analytics?.trendingAuthors ?? [];

  const followedAuthorsQueries = useQueries({
    queries: followedAuthors.map((author) => {
      const profileId = resolveStoredAuthorId(author, TRENDING_AUTHORS, featuredAuthors);
      return {
        queryKey: queryKeys.authors.detail(profileId ?? ""),
        queryFn: () => getServices().authors.getById(profileId ?? ""),
        enabled: Boolean(profileId),
        ...mockQueryDefaults,
      };
    }),
  });

  const savedAuthors = useMemo((): SavedAuthorCard[] => {
    return followedAuthors.map((author, index) => {
      const profileId = resolveStoredAuthorId(author, TRENDING_AUTHORS, featuredAuthors);
      const query = followedAuthorsQueries[index];
      const detail = query?.data;
      const needle = author.name.toLowerCase();
      const stats =
        featuredAuthors.find((a) => a.name.toLowerCase() === needle) ??
        TRENDING_AUTHORS.find((a) => a.name.toLowerCase() === needle);

      return {
        id: profileId ?? author.name,
        name: author.name,
        profileId,
        affiliation: detail?.affiliation ?? stats?.affiliation ?? "Academic Institute",
        papers: detail?.papers ?? stats?.papers ?? 3,
        citations: detail?.citations ?? stats?.citations ?? 245,
        hIndex: detail?.hIndex ?? stats?.hIndex ?? 8,
        trendScore: detail?.trendScore ?? stats?.trendScore ?? 12.4,
      };
    });
  }, [followedAuthors, followedAuthorsQueries, TRENDING_AUTHORS, featuredAuthors]);


  /** Map backend TopicTrend → keyword card shape for display. */
  const savedKeywords = followedTopics.map((t) => ({
    id: t.id,
    term: t.name,
    count: t.paperCount,
    category: "Research",
    trendScore: t.trendScore,
  }));

  const tabs = [
    { id: "authors", label: "Authors", count: savedAuthors.length },
    { id: "keywords", label: "Keywords", count: savedKeywords.length },
    { id: "journals", label: "Journals", count: followedJournals.length },
  ] as const;

  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("authors");

  const exportCsv = () => {
    if (tab === "authors") {
      if (savedAuthors.length === 0) {
        toast.error("No followed authors to export");
        return;
      }
      const header = "name,affiliation,papers,citations,hIndex";
      const rows = savedAuthors.map((a) =>
        [a.name, a.affiliation, a.papers, a.citations, a.hIndex]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      );
      const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "followed_authors.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${savedAuthors.length} followed authors exported`);
    } else if (tab === "keywords") {
      if (savedKeywords.length === 0) {
        toast.error("No followed keywords to export");
        return;
      }
      const header = "term,category,trendScore";
      const rows = savedKeywords.map((k) =>
        [k.term, k.category, k.trendScore]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      );
      const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "followed_keywords.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${savedKeywords.length} followed keywords exported`);
    } else if (tab === "journals") {
      if (followedJournals.length === 0) {
        toast.error("No followed journals to export");
        return;
      }
      const header = "name,publisher,issn,domain";
      const rows = followedJournals.map((j) =>
        [j.name, j.publisher ?? "", j.issn ?? "", j.domain ?? ""].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","),
      );
      const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "followed_journals.csv";
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${followedJournals.length} followed journals exported`);
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Bookmarks"
        subtitle="Authors · Keywords & Journals (synced with backend when signed in)"
        action={
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium border border-border bg-surface/50 hover:bg-surface transition-colors cursor-pointer"
          >
            <Download className="size-4" /> Export
          </button>
        }
      />

      <div className="flex gap-1 mb-6 p-1 rounded-xl glass w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${tab === t.id ? "bg-brand/15 text-brand" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t.label} <span className="ml-1 text-[10px] font-mono opacity-70">{t.count}</span>
          </button>
        ))}
      </div>

      {tab === "authors" && (
        <div>
          {!user ? (
            <div className="text-center py-16 glass rounded-2xl border border-border max-w-md mx-auto">
              <p className="text-sm text-muted-foreground px-4">Đăng nhập để theo dõi tác giả và đồng bộ dữ liệu.</p>
              <Link to="/login" className="mt-4 inline-block text-sm text-brand hover:underline">
                Sign in
              </Link>
            </div>
          ) : loadingAuthors ? (
            <p className="text-sm text-muted-foreground">Loading authors…</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

              {savedAuthors.map((a) => {
                const authorFollowId = a.profileId ?? followedAuthors.find((fa) => fa.name.toLowerCase() === a.name.toLowerCase())?.id;
                const cardBody = (
                  <>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="size-10 rounded-full flex items-center justify-center text-xs font-bold text-brand-foreground" style={{ background: "var(--gradient-brand)" }}>
                        {a.name.split(" ")[1]?.[0] ?? a.name[0] ?? "A"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-sm truncate">{a.name}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{a.affiliation}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-muted-foreground mb-1">
                      <div><div className="text-foreground text-sm font-semibold">{a.papers}</div>papers</div>
                      <div><div className="text-foreground text-sm font-semibold">{a.citations.toLocaleString()}</div>cites</div>
                      <div><div className="text-foreground text-sm font-semibold">{a.hIndex}</div>h-idx</div>

                    </div>
                  </>
                );

                return (
                  <div key={`${a.profileId ?? "noid"}-${a.name}`} className="relative group">
                    {a.profileId ? (
                      <Link
                        to="/authors/$authorId"
                        params={{ authorId: a.profileId }}
                        className="block"
                      >
                        <Card className="hover:border-brand/35 transition-colors cursor-pointer">
                          {cardBody}
                        </Card>
                      </Link>
                    ) : (
                      <Card className="hover:border-brand/35 transition-colors relative">
                        {cardBody}
                      </Card>
                    )}
                    <button
                      type="button"
                      disabled={unfollowAuthor.isPending}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!authorFollowId) return;
                        unfollowAuthor.mutate(authorFollowId, {
                          onSuccess: () => toast.info(`Unfollowed ${a.name}`),
                          onError: (err) => {
                            const msg = err instanceof ApiError ? err.message : "Unfollow failed";
                            toast.error(msg);
                          },
                        });
                      }}
                      className="absolute top-4 right-4 z-10 p-1.5 rounded-md border border-border hover:border-destructive/40 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                      title="Unfollow Author"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>

                );
              })}

            </div>
          )}
          {user && !loadingAuthors && savedAuthors.length === 0 && (
            <div className="text-center py-16 glass rounded-2xl border border-border max-w-md mx-auto">
              <div className="size-12 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-brand mx-auto mb-4">
                <Users className="size-5" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">No followed authors</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto px-4">
                Follow researchers from paper detail views or trending authors lists to monitor
                their velocity.
              </p>
              <Link
                to="/trends"
                className="mt-6 inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-xs font-semibold text-brand-foreground glow-brand"
                style={{ background: "var(--gradient-brand)" }}
              >
                <Flame className="size-3.5" /> View Trending Authors{" "}
                <ArrowRight className="size-3" />
              </Link>
            </div>
          )}
        </div>
      )}

      {tab === "journals" && (
        <div>
          {!user ? (
            <div className="text-center py-16 glass rounded-2xl border border-border max-w-md mx-auto">
              <p className="text-sm text-muted-foreground px-4">Đăng nhập để theo dõi journal và nhận thông báo bài mới sau sync.</p>
              <Link to="/login" className="mt-4 inline-block text-sm text-brand hover:underline">
                Sign in
              </Link>
            </div>
          ) : loadingJournals ? (
            <p className="text-sm text-muted-foreground">Loading journals…</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {followedJournals.map((j) => (
                <Card key={j.id} className="flex items-center justify-between hover:border-brand/35 transition-colors group">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm flex items-center gap-1.5 text-foreground">
                      <BookOpen className="size-3.5 text-brand shrink-0" /> {j.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1 truncate">
                      {[j.publisher, j.domain].filter(Boolean).join(" · ") || "Academic journal"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      unfollowJournal.mutate(j.id, {
                        onSuccess: () => toast.info(`Unfollowed journal: ${j.name}`),
                        onError: (err) => {
                          const msg = err instanceof ApiError ? err.message : "Unfollow failed";
                          toast.error(msg);
                        },
                      });
                    }}
                    className="p-1.5 rounded-md border border-border hover:border-destructive/40 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer shrink-0"
                    title="Unfollow journal"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </Card>
              ))}
            </div>
          )}
          {user && !loadingJournals && followedJournals.length === 0 && (
            <div className="text-center py-16 glass rounded-2xl border border-border max-w-md mx-auto">
              <div className="size-12 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-brand mx-auto mb-4">
                <BookOpen className="size-5" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">No followed journals</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto px-4">
                Mở chi tiết bài báo và bấm <strong>Follow journal</strong> để nhận thông báo khi sync có bài mới.
              </p>
            </div>
          )}
        </div>
      )}


      {tab === "keywords" && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {savedKeywords.map((k) => (
              <Card
                key={k.id}
                className="flex items-center justify-between hover:border-brand/35 transition-colors group"
              >
                <div>
                  <div className="font-semibold text-sm flex items-center gap-1.5 text-foreground">
                    <Hash className="size-3.5 text-brand" /> {k.term}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {k.count} papers · {k.category}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-mono text-sm ${k.trendScore >= 0 ? "text-success" : "text-destructive"}`}>
                    {k.trendScore > 0 ? "+" : ""}{k.trendScore.toFixed(1)}%
                  </span>
                  <button
                    onClick={() => {
                      unfollowTopic.mutate(k.id, {
                        onSuccess: () => toast.info(`Unfollowed keyword: ${k.term}`),
                        onError: (err) => {
                          const msg = err instanceof ApiError ? err.message : "Unfollow failed";
                          toast.error(msg);
                        },
                      });
                    }}
                    className="p-1.5 rounded-md border border-border hover:border-destructive/40 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                    title="Unfollow Keyword"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
          {savedKeywords.length === 0 && (
            <div className="text-center py-16 glass rounded-2xl border border-border max-w-md mx-auto">
              <div className="size-12 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center text-brand mx-auto mb-4">
                <Hash className="size-5" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">No followed keywords</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto px-4">
                Click keyword badges inside search cards, details pages, or trend rank tables to
                track analytics.
              </p>
              <Link
                to="/trends"
                className="mt-6 inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-xs font-semibold text-brand-foreground glow-brand"
                style={{ background: "var(--gradient-brand)" }}
              >
                <Flame className="size-3.5" /> View Trending Keywords{" "}
                <ArrowRight className="size-3" />
              </Link>
            </div>
          )}
        </div>
      )}
    </AppLayout>
  );
}