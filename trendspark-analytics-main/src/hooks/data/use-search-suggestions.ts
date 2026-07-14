import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getServices } from "@/services";
import { isBrowser } from "@/hooks/data/client-only";

export function useSearchSuggestions(q: string, enabled: boolean) {
  const [debouncedQ, setDebouncedQ] = useState(q);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 250); // 250ms debounce
    return () => clearTimeout(t);
  }, [q]);

  return useQuery({
    queryKey: ["search-suggestions", debouncedQ],
    queryFn: () => getServices().searchSuggestions.getSuggestions(debouncedQ, 8),
    enabled: isBrowser && enabled && debouncedQ.trim().length >= 2,
    placeholderData: (prev) => prev,
  });
}
