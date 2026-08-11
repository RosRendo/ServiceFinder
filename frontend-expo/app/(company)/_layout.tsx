import { Stack } from 'expo-router';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import CompanySidebar from '@/components/CompanySidebar';
import { useSidebarStore } from '@/store/sidebarStore';

export default function CompanyLayout() {
  const { isCompanyOpen, setCompanyOpen } = useSidebarStore();
  
  return (
    <SubscriptionGuard>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />

        {/* ── Booking Detail ────────────────────────── */}
        <Stack.Screen name="booking/[id]" />

        {/* ── Staff Management ──────────────────────── */}
        <Stack.Screen name="staff/[id]" />
        <Stack.Screen name="staff/new" />

        {/* ── Services ──────────────────────────────── */}
        <Stack.Screen name="services" />
        <Stack.Screen name="services/new" />

        {/* ── Messaging ─────────────────────────────── */}
        <Stack.Screen name="messages/[id]" />

        {/* ── Payouts & Payments ────────────────────── */}
        <Stack.Screen name="payments" />
        <Stack.Screen name="payouts/request" />
        <Stack.Screen name="payouts/history" />
        <Stack.Screen name="payouts/bank-account" />

        {/* ── Profile & Settings ────────────────────── */}
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="change-password" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="coverage" />
        <Stack.Screen name="analytics" />
        <Stack.Screen name="reviews" />
        <Stack.Screen name="subscription" />
        <Stack.Screen name="support" />
        <Stack.Screen name="marketing" />
        <Stack.Screen name="available-jobs" />
        <Stack.Screen name="customers/index" />
      </Stack>
      <CompanySidebar isOpen={isCompanyOpen} onClose={() => setCompanyOpen(false)} />
    </SubscriptionGuard>
  );
}