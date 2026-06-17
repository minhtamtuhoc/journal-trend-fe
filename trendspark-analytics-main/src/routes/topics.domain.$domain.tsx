import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Card } from "@/components/Card";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";
import type { Paper } from "@/types/domain";
import { ArrowLeft, ArrowUpRight, TrendingUp, Calendar, BookOpen } from "lucide-react";
import { SaveToCollectionButton } from "@/components/SaveToCollectionButton";
import { isBrowser } from "@/hooks/data/client-only";

export const Route = createFileRoute("/topics/domain/$domain")({ component: TopicDomainPage });


function useTopicPapers(domain: string) {
  return useQuery({
    queryKey: ["topic-domain-papers", domain],
    queryFn: () =>
      apiClient.get<{ data: Paper[] }>("/v1/papers/by-domain", {
        params: { domain },
      }),
    enabled: isBrowser && Boolean(domain),
  });
}

function TopicDomainPage() {
  const { domain } = Route.useParams();
  const decodedDomain = decodeURIComponent(domain);
  const { data, isLoading } = useTopicPapers(decodedDomain);

  const papers = data?.data ?? [];
  const total = papers.length;

  return (
    <AppLayout>
      <PageHeader
        title={decodedDomain}
        subtitle={`${total.toLocaleString()} bài báo liên quan đến lĩnh vực ${decodedDomain}`}
        action={
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium border border-border hover:bg-secondary/50 transition-colors"
          >
            <ArrowLeft className="size-4" /> Dashboard
          </Link>
        }
      />

      <Card title={`Related Papers (${total.toLocaleString()})`}>
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 rounded-lg bg-secondary/30" />
            ))}
          </div>
        ) : papers.length === 0 ? (
          <div className="py-12 text-center">
            <BookOpen className="size-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              Không có bài báo nào liên quan đến lĩnh vực <strong>{decodedDomain}</strong>.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Hãy chạy sync dữ liệu hoặc recalculate trend trong trang Admin.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {papers.map((p) => (
              <div
                key={p.id}
                className="flex items-start justify-between gap-4 p-4 rounded-xl border border-border bg-secondary/10 hover:bg-secondary/20 hover:border-brand/40 transition-all group"
              >
                <Link to="/papers/$id" params={{ id: p.id }} className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground mb-1.5">
                    <span className="text-brand truncate max-w-[200px]">{p.journal}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="size-2.5" />
                      {p.year}
                    </span>
                    {(p.trendScore ?? 0) > 0 && (
                      <>
                        <span>·</span>
                        <span className="flex items-center gap-1 text-success">
                          <TrendingUp className="size-2.5" />
                          +{(p.trendScore ?? 0).toFixed(1)}%
                        </span>
                      </>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-foreground group-hover:text-brand transition-colors line-clamp-2">
                    {p.title}
                  </div>
                  {p.authors?.length > 0 && (
                    <div className="text-[10px] text-muted-foreground mt-1 truncate">
                      {p.authors.slice(0, 3).join(", ")}
                      {p.authors.length > 3 && ` +${p.authors.length - 3} more`}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.keywords?.slice(0, 4).map((k) => (
                      <span
                        key={k.id}
                        className="text-[9px] px-1.5 py-0.5 rounded-full bg-brand/10 text-brand font-mono"
                      >
                        {k.name}
                      </span>
                    ))}
                  </div>
                </Link>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-[10px] font-mono font-bold text-brand bg-brand/10 px-2 py-0.5 rounded">
                    {p.citations} citations
                  </span>
                  {p.doi && (
                    <div className="flex gap-1">
                      <SaveToCollectionButton paperId={p.id} paperTitle={p.title} />
                      <Link
                        to="/papers/$id"
                        params={{ id: p.id }}
                        className="p-1.5 rounded-md border border-border hover:border-brand/40 hover:text-brand transition-colors"
                      >
                        <ArrowUpRight className="size-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </AppLayout>
  );
}
