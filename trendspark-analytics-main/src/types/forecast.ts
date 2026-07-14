export type ForecastMonth = {
  year: number;
  month: number;
  paperCount: number;
};

// Mã phân loại ổn định trả từ BE (khớp enum ForecastCategory phía backend)
export type ForecastCategory = "EARLY_BOOM" | "BREAKOUT" | "STEADY";

// GET /api/v1/trends/forecast?limit=N
export type ForecastListItem = {
  keywordId: number;
  term: string;
  domain: string;
  potentialScore: number;      // sTPS 0-100
  predictedPapers6m: number;
  predictedGrowthRate: number; // %
  forecastReason: ForecastCategory; // mã enum phân loại trả từ BE
  currentPaperCount: number;
};

// GET /api/v1/trends/forecast/{keywordId}
export type ForecastDetail = {
  keywordId: number;
  term: string;
  domain: string;
  potentialScore: number;
  predictedPapers6m: number;
  predictedGrowthRate: number;
  forecastReason: ForecastCategory;
  historicalMonths: ForecastMonth[]; // 12 tháng (nét liền)
  forecastMonths: ForecastMonth[];   // 6 tháng (nét đứt)
};
