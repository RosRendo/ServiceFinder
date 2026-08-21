import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import AdminSidebar from '@/components/AdminSidebar';
import { useSidebarStore } from '@/store/sidebarStore';
import { useAuthStore } from '@/store/authStore';

export default function AdminLayout() {
  const { isAdminOpen, setAdminOpen } = useSidebarStore();
  const { user, isGuest } = useAuthStore();
  const router = useRouter();

  // Defense-in-depth: the root layout only mounts this group for admins, but a
  // deep link could still land here — bounce non-admins out.
  const isAdmin = user?.role?.toLowerCase() === 'admin';

  useEffect(() => {
    if (!isAdmin && !isGuest) {
      router.replace('/');
    }
  }, [isAdmin, isGuest, router]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <AdminSidebar isOpen={isAdminOpen} onClose={() => setAdminOpen(false)} />
    </>
  );
}
