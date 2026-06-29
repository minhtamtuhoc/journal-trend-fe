export type ForecastMonth = {
  year: number;
  month: number;
  paperCount: number;
};

// GET /api/v1/trends/forecast?limit=N
export type ForecastListItem = {
  keywordId: number;
  term: string;
  domain: string;
  potentialScore: number;      // sTPS 0-100
  predictedPapers6m: number;
  predictedGrowthRate: number; // %
  forecastReason: string;      // mã lý do (tiếng Việt) trả từ BE
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
  forecastReason: string;
  historicalMonths: ForecastMonth[]; // 12 tháng (nét liền)
  forecastMonths: ForecastMonth[];   // 6 tháng (nét đứt)
};
