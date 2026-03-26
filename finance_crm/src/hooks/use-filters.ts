"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useRef } from "react";

export function useFilters() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const isNavigating = useRef(false);

  const filters = useMemo(
    () => ({
      brandId: searchParams.get("brandId") || undefined,
      projectId: searchParams.get("projectId") || undefined,
      source: searchParams.get("source") || undefined,
      type: searchParams.get("type") as "income" | "expense" | undefined,
      search: searchParams.get("search") || undefined,
      dateFrom: searchParams.get("dateFrom") || undefined,
      dateTo: searchParams.get("dateTo") || undefined,
      page: parseInt(searchParams.get("page") || "1"),
      period: searchParams.get("period") || "30d",
    }),
    [searchParams],
  );

  const setFilter = useCallback(
    (key: string, value: string | undefined) => {
      // Prevent rapid successive navigations
      if (isNavigating.current) return;
      isNavigating.current = true;

      const params = new URLSearchParams(searchParams.toString());

      if (value && value !== "") {
        params.set(key, value);
      } else {
        params.delete(key);
      }

      // Reset page when filters change (not when page itself changes)
      if (key !== "page") {
        params.delete("page");
      }

      const newUrl = params.toString()
        ? `${pathname}?${params.toString()}`
        : pathname;

      router.push(newUrl, { scroll: false });

      // Reset navigation lock
      setTimeout(() => {
        isNavigating.current = false;
      }, 100);
    },
    [searchParams, pathname, router],
  );

  const clearFilters = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [pathname, router]);

  return { filters, setFilter, clearFilters };
}
