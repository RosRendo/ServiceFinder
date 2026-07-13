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

      {/* ── Category ─────────────────────────────── */}
      <Stack.Screen name="category/[id]" />

      {/* ── Map View ─────────────────────────────── */}
      <Stack.Screen name="map-view" />

      {/* ── Search ───────────────────────────────── */}
      <Stack.Screen name="search/index" />

      {/* ── Saved ────────────────────────────────── */}
      <Stack.Screen name="saved/index" />

      {/* ── Company + Service Modal ───────────────── */}
      <Stack.Screen name="company/[id]" />
      <Stack.Screen name="company/service-modal/[id]" />

      {/* ── Booking Flow ─────────────────────────── */}
      <Stack.Screen name="booking/create" />
      <Stack.Screen name="booking/[id]" />
      <Stack.Screen name="checkout" />

      {/* ── Reviews ──────────────────────────────── */}
      <Stack.Screen name="reviews/new" />

      {/* ── Messaging ────────────────────────────── */}
      <Stack.Screen name="messages/new" />
      <Stack.Screen name="messages/[id]" />

      {/* ── Complete Profile ─────────────────────── */}
      <Stack.Screen name="complete-profile" />
    </Stack>
  );
}