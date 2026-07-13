import { Stack } from 'expo-router';
import StaffSidebar from '@/components/StaffSidebar';
import { useSidebarStore } from '@/store/sidebarStore';

export default function StaffLayout() {
  const { isStaffOpen, setStaffOpen } = useSidebarStore();
  
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StaffSidebar isOpen={isStaffOpen} onClose={() => setStaffOpen(false)} />
    </>
  );
}