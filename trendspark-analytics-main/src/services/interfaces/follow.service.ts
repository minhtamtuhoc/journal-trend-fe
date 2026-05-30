import type { Journal } from "@/types/brief";
import type { TopicTrend } from "@/types/domain";

export interface FollowService {
  listTopics(): Promise<TopicTrend[]>;
  followTopic(topicId: string): Promise<void>;
  unfollowTopic(topicId: string): Promise<void>;
  listJournals(): Promise<Journal[]>;
  followJournal(journalId: string): Promise<void>;
  unfollowJournal(journalId: string): Promise<void>;
}
