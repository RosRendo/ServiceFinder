# Contract: Standard Management DataGrid Component

**Type**: UI Component Interface Contract  
**Target Environments**: Next.js Web (`frontend`) & Expo Mobile (`frontend-expo`)  
**Status**: Stable  

---

## 1. Component Specification

The `ManagementDataGrid` component is the foundational display table for all list-oriented entities in the Company and Admin portals (Bookings, Companies, Staff, Transactions, Disputes, etc.).

It guarantees:
- High-density data representation with fixed header rows.
- Instant search bar with clear button and 300ms debouncing.
- Standard column sorting toggles (`none` -> `asc` -> `desc`).
- Checkbox multi-select with persistent row selection state across pages.
- Built-in pagination controls with item count indicators.
- Seamless connection to the slide-over drawer when a row is clicked.

---

## 2. Web TypeScript Interface (`frontend`)

```typescript
export interface ColumnDef<T> {
  id: string;
  header: string;
  accessorKey?: keyof T;
  cell?: (props: { row: T; index: number }) => React.ReactNode;
  width?: string | number; // e.g. '120px', '25%'
  isSortable?: boolean;
  align?: 'left' | 'center' | 'right';
  priority?: 'critical' | 'secondary' | 'optional'; // used for responsive collapse
}

export interface ManagementDataGridProps<T> {
  // Title & Header Actions
  title: string;
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

  // Data & Columns
  data: T[];
  columns: ColumnDef<T>[];
  getRowId: (row: T) => string;

  // State flags
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;

  // Row Interactions
  onRowClick?: (row: T) => void;
  selectedRowIds?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;

  // Search & Filtering
  searchPlaceholder?: string;
  onSearchChange?: (query: string) => void;
  filterSlots?: React.ReactNode;

  // Pagination
  totalCount: number;
  pageSize: number;
  currentPage: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange?: (newPageSize: number) => void;

  // Empty state
  emptyState?: {
    title: string;
    description: string;
    actionLabel?: string;
    onActionClick?: () => void;
  };
}
```

---

## 3. Mobile Adaptation (`frontend-expo`)

On mobile, `ManagementDataGrid` renders as a virtualized FlashList of `ManagementListItemCard`:

```typescript
export interface MobileManagementListProps<T> {
  data: T[];
  renderCard: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onEndReached?: () => void;
  searchQuery: string;
  onSearchChange: (text: string) => void;
  filterPills?: Array<{
    id: string;
    label: string;
    isActive: boolean;
    onPress: () => void;
  }>;
  emptyStateTitle: string;
  emptyStateMessage: string;
}
```

---

## 4. Visual Compliance Checklist

- [ ] Table borders use `#E2E8F0` (1px solid). No heavy double outlines.
- [ ] Table headers have uppercase micro-typography (`text-xs font-semibold text-slate-500 uppercase tracking-wider`).
- [ ] Zebra striping is avoided; subtle background shift `#F8FAFC` on hover only.
- [ ] Number and monetary columns align right; status pills align center; titles/names align left.
- [ ] Zero decorative glowing effects or saturated gradients.
