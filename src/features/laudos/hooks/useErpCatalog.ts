import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getComponentsByCodes, getKitComposition } from "@/integrations/firebird/catalog";

const STALE = 5 * 60 * 1000;

export const kitQueryKey = (code: string) => ["erp", "kit", code.trim().toUpperCase()] as const;

/** Imperative fetch that reuses the React Query cache (instant for repeated codes). */
export function useFetchKit() {
  const qc = useQueryClient();
  return (code: string) =>
    qc.fetchQuery({ queryKey: kitQueryKey(code), queryFn: () => getKitComposition(code), staleTime: STALE });
}

/** Batch lookup of component details; key is the sorted unique code list. */
export function useComponentsInfo(codes: string[]) {
  const key = useMemo(
    () => [...new Set(codes.map((c) => c.trim().toUpperCase()).filter(Boolean))].sort(),
    [codes],
  );
  return useQuery({
    queryKey: ["erp", "componentes", key],
    queryFn: () => getComponentsByCodes(key),
    enabled: key.length > 0,
    staleTime: STALE,
  });
}
