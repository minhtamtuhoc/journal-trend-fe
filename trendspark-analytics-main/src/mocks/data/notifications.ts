import type { NotificationItem } from "@/types/domain";

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n1",
    type: "trend",
    title: "Keyword surge: Neural Radiance Fields",
    body: "Trend score crossed +40% for the 3rd consecutive month.",
    time: "2m ago",
    unread: true,
  },
  {
    id: "n2",
    type: "paper",
    title: "New paper from Dr. Yara Chen",
    body: "CRISPR-Cas9 delivery via lipid nanoparticles — Nature Communications",
    time: "14m ago",
    unread: true,
  },
  {
    id: "n3",
    type: "journal",
    title: "Cell published 12 new papers in your follows",
    body: "Mitochondrial dynamics, aging, and 10 more.",
    time: "1h ago",
    unread: true,
  },
  {
    id: "n4",
    type: "keyword",
    title: "Followed keyword 'Post-Quantum' has a new top paper",
    body: "Lattice-based post-quantum signatures — Journal of Cryptology",
    time: "3h ago",
    unread: false,
  },
  {
    id: "n5",
    type: "system",
    title: "Daily sync completed",
    body: "Crossref / Scopus / IEEE — 12,482 new records ingested.",
    time: "Today, 02:00",
    unread: false,
  },
];
