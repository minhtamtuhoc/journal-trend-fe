import { apiClient } from "@/api/client";
import type { LiteratureMatrixRequest, LiteratureMatrixResponse } from "@/types/literature-matrix";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export class HttpAiService {
  async generateLiteratureMatrix(input: LiteratureMatrixRequest): Promise<LiteratureMatrixResponse> {
    const res = await apiClient.post<ApiResponse<LiteratureMatrixResponse>>(
      "/v1/ai/literature-matrix",
      input,
      { timeoutMs: 60_000 }
    );
    return res.data;
  }
}

export const httpAiService = new HttpAiService();
