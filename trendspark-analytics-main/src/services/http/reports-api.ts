import { apiConfig } from "@/api/config";
import { authStorage } from "@/auth/storage";

const base = apiConfig.baseUrl.replace(/\/$/, "");

async function downloadCsv(path: string, filename: string) {
  const token = authStorage.getAccessToken();
  const res = await fetch(`${base}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    throw new Error(`Export failed (${res.status})`);
  }
  const text = await res.text();
  const blob = new Blob([text], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const reportsApi = {
  downloadTopicTrendsCsv: () => downloadCsv("/reports/topic-trends.csv", "topic-trends.csv"),
  downloadPapersCsv: (limit = 500) => downloadCsv(`/reports/papers.csv?limit=${limit}`, "papers.csv"),
};
