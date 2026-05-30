import { createFileRoute, Link } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { Card } from "@/components/Card";
import { useFeaturedAuthors } from "@/hooks/data/use-authors";
import { ArrowUpRight, User } from "lucide-react";

export const Route = createFileRoute("/authors/")({ component: AuthorsIndexPage });

function AuthorsIndexPage() {
  const { data: authors = [], isLoading, isError } = useFeaturedAuthors();

  return (
    <AppLayout>
      <PageHeader
        title="Researchers"
        subtitle="Tác giả từ OpenAlex · nhấn để xem hồ sơ và danh sách bài báo"
      />

      {isError && (
        <p className="text-sm text-warning mb-4">
          Không tải được danh sách tác giả. Kiểm tra backend (port 8080) và chạy sync từ Admin.
        </p>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground p-8">Đang tải tác giả…</p>
      ) : authors.length === 0 ? (
        <Card>
          <p className="text-sm text-muted-foreground py-6 text-center">
            Chưa có tác giả trong hệ thống. Đăng nhập Admin → <strong>Run Manual Sync</strong>.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {authors.map((a) => (
            <Link
              key={a.id}
              to="/authors/$authorId"
              params={{ authorId: a.id }}
              className="glass rounded-2xl p-5 border border-border hover:border-brand/40 transition-colors group"
            >
              <div className="flex items-start justify-between gap-3">
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
                <ArrowUpRight className="size-4 text-muted-foreground group-hover:text-brand shrink-0" />
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
          ))}
        </div>
      )}
    </AppLayout>
  );
}
