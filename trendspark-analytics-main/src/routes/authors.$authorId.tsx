import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Card } from "@/components/Card";
import { SaveToCollectionButton } from "@/components/SaveToCollectionButton";
import { useAuthor, useAuthorPapers } from "@/hooks/data/use-authors";
import { ArrowLeft, ArrowUpRight, Building2, FileText, TrendingUp, User } from "lucide-react";

export const Route = createFileRoute("/authors/$authorId")({ component: AuthorProfilePage });

function AuthorProfilePage() {
  const { authorId } = Route.useParams();
  const { data: author, isLoading, isError } = useAuthor(authorId);
  const { data: papers = [], isLoading: loadingPapers } = useAuthorPapers(authorId);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-8 text-sm text-muted-foreground">Đang tải hồ sơ tác giả…</div>
      </AppLayout>
    );
  }

  if (isError || !author) throw notFound();

  return (
    <AppLayout>
      <PageHeader
        title={author.name}
        subtitle={`${author.affiliation} · nguồn: ${author.source ?? "OpenAlex / DB"}`}
        action={
          <div className="flex gap-2">
            <Link
              to="/authors"
              className="inline-flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-medium border border-border hover:bg-secondary/50"
            >
              <ArrowLeft className="size-4" /> Danh sách tác giả
            </Link>
            <Link
              to="/search"
              search={{ q: author.name }}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium border border-border hover:bg-secondary/50"
            >
              Tìm bài báo
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Stat label="Bài báo" value={String(author.papers)} icon={<FileText className="size-4" />} />
        <Stat label="Trích dẫn" value={author.citations.toLocaleString()} icon={<TrendingUp className="size-4" />} />
        <Stat label="h-index" value={String(author.hIndex)} icon={<User className="size-4" />} />
      </div>

      {author.openAlexId ? (
        <div className="mb-6 text-xs text-muted-foreground font-mono flex items-center gap-2">
          <Building2 className="size-3.5" />
          OpenAlex ID: {author.openAlexId}
        </div>
      ) : null}

      <Card title={`Bài báo của tác giả (${papers.length})`}>
        {loadingPapers ? (
          <p className="text-sm text-muted-foreground p-4">Đang tải danh sách bài báo…</p>
        ) : papers.length === 0 ? (
          <p className="text-sm text-muted-foreground p-4">
            Chưa có bài báo liên kết trong hệ thống. Chạy sync từ Admin để đồng bộ metadata từ OpenAlex.
          </p>
        ) : (
          <div className="space-y-3">
            {papers.map((p) => (
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
            ))}
          </div>
        )}
      </Card>
    </AppLayout>
  );
}

function Stat({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
        {icon}
        {label}
      </div>
      <div className={`text-2xl font-bold font-mono ${accent ? "text-brand" : ""}`}>{value}</div>
    </div>
  );
}
