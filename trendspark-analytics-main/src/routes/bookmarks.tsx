import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Card } from "@/components/Card";
import { useAnalyticsSnapshot } from "@/hooks/data/use-analytics";
import { useSavedItems } from "@/hooks/use-saved-items";
import { useState } from "react";
import { Download, Trash2, Users, Hash, Flame, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/bookmarks")({ component: BookmarksPage });

function BookmarksPage() {
  const { data: analytics } = useAnalyticsSnapshot();
  const { followedAuthors, followedKeywords, toggleAuthorFollow, toggleKeywordFollow } =
    useSavedItems();

  //const TRENDING_AUTHORS = analytics.trendingAuthors;
  //const TRENDING_KEYWORDS = analytics.trendingKeywords;
  const TRENDING_AUTHORS = analytics?.trendingAuthors ?? [];
  const TRENDING_KEYWORDS = analytics?.trendingKeywords ?? [];

  // Filter based on actual followed states
  const savedAuthors = followedAuthors.map((name) => {
    const found = TRENDING_AUTHORS.find((a) => a.name.toLowerCase() === name.toLowerCase());
    return (
      found || {
        id: name,
        name,
        affiliation: "Academic Institute",
        papers: 3,
        citations: 245,
        hIndex: 8,
        trendScore: 12.4,
      }
    );
  });

  const savedKeywords = followedKeywords.map((term) => {
    const found = TRENDING_KEYWORDS.find((k) => k.term.toLowerCase() === term.toLowerCase());
    return (
      found || {
        id: term,
        term,
        count: 8,
        category: "Computer Science",
        trendScore: 15.2,
      }
    );
  });

  const tabs = [
    { id: "authors", label: "Authors", count: savedAuthors.length },
    { id: "keywords", label: "Keywords", count: savedKeywords.length },
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
    } else {
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
    }
  };

  return (
    <AppLayout>
      <PageHeader
        title="Follow Center"
        subtitle="Your followed authors and followed keywords"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedAuthors.map((a) => (
              <Card key={a.id} className="hover:border-brand/35 transition-colors relative group">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="size-10 rounded-full flex items-center justify-center text-xs font-bold text-brand-foreground"
                    style={{ background: "var(--gradient-brand)" }}
                  >
                    {a.name.split(" ")[1]?.[0] ?? a.name[0] ?? "A"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm truncate">{a.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {a.affiliation}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-muted-foreground mb-1">
                  <div>
                    <div className="text-foreground text-sm font-semibold">{a.papers}</div>papers
                  </div>
                  <div>
                    <div className="text-foreground text-sm font-semibold">
                      {a.citations.toLocaleString()}
                    </div>
                    cites
                  </div>
                  <div>
                    <div className="text-foreground text-sm font-semibold">{a.hIndex}</div>h-idx
                  </div>
                </div>
                <button
                  onClick={() => {
                    toggleAuthorFollow(a.name);
                    toast.info(`Unfollowed ${a.name}`);
                  }}
                  className="absolute top-4 right-4 p-1.5 rounded-md border border-border hover:border-destructive/40 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                  title="Unfollow Author"
                >
                  <Trash2 className="size-3" />
                </button>
              </Card>
            ))}
          </div>
          {savedAuthors.length === 0 && (
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
                  <span className="font-mono text-sm text-success">
                    +{k.trendScore.toFixed(1)}%
                  </span>
                  <button
                    onClick={() => {
                      toggleKeywordFollow(k.term);
                      toast.info(`Unfollowed keyword: ${k.term}`);
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