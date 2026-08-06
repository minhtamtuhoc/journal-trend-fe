import { useMutation, useQueryClient } from "@tanstack/react-query";
import { httpAiService } from "@/services/http/http-ai.service";
import type { LiteratureMatrixRequest, LiteratureMatrixResponse } from "@/types/literature-matrix";
import { toast } from "sonner";

export function useGenerateLiteratureMatrix() {
  const queryClient = useQueryClient();
  return useMutation<LiteratureMatrixResponse, Error, LiteratureMatrixRequest>({
    mutationFn: (request) => httpAiService.generateLiteratureMatrix(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-history-list"] });
    },
    onError: (error: any) => {
      const msg = error?.message || "Failed to generate literature matrix";
      toast.error(msg);
    },
  });
}
