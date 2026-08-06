"use client";

import { ITEM_PER_PAGE } from "@/lib/settings";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

const Pagination = ({ page, count }: { page: number; count: number }) => {
  const router = useRouter();

  const totalPages = Math.ceil(count / ITEM_PER_PAGE);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  const changePage = (newPage: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", newPage.toString());
    router.push(`${window.location.pathname}?${params}`);
  };

  const getVisiblePages = (): (number | "...")[] => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | "...")[] = [1];
    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    if (start > 2) pages.push("...");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push("...");
    pages.push(totalPages);

    return pages;
  };

  if (totalPages <= 1) return null;

  const start = (page - 1) * ITEM_PER_PAGE + 1;
  const end = Math.min(page * ITEM_PER_PAGE, count);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-100">
      {/* Count summary */}
      <p className="text-xs text-slate-400 order-2 sm:order-1">
        Showing{" "}
        <span className="font-semibold text-slate-600">
          {start}–{end}
        </span>{" "}
        of <span className="font-semibold text-slate-600">{count}</span> results
      </p>

      {/* Controls */}
      <div className="flex items-center gap-1.5 order-1 sm:order-2">
        {/* Prev */}
        <button
          disabled={!hasPrev}
          onClick={() => changePage(page - 1)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Prev
        </button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {getVisiblePages().map((p, i) =>
            p === "..." ? (
              <span
                key={`ellipsis-${i}`}
                className="w-8 text-center text-xs text-slate-400 select-none"
              >
                ···
              </span>
            ) : (
              <button
                key={`page-${p}`}
                onClick={() => changePage(p)}
                className={`w-8 h-8 rounded-xl text-xs font-semibold transition-colors ${
                  page === p
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-200"
                    : "text-slate-600 hover:bg-slate-100 border border-transparent hover:border-slate-200"
                }`}
              >
                {p}
              </button>
            ),
          )}
        </div>

        {/* Next */}
        <button
          disabled={!hasNext}
          onClick={() => changePage(page + 1)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
