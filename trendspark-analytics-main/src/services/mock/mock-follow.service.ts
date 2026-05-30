import type { FollowService } from "@/services/interfaces/follow.service";
import { mockDelay } from "@/services/utils";

export class MockFollowService implements FollowService {
  async listTopics() {
    await mockDelay();
    return [];
  }

  async followTopic(_topicId: string) {
    await mockDelay();
  }

  async unfollowTopic(_topicId: string) {
    await mockDelay();
  }

  async listJournals() {
    await mockDelay();
    return [];
  }

  async followJournal(_journalId: string) {
    await mockDelay();
  }

  async unfollowJournal(_journalId: string) {
    await mockDelay();
  }
}
