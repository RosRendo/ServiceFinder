"use client";

import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
}

interface DataGridProps<T extends { id: string }> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  selectedIds?: Set<string>;
  onSelectRow?: (id: string) => void;
  onSelectAll?: () => void;
  pageSize?: number;
  emptyMessage?: string;
  loading?: boolean;
}

export function DataGrid<T extends { id: string }>({
  columns,
  data,
  onRowClick,
  selectedIds = new Set(),
  onSelectRow,
  onSelectAll,
  pageSize = 50,
  emptyMessage = "No data found.",
  loading = false,
}: DataGridProps<T>) {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);

  const sorted = useMemo(() => {
    if (!sort) return data;
    return [...data].sort((a, b) => {
      const av = (a as Record<string, unknown>)[sort.key];
      const bv = (b as Record<string, unknown>)[sort.key];
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [data, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = sorted.slice((page - 1) * pageSize, page * pageSize);
  const allSelected = paged.length > 0 && paged.every((r) => selectedIds.has(r.id));

  const toggleSort = (key: string) => {
    setSort((s) => s?.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" });
    setPage(1);
  };

  if (loading) {
    return (
      <div className="w-full">
        {/* Skeleton header */}
        <div className="h-10 bg-muted/30 border-b border-border" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-13 border-b border-border flex items-center px-4 gap-4 animate-pulse">
            <div className="w-4 h-4 rounded bg-muted" />
            {columns.map((c) => (
              <div key={String(c.key)} className="flex-1 h-3 rounded bg-muted/60" />
            ))}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm border-collapse">
          {/* Header */}
          <thead className="sticky top-0 z-10 bg-background border-b border-border">
            <tr>
              {onSelectRow && (
                <th className="w-10 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={onSelectAll}
                    className="w-3.5 h-3.5 rounded accent-violet-500 cursor-pointer"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={cn(
                    "px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap select-none",
                    col.width,
                    col.sortable && "cursor-pointer hover:text-foreground"
                  )}
                  onClick={() => col.sortable && toggleSort(String(col.key))}
                >
                  <span className="flex items-center gap-1.5">
                    {col.header}
                    {col.sortable && (
                      sort?.key === String(col.key)
                        ? sort.dir === "asc"
                          ? <ChevronUp className="w-3 h-3 text-violet-400" />
                          : <ChevronDown className="w-3 h-3 text-violet-400" />
                        : <ArrowUpDown className="w-3 h-3 opacity-30" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (onSelectRow ? 1 : 0)} className="px-4 py-16 text-center text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paged.map((row) => {
                const selected = selectedIds.has(row.id);
                return (
                  <tr
                    key={row.id}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      "border-b border-border/50 transition-colors group",
                      selected ? "bg-violet-500/[0.06]" : "hover:bg-muted/40",
                      onRowClick && "cursor-pointer"
                    )}
                  >
                    {onSelectRow && (
                      <td className="w-10 px-4 py-3" onClick={(e) => { e.stopPropagation(); onSelectRow(row.id); }}>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => onSelectRow(row.id)}
                          className="w-3.5 h-3.5 rounded accent-violet-500 cursor-pointer"
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={String(col.key)} className={cn("px-4 py-3 text-foreground", col.width)}>
                        {col.render
                          ? col.render(row)
                          : String((row as Record<string, unknown>)[String(col.key)] ?? "—")
                        }
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="shrink-0 flex items-center justify-between px-4 py-3 border-t border-border bg-background">
        <p className="text-xs text-muted-foreground">
          Showing {Math.min((page - 1) * pageSize + 1, sorted.length)}–{Math.min(page * pageSize, sorted.length)} of{" "}
          <span className="font-medium text-foreground">{sorted.length.toLocaleString()}</span>
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const p = page <= 3 ? i + 1 : page - 2 + i;
            if (p > totalPages) return null;
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors",
                  p === page ? "bg-violet-500/20 text-violet-400" : "text-muted-foreground hover:bg-muted/60"
                )}
              >
                {p}
              </button>
            );
          })}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
