import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import StaffSidebar from '@/components/StaffSidebar';
import { useSidebarStore } from '@/store/sidebarStore';
import { useAuthStore } from '@/store/authStore';

export default function StaffLayout() {
  const { isStaffOpen, setStaffOpen } = useSidebarStore();
  const { user, isGuest } = useAuthStore();
  const router = useRouter();

  const isStaff = user?.role?.toLowerCase() === 'staff';

  useEffect(() => {
    if (!isStaff && !isGuest) {
      router.replace('/');
    }
  }, [isStaff, isGuest, router]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />

        {/* ── Job Execution Flow ────────────────────── */}
        <Stack.Screen name="job/[id]/index" />
        <Stack.Screen name="job/[id]/execution" />
        <Stack.Screen name="job/[id]/complete" />
        <Stack.Screen name="job/[id]/update-status" />
        <Stack.Screen name="job/[id]/track-map" />

        {/* ── Messaging ─────────────────────────────── */}
        <Stack.Screen name="messages/[id]" />
        <Stack.Screen name="messages/new" />
        <Stack.Screen name="chat/[userId]" />

        {/* ── Profile & Settings ────────────────────── */}
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="change-password" />
        <Stack.Screen name="settings" />

        {/* ── Work Tools ────────────────────────────── */}
        <Stack.Screen name="availability/index" />
        <Stack.Screen name="timeoff/index" />
        <Stack.Screen name="performance/index" />

        {/* ── Financials ────────────────────────────── */}
        <Stack.Screen name="history" />
        <Stack.Screen name="payout" />

        {/* ── AI ────────────────────────────────────── */}
        <Stack.Screen name="ai/ai" />
      </Stack>
      <StaffSidebar isOpen={isStaffOpen} onClose={() => setStaffOpen(false)} />
    </>
  );
}
