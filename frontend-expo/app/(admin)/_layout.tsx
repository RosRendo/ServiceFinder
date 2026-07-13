import { Stack } from 'expo-router';
import AdminSidebar from '@/components/AdminSidebar';
import { useSidebarStore } from '@/store/sidebarStore';

export default function AdminLayout() {
  const { isAdminOpen, setAdminOpen } = useSidebarStore();
  
  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <AdminSidebar isOpen={isAdminOpen} onClose={() => setAdminOpen(false)} />
    </>
  );
}