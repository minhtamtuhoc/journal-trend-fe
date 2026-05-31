import { apiClient } from "@/api/client";
import type { FollowService } from "@/services/interfaces/follow.service";
import type { Journal } from "@/types/brief";
import type { TopicTrend } from "@/types/domain";

type TopicDto = { id: number; name: string; description?: string };

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
    return apiClient.get<TopicDto[]>("/follows/topics").then((rows) => rows.map(mapTopic));
  }

  followTopic(topicId: string) {
    return apiClient.post<void>(`/follows/topics/${topicId}`);
  }

  unfollowTopic(topicId: string) {
    return apiClient.delete<void>(`/follows/topics/${topicId}`);
  }

  listJournals() {
    return apiClient.get<Journal[]>("/follows/journals");
  }

  followJournal(journalId: string) {
    return apiClient.post<void>(`/follows/journals/${journalId}`);
  }

  unfollowJournal(journalId: string) {
    return apiClient.delete<void>(`/follows/journals/${journalId}`);
  }
}
