import type { AnalyticsSnapshot } from "@/services/interfaces/analytics.service";
import type { DashboardHighlights, HighlightCard, TopicTrend } from "@/types/domain";

function emptyHighlight(title: string, subtitle: string): HighlightCard {
  return { id: "", title, subtitle, metric: 0, metricLabel: "" };
}

function topicsFromKeywords(snapshot: AnalyticsSnapshot): TopicTrend[] {
  return (snapshot.trendingKeywords ?? []).slice(0, 10).map((k, i) => ({
    id: k.id,
    name: k.term,
    paperCount: k.count,
    trendScore: k.trendScore,
    rank: i + 1,
  }));
}

function buildHighlights(snapshot: AnalyticsSnapshot, topics: TopicTrend[]): DashboardHighlights {
  const topTopic = topics[0];
  const topKw = snapshot.trendingKeywords?.[0];
  const topAuthor = snapshot.trendingAuthors?.[0];

  return {
    topKeyword: topKw
      ? {
          id: topKw.id,
          title: topKw.term,
          subtitle: "Top trending keyword",
          metric: topKw.trendScore,
          metricLabel: "trend %",
        }
      : topTopic
        ? {
            id: topTopic.id,
            title: topTopic.name,
            subtitle: "Top topic trend",
            metric: topTopic.trendScore,
            metricLabel: "trend %",
          }
        : emptyHighlight("Chưa có keyword", "Chạy sync từ Admin"),

    topAuthor: topAuthor
      ? {
          id: topAuthor.id,
          title: topAuthor.name,
          subtitle: topAuthor.affiliation,
          metric: topAuthor.citations,
          metricLabel: "citations",
        }
      : emptyHighlight("Chưa có tác giả", "Cần dữ liệu từ sync"),

    topPaper: emptyHighlight("Chưa có bài nổi bật", "Cần dữ liệu từ sync"),

    topFollowedTopic: topTopic
      ? {
          id: topTopic.id,
          title: topTopic.name,
          subtitle: "Top topic trend",
          metric: topTopic.paperCount,
          metricLabel: "papers",
        }
      : emptyHighlight("Chưa có topic", "Follow topic sau khi sync"),
  };
}

/** Ensures dashboard always has trendingTopics + highlights even from older API responses. */
export function normalizeAnalyticsSnapshot(raw: AnalyticsSnapshot): AnalyticsSnapshot {
  const topics =
    raw.trendingTopics && raw.trendingTopics.length > 0 ? raw.trendingTopics : topicsFromKeywords(raw);

  const hasServerHighlights =
    raw.highlights &&
    (raw.highlights.topKeyword?.id ||
      raw.highlights.topAuthor?.id ||
      raw.highlights.topPaper?.id ||
      raw.highlights.topFollowedTopic?.id);

  const highlights = hasServerHighlights
    ? {
        topKeyword: raw.highlights!.topKeyword ?? emptyHighlight("—", ""),
        topAuthor: raw.highlights!.topAuthor ?? emptyHighlight("—", ""),
        topPaper: raw.highlights!.topPaper ?? emptyHighlight("—", ""),
        topFollowedTopic: raw.highlights!.topFollowedTopic ?? emptyHighlight("—", ""),
      }
    : buildHighlights(raw, topics);

  return {
    ...raw,
    trendingTopics: topics,
    highlights,
  };
}
