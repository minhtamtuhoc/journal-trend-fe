import type { FollowService } from "@/services/interfaces/follow.service";
import type { Journal } from "@/types/brief";
import { mockDelay } from "@/services/utils";

let followedJournals: Journal[] = [
  {
    id: "1",
    name: "Journal of Cryptology",
    publisher: "Springer",
    issn: "0933-0798",
    domain: "Computer Science",
    impactFactor: 5.2,
  },
  {
    id: "2",
    name: "Nature Communications",
    publisher: "Nature Publishing Group",
    issn: "2041-1723",
    domain: "Science",
    impactFactor: 17.7,
  },
];

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
    await mockDelay(100);
    return [...followedJournals];
  }

  async followJournal(journalId: string) {
    await mockDelay(100);
    if (followedJournals.some((j) => j.id === journalId)) return;
    const nameMap: Record<string, string> = {
      "1": "Journal of Cryptology",
      "2": "Nature Communications",
      "3": "IEEE Transactions on Neural Networks",
      "4": "Cell",
      "5": "Nature Energy",
      "6": "Science",
      "7": "Nature Climate Change",
      "8": "IEEE Transactions on Visualization",
    };
    followedJournals.push({
      id: journalId,
      name: nameMap[journalId] || `Mock Journal ${journalId}`,
      publisher: "Academic Publisher",
      issn: "1234-5678",
      domain: "Computer Science",
      impactFactor: 4.5,
    });
  }

  async unfollowJournal(journalId: string) {
    await mockDelay(100);
    followedJournals = followedJournals.filter((j) => j.id !== journalId);
  }
}
