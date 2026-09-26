# Contract: Slide-over Inspection Drawer Component

**Type**: UI Component Interface Contract  
**Target Environments**: Next.js Web (`frontend`)  
**Status**: Stable  

---

## 1. Purpose

The `SlideoverDrawer` component provides a focused side-panel for reviewing entity details, approving/rejecting compliance documents, and modifying records without navigating away from the parent DataGrid list.

---

## 2. Web TypeScript Interface (`frontend`)

```typescript
export interface SlideoverDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  width?: 'md' | 'lg' | 'xl' | '2xl'; // default: 'lg' (640px)
  
  // Header Actions
  headerActions?: React.ReactNode;
  
  // Body Content
  children: React.ReactNode;
  
  // Sticky Footer Controls
  footer?: {
    primaryAction?: {
      label: string;
      onClick: () => Promise<void> | void;
      isLoading?: boolean;
      variant?: 'default' | 'danger' | 'success';
      disabled?: boolean;
    };
    secondaryAction?: {
      label: string;
      onClick: () => void;
      disabled?: boolean;
    };
    additionalControls?: React.ReactNode;
  };
}
```

---

## 3. Keyboard & Accessibility Requirements

- **Esc Key**: Pressing `Escape` must close the drawer unless a confirmation modal is open.
- **Focus Trap**: Focus must be trapped inside the drawer while open.
- **Background Dimmer**: A subtle dark slate overlay (`bg-slate-900/40 backdrop-blur-[2px]`) dims the parent list.
- **Scroll Isolation**: Body scroll on the background page is locked while the drawer is open.
