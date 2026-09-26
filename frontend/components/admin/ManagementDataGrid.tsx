import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Search, ChevronDown, ChevronUp, ChevronsUpDown, AlertCircle, RefreshCw } from 'lucide-react';
import { EmptyState } from '@/components/admin/EmptyState';

export interface ColumnDef<T> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  accessorFn?: (row: T) => any;
  cell?: (context: any) => React.ReactNode;
  width?: string | number;
  isSortable?: boolean;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  priority?: 'critical' | 'secondary' | 'optional';
}

export interface ManagementDataGridProps<T> {
  title?: string;
  description?: string;
  primaryAction?: {
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  };
  secondaryActions?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
  }>;
  data: T[];
  columns: ColumnDef<T>[];
  getRowId?: (row: T) => string;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onRowClick?: (row: T) => void;
  selectedRowIds?: Set<string>;
  selectable?: boolean;
  selectedRows?: T[];
  onSelectionChange?: any;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (query: string) => void;
  filterSlots?: React.ReactNode;
  totalCount?: number;
  totalItems?: number;
  pageSize?: number;
  currentPage?: number;
  page?: number;
  onPageChange?: (newPage: number) => void;
  emptyState?: {
    title?: string;
    description?: string;
    actionLabel?: string;
    onActionClick?: () => void;
  };
}

export function ManagementDataGrid<T>({
  title,
  description,
  primaryAction,
  secondaryActions,
  data,
  columns,
  getRowId,
  isLoading = false,
  error = null,
  onRetry,
  onRowClick,
  selectedRowIds,
  selectable = false,
  selectedRows,
  onSelectionChange,
  searchPlaceholder = 'Search records...',
  searchValue,
  onSearchChange,
  filterSlots,
  totalCount,
  totalItems,
  pageSize = 25,
  currentPage,
  page,
  onPageChange,
  emptyState,
}: ManagementDataGridProps<T>) {
  const [internalSearch, setInternalSearch] = useState(searchValue || '');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (searchValue !== undefined) {
      setInternalSearch(searchValue);
    }
  }, [searchValue]);

  // Debounced search handler
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange?.(internalSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [internalSearch, onSearchChange]);

  const resolveRowId = useCallback((item: T, index: number): string => {
    if (getRowId) return getRowId(item);
    if ((item as any)?.id != null) return String((item as any).id);
    return String(index);
  }, [getRowId]);

  const handleSort = (colId: string, isSortable?: boolean, sortable?: boolean) => {
    const canSort = isSortable || sortable;
    if (!canSort) return;
    if (sortColumn === colId) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortColumn(null);
        setSortDirection('asc');
      }
    } else {
      setSortColumn(colId);
      setSortDirection('asc');
    }
  };

  const activePage = currentPage || page || 1;
  const activeTotal = totalCount ?? totalItems ?? data.length;
  const totalPages = Math.max(1, Math.ceil(activeTotal / pageSize));

  // Determine active selected IDs
  const activeSelectedSet = useMemo(() => {
    if (selectedRowIds) return selectedRowIds;
    if (selectedRows) {
      return new Set(selectedRows.map((r, i) => resolveRowId(r, i)));
    }
    return new Set<string>();
  }, [selectedRowIds, selectedRows, resolveRowId]);

  const hasSelectionSupport = !!onSelectionChange || selectable;

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      if (selectedRows !== undefined) {
        onSelectionChange(data);
      } else {
        const allIds = new Set(data.map((r, i) => resolveRowId(r, i)));
        onSelectionChange(allIds);
      }
    } else {
      if (selectedRows !== undefined) {
        onSelectionChange([]);
      } else {
        onSelectionChange(new Set());
      }
    }
  };

  const handleRowSelect = (item: T, rowId: string, checked: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onSelectionChange) return;

    if (selectedRows !== undefined) {
      const next = checked
        ? [...selectedRows, item]
        : selectedRows.filter((r, i) => resolveRowId(r, i) !== rowId);
      onSelectionChange(next);
    } else {
      const next = new Set(activeSelectedSet);
      if (checked) {
        next.add(rowId);
      } else {
        next.delete(rowId);
      }
      onSelectionChange(next);
    }
  };

  const isAllSelected = data.length > 0 && data.every((item, i) => activeSelectedSet.has(resolveRowId(item, i)));
  const isPartiallySelected = data.some((item, i) => activeSelectedSet.has(resolveRowId(item, i))) && !isAllSelected;

  const renderCellContent = (col: ColumnDef<T>, row: T, index: number) => {
    if (col.cell) {
      try {
        const result = (col.cell as any)({ row, index });
        if (result !== undefined) return result;
      } catch {
        // Fallback for (row) signature
      }
      return (col.cell as any)(row);
    }
    if (col.accessorFn) return col.accessorFn(row);
    if (col.accessorKey) return String(row[col.accessorKey] ?? '');
    return String((row as any)[col.id] ?? '');
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header & Primary Actions */}
      {(title || primaryAction || secondaryActions) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
          <div>
            {title && <h2 className="text-xl font-bold text-foreground tracking-tight">{title}</h2>}
            {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
          </div>
          <div className="flex items-center gap-2">
            {secondaryActions?.map((action, idx) => (
              <button
                key={idx}
                onClick={action.onClick}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-muted/50 transition"
              >
                {action.icon}
                <span>{action.label}</span>
              </button>
            ))}
            {primaryAction && (
              <button
                onClick={primaryAction.onClick}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-foreground text-background text-xs font-semibold hover:bg-foreground/90 transition shadow-sm"
              >
                {primaryAction.icon}
                <span>{primaryAction.label}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      {(onSearchChange || filterSlots) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {onSearchChange && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={internalSearch}
                onChange={(e) => setInternalSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-border bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/50 transition"
              />
            </div>
          )}
          {filterSlots && <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">{filterSlots}</div>}
        </div>
      )}

      {/* Main Table / Collapsed Cards Container */}
      <div className="relative management-card overflow-hidden border border-border rounded-xl bg-card">
        {isLoading && (
          <div className="absolute inset-0 z-10 bg-background/60 backdrop-blur-[1px] flex items-center justify-center">
            <RefreshCw className="h-5 w-5 text-foreground animate-spin" />
          </div>
        )}

        {error ? (
          <EmptyState
            type="error"
            title="Failed to load records"
            description={error}
            actionLabel={onRetry ? "Retry Request" : undefined}
            onActionClick={onRetry}
          />
        ) : data.length === 0 && !isLoading ? (
          <EmptyState
            type={internalSearch ? "search" : "empty"}
            title={emptyState?.title}
            description={emptyState?.description}
            actionLabel={emptyState?.actionLabel}
            onActionClick={emptyState?.onActionClick}
          />
        ) : (
          <>
            {/* 1. Desktop & Tablet Multi-Column DataGrid View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="management-table-header border-b border-border bg-muted/40">
                    {hasSelectionSupport && (
                      <th className="py-2.5 px-3 w-8">
                        <input
                          type="checkbox"
                          checked={isAllSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = isPartiallySelected;
                          }}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-border text-foreground focus:ring-foreground"
                        />
                      </th>
                    )}
                    {columns.map((col) => {
                      const sortable = col.isSortable || col.sortable;
                      return (
                        <th
                          key={col.id}
                          style={{ width: col.width }}
                          onClick={() => handleSort(col.id, col.isSortable, col.sortable)}
                          className={cn(
                            'py-2.5 px-3 select-none text-[11px] font-semibold text-muted-foreground uppercase tracking-wider',
                            sortable && 'cursor-pointer hover:text-foreground',
                            col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                          )}
                        >
                          <div
                            className={cn(
                              'inline-flex items-center gap-1',
                              col.align === 'right' && 'justify-end',
                              col.align === 'center' && 'justify-center'
                            )}
                          >
                            <span>{col.header}</span>
                            {sortable && (
                              <span className="text-muted-foreground">
                                {sortColumn === col.id ? (
                                  sortDirection === 'asc' ? (
                                    <ChevronUp className="h-3 w-3 text-foreground" />
                                  ) : (
                                    <ChevronDown className="h-3 w-3 text-foreground" />
                                  )
                                ) : (
                                  <ChevronsUpDown className="h-3 w-3 opacity-40" />
                                )}
                              </span>
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-xs">
                  {data.map((row, idx) => {
                    const rowId = resolveRowId(row, idx);
                    const isSelected = activeSelectedSet.has(rowId);
                    return (
                      <tr
                        key={rowId}
                        onClick={() => onRowClick?.(row)}
                        className={cn(
                          'management-table-row transition-colors hover:bg-muted/30',
                          onRowClick && 'cursor-pointer',
                          isSelected && 'bg-muted/40'
                        )}
                      >
                        {hasSelectionSupport && (
                          <td className="py-2.5 px-3 w-8" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => handleRowSelect(row, rowId, e.target.checked, e as any)}
                              className="rounded border-border text-foreground focus:ring-foreground"
                            />
                          </td>
                        )}
                        {columns.map((col) => (
                          <td
                            key={col.id}
                            className={cn(
                              'py-2.5 px-3 text-foreground align-middle',
                              col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                            )}
                          >
                            {renderCellContent(col, row, idx)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 2. Responsive Mobile/Small Tablet Vertical Collapse View (T032) */}
            <div className="block md:hidden divide-y divide-border">
              {data.map((row, idx) => {
                const rowId = resolveRowId(row, idx);
                const isSelected = activeSelectedSet.has(rowId);
                const criticalCols = columns.filter((c) => c.priority === 'critical' || !c.priority);
                const secondaryCols = columns.filter((c) => c.priority === 'secondary' || c.priority === 'optional');
                const actionsCol = columns.find((c) => c.id === 'actions' || c.header === '');

                return (
                  <div
                    key={rowId}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      'p-4 space-y-3 transition-colors hover:bg-muted/20',
                      onRowClick && 'cursor-pointer',
                      isSelected && 'bg-muted/40'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {hasSelectionSupport && (
                        <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleRowSelect(row, rowId, e.target.checked, e as any)}
                            className="rounded border-border text-foreground focus:ring-foreground"
                          />
                        </div>
                      )}
                      <div className="flex-1 space-y-1">
                        {criticalCols.slice(0, 2).map((col) => (
                          <div key={col.id} className="text-xs">
                            {renderCellContent(col, row, idx)}
                          </div>
                        ))}
                      </div>
                      {actionsCol && (
                        <div onClick={(e) => e.stopPropagation()}>
                          {renderCellContent(actionsCol, row, idx)}
                        </div>
                      )}
                    </div>

                    {/* Secondary Fields as Key-Value Pairs */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 text-[11px]">
                      {secondaryCols.map((col) => (
                        <div key={col.id} className="space-y-0.5">
                          <p className="font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
                            {col.header}
                          </p>
                          <div className="text-foreground">
                            {renderCellContent(col, row, idx)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Pagination Footer */}
        {activeTotal > 0 && onPageChange && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2.5 border-t border-border bg-muted/20 text-xs text-muted-foreground">
            <div>
              Showing <span className="font-semibold text-foreground font-mono">{(activePage - 1) * pageSize + 1}</span> to{' '}
              <span className="font-semibold text-foreground font-mono">{Math.min(activePage * pageSize, activeTotal)}</span> of{' '}
              <span className="font-semibold text-foreground font-mono">{activeTotal}</span> entries
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={activePage <= 1}
                onClick={() => onPageChange(activePage - 1)}
                className="px-2.5 py-1 rounded border border-border bg-card font-medium text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted/50 transition text-xs"
              >
                Previous
              </button>
              <span className="px-2 font-mono text-xs text-muted-foreground">
                Page {activePage} of {totalPages}
              </span>
              <button
                disabled={activePage >= totalPages}
                onClick={() => onPageChange(activePage + 1)}
                className="px-2.5 py-1 rounded border border-border bg-card font-medium text-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted/50 transition text-xs"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManagementDataGrid;
