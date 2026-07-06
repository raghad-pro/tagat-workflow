"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  data: unknown[];        // ← الـ array الكامل (قبل التقطيع)
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  data,
  pageSize,
  onPageChange,
}: PaginationProps) {
  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / pageSize);

  if (totalItems <= pageSize && currentPage === 1) return null;

  const getPages = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(totalPages - 1, currentPage + 1);
        i++
      ) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div
      className="flex items-center justify-end gap-1.5 px-5 py-4 border-t"
      style={{ borderColor: "var(--color-border-form)" }}
    >
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed select-none focus:outline-none"
        style={{ border: "1px solid var(--color-border-inputs)", background: "var(--color-bg)" }}
      >
        <ChevronLeft size={14} style={{ color: "var(--color-text-primary)" }} />
      </button>

      {getPages().map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="w-8 text-center text-sm font-semibold select-none" style={{ color: "var(--color-text-primary)" }}>
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold transition-all select-none focus:outline-none"
            style={{
              background: p === currentPage ? "var(--color-primary)" : "var(--color-bg)",
              color: p === currentPage ? "#fff" : "var(--color-text-primary)",
              border: p === currentPage ? "none" : "1px solid var(--color-border-inputs)",
            }}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed select-none focus:outline-none"
        style={{ border: "1px solid var(--color-border-inputs)", background: "var(--color-bg)" }}
      >
        <ChevronRight size={14} style={{ color: "var(--color-text-primary)" }} />
      </button>
    </div>
  );
}