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
  ChevronLeft,
  ChevronRight,
  Check,
  ArrowLeft,
  FileText,
  TrendingUp,
  ArrowUpRight,
  Bookmark,
  Building2,
  Tag,
  Layers,
} from "lucide-react";
import type { KeywordTrendPoint } from "@/types/report";
import {
  Tooltip as UiTooltip,
  TooltipContent as UiTooltipContent,
  TooltipProvider as UiTooltipProvider,
  TooltipTrigger as UiTooltipTrigger,
} from "@/components/ui/tooltip";

export const Route = createFileRoute("/reports")({
  component: ReportsPage,
  validateSearch: (search: Record<string, unknown>) => search,
});

// Helper lấy từ khóa tìm kiếm sạch (nếu từ khóa ghép dạng "Psychiatry, Mental Health, Neuroscience" -> lấy "Psychiatry" để backend SQL LIKE tìm ra bài báo)
function getCleanSearchTerm(term: string): string {
  if (!term) return "";
  return term.includes(",") ? term.split(",")[0].trim() : term.trim();
}

// === HÀM CHUYỂN ĐỔI DỮ LIỆU BẢNG BIỂU ĐƯỜNG (RECHARTS LINE CHART TRANSFORMER) ===
// Chuẩn hóa mốc thời gian 3 tháng gần nhất và gom từ khóa xu hướng để vẽ biểu đồ LineChart
function transformLineChartData(points: KeywordTrendPoint[]) {
  const periodMap: Record<string, { label: string; sortKey: number; values: Record<string, number> }> = {};
  const terms = new Set<string>();

  // 1. Gom tất cả danh sách các từ khóa độc nhất
  points.forEach((p) => terms.add(p.term));

  // 2. Tự động khởi tạo mốc thời gian 3 tháng gần đây nhất (bỏ tháng hiện tại, ví dụ tháng 7)
  const generateLast3Months = () => {
    const list: { label: string; sortKey: number }[] = [];
    const now = new Date();
    for (let i = 3; i >= 1; i--) {
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
    // Khởi tạo giá trị mặc định bằng 0 cho toàn bộ các từ khóa
    terms.forEach((term) => {
      periodMap[p.label].values[term] = 0;
    });
  });

  // 3. Đổ số liệu bài báo thực tế từ Backend API vào từng mốc thời gian
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

// === HÀM DỊCH LÝ DO ĐỀ XUẤT BÀI BÁO (RECOMMENDATION REASON TRANSLATOR) ===
// Chuyển đổi các lý do gợi ý dạng văn bản tiếng Việt từ BE sang tiếng Anh chuẩn giao diện
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

// === COMPONENT THỐNG KÊ CHỈ SỐ BÁO CÁO (CUSTOM REPORT STAT CARD) ===
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

// === VIEW BÁO CÁO PHÂN TÍCH CHUYÊN SÂU TÁC GIẢ (CUSTOM AUTHOR REPORT VIEW) ===
// Hiển thị khi người dùng click xem phân tích của 1 tác giả cụ thể từ trang Reports
function CustomAuthorReportView({ authorId }: { authorId: string }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 14;

  // Lấy dữ liệu tác giả và danh sách bài báo của tác giả từ API
  const { data: author, isLoading: loadingAuthor, isError } = useAuthor(authorId);
  const { data: papers = [], isLoading: loadingPapers } = useAuthorPapers(authorId);
  const { data: followedTopics = [] } = useFollowedTopics();
  const { data: followedAuthors = [] } = useFollowedAuthors();
  const { user } = useAuth();

  const followAuthorMut = useFollowAuthor();
  const unfollowAuthorMut = useUnfollowAuthor();
  const followed = followedAuthors.some((a) => a.id === authorId);

  const [viewMode, setViewMode] = useState<"matched" | "all">("matched");

  // Danh sách các từ khóa tiếng Anh viết thường mà người dùng đang follow
  const followedTerms = useMemo(() => new Set(followedTopics.map(t => t.name.toLowerCase().trim())), [followedTopics]);
  const followedTermList = useMemo(() => Array.from(followedTerms), [followedTerms]);

  // Hàm kiểm tra từ khóa của bài báo có khớp với từ khóa follow (so sánh chính xác hoặc chứa chuỗi)
  const isKeywordMatch = (kwName: string) => {
    if (!kwName) return false;
    const lower = kwName.toLowerCase().trim();
    if (followedTerms.has(lower)) return true;
    return followedTermList.some(t => lower.length > 2 && (lower.includes(t) || t.includes(lower)));
  };

  // Lọc các bài báo của tác giả có chứa từ khóa mà người dùng đang theo dõi
  const matchedPapers = useMemo(() => {
    if (followedTerms.size === 0) return papers;
    return papers.filter(p => p.keywords?.some(k => isKeywordMatch(k.name)));
  }, [papers, followedTerms, followedTermList]);

  // Danh sách từ khóa trùng khớp giữa bài báo của tác giả và danh sách follow của người dùng
  const matchedFollowedKeywords = useMemo(() => {
    const matches = new Set<string>();
    papers.forEach(p => {
      p.keywords?.forEach(k => {
        if (isKeywordMatch(k.name)) {
          const kwLower = k.name.toLowerCase().trim();
          // Ưu tiên khớp tên từ khóa follow chính xác trước
          const exactOriginal = followedTopics.find(t => t.name.toLowerCase().trim() === kwLower);
          if (exactOriginal) {
            matches.add(exactOriginal.name);
          } else {
            // Nếu khớp qua tìm kiếm chứa chuỗi, giữ nguyên tên từ khóa k.name để không bị trùng lặp/ép tên khiến giảm số lượng từ khóa
            matches.add(k.name.trim());
          }
        }
      });
    });
    return Array.from(matches);
  }, [papers, followedTerms, followedTopics, followedTermList]);

  // Quyết định danh sách bài báo hiển thị (ưu tiên matched, nếu rỗng hoặc chọn 'all' thì hiện tất cả)
  const displayPapers = (viewMode === "matched" && matchedPapers.length > 0) ? matchedPapers : papers;

  // Phân trang danh sách bài báo hiển thị
  const hasPagination = displayPapers.length > 14;
  const totalPages = Math.ceil(displayPapers.length / itemsPerPage);
  const paginatedPapers = hasPagination
    ? displayPapers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : displayPapers;

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
      {/* Header trang báo cáo tác giả & Nút Follow/Unfollow */}
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
              className={`inline-flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${followed
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

      {/* Cụm 3 Thống kê quan trọng của Tác giả */}
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

      {/* Danh sách các bài báo của tác giả */}
      <Card
        title={
          <div className="flex items-center justify-between flex-wrap gap-2 w-full">
            <span>
              {viewMode === "matched" && matchedPapers.length > 0
                ? `Papers with Followed Keywords (${matchedPapers.length})`
                : `All Papers (${papers.length})`}
            </span>
            <div className="flex gap-1.5 text-xs font-normal">
              <button
                type="button"
                onClick={() => setViewMode("matched")}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  viewMode === "matched"
                    ? "bg-brand/15 text-brand font-semibold border border-brand/30"
                    : "bg-secondary/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                Matched ({matchedPapers.length})
              </button>
              <button
                type="button"
                onClick={() => setViewMode("all")}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  viewMode === "all"
                    ? "bg-brand/15 text-brand font-semibold border border-brand/30"
                    : "bg-secondary/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                All Papers ({papers.length})
              </button>
            </div>
          </div>
        }
      >
        {matchedPapers.length === 0 && viewMode === "matched" && papers.length > 0 && (
          <div className="mb-4 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 text-amber-400 text-xs flex items-center justify-between gap-2">
            <span>No papers directly matched your followed keywords. Showing all <strong>{papers.length}</strong> papers by this author below:</span>
            <button
              type="button"
              onClick={() => setViewMode("all")}
              className="underline font-semibold hover:text-amber-300"
            >
              Switch to All Papers
            </button>
          </div>
        )}

        {paginatedPapers.length === 0 ? (
          <p className="text-sm text-muted-foreground p-4">
            No papers available for this author.
          </p>
        ) : (
          <>
            <div className="space-y-3">
              {paginatedPapers.map((p) => {
                const paperMatchedKws = p.keywords
                  ? p.keywords
                    .filter(k => isKeywordMatch(k.name))
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
                    className={`inline-flex items-center justify-center size-8 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${currentPage === p
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

// === COMPONENT THANH CHỌN DOMAIN NGANG TƯƠNG TÁC CAO (DOMAIN TAB BAR) ===
// Hỗ trợ nút cuộn Trái/Phải, lăn chuột ngang (mouse wheel), và kéo rê bằng chuột (drag-to-scroll)
function DomainTabBar({
  domains,
  selectedDomain,
  onSelectDomain,
}: {
  domains: { domain: string }[];
  selectedDomain: string;
  onSelectDomain: (domain: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftPos, setScrollLeftPos] = useState(0);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
  };

  useEffect(() => {
    checkScroll();
    const handleResize = () => checkScroll();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [domains]);

  const handleWheel = (e: React.WheelEvent) => {
    if (!scrollRef.current) return;
    if (e.deltaY !== 0) {
      scrollRef.current.scrollLeft += e.deltaY;
      checkScroll();
    }
  };

  const scrollBy = (amount: number) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
    setTimeout(checkScroll, 320);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeftPos(scrollRef.current.scrollLeft);
  };

  const handleMouseLeaveOrUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeftPos - walk;
    checkScroll();
  };

  return (
    <div className="relative flex items-center group/domain-bar">
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollBy(-240)}
          className="absolute -left-3 z-20 size-8 rounded-full bg-background/90 backdrop-blur-md border border-border shadow-lg flex items-center justify-center text-foreground hover:bg-brand/15 hover:border-brand/40 hover:text-brand transition-all cursor-pointer"
          title="Scroll Left"
        >
          <ChevronLeft className="size-4" />
        </button>
      )}

      <div
        ref={scrollRef}
        onScroll={checkScroll}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeaveOrUp}
        onMouseUp={handleMouseLeaveOrUp}
        onMouseMove={handleMouseMove}
        className={`flex items-center gap-1.5 p-1.5 bg-secondary/30 backdrop-blur-md rounded-2xl border border-border/60 overflow-x-auto scrollbar-none w-full select-none ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        {domains.map((d) => {
          const isSelected = selectedDomain === d.domain;
          return (
            <button
              key={d.domain}
              type="button"
              onClick={() => onSelectDomain(d.domain)}
              className={`h-9 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                isSelected
                  ? "bg-brand/15 border border-brand/40 text-brand shadow-sm"
                  : "border border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              <span className={`size-2 rounded-full ${isSelected ? "bg-brand animate-pulse" : "bg-muted-foreground/40"}`} />
              {d.domain}
            </button>
          );
        })}
      </div>

      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollBy(240)}
          className="absolute -right-3 z-20 size-8 rounded-full bg-background/90 backdrop-blur-md border border-border shadow-lg flex items-center justify-center text-foreground hover:bg-brand/15 hover:border-brand/40 hover:text-brand transition-all cursor-pointer"
          title="Scroll Right"
        >
          <ChevronRight className="size-4" />
        </button>
      )}
    </div>
  );
}

// === TRANG CHÍNH BÁO CÁO & PHÂN TÍCH THÔNG MINH (REPORTS & INSIGHTS PAGE) ===
function ReportsPage() {
  const { authorId } = Route.useSearch() as { authorId?: string }; // ID tác giả nếu chuyển từ báo cáo chi tiết tác giả
  const [activeTab, setActiveTab] = useState<"ALL" | "KEYWORD" | "AUTHOR" | "JOURNAL">("ALL"); // Tab bộ lọc đề xuất bài báo
  const { data: report, isLoading, error } = usePersonalReport(activeTab); // Hook gọi API lấy báo cáo cá nhân hóa
  const { data: collectionsData } = useCollections();
  const collections = useMemo(() => collectionsData ?? [], [collectionsData]);

  // Lấy dữ liệu các đối tượng người dùng đang theo dõi
  const { data: followedTopics = [], isLoading: isLoadingTopics } = useFollowedTopics();
  const { data: followedAuthors = [], isLoading: isLoadingAuthors } = useFollowedAuthors();
  const { data: followedJournals = [], isLoading: isLoadingJournals } = useFollowedJournals();

  const isPageLoading = isLoading || isLoadingTopics || isLoadingAuthors || isLoadingJournals;
  // Kiểm tra xem người dùng đã follow ít nhất 1 thực thể (keyword/author/journal) nào chưa
  const hasFollowedEntities = followedTopics.length > 0 || followedAuthors.length > 0 || followedJournals.length > 0;

  // Quản lý domain được chọn cho mục Hot Topics & Research Gaps
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  useEffect(() => {
    const domains = report?.landscape?.followedDomains;
    if (domains && domains.length > 0) {
      if (!selectedDomain || !domains.some((d) => d.domain === selectedDomain)) {
        setSelectedDomain(domains[0].domain);
      }
    } else {
      setSelectedDomain(null);
    }
  }, [report, selectedDomain]);

  const followedDomains = report?.landscape?.followedDomains ?? [];
  const activeDomain = followedDomains.find((d) => d.domain === selectedDomain) ?? followedDomains[0];

  const followedKeywordNames = useMemo(() => {
    return new Set(followedTopics.map((t) => t.name.toLowerCase()));
  }, [followedTopics]);

  // Chuẩn hóa dữ liệu vẽ biểu đồ LineChart xu hướng từ khóa
  const { chartData, terms: allTerms } = useMemo(() => {
    return transformLineChartData(report?.trends?.lineChart ?? []);
  }, [report?.trends?.lineChart]);

  // Danh sách từ khóa người dùng đang theo dõi (hiển thị đầy đủ kể cả chưa có bài báo trong 3 tháng)
  const displayedTerms = useMemo(() => {
    return (followedTopics ?? []).map((t) => t?.name).filter((name): name is string => Boolean(name));
  }, [followedTopics]);

  // Giới hạn tối đa số lượng từ khóa được hiển thị đồng thời trên biểu đồ
  const MAX_KEYWORDS_LIMIT = 10;
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const hasInitialized = useRef(false);
  const displayedTermsSerialized = displayedTerms.join(",");

  useEffect(() => {
    if (displayedTerms.length > 0) {
      // Thông báo cho người dùng nếu tổng số từ khóa follow vượt quá 10
      if (displayedTerms.length > MAX_KEYWORDS_LIMIT && !hasInitialized.current) {
        toast.info(`Only up to 10 keywords can be displayed on the chart at once. Showing the first 10 keywords.`);
      }
      if (!hasInitialized.current) {
        // Mặc định ban đầu chọn tối đa 10 từ khóa đầu tiên để vẽ biểu đồ
        setSelectedKeywords(displayedTerms.slice(0, MAX_KEYWORDS_LIMIT));
        hasInitialized.current = true;
      } else {
        setSelectedKeywords((prev) => prev.filter((k) => displayedTerms.includes(k)));
      }
    } else {
      setSelectedKeywords([]);
    }
  }, [displayedTermsSerialized, displayedTerms.length]);

  // Tổng hợp dữ liệu hiển thị cho bảng Summary Card 3 tháng gần đây
  const keywordSummary = useMemo(() => {
    return selectedKeywords.map((term) => {
      const monthlyData = chartData.map((row) => ({
        period: row.period as string,
        count: ((row as Record<string, unknown>)[term] as number) ?? 0,
      }));
      const first = monthlyData[0]?.count ?? 0;
      const last = monthlyData[monthlyData.length - 1]?.count ?? 0;
      const firstPeriod = monthlyData[0]?.period ?? "";
      const lastPeriod = monthlyData[monthlyData.length - 1]?.period ?? "";

      const m1 = monthlyData[0] ?? { period: "", count: 0 };
      const m2 = monthlyData[1] ?? { period: "", count: 0 };
      const m3 = monthlyData[monthlyData.length - 1] ?? { period: "", count: 0 };

      // Chặng 1: m1 -> m2
      let stage1Label = "0%";
      if (m1.count === 0 && m2.count > 0) {
        stage1Label = `+${m2.count} new`;
      } else if (m1.count > 0) {
        const pct1 = Math.round(((m2.count - m1.count) / m1.count) * 100);
        stage1Label = `${pct1 >= 0 ? "+" : ""}${pct1}%`;
      }

      // Chặng 2: m2 -> m3
      let stage2Label = "0%";
      if (m2.count === 0 && m3.count > 0) {
        stage2Label = `+${m3.count} new`;
      } else if (m2.count > 0) {
        const pct2 = Math.round(((m3.count - m2.count) / m2.count) * 100);
        stage2Label = `${pct2 >= 0 ? "+" : ""}${pct2}%`;
      }

      let trend = "0%";
      let trendColor = "text-muted-foreground";
      let trendFormula = "";

      if (first === 0 && last > 0) {
        trend = `↑ +${last}`;
        trendColor = "text-emerald-500";
        trendFormula = `New Growth: From 0 papers (${firstPeriod}) to ${last} papers (${lastPeriod}) (+${last} new)`;
      } else if (first > 0) {
        const pct = Math.round(((last - first) / first) * 100);
        if (pct > 0) {
          trend = `↑ +${pct}%`;
          trendColor = "text-emerald-500";
          trendFormula = `Formula: [(${lastPeriod}: ${last} papers - ${firstPeriod}: ${first} papers) / ${first}] × 100% = +${pct}%`;
        } else if (pct < 0) {
          trend = `↓ ${pct}%`;
          trendColor = "text-rose-500";
          trendFormula = `Formula: [(${lastPeriod}: ${last} papers - ${firstPeriod}: ${first} papers) / ${first}] × 100% = ${pct}%`;
        } else {
          trend = "→ 0%";
          trendColor = "text-muted-foreground";
          trendFormula = `No Change: ${firstPeriod}: ${first} papers → ${lastPeriod}: ${last} papers (0%)`;
        }
      } else {
        trend = "—";
        trendColor = "text-muted-foreground";
        trendFormula = "No paper data available in the last 3 months";
      }

      return {
        term,
        monthlyData,
        m1,
        m2,
        m3,
        stage1Label,
        stage2Label,
        trend,
        trendColor,
        trendFormula,
      };
    });
  }, [selectedKeywords, chartData]);

  // Handler khi người dùng nhấp chọn/bỏ chọn 1 từ khóa trong cửa sổ Dropdown
  const handleToggleKeyword = (term: string) => {
    setSelectedKeywords((prev) => {
      // Nếu từ khóa đã được chọn -> Bỏ chọn
      if (prev.includes(term)) {
        return prev.filter((t) => t !== term);
      }
      // Nếu số từ khóa đang chọn đã đạt ngưỡng tối đa 10 -> Hiển thị thông báo cảnh báo và không cho chọn thêm
      if (prev.length >= MAX_KEYWORDS_LIMIT) {
        toast.warning("Only 10 keywords can be displayed on the chart at a time.");
        return prev;
      }
      // Thêm từ khóa vào danh sách hiển thị
      return [...prev, term];
    });
  };

  // Handler chọn tất cả từ khóa (nếu danh sách > 10 thì chỉ chọn 10 từ đầu tiên và hiển thị thông báo)
  const handleToggleAll = () => {
    const isAllSelected = selectedKeywords.length >= Math.min(displayedTerms.length, MAX_KEYWORDS_LIMIT) && selectedKeywords.length > 0;
    if (isAllSelected) {
      setSelectedKeywords([]);
    } else {
      if (displayedTerms.length > MAX_KEYWORDS_LIMIT) {
        toast.warning("Only 10 keywords can be displayed on the chart at once. Selected the first 10 keywords.");
        setSelectedKeywords(displayedTerms.slice(0, MAX_KEYWORDS_LIMIT));
      } else {
        setSelectedKeywords(displayedTerms);
      }
    }
  };

  const [showKeywordDropdown, setShowKeywordDropdown] = useState(false);
  const trendDropdownRef = useRef<HTMLDivElement>(null);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown bộ lọc khi nhấp chuột ra ngoài
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

  // Lọc bỏ những bài báo đề xuất mà người dùng đã lưu vào bộ sưu tập cá nhân
  const visibleRecommendations = report?.recommendations?.filter(
    (paper) => !collections.some((c) => c.paperIds.includes(String(paper.id)))
  ) ?? [];

  const followStats = report?.followStats;
  const showKeywordTab = (followStats?.keywordCount ?? followedTopics.length) >= 1;
  const showAuthorTab = (followStats?.authorCount ?? followedAuthors.length) >= 1;
  const showJournalTab = (followStats?.journalCount ?? followedJournals.length) >= 1;

  // Quy định kiểu dáng màu sắc cho các Badge phân loại đề xuất
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

  // Quy định nhãn tên gọi chuẩn hiển thị trên Badge đề xuất
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

  // Hàm sinh màu sắc đường đồ thị LineChart
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

  // Nếu có param authorId trên URL, chuyển sang render View phân tích riêng của tác giả
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
          /* Trạng thái Skeleton Loading khi đang chờ nạp dữ liệu */
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
          /* Trạng thái báo lỗi khi không thể nạp báo cáo */
          <Card className="p-12 text-center">
            <AlertTriangle className="size-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-bold">Failed to load report</h3>
            <p className="text-muted-foreground text-sm mt-2">
              An error occurred while fetching your personalized report. Please try again later.
            </p>
          </Card>
        ) : !hasFollowedEntities ? (
          /* TRẠNG THÁI MÀN HÌNH KHÓA (LOCKED VIEW) KHI NGƯỜI DÙNG CHƯA FOLLOW BẤT KỲ ĐỐI TƯỢNG NÀO */
          <div className="max-w-3xl mx-auto py-12 px-4">
            <div className="glass border border-border/60 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden shadow-2xl">
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

                {/* 3 lựa chọn hướng dẫn người dùng tới các trang để bấm Follow */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mt-4">
                  {/* Option Từ khóa */}
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

                  {/* Option Tác giả */}
                  <div className="glass border border-border/40 hover:border-brand/40 rounded-2xl p-5 flex flex-col items-center justify-between text-center transition-all hover:scale-[1.02] group">
                    <div className="size-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3 group-hover:bg-emerald-500/20 group-hover:scale-110 transition-all">
                      <User className="size-5" />
                    </div>
                    <h4 className="font-bold text-sm text-foreground mb-1">Authors</h4>
                    <p className="text-[11px] text-muted-foreground mb-4">Stay updated with publications from top researchers.</p>
                    <Link
                      to="/authors"
                      search={{ page: 1, q: undefined, sort: undefined }}
                      className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-xs font-semibold text-white transition-transform hover:scale-[1.03] w-full mt-auto"
                      style={{ background: "linear-gradient(135deg, #10b981 0%, #0d9488 100%)" }}
                    >
                      Browse Authors
                    </Link>
                  </div>

                  {/* Option Tạp chí */}
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
            {/* === PHẦN 1: BẢNG BIỂU ĐỒ XU HƯỚNG LĨNH VỰC (TRENDS SECTION) === */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 1.1 Biểu đồ đường (Line Chart) biến động từ khóa qua các tháng */}
              <Card
                className="lg:col-span-2"
                title="Keyword Trends by Month"
                action={
                  /* Dropdown chọn xem tất cả hoặc chọn lọc từng từ khóa hiển thị trên Line Chart */
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
                            <div className={`size-3.5 rounded border flex items-center justify-center shrink-0 transition-all ${selectedKeywords.length === displayedTerms.length
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
                                <div className={`size-3.5 rounded border flex items-center justify-center shrink-0 transition-all ${isSelected
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
                            stroke={getLineColor(displayedTerms.indexOf(term))}
                            strokeWidth={2}
                            activeDot={{ r: 6 }}
                          />
                        ))}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Card>

              {/* 1.2 Biểu đồ cột ngang (Bar Chart) Top Tạp chí trong lĩnh vực theo dõi */}
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

            {/* 1.3 Bảng tổng hợp Summary Card — NGOÀI grid, full width */}
            {keywordSummary.length > 0 && (
              <Card title="Keyword Trend Summary (3 Months)" className="mt-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead className="block w-full">
                      <tr className="border-b border-border flex w-full items-center">
                        <th className="text-left py-2 px-3 font-semibold text-muted-foreground flex-[2.5] min-w-[220px]">Keyword</th>
                        {chartData.map((row) => (
                          <th key={row.period as string} className="text-center py-2 px-3 font-semibold text-muted-foreground flex-1 min-w-[80px]">
                            {row.period as string}
                          </th>
                        ))}
                        <th className="text-center py-2 px-3 font-semibold text-muted-foreground flex-1 min-w-[90px]">Trend</th>
                      </tr>
                    </thead>
                    <tbody className="block max-h-[220px] overflow-y-auto w-full">
                      {keywordSummary.map((kw) => (
                        <tr key={kw.term} className="border-b border-border/50 hover:bg-secondary/30 transition-colors flex w-full items-center">
                          <td className="py-2 px-3 flex-[2.5] min-w-[220px] min-w-0 flex items-center gap-2">
                            <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: getLineColor(displayedTerms.indexOf(kw.term)) }} />
                            <Link
                              to="/search"
                              search={{ q: kw.term, searchType: "keywords" }}
                              className="truncate font-medium text-foreground hover:text-brand hover:underline transition-colors"
                              title={kw.term}
                            >
                              {kw.term}
                            </Link>
                          </td>
                          {kw.monthlyData.map((m) => {
                            const [monthStr, yearStr] = (m.period as string).split("/");
                            const monthNum = parseInt(monthStr, 10);
                            const yearNum = parseInt(yearStr, 10);

                            return (
                              <td key={m.period} className="text-center py-2 px-3 text-muted-foreground flex-1 min-w-[80px]">
                                <Link
                                  to="/search"
                                  search={{
                                    q: kw.term,
                                    searchType: "keywords",
                                    fromYear: yearNum,
                                    toYear: yearNum,
                                    month: monthNum,
                                  } as any}
                                  className="inline-flex flex-col items-center justify-center hover:text-brand transition-colors group cursor-pointer"
                                  title={`View ${m.count} papers for "${kw.term}" in ${m.period}`}
                                >
                                  <span className="font-mono font-bold text-sm text-foreground group-hover:text-brand leading-none">{m.count}</span>
                                  <span className="text-[9px] text-muted-foreground group-hover:text-brand/80 leading-tight mt-0.5">
                                    {m.count === 1 ? "paper" : "papers"}
                                  </span>
                                </Link>
                              </td>
                            );
                          })}
                          <td className="text-center py-2 px-3 font-semibold whitespace-nowrap flex-1 min-w-[90px]">
                            <UiTooltipProvider delayDuration={100}>
                              <UiTooltip>
                                <UiTooltipTrigger asChild>
                                  <span className={`cursor-help font-semibold hover:underline decoration-dotted underline-offset-4 ${kw.trendColor}`}>
                                    {kw.trend}
                                  </span>
                                </UiTooltipTrigger>
                                <UiTooltipContent side="left" className="bg-popover/95 backdrop-blur-md border border-border/80 p-3 rounded-xl shadow-2xl text-xs space-y-2.5 max-w-xs z-50">
                                  <div className="font-bold text-foreground border-b border-border/50 pb-1.5 flex items-center justify-between gap-3">
                                    <span>3-Month Trend Breakdown</span>
                                    <span className="text-[10px] text-muted-foreground font-mono">({kw.m1.period} → {kw.m3.period})</span>
                                  </div>
                                  <div className="space-y-1 text-[11px]">
                                    <div className="flex items-center justify-between gap-4 text-muted-foreground">
                                      <span>• {kw.m1.period} → {kw.m2.period}:</span>
                                      <span className="font-mono text-foreground font-medium">{kw.m1.count} → {kw.m2.count} ({kw.stage1Label})</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4 text-muted-foreground">
                                      <span>• {kw.m2.period} → {kw.m3.period}:</span>
                                      <span className="font-mono text-foreground font-medium">{kw.m2.count} → {kw.m3.count} ({kw.stage2Label})</span>
                                    </div>
                                  </div>

                                  {/* Công thức toán học dùng số liệu thật từ Backend */}
                                  <div className="bg-secondary/40 rounded-lg p-2 border border-border/40 space-y-1 font-mono text-[10px]">
                                    <div className="font-semibold text-muted-foreground uppercase text-[9px] tracking-wider">Calculation Formula:</div>
                                    {kw.m1.count > 0 ? (
                                      <div className="text-foreground leading-relaxed">
                                        [({kw.m3.period}: {kw.m3.count} - {kw.m1.period}: {kw.m1.count}) / {kw.m1.count}] × 100%
                                        <div className={`font-bold mt-0.5 ${kw.trendColor}`}>
                                          = [({kw.m3.count - kw.m1.count}) / {kw.m1.count}] × 100% = {kw.trend}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="text-foreground leading-relaxed">
                                        From 0 papers ({kw.m1.period}) to {kw.m3.count} papers ({kw.m3.period})
                                        <div className={`font-bold mt-0.5 ${kw.trendColor}`}>
                                          = {kw.trend} new growth
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  <div className="border-t border-border/50 pt-1.5 flex items-center justify-between font-semibold text-xs">
                                    <span className="text-foreground">Overall 3-Month Trend:</span>
                                    <span className={kw.trendColor}>{kw.trend}</span>
                                  </div>
                                </UiTooltipContent>
                              </UiTooltip>
                            </UiTooltipProvider>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* === PHẦN 2: DANH SÁCH ĐỀ XUẤT BÀI BÁO ĐỌC TIẾP CÁ NHÂN HÓA (RECOMMENDED READS) === */}
            <div>
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <BookOpen className="size-5 text-brand" />
                <h2 className="text-lg font-bold uppercase tracking-wider text-foreground">Recommended Reads for You</h2>
                <span className="text-xs text-muted-foreground font-mono">({visibleRecommendations.length} papers)</span>

                {/* Filter dropdown chọn lọc tab đề xuất (All / Keywords / Authors / Journals) */}
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
                /* Grid 2 cột hiển thị các Card bài báo được đề xuất */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {visibleRecommendations.map((paper) => (
                    <div
                      key={paper.id}
                      className="glass border border-border/60 hover:border-brand/40 transition-all rounded-xl p-5 flex flex-col justify-between group"
                    >
                      <div>
                        {/* Tạp chí, Năm & Badge loại trùng khớp (Followed Author, Highly Cited...) */}
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <span className="text-xs font-semibold text-muted-foreground font-mono">
                            {paper.journal} · {paper.year}
                          </span>
                          <Badge variant="outline" className={getBadgeStyle(paper.matchType)}>
                            {getBadgeLabel(paper.matchType)}
                          </Badge>
                        </div>

                        {/* Tiêu đề bài báo */}
                        <Link to="/papers/$id" params={{ id: String(paper.id) }} className="hover:no-underline block">
                          <h3 className="font-bold text-foreground text-sm line-clamp-2 group-hover:text-brand transition-colors mb-2 cursor-pointer">
                            {paper.title}
                          </h3>
                        </Link>

                        {/* Tác giả */}
                        <p className="text-xs text-muted-foreground line-clamp-1 mb-3">
                          {paper.authors.join(", ")}
                        </p>

                        {/* Khối dịch & hiển thị Lý do đề xuất (Recommendation Reason) */}
                        <div className="bg-secondary/40 border border-border/30 rounded-lg p-2.5 mb-4 text-[11px] text-foreground/80 flex items-start gap-2">
                          <Lightbulb className="size-3.5 text-brand shrink-0 mt-0.5" />
                          <span className="italic">{translateReason(paper.recommendationReason)}</span>
                        </div>
                      </div>

                      {/* Lượt trích dẫn & Nút Lưu bộ sưu tập (Save to Collection) */}
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

            {/* === PHẦN 3: TOÀN CẢNH LĨNH VỰC NGHIÊN CỨU (LANDSCAPE SECTION) === */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* 3.1 Các Tác giả Hàng đầu theo từ khóa bạn follow (Leading Authors) */}
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

                {/* 3.2 Research Gaps & Hot Topics Section (Redesigned Domain Intelligence Dashboard) */}
                {followedDomains.length > 0 ? (
                  <div className="space-y-4 pt-2">
                    {/* Section header */}
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-1 border-b border-border/40">
                      <div className="flex items-center gap-2">
                        <div className="size-8 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
                          <Layers className="size-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground">
                            Research Landscape by Domain
                          </h3>
                          <p className="text-[11px] text-muted-foreground">
                            Explore hot topics and discover niche research gaps across your followed domains.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Domain Selector (Segmented Tab Bar with mouse wheel & drag-to-scroll) */}
                    <DomainTabBar
                      domains={followedDomains}
                      selectedDomain={selectedDomain ?? activeDomain?.domain ?? ""}
                      onSelectDomain={(domain) => setSelectedDomain(domain)}
                    />

                    {/* Followed Keywords Interactive Banner */}
                    {activeDomain && activeDomain.followedKeywords.length > 0 && (
                      <div className="glass bg-secondary/20 rounded-xl p-3.5 border border-border/40 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                          <Tag className="size-3.5 text-brand" />
                          <span>Your followed keywords in <strong className="text-brand">{activeDomain.domain}</strong>:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {activeDomain.followedKeywords.map((kw) => (
                            <Link
                              key={kw}
                              to="/search"
                              search={{ q: kw, searchType: "keywords" }}
                              className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-lg text-xs font-medium border border-border/60 bg-background/60 hover:bg-brand/10 hover:border-brand/40 hover:text-brand transition-all shadow-xs group"
                              title={`Search papers for "${kw}"`}
                            >
                              <span>{kw}</span>
                              <ArrowUpRight className="size-3 text-muted-foreground opacity-60 group-hover:opacity-100 group-hover:text-brand transition-all" />
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Hot Topics & Research Gaps Dashboard Cards */}
                    {activeDomain && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Hot Topics Card */}
                        <Card className="p-5 space-y-4 border-border/60 hover:border-orange-500/30 transition-all">
                          <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-3">
                            <div className="flex items-center gap-2">
                              <div className="size-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                                <TrendingUp className="size-4" />
                              </div>
                              <div>
                                <h3 className="text-xs font-extrabold uppercase tracking-wider text-foreground">
                                  Hot Topics in Field
                                </h3>
                                <p className="text-[11px] text-muted-foreground">Most published research topics in {activeDomain.domain}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-[10px] border-orange-500/30 bg-orange-500/10 text-orange-400 font-mono">
                              Top Trending
                            </Badge>
                          </div>

                          {activeDomain.hotTopics.length === 0 ? (
                            <div className="py-6 text-center space-y-1">
                              <p className="text-xs text-muted-foreground">No additional hot topics found in <strong>{activeDomain.domain}</strong>.</p>
                              <p className="text-[10px] text-muted-foreground/75">(All existing topics in this domain are already followed or pending sync)</p>
                            </div>
                          ) : (
                            <ul className="space-y-2">
                              {activeDomain.hotTopics.map((item, idx) => (
                                <li key={item.term}>
                                  <Link
                                    to="/search"
                                    search={{ q: item.term, searchType: "keywords" }}
                                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-border/30 bg-secondary/15 hover:bg-secondary/40 hover:border-orange-500/30 transition-all group"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <span className={`size-5 rounded-md font-mono font-extrabold text-[10px] flex items-center justify-center shrink-0 ${
                                        idx === 0
                                          ? "bg-orange-500/20 border border-orange-500/40 text-orange-400"
                                          : "bg-secondary text-muted-foreground"
                                      }`}>
                                        {idx + 1}
                                      </span>
                                      <span className="text-xs font-semibold truncate text-foreground group-hover:text-brand transition-colors">
                                        {item.term}
                                      </span>
                                    </div>
                                    <span className="text-xs font-mono font-bold text-muted-foreground group-hover:text-foreground shrink-0">
                                      {item.paperCount.toLocaleString()} papers
                                    </span>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </Card>

                        {/* Research Gaps Card */}
                        <Card className="p-5 space-y-4 border-border/60 hover:border-amber-500/30 transition-all">
                          <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-3">
                            <div className="flex items-center gap-2">
                              <div className="size-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                                <Lightbulb className="size-4" />
                              </div>
                              <div>
                                <h3 className="text-xs font-extrabold uppercase tracking-wider text-foreground">
                                  Research Gaps
                                </h3>
                                <p className="text-[11px] text-muted-foreground">Fewest published papers — niche opportunities</p>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-[10px] border-amber-500/30 bg-amber-500/10 text-amber-400 font-mono">
                              Niche Gaps
                            </Badge>
                          </div>

                          {activeDomain.researchGaps.length === 0 ? (
                            <div className="py-6 text-center space-y-1">
                              <p className="text-xs text-muted-foreground">No niche research gaps found in <strong>{activeDomain.domain}</strong>.</p>
                              <p className="text-[10px] text-muted-foreground/75">(All existing topics in this domain are already followed or pending sync)</p>
                            </div>
                          ) : (
                            <ul className="space-y-2">
                              {activeDomain.researchGaps.map((item, idx) => (
                                <li key={item.term}>
                                  <Link
                                    to="/search"
                                    search={{ q: item.term, searchType: "keywords" }}
                                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-border/30 bg-secondary/15 hover:bg-secondary/40 hover:border-amber-500/30 transition-all group"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <span className={`size-5 rounded-md font-mono font-extrabold text-[10px] flex items-center justify-center shrink-0 ${
                                        idx === 0
                                          ? "bg-amber-500/20 border border-amber-500/40 text-amber-400"
                                          : "bg-secondary text-muted-foreground"
                                      }`}>
                                        {idx + 1}
                                      </span>
                                      <span className="text-xs font-semibold truncate text-foreground group-hover:text-brand transition-colors">
                                        {item.term}
                                      </span>
                                    </div>
                                    <span className="text-xs font-mono font-bold text-muted-foreground group-hover:text-foreground shrink-0">
                                      {item.paperCount.toLocaleString()} papers
                                    </span>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </Card>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Fallback UI: Old Research Gaps UI if followedDomains is not yet returned by BE */
                  <Card title="Research Gaps">
                    <p className="text-xs text-muted-foreground mb-4">
                      Keywords with the lowest number of research papers in your followed fields. These represent potential niche opportunities for research.
                    </p>
                    {report?.landscape?.researchGaps?.length === 0 ? (
                      <div className="text-muted-foreground text-sm">No research gaps detected yet.</div>
                    ) : (
                      <div className="divide-y divide-border/30">
                        {report?.landscape?.researchGaps?.map((gap) => {
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
                              search={{ q: gap.term, searchType: "keywords" }}
                              className="block no-underline"
                            >
                              {gapContent}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </Card>
                )}
              </div>

              {/* 3.3 Đám mây Từ khóa Đồng xuất hiện (Keyword Co-occurrence / Word Cloud) */}
              <Card title="Keyword Co-occurrence (Word Cloud)">
                <p className="text-xs text-muted-foreground mb-4">
                  Keywords commonly co-occurring with your followed keywords. Chip color and trend indicator show keyword growth rate.
                </p>
                {report.landscape?.tagCloud?.length === 0 ? (
                  <div className="text-muted-foreground text-sm">No word cloud data available.</div>
                ) : (
                  <div className="space-y-4">
                    {/* Render các thẻ Pill Tag với màu sắc dựa vào tốc độ tăng trưởng growthRate */}
                    <div className="flex flex-wrap items-center justify-center gap-2 p-6 border border-border/40 bg-surface-elevated/20 rounded-2xl min-h-[320px]">
                      {report.landscape.tagCloud.map((tag) => {
                        let colorClass = "text-muted-foreground border-border/40 bg-secondary/5 hover:bg-secondary/10 hover:border-border/80";
                        let trendIcon = "•";
                        if (tag.growthRate > 50.0) {
                          colorClass = "text-rose-400 border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 hover:border-rose-500/60 hover:shadow-[0_0_12px_rgba(244,63,94,0.15)]";
                          trendIcon = "↗️";
                        } else if (tag.growthRate > 15.0) {
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
                            search={{ q: tag.term, searchType: "keywords" }}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all hover:scale-105 cursor-pointer no-underline ${colorClass}`}
                            title={`Frequency: ${tag.coOccurrenceCount} times | Growth: ${tag.growthRate > 0 ? `+${tag.growthRate}` : tag.growthRate}%`}
                          >
                            <span>{tag.term}</span>
                            <span className="opacity-80 text-[10px] font-mono">{trendIcon} {tag.growthRate > 0 ? `+${tag.growthRate.toFixed(1)}%` : `${tag.growthRate.toFixed(1)}%`}</span>
                          </Link>
                        );
                      })}
                    </div>

                    {/* Chú thích giải thích ngưỡng màu sắc & Công thức tăng trưởng Word Cloud */}
                    <UiTooltipProvider>
                      <div className="flex flex-wrap justify-center gap-6 pt-3 text-[11px] text-muted-foreground">
                        <UiTooltip delayDuration={100}>
                          <UiTooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 cursor-pointer hover:text-rose-400 transition-colors">
                              <span className="inline-block size-3.5 rounded bg-rose-500/5 border border-rose-500/30" />
                              <span>Hot Growth (&gt; 50.0%)</span>
                            </div>
                          </UiTooltipTrigger>
                          <UiTooltipContent side="top" align="center" className="p-3.5 max-w-[320px] bg-popover/95 text-popover-foreground border border-rose-500/30 shadow-xl rounded-xl backdrop-blur-md">
                            <div className="space-y-2 text-xs">
                              <div className="flex items-center gap-1.5 font-semibold text-rose-400">
                                <span className="inline-block size-2 rounded-full bg-rose-500" />
                                <span>Hot Growth (&gt; 50.0%)</span>
                              </div>
                              <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Co-occurring keywords exhibiting rapid growth in publication volume (&gt; 50.0%/month).
                              </p>
                              <div className="p-2 rounded-lg bg-surface-elevated/50 border border-border/40 font-mono text-[10px] space-y-1">
                                <div className="text-muted-foreground text-[9.5px]">Growth Rate Formula:</div>
                                <div className="text-center font-bold text-foreground py-0.5">
                                  ((N<sub>current</sub> - N<sub>previous</sub>) / N<sub>previous</sub>) × 100%
                                </div>
                                <div className="text-[9px] text-muted-foreground border-t border-border/30 pt-1 font-sans italic">
                                  * N = Number of published papers for the keyword in that month
                                </div>
                                <div className="text-[9.5px] text-rose-400 font-semibold text-right pt-0.5">Threshold: &gt; 50.0%</div>
                              </div>
                            </div>
                          </UiTooltipContent>
                        </UiTooltip>

                        <UiTooltip delayDuration={100}>
                          <UiTooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 cursor-pointer hover:text-amber-400 transition-colors">
                              <span className="inline-block size-3.5 rounded bg-amber-500/5 border border-amber-500/30" />
                              <span>High Growth (15.0% - 50.0%)</span>
                            </div>
                          </UiTooltipTrigger>
                          <UiTooltipContent side="top" align="center" className="p-3.5 max-w-[320px] bg-popover/95 text-popover-foreground border border-amber-500/30 shadow-xl rounded-xl backdrop-blur-md">
                            <div className="space-y-2 text-xs">
                              <div className="flex items-center gap-1.5 font-semibold text-amber-400">
                                <span className="inline-block size-2 rounded-full bg-amber-500" />
                                <span>High Growth (15.0% - 50.0%)</span>
                              </div>
                              <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Co-occurring keywords showing strong positive publication growth (15.0% to 50.0%/month).
                              </p>
                              <div className="p-2 rounded-lg bg-surface-elevated/50 border border-border/40 font-mono text-[10px] space-y-1">
                                <div className="text-muted-foreground text-[9.5px]">Growth Rate Formula:</div>
                                <div className="text-center font-bold text-foreground py-0.5">
                                  ((N<sub>current</sub> - N<sub>previous</sub>) / N<sub>previous</sub>) × 100%
                                </div>
                                <div className="text-[9px] text-muted-foreground border-t border-border/30 pt-1 font-sans italic">
                                  * N = Number of published papers for the keyword in that month
                                </div>
                                <div className="text-[9.5px] text-amber-400 font-semibold text-right pt-0.5">Threshold: 15.0% - 50.0%</div>
                              </div>
                            </div>
                          </UiTooltipContent>
                        </UiTooltip>

                        <UiTooltip delayDuration={100}>
                          <UiTooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 cursor-pointer hover:text-sky-400 transition-colors">
                              <span className="inline-block size-3.5 rounded bg-sky-500/5 border border-sky-500/30" />
                              <span>Stable Growth (0.0% - 15.0%)</span>
                            </div>
                          </UiTooltipTrigger>
                          <UiTooltipContent side="top" align="center" className="p-3.5 max-w-[320px] bg-popover/95 text-popover-foreground border border-sky-500/30 shadow-xl rounded-xl backdrop-blur-md">
                            <div className="space-y-2 text-xs">
                              <div className="flex items-center gap-1.5 font-semibold text-sky-400">
                                <span className="inline-block size-2 rounded-full bg-sky-500" />
                                <span>Stable Growth (0.0% - 15.0%)</span>
                              </div>
                              <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Co-occurring keywords maintaining steady interest or minor publication increases (0.0% to 15.0%/month).
                              </p>
                              <div className="p-2 rounded-lg bg-surface-elevated/50 border border-border/40 font-mono text-[10px] space-y-1">
                                <div className="text-muted-foreground text-[9.5px]">Growth Rate Formula:</div>
                                <div className="text-center font-bold text-foreground py-0.5">
                                  ((N<sub>current</sub> - N<sub>previous</sub>) / N<sub>previous</sub>) × 100%
                                </div>
                                <div className="text-[9px] text-muted-foreground border-t border-border/30 pt-1 font-sans italic">
                                  * N = Number of published papers for the keyword in that month
                                </div>
                                <div className="text-[9.5px] text-sky-400 font-semibold text-right pt-0.5">Threshold: 0.0% - 15.0%</div>
                              </div>
                            </div>
                          </UiTooltipContent>
                        </UiTooltip>

                        <UiTooltip delayDuration={100}>
                          <UiTooltipTrigger asChild>
                            <div className="flex items-center gap-1.5 cursor-pointer hover:text-foreground transition-colors">
                              <span className="inline-block size-3.5 rounded bg-secondary/5 border border-border/40" />
                              <span>Static / No Change (&le; 0.0%)</span>
                            </div>
                          </UiTooltipTrigger>
                          <UiTooltipContent side="top" align="center" className="p-3.5 max-w-[320px] bg-popover/95 text-popover-foreground border border-border/60 shadow-xl rounded-xl backdrop-blur-md">
                            <div className="space-y-2 text-xs">
                              <div className="flex items-center gap-1.5 font-semibold text-muted-foreground">
                                <span className="inline-block size-2 rounded-full bg-secondary border border-border" />
                                <span>Static / No Change (&le; 0.0%)</span>
                              </div>
                              <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Co-occurring keywords with flat or declining publication volume compared to the previous month (&le; 0.0%/month).
                              </p>
                              <div className="p-2 rounded-lg bg-surface-elevated/50 border border-border/40 font-mono text-[10px] space-y-1">
                                <div className="text-muted-foreground text-[9.5px]">Growth Rate Formula:</div>
                                <div className="text-center font-bold text-foreground py-0.5">
                                  ((N<sub>current</sub> - N<sub>previous</sub>) / N<sub>previous</sub>) × 100%
                                </div>
                                <div className="text-[9px] text-muted-foreground border-t border-border/30 pt-1 font-sans italic">
                                  * N = Number of published papers for the keyword in that month
                                </div>
                                <div className="text-[9.5px] text-muted-foreground font-semibold text-right pt-0.5">Threshold: &le; 0.0%</div>
                              </div>
                            </div>
                          </UiTooltipContent>
                        </UiTooltip>
                      </div>
                    </UiTooltipProvider>
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