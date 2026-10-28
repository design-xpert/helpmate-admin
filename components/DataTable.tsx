"use client";

import React, { useState, useMemo } from "react";
import { CustomSelect } from "@/components/CustomSelect";
import {
  Search,
  Download,
  Upload,
  Trash2,
  CheckCircle2,
  Eye,
  Edit2,
  Copy,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  X,
  Plus,
  Filter,
  FileSpreadsheet,
  AlertTriangle,
  Printer,
  RotateCcw,
  Calendar,
  SlidersHorizontal,
  Clock,
  UserCheck,
  MoreVertical,
} from "lucide-react";
import { Portal } from "@/components/Portal";
import { RowActionMenu } from "@/components/RowActionMenu";

export interface Column<T> {
  key: string;
  header: string;
  accessor?: (row: T, index?: number) => React.ReactNode;
  sortable?: boolean;
  sticky?: "left" | "right";
  stickyLeftOffset?: number;
  className?: string;
}

export interface DataTableProps<T extends Record<string, any>> {
  title?: string;
  description?: string;
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  onAddClick?: () => void;
  addButtonLabel?: string;
  onRowView?: (row: T) => void;
  onRowEdit?: (row: T) => void;
  onRowDelete?: (row: T) => void;
  statusField?: string;
  idField?: string;
  hideActionsColumn?: boolean;
  hideStatusFilter?: boolean;
  extraFilters?: React.ReactNode;
  disableDelete?: boolean;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  serverPagination?: boolean;
  totalRecords?: number;
  totalPages?: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  isLoading?: boolean;
}

export function DataTable<T extends Record<string, any>>({
  title,
  description,
  columns,
  data: initialData,
  searchPlaceholder = "Search records...",
  onAddClick,
  addButtonLabel = "Add New Record",
  onRowView,
  onRowEdit,
  onRowDelete,
  statusField = "status",
  idField = "id",
  hideActionsColumn = false,
  hideStatusFilter = false,
  extraFilters,
  disableDelete = false,
  currentPage: currentPageProp,
  onPageChange,
  serverPagination = false,
  totalRecords: totalRecordsProp,
  totalPages: totalPagesProp,
  pageSize: pageSizeProp,
  pageSizeOptions,
  onPageSizeChange,
  searchValue: searchValueProp,
  onSearchChange,
  isLoading = false,
}: DataTableProps<T>) {
  const hasDefaultActionsColumn =
    !hideActionsColumn &&
    !columns.some(
      (col) => col.header.toLowerCase() === "actions" || col.key.toLowerCase() === "actions"
    );
  const [data, setData] = useState<T[]>(initialData);
  const [prevInitialData, setPrevInitialData] = useState<T[]>(initialData);

  // Sync state synchronously if initialData prop changes, eliminating 1-render empty lag
  if (initialData !== prevInitialData) {
    setPrevInitialData(initialData);
    setData(initialData);
  }
  const [deletedTrash, setDeletedTrash] = useState<T[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const effectiveSearchQuery = searchValueProp !== undefined ? searchValueProp : searchQuery;

  // Local state for the input so typing is instantaneous, while debouncing onSearchChange
  const [localSearchInput, setLocalSearchInput] = useState(effectiveSearchQuery || "");

  // Sync if external searchValue changes (e.g., reset from parent or tab switch)
  React.useEffect(() => {
    setLocalSearchInput(effectiveSearchQuery || "");
  }, [effectiveSearchQuery]);

  // Debounce search update: wait until user stops typing (500ms) before triggering search/API
  React.useEffect(() => {
    if (localSearchInput === effectiveSearchQuery) return;

    const timer = setTimeout(() => {
      setSearchQuery(localSearchInput);
      onSearchChange?.(localSearchInput);
      if (currentPageProp === undefined) {
        setInternalPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [localSearchInput, effectiveSearchQuery, onSearchChange, currentPageProp]);

  const [selectedStatusFilter, setSelectedStatusFilter] = useState("All");

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [internalPage, setInternalPage] = useState(currentPageProp || 1);
  const currentPage = currentPageProp !== undefined ? currentPageProp : internalPage;

  React.useEffect(() => {
    if (currentPageProp !== undefined) {
      setInternalPage(currentPageProp);
    }
  }, [currentPageProp]);

  const handlePageChange = (newPage: number | ((prev: number) => number)) => {
    const resolvedPage = typeof newPage === "function" ? newPage(currentPage) : newPage;
    if (currentPageProp === undefined) {
      setInternalPage(resolvedPage);
    }
    onPageChange?.(resolvedPage);
  };

  const [internalPageSize, setInternalPageSize] = useState(pageSizeProp || 10);
  const pageSize = pageSizeProp !== undefined ? pageSizeProp : internalPageSize;

  React.useEffect(() => {
    if (pageSizeProp !== undefined) {
      setInternalPageSize(pageSizeProp);
    }
  }, [pageSizeProp]);

  const [viewingRow, setViewingRow] = useState<T | null>(null);
  const [deletingRow, setDeletingRow] = useState<T | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isBulkStatusModalOpen, setIsBulkStatusModalOpen] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);

  // Hold click & drag to scroll table state
  const tableContainerRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragScrollLeft, setDragScrollLeft] = useState(0);

  const handleTableMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    // Do not initiate drag if user clicked an interactive input, button, link, select, or menu
    if (
      target.closest("button") ||
      target.closest("a") ||
      target.closest("input") ||
      target.closest("select") ||
      target.closest("textarea") ||
      target.closest("[role='button']")
    ) {
      return;
    }

    if (!tableContainerRef.current) return;
    setIsDragging(true);
    setDragStartX(e.pageX - tableContainerRef.current.offsetLeft);
    setDragScrollLeft(tableContainerRef.current.scrollLeft);
  };

  const handleTableMouseLeave = () => {
    setIsDragging(false);
  };

  const handleTableMouseUp = () => {
    setIsDragging(false);
  };

  const handleTableMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !tableContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - tableContainerRef.current.offsetLeft;
    const walk = (x - dragStartX) * 1.6;
    tableContainerRef.current.scrollLeft = dragScrollLeft - walk;
  };

  React.useEffect(() => {
    setData(initialData);
    setPrevInitialData(initialData);
  }, [initialData]);

  // Compute sticky offsets for left columns
  const calculatedLeftOffsets = useMemo(() => {
    let accumulator = 44; // starting after checkbox (44px)
    const offsets: Record<string, number> = {};
    columns.forEach((col) => {
      if (col.sticky === "left") {
        if (col.stickyLeftOffset !== undefined) {
          offsets[col.key] = col.stickyLeftOffset;
          accumulator = col.stickyLeftOffset + (col.key === "id" ? 130 : 170);
        } else {
          offsets[col.key] = accumulator;
          const estWidth = col.key === "id" ? 130 : col.key === "customerName" ? 170 : 130;
          accumulator += estWidth;
        }
      }
    });
    return offsets;
  }, [columns]);

  const leftStickyCols = useMemo(() => columns.filter((c) => c.sticky === "left"), [columns]);
  const lastLeftStickyKey = leftStickyCols.length > 0 ? leftStickyCols[leftStickyCols.length - 1].key : null;

  const hasLeftSticky = leftStickyCols.length > 0;

  const dataSource = serverPagination ? initialData : data;

  const filteredData = useMemo(() => {
    if (serverPagination) {
      return dataSource;
    }
    return dataSource.filter((row) => {
      if (selectedStatusFilter !== "All" && row[statusField]) {
        if (String(row[statusField]).toLowerCase() !== selectedStatusFilter.toLowerCase()) return false;
      }
      if (!effectiveSearchQuery.trim()) return true;
      const q = effectiveSearchQuery.toLowerCase();
      return Object.values(row).some((val) => {
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(q);
      });
    });
  }, [dataSource, effectiveSearchQuery, selectedStatusFilter, statusField, serverPagination]);

  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      const comparison = String(valA).localeCompare(String(valB), undefined, { numeric: true });
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [filteredData, sortKey, sortOrder]);

  const totalPages = serverPagination && totalPagesProp !== undefined
    ? totalPagesProp
    : serverPagination && totalRecordsProp !== undefined
    ? Math.ceil(totalRecordsProp / pageSize) || 1
    : Math.ceil(sortedData.length / pageSize) || 1;

  const paginatedData = useMemo(() => {
    if (serverPagination) {
      return sortedData;
    }
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [serverPagination, sortedData, currentPage, pageSize]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortOrder === "asc") setSortOrder("desc");
      else {
        setSortKey(null);
        setSortOrder("asc");
      }
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const getRowId = (row: T, fallbackIndex?: number): string => {
    if (!row) return fallbackIndex !== undefined ? `row-${fallbackIndex}` : "unknown";
    const val = row[idField] ?? row._id ?? row.id ?? row.key;
    if (val !== undefined && val !== null && String(val) !== "undefined" && String(val) !== "") {
      return String(val);
    }
    return fallbackIndex !== undefined ? `row-${fallbackIndex}` : `row-${Math.random()}`;
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(paginatedData.map((row, idx) => getRowId(row, idx))));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleExportCSV = () => {
    if (sortedData.length === 0) return;
    const headers = columns.map((c) => c.header).join(",");
    const rows = sortedData.map((row) =>
      columns.map((c) => `"${String(row[c.key] ?? "").replace(/"/g, '""')}"`).join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${(title || "export").toLowerCase().replace(/\s+/g, "_")}_export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSoftDeleteRow = (row: T) => {
    const targetId = getRowId(row);
    setDeletedTrash([row, ...deletedTrash]);
    setData(data.filter((r) => getRowId(r) !== targetId));
    if (onRowDelete) onRowDelete(row);
    setDeletingRow(null);
  };

  const handleRestoreRow = (row: T) => {
    const targetId = getRowId(row);
    setDeletedTrash(deletedTrash.filter((r) => getRowId(r) !== targetId));
    setData([row, ...data]);
  };

  const handleBulkSoftDelete = () => {
    const toDelete = data.filter((row) => selectedIds.has(getRowId(row)));
    setDeletedTrash([...toDelete, ...deletedTrash]);
    setData(data.filter((row) => !selectedIds.has(getRowId(row))));
    setSelectedIds(new Set());
    setIsBulkDeleteModalOpen(false);
  };

  const handleBulkStatusChange = (newStatus: string) => {
    setData(
      data.map((row) => {
        if (selectedIds.has(getRowId(row))) {
          return { ...row, [statusField]: newStatus };
        }
        return row;
      })
    );
    setSelectedIds(new Set());
    setIsBulkStatusModalOpen(false);
  };

  const handleDuplicateRow = (row: T) => {
    const keyToUse = row[idField] !== undefined ? idField : row._id !== undefined ? "_id" : "id";
    const cloned = { ...row, [keyToUse]: `${getRowId(row)}-copy-${Date.now()}` };
    setData([cloned, ...data]);
  };

  const isAllSelected =
    paginatedData.length > 0 &&
    paginatedData.every((row, idx) => selectedIds.has(getRowId(row, idx)));

  const hasTopBar = !!(title || onAddClick);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      {hasTopBar && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            {title && (
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print</span>
            </button>

            {deletedTrash.length > 0 && (
              <button
                type="button"
                onClick={() => setIsTrashOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Trash Bin ({deletedTrash.length})</span>
              </button>
            )}

            {onAddClick && (
              <button
                type="button"
                onClick={onAddClick}
                className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-lux flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{addButtonLabel}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* UNIFIED CONTAINER: MERGED SEARCH BAR, FILTERS, TABLE & PAGINATION */}
      <div className="glass-panel rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs space-y-0">
        {/* Search Bar & Action Controls (Merged Top Header) */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={localSearchInput}
              onChange={(e) => {
                setLocalSearchInput(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (localSearchInput !== effectiveSearchQuery) {
                    setSearchQuery(localSearchInput);
                    onSearchChange?.(localSearchInput);
                    if (currentPageProp === undefined) {
                      setInternalPage(1);
                    }
                  }
                }
              }}
              placeholder={searchPlaceholder}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-9 h-9 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 transition-all font-medium shadow-xs"
            />
            {localSearchInput && (
              <button
                type="button"
                onClick={() => {
                  setLocalSearchInput("");
                  setSearchQuery("");
                  onSearchChange?.("");
                  if (currentPageProp === undefined) {
                    setInternalPage(1);
                  }
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {extraFilters}

            {!hideStatusFilter && (
              <div className="w-36">
                <CustomSelect
                  size="sm"
                  value={selectedStatusFilter}
                  onChange={(val) => {
                    setSelectedStatusFilter(val);
                    handlePageChange(1);
                  }}
                  options={[
                    { value: "All", label: "All Statuses" },
                    { value: "Active", label: "Active" },
                    { value: "Approved", label: "Approved" },
                    { value: "Pending", label: "Pending" },
                    { value: "Completed", label: "Completed" },
                    { value: "Cancelled", label: "Cancelled" },
                  ]}
                />
              </div>
            )}

            <button
              type="button"
              onClick={handleExportCSV}
              className="h-9 px-3.5 rounded-xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900/60 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-brand-600" />
              <span>Export CSV</span>
            </button>

            <button
              type="button"
              onClick={() => setShowMetadata(!showMetadata)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                showMetadata
                  ? "bg-brand-50 border-brand-300 text-brand-600 dark:bg-brand-950/60 dark:border-brand-800 dark:text-brand-400"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Audit Metadata</span>
            </button>

            {selectedIds.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-brand-600 bg-brand-50 dark:bg-brand-950/80 px-2.5 py-1 rounded-lg border border-brand-200 dark:border-brand-800">
                  {selectedIds.size} Selected
                </span>
                <button
                  type="button"
                  onClick={() => setIsBulkStatusModalOpen(true)}
                  className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 text-xs font-semibold cursor-pointer"
                >
                  Change Status
                </button>
                {!disableDelete && (
                  <button
                    type="button"
                    onClick={() => setIsBulkDeleteModalOpen(true)}
                    className="p-1.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 cursor-pointer"
                    title="Bulk Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Table Content - Responsive Mobile Cards Layout on Small Screens */}
        <div className="block md:hidden divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div key={`mobile-shimmer-${idx}`} className="p-4 space-y-3 animate-pulse bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700/60 rounded" />
                  <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700/60 rounded-full" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="h-3.5 bg-slate-200 dark:bg-slate-700/60 rounded w-3/4" />
                  <div className="h-3.5 bg-slate-200 dark:bg-slate-700/60 rounded w-1/2" />
                  <div className="h-3.5 bg-slate-200 dark:bg-slate-700/60 rounded w-2/3" />
                  <div className="h-3.5 bg-slate-200 dark:bg-slate-700/60 rounded w-1/3" />
                </div>
              </div>
            ))
          ) : paginatedData.length === 0 ? (
            <div className="py-10 px-4 text-center text-slate-400">
              <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">No matching records found</p>
              <p className="text-xs text-slate-400 mt-1">Try resetting filters or adding new data.</p>
            </div>
          ) : (
            paginatedData.map((row, rowIndex) => {
              const idStr = getRowId(row, rowIndex);
              const isSelected = selectedIds.has(idStr);
              const globalRowIndex = (currentPage - 1) * pageSize + rowIndex + 1;

              const statusCol = columns.find(
                (c) => c.key === statusField || c.key.toLowerCase().includes("status")
              );

              const actionsCol = columns.find(
                (c) => c.key.toLowerCase().includes("action") || c.header.toLowerCase().includes("action")
              );

              return (
                <div
                  key={idStr}
                  className="p-4 space-y-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                >
                  {/* Card Header: Checkbox + ID + Status */}
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectRow(idStr)}
                        className="w-4 h-4 rounded border-slate-300 text-brand-500 cursor-pointer"
                      />
                      <span className="font-mono font-semibold text-brand-600 dark:text-brand-400 text-xs">
                        {row[idField] || row._id || row.id || `#${globalRowIndex}`}
                      </span>
                    </div>

                    {statusCol ? (
                      <div>{statusCol.accessor ? statusCol.accessor(row, globalRowIndex) : String(row[statusField] || "")}</div>
                    ) : row[statusField] ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {String(row[statusField])}
                      </span>
                    ) : null}
                  </div>

                  {/* Card Data Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    {columns.map((col) => {
                      if (
                        col.key === idField ||
                        col.key === statusField ||
                        col.key.toLowerCase().includes("action") ||
                        col.header.toLowerCase().includes("action")
                      ) {
                        return null;
                      }

                      return (
                        <div key={col.key} className="space-y-0.5">
                          <span className="text-[10px] font-medium uppercase text-slate-400 tracking-wider block">
                            {col.header}
                          </span>
                          <div className="text-xs font-medium text-slate-900 dark:text-white">
                            {col.accessor ? col.accessor(row, globalRowIndex) : row[col.key]}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Card Actions Footer */}
                  {(actionsCol || hasDefaultActionsColumn) && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                        Row Actions
                      </span>
                      <div>
                        {actionsCol ? (
                          actionsCol.accessor ? (
                            actionsCol.accessor(row, globalRowIndex)
                          ) : (
                            row[actionsCol.key]
                          )
                        ) : hasDefaultActionsColumn ? (
                          <RowActionMenu
                            actions={[
                              {
                                label: "View",
                                icon: Eye,
                                onClick: () => (onRowView ? onRowView(row) : setViewingRow(row)),
                              },
                              ...(onRowEdit
                                ? [
                                    {
                                      label: "Edit",
                                      icon: Edit2,
                                      onClick: () => onRowEdit(row),
                                    },
                                  ]
                                : []),
                              {
                                label: "Duplicate",
                                icon: Copy,
                                onClick: () => handleDuplicateRow(row),
                              },
                              ...(!disableDelete
                                ? [
                                    {
                                      label: "Delete",
                                      icon: Trash2,
                                      onClick: () => setDeletingRow(row),
                                      danger: true,
                                    },
                                  ]
                                : []),
                            ]}
                          />
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table Content - Hold Click & Drag to Scroll */}
        <div
          ref={tableContainerRef}
          onMouseDown={handleTableMouseDown}
          onMouseLeave={handleTableMouseLeave}
          onMouseUp={handleTableMouseUp}
          onMouseMove={handleTableMouseMove}
          className={`hidden md:block overflow-x-auto select-none transition-all ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
          title="Click and hold to drag table horizontally"
        >
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
            <thead className="bg-slate-100/90 dark:bg-slate-800/90 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs">
              <tr>
                <th
                  className={`py-3.5 px-3 w-[44px] min-w-[44px] max-w-[44px] align-middle bg-slate-100 dark:bg-slate-800 ${
                    hasLeftSticky
                      ? "sticky left-0 z-35"
                      : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-brand-500 cursor-pointer align-middle"
                  />
                </th>
                {columns.map((col) => {
                  const isActionsCol =
                    col.header.toLowerCase().includes("action") ||
                    col.key.toLowerCase().includes("action") ||
                    col.sticky === "right";

                  const isLeftSticky = col.sticky === "left";
                  const isRightSticky = col.sticky === "right" || isActionsCol;
                  const isLastLeft = col.key === lastLeftStickyKey;

                  const stickyStyle: React.CSSProperties = isLeftSticky
                    ? { position: "sticky", left: `${calculatedLeftOffsets[col.key] || 0}px`, zIndex: 35 }
                    : isRightSticky
                    ? { position: "sticky", right: 0, zIndex: 35 }
                    : {};

                  const stickyClass = isLeftSticky
                    ? `bg-slate-100 dark:bg-slate-800 ${
                        isLastLeft ? "shadow-[4px_0_8px_-2px_rgba(0,0,0,0.1)]" : ""
                      }`
                    : isRightSticky
                    ? "bg-slate-100 dark:bg-slate-800 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.1)]"
                    : "";

                  return (
                    <th
                      key={col.key}
                      style={stickyStyle}
                      onClick={() => col.sortable !== false && handleSort(col.key)}
                      className={`py-3.5 px-4 align-middle cursor-pointer select-none whitespace-nowrap ${
                        isActionsCol ? "text-right" : ""
                      } ${stickyClass} ${col.className || ""}`}
                    >
                      <div className={`flex items-center gap-1.5 ${isActionsCol ? "justify-end" : ""}`}>
                        <span>{col.header}</span>
                        {col.sortable !== false && <ArrowUpDown className="w-3 h-3 text-slate-400" />}
                      </div>
                    </th>
                  );
                })}
                {showMetadata && (
                  <>
                    <th className="py-3.5 px-4 align-middle whitespace-nowrap">Created By / Date</th>
                    <th className="py-3.5 px-4 align-middle whitespace-nowrap">Updated By / Date</th>
                  </>
                )}
                {hasDefaultActionsColumn && (
                  <th className="py-3.5 px-4 text-right align-middle whitespace-nowrap sticky right-0 z-35 bg-slate-100 dark:bg-slate-800 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.1)]">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: pageSize || 6 }).map((_, idx) => (
                  <tr key={`shimmer-row-${idx}`} className="animate-pulse">
                    <td
                      className={`py-3.5 px-3 w-[44px] min-w-[44px] max-w-[44px] align-middle ${
                        hasLeftSticky
                          ? "sticky left-0 z-10 bg-white dark:bg-slate-900"
                          : ""
                      }`}
                    >
                      <div className="w-4 h-4 rounded bg-slate-200 dark:bg-slate-700/60" />
                    </td>
                    {columns.map((col, cIdx) => {
                      const isActionsCol =
                        col.header.toLowerCase().includes("action") ||
                        col.key.toLowerCase().includes("action") ||
                        col.sticky === "right";
                      const isLeftSticky = col.sticky === "left";
                      const isRightSticky = col.sticky === "right" || isActionsCol;
                      const isLastLeft = col.key === lastLeftStickyKey;

                      const stickyStyle: React.CSSProperties = isLeftSticky
                        ? { position: "sticky", left: `${calculatedLeftOffsets[col.key] || 0}px`, zIndex: 10 }
                        : isRightSticky
                        ? { position: "sticky", right: 0, zIndex: 10 }
                        : {};

                      const stickyClass = isLeftSticky
                        ? `bg-white dark:bg-slate-900 ${isLastLeft ? "shadow-[4px_0_8px_-2px_rgba(0,0,0,0.1)]" : ""}`
                        : isRightSticky
                        ? "bg-white dark:bg-slate-900 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.1)]"
                        : "";

                      return (
                        <td
                          key={col.key || cIdx}
                          style={stickyStyle}
                          className={`py-3.5 px-4 align-middle whitespace-nowrap ${stickyClass} ${col.className || ""}`}
                        >
                          <div
                            className="h-3.5 rounded bg-slate-200 dark:bg-slate-700/60"
                            style={{ width: `${Math.min(85, Math.max(35, (cIdx * 37 + 55) % 85))}%` }}
                          />
                        </td>
                      );
                    })}
                    {showMetadata && (
                      <>
                        <td className="py-3.5 px-4"><div className="h-3.5 w-24 rounded bg-slate-200 dark:bg-slate-700/60" /></td>
                        <td className="py-3.5 px-4"><div className="h-3.5 w-24 rounded bg-slate-200 dark:bg-slate-700/60" /></td>
                      </>
                    )}
                    {hasDefaultActionsColumn && (
                      <td className="py-3.5 px-4 text-right align-middle whitespace-nowrap sticky right-0 z-10 bg-white dark:bg-slate-900 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.1)]">
                        <div className="h-6 w-14 ml-auto rounded-lg bg-slate-200 dark:bg-slate-700/60" />
                      </td>
                    )}
                  </tr>
                ))
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 1 + (showMetadata ? 2 : 0) + (hasDefaultActionsColumn ? 1 : 0)}
                    className="py-12 text-center text-slate-400 align-middle"
                  >
                    <FileSpreadsheet className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">No matching records found</p>
                    <p className="text-xs text-slate-400 mt-1">Try resetting filters or adding new data.</p>
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, rowIndex) => {
                  const idStr = getRowId(row, rowIndex);
                  const isSelected = selectedIds.has(idStr);
                  const globalRowIndex = (currentPage - 1) * pageSize + rowIndex + 1;

                  return (
                    <tr
                      key={idStr}
                      className="group hover:bg-slate-50/90 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      <td
                        className={`py-3.5 px-3 w-[44px] min-w-[44px] max-w-[44px] align-middle ${
                          hasLeftSticky
                            ? "sticky left-0 z-10 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800"
                            : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(idStr)}
                          className="w-4 h-4 rounded border-slate-300 text-brand-500 cursor-pointer align-middle"
                        />
                      </td>

                      {columns.map((col) => {
                        const isActionsCol =
                          col.header.toLowerCase().includes("action") ||
                          col.key.toLowerCase().includes("action") ||
                          col.sticky === "right";

                        const isLeftSticky = col.sticky === "left";
                        const isRightSticky = col.sticky === "right" || isActionsCol;
                        const isLastLeft = col.key === lastLeftStickyKey;

                        const stickyStyle: React.CSSProperties = isLeftSticky
                          ? { position: "sticky", left: `${calculatedLeftOffsets[col.key] || 0}px`, zIndex: 10 }
                          : isRightSticky
                          ? { position: "sticky", right: 0, zIndex: 10 }
                          : {};

                        const stickyClass = isLeftSticky
                          ? `bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 ${
                              isLastLeft ? "shadow-[4px_0_8px_-2px_rgba(0,0,0,0.08)]" : ""
                            }`
                          : isRightSticky
                          ? "bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.08)]"
                          : "";

                        return (
                          <td
                            key={col.key}
                            style={stickyStyle}
                            className={`py-3.5 px-4 align-middle whitespace-nowrap ${
                              isActionsCol ? "text-right" : ""
                            } ${stickyClass} ${col.className || ""}`}
                          >
                            {col.accessor ? col.accessor(row, globalRowIndex) : row[col.key]}
                          </td>
                        );
                      })}

                      {showMetadata && (
                        <>
                          <td className="py-4 px-4 text-[11px]">
                            <span className="font-medium block text-slate-700 dark:text-slate-300">{row.createdBy || "Admin"}</span>
                            <span className="text-[9px] text-slate-400">{row.createdDate || "2026-07-25"}</span>
                          </td>
                          <td className="py-4 px-4 text-[11px]">
                            <span className="font-medium block text-slate-700 dark:text-slate-300">{row.updatedBy || "System"}</span>
                            <span className="text-[9px] text-slate-400">{row.updatedDate || "Just Now"}</span>
                          </td>
                        </>
                      )}

                      {hasDefaultActionsColumn && (
                        <td className="py-4 px-4 text-right sticky right-0 z-20 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.08)]">
                          <RowActionMenu
                            actions={[
                              {
                                label: "View",
                                icon: Eye,
                                onClick: () => (onRowView ? onRowView(row) : setViewingRow(row)),
                              },
                              ...(onRowEdit
                                ? [
                                    {
                                      label: "Edit",
                                      icon: Edit2,
                                      onClick: () => onRowEdit(row),
                                    },
                                  ]
                                : []),
                              {
                                label: "Duplicate",
                                icon: Copy,
                                onClick: () => handleDuplicateRow(row),
                              },
                              ...(!disableDelete
                                ? [
                                    {
                                      label: "Delete",
                                      icon: Trash2,
                                      onClick: () => setDeletingRow(row),
                                      danger: true,
                                    },
                                  ]
                                : []),
                            ]}
                          />
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-600 dark:text-slate-300 select-none">
          {/* LEFT: Rows Per Page Selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                if (pageSizeProp === undefined) {
                  setInternalPageSize(newSize);
                }
                onPageSizeChange?.(newSize);
                handlePageChange(1);
              }}
              className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold cursor-pointer outline-none focus:border-brand-500 shadow-xs"
            >
              {(pageSizeOptions || [10, 20, 50, 100]).map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* CENTER: Pagination Controls (First, Second ... Current ... Second-to-last, Last) */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 md:pb-0 no-scrollbar">
            {/* Previous Button */}
            <button
              type="button"
              onClick={() => handlePageChange((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            </button>

            {/* Page Number Pills */}
            <div className="flex items-center gap-1 shrink-0">
              {(() => {
                const getPageNumbers = (current: number, total: number) => {
                  if (total <= 3) return Array.from({ length: total }, (_, i) => i + 1);

                  const set = new Set<number>();
                  set.add(1); // First page
                  set.add(current); // Current page
                  set.add(total); // Last page

                  const sorted = Array.from(set).sort((a, b) => a - b);
                  const result: (number | string)[] = [];

                  for (let i = 0; i < sorted.length; i++) {
                    if (i > 0 && sorted[i] - sorted[i - 1] > 1) {
                      result.push("...");
                    }
                    result.push(sorted[i]);
                  }
                  return result;
                };

                return getPageNumbers(currentPage, totalPages).map((p, idx) => {
                  if (p === "...") {
                    return (
                      <span key={`ellipsis-${idx}`} className="px-1.5 py-1 text-slate-400 font-mono text-xs">
                        ...
                      </span>
                    );
                  }
                  const pageNum = Number(p);
                  const isCurrent = pageNum === currentPage;
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => handlePageChange(pageNum)}
                      className={`min-w-[32px] h-8 px-2.5 rounded-xl font-semibold text-xs transition-all cursor-pointer ${
                        isCurrent
                          ? "bg-brand-500 text-white shadow-lux"
                          : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                });
              })()}
            </div>

            {/* Next Button */}
            <button
              type="button"
              onClick={() => handlePageChange((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4 text-slate-700 dark:text-slate-300" />
            </button>
          </div>

          {/* RIGHT: Showing Entries Info */}
          <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px] font-medium">
            {serverPagination ? (
              <>
                Showing {totalRecordsProp && totalRecordsProp > 0 ? (currentPage - 1) * pageSize + 1 : (sortedData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0)}–{Math.min(currentPage * pageSize, totalRecordsProp ?? sortedData.length)} of {totalRecordsProp ?? sortedData.length} entries
              </>
            ) : (
              <>
                Showing {sortedData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–{Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} entries
              </>
            )}
          </div>
        </div>
      </div>

      {/* VIEW DRAWER */}
      {viewingRow && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex justify-end">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full p-6 space-y-6 overflow-y-auto">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white">Record Inspector</h3>
              <button type="button" onClick={() => setViewingRow(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-2 text-xs">
              {Object.entries(viewingRow).map(([k, v]) => (
                <div key={k} className="p-2.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex justify-between">
                  <span className="font-bold text-slate-500 uppercase text-[9px]">{k}</span>
                  <span className="font-semibold text-slate-900 dark:text-white truncate max-w-xs">{String(v ?? "—")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        </Portal>
      )}

      {/* TRASH BIN DRAWER */}
      {isTrashOpen && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full p-6 space-y-4 overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-500" />
                Soft-Deleted Trash Bin
              </h3>
              <button type="button" onClick={() => setIsTrashOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="space-y-2">
              {deletedTrash.map((row) => (
                <div key={String(row[idField])} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white block">{row.name || row.title || String(row[idField])}</span>
                    <span className="text-[10px] text-slate-400">ID: {String(row[idField])}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRestoreRow(row)}
                    className="px-3 py-1 bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Restore
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        </Portal>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deletingRow && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 outline-none">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl max-w-sm w-full space-y-4 text-center ring-1 ring-slate-900/10 dark:ring-slate-800 shadow-2xl outline-none">
              <AlertTriangle className="w-10 h-10 text-red-600 mx-auto" />
              <h3 className="font-extrabold text-slate-900 dark:text-white">Confirm Soft Delete</h3>
              <p className="text-xs text-slate-500">Soft delete {String(deletingRow[idField])}? Item will move to Trash Bin for recovery.</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setDeletingRow(null)} className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-300">Cancel</button>
                <button type="button" onClick={() => handleSoftDeleteRow(deletingRow)} className="flex-1 py-2 bg-red-600 text-white rounded-xl font-bold text-xs">Soft Delete</button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* BULK DELETE MODAL */}
      {isBulkDeleteModalOpen && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 outline-none">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl max-w-sm w-full space-y-4 text-center ring-1 ring-slate-900/10 dark:ring-slate-800 shadow-2xl outline-none">
              <AlertTriangle className="w-10 h-10 text-red-600 mx-auto" />
              <h3 className="font-extrabold text-slate-900 dark:text-white">Delete Selected Records</h3>
              <p className="text-xs text-slate-500">Soft delete {selectedIds.size} selected records?</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => setIsBulkDeleteModalOpen(false)} className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-300">Cancel</button>
                <button type="button" onClick={handleBulkSoftDelete} className="flex-1 py-2 bg-red-600 text-white rounded-xl font-bold text-xs">Soft Delete Selected</button>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* BULK STATUS MODAL */}
      {isBulkStatusModalOpen && (
        <Portal>
          <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 outline-none">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl max-w-sm w-full space-y-4 ring-1 ring-slate-900/10 dark:ring-slate-800 shadow-2xl text-left outline-none">
              <h3 className="font-extrabold text-slate-900 dark:text-white">Update Status for {selectedIds.size} Records</h3>
              <div className="space-y-2">
                {["Active", "Pending", "Completed", "Cancelled"].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleBulkStatusChange(st)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-brand-500 hover:text-white transition-all text-left"
                  >
                    Set Status to {st}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setIsBulkStatusModalOpen(false)} className="w-full py-2 bg-slate-100 dark:bg-slate-800 rounded-xl font-bold text-xs text-slate-600">Cancel</button>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
