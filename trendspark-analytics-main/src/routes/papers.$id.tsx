import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Card } from "@/components/Card";
import { usePaper, useRelatedPapers } from "@/hooks/data/use-papers";
import { useSavedItems } from "@/hooks/use-saved-items";
import { buildPaperCitationSeries } from "@/utils/paper-series";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { UserPlus, ArrowUpRight, ExternalLink, UserCheck, BookMarked } from "lucide-react";
import { toast } from "sonner";
import { SaveToCollectionButton } from "@/components/SaveToCollectionButton";
import { useAuth } from "@/auth";
import { useFollowedJournals, useFollowJournal, useUnfollowJournal } from "@/hooks/data/use-follows";
import { ApiError } from "@/api/errors";

export const Route = createFileRoute("/papers/$id")({
  component: PaperDetailPage,
});

function PaperDetailPage() {
  const { id } = Route.useParams();
  const { data: paper, isLoading, isError } = usePaper(id);
  const category = paper?.category ?? "General";
  const { data: related = [] } = useRelatedPapers(id, category);

  const { user } = useAuth();
  const {
    isAuthorFollowed,
    toggleAuthorFollow,
    isKeywordFollowed,
    toggleKeywordFollow,
  } = useSavedItems();
  const { data: followedJournals = [] } = useFollowedJournals();
  const followJournal = useFollowJournal();
  const unfollowJournal = useUnfollowJournal();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-8 text-sm text-muted-foreground">Loading paper…</div>
      </AppLayout>
    );
  }

  if (isError || !paper) throw notFound();

  const authors = paper.authors?.length ? paper.authors : ["Unknown author"];
  const keywords = paper.keywords ?? [];
  const series = buildPaperCitationSeries(paper.id, paper.citations ?? 0);

  const primaryAuthorRef = paper.authorRefs?.[0];
  const mainAuthorName = primaryAuthorRef?.name ?? authors[0];
  const mainAuthorId = primaryAuthorRef?.id ?? null;
  const mainAuthorFollowed = isAuthorFollowed(mainAuthorName);

  const journalId = paper?.journalId ?? null;
  const journalFollowed = journalId ? followedJournals.some((j) => j.id === journalId) : false;

  return (
    <AppLayout>
      <PageHeader
        title={paper.title}
        subtitle={`${paper.journal} · ${paper.year} · ${paper.source}`}
        action={
          <div className="flex gap-2">
            <SaveToCollectionButton paperId={paper.id} paperTitle={paper.title} size="md" />
            {user && journalId ? (
              <button
                type="button"
                disabled={followJournal.isPending || unfollowJournal.isPending}
                onClick={() => {
                  const mutate = journalFollowed ? unfollowJournal : followJournal;
                  mutate.mutate(journalId, {
                    onSuccess: () =>
                      toast.success(journalFollowed ? `Đã bỏ theo dõi journal: ${paper.journal}` : `Đang theo dõi journal: ${paper.journal}`),
                    onError: (err) => {
                      const msg = err instanceof ApiError ? err.message : "Không cập nhật follow journal";
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
            <button
              onClick={() => {
                const added = toggleAuthorFollow({ id: mainAuthorId, name: mainAuthorName });
                if (added) {
                  toast.success(`Following ${mainAuthorName}`);
                } else {
                  toast.info(`Unfollowed ${mainAuthorName}`);
                }
              }}
              className={`inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold transition-all ${
                mainAuthorFollowed
                  ? "bg-brand/10 border border-brand/45 text-brand"
                  : "text-brand-foreground glow-brand"
              }`}
              style={mainAuthorFollowed ? undefined : { background: "var(--gradient-brand)" }}
            >
              {mainAuthorFollowed ? <UserCheck className="size-4" /> : <UserPlus className="size-4" />}
              {mainAuthorFollowed ? "Following" : "Follow Author"}
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card title="Abstract">
            <p className="text-sm text-muted-foreground leading-relaxed">{paper.abstract || "No abstract available."}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {keywords.map((k: string) => {
                const followed = isKeywordFollowed(k);
                return (
                  <button
                    key={k}
                    onClick={() => {
                      const added = toggleKeywordFollow(k);
                      if (added) {
                        toast.success(`Following keyword: ${k}`);
                      } else {
                        toast.info(`Unfollowed keyword: ${k}`);
                      }
                    }}
                    className={`text-xs px-2.5 py-1 rounded-full border flex items-center gap-1 transition-all cursor-pointer ${
                      followed
                        ? "border-brand/40 bg-brand/10 text-brand font-medium hover:bg-brand/20"
                        : "border-border bg-secondary/40 text-foreground hover:border-brand/30"
                    }`}
                  >
                    <span>{k}</span>
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
        </div>

        <div className="space-y-6">
          <Card title="Metrics">
            <div className="grid grid-cols-2 gap-4">
              <Metric label="Trend Score" value={`+${(paper.trendScore ?? 0).toFixed(1)}%`} accent />
              <Metric label="Citations" value={(paper.citations ?? 0).toLocaleString()} />
              <Metric label="Impact Factor" value={(paper.impactFactor ?? 0).toString()} />
              <Metric label="Year" value={paper.year.toString()} />
            </div>
          </Card>

          <Card title="Authors">
            <div className="space-y-3">
              {(paper.authorRefs?.length
                ? paper.authorRefs.map((ref) => ({ id: ref.id, name: ref.name }))
                : paper.authors.map((name) => ({ id: null as string | null, name }))
              ).map((author) => {
                const a = author.name;
                const followed = isAuthorFollowed(a);
                return (
                  <div key={author.id ?? a} className="flex items-center gap-3">
                    <div className="size-8 rounded-full flex items-center justify-center text-[10px] font-bold text-brand-foreground" style={{ background: "var(--gradient-brand)" }}>
                      {a.split(",")[0].slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 text-sm text-foreground">
                      {author.id ? (
                        <Link to="/authors/$authorId" params={{ authorId: author.id }} className="hover:text-brand font-medium">
                          {a}
                        </Link>
                      ) : (
                        a
                      )}
                    </div>
                    <button
                      onClick={() => {
                        const added = toggleAuthorFollow({ id: author.id, name: a });
                        if (added) {
                          toast.success(`Following ${a}`);
                        } else {
                          toast.info(`Unfollowed ${a}`);
                        }
                      }}
                      className={`text-[10px] px-2 py-1 rounded-md border transition-all ${
                        followed
                          ? "border-brand/40 bg-brand/10 text-brand"
                          : "border-border hover:border-brand/40 hover:text-brand"
                      }`}
                    >
                      {followed ? "Following" : "Follow"}
                    </button>
                  </div>
                );
              })}
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
        </div>
      </div>
    </AppLayout>
  );
}

function Metric({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`text-lg font-bold font-mono mt-1 ${accent ? "text-success" : "text-foreground"}`}>{value}</p>
    </div>
  );
}
