import { apiClient } from "@/api/client";
import type { FollowService } from "@/services/interfaces/follow.service";
import type { Journal } from "@/types/brief";
import type { FollowedAuthor, TopicTrend } from "@/types/domain";

type TopicDto = {
  keywordId: number;
  term: string;
  domain?: string | null;
  paperCount: number;
  trendScore?: number | null;
};
type JournalDto = {
  id: number;
  name: string;
  publisher?: string | null;
  issn?: string | null;
  domain?: string | null;
  impactFactor?: number;
};
type AuthorDto = {
  id: number;
  name: string;
  affiliation?: string | null;
  citationCount?: number;
  sourceType?: string | null;
  sourceIdentifier?: string | null;
};

function mapTopic(t: TopicDto, i: number): TopicTrend {
  return {
    id: String(t.keywordId),
    name: t.term,
    paperCount: t.paperCount,
    trendScore: t.trendScore ?? 0,
    rank: i + 1,
  };
}

export class HttpFollowService implements FollowService {
  listTopics() {
    return apiClient.get<TopicDto[]>("/follow/topics").then((rows) => rows.map(mapTopic));
  }

  followTopic(topicId: string) {
    return apiClient.post<void>(`/follow/topics/${topicId}`);
  }

  unfollowTopic(topicId: string) {
    return apiClient.delete<void>(`/follow/topics/${topicId}`);
  }

  listJournals() {
    return apiClient.get<JournalDto[]>("/follow/journals").then((rows) =>
      rows.map((r) => ({
        ...r,
        id: String(r.id),
      }))
    );
  }

  followJournal(journalId: string) {
    return apiClient.post<void>(`/follow/journals/${journalId}`);
  }

  unfollowJournal(journalId: string) {
    return apiClient.delete<void>(`/follow/journals/${journalId}`);
  }

  listFollowedAuthors(): Promise<FollowedAuthor[]> {
    return apiClient.get<AuthorDto[]>("/follow/authors").then((rows) =>
      rows.map((r) => ({ id: String(r.id), name: r.name }))
    );
  }

  followAuthor(authorId: string) {
    return apiClient.post<void>(`/follow/authors/${authorId}`);
  }

  unfollowAuthor(authorId: string) {
    return apiClient.delete<void>(`/follow/authors/${authorId}`);
  }
}

