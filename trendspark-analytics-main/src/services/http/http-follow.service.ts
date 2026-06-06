import { apiClient } from "@/api/client";
import type { FollowService } from "@/services/interfaces/follow.service";
import type { Journal } from "@/types/brief";
import type { TopicTrend } from "@/types/domain";

type TopicDto = { id: number; name: string; description?: string };
type JournalDto = {
  id: number;
  name: string;
  publisher?: string | null;
  issn?: string | null;
  domain?: string | null;
  impactFactor?: number;
};

function mapTopic(t: TopicDto, i: number): TopicTrend {
  return {
    id: String(t.id),
    name: t.name,
    paperCount: 0,
    trendScore: 0,
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
}
