import type { NotificationItem } from "@/types/domain";

export interface PaperSummary {
  id: string; // paperId
  notificationId: string; // raw notification id
  title: string;
  createdAt: string; // raw notification created time
  unread: boolean;
}

export interface NotificationGroup {
  keyword: string; // The keyword or group title
  keywordId?: string;
  unread: boolean;
  totalPapers: number;
  latestCreatedAt: string;
  papers: PaperSummary[];
  ids: string[]; // all raw notification ids in this group
  unreadIds: string[]; // unread raw notification ids
  triggerType: "NEW_PAPER" | "TRENDING_KEYWORD" | "SYSTEM";
  uiType: "paper" | "trend" | "system";
}

export function getNotificationGroupInfo(n: NotificationItem): {
  key: string;
  name: string;
  type: "keyword" | "author" | "journal" | "system";
} {
  // 1. Keyword
  if (n.keywordId) {
    let term = "";
    const trendMatch = n.message.match(/Keyword\s+["']([^"']+)["']\s+is\s+trending/i);
    const paperMatch = n.message.match(/New\s+paper\s+with\s+keyword\s+["']([^"']+)["']:/i);
    if (trendMatch) {
      term = trendMatch[1];
    } else if (paperMatch) {
      term = paperMatch[1];
    } else {
      term = "Keyword " + n.keywordId;
    }
    return { key: `keyword-${term.toLowerCase()}`, name: term, type: "keyword" };
  }

  // 2. Author
  if (n.authorId) {
    const authorMatch = n.message.match(/New\s+paper\s+from\s+author\s+you\s+follow:\s*([^-]+)\s*-/i);
    const genericAuthorMatch = n.message.match(/New\s+paper\s+from\s+([^:]+):/i);
    let authorName = "Followed Author";
    if (authorMatch) {
      authorName = authorMatch[1].trim();
    } else if (genericAuthorMatch) {
      authorName = genericAuthorMatch[1].replace("Dr. ", "").replace("Prof. ", "").trim();
    }
    return { key: `author-${authorName.toLowerCase()}`, name: authorName, type: "author" };
  }

  // 3. Journal
  if (n.journalId) {
    const journalMatch = n.message.match(/New\s+paper\s+in\s+journal\s+you\s+follow\s+([^:]+):/i);
    let journalName = "Followed Journal";
    if (journalMatch) {
      journalName = journalMatch[1].trim();
    }
    return { key: `journal-${journalName.toLowerCase()}`, name: journalName, type: "journal" };
  }

  // 4. System
  return { key: "system", name: "System Notifications", type: "system" };
}

export function groupNotifications(notifications: NotificationItem[]): NotificationGroup[] {
  const groupsMap = new Map<string, NotificationGroup>();

  for (const n of notifications) {
    const { key, name, type } = getNotificationGroupInfo(n);

    // Extract paper title
    let paperTitle = n.message;
    if (type === "keyword") {
      const parts = n.message.split('": ');
      if (parts.length > 1) {
        paperTitle = parts[1];
      } else {
        const parts2 = n.message.split("': ");
        if (parts2.length > 1) {
          paperTitle = parts2[1];
        }
      }
    } else if (type === "author") {
      const parts = n.message.split(" - ");
      if (parts.length > 1) {
        paperTitle = parts.slice(1).join(" - ");
      } else {
        const parts2 = n.message.split("follow: ");
        if (parts2.length > 1) {
          paperTitle = parts2[1];
        }
      }
    } else if (type === "journal") {
      const parts = n.message.split("follow: ");
      if (parts.length > 1) {
        paperTitle = parts[1];
      } else {
        const parts2 = n.message.split("follow ");
        if (parts2.length > 1) {
          paperTitle = parts2[1];
        }
      }
    }

    const paperSummary: PaperSummary = {
      id: n.paperId || "",
      notificationId: n.id,
      title: paperTitle,
      createdAt: n.createdAt,
      unread: n.unread,
    };

    const existing = groupsMap.get(key);
    if (existing) {
      existing.ids.push(n.id);
      if (n.unread) {
        existing.unreadIds.push(n.id);
      }
      if (n.unread) {
        existing.unread = true;
      }
      if (n.paperId && !existing.papers.some((p) => p.id === n.paperId)) {
        existing.papers.push(paperSummary);
        existing.totalPapers = existing.papers.length;
      }
      if (n.createdAt > existing.latestCreatedAt) {
        existing.latestCreatedAt = n.createdAt;
      }
    } else {
      let uiType: "paper" | "trend" | "system" = "system";
      if (type === "keyword") uiType = "trend";
      else if (type === "author" || type === "journal") uiType = "paper";

      groupsMap.set(key, {
        keyword: name,
        keywordId: n.keywordId,
        unread: n.unread,
        totalPapers: n.paperId ? 1 : 0,
        latestCreatedAt: n.createdAt,
        papers: n.paperId ? [paperSummary] : [],
        ids: [n.id],
        unreadIds: n.unread ? [n.id] : [],
        triggerType: n.triggerType,
        uiType,
      });
    }
  }

  return Array.from(groupsMap.values()).sort((a, b) => b.latestCreatedAt.localeCompare(a.latestCreatedAt));
}
