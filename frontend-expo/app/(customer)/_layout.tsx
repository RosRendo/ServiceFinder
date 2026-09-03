import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';

export default function CustomerLayout() {
  const { user } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // If the user's name is the default generated one, force them to complete profile.
    if (user?.fullName === "New User" && segments[1] !== 'complete-profile') {
      router.replace('/(customer)/complete-profile');
    }
  }, [user, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* ── Bottom Tab Navigator ─────────────────── */}
      <Stack.Screen name="(tabs)" />

      {/* ── Category & Service ──────────────────────── */}
      <Stack.Screen name="category/[id]" />
      <Stack.Screen name="service/[id]" />

      {/* ── Map View ─────────────────────────────── */}
      <Stack.Screen name="map-view" />

      {/* ── Search ───────────────────────────────── */}
      <Stack.Screen name="search/index" />

      {/* ── Saved ────────────────────────────────── */}
      <Stack.Screen name="saved/index" />

      {/* ── Company ───────────────── */}
      <Stack.Screen name="company/[id]" />

      {/* ── Booking Flow ─────────────────────────── */}
      <Stack.Screen name="booking/cancel" />
      <Stack.Screen name="booking/failed" />
      <Stack.Screen name="booking/reschedule" />
      <Stack.Screen name="booking/messages" />
      <Stack.Screen name="booking/[id]" />
      <Stack.Screen name="checkout" />

      {/* ── Reviews ──────────────────────────────── */}
      <Stack.Screen name="reviews/index" />
      <Stack.Screen name="reviews/new" />

      {/* ── Addresses ────────────────────────────── */}
      <Stack.Screen name="address/index" />
      <Stack.Screen name="address/[id]" />

      {/* ── Messaging ────────────────────────────── */}
      <Stack.Screen name="messages/index" />
      <Stack.Screen name="messages/new" />
      <Stack.Screen name="messages/[id]" />

      {/* ── Profile & Settings ───────────────────── */}
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="change-password" />
      <Stack.Screen name="settings" />

      {/* ── Complete Profile ─────────────────────── */}
      <Stack.Screen name="complete-profile" />
    </Stack>
  );
}