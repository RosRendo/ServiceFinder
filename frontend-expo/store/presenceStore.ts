import { create } from 'zustand';

interface PresenceState {
  userStatuses: Record<string, { status: string; lastSeen: string | null }>;
  updateStatus: (userId: string, status: string, lastSeen: string | null) => void;
  initializeStatuses: (statuses: Record<string, { status: string; lastSeen: string | null }>) => void;
}

export const usePresenceStore = create<PresenceState>((set) => ({
  userStatuses: {},
  updateStatus: (userId, status, lastSeen) =>
    set((state) => ({
      userStatuses: {
        ...state.userStatuses,
        [userId]: { status, lastSeen },
      },
    })),
  initializeStatuses: (statuses) =>
    set((state) => ({
      userStatuses: { ...state.userStatuses, ...statuses },
    })),
}));
