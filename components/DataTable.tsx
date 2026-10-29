"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
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
  GripVertical,
  RefreshCw,
  Type,
  Check,
  ChevronUp,
  ChevronDown,
  Hash,
  Mail,
  Phone,
  User,
  IndianRupee,
  MapPin,
  Layers,
  ShieldCheck,
  FileText,
  Tag,
  Star,
  Globe,
} from "lucide-react";
import { Portal } from "@/components/Portal";
import { RowActionMenu } from "@/components/RowActionMenu";

// Intelligently deduce contextual Lucide icon for any column if not explicitly supplied
export function getColumnIcon(col: Column<any>): React.ComponentType<{ className?: string }> {
  if (col.icon) return col.icon;
  const text = `${col.key} ${col.header}`.toLowerCase();
  if (text.includes("id") || text.includes("code") || text.includes("no") || text.includes("num") || text.includes("hash")) return Hash;
  if (text.includes("date") || text.includes("day") || text.includes("created")) return Calendar;
  if (text.includes("time") || text.includes("slot") || text.includes("hour")) return Clock;
  if (text.includes("phone") || text.includes("mobile") || text.includes("contact")) return Phone;
  if (text.includes("mail")) return Mail;
  if (text.includes("user") || text.includes("cust") || text.includes("client") || text.includes("tech") || text.includes("partner") || text.includes("name") || text.includes("lead") || text.includes("subscr") || text.includes("member")) return User;
  if (text.includes("status")) return CheckCircle2;
  if (text.includes("amount") || text.includes("price") || text.includes("fee") || text.includes("total") || text.includes("cost") || text.includes("revenue") || text.includes("payout") || text.includes("commission") || text.includes("rate") || text.includes("salary") || text.includes("balance") || text.includes("tax") || text.includes("gst")) return IndianRupee;
  if (text.includes("city") || text.includes("location") || text.includes("address") || text.includes("zone") || text.includes("state") || text.includes("area") || text.includes("pin")) return MapPin;
  if (text.includes("category") || text.includes("service") || text.includes("plan") || text.includes("type")) return Layers;
  if (text.includes("action")) return MoreVertical;
  if (text.includes("role") || text.includes("permission") || text.includes("security") || text.includes("verified")) return ShieldCheck;
  if (text.includes("file") || text.includes("doc") || text.includes("desc") || text.includes("note") || text.includes("content")) return FileText;
  if (text.includes("coupon") || text.includes("discount") || text.includes("offer") || text.includes("promo")) return Tag;
  if (text.includes("rating") || text.includes("review") || text.includes("star") || text.includes("score")) return Star;
  if (text.includes("web") || text.includes("url") || text.includes("link") || text.includes("source") || text.includes("channel")) return Globe;
  return Type;
}

export interface Column<T> {
  key: string;
  header: string;
  accessor?: (row: T, index?: number) => React.ReactNode;
  sortable?: boolean;
  sticky?: "left" | "right";
  stickyLeftOffset?: number;
  className?: string;
  icon?: React.ComponentType<{ className?: string }>;
  defaultHidden?: boolean;
  canHide?: boolean;
  canReorder?: boolean;
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
  enableColumnCustomization?: boolean;
  columnStorageKey?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  pinnedColumnsNotice?: string;
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
  enableColumnCustomization = true,
  columnStorageKey,
  onRefresh,
  isRefreshing = false,
  pinnedColumnsNotice,
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

  // Column customization state
  const [columnOrder, setColumnOrder] = useState<string[]>(() => columns.map((c) => c.key));
  const [hiddenColumnKeys, setHiddenColumnKeys] = useState<Set<string>>(() => {
    return new Set(columns.filter((c) => c.defaultHidden).map((c) => c.key));
  });
  const [isCustomiseOpen, setIsCustomiseOpen] = useState(false);
  const [customiseSearch, setCustomiseSearch] = useState("");
  const [dropdownDragKey, setDropdownDragKey] = useState<string | null>(null);
  const [dropdownDragOverKey, setDropdownDragOverKey] = useState<string | null>(null);
  const [tableDragColKey, setTableDragColKey] = useState<string | null>(null);
  const [tableDropTargetKey, setTableDropTargetKey] = useState<string | null>(null);
  const isDraggingColRef = useRef(false);
  const customiseButtonRef = useRef<HTMLButtonElement>(null);
  const customiseDropdownRef = useRef<HTMLDivElement>(null);
  const [customiseDropdownCoords, setCustomiseDropdownCoords] = useState<{
    top?: number;
    bottom?: number;
    right: number;
    maxHeight?: number;
  }>({ right: 16 });

  const updateCustomiseCoords = useCallback(() => {
    if (!customiseButtonRef.current || typeof window === "undefined") return;
    const rect = customiseButtonRef.current.getBoundingClientRect();
    const right = Math.max(16, window.innerWidth - rect.right);
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    if (spaceBelow < 380 && spaceAbove > spaceBelow) {
      setCustomiseDropdownCoords({
        bottom: window.innerHeight - rect.top + 8,
        right,
        maxHeight: Math.max(240, Math.min(480, spaceAbove - 24)),
      });
    } else {
      setCustomiseDropdownCoords({
        top: rect.bottom + 8,
        right,
        maxHeight: Math.max(240, Math.min(480, spaceBelow - 24)),
      });
    }
  }, []);

  const toggleCustomise = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isCustomiseOpen) {
      updateCustomiseCoords();
    }
    setIsCustomiseOpen((prev) => !prev);
  };

  // Memoized signature of column keys for stable reactivity
  const colKeysSignature = useMemo(() => columns.map((c) => c.key).join(","), [columns]);

  // Effective column storage key so every table across the entire app has automatic isolated persistence
  const effectiveStorageKey = useMemo(() => {
    if (columnStorageKey) return columnStorageKey;
    if (typeof window === "undefined") return undefined;
    const cleanTitle = (title || "").toLowerCase().replace(/[^a-z0-9]+/g, "_");
    let hash = 0;
    for (let i = 0; i < colKeysSignature.length; i++) {
      hash = (hash << 5) - hash + colKeysSignature.charCodeAt(i);
      hash |= 0;
    }
    const cleanPath = window.location.pathname.replace(/[^a-z0-9]+/g, "_");
    const prefix = cleanTitle ? `helpmate_cols_${cleanPath}_${cleanTitle}` : `helpmate_cols_${cleanPath}`;
    return `${prefix}_${Math.abs(hash).toString(36)}`;
  }, [columnStorageKey, title, colKeysSignature]);

  const loadedStorageKeyRef = useRef<string | null>(null);

  // Sync columnOrder if incoming columns prop changes
  useEffect(() => {
    setColumnOrder((prevOrder) => {
      const validKeys = new Set(columns.map((c) => c.key));
      const nextOrder = prevOrder.filter((k) => validKeys.has(k));
      columns.forEach((c) => {
        if (!nextOrder.includes(c.key)) nextOrder.push(c.key);
      });
      return nextOrder;
    });
  }, [colKeysSignature]);

  // Load saved column preferences from localStorage
  useEffect(() => {
    if (!enableColumnCustomization || !effectiveStorageKey || typeof window === "undefined") return;
    if (loadedStorageKeyRef.current === effectiveStorageKey) return;
    loadedStorageKeyRef.current = effectiveStorageKey;
    try {
      const stored = localStorage.getItem(effectiveStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.order) && parsed.order.length > 0) {
          const validColKeys = new Set(columns.map((c) => c.key));
          const loadedOrder = parsed.order.filter((k: string) => validColKeys.has(k));
          columns.forEach((c) => {
            if (!loadedOrder.includes(c.key)) loadedOrder.push(c.key);
          });
          setColumnOrder(loadedOrder);
        }
        if (Array.isArray(parsed.hidden)) {
          const validColKeys = new Set(columns.map((c) => c.key));
          const validHidden = parsed.hidden.filter((k: string) => {
            const col = columns.find((c) => c.key === k);
            return validColKeys.has(k) && col?.sticky !== "left" && col?.sticky !== "right" && col?.canHide !== false;
          });
          setHiddenColumnKeys(new Set(validHidden));
        }
      }
    } catch (e) {
      console.warn("Failed to load column preferences from localStorage", e);
    }
  }, [enableColumnCustomization, effectiveStorageKey, colKeysSignature]);

  // Close Customise Dropdown on Outside Click or Window Scroll/Resize
  useEffect(() => {
    if (!isCustomiseOpen) return;

    updateCustomiseCoords();

    function handleClickOutside(event: MouseEvent) {
      if (
        customiseDropdownRef.current &&
        !customiseDropdownRef.current.contains(event.target as Node) &&
        customiseButtonRef.current &&
        !customiseButtonRef.current.contains(event.target as Node)
      ) {
        setIsCustomiseOpen(false);
      }
    }

    function handleScrollOrResize() {
      updateCustomiseCoords();
    }

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [isCustomiseOpen, updateCustomiseCoords]);

  // Save Column Preferences Helper
  const saveColumnPrefs = (newOrder: string[], newHidden: string[]) => {
    if (!enableColumnCustomization || !effectiveStorageKey || typeof window === "undefined") return;
    try {
      localStorage.setItem(
        effectiveStorageKey,
        JSON.stringify({ order: newOrder, hidden: newHidden })
      );
    } catch (e) {
      console.warn("Failed to save column preferences", e);
    }
  };

  // Reset Columns to Default Order & Visibility
  const handleResetColumns = () => {
    if (effectiveStorageKey && typeof window !== "undefined") {
      try {
        localStorage.removeItem(effectiveStorageKey);
      } catch {}
    }
    const defaultOrder = columns.map((c) => c.key);
    const defaultHidden = new Set(columns.filter((c) => c.defaultHidden).map((c) => c.key));
    setColumnOrder(defaultOrder);
    setHiddenColumnKeys(defaultHidden);
  };

  // Toggle Visibility of a Column
  const toggleColumnVisibility = (key: string) => {
    setHiddenColumnKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        // Prevent hiding every customizable column
        const currentVisibleNonPinned = columns.filter(
          (c) => !c.sticky && c.canHide !== false && !next.has(c.key)
        );
        if (currentVisibleNonPinned.length <= 1 && currentVisibleNonPinned.some((c) => c.key === key)) {
          return prev;
        }
        next.add(key);
      }
      saveColumnPrefs(columnOrder, Array.from(next));
      return next;
    });
  };

  // Reorder Columns in Column Order Array
  const handleReorderColumns = (sourceKey: string, targetKey: string) => {
    if (sourceKey === targetKey) return;
    setColumnOrder((prevOrder) => {
      const fullOrder = [...prevOrder];
      columns.forEach((c) => {
        if (!fullOrder.includes(c.key)) fullOrder.push(c.key);
      });

      const sourceIdx = fullOrder.indexOf(sourceKey);
      const targetIdx = fullOrder.indexOf(targetKey);
      if (sourceIdx === -1 || targetIdx === -1) return prevOrder;

      const newOrder = [...fullOrder];
      const [moved] = newOrder.splice(sourceIdx, 1);
      newOrder.splice(targetIdx, 0, moved);

      saveColumnPrefs(newOrder, Array.from(hiddenColumnKeys));
      return newOrder;
    });
  };

  // Move Column Up or Down by One Position
  const handleMoveColumn = (colKey: string, direction: "up" | "down") => {
    setColumnOrder((prevOrder) => {
      const fullOrder = [...prevOrder];
      columns.forEach((c) => {
        if (!fullOrder.includes(c.key)) fullOrder.push(c.key);
      });

      const currentIdx = fullOrder.indexOf(colKey);
      if (currentIdx === -1) return prevOrder;

      if (direction === "up") {
        let targetIdx = -1;
        for (let i = currentIdx - 1; i >= 0; i--) {
          const c = columns.find((col) => col.key === fullOrder[i]);
          if (!c?.sticky && c?.canReorder !== false) {
            targetIdx = i;
            break;
          }
        }
        if (targetIdx === -1) return prevOrder;

        const newOrder = [...fullOrder];
        const [moved] = newOrder.splice(currentIdx, 1);
        newOrder.splice(targetIdx, 0, moved);
        saveColumnPrefs(newOrder, Array.from(hiddenColumnKeys));
        return newOrder;
      } else {
        let targetIdx = -1;
        for (let i = currentIdx + 1; i < fullOrder.length; i++) {
          const c = columns.find((col) => col.key === fullOrder[i]);
          if (!c?.sticky && c?.canReorder !== false) {
            targetIdx = i;
            break;
          }
        }
        if (targetIdx === -1) return prevOrder;

        const newOrder = [...fullOrder];
        const [moved] = newOrder.splice(currentIdx, 1);
        newOrder.splice(targetIdx, 0, moved);
        saveColumnPrefs(newOrder, Array.from(hiddenColumnKeys));
        return newOrder;
      }
    });
  };

  // Construct Effective Columns (all ordered & visible)
  const { visibleColumns, allOrderedColumns } = useMemo(() => {
    const colMap = new Map<string, Column<T>>();
    columns.forEach((c) => colMap.set(c.key, c));

    const ordered: Column<T>[] = [];
    columnOrder.forEach((k) => {
      const col = colMap.get(k);
      if (col) {
        ordered.push(col);
        colMap.delete(k);
      }
    });
    // Append any columns not in saved order
    colMap.forEach((col) => {
      ordered.push(col);
    });

    if (!enableColumnCustomization) {
      return { visibleColumns: columns, allOrderedColumns: columns };
    }

    const visible = ordered.filter((c) => {
      if (c.sticky || c.canHide === false) return true;
      return !hiddenColumnKeys.has(c.key);
    });

    return { visibleColumns: visible, allOrderedColumns: ordered };
  }, [columns, columnOrder, hiddenColumnKeys, enableColumnCustomization]);

  // Movable column keys (excluding left and right pinned columns)
  const movableColKeys = useMemo(() => {
    return allOrderedColumns
      .filter((c) => !c.sticky && c.canReorder !== false)
      .map((c) => c.key);
  }, [allOrderedColumns]);

  // Counts for the "Customise view" pill
  const customizableCols = useMemo(() => {
    return allOrderedColumns.filter((c) => !c.sticky && c.canHide !== false);
  }, [allOrderedColumns]);

  const visibleCustomCount = useMemo(() => {
    return customizableCols.filter((c) => !hiddenColumnKeys.has(c.key)).length;
  }, [customizableCols, hiddenColumnKeys]);

  const totalCustomCount = customizableCols.length;

  const canCustomizeColumns =
    enableColumnCustomization &&
    columns.length > 1 &&
    (customizableCols.length > 0 || movableColKeys.length > 0);

  const defaultPinnedNotice = useMemo(() => {
    const pinned = columns.filter(
      (c) => c.sticky === "left" || c.sticky === "right" || c.canHide === false || c.canReorder === false
    );
    if (pinned.length > 0) {
      const names = pinned.map((c) => c.header).filter(Boolean);
      return `${names.slice(0, 2).join(" & ")}${names.length > 2 ? ` (+${names.length - 2})` : ""} are pinned`;
    }
    if (hasDefaultActionsColumn) {
      return "Actions are pinned";
    }
    return "Drag or use arrows to reorder";
  }, [columns, hasDefaultActionsColumn]);

  // Filtered customizable columns for search in the popup dropdown
  const filteredCustomiseCols = useMemo(() => {
    if (!customiseSearch.trim()) return allOrderedColumns;
    const query = customiseSearch.toLowerCase().trim();
    return allOrderedColumns.filter(
      (c) => c.header.toLowerCase().includes(query) || c.key.toLowerCase().includes(query)
    );
  }, [allOrderedColumns, customiseSearch]);

  // Hold click & drag to scroll table state
  const tableContainerRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragScrollLeft, setDragScrollLeft] = useState(0);

  const handleTableMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    // Do not initiate drag if user clicked an interactive input, button, link, select, menu, or table header
    if (
      target.closest("button") ||
      target.closest("a") ||
      target.closest("input") ||
      target.closest("select") ||
      target.closest("textarea") ||
      target.closest("[role='button']") ||
      target.closest("th") ||
      target.closest("thead")
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

  // Compute sticky offsets for left columns based on visibleColumns
  const calculatedLeftOffsets = useMemo(() => {
    let accumulator = 44; // starting after checkbox (44px)
    const offsets: Record<string, number> = {};
    visibleColumns.forEach((col) => {
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
  }, [visibleColumns]);

  const leftStickyCols = useMemo(() => visibleColumns.filter((c) => c.sticky === "left"), [visibleColumns]);
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
      let valA = a[sortKey];
      let valB = b[sortKey];
      if (sortKey === "id") {
        valA = a.bookingNumber || a.jobId || a.id;
        valB = b.bookingNumber || b.jobId || b.id;
      }
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
    const exportableCols = visibleColumns.filter(
      (c) =>
        !c.key.toLowerCase().includes("action") &&
        !c.header.toLowerCase().includes("action")
    );
    const headers = exportableCols.map((c) => c.header).join(",");
    const rows = sortedData.map((row) =>
      exportableCols.map((c) => `"${String(row[c.key] ?? "").replace(/"/g, '""')}"`).join(",")
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

            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="h-9 px-3.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors disabled:opacity-60"
                title="Refresh table data"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
            )}

            {canCustomizeColumns && (
              <div className="relative inline-block">
                <button
                  ref={customiseButtonRef}
                  type="button"
                  onClick={toggleCustomise}
                  className={`h-9 px-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xs transition-all ${
                    isCustomiseOpen
                      ? "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"
                      : "bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                  title="Customize visible table columns and arrangement"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                  <span>Customise view</span>
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    {visibleCustomCount}/{totalCustomCount}
                  </span>
                </button>

                {isCustomiseOpen && (
                  <Portal>
                    <div
                      ref={customiseDropdownRef}
                      style={{
                        position: "fixed",
                        right: `${customiseDropdownCoords.right}px`,
                        ...(customiseDropdownCoords.top !== undefined
                          ? { top: `${customiseDropdownCoords.top}px` }
                          : {}),
                        ...(customiseDropdownCoords.bottom !== undefined
                          ? { bottom: `${customiseDropdownCoords.bottom}px` }
                          : {}),
                        zIndex: 9999,
                        maxHeight: customiseDropdownCoords.maxHeight
                          ? `${customiseDropdownCoords.maxHeight}px`
                          : "480px",
                      }}
                      className="w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[9999] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                    >
                      {/* Dropdown Header */}
                      <div className="p-3.5 pb-2.5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-2 shrink-0 bg-white dark:bg-slate-900">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                              Customise view
                            </h4>
                            <span className="text-xs font-semibold text-slate-400">
                              ({visibleCustomCount}/{totalCustomCount})
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                            Select at max {totalCustomCount} fields
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handleResetColumns}
                          className="text-xs text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 flex items-center gap-1 cursor-pointer font-medium transition-colors"
                          title="Reset columns order and visibility to default"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset</span>
                        </button>
                      </div>

                      {/* Search Field */}
                      <div className="p-2.5 pb-1 shrink-0 bg-white dark:bg-slate-900">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Search"
                            value={customiseSearch}
                            onChange={(e) => setCustomiseSearch(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-7 h-8 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 font-normal transition-colors"
                          />
                          {customiseSearch && (
                            <button
                              type="button"
                              onClick={() => setCustomiseSearch("")}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Draggable List */}
                      <div className="flex-1 overflow-y-auto px-2 py-1.5 space-y-0.5 custom-scrollbar min-h-0">
                        {filteredCustomiseCols.map((col) => {
                          const isPinned = col.sticky === "left" || col.sticky === "right" || col.canHide === false;
                          const isVisible = isPinned || !hiddenColumnKeys.has(col.key);
                          const ColIcon = getColumnIcon(col);
                          const isDragging = dropdownDragKey === col.key;
                          const isDragOver = dropdownDragOverKey === col.key && !isDragging;
                          const movableIdx = movableColKeys.indexOf(col.key);
                          const canMoveUp = movableIdx > 0;
                          const canMoveDown = movableIdx >= 0 && movableIdx < movableColKeys.length - 1;

                          return (
                            <div
                              key={col.key}
                              draggable={!isPinned}
                              onDragStart={(e) => {
                                if (isPinned) return;
                                e.dataTransfer.setData("text/plain", col.key);
                                e.dataTransfer.effectAllowed = "move";
                                setDropdownDragKey(col.key);
                              }}
                              onDragOver={(e) => {
                                if (isPinned || !dropdownDragKey || dropdownDragKey === col.key) return;
                                e.preventDefault();
                                e.dataTransfer.dropEffect = "move";
                                if (dropdownDragOverKey !== col.key) {
                                  setDropdownDragOverKey(col.key);
                                }
                              }}
                              onDragLeave={() => {
                                if (dropdownDragOverKey === col.key) setDropdownDragOverKey(null);
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                if (isPinned || !dropdownDragKey || dropdownDragKey === col.key) return;
                                handleReorderColumns(dropdownDragKey, col.key);
                                setDropdownDragKey(null);
                                setDropdownDragOverKey(null);
                              }}
                              onDragEnd={() => {
                                setDropdownDragKey(null);
                                setDropdownDragOverKey(null);
                              }}
                              className={`group/col flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl text-xs transition-all select-none ${
                                isDragging
                                  ? "opacity-40 bg-slate-100 dark:bg-slate-800 border border-dashed border-brand-400"
                                  : isDragOver
                                  ? "border-t-2 border-brand-500 bg-brand-50/50 dark:bg-brand-950/40"
                                  : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                              }`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                {/* Drag Handle */}
                                <div
                                  className={`p-0.5 shrink-0 ${
                                    isPinned
                                      ? "text-slate-300 dark:text-slate-700 cursor-not-allowed"
                                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-grab active:cursor-grabbing"
                                  }`}
                                  title={isPinned ? "Pinned column cannot be moved" : "Drag to reorder"}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <GripVertical className="w-3.5 h-3.5" />
                                </div>

                                {/* Whole Data Area: Checkbox, Icon & Title wrapped in full-width clickable label */}
                                <label
                                  className={`flex items-center gap-2 min-w-0 flex-1 py-1 px-1 rounded-lg select-none ${
                                    isPinned
                                      ? "cursor-default opacity-85"
                                      : "cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/80 active:bg-slate-200/50"
                                  }`}
                                  onClick={(e) => {
                                    if (isPinned) {
                                      e.preventDefault();
                                    }
                                  }}
                                >
                                  {/* Checkbox */}
                                  <input
                                    type="checkbox"
                                    checked={isVisible}
                                    disabled={isPinned}
                                    onChange={() => toggleColumnVisibility(col.key)}
                                    className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer disabled:cursor-not-allowed accent-brand-600 shrink-0"
                                  />

                                  {/* Icon */}
                                  <div className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0 flex items-center justify-center">
                                    <ColIcon className="w-3.5 h-3.5" />
                                  </div>

                                  {/* Header Name */}
                                  <span className="font-medium text-slate-800 dark:text-slate-200 truncate flex-1" title={col.header}>
                                    {col.header}
                                  </span>
                                </label>
                              </div>

                              {/* Actions on the right: Pinned badge OR Up & Down arrows */}
                              {isPinned ? (
                                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 shrink-0">
                                  Pinned
                                </span>
                              ) : (
                                <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover/col:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
                                  <button
                                    type="button"
                                    disabled={!canMoveUp}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMoveColumn(col.key, "up");
                                    }}
                                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-700/60 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer transition-colors"
                                    title="Move column up"
                                    aria-label={`Move ${col.header} up`}
                                  >
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={!canMoveDown}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleMoveColumn(col.key, "down");
                                    }}
                                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-700/60 disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer transition-colors"
                                    title="Move column down"
                                    aria-label={`Move ${col.header} down`}
                                  >
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Dropdown Footer */}
                      <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                        <span className="text-[11px] text-slate-400 font-normal">
                          {pinnedColumnsNotice || defaultPinnedNotice}
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsCustomiseOpen(false)}
                          className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 cursor-pointer transition-colors"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  </Portal>
                )}
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
                    {visibleColumns.map((col) => {
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
                {visibleColumns.map((col) => {
                  const isActionsCol =
                    col.header.toLowerCase().includes("action") ||
                    col.key.toLowerCase().includes("action") ||
                    col.sticky === "right";

                  const isLeftSticky = col.sticky === "left";
                  const isRightSticky = col.sticky === "right" || isActionsCol;
                  const isLastLeft = col.key === lastLeftStickyKey;
                  const isPinned = isLeftSticky || isRightSticky || col.canReorder === false;

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

                  const isTableDragging = tableDragColKey === col.key;
                  const isTableDropTarget = tableDropTargetKey === col.key && !isTableDragging;

                  return (
                    <th
                      key={col.key}
                      style={stickyStyle}
                      draggable={canCustomizeColumns && !isPinned}
                      onDragStart={(e) => {
                        if (isPinned) return;
                        isDraggingColRef.current = true;
                        e.dataTransfer.setData("text/plain", col.key);
                        e.dataTransfer.effectAllowed = "move";
                        setTableDragColKey(col.key);
                      }}
                      onDragOver={(e) => {
                        if (isPinned || !tableDragColKey || tableDragColKey === col.key) return;
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "move";
                        if (tableDropTargetKey !== col.key) {
                          setTableDropTargetKey(col.key);
                        }
                      }}
                      onDragLeave={() => {
                        if (tableDropTargetKey === col.key) {
                          setTableDropTargetKey(null);
                        }
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (isPinned || !tableDragColKey || tableDragColKey === col.key) {
                          setTableDragColKey(null);
                          setTableDropTargetKey(null);
                          return;
                        }
                        handleReorderColumns(tableDragColKey, col.key);
                        setTableDragColKey(null);
                        setTableDropTargetKey(null);
                        setTimeout(() => {
                          isDraggingColRef.current = false;
                        }, 150);
                      }}
                      onDragEnd={() => {
                        setTableDragColKey(null);
                        setTableDropTargetKey(null);
                        setTimeout(() => {
                          isDraggingColRef.current = false;
                        }, 150);
                      }}
                      onClick={() => {
                        if (isDraggingColRef.current) return;
                        if (col.sortable !== false) handleSort(col.key);
                      }}
                      className={`py-3.5 px-4 align-middle select-none whitespace-nowrap transition-all group/th ${
                        isActionsCol ? "text-right" : ""
                      } ${stickyClass} ${col.className || ""} ${
                        isPinned ? "cursor-pointer" : "cursor-grab active:cursor-grabbing hover:bg-slate-200/70 dark:hover:bg-slate-700/70"
                      } ${
                        isTableDragging ? "opacity-30 bg-slate-200/80 dark:bg-slate-700/80 scale-[0.98]" : ""
                      } ${
                        isTableDropTarget ? "border-l-4 border-brand-500 bg-brand-50/80 dark:bg-brand-950/60" : ""
                      }`}
                      title={isPinned ? undefined : "Click to sort • Drag to rearrange column"}
                    >
                      <div className={`flex items-center gap-1.5 ${isActionsCol ? "justify-end" : ""}`}>
                        {!isPinned && canCustomizeColumns && (
                          <GripVertical className="w-3 h-3 text-slate-400 dark:text-slate-500 opacity-0 group-hover/th:opacity-100 transition-opacity shrink-0" />
                        )}
                        <span>{col.header}</span>
                        {col.sortable !== false && <ArrowUpDown className="w-3 h-3 text-slate-400 shrink-0" />}
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
                    {visibleColumns.map((col, cIdx) => {
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
                    colSpan={visibleColumns.length + 1 + (showMetadata ? 2 : 0) + (hasDefaultActionsColumn ? 1 : 0)}
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

                      {visibleColumns.map((col) => {
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
