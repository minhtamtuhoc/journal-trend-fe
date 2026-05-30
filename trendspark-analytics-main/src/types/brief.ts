export type Journal = {
  id: string;
  name: string;
  publisher?: string | null;
  issn?: string | null;
  domain?: string | null;
  impactFactor?: number;
};

export type ApiSource = {
  name: string;
  baseUrl: string;
  enabled: boolean;
  syncSchedule: string | null;
  lastSyncAt: string | null;
  successRate: number | null;
};
