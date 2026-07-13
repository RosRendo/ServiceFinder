import { create } from 'zustand';

interface SidebarState {
  isAdminOpen: boolean;
  isCompanyOpen: boolean;
  isStaffOpen: boolean;
  setAdminOpen: (open: boolean) => void;
  setCompanyOpen: (open: boolean) => void;
  setStaffOpen: (open: boolean) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isAdminOpen: false,
  isCompanyOpen: false,
  isStaffOpen: false,
  setAdminOpen: (open) => set({ isAdminOpen: open }),
  setCompanyOpen: (open) => set({ isCompanyOpen: open }),
  setStaffOpen: (open) => set({ isStaffOpen: open }),
}));
