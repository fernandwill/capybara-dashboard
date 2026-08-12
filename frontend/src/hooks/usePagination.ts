"use client";

import { useMemo, useState } from "react";

/**
 * Generic list pagination with a compact 5-button sliding window of page
 * numbers. Shared by the matches history and players pages.
 */
export function usePagination<T>(items: T[], pageSize: number) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // Clamp the page when the list shrinks (e.g. a filter change).
  const safePage = Math.min(currentPage, totalPages);

  const currentItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, safePage, pageSize]);

  const visiblePageNumbers = useMemo<number[]>(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    let start = Math.max(1, safePage - 2);
    let end = start + 4;

    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - 4);
    }

    const pages: number[] = [];
    for (let p = start; p <= end; p++) {
      pages.push(p);
    }
    return pages;
  }, [totalPages, safePage]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return {
    currentPage: safePage,
    goToPage,
    totalPages,
    currentItems,
    visiblePageNumbers,
    startIndex: items.length === 0 ? 0 : (safePage - 1) * pageSize + 1,
    endIndex: Math.min(safePage * pageSize, items.length),
  };
}
